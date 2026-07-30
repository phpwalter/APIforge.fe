import { fetchAuthProviders } from '../../lib/api/auth';

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

let cachedProviders: AuthProvider[] | null = null;
let pendingRequest: Promise<AuthProvider[]> | null = null;

function normalizeProvider(provider: AuthProvider): AuthProvider {
  return {
    ...provider,
    code: provider.code.trim().toLowerCase(),
    display_name: provider.display_name.trim(),
    display_order: Number.isFinite(provider.display_order) ? provider.display_order : 0,
  };
}

export async function loadAuthProviders(): Promise<AuthProvider[]> {
  if (cachedProviders) return cachedProviders;
  if (pendingRequest) return pendingRequest;

  pendingRequest = fetchAuthProviders()
    .then((providers) => {
      cachedProviders = providers
        .map(normalizeProvider)
        .sort((left, right) => left.display_order - right.display_order || left.display_name.localeCompare(right.display_name));
      return cachedProviders;
    })
    .finally(() => {
      pendingRequest = null;
    });

  return pendingRequest;
}

export async function retryAuthProviders(): Promise<AuthProvider[]> {
  cachedProviders = null;
  pendingRequest = null;
  return loadAuthProviders();
}

export function getCachedAuthProvider(providerCode: string): AuthProvider | undefined {
  const normalizedCode = providerCode.trim().toLowerCase();
  return cachedProviders?.find((provider) => provider.code === normalizedCode);
}

export function providerLabel(providerCode: string): string {
  const normalizedCode = providerCode.trim().toLowerCase();
  const cached = getCachedAuthProvider(normalizedCode);
  if (cached) return cached.display_name;
  return normalizedCode.charAt(0).toUpperCase() + normalizedCode.slice(1);
}

export function clearAuthProviderCacheForTests(): void {
  cachedProviders = null;
  pendingRequest = null;
}
