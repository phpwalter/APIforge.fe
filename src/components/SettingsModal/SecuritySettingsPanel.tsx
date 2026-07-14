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
import styles from './SecuritySettingsPanel.module.css';

type FetchState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; types: SecurityTypeDto[] };

export function SecuritySettingsPanel() {
  const [state, setState] = useState<FetchState>({ status: 'loading' });

  const endpoints = useSpecStore((s) => s.endpoints);
  const enabledSecuritySchemes = useSpecStore((s) => s.enabledSecuritySchemes);
  const setSecuritySchemeEnabled = useSpecStore((s) => s.setSecuritySchemeEnabled);
  const securityScopes = useSpecStore((s) => s.securityScopes);
  const setSecurityScopes = useSpecStore((s) => s.setSecurityScopes);
  const removeSecurityFromAllEndpoints = useSpecStore((s) => s.removeSecurityFromAllEndpoints);

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
    state.types.forEach((t) => {
      if (usedNames.has(t.openapi_name) && !enabledSecuritySchemes.includes(t.openapi_name)) {
        setSecuritySchemeEnabled(t.openapi_name, true);
      }
    });
    // Reconcile only when the fetch completes, not on every store change — otherwise unchecking
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

  // Scheme names already assigned to endpoints (e.g. via the method editor's
  // free-text "+ Add auth") that aren't in the fetched catalog.
  const legacyNames = [...new Set(endpoints.flatMap((e) => e.security))].filter(
    (name) => !knownOpenapiNames.has(name),
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
            const isChecked = enabledSecuritySchemes.includes(t.openapi_name);
            const hasScopes = securityTypeHasScopes(t);
            return (
              <button
                key={t.id}
                type="button"
                className={styles.card}
                onClick={() => setSecuritySchemeEnabled(t.openapi_name, !isChecked)}
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
                        value={securityScopes[t.openapi_name] ?? scopesFromFlows(t.flows)}
                        placeholder="Comma-separated, e.g. read:charges, write:charges"
                        onChange={(e) => setSecurityScopes(t.openapi_name, e.target.value)}
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
                onClick={() => removeSecurityFromAllEndpoints(name)}
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
