/**
 * Armazenamento seguro de senhas e proteção contra força bruta
 * (OWASP A02 - Cryptographic Failures / A07 - Identification and Authentication Failures).
 *
 * - Senhas armazenadas com bcrypt (salt aleatório de 128 bits, custo 12) — nunca em texto puro.
 * - Comparação com hash "dummy" quando o usuário não existe, evitando enumeração por tempo de resposta (Timing Attack).
 * - Comparação de strings sensíveis em tempo constante via crypto.timingSafeEqual.
 * - Bloqueio temporário progressivo da conta/IP após tentativas inválidas consecutivas (mitiga Hydra / Burp Intruder).
 */
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const BCRYPT_COST = 12;
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing-safety-owasp', BCRYPT_COST);

export function isBcryptHash(value) {
  return typeof value === 'string' && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);
}

export async function hashPassword(plain) {
  return bcrypt.hash(String(plain), BCRYPT_COST);
}

export async function verifyPassword(plain, hash) {
  if (typeof plain !== 'string' || plain.length === 0 || Buffer.byteLength(plain, 'utf8') > 72) {
    await bcrypt.compare('invalid-length-padding', DUMMY_HASH);
    return false;
  }
  if (!isBcryptHash(hash)) {
    await bcrypt.compare(plain, DUMMY_HASH);
    return false;
  }
  return bcrypt.compare(plain, hash);
}

export function randomUnguessablePassword() {
  return `${crypto.randomBytes(24).toString('base64url')}A1!`;
}

export function safeCompareStrings(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB) && a.length === b.length;
}

// ---------------------------------------------------------------------------
// Bloqueio progressivo de conta / IP após falhas consecutivas (Anti Brute-Force)
// ---------------------------------------------------------------------------
const MAX_FAILURES = 5;
const BASE_LOCK_MS = 15 * 60 * 1000; // 15 minutos inicial
const failures = new Map(); // key -> { count, lockedUntil, lockCount }

export function isLocked(key) {
  const entry = failures.get(key);
  if (!entry) return 0;
  const remaining = entry.lockedUntil - Date.now();
  return remaining > 0 ? remaining : 0;
}

export function registerFailure(key) {
  const entry = failures.get(key) || { count: 0, lockedUntil: 0, lockCount: 0 };
  entry.count += 1;
  if (entry.count >= MAX_FAILURES) {
    entry.lockCount += 1;
    // Bloqueio progressivo exponencial: 15min, 30min, 60min... (máx. 24h)
    entry.lockedUntil = Date.now() + Math.min(BASE_LOCK_MS * 2 ** (entry.lockCount - 1), 86400000);
    entry.count = 0;
  }
  failures.set(key, entry);
  if (failures.size > 50000) {
    failures.delete(failures.keys().next().value);
  }
}

export function clearFailures(key) {
  failures.delete(key);
}

setInterval(() => {
  const now = Date.now();
  for (const [key, e] of failures) {
    if (e.lockedUntil < now - 86400000) failures.delete(key);
  }
}, 30 * 60 * 1000).unref();
