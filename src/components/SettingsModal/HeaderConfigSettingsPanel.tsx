import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleHelp,
  CirclePause,
  Copy,
  History,
  MoreVertical,
  Pencil,
  RotateCcw,
  Search,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import styles from './HeaderConfigSettingsPanel.module.css';

type HeaderPolicyType = 'required' | 'conditional' | 'optional' | 'forbidden';
type SortKey = 'name' | 'category' | 'policyType' | 'defaultValue' | 'condition' | 'description' | 'active';
type SortDirection = 'asc' | 'desc';

type HeaderRule = {
  id: string;
  name: string;
  category: string;
  policyType: HeaderPolicyType;
  required: boolean;
  defaultValue: string;
  condition: string;
  description: string;
  active: boolean;
  defaultEnabled: boolean;
  rationale: string;
  exampleValue: string;
  methods?: string[];
  statusCodes?: string[];
};

const CATEGORY_OPTIONS = [
  'Authentication',
  'Caching & Preconditions',
  'Client Context',
  'Content Negotiation',
  'Payload Metadata',
  'Tracing & Versioning',
  'Transport & Proxy',
] as const;

const REQUEST_RULES: HeaderRule[] = [
  {
    id: 'x-api-version',
    name: 'X-API-Version',
    category: 'Payload Metadata',
    policyType: 'required',
    required: true,
    defaultValue: '1.0',
    condition: '',
    description: 'API version for backward compatibility',
    active: true,
    defaultEnabled: true,
    rationale: 'Identifies the requested API contract version.',
    exampleValue: 'v1',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
  },
  {
    id: 'authorization',
    name: 'Authorization',
    category: 'Authentication',
    policyType: 'required',
    required: true,
    defaultValue: '',
    condition: '',
    description: 'Bearer token for authentication',
    active: true,
    defaultEnabled: true,
    rationale: 'Provides the bearer access token used to authorize the request.',
    exampleValue: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'],
  },
  {
    id: 'idempotency-key',
    name: 'Idempotency-Key',
    category: 'Payload Metadata',
    policyType: 'conditional',
    required: false,
    defaultValue: '',
    condition: 'if_not_present',
    description: 'Prevents duplicate requests',
    active: true,
    defaultEnabled: true,
    rationale: 'Ensures safe retry of requests by clients without causing duplicate side effects.',
    exampleValue: '4f2c8b6e-9a3d-4c6b-9bcb-8f0aa1e2d7b5',
    methods: ['POST', 'PUT', 'PATCH'],
  },
  {
    id: 'if-match',
    name: 'If-Match',
    category: 'Caching & Preconditions',
    policyType: 'optional',
    required: false,
    defaultValue: '',
    condition: 'if_resource_exists',
    description: 'Optimistic concurrency control',
    active: true,
    defaultEnabled: true,
    rationale: 'Applies the operation only when the current entity tag matches.',
    exampleValue: '"33a64df551425fcc55e4d42a148795d9f25f89d4"',
    methods: ['PUT', 'PATCH', 'DELETE'],
  },
  {
    id: 'if-none-match',
    name: 'If-None-Match',
    category: 'Caching & Preconditions',
    policyType: 'optional',
    required: false,
    defaultValue: '',
    condition: 'if_resource_exists',
    description: 'Return only if resource modified',
    active: false,
    defaultEnabled: true,
    rationale: 'Allows conditional retrieval based on an entity tag.',
    exampleValue: '"33a64df551425fcc55e4d42a148795d9f25f89d4"',
    methods: ['GET', 'HEAD'],
  },
  {
    id: 'content-type',
    name: 'Content-Type',
    category: 'Payload Metadata',
    policyType: 'required',
    required: true,
    defaultValue: 'application/json',
    condition: '',
    description: 'Request payload media type',
    active: true,
    defaultEnabled: true,
    rationale: 'Declares the media type of the request representation.',
    exampleValue: 'application/json',
    methods: ['POST', 'PUT', 'PATCH'],
  },
  {
    id: 'accept',
    name: 'Accept',
    category: 'Content Negotiation',
    policyType: 'optional',
    required: false,
    defaultValue: 'application/json',
    condition: '',
    description: 'Preferred response media type',
    active: true,
    defaultEnabled: true,
    rationale: 'Communicates the response media types accepted by the client.',
    exampleValue: 'application/json',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
  },
  {
    id: 'x-request-id',
    name: 'X-Request-ID',
    category: 'Tracing & Versioning',
    policyType: 'forbidden',
    required: false,
    defaultValue: '',
    condition: '',
    description: 'Prohibited for security reasons',
    active: true,
    defaultEnabled: true,
    rationale: 'The platform creates the trusted request identifier internally.',
    exampleValue: 'req_01K2Z1Q9J7HP5ECF8T1RSX63HN',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
  },
];


