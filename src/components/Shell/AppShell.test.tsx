import { render, screen } from '@testing-library/react';
import { AppShell } from './AppShell';
import { useAppStore } from '../../state/useAppStore';
import { useSpecStore } from '../../state/useSpecStore';

const initialAppState = useAppStore.getState();
const initialSpecState = useSpecStore.getState();

beforeEach(() => {
  useAppStore.setState(initialAppState, true);
  useSpecStore.setState(initialSpecState, true);
});

describe('AppShell — new-project reveal gate', () => {
  it('shows the empty state when nothing is loaded', () => {
    render(<AppShell />);
    expect(screen.getByText('No API document loaded')).toBeInTheDocument();
  });

  it('still shows the empty state (not the canvas) while a new project has content but no name yet', () => {
    useSpecStore.getState().loadSampleProject();
    useAppStore.getState().startProject('Sample Project');
    // hasDocument is true and content is real at this point, but currentProjectName is still
    // null — the naming prompt hasn't been confirmed.
    expect(useSpecStore.getState().hasDocument).toBe(true);
    expect(useAppStore.getState().currentProjectName).toBeNull();

    render(<AppShell />);

    expect(screen.getByText('No API document loaded')).toBeInTheDocument();
  });

  it('reveals the canvas once the project has been named', () => {
    useSpecStore.getState().loadSampleProject();
    useAppStore.getState().startProject('Sample Project');
    useAppStore.getState().confirmProjectName('My Sample Project');

    render(<AppShell />);

    expect(screen.queryByText('No API document loaded')).not.toBeInTheDocument();
  });

  it('does not show the project name or version pills in the title bar until named', () => {
    useSpecStore.getState().loadSampleProject();
    useAppStore.getState().startProject('Sample Project');
    render(<AppShell />);

    expect(screen.queryByText('OAS 3.1.0')).not.toBeInTheDocument();
  });

  it('shows the project name and version pills in the title bar once named', () => {
    useSpecStore.getState().loadSampleProject();
    useAppStore.getState().startProject('Sample Project');
    useAppStore.getState().confirmProjectName('My Sample Project');
    render(<AppShell />);

    expect(screen.getByText('OAS 3.1.0')).toBeInTheDocument();
  });

  it('an already-named reopened project shows the canvas and title bar immediately', () => {
    useSpecStore.getState().loadSampleProject();
    useAppStore.getState().openExistingProject('proj-1', 'Reopened API');

    render(<AppShell />);

    expect(screen.queryByText('No API document loaded')).not.toBeInTheDocument();
    expect(screen.getByText('OAS 3.1.0')).toBeInTheDocument();
  });
});
