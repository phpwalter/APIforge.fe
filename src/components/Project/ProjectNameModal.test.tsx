import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectNameModal } from './ProjectNameModal';
import { useAppStore } from '../../state/useAppStore';
import { useSpecStore } from '../../state/useSpecStore';

const initialState = useAppStore.getState();
const initialSpecState = useSpecStore.getState();

beforeEach(() => {
  useAppStore.setState(initialState, true);
  useSpecStore.setState(initialSpecState, true);
});

describe('ProjectNameModal', () => {
  it('shows the "New Project" title', () => {
    useAppStore.getState().startProject('Untitled API');
    render(<ProjectNameModal />);

    expect(screen.getByText('New Project')).toBeInTheDocument();
  });

  it('starts with an empty input, showing the suggested name only as placeholder text', () => {
    useAppStore.getState().startProject('Untitled API');
    render(<ProjectNameModal />);

    const input = screen.getByPlaceholderText('Untitled API');
    expect(input).toHaveValue('');
  });

  it('Save is disabled with fewer than 2 characters, and enables at 2', async () => {
    const user = userEvent.setup();
    useAppStore.getState().startProject('Untitled API');
    render(<ProjectNameModal />);

    const input = screen.getByPlaceholderText('Untitled API');
    const saveBtn = screen.getByRole('button', { name: 'Save' });
    expect(saveBtn).toBeDisabled();

    await user.type(input, 'A');
    expect(saveBtn).toBeDisabled();

    await user.type(input, 'B');
    expect(saveBtn).toBeEnabled();
  });

  it('a whitespace-only name still counts as too short', async () => {
    const user = userEvent.setup();
    useAppStore.getState().startProject('Untitled API');
    render(<ProjectNameModal />);

    await user.type(screen.getByPlaceholderText('Untitled API'), '  ');

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('Save confirms the typed name and closes the prompt', async () => {
    const user = userEvent.setup();
    useAppStore.getState().startProject('Untitled API');
    render(<ProjectNameModal />);

    await user.type(screen.getByPlaceholderText('Untitled API'), 'My Payments API');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(useAppStore.getState().currentProjectName).toBe('My Payments API');
    expect(useAppStore.getState().projectNamePromptOpen).toBe(false);
  });

  it('pressing Enter confirms once there are 2+ characters', async () => {
    const user = userEvent.setup();
    useAppStore.getState().startProject('Untitled API');
    render(<ProjectNameModal />);

    await user.type(screen.getByPlaceholderText('Untitled API'), 'AB{Enter}');

    expect(useAppStore.getState().currentProjectName).toBe('AB');
    expect(useAppStore.getState().projectNamePromptOpen).toBe(false);
  });

  it('pressing Enter with fewer than 2 characters does not confirm', async () => {
    const user = userEvent.setup();
    useAppStore.getState().startProject('Untitled API');
    render(<ProjectNameModal />);

    await user.type(screen.getByPlaceholderText('Untitled API'), 'A{Enter}');

    expect(useAppStore.getState().projectNamePromptOpen).toBe(true);
  });

  it('Cancel discards the project entirely and closes the prompt', async () => {
    const user = userEvent.setup();
    useSpecStore.getState().loadSampleProject();
    useAppStore.getState().startProject('Sample Project');
    render(<ProjectNameModal />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(useAppStore.getState().projectNamePromptOpen).toBe(false);
    expect(useAppStore.getState().currentProjectId).toBeNull();
    expect(useAppStore.getState().currentProjectName).toBeNull();
    expect(useSpecStore.getState().hasDocument).toBe(false);
  });

  it('Escape discards the project, same as Cancel', async () => {
    const user = userEvent.setup();
    useSpecStore.getState().loadSampleProject();
    useAppStore.getState().startProject('Sample Project');
    render(<ProjectNameModal />);

    await user.keyboard('{Escape}');

    expect(useAppStore.getState().projectNamePromptOpen).toBe(false);
    expect(useAppStore.getState().currentProjectId).toBeNull();
    expect(useSpecStore.getState().hasDocument).toBe(false);
  });

  it('clicking the backdrop discards the project, same as Cancel', async () => {
    const user = userEvent.setup();
    useSpecStore.getState().loadSampleProject();
    useAppStore.getState().startProject('Sample Project');
    render(<ProjectNameModal />);

    await user.click(screen.getByRole('dialog').parentElement!);

    expect(useAppStore.getState().projectNamePromptOpen).toBe(false);
    expect(useAppStore.getState().currentProjectId).toBeNull();
    expect(useSpecStore.getState().hasDocument).toBe(false);
  });
});