const RESPONSE_RULES: HeaderRule[] = [
  {
    id: 'response-x-api-version',
    name: 'X-API-Version',
    category: 'Tracing & Versioning',
    policyType: 'required',
    required: true,
    defaultValue: 'v1',
    condition: 'always',
    description: 'Identifies the API contract version used to generate the response',
    active: true,
    defaultEnabled: true,
    rationale: 'Every response advertises the API contract version that processed the request.',
    exampleValue: 'v1',
  },
  {
    id: 'response-content-type',
    name: 'Content-Type',
    category: 'Content Negotiation',
    policyType: 'required',
    required: true,
    defaultValue: 'application/json',
    condition: 'if_payload_present',
    description: 'Declares the media type of the response representation',
    active: true,
    defaultEnabled: true,
    rationale: 'Clients require the response media type to interpret the representation correctly.',
    exampleValue: 'application/json',
    statusCodes: ['200', '201', '400', '401', '403', '404', '405', '409', '422', '429', '500', '503'],
  },
  {
    id: 'response-cache-control',
    name: 'Cache-Control',
    category: 'Caching & Preconditions',
    policyType: 'conditional',
    required: false,
    defaultValue: 'no-store',
    condition: 'if_payload_present',
    description: 'Defines client and intermediary caching behavior',
    active: true,
    defaultEnabled: true,
    rationale: 'Prevents sensitive or transient API responses from being cached unintentionally.',
    exampleValue: 'no-store',
    statusCodes: ['200', '201', '304', '400', '401', '403', '404', '405', '409', '422', '429', '500', '503'],
  },
  {
    id: 'response-etag',
    name: 'ETag',
    category: 'Caching & Preconditions',
    policyType: 'conditional',
    required: false,
    defaultValue: '',
    condition: 'if_resource_exists',
    description: 'Provides the entity tag used for conditional requests',
    active: true,
    defaultEnabled: true,
    rationale: 'Allows clients to perform efficient cache validation and optimistic concurrency checks.',
    exampleValue: '"33a64df551425fcc55e4d42a148795d9f25f89d4"',
    statusCodes: ['200', '201', '304'],
  },
  {
    id: 'response-location',
    name: 'Location',
    category: 'Payload Metadata',
    policyType: 'conditional',
    required: false,
    defaultValue: '',
    condition: 'if_resource_created',
    description: 'Identifies the URI of a newly created or redirected resource',
    active: true,
    defaultEnabled: true,
    rationale: 'Creation and redirection responses should identify the target resource explicitly.',
    exampleValue: '/projects/0f7554d0-4c85-4a93-b7c9-2eecf64df3c0',
    statusCodes: ['201'],
  },
  {
    id: 'response-allow',
    name: 'Allow',
    category: 'Transport & Proxy',
    policyType: 'conditional',
    required: false,
    defaultValue: '',
    condition: 'if_method_not_allowed',
    description: 'Lists the HTTP methods supported by the target resource',
    active: true,
    defaultEnabled: true,
    rationale: 'A 405 response must communicate the methods available for the resource.',
    exampleValue: 'GET, POST, HEAD',
    statusCodes: ['405'],
  },
  {
    id: 'response-www-authenticate',
    name: 'WWW-Authenticate',
    category: 'Authentication',
    policyType: 'conditional',
    required: false,
    defaultValue: 'Bearer',
    condition: 'if_unauthorized',
    description: 'Describes the authentication challenge for an unauthorized response',
    active: true,
    defaultEnabled: true,
    rationale: 'Unauthorized responses should tell the client which authentication scheme is required.',
    exampleValue: 'Bearer realm="api"',
    statusCodes: ['401'],
  },
  {
    id: 'response-retry-after',
    name: 'Retry-After',
    category: 'Client Context',
    policyType: 'conditional',
    required: false,
    defaultValue: '',
    condition: 'if_retryable',
    description: 'Indicates when the client may retry a temporarily unavailable operation',
    active: true,
    defaultEnabled: false,
    rationale: 'Rate-limited and temporarily unavailable responses should provide retry guidance.',
    exampleValue: '120',
    statusCodes: ['429', '503'],
  },
  {
    id: 'response-x-request-id',
    name: 'X-Request-ID',
    category: 'Tracing & Versioning',
    policyType: 'required',
    required: true,
    defaultValue: '',
    condition: 'always',
    description: 'Returns the correlation identifier assigned to the request',
    active: true,
    defaultEnabled: true,
    rationale: 'Returning the request identifier supports distributed tracing and support diagnostics.',
    exampleValue: 'req_01K2Z1Q9J7HP5ECF8T1RSX63HN',
  },
];

