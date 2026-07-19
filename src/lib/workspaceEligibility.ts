import { useAppStore } from '../state/useAppStore';
import { useSpecStore } from '../state/useSpecStore';

/**
 * The bar for a workspace being worth saving, closing, or protecting from an unsaved-changes
 * wipe: a real name (not one of the "Untitled…" defaults) and at least one endpoint or schema.
 * Takes primitives rather than reading the stores directly so components can pass in reactive
 * selector values — see hasSavableContent() below for the one-shot, non-reactive equivalent used
 * from plain lib functions.
 */
export function computeHasSavableContent(
  workspaceName: string | null,
  endpointCount: number,
  schemaCount: number,
): boolean {
  const hasRealName = !!workspaceName && !workspaceName.startsWith('Untitled');
  return hasRealName && (endpointCount > 0 || schemaCount > 0);
}

export function hasSavableContent(): boolean {
  const { currentWorkspaceName } = useAppStore.getState();
  const { endpoints, schemas } = useSpecStore.getState();
  return computeHasSavableContent(currentWorkspaceName, endpoints.length, schemas.length);
}
