import {
  clearAuthToken,
  getAuthProvider,
  getAuthToken,
  setAuthProvider,
  setAuthToken,
  setPendingAuthProvider,
  setPendingLinkProvider,
  takePendingAuthProvider,
  takePendingLinkProvider,
} from './authToken';

beforeEach(() => {
  sessionStorage.clear();
  clearAuthToken();
});

describe('reload-safe auth session', () => {
  it('persists token and provider in session storage', () => {
    setAuthToken('tok');
    setAuthProvider('github');

    expect(getAuthToken()).toBe('tok');
    expect(getAuthProvider()).toBe('github');
    expect(sessionStorage.getItem('apiforge.auth.token')).toBe('tok');
    expect(sessionStorage.getItem('apiforge.auth.provider')).toBe('github');
    expect(localStorage.length).toBe(0);
  });

  it('clears both values', () => {
    setAuthToken('tok');
    setAuthProvider('github');
    clearAuthToken();

    expect(getAuthToken()).toBeNull();
    expect(getAuthProvider()).toBeNull();
    expect(sessionStorage.getItem('apiforge.auth.token')).toBeNull();
    expect(sessionStorage.getItem('apiforge.auth.provider')).toBeNull();
  });
});

describe('one-shot redirect markers', () => {
  it('keeps sign-in and link markers separate and consumes each once', () => {
    setPendingAuthProvider('google');
    setPendingLinkProvider('github');

    expect(takePendingLinkProvider()).toBe('github');
    expect(takePendingLinkProvider()).toBeNull();
    expect(takePendingAuthProvider()).toBe('google');
    expect(takePendingAuthProvider()).toBeNull();
  });
});
