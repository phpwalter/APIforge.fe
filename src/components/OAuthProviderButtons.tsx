import type { ReactElement } from "react";
import { beginOAuthSignin } from "../domains/auth/oauthProviders";
import { useOAuthProviders } from "../domains/auth/useOAuthProviders";

export interface OAuthProviderButtonsProps {
  open: boolean;
  mode: "sign_in" | "sign_up";
  disabled?: boolean;
}

const iconClassByProvider: Record<string, string> = {
  google: "google-1",
  github: "github-1",
};

export function OAuthProviderButtons({
  open,
  mode,
  disabled = false,
}: OAuthProviderButtonsProps): ReactElement {
  const { providers, isLoading, error } = useOAuthProviders(open);

  if (error) {
    return (
      <div className="auth-dialog__provider-error" role="status">
        <span>Sign-in providers are temporarily unavailable.</span>
        <small>{error}</small>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="auth-dialog__provider-loading" role="status" aria-live="polite">
        Loading sign-in providers…
      </div>
    );
  }

  return (
    <div className="auth-dialog__provider-list">
      {providers.map((provider) => (
        <button
          key={provider.code}
          type="button"
          className="md3-btn md3-btn--outlined auth-dialog__provider-button"
          onClick={() => beginOAuthSignin(provider)}
          disabled={disabled}
        >
          <span
            className={`social-icon ${iconClassByProvider[provider.code] ?? ""} auth-dialog__provider-social-icon`}
            aria-hidden="true"
          />
          <span className="auth-dialog__provider-label">
            {mode === "sign_up" ? "Sign up" : "Continue"} with {provider.display_name}
          </span>
          <span className="md3-icon auth-dialog__provider-chevron" aria-hidden="true">
            chevron_right
          </span>
        </button>
      ))}
    </div>
  );
}
