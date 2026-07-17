import {
  fetchMe,
  linkProvider,
  readAuthSessionFromLocation,
  redirectToProviderLink,
  redirectToProviderSignIn,
  signOutProvider,
  unlinkProvider,
} from './auth';
import { apiGet, apiPost, apiUrl } from './client';
import { takePendingAuthProvider, takePendingLinkProvider } from './authToken';

vi.mock('./client', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiUrl: vi.fn((path: string) => `http://api.test${path}`),
}));

beforeEach(() => {
  sessionStorage.clear();
});

describe('redirectToProviderSignIn', () => {
  it('navigates the full page to the backend\'s own OAuth entry point for the given provider', () => {
    // jsdom doesn't implement navigation — replace location wholesale to observe the assignment.
    const original = window.location;
    // @ts-expect-error -- deliberately replacing a read-only global for this one assertion
    delete window.location;
    window.location = { ...original, href: '' } as Location;

    redirectToProviderSignIn('google');

    expect(apiUrl).toHaveBeenCalledWith('/auth/google');
    expect(window.location.href).toBe('http://api.test/auth/google');

    window.location = original;
  });

  it('records the provider as pending, so the callback\'s return can tag the session correctly', () => {
    const original = window.location;
    // @ts-expect-error -- deliberately replacing a read-only global for this one assertion
    delete window.location;
    window.location = { ...original, href: '' } as Location;

    redirectToProviderSignIn('github');

    expect(takePendingAuthProvider()).toBe('github');

    window.location = original;
  });
});

describe('redirectToProviderLink', () => {
  it("navigates the full page to the same real OAuth entry point as sign-in, since the backend exposes no separate link redirect", () => {
    const original = window.location;
    // @ts-expect-error -- deliberately replacing a read-only global for this one assertion
    delete window.location;
    window.location = { ...original, href: '' } as Location;

    redirectToProviderLink('github');

    expect(apiUrl).toHaveBeenCalledWith('/auth/github');
    expect(window.location.href).toBe('http://api.test/auth/github');

    window.location = original;
  });

  it('records the provider as pending-LINK (not pending-sign-in), so the callback links it instead of replacing the active session', () => {
    const original = window.location;
    // @ts-expect-error -- deliberately replacing a read-only global for this one assertion
    delete window.location;
    window.location = { ...original, href: '' } as Location;

    redirectToProviderLink('github');

    expect(takePendingLinkProvider()).toBe('github');
    expect(takePendingAuthProvider()).toBeNull();

    window.location = original;
  });
});

describe('auth API wrappers', () => {
  it('fetchMe calls GET /auth/me', () => {
    fetchMe();
    expect(apiGet).toHaveBeenCalledWith('/auth/me');
  });

  it('signOutProvider calls POST /auth/{provider}/signout', () => {
    signOutProvider('google');
    expect(apiPost).toHaveBeenCalledWith('/auth/google/signout');
  });

  it('linkProvider calls POST /auth/{provider}/link', () => {
    linkProvider('google');
    expect(apiPost).toHaveBeenCalledWith('/auth/google/link');
  });

  it('unlinkProvider calls POST /auth/{provider}/unlink', () => {
    unlinkProvider('google');
    expect(apiPost).toHaveBeenCalledWith('/auth/google/unlink');
  });
});

describe('readAuthSessionFromLocation', () => {
  it('decodes a standard-base64 auth_session payload', () => {
    const payload = { user: { email: 'ada@example.com' }, token: { access_token: 'tok', expires_in: 3600 } };
    const encoded = btoa(JSON.stringify(payload));
    expect(readAuthSessionFromLocation(`?auth_session=${encoded}`)).toEqual(payload);
  });

  it('decodes a base64url payload (contains "_", unpadded) — what the real backend actually sends, and what atob() alone rejects', () => {
    // Captured verbatim from a real callback redirect.
    const raw =
      'eyJ1c2VyIjp7ImlkIjoiMzAxZDZlNWMtYTA4NS00OWM3LThhYzktMGE0MGZhODBkYmYwIiwiY29tcGFueV9pZCI6bnVsbCwic3RhdHVzX2lkIjoiMGEzYzVmOWItN2I0Zi00YTllLWI1YTctN2Y5MDJmNWMwMDAxIiwiZW1haWwiOiJvdHJ3YWx0ZXJAZ21haWwuY29tIiwidXNlcm5hbWUiOm51bGwsImRpc3BsYXlfbmFtZSI6IldhbHRlciBUb3JyZXMiLCJhdmF0YXJfdXJsIjoiaHR0cHM6XC9cL3d3dy5ncmF2YXRhci5jb21cL2F2YXRhclwvYzFlZDgxOWFiMDAyZmFlNWUxMDY5ZTY3MjgxNDI1NTc_ZD1pZGVudGljb24iLCJiaW8iOm51bGwsInByZWZlcmVuY2VzIjpbXSwibGFzdF9sb2dpbl9hdCI6IjIwMjYtMDctMTUgMDQ6MTM6NTUrMDAiLCJpc19hY3RpdmUiOnRydWUsImlzX3N5c3RlbSI6ZmFsc2UsImNyZWF0ZWRfYXQiOiIyMDI2LTA3LTA3IDIzOjA0OjI2LjExMDIyNCswMCIsInVwZGF0ZWRfYXQiOiIyMDI2LTA3LTE1IDA0OjEzOjU1LjQwNDk1OSswMCIsImNyZWF0ZWQiOmZhbHNlfSwidG9rZW4iOnsidG9rZW5fdHlwZSI6IkJlYXJlciIsImFjY2Vzc190b2tlbiI6ImV5SjBlWEFpT2lKS1YxUWlMQ0poYkdjaU9pSklVekkxTmlKOS5leUpwYzNNaU9pSmhjR2xtYjNKblpTNWhjR2tpTENKemRXSWlPaUl6TURGa05tVTFZeTFoTURnMUxUUTVZekN0T0dGak9TMHdZVFF3Wm1FNE1HUmlaakFpTENKbGJXRnBiQ0k2SW05MGNuZGhiSFJsY2tCbmJXRnBiQzVqYjIwaUxDSnBZWFFpT2pFM09EUXdPRGc0TXpVc0ltVjRjQ0k2TVRjNE5EQTVNalF6TlgwLmU4c2l6LXJ0a3h3N2VuWDlYZFNHRW00WmxkODFDRTdYNVlRTUlvZlNkekkiLCJleHBpcmVzX2luIjozNjAwfSwibmV3X3VzZXIiOmZhbHNlfQ';
    expect(raw).toContain('_');
    expect(raw.length % 4).not.toBe(0);

    const result = readAuthSessionFromLocation(`?auth_session=${raw}`);
    expect(result?.user).toMatchObject({ email: 'otrwalter@gmail.com', display_name: 'Walter Torres' });
    expect(result?.token).toMatchObject({ token_type: 'Bearer', expires_in: 3600 });
    expect(result?.token?.access_token).toMatch(/^eyJ/); // a JWT
  });

  it('returns null when there is no auth_session param', () => {
    expect(readAuthSessionFromLocation('?foo=bar')).toBeNull();
  });

  it('returns null for a malformed (non-base64 or non-JSON) auth_session value', () => {
    expect(readAuthSessionFromLocation('?auth_session=not-valid-base64!!!')).toBeNull();
  });
});
