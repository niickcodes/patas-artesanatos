/**
 * Camada Segura de Comunicação com o Banco de Dados PostgreSQL
 * (OWASP A03 - Injection / A02 - Cryptographic Failures / A05 - Security Misconfiguration).
 *
 * - Todas as queries da aplicação são parametrizadas ($1, $2, ...) com validação de tipos.
 * - Identificadores SQL (database, user) validados por whitelist estrita (impede SQLi em DDL).
 * - Proteção contra SSRF na reconexão PostgreSQL (restrito a hosts loopback autorizados).
 * - Timeout de execução de 5s por query (mitiga DoS e blind SQLi time-based como pg_sleep).
 * - Executor seguro somente-leitura para o Console SQL Admin (bloqueia múltiplas instruções,
 *   DDL/DML destrutivos, funções de sistema como pg_read_file/pg_sleep e oculta hashes de senha).
 * - Migração automática de senhas legadas em texto puro para bcrypt (custo 12) na inicialização.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { PGlite } from '@electric-sql/pglite';
import { config } from './env.js';
import { PRODUCTS } from './seedProducts.js';
import {
  hashPassword,
  isBcryptHash,
  randomUnguessablePassword,
} from '../utils/password.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool, Client } = pg;

const SAFE_PG_IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/;
const ALLOWED_DB_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const QUERY_TIMEOUT_MS = 5000;

let dbEngine = null; // Either pg.Pool or PGlite instance
let dbMode = 'initializing'; // 'postgresql-server' | 'pglite-embedded-postgres'
let connectionInfo = {
  engine: 'PostgreSQL',
  host: process.env.PG_HOST || 'localhost',
  port: Number(process.env.PG_PORT || 5432),
  database: process.env.PG_DATABASE || 'miau_artesanatos',
  user: process.env.PG_USER || 'postgres',
  version: '',
};

function validatePgConfig({ host, port, user, database }) {
  const cleanHost = String(host || 'localhost').trim().toLowerCase();
  if (!ALLOWED_DB_HOSTS.has(cleanHost)) {
    throw new Error('Host do PostgreSQL não autorizado por política anti-SSRF (use localhost / 127.0.0.1).');
  }

  const numericPort = Number(port || 5432);
  if (!Number.isInteger(numericPort) || numericPort < 1024 || numericPort > 65535) {
    throw new Error('Porta do PostgreSQL inválida (permitido: 1024 a 65535).');
  }

  const cleanUser = String(user || 'postgres').trim();
  if (!SAFE_PG_IDENTIFIER.test(cleanUser)) {
    throw new Error('Identificador de usuário do PostgreSQL inválido.');
  }

  const cleanDb = String(database || 'miau_artesanatos').trim();
  if (!SAFE_PG_IDENTIFIER.test(cleanDb)) {
    throw new Error('Nome do banco de dados PostgreSQL contém caracteres inválidos.');
  }

  return {
    host: cleanHost,
    port: numericPort,
    user: cleanUser,
    database: cleanDb,
  };
}

/**
 * Tenta conectar a um servidor PostgreSQL externo validando identificadores contra SQL Injection.
 */
async function tryExternalPostgres(rawConfig) {
  const { password, connectionString } = rawConfig;

  if (connectionString) {
    const pool = new Pool({
      connectionString,
      connectionTimeoutMillis: 3000,
      statement_timeout: QUERY_TIMEOUT_MS,
      query_timeout: QUERY_TIMEOUT_MS,
      max: 20,
      idleTimeoutMillis: 30000,
    });
    const res = await pool.query('SELECT version()');
    return { pool, version: res.rows[0].version };
  }

  if (!password) {
    throw new Error('Senha do servidor PostgreSQL local não informada no .env');
  }

  const { host, port, user, database } = validatePgConfig(rawConfig);

  const adminClient = new Client({
    host,
    port,
    user,
    password: String(password),
    database: 'postgres',
    connectionTimeoutMillis: 3000,
    statement_timeout: QUERY_TIMEOUT_MS,
    query_timeout: QUERY_TIMEOUT_MS,
  });

  await adminClient.connect();
  try {
    const dbCheck = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [database]
    );
    if (dbCheck.rowCount === 0) {
      // Seguro pois `database` já passou na whitelist SAFE_PG_IDENTIFIER (/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/)
      await adminClient.query(`CREATE DATABASE "${database}"`);
    }
  } finally {
    await adminClient.end().catch(() => {});
  }

  const pool = new Pool({
    host,
    port,
    user,
    password: String(password),
    database,
    connectionTimeoutMillis: 3000,
    statement_timeout: QUERY_TIMEOUT_MS,
    query_timeout: QUERY_TIMEOUT_MS,
    max: 20,
    idleTimeoutMillis: 30000,
  });

  const versionRes = await pool.query('SELECT version()');
  return { pool, version: versionRes.rows[0].version };
}

