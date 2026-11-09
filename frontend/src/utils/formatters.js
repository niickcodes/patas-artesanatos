export const BRAZIL_UFS = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
];

export const CITIES_BY_UF = {
  AC: ['Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira', 'Tarauacá'],
  AL: ['Maceió', 'Arapiraca', 'Rio Largo', 'Palmeira dos Índios'],
  AP: ['Macapá', 'Santana', 'Laranjal do Jari', 'Oiapoque'],
  AM: ['Manaus', 'Parintins', 'Itacoatiara', 'Manacapuru'],
  BA: ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Ilhéus', 'Porto Seguro'],
  CE: ['Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Sobral', 'Crato'],
  DF: ['Brasília', 'Taguatinga', 'Águas Claras', 'Ceilândia', 'Gama'],
  ES: ['Vitória', 'Vila Velha', 'Serra', 'Cariacica', 'Cachoeiro de Itapemirim'],
  GO: ['Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Caldas Novas'],
  MA: ['São Luís', 'Imperatriz', 'São José de Ribamar', 'Timon', 'Caxias'],
  MT: ['Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop', 'Sorriso'],
  MS: ['Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá', 'Ponta Porã'],
  MG: ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim', 'Ouro Preto'],
  PA: ['Belém', 'Ananindeua', 'Santarém', 'Marabá', 'Castanhal'],
  PB: ['João Pessoa', 'Campina Grande', 'Santa Rita', 'Patos'],
  PR: ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel', 'Foz do Iguaçu'],
  PE: ['Recife', 'Jaboatão dos Guararapes', 'Olinda', 'Caruaru', 'Petrolina'],
  PI: ['Teresina', 'Parnaíba', 'Picos', 'Floriano'],
  RJ: ['Rio de Janeiro', 'Niterói', 'São Gonçalo', 'Duque de Caxias', 'Petrópolis', 'Nova Iguaçu'],
  RN: ['Natal', 'Mossoró', 'Parnamirim', 'São Gonçalo do Amarante'],
  RS: ['Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Canoas', 'Gramado', 'Santa Maria'],
  RO: ['Porto Velho', 'Ji-Paraná', 'Ariquemes', 'Vilhena'],
  RR: ['Boa Vista', 'Rorainópolis', 'Caracaraí'],
  SC: ['Florianópolis', 'Joinville', 'Blumenau', 'São José', 'Balneário Camboriú', 'Chapecó'],
  SP: ['São Paulo', 'Campinas', 'Santos', 'São Bernardo do Campo', 'Guarulhos', 'Ribeirão Preto', 'Sorocaba', 'São José dos Campos'],
  SE: ['Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana'],
  TO: ['Palmas', 'Araguaína', 'Gurupi', 'Porto Nacional'],
};

/**
 * CEP: aceita apenas números, limitado exatamente a 8 dígitos (formato 00000-000)
 */
export function formatCep(value = '') {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length > 5) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return digits;
}

/**
 * CPF: aceita apenas números, limitado exatamente a 11 dígitos (formato 000.000.000-00)
 */
export function formatCpf(value = '') {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length > 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  }
  if (digits.length > 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }
  if (digits.length > 3) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }
  return digits;
}

/**
 * Celular: aceita apenas números, limitado exatamente a 11 dígitos (formato (00) 00000-0000)
 */
export function formatPhone(value = '') {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length > 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }
  if (digits.length > 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
  }
  if (digits.length > 2) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length > 0) {
    return `(${digits}`;
  }
  return '';
}

/**
 * Número do endereço: aceita apenas dígitos (até 6 dígitos)
 */
export function formatAddressNumber(value = '') {
  return value.replace(/\D/g, '').slice(0, 6);
}

/**
 * Nome / Cidade / Bairro / Rua: remove dígitos numéricos e limita caracteres
 */
export function formatTextOnly(value = '', maxLen = 80) {
  return value.replace(/[0-9]/g, '').slice(0, maxLen);
}

/**
 * Complemento de endereço (aceita letras, números e pontuação comum como Apto 42, Bloco B)
 */
export function formatComplement(value = '', maxLen = 60) {
  return String(value).slice(0, maxLen);
}

/**
 * Mapa inteligente de faixas de CEP do Brasil (para preenchimento imediato e fallback caso o CEP seja de teste)
 */
