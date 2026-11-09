import { query } from '../config/database.js';
import {
  hashPassword,
  verifyPassword,
  isLocked,
  registerFailure,
  clearFailures,
} from '../utils/password.js';
import {
  createSession,
  destroySession,
  destroyAllCustomerSessions,
} from '../middleware/session.js';
import {
  sanitizeText,
  onlyDigits,
  normalizeEmail,
  isValidCpf,
  formatCpf,
  BRAZIL_UFS,
  validatePasswordPolicy,
} from '../utils/validators.js';

function formatCustomerResponse(customer) {
  const isDefaultAdmin = customer.email?.toLowerCase() === 'admin@patasartesanatos.com';
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    role: customer.role || (isDefaultAdmin ? 'admin' : 'customer'),
    phone: customer.phone || '',
    cpf: customer.cpf || '',
    street: customer.street || '',
    addressNumber: customer.address_number || '',
    complement: customer.complement || '',
    neighborhood: customer.neighborhood || '',
    address: customer.address || '',
    city: customer.city || '',
    state: customer.state || '',
    zipCode: customer.zip_code || '',
    createdAt: customer.created_at,
  };
}

export async function registerOrUpdateCustomer(req, res) {
  try {
    const {
      name,
      email,
      password,
      phone,
      cpf,
      street,
      addressNumber,
      complement,
      neighborhood,
      address,
      city,
      state,
      zipCode,
      isUpdate,
    } = req.body || {};

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      return res
        .status(400)
        .json({ error: 'Por favor, informe um e-mail válido para o cadastro.' });
    }

    const cleanName = sanitizeText(name, 150);
    if (cleanName.length < 3 || !/[a-zA-ZÀ-ÿ]/.test(cleanName)) {
      return res.status(400).json({ error: 'Por favor, informe seu nome completo (mínimo de 3 letras).' });
    }

    const cleanCpfDigits = onlyDigits(cpf, 11);
    if (!isValidCpf(cleanCpfDigits)) {
      return res.status(400).json({ error: 'Informe um CPF válido com 11 números e dígitos verificadores corretos.' });
    }
    const formattedCpf = formatCpf(cleanCpfDigits);

    const cleanStreet = sanitizeText(street, 120);
    const cleanNumber = sanitizeText(addressNumber, 20);
    const cleanNeighborhood = sanitizeText(neighborhood, 100);
    const cleanCity = sanitizeText(city, 100);
    const cleanState = String(state || '').trim().toUpperCase().slice(0, 2);
    const cleanComplement = sanitizeText(complement, 100);
    const cleanPhone = onlyDigits(phone, 20) || null;
    const cleanZipCode = onlyDigits(zipCode, 8) || null;

    if (cleanStreet.length < 3 || !/[a-zA-ZÀ-ÿ]/.test(cleanStreet)) {
      return res.status(400).json({
        error: 'Preencha o nome da Rua corretamente (mínimo de 3 letras).',
      });
    }
    if (!cleanNumber) {
      return res.status(400).json({
        error: 'Preencha o Número da residência corretamente.',
      });
    }
    if (cleanNeighborhood.length < 2 || !/[a-zA-ZÀ-ÿ]/.test(cleanNeighborhood)) {
      return res.status(400).json({
        error: 'Preencha o Bairro corretamente (mínimo de 2 letras).',
      });
    }
    if (!BRAZIL_UFS.includes(cleanState)) {
      return res.status(400).json({
        error: 'Selecione uma Unidade Federativa (UF) válida do Brasil.',
      });
    }
    if (cleanCity.length < 2 || !/[a-zA-ZÀ-ÿ]/.test(cleanCity)) {
      return res.status(400).json({
        error: 'Informe a sua Cidade após selecionar o UF.',
      });
    }

    // 1. Verifica se o E-mail já existe
    const existingEmailRes = await query(
      'SELECT * FROM customers WHERE LOWER(email) = $1',
      [normalizedEmail]
    );

    if (!isUpdate && existingEmailRes.rowCount > 0) {
      return res.status(409).json({
        error:
          'Este e-mail já está cadastrado em outra conta! Use a aba "Entrar na Conta" com seu e-mail e senha.',
      });
    }

    // Se for atualização de perfil (isUpdate), exige sessão ativa do próprio titular ou admin (OWASP A07 / A01)
    if (isUpdate) {
      if (existingEmailRes.rowCount === 0) {
        return res.status(404).json({ error: 'Conta não encontrada para atualização.' });
      }
      const isOwnerSession =
        req.customer && req.customer.email?.toLowerCase() === normalizedEmail;
      const isAdminSession = Boolean(req.admin);

      if (!isOwnerSession && !isAdminSession) {
        return res.status(401).json({
          error: 'Sua sessão expirou. Faça login novamente antes de alterar os dados da conta.',
        });
      }
    }

    // 2. Verifica se o CPF já existe em outra conta (CPF único)
    const existingCpfRes = await query(
      `SELECT id, email FROM customers
       WHERE REGEXP_REPLACE(COALESCE(cpf, ''), '\\D', '', 'g') = $1`,
      [cleanCpfDigits]
    );

    if (existingCpfRes.rowCount > 0) {
      const ownerEmail = (existingCpfRes.rows[0].email || '').toLowerCase();
      if (!isUpdate || ownerEmail !== normalizedEmail) {
        return res.status(409).json({
          error:
            'Este CPF já está cadastrado em outra conta! E-mail e CPF são únicos e não podem ser repetidos.',
        });
      }
    }

    if (!isUpdate) {
      const passwordErr = validatePasswordPolicy(password);
      if (passwordErr) {
        return res.status(400).json({ error: passwordErr });
      }
    }

    const passwordChanged = Boolean(password && String(password).trim().length > 0);
    if (isUpdate && passwordChanged) {
      const passwordErr = validatePasswordPolicy(password);
      if (passwordErr) {
        return res.status(400).json({ error: passwordErr });
      }
    }

    const finalPasswordHash = passwordChanged
      ? await hashPassword(String(password).trim())
      : existingEmailRes.rows[0]?.password;

    const complementSuffix = cleanComplement ? ` (${cleanComplement})` : '';
    const composedAddress =
      address && String(address).trim()
        ? sanitizeText(address, 250)
        : `${cleanStreet}, Nº ${cleanNumber}${complementSuffix} - Bairro ${cleanNeighborhood}`;

    let result;
    if (!isUpdate) {
      result = await query(
        `INSERT INTO customers (
          name, email, password, phone, cpf,
          street, address_number, complement, neighborhood, address,
          city, state, zip_code
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          cleanName,
          normalizedEmail,
          finalPasswordHash,
          cleanPhone,
          formattedCpf,
          cleanStreet,
          cleanNumber,
          cleanComplement || null,
          cleanNeighborhood,
          composedAddress,
          cleanCity,
          cleanState,
          cleanZipCode,
        ]
      );
    } else {
      result = await query(
        `UPDATE customers SET
          name = $1,
          password = $2,
          phone = $3,
          cpf = $4,
          street = $5,
          address_number = $6,
          complement = $7,
          neighborhood = $8,
          address = $9,
          city = $10,
          state = $11,
          zip_code = $12
        WHERE LOWER(email) = $13
        RETURNING *`,
        [
          cleanName,
          finalPasswordHash,
          cleanPhone,
          formattedCpf,
          cleanStreet,
          cleanNumber,
          cleanComplement || null,
          cleanNeighborhood,
          composedAddress,
          cleanCity,
          cleanState,
          cleanZipCode,
          normalizedEmail,
        ]
      );
    }

    const customer = result.rows[0];

    // Se trocou a senha, invalida sessões anteriores antes de emitir uma nova
    if (isUpdate && passwordChanged) {
      destroyAllCustomerSessions(customer.id);
    }

    // Emite sessão segura HttpOnly + SameSite=Strict (e retorna token)
    const isCustomerAdmin =
      customer.role === 'admin' ||
      customer.email?.toLowerCase() === 'admin@patasartesanatos.com';

    const token = createSession(
      res,
      'customer',
      {
        customerId: customer.id,
        email: customer.email,
        role: customer.role || (isCustomerAdmin ? 'admin' : 'customer'),
      },
      req
    );

    let adminToken = null;
    if (isCustomerAdmin) {
      adminToken = createSession(
        res,
        'admin',
        { email: customer.email, role: 'admin' },
        req
      );
    }

    return res.status(200).json({
      message: 'Cadastro salvo com sucesso no PostgreSQL!',
      token,
      adminToken: adminToken || (isCustomerAdmin ? token : null),
      customer: {
        ...formatCustomerResponse(customer),
        adminToken: adminToken || (isCustomerAdmin ? token : null),
      },
    });
  } catch (err) {
    console.error('Erro ao salvar cliente:', err.message);
    return res
      .status(500)
      .json({ error: 'Erro ao registrar cliente no banco PostgreSQL.' });
  }
}

export async function loginCustomer(req, res) {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || typeof password !== 'string' || !password) {
      return res.status(400).json({
        error: 'Informe seu e-mail e sua senha para entrar na conta.',
      });
    }

    if (password.length > 64) {
      return res.status(400).json({
        error: 'Credenciais inválidas.',
      });
    }

    const ipKey = `cust:ip:${req.ip || 'unknown'}`;
    const acctKey = `cust:acct:${normalizedEmail}`;
    const lockedMs = Math.max(isLocked(ipKey), isLocked(acctKey));
    if (lockedMs > 0) {
      const waitMin = Math.ceil(lockedMs / 60000);
      return res.status(429).json({
        error: `Muitas tentativas de login falhas. Tente novamente em ${waitMin} minuto(s).`,
      });
    }

    const result = await query(
      'SELECT * FROM customers WHERE LOWER(email) = $1',
      [normalizedEmail]
    );

    const customer = result.rows[0] || null;
    const isPasswordValid = await verifyPassword(String(password), customer?.password);

    if (!customer || !isPasswordValid) {
      registerFailure(ipKey);
      registerFailure(acctKey);
      return res.status(401).json({
        error: 'E-mail ou senha inválidos. Verifique suas credenciais e tente novamente.',
      });
    }

    clearFailures(ipKey);
    clearFailures(acctKey);

    const isCustomerAdmin =
      customer.role === 'admin' ||
      customer.email?.toLowerCase() === 'admin@patasartesanatos.com';

    const token = createSession(
      res,
      'customer',
      {
        customerId: customer.id,
        email: customer.email,
        role: customer.role || (isCustomerAdmin ? 'admin' : 'customer'),
      },
      req
    );

    let adminToken = null;
    if (isCustomerAdmin) {
      adminToken = createSession(
        res,
        'admin',
        { email: customer.email, role: 'admin' },
        req
      );
    }

    const ordersRes = await query(
      'SELECT * FROM orders WHERE LOWER(customer_email) = $1 ORDER BY created_at DESC',
      [normalizedEmail]
    );

    return res.json({
      message: 'Login realizado com sucesso!',
      token,
      adminToken: adminToken || (isCustomerAdmin ? token : null),
      customer: {
        ...formatCustomerResponse(customer),
        adminToken: adminToken || (isCustomerAdmin ? token : null),
      },
      orders: ordersRes.rows,
    });
  } catch (err) {
    console.error('Erro no login do cliente:', err.message);
    return res.status(500).json({ error: 'Erro ao autenticar cliente.' });
  }
}

export async function logoutCustomer(req, res) {
  destroySession(req, res, 'customer');
  return res.json({ message: 'Sessão encerrada com sucesso.' });
}

export async function getCurrentCustomer(req, res) {
  try {
    const email = req.customer?.email?.toLowerCase();
    if (!email) {
      return res.status(401).json({ error: 'Sessão inválida.' });
    }

    const result = await query('SELECT * FROM customers WHERE LOWER(email) = $1', [email]);
    if (result.rowCount === 0) {
      destroySession(req, res, 'customer');
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const customer = result.rows[0];
    const ordersRes = await query(
      'SELECT * FROM orders WHERE LOWER(customer_email) = $1 ORDER BY created_at DESC',
      [email]
    );

    return res.json({
      customer: formatCustomerResponse(customer),
      orders: ordersRes.rows,
    });
  } catch (err) {
    console.error('Erro ao obter sessão atual:', err.message);
    return res.status(500).json({ error: 'Erro ao consultar sessão.' });
  }
}

export async function getCustomerByEmail(req, res) {
  try {
    const email = normalizeEmail(req.query.email);
    if (!email) {
      return res.status(400).json({ error: 'Informe um e-mail válido para busca.' });
    }

    // Impede IDOR / Enumeração: cliente autenticado só pode consultar seus próprios dados (ou admin)
    const isOwner = req.customer && req.customer.email?.toLowerCase() === email;
    if (!req.admin && !isOwner) {
      return res.status(403).json({
        error: 'Acesso negado: você só pode consultar os dados da sua própria conta.',
      });
    }

    const result = await query('SELECT * FROM customers WHERE LOWER(email) = $1', [
      email,
    ]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const customer = result.rows[0];
    const ordersRes = await query(
      'SELECT * FROM orders WHERE LOWER(customer_email) = $1 ORDER BY created_at DESC',
      [email]
    );

    return res.json({
      customer: formatCustomerResponse(customer),
      orders: ordersRes.rows,
    });
  } catch (err) {
    console.error('Erro ao buscar cliente:', err.message);
    return res.status(500).json({ error: 'Erro ao consultar cliente.' });
  }
}
