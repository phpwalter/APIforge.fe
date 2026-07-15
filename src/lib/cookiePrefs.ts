/** Strictly Necessary cookies are always on and aren't stored here — there's nothing to opt out of. */
export interface CookiePrefs {
  analytics: boolean;
  marketing: boolean;
}

const STORAGE_KEY = 'apiforge_cookie_prefs';

/** Privacy-preserving default: opted out until the user explicitly turns a category on. */
const DEFAULT_PREFS: CookiePrefs = { analytics: false, marketing: false };

export function getCookiePrefs(): CookiePrefs {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...DEFAULT_PREFS };
  try {
    const parsed = JSON.parse(raw) as Partial<CookiePrefs>;
    return { analytics: !!parsed.analytics, marketing: !!parsed.marketing };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function setCookiePrefs(prefs: CookiePrefs): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}
