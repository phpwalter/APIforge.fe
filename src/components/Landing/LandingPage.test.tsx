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

describe('LandingPage — footer doc links', () => {
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

  it('does nothing for a footer link with no associated doc (e.g. Status)', async () => {
    const user = userEvent.setup();
    render(<LandingPage />);

    await user.click(screen.getByRole('button', { name: 'Status' }));

    expect(useAppStore.getState().docDialogOpen).toBe(false);
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
