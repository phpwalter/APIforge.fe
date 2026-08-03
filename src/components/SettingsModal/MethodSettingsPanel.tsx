import { useEffect, useMemo, useState } from 'react';
import { CircleHelp, RefreshCw, Search } from 'lucide-react';
import type { HttpMethod } from '../../types/spec';
import {
  fetchResolvedMethodPolicy,
  type MethodPolicyScope,
  type ResolvedMethodPolicyItem,
} from '../../lib/api/methodPolicies';
import styles from './MethodSettingsPanel.module.css';

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'TRACE'];

export function MethodSettingsPanel() {
  const [scope, setScope] = useState<MethodPolicyScope>('system');
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<ResolvedMethodPolicyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchResolvedMethodPolicy(method);
      setRows(response.data);
    } catch (caught) {
      setRows([]);
      setError(caught instanceof Error ? caught.message : 'Method policy could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [method]);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return rows.filter((row) =>
      !normalized || `${row.status_code} ${row.title} ${row.description}`.toLowerCase().includes(normalized),
    );
  }, [query, rows]);

  return (
    <section className={styles.panel} aria-label="Method settings">
      <div className={styles.hero}>
        <div>
          <strong>Configure default HTTP response codes created when a method is added.</strong>
          <span>Policies resolve from System to Company to Project and are copied into the new operation.</span>
        </div>
        <label className={styles.search}>
          <Search size={14} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search response codes..." />
        </label>
      </div>

      <div className={styles.controls}>
        <label>
          <span>Configuration Scope <CircleHelp size={13} /></span>
          <select value={scope} onChange={(event) => setScope(event.target.value as MethodPolicyScope)}>
            <option value="system">System Defaults</option>
            <option value="company">Company: APIForge</option>
            <option value="project">Project: Current Project</option>
          </select>
        </label>
        <label>
          <span>HTTP Method</span>
          <select value={method} onChange={(event) => setMethod(event.target.value as HttpMethod)}>
            {METHODS.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <button type="button" className={styles.refresh} onClick={() => void load()} disabled={loading}>
          <RefreshCw size={14} /> {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {scope === 'project' && (
        <div className={styles.notice}>
          Project overrides require a Pro, Business, or Enterprise plan and must be enabled by the company administrator.
        </div>
      )}
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr><th>Status</th><th>Title</th><th>Class</th><th>Required</th><th>Default</th><th>Source</th><th>Description</th><th>Active</th></tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.status_code}>
                <td><b>{row.status_code}</b></td>
                <td>{row.title}</td>
                <td><span className={styles.classPill}>{row.response_class}xx</span></td>
                <td><input type="checkbox" checked={row.is_required} readOnly aria-label={`${row.status_code} required`} /></td>
                <td><input type="checkbox" checked={row.is_default} readOnly aria-label={`${row.status_code} default`} /></td>
                <td><span className={styles.sourcePill}>{row.effective_source}</span></td>
                <td>{row.description}</td>
                <td><input type="checkbox" checked={row.is_enabled} readOnly aria-label={`${row.status_code} active`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && visible.length === 0 && <div className={styles.empty}>No response policies match the current selection.</div>}
      </div>

      <div className={styles.footerNote}>
        Existing methods are not changed automatically. Use an explicit “Reapply Method Policy” action to synchronize an existing operation.
      </div>
    </section>
  );
}