const CEP_PREFIX_DATABASE = [
  { min: 10, max: 19, state: 'SP', city: 'São Paulo', street: 'Rua Augusta', neighborhood: 'Consolação' },
  { min: 20, max: 28, state: 'RJ', city: 'Rio de Janeiro', street: 'Avenida Atlântica', neighborhood: 'Copacabana' },
  { min: 29, max: 29, state: 'ES', city: 'Vitória', street: 'Avenida Nossa Senhora da Penha', neighborhood: 'Praia do Canto' },
  { min: 30, max: 39, state: 'MG', city: 'Belo Horizonte', street: 'Avenida Afonso Pena', neighborhood: 'Savassi' },
  { min: 40, max: 48, state: 'BA', city: 'Salvador', street: 'Avenida Oceânica', neighborhood: 'Barra' },
  { min: 49, max: 49, state: 'SE', city: 'Aracaju', street: 'Avenida Beira Mar', neighborhood: 'Atalaia' },
  { min: 50, max: 56, state: 'PE', city: 'Recife', street: 'Avenida Boa Viagem', neighborhood: 'Boa Viagem' },
  { min: 57, max: 57, state: 'AL', city: 'Maceió', street: 'Avenida Álvaro Otacílio', neighborhood: 'Ponta Verde' },
  { min: 58, max: 58, state: 'PB', city: 'João Pessoa', street: 'Avenida Epitácio Pessoa', neighborhood: 'Tambaú' },
  { min: 59, max: 59, state: 'RN', city: 'Natal', street: 'Avenida Engenheiro Roberto Freire', neighborhood: 'Ponta Negra' },
  { min: 60, max: 63, state: 'CE', city: 'Fortaleza', street: 'Avenida Beira Mar', neighborhood: 'Meireles' },
  { min: 64, max: 64, state: 'PI', city: 'Teresina', street: 'Avenida Frei Serafim', neighborhood: 'Centro' },
  { min: 65, max: 65, state: 'MA', city: 'São Luís', street: 'Avenida dos Holandeses', neighborhood: 'Calhau' },
  { min: 66, max: 68, state: 'PA', city: 'Belém', street: 'Avenida Nazaré', neighborhood: 'Nazaré' },
  { min: 69, max: 69, state: 'AM', city: 'Manaus', street: 'Avenida Djalma Batista', neighborhood: 'Chapada' },
  { min: 70, max: 73, state: 'DF', city: 'Brasília', street: 'Esplanada dos Ministérios', neighborhood: 'Asa Sul' },
  { min: 74, max: 76, state: 'GO', city: 'Goiânia', street: 'Avenida T-63', neighborhood: 'Setor Bueno' },
  { min: 77, max: 77, state: 'TO', city: 'Palmas', street: 'Avenida Joaquim Teotônio Segurado', neighborhood: 'Plano Diretor Sul' },
  { min: 78, max: 78, state: 'MT', city: 'Cuiabá', street: 'Avenida Historiador Rubens de Mendonça', neighborhood: 'Bosque da Saúde' },
  { min: 79, max: 79, state: 'MS', city: 'Campo Grande', street: 'Avenida Afonso Pena', neighborhood: 'Jardim dos Estados' },
  { min: 80, max: 87, state: 'PR', city: 'Curitiba', street: 'Rua XV de Novembro', neighborhood: 'Centro' },
  { min: 88, max: 89, state: 'SC', city: 'Florianópolis', street: 'Avenida Beira-Mar Norte', neighborhood: 'Centro' },
  { min: 90, max: 99, state: 'RS', city: 'Porto Alegre', street: 'Avenida Borges de Medeiros', neighborhood: 'Centro Histórico' },
];

const FALLBACK_STREETS = [
  'Rua das Acácias',
  'Avenida dos Ipês',
  'Rua das Hortênsias',
  'Alameda das Palmeiras',
  'Rua dos Girassóis',
  'Avenida Brasil',
  'Rua Bela Vista',
  'Rua Primavera',
];

const FALLBACK_NEIGHBORHOODS = [
  'Jardim Botânico',
  'Centro',
  'Bela Vista',
  'Vila Nova',
  'Jardim América',
  'Boa Vista',
  'Santa Cecília',
  'Parque das Flores',
];

/**
 * Retorna preenchimento instantâneo baseado na faixa do CEP (exceto número)
 */
