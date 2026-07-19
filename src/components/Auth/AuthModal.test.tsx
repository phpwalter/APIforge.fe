import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthModal } from './AuthModal';
import { useAppStore } from '../../state/useAppStore';
import { redirectToProviderSignIn } from '../../lib/api/auth';

vi.mock('../../lib/api/auth', () => ({
  redirectToProviderSignIn: vi.fn(),
}));

const initialState = useAppStore.getState();

beforeEach(() => {
  useAppStore.setState(initialState, true);
  vi.clearAllMocks();
});

describe('AuthModal — redirect loading state', () => {
  it('clicking a live provider (GitHub) swaps its icon for a spinner and disables every provider button', async () => {
    const user = userEvent.setup();
    render(<AuthModal />);

    const githubBtn = screen.getByRole('button', { name: /GitHub/ });
    await user.click(githubBtn);

    expect(redirectToProviderSignIn).toHaveBeenCalledWith('github');
    for (const btn of screen.getAllByRole('button', { name: /Google|Atlassian|GitHub|Confluence|Apple|Bitbucket/ })) {
      expect(btn).toBeDisabled();
    }
  });

  it('sets a wait cursor on the modal scrim while redirecting', async () => {
    const user = userEvent.setup();
    render(<AuthModal />);

    await user.click(screen.getByRole('button', { name: /Google/ }));

    expect(screen.getByRole('dialog').parentElement).toHaveAttribute('data-redirecting', 'true');
  });

  it('a demo provider (no real backend) signs in instantly without entering the redirecting state', async () => {
    const user = userEvent.setup();
    render(<AuthModal />);

    await user.click(screen.getByRole('button', { name: /Atlassian/ }));

    expect(redirectToProviderSignIn).not.toHaveBeenCalled();
    expect(useAppStore.getState().signedIn).toBe(true);
    expect(screen.getByRole('button', { name: /Google/ })).not.toBeDisabled();
  });
});
