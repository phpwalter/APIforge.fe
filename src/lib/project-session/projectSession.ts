import { useAppStore } from '../../state/useAppStore';
import { useSpecStore } from '../../state/useSpecStore';
import type { UserProfile } from '../../types/ui';

const STORAGE_PREFIX = 'apiforge.project-session.v1';
const SNAPSHOT_VERSION = 1;

type ProjectIdentitySnapshot = {
  currentProjectId: string;
  currentProjectName: string;
  isNewProject: boolean;
  apiTitle: string;
  apiVersion: string;
  apiOpenapiVersion: string;
  apiDescription: string;
  apiTermsOfService: string;
  apiContact: unknown;
  apiLicense: unknown;
  apiServers: string[];
  apiExternalDocs: unknown;
  canvasTab: unknown;
};

type PersistedProjectSession = {
  version: number;
  accountKey: string;
  savedAt: number;
  project: ProjectIdentitySnapshot;
  specState: Record<string, unknown>;
};

type SerializableTaggedValue = {
  __apiforgeType: 'Map' | 'Set';
  value: unknown;
};

let uninstallCurrent: (() => void) | null = null;
let restoreInProgress = false;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function normalizedAccountPart(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export function projectSessionAccountKey(profile: UserProfile): string {
  const email = normalizedAccountPart(profile.email);
  const company = normalizedAccountPart(profile.companyId ?? profile.companyName);
  return `${company || 'personal'}:${email || 'unknown'}`;
}

function storageKey(accountKey: string): string {
  return `${STORAGE_PREFIX}:${encodeURIComponent(accountKey)}`;
}

function replacer(_key: string, value: unknown): unknown {
  if (typeof value === 'function') return undefined;
  if (value instanceof Map) {
    return { __apiforgeType: 'Map', value: Array.from(value.entries()) } satisfies SerializableTaggedValue;
  }
  if (value instanceof Set) {
    return { __apiforgeType: 'Set', value: Array.from(value.values()) } satisfies SerializableTaggedValue;
  }
  return value;
}

function reviver(_key: string, value: unknown): unknown {
  if (!value || typeof value !== 'object' || !('__apiforgeType' in value)) return value;

  const tagged = value as SerializableTaggedValue;
  if (tagged.__apiforgeType === 'Map' && Array.isArray(tagged.value)) {
    return new Map(tagged.value as Array<[unknown, unknown]>);
  }
  if (tagged.__apiforgeType === 'Set' && Array.isArray(tagged.value)) {
    return new Set(tagged.value);
  }
  return value;
}

function serializableSpecState(): Record<string, unknown> {
  const source = useSpecStore.getState() as Record<string, unknown>;
  const snapshot: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(source)) {
    if (typeof value !== 'function') snapshot[key] = value;
  }

  return snapshot;
}

function currentProjectSnapshot(): ProjectIdentitySnapshot | null {
  const state = useAppStore.getState();
  if (!state.currentProjectId || !state.currentProjectName) return null;

  return {
    currentProjectId: state.currentProjectId,
    currentProjectName: state.currentProjectName,
    isNewProject: state.isNewProject,
    apiTitle: state.apiTitle,
    apiVersion: state.apiVersion,
    apiOpenapiVersion: state.apiOpenapiVersion,
    apiDescription: state.apiDescription,
    apiTermsOfService: state.apiTermsOfService,
    apiContact: state.apiContact,
    apiLicense: state.apiLicense,
    apiServers: state.apiServers,
    apiExternalDocs: state.apiExternalDocs,
    canvasTab: state.canvasTab,
  };
}

function persistNow(accountKey: string): void {
  if (restoreInProgress || typeof sessionStorage === 'undefined') return;

  const project = currentProjectSnapshot();
  const key = storageKey(accountKey);

  if (!project) {
    sessionStorage.removeItem(key);
    return;
  }

  const payload: PersistedProjectSession = {
    version: SNAPSHOT_VERSION,
    accountKey,
    savedAt: Date.now(),
    project,
    specState: serializableSpecState(),
  };

  try {
    sessionStorage.setItem(key, JSON.stringify(payload, replacer));
  } catch (error) {
    console.warn('APIForge could not persist the active project session.', error);
  }
}

function schedulePersist(accountKey: string): void {
  if (saveTimer !== null) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    persistNow(accountKey);
  }, 100);
}

export function restoreProjectSession(profile: UserProfile): boolean {
  if (typeof sessionStorage === 'undefined') return false;

  const accountKey = projectSessionAccountKey(profile);
  const raw = sessionStorage.getItem(storageKey(accountKey));
  if (!raw) return false;

  try {
    const parsed = JSON.parse(raw, reviver) as PersistedProjectSession;
    if (
      parsed.version !== SNAPSHOT_VERSION ||
      parsed.accountKey !== accountKey ||
      !parsed.project?.currentProjectId ||
      !parsed.project?.currentProjectName ||
      !parsed.specState ||
      typeof parsed.specState !== 'object'
    ) {
      sessionStorage.removeItem(storageKey(accountKey));
      return false;
    }

    restoreInProgress = true;
    useSpecStore.setState(parsed.specState as never);
    useAppStore.setState({
      ...parsed.project,
      projectNamePromptOpen: false,
      loadProjectOpen: false,
      unsavedChangesPromptOpen: false,
    });
    return true;
  } catch (error) {
    sessionStorage.removeItem(storageKey(accountKey));
    console.warn('APIForge discarded an invalid active-project session snapshot.', error);
    return false;
  } finally {
    restoreInProgress = false;
  }
}

export function clearProjectSession(profile: UserProfile): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(storageKey(projectSessionAccountKey(profile)));
}

export function installProjectSessionPersistence(profile: UserProfile): () => void {
  uninstallCurrent?.();

  const accountKey = projectSessionAccountKey(profile);
  let previouslySignedIn = useAppStore.getState().signedIn;

  const unsubscribeApp = useAppStore.subscribe((state) => {
    if (previouslySignedIn && !state.signedIn) {
      sessionStorage.removeItem(storageKey(accountKey));
    } else {
      schedulePersist(accountKey);
    }
    previouslySignedIn = state.signedIn;
  });

  const unsubscribeSpec = useSpecStore.subscribe(() => {
    schedulePersist(accountKey);
  });

  const flush = (): void => persistNow(accountKey);
  window.addEventListener('pagehide', flush);

  uninstallCurrent = () => {
    unsubscribeApp();
    unsubscribeSpec();
    window.removeEventListener('pagehide', flush);
    if (saveTimer !== null) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    persistNow(accountKey);
    uninstallCurrent = null;
  };

  return uninstallCurrent;
}
