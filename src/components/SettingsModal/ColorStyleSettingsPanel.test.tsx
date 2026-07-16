import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColorStyleSettingsPanel } from './ColorStyleSettingsPanel';
import { useAppStore } from '../../state/useAppStore';

const initialState = useAppStore.getState();

beforeEach(() => {
  useAppStore.setState(initialState, true);
});

describe('ColorStyleSettingsPanel', () => {
  it('renders with no per-format tabs — this setting applies to YAML and JSON alike', () => {
    render(<ColorStyleSettingsPanel />);

    expect(screen.queryByRole('button', { name: 'YAML' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'JSON' })).not.toBeInTheDocument();
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
});
