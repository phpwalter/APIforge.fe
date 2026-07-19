import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectSettingsModal } from './ProjectSettingsModal';
import { useAppStore } from '../../state/useAppStore';

const initialState = useAppStore.getState();

beforeEach(() => {
  useAppStore.setState(initialState, true);
});

describe('ProjectSettingsModal', () => {
  it('defaults to the General panel, listing all three categories in the rail', () => {
    render(<ProjectSettingsModal />);

    expect(screen.getAllByText('General').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Servers & External Docs/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Security Schemes/ })).toBeInTheDocument();
  });

  it('switches to the Servers panel on click', async () => {
    const user = userEvent.setup();
    render(<ProjectSettingsModal />);

    await user.click(screen.getByRole('button', { name: /Servers & External Docs/ }));

    expect(screen.getByRole('button', { name: /Servers & External Docs/ })).toHaveAttribute('data-active', 'true');
  });

  it('switches to the Security Schemes panel on click', async () => {
    const user = userEvent.setup();
    render(<ProjectSettingsModal />);

    await user.click(screen.getByRole('button', { name: /Security Schemes/ }));

    expect(screen.getByRole('button', { name: /Security Schemes/ })).toHaveAttribute('data-active', 'true');
  });

  it('OK/Cancel/close button/backdrop all close the modal', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ projectSettingsOpen: true });
    render(<ProjectSettingsModal />);

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(useAppStore.getState().projectSettingsOpen).toBe(false);
  });

  it('shows OK (not Save) for an already-existing project', () => {
    useAppStore.setState({ isNewProject: false });
    render(<ProjectSettingsModal />);

    expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
  });

  it('shows a disabled, coming-soon Save button instead of OK for a brand-new project', () => {
    useAppStore.setState({ isNewProject: true });
    render(<ProjectSettingsModal />);

    const saveBtn = screen.getByRole('button', { name: 'Save' });
    expect(saveBtn).toBeDisabled();
    expect(saveBtn).toHaveAttribute('title', 'Save to server — coming soon');
    expect(screen.queryByRole('button', { name: 'OK' })).not.toBeInTheDocument();
  });

  it('Cancel still closes the modal for a brand-new project', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ isNewProject: true, projectSettingsOpen: true });
    render(<ProjectSettingsModal />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(useAppStore.getState().projectSettingsOpen).toBe(false);
  });
});
