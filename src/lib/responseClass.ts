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
