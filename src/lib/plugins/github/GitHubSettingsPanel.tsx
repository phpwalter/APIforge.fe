import { useAppStore } from '../../../state/useAppStore';
import { redirectToProviderLink } from '../../api/auth';
import { ProviderConnectionPanel } from '../shared/ProviderConnectionPanel';

export function GitHubSettingsPanel() {
  const authProvider = useAppStore((s) => s.authProvider);
  const link = useAppStore((s) => s.versionControlLinks.github);
  const disconnectVersionControlProvider = useAppStore((s) => s.disconnectVersionControlProvider);

  const isPrimarySignIn = authProvider === 'github';
  const connected = isPrimarySignIn || link != null;
  const connectedLabel = link?.username
    ? `Connected as ${link.username}`
    : isPrimarySignIn
      ? 'Connected · Primary sign-in'
      : 'Connected';

  return (
    <ProviderConnectionPanel
      title="GitHub"
      description="Connect your GitHub account via OAuth to link it to your APIforge account."
      providerLabel="GitHub"
      connected={connected}
      connectedLabel={connectedLabel}
      onConnect={connected ? undefined : () => redirectToProviderLink('github')}
      onDisconnect={connected && !isPrimarySignIn ? () => disconnectVersionControlProvider('github') : undefined}
    />
  );
}
