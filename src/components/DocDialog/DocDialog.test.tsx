import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { DocDialog } from './DocDialog';
import { useAppStore } from '../../state/useAppStore';

const initialState = useAppStore.getState();

beforeEach(() => {
  useAppStore.setState(initialState, true);
  useAppStore.getState().openDocDialog('Terms', '/docs/terms.md');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('DocDialog', () => {
  it('shows the title and fetched, rendered markdown content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('# Terms\n\nPlease read.') }));
    render(<DocDialog />);

    expect(screen.getByText('Terms')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Please read.')).toBeInTheDocument());
  });

  it('shows an error message when the fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    render(<DocDialog />);

    await waitFor(() => expect(screen.getByText("Couldn't load this document.")).toBeInTheDocument());
  });

  it('closes on Escape and on clicking the scrim', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('Body.') }));
    render(<DocDialog />);
    await waitFor(() => expect(screen.getByText('Body.')).toBeInTheDocument());

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(useAppStore.getState().docDialogOpen).toBe(false);
  });

  it('closes when clicking the close button', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('Body.') }));
    render(<DocDialog />);
    await waitFor(() => expect(screen.getByText('Body.')).toBeInTheDocument());

    fireEvent.click(screen.getByTitle('Close'));
    expect(useAppStore.getState().docDialogOpen).toBe(false);
  });
});
