import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColorSchemeSettingsPanel } from './ColorSchemeSettingsPanel';
import { useAppStore } from '../../state/useAppStore';

const initialState = useAppStore.getState();

beforeEach(() => {
  useAppStore.setState(initialState, true);
});

describe('ColorSchemeSettingsPanel', () => {
  it('renders with no per-format tabs — this setting applies to YAML and JSON alike', () => {
    render(<ColorSchemeSettingsPanel />);

    expect(screen.queryByRole('button', { name: 'YAML' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'JSON' })).not.toBeInTheDocument();
  });

  it('lists Auto plus all four Monaco built-in themes, defaulting to Auto', () => {
    render(<ColorSchemeSettingsPanel />);

    for (const label of ['Auto', 'Light', 'Dark', 'High Contrast Dark', 'High Contrast Light']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(useAppStore.getState().editorColorScheme).toBe('auto');
    expect(screen.getByRole('button', { name: /^Auto/ })).toHaveAttribute('data-active', 'true');
  });

  it('switches the color scheme and marks only the selected option active', async () => {
    const user = userEvent.setup();
    render(<ColorSchemeSettingsPanel />);

    const darkOption = screen.getByRole('button', { name: /^Dark/ });
    await user.click(darkOption);

    expect(useAppStore.getState().editorColorScheme).toBe('vs-dark');
    expect(darkOption).toHaveAttribute('data-active', 'true');
    expect(screen.getByRole('button', { name: /^Auto/ })).toHaveAttribute('data-active', 'false');

    await user.click(screen.getByRole('button', { name: /^High Contrast Light/ }));
    expect(useAppStore.getState().editorColorScheme).toBe('hc-light');
    expect(darkOption).toHaveAttribute('data-active', 'false');
  });
});
