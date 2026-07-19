import { shallow } from 'zustand/shallow';
import { useAppStore } from '../state/useAppStore';
import { useSpecStore } from '../state/useSpecStore';
import { buildOpenApiDocument, documentToJson } from './openapiExport';
import { saveProject } from './projects';

const DEBOUNCE_MS = 800;

/**
 * Snapshots the current document into the active project's localStorage entry — reuses the same
 * buildOpenApiDocument()/documentToJson() pipeline REST Projection's export already uses, so a
 * saved project is just a real OpenAPI document, not a bespoke format.
 */
export function saveNow(): void {
  const app = useAppStore.getState();
  const spec = useSpecStore.getState();
  if (!app.currentProjectId || !app.currentProjectName || !spec.hasDocument) return;

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

  saveProject({
    id: app.currentProjectId,
    name: app.currentProjectName,
    savedAt: Date.now(),
    specJson: documentToJson(doc),
  });
  useAppStore.setState({ saveState: 'saved', lastSavedAt: Date.now() });
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleSave(): void {
  const { currentProjectId, currentProjectName, saveState } = useAppStore.getState();
  if (!currentProjectId || !currentProjectName) return;
  if (saveState !== 'saving') useAppStore.setState({ saveState: 'unsaved' });
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(saveNow, DEBOUNCE_MS);
}

let started = false;

/**
 * Starts watching document-relevant state for changes to autosave — call once (AppShell mounts
 * it). No-ops on later calls, so it's safe to call from a component that can remount.
 */
export function initProjectAutosave(): void {
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
      // Project Settings :: General's "Project name" field — renaming an already-named
      // project needs to autosave too, not just the initial name (handled separately below).
      s.currentProjectName,
    ],
    scheduleSave,
    { equalityFn: shallow },
  );
  // The very first save happens immediately once a project is named, rather than waiting for
  // the next edit + debounce — confirming a name is itself the natural first save point.
  useAppStore.subscribe(
    (s) => s.currentProjectName,
    (name, prevName) => {
      if (name && !prevName) saveNow();
    },
  );
}
