// Required imports
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// Initialize express app
const app = express();

// Middleware
app.use(express.json());
// In proxy environments (Vercel/Railway), trust proxy to allow rate limiter to read client IP
app.set('trust proxy', 1);
app.use(helmet());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(['/api/auth/login', '/api/auth/register'], authLimiter);

// CORS middleware
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://app-eta-five-56.vercel.app',
    'https://app-production-c295.up.railway.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173'
  ];
  
  const origin = req.headers.origin;
  console.log(`${req.method} ${req.path} from ${origin || 'unknown origin'}`);

  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
});

// Supabase configuration (require env)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// JWT configuration (require env) - prefer SUPABASE_JWT_SECRET, fallback to JWT_SECRET
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}
if (!JWT_SECRET) {
  console.error('JWT secret missing. Please set SUPABASE_JWT_SECRET (preferred) or JWT_SECRET');
}

// Auth middleware with error logging
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error?.message || '');
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Admin middleware with error logging
const adminMiddleware = (req, res, next) => {
  console.log('User Role:', req.user?.role);
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Operator or Admin middleware
const operatorOrAdminMiddleware = (req, res, next) => {
  const role = req.user?.role;
  if (role !== 'ADMIN' && role !== 'OPERATOR') {
    return res.status(403).json({ message: 'Operator or admin access required' });
  }
  next();
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    supabase: supabaseUrl ? 'Configured' : 'Missing'
  });
});

// Simple debug endpoint to verify latest deploy
app.get('/api/ping', (_req, res) => {
  res.json({ pong: true, when: new Date().toISOString() });
});

// ===== TMDB configuration & helpers =====
const TMDB_API_BASE_URL = process.env.TMDB_API_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const TMDB_V4_TOKEN = process.env.TMDB_V4_TOKEN || '';

const tmdbClient = axios.create({
  baseURL: TMDB_API_BASE_URL,
  headers: TMDB_V4_TOKEN ? { Authorization: `Bearer ${TMDB_V4_TOKEN}` } : undefined,
});

const withAuthParams = (params = {}) => {
  if (!TMDB_V4_TOKEN && TMDB_API_KEY) {
    return { api_key: TMDB_API_KEY, ...params };
  }
  return params;
};

let genresCache = null;
let genresCacheTs = 0;
const GENRES_TTL_MS = 1000 * 60 * 60; // 1 hour

// Rating helpers
const RATING_MIN_VOTES = process.env.RATING_MIN_VOTES ? parseInt(process.env.RATING_MIN_VOTES) : 50;

async function getMovieRatings(movieIds) {
  try {
    // Get global average (C)
    const { data: globalData, error: globalErr } = await supabase
      .from('user_ratings')
      .select('rating')
      .limit(1000); // Reasonable sample size
    if (globalErr) throw globalErr;
    const C = globalData?.length > 0
      ? globalData.reduce((sum, r) => sum + r.rating, 0) / globalData.length
      : 7.0; // Fallback if no ratings yet

    // Get per-movie aggregates
    const { data: rows, error: aggErr } = await supabase
      .from('user_ratings')
      .select('movie_id, rating')
      .in('movie_id', movieIds.map(String));
    if (aggErr) throw aggErr;

    // Group by movie
    const byMovie = new Map();
    for (const r of rows || []) {
      const list = byMovie.get(r.movie_id) || [];
      list.push(r.rating);
      byMovie.set(r.movie_id, list);
    }

    // Calculate WR per movie
    const result = new Map();
    for (const movieId of movieIds) {
      const ratings = byMovie.get(String(movieId)) || [];
      const v = ratings.length;
      if (v === 0) {
        result.set(movieId, { averageRating: null, ratingsCount: 0 });
        continue;
      }
      const R = ratings.reduce((sum, r) => sum + r, 0) / v;
      // WR = (v/(v+m))·R + (m/(v+m))·C
      const m = RATING_MIN_VOTES;
      const wr = (v / (v + m)) * R + (m / (v + m)) * C;
      result.set(movieId, {
        averageRating: Number(wr.toFixed(1)),
        ratingsCount: v
      });
    }
    return result;
  } catch (error) {
    console.error('getMovieRatings error:', error);
    return new Map(movieIds.map(id => [id, { averageRating: null, ratingsCount: 0 }]));
  }
}

