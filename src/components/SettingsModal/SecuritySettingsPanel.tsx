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
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [scopes, setScopes] = useState<Record<string, string>>({});
  const [legacyChecked, setLegacyChecked] = useState<Record<string, boolean>>({});

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

  const toggle = (key: string) => setChecked((c) => ({ ...c, [key]: !c[key] }));
  const toggleLegacy = (name: string) => setLegacyChecked((c) => ({ ...c, [name]: !c[name] }));

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
            const isChecked = !!checked[t.openapi_name];
            const hasScopes = securityTypeHasScopes(t);
            return (
              <button
                key={t.id}
                type="button"
                className={styles.card}
                onClick={() => toggle(t.openapi_name)}
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
                        value={scopes[t.openapi_name] ?? scopesFromFlows(t.flows)}
                        placeholder="Comma-separated, e.g. read:charges, write:charges"
                        onChange={(e) => setScopes((s) => ({ ...s, [t.openapi_name]: e.target.value }))}
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
            {legacyNames.map((name) => {
              const isChecked = !!legacyChecked[name];
              return (
                <button key={name} type="button" className={styles.card} onClick={() => toggleLegacy(name)}>
                  <span className={styles.checkbox} data-checked={isChecked}>
                    {isChecked && <Check size={13} />}
                  </span>
                  <div className={styles.cardBody}>
                    <div className={styles.cardTitleMono}>{name} (Legacy)</div>
                    <div className={styles.cardDesc}>
                      This is a custom scheme in use on this project, not part of the security types catalog.
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
