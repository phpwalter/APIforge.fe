import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GitLabSettingsPanel } from './GitLabSettingsPanel';

describe('GitLabSettingsPanel', () => {
  it('shows a disabled "Connect with GitLab" button — no backend OAuth callback exists yet', async () => {
    const user = userEvent.setup();
    render(<GitLabSettingsPanel />);

    const btn = screen.getByRole('button', { name: 'Connect with GitLab' });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('title', 'Coming soon');

    await user.click(btn);
    expect(screen.queryByText(/Connected/)).not.toBeInTheDocument();
  });
});
