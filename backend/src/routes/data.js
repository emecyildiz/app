const express = require('express');
const bcrypt = require('bcryptjs');

const { query, withTransaction } = require('../config/database');
const { normalizeEmail, normalizeUsername, validateRegistration } = require('../auth/validation');
const { loadSession, requireSession, requireSessionCsrf } = require('../middleware/sessionAuth');

const router = express.Router();
router.use(loadSession);

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !req.session) return res.status(401).json({ error: 'authentication_required' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'forbidden' });
    return next();
  };
}

function positiveInteger(value, field = 'id') {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    const error = new Error(`${field} must be a positive integer.`);
    error.status = 400;
    error.code = 'invalid_identifier';
    throw error;
  }
  return parsed;
}

function pagination(input) {
  const page = Math.max(1, Number.parseInt(input.page || '1', 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(input.limit || '20', 10) || 20));
  return { page, limit, offset: (page - 1) * limit };
}

function escapeLikePattern(value) {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

function serializeSocialLinks(value) {
  if (value === undefined) return undefined;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    const error = new Error('Social links must be an object.');
    error.status = 400;
    error.code = 'invalid_social_links';
    throw error;
  }

  const serialized = JSON.stringify(value);
  const invalidValue = Object.values(value).some((entry) => typeof entry !== 'string' || entry.length > 200);
  if (serialized.length > 2000 || invalidValue) {
    const error = new Error('Social links contain an invalid value.');
    error.status = 400;
    error.code = 'invalid_social_links';
    throw error;
  }
  return serialized;
}

async function ensureMovie(db, input) {
  const id = positiveInteger(input?.id ?? input?.movieId, 'movieId');
  const title = String(input?.title || input?.movieTitle || `Movie #${id}`).trim().slice(0, 300);
  const posterPath = input?.posterPath == null ? null : String(input.posterPath).trim().slice(0, 500);
  const result = await db.query(
    `INSERT INTO movies (id, tmdb_id, title, poster_path)
     VALUES ($1, $1, $2, $3)
     ON CONFLICT (id) DO UPDATE
       SET title = EXCLUDED.title,
           poster_path = COALESCE(EXCLUDED.poster_path, movies.poster_path)
     RETURNING id, tmdb_id, title, poster_path, created_at, updated_at`,
    [id, title || `Movie #${id}`, posterPath],
  );
  return result.rows[0];
}

async function profileVisibility(targetUserId, viewerUserId) {
  if (targetUserId === viewerUserId) return true;
  const result = await query(
    `SELECT
       COALESCE(p.social_links->>'privacy', 'public') AS privacy,
       EXISTS (
         SELECT 1 FROM friendships f
         WHERE f.status = 'accepted'
           AND ((f.from_user_id = $1 AND f.to_user_id = $2)
             OR (f.from_user_id = $2 AND f.to_user_id = $1))
       ) AS friends
     FROM profiles p
     WHERE p.id = $1`,
    [targetUserId, viewerUserId || null],
  );
  if (result.rowCount === 0) return false;
  return result.rows[0].privacy !== 'private' || result.rows[0].friends;
}

router.post('/movies/ensure', requireSessionCsrf, async (req, res, next) => {
  try {
    const movie = await ensureMovie({ query }, req.body);
    return res.json({ success: true, movie });
  } catch (error) {
    return next(error);
  }
});

