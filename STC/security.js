const crypto = require('crypto');

function keyFromEnv(name) {
  const value = process.env[name] || '';
  if (!/^[a-fA-F0-9]{64}$/.test(value)) {
    throw new Error(`${name} must be a 64-character hex string (32 bytes).`);
  }
  return Buffer.from(value, 'hex');
}

function normalizeName(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // Arabic diacritics and tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[ى]/g, 'ي')
    .replace(/[ؤ]/g, 'و')
    .replace(/[ئ]/g, 'ي')
    .replace(/[ء]/g, '')
    .replace(/[\s\u00A0]+/g, '')
    .toLowerCase();
}

function validNationalId(value) {
  return /^\d{14}$/.test(String(value ?? ''));
}

function hashNationalId(value) {
  return crypto.createHmac('sha256', keyFromEnv('NATIONAL_ID_HMAC_KEY'))
    .update(String(value))
    .digest('hex');
}

function encryptPassword(value) {
  const key = keyFromEnv('PASSWORD_ENCRYPTION_KEY');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join('.');
}

function decryptPassword(payload) {
  const key = keyFromEnv('PASSWORD_ENCRYPTION_KEY');
  const parts = String(payload).split('.');
  if (parts.length !== 3) throw new Error('Invalid encrypted payload.');
  const [ivB64, tagB64, dataB64] = parts;
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final()
  ]).toString('utf8');
}

module.exports = { normalizeName, validNationalId, hashNationalId, encryptPassword, decryptPassword };
