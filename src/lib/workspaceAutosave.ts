import { shallow } from 'zustand/shallow';
import { useAppStore } from '../state/useAppStore';
import { useSpecStore } from '../state/useSpecStore';
import { buildOpenApiDocument, documentToJson } from './openapiExport';
import { saveWorkspace } from './workspaces';

const DEBOUNCE_MS = 800;

/**
 * Snapshots the current document into the active workspace's localStorage entry — reuses the same
 * buildOpenApiDocument()/documentToJson() pipeline REST Projection's export already uses, so a
 * saved workspace is just a real OpenAPI document, not a bespoke format.
 */
export function saveNow(): void {
  const app = useAppStore.getState();
  const spec = useSpecStore.getState();
  if (!app.currentWorkspaceId || !app.currentWorkspaceName || !spec.hasDocument) return;

  const doc = buildOpenApiDocument({
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
  });

  saveWorkspace({
    id: app.currentWorkspaceId,
    name: app.currentWorkspaceName,
    savedAt: Date.now(),
    specJson: documentToJson(doc),
  });
  useAppStore.setState({ saveState: 'saved', lastSavedAt: Date.now() });
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleSave(): void {
  const { currentWorkspaceId, currentWorkspaceName, saveState } = useAppStore.getState();
  if (!currentWorkspaceId || !currentWorkspaceName) return;
  if (saveState !== 'saving') useAppStore.setState({ saveState: 'unsaved' });
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(saveNow, DEBOUNCE_MS);
}

let started = false;

/**
 * Starts watching document-relevant state for changes to autosave — call once (AppShell mounts
 * it). No-ops on later calls, so it's safe to call from a component that can remount.
 */
export function initWorkspaceAutosave(): void {
  if (started) return;
  started = true;

  useSpecStore.subscribe(
    (s) => [s.endpoints, s.schemas, s.enabledSecuritySchemes, s.securityScopes] as const,
    scheduleSave,
    { equalityFn: shallow },
  );
  useAppStore.subscribe(
    (s) => [
      s.apiTitle,
      s.apiVersion,
      s.apiOpenapiVersion,
      s.apiDescription,
      s.apiTermsOfService,
      s.apiContact,
      s.apiLicense,
      s.apiServers,
      s.apiExternalDocs,
      // Workspace Settings :: General's "Workspace name" field — renaming an already-named
      // workspace needs to autosave too, not just the initial name (handled separately below).
      s.currentWorkspaceName,
    ],
    scheduleSave,
    { equalityFn: shallow },
  );
  // The very first save happens immediately once a workspace is named, rather than waiting for
  // the next edit + debounce — confirming a name is itself the natural first save point.
  useAppStore.subscribe(
    (s) => s.currentWorkspaceName,
    (name, prevName) => {
      if (name && !prevName) saveNow();
    },
  );
}
