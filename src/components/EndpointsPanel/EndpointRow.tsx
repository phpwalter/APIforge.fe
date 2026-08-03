import { useEffect, useRef, useState } from 'react';
import { Copy, MoreVertical, Pencil, Tag, Trash2 } from 'lucide-react';
import { useSpecStore } from '../../state/useSpecStore';
import { methodColor } from '../../lib/methodStyle';
import type { EndpointsPanelRow } from '../../lib/endpointsPanelGroups';
import styles from './EndpointsPanel.module.css';

interface EndpointRowProps {
  row: EndpointsPanelRow;
  selected: boolean;
}

export function EndpointRow({ row, selected }: EndpointRowProps) {
  const selectEndpoint = useSpecStore((s) => s.selectEndpoint);
  const selectEndpointDraft = useSpecStore((s) => s.selectEndpointDraft);
  const startDragMethod = useSpecStore((s) => s.startDragMethod);
  const endDragMethod = useSpecStore((s) => s.endDragMethod);
  const renameEndpointPath = useSpecStore((s) => s.renameEndpointPath);
  const duplicateEndpointPath = useSpecStore((s) => s.duplicateEndpointPath);
  const moveEndpointPathToTag = useSpecStore((s) => s.moveEndpointPathToTag);
  const deleteEndpointPath = useSpecStore((s) => s.deleteEndpointPath);

  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  const openRow = () => row.draftId ? selectEndpointDraft(row.draftId) : selectEndpoint(row.id);

  return (
    <>
      <div
        className={styles.row}
        data-selected={selected}
        style={{ marginLeft: row.depth * 14 }}
        onClick={openRow}
      >
        <div className={styles.rowHeader}>
          <div className={styles.rowPath}>{row.path}</div>
          {selected && (
            <div className={styles.rowMenuWrap} ref={menuRef}>
              <button
                type="button"
                className={styles.rowMenuButton}
                aria-label={`Endpoint actions for ${row.path}`}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={(event) => {
                  event.stopPropagation();
                  setMenuOpen((open) => !open);
                }}
              >
                <MoreVertical size={16} />
              </button>

              {menuOpen && (
                <div className={styles.rowMenu} role="menu" onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.rowMenuItem}
                    onClick={() => {
                      const nextPath = window.prompt('Rename endpoint path', row.path);
                      if (nextPath !== null) renameEndpointPath(row.path, nextPath);
                      setMenuOpen(false);
                    }}
                  >
                    <Pencil size={14} /> Rename endpoint
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.rowMenuItem}
                    onClick={() => {
                      duplicateEndpointPath(row.path);
                      setMenuOpen(false);
                    }}
                  >
                    <Copy size={14} /> Duplicate endpoint
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.rowMenuItem}
                    onClick={() => {
                      const tag = window.prompt('Move endpoint to tag. Leave blank for DEFAULT.', '');
                      if (tag !== null) moveEndpointPathToTag(row.path, tag || null);
                      setMenuOpen(false);
                    }}
                  >
                    <Tag size={14} /> Move to tag
                  </button>
                  <div className={styles.rowMenuDivider} role="separator" />
                  <button
                    type="button"
                    role="menuitem"
                    className={`${styles.rowMenuItem} ${styles.rowMenuDanger}`}
                    onClick={() => {
                      setMenuOpen(false);
                      setDeleteOpen(true);
                    }}
                  >
                    <Trash2 size={14} /> Delete endpoint
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.rowMethods}>
          {row.methods.length === 0 && <span className={styles.methodChip} title="No methods have been added">NO METHOD</span>}
          {row.methods.map((m) => (
            <button
              key={m.id}
              type="button"
              className={styles.methodChip}
              style={{ background: methodColor(m.method) }}
              draggable
              onDragStart={(e) => {
                e.stopPropagation();
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', m.id);
                startDragMethod(m.id);
              }}
              onDragEnd={endDragMethod}
              onClick={(e) => {
                e.stopPropagation();
                selectEndpoint(m.id);
              }}
              title={`Open ${m.method} ${row.path} — drag onto a tag to assign it`}
            >
              {m.method}
            </button>
          ))}
        </div>
      </div>

      {deleteOpen && (
        <div className={styles.deleteBackdrop} role="presentation" onMouseDown={() => setDeleteOpen(false)}>
          <div
            className={styles.deleteDialog}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`delete-endpoint-${row.id}`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={styles.deleteDialogIcon}><Trash2 size={20} /></div>
            <div className={styles.deleteDialogBody}>
              <h2 id={`delete-endpoint-${row.id}`}>Delete endpoint?</h2>
              <p>You are about to permanently delete <code>{row.path}</code> and every method, parameter, request, response, example, and test associated with it.</p>
              <p className={styles.deleteWarning}>This action cannot be undone.</p>
            </div>
            <div className={styles.deleteDialogActions}>
              <button type="button" className={styles.deleteCancelButton} onClick={() => setDeleteOpen(false)}>Cancel</button>
              <button
                type="button"
                className={styles.deleteConfirmButton}
                onClick={() => {
                  deleteEndpointPath(row.path);
                  setDeleteOpen(false);
                }}
              >
                <Trash2 size={14} /> Delete endpoint
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
