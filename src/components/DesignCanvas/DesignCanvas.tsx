import { useSpecStore } from '../../state/useSpecStore';
import { EndpointsPanel } from '../EndpointsPanel/EndpointsPanel';
import { MethodPills } from '../MethodEditor/MethodPills';
import { MethodEditor } from '../MethodEditor/MethodEditor';
import { EndpointPathEditor } from '../MethodEditor/EndpointPathEditor';
import methodEditorStyles from '../MethodEditor/MethodEditor.module.css';
import styles from './DesignCanvas.module.css';

export function DesignCanvas() {
  const endpoints = useSpecStore((s) => s.endpoints);
  const selectedEndpointId = useSpecStore((s) => s.selectedEndpointId);
  const endpointDrafts = useSpecStore((s) => s.endpointDrafts);
  const selectedEndpointDraftId = useSpecStore((s) => s.selectedEndpointDraftId);
  const selected = endpoints.find((e) => e.id === selectedEndpointId);
  const selectedDraft = endpointDrafts.find((draft) => draft.id === selectedEndpointDraftId);

  return (
    <div className={styles.wrap}>
      <EndpointsPanel />
      <div className={methodEditorStyles.scroll}>
        <div className={methodEditorStyles.inner}>
          {selected ? (
            <>
              <EndpointPathEditor path={selected.path} />
              <MethodPills path={selected.path} activeMethod={selected.method} />
              <MethodEditor endpoint={selected} />
            </>
          ) : selectedDraft ? (
            <>
              <EndpointPathEditor path={selectedDraft.path} />
              <MethodPills path={selectedDraft.path} />
              <div className={methodEditorStyles.emptySelection}>
                <div className={methodEditorStyles.emptyTitle}>No HTTP method added</div>
                <div className={methodEditorStyles.emptyHint}>Choose a method above. APIForge will create the configured response-code set for that method.</div>
              </div>
            </>
          ) : (
            <div className={methodEditorStyles.emptySelection}>
              <div className={methodEditorStyles.emptyTitle}>No endpoint selected</div>
              <div className={methodEditorStyles.emptyHint}>
                Select an endpoint from the panel to start editing.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
