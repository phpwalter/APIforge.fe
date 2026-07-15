import {
  clearAuthToken,
  getAuthProvider,
  getAuthToken,
  setAuthProvider,
  setAuthToken,
  setPendingAuthProvider,
  takePendingAuthProvider,
} from './authToken';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('auth token + provider (localStorage, survives a reload)', () => {
  it('stores and retrieves the token', () => {
    expect(getAuthToken()).toBeNull();
    setAuthToken('tok');
    expect(getAuthToken()).toBe('tok');
  });

  it('stores and retrieves the provider', () => {
    expect(getAuthProvider()).toBeNull();
    setAuthProvider('github');
    expect(getAuthProvider()).toBe('github');
  });

  it('clearAuthToken removes both the token and the provider', () => {
    setAuthToken('tok');
    setAuthProvider('github');
    clearAuthToken();
    expect(getAuthToken()).toBeNull();
    expect(getAuthProvider()).toBeNull();
  });
});

describe('pending auth provider (sessionStorage, one-shot for the redirect round trip)', () => {
  it('is null when nothing was recorded', () => {
    expect(takePendingAuthProvider()).toBeNull();
  });

  it('returns the recorded provider exactly once, then clears it', () => {
    setPendingAuthProvider('github');
    expect(takePendingAuthProvider()).toBe('github');
    expect(takePendingAuthProvider()).toBeNull();
  });
});
