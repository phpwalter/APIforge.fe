import { act, render, screen } from '@testing-library/react';
import { Topbar } from './Topbar';
import { useAppStore } from '../../state/useAppStore';
import { useSpecStore } from '../../state/useSpecStore';

const initialAppState = useAppStore.getState();
const initialSpecState = useSpecStore.getState();

beforeEach(() => {
  useAppStore.setState(initialAppState, true);
  useSpecStore.setState(initialSpecState, true);
});

describe('Topbar — project name display', () => {
  it('shows nothing for the project when none is active', () => {
    render(<Topbar />);
    expect(screen.queryByText('Untitled API')).not.toBeInTheDocument();
  });

  it('shows the confirmed project name, not the OpenAPI document title', () => {
    useSpecStore.getState().loadSampleProject();
    useAppStore.getState().startProject('Untitled API');
    useAppStore.getState().confirmProjectName('test');
    // apiTitle (the OpenAPI document's own info.title) stays at its default here — the title
    // bar must reflect currentProjectName instead, matching what the user actually typed.
    expect(useAppStore.getState().apiTitle).toBe('Untitled API');

    render(<Topbar />);

    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.queryByText('Untitled API')).not.toBeInTheDocument();
  });

  it('updates immediately if the project is renamed via Project Settings', () => {
    useSpecStore.getState().loadSampleProject();
    useAppStore.getState().startProject('Untitled API');
    useAppStore.getState().confirmProjectName('test');
    render(<Topbar />);
    expect(screen.getByText('test')).toBeInTheDocument();

    act(() => {
      useAppStore.getState().setProjectName('Renamed Project');
    });

    expect(screen.getByText('Renamed Project')).toBeInTheDocument();
    expect(screen.queryByText('test')).not.toBeInTheDocument();
  });
});


describe('Topbar — save status visibility', () => {
  it('does not show save status on the landing page', () => {
    render(<Topbar />);

    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('shows save status after a document is opened', () => {
    useSpecStore.getState().loadSampleProject();

    render(<Topbar />);

    expect(screen.getByText('Saved')).toBeInTheDocument();
  });
});

describe('Topbar — undo and redo visibility', () => {
  it('does not show undo or redo controls on the landing page', () => {
    render(<Topbar />);

    expect(screen.queryByTitle('Undo (Ctrl/Cmd+Z)')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Redo (Ctrl/Cmd+Shift+Z)')).not.toBeInTheDocument();
  });

  it('shows undo and redo controls after a document is opened', () => {
    useSpecStore.getState().loadSampleProject();

    render(<Topbar />);

    expect(screen.getByTitle('Undo (Ctrl/Cmd+Z)')).toBeInTheDocument();
    expect(screen.getByTitle('Redo (Ctrl/Cmd+Shift+Z)')).toBeInTheDocument();
  });
});

describe('Topbar — theme separator', () => {
  it('shows a vertical separator immediately before the theme control', () => {
    render(<Topbar />);

    const separator = screen.getByTestId('theme-divider');
    const themeButton = screen.getByTitle(/^Theme:/);

    expect(separator.nextElementSibling).toBe(themeButton);
  });
});
