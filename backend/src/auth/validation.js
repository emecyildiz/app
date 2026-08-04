const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-z0-9_]{3,32}$/;

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 10 || password.length > 72) {
    return 'Password must contain between 10 and 72 characters.';
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must contain at least one letter and one number.';
  }

  return null;
}

function validateRegistration(input) {
  const email = normalizeEmail(input?.email);
  const username = normalizeUsername(input?.username);
  const name = String(input?.name || '').trim();
  const passwordError = validatePassword(input?.password);

  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return { error: 'Enter a valid email address.' };
  }
  if (!USERNAME_PATTERN.test(username)) {
    return { error: 'Username must be 3-32 characters and use lowercase letters, numbers, or underscores.' };
  }
  if (name.length < 2 || name.length > 120) {
    return { error: 'Name must contain between 2 and 120 characters.' };
  }
  if (passwordError) return { error: passwordError };

  return { value: { email, username, name, password: input.password } };
}

module.exports = {
  normalizeEmail,
  normalizeUsername,
  validatePassword,
  validateRegistration,
};
