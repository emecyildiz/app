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

  const anonymousSearch = await request('/api/users/search?q=viewer');
  assert.equal(anonymousSearch.status, 401);

  const wildcardSearch = await request('/api/users/search?q=%25%25', {
    headers: { Cookie: cookie },
  });
  assert.equal(wildcardSearch.status, 200);
  assert.deepEqual(await wildcardSearch.json(), []);

  const privateProfileUpdate = await request('/api/auth/profile', {
    method: 'PATCH',
    headers: { Cookie: cookie, 'x-csrf-token': csrfToken },
    body: JSON.stringify({ socialLinks: { letterboxd: 'updated-viewer', privacy: 'private' } }),
  });
  assert.equal(privateProfileUpdate.status, 200);

  const privateAnonymousProfile = await request('/api/users/public/updated_viewer');
  assert.equal(privateAnonymousProfile.status, 200);
  const privateAnonymousBody = await privateAnonymousProfile.json();
  assert.equal(privateAnonymousBody.isPublic, false);
  assert.equal(privateAnonymousBody.canViewDetails, false);
  assert.equal(privateAnonymousBody.bio, null);
  assert.equal(privateAnonymousBody.stats, null);

  const privateOwnerProfile = await request('/api/users/public/updated_viewer', {
    headers: { Cookie: cookie },
  });
  assert.equal(privateOwnerProfile.status, 200);
  const privateOwnerBody = await privateOwnerProfile.json();
  assert.equal(privateOwnerBody.canViewDetails, true);
  assert.equal(privateOwnerBody.bio, 'A short profile bio.');
  assert.deepEqual(privateOwnerBody.stats, { watchedMovies: 0, ratings: 0, favorites: 0 });

  const publicProfileRestore = await request('/api/auth/profile', {
    method: 'PATCH',
    headers: { Cookie: cookie, 'x-csrf-token': csrfToken },
    body: JSON.stringify({ socialLinks: { letterboxd: 'updated-viewer', privacy: 'public' } }),
  });
  assert.equal(publicProfileRestore.status, 200);

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

  const recommendationBeforeAcceptance = await request('/api/recommendations', {
    method: 'POST',
    headers: { Cookie: cookie, 'x-csrf-token': csrfToken },
    body: JSON.stringify({
      toUserId: recipientId,
      title: 'Watch this',
      note: 'A test recommendation.',
      movies: [{ id: 550, title: 'Fight Club', poster_path: '/poster.jpg' }],
    }),
  });
  assert.equal(recommendationBeforeAcceptance.status, 403);

  const recipientLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'recipient@example.com', password: 'SecurePass123' }),
  });
  assert.equal(recipientLogin.status, 200);
  const recipientLoginBody = await recipientLogin.json();
  const recipientCookie = recipientLogin.headers.get('set-cookie').split(';')[0];

  const incomingFriendRequests = await request('/api/friends/requests', {
    headers: { Cookie: recipientCookie },
  });
  assert.equal(incomingFriendRequests.status, 200);
  const incomingFriendRequestBody = await incomingFriendRequests.json();
  assert.equal(incomingFriendRequestBody.length, 1);
  assert.equal(incomingFriendRequestBody[0].from_user_id, loginBody.user.id);
  assert.equal(incomingFriendRequestBody[0].username, 'updated_viewer');
  assert.ok(Object.hasOwn(incomingFriendRequestBody[0], 'avatar'));

  const acceptedFriendRequest = await request('/api/friends/respond', {
    method: 'POST',
    headers: { Cookie: recipientCookie, 'x-csrf-token': recipientLoginBody.csrfToken },
    body: JSON.stringify({ fromUserId: loginBody.user.id, action: 'accept' }),
  });
  assert.equal(acceptedFriendRequest.status, 200);
  assert.equal((await acceptedFriendRequest.json()).status, 'friends');

  const repeatedAcceptedFriendRequest = await request('/api/friends/request', {
    method: 'POST',
    headers: { Cookie: cookie, 'x-csrf-token': csrfToken },
    body: JSON.stringify({ toUserId: recipientId }),
  });
  assert.equal(repeatedAcceptedFriendRequest.status, 200);
  assert.equal((await repeatedAcceptedFriendRequest.json()).status, 'friends');

  const friendStatus = await request(`/api/friends/status/${recipientId}`, { headers: { Cookie: cookie } });
  assert.equal(friendStatus.status, 200);
  assert.equal((await friendStatus.json()).status, 'friends');

  const friendSearch = await request('/api/friends/search?q=recipient', { headers: { Cookie: cookie } });
  assert.equal(friendSearch.status, 200);
  assert.deepEqual((await friendSearch.json()).map((entry) => entry.id), [recipientId]);

  const recommendation = await request('/api/recommendations', {
    method: 'POST',
    headers: { Cookie: cookie, 'x-csrf-token': csrfToken },
    body: JSON.stringify({
      toUserId: recipientId,
      title: 'Watch this',
      note: 'A test recommendation.',
      movies: [{ id: 550, title: 'Fight Club', poster_path: '/poster.jpg' }],
    }),
  });
  assert.equal(recommendation.status, 201);

  const duplicateRecommendation = await request('/api/recommendations', {
    method: 'POST',
    headers: { Cookie: cookie, 'x-csrf-token': csrfToken },
    body: JSON.stringify({
      toUserId: recipientId,
      title: 'Watch this again',
      movies: [{ id: 550, title: 'Fight Club', poster_path: '/poster.jpg' }],
    }),
  });
  assert.equal(duplicateRecommendation.status, 409);

  const secondRecommendation = await request('/api/recommendations', {
    method: 'POST',
    headers: { Cookie: cookie, 'x-csrf-token': csrfToken },
    body: JSON.stringify({
      toUserId: recipientId,
      title: 'Another movie',
      movies: [{ id: 551, title: 'The Poseidon Adventure', poster_path: '/second-poster.jpg' }],
    }),
  });
  assert.equal(secondRecommendation.status, 201);
  const secondRecommendationBody = await secondRecommendation.json();

  const sentRecommendations = await request('/api/recommendations?type=sent&page=1&limit=1', { headers: { Cookie: cookie } });
  assert.equal(sentRecommendations.status, 200);
  const sentBody = await sentRecommendations.json();
  assert.equal(sentBody.items.length, 1);
  assert.equal(sentBody.currentPage, 1);
  assert.equal(sentBody.totalPages, 2);
  assert.equal(sentBody.totalCount, 2);
  assert.equal(sentBody.items[0].items[0].movie_id, 551);
  assert.equal(sentBody.items[0].items[0].movie_title, 'The Poseidon Adventure');
  assert.equal(sentBody.items[0].to_user.username, 'recipient_user');

  const secondSentPage = await request('/api/recommendations?type=sent&page=2&limit=1', { headers: { Cookie: cookie } });
  assert.equal(secondSentPage.status, 200);
  const secondSentBody = await secondSentPage.json();
  assert.equal(secondSentBody.items[0].items[0].movie_id, 550);

  const invalidRecommendationType = await request('/api/recommendations?type=unknown', { headers: { Cookie: cookie } });
  assert.equal(invalidRecommendationType.status, 400);

  const receivedRecommendations = await request('/api/recommendations?type=received&status=pending&page=1&limit=1', {
    headers: { Cookie: recipientCookie },
  });
  assert.equal(receivedRecommendations.status, 200);
  const receivedBody = await receivedRecommendations.json();
  assert.equal(receivedBody.totalCount, 2);
  assert.equal(receivedBody.items[0].from_user.username, 'updated_viewer');

  const acceptedRecommendation = await request(`/api/recommendations/${secondRecommendationBody.recommendation.id}/respond`, {
    method: 'POST',
    headers: { Cookie: recipientCookie, 'x-csrf-token': recipientLoginBody.csrfToken },
    body: JSON.stringify({ status: 'accepted' }),
  });
  assert.equal(acceptedRecommendation.status, 200);

  const acceptedRecommendations = await request('/api/recommendations?type=received&status=accepted', {
    headers: { Cookie: recipientCookie },
  });
  assert.equal(acceptedRecommendations.status, 200);
  assert.equal((await acceptedRecommendations.json()).totalCount, 1);

  const invalidBlock = await request('/api/safety/blocks', {
    method: 'POST',
    headers: { Cookie: cookie, 'x-csrf-token': csrfToken },
    body: JSON.stringify({ userId: 'not-a-user-id' }),
  });
  assert.equal(invalidBlock.status, 400);

  const selfBlock = await request('/api/safety/blocks', {
    method: 'POST',
    headers: { Cookie: cookie, 'x-csrf-token': csrfToken },
    body: JSON.stringify({ userId: loginBody.user.id }),
  });
  assert.equal(selfBlock.status, 400);

  const block = await request('/api/safety/blocks', {
    method: 'POST',
    headers: { Cookie: cookie, 'x-csrf-token': csrfToken },
    body: JSON.stringify({ userId: recipientId }),
  });
  assert.equal(block.status, 201);
  assert.deepEqual(await block.json(), { success: true, created: true });

  const friendshipAfterBlock = await query(
    `SELECT 1 FROM friendships
     WHERE (from_user_id = $1 AND to_user_id = $2)
        OR (from_user_id = $2 AND to_user_id = $1)`,
    [loginBody.user.id, recipientId],
  );
  assert.equal(friendshipAfterBlock.rowCount, 0);

  const repeatedBlock = await request('/api/safety/blocks', {
    method: 'POST',
    headers: { Cookie: cookie, 'x-csrf-token': csrfToken },
    body: JSON.stringify({ userId: recipientId }),
  });
  assert.equal(repeatedBlock.status, 200);
  assert.deepEqual(await repeatedBlock.json(), { success: true, created: false });

  const blocks = await request('/api/safety/blocks?page=1&limit=10', {
    headers: { Cookie: cookie },
  });
  assert.equal(blocks.status, 200);
  const blocksBody = await blocks.json();
  assert.equal(blocksBody.totalCount, 1);
  assert.equal(blocksBody.items[0].id, recipientId);
  assert.equal(blocksBody.items[0].username, 'recipient_user');

  const blockerSearch = await request('/api/users/search?q=recipient', {
    headers: { Cookie: cookie },
  });
  assert.equal(blockerSearch.status, 200);
  assert.deepEqual(await blockerSearch.json(), []);

  const blockedUserSearch = await request('/api/users/search?q=updated', {
    headers: { Cookie: recipientCookie },
  });
  assert.equal(blockedUserSearch.status, 200);
  assert.deepEqual(await blockedUserSearch.json(), []);

  const blockerProfileLookup = await request('/api/users/public/recipient_user', {
    headers: { Cookie: cookie },
  });
  assert.equal(blockerProfileLookup.status, 404);

  const blockedProfileLookup = await request('/api/users/public/updated_viewer', {
    headers: { Cookie: recipientCookie },
  });
  assert.equal(blockedProfileLookup.status, 404);

  const blockerFriendStatus = await request(`/api/friends/status/${recipientId}`, {
    headers: { Cookie: cookie },
  });
  assert.equal(blockerFriendStatus.status, 200);
  assert.equal((await blockerFriendStatus.json()).status, 'blocked');

  const blockedUserFriendStatus = await request(`/api/friends/status/${loginBody.user.id}`, {
    headers: { Cookie: recipientCookie },
  });
  assert.equal(blockedUserFriendStatus.status, 200);
  assert.equal((await blockedUserFriendStatus.json()).status, 'none');

  const blockedFriendRequest = await request('/api/friends/request', {
    method: 'POST',
    headers: { Cookie: recipientCookie, 'x-csrf-token': recipientLoginBody.csrfToken },
    body: JSON.stringify({ toUserId: loginBody.user.id }),
  });
  assert.equal(blockedFriendRequest.status, 403);
  assert.equal((await blockedFriendRequest.json()).error, 'interaction_blocked');

  const blockedRecommendation = await request('/api/recommendations', {
    method: 'POST',
    headers: { Cookie: recipientCookie, 'x-csrf-token': recipientLoginBody.csrfToken },
    body: JSON.stringify({
      toUserId: loginBody.user.id,
      title: 'Blocked interaction',
      movies: [{ id: 552, title: 'Another blocked movie' }],
    }),
  });
  assert.equal(blockedRecommendation.status, 403);
  assert.equal((await blockedRecommendation.json()).error, 'interaction_blocked');

  const hiddenSentRecommendations = await request('/api/recommendations?type=sent', {
    headers: { Cookie: cookie },
  });
  assert.equal(hiddenSentRecommendations.status, 200);
  assert.equal((await hiddenSentRecommendations.json()).totalCount, 0);

  const hiddenReceivedRecommendations = await request('/api/recommendations?type=received', {
    headers: { Cookie: recipientCookie },
  });
  assert.equal(hiddenReceivedRecommendations.status, 200);
  assert.equal((await hiddenReceivedRecommendations.json()).totalCount, 0);

  const hiddenRecommendation = await request(`/api/recommendations/${secondRecommendationBody.recommendation.id}`, {
    headers: { Cookie: cookie },
  });
  assert.equal(hiddenRecommendation.status, 404);

  const invalidReport = await request('/api/safety/reports', {
    method: 'POST',
    headers: { Cookie: cookie, 'x-csrf-token': csrfToken },
    body: JSON.stringify({ userId: recipientId, category: 'unknown', details: 'This report has enough detail.' }),
  });
  assert.equal(invalidReport.status, 400);

  const report = await request('/api/safety/reports', {
    method: 'POST',
    headers: { Cookie: cookie, 'x-csrf-token': csrfToken },
    body: JSON.stringify({
      userId: recipientId,
      category: 'spam',
      details: 'Repeated unsolicited messages were sent through the account.',
    }),
  });
  assert.equal(report.status, 201);
  const reportBody = await report.json();
  assert.equal(reportBody.report.category, 'spam');
  assert.equal(reportBody.report.status, 'pending');

  const duplicateReport = await request('/api/safety/reports', {
    method: 'POST',
    headers: { Cookie: cookie, 'x-csrf-token': csrfToken },
    body: JSON.stringify({
      userId: recipientId,
      category: 'spam',
      details: 'A duplicate report should be rejected even if its description changes.',
    }),
  });
  assert.equal(duplicateReport.status, 409);

  const reports = await request('/api/safety/reports', { headers: { Cookie: cookie } });
  assert.equal(reports.status, 200);
  const reportsBody = await reports.json();
  assert.equal(reportsBody.totalCount, 1);
  assert.equal(reportsBody.items[0].status, 'pending');
  assert.equal(reportsBody.items[0].reported_user.id, recipientId);

  const ordinaryModerationRequest = await request('/api/safety/moderation/reports', {
    headers: { Cookie: cookie },
  });
  assert.equal(ordinaryModerationRequest.status, 403);

  const moderatorRegistration = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: 'moderator@example.com',
      username: 'review_moderator',
      name: 'Review Moderator',
      password: 'SecurePass123',
    }),
  });
  assert.equal(moderatorRegistration.status, 201);
  const moderatorLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'moderator@example.com', password: 'SecurePass123' }),
  });
  assert.equal(moderatorLogin.status, 200);
  const moderatorLoginBody = await moderatorLogin.json();
  const moderatorCookie = moderatorLogin.headers.get('set-cookie').split(';')[0];
  await query("UPDATE users SET role = 'MODERATOR' WHERE email = 'moderator@example.com'");

  const moderationReports = await request('/api/safety/moderation/reports?status=pending&page=1&limit=10', {
    headers: { Cookie: moderatorCookie },
  });
  assert.equal(moderationReports.status, 200);
  const moderationReportsBody = await moderationReports.json();
  assert.equal(moderationReportsBody.totalCount, 1);
  assert.equal(moderationReportsBody.counts.pending, 1);
  assert.equal(moderationReportsBody.items[0].details, 'Repeated unsolicited messages were sent through the account.');
  assert.equal(moderationReportsBody.items[0].reporter.id, loginBody.user.id);
  assert.equal(moderationReportsBody.items[0].reported_user.id, recipientId);

  const beginReview = await request(`/api/safety/moderation/reports/${reportBody.report.id}`, {
    method: 'PATCH',
    headers: { Cookie: moderatorCookie, 'x-csrf-token': moderatorLoginBody.csrfToken },
    body: JSON.stringify({ status: 'reviewing' }),
  });
  assert.equal(beginReview.status, 200);
  assert.equal((await beginReview.json()).report.status, 'reviewing');

  const closeWithoutNote = await request(`/api/safety/moderation/reports/${reportBody.report.id}`, {
    method: 'PATCH',
    headers: { Cookie: moderatorCookie, 'x-csrf-token': moderatorLoginBody.csrfToken },
    body: JSON.stringify({ status: 'resolved', resolutionNote: 'Too short' }),
  });
  assert.equal(closeWithoutNote.status, 400);
  assert.equal((await closeWithoutNote.json()).error, 'resolution_note_required');

  const resolveReport = await request(`/api/safety/moderation/reports/${reportBody.report.id}`, {
    method: 'PATCH',
    headers: { Cookie: moderatorCookie, 'x-csrf-token': moderatorLoginBody.csrfToken },
    body: JSON.stringify({
      status: 'resolved',
      resolutionNote: 'The report was reviewed and the appropriate account action was recorded.',
    }),
  });
  assert.equal(resolveReport.status, 200);
  const resolvedReportBody = await resolveReport.json();
  assert.equal(resolvedReportBody.report.status, 'resolved');
  assert.ok(resolvedReportBody.report.reviewed_at);

  const updatedUserReports = await request('/api/safety/reports', { headers: { Cookie: cookie } });
  assert.equal(updatedUserReports.status, 200);
  assert.equal((await updatedUserReports.json()).items[0].status, 'resolved');

  const unblock = await request(`/api/safety/blocks/${recipientId}`, {
    method: 'DELETE',
    headers: { Cookie: cookie, 'x-csrf-token': csrfToken },
  });
  assert.equal(unblock.status, 200);
  assert.deepEqual(await unblock.json(), { success: true, removed: true });

  const friendRequestAfterUnblock = await request('/api/friends/request', {
    method: 'POST',
    headers: { Cookie: cookie, 'x-csrf-token': csrfToken },
    body: JSON.stringify({ toUserId: recipientId }),
  });
  assert.equal(friendRequestAfterUnblock.status, 200);
  assert.equal((await friendRequestAfterUnblock.json()).status, 'pending_outgoing');

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
