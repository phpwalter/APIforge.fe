import { useSpecStore } from '../../state/useSpecStore';
import { EndpointsPanel } from '../EndpointsPanel/EndpointsPanel';
import { MethodPills } from '../MethodEditor/MethodPills';
import { MethodEditor } from '../MethodEditor/MethodEditor';
import methodEditorStyles from '../MethodEditor/MethodEditor.module.css';
import styles from './DesignCanvas.module.css';

export function DesignCanvas() {
  const endpoints = useSpecStore((s) => s.endpoints);
  const selectedId = useSpecStore((s) => s.selectedId);
  const selected = endpoints.find((e) => e.id === selectedId);

  return (
    <div className={styles.wrap}>
      <EndpointsPanel />
      <div className={methodEditorStyles.scroll}>
        <div className={methodEditorStyles.inner}>
          {selected ? (
            <>
              <div className={methodEditorStyles.pathHeading}>{selected.path}</div>
              <MethodPills path={selected.path} activeMethod={selected.method} />
              <MethodEditor endpoint={selected} />
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