async function getFriendsRatings(userId, movieIds) {
  if (!userId) return new Map();
  try {
    // Get accepted friend IDs
    const { data: friends, error: friendsErr } = await supabase
      .from('friendships')
      .select('requester_id, addressee_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
    if (friendsErr) throw friendsErr;
    const friendIds = (friends || [])
      .map(f => f.requester_id === userId ? f.addressee_id : f.requester_id);
    if (friendIds.length === 0) return new Map();

    // Get friends' ratings
    const { data: rows, error: ratingsErr } = await supabase
      .from('user_ratings')
      .select('movie_id, rating')
      .in('movie_id', movieIds.map(String))
      .in('user_id', friendIds);
    if (ratingsErr) throw ratingsErr;

    // Group and average by movie
    const byMovie = new Map();
    for (const r of rows || []) {
      const list = byMovie.get(r.movie_id) || [];
      list.push(r.rating);
      byMovie.set(r.movie_id, list);
    }

    const result = new Map();
    for (const movieId of movieIds) {
      const ratings = byMovie.get(String(movieId)) || [];
      if (ratings.length === 0) {
        result.set(movieId, { friendsAverage: null, friendsCount: 0 });
        continue;
      }
      const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      result.set(movieId, {
        friendsAverage: Number(avg.toFixed(1)),
        friendsCount: ratings.length
      });
    }
    return result;
  } catch (error) {
    console.error('getFriendsRatings error:', error);
    return new Map();
  }
}

async function attachRatings(movies, userId = null) {
  if (!Array.isArray(movies) || movies.length === 0) return movies;
  const movieIds = movies.map(m => m.id);
  const [ratings, friends] = await Promise.all([
    getMovieRatings(movieIds),
    getFriendsRatings(userId, movieIds),
  ]);
  return movies.map(m => ({
    ...m,
    ...(ratings.get(m.id) || {}),
    ...(friends.get(m.id) || {}),
  }));
}

async function fetchGenres() {
  const now = Date.now();
  if (genresCache && now - genresCacheTs < GENRES_TTL_MS) return genresCache;
  const resp = await tmdbClient.get('/genre/movie/list', {
    params: withAuthParams({ language: 'tr-TR' }),
  });
  const list = Array.isArray(resp.data?.genres) ? resp.data.genres : [];
  genresCache = list;
  genresCacheTs = now;
  return list;
}

function mapMovieSummary(tmdbMovie, genreListById) {
  const posterPath = tmdbMovie.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}` : null;
  const backdropPath = tmdbMovie.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdbMovie.backdrop_path}` : null;
  const genreIds = Array.isArray(tmdbMovie.genre_ids) ? tmdbMovie.genre_ids : [];
  let genres = [];
  if (genreIds.length > 0) {
    genres = genreIds
      .map((id) => genreListById.get(id))
      .filter(Boolean);
  } else if (Array.isArray(tmdbMovie.genres)) {
    genres = tmdbMovie.genres.map(g => ({ id: g.id, name: g.name }))
  }

  return {
    id: tmdbMovie.id,
    title: tmdbMovie.title || tmdbMovie.name || '',
    description: tmdbMovie.overview || '',
    poster: posterPath,
    backdrop: backdropPath,
    releaseDate: tmdbMovie.release_date || tmdbMovie.first_air_date || null,
    genres,
    runtime: tmdbMovie.runtime || null,
  };
}

function mapMovieDetail(tmdbMovie) {
  const posterPath = tmdbMovie.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}` : null;
  const backdropPath = tmdbMovie.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdbMovie.backdrop_path}` : null;
  const genres = Array.isArray(tmdbMovie.genres)
    ? tmdbMovie.genres.map(g => ({ id: g.id, name: g.name }))
    : [];
  const cast = Array.isArray(tmdbMovie.credits?.cast)
    ? tmdbMovie.credits.cast.slice(0, 10).map((c) => c.name).filter(Boolean)
    : [];
  const director = Array.isArray(tmdbMovie.credits?.crew)
    ? (tmdbMovie.credits.crew.find((c) => c.job === 'Director')?.name || null)
    : null;

  return {
    id: tmdbMovie.id,
    title: tmdbMovie.title || '',
    description: tmdbMovie.overview || '',
    poster: posterPath,
    backdrop: backdropPath,
    releaseDate: tmdbMovie.release_date || null,
    genres,
    runtime: tmdbMovie.runtime || null,
    director,
    cast,
  };
}

