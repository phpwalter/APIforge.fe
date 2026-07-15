// Categorized primitive schema properties for the API Designer picker.
// Representative subset per category. Each primitive:
//   { key, jsonType, format?, description, example, validation:{pattern?,min?,max?,minLength?,maxLength?,enum?} }

const P = (key, jsonType, description, example, extra = {}) => ({
  key, jsonType, description, example,
  format: extra.format || null,
  validation: extra.validation || {}
});

const CATEGORIES = [
  { key: 'alpha', label: 'Alpha', prims: [
    P('alphaLower', 'string', 'Lowercase alphabetic characters only.', 'abcdef', { validation: { pattern: '^[a-z]+$', minLength: 1, maxLength: 255 } }),
    P('alphaUpper', 'string', 'Uppercase alphabetic characters only.', 'ABCDEF', { validation: { pattern: '^[A-Z]+$', minLength: 1, maxLength: 255 } }),
    P('alphaNumeric', 'string', 'Letters and digits, no symbols or spaces.', 'user2024', { validation: { pattern: '^[A-Za-z0-9]+$', minLength: 1, maxLength: 255 } }),
    P('slug', 'string', 'URL-friendly lowercase slug using letters, numbers, and single hyphens between segments.', 'my-awesome-product', { format: 'slug', validation: { pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$', minLength: 1, maxLength: 128 } }),
    P('initials', 'string', 'Two or three uppercase initials.', 'JRT', { validation: { pattern: '^[A-Z]{2,3}$', minLength: 2, maxLength: 3 } }),
    P('char', 'string', 'Single character string.', 'A', { format: 'char', validation: { pattern: '^.$', minLength: 1, maxLength: 1 } }),
    P('languageCode', 'string', 'ISO 639-1 language code with optional ISO 3166-1 alpha-2 region.', 'en-US', { format: 'language-code', validation: { pattern: '^[a-z]{2}(-[A-Z]{2})?$', minLength: 2, maxLength: 5 } }),
    P('text', 'string', 'Text string.', 'This is text.', { format: 'text', validation: { minLength: 0 } }),
    P('textMedium', 'string', 'Medium text field.', 'Medium text content.', { format: 'text-medium', validation: { minLength: 0, maxLength: 1000 } })
  ]},
  { key: 'api', label: 'API', prims: [
    P('httpMethod', 'string', 'HTTP request method.', 'GET', { validation: { enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] } }),
    P('mimeType', 'string', 'HTTP media type value.', 'application/json', { format: 'media-type', validation: { pattern: '^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+(?:;\\s*[A-Za-z0-9!#$&^_.+-]+=[A-Za-z0-9!#$&^_.+-]+)*$', minLength: 3, maxLength: 255 } }),
    P('statusCode', 'integer', 'HTTP response status code.', 200, { validation: { min: 100, max: 599 } }),
    P('rateLimit', 'integer', 'Allowed requests per window.', 1000, { validation: { min: 0, max: 1000000 } }),
    P('checksum', 'string', 'Hexadecimal checksum value.', '5d41402abc4b2a76b9719d911017c592', { format: 'checksum', validation: { pattern: '^[A-Fa-f0-9]{32,128}$', minLength: 32, maxLength: 128 } }),
    P('sha256', 'string', 'SHA-256 hash as 64 hex characters.', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', { format: 'sha256', validation: { pattern: '^[A-Fa-f0-9]{64}$', minLength: 64, maxLength: 64 } }),
    P('etag', 'string', 'HTTP entity tag value.', '"abc123"', { format: 'etag', validation: { pattern: '^(?:W/)?\\\"[^\\\"\\\\]*(?:\\\\.[^\\\"\\\\]*)*\\\"$', minLength: 2, maxLength: 256 } }),
    P('correlationId', 'string', 'Identifier used to correlate related requests.', 'corr_01HZABCDEF1234567890', { format: 'correlation-id', validation: { pattern: '^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$', minLength: 8, maxLength: 128 } }),
    P('requestId', 'string', 'Unique request identifier.', 'req_01HZABCDEF1234567890', { format: 'request-id', validation: { pattern: '^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$', minLength: 8, maxLength: 128 } }),
    P('externalId', 'string', 'Identifier from an external system.', 'ext_123456', { format: 'external-id', validation: { pattern: '^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,254}$', minLength: 1, maxLength: 255 } }),
    P('idString', 'string', 'General-purpose string identifier.', 'user_123', { format: 'id', validation: { pattern: '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$', minLength: 1, maxLength: 128 } }),
    P('locale', 'string', 'BCP 47-style locale identifier.', 'en-US', { format: 'locale', validation: { pattern: '^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$', minLength: 2, maxLength: 35 } })
  ]},
  { key: 'auth', label: 'Auth', prims: [
    P('password', 'string', 'Password requiring at least 12 characters, with at least one uppercase letter, one lowercase letter, one number, and one special character.', 'StrongerPassw0rd!', { format: 'password', validation: { pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{12,128}$', minLength: 12, maxLength: 128 } }),
    P('otpCode', 'string', 'One-time numeric verification code.', '482915', { validation: { pattern: '^[0-9]{6}$', minLength: 6, maxLength: 6 } }),
    P('jwt', 'string', 'Compact serialized JSON Web Token using three Base64URL-encoded segments separated by dots.', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', { format: 'jwt', validation: { pattern: '^[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+$', minLength: 20, maxLength: 4096 } }),
    P('sessionId', 'string', 'Opaque server session identifier.', 'sess_9f2b8c…', { validation: { minLength: 16, maxLength: 128 } }),
    P('apiKey', 'string', 'High-entropy API key secret used for programmatic authentication.', 'ak_live_1234567890abcdef', { format: 'api-key', validation: { pattern: '^[A-Za-z0-9._~+/=-]+$', minLength: 16, maxLength: 512 } }),
    P('apiKeyName', 'string', 'Human-readable name assigned to an API key.', 'Production API Key', { format: 'api-key-name', validation: { pattern: "^[A-Za-z0-9][A-Za-z0-9 ._'@-]{0,99}$", minLength: 1, maxLength: 100 } }),
    P('apiKeyPrefix', 'string', 'Non-secret API key prefix.', 'ak_live', { format: 'api-key-prefix', validation: { pattern: '^ak_[A-Za-z0-9_-]+$', minLength: 3, maxLength: 64 } }),
    P('apiKeyScope', 'string', 'Single permission scope granted to an API key.', 'users:read', { format: 'api-key-scope', validation: { pattern: '^[A-Za-z0-9._-]+:[A-Za-z0-9._-]+$', minLength: 3, maxLength: 128 } }),
    P('apiKeyScopes', 'array', 'Array of permission scopes granted to an API key.', ['users:read', 'projects:write'], { format: 'api-key-scopes' }),
    P('apiKeyCreatedAt', 'string', 'API Key Created At timestamp in RFC 3339 date-time format.', '2026-06-23T15:30:45Z', { format: 'date-time', validation: { pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{1,9})?(?:Z|[+-]\\d{2}:\\d{2})$', minLength: 20, maxLength: 35 } }),
    P('apiKeyExpiresAt', 'string', 'API Key Expires At timestamp in RFC 3339 date-time format.', '2026-06-23T15:30:45Z', { format: 'date-time', validation: { pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{1,9})?(?:Z|[+-]\\d{2}:\\d{2})$', minLength: 20, maxLength: 35 } }),
    P('apiKeyLastUsedAt', 'string', 'API Key Last Used At timestamp in RFC 3339 date-time format.', '2026-06-23T15:30:45Z', { format: 'date-time', validation: { pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{1,9})?(?:Z|[+-]\\d{2}:\\d{2})$', minLength: 20, maxLength: 35 } }),
    P('accessToken', 'string', 'Authentication credential required for subsequent API requests. The value may be a JWT or opaque access token depending on the token issuer.', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c', { format: 'access-token', validation: { pattern: '^[A-Za-z0-9._~+/=:-]+$', minLength: 16, maxLength: 8192 } }),
    P('refreshToken', 'string', 'Long-lived credential used to obtain new access tokens.', 'rt_live_1234567890abcdef1234567890abcdef', { format: 'refresh-token', validation: { pattern: '^[A-Za-z0-9._~+/=-]+$', minLength: 32, maxLength: 4096 } }),
    P('sessionToken', 'string', 'Confidential session credential.', 'sess_1234567890abcdef', { format: 'session-token', validation: { pattern: '^[A-Za-z0-9._~+/=-]+$', minLength: 16, maxLength: 4096 } }),
    P('clientId', 'string', 'Public OAuth or application client identifier.', 'client_123456', { format: 'client-id', validation: { pattern: '^[A-Za-z0-9][A-Za-z0-9._:-]{0,254}$', minLength: 1, maxLength: 255 } }),
    P('clientSecret', 'string', 'Confidential OAuth or application client secret.', 'cs_live_1234567890abcdef', { format: 'client-secret', validation: { pattern: '^[A-Za-z0-9._~+/=-]+$', minLength: 16, maxLength: 512 } }),
    P('webhookSecret', 'string', 'High-entropy secret used to verify webhook signatures.', 'whsec_1234567890abcdef', { format: 'webhook-secret', validation: { pattern: '^[A-Za-z0-9._~+/=-]+$', minLength: 16, maxLength: 512 } }),
    P('scope', 'string', 'Space-delimited OAuth scope string.', 'read:users write:users', { format: 'oauth-scope', validation: { pattern: '^[A-Za-z0-9:._-]+(?:\\s+[A-Za-z0-9:._-]+)*$', minLength: 1, maxLength: 1024 } }),
    P('permission', 'string', 'Application permission string using resource:action style.', 'users:read', { format: 'permission', validation: { pattern: '^[A-Za-z0-9._-]+:[A-Za-z0-9._-]+$', minLength: 3, maxLength: 128 } }),
    P('tokenCreatedAt', 'string', 'Token Created At timestamp in RFC 3339 date-time format.', '2026-06-23T15:30:45Z', { format: 'date-time', validation: { pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{1,9})?(?:Z|[+-]\\d{2}:\\d{2})$', minLength: 20, maxLength: 35 } }),
    P('tokenExpiresAt', 'string', 'Token Expires At timestamp in RFC 3339 date-time format.', '2026-06-23T15:30:45Z', { format: 'date-time', validation: { pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{1,9})?(?:Z|[+-]\\d{2}:\\d{2})$', minLength: 20, maxLength: 35 } }),
    P('tokenPrefix', 'string', 'Non-secret token prefix.', 'rt_live', { format: 'token-prefix', validation: { pattern: '^[A-Za-z]{2,12}_[A-Za-z0-9_-]+$', minLength: 2, maxLength: 64 } })
  ]},
  { key: 'boolean', label: 'Boolean', prims: [
    P('flag', 'boolean', 'Generic true/false switch.', true, {}),
    P('isActive', 'boolean', 'Whether the entity is currently active.', true, {}),
    P('consent', 'boolean', 'Explicit user opt-in.', false, {}),
    P('nullableBool', 'boolean', 'Tri-state boolean allowing null (unknown).', null, {}),
    P('isDefault', 'boolean', 'Indicates whether this record is the default selection for its type.', true, {})
  ]},
  { key: 'color', label: 'Color', prims: [
    P('hexColor', 'string', 'Hexadecimal RGB color.', '#4F46E5', { format: 'color', validation: { pattern: '^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$' } }),
    P('rgbColor', 'string', 'Functional RGB notation.', 'rgb(79, 70, 229)', { validation: { pattern: '^rgb\\(\\d{1,3},\\s*\\d{1,3},\\s*\\d{1,3}\\)$' } }),
    P('hslColor', 'string', 'Functional HSL notation.', 'hsl(243, 75%, 59%)', {}),
    P('namedColor', 'string', 'CSS named color keyword.', 'rebeccapurple', { validation: { enum: ['red', 'green', 'blue', 'black', 'white', 'rebeccapurple'] } })
  ]},
  { key: 'core', label: 'Core', prims: [
    P('null', 'null', 'Explicit null value.', null, { format: 'null' }),
    P('objectNullable', 'object', 'Object value that may also be null.', { key: 'value' }, { format: 'nullable-object' }),
    P('arrayBoolean', 'array', 'Array of boolean values.', [true, false], { format: 'array-boolean' }),
    P('arrayNumber', 'array', 'Array of numeric values.', [1.25, 2.5], { format: 'array-number' }),
    P('arrayObject', 'array', 'Array of objects.', [{ id: 1 }], { format: 'array-object' }),
    P('arrayUuid', 'array', 'Array of UUID strings.', ['550e8400-e29b-41d4-a716-446655440000'], { format: 'array-uuid', validation: { pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$' } })
  ]},
  { key: 'currency', label: 'Currency', prims: [
    P('currencyCode', 'string', 'ISO 4217 three-letter currency code.', 'USD', { validation: { pattern: '^[A-Z]{3}$', enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'] } }),
    P('currencySymbol', 'string', 'Currency display symbol.', '$', { validation: { maxLength: 3 } }),
    P('exchangeRate', 'number', 'Conversion rate against a base currency.', 1.0873, { validation: { min: 0 } })
  ]},
  { key: 'data', label: 'Data', prims: [
    P('json', 'object', 'Arbitrary JSON object.', { key: 'value' }, { format: 'json' }),
    P('jsonb', 'object', 'PostgreSQL JSONB-compatible object.', { metadata: { tags: ['tag1'] } }, { format: 'jsonb' }),
    P('collectionStatus', 'string', 'Status value describing collection membership.', 'owned', { format: 'collection-status', validation: { enum: ['owned', 'wanted', 'built'], pattern: '^(owned|wanted|built)$' } }),
    P('userStats', 'object', 'User collection statistics.', { totalSets: 42, totalParts: 12500 }, { format: 'user-stats' })
  ]},
  { key: 'database', label: 'Database', prims: [
    P('varchar', 'string', 'Variable-length character string.', 'Sample text', { format: 'varchar', validation: { minLength: 0, maxLength: 255 } }),
    P('int32', 'integer', 'Signed 32-bit integer.', 2147483647, { format: 'int32', validation: { min: -2147483648, max: 2147483647 } }),
    P('inet', 'string', 'IPv4 or IPv6 address with optional CIDR prefix.', '192.168.1.1', { format: 'inet', validation: { pattern: '^(?:[0-9A-Fa-f:.]+)(?:/(?:[0-9]|[1-9][0-9]|1[0-2][0-8]))?$', minLength: 2, maxLength: 49 } }),
    P('tsvector', 'string', 'PostgreSQL full-text search vector string.', "'api':1 'schema':2", { format: 'tsvector', validation: { minLength: 0, maxLength: 65535 } }),
    P('jsonArray', 'array', 'Arbitrary JSON array value.', [{ key: 'value' }, 123, true], { format: 'json-array' }),
    P('jsonNullable', 'object', 'Any JSON-compatible value, including null.', { key: 'value' }, { format: 'json' }),
    P('moneyNullable', 'number', 'Monetary amount, or null.', 19.99, { format: 'double', validation: { min: 0 } }),
    P('apiKeyId', 'string', 'Unique identifier for an API key record.', '550e8400-e29b-41d4-a716-446655440000', { format: 'uuid', validation: { pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$', minLength: 36, maxLength: 36 } })
  ]},
  { key: 'datetime', label: 'Date/Time', prims: [
    P('date', 'string', 'ISO 8601 full-date: YYYY-MM-DD.', '2026-06-23', { format: 'date', validation: { pattern: '^\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|02-(?:0[1-9]|1\\d|2[0-9]))$', minLength: 10, maxLength: 10 } }),
    P('time', 'string', 'Time without date in HH:mm:ss format.', '14:30:00', { format: 'time', validation: { pattern: '^(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d{1,9})?$', minLength: 8, maxLength: 18 } }),
    P('timeWithTimezone', 'string', 'Time of day with UTC marker or offset.', '14:30:00Z', { format: 'time', validation: { pattern: '^(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d{1,9})?(?:Z|[+-](?:[01]\\d|2[0-3]):[0-5]\\d)$', minLength: 9, maxLength: 24 } }),
    P('dateTime', 'string', 'ISO 8601 timestamp in RFC 3339 date-time format.', '2026-06-23T15:30:45Z', { format: 'date-time', validation: { pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{1,9})?(?:Z|[+-]\\d{2}:\\d{2})$', minLength: 20, maxLength: 35 } }),
    P('nullableTimestamp', 'string', 'ISO 8601 timestamp in RFC 3339 date-time format, or null.', '2026-06-23T15:30:45Z', { format: 'date-time', validation: { pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{1,9})?(?:Z|[+-]\\d{2}:\\d{2})$', minLength: 20, maxLength: 35 } }),
    P('timestamp', 'integer', 'Unix epoch seconds.', 1715951400, { validation: { min: 0 } }),
    P('duration', 'string', 'Duration string in ISO 8601 format.', 'P1D', { format: 'duration', validation: { pattern: '^P(?=\\d|T\\d)(?:\\d+Y)?(?:\\d+M)?(?:\\d+W)?(?:\\d+D)?(?:T(?:\\d+H)?(?:\\d+M)?(?:\\d+(?:\\.\\d+)?S)?)?$', minLength: 2, maxLength: 64 } }),
    P('expiresInSeconds', 'integer', 'Expiration duration in seconds.', 3600, { format: 'duration-seconds', validation: { min: 1, max: 31536000 } }),
    P('timezone', 'string', 'IANA timezone name.', 'America/New_York', {}),
    P('year', 'integer', 'Four-digit calendar year.', 2026, { format: 'year', validation: { min: 1900, max: 2100 } }),
    P('dateRange', 'object', 'Inclusive date range.', { start_date: '2026-01-01', end_date: '2026-12-31' }, { format: 'date-range' }),
    P('timestampRange', 'object', 'Timestamp range using RFC 3339 date-time strings.', { start_at: '2026-01-01T00:00:00Z', end_at: '2026-12-31T23:59:59Z' }, { format: 'timestamp-range' }),
    P('accessTokenId', 'string', 'Unique identifier for access token id.', '550e8400-e29b-41d4-a716-446655440000', { format: 'uuid', validation: { pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$', minLength: 36, maxLength: 36 } }),
    P('refreshTokenId', 'string', 'Unique identifier for refresh token id.', '550e8400-e29b-41d4-a716-446655440000', { format: 'uuid', validation: { pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$', minLength: 36, maxLength: 36 } }),
    P('clientSecretId', 'string', 'Unique identifier for client secret id.', '550e8400-e29b-41d4-a716-446655440000', { format: 'uuid', validation: { pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$', minLength: 36, maxLength: 36 } }),
    P('webhookSecretId', 'string', 'Unique identifier for webhook secret id.', '550e8400-e29b-41d4-a716-446655440000', { format: 'uuid', validation: { pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$', minLength: 36, maxLength: 36 } }),
    P('sessionId', 'string', 'Unique identifier for session id.', '550e8400-e29b-41d4-a716-446655440000', { format: 'uuid', validation: { pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$', minLength: 36, maxLength: 36 } })
  ]},
  { key: 'email', label: 'Email', prims: [
    P('email', 'string', 'RFC 5322 email address.', 'jane@example.com', { format: 'email', validation: { pattern: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$', maxLength: 254 } }),
    P('emailList', 'array', 'Comma-separated list of email addresses.', ['a@x.com', 'b@x.com'], {}),
    P('noreplyEmail', 'string', 'System no-reply sender address.', 'noreply@example.com', { format: 'email' })
  ]},
  { key: 'enum', label: 'Enum', prims: [
    P('status', 'string', 'Lifecycle status value.', 'active', { validation: { enum: ['draft', 'active', 'paused', 'archived'] } }),
    P('priority', 'string', 'Priority level.', 'high', { validation: { enum: ['low', 'medium', 'high', 'urgent'] } }),
    P('role', 'string', 'Access role.', 'editor', { validation: { enum: ['viewer', 'editor', 'admin', 'owner'] } }),
    P('direction', 'string', 'Sort direction.', 'asc', { validation: { enum: ['asc', 'desc'] } })
  ]},
  { key: 'file', label: 'File', prims: [
    P('fileName', 'string', 'File name with extension.', 'report-q2.pdf', { validation: { maxLength: 255 } }),
    P('fileSize', 'integer', 'File size in bytes.', 204800, { validation: { min: 0 } }),
    P('base64File', 'string', 'Base64-encoded file contents.', 'data:…base64,iVBORw0K…', { format: 'byte' }),
    P('fileUrl', 'string', 'Downloadable file location.', 'https://cdn.x.com/f/report.pdf', { format: 'uri' })
  ]},
  { key: 'geo', label: 'Geo', prims: [
    P('latitude', 'number', 'Geographic latitude in degrees.', 40.7128, { validation: { min: -90, max: 90 } }),
    P('longitude', 'number', 'Geographic longitude in degrees.', -74.006, { validation: { min: -180, max: 180 } }),
    P('countryCode', 'string', 'ISO 3166-1 alpha-2 country code.', 'US', { validation: { pattern: '^[A-Z]{2}$' } }),
    P('postalCode', 'string', 'Postal / ZIP code.', '10001', { validation: { maxLength: 12 } })
  ]},
  { key: 'id', label: 'Identifier', prims: [
    P('uuid', 'string', 'Canonical RFC 4122 UUID identifier.', '550e8400-e29b-41d4-a716-446655440000', { format: 'uuid', validation: { pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$', minLength: 36, maxLength: 36 } }),
    P('objectId', 'string', '24-char hex database object id.', '507f1f77bcf86cd799439011', { validation: { pattern: '^[0-9a-fA-F]{24}$' } }),
    P('nanoId', 'string', 'Compact URL-safe unique id.', 'V1StGXR8_Z5jdHi6B-myT', { validation: { minLength: 21, maxLength: 21 } }),
    P('ulid', 'string', 'Lexicographically sortable unique id.', '01ARZ3NDEKTSV4RRFFQ69G5FAV', { validation: { minLength: 26, maxLength: 26 } }),
    P('incrementalId', 'integer', 'Auto-incrementing primary key.', 1042, { validation: { min: 1 } })
  ]},
  { key: 'media', label: 'Media', prims: [
    P('imageUrl', 'string', 'Absolute HTTP or HTTPS image URL ending in GIF, JPG, JPEG, PNG, or WebP, with optional query string or fragment.', 'https://example.com/images/photo.jpg', { format: 'uri', validation: { pattern: '^https?:\\/\\/[^\\s?#]+\\.(?:gif|jpe?g|png|webp)(?:\\?[^\\s#]*)?(?:#[^\\s]*)?$', minLength: 12, maxLength: 2048 } }),
    P('imageFilename', 'string', 'Image filename with GIF, JPG, JPEG, PNG, or WebP extension. Allows letters, numbers, underscores, hyphens, and periods.', 'photo.jpg', { format: 'filename', validation: { pattern: '^[A-Za-z0-9][A-Za-z0-9._-]*\\.(?:gif|jpe?g|png|webp)$', minLength: 5, maxLength: 255 } }),
    P('imageMimeType', 'string', 'Supported image MIME type.', 'image/jpeg', { format: 'mime-type', validation: { pattern: '^image\\/(?:gif|jpeg|png|webp)$', enum: ['image/gif', 'image/jpeg', 'image/png', 'image/webp'], minLength: 9, maxLength: 10 } }),
    P('imageDataUrl', 'string', 'Base64-encoded image data URL for GIF, JPEG, JPG, PNG, or WebP image data.', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', { format: 'byte', validation: { pattern: '^data:image\\/(?:gif|jpe?g|png|webp);base64,[A-Za-z0-9+/]+={0,2}$', minLength: 30, maxLength: 10485760 } })
  ]},
  { key: 'money', label: 'Money', prims: [
    P('amountMinor', 'integer', 'Amount in the smallest currency unit (cents).', 4999, { validation: { min: 0 } }),
    P('amountDecimal', 'number', 'Decimal monetary amount.', 49.99, { validation: { min: 0 } }),
    P('priceRange', 'string', 'Human price bracket.', '$$', { validation: { enum: ['$', '$$', '$$$', '$$$$'] } })
  ]},
  { key: 'network', label: 'Network', prims: [
    P('ipv4', 'string', 'IPv4 address in dotted-decimal notation.', '192.168.1.1', { format: 'ipv4', validation: { pattern: '^(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)$', minLength: 7, maxLength: 15 } }),
    P('ipv6', 'string', 'IPv6 address using standard hexadecimal notation, including compressed forms.', '2001:0db8:85a3:0000:0000:8a2e:0370:7334', { format: 'ipv6', validation: { pattern: '^((?:[0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}|(?:[0-9A-Fa-f]{1,4}:){1,7}:|(?:[0-9A-Fa-f]{1,4}:){1,6}:[0-9A-Fa-f]{1,4}|(?:[0-9A-Fa-f]{1,4}:){1,5}(?::[0-9A-Fa-f]{1,4}){1,2}|(?:[0-9A-Fa-f]{1,4}:){1,4}(?::[0-9A-Fa-f]{1,4}){1,3}|(?:[0-9A-Fa-f]{1,4}:){1,3}(?::[0-9A-Fa-f]{1,4}){1,4}|(?:[0-9A-Fa-f]{1,4}:){1,2}(?::[0-9A-Fa-f]{1,4}){1,5}|[0-9A-Fa-f]{1,4}:(?:(?::[0-9A-Fa-f]{1,4}){1,6})|:(?:(?::[0-9A-Fa-f]{1,4}){1,7}|:))$', minLength: 2, maxLength: 45 } }),
    P('macAddress', 'string', 'Hardware MAC address.', '00:1B:44:11:3A:B7', { validation: { pattern: '^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$' } }),
    P('hostname', 'string', 'DNS hostname.', 'api.example.com', { format: 'hostname' }),
    P('port', 'integer', 'Network port number.', 443, { validation: { min: 0, max: 65535 } }),
    P('cidr', 'string', 'IPv4 or IPv6 network address in CIDR notation.', '192.168.0.0/24', { format: 'cidr', validation: { pattern: '^(?:[0-9A-Fa-f:.]+)/(?:[0-9]|[1-9][0-9]|1[0-2][0-8])$', minLength: 4, maxLength: 49 } })
  ]},
  { key: 'nullable', label: 'Nullable', prims: [
    P('nullableString', 'string', 'String value that may also be null.', null, { format: 'nullable-string', validation: { minLength: 0, maxLength: 4096 } }),
    P('nullableNumber', 'number', 'Numeric value, or null.', null, { format: 'double' }),
    P('nullableDate', 'string', 'Date without time in ISO 8601 full-date format, or null.', null, { format: 'date', validation: { pattern: '^\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|02-(?:0[1-9]|1\\d|2[0-9]))$', minLength: 10, maxLength: 10 } }),
    P('nullableIntegerId', 'integer', 'Positive integer identifier, or null.', null, { format: 'int64', validation: { min: 1 } }),
    P('nullableUserId', 'string', 'User UUID or null.', null, { format: 'uuid', validation: { pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$', minLength: 36, maxLength: 36 } }),
    P('nullableAccountId', 'string', 'Account UUID or null.', null, { format: 'uuid', validation: { pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$', minLength: 36, maxLength: 36 } }),
    P('nullableOrganizationId', 'string', 'Organization UUID or null.', null, { format: 'uuid', validation: { pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$', minLength: 36, maxLength: 36 } })
  ]},
  { key: 'numeric', label: 'Numeric', prims: [
    P('integer', 'integer', 'Whole number.', 42, {}),
    P('positiveInt', 'integer', 'Integer greater than or equal to 1.', 1, { validation: { min: 1 } }),
    P('float', 'number', 'Single precision floating-point number.', 3.14, { format: 'float' }),
    P('double', 'number', 'Double precision floating-point number.', 3.141592653589793, { format: 'double' }),
    P('percentage', 'number', 'Percentage value from 0 to 100.', 75.5, { validation: { min: 0, max: 100 } }),
    P('normalizedScore', 'number', 'Normalized decimal score from 0.0 to 1.0.', 0.95, { format: 'float', validation: { min: 0, max: 1 } }),
    P('decimal', 'string', 'Fixed-precision decimal as string.', '1234.56', { validation: { pattern: '^-?\\d+(?:\\.\\d+)?$' } }),
    P('smallInt', 'integer', 'Signed 16-bit integer.', 100, { format: 'int32', validation: { min: -32768, max: 32767 } }),
    P('bigInt', 'integer', 'Signed 64-bit integer.', 9223372036854775807, { format: 'int64', validation: { min: -9223372036854775808, max: 9223372036854775807 } }),
    P('nonNegativeInteger', 'integer', 'Integer greater than or equal to 0.', 0, { format: 'int64', validation: { min: 0 } }),
    P('integerId', 'integer', 'Positive integer identifier.', 1, { format: 'int64', validation: { min: 1 } }),
    P('serial', 'integer', 'Auto-incrementing positive 32-bit integer.', 1, { format: 'int32', validation: { min: 1, max: 2147483647 } }),
    P('bigSerial', 'integer', 'Auto-incrementing positive 64-bit integer.', 1, { format: 'int64', validation: { min: 1, max: 9223372036854775807 } }),
    P('versionNumber', 'integer', 'Non-negative version number used for optimistic locking.', 0, { format: 'int64', validation: { min: 0 } }),
    P('setNum', 'string', 'LEGO set number with variant suffix.', '75192-1', { format: 'lego-set-number', validation: { pattern: '^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)+$', minLength: 3, maxLength: 32 } })
  ]},
  { key: 'path', label: 'Path', prims: [
    P('filePath', 'string', 'Absolute or relative filesystem path.', '/var/log/app.log', {}),
    P('urlPath', 'string', 'URL path beginning with slash.', '/api/v1/users', { format: 'url-path', validation: { pattern: "^/(?:[A-Za-z0-9._~!$&'()*+,;=:@%-]+/?)*$", minLength: 1, maxLength: 2048 } }),
    P('s3Key', 'string', 'Object storage key.', 'uploads/2024/05/img.png', {})
  ]},
  { key: 'person', label: 'Person', prims: [
    P('firstName', 'string', 'Given name.', 'Jane', { validation: { maxLength: 100 } }),
    P('lastName', 'string', 'Family name.', 'Taylor', { validation: { maxLength: 100 } }),
    P('fullName', 'string', 'Complete display name.', 'Jane Taylor', { validation: { maxLength: 200 } }),
    P('username', 'string', 'Username containing 3 to 50 characters. Allows letters, numbers, underscores, and hyphens.', 'john_doe', { validation: { pattern: '^[A-Za-z0-9_-]+$', minLength: 3, maxLength: 50 } }),
    P('jobTitle', 'string', 'Occupational title.', 'Staff Engineer', { validation: { maxLength: 120 } })
  ]},
  { key: 'phone', label: 'Phone', prims: [
    P('e164Phone', 'string', 'E.164 international phone number.', '+14155552671', { validation: { pattern: '^\\+[1-9]\\d{1,14}$' } }),
    P('nationalPhone', 'string', 'National-format phone number.', '(415) 555-2671', {}),
    P('extension', 'string', 'Phone extension.', '4021', { validation: { pattern: '^[0-9]{1,6}$' } })
  ]},
  { key: 'ppi', label: 'PPI', prims: [
    P('ssn', 'string', 'US Social Security Number (sensitive).', '***-**-1234', { validation: { pattern: '^\\d{3}-\\d{2}-\\d{4}$' } }),
    P('passportNumber', 'string', 'Passport document number (sensitive).', 'X1234567', { validation: { maxLength: 20 } }),
    P('taxId', 'string', 'Tax identification number (sensitive).', '12-3456789', {}),
    P('creditCard', 'string', 'Primary account number, masked (sensitive).', '•••• •••• •••• 4242', { validation: { pattern: '^[0-9 •]{12,23}$' } }),
    P('addressLabel', 'string', 'User-friendly label for an address, or null.', 'Home', { format: 'address-label', validation: { pattern: '^[A-Za-z0-9][A-Za-z0-9 ._-]{0,49}$', minLength: 1, maxLength: 50 } }),
    P('addressLine1', 'string', 'Primary street address.', '1600 Amphitheatre Parkway', { format: 'address-line', validation: { minLength: 1, maxLength: 255 } }),
    P('addressLine2', 'string', 'Secondary address detail, or null.', 'Suite 200', { format: 'address-line', validation: { minLength: 1, maxLength: 255 } }),
    P('addressType', 'string', 'Type of address.', 'shipping', { format: 'address-type', validation: { enum: ['shipping', 'billing', 'both'], pattern: '^(shipping|billing|both)$' } }),
    P('formattedAddress', 'string', 'Human-readable postal address, or null.', '1600 Amphitheatre Parkway, Mountain View, CA 94043, US', { format: 'formatted-address', validation: { minLength: 1, maxLength: 512 } }),
    P('locality', 'string', 'City, town, municipality, or locality.', 'Mountain View', { format: 'locality', validation: { pattern: "^[A-Za-z0-9][A-Za-z0-9 .,'\u2019_-]{0,99}$", minLength: 1, maxLength: 100 } }),
    P('region', 'string', 'State, province, county, or region, or null.', 'CA', { format: 'region', validation: { pattern: "^[A-Za-z0-9][A-Za-z0-9 .,'\u2019_-]{0,99}$", minLength: 1, maxLength: 100 } }),
    P('avatarUrl', 'string', "Absolute HTTP or HTTPS URL to the user's profile image, or null.", 'https://assets.example.com/avatars/user123.jpg', { format: 'uri', validation: { minLength: 10, maxLength: 2048 } }),
    P('displayName', 'string', 'Display name or alias.', 'Walter Torres', { format: 'display-name', validation: { pattern: "^[A-Za-z0-9][A-Za-z0-9 ._'@-]{1,48}[A-Za-z0-9]$", minLength: 3, maxLength: 50 } })
  ]},
  { key: 'security', label: 'Security', prims: [
    P('accountId', 'string', 'Canonical RFC 4122 UUID identifier for an account.', '550e8400-e29b-41d4-a716-446655440000', { format: 'uuid', validation: { pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$', minLength: 36, maxLength: 36 } }),
    P('organizationId', 'string', 'Canonical RFC 4122 UUID identifier for an organization.', '550e8400-e29b-41d4-a716-446655440000', { format: 'uuid', validation: { pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$', minLength: 36, maxLength: 36 } }),
    P('userId', 'string', 'Canonical RFC 4122 UUID identifier for a user.', '550e8400-e29b-41d4-a716-446655440000', { format: 'uuid', validation: { pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$', minLength: 36, maxLength: 36 } }),
    P('role', 'string', 'User permission level.', 'user', { format: 'role', validation: { enum: ['user', 'moderator', 'admin'], pattern: '^(user|moderator|admin)$', minLength: 4, maxLength: 9 } }),
    P('accountRole', 'string', 'Account Role value.', 'owner', { format: 'account-role', validation: { enum: ['owner', 'admin', 'member', 'viewer'] } }),
    P('organizationRole', 'string', 'Organization Role value.', 'owner', { format: 'organization-role', validation: { enum: ['owner', 'admin', 'member', 'viewer'] } }),
    P('userRole', 'string', 'User Role value.', 'user', { format: 'user-role', validation: { enum: ['user', 'minor', 'moderator', 'admin'] } }),
    P('recoveryToken', 'string', 'Short-lived token for account recovery.', 'abc123xyz789TOKEN', { format: 'recovery-token', validation: { pattern: '^[A-Za-z0-9._~+/=-]+$', minLength: 16, maxLength: 512 } }),
    P('tokenType', 'string', 'Authentication scheme type used in the Authorization header.', 'Bearer', { format: 'authorization-scheme', validation: { enum: ['Bearer', 'Basic', 'DPoP', 'Digest', 'HOBA', 'Mutual', 'Negotiate', 'Vapid'], pattern: '^(Bearer|Basic|DPoP|Digest|HOBA|Mutual|Negotiate|Vapid)$', minLength: 4, maxLength: 9 } })
  ]},
  { key: 'string', label: 'String', prims: [
    P('arrayString', 'array', 'Array of string values.', ['option1', 'option2', 'option3'], { format: 'string-array' }),
    P('arrayInteger', 'array', 'Array of integer values.', [1, 2, 3, 4, 5], { format: 'integer-array' }),
    P('binary', 'string', 'Binary file payload.', '<binary>', { format: 'binary' }),
    P('hostnamePort', 'string', 'Hostname with required TCP port.', 'localhost:8080', { format: 'hostname-port', validation: { pattern: '^(?=.{3,259}$)(?:localhost|(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\\.)*[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?):(?:[1-9][0-9]{0,4})$', minLength: 3, maxLength: 259 } }),
    P('jsonPointer', 'string', 'JSON Pointer value.', '/data/user/id', { format: 'json-pointer', validation: { pattern: '^(?:/(?:[^/~]|~0|~1)*)*$', minLength: 0, maxLength: 2048 } }),
    P('queryString', 'string', 'URL query string without leading question mark.', 'page=1&limit=25', { format: 'query-string', validation: { pattern: "^[A-Za-z0-9._~!$&'()*+,;=:@/?%-]*(?:=[A-Za-z0-9._~!$&'()*+,;=:@/?%-]*)?(?:&[A-Za-z0-9._~!$&'()*+,;=:@/?%-]*(?:=[A-Za-z0-9._~!$&'()*+,;=:@/?%-]*)?)*$", minLength: 0, maxLength: 2048 } }),
    P('regex', 'string', 'Regular expression pattern string.', '^[A-Za-z0-9_-]+$', { format: 'regex', validation: { minLength: 1, maxLength: 4096 } }),
    P('uriTemplate', 'string', 'URI template with placeholders.', 'https://api.example.com/users/{userId}', { format: 'uri-template', validation: { pattern: '^[A-Za-z][A-Za-z0-9+.-]*://[^\\s<>]+(?:\\{[A-Za-z_][A-Za-z0-9_]*\\})?[^\\s<>]*$', minLength: 1, maxLength: 2048 } })
  ]},
  { key: 'text', label: 'Text', prims: [
    P('shortText', 'string', 'Single-line free text.', 'Quick note', { validation: { maxLength: 255 } }),
    P('longText', 'string', 'Multi-line free text.', 'A longer description…', { validation: { maxLength: 5000 } }),
    P('markdown', 'string', 'Markdown-formatted text.', '# Heading\n\nMarkdown content.', { format: 'markdown', validation: { minLength: 0, maxLength: 65535 } }),
    P('comment', 'string', 'User comment body.', 'Looks good to me!', { validation: { maxLength: 2000 } })
  ]},
  { key: 'url', label: 'URL/URI', prims: [
    P('url', 'string', 'Absolute HTTP(S) URL.', 'https://example.com/page', { format: 'uri', validation: { pattern: '^https?://' } }),
    P('uri', 'string', 'Absolute URI or URL value.', 'https://example.com/resource', { format: 'uri', validation: { pattern: '^[A-Za-z][A-Za-z0-9+.-]*:\\/\\/[^\\s<>]+$', minLength: 8, maxLength: 2048 } }),
    P('domain', 'string', 'Registrable domain name.', 'example.com', { format: 'hostname' }),
    P('websocketUrl', 'string', 'WebSocket endpoint URL.', 'wss://rt.example.com/socket', { validation: { pattern: '^wss?://' } })
  ]},
  { key: 'web', label: 'Web', prims: [
    P('href', 'string', 'Relative or absolute URI identifying an API resource.', '/users/550e8400-e29b-41d4-a716-446655440000', { format: 'uri-reference', validation: { pattern: '^(https?:\\/\\/[^\\s]+|\\/[^\\s]*)$', minLength: 1, maxLength: 2048 } }),
    P('linkRelation', 'string', 'Relationship name describing how a link relates to the current resource.', 'self', { format: 'link-relation', validation: { pattern: '^[A-Za-z][A-Za-z0-9._:-]{0,127}$', minLength: 1, maxLength: 128 } })
  ]},
  { key: 'version', label: 'Version', prims: [
    P('semver', 'string', 'Semantic version string.', '1.0.0', { format: 'semver', validation: { pattern: '^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9A-Za-z-][0-9A-Za-z-]*)(?:\\.(?:0|[1-9A-Za-z-][0-9A-Za-z-]*))*))?(?:\\+([0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*))?$', minLength: 5, maxLength: 255 } }),
    P('apiVersion', 'string', 'Dated or prefixed API version.', 'v1', { validation: { pattern: '^v\\d+$' } }),
    P('buildNumber', 'integer', 'Monotonic build counter.', 4821, { validation: { min: 0 } })
  ]}
];

export const PRIM_CATEGORIES = CATEGORIES;
