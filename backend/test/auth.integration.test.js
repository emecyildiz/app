const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
  || 'postgresql://ratemet:local-development-only@localhost:5434/ratemet';
process.env.DATABASE_SSL = 'false';
process.env.AUTH_REQUIRE_EMAIL_VERIFICATION = 'false';
process.env.IP_HASH_SECRET = 'integration-test-secret';
process.env.ALLOWED_ORIGIN = 'http://localhost:3001';

const app = require(process.env.TEST_SERVER_ENTRY || '../src/server');
const { pool, query } = require('../src/config/database');
const { hashToken } = require('../src/auth/tokens');

let baseUrl;
let server;

async function request(path, options = {}) {
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Origin: 'http://localhost:3001',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
}

before(async () => {
  await query('TRUNCATE users CASCADE');
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await pool.end();
});

test('registration, login, session, CSRF rotation, and logout work together', async () => {
  const registration = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: 'viewer@example.com',
      username: 'viewer_one',
      name: 'Viewer One',
      password: 'SecurePass123',
    }),
  });
  assert.equal(registration.status, 201);
  assert.deepEqual(await registration.json(), {
    success: true,
    emailVerificationRequired: false,
  });

  const duplicate = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: 'viewer@example.com',
      username: 'viewer_one',
      name: 'Viewer One',
      password: 'SecurePass123',
    }),
  });
  assert.equal(duplicate.status, 409);

  const invalidLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'viewer@example.com', password: 'WrongPass123' }),
  });
  assert.equal(invalidLogin.status, 401);

  const unknownLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'unknown@example.com', password: 'WrongPass123' }),
  });
  assert.equal(unknownLogin.status, 401);

  const login = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'viewer@example.com', password: 'SecurePass123' }),
  });
  assert.equal(login.status, 200);
  const loginBody = await login.json();
  const cookie = login.headers.get('set-cookie').split(';')[0];
  assert.ok(loginBody.csrfToken);
  assert.equal(loginBody.user.email, 'viewer@example.com');

  const session = await request('/api/auth/session', {
    headers: { Cookie: cookie },
  });
  assert.equal(session.status, 200);
  assert.equal((await session.json()).user.username, 'viewer_one');

  const csrf = await request('/api/auth/csrf', {
    headers: { Cookie: cookie },
  });
  assert.equal(csrf.status, 200);
  const { csrfToken } = await csrf.json();
  assert.ok(csrfToken);

  const rejectedProfileUpdate = await request('/api/auth/profile', {
    method: 'PATCH',
    headers: { Cookie: cookie, 'x-csrf-token': 'invalid-token' },
    body: JSON.stringify({ name: 'Updated Viewer' }),
  });
  assert.equal(rejectedProfileUpdate.status, 403);

  const profileUpdate = await request('/api/auth/profile', {
    method: 'PATCH',
    headers: { Cookie: cookie, 'x-csrf-token': csrfToken },
    body: JSON.stringify({
      name: 'Updated Viewer',
      username: 'updated_viewer',
      bio: 'A short profile bio.',
      socialLinks: { letterboxd: 'updated-viewer', privacy: 'public' },
    }),
  });
  assert.equal(profileUpdate.status, 200);
  const profileBody = await profileUpdate.json();
  assert.equal(profileBody.profile.name, 'Updated Viewer');
  assert.equal(profileBody.profile.username, 'updated_viewer');
  assert.equal(profileBody.profile.social_links.letterboxd, 'updated-viewer');

  const updatedSession = await request('/api/auth/session', {
    headers: { Cookie: cookie },
  });
  assert.equal(updatedSession.status, 200);
  assert.equal((await updatedSession.json()).user.username, 'updated_viewer');

  const favorite = await request('/api/favorites', {
    method: 'POST',
    headers: { Cookie: cookie, 'x-csrf-token': csrfToken },
    body: JSON.stringify({ movieId: 550, title: 'Fight Club', posterPath: '/poster.jpg' }),
  });
  assert.equal(favorite.status, 200);

  const favorites = await request(`/api/users/${loginBody.user.id}/favorites`, {
    headers: { Cookie: cookie },
  });
  assert.equal(favorites.status, 200);
  assert.deepEqual((await favorites.json()).items, [550]);

  const rating = await request('/api/ratings', {
    method: 'POST',
    headers: { Cookie: cookie, 'x-csrf-token': csrfToken },
    body: JSON.stringify({ movieId: 550, rating: 8.5, comment: 'A test rating.', movie: { id: 550, title: 'Fight Club' } }),
  });
  assert.equal(rating.status, 200);

  const watched = await request('/api/watched', {
    method: 'POST',
    headers: { Cookie: cookie, 'x-csrf-token': csrfToken },
    body: JSON.stringify({ movieId: 550 }),
  });
  assert.equal(watched.status, 200);

  const comment = await request('/api/comments', {
    method: 'POST',
    headers: { Cookie: cookie, 'x-csrf-token': csrfToken },
    body: JSON.stringify({ movieId: 550, movieTitle: 'Fight Club', content: 'A separate test comment.' }),
  });
  assert.equal(comment.status, 200);

  const stats = await request('/api/users/stats', { headers: { Cookie: cookie } });
  assert.equal(stats.status, 200);
  assert.deepEqual(
    Object.fromEntries(Object.entries(await stats.json()).filter(([key]) => ['favoritesCount', 'ratingsCount', 'watchedMovies', 'commentsCount'].includes(key))),
    { watchedMovies: 1, ratingsCount: 1, commentsCount: 1, favoritesCount: 1 },
  );

  const recipientRegistration = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: 'recipient@example.com',
      username: 'recipient_user',
      name: 'Recipient User',
      password: 'SecurePass123',
    }),
  });
  assert.equal(recipientRegistration.status, 201);
  const recipientResult = await query('SELECT id FROM users WHERE email = $1', ['recipient@example.com']);
  const recipientId = recipientResult.rows[0].id;

  const friendRequest = await request('/api/friends/request', {
    method: 'POST',
    headers: { Cookie: cookie, 'x-csrf-token': csrfToken },
    body: JSON.stringify({ toUserId: recipientId }),
  });
  assert.equal(friendRequest.status, 200);

  const repeatedFriendRequest = await request('/api/friends/request', {
    method: 'POST',
    headers: { Cookie: cookie, 'x-csrf-token': csrfToken },
    body: JSON.stringify({ toUserId: recipientId }),
  });
  assert.equal(repeatedFriendRequest.status, 200);

  const recommendation = await request('/api/recommendations', {
    method: 'POST',
    headers: { Cookie: cookie, 'x-csrf-token': csrfToken },
    body: JSON.stringify({ toUserId: recipientId, title: 'Watch this', note: 'A test recommendation.', movieIds: [550] }),
  });
  assert.equal(recommendation.status, 201);

  const sentRecommendations = await request('/api/recommendations?type=sent', { headers: { Cookie: cookie } });
  assert.equal(sentRecommendations.status, 200);
  const sentBody = await sentRecommendations.json();
  assert.equal(sentBody.length, 1);
  assert.equal(sentBody[0].items[0].movie_id, 550);

  const rejectedLogout = await request('/api/auth/logout', {
    method: 'POST',
    headers: { Cookie: cookie, 'x-csrf-token': 'invalid-token' },
  });
  assert.equal(rejectedLogout.status, 403);

  const logout = await request('/api/auth/logout', {
    method: 'POST',
    headers: { Cookie: cookie, 'x-csrf-token': csrfToken },
  });
  assert.equal(logout.status, 204);

  const expiredSession = await request('/api/auth/session', {
    headers: { Cookie: cookie },
  });
  assert.equal(expiredSession.status, 401);

  const resetToken = 'known-single-use-reset-token';
  const userResult = await query('SELECT id FROM users WHERE email = $1', ['viewer@example.com']);
  await query(
    `INSERT INTO user_tokens (user_id, purpose, token_hash, expires_at)
     VALUES ($1, 'PASSWORD_RESET', $2, now() + interval '1 hour')`,
    [userResult.rows[0].id, hashToken(resetToken)],
  );

  const reset = await request('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token: resetToken, password: 'NewSecurePass456' }),
  });
  assert.equal(reset.status, 200);

  const reusedReset = await request('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token: resetToken, password: 'AnotherSecurePass789' }),
  });
  assert.equal(reusedReset.status, 400);

  const oldPasswordLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'viewer@example.com', password: 'SecurePass123' }),
  });
  assert.equal(oldPasswordLogin.status, 401);

  const newPasswordLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'viewer@example.com', password: 'NewSecurePass456' }),
  });
  assert.equal(newPasswordLogin.status, 200);
});