// ===== Authentication =====
// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    // Validation
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: 'Tüm alanlar gereklidir' });
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email, username')
      .or(`email.eq.${email},username.eq.${username}`)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Check existing user error:', checkError);
      return res.status(500).json({ message: 'Veritabanı hatası' });
    }

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanılıyor' });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ message: 'Bu kullanıcı adı zaten kullanılıyor' });
      }
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          name,
          username,
          email,
          password: hashedPassword,
          role: 'USER',
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Insert user error:', insertError);
      return res.status(500).json({ message: 'Kullanıcı oluşturulamadı' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username, role: newUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({
      message: 'Kayıt başarılı',
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Kullanıcı adı ve şifre gereklidir' });
    }

    // Find user by username or email
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .or(`username.eq.${username},email.eq.${username}`)
      .maybeSingle();

    if (findError) {
      console.error('Find user error:', findError);
      return res.status(500).json({ message: 'Veritabanı hatası' });
    }

    if (!user) {
      return res.status(401).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Geçersiz şifre' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      message: 'Giriş başarılı',
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Profile update endpoint
app.put('/api/auth/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, username, email, bio, location, socialLinks } = req.body;

    // Check if username/email is already taken by another user
    if (username || email) {
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, email, username')
        .neq('id', userId)
        .or(`email.eq.${email || ''},username.eq.${username || ''}`)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Check existing user error:', checkError);
        return res.status(500).json({ message: 'Veritabanı hatası' });
      }

      if (existingUser) {
        if (existingUser.email === email) {
          return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanılıyor' });
        }
        if (existingUser.username === username) {
          return res.status(400).json({ message: 'Bu kullanıcı adı zaten kullanılıyor' });
        }
      }
    }

    // Update user
    const updateData = {};
    if (name) updateData.name = name;
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (socialLinks !== undefined) updateData.social_links = socialLinks;

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Update user error:', updateError);
      return res.status(500).json({ message: 'Profil güncellenemedi' });
    }

    // Return updated user data (without password)
    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json({
      message: 'Profil güncellendi',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Avatar upload endpoint
app.post('/api/auth/avatar', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({ message: 'Avatar URL gereklidir' });
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ avatar })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Update avatar error:', updateError);
      return res.status(500).json({ message: 'Avatar güncellenemedi' });
    }

    // Return updated user data (without password)
    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json({
      message: 'Avatar güncellendi',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Avatar update error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// ===== Debug endpoints (temporary) =====
// Check env presence (without exposing secrets)
app.get('/api/debug/env', (_req, res) => {
  res.json({
    hasApiKey: Boolean(process.env.TMDB_API_KEY),
    hasV4Token: Boolean(process.env.TMDB_V4_TOKEN),
    baseUrl: TMDB_API_BASE_URL,
    nodeEnv: process.env.NODE_ENV || 'undefined',
  });
});

// Test direct TMDB call and return status/error shape
app.get('/api/debug/tmdb', async (_req, res) => {
  try {
    const resp = await tmdbClient.get('/genre/movie/list', {
      params: withAuthParams({ language: 'tr-TR' })
    });
    return res.json({ ok: true, status: resp.status, genresCount: (resp.data?.genres || []).length });
  } catch (error) {
    const status = error?.response?.status || 0;
    const data = error?.response?.data || null;
    return res.status(200).json({ ok: false, status, data, message: error?.message || 'unknown' });
  }
});

// ===== Movies (TMDB Proxy) =====
// List movies
app.get('/api/movies', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 12, 1);
    let userId = null;
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded?.userId;
      }
    } catch (_) {}

    const genres = await fetchGenres();
    const genresById = new Map(genres.map((g) => [g.id, g]));

    const tmdbResp = await tmdbClient.get('/discover/movie', {
      params: withAuthParams({ language: 'tr-TR', sort_by: 'popularity.desc', page }),
    });
    const results = Array.isArray(tmdbResp.data?.results) ? tmdbResp.data.results : [];
    const mapped = results.map((m) => mapMovieSummary(m, genresById));
    const sliced = mapped.slice(0, limit);
    const withRatings = await attachRatings(sliced, userId);
    const totalPages = Number(tmdbResp.data?.total_pages) || 1;

    res.json({ success: true, data: { movies: withRatings, totalPages, currentPage: page } });
  } catch (error) {
    console.error('GET /api/movies error:', error?.message);
    res.status(500).json({ success: false, message: 'Failed to fetch movies' });
  }
});

