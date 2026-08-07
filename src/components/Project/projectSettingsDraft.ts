import { useAppStore, type AppState } from '../../state/useAppStore';
import { useSpecStore, type SpecState } from '../../state/useSpecStore';

/**
 * Everything Project Settings' three tabs (General / Servers & External Docs / Security Schemes)
 * edit — held as a local draft in ProjectSettingsModal and committed to the live stores only on
 * OK/Apply. Field names match the stores' own field names 1:1 so committing is a direct
 * pass-through (see applyProjectSettingsDraft / applySecurityDraft).
 */
export type ProjectSettingsDraft = Pick<
  AppState,
  | 'currentProjectName'
  | 'apiOpenapiVersion'
  | 'apiTitle'
  | 'apiVersion'
  | 'apiDescription'
  | 'apiTermsOfService'
  | 'apiContact'
  | 'apiLicense'
  | 'apiServers'
  | 'apiExternalDocs'
> &
  Pick<SpecState, 'enabledSecuritySchemes' | 'securityScopes'> & {
    /** Uncataloged ("legacy") scheme names removed in this draft — not part of either store's
     * enabled-list; stripped from every endpoint's security[] on commit. */
    removedLegacySchemes: string[];
  };

const PROPRIETARY_LICENSE = { id: '', name: 'Proprietary', spdxId: '', url: '' } as const;

export function snapshotFromStore(): ProjectSettingsDraft {
  const app = useAppStore.getState();
  const spec = useSpecStore.getState();
  return {
    currentProjectName: app.currentProjectName,
    apiOpenapiVersion: app.apiOpenapiVersion,
    apiTitle: app.apiTitle,
    apiVersion: app.apiVersion,
    apiDescription: app.apiDescription,
    apiTermsOfService: app.apiTermsOfService,
    apiContact: app.apiContact,
    apiLicense: app.apiLicense.name ? app.apiLicense : { ...PROPRIETARY_LICENSE },
    apiServers: app.apiServers,
    apiExternalDocs: app.apiExternalDocs,
    enabledSecuritySchemes: spec.enabledSecuritySchemes,
    securityScopes: spec.securityScopes,
    removedLegacySchemes: [],
  };
}
