const crypto = require('crypto');

function createToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function safeTokenMatch(token, expectedHash) {
  if (!token || !expectedHash) return false;

  const actual = Buffer.from(hashToken(token), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');

  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function hashIpAddress(ipAddress) {
  const secret = process.env.IP_HASH_SECRET;
  if (!secret || !ipAddress) return null;

  return crypto
    .createHmac('sha256', secret)
    .update(String(ipAddress))
    .digest('hex');
}

module.exports = { createToken, hashToken, safeTokenMatch, hashIpAddress };
