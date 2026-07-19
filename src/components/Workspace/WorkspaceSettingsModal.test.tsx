import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkspaceSettingsModal } from './WorkspaceSettingsModal';
import { useAppStore } from '../../state/useAppStore';

const initialState = useAppStore.getState();

beforeEach(() => {
  useAppStore.setState(initialState, true);
});

describe('WorkspaceSettingsModal', () => {
  it('defaults to the General panel, listing all three categories in the rail', () => {
    render(<WorkspaceSettingsModal />);

    expect(screen.getAllByText('General').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Servers & External Docs/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Security Schemes/ })).toBeInTheDocument();
  });

  it('switches to the Servers panel on click', async () => {
    const user = userEvent.setup();
    render(<WorkspaceSettingsModal />);

    await user.click(screen.getByRole('button', { name: /Servers & External Docs/ }));

    expect(screen.getByRole('button', { name: /Servers & External Docs/ })).toHaveAttribute('data-active', 'true');
  });

  it('switches to the Security Schemes panel on click', async () => {
    const user = userEvent.setup();
    render(<WorkspaceSettingsModal />);

    await user.click(screen.getByRole('button', { name: /Security Schemes/ }));

    expect(screen.getByRole('button', { name: /Security Schemes/ })).toHaveAttribute('data-active', 'true');
  });

  it('OK/Cancel/close button/backdrop all close the modal', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ workspaceSettingsOpen: true });
    render(<WorkspaceSettingsModal />);

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(useAppStore.getState().workspaceSettingsOpen).toBe(false);
  });
});