// Genres
app.get('/api/movies/genres', async (_req, res) => {
  try {
    const genres = await fetchGenres();
    res.json({ success: true, data: genres });
  } catch (error) {
    const status = error?.response?.status || 0;
    const msg = error?.response?.data?.status_message || error?.message || 'unknown';
    console.error('GET /api/movies/genres error:', status, msg);
    res.status(500).json({ success: false, message: 'Failed to fetch genres', data: [] });
  }
});

// Movies by genre
app.get('/api/movies/genre/:genreId', async (req, res) => {
  try {
    const { genreId } = req.params;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 12, 1);
    let userId = null;
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded?.userId;
      }
    } catch (_) {}

    const genres = await fetchGenres();
    const genresById = new Map(genres.map((g) => [g.id, g]));

    const tmdbResp = await tmdbClient.get('/discover/movie', {
      params: withAuthParams({ language: 'tr-TR', with_genres: genreId, page }),
    });
    const results = Array.isArray(tmdbResp.data?.results) ? tmdbResp.data.results : [];
    const mapped = results.map((m) => mapMovieSummary(m, genresById));
    const sliced = mapped.slice(0, limit);
    const withRatings = await attachRatings(sliced, userId);
    const totalPages = Number(tmdbResp.data?.total_pages) || 1;
    res.json({ success: true, data: { movies: withRatings, totalPages, currentPage: page } });
  } catch (error) {
    console.error('GET /api/movies/genre/:genreId error:', error?.message);
    res.status(500).json({ success: false, message: 'Failed to fetch movies by genre' });
  }
});

// Search movies
app.get('/api/movies/search', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim();
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 12, 1);
    if (!q) return res.json({ success: true, data: { movies: [], totalPages: 0, currentPage: 1 } });
    let userId = null;
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded?.userId;
      }
    } catch (_) {}

    const genres = await fetchGenres();
    const genresById = new Map(genres.map((g) => [g.id, g]));

    const tmdbResp = await tmdbClient.get('/search/movie', {
      params: withAuthParams({ language: 'tr-TR', query: q, page }),
    });
    const results = Array.isArray(tmdbResp.data?.results) ? tmdbResp.data.results : [];
    const mapped = results.map((m) => mapMovieSummary(m, genresById));
    const sliced = mapped.slice(0, limit);
    const withRatings = await attachRatings(sliced, userId);
    const totalPages = Number(tmdbResp.data?.total_pages) || 1;
    res.json({ success: true, data: { movies: withRatings, totalPages, currentPage: page } });
  } catch (error) {
    console.error('GET /api/movies/search error:', error?.message);
    res.status(500).json({ success: false, message: 'Failed to search movies' });
  }
});

// Trending
app.get('/api/movies/trending', async (_req, res) => {
  try {
    let userId = null;
    try {
      const token = _req.headers.authorization?.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded?.userId;
      }
    } catch (_) {}

    const genres = await fetchGenres();
    const genresById = new Map(genres.map((g) => [g.id, g]));
    const tmdbResp = await tmdbClient.get('/trending/movie/day', {
      params: withAuthParams({ language: 'tr-TR' }),
    });
    const results = Array.isArray(tmdbResp.data?.results) ? tmdbResp.data.results : [];
    const mapped = results.map((m) => mapMovieSummary(m, genresById));
    const withRatings = await attachRatings(mapped, userId);
    res.json({ success: true, data: { movies: withRatings } });
  } catch (error) {
    console.error('GET /api/movies/trending error:', error?.message);
    res.status(500).json({ success: false, data: { movies: [] } });
  }
});

