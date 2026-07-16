import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormattingSettingsPanel } from './FormattingSettingsPanel';
import { useAppStore } from '../../state/useAppStore';

const initialState = useAppStore.getState();

beforeEach(() => {
  useAppStore.setState(initialState, true);
});

describe('FormattingSettingsPanel', () => {
  it('renders with no per-format tabs — this setting applies to YAML and JSON alike', () => {
    render(<FormattingSettingsPanel />);

    expect(screen.queryByRole('button', { name: 'YAML' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'JSON' })).not.toBeInTheDocument();
  });

  it('defaults to 2 spaces, Spaces style, and Word Wrap off', () => {
    render(<FormattingSettingsPanel />);

    expect(useAppStore.getState().formattingIndentSize).toBe(2);
    expect(useAppStore.getState().formattingIndentStyle).toBe('spaces');
    expect(useAppStore.getState().formattingWordWrap).toBe(false);
    expect(screen.getByRole('button', { name: 'Off' })).toHaveAttribute('data-active', 'true');
  });

  it('switches indent size between 2 and 4 spaces', async () => {
    const user = userEvent.setup();
    render(<FormattingSettingsPanel />);

    await user.click(screen.getByText('4 spaces'));
    expect(useAppStore.getState().formattingIndentSize).toBe(4);

    await user.click(screen.getByText('2 spaces'));
    expect(useAppStore.getState().formattingIndentSize).toBe(2);
  });

  it('switches indent style between Spaces and Tabs', async () => {
    const user = userEvent.setup();
    render(<FormattingSettingsPanel />);

    await user.click(screen.getByText('Tabs'));
    expect(useAppStore.getState().formattingIndentStyle).toBe('tabs');

    await user.click(screen.getByText('Spaces'));
    expect(useAppStore.getState().formattingIndentStyle).toBe('spaces');
  });

  it('toggles Word Wrap on/off via the pill buttons', async () => {
    const user = userEvent.setup();
    render(<FormattingSettingsPanel />);

    const onBtn = screen.getByRole('button', { name: 'On' });
    const offBtn = screen.getByRole('button', { name: 'Off' });
    expect(onBtn).toHaveAttribute('data-active', 'false');
    expect(offBtn).toHaveAttribute('data-active', 'true');

    await user.click(onBtn);
    expect(useAppStore.getState().formattingWordWrap).toBe(true);
    expect(onBtn).toHaveAttribute('data-active', 'true');
    expect(offBtn).toHaveAttribute('data-active', 'false');

    await user.click(offBtn);
    expect(useAppStore.getState().formattingWordWrap).toBe(false);
  });
});
