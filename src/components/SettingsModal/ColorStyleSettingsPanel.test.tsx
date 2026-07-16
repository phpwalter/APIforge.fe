import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColorStyleSettingsPanel } from './ColorStyleSettingsPanel';
import { useAppStore } from '../../state/useAppStore';

// The real ColorStylePreview needs a browser Monaco can run in — not available under jsdom. This
// stand-in just proves the panel wires the right props through; ColorStylePreview's own rendering
// is out of scope for this file (there's no dedicated test for it, matching how
// ProjectionMonacoEditor.test.tsx — not RestProjectionCanvas.test.tsx — owns Monaco-specific coverage).
vi.mock('./ColorStylePreview', () => ({
  ColorStylePreview: ({ monacoTheme, colorStyleCustomColors }: { monacoTheme: string; colorStyleCustomColors: Record<string, string> }) => (
    <div data-testid="color-style-preview" data-monaco-theme={monacoTheme} data-custom={JSON.stringify(colorStyleCustomColors)} />
  ),
}));

const initialState = useAppStore.getState();

beforeEach(() => {
  useAppStore.setState(initialState, true);
});

describe('ColorStyleSettingsPanel', () => {
  it('shows exactly one checkbox per category — no per-format duplication of the settings themselves', () => {
    render(<ColorStyleSettingsPanel />);

    for (const category of ['Keys', 'Strings', 'Numbers', 'Literals', 'Comments']) {
      expect(screen.getAllByRole('button', { name: new RegExp(`^${category}`) })).toHaveLength(1);
    }
  });

  it('lists all five token-type categories, defaulting to on', () => {
    render(<ColorStyleSettingsPanel />);

    for (const category of ['Keys', 'Strings', 'Numbers', 'Literals', 'Comments']) {
      const row = screen.getByRole('button', { name: new RegExp(`^${category}`) });
      expect(row.querySelector('span')).toHaveAttribute('data-checked', 'true');
    }
    expect(useAppStore.getState().colorStyle).toEqual({
      keys: true,
      strings: true,
      numbers: true,
      literals: true,
      comments: true,
    });
  });

  it('toggles a category off and back on independently of the others', async () => {
    const user = userEvent.setup();
    render(<ColorStyleSettingsPanel />);

    const stringsRow = screen.getByRole('button', { name: /^Strings/ });
    await user.click(stringsRow);

    expect(useAppStore.getState().colorStyle).toMatchObject({ strings: false, keys: true, numbers: true });
    expect(stringsRow.querySelector('span')).toHaveAttribute('data-checked', 'false');

    await user.click(stringsRow);
    expect(useAppStore.getState().colorStyle.strings).toBe(true);
  });

  it('toggles Keys off without affecting Strings, even though JSON keys share a "string" scope prefix', async () => {
    const user = userEvent.setup();
    render(<ColorStyleSettingsPanel />);

    await user.click(screen.getByRole('button', { name: /^Keys/ }));

    expect(useAppStore.getState().colorStyle).toMatchObject({ keys: false, strings: true });
  });

  it('renders the live preview with the resolved Monaco theme (Auto + dark app theme → vs-dark)', () => {
    render(<ColorStyleSettingsPanel />);

    expect(screen.getByTestId('color-style-preview')).toHaveAttribute('data-monaco-theme', 'vs-dark');
  });

  it('picking a custom color for a category saves it scoped to the current theme, and shows a reset control', async () => {
    const user = userEvent.setup();
    render(<ColorStyleSettingsPanel />);

    const swatch = screen.getByTitle('Strings color') as HTMLInputElement;
    expect(screen.queryByTitle(/Reset Strings/)).not.toBeInTheDocument();

    fireEvent.change(swatch, { target: { value: '#ff8800' } });
    expect(useAppStore.getState().colorStyleCustomColors['vs-dark'].strings).toBe('#ff8800');

    const resetBtn = await screen.findByTitle(/Reset Strings/);
    await user.click(resetBtn);
    expect(useAppStore.getState().colorStyleCustomColors['vs-dark'].strings).toBeUndefined();
  });

  it('disables the color swatch for a category that is toggled off', async () => {
    const user = userEvent.setup();
    render(<ColorStyleSettingsPanel />);

    await user.click(screen.getByRole('button', { name: /^Numbers/ }));

    expect(screen.getByTitle(/Numbers is off/)).toBeDisabled();
  });

  it('lets Background be customized even though it has no on/off toggle', () => {
    render(<ColorStyleSettingsPanel />);

    expect(screen.queryByRole('button', { name: /^Background/ })).not.toBeInTheDocument();
    const swatch = screen.getByTitle('Background color') as HTMLInputElement;
    expect(swatch).not.toBeDisabled();

    fireEvent.change(swatch, { target: { value: '#101010' } });
    expect(useAppStore.getState().colorStyleCustomColors['vs-dark'].background).toBe('#101010');
  });

  it("keeps custom colors scoped per theme — a Dark-theme customization doesn't show up under Light", () => {
    render(<ColorStyleSettingsPanel />);

    const swatch = screen.getByTitle('Strings color') as HTMLInputElement;
    fireEvent.change(swatch, { target: { value: '#ff8800' } });

    expect(useAppStore.getState().colorStyleCustomColors['vs-dark']).toMatchObject({ strings: '#ff8800' });
    expect(useAppStore.getState().colorStyleCustomColors.vs.strings).toBeUndefined();
  });

  it('Reset restores every toggle to on and clears every custom color for the current theme', async () => {
    const user = userEvent.setup();
    render(<ColorStyleSettingsPanel />);

    await user.click(screen.getByRole('button', { name: /^Strings/ }));
    fireEvent.change(screen.getByTitle('Keys color'), { target: { value: '#ff8800' } });
    fireEvent.change(screen.getByTitle('Background color'), { target: { value: '#101010' } });
    expect(useAppStore.getState().colorStyle.strings).toBe(false);
    expect(useAppStore.getState().colorStyleCustomColors['vs-dark']).toEqual({ keys: '#ff8800', background: '#101010' });

    await user.click(screen.getByRole('button', { name: 'Reset' }));

    expect(useAppStore.getState().colorStyle).toEqual({
      keys: true,
      strings: true,
      numbers: true,
      literals: true,
      comments: true,
    });
    expect(useAppStore.getState().colorStyleCustomColors['vs-dark']).toEqual({});
  });

  it('Reset does not touch custom colors saved for a different theme', async () => {
    useAppStore.getState().setColorStyleCustomColor('vs', 'strings', '#00ff88');
    const user = userEvent.setup();
    render(<ColorStyleSettingsPanel />);

    fireEvent.change(screen.getByTitle('Keys color'), { target: { value: '#ff8800' } });
    await user.click(screen.getByRole('button', { name: 'Reset' }));

    expect(useAppStore.getState().colorStyleCustomColors['vs-dark']).toEqual({});
    expect(useAppStore.getState().colorStyleCustomColors.vs).toEqual({ strings: '#00ff88' });
  });

  describe('Color Scheme selector', () => {
    it('offers Light/Dark/High Contrast Dark/High Contrast Light/All Color Schemes, defaulting to the active theme', () => {
      render(<ColorStyleSettingsPanel />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(Array.from(select.options).map((o) => o.textContent)).toEqual([
        'Light',
        'Dark',
        'High Contrast Dark',
        'High Contrast Light',
        'All Color Schemes',
      ]);
      // App theme defaults to dark and Color Scheme defaults to Auto, so the active theme is vs-dark.
      expect(select.value).toBe('vs-dark');
    });

    it('editing a different Color Scheme reads/writes that theme\'s palette without changing the real active theme', async () => {
      const user = userEvent.setup();
      render(<ColorStyleSettingsPanel />);

      await user.selectOptions(screen.getByRole('combobox'), 'Light');
      fireEvent.change(screen.getByTitle('Strings color'), { target: { value: '#00ff88' } });

      expect(useAppStore.getState().colorStyleCustomColors.vs.strings).toBe('#00ff88');
      expect(useAppStore.getState().colorStyleCustomColors['vs-dark'].strings).toBeUndefined();
      // The real Settings :: Color Scheme setting is untouched.
      expect(useAppStore.getState().editorColorScheme).toBe('auto');
    });

    it('"All Color Schemes" writes a picked color identically to every base theme', async () => {
      const user = userEvent.setup();
      render(<ColorStyleSettingsPanel />);

      await user.selectOptions(screen.getByRole('combobox'), 'All Color Schemes');
      fireEvent.change(screen.getByTitle('Strings color'), { target: { value: '#00ff88' } });

      const colors = useAppStore.getState().colorStyleCustomColors;
      expect(colors.vs.strings).toBe('#00ff88');
      expect(colors['vs-dark'].strings).toBe('#00ff88');
      expect(colors['hc-black'].strings).toBe('#00ff88');
      expect(colors['hc-light'].strings).toBe('#00ff88');
    });

    it('"All Color Schemes" clears a color from every theme on reset', async () => {
      useAppStore.getState().setColorStyleCustomColor('vs', 'strings', '#111111');
      useAppStore.getState().setColorStyleCustomColor('hc-black', 'strings', '#222222');
      const user = userEvent.setup();
      render(<ColorStyleSettingsPanel />);

      await user.selectOptions(screen.getByRole('combobox'), 'All Color Schemes');
      const resetBtn = await screen.findByTitle(/Reset Strings/);
      await user.click(resetBtn);

      const colors = useAppStore.getState().colorStyleCustomColors;
      expect(colors.vs.strings).toBeUndefined();
      expect(colors['hc-black'].strings).toBeUndefined();
    });

    it('previews with the real active theme while "All Color Schemes" is selected, since Monaco can only render one theme at a time', async () => {
      const user = userEvent.setup();
      render(<ColorStyleSettingsPanel />);

      await user.selectOptions(screen.getByRole('combobox'), 'All Color Schemes');

      expect(screen.getByTestId('color-style-preview')).toHaveAttribute('data-monaco-theme', 'vs-dark');
    });
  });
});
