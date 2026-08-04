const { query } = require('../config/database');
const { readSessionToken } = require('../auth/cookies');
const { hashToken, safeTokenMatch } = require('../auth/tokens');

async function loadSession(req, _res, next) {
  try {
    const token = readSessionToken(req);
    if (!token) return next();

    const result = await query(
      `SELECT
         s.id AS session_id,
         s.csrf_token_hash,
         s.expires_at,
         u.id,
         u.email,
         u.role,
         u.status,
         u.email_verified_at,
         p.name,
         p.username,
         p.bio,
         p.location,
         p.avatar_url,
         p.social_links,
         p.created_at
       FROM user_sessions s
       JOIN users u ON u.id = s.user_id
       JOIN profiles p ON p.id = u.id
       WHERE s.token_hash = $1
         AND s.expires_at > now()
         AND u.status = 'ACTIVE'
       LIMIT 1`,
      [hashToken(token)],
    );

    if (result.rowCount === 0) return next();

    req.session = {
      id: result.rows[0].session_id,
      csrfTokenHash: result.rows[0].csrf_token_hash,
      expiresAt: result.rows[0].expires_at,
    };
    req.user = {
      id: result.rows[0].id,
      email: result.rows[0].email,
      role: result.rows[0].role,
      emailVerifiedAt: result.rows[0].email_verified_at,
      name: result.rows[0].name,
      username: result.rows[0].username,
      bio: result.rows[0].bio,
      location: result.rows[0].location,
      avatar: result.rows[0].avatar_url,
      socialLinks: result.rows[0].social_links,
      createdAt: result.rows[0].created_at,
    };

    query(
      `UPDATE user_sessions
       SET last_seen_at = now()
       WHERE id = $1 AND last_seen_at < now() - interval '5 minutes'`,
      [req.session.id],
    ).catch(() => {});

    return next();
  } catch (error) {
    return next(error);
  }
}

function requireSession(req, res, next) {
  if (!req.user || !req.session) {
    return res.status(401).json({ error: 'authentication_required' });
  }
  return next();
}

function requireSessionCsrf(req, res, next) {
  if (!req.user || !req.session) {
    return res.status(401).json({ error: 'authentication_required' });
  }

  const token = req.get('x-csrf-token');
  if (!safeTokenMatch(token, req.session.csrfTokenHash)) {
    return res.status(403).json({ error: 'invalid_csrf_token' });
  }

  return next();
}

module.exports = { loadSession, requireSession, requireSessionCsrf };
