import { useEffect, useState } from 'react';
import { X, LoaderCircle, Folder, FileText, ChevronLeft } from 'lucide-react';
import { useAppStore } from '../../state/useAppStore';
import {
  getGithubContents,
  listGithubBranches,
  listGithubRepos,
  type GithubBranch,
  type GithubContentEntry,
  type GithubFileContent,
  type GithubRepo,
} from '../../lib/api/repos';
import { importFromGithubFile } from '../../lib/importFromRepo';
import styles from './WorkspaceFromVersionControlModal.module.css';

type AsyncState<T> = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: T };

const OPENAPI_FILE_PATTERN = /\.(json|ya?ml)$/i;

export function WorkspaceFromVersionControlModal() {
  const closeModal = useAppStore((s) => s.closeWorkspaceFromVersionControl);
  const isGithubConnected =
    useAppStore((s) => s.authProvider === 'github' || s.versionControlLinks.github != null);

  const [repos, setRepos] = useState<AsyncState<GithubRepo[]>>({ status: 'loading' });
  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);
  const [branches, setBranches] = useState<AsyncState<GithubBranch[]>>({ status: 'loading' });
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [path, setPath] = useState('');
  const [contents, setContents] = useState<AsyncState<GithubContentEntry[]>>({ status: 'loading' });
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    if (!isGithubConnected) return;
    listGithubRepos()
      .then((data) => setRepos({ status: 'ready', data }))
      .catch((err) => setRepos({ status: 'error', message: err instanceof Error ? err.message : String(err) }));
  }, [isGithubConnected]);

  useEffect(() => {
    if (!selectedRepo) return;
    const [owner, repo] = selectedRepo.full_name.split('/');
    setBranches({ status: 'loading' });
    listGithubBranches(owner, repo)
      .then((data) => {
        setBranches({ status: 'ready', data });
        setSelectedBranch(selectedRepo.default_branch);
      })
      .catch((err) => setBranches({ status: 'error', message: err instanceof Error ? err.message : String(err) }));
  }, [selectedRepo]);

  useEffect(() => {
    if (!selectedRepo || !selectedBranch) return;
    const [owner, repo] = selectedRepo.full_name.split('/');
    setContents({ status: 'loading' });
    getGithubContents(owner, repo, path, selectedBranch)
      .then((data) => {
        if (!Array.isArray(data)) {
          setContents({ status: 'error', message: `${data.path} is a file, not a folder.` });
          return;
        }
        setContents({ status: 'ready', data });
      })
      .catch((err) => setContents({ status: 'error', message: err instanceof Error ? err.message : String(err) }));
  }, [selectedRepo, selectedBranch, path]);

  const openFile = (entry: GithubContentEntry) => {
    if (!selectedRepo || !selectedBranch) return;
    const [owner, repo] = selectedRepo.full_name.split('/');
    setImportError(null);
    getGithubContents(owner, repo, entry.path, selectedBranch)
      .then((data) => {
        if (Array.isArray(data)) return; // shouldn't happen for a file entry
        try {
          importFromGithubFile(data as GithubFileContent);
          closeModal();
        } catch (err) {
          setImportError(err instanceof Error ? err.message : String(err));
        }
      })
      .catch((err) => setImportError(err instanceof Error ? err.message : String(err)));
  };

  return (
    <div className={styles.scrim} onClick={closeModal}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <div className={styles.title}>Workspace from Version Control</div>
          <button type="button" className={styles.closeBtn} title="Close" onClick={closeModal}>
            <X size={15} />
          </button>
        </div>

        <div className={styles.body}>
          {!isGithubConnected ? (
            <div className={styles.emptyState}>
              Connect a GitHub account first — Settings :: Plugins :: GitHub, or the Profile dialog's Linked
              Profiles.
            </div>
          ) : (
            <>
              <div className={styles.field}>
                <div className={styles.fieldLabel}>Repository</div>
                {repos.status === 'loading' && (
                  <div className={styles.statusRow}>
                    <LoaderCircle size={13} className={styles.spin} /> Loading repositories…
                  </div>
                )}
                {repos.status === 'error' && <div className={styles.errorMsg}>{repos.message}</div>}
                {repos.status === 'ready' && (
                  <select
                    className={styles.select}
                    value={selectedRepo?.id ?? ''}
                    onChange={(e) => {
                      const repo = repos.data.find((r) => String(r.id) === e.target.value) ?? null;
                      setSelectedRepo(repo);
                      setPath('');
                    }}
                  >
                    <option value="" disabled>
                      Select a repository…
                    </option>
                    {repos.data.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.full_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedRepo && (
                <div className={styles.field}>
                  <div className={styles.fieldLabel}>Branch</div>
                  {branches.status === 'loading' && (
                    <div className={styles.statusRow}>
                      <LoaderCircle size={13} className={styles.spin} /> Loading branches…
                    </div>
                  )}
                  {branches.status === 'error' && <div className={styles.errorMsg}>{branches.message}</div>}
                  {branches.status === 'ready' && (
                    <select
                      className={styles.select}
                      value={selectedBranch ?? ''}
                      onChange={(e) => {
                        setSelectedBranch(e.target.value);
                        setPath('');
                      }}
                    >
                      {branches.data.map((b) => (
                        <option key={b.name} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {selectedRepo && selectedBranch && (
                <div className={styles.field}>
                  <div className={styles.fieldLabel}>File</div>
                  {path && (
                    <button
                      type="button"
                      className={styles.upBtn}
                      onClick={() => setPath(path.split('/').slice(0, -1).join('/'))}
                    >
                      <ChevronLeft size={13} /> Up
                    </button>
                  )}
                  {contents.status === 'loading' && (
                    <div className={styles.statusRow}>
                      <LoaderCircle size={13} className={styles.spin} /> Loading contents…
                    </div>
                  )}
                  {contents.status === 'error' && <div className={styles.errorMsg}>{contents.message}</div>}
                  {contents.status === 'ready' && (
                    <div className={styles.fileList}>
                      {contents.data.length === 0 && <div className={styles.emptyState}>Empty folder.</div>}
                      {contents.data.map((entry) => (
                        <button
                          key={entry.path}
                          type="button"
                          className={styles.fileRow}
                          disabled={entry.type === 'file' && !OPENAPI_FILE_PATTERN.test(entry.name)}
                          onClick={() => (entry.type === 'dir' ? setPath(entry.path) : openFile(entry))}
                        >
                          {entry.type === 'dir' ? <Folder size={14} /> : <FileText size={14} />}
                          {entry.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {importError && <div className={styles.errorMsg}>{importError}</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
