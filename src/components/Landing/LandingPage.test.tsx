import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LandingPage } from './LandingPage';
import { useAppStore } from '../../state/useAppStore';

vi.mock('../DocDialog/DocDialog', () => ({
  DocDialog: () => <div data-testid="doc-dialog" />,
}));

const initialState = useAppStore.getState();

beforeEach(() => {
  useAppStore.setState(initialState, true);
});

describe('LandingPage — navigation and footer links', () => {
  it('does not render the Docs footer link', () => {
    render(<LandingPage />);

    expect(screen.queryByRole('button', { name: 'Docs' })).not.toBeInTheDocument();
  });

  it('opens the doc dialog with the right title/src for a wired link', async () => {
    const user = userEvent.setup();
    render(<LandingPage />);

    expect(screen.queryByTestId('doc-dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Terms' }));

    expect(useAppStore.getState().docDialogOpen).toBe(true);
    expect(useAppStore.getState().docDialogTitle).toBe('Terms');
    expect(useAppStore.getState().docDialogSrc).toBe('/docs/terms.md');
    expect(screen.getByTestId('doc-dialog')).toBeInTheDocument();
  });

  it('opens the PPI dialog from the "Do not share my personal information" link', async () => {
    const user = userEvent.setup();
    render(<LandingPage />);

    await user.click(screen.getByRole('button', { name: 'Do not share my personal information' }));

    expect(useAppStore.getState().docDialogTitle).toBe('Do Not Share My Personal Information');
    expect(useAppStore.getState().docDialogSrc).toBe('/docs/ppi.md');
  });



  it.each([
    ['About', 'About', '/docs/about.md'],
    ['Features', 'Features', '/docs/feature.md'],
    ['Business', 'Business', '/docs/business.md'],
  ])('opens the %s header document in the page dialog', async (label, title, src) => {
    const user = userEvent.setup();
    render(<LandingPage />);

    await user.click(screen.getByRole('button', { name: label }));

    expect(useAppStore.getState().docDialogOpen).toBe(true);
    expect(useAppStore.getState().docDialogTitle).toBe(title);
    expect(useAppStore.getState().docDialogSrc).toBe(src);
  });

  it('opens the Codex documentation route in a secondary window', async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<LandingPage />);
    await user.click(screen.getByRole('button', { name: 'Codex' }));

    expect(openSpy).toHaveBeenCalledWith(
      '/docs/codex/index.html',
      'apiforge-codex',
      'noopener,noreferrer,width=1200,height=900,resizable=yes,scrollbars=yes',
    );
    openSpy.mockRestore();
  });

  it('navigates to the Pricing page from the header action', async () => {
    const user = userEvent.setup();
    const assignSpy = vi.spyOn(window.location, 'assign').mockImplementation(() => undefined);

    render(<LandingPage />);
    await user.click(screen.getByRole('button', { name: 'Pricing' }));

    expect(assignSpy).toHaveBeenCalledWith('/pricing');
    assignSpy.mockRestore();
  });


  it('opens the doc dialog with the cookies doc from the "Cookies" link', async () => {
    const user = userEvent.setup();
    render(<LandingPage />);

    await user.click(screen.getByRole('button', { name: 'Cookies' }));

    expect(useAppStore.getState().docDialogOpen).toBe(true);
    expect(useAppStore.getState().docDialogTitle).toBe('Cookies');
    expect(useAppStore.getState().docDialogSrc).toBe('/docs/cookies.md');
  });
});