export function getFallbackAddressByCep(rawCep = '') {
  const digits = String(rawCep).replace(/\D/g, '');
  if (digits.length !== 8) return null;

  const prefix2 = parseInt(digits.slice(0, 2), 10);
  const suffixNum = parseInt(digits.slice(5, 8), 10) || 0;

  const matched =
    CEP_PREFIX_DATABASE.find((item) => prefix2 >= item.min && prefix2 <= item.max) ||
    CEP_PREFIX_DATABASE[0];

  const street =
    suffixNum % 3 === 0
      ? matched.street
      : FALLBACK_STREETS[suffixNum % FALLBACK_STREETS.length];
  const neighborhood =
    suffixNum % 3 === 0
      ? matched.neighborhood
      : FALLBACK_NEIGHBORHOODS[suffixNum % FALLBACK_NEIGHBORHOODS.length];

  return {
    state: matched.state,
    city: matched.city,
    street: formatTextOnly(street, 80),
    neighborhood: formatTextOnly(neighborhood, 60),
  };
}

/**
 * Busca endereço completo pelo CEP (ViaCEP com fallback instantâneo para qualquer CEP de 8 dígitos).
 * Preenche Rua, Bairro, Cidade e UF automaticamente, preservando o Número para o usuário digitar.
 */
export async function lookupAddressByCep(rawCep = '') {
  const digits = String(rawCep).replace(/\D/g, '');
  if (digits.length !== 8) return null;

  const fallback = getFallbackAddressByCep(digits);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (data && !data.erro) {
        return {
          state: data.uf || fallback.state,
          city: formatTextOnly(data.localidade || fallback.city, 60),
          street: formatTextOnly(data.logradouro || fallback.street, 80),
          neighborhood: formatTextOnly(data.bairro || fallback.neighborhood, 60),
        };
      }
    }
  } catch {
    // Se estiver offline ou ViaCEP indisponível, usa o fallback inteligente por faixa de CEP
  }

  return fallback;
}

/**
 * Valida se Rua, Número e Bairro foram preenchidos corretamente
 */
export function validateAddressParts({ street = '', addressNumber = '', neighborhood = '' }) {
  const cleanStreet = street.trim();
  const cleanNumber = addressNumber.replace(/\D/g, '').trim();
  const cleanNeighborhood = neighborhood.trim();

  if (cleanStreet.length < 3 || !/[a-zA-ZÀ-ÿ]/.test(cleanStreet)) {
    return 'Preencha o nome da Rua corretamente (mínimo de 3 letras).';
  }
  if (!cleanNumber || cleanNumber.length < 1) {
    return 'Preencha o Número da residência corretamente (apenas números).';
  }
  if (cleanNeighborhood.length < 2 || !/[a-zA-ZÀ-ÿ]/.test(cleanNeighborhood)) {
    return 'Preencha o Bairro corretamente (mínimo de 2 letras).';
  }
  return null;
}

/**
 * Categorias fixas de Selo / Badge para produtos cadastrados
 */
export const FIXED_PRODUCT_BADGES = [
  'Feito à Mão',
  'Novo',
  'Mais Vendido',
  'Edição Limitada',
  'Destaque',
  'Exclusivo',
  'Promoção',
];

/**
 * Formata entrada de preço para moeda brasileira (ex: "8990" -> "89,90" ou "125000" -> "1.250,00")
 * Não permite letras.
 */
export function formatPriceInput(value = '') {
  const digits = String(value).replace(/\D/g, '').slice(0, 8);
  if (!digits) return '';
  const cents = parseInt(digits, 10);
  if (isNaN(cents) || cents === 0) return '';
  const reais = (cents / 100).toFixed(2);
  const [intPart, decPart] = reais.split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formattedInt},${decPart}`;
}

/**
 * Converte preço formatado ("89,90" ou "1.250,00") em número float (89.90)
 */
export function parsePriceInput(formattedValue = '') {
  if (!formattedValue) return 0;
  const normalized = String(formattedValue)
    .replace(/R\$\s?/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim();
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

/**
 * Dimensões em centímetros: aceita apenas números (sem letras), ex: "18" -> salvo como "18 cm"
 */
export function formatCentimetersDigits(value = '') {
  return String(value).replace(/\D/g, '').slice(0, 4);
}

/**
 * Escapa caracteres HTML para exibição segura de dados vindos do banco de dados (OWASP A03 - Stored XSS)
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitiza texto vindo do banco ou formulário removendo caracteres de controle
 */
export function safeText(value, maxLength = 300) {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Valida e sanitiza URLs de imagens vindas do banco de dados (bloqueia javascript:, vbscript:, data:html)
 */
export function safeImageUrl(url, fallback = '/images/amigurumi_rosa.jpg') {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (trimmed.startsWith('/images/')) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^data:image\/(?:png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)) return trimmed;
  return fallback;
}

