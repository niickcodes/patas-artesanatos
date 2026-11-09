/**
 * Validação e sanitização de entradas (OWASP A03 - Injection / A04 - Insecure Design).
 * Toda entrada do cliente é tratada como NÃO confiável: tipo, tamanho e formato são validados
 * no servidor (lista de permissões), independentemente das validações do frontend.
 */

// Remove caracteres de controle e sinais < > (defesa em profundidade contra XSS armazenado)
export function sanitizeText(value, maxLength = 200) {
  if (value === undefined || value === null) return '';
  return String(value)
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

export function onlyDigits(value, maxLength = 20) {
  return String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, maxLength);
}

const EMAIL_REGEX = /^[a-z0-9._%+-]{1,64}@[a-z0-9.-]{1,180}\.[a-z]{2,24}$/i;

export function normalizeEmail(value) {
  if (typeof value !== 'string') return '';
  const email = value.trim().toLowerCase();
  if (email.length > 180 || !EMAIL_REGEX.test(email)) return '';
  return email;
}

export function isValidCpf(rawCpf) {
  const cpf = onlyDigits(rawCpf, 11);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (len) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

export function formatCpf(digits) {
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

export const BRAZIL_UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export function toSafeInt(value, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) return null;
  return n;
}

export function toSafeMoney(value, { min = 0, max = 99999.99 } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return Math.round(n * 100) / 100;
}

/**
 * Política de senha (OWASP ASVS V2.1): 8 a 64 caracteres, contendo letras e números.
 * Retorna mensagem de erro ou null se a senha for aceita.
 */
const COMMON_PASSWORDS = new Set([
  '12345678', '123456789', '1234567890', 'password', 'password1', 'senha123', 'senha1234',
  'qwerty123', 'abc12345', '11111111', '00000000', 'admin123', 'iloveyou1', 'mudar123',
]);

export function validatePasswordPolicy(password) {
  if (typeof password !== 'string' || !password) {
    return 'Informe uma senha válida.';
  }
  if (password.length < 8) {
    return 'A senha deve ter no mínimo 8 caracteres.';
  }
  if (Buffer.byteLength(password, 'utf8') > 64) {
    return 'A senha deve ter no máximo 64 caracteres.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'A senha deve conter pelo menos 1 letra maiúscula.';
  }
  if (!/[a-z]/.test(password)) {
    return 'A senha deve conter pelo menos 1 letra minúscula.';
  }
  if (!/\d/.test(password)) {
    return 'A senha deve conter pelo menos 1 número.';
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    return 'A senha deve conter pelo menos 1 caractere especial (como @, #, $, %, etc.).';
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return 'Esta senha é muito comum. Escolha uma senha mais forte.';
  }
  return null;
}

/**
 * Valida imagens de produto: apenas caminhos internos /images/*.jpg|png|webp
 * ou Data URLs base64 de PNG/JPEG/WEBP/GIF (assinatura binária conferida, máx. ~1.5MB).
 * SVG é bloqueado por poder conter scripts.
 */
const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;
const IMAGE_SIGNATURES = {
  'image/png': (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/gif': (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46,
  'image/webp': (b) =>
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
};

export function validateProductImage(image) {
  if (image === undefined || image === null || image === '') return { ok: true, value: null };
  if (typeof image !== 'string') return { ok: false };

  if (/^\/images\/[a-zA-Z0-9_-]{1,80}\.(jpg|jpeg|png|webp)$/.test(image)) {
    return { ok: true, value: image };
  }

  const match = /^data:(image\/(?:png|jpeg|gif|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(image);
  if (!match) return { ok: false };
  const [, mime, b64] = match;
  const buffer = Buffer.from(b64, 'base64');
  if (buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES) return { ok: false, tooLarge: true };
  if (!IMAGE_SIGNATURES[mime](buffer)) return { ok: false };
  return { ok: true, value: image };
}