// Actors list (popular)
app.get('/api/movies/actors', async (_req, res) => {
  try {
    const resp = await tmdbClient.get('/person/popular', {
      params: withAuthParams({ language: 'tr-TR', page: 1 }),
    });
    const names = (resp.data?.results || []).map((p) => p.name).filter(Boolean);
    res.json({ success: true, data: names });
  } catch (error) {
    console.error('GET /api/movies/actors error:', error?.message);
    res.status(500).json({ success: false, data: [] });
  }
});

// Movies by actor name
app.get('/api/movies/actor/:name', async (req, res) => {
  try {
    const raw = req.params.name || '';
    const name = decodeURIComponent(raw);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 12, 1);
    let userId = null;
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded?.userId;
      }
    } catch (_) {}

    const search = await tmdbClient.get('/search/person', {
      params: withAuthParams({ language: 'tr-TR', query: name, page: 1 }),
    });
    const person = (search.data?.results || [])[0];
    if (!person) return res.json({ success: true, data: { movies: [], totalPages: 0, currentPage: 1 } });

    const personId = person.id;
    const genres = await fetchGenres();
    const genresById = new Map(genres.map((g) => [g.id, g]));
    const tmdbResp = await tmdbClient.get('/discover/movie', {
      params: withAuthParams({ language: 'tr-TR', with_cast: personId, page }),
    });
    const results = Array.isArray(tmdbResp.data?.results) ? tmdbResp.data.results : [];
    const mapped = results.map((m) => mapMovieSummary(m, genresById));
    const sliced = mapped.slice(0, limit);
    const withRatings = await attachRatings(sliced, userId);
    const totalPages = Number(tmdbResp.data?.total_pages) || 1;
    res.json({ success: true, data: { movies: withRatings, totalPages, currentPage: page } });
  } catch (error) {
    console.error('GET /api/movies/actor/:name error:', error?.message);
    res.status(500).json({ success: false, message: 'Failed to fetch movies by actor' });
  }
});

// Movie detail (numeric id)
app.get('/api/movies/:id(\\d+)', async (req, res) => {
  try {
    const { id } = req.params;
    let userId = null;
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded?.userId;
      }
    } catch (_) {}

    const resp = await tmdbClient.get(`/movie/${encodeURIComponent(id)}`, {
      params: withAuthParams({ language: 'tr-TR', append_to_response: 'credits' }),
    });
    const movie = mapMovieDetail(resp.data || {});

    // Try to attach user's own rating if auth header exists
    let userRating = null;
    try {
      if (userId) {
        const { data: ratingRow, error: ratingErr } = await supabase
          .from('user_ratings')
          .select('rating')
          .eq('user_id', userId)
          .eq('movie_id', String(id))
          .maybeSingle();
        if (!ratingErr && ratingRow) {
          userRating = ratingRow.rating ?? null;
        }
      }
    } catch (_) {}

    // Attach ratings
    const [ratings, friends] = await Promise.all([
      getMovieRatings([id]),
      getFriendsRatings(userId, [id]),
    ]);

    res.json({
      success: true,
      data: {
        movie: {
          ...movie,
          userRating,
          ...(ratings.get(id) || {}),
          ...(friends.get(id) || {}),
        }
      }
    });
  } catch (error) {
    const status = error?.response?.status || 0;
    const msg = error?.response?.data?.status_message || error?.message || 'unknown';
    console.error('GET /api/movies/:id error:', status, msg);
    if (status === 404) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch movie detail' });
  }
});

