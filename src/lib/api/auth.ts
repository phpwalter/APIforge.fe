import { apiGetResponse, apiHead, apiPatch, apiPost, apiUrl, ApiError } from './client';
import { setPendingAuthProvider, setPendingLinkProvider } from './authToken';

const AUTH_API_VERSION = 'v1';

export interface MeResponse {
  id?: string;
  name?: string;
  display_name?: string;
  username?: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
  created_at?: string;
  last_login_at?: string;
  use_gravatar?: boolean;
  gravatar_email?: string;
  record_version?: number;
  [key: string]: unknown;
}

export function redirectToProviderSignIn(provider: string, signinEndpoint?: string): void {
  const normalizedProvider = provider.trim().toLowerCase();
  setPendingAuthProvider(normalizedProvider);
  const endpoint = signinEndpoint?.trim() || `/auth/${encodeURIComponent(normalizedProvider)}/signin`;
  window.location.href = apiUrl(endpoint);
}

export interface AuthProvider {
  code: string;
  display_name: string;
  supports_pkce: boolean;
  supports_oidc: boolean;
  signin_endpoint: string;
  callback_endpoint: string;
  exchange_endpoint: string;
  display_order: number;
}

interface AuthProvidersEnvelope {
  data: AuthProvider[];
  meta: {
    count: number;
    [key: string]: unknown;
  };
}

export interface AuthProvidersResult {
  providers: AuthProvider[];
  etag: string | null;
  notModified: boolean;
}

export async function checkAuthProviders(etag: string): Promise<AuthProvidersResult> {
  const response = await apiHead('/auth/providers', {
    apiVersion: AUTH_API_VERSION,
    authenticated: false,
    headers: { 'If-None-Match': etag },
  });

  return {
    providers: [],
    etag: response.headers.get('ETag'),
    notModified: response.status === 304,
  };
}

export async function fetchAuthProviders(etag?: string): Promise<AuthProvidersResult> {
  const response = await apiGetResponse<AuthProvidersEnvelope>('/auth/providers', {
    apiVersion: AUTH_API_VERSION,
    authenticated: false,
    headers: etag ? { 'If-None-Match': etag } : undefined,
  });

  if (!('data' in response)) {
    return {
      providers: [],
      etag: response.headers.get('ETag') ?? etag ?? null,
      notModified: response.status === 304,
    };
  }

  return {
    providers: Array.isArray(response.data.data) ? response.data.data : [],
    etag: response.headers.get('ETag'),
    notModified: false,
  };
}

interface BeginAuthorizationResponse {
  data?: { authorization_url?: string };
}

function approvedOAuthUrl(raw: string): string {
  const url = new URL(raw, window.location.origin);
  const localDevelopment = import.meta.env.DEV && ['http:', 'https:'].includes(url.protocol);
  if (!localDevelopment && url.protocol !== 'https:') {
    throw new ApiError('OAuth provider returned an insecure authorization URL.');
  }
  if (url.username || url.password) throw new ApiError('OAuth provider returned an invalid authorization URL.');
  return url.toString();
}

export async function redirectToProviderLink(provider: string): Promise<void> {
  const result = await apiPost<BeginAuthorizationResponse>(
    `/auth/${encodeURIComponent(provider)}/link`,
    { apiVersion: AUTH_API_VERSION },
  );
  const authorizationUrl = result.data?.authorization_url;
  if (!authorizationUrl) throw new ApiError('The server did not return an OAuth authorization URL.');
  setPendingLinkProvider(provider);
  window.location.href = approvedOAuthUrl(authorizationUrl);
}

export interface AuthSessionUser {
  id?: string;
  email?: string;
  display_name?: string;
  username?: string;
  avatar_url?: string;
  [key: string]: unknown;
}

export interface AuthSessionPayload {
  user?: AuthSessionUser;
  token?: { token_type?: string; access_token?: string; expires_in?: number };
  new_user?: boolean;
  linked_profile?: AuthLinkPayload;
}

interface AuthSessionExchangeResponse {
  data?: AuthSessionPayload;
  meta?: {
    provider?: string;
    new_user?: boolean;
    [key: string]: unknown;
  };
}

export interface OAuthCallbackLocation {
  code: string | null;
  provider: string | null;
}

export function readOAuthCallbackFromLocation(search: string): OAuthCallbackLocation {
  const params = new URLSearchParams(search);
  const code = params.get('code')?.trim() || null;
  const provider = params.get('provider')?.trim().toLowerCase() || null;
  return { code, provider };
}

export function readAuthorizationCodeFromLocation(search: string): string | null {
  return readOAuthCallbackFromLocation(search).code;
}

export async function exchangeAuthorizationCode(
  code: string,
  provider: string,
): Promise<AuthSessionPayload> {
  const response = await apiPost<AuthSessionExchangeResponse>(
    '/auth/session/exchange',
    { apiVersion: AUTH_API_VERSION, authenticated: false },
    { code, provider },
  );

  const session = response.data ?? {};
  return {
    ...session,
    new_user: session.new_user ?? response.meta?.new_user,
  };
}

export interface AuthLinkPayload {
  provider?: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
}

function base64UrlToBase64(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  return base64 + '='.repeat((4 - (base64.length % 4)) % 4);
}

export function readAuthLinkFromLocation(search: string): AuthLinkPayload | null {
  const raw = new URLSearchParams(search).get('auth_link_session');
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(atob(base64UrlToBase64(raw)));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as AuthLinkPayload) : null;
  } catch {
    return null;
  }
}

interface MeEnvelope {
  data: MeResponse | { user: MeResponse };
  meta?: Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireMeData(response: MeEnvelope): MeResponse {
  if (!isRecord(response.data)) {
    throw new ApiError('The authenticated-user response did not include data.');
  }

  if ('user' in response.data) {
    if (!isRecord(response.data.user)) {
      throw new ApiError('The authenticated-user response did not include a user object.');
    }
    return response.data.user as MeResponse;
  }

  return response.data as MeResponse;
}

export async function fetchMe(): Promise<MeResponse> {
  const response = await apiPost<MeEnvelope>('/auth/me', { apiVersion: AUTH_API_VERSION });
  return requireMeData(response);
}

export interface UpdateMeRequest {
  record_version: number;
  display_name?: string;
  bio?: string;
  use_gravatar?: boolean;
  gravatar_email?: string;
}

export async function updateMe(patch: UpdateMeRequest): Promise<MeResponse> {
  const response = await apiPatch<MeEnvelope>('/auth/me', { apiVersion: AUTH_API_VERSION }, patch);
  return requireMeData(response);
}

export function signOutProvider(provider: string): Promise<void> {
  return apiPost<void>(`/auth/${encodeURIComponent(provider)}/signout`, { apiVersion: 'v1' });
}

export function unlinkProvider(provider: string): Promise<void> {
  return apiPost<void>(`/auth/${encodeURIComponent(provider)}/unlink`, { apiVersion: 'v1' });
}
