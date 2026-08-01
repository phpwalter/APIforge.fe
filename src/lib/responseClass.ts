export const CLASS_ORDER = ['1xx', '2xx', '3xx', '4xx', '5xx'] as const;
export type ResponseClass = (typeof CLASS_ORDER)[number];

export const CLASS_COLOR: Record<ResponseClass, string> = {
  '1xx': '#7c7c8a',
  '2xx': '#3b9c6e',
  '3xx': '#4a82d8',
  '4xx': '#c79a3a',
  '5xx': '#c75c5c',
};

/** Default code used when adding a new response for a given status class. */
export const DEFAULT_CODE_FOR_CLASS: Record<ResponseClass, string> = {
  '1xx': '100',
  '2xx': '200',
  '3xx': '302',
  '4xx': '400',
  '5xx': '500',
};

/** Valid codes offered in the per-response status-code picker, grouped by class. */
export const CODES_BY_CLASS: Record<ResponseClass, string[]> = {
  '1xx': ['100', '101', '102', '103'],
  '2xx': ['200', '201', '202', '203', '204', '205', '206'],
  '3xx': ['300', '301', '302', '303', '304', '307', '308'],
  '4xx': ['400', '401', '402', '403', '404', '405', '406', '408', '409', '410', '422', '429'],
  '5xx': ['500', '501', '502', '503', '504'],
};


/**
 * Returns the first unused response code in the selected status class.
 * Standard codes are preferred in the order defined by CODES_BY_CLASS.
 * If every listed standard code is already present, the first unused numeric
 * code in the class is returned as a deterministic fallback.
 */
export function nextAvailableCodeForClass(
  existingCodes: Iterable<string>,
  cls: ResponseClass,
): string {
  const used = new Set(
    Array.from(existingCodes)
      .map((code) => code.trim())
      .filter((code) => classOf(code) === cls),
  );

  const standardCode = CODES_BY_CLASS[cls].find((code) => !used.has(code));
  if (standardCode) return standardCode;

  const classStart = Number.parseInt(cls[0], 10) * 100;
  for (let code = classStart; code < classStart + 100; code += 1) {
    const candidate = String(code);
    if (!used.has(candidate)) return candidate;
  }

  return DEFAULT_CODE_FOR_CLASS[cls];
}

export function classOf(code: string): string {
  const n = parseInt(code, 10);
  return `${isNaN(n) ? 1 : Math.floor(n / 100)}xx`;
}

/** Status-class color for a response code, falling back to the 1xx color for out-of-range codes. */
export function colorForCode(code: string): string {
  return (CLASS_COLOR as Record<string, string>)[classOf(code)] ?? CLASS_COLOR['1xx'];
}

/** The class to show by default: the endpoint's first present class in CLASS_ORDER, else 2xx. */
export function defaultActiveClass(presentClasses: Set<string>): ResponseClass {
  return CLASS_ORDER.find((c) => presentClasses.has(c)) ?? '2xx';
}

/** Standard HTTP reason phrase for a status code, e.g. '404' -> 'Not Found'. */
const REASON_PHRASE: Record<string, string> = {
  '100': 'Continue',
  '101': 'Switching Protocols',
  '102': 'Processing',
  '103': 'Early Hints',
  '200': 'OK',
  '201': 'Created',
  '202': 'Accepted',
  '203': 'Non-Authoritative',
  '204': 'No Content',
  '205': 'Reset Content',
  '206': 'Partial Content',
  '300': 'Multiple Choices',
  '301': 'Moved Permanently',
  '302': 'Found',
  '303': 'See Other',
  '304': 'Not Modified',
  '307': 'Temporary Redirect',
  '308': 'Permanent Redirect',
  '400': 'Bad Request',
  '401': 'Unauthorized',
  '402': 'Payment Required',
  '403': 'Forbidden',
  '404': 'Not Found',
  '405': 'Method Not Allowed',
  '406': 'Not Acceptable',
  '408': 'Request Timeout',
  '409': 'Conflict',
  '410': 'Gone',
  '422': 'Unprocessable Entity',
  '429': 'Too Many Requests',
  '500': 'Internal Server Error',
  '501': 'Not Implemented',
  '502': 'Bad Gateway',
  '503': 'Service Unavailable',
  '504': 'Gateway Timeout',
};

export function reasonForCode(code: string): string | undefined {
  return REASON_PHRASE[code];
}

/** Common response content-types offered in the "add type" picker. */
export const CONTENT_TYPE_OPTIONS = [
  'application/json',
  'application/xml',
  'text/plain',
  'multipart/form-data',
  'application/x-www-form-urlencoded',
];
