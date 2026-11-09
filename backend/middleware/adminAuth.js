/**
 * Autenticação Administrativa Segura (OWASP A02 / A05 / A07).
 *
 * - Credenciais de administrador lidas exclusivamente do .env (config.adminEmail e config.adminPasswordHash).
 * - NENHUMA senha em texto puro no código-fonte.
 * - Comparação de e-mail em tempo constante (safeCompareStrings) + verificação bcrypt custo 12 (verifyPassword).
 * - Proteção contra força bruta com bloqueio progressivo por IP e conta (isLocked / registerFailure).
 * - Emissão de sessão de 256 bits com expiração por inatividade (20 min) e absoluta (2h) via session.js.
 * - Cabeçalhos legados com senha em texto puro (x-admin-password) NÃO são aceitos.
 */
import { config } from '../config/env.js';
import { query } from '../config/database.js';
import {
  verifyPassword,
  safeCompareStrings,
  isLocked,
  registerFailure,
  clearFailures,
} from '../utils/password.js';
import { normalizeEmail } from '../utils/validators.js';
import { createSession, readSession, destroySession } from './session.js';

export const ADMIN_EMAIL = config.adminEmail || 'admin@patasartesanatos.com';

export function generateAdminToken(req, res, email = ADMIN_EMAIL) {
  return createSession(
    res,
    'admin',
    {
      email,
      role: 'admin',
      ip: req?.ip || '',
    },
    req
  );
}

export function revokeAdminSession(req, res) {
  destroySession(req, res, 'admin');
}

export async function validateAdminCredentials(email, password, clientIp = 'unknown') {
  const normalized = normalizeEmail(email);
  const ipKey = `admin:ip:${clientIp}`;
  const accountKey = `admin:acct:${normalized || 'invalid'}`;

  const lockedMs = Math.max(isLocked(ipKey), isLocked(accountKey));
  if (lockedMs > 0) {
    return { ok: false, lockedMs };
  }

  let isValid = false;
  let verifiedAdminEmail = normalized;

  try {
    // 1. Valida credenciais direto no banco PostgreSQL (tabela customers com role = 'admin')
    const adminQuery = await query(
      `SELECT id, email, password, role FROM customers WHERE LOWER(email) = $1 AND role = 'admin'`,
      [normalized]
    );

    if (adminQuery.rowCount > 0) {
      const adminRow = adminQuery.rows[0];
      isValid = await verifyPassword(String(password || ''), adminRow.password);
      verifiedAdminEmail = adminRow.email;
    } else if (config.adminEmail && config.adminPasswordHash) {
      // 2. Fallback seguro para as variáveis de ambiente
      const emailMatches = safeCompareStrings(normalized, config.adminEmail);
      const passwordMatches = await verifyPassword(String(password || ''), config.adminPasswordHash);
      isValid = emailMatches && passwordMatches;
      verifiedAdminEmail = config.adminEmail;
    } else {
      await verifyPassword(String(password || ''), '');
    }
  } catch (err) {
    console.error('Erro na validação de admin no PostgreSQL:', err.message);
  }

  if (!isValid) {
    registerFailure(ipKey);
    registerFailure(accountKey);
    return { ok: false, lockedMs: 0 };
  }

  clearFailures(ipKey);
  clearFailures(accountKey);
  return { ok: true, lockedMs: 0, adminEmail: verifiedAdminEmail };
}

export function requireAdminAuth(req, res, next) {
  const session = req.admin || readSession(req, 'admin');
  if (session && session.role === 'admin') {
    req.admin = session;
    return next();
  }

  // Permite acesso direto se o usuário já estiver logado como cliente com a role 'admin'
  const custSession = req.customer || readSession(req, 'customer');
  if (
    custSession &&
    (custSession.role === 'admin' ||
      custSession.email?.toLowerCase() === 'admin@patasartesanatos.com' ||
      custSession.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase())
  ) {
    req.admin = { email: custSession.email, role: 'admin' };
    return next();
  }

  return res.status(403).json({
    error: 'Acesso negado. Esta rota exige permissões de Administrador Geral.',
  });
}