// Rate movie (with daily limit)
app.post('/api/movies/:id/rate', authMiddleware, async (req, res) => {
  try {
    const { id: movieId } = req.params;
    const { rating } = req.body || {};
    const userId = req.user?.userId;
    if (!userId || !movieId || !rating || rating < 1 || rating > 10) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    // Check daily limit (10 different movies)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data: todayRatings, error: countErr } = await supabase
      .from('user_ratings')
      .select('movie_id')
      .eq('user_id', userId)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false });
    if (countErr) throw countErr;

    const uniqueMovies = new Set(todayRatings?.map(r => r.movie_id) || []);
    if (uniqueMovies.size >= 10 && !uniqueMovies.has(String(movieId))) {
      return res.status(429).json({ message: 'Günlük puan verme limitine ulaştınız (10 farklı film)' });
    }

    // Upsert rating
    const { error: upsertErr } = await supabase
      .from('user_ratings')
      .upsert({
        user_id: userId,
        movie_id: String(movieId),
        rating: rating,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,movie_id'
      });
    if (upsertErr) throw upsertErr;

    // Get updated aggregates
    const [ratings, friends] = await Promise.all([
      getMovieRatings([movieId]),
      getFriendsRatings(userId, [movieId]),
    ]);

    return res.json({
      success: true,
      data: {
        ...(ratings.get(movieId) || {}),
        ...(friends.get(movieId) || {}),
      }
    });
  } catch (error) {
    console.error('Rate movie error:', error);
    return res.status(500).json({ message: 'Failed to rate movie' });
  }
});

// Remove rating
app.delete('/api/movies/:id/rate', authMiddleware, async (req, res) => {
  try {
    const { id: movieId } = req.params;
    const userId = req.user?.userId;
    if (!userId || !movieId) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    const { error } = await supabase
      .from('user_ratings')
      .delete()
      .eq('user_id', userId)
      .eq('movie_id', String(movieId));
    if (error) throw error;

    // Get updated aggregates
    const [ratings, friends] = await Promise.all([
      getMovieRatings([movieId]),
      getFriendsRatings(userId, [movieId]),
    ]);

    return res.json({
      success: true,
      data: {
        ...(ratings.get(movieId) || {}),
        ...(friends.get(movieId) || {}),
      }
    });
  } catch (error) {
    console.error('Remove rating error:', error);
    return res.status(500).json({ message: 'Failed to remove rating' });
  }
});

// Get my rated movies
app.get('/api/users/ratings', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 12, 1);
    const offset = (page - 1) * limit;

    // Get paginated ratings
    const { data: ratings, error: ratingsErr, count } = await supabase
      .from('user_ratings')
      .select('movie_id, rating, created_at', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (ratingsErr) throw ratingsErr;

    if (!ratings || ratings.length === 0) {
      return res.json({
        success: true,
        data: {
          ratings: [],
          totalPages: 0,
          currentPage: page,
          totalCount: 0,
        }
      });
    }

    // Fetch movie details from TMDB
    const movieIds = ratings.map(r => r.movie_id);
    const movieDetails = await Promise.all(
      movieIds.map(async (id) => {
        try {
          const resp = await tmdbClient.get(`/movie/${encodeURIComponent(id)}`, {
            params: withAuthParams({ language: 'tr-TR' }),
          });
          return mapMovieSummary(resp.data, new Map());
        } catch (_) {
          return null;
        }
      })
    );

    // Merge ratings with movie details
    const merged = ratings
      .map((r, i) => {
        const movie = movieDetails[i];
        if (!movie) return null;
        return {
          ...movie,
          userRating: r.rating,
          ratedAt: r.created_at,
        };
      })
      .filter(Boolean);

    return res.json({
      success: true,
      data: {
        ratings: merged,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalCount: count,
      }
    });
  } catch (error) {
    console.error('Get my ratings error:', error);
    return res.status(500).json({ message: 'Failed to fetch ratings' });
  }
});

