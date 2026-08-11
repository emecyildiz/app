const express = require('express');
const rateLimit = require('express-rate-limit');

const { query, withTransaction } = require('../config/database');
const { loadSession, requireSession, requireSessionCsrf } = require('../middleware/sessionAuth');

const router = express.Router();
router.use(loadSession);

const reportCategories = new Set([
  'spam',
  'harassment',
  'inappropriate_content',
  'impersonation',
  'other',
]);

const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.user.id,
  message: { error: 'too_many_reports' },
});

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function pagination(input) {
  const page = Math.max(1, Number.parseInt(input.page || '1', 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(input.limit || '20', 10) || 20));
  return { page, limit };
}

function requestError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

router.get('/blocks', requireSession, async (req, res, next) => {
  try {
    const { page, limit } = pagination(req.query);
    const countResult = await query(
      'SELECT count(*)::int AS count FROM user_blocks WHERE blocker_user_id = $1',
      [req.user.id],
    );
    const totalCount = countResult.rows[0].count;
    const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / limit);
    const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages);
    const offset = (currentPage - 1) * limit;
    const result = await query(
      `SELECT ub.blocked_user_id AS id, ub.created_at AS blocked_at,
              p.username, p.name, p.avatar_url AS avatar
       FROM user_blocks ub
       JOIN profiles p ON p.id = ub.blocked_user_id
       WHERE ub.blocker_user_id = $1
       ORDER BY ub.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset],
    );
    return res.json({ items: result.rows, currentPage, totalPages, totalCount });
  } catch (error) {
    return next(error);
  }
});

router.post('/blocks', requireSessionCsrf, async (req, res, next) => {
  try {
    const blockedUserId = String(req.body?.userId || '');
    if (!isUuid(blockedUserId) || blockedUserId === req.user.id) {
      return res.status(400).json({ error: 'invalid_block_target' });
    }

    const created = await withTransaction(async (client) => {
      const target = await client.query(
        "SELECT 1 FROM users WHERE id = $1 AND status = 'ACTIVE'",
        [blockedUserId],
      );
      if (target.rowCount === 0) {
        throw requestError(404, 'user_not_found', 'The selected user was not found.');
      }

      const block = await client.query(
        `INSERT INTO user_blocks (blocker_user_id, blocked_user_id)
         VALUES ($1, $2)
         ON CONFLICT (blocker_user_id, blocked_user_id) DO NOTHING
         RETURNING blocker_user_id`,
        [req.user.id, blockedUserId],
      );
      await client.query(
        `DELETE FROM friendships
         WHERE (from_user_id = $1 AND to_user_id = $2)
            OR (from_user_id = $2 AND to_user_id = $1)`,
        [req.user.id, blockedUserId],
      );
      return block.rowCount > 0;
    });

    return res.status(created ? 201 : 200).json({ success: true, created });
  } catch (error) {
    return next(error);
  }
});

router.delete('/blocks/:userId', requireSessionCsrf, async (req, res, next) => {
  try {
    if (!isUuid(req.params.userId)) return res.status(400).json({ error: 'invalid_block_target' });
    const result = await query(
      `DELETE FROM user_blocks
       WHERE blocker_user_id = $1 AND blocked_user_id = $2
       RETURNING blocked_user_id`,
      [req.user.id, req.params.userId],
    );
    return res.json({ success: true, removed: result.rowCount > 0 });
  } catch (error) {
    return next(error);
  }
});

router.get('/reports', requireSession, async (req, res, next) => {
  try {
    const { page, limit } = pagination(req.query);
    const countResult = await query(
      'SELECT count(*)::int AS count FROM user_reports WHERE reporter_user_id = $1',
      [req.user.id],
    );
    const totalCount = countResult.rows[0].count;
    const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / limit);
    const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages);
    const offset = (currentPage - 1) * limit;
    const result = await query(
      `SELECT ur.id, ur.category, ur.status, ur.created_at, ur.updated_at,
              json_build_object(
                'id', p.id,
                'username', p.username,
                'name', p.name,
                'avatar', p.avatar_url
              ) AS reported_user
       FROM user_reports ur
       JOIN profiles p ON p.id = ur.reported_user_id
       WHERE ur.reporter_user_id = $1
       ORDER BY ur.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset],
    );
    return res.json({ items: result.rows, currentPage, totalPages, totalCount });
  } catch (error) {
    return next(error);
  }
});

router.post('/reports', requireSessionCsrf, reportLimiter, async (req, res, next) => {
  try {
    const reportedUserId = String(req.body?.userId || '');
    const category = String(req.body?.category || '').trim().toLowerCase();
    const details = String(req.body?.details || '').trim();
    if (!isUuid(reportedUserId) || reportedUserId === req.user.id) {
      return res.status(400).json({ error: 'invalid_report_target' });
    }
    if (!reportCategories.has(category)) return res.status(400).json({ error: 'invalid_report_category' });
    if (details.length < 10 || details.length > 2000) {
      return res.status(400).json({ error: 'invalid_report_details' });
    }

    const report = await withTransaction(async (client) => {
      await client.query('SELECT 1 FROM users WHERE id = $1 FOR UPDATE', [req.user.id]);
      const target = await client.query(
        "SELECT 1 FROM users WHERE id = $1 AND status = 'ACTIVE'",
        [reportedUserId],
      );
      if (target.rowCount === 0) {
        throw requestError(404, 'user_not_found', 'The selected user was not found.');
      }

      const recentCount = await client.query(
        `SELECT count(*)::int AS count
         FROM user_reports
         WHERE reporter_user_id = $1
           AND created_at > now() - interval '24 hours'`,
        [req.user.id],
      );
      if (recentCount.rows[0].count >= 5) {
        throw requestError(429, 'daily_report_limit_reached', 'The daily report limit has been reached.');
      }

      const duplicate = await client.query(
        `SELECT 1 FROM user_reports
         WHERE reporter_user_id = $1
           AND reported_user_id = $2
           AND category = $3
           AND created_at > now() - interval '24 hours'
         LIMIT 1`,
        [req.user.id, reportedUserId, category],
      );
      if (duplicate.rowCount > 0) {
        throw requestError(409, 'duplicate_recent_report', 'A matching report was already submitted recently.');
      }

      const result = await client.query(
        `INSERT INTO user_reports (reporter_user_id, reported_user_id, category, details)
         VALUES ($1, $2, $3, $4)
         RETURNING id, category, status, created_at`,
        [req.user.id, reportedUserId, category, details],
      );
      return result.rows[0];
    });

    return res.status(201).json({ success: true, report });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