router.get('/users/search', requireSession, async (req, res, next) => {
  try {
    const search = String(req.query.q || '').trim();
    if (search.length < 2) return res.json([]);
    const limit = Math.min(20, Math.max(1, Number.parseInt(req.query.limit || '10', 10) || 10));
    const pattern = `%${escapeLikePattern(search.slice(0, 100))}%`;
    const result = await query(
      `SELECT p.id, p.username, p.name, p.avatar_url AS avatar, u.role
       FROM profiles p
       JOIN users u ON u.id = p.id
       WHERE u.status = 'ACTIVE'
         AND (p.username ILIKE $1 ESCAPE '\\' OR p.name ILIKE $1 ESCAPE '\\')
       ORDER BY CASE WHEN lower(p.username::text) = lower($2) THEN 0 ELSE 1 END, p.username
       LIMIT $3`,
      [pattern, search, limit],
    );
    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
});

router.get('/users/public/:identifier', async (req, res, next) => {
  try {
    const result = await query(
      `WITH target AS (
         SELECT p.id, p.username, p.name, p.bio, p.location, p.avatar_url,
                p.social_links, p.created_at, u.role,
                COALESCE(p.social_links->>'privacy', 'public') <> 'private' AS is_public
         FROM profiles p
         JOIN users u ON u.id = p.id
         WHERE u.status = 'ACTIVE'
           AND (lower(p.username::text) = lower($1) OR p.id::text = $1)
         LIMIT 1
       ), visible AS (
         SELECT target.*,
                 COALESCE((target.is_public
                   OR target.id = $2::uuid
                   OR EXISTS (
                     SELECT 1 FROM friendships f
                     WHERE f.status = 'accepted'
                       AND ((f.from_user_id = target.id AND f.to_user_id = $2::uuid)
                         OR (f.from_user_id = $2::uuid AND f.to_user_id = target.id))
                   )), false) AS can_view_details
         FROM target
       )
       SELECT id, username, name, role,
              is_public AS "isPublic",
              can_view_details AS "canViewDetails",
              CASE WHEN can_view_details THEN bio ELSE NULL END AS bio,
              CASE WHEN can_view_details THEN location ELSE NULL END AS location,
              CASE WHEN can_view_details THEN avatar_url ELSE NULL END AS avatar,
              CASE WHEN can_view_details THEN social_links - 'privacy' ELSE '{}'::jsonb END AS "socialLinks",
              CASE WHEN can_view_details THEN created_at ELSE NULL END AS "memberSince",
              CASE WHEN can_view_details THEN json_build_object(
                'watchedMovies', (SELECT count(*)::int FROM watched_movies WHERE user_id = visible.id),
                'ratings', (SELECT count(*)::int FROM ratings WHERE user_id = visible.id),
                'favorites', (SELECT count(*)::int FROM favorites WHERE user_id = visible.id)
              ) ELSE NULL END AS stats
       FROM visible`,
      [String(req.params.identifier), req.user?.id || null],
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'profile_not_found' });
    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.get('/users/privacy/:identifier', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT COALESCE(p.social_links->>'privacy', 'public') <> 'private' AS "isPublic"
       FROM profiles p
       WHERE lower(p.username::text) = lower($1) OR p.id::text = $1
       LIMIT 1`,
      [String(req.params.identifier)],
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'profile_not_found' });
    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.get('/users/stats', requireSession, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         (SELECT count(*)::int FROM watched_movies WHERE user_id = $1) AS "watchedMovies",
         (SELECT count(*)::int FROM ratings WHERE user_id = $1) AS "ratingsCount",
         (SELECT count(*)::int FROM comments WHERE user_id = $1) AS "commentsCount",
         (SELECT count(*)::int FROM favorites WHERE user_id = $1) AS "favoritesCount",
         u.created_at AS "memberSince",
         floor(extract(epoch FROM (now() - u.created_at)) / 86400)::int AS "memberSinceDays"
       FROM users u WHERE u.id = $1`,
      [req.user.id],
    );
    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.post('/users/activity', requireSessionCsrf, async (req, res, next) => {
  try {
    await query('UPDATE profiles SET last_active_at = now() WHERE id = $1', [req.user.id]);
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

router.post('/favorites', requireSessionCsrf, async (req, res, next) => {
  try {
    const movie = await withTransaction(async (client) => {
      const savedMovie = await ensureMovie(client, req.body);
      await client.query(
        `INSERT INTO favorites (user_id, movie_id) VALUES ($1, $2)
         ON CONFLICT (user_id, movie_id) DO NOTHING`,
        [req.user.id, savedMovie.id],
      );
      return savedMovie;
    });
    return res.json({ success: true, movieId: Number(movie.id) });
  } catch (error) {
    return next(error);
  }
});

router.delete('/favorites/:movieId', requireSessionCsrf, async (req, res, next) => {
  try {
    const movieId = positiveInteger(req.params.movieId, 'movieId');
    await query('DELETE FROM favorites WHERE user_id = $1 AND movie_id = $2', [req.user.id, movieId]);
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

router.get('/users/:userId/favorites', requireSession, async (req, res, next) => {
  try {
    const targetUserId = req.params.userId === 'me' ? req.user.id : req.params.userId;
    if (!(await profileVisibility(targetUserId, req.user.id))) return res.status(403).json({ error: 'profile_private' });
    const { page, limit, offset } = pagination(req.query);
    const [items, count] = await Promise.all([
      query('SELECT movie_id FROM favorites WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [targetUserId, limit, offset]),
      query('SELECT count(*)::int AS count FROM favorites WHERE user_id = $1', [targetUserId]),
    ]);
    return res.json({
      items: items.rows.map((row) => Number(row.movie_id)),
      currentPage: page,
      totalPages: Math.ceil(count.rows[0].count / limit),
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/ratings', requireSessionCsrf, async (req, res, next) => {
  try {
    const rating = Number(req.body?.rating);
    if (!Number.isFinite(rating) || rating < 0 || rating > 10) {
      return res.status(400).json({ error: 'invalid_rating', message: 'Rating must be between 0 and 10.' });
    }
    const comment = String(req.body?.comment || '').trim();
    if (comment.length > 2000) return res.status(400).json({ error: 'comment_too_long' });
    const row = await withTransaction(async (client) => {
      const movie = await ensureMovie(client, req.body.movie || req.body);
      const result = await client.query(
        `INSERT INTO ratings (user_id, movie_id, rating, comment)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, movie_id) DO UPDATE
           SET rating = EXCLUDED.rating, comment = EXCLUDED.comment
         RETURNING *`,
        [req.user.id, movie.id, rating, comment || null],
      );
      return result.rows[0];
    });
    return res.json({ success: true, data: row });
  } catch (error) {
    return next(error);
  }
});

router.patch('/ratings/:movieId/comment', requireSessionCsrf, async (req, res, next) => {
  try {
    const movieId = positiveInteger(req.params.movieId, 'movieId');
    const comment = String(req.body?.comment || '').trim();
    if (comment.length > 2000) return res.status(400).json({ error: 'comment_too_long' });
    await withTransaction(async (client) => {
      await ensureMovie(client, { ...(req.body.movie || {}), id: movieId });
      await client.query(
        `INSERT INTO ratings (user_id, movie_id, comment)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, movie_id) DO UPDATE SET comment = EXCLUDED.comment`,
        [req.user.id, movieId, comment || null],
      );
    });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

router.get('/ratings/me', requireSession, async (req, res, next) => {
  try {
    const { page, limit, offset } = pagination(req.query);
    const [items, count] = await Promise.all([
      query(
        `SELECT r.*, json_build_object(
           'id', m.id, 'tmdb_id', m.tmdb_id, 'title', m.title, 'poster_path', m.poster_path
         ) AS movie
         FROM ratings r JOIN movies m ON m.id = r.movie_id
         WHERE r.user_id = $1 ORDER BY r.created_at DESC LIMIT $2 OFFSET $3`,
        [req.user.id, limit, offset],
      ),
      query('SELECT count(*)::int AS count FROM ratings WHERE user_id = $1', [req.user.id]),
    ]);
    return res.json({ ratings: items.rows, currentPage: page, totalPages: Math.ceil(count.rows[0].count / limit) });
  } catch (error) {
    return next(error);
  }
});

router.get('/users/:userId/ratings', requireSession, async (req, res, next) => {
  try {
    const targetUserId = req.params.userId === 'me' ? req.user.id : req.params.userId;
    if (!(await profileVisibility(targetUserId, req.user.id))) return res.status(403).json({ error: 'profile_private' });
    const { page, limit, offset } = pagination(req.query);
    const [items, count] = await Promise.all([
      query(
        `SELECT r.*, json_build_object(
           'id', m.id, 'tmdb_id', m.tmdb_id, 'title', m.title, 'poster_path', m.poster_path
         ) AS movie
         FROM ratings r JOIN movies m ON m.id = r.movie_id
         WHERE r.user_id = $1 ORDER BY r.created_at DESC LIMIT $2 OFFSET $3`,
        [targetUserId, limit, offset],
      ),
      query('SELECT count(*)::int AS count FROM ratings WHERE user_id = $1', [targetUserId]),
    ]);
    return res.json({ items: items.rows, currentPage: page, totalPages: Math.ceil(count.rows[0].count / limit) });
  } catch (error) {
    return next(error);
  }
});

router.get('/ratings/movie/:movieId', requireSession, async (req, res, next) => {
  try {
    const movieId = positiveInteger(req.params.movieId, 'movieId');
    const result = await query('SELECT * FROM ratings WHERE user_id = $1 AND movie_id = $2 LIMIT 1', [req.user.id, movieId]);
    return res.json({ rating: result.rows[0] || null });
  } catch (error) {
    return next(error);
  }
});

router.delete('/ratings/:movieId', requireSessionCsrf, async (req, res, next) => {
  try {
    const movieId = positiveInteger(req.params.movieId, 'movieId');
    await query('DELETE FROM ratings WHERE user_id = $1 AND movie_id = $2', [req.user.id, movieId]);
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

router.post('/watched', requireSessionCsrf, async (req, res, next) => {
  try {
    const movie = await withTransaction(async (client) => {
      const savedMovie = await ensureMovie(client, req.body.movie || req.body);
      await client.query(
        `INSERT INTO watched_movies (user_id, movie_id) VALUES ($1, $2)
         ON CONFLICT (user_id, movie_id) DO NOTHING`,
        [req.user.id, savedMovie.id],
      );
      return savedMovie;
    });
    return res.json({ success: true, data: { movie_id: Number(movie.id) } });
  } catch (error) {
    return next(error);
  }
});

router.delete('/watched/:movieId', requireSessionCsrf, async (req, res, next) => {
  try {
    const movieId = positiveInteger(req.params.movieId, 'movieId');
    await query('DELETE FROM watched_movies WHERE user_id = $1 AND movie_id = $2', [req.user.id, movieId]);
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

router.get('/watched', requireSession, async (req, res, next) => {
  try {
    const { page, limit, offset } = pagination(req.query);
    const [items, count] = await Promise.all([
      query(
        `SELECT w.*, json_build_object(
           'id', m.id, 'tmdb_id', m.tmdb_id, 'title', m.title, 'poster_path', m.poster_path
         ) AS movie
         FROM watched_movies w JOIN movies m ON m.id = w.movie_id
         WHERE w.user_id = $1 ORDER BY w.created_at DESC LIMIT $2 OFFSET $3`,
        [req.user.id, limit, offset],
      ),
      query('SELECT count(*)::int AS count FROM watched_movies WHERE user_id = $1', [req.user.id]),
    ]);
    return res.json({ movies: items.rows, currentPage: page, totalPages: Math.ceil(count.rows[0].count / limit) });
  } catch (error) {
    return next(error);
  }
});

router.get('/watched/ids', requireSession, async (req, res, next) => {
  try {
    const result = await query('SELECT movie_id FROM watched_movies WHERE user_id = $1', [req.user.id]);
    return res.json({ items: result.rows.map((row) => Number(row.movie_id)) });
  } catch (error) {
    return next(error);
  }
});

router.post('/comments', requireSessionCsrf, async (req, res, next) => {
  try {
    const content = String(req.body?.content || '').trim();
    if (!content || content.length > 2000) return res.status(400).json({ error: 'invalid_comment' });
    await withTransaction(async (client) => {
      const movie = await ensureMovie(client, req.body);
      await client.query(
        `INSERT INTO comments (user_id, movie_id, content) VALUES ($1, $2, $3)
         ON CONFLICT (user_id, movie_id) DO UPDATE SET content = EXCLUDED.content`,
        [req.user.id, movie.id, content],
      );
    });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

router.get('/users/me/comments', requireSession, async (req, res, next) => {
  try {
    const { page, limit, offset } = pagination(req.query);
    const [items, count] = await Promise.all([
      query(
        `SELECT c.*, m.title AS movie_title, m.poster_path
         FROM comments c JOIN movies m ON m.id = c.movie_id
         WHERE c.user_id = $1 ORDER BY c.created_at DESC LIMIT $2 OFFSET $3`,
        [req.user.id, limit, offset],
      ),
      query('SELECT count(*)::int AS count FROM comments WHERE user_id = $1', [req.user.id]),
    ]);
    return res.json({ comments: items.rows, currentPage: page, totalPages: Math.ceil(count.rows[0].count / limit) });
  } catch (error) {
    return next(error);
  }
});

router.delete('/comments/:movieId', requireSessionCsrf, async (req, res, next) => {
  try {
    const movieId = positiveInteger(req.params.movieId, 'movieId');
    await query('DELETE FROM comments WHERE user_id = $1 AND movie_id = $2', [req.user.id, movieId]);
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

router.get('/friends/status/:otherUserId', requireSession, async (req, res, next) => {
  try {
    if (req.params.otherUserId === req.user.id) return res.json({ status: 'self' });
    const result = await query(
      `SELECT status, from_user_id, to_user_id FROM friendships
       WHERE (from_user_id = $1 AND to_user_id = $2) OR (from_user_id = $2 AND to_user_id = $1)
       LIMIT 1`,
      [req.user.id, req.params.otherUserId],
    );
    if (result.rowCount === 0) return res.json({ status: 'none' });
    const row = result.rows[0];
    const status = row.status === 'pending'
      ? (row.from_user_id === req.user.id ? 'pending_sent' : 'pending_received')
      : row.status;
    return res.json({ status });
  } catch (error) {
    return next(error);
  }
});

router.post('/friends/request', requireSessionCsrf, async (req, res, next) => {
  try {
    const toUserId = String(req.body?.toUserId || '');
    if (!toUserId || toUserId === req.user.id) return res.status(400).json({ error: 'invalid_friend_request' });
    const target = await query("SELECT 1 FROM users WHERE id = $1 AND status = 'ACTIVE'", [toUserId]);
    if (target.rowCount === 0) return res.status(404).json({ error: 'user_not_found' });
    await query(
      `INSERT INTO friendships (from_user_id, to_user_id, status) VALUES ($1, $2, 'pending')
       ON CONFLICT (LEAST(from_user_id, to_user_id), GREATEST(from_user_id, to_user_id))
       DO UPDATE SET from_user_id = EXCLUDED.from_user_id, to_user_id = EXCLUDED.to_user_id, status = 'pending'`,
      [req.user.id, toUserId],
    );
    return res.json({ success: true, status: 'pending_sent' });
  } catch (error) {
    return next(error);
  }
});

router.post('/friends/respond', requireSessionCsrf, async (req, res, next) => {
  try {
    const action = req.body?.action;
    if (!['accept', 'reject'].includes(action)) return res.status(400).json({ error: 'invalid_friend_response' });
    const values = [req.user.id, req.body?.requestId || null, req.body?.fromUserId || null, action === 'accept' ? 'accepted' : 'rejected'];
    const result = await query(
      `UPDATE friendships SET status = $4
       WHERE to_user_id = $1 AND status = 'pending'
         AND (($2::uuid IS NOT NULL AND id = $2::uuid) OR ($3::uuid IS NOT NULL AND from_user_id = $3::uuid))
       RETURNING id`,
      values,
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'friend_request_not_found' });
    return res.json({ success: true, status: action === 'accept' ? 'accepted' : 'none' });
  } catch (error) {
    return next(error);
  }
});

router.delete('/friends/:otherUserId', requireSessionCsrf, async (req, res, next) => {
  try {
    await query(
      'DELETE FROM friendships WHERE (from_user_id = $1 AND to_user_id = $2) OR (from_user_id = $2 AND to_user_id = $1)',
      [req.user.id, req.params.otherUserId],
    );
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

router.get('/friends/list/:userId?', requireSession, async (req, res, next) => {
  try {
    const targetUserId = req.params.userId || req.user.id;
    if (!(await profileVisibility(targetUserId, req.user.id))) return res.status(403).json({ error: 'profile_private' });
    const result = await query(
      `SELECT p.id, p.username, p.name, p.avatar_url AS avatar, p.bio
       FROM friendships f
       JOIN profiles p ON p.id = CASE WHEN f.from_user_id = $1 THEN f.to_user_id ELSE f.from_user_id END
       JOIN users u ON u.id = p.id
       WHERE f.status = 'accepted' AND (f.from_user_id = $1 OR f.to_user_id = $1) AND u.status = 'ACTIVE'
       ORDER BY p.username`,
      [targetUserId],
    );
    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
});

router.get('/friends/requests', requireSession, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT f.id, f.from_user_id, f.created_at, p.username, p.name, p.avatar_url AS avatar
       FROM friendships f JOIN profiles p ON p.id = f.from_user_id
       WHERE f.to_user_id = $1 AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [req.user.id],
    );
    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
});

router.post('/recommendations', requireSessionCsrf, async (req, res, next) => {
  try {
    const toUserId = String(req.body?.toUserId || '');
    const title = String(req.body?.title || '').trim();
    const note = String(req.body?.note || '').trim();
    const movieIds = [...new Set((Array.isArray(req.body?.movieIds) ? req.body.movieIds : []).map((id) => positiveInteger(id, 'movieId')))];
    if (!toUserId || toUserId === req.user.id) return res.status(400).json({ error: 'invalid_recipient' });
    if (!title || title.length > 200 || note.length > 2000 || movieIds.length < 1 || movieIds.length > 20) {
      return res.status(400).json({ error: 'invalid_recommendation' });
    }

    const recommendation = await withTransaction(async (client) => {
      const recipient = await client.query("SELECT 1 FROM users WHERE id = $1 AND status = 'ACTIVE'", [toUserId]);
      if (recipient.rowCount === 0) {
        const error = new Error('Recipient not found.');
        error.status = 404;
        error.code = 'recipient_not_found';
        throw error;
      }
      const result = await client.query(
        `INSERT INTO recommendations (from_user_id, to_user_id, title, note)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [req.user.id, toUserId, title, note || null],
      );
      for (const movieId of movieIds) {
        const movie = await ensureMovie(client, { id: movieId });
        await client.query(
          `INSERT INTO recommendation_items (recommendation_id, movie_id, movie_title, poster_path)
           VALUES ($1, $2, $3, $4)`,
          [result.rows[0].id, movie.id, movie.title, movie.poster_path],
        );
      }
      return result.rows[0];
    });
    return res.status(201).json({ success: true, recommendation });
  } catch (error) {
    return next(error);
  }
});

router.get('/recommendations', requireSession, async (req, res, next) => {
  try {
    const type = req.query.type === 'sent' ? 'sent' : 'received';
    const status = req.query.status ? String(req.query.status) : null;
    if (status && !['pending', 'accepted', 'rejected'].includes(status)) return res.status(400).json({ error: 'invalid_status' });
    const ownerColumn = type === 'sent' ? 'from_user_id' : 'to_user_id';
    const deletedColumn = type === 'sent' ? 'deleted_by_sender' : 'deleted_by_recipient';
    const result = await query(
      `SELECT r.*,
         COALESCE(json_agg(json_build_object(
           'id', ri.id, 'movie_id', ri.movie_id, 'movie_title', ri.movie_title, 'poster_path', ri.poster_path
         ) ORDER BY ri.created_at) FILTER (WHERE ri.id IS NOT NULL), '[]'::json) AS items
       FROM recommendations r
       LEFT JOIN recommendation_items ri ON ri.recommendation_id = r.id
       WHERE r.${ownerColumn} = $1 AND r.${deletedColumn} = false
         AND ($2::text IS NULL OR r.status = $2)
       GROUP BY r.id ORDER BY r.created_at DESC`,
      [req.user.id, status],
    );
    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
});

router.get('/recommendations/:id', requireSession, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT r.*,
         COALESCE(json_agg(json_build_object(
           'id', ri.id, 'movie_id', ri.movie_id, 'movie_title', ri.movie_title, 'poster_path', ri.poster_path
         )) FILTER (WHERE ri.id IS NOT NULL), '[]'::json) AS items
       FROM recommendations r LEFT JOIN recommendation_items ri ON ri.recommendation_id = r.id
       WHERE r.id = $1 AND (r.from_user_id = $2 OR r.to_user_id = $2)
       GROUP BY r.id`,
      [req.params.id, req.user.id],
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'recommendation_not_found' });
    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.post('/recommendations/:id/respond', requireSessionCsrf, async (req, res, next) => {
  try {
    const status = req.body?.status;
    if (!['accepted', 'rejected'].includes(status)) return res.status(400).json({ error: 'invalid_status' });
    const result = await query(
      `UPDATE recommendations SET status = $3
       WHERE id = $1 AND to_user_id = $2 AND status = 'pending'
       RETURNING *`,
      [req.params.id, req.user.id, status],
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'recommendation_not_found' });
    return res.json({ success: true, recommendation: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

async function hideRecommendation(req, res, next) {
  try {
    const result = await query(
      `UPDATE recommendations
       SET deleted_by_sender = CASE WHEN from_user_id = $2 THEN true ELSE deleted_by_sender END,
           deleted_by_recipient = CASE WHEN to_user_id = $2 THEN true ELSE deleted_by_recipient END
       WHERE id = $1 AND (from_user_id = $2 OR to_user_id = $2)
       RETURNING deleted_by_sender, deleted_by_recipient`,
      [req.params.id, req.user.id],
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'recommendation_not_found' });
    if (result.rows[0].deleted_by_sender && result.rows[0].deleted_by_recipient) {
      await query('DELETE FROM recommendations WHERE id = $1', [req.params.id]);
    }
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
}

router.delete('/recommendations/:id', requireSessionCsrf, hideRecommendation);
router.post('/recommendations/:id/delete', requireSessionCsrf, hideRecommendation);

router.get('/admin/dashboard', requireRoles('ADMIN'), async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT
         count(*) FILTER (WHERE status = 'ACTIVE')::int AS "totalUsers",
         count(*) FILTER (WHERE status = 'ACTIVE' AND role = 'MODERATOR')::int AS "totalModerators",
         count(*) FILTER (WHERE status = 'ACTIVE' AND last_login_at > now() - interval '30 days')::int AS "activeUsers",
         count(*) FILTER (WHERE status = 'ACTIVE' AND p.last_active_at > now() - interval '10 minutes')::int AS "realTimeActiveUsers"
       FROM users u JOIN profiles p ON p.id = u.id`,
    );
    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.get('/admin/users', requireRoles('ADMIN', 'MODERATOR'), async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.role, u.status, u.created_at, u.last_login_at,
              p.name, p.username, p.bio, p.location, p.avatar_url AS avatar,
              p.social_links, p.social_links AS "socialLinks", p.last_active_at
       FROM users u JOIN profiles p ON p.id = u.id
       WHERE u.status <> 'DELETED'
         AND ($1::text = 'ADMIN' OR u.role <> 'ADMIN')
       ORDER BY u.created_at DESC`,
      [req.user.role],
    );
    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
});

router.get('/admin/moderators', requireRoles('ADMIN'), async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.role, u.status, u.created_at,
              p.name, p.username, p.bio, p.location, p.avatar_url AS avatar, p.social_links
       FROM users u JOIN profiles p ON p.id = u.id
       WHERE u.status = 'ACTIVE' AND u.role = 'MODERATOR'
       ORDER BY p.username`,
    );
    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
});

router.post('/admin/moderators', requireRoles('ADMIN'), requireSessionCsrf, async (req, res, next) => {
  try {
    const validation = validateRegistration(req.body);
    if (validation.error) return res.status(400).json({ error: 'invalid_registration', message: validation.error });
    const { email, username, name, password } = validation.value;
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await withTransaction(async (client) => {
      const created = await client.query(
        `INSERT INTO users (email, password_hash, role, email_verified_at)
         VALUES ($1, $2, 'MODERATOR', now()) RETURNING id, email, role, status, created_at`,
        [email, passwordHash],
      );
      await client.query('INSERT INTO profiles (id, username, name) VALUES ($1, $2, $3)', [created.rows[0].id, username, name]);
      return created.rows[0];
    });
    return res.status(201).json({ success: true, user });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'registration_unavailable' });
    return next(error);
  }
});

router.put('/admin/users/:userId/promote', requireRoles('ADMIN'), requireSessionCsrf, async (req, res, next) => {
  try {
    const result = await query(
      "UPDATE users SET role = 'MODERATOR' WHERE id = $1 AND role = 'USER' AND status = 'ACTIVE' RETURNING id, role",
      [req.params.userId],
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'user_not_found' });
    return res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.delete('/admin/moderators/:userId', requireRoles('ADMIN'), requireSessionCsrf, async (req, res, next) => {
  try {
    const result = await query(
      "UPDATE users SET role = 'USER' WHERE id = $1 AND role = 'MODERATOR' RETURNING id, role",
      [req.params.userId],
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'moderator_not_found' });
    return res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.put('/admin/users/:userId', requireRoles('ADMIN', 'MODERATOR'), requireSessionCsrf, async (req, res, next) => {
  try {
    const target = await query('SELECT role FROM users WHERE id = $1 AND status <> $2', [req.params.userId, 'DELETED']);
    if (target.rowCount === 0) return res.status(404).json({ error: 'user_not_found' });
    if (req.user.role !== 'ADMIN' && target.rows[0].role !== 'USER') return res.status(403).json({ error: 'forbidden' });

    const name = req.body?.name === undefined ? undefined : String(req.body.name).trim();
    const username = req.body?.username === undefined ? undefined : normalizeUsername(req.body.username);
    const email = req.body?.email === undefined ? undefined : normalizeEmail(req.body.email);
    const bio = req.body?.bio === undefined ? undefined : String(req.body.bio).trim();
    const location = req.body?.location === undefined ? undefined : String(req.body.location).trim();
    const socialLinks = req.body?.socialLinks ?? req.body?.social_links;
    if (name !== undefined && (name.length < 2 || name.length > 120)) return res.status(400).json({ error: 'invalid_name' });
    if (username !== undefined && !/^[a-z0-9_]{3,32}$/.test(username)) return res.status(400).json({ error: 'invalid_username' });
    if (email !== undefined && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return res.status(400).json({ error: 'invalid_email' });
    if (bio !== undefined && bio.length > 1000) return res.status(400).json({ error: 'invalid_bio' });
    if (location !== undefined && location.length > 120) return res.status(400).json({ error: 'invalid_location' });

    const result = await withTransaction(async (client) => {
      if (email !== undefined) await client.query('UPDATE users SET email = $2 WHERE id = $1', [req.params.userId, email]);
      return client.query(
        `UPDATE profiles SET
           name = COALESCE($2, name), username = COALESCE($3, username),
           bio = COALESCE($4, bio), location = COALESCE($5, location),
           social_links = COALESCE($6::jsonb, social_links)
         WHERE id = $1
         RETURNING id, name, username, bio, location, avatar_url AS avatar, social_links, social_links AS "socialLinks"`,
        [req.params.userId, name, username, bio, location, serializeSocialLinks(socialLinks)],
      );
    });
    return res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'email_or_username_unavailable' });
    return next(error);
  }
});

router.delete('/admin/users/:userId', requireRoles('ADMIN', 'MODERATOR'), requireSessionCsrf, async (req, res, next) => {
  try {
    if (req.params.userId === req.user.id) return res.status(400).json({ error: 'cannot_delete_current_user' });
    const target = await query('SELECT role FROM users WHERE id = $1 AND status <> $2', [req.params.userId, 'DELETED']);
    if (target.rowCount === 0) return res.status(404).json({ error: 'user_not_found' });
    if (req.user.role !== 'ADMIN' && target.rows[0].role !== 'USER') return res.status(403).json({ error: 'forbidden' });
    await withTransaction(async (client) => {
      await client.query("UPDATE users SET status = 'DELETED', email = concat('deleted+', id, '@invalid.local') WHERE id = $1", [req.params.userId]);
      await client.query("UPDATE profiles SET username = concat('deleted_', left(replace(id::text, '-', ''), 16)), name = 'Deleted User', bio = NULL, location = NULL, avatar_url = NULL, social_links = '{}'::jsonb WHERE id = $1", [req.params.userId]);
      await client.query('DELETE FROM user_sessions WHERE user_id = $1', [req.params.userId]);
      await client.query('DELETE FROM user_tokens WHERE user_id = $1', [req.params.userId]);
    });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

router.use((error, _req, res, next) => {
  if (!error.status) return next(error);
  return res.status(error.status).json({ error: error.code || 'invalid_request', message: error.message });
});

module.exports = router;
