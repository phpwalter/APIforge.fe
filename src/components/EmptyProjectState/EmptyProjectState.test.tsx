import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyProjectState } from './EmptyProjectState';
import { useSpecStore } from '../../state/useSpecStore';
import { useAppStore } from '../../state/useAppStore';

const initialSpecState = useSpecStore.getState();
const initialAppState = useAppStore.getState();

beforeEach(() => {
  useSpecStore.setState(initialSpecState, true);
  useAppStore.setState(initialAppState, true);
});

describe('EmptyProjectState', () => {
  it('prompts to import or load a sample project', () => {
    render(<EmptyProjectState />);
    expect(screen.getByText('No API document loaded')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Import OpenAPI Document/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Load Sample Project/ })).toBeInTheDocument();
  });

  it('loads the sample project into the spec store on click', async () => {
    const user = userEvent.setup();
    render(<EmptyProjectState />);

    expect(useSpecStore.getState().hasDocument).toBe(false);
    await user.click(screen.getByRole('button', { name: /Load Sample Project/ }));

    const s = useSpecStore.getState();
    expect(s.hasDocument).toBe(true);
    expect(s.endpoints.length).toBeGreaterThan(0);
  });

  it('starts a new named workspace when loading the sample project', async () => {
    const user = userEvent.setup();
    render(<EmptyProjectState />);

    await user.click(screen.getByRole('button', { name: /Load Sample Project/ }));

    const app = useAppStore.getState();
    expect(app.currentWorkspaceId).not.toBeNull();
    expect(app.workspaceNamePromptOpen).toBe(true);
    expect(app.workspaceNamePromptDefault).toBe('Sample Project');
  });
});
