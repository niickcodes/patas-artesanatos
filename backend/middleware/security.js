/**
 * Middlewares de Segurança em Camadas (Defesa em Profundidade - OWASP Top 10).
 *
 * Proteções ativas contra ferramentas de pentest (Kali Linux: Nikto, OWASP ZAP, Burp Suite,
 * Hydra, Medusa, SQLMap, Nmap, Gobuster, Slowloris):
 * 1. Helmet (CSP estrito, HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff,
 *    Referrer-Policy, Permissions-Policy, remoção de X-Powered-By e Cache-Control: no-store).
 * 2. CORS restrito exclusivamente às origens autorizadas em config.allowedOrigins.
 * 3. Proteção Anti-CSRF por validação de Origin/Referer e exigência de Content-Type: application/json.
 * 4. Proteção contra HTTP Parameter Pollution (HPP), Prototype Pollution (__proto__) e Null Bytes (\0).
 * 5. Rate Limiting granular (API geral, autenticação/login, escrita e console SQL).
 * 6. Tratamento centralizado de erros sem vazamento de stack traces ou detalhes internos.
 */
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

const allowedOriginsSet = new Set(config.allowedOrigins);

export function isAllowedOrigin(origin) {
  if (!origin) return true;
  const clean = origin.trim().replace(/\/+$/, '');
  if (allowedOriginsSet.has(clean)) return true;
  // Permite localhost / 127.0.0.1 em qualquer porta local em ambiente de desenvolvimento/testes
  if (!config.isProduction && /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(clean)) {
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// 1. Cabeçalhos de Segurança HTTP (OWASP A05 - Security Misconfiguration)
// ---------------------------------------------------------------------------
const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'", 'https://viacep.com.br'],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      ...(config.cookieSecure ? { upgradeInsecureRequests: [] } : {}),
    },
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  dnsPrefetchControl: { allow: false },
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
});

export function securityHeaders(req, res, next) {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  return helmetMiddleware(req, res, next);
}

// ---------------------------------------------------------------------------
// 2. CORS Estrito (OWASP A01 / A05)
// ---------------------------------------------------------------------------
export const corsMiddleware = cors({
  origin(origin, callback) {
    // Permite requisições same-origin / proxy local sem cabeçalho Origin ou origens autorizadas
    if (!origin || isAllowedOrigin(origin)) return callback(null, true);
    const err = new Error('Origem não autorizada pela política de segurança (CORS).');
    err.status = 403;
    return callback(err, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'x-customer-email'],
  maxAge: 600,
});

// ---------------------------------------------------------------------------
// 3. Verificação Anti-CSRF (Origin/Referer + Content-Type JSON obrigatório)
// ---------------------------------------------------------------------------
const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function csrfOriginCheck(req, res, next) {
  if (!STATE_CHANGING_METHODS.has(req.method)) return next();

  const origin = req.get('origin');
  const referer = req.get('referer');

  if (origin && !isAllowedOrigin(origin)) {
    return res.status(403).json({
      error: 'Requisição bloqueada: origem cruzada não autorizada (Anti-CSRF).',
    });
  }

  if (!origin && referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (!isAllowedOrigin(refOrigin)) {
        return res.status(403).json({
          error: 'Requisição bloqueada: referer não autorizado (Anti-CSRF).',
        });
      }
    } catch {
      return res.status(403).json({
        error: 'Requisição bloqueada: cabeçalho Referer malformado.',
      });
    }
  }

  // Exige Content-Type application/json quando há corpo na requisição (impede CSRF via <form>)
  const contentLength = Number(req.get('content-length') || 0);
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && contentLength > 0) {
    const contentType = (req.get('content-type') || '').toLowerCase();
    if (!contentType.includes('application/json')) {
      return res.status(415).json({
        error: 'Tipo de mídia não suportado. Envie os dados como application/json.',
      });
    }
  }

  return next();
}

// ---------------------------------------------------------------------------
// 4. Proteção contra HTTP Parameter Pollution (HPP), Prototype Pollution e Null Bytes
// ---------------------------------------------------------------------------
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const MAX_OBJECT_DEPTH = 6;

function hasMaliciousPayload(value, depth = 0) {
  if (depth > MAX_OBJECT_DEPTH) return true;
  if (typeof value === 'string') {
    return value.includes('\u0000');
  }
  if (Array.isArray(value)) {
    if (value.length > 200) return true;
    return value.some((item) => hasMaliciousPayload(item, depth + 1));
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length > 100) return true;
    for (const k of keys) {
      if (FORBIDDEN_KEYS.has(k) || k.includes('\u0000') || k.startsWith('$')) {
        return true;
      }
      if (hasMaliciousPayload(value[k], depth + 1)) {
        return true;
      }
    }
  }
  return false;
}

export function hppAndPrototypeGuard(req, res, next) {
  if (req.originalUrl && (req.originalUrl.includes('\u0000') || req.originalUrl.includes('%00'))) {
    return res.status(400).json({ error: 'URL contém caracteres nulos inválidos.' });
  }

  // Bloqueia poluição de parâmetros em req.query (ex: ?email[]=a&email[]=b ou ?email[$ne]=1)
  if (req.query && typeof req.query === 'object') {
    for (const [key, val] of Object.entries(req.query)) {
      if (FORBIDDEN_KEYS.has(key) || key.startsWith('$') || typeof val !== 'string' || val.includes('\u0000')) {
        return res.status(400).json({
          error: 'Parâmetros de consulta inválidos ou malformados.',
        });
      }
    }
  }

  if (hasMaliciousPayload(req.params) || hasMaliciousPayload(req.body)) {
    return res.status(400).json({
      error: 'Payload da requisição contém estrutura ou caracteres proibidos.',
    });
  }

  return next();
}

// ---------------------------------------------------------------------------
// 5. Rate Limiters (Mitigação contra Hydra, Burp Intruder, SQLMap e DoS)
// ---------------------------------------------------------------------------
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Limite de requisições excedido. Aguarde um instante antes de tentar novamente.',
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Muitas tentativas de autenticação a partir deste IP. Aguarde 15 minutos.',
  },
});

export const writeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Muitas operações de escrita seguidas. Aguarde alguns minutos.',
  },
});

export const adminSqlLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Limite de consultas administrativas atingido. Aguarde alguns minutos.',
  },
});

// ---------------------------------------------------------------------------
// 6. Tratamento de Rotas Inexistentes (404) e Erros Globais (Sem Stack Trace)
// ---------------------------------------------------------------------------
export function notFoundHandler(req, res) {
  return res.status(404).json({
    error: 'Recurso ou rota não encontrada na API.',
  });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'O tamanho dos dados enviados excede o limite permitido pelo servidor.',
    });
  }

  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      error: 'JSON malformado no corpo da requisição.',
    });
  }

  if (err?.status === 403) {
    return res.status(403).json({
      error: err.message || 'Acesso negado pela política de segurança.',
    });
  }

  console.error('[Security ErrorHandler]', err?.message || err);
  return res.status(500).json({
    error: 'Erro interno no servidor.',
  });
}

