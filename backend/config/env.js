/**
 * Carregamento centralizado de variáveis de ambiente (.env) e configurações de segurança.
 * OWASP A05 (Security Misconfiguration) / A02 (Cryptographic Failures):
 * segredos NUNCA ficam em texto puro no código-fonte — são lidos do arquivo .env.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env'), quiet: true });

const isProduction = process.env.NODE_ENV === 'production';

function parseList(value, fallback) {
  if (!value) return fallback;
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

export const config = Object.freeze({
  isProduction,
  port: Number(process.env.PORT || 3001),
  host: process.env.HOST || (isProduction ? '0.0.0.0' : '127.0.0.1'),

  // Origens autorizadas a chamar a API (CORS estrito + verificação anti-CSRF)
  allowedOrigins: parseList(process.env.ALLOWED_ORIGINS, [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]),

  // Credenciais do administrador (lidas do .env; senha verificada exclusivamente via hash bcrypt)
  adminEmail: (process.env.ADMIN_EMAIL || 'admin@patasartesanatos.com').trim().toLowerCase(),
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || '',

  // HTTPS opcional (certificado + chave em PEM)
  httpsKeyPath: process.env.HTTPS_KEY_PATH || '',
  httpsCertPath: process.env.HTTPS_CERT_PATH || '',

  // Força cookies "Secure" (obrigatório quando servido via HTTPS / proxy TLS)
  cookieSecure:
    isProduction ||
    process.env.COOKIE_SECURE === 'true' ||
    Boolean(process.env.HTTPS_KEY_PATH && process.env.HTTPS_CERT_PATH),

  // Confiar em cabeçalhos X-Forwarded-* apenas de proxies locais (ex.: proxy do Vite)
  trustProxy: process.env.TRUST_PROXY || 'loopback',

  // Console SQL do admin: somente leitura por padrão (princípio do menor privilégio)
  adminSqlAllowWrite: process.env.ADMIN_SQL_ALLOW_WRITE === 'true',

  // Bloqueia troca de servidor PostgreSQL em tempo de execução por padrão (anti-SSRF)
  allowDbSwitch: process.env.ALLOW_DB_SWITCH === 'true',

  // Cadastro automático de clientes de demonstração
  autoCustomers: process.env.AUTO_CUSTOMERS !== 'false',
});
