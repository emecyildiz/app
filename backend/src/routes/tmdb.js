const express = require('express');

const router = express.Router();
const baseUrl = process.env.TMDB_API_BASE_URL || 'https://api.themoviedb.org/3';
const language = process.env.TMDB_LANGUAGE || 'en-US';

function boundedPage(value) {
  const page = Number.parseInt(value || '1', 10);
  return Number.isSafeInteger(page) && page >= 1 && page <= 500 ? page : 1;
}

function positiveInteger(value, field) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    const error = new Error(`${field} must be a positive integer.`);
    error.status = 400;
    error.code = 'invalid_identifier';
    throw error;
  }
  return parsed;
}

async function requestTmdb(path, search = {}) {
  const token = process.env.TMDB_V4_TOKEN;
  const apiKey = process.env.TMDB_API_KEY;
  if (!token && !apiKey) {
    const error = new Error('TMDB credentials are not configured.');
    error.status = 503;
    error.code = 'tmdb_not_configured';
    throw error;
  }

  const url = new URL(path, `${baseUrl.replace(/\/$/, '')}/`);
  url.searchParams.set('language', language);
  if (apiKey && !token) url.searchParams.set('api_key', apiKey);
  for (const [key, value] of Object.entries(search)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }

  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(body?.status_message || `TMDB returned HTTP ${response.status}.`);
      error.status = response.status >= 400 && response.status < 500 ? response.status : 502;
      error.code = 'tmdb_request_failed';
      throw error;
    }
    return body;
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('TMDB request timed out.');
      timeoutError.status = 504;
      timeoutError.code = 'tmdb_timeout';
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function handle(routeHandler) {
  return async (req, res, next) => {
    try {
      res.json(await routeHandler(req));
    } catch (error) {
      next(error);
    }
  };
}

router.get('/movies/popular', handle((req) => requestTmdb('movie/popular', { page: boundedPage(req.query.page) })));
router.get('/movies/latest', handle((req) => requestTmdb('movie/now_playing', { page: boundedPage(req.query.page) })));
router.get('/movies/top-rated', handle((req) => requestTmdb('movie/top_rated', { page: boundedPage(req.query.page) })));
router.get('/genres', handle(() => requestTmdb('genre/movie/list')));
router.get('/movies/search/:query', handle((req) => {
  const query = String(req.params.query || '').trim().slice(0, 200);
  if (!query) {
    const error = new Error('A search query is required.');
    error.status = 400;
    error.code = 'search_query_required';
    throw error;
  }
  return requestTmdb('search/movie', { query, page: boundedPage(req.query.page), include_adult: false });
}));
router.get('/movies/genre/:genreId', handle((req) => requestTmdb('discover/movie', {
  with_genres: positiveInteger(req.params.genreId, 'genreId'),
  page: boundedPage(req.query.page),
  include_adult: false,
})));
router.get('/movies/:id/similar', handle((req) => requestTmdb(
  `movie/${positiveInteger(req.params.id, 'movieId')}/similar`,
  { page: boundedPage(req.query.page) },
)));
router.get('/movies/:id', handle((req) => requestTmdb(
  `movie/${positiveInteger(req.params.id, 'movieId')}`,
  { append_to_response: 'credits,videos,images' },
)));

module.exports = router;
