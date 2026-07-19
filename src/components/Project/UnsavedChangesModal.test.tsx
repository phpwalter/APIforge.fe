import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnsavedChangesModal } from './UnsavedChangesModal';
import { useAppStore } from '../../state/useAppStore';
import { useSpecStore } from '../../state/useSpecStore';

const initialAppState = useAppStore.getState();
const initialSpecState = useSpecStore.getState();

beforeEach(() => {
  useAppStore.setState(initialAppState, true);
  useSpecStore.setState(initialSpecState, true);
});

describe('UnsavedChangesModal', () => {
  it('Cancel closes the prompt without touching the current document', async () => {
    const user = userEvent.setup();
    useSpecStore.getState().loadSampleProject();
    useAppStore.setState({ unsavedChangesPromptOpen: true });
    render(<UnsavedChangesModal />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(useAppStore.getState().unsavedChangesPromptOpen).toBe(false);
    expect(useSpecStore.getState().endpoints.length).toBeGreaterThan(0);
  });

  it('Escape backs out safely, same as Cancel', async () => {
    const user = userEvent.setup();
    useSpecStore.getState().loadSampleProject();
    useAppStore.setState({ unsavedChangesPromptOpen: true });
    render(<UnsavedChangesModal />);

    await user.keyboard('{Escape}');

    expect(useAppStore.getState().unsavedChangesPromptOpen).toBe(false);
    expect(useSpecStore.getState().endpoints.length).toBeGreaterThan(0);
  });

  it('Discard & Continue wipes the document and starts a fresh project', async () => {
    const user = userEvent.setup();
    useSpecStore.getState().loadSampleProject();
    useAppStore.setState({ unsavedChangesPromptOpen: true });
    render(<UnsavedChangesModal />);

    await user.click(screen.getByRole('button', { name: /Discard/ }));

    expect(useAppStore.getState().unsavedChangesPromptOpen).toBe(false);
    expect(useSpecStore.getState().endpoints).toEqual([]);
    expect(useAppStore.getState().projectNamePromptOpen).toBe(true);
  });
});
