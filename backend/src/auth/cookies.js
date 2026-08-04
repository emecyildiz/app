const DEFAULT_COOKIE_NAME = 'ratemet_session';

function getCookieName() {
  return process.env.SESSION_COOKIE_NAME || DEFAULT_COOKIE_NAME;
}

function parseCookies(header = '') {
  return header.split(';').reduce((cookies, part) => {
    const separator = part.indexOf('=');
    if (separator < 0) return cookies;

    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (!name) return cookies;

    try {
      cookies[name] = decodeURIComponent(value);
    } catch {
      cookies[name] = value;
    }

    return cookies;
  }, {});
}

function serializeSessionCookie(token, maxAgeSeconds) {
  const secure = process.env.NODE_ENV === 'production';
  const attributes = [
    `${getCookieName()}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`,
  ];

  if (secure) attributes.push('Secure');
  return attributes.join('; ');
}

function clearSessionCookie() {
  return serializeSessionCookie('', 0);
}

function readSessionToken(req) {
  return parseCookies(req.headers.cookie)[getCookieName()] || null;
}

module.exports = {
  clearSessionCookie,
  getCookieName,
  readSessionToken,
  serializeSessionCookie,
};
