import { query } from '../config/database.js';
import { config } from '../config/env.js';
import { hashPassword, randomUnguessablePassword } from '../utils/password.js';
import { formatCpf } from '../utils/validators.js';

const FIRST_NAMES = [
  'Mariana',
  'Lucas',
  'Camila',
  'Rafael',
  'Juliana',
  'Guilherme',
  'Fernanda',
  'Pedro',
  'Larissa',
  'Matheus',
  'Letícia',
  'Bruno',
  'Amanda',
  'Thiago',
  'Carolina',
  'Felipe',
  'Isabela',
  'Rodrigo',
  'Natália',
  'Gustavo',
  'Aline',
  'Leonardo',
  'Gabriela',
  'Diego',
  'Bianca',
  'Vinícius',
  'Helena',
  'Eduardo',
];

const MIDDLE_NAMES = [
  'Alves',
  'Ribeiro',
  'Martins',
  'Ferreira',
  'Oliveira',
  'Santos',
  'Souza',
  'Rodrigues',
  'Barbosa',
  'Gomes',
  'Monteiro',
  'Cardoso',
  'Teixeira',
  'Mendes',
  'Carvalho',
  'Araújo',
  'Rocha',
  'Moreira',
];

const LAST_NAMES = [
  'Silva',
  'Costa',
  'Pereira',
  'Almeida',
  'Nascimento',
  'Lima',
  'Castro',
  'Duarte',
  'Nogueira',
  'Freitas',
  'Campos',
  'Pinto',
  'Dias',
  'Correia',
  'Cavalcanti',
  'Vieira',
];

const LOCATIONS = [
  {
    state: 'SP',
    city: 'São Paulo',
    ddd: '11',
    zipPrefix: '01310',
    street: 'Avenida Paulista',
    neighborhood: 'Bela Vista',
  },
  {
    state: 'RJ',
    city: 'Rio de Janeiro',
    ddd: '21',
    zipPrefix: '22041',
    street: 'Rua Figueiredo Magalhães',
    neighborhood: 'Copacabana',
  },
  {
    state: 'MG',
    city: 'Belo Horizonte',
    ddd: '31',
    zipPrefix: '30140',
    street: 'Avenida do Contorno',
    neighborhood: 'Savassi',
  },
  {
    state: 'PR',
    city: 'Curitiba',
    ddd: '41',
    zipPrefix: '80420',
    street: 'Alameda Doutor Carlos de Carvalho',
    neighborhood: 'Batel',
  },
  {
    state: 'RS',
    city: 'Porto Alegre',
    ddd: '51',
    zipPrefix: '90570',
    street: 'Rua Padre Chagas',
    neighborhood: 'Moinhos de Vento',
  },
  {
    state: 'SC',
    city: 'Florianópolis',
    ddd: '48',
    zipPrefix: '88015',
    street: 'Avenida Trompowsky',
    neighborhood: 'Centro',
  },
  {
    state: 'BA',
    city: 'Salvador',
    ddd: '71',
    zipPrefix: '40140',
    street: 'Avenida Oceânica',
    neighborhood: 'Barra',
  },
  {
    state: 'PE',
    city: 'Recife',
    ddd: '81',
    zipPrefix: '51020',
    street: 'Avenida Boa Viagem',
    neighborhood: 'Boa Viagem',
  },
  {
    state: 'DF',
    city: 'Brasília',
    ddd: '61',
    zipPrefix: '70297',
    street: 'Quadra SQS Sul',
    neighborhood: 'Asa Sul',
  },
  {
    state: 'CE',
    city: 'Fortaleza',
    ddd: '85',
    zipPrefix: '60165',
    street: 'Avenida Beira Mar',
    neighborhood: 'Meireles',
  },
];

const COMPLEMENTS = [
  'Apto 12',
  'Apto 34 Bloco B',
  'Casa 2',
  'Apto 102',
  'Cobertura 01',
  'Apto 504 Bloco A',
  'Sala 3',
  'Fundos',
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDigits(len) {
  let out = '';
  for (let i = 0; i < len; i++) {
    out += Math.floor(Math.random() * 10).toString();
  }
  return out;
}

function generateValidCpf() {
  const base = randomDigits(9);
  const calc = (digits) => {
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
      sum += Number(digits[i]) * (digits.length + 1 - i);
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  const d1 = calc(base);
  const d2 = calc(`${base}${d1}`);
  return formatCpf(`${base}${d1}${d2}`);
}

function normalizeSlug(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

async function createSingleRandomCustomer() {
  const firstName = pickRandom(FIRST_NAMES);
  const middleName = pickRandom(MIDDLE_NAMES);
  let lastName = pickRandom(LAST_NAMES);
  if (lastName === middleName) {
    lastName = 'Mendonça';
  }

  const fullName = `${firstName} ${middleName} ${lastName}`;
  const uniqueSuffix = `${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 89)}`;
  const email = `${normalizeSlug(firstName)}.${normalizeSlug(lastName)}.${uniqueSuffix}@email.com`;

  const loc = pickRandom(LOCATIONS);
  const phone = `(${loc.ddd}) 9${randomDigits(4)}-${randomDigits(4)}`;
  const cpf = generateValidCpf();
  const zipCode = `${loc.zipPrefix}-${randomDigits(3)}`;
  const addressNumber = String(Math.floor(15 + Math.random() * 1850));
  const complement = pickRandom(COMPLEMENTS);
  const composedAddress = `${loc.street}, Nº ${addressNumber} (${complement}) - Bairro ${loc.neighborhood}`;
  const passwordHash = await hashPassword(randomUnguessablePassword());

  const res = await query(
    `INSERT INTO customers (
      name, email, password, phone, cpf,
      street, address_number, complement, neighborhood, address,
      city, state, zip_code
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    ON CONFLICT (email) DO NOTHING
    RETURNING id, name, email, cpf, city, state`,
    [
      fullName,
      email,
      passwordHash,
      phone,
      cpf,
      loc.street,
      addressNumber,
      complement,
      loc.neighborhood,
      composedAddress,
      loc.city,
      loc.state,
      zipCode,
    ]
  );

  return res.rows[0] || null;
}

let schedulerInterval = null;

/**
 * Cadastra 2 pessoas automaticamente no PostgreSQL com senhas em hash bcrypt
 */
export async function registerTwoCustomersBatch() {
  try {
    const c1 = await createSingleRandomCustomer();
    const c2 = await createSingleRandomCustomer();
    const created = [c1, c2].filter(Boolean);
    if (created.length > 0) {
      console.log(
        `⏱️ [Auto-Cadastro 2min] ${created.length} cliente(s) cadastrado(s) no PostgreSQL:`,
        created.map((c) => `${c.name} <${c.email}>`).join(' | ')
      );
    }
    return created;
  } catch (err) {
    console.error('Erro no auto-cadastro de clientes:', err.message);
    return [];
  }
}

/**
 * Inicia o agendamento automático para cadastrar 2 pessoas a cada 2 minutos (120.000 ms)
 */
export function startAutoCustomerScheduler() {
  if (!config.autoCustomers) return;

  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }

  registerTwoCustomersBatch();

  const TWO_MINUTES_MS = 2 * 60 * 1000;
  schedulerInterval = setInterval(() => {
    registerTwoCustomersBatch();
  }, TWO_MINUTES_MS);

  console.log('⏱️ Automação ativada: Cadastrando 2 pessoas automaticamente a cada 2 minutos no PostgreSQL.');
}
