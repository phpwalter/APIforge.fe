import { useEffect, useState } from "react";
import { fetchOAuthProviders, type OAuthProvider } from "./oauthProviders";

export interface OAuthProviderCatalogState {
  providers: OAuthProvider[];
  isLoading: boolean;
  error: string | null;
}

export function useOAuthProviders(open: boolean): OAuthProviderCatalogState {
  const [state, setState] = useState<OAuthProviderCatalogState>({
    providers: [],
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (!open) return undefined;

    const controller = new AbortController();
    setState((current) => ({ ...current, isLoading: true, error: null }));

    fetchOAuthProviders(controller.signal)
      .then((providers) => setState({ providers, isLoading: false, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : "OAuth providers could not be loaded.";
        setState({ providers: [], isLoading: false, error: message });
      });

    return () => controller.abort();
  }, [open]);

  return state;
}
