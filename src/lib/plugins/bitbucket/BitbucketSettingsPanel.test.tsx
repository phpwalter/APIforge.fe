import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BitbucketSettingsPanel } from './BitbucketSettingsPanel';

describe('BitbucketSettingsPanel', () => {
  it('shows a disabled "Connect with Bitbucket" button — no backend OAuth callback exists yet', async () => {
    const user = userEvent.setup();
    render(<BitbucketSettingsPanel />);

    const btn = screen.getByRole('button', { name: 'Connect with Bitbucket' });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('title', 'Coming soon');

    await user.click(btn);
    expect(screen.queryByText(/Connected/)).not.toBeInTheDocument();
  });
});
