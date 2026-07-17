import { ProviderConnectionPanel } from '../shared/ProviderConnectionPanel';

export function GitLabSettingsPanel() {
  return (
    <ProviderConnectionPanel
      title="GitLab"
      description="Connect your GitLab account via OAuth."
      providerLabel="GitLab"
      connected={false}
    />
  );
}
