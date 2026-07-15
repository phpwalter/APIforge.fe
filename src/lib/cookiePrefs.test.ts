import { getCookiePrefs, setCookiePrefs } from './cookiePrefs';

beforeEach(() => {
  localStorage.clear();
});

describe('cookiePrefs', () => {
  it('defaults to opted out of both optional categories', () => {
    expect(getCookiePrefs()).toEqual({ analytics: false, marketing: false });
  });

  it('stores and retrieves preferences', () => {
    setCookiePrefs({ analytics: true, marketing: false });
    expect(getCookiePrefs()).toEqual({ analytics: true, marketing: false });
  });

  it('falls back to the default when stored JSON is malformed', () => {
    localStorage.setItem('apiforge_cookie_prefs', 'not json');
    expect(getCookiePrefs()).toEqual({ analytics: false, marketing: false });
  });
});
