/**
 * Gerenciamento de sessões no servidor (OWASP A07 - Identification and Authentication Failures).
 *
 * - Token de sessão criptograficamente aleatório de 256 bits (crypto.randomBytes(32)), enviado em cookie
 *   HttpOnly + SameSite=Strict (+ Secure quando HTTPS) — inacessível a JavaScript (mitiga roubo via XSS).
 * - Também aceita Authorization: Bearer <token> validado contra o mesmo armazenamento SHA-256 com TTL.
 * - No servidor guardamos APENAS o hash SHA-256 do token (nunca o token em texto puro).
 * - Vinculação de fingerprint de User-Agent para dificultar sequestro de sessão (Session Hijacking).
 * - Expiração por inatividade (idle timeout) e expiração absoluta; rotação do token a cada login (anti Session Fixation).
 * - Logout invalida imediatamente a sessão no servidor e limpa o cookie.
 */
import crypto from 'crypto';
import { config } from '../config/env.js';

export const CUSTOMER_COOKIE = 'miau_sid';
export const ADMIN_COOKIE = 'miau_admin_sid';

const POLICIES = {
  customer: { idleMs: 2 * 60 * 60 * 1000, absoluteMs: 12 * 60 * 60 * 1000 },
  admin: { idleMs: 20 * 60 * 1000, absoluteMs: 2 * 60 * 60 * 1000 },
};

const MAX_SESSIONS = 20000;
const sessions = new Map(); // sha256(token) -> session

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function hashUserAgent(req) {
  const ua = req?.get?.('user-agent') || '';
  return crypto.createHash('sha256').update(ua).digest('hex').slice(0, 16);
}

function cookieOptions(role) {
  return {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'strict',
    path: '/api',
    maxAge: POLICIES[role].absoluteMs,
  };
}

function evictIfNeeded() {
  if (sessions.size < MAX_SESSIONS) return;
  const oldestKey = sessions.keys().next().value;
  sessions.delete(oldestKey);
}

function isExpired(session, now = Date.now()) {
  const policy = POLICIES[session.role];
  if (!policy) return true;
  return now - session.lastSeen > policy.idleMs || now - session.createdAt > policy.absoluteMs;
}

function extractToken(req, role) {
  const cookieName = role === 'admin' ? ADMIN_COOKIE : CUSTOMER_COOKIE;
  const cookieToken = req.cookies?.[cookieName];
  if (typeof cookieToken === 'string' && cookieToken.length >= 20 && cookieToken.length <= 128) {
    return cookieToken;
  }

  const authHeader = req.headers?.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (bearer.length >= 20 && bearer.length <= 128) {
      return bearer;
    }
  }

  const customHeader =
    req.headers?.[role === 'admin' ? 'x-admin-token' : 'x-auth-token'] ||
    req.headers?.['x-admin-token'] ||
    req.headers?.['x-auth-token'];
  if (typeof customHeader === 'string' && customHeader.length >= 20 && customHeader.length <= 128) {
    return customHeader;
  }

  return null;
}

/**
 * Cria uma nova sessão segura no servidor, rotacionando qualquer sessão anterior (anti Session Fixation).
 * Retorna o token gerado.
 */
export function createSession(res, role, data, req = null) {
  if (req) {
    const oldToken = extractToken(req, role);
    if (oldToken) {
      sessions.delete(hashToken(oldToken));
    }
  }

  evictIfNeeded();
  const token = crypto.randomBytes(32).toString('base64url');
  const now = Date.now();
  const uaHash = req ? hashUserAgent(req) : null;

  sessions.set(hashToken(token), {
    role,
    ...data,
    uaHash,
    createdAt: now,
    lastSeen: now,
  });

  if (res?.cookie) {
    res.cookie(role === 'admin' ? ADMIN_COOKIE : CUSTOMER_COOKIE, token, cookieOptions(role));
  }

  return token;
}

export function readSession(req, role) {
  const token = extractToken(req, role);
  if (!token) return null;

  const key = hashToken(token);
  const session = sessions.get(key);
  if (!session || session.role !== role) return null;

  if (isExpired(session)) {
    sessions.delete(key);
    return null;
  }

  // Verifica consistência do User-Agent quando registrado (anti Session Hijacking entre ferramentas distintas)
  if (session.uaHash && req) {
    const currentUaHash = hashUserAgent(req);
    if (session.uaHash !== currentUaHash) {
      sessions.delete(key);
      return null;
    }
  }

  session.lastSeen = Date.now();
  return session;
}

export function destroySession(req, res, role) {
  const cookieName = role === 'admin' ? ADMIN_COOKIE : CUSTOMER_COOKIE;
  const cookieToken = req.cookies?.[cookieName];
  if (typeof cookieToken === 'string') {
    sessions.delete(hashToken(cookieToken));
  }

  const bearerToken = extractToken(req, role);
  if (typeof bearerToken === 'string') {
    sessions.delete(hashToken(bearerToken));
  }

  if (res?.clearCookie) {
    const { maxAge, ...opts } = cookieOptions(role);
    void maxAge;
    res.clearCookie(cookieName, opts);
  }
}

/** Invalida todas as sessões de um cliente (ex.: após troca de senha). */
export function destroyAllCustomerSessions(customerId) {
  for (const [key, s] of sessions) {
    if (s.role === 'customer' && s.customerId === customerId) {
      sessions.delete(key);
    }
  }
}

// Limpeza periódica de sessões expiradas em memória
setInterval(() => {
  const now = Date.now();
  for (const [key, s] of sessions) {
    if (isExpired(s, now)) sessions.delete(key);
  }
}, 5 * 60 * 1000).unref();

/** Anexa req.customer / req.admin quando existir sessão válida (não bloqueia). */
export function attachSessions(req, res, next) {
  req.customer = readSession(req, 'customer');
  req.admin = readSession(req, 'admin');
  next();
}

export function requireCustomer(req, res, next) {
  if (!req.customer) {
    req.customer = readSession(req, 'customer');
  }
  if (!req.customer) {
    return res.status(401).json({ error: 'Sessão expirada ou inexistente. Faça login novamente.' });
  }
  return next();
}

export function requireAdmin(req, res, next) {
  if (!req.admin) {
    req.admin = readSession(req, 'admin');
  }
  if (!req.admin) {
    return res.status(401).json({ error: 'Acesso negado. Faça login como administrador.' });
  }
  return next();
}

export function requireCustomerOrAdmin(req, res, next) {
  if (!req.customer) req.customer = readSession(req, 'customer');
  if (!req.admin) req.admin = readSession(req, 'admin');
  if (!req.customer && !req.admin) {
    return res.status(401).json({
      error: 'Você precisa estar logado em uma conta para realizar esta ação.',
    });
  }
  return next();
}
