import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProviderConnectionPanel } from './ProviderConnectionPanel';

describe('ProviderConnectionPanel', () => {
  it('renders a disabled Connect button when onConnect is omitted (a stub provider)', () => {
    render(<ProviderConnectionPanel title="GitLab" description="desc" providerLabel="GitLab" connected={false} />);
    const btn = screen.getByRole('button', { name: 'Connect with GitLab' });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('title', 'Coming soon');
  });

  it('renders an enabled Connect button that calls onConnect when provided', async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn();
    render(
      <ProviderConnectionPanel
        title="GitHub"
        description="desc"
        providerLabel="GitHub"
        connected={false}
        onConnect={onConnect}
      />,
    );

    const btn = screen.getByRole('button', { name: 'Connect with GitHub' });
    expect(btn).not.toBeDisabled();
    await user.click(btn);
    expect(onConnect).toHaveBeenCalled();
  });

  it('shows the connected label and a Disconnect button when onDisconnect is provided', async () => {
    const user = userEvent.setup();
    const onDisconnect = vi.fn();
    render(
      <ProviderConnectionPanel
        title="GitHub"
        description="desc"
        providerLabel="GitHub"
        connected
        connectedLabel="Connected as octocat"
        onDisconnect={onDisconnect}
      />,
    );

    expect(screen.getByText('Connected as octocat')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Disconnect' }));
    expect(onDisconnect).toHaveBeenCalled();
  });

  it('hides the Disconnect button when onDisconnect is omitted (e.g. primary sign-in)', () => {
    render(
      <ProviderConnectionPanel
        title="GitHub"
        description="desc"
        providerLabel="GitHub"
        connected
        connectedLabel="Connected · Primary sign-in"
      />,
    );

    expect(screen.getByText('Connected · Primary sign-in')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Disconnect' })).not.toBeInTheDocument();
  });
});
