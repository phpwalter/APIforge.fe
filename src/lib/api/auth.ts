import { apiGet, apiPatch, apiPost, apiUrl, ApiError } from './client';
import { setPendingAuthProvider, setPendingLinkProvider } from './authToken';

const AUTH_API_VERSION = 'v1';


export interface AuthProviderResponseItem {
  code: string;
  display_name: string;
  supports_pkce: boolean;
  supports_oidc: boolean;
  signin_endpoint: string;
  callback_endpoint: string;
  exchange_endpoint: string;
  display_order: number;
}

interface AuthProvidersResponse {
  data?: AuthProviderResponseItem[];
  meta?: { count?: number };
}

export async function fetchAuthProviders(): Promise<AuthProviderResponseItem[]> {
  const response = await apiGet<AuthProvidersResponse>('/auth/providers', {
    apiVersion: AUTH_API_VERSION,
    authenticated: false,
  });
  return Array.isArray(response.data) ? response.data : [];
}

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
  [key: string]: unknown;
}

export function redirectToProviderSignIn(provider: string, signinEndpoint: string): void {
  setPendingAuthProvider(provider);
  window.location.href = apiUrl(signinEndpoint);
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

export function fetchMe(): Promise<MeResponse> {
  return apiGet<MeResponse>('/auth/me', { apiVersion: 'v1' });
}

export interface UpdateMeRequest {
  display_name?: string;
  bio?: string;
  use_gravatar?: boolean;
  gravatar_email?: string;
}

export function updateMe(patch: UpdateMeRequest): Promise<MeResponse> {
  return apiPatch<MeResponse>('/auth/me', { apiVersion: 'v1' }, patch);
}

export function signOutProvider(provider: string): Promise<void> {
  return apiPost<void>(`/auth/${encodeURIComponent(provider)}/signout`, { apiVersion: 'v1' });
}

export function unlinkProvider(provider: string): Promise<void> {
  return apiPost<void>(`/auth/${encodeURIComponent(provider)}/unlink`, { apiVersion: 'v1' });
}
