import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import {
  fetchSecurityTypes,
  securityTypeHasScopes,
  scopesFromFlows,
  type SecurityTypeDto,
} from '../../lib/api/securityTypes';
import { ApiError } from '../../lib/api/client';
import { useSpecStore } from '../../state/useSpecStore';
import type { ProjectSettingsDraft } from '../Project/projectSettingsDraft';
import styles from './SecuritySettingsPanel.module.css';

type FetchState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; types: SecurityTypeDto[] };

interface SecuritySettingsPanelProps {
  draft: ProjectSettingsDraft;
  onChange: (patch: Partial<ProjectSettingsDraft>) => void;
}

export function SecuritySettingsPanel({ draft, onChange }: SecuritySettingsPanelProps) {
  const [state, setState] = useState<FetchState>({ status: 'loading' });

  // "N endpoints use this" is real, current data — not something drafted, unlike enabled
  // schemes/scopes/legacy-removal (which only take effect on OK/Apply, see projectSettingsDraft.ts).
  const endpoints = useSpecStore((s) => s.endpoints);

  const load = () => {
    setState({ status: 'loading' });
    fetchSecurityTypes()
      .then((types) => setState({ status: 'ready', types }))
      .catch((err) =>
        setState({ status: 'error', message: err instanceof ApiError ? err.message : 'Something went wrong.' }),
      );
  };

  useEffect(load, []);

  // A catalog scheme already required by some endpoint (e.g. from an imported document) counts
  // as enabled even before it's been explicitly checked here — reconcile once per successful fetch.
  useEffect(() => {
    if (state.status !== 'ready') return;
    const usedNames = new Set(endpoints.flatMap((e) => e.security));
    const toEnable = state.types
      .map((t) => t.openapi_name)
      .filter((name) => usedNames.has(name) && !draft.enabledSecuritySchemes.includes(name));
    if (toEnable.length > 0) {
      onChange({ enabledSecuritySchemes: [...draft.enabledSecuritySchemes, ...toEnable] });
    }
    // Reconcile only when the fetch completes, not on every draft change — otherwise unchecking
    // a scheme the user no longer wants would immediately be re-enabled by this same effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  if (state.status === 'loading') {
    return <div className={styles.stateMessage}>Loading security types…</div>;
  }

  if (state.status === 'error') {
    return (
      <div>
        <div className={styles.errorMessage}>Couldn&apos;t load security types: {state.message}</div>
        <button type="button" className={styles.retryBtn} onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  const { types } = state;
  const knownOpenapiNames = new Set(types.map((t) => t.openapi_name));

  // Scheme names already assigned to endpoints (e.g. via the method editor's free-text "+ Add
  // auth") that aren't in the fetched catalog, and haven't already been removed in this draft.
  const legacyNames = [...new Set(endpoints.flatMap((e) => e.security))].filter(
    (name) => !knownOpenapiNames.has(name) && !draft.removedLegacySchemes.includes(name),
  );

  return (
    <>
      <div>
        <div className={styles.sectionLabel}>Global Security Settings</div>
        <div className={styles.subtitle}>
          Select the authentication methods allowed for this project. Endpoints will inherit these enabled schemes
          when they toggle credentials requirements.
        </div>
      </div>

      <div>
        <div className={styles.grid}>
          {types.map((t) => {
            const isChecked = draft.enabledSecuritySchemes.includes(t.openapi_name);
            const hasScopes = securityTypeHasScopes(t);
            return (
              <button
                key={t.id}
                type="button"
                className={styles.card}
                onClick={() =>
                  onChange({
                    enabledSecuritySchemes: isChecked
                      ? draft.enabledSecuritySchemes.filter((n) => n !== t.openapi_name)
                      : [...draft.enabledSecuritySchemes, t.openapi_name],
                  })
                }
              >
                <span className={styles.checkbox} data-checked={isChecked}>
                  {isChecked && <Check size={13} />}
                </span>
                <div className={styles.cardBody}>
                  <div className={styles.cardTitle}>{t.name}</div>
                  <div className={styles.cardDesc}>{t.description}</div>
                  {isChecked && hasScopes && (
                    <div className={styles.scopesWrap} onClick={(e) => e.stopPropagation()}>
                      <div className={styles.scopesLabel}>Scopes</div>
                      <input
                        className={styles.scopesInput}
                        value={draft.securityScopes[t.openapi_name] ?? scopesFromFlows(t.flows)}
                        placeholder="Comma-separated, e.g. read:charges, write:charges"
                        onChange={(e) =>
                          onChange({
                            securityScopes: { ...draft.securityScopes, [t.openapi_name]: e.target.value },
                          })
                        }
                      />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {legacyNames.length > 0 && (
          <div className={styles.gridLegacy}>
            {legacyNames.map((name) => (
              <button
                key={name}
                type="button"
                className={styles.card}
                title="Uncheck to remove this scheme from every endpoint"
                onClick={() => onChange({ removedLegacySchemes: [...draft.removedLegacySchemes, name] })}
              >
                <span className={styles.checkbox} data-checked="true">
                  <Check size={13} />
                </span>
                <div className={styles.cardBody}>
                  <div className={styles.cardTitleMono}>{name} (Legacy)</div>
                  <div className={styles.cardDesc}>
                    This is a custom scheme in use on this project, not part of the security types catalog.
                    Unchecking removes it from every endpoint.
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