// ===== Favorites =====
// Add to favorites
app.post('/api/favorites', authMiddleware, async (req, res) => {
  try {
    const { movieId } = req.body;
    const userId = req.user.userId;

    if (!movieId) {
      return res.status(400).json({ message: 'Movie ID gereklidir' });
    }

    // Check if already exists
    const { data: existing, error: checkError } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Check favorite error:', checkError);
      return res.status(500).json({ message: 'Veritabanı hatası' });
    }

    if (existing) {
      return res.status(200).json({ message: 'Film zaten favorilerde' });
    }

    // Add to favorites
    const { error: insertError } = await supabase
      .from('favorites')
      .insert([
        {
          user_id: userId,
          movie_id: movieId,
          created_at: new Date().toISOString(),
        },
      ]);

    if (insertError) {
      console.error('Insert favorite error:', insertError);
      return res.status(500).json({ message: 'Favorilere eklenemedi' });
    }

    res.json({ message: 'Film favorilere eklendi' });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Remove from favorites
app.delete('/api/favorites/:movieId', authMiddleware, async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.user.userId;

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('movie_id', movieId);

    if (error) {
      console.error('Remove favorite error:', error);
      return res.status(500).json({ message: 'Favorilerden kaldırılamadı' });
    }

    res.json({ message: 'Film favorilerden kaldırıldı' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Get user favorites
app.get('/api/favorites', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data: favorites, error } = await supabase
      .from('favorites')
      .select('movie_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get favorites error:', error);
      return res.status(500).json({ message: 'Favoriler getirilemedi' });
    }

    res.json({ data: favorites || [] });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// ===== User Management (Admin) =====
// Get all users
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, username, email, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get users error:', error);
      return res.status(500).json({ message: 'Kullanıcılar getirilemedi' });
    }

    res.json({ data: users || [] });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Update user role
app.put('/api/admin/users/:id/role', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['USER', 'OPERATOR', 'ADMIN'].includes(role)) {
      return res.status(400).json({ message: 'Geçersiz rol' });
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', id)
      .select('id, name, username, email, role')
      .single();

    if (error) {
      console.error('Update user role error:', error);
      return res.status(500).json({ message: 'Kullanıcı rolü güncellenemedi' });
    }

    res.json({
      message: 'Kullanıcı rolü güncellendi',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Delete user
app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete user error:', error);
      return res.status(500).json({ message: 'Kullanıcı silinemedi' });
    }

    res.json({ message: 'Kullanıcı silindi' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// ===== User Stats =====
// Get user stats
app.get('/api/users/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get favorites count
    const { count: favoritesCount, error: favError } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (favError) {
      console.error('Get favorites count error:', favError);
    }

    // Get ratings count
    const { count: ratingsCount, error: ratError } = await supabase
      .from('user_ratings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (ratError) {
      console.error('Get ratings count error:', ratError);
    }

    // Get user creation date
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('created_at')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Get user data error:', userError);
    }

    const memberSince = userData?.created_at || null;
    const memberSinceDays = memberSince 
      ? Math.floor((new Date() - new Date(memberSince)) / (1000 * 60 * 60 * 24))
      : 0;

    res.json({
      favorites: favoritesCount || 0,
      ratings: ratingsCount || 0,
      watchedMovies: (favoritesCount || 0) + (ratingsCount || 0), // Simple approximation
      memberSince,
      memberSinceDays,
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'İstatistikler getirilemedi' });
  }
});

// ===== Friendship System =====
// Helper functions for friendships
async function getFriendshipBetween(userId1, userId2) {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(requester_id.eq.${userId1},addressee_id.eq.${userId2}),and(requester_id.eq.${userId2},addressee_id.eq.${userId1})`);
    
    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('getFriendshipBetween error:', error);
    return null;
  }
}

function mapFriendStatus(friendship, currentUserId, otherUserId) {
  if (!friendship) return 'none';
  
  if (friendship.status === 'accepted') return 'friends';
  if (friendship.status === 'rejected') return 'none';
  
  // Pending status
  if (friendship.requester_id === currentUserId) return 'sent';
  if (friendship.addressee_id === currentUserId) return 'received';
  
  return 'none';
}

// Get friendship status between users
app.get('/api/friends/status/:otherUserId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { otherUserId } = req.params;
    
    if (userId === parseInt(otherUserId)) {
      return res.json({ status: 'self' });
    }
    
    const friendship = await getFriendshipBetween(userId, otherUserId);
    const status = mapFriendStatus(friendship, userId, parseInt(otherUserId));
    
    res.json({ status });
  } catch (error) {
    console.error('Get friendship status error:', error);
    res.status(500).json({ message: 'Arkadaşlık durumu alınamadı' });
  }
});

// Send friend request
app.post('/api/friends/request', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { toUserId } = req.body;
    
    if (!toUserId || userId === toUserId) {
      return res.status(400).json({ message: 'Geçersiz kullanıcı' });
    }
    
    // Check if friendship already exists
    const existing = await getFriendshipBetween(userId, toUserId);
    if (existing) {
      const status = mapFriendStatus(existing, userId, toUserId);
      return res.json({ success: true, status, message: 'Arkadaşlık durumu zaten mevcut' });
    }
    
    // Create friend request
    const { data: friendship, error } = await supabase
      .from('friendships')
      .insert({
        requester_id: userId,
        addressee_id: toUserId,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Best-effort notification insert
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: toUserId,
          type: 'friend_request',
          from_user_id: userId,
          created_at: new Date().toISOString(),
        });
    } catch (notifError) {
      console.warn('Failed to insert friend request notification:', notifError);
    }
    
    res.json({ success: true, status: 'sent', message: 'Arkadaşlık isteği gönderildi' });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ message: 'Arkadaşlık isteği gönderilemedi' });
  }
});

// Respond to friend request
app.post('/api/friends/respond', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { requestId, fromUserId, action } = req.body;
    
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Geçersiz işlem' });
    }
    
    // Update friendship status
    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    const { error } = await supabase
      .from('friendships')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .eq('addressee_id', userId)
      .eq('requester_id', fromUserId);
    
    if (error) throw error;
    
    // Best-effort notification insert for acceptance
    if (action === 'accept') {
      try {
        await supabase
          .from('notifications')
          .insert({
            user_id: fromUserId,
            type: 'friend_accepted',
            from_user_id: userId,
            created_at: new Date().toISOString(),
          });
      } catch (notifError) {
        console.warn('Failed to insert friend accepted notification:', notifError);
      }
    }
    
    const status = action === 'accept' ? 'friends' : 'none';
    res.json({ success: true, status, message: action === 'accept' ? 'Arkadaş eklendi' : 'İstek reddedildi' });
  } catch (error) {
    console.error('Respond to friend request error:', error);
    res.status(500).json({ message: 'İstek yanıtlanamadı' });
  }
});

// Unfriend
app.delete('/api/friends/:otherUserId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { otherUserId } = req.params;
    
    const { error } = await supabase
      .from('friendships')
      .delete()
      .or(`and(requester_id.eq.${userId},addressee_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},addressee_id.eq.${userId})`)
      .eq('status', 'accepted');
    
    if (error) throw error;
    
    res.json({ success: true, status: 'none', message: 'Arkadaşlık kaldırıldı' });
  } catch (error) {
    console.error('Unfriend error:', error);
    res.status(500).json({ message: 'Arkadaşlık kaldırılamadı' });
  }
});

// List friends
app.get('/api/friends/list/:userId?', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const targetUserId = req.params.userId ? parseInt(req.params.userId) : currentUserId;
    
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select(`
        *,
        requester:users!friendships_requester_id_fkey(id, name, username, avatar),
        addressee:users!friendships_addressee_id_fkey(id, name, username, avatar)
      `)
      .or(`requester_id.eq.${targetUserId},addressee_id.eq.${targetUserId}`)
      .eq('status', 'accepted');
    
    if (error) throw error;
    
    const friends = (friendships || []).map(f => {
      const friend = f.requester_id === targetUserId ? f.addressee : f.requester;
      return {
        id: friend.id,
        name: friend.name,
        username: friend.username,
        avatar: friend.avatar,
      };
    });
    
    res.json(friends);
  } catch (error) {
    console.error('List friends error:', error);
    res.status(500).json({ message: 'Arkadaş listesi alınamadı' });
  }
});

// List incoming friend requests
app.get('/api/friends/requests', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const { data: requests, error } = await supabase
      .from('friendships')
      .select(`
        *,
        fromUser:users!friendships_requester_id_fkey(id, name, username, avatar)
      `)
      .eq('addressee_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const formatted = (requests || []).map(r => ({
      id: r.id,
      fromUser: {
        id: r.fromUser.id,
        name: r.fromUser.name,
        username: r.fromUser.username,
        avatar: r.fromUser.avatar,
      },
      createdAt: r.created_at,
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error('List friend requests error:', error);
    res.status(500).json({ message: 'Arkadaşlık istekleri alınamadı' });
  }
});

// Export the Express app for Vercel
export default app;

// For Railway deployment
if (process.env.NODE_ENV !== 'production' || process.env.RAILWAY_ENVIRONMENT || process.env.PORT) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Railway Environment: ${process.env.RAILWAY_ENVIRONMENT}`);
  });
}
