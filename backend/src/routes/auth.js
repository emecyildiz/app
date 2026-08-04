const express = require('express');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');

const { query, withTransaction } = require('../config/database');
const { clearSessionCookie, readSessionToken, serializeSessionCookie } = require('../auth/cookies');
const { createToken, hashIpAddress, hashToken } = require('../auth/tokens');
const { normalizeEmail, normalizeUsername, validatePassword, validateRegistration } = require('../auth/validation');
const { loadSession, requireSession, requireSessionCsrf } = require('../middleware/sessionAuth');
const { sendPasswordResetEmail, sendVerificationEmail } = require('../services/emailService');

const router = express.Router();
const BCRYPT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'too_many_authentication_requests' },
});

const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'too_many_password_requests' },
});

router.use(authLimiter);
router.use(loadSession);

function sessionTtlSeconds() {
  const days = Number.parseInt(process.env.SESSION_TTL_DAYS || '14', 10);
  return Math.max(1, Math.min(days, 30)) * 24 * 60 * 60;
}

function emailVerificationRequired() {
  return String(process.env.AUTH_REQUIRE_EMAIL_VERIFICATION || 'true').toLowerCase() !== 'false';
}

async function createSession(userId, req) {
  const sessionToken = createToken();
  const csrfToken = createToken();
  const ttlSeconds = sessionTtlSeconds();

  await query(
    `INSERT INTO user_sessions
       (user_id, token_hash, csrf_token_hash, expires_at, user_agent, ip_hash)
     VALUES ($1, $2, $3, now() + ($4 * interval '1 second'), $5, $6)`,
    [
      userId,
      hashToken(sessionToken),
      hashToken(csrfToken),
      ttlSeconds,
      String(req.get('user-agent') || '').slice(0, 512) || null,
      hashIpAddress(req.ip),
    ],
  );

  return { csrfToken, sessionToken, ttlSeconds };
}

async function issueUserToken(client, userId, purpose, lifetimeSql) {
  const token = createToken();
  await client.query(
    `DELETE FROM user_tokens
     WHERE user_id = $1 AND purpose = $2 AND consumed_at IS NULL`,
    [userId, purpose],
  );
  await client.query(
    `INSERT INTO user_tokens (user_id, purpose, token_hash, expires_at)
     VALUES ($1, $2, $3, now() + ${lifetimeSql})`,
    [userId, purpose, hashToken(token)],
  );
  return token;
}

