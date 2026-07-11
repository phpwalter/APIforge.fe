import { useAppStore, initialsOf } from './useAppStore';

const initialState = useAppStore.getState();

beforeEach(() => {
  useAppStore.setState(initialState, true);
});

describe('useAppStore', () => {
  it('starts signed out with dark theme and design tab', () => {
    const s = useAppStore.getState();
    expect(s.signedIn).toBe(false);
    expect(s.theme).toBe('dark');
    expect(s.canvasTab).toBe('design');
  });

  it('cycles theme mode dark -> system -> light -> dark', () => {
    expect(useAppStore.getState().themeMode).toBe('dark');

    useAppStore.getState().toggleTheme();
    expect(useAppStore.getState().themeMode).toBe('system');

    useAppStore.getState().toggleTheme();
    expect(useAppStore.getState().themeMode).toBe('light');
    expect(useAppStore.getState().theme).toBe('light');

    useAppStore.getState().toggleTheme();
    expect(useAppStore.getState().themeMode).toBe('dark');
    expect(useAppStore.getState().theme).toBe('dark');
  });

  it('updates project info', () => {
    useAppStore.getState().setProjectInfo({ title: 'Acme API', version: '2.0.0', openapiVersion: '3.0.0' });
    const s = useAppStore.getState();
    expect(s.apiTitle).toBe('Acme API');
    expect(s.apiVersion).toBe('2.0.0');
    expect(s.apiOpenapiVersion).toBe('3.0.0');
  });

  it('toggles the more-menu and closes the user-menu', () => {
    useAppStore.setState({ userMenuOpen: true });
    useAppStore.getState().toggleMoreMenu();
    expect(useAppStore.getState().moreMenuOpen).toBe(true);
    expect(useAppStore.getState().userMenuOpen).toBe(false);

    useAppStore.getState().closeMoreMenu();
    expect(useAppStore.getState().moreMenuOpen).toBe(false);
  });

  it('toggles the user-menu and closes the more-menu', () => {
    useAppStore.setState({ moreMenuOpen: true });
    useAppStore.getState().toggleUserMenu();
    expect(useAppStore.getState().userMenuOpen).toBe(true);
    expect(useAppStore.getState().moreMenuOpen).toBe(false);

    useAppStore.getState().closeUserMenu();
    expect(useAppStore.getState().userMenuOpen).toBe(false);
  });

  it('signs in and out, closing related menus', () => {
    useAppStore.setState({ userMenuOpen: true, authOpen: true });
    useAppStore.getState().signIn();
    let s = useAppStore.getState();
    expect(s.signedIn).toBe(true);
    expect(s.userMenuOpen).toBe(false);
    expect(s.authOpen).toBe(false);

    useAppStore.setState({ userMenuOpen: true });
    useAppStore.getState().signOut();
    s = useAppStore.getState();
    expect(s.signedIn).toBe(false);
    expect(s.userMenuOpen).toBe(false);
  });

  it('opens auth modal and closes other menus', () => {
    useAppStore.setState({ moreMenuOpen: true, userMenuOpen: true });
    useAppStore.getState().openAuth();
    const s = useAppStore.getState();
    expect(s.authOpen).toBe(true);
    expect(s.moreMenuOpen).toBe(false);
    expect(s.userMenuOpen).toBe(false);

    useAppStore.getState().closeAuth();
    expect(useAppStore.getState().authOpen).toBe(false);
  });

  it('switches the canvas tab', () => {
    useAppStore.getState().setCanvasTab('schema');
    expect(useAppStore.getState().canvasTab).toBe('schema');
  });

  it('opens settings and closes the more-menu', () => {
    useAppStore.setState({ moreMenuOpen: true });
    useAppStore.getState().openSettings();
    let s = useAppStore.getState();
    expect(s.settingsOpen).toBe(true);
    expect(s.moreMenuOpen).toBe(false);

    useAppStore.getState().closeSettings();
    s = useAppStore.getState();
    expect(s.settingsOpen).toBe(false);
  });
});

describe('initialsOf', () => {
  it('takes the first letter of up to two words, upper-cased', () => {
    expect(initialsOf('James Taylor')).toBe('JT');
    expect(initialsOf('cher')).toBe('C');
    expect(initialsOf('Ada Lovelace Byron')).toBe('AL');
  });

  it('trims surrounding whitespace', () => {
    expect(initialsOf('  James   Taylor  ')).toBe('JT');
  });
});