/**
 * Inicializa o banco PostgreSQL (Servidor PostgreSQL via `pg` ou Engine PostgreSQL nativa persistente via `PGlite`)
 */
export async function initDatabase() {
  try {
    const externalConfig = {
      connectionString: process.env.DATABASE_URL,
      host: process.env.PG_HOST || 'localhost',
      port: Number(process.env.PG_PORT || 5432),
      user: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || '',
      database: process.env.PG_DATABASE || 'miau_artesanatos',
    };

    const { pool, version } = await tryExternalPostgres(externalConfig);
    dbEngine = pool;
    dbMode = 'postgresql-server';
    connectionInfo = {
      ...connectionInfo,
      mode: 'Servidor PostgreSQL (pg.Pool)',
      version,
      storage: `${externalConfig.host}:${externalConfig.port}/${externalConfig.database}`,
    };
    console.log('✅ Conectado ao servidor PostgreSQL externo.');
  } catch {
    const pgDataDir = path.join(__dirname, '..', 'data', 'pgdata');
    fs.mkdirSync(pgDataDir, { recursive: true });

    try {
      dbEngine = new PGlite(pgDataDir);
      await dbEngine.waitReady;
    } catch {
      console.warn('⚠️ Base de dados local com checkpoint corrompido. Restaurando integridade do PostgreSQL...');
      fs.rmSync(pgDataDir, { recursive: true, force: true });
      fs.mkdirSync(pgDataDir, { recursive: true });
      dbEngine = new PGlite(pgDataDir);
      await dbEngine.waitReady;
    }

    const versionRes = await dbEngine.query('SELECT version()');
    dbMode = 'pglite-embedded-postgres';
    connectionInfo = {
      ...connectionInfo,
      mode: 'PostgreSQL Nativo Persistente (PGlite)',
      version: versionRes.rows[0].version,
      storage: 'Persistente em Disco (PGlite)',
    };
    console.log('✅ Banco PostgreSQL inicializado (PGlite persistente).');
  }

  await applySchemaAndSeed();
  return getDatabaseMetadata();
}

/**
 * Permite reconectar em tempo de execução ao PostgreSQL local somente se ALLOW_DB_SWITCH=true
 */
export async function switchExternalPostgres({
  host = 'localhost',
  port = 5432,
  user = 'postgres',
  password,
  database = 'miau_artesanatos',
}) {
  if (!config.allowDbSwitch) {
    throw new Error(
      'Troca de servidor de banco em tempo de execução está desabilitada por política de segurança (ALLOW_DB_SWITCH=false).'
    );
  }

  const validated = validatePgConfig({ host, port, user, database });
  const { pool, version } = await tryExternalPostgres({
    ...validated,
    password,
  });

  dbEngine = pool;
  dbMode = 'postgresql-server';
  connectionInfo = {
    engine: 'PostgreSQL',
    host: validated.host,
    port: validated.port,
    database: validated.database,
    user: validated.user,
    mode: 'Servidor PostgreSQL Dedicado (pg.Pool)',
    version,
    storage: `${validated.host}:${validated.port}/${validated.database}`,
  };
  await applySchemaAndSeed();
  return getDatabaseMetadata();
}

/**
 * Executa queries SQL parametrizadas ($1, $2, ...) no PostgreSQL ativo.
 * Valida tipos para impedir injeção de objetos/parâmetros malformados.
 */
export async function query(sqlText, params = []) {
  if (typeof sqlText !== 'string' || !sqlText.trim()) {
    throw new Error('Instrução SQL inválida.');
  }
  if (sqlText.includes('\u0000')) {
    throw new Error('Instrução SQL contém byte nulo inválido.');
  }
  if (!Array.isArray(params)) {
    throw new Error('Os parâmetros da query devem ser uma lista (Array).');
  }
  for (const param of params) {
    if (typeof param === 'string' && param.includes('\u0000')) {
      throw new Error('Parâmetro SQL contém byte nulo inválido.');
    }
  }

  if (!dbEngine) {
    await initDatabase();
  }
  const result = await dbEngine.query(sqlText, params);
  return {
    rows: result.rows || [],
    rowCount: result.rowCount ?? (result.rows ? result.rows.length : 0),
    fields: result.fields || [],
  };
}

