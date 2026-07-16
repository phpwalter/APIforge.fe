import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileEncodingSettingsPanel } from './FileEncodingSettingsPanel';
import { useAppStore } from '../../state/useAppStore';

const initialState = useAppStore.getState();

beforeEach(() => {
  useAppStore.setState(initialState, true);
});

describe('FileEncodingSettingsPanel', () => {
  it('renders with no per-format tabs — this setting applies to YAML and JSON alike', () => {
    render(<FileEncodingSettingsPanel />);

    expect(screen.queryByRole('button', { name: 'YAML' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'JSON' })).not.toBeInTheDocument();
  });

  it('defaults to UTF-8, LF, and Insert Final Newline on', () => {
    render(<FileEncodingSettingsPanel />);

    expect(useAppStore.getState().fileEncodingCharacterEncoding).toBe('utf-8');
    expect(useAppStore.getState().fileEncodingLineEnding).toBe('lf');
    expect(useAppStore.getState().fileEncodingInsertFinalNewline).toBe(true);
    expect(screen.getByRole('button', { name: 'On' })).toHaveAttribute('data-active', 'true');
  });

  it('switches character encoding to UTF-8 with BOM and back', async () => {
    const user = userEvent.setup();
    render(<FileEncodingSettingsPanel />);

    await user.click(screen.getByText('UTF-8 with BOM'));
    expect(useAppStore.getState().fileEncodingCharacterEncoding).toBe('utf-8-bom');

    await user.click(screen.getByText('UTF-8'));
    expect(useAppStore.getState().fileEncodingCharacterEncoding).toBe('utf-8');
  });

  it('switches line endings between LF and CRLF', async () => {
    const user = userEvent.setup();
    render(<FileEncodingSettingsPanel />);

    await user.click(screen.getByText('CRLF (Windows)'));
    expect(useAppStore.getState().fileEncodingLineEnding).toBe('crlf');

    await user.click(screen.getByText('LF (Unix, macOS)'));
    expect(useAppStore.getState().fileEncodingLineEnding).toBe('lf');
  });

  it('toggles Insert Final Newline on/off via the pill buttons', async () => {
    const user = userEvent.setup();
    render(<FileEncodingSettingsPanel />);

    const onBtn = screen.getByRole('button', { name: 'On' });
    const offBtn = screen.getByRole('button', { name: 'Off' });
    expect(onBtn).toHaveAttribute('data-active', 'true');
    expect(offBtn).toHaveAttribute('data-active', 'false');

    await user.click(offBtn);
    expect(useAppStore.getState().fileEncodingInsertFinalNewline).toBe(false);
    expect(onBtn).toHaveAttribute('data-active', 'false');
    expect(offBtn).toHaveAttribute('data-active', 'true');

    await user.click(onBtn);
    expect(useAppStore.getState().fileEncodingInsertFinalNewline).toBe(true);
  });
});
