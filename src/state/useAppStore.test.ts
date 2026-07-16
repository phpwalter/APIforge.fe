import { useAppStore, initialsOf } from './useAppStore';

vi.mock('../lib/api/auth', () => ({
  signOutProvider: vi.fn(() => Promise.resolve()),
}));

const initialState = useAppStore.getState();

beforeEach(() => {
  useAppStore.setState(initialState, true);
  vi.clearAllMocks();
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

  it('sets the theme mode directly, resolving the visible theme', () => {
    useAppStore.getState().setThemeMode('light');
    expect(useAppStore.getState().themeMode).toBe('light');
    expect(useAppStore.getState().theme).toBe('light');

    useAppStore.getState().setThemeMode('dark');
    expect(useAppStore.getState().themeMode).toBe('dark');
    expect(useAppStore.getState().theme).toBe('dark');

    useAppStore.getState().setThemeMode('system');
    expect(useAppStore.getState().themeMode).toBe('system');
  });

  it('starts with the default notification preferences', () => {
    expect(useAppStore.getState().notificationPreferences).toEqual({
      importExportStatus: true,
      diagnosticsAlerts: true,
      autosaveConfirmations: false,
    });
  });

  it('updates individual notification preferences without clobbering the others', () => {
    useAppStore.getState().setNotificationPreference('autosaveConfirmations', true);
    useAppStore.getState().setNotificationPreference('diagnosticsAlerts', false);
    expect(useAppStore.getState().notificationPreferences).toEqual({
      importExportStatus: true,
      diagnosticsAlerts: false,
      autosaveConfirmations: true,
    });
  });

  it('defaults syntax highlighting on for every REST Projection format, toggleable independently', () => {
    expect(useAppStore.getState().restProjectionHighlighting).toEqual({ yaml: true, json: true });
    useAppStore.getState().setRestProjectionHighlighting('json', false);
    expect(useAppStore.getState().restProjectionHighlighting).toEqual({ yaml: true, json: false });
    useAppStore.getState().setRestProjectionHighlighting('json', true);
    expect(useAppStore.getState().restProjectionHighlighting).toEqual({ yaml: true, json: true });
  });

  it('updates project info', () => {
    useAppStore.getState().setProjectInfo({ title: 'Acme API', version: '2.0.0', openapiVersion: '3.0.0' });
    const s = useAppStore.getState();
    expect(s.apiTitle).toBe('Acme API');
    expect(s.apiVersion).toBe('2.0.0');
    expect(s.apiOpenapiVersion).toBe('3.0.0');
  });

  it('sets the OpenAPI version independently of setProjectInfo', () => {
    useAppStore.getState().setApiOpenapiVersion('3.0.3');
    expect(useAppStore.getState().apiOpenapiVersion).toBe('3.0.3');
  });

  it('sets individual General settings fields', () => {
    useAppStore.getState().setApiField('title', 'Widgets API');
    useAppStore.getState().setApiField('version', '2.1.0');
    useAppStore.getState().setApiField('description', 'Manage widgets.');
    useAppStore.getState().setApiField('termsOfService', 'https://example.com/terms');
    const s = useAppStore.getState();
    expect(s.apiTitle).toBe('Widgets API');
    expect(s.apiVersion).toBe('2.1.0');
    expect(s.apiDescription).toBe('Manage widgets.');
    expect(s.apiTermsOfService).toBe('https://example.com/terms');
  });

  it('updates contact fields without clobbering the others', () => {
    useAppStore.getState().setApiContactField('name', 'Jane Doe');
    useAppStore.getState().setApiContactField('email', 'jane@example.com');
    const s = useAppStore.getState();
    expect(s.apiContact).toEqual({ name: 'Jane Doe', email: 'jane@example.com', url: '' });
  });

  it('updates license fields without clobbering the others', () => {
    useAppStore.getState().setApiLicenseField('name', 'Apache 2.0');
    const s = useAppStore.getState();
    expect(s.apiLicense).toEqual({ name: 'Apache 2.0', url: '' });
  });

  it('adds, updates, and removes servers', () => {
    useAppStore.getState().addApiServer();
    useAppStore.getState().addApiServer();
    expect(useAppStore.getState().apiServers).toEqual(['', '']);

    useAppStore.getState().setApiServerUrl(0, 'https://api.example.com');
    useAppStore.getState().setApiServerUrl(1, 'https://staging.example.com');
    expect(useAppStore.getState().apiServers).toEqual([
      'https://api.example.com',
      'https://staging.example.com',
    ]);

    useAppStore.getState().removeApiServer(0);
    expect(useAppStore.getState().apiServers).toEqual(['https://staging.example.com']);
  });

  it('updates external docs fields without clobbering the others', () => {
    useAppStore.getState().setApiExternalDocsField('description', 'Full API guide');
    useAppStore.getState().setApiExternalDocsField('url', 'https://docs.example.com');
    expect(useAppStore.getState().apiExternalDocs).toEqual({
      description: 'Full API guide',
      url: 'https://docs.example.com',
    });
  });

  it('starts with the default editor preferences', () => {
    expect(useAppStore.getState().apiforgePreferences).toEqual({
      operationIdStyle: 'lowerCamelCase',
      tagMode: 'operation',
      resourceNamingStyle: 'singularResource',
      defaultResponseView: 'structured',
    });
  });

  it('updates individual editor preferences without clobbering the others', () => {
    useAppStore.getState().setApiforgePreference('tagMode', 'resource');
    useAppStore.getState().setApiforgePreference('defaultResponseView', 'raw');
    expect(useAppStore.getState().apiforgePreferences).toEqual({
      operationIdStyle: 'lowerCamelCase',
      tagMode: 'resource',
      resourceNamingStyle: 'singularResource',
      defaultResponseView: 'raw',
    });
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
    // Demo sign-in (providers without a real backend integration) still gets a fake identity.
    expect(s.userProfile).toEqual({ name: 'James Taylor', email: 'james@acme-corp.com' });

    useAppStore.setState({ userMenuOpen: true });
    useAppStore.getState().signOut();
    s = useAppStore.getState();
    expect(s.signedIn).toBe(false);
    expect(s.userMenuOpen).toBe(false);
  });

  it('a demo sign-in (no real provider) never calls the backend signout endpoint', async () => {
    const { signOutProvider } = await import('../lib/api/auth');
    useAppStore.getState().signIn();
    useAppStore.getState().signOut();
    expect(signOutProvider).not.toHaveBeenCalled();
  });

  it('hydrateSession stores the real profile and provider from a completed OAuth round trip', () => {
    useAppStore.getState().hydrateSession({ name: 'Ada Lovelace', email: 'ada@example.com' }, 'google');
    const s = useAppStore.getState();
    expect(s.signedIn).toBe(true);
    expect(s.userProfile).toEqual({ name: 'Ada Lovelace', email: 'ada@example.com' });
    expect(s.authProvider).toBe('google');
  });

  it('signing out of a hydrated real session calls the backend signout endpoint and clears the profile', async () => {
    const { signOutProvider } = await import('../lib/api/auth');
    useAppStore.getState().hydrateSession({ name: 'Ada Lovelace', email: 'ada@example.com' }, 'google');
    useAppStore.getState().signOut();

    expect(signOutProvider).toHaveBeenCalledWith('google');
    const s = useAppStore.getState();
    expect(s.signedIn).toBe(false);
    expect(s.authProvider).toBe(null);
    expect(s.userProfile).toEqual({ name: '', email: '' });
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

  it('opens the doc dialog with a title and src, and closes it', () => {
    useAppStore.getState().openDocDialog('Terms', '/docs/terms.md');
    let s = useAppStore.getState();
    expect(s.docDialogOpen).toBe(true);
    expect(s.docDialogTitle).toBe('Terms');
    expect(s.docDialogSrc).toBe('/docs/terms.md');

    useAppStore.getState().closeDocDialog();
    s = useAppStore.getState();
    expect(s.docDialogOpen).toBe(false);
  });

  it('updates and persists a cookie preference', () => {
    useAppStore.getState().setCookiePref('analytics', true);
    let s = useAppStore.getState();
    expect(s.cookiePrefs.analytics).toBe(true);
    expect(s.cookiePrefs.marketing).toBe(false);

    useAppStore.getState().setCookiePref('marketing', true);
    s = useAppStore.getState();
    expect(s.cookiePrefs).toEqual({ analytics: true, marketing: true });
  });

  it('switches the REST Projection format and toggles x-apiforge visibility', () => {
    expect(useAppStore.getState().restProjectionFormat).toBe('yaml');
    useAppStore.getState().setRestProjectionFormat('json');
    expect(useAppStore.getState().restProjectionFormat).toBe('json');

    expect(useAppStore.getState().restProjectionShowMeta).toBe(false);
    useAppStore.getState().toggleRestProjectionMeta();
    expect(useAppStore.getState().restProjectionShowMeta).toBe(true);
  });

  it('tracks a per-format manual edit independently, and clears both together', () => {
    useAppStore.getState().setRestProjectionManual('yaml', 'openapi: 3.1.0');
    useAppStore.getState().setRestProjectionManual('json', '{}');
    let s = useAppStore.getState();
    expect(s.restProjectionManual).toEqual({ yaml: 'openapi: 3.1.0', json: '{}' });

    useAppStore.getState().setRestProjectionError('Could not parse this document.');
    useAppStore.getState().clearRestProjectionManual();
    s = useAppStore.getState();
    expect(s.restProjectionManual).toEqual({ yaml: null, json: null });
    expect(s.restProjectionError).toBeNull();
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