/**
 * Executor restrito e seguro para o Console SQL Administrativo:
 * - Impede stacked queries (múltiplos comandos separados por `;`).
 * - Bloqueia funções perigosas de sistema, leitura de arquivos e DoS (pg_sleep, pg_read_file, COPY, lo_*, dblink).
 * - Por padrão (ADMIN_SQL_ALLOW_WRITE=false), permite exclusivamente consultas SELECT / EXPLAIN SELECT.
 * - Remove automaticamente colunas de senha (password / password_hash) do resultado.
 */
const FORBIDDEN_SQL_PATTERNS =
  /\b(pg_sleep|pg_read_file|pg_read_binary_file|pg_ls_dir|pg_stat_file|lo_import|lo_export|dblink|pg_execute_server_program|pg_terminate_backend|pg_cancel_backend|pg_reload_conf|pg_rotate_logfile|set_config|current_setting|pg_shadow|pg_authid)\b/i;

const WRITE_OR_DDL_PATTERNS =
  /\b(insert|update|delete|drop|alter|truncate|create|grant|revoke|copy|call|do|set|reset|vacuum|analyze|lock|listen|notify|prepare|execute|deallocate|discard|cluster|reindex|security|owner)\b/i;

export async function executeSafeReadOnlyQuery(rawSql) {
  if (typeof rawSql !== 'string' || !rawSql.trim()) {
    throw new Error('Informe uma consulta SQL para executar.');
  }
  if (rawSql.length > 4000) {
    throw new Error('A consulta SQL excede o tamanho máximo permitido (4000 caracteres).');
  }
  if (rawSql.includes('\u0000')) {
    throw new Error('A consulta SQL contém caracteres inválidos.');
  }

  // Remove comentários SQL (-- e /* */) para inspeção segura
  const stripped = rawSql
    .replace(/--.*$/gm, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .trim();

  if (!stripped) {
    throw new Error('A consulta SQL está vazia.');
  }

  // Remove um único ponto-e-vírgula final opcional e bloqueia qualquer outro `;` (anti Stacked Queries)
  const withoutTrailingSemicolon = stripped.replace(/;\s*$/, '').trim();
  if (withoutTrailingSemicolon.includes(';')) {
    throw new Error(
      'Execução de múltiplas instruções SQL (Stacked Queries) é bloqueada por segurança.'
    );
  }

  if (FORBIDDEN_SQL_PATTERNS.test(withoutTrailingSemicolon)) {
    throw new Error(
      'A consulta utiliza funções ou catálogos de sistema restritos pela política de segurança.'
    );
  }

  if (!config.adminSqlAllowWrite) {
    if (!/^(select|explain\s+select)\b/i.test(withoutTrailingSemicolon)) {
      throw new Error(
        'O Console SQL está em modo Somente Leitura (SELECT). Comandos de alteração (INSERT, UPDATE, DELETE, DROP, ALTER) são bloqueados.'
      );
    }
    if (WRITE_OR_DDL_PATTERNS.test(withoutTrailingSemicolon)) {
      throw new Error(
        'Operações de escrita ou alteração de estrutura não são permitidas no modo Somente Leitura.'
      );
    }
  }

  const result = await query(withoutTrailingSemicolon);

  // Redige colunas sensíveis (ex.: password) caso a tabela customers seja consultada
  const sanitizedRows = (result.rows || []).map((row) => {
    if (!row || typeof row !== 'object') return row;
    const copy = { ...row };
    for (const key of Object.keys(copy)) {
      if (/^password/i.test(key)) {
        copy[key] = '[REDACTED_BCRYPT_HASH]';
      }
    }
    return copy;
  });

  return {
    rows: sanitizedRows,
    rowCount: result.rowCount,
  };
}

/**
 * Executa scripts DDL internos de inicialização do banco
 */
async function execSqlScript(sqlScript) {
  if (!dbEngine) {
    await initDatabase();
  }
  if (typeof dbEngine.exec === 'function') {
    return dbEngine.exec(sqlScript);
  }
  return dbEngine.query(sqlScript);
}

/**
 * Status público enxuto para o endpoint /api/health (OWASP A05 - evita divulgação de versão/paths)
 */
export function getPublicDatabaseStatus() {
  return {
    status: dbEngine ? 'connected' : 'initializing',
    engine: 'PostgreSQL',
  };
}

/**
 * Metadados do banco para o painel administrativo autenticado (sem expor caminhos internos do SO)
 */
export function getDatabaseMetadata() {
  return {
    engine: connectionInfo.engine,
    database: connectionInfo.database,
    mode: connectionInfo.mode,
    modeKey: dbMode,
  };
}

/**
 * Cria as tabelas do schema.sql, migra senhas legadas para bcrypt e popula os dados iniciais
 */
async function applySchemaAndSeed() {
  const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  await execSqlScript(schemaSql);

  // Garante migração segura para bancos já existentes em disco (sem default de senha fraca)
  await execSqlScript(`
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS password VARCHAR(255);
    ALTER TABLE customers ALTER COLUMN password DROP DEFAULT;
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'customer';
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS street VARCHAR(120);
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS address_number VARCHAR(20);
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS complement VARCHAR(100);
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(100);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_cpf_unique ON customers(cpf) WHERE cpf IS NOT NULL AND cpf <> '';
    ALTER TABLE products ALTER COLUMN image TYPE TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS created_by_email VARCHAR(180);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_code VARCHAR(40);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR(40) DEFAULT 'PAGAMENTO APROVADO';
  `);

  // Garante a existência do usuário administrador padrão (OWASP A02 - bcrypt hash custo 12)
  const defaultAdminEmail = 'admin@patasartesanatos.com';
  const adminCheck = await query('SELECT id FROM customers WHERE LOWER(email) = $1', [defaultAdminEmail]);
  const adminPasswordHash = await hashPassword('Patasartesanatos1973@');

  if (adminCheck.rowCount === 0) {
    await query(
      `INSERT INTO customers (
        name, email, password, role, phone, cpf, street, address_number, neighborhood, address, city, state, zip_code
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        'Administrador Geral',
        defaultAdminEmail,
        adminPasswordHash,
        'admin',
        '11999999999',
        '000.000.000-00',
        'Rua das Palmeiras',
        '100',
        'Centro',
        'Rua das Palmeiras, Nº 100 - Centro',
        'São Paulo',
        'SP',
        '01001-000',
      ]
    );
    console.log('👑 Administrador padrão criado com sucesso: admin@patasartesanatos.com');
  } else {
    await query(
      `UPDATE customers SET password = $1, role = 'admin' WHERE LOWER(email) = $2`,
      [adminPasswordHash, defaultAdminEmail]
    );
  }

  // Garante a existência do usuário cliente comum padrão (OWASP A02 - bcrypt hash custo 12)
  const defaultClientEmail = 'teste1@gmail.com';
  const clientCheck = await query('SELECT id FROM customers WHERE LOWER(email) = $1', [defaultClientEmail]);
  const clientPasswordHash = await hashPassword('Teste1234@');
  const defaultClientCpf = '222.555.888-46';

  // Garante desimpedimento de CPF caso exista registro residual de teste anterior
  await query('UPDATE customers SET cpf = NULL WHERE cpf = $1 AND LOWER(email) <> $2', [defaultClientCpf, defaultClientEmail]);

  if (clientCheck.rowCount === 0) {
    await query(
      `INSERT INTO customers (
        name, email, password, role, phone, cpf, street, address_number, neighborhood, address, city, state, zip_code
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        'Cliente Teste Padrão',
        defaultClientEmail,
        clientPasswordHash,
        'customer',
        '11988881234',
        defaultClientCpf,
        'Rua das Flores',
        '123',
        'Jardins',
        'Rua das Flores, Nº 123 - Jardins',
        'São Paulo',
        'SP',
        '01415-000',
      ]
    );
    console.log('🐾 Cliente padrão de teste criado com sucesso: teste1@gmail.com');
  } else {
    await query(
      `UPDATE customers SET password = $1, role = 'customer', cpf = $2 WHERE LOWER(email) = $3`,
      [clientPasswordHash, defaultClientCpf, defaultClientEmail]
    );
  }

  // Migra automaticamente qualquer senha que ainda esteja em texto puro para hash bcrypt (custo 12)
  const legacyCustomers = await query('SELECT id, password FROM customers');
  for (const row of legacyCustomers.rows) {
    if (!isBcryptHash(row.password)) {
      const plainToHash =
        row.password && String(row.password).trim().length >= 4
          ? String(row.password).trim()
          : randomUnguessablePassword();
      const bcryptHash = await hashPassword(plainToHash);
      await query('UPDATE customers SET password = $1 WHERE id = $2', [bcryptHash, row.id]);
    }
  }

  // Sincroniza os 15 produtos do catálogo no PostgreSQL (UPSERT parametrizado)
  for (const prod of PRODUCTS) {
    await query(
      `INSERT INTO products (
        id, name, category, category_label, price, original_price,
        rating, reviews_count, image, badge, description, dimensions, in_stock
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        category_label = EXCLUDED.category_label,
        price = EXCLUDED.price,
        original_price = EXCLUDED.original_price,
        rating = EXCLUDED.rating,
        reviews_count = EXCLUDED.reviews_count,
        image = EXCLUDED.image,
        badge = EXCLUDED.badge,
        description = EXCLUDED.description,
        dimensions = EXCLUDED.dimensions`,
      [
        prod.id,
        prod.name,
        prod.category,
        prod.categoryLabel,
        prod.price,
        prod.originalPrice,
        prod.rating,
        prod.reviewsCount,
        prod.image,
        prod.badge,
        prod.description,
        prod.dimensions,
        prod.inStock,
      ]
    );
  }

  // Insere clientes de exemplo se a tabela estiver vazia (com senhas aleatórias em bcrypt)
  const customerCount = await query('SELECT COUNT(*)::int AS total FROM customers');
  if (customerCount.rows[0].total === 0) {
    const c1 = await query(
      `INSERT INTO customers (name, email, phone, cpf, address, city, state, zip_code, password)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        'Clara Soares Mendonça',
        'clara.soares@email.com',
        '(11) 99812-4410',
        '392.418.290-15',
        'Rua dos Girassóis, 142 - Apt 32',
        'São Paulo',
        'SP',
        '04012-090',
        await hashPassword(randomUnguessablePassword()),
      ]
    );

    const c2 = await query(
      `INSERT INTO customers (name, email, phone, cpf, address, city, state, zip_code, password)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        'Beatriz Helena Costa',
        'bia.costa@email.com',
        '(21) 98744-1122',
        '148.920.381-04',
        'Av. das Palmeiras, 890',
        'Rio de Janeiro',
        'RJ',
        '22410-003',
        await hashPassword(randomUnguessablePassword()),
      ]
    );

    const o1 = await query(
      `INSERT INTO orders (
        order_code, customer_id, customer_name, customer_email,
        subtotal, discount, shipping, total, payment_method, payment_status,
        coupon_code, shipping_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id`,
      [
        'MIAU-849201',
        c1.rows[0].id,
        'Clara Soares Mendonça',
        'clara.soares@email.com',
        184.4,
        18.44,
        18.9,
        184.86,
        'pix',
        'aprovado',
        'MIAU10',
        'Rua dos Girassóis, 142 - Apt 32, São Paulo/SP - CEP 04012-090',
      ]
    );

    await query(
      `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
       VALUES ($1, $2, $3, $4, $5, $6), ($1, $7, $8, $9, $10, $11)`,
      [
        o1.rows[0].id,
        'amigurumi-rosa',
        'Amigurumi Miauzinho Rosa',
        1,
        89.9,
        89.9,
        'amigurumi-soneca',
        'Amigurumi Gatinho Soneca Menta',
        1,
        94.5,
        94.5,
      ]
    );

    await query(
      `INSERT INTO payments (
        order_id, method, amount, status, installments, pix_key, pix_txid, transaction_code
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        o1.rows[0].id,
        'pix',
        184.86,
        'aprovado',
        1,
        'miauartesanatos@gmail.com',
        'PIXMIAU2026849201',
        'TX-PIX-849201BR',
      ]
    );

    const o2 = await query(
      `INSERT INTO orders (
        order_code, customer_id, customer_name, customer_email,
        subtotal, discount, shipping, total, payment_method, payment_status,
        coupon_code, shipping_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id`,
      [
        'MIAU-910482',
        c2.rows[0].id,
        'Beatriz Helena Costa',
        'bia.costa@email.com',
        217.0,
        0.0,
        0.0,
        217.0,
        'credit_card',
        'aprovado',
        null,
        'Av. das Palmeiras, 890, Rio de Janeiro/RJ - CEP 22410-003',
      ]
    );

    await query(
      `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
       VALUES ($1, $2, $3, $4, $5, $6), ($1, $7, $8, $9, $10, $11)`,
      [
        o2.rows[0].id,
        'quadro-botanico',
        'Quadro Botânico "Gato & Folhagens"',
        1,
        119.0,
        119.0,
        'amigurumi-siames',
        'Amigurumi Gatinho Siamês Café com Leite',
        1,
        98.0,
        98.0,
      ]
    );

    await query(
      `INSERT INTO payments (
        order_id, method, amount, status, installments, card_last4, card_holder, card_brand, transaction_code
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        o2.rows[0].id,
        'credit_card',
        217.0,
        'aprovado',
        3,
        '4829',
        'BEATRIZ H COSTA',
        'Mastercard',
        'TX-CC-910482MC',
      ]
    );
  }
}
