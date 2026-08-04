const messages = {
  'User already registered': 'This user is already registered.',
  'Invalid login credentials': 'The email address or password is incorrect.',
  'Email not confirmed': 'Please verify your email address.',
  'User not found': 'User not found.',
  'Password too short': 'The password is too short.',
  'Invalid email': 'Enter a valid email address.',
  'Email already in use': 'This email address is already in use.',
  'Unable to validate email address': 'The email address could not be validated.',
  'Same password': 'The new password must be different.',
  'New password should be different': 'The new password must be different.',
  'Invalid Refresh Token': 'Your session has expired. Please sign in again.',
  'Refresh Token Not Found': 'Your session could not be found. Please sign in again.',
  'Unexpected end of JSON input': 'The response could not be processed.',
  'Network request failed': 'The network request failed. Check your connection.',
  'Failed to fetch': 'The service could not be reached.',
  unauthorized: 'You are not authorized to perform this action.',
  Unauthorized: 'You are not authorized to perform this action.',
  'no rows': 'No result was found.',
  'No rows returned': 'No result was found.',
  PGRST116: 'The requested record was not found.',
}

export function translateError(error) {
  if (!error) return 'An unknown error occurred.'
  const source = typeof error === 'string' ? error : error.message || error.error || error.code
  if (!source) return 'An unknown error occurred.'
  if (messages[source]) return messages[source]
  const match = Object.keys(messages).find((key) => String(source).includes(key))
  return match ? messages[match] : String(source)
}

export default translateError
