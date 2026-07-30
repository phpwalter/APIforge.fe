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
  clearAuthToken();
  localStorage.clear();
  sessionStorage.clear();
});

describe('in-memory auth session', () => {
  it('stores token and provider without browser persistence', () => {
    setAuthToken('tok');
    setAuthProvider('github');
    expect(getAuthToken()).toBe('tok');
    expect(getAuthProvider()).toBe('github');
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it('clears both values', () => {
    setAuthToken('tok');
    setAuthProvider('github');
    clearAuthToken();
    expect(getAuthToken()).toBeNull();
    expect(getAuthProvider()).toBeNull();
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
