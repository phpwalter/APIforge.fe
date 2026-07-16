import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Copy, CopyCheck, ListOrdered, Palette } from 'lucide-react';
import { useAppStore } from '../../state/useAppStore';
import { useSpecStore } from '../../state/useSpecStore';
import { fetchSecurityTypes, type SecurityTypeDto } from '../../lib/api/securityTypes';
import { buildOpenApiDocument, documentToJson, documentToYaml } from '../../lib/openapiExport';
import { commitRestProjectionEdit } from '../../lib/restProjectionEdit';
import { buildRestProjectionOutline, uniqueInOrder } from '../../lib/restProjectionOutline';
import { applyLineEndingPrefs } from '../../lib/fileEncoding';
import type { RestProjectionFormat } from '../../types/ui';
import type { ProjectionMonacoEditorHandle } from './ProjectionMonacoEditor';
import { RestProjectionOutlinePanel } from './RestProjectionOutlinePanel';
import styles from './RestProjectionCanvas.module.css';

// Monaco is a large dependency — only pull it into a chunk when the REST Projection tab actually renders.
const ProjectionMonacoEditor = lazy(() =>
  import('./ProjectionMonacoEditor').then((m) => ({ default: m.ProjectionMonacoEditor })),
);

type SecurityTypesState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; types: SecurityTypeDto[] };

const FORMATS: RestProjectionFormat[] = ['yaml', 'json'];
const FILENAME_FOR_FORMAT: Record<RestProjectionFormat, string> = {
  yaml: 'openapi.yaml',
  json: 'openapi.json',
};