router.post('/register', async (req, res, next) => {
  try {
    const validation = validateRegistration(req.body);
    if (validation.error) {
      return res.status(400).json({ error: 'invalid_registration', message: validation.error });
    }

    const { email, username, name, password } = validation.value;
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const requireVerification = emailVerificationRequired();

    const result = await withTransaction(async (client) => {
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, email_verified_at)
         VALUES ($1, $2, CASE WHEN $3 THEN NULL ELSE now() END)
         RETURNING id`,
        [email, passwordHash, requireVerification],
      );
      const userId = userResult.rows[0].id;

      await client.query(
        `INSERT INTO profiles (id, username, name)
         VALUES ($1, $2, $3)`,
        [userId, username, name],
      );

      const verificationToken = requireVerification
        ? await issueUserToken(client, userId, 'EMAIL_VERIFICATION', "interval '24 hours'")
        : null;

      return { userId, verificationToken };
    });

    if (result.verificationToken) {
      try {
        await sendVerificationEmail(email, result.verificationToken);
      } catch (error) {
        console.error('Verification email delivery failed:', error.code || error.message);
        return res.status(503).json({
          error: 'verification_email_unavailable',
          message: 'The account was created, but the verification email could not be sent. Try resending it later.',
        });
      }
    }

    return res.status(201).json({
      success: true,
      emailVerificationRequired: Boolean(result.verificationToken),
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'registration_unavailable',
        message: 'The email address or username is unavailable.',
      });
    }
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email || req.body?.username);
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({ error: 'email_and_password_required' });
    }

    const result = await query(
      `SELECT u.id, u.email, u.password_hash, u.role, u.status,
              u.email_verified_at, u.failed_login_attempts, u.locked_until,
              p.name, p.username, p.bio, p.location, p.avatar_url, p.social_links, p.created_at
       FROM users u
       JOIN profiles p ON p.id = u.id
       WHERE u.email = $1
       LIMIT 1`,
      [email],
    );

    const account = result.rows[0];
    const passwordMatches = account
      ? await bcrypt.compare(password, account.password_hash)
      : await bcrypt.compare(password, '$2a$12$u1nOCpKJKmF2h4jJqBVr1OGf5Y7KqkW4rKqVv3.83F9kJ8SgXUMye');

    if (!account || !passwordMatches) {
      if (account) {
        await query(
          `UPDATE users
           SET failed_login_attempts = failed_login_attempts + 1,
               locked_until = CASE
                 WHEN failed_login_attempts + 1 >= $2 THEN now() + ($3 * interval '1 minute')
                 ELSE locked_until
               END
           WHERE id = $1`,
          [account.id, MAX_LOGIN_ATTEMPTS, LOCK_MINUTES],
        );
      }
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    if (account.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'account_unavailable' });
    }
    if (account.locked_until && new Date(account.locked_until) > new Date()) {
      return res.status(429).json({ error: 'account_temporarily_locked' });
    }
    if (emailVerificationRequired() && !account.email_verified_at) {
      return res.status(403).json({ error: 'email_verification_required' });
    }

    await query(
      `UPDATE users
       SET failed_login_attempts = 0, locked_until = NULL, last_login_at = now()
       WHERE id = $1`,
      [account.id],
    );

    const session = await createSession(account.id, req);
    res.setHeader('Set-Cookie', serializeSessionCookie(session.sessionToken, session.ttlSeconds));

    return res.json({
      success: true,
      csrfToken: session.csrfToken,
      user: {
        id: account.id,
        email: account.email,
        role: account.role,
        name: account.name,
        username: account.username,
        bio: account.bio,
        location: account.location,
        avatar: account.avatar_url,
        socialLinks: account.social_links,
        createdAt: account.created_at,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/session', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'authentication_required' });
  return res.json({ user: req.user });
});

router.get('/csrf', requireSession, async (req, res, next) => {
  try {
    const csrfToken = createToken();
    await query(
      'UPDATE user_sessions SET csrf_token_hash = $1 WHERE id = $2',
      [hashToken(csrfToken), req.session.id],
    );
    return res.json({ csrfToken });
  } catch (error) {
    return next(error);
  }
});

router.patch('/profile', requireSessionCsrf, async (req, res, next) => {
  try {
    const name = req.body?.name === undefined ? undefined : String(req.body.name).trim();
    const username = req.body?.username === undefined ? undefined : normalizeUsername(req.body.username);
    const bio = req.body?.bio === undefined ? undefined : String(req.body.bio).trim();
    const location = req.body?.location === undefined ? undefined : String(req.body.location).trim();
    const avatarUrl = req.body?.avatarUrl === undefined ? undefined : String(req.body.avatarUrl).trim();
    const socialLinks = req.body?.socialLinks;

    if (name !== undefined && (name.length < 2 || name.length > 120)) {
      return res.status(400).json({ error: 'invalid_profile', message: 'Name must contain between 2 and 120 characters.' });
    }
    if (username !== undefined && !/^[a-z0-9_]{3,32}$/.test(username)) {
      return res.status(400).json({ error: 'invalid_profile', message: 'Username must be 3-32 characters and use lowercase letters, numbers, or underscores.' });
    }
    if (bio !== undefined && bio.length > 1000) {
      return res.status(400).json({ error: 'invalid_profile', message: 'Bio must not exceed 1,000 characters.' });
    }
    if (location !== undefined && location.length > 120) {
      return res.status(400).json({ error: 'invalid_profile', message: 'Location must not exceed 120 characters.' });
    }
    if (avatarUrl !== undefined && avatarUrl.length > 2048) {
      return res.status(400).json({ error: 'invalid_profile', message: 'Avatar URL is too long.' });
    }
    if (avatarUrl && !avatarUrl.startsWith('/') && !/^https:\/\//i.test(avatarUrl)) {
      return res.status(400).json({ error: 'invalid_profile', message: 'Avatar URL must use HTTPS or a local path.' });
    }
    if (socialLinks !== undefined) {
      if (!socialLinks || typeof socialLinks !== 'object' || Array.isArray(socialLinks)) {
        return res.status(400).json({ error: 'invalid_profile', message: 'Social links must be an object.' });
      }
      const serialized = JSON.stringify(socialLinks);
      const invalidValue = Object.values(socialLinks).some((value) => typeof value !== 'string' || value.length > 200);
      if (serialized.length > 2000 || invalidValue) {
        return res.status(400).json({ error: 'invalid_profile', message: 'Social links contain an invalid value.' });
      }
    }

    const result = await query(
      `UPDATE profiles
       SET name = COALESCE($2, name),
           username = COALESCE($3, username),
           bio = COALESCE($4, bio),
           location = COALESCE($5, location),
           avatar_url = COALESCE($6, avatar_url),
           social_links = COALESCE($7::jsonb, social_links),
           updated_at = now()
       WHERE id = $1
       RETURNING id, name, username, bio, location, avatar_url, social_links, created_at`,
      [
        req.user.id,
        name,
        username,
        bio,
        location,
        avatarUrl,
        socialLinks === undefined ? undefined : JSON.stringify(socialLinks),
      ],
    );

    return res.json({ profile: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'username_unavailable', message: 'That username is unavailable.' });
    }
    return next(error);
  }
});

router.post('/logout', requireSessionCsrf, async (req, res, next) => {
  try {
    await query('DELETE FROM user_sessions WHERE id = $1', [req.session.id]);
    res.setHeader('Set-Cookie', clearSessionCookie());
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

router.post('/verify-email', async (req, res, next) => {
  try {
    const tokenHash = hashToken(req.body?.token || '');
    const result = await withTransaction(async (client) => {
      const tokenResult = await client.query(
        `SELECT id, user_id
         FROM user_tokens
         WHERE token_hash = $1
           AND purpose = 'EMAIL_VERIFICATION'
           AND consumed_at IS NULL
           AND expires_at > now()
         FOR UPDATE`,
        [tokenHash],
      );
      if (tokenResult.rowCount === 0) return false;

      const tokenRow = tokenResult.rows[0];
      await client.query('UPDATE users SET email_verified_at = now() WHERE id = $1', [tokenRow.user_id]);
      await client.query('UPDATE user_tokens SET consumed_at = now() WHERE id = $1', [tokenRow.id]);
      return true;
    });

    if (!result) return res.status(400).json({ error: 'invalid_or_expired_token' });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

router.post('/resend-verification', passwordLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const result = await query(
      `SELECT id FROM users
       WHERE email = $1 AND status = 'ACTIVE' AND email_verified_at IS NULL
       LIMIT 1`,
      [email],
    );

    if (result.rowCount > 0) {
      const token = await withTransaction((client) =>
        issueUserToken(client, result.rows[0].id, 'EMAIL_VERIFICATION', "interval '24 hours'"),
      );
      await sendVerificationEmail(email, token);
    }

    return res.json({ success: true });
  } catch (error) {
    if (error.code === 'email_not_configured' || error.code === 'email_delivery_failed') {
      return res.status(503).json({ error: 'email_delivery_unavailable' });
    }
    return next(error);
  }
});

router.post('/forgot-password', passwordLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const result = await query(
      `SELECT id FROM users
       WHERE email = $1 AND status = 'ACTIVE'
       LIMIT 1`,
      [email],
    );

    if (result.rowCount > 0) {
      const token = await withTransaction((client) =>
        issueUserToken(client, result.rows[0].id, 'PASSWORD_RESET', "interval '1 hour'"),
      );
      await sendPasswordResetEmail(email, token);
    }

    return res.json({ success: true });
  } catch (error) {
    if (error.code === 'email_not_configured' || error.code === 'email_delivery_failed') {
      return res.status(503).json({ error: 'email_delivery_unavailable' });
    }
    return next(error);
  }
});

router.post('/reset-password', passwordLimiter, async (req, res, next) => {
  try {
    const passwordError = validatePassword(req.body?.password);
    if (passwordError) {
      return res.status(400).json({ error: 'invalid_password', message: passwordError });
    }

    const tokenHash = hashToken(req.body?.token || '');
    const passwordHash = await bcrypt.hash(req.body.password, BCRYPT_ROUNDS);
    const changed = await withTransaction(async (client) => {
      const tokenResult = await client.query(
        `SELECT id, user_id
         FROM user_tokens
         WHERE token_hash = $1
           AND purpose = 'PASSWORD_RESET'
           AND consumed_at IS NULL
           AND expires_at > now()
         FOR UPDATE`,
        [tokenHash],
      );
      if (tokenResult.rowCount === 0) return false;

      const tokenRow = tokenResult.rows[0];
      await client.query(
        `UPDATE users
         SET password_hash = $1, failed_login_attempts = 0, locked_until = NULL
         WHERE id = $2`,
        [passwordHash, tokenRow.user_id],
      );
      await client.query('DELETE FROM user_sessions WHERE user_id = $1', [tokenRow.user_id]);
      await client.query('UPDATE user_tokens SET consumed_at = now() WHERE id = $1', [tokenRow.id]);
      return true;
    });

    if (!changed) return res.status(400).json({ error: 'invalid_or_expired_token' });
    res.setHeader('Set-Cookie', clearSessionCookie());
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

router.delete('/account', requireSessionCsrf, async (req, res, next) => {
  try {
    await withTransaction(async (client) => {
      await client.query(
        `UPDATE users
         SET status = 'DELETED', email = concat('deleted+', id, '@invalid.local')
         WHERE id = $1`,
        [req.user.id],
      );
      await client.query(
        `UPDATE profiles
         SET username = concat('deleted_', left(replace(id::text, '-', ''), 16)),
             name = 'Deleted User',
             bio = NULL,
             location = NULL,
             avatar_url = NULL,
             social_links = '{}'::jsonb
         WHERE id = $1`,
        [req.user.id],
      );
      await client.query('DELETE FROM user_sessions WHERE user_id = $1', [req.user.id]);
      await client.query('DELETE FROM user_tokens WHERE user_id = $1', [req.user.id]);
    });
    res.setHeader('Set-Cookie', clearSessionCookie());
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
