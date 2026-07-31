import {
  checkAuthProviders,
  fetchAuthProviders,
  type AuthProvider,
  type AuthProvidersResult,
} from '../../lib/api/auth';

export type { AuthProvider } from '../../lib/api/auth';

const STORAGE_KEY = 'apiforge.auth.providers.v1';

interface StoredProviderCache {
  etag: string;
  providers: AuthProvider[];
}

let cachedProviders: AuthProvider[] | null = null;
let cachedEtag: string | null = null;
let pendingRequest: Promise<AuthProvider[]> | null = null;

function normalizeProvider(provider: AuthProvider): AuthProvider {
  return {
    ...provider,
    code: provider.code.trim().toLowerCase(),
    display_name: provider.display_name.trim(),
    display_order: Number.isFinite(provider.display_order) ? provider.display_order : 0,
  };
}

function normalizeProviders(providers: AuthProvider[]): AuthProvider[] {
  return providers
    .map(normalizeProvider)
    .sort((left, right) => left.display_order - right.display_order || left.display_name.localeCompare(right.display_name));
}

function readStoredCache(): StoredProviderCache | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

    const candidate = parsed as Partial<StoredProviderCache>;
    if (typeof candidate.etag !== 'string' || !Array.isArray(candidate.providers)) return null;

    return {
      etag: candidate.etag,
      providers: normalizeProviders(candidate.providers),
    };
  } catch {
    return null;
  }
}

function writeStoredCache(etag: string | null, providers: AuthProvider[]): void {
  if (!etag) {
    sessionStorage.removeItem(STORAGE_KEY);
    return;
  }

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ etag, providers } satisfies StoredProviderCache));
}

function acceptResult(result: AuthProvidersResult, fallback?: AuthProvider[]): AuthProvider[] {
  if (result.notModified && fallback) return fallback;

  const providers = normalizeProviders(result.providers);
  cachedProviders = providers;
  cachedEtag = result.etag;
  writeStoredCache(result.etag, providers);
  return providers;
}

async function loadFromNetwork(forceGet: boolean): Promise<AuthProvider[]> {
  const stored = cachedProviders && cachedEtag
    ? { providers: cachedProviders, etag: cachedEtag }
    : readStoredCache();

  if (!forceGet && stored) {
    cachedProviders = stored.providers;
    cachedEtag = stored.etag;

    try {
      const head = await checkAuthProviders(stored.etag);
      if (head.notModified) return stored.providers;
    } catch {
      // The agreed recovery path is a full GET, not stale-cache fallback.
    }

    const refreshed = await fetchAuthProviders(stored.etag);
    if (refreshed.notModified) return stored.providers;
    return acceptResult(refreshed);
  }

  return acceptResult(await fetchAuthProviders());
}

export async function loadAuthProviders(): Promise<AuthProvider[]> {
  if (pendingRequest) return pendingRequest;

  pendingRequest = loadFromNetwork(false).finally(() => {
    pendingRequest = null;
  });

  return pendingRequest;
}

export async function retryAuthProviders(): Promise<AuthProvider[]> {
  pendingRequest = null;
  return loadFromNetwork(true);
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
  cachedEtag = null;
  pendingRequest = null;
  sessionStorage.removeItem(STORAGE_KEY);
}
