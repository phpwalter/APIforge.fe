import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GeneralSettingsPanel } from './GeneralSettingsPanel';
import { useAppStore } from '../../state/useAppStore';

const initialState = useAppStore.getState();

beforeEach(() => {
  useAppStore.setState(initialState, true);
});

describe('GeneralSettingsPanel — Workspace Name', () => {
  it('is the first field, showing the current workspace name', () => {
    useAppStore.setState({ currentWorkspaceName: 'My API' });
    render(<GeneralSettingsPanel />);

    const fieldLabels = screen.getAllByText(/Workspace Name|OpenAPI Version/);
    expect(fieldLabels[0]).toHaveTextContent('Workspace Name');
    expect(screen.getByDisplayValue('My API')).toBeInTheDocument();
  });

  it('shows an empty field with a placeholder when no workspace is named yet', () => {
    useAppStore.setState({ currentWorkspaceName: null });
    render(<GeneralSettingsPanel />);

    expect(screen.getByPlaceholderText('Untitled Workspace')).toHaveValue('');
  });

  it('editing the field updates the store live, without trimming or falling back mid-edit', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ currentWorkspaceName: 'My API' });
    render(<GeneralSettingsPanel />);

    const input = screen.getByDisplayValue('My API');
    await user.clear(input);
    await user.type(input, 'Renamed');

    expect(useAppStore.getState().currentWorkspaceName).toBe('Renamed');
  });

  it('clearing the field to empty is allowed while editing (not forced to a fallback name)', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ currentWorkspaceName: 'My API' });
    render(<GeneralSettingsPanel />);

    await user.clear(screen.getByDisplayValue('My API'));

    expect(useAppStore.getState().currentWorkspaceName).toBe('');
  });
});

describe('GeneralSettingsPanel — existing fields', () => {
  it('still renders the OpenAPI project fields', () => {
    render(<GeneralSettingsPanel />);
    expect(screen.getByText('OpenAPI Version')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });
});
