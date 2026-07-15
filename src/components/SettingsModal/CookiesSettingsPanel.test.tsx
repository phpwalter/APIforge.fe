import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CookiesSettingsPanel } from './CookiesSettingsPanel';
import { useAppStore } from '../../state/useAppStore';

const initialState = useAppStore.getState();

beforeEach(() => {
  useAppStore.setState(initialState, true);
  localStorage.clear();
});

describe('CookiesSettingsPanel', () => {
  it('renders Strictly Necessary as always on and disabled', () => {
    render(<CookiesSettingsPanel />);

    const necessary = screen.getByRole('switch', { name: 'Strictly Necessary' });
    expect(necessary).toHaveAttribute('aria-checked', 'true');
    expect(necessary).toBeDisabled();
  });

  it('toggles Analytics on immediately and persists it, without a separate save step', async () => {
    const user = userEvent.setup();
    render(<CookiesSettingsPanel />);

    const analytics = screen.getByRole('switch', { name: 'Analytics' });
    expect(analytics).toHaveAttribute('aria-checked', 'false');

    await user.click(analytics);

    expect(analytics).toHaveAttribute('aria-checked', 'true');
    expect(useAppStore.getState().cookiePrefs.analytics).toBe(true);
    expect(JSON.parse(localStorage.getItem('apiforge_cookie_prefs') ?? '{}')).toEqual({
      analytics: true,
      marketing: false,
    });
  });

  it('toggles Marketing independently of Analytics', async () => {
    const user = userEvent.setup();
    render(<CookiesSettingsPanel />);

    await user.click(screen.getByRole('switch', { name: 'Marketing' }));

    expect(useAppStore.getState().cookiePrefs).toEqual({ analytics: false, marketing: true });
  });

  it('opens the doc dialog with the cookies policy from the "Cookie Policy" link', async () => {
    const user = userEvent.setup();
    render(<CookiesSettingsPanel />);

    await user.click(screen.getByRole('button', { name: 'Cookie Policy' }));

    expect(useAppStore.getState().docDialogOpen).toBe(true);
    expect(useAppStore.getState().docDialogTitle).toBe('Cookies');
    expect(useAppStore.getState().docDialogSrc).toBe('/docs/cookies.md');
  });
});
