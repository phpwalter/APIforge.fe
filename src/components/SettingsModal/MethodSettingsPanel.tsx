import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CircleHelp, Plus, RefreshCw, Search, X } from 'lucide-react';
import type { HttpMethod } from '../../types/spec';
import { useAppStore } from '../../state/useAppStore';
import {
  fetchMethodPolicyCodeCatalog,
  fetchResolvedMethodPolicy,
  saveMethodPolicyOverride,
  type MethodPolicyCodeCatalogItem,
  type MethodPolicyScope,
  type ResolvedMethodPolicyItem,
} from '../../lib/api/methodPolicies';
import styles from './MethodSettingsPanel.module.css';

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'TRACE'];
const PAGE_SIZE = 6;

interface ScopeOption {
  value: MethodPolicyScope;
  label: string;
}

export function MethodSettingsPanel() {
  const userProfile = useAppStore((state) => state.userProfile);
  const companyId = userProfile.companyId ?? null;
  const planCode = userProfile.planCode ?? null;
  const roles = useMemo(
    () => (userProfile.roles ?? []).map((role) => role.trim().toLowerCase()),
    [userProfile.roles],
  );
  const projectId = useAppStore((state) => state.currentProjectId);
  const projectName = useAppStore((state) => state.currentProjectName);
  const [scope, setScope] = useState<MethodPolicyScope | null>(null);
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<ResolvedMethodPolicyItem[]>([]);
  const [catalog, setCatalog] = useState<MethodPolicyCodeCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [isRequired, setIsRequired] = useState(false);
  const [isDefault, setIsDefault] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(10);
  const [saving, setSaving] = useState(false);
  const [savingStatusCode, setSavingStatusCode] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const context = { companyId, projectId, planCode };
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [policyResponse, catalogResponse] = await Promise.all([
        fetchResolvedMethodPolicy(method, context),
        fetchMethodPolicyCodeCatalog(),
      ]);
      setRows(policyResponse.data);
      setCatalog(catalogResponse.data);
    } catch (caught) {
      setRows([]);
      setError(caught instanceof Error ? caught.message : 'Method policy could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [method, companyId, projectId, planCode]);

  const availableScopes = useMemo<ScopeOption[]>(() => {
    const isSuperAdministrator = roles.includes('super_administrator');
    const isCompanyEditor = roles.some((role) => ['owner', 'administrator', 'admin', 'manager'].includes(role));
    const projectAllowed = Boolean(
      companyId
      && projectId
      && rows.some((row) => row.project_overrides_allowed && row.project_plan_eligible),
    );

    const options: ScopeOption[] = [];
    if (projectAllowed) {
      options.push({ value: 'project', label: `Project: ${projectName?.trim() || 'Current Project'}` });
    }
    if (isCompanyEditor && companyId) {
      const companyName = 'companyName' in userProfile && typeof userProfile.companyName === 'string'
        ? userProfile.companyName.trim()
        : '';
      options.push({ value: 'company', label: `Company: ${companyName || 'Current Company'}` });
    }
    if (isSuperAdministrator) {
      options.push({ value: 'system', label: 'System Defaults' });
    }
    return options;
  }, [roles, companyId, projectId, projectName, rows, userProfile]);

  useEffect(() => {
    if (availableScopes.length === 0) {
      setScope(null);
      setDialogOpen(false);
      return;
    }
    if (!scope || !availableScopes.some((option) => option.value === scope)) {
      setScope(availableScopes[0].value);
    }
  }, [availableScopes, scope]);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return rows.filter((row) => !normalized || `${row.status_code} ${row.title} ${row.description}`.toLowerCase().includes(normalized));
  }, [query, rows]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, pageCount);
  const pageStartIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const pagedRows = visible.slice(pageStartIndex, pageStartIndex + PAGE_SIZE);
  const rangeStart = visible.length === 0 ? 0 : pageStartIndex + 1;
  const rangeEnd = Math.min(pageStartIndex + PAGE_SIZE, visible.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [method, query]);

  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(pageCount);
  }, [currentPage, pageCount]);

  const assignedCodes = useMemo(() => new Set(rows.map((row) => row.status_code)), [rows]);
  const availableCodes = useMemo(() => catalog.filter((item) => !assignedCodes.has(item.code)), [catalog, assignedCodes]);
  const selectedCatalogItem = catalog.find((item) => String(item.code) === selectedCode);
  const canEdit = scope !== null;
  const addDisabled = !canEdit || availableCodes.length === 0;
  const selectedScopeLabel = availableScopes.find((option) => option.value === scope)?.label ?? 'NONE';

  const openDialog = () => {
    if (scope === null) return;
    const first = availableCodes[0];
    setSelectedCode(first ? String(first.code) : '');
    setIsEnabled(true);
    setIsRequired(false);
    setIsDefault(true);
    setDisplayOrder(rows.length === 0 ? 10 : Math.max(...rows.map((row) => row.display_order)) + 10);
    setDialogOpen(true);
  };


  const updatePolicyFlag = async (
    row: ResolvedMethodPolicyItem,
    field: 'is_enabled' | 'is_required' | 'is_default',
    value: boolean,
  ) => {
    if (scope === null) return;

    setSavingStatusCode(row.status_code);
    setError(null);
    setRows((current) => current.map((item) => (
      item.status_code === row.status_code ? { ...item, [field]: value } : item
    )));

    try {
      await saveMethodPolicyOverride(scope, {
        http_method: method,
        status_code: row.status_code,
        company_id: scope === 'system' ? null : companyId,
        project_id: scope === 'project' ? projectId : null,
        plan_code: planCode,
        changes: { [field]: value },
      });
      await load();
    } catch (caught) {
      setRows((current) => current.map((item) => (
        item.status_code === row.status_code ? row : item
      )));
      setError(caught instanceof Error ? caught.message : 'The method policy item could not be updated.');
    } finally {
      setSavingStatusCode(null);
    }
  };

  const addCode = async () => {
    if (scope === null) return;
    const code = Number(selectedCode);
    if (!Number.isInteger(code) || code < 100 || code > 599) return;
    setSaving(true);
    setError(null);
    try {
      await saveMethodPolicyOverride(scope, {
        http_method: method,
        status_code: code,
        company_id: scope === 'system' ? null : companyId,
        project_id: scope === 'project' ? projectId : null,
        plan_code: planCode,
        changes: { is_enabled: isEnabled, is_required: isRequired, is_default: isDefault, display_order: displayOrder },
      });
      setDialogOpen(false);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The response code could not be added.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.panel} aria-label="Method settings">
      <div className={styles.hero}>
        <div><strong>Configure default HTTP response codes created when a method is added.</strong><span>Policies resolve from System to Company to Project and are copied into the new operation.</span></div>
        <label className={styles.search}><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search response codes..." /></label>
      </div>

      <div className={styles.controls}>
        <label>
          <span>Configuration Scope <CircleHelp size={13} /></span>
          <select
            value={scope ?? ''}
            onChange={(event) => setScope(event.target.value as MethodPolicyScope)}
            aria-label="Configuration Scope"
            disabled={availableScopes.length === 0}
          >
            {availableScopes.length === 0 && <option value="">No editable scope</option>}
            {availableScopes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label><span>HTTP Method</span><select value={method} onChange={(event) => setMethod(event.target.value as HttpMethod)}>{METHODS.map((value) => <option key={value}>{value}</option>)}</select></label>
        <button type="button" className={styles.refresh} onClick={() => void load()} disabled={loading}><RefreshCw size={14} /> {loading ? 'Loading...' : 'Refresh'}</button>
        <button type="button" className={styles.addCode} onClick={openDialog} disabled={addDisabled}><Plus size={14} /> Add Code</button>
      </div>

      {scope === 'project' && <div className={styles.notice}>Project overrides are enabled by company policy and included in the active plan.</div>}
      {scope === null && <div className={styles.notice}>You do not have an editable Method Settings policy scope. Effective policies remain available as read-only information.</div>}
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tableWrap}>
        <div className={styles.tableScroll}>
          <table><thead><tr><th>Status</th><th>Title</th><th>Class</th><th>Required</th><th>Default</th><th>Source</th><th>Description</th><th>Active</th></tr></thead><tbody>{pagedRows.map((row) => {
            const rowSaving = savingStatusCode === row.status_code;
            return <tr key={row.status_code} data-saving={rowSaving}>
              <td><b>{row.status_code}</b></td>
              <td>{row.title}</td>
              <td><span className={styles.classPill}>{row.response_class}xx</span></td>
              <td><input type="checkbox" checked={row.is_required} disabled={!canEdit || rowSaving} onChange={(event) => void updatePolicyFlag(row, 'is_required', event.target.checked)} aria-label={`${row.status_code} required`} /></td>
              <td><input type="checkbox" checked={row.is_default} disabled={!canEdit || rowSaving} onChange={(event) => void updatePolicyFlag(row, 'is_default', event.target.checked)} aria-label={`${row.status_code} default`} /></td>
              <td><span className={styles.sourcePill}>{row.effective_source}</span></td>
              <td>{row.description}</td>
              <td><input type="checkbox" checked={row.is_enabled} disabled={!canEdit || rowSaving} onChange={(event) => void updatePolicyFlag(row, 'is_enabled', event.target.checked)} aria-label={`${row.status_code} active`} /></td>
            </tr>;
          })}</tbody></table>
          {!loading && visible.length === 0 && <div className={styles.empty}>No response policies match the current selection.</div>}
        </div>
        <div className={styles.pagination}>
          <span>{rangeStart}–{rangeEnd} of {visible.length}</span>
          <div>
            <button type="button" aria-label="Previous page" disabled={safeCurrentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}><ChevronLeft size={14} /></button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
              <button key={page} type="button" data-active={page === safeCurrentPage} aria-label={`Page ${page}`} onClick={() => setCurrentPage(page)}>{page}</button>
            ))}
            <button type="button" aria-label="Next page" disabled={safeCurrentPage === pageCount} onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      <div className={styles.fixedBottomPanels}>
        <div className={styles.footerNote}>Existing methods are not changed automatically. Use an explicit “Reapply Method Policy” action to synchronize an existing operation.</div>
      </div>

      {dialogOpen && scope !== null && <div className={styles.backdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setDialogOpen(false); }}>
        <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="add-code-title">
          <header><div><strong id="add-code-title">Add Response Code to {method}</strong><span>Add a canonical HTTP response code at the selected policy scope.</span></div><button type="button" onClick={() => setDialogOpen(false)} disabled={saving} aria-label="Close"><X size={16} /></button></header>
          <div className={styles.dialogBody}>
            <label><span>Response Code</span><select value={selectedCode} onChange={(event) => setSelectedCode(event.target.value)}>{availableCodes.map((item) => <option key={item.code} value={item.code}>{item.code} — {item.title}</option>)}</select><small>{selectedCatalogItem?.description ?? 'Select a code from the database-managed HTTP status catalog.'}</small></label>
            <label><span>Policy Scope</span><input value={selectedScopeLabel} readOnly /></label>
            <div className={styles.optionRows}>
              <label><span>Enabled<small>Include this code in the effective policy.</small></span><input type="checkbox" checked={isEnabled} onChange={(event) => setIsEnabled(event.target.checked)} /></label>
              <label><span>Required<small>Mark this response as mandatory for the method.</small></span><input type="checkbox" checked={isRequired} onChange={(event) => setIsRequired(event.target.checked)} /></label>
              <label><span>Default<small>Create this response automatically when the method is added.</small></span><input type="checkbox" checked={isDefault} onChange={(event) => setIsDefault(event.target.checked)} /></label>
            </div>
            <label><span>Display Order</span><input type="number" min={0} step={10} value={displayOrder} onChange={(event) => setDisplayOrder(Math.max(0, Number(event.target.value) || 0))} /></label>
          </div>
          <footer><button type="button" className={styles.cancel} onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</button><button type="button" className={styles.confirm} onClick={() => void addCode()} disabled={saving || !selectedCode}>{saving ? 'Adding...' : 'Add Code'}</button></footer>
        </section>
      </div>}
    </section>
  );
}
