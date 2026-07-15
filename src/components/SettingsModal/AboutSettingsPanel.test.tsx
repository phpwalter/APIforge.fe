import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AboutSettingsPanel } from './AboutSettingsPanel';
import { useAppStore } from '../../state/useAppStore';

const initialState = useAppStore.getState();

beforeEach(() => {
  useAppStore.setState(initialState, true);
});

describe('AboutSettingsPanel — doc links', () => {
  it('opens the doc dialog with the right title/src for each link', async () => {
    const user = userEvent.setup();
    render(<AboutSettingsPanel />);

    await user.click(screen.getByRole('button', { name: 'Privacy' }));

    expect(useAppStore.getState().docDialogOpen).toBe(true);
    expect(useAppStore.getState().docDialogTitle).toBe('Privacy');
    expect(useAppStore.getState().docDialogSrc).toBe('/docs/privacy.md');
  });

  it('opens the PPI dialog from the "Do not share my personal information" link', async () => {
    const user = userEvent.setup();
    render(<AboutSettingsPanel />);

    await user.click(screen.getByRole('button', { name: 'Do not share my personal information' }));

    expect(useAppStore.getState().docDialogTitle).toBe('Do Not Share My Personal Information');
    expect(useAppStore.getState().docDialogSrc).toBe('/docs/ppi.md');
  });
});
