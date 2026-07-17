import { ProviderConnectionPanel } from '../shared/ProviderConnectionPanel';

export function BitbucketSettingsPanel() {
  return (
    <ProviderConnectionPanel
      title="Bitbucket"
      description="Connect your Bitbucket account via OAuth."
      providerLabel="Bitbucket"
      connected={false}
    />
  );
}
