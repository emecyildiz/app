require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { query } = require('./config/database');
const authRouter = require('./routes/auth');
const dataRouter = require('./routes/data');
const tmdbRouter = require('./routes/tmdb');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

function allowedOrigins() {
  const configured = [process.env.ALLOWED_ORIGIN, process.env.CORS_ORIGIN]
    .filter(Boolean)
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);
  return new Set(configured.length > 0 ? configured : [
    'https://ratemet.emecworks.com',
    'http://localhost:5173',
    'http://localhost:3001',
    'http://localhost:3002',
  ]);
}

const originAllowlist = allowedOrigins();
const trustProxyHops = Number.parseInt(process.env.TRUST_PROXY_HOPS || (isProduction ? '2' : '1'), 10);

app.disable('x-powered-by');
app.set('trust proxy', Number.isSafeInteger(trustProxyHops) ? trustProxyHops : 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'same-site' },
}));

app.use((req, res, next) => {
  const origin = req.get('origin');
  res.vary('Origin');
  if (origin && !originAllowlist.has(origin)) return res.status(403).json({ error: 'origin_not_allowed' });
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, PATCH, PUT, DELETE, OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  return next();
});

app.use(express.json({ limit: '64kb', strict: true }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => req.path === '/health',
  message: { error: 'too_many_requests' },
}));

app.get('/health', async (req, res, next) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', database: 'ok' });
  } catch (error) {
    next(error);
  }
});

app.use('/api/auth', authRouter);
app.use('/api', dataRouter);
app.use('/api', tmdbRouter);
app.use((req, res) => res.status(404).json({ error: 'not_found' }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = Number.isInteger(error.status) && error.status >= 400 && error.status <= 599 ? error.status : 500;
  if (status >= 500) console.error('Unhandled request error:', error.message);
  return res.status(status).json({ error: error.code || (status >= 500 ? 'internal_server_error' : 'request_failed') });
});

if (require.main === module) {
  const port = Number.parseInt(process.env.PORT || '8080', 10);
  app.listen(port, () => console.log(`Ratemet API listening on port ${port}.`));
}

module.exports = app;
