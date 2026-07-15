import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../state/useAppStore';
import { useSpecStore } from '../../state/useSpecStore';
import { fetchSecurityTypes, type SecurityTypeDto } from '../../lib/api/securityTypes';
import { buildOpenApiDocument, documentToJson, documentToXml, documentToYaml } from '../../lib/openapiExport';
import { computeCodeLines } from '../../lib/codeHighlight';
import { commitRestProjectionEdit } from '../../lib/restProjectionEdit';
import type { RestProjectionFormat } from '../../types/ui';
import styles from './RestProjectionCanvas.module.css';

type SecurityTypesState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; types: SecurityTypeDto[] };

const FORMATS: RestProjectionFormat[] = ['yaml', 'json', 'xml'];
const FILENAME_FOR_FORMAT: Record<RestProjectionFormat, string> = {
  yaml: 'openapi.yaml',
  json: 'openapi.json',
  xml: 'openapi.xml',
};

export function RestProjectionCanvas() {
  const highlightingEnabled = useAppStore((s) => s.highlightingEnabled);
  const format = useAppStore((s) => s.restProjectionFormat);
  const setFormat = useAppStore((s) => s.setRestProjectionFormat);
  const showMeta = useAppStore((s) => s.restProjectionShowMeta);
  const toggleShowMeta = useAppStore((s) => s.toggleRestProjectionMeta);
  const manual = useAppStore((s) => s.restProjectionManual);
  const setManual = useAppStore((s) => s.setRestProjectionManual);
  const error = useAppStore((s) => s.restProjectionError);
  const clearManual = useAppStore((s) => s.clearRestProjectionManual);

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

  const overlayRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchSecurityTypes()
      .then((types) => setSecurityTypesState({ status: 'ready', types }))
      .catch(() => setSecurityTypesState({ status: 'error' }));
  }, []);

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
    if (format === 'json') return documentToJson(doc);
    if (format === 'xml') return documentToXml(doc);
    return documentToYaml(doc);
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
  const lines = useMemo(
    () => computeCodeLines(displayText, format, highlightingEnabled),
    [displayText, format, highlightingEnabled],
  );
  const gutterWidth = String(lines.length).length;

  const syncScroll = () => {
    if (overlayRef.current && textareaRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const copy = () => {
    navigator.clipboard?.writeText(displayText).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 1500);
    });
  };

  const syncLabel = error ? error : isEdited ? 'Unsaved — click outside to apply to canvas' : 'Synced with canvas';

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <span className={styles.filename}>{FILENAME_FOR_FORMAT[format]}</span>
        <span className={styles.stateBadge}>{isEdited ? 'edited' : 'generated'}</span>
        <div className={styles.spacer} />
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
        <button type="button" className={styles.toolbarBtn} onClick={copy}>
          {copyFeedback ? 'Copied ✓' : 'Copy'}
        </button>
        <button type="button" className={styles.toolbarBtn} onClick={clearManual}>
          Regenerate
        </button>
      </div>

      <div className={styles.codeWrap}>
        <div ref={overlayRef} className={styles.overlay}>
          {lines.map((line) => (
            <div key={line.num} className={styles.lineRow}>
              <span className={styles.gutter} style={{ width: `${gutterWidth}ch` }}>
                {String(line.num).padStart(gutterWidth, ' ')}
              </span>
              <div className={styles.runs}>
                {line.runs.map((run, i) => (
                  <span key={i} className={styles.run} data-token={run.token}>
                    {run.text}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          aria-label={`REST Projection document (${format.toUpperCase()})`}
          spellCheck={false}
          wrap="off"
          value={displayText}
          onChange={(e) => setManual(format, e.target.value)}
          onBlur={() => {
            if (manual[format] != null) commitRestProjectionEdit(manual[format]!, format);
          }}
          onScroll={syncScroll}
        />
      </div>

      <div className={styles.footer}>
        <span>OpenAPI {apiOpenapiVersion}</span>
        <span>·</span>
        <span>{lines.length} lines</span>
        <div className={styles.spacer} />
        <span className={styles.syncLabel} data-state={error ? 'error' : isEdited ? 'unsaved' : 'synced'}>
          {syncLabel}
        </span>
      </div>
    </div>
  );
}
