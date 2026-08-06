import { shallow } from 'zustand/shallow';
import { useAppStore } from '../state/useAppStore';
import { useSpecStore } from '../state/useSpecStore';
import { buildOpenApiDocument, documentToJson } from './openapiExport';
import { saveProject } from './projects';
import { saveServerDocument } from './project-server/projectServer';

const DEBOUNCE_MS = 800;

export interface SaveNowOptions {
  persistNewProject?: boolean;
  requireServer?: boolean;
}

function accountContext(): { accountKey: string; accountId: string } | null {
  const profile = useAppStore.getState().userProfile;
  const accountId = profile.companyId;
  const email = profile.email.trim().toLowerCase();
  if (!accountId || !email) return null;
  return { accountKey: `${accountId}:${email}`, accountId };
}

function buildDocument(): Record<string, unknown> | null {
  const app = useAppStore.getState();
  const spec = useSpecStore.getState();
  if (!app.currentProjectId || !app.currentProjectName || !spec.hasDocument) return null;

  return buildOpenApiDocument({
    info: {
      title: app.apiTitle,
      version: app.apiVersion,
      openapiVersion: app.apiOpenapiVersion,
      description: app.apiDescription,
      termsOfService: app.apiTermsOfService,
      contact: app.apiContact,
      license: app.apiLicense,
      servers: app.apiServers,
      externalDocs: app.apiExternalDocs,
    },
    endpoints: spec.endpoints,
    schemas: spec.schemas,
    enabledSecuritySchemes: spec.enabledSecuritySchemes,
    securityScopes: spec.securityScopes,
    securityTypes: [],
    variant: 'full',
  }) as Record<string, unknown>;
}

export async function saveNow(options: SaveNowOptions = {}): Promise<void> {
  const app = useAppStore.getState();
  const document = buildDocument();
  if (!document || !app.currentProjectId || !app.currentProjectName) return;

  const savedAt = Date.now();
  saveProject({
    id: app.currentProjectId,
    name: app.currentProjectName,
    savedAt,
    specJson: documentToJson(document),
  });

  if (app.isNewProject && options.persistNewProject !== true) {
    useAppStore.setState({ saveState: 'unsaved', lastSavedAt: null });
    return;
  }

  const context = accountContext();
  if (!context) {
    if (options.requireServer) {
      useAppStore.setState({ saveState: 'unsaved' });
      throw new Error('Sign in to an account with a company before saving this project to the server.');
    }
    useAppStore.setState({ saveState: 'saved', lastSavedAt: savedAt });
    return;
  }

  useAppStore.setState({ saveState: 'saving' });
  try {
    const saved = await saveServerDocument(
      context.accountKey,
      context.accountId,
      app.currentProjectName,
      document,
    );

    const current = useAppStore.getState();
    if (current.currentProjectName !== saved.name) {
      useAppStore.setState({ currentProjectName: saved.name });
    }
    useAppStore.setState({ saveState: 'saved', lastSavedAt: Date.now() });
  } catch (error) {
    console.error('APIForge server save failed.', error);
    useAppStore.setState({ saveState: 'unsaved' });
    throw error;
  }
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleSave(): void {
  const { currentProjectId, currentProjectName, saveState } = useAppStore.getState();
  if (!currentProjectId || !currentProjectName) return;
  if (saveState !== 'saving') useAppStore.setState({ saveState: 'unsaved' });
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    void saveNow().catch(() => undefined);
  }, DEBOUNCE_MS);
}

let started = false;

export function initProjectAutosave(): void {
  if (started) return;
  started = true;

  useSpecStore.subscribe(
    (state) => [state.endpoints, state.schemas, state.enabledSecuritySchemes, state.securityScopes] as const,
    scheduleSave,
    { equalityFn: shallow },
  );
  useAppStore.subscribe(
    (state) => [
      state.apiTitle,
      state.apiVersion,
      state.apiOpenapiVersion,
      state.apiDescription,
      state.apiTermsOfService,
      state.apiContact,
      state.apiLicense,
      state.apiServers,
      state.apiExternalDocs,
      state.currentProjectName,
    ] as const,
    scheduleSave,
    { equalityFn: shallow },
  );
  useAppStore.subscribe(
    (state) => state.currentProjectName,
    (name, previousName) => {
      if (name && name !== previousName) void saveNow().catch(() => undefined);
    },
  );
}