export function RestProjectionCanvas() {
  const theme = useAppStore((s) => s.theme);
  const highlightingByFormat = useAppStore((s) => s.restProjectionHighlighting);
  const setHighlightingForFormat = useAppStore((s) => s.setRestProjectionHighlighting);
  const format = useAppStore((s) => s.restProjectionFormat);
  const setFormat = useAppStore((s) => s.setRestProjectionFormat);
  const showMeta = useAppStore((s) => s.restProjectionShowMeta);
  const toggleShowMeta = useAppStore((s) => s.toggleRestProjectionMeta);
  const lineNumbersByFormat = useAppStore((s) => s.restProjectionLineNumbers);
  const setLineNumbersForFormat = useAppStore((s) => s.setRestProjectionLineNumbers);
  const manual = useAppStore((s) => s.restProjectionManual);
  const setManual = useAppStore((s) => s.setRestProjectionManual);
  const error = useAppStore((s) => s.restProjectionError);
  const fileEncodingLineEnding = useAppStore((s) => s.fileEncodingLineEnding);
  const fileEncodingInsertFinalNewline = useAppStore((s) => s.fileEncodingInsertFinalNewline);

  const apiTitle = useAppStore((s) => s.apiTitle);
  const apiVersion = useAppStore((s) => s.apiVersion);
  const apiOpenapiVersion = useAppStore((s) => s.apiOpenapiVersion);
  const apiDescription = useAppStore((s) => s.apiDescription);
  const apiTermsOfService = useAppStore((s) => s.apiTermsOfService);
  const apiContact = useAppStore((s) => s.apiContact);
  const apiLicense = useAppStore((s) => s.apiLicense);
  const apiServers = useAppStore((s) => s.apiServers);
  const apiExternalDocs = useAppStore((s) => s.apiExternalDocs);

  const endpoints = useSpecStore((s) => s.endpoints);
  const schemas = useSpecStore((s) => s.schemas);
  const enabledSecuritySchemes = useSpecStore((s) => s.enabledSecuritySchemes);
  const securityScopes = useSpecStore((s) => s.securityScopes);

  const [securityTypesState, setSecurityTypesState] = useState<SecurityTypesState>({ status: 'loading' });
  const [copyFeedback, setCopyFeedback] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const editorHandleRef = useRef<ProjectionMonacoEditorHandle>(null);

  useEffect(() => {
    fetchSecurityTypes()
      .then((types) => setSecurityTypesState({ status: 'ready', types }))
      .catch(() => setSecurityTypesState({ status: 'error' }));
  }, []);

  // Switching to a different canvas tab (Design/Schema/Swagger/Diagnostics) unmounts this
  // component without ever firing a Monaco blur event, so the onCommit below wouldn't otherwise
  // run — commit whatever's pending on unmount too, so "apply on leaving this editor" holds
  // regardless of how the user leaves it.
  const pendingCommitRef = useRef<{ manual: typeof manual; format: RestProjectionFormat }>({ manual, format });
  pendingCommitRef.current = { manual, format };
  useEffect(
    () => () => {
      const { manual: m, format: f } = pendingCommitRef.current;
      if (m[f] != null) commitRestProjectionEdit(m[f]!, f);
    },
    [],
  );

  const generatedText = useMemo(() => {
    const doc = buildOpenApiDocument({
      info: {
        title: apiTitle,
        version: apiVersion,
        openapiVersion: apiOpenapiVersion,
        description: apiDescription,
        termsOfService: apiTermsOfService,
        contact: apiContact,
        license: apiLicense,
        servers: apiServers,
        externalDocs: apiExternalDocs,
      },
      endpoints,
      schemas,
      enabledSecuritySchemes,
      securityScopes,
      securityTypes: securityTypesState.status === 'ready' ? securityTypesState.types : [],
      variant: showMeta ? 'full' : 'clean',
    });
    return format === 'json' ? documentToJson(doc) : documentToYaml(doc);
  }, [
    format,
    showMeta,
    apiTitle,
    apiVersion,
    apiOpenapiVersion,
    apiDescription,
    apiTermsOfService,
    apiContact,
    apiLicense,
    apiServers,
    apiExternalDocs,
    endpoints,
    schemas,
    enabledSecuritySchemes,
    securityScopes,
    securityTypesState,
  ]);

  const isEdited = manual[format] != null;
  const displayText = manual[format] ?? generatedText;
  const lineCount = useMemo(() => displayText.split('\n').length, [displayText]);
  const highlightingEnabled = highlightingByFormat[format];
  const lineNumbersEnabled = lineNumbersByFormat[format];

  const commitEditor = (value: string) => {
    if (manual[format] != null) commitRestProjectionEdit(value, format);
  };

  const outlineTags = useMemo(() => uniqueInOrder(endpoints.flatMap((e) => e.tags)), [endpoints]);
  const outlinePaths = useMemo(() => uniqueInOrder(endpoints.map((e) => e.path)), [endpoints]);
  const outlineOperationIds = useMemo(
    () => endpoints.map((e) => e.operationId).filter((id): id is string => Boolean(id)),
    [endpoints],
  );
  const outlineServers = useMemo(() => apiServers.filter(Boolean), [apiServers]);
  const outlineSchemaNames = useMemo(() => schemas.map((s) => s.name), [schemas]);
  const outlineSecuritySchemeNames = useMemo(
    () => uniqueInOrder([...enabledSecuritySchemes, ...endpoints.flatMap((e) => e.security)]),
    [enabledSecuritySchemes, endpoints],
  );
  const outline = useMemo(
    () =>
      buildRestProjectionOutline({
        text: displayText,
        format,
        tags: outlineTags,
        paths: outlinePaths,
        operationIds: outlineOperationIds,
        servers: outlineServers,
        schemaNames: outlineSchemaNames,
        securitySchemeNames: outlineSecuritySchemeNames,
      }),
    [displayText, format, outlineTags, outlinePaths, outlineOperationIds, outlineServers, outlineSchemaNames, outlineSecuritySchemeNames],
  );
  const revealInEditor = (line: number) => editorHandleRef.current?.revealLine(line);

  const copy = () => {
    const text = applyLineEndingPrefs(displayText, {
      lineEnding: fileEncodingLineEnding,
      insertFinalNewline: fileEncodingInsertFinalNewline,
    });
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 1500);
      })
      .catch(() => {});
  };

  const syncLabel = error ? error : isEdited ? 'Unsaved — click outside to apply to canvas' : 'Synced with canvas';

  return (
    <div className={styles.wrap}>
      <RestProjectionOutlinePanel outline={outline} onSelect={revealInEditor} />
      <div className={styles.main} ref={wrapRef}>
        <div className={styles.toolbar}>
          <span className={styles.filename}>{FILENAME_FOR_FORMAT[format]}</span>
          <span className={styles.stateBadge}>{isEdited ? 'edited' : 'generated'}</span>
          <div className={styles.spacer} />
          <button
            type="button"
            className={styles.iconToggle}
            data-active={highlightingEnabled}
            title={highlightingEnabled ? 'Turn off syntax highlighting' : 'Turn on syntax highlighting'}
            onClick={() => setHighlightingForFormat(format, !highlightingEnabled)}
          >
            <Palette size={14} />
          </button>
          <button
            type="button"
            className={styles.iconToggle}
            data-active={lineNumbersEnabled}
            title={lineNumbersEnabled ? 'Hide line numbers' : 'Show line numbers'}
            onClick={() => setLineNumbersForFormat(format, !lineNumbersEnabled)}
          >
            <ListOrdered size={14} />
          </button>
          <button
            type="button"
            className={styles.toolbarBtn}
            title={copyFeedback ? 'Copied' : 'Copy to clipboard'}
            onClick={copy}
          >
            {copyFeedback ? <CopyCheck size={14} /> : <Copy size={14} />}
          </button>
          <button
            type="button"
            className={styles.metaToggle}
            data-active={showMeta}
            title={
              showMeta
                ? 'Hide x-apiforge metadata in this preview'
                : 'Show x-apiforge metadata (editor state, notes, workflow) in this preview'
            }
            onClick={toggleShowMeta}
          >
            <span className={styles.metaDot} />
            x-apiforge
          </button>
          <div className={styles.formatSwitch}>
            {FORMATS.map((f) => (
              <button
                key={f}
                type="button"
                className={styles.formatPill}
                data-active={format === f}
                onClick={() => setFormat(f)}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.codeWrap}>
          <Suspense fallback={<div className={styles.editorLoading}>Loading editor…</div>}>
            <ProjectionMonacoEditor
              ref={editorHandleRef}
              value={displayText}
              format={format}
              theme={theme}
              wrapRef={wrapRef}
              highlightingEnabled={highlightingEnabled}
              lineNumbersEnabled={lineNumbersEnabled}
              onChange={(value) => setManual(format, value)}
              onCommit={commitEditor}
            />
          </Suspense>
        </div>

        <div className={styles.footer}>
          <span>OpenAPI {apiOpenapiVersion}</span>
          <span>·</span>
          <span>{lineCount} lines</span>
          <div className={styles.spacer} />
          <span className={styles.syncLabel} data-state={error ? 'error' : isEdited ? 'unsaved' : 'synced'}>
            {syncLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