const RESPONSE_STATUS_CODES = ['200', '201', '204', '304', '400', '401', '403', '404', '405', '409', '422', '429', '500', '503'] as const;
const PAGE_SIZE = 6;

const POLICY_LABELS: Record<HeaderPolicyType, string> = {
  required: 'Required',
  conditional: 'Conditional',
  optional: 'Optional',
  forbidden: 'Forbidden',
};

function humanizeCondition(value: string): string {
  if (value === 'if_not_present') return 'If not present';
  if (value === 'if_resource_exists') return 'If resource exists';
  if (value === 'if_payload_present') return 'If payload present';
  if (value === 'if_resource_created') return 'If resource created';
  if (value === 'if_method_not_allowed') return 'If method not allowed';
  if (value === 'if_unauthorized') return 'If unauthorized';
  if (value === 'if_retryable') return 'If retryable';
  if (value === 'always') return 'Always';
  return '—';
}

function RuleSwitch({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return (
    <label className={styles.switchLabel}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className={styles.switchTrack} aria-hidden="true"><span className={styles.switchThumb} /></span>
      <span className={styles.srOnly}>{label}</span>
    </label>
  );
}

export function HeaderConfigSettingsPanel() {
  const [activeTab, setActiveTab] = useState<'request' | 'response'>('request');
  const [method, setMethod] = useState('POST');
  const [statusCode, setStatusCode] = useState('200');
  const [policyFilter, setPolicyFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([...CATEGORY_OPTIONS]);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const categoryFilterRef = useRef<HTMLDivElement>(null);
  const [requestRules, setRequestRules] = useState(REQUEST_RULES);
  const [responseRules, setResponseRules] = useState(RESPONSE_RULES);
  const [selectedRequestRuleId, setSelectedRequestRuleId] = useState('idempotency-key');
  const [selectedResponseRuleId, setSelectedResponseRuleId] = useState('response-x-api-version');
  const [editingRule, setEditingRule] = useState<HeaderRule | null>(null);
  const [draftRule, setDraftRule] = useState<HeaderRule | null>(null);
  const [openActionMenu, setOpenActionMenu] = useState<{ ruleId: string; top: number; left: number } | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  const rules = activeTab === 'request' ? requestRules : responseRules;
  const selectedRuleId = activeTab === 'request' ? selectedRequestRuleId : selectedResponseRuleId;

  const setSelectedRuleId = (ruleId: string) => {
    if (activeTab === 'request') setSelectedRequestRuleId(ruleId);
    else setSelectedResponseRuleId(ruleId);
  };

  const updateCurrentRules = (updater: (current: HeaderRule[]) => HeaderRule[]) => {
    if (activeTab === 'request') setRequestRules(updater);
    else setResponseRules(updater);
  };

  const visibleRules = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = rules.filter((rule) => {
      const matchesCategory = selectedCategories.includes(rule.category);
      const matchesPolicy = policyFilter === 'all' || rule.policyType === policyFilter;
      const matchesSearch = !normalized || `${rule.name} ${rule.description} ${rule.category}`.toLowerCase().includes(normalized);
      const matchesMethod = activeTab === 'response' || !rule.methods || rule.methods.includes(method);
      const matchesStatus = activeTab === 'request' || !rule.statusCodes || rule.statusCodes.includes(statusCode);
      return matchesCategory && matchesPolicy && matchesSearch && matchesMethod && matchesStatus;
    });

    const getSortValue = (rule: HeaderRule): string | number => {
      if (sortKey === 'policyType') return POLICY_LABELS[rule.policyType];
      if (sortKey === 'condition') return humanizeCondition(rule.condition);
      if (sortKey === 'active') return rule.active ? 1 : 0;
      return rule[sortKey];
    };

    return [...filtered].sort((leftRule, rightRule) => {
      const left = getSortValue(leftRule);
      const right = getSortValue(rightRule);
      const comparison = typeof left === 'number' && typeof right === 'number'
        ? left - right
        : String(left).localeCompare(String(right), undefined, { sensitivity: 'base', numeric: true });
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [activeTab, method, policyFilter, query, rules, selectedCategories, sortDirection, sortKey, statusCode]);

  const pageCount = Math.max(1, Math.ceil(visibleRules.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, pageCount);
  const pageStartIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const pagedRules = visibleRules.slice(pageStartIndex, pageStartIndex + PAGE_SIZE);
  const rangeStart = visibleRules.length === 0 ? 0 : pageStartIndex + 1;
  const rangeEnd = Math.min(pageStartIndex + PAGE_SIZE, visibleRules.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, method, policyFilter, query, selectedCategories, statusCode]);

  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(pageCount);
  }, [currentPage, pageCount]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => current === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortKey(key);
    setSortDirection('asc');
  };

  const renderSortHeader = (label: string, key: SortKey) => {
    const active = sortKey === key;
    return (
      <button
        type="button"
        className={styles.sortHeaderButton}
        data-active={active}
        onClick={() => toggleSort(key)}
        aria-label={`Sort by ${label}${active ? `, currently ${sortDirection === 'asc' ? 'ascending' : 'descending'}` : ''}`}
      >
        <span>{label}</span>
        {active && (sortDirection === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
      </button>
    );
  };


  useEffect(() => {
    if (!categoryMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !categoryFilterRef.current?.contains(target)) {
        setCategoryMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCategoryMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [categoryMenuOpen]);


  useEffect(() => {
    if (!openActionMenu) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !actionMenuRef.current?.contains(target)) {
        setOpenActionMenu(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenActionMenu(null);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openActionMenu]);

  const editingPolicySetLabel = 'Company Override v2 (Draft)';

  const openEditor = (rule: HeaderRule) => {
    setSelectedRuleId(rule.id);
    setEditingRule(rule);
    setDraftRule({ ...rule });
    setOpenActionMenu(null);
  };

  const toggleActionMenu = (event: React.MouseEvent<HTMLButtonElement>, ruleId: string) => {
    event.stopPropagation();

    if (openActionMenu?.ruleId === ruleId) {
      setOpenActionMenu(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 240;
    const menuHeight = 262;
    const gap = 8;
    const viewportPadding = 8;
    const left = Math.max(viewportPadding, rect.left - menuWidth - gap);
    const top = Math.min(
      Math.max(viewportPadding, rect.top),
      Math.max(viewportPadding, window.innerHeight - menuHeight - viewportPadding),
    );

    setSelectedRuleId(ruleId);
    setOpenActionMenu({ ruleId, top, left });
  };

  const closeActionMenu = () => setOpenActionMenu(null);

  const updateDraft = <K extends keyof HeaderRule>(key: K, value: HeaderRule[K]) => {
    setDraftRule((current) => (current ? { ...current, [key]: value } : current));
  };

  const saveDraft = () => {
    if (!draftRule) return;
    updateCurrentRules((current) => current.map((rule) => (rule.id === draftRule.id ? draftRule : rule)));
    setSelectedRuleId(draftRule.id);
    setEditingRule(null);
    setDraftRule(null);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((current) =>
      current.includes(category) ? current.filter((item) => item !== category) : [...current, category],
    );
  };

  return (
    <section className={styles.panel} aria-label="Header configuration">
      <div className={styles.tabs} data-active-tab={activeTab} role="tablist" aria-label="Header direction">
        <button type="button" className={`${styles.tab} ${activeTab === 'request' ? styles.activeTab : ''}`} aria-selected={activeTab === 'request'} onClick={() => { setActiveTab('request'); setOpenActionMenu(null); setEditingRule(null); setDraftRule(null); }}>REQUEST</button>
        <button type="button" className={`${styles.tab} ${activeTab === 'response' ? styles.activeTab : ''}`} aria-selected={activeTab === 'response'} onClick={() => { setActiveTab('response'); setOpenActionMenu(null); setEditingRule(null); setDraftRule(null); }}>RESPONSE</button>
      </div>

      <div className={styles.titleRow}>
        <div className={styles.intro}>
          <strong>Configure {activeTab.toUpperCase()} header policies by {activeTab === 'request' ? 'HTTP method' : 'HTTP status code'}.</strong>
          <span>Separate configuration is maintained for request and response headers.</span>
        </div>

        <div className={styles.searchActions}>
          <label className={styles.searchControl}>
            <Search size={14} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search headers..." />
          </label>
          <div className={styles.titleActions}>
            <button type="button" className={`${styles.secondaryButton} ${styles.titleActionButton}`}>Create Custom Header</button>
            <button type="button" className={`${styles.primaryButton} ${styles.titleActionButton}`}>+ Add Policy</button>
          </div>
        </div>
      </div>

      <div className={styles.toolbarGrid}>
        <label className={`${styles.fieldLabel} ${styles.scopeField}`}>
          <span>Configuration Scope <CircleHelp size={13} /></span>
          <select defaultValue="company">
            <option value="company">Company: APIForge (Current)</option>
            <option value="system">System Defaults</option>
          </select>
        </label>

        <div ref={categoryFilterRef} className={`${styles.fieldLabel} ${styles.filtersField}`}>
          <span>Filters <CircleHelp size={13} /></span>
          <button type="button" className={styles.categoryButton} onClick={() => setCategoryMenuOpen((open) => !open)}>
            <span className={styles.categoryButtonText}>{selectedCategories.length} selected</span>
            <span aria-hidden="true">⌄</span>
          </button>
          {categoryMenuOpen && (
            <div className={styles.categoryMenu}>
              {CATEGORY_OPTIONS.map((category) => (
                <label key={category}>
                  <input type="checkbox" checked={selectedCategories.includes(category)} onChange={() => toggleCategory(category)} />
                  {category}
                </label>
              ))}
              <div className={styles.categoryMenuActions}>
                <button type="button" onClick={() => setSelectedCategories([])}>Clear All</button>
                <button type="button" onClick={() => setSelectedCategories([...CATEGORY_OPTIONS])}>Select All</button>
              </div>
            </div>
          )}
        </div>

        {activeTab === 'request' ? (
          <select className={`${styles.compactSelect} ${styles.methodSelect}`} value={method} onChange={(event) => setMethod(event.target.value)} aria-label="HTTP method">
            {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map((value) => <option key={value}>{value}</option>)}
          </select>
        ) : (
          <select className={`${styles.compactSelect} ${styles.methodSelect}`} value={statusCode} onChange={(event) => setStatusCode(event.target.value)} aria-label="HTTP status code">
            {RESPONSE_STATUS_CODES.map((value) => <option key={value}>{value}</option>)}
          </select>
        )}

        <select className={`${styles.compactSelect} ${styles.policySelect}`} value={policyFilter} onChange={(event) => setPolicyFilter(event.target.value)} aria-label="Policy filter">
          <option value="all">Policy</option>
          <option value="required">Required</option>
          <option value="conditional">Conditional</option>
          <option value="optional">Optional</option>
          <option value="forbidden">Forbidden</option>
        </select>

        <div className={styles.scopeState}>Editing policy set: <b>{editingPolicySetLabel}</b></div>
      </div>

      <div className={styles.tableWrap}>
        <div className={styles.tableScroll}>
          <table className={styles.ruleTable}>
          <thead><tr>
            <th aria-sort={sortKey === 'name' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>{renderSortHeader('Header', 'name')}</th>
            <th aria-sort={sortKey === 'category' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>{renderSortHeader('Category', 'category')}</th>
            <th aria-sort={sortKey === 'policyType' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>{renderSortHeader('Policy Type', 'policyType')}</th>
            <th aria-sort={sortKey === 'defaultValue' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>{renderSortHeader('Default', 'defaultValue')}</th>
            <th aria-sort={sortKey === 'condition' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>{renderSortHeader('Condition', 'condition')}</th>
            <th aria-sort={sortKey === 'description' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>{renderSortHeader('Description', 'description')}</th>
            <th aria-sort={sortKey === 'active' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>{renderSortHeader('Active', 'active')}</th>
            <th aria-label="More actions" />
          </tr></thead>
          <tbody>
            {pagedRules.map((rule) => (
              <tr
                key={rule.id}
                data-selected={rule.id === selectedRuleId}
                onClick={() => setSelectedRuleId(rule.id)}
                onDoubleClick={(event) => {
                  const target = event.target;
                  if (target instanceof Element && target.closest('button, input, select, textarea, label, a')) return;
                  openEditor(rule);
                }}
              >
                <td><strong>{rule.name}</strong></td>
                <td><span className={styles.categoryChip}>{rule.category}</span></td>
                <td><span className={styles.policyChip} data-policy={rule.policyType}>{POLICY_LABELS[rule.policyType]}</span></td>
                <td>{rule.defaultValue || '—'}</td>
                <td>{rule.condition ? <span className={styles.conditionChip}>{humanizeCondition(rule.condition)}</span> : '—'}</td>
                <td>{rule.description}</td>
                <td><RuleSwitch checked={rule.active} onChange={(active) => updateCurrentRules((current) => current.map((item) => item.id === rule.id ? { ...item, active } : item))} label={`${rule.name} active`} /></td>
                <td>
                  <button
                    type="button"
                    className={styles.iconButton}
                    title="More actions"
                    aria-haspopup="menu"
                    aria-expanded={openActionMenu?.ruleId === rule.id}
                    onClick={(event) => toggleActionMenu(event, rule.id)}
                  >
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
        <div className={styles.pagination}>
          <span>{rangeStart}–{rangeEnd} of {visibleRules.length}</span>
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
        <div className={styles.infoBar}>ⓘ {activeTab === 'request' ? 'Request header policies are loaded from the database and applied automatically when a method is created.' : 'Response header policies are loaded from the database and applied automatically when a response status is configured.'}</div>
      </div>

      {openActionMenu && (() => {
        const menuRule = rules.find((rule) => rule.id === openActionMenu.ruleId);
        if (!menuRule) return null;

        return (
          <div
            ref={actionMenuRef}
            className={styles.rowActionMenu}
            role="menu"
            aria-label={`${menuRule.name} actions`}
            style={{ top: openActionMenu.top, left: openActionMenu.left }}
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" role="menuitem" onClick={() => openEditor(menuRule)}><Pencil size={17} /> Edit Rule</button>
            <button type="button" role="menuitem" onClick={closeActionMenu}><Copy size={17} /> Duplicate Rule</button>
            <button type="button" role="menuitem" onClick={closeActionMenu}><RotateCcw size={17} /> Reset to System Default</button>
            <div className={styles.menuDivider} role="separator" />
            <button type="button" role="menuitem" onClick={closeActionMenu}><CirclePause size={17} /> Disable Override</button>
            <button type="button" role="menuitem" className={styles.destructiveMenuItem} onClick={closeActionMenu}><Trash2 size={17} /> Delete Override</button>
            <div className={styles.menuDivider} role="separator" />
            <button type="button" role="menuitem" onClick={closeActionMenu}><History size={17} /> View Audit History</button>
          </div>
        );
      })()}

      {editingRule && draftRule && (
        <div className={styles.modalScrim} role="presentation" onMouseDown={() => { setEditingRule(null); setDraftRule(null); }}>
          <div className={styles.editorDialog} role="dialog" aria-modal="true" aria-labelledby="edit-header-rule-title" onMouseDown={(event) => event.stopPropagation()}>
            <header className={styles.editorHeader}>
              <Settings size={22} />
              <div><h2 id="edit-header-rule-title">Edit Header Rule</h2><p>Update the configuration for this {activeTab} header rule.</p></div>
              <button type="button" className={styles.closeEditor} onClick={() => { setEditingRule(null); setDraftRule(null); }}><X size={19} /></button>
            </header>

            <div className={styles.identityCard}>
              <div className={styles.monogram}>ID</div>
              <div className={styles.identityMain}><div className={styles.detailTitle}>{draftRule.name} <span className={styles.policyChip} data-policy={draftRule.policyType}>{POLICY_LABELS[draftRule.policyType]}</span></div><p>{draftRule.description}</p></div>
              <div className={styles.identityAudit}><strong>● Active (Override)</strong><span>Created: May 12, 2024 by John Smith</span><span>Updated: May 12, 2024 by John Smith</span><b>Override of system default</b></div>
            </div>

            <div className={styles.editorScopeRow}>
              <label><span>Configuration Scope <CircleHelp size={13} /></span><select defaultValue="company"><option value="company">Company: APIForge (Current)</option><option value="system">System Defaults</option></select></label>
            </div>

            <div className={styles.editorFourColumns}>
              <label><span>Applies To <CircleHelp size={13} /></span>{activeTab === 'request' ? <select value={method} onChange={(event) => setMethod(event.target.value)}>{['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map((value) => <option key={value}>{value}</option>)}</select> : <select value={statusCode} onChange={(event) => setStatusCode(event.target.value)}>{RESPONSE_STATUS_CODES.map((value) => <option key={value}>{value}</option>)}</select>}<small>Choose the {activeTab === 'request' ? 'request method' : 'response status code'}.</small></label>
              <label><span>Category <CircleHelp size={13} /></span><select value={draftRule.category} onChange={(event) => updateDraft('category', event.target.value)}>{CATEGORY_OPTIONS.map((category) => <option key={category}>{category}</option>)}</select><small>Change category for this header.</small></label>
              <label><span>Policy Type <CircleHelp size={13} /></span><select value={draftRule.policyType} onChange={(event) => updateDraft('policyType', event.target.value as HeaderPolicyType)}>{Object.entries(POLICY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><small>Set how this header should be used.</small></label>
              <label><span>Condition <CircleHelp size={13} /></span><select value={draftRule.condition} onChange={(event) => updateDraft('condition', event.target.value)}><option value="">None</option><option value="always">Always</option><option value="if_not_present">If not present</option><option value="if_resource_exists">If resource exists</option><option value="if_payload_present">If payload present</option>{activeTab === 'response' && <><option value="if_resource_created">If resource created</option><option value="if_method_not_allowed">If method not allowed</option><option value="if_unauthorized">If unauthorized</option><option value="if_retryable">If retryable</option></>}</select><small>Header applies when condition is met.</small></label>
            </div>

            <div className={styles.editorLowerGrid}>
              <div className={styles.editorOptions}>
                <label className={styles.defaultValueField}><span>Default Value (optional)</span><input value={draftRule.defaultValue} onChange={(event) => updateDraft('defaultValue', event.target.value)} placeholder="Optional default value" /></label>
                <div className={styles.optionRow}><span>Required <CircleHelp size={13} /></span><RuleSwitch checked={draftRule.required} onChange={(required) => updateDraft('required', required)} label="Header required" /></div>
                <div className={styles.optionRow}><span>Active <CircleHelp size={13} /></span><RuleSwitch checked={draftRule.active} onChange={(active) => updateDraft('active', active)} label="Rule active" /></div>
                <div className={styles.optionRow}><span>Default Enabled <CircleHelp size={13} /></span><RuleSwitch checked={draftRule.defaultEnabled} onChange={(defaultEnabled) => updateDraft('defaultEnabled', defaultEnabled)} label="Default enabled" /></div>
              </div>
              <div className={styles.rationaleCard}><span>Rationale</span><p>{draftRule.rationale}</p><hr /><span>Example Value</span><div className={styles.copyValue}><code>{draftRule.exampleValue}</code><Copy size={14} /></div><small>UUID v4 recommended.</small></div>
            </div>

            <div className={styles.editorInfo}>ⓘ Changes apply to the selected configuration scope and are saved as a draft until published.</div>
            <footer className={styles.editorFooter}>
              <button type="button" className={styles.deleteButton}><Trash2 size={16} /> Delete Override</button>
              <span />
              <button type="button" className={styles.secondaryButton} onClick={() => { setEditingRule(null); setDraftRule(null); }}>Cancel</button>
              <button type="button" className={styles.secondaryButton} onClick={saveDraft}>Apply</button>
              <button type="button" className={styles.primaryButton} onClick={saveDraft}>Save Rule</button>
            </footer>
          </div>
        </div>
      )}
    </section>
  );
}
