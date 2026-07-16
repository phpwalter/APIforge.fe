import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { useAppStore } from '../../state/useAppStore';
import { useSpecStore } from '../../state/useSpecStore';
import { fetchSecurityTypes, type SecurityTypeDto } from '../../lib/api/securityTypes';
import {
  buildOpenApiDocument,
  documentToYaml,
  downloadTextFile,
  slugifyFilename,
} from '../../lib/openapiExport';
import { applyLineEndingPrefs, withByteOrderMark } from '../../lib/fileEncoding';
import { resolveIndentUnit } from '../../lib/formatting';
import styles from './ExportModal.module.css';

type FetchState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; types: SecurityTypeDto[] };

export function ExportModal() {
  const closeExportModal = useAppStore((s) => s.closeExportModal);
  const apiTitle = useAppStore((s) => s.apiTitle);
  const apiVersion = useAppStore((s) => s.apiVersion);
  const apiOpenapiVersion = useAppStore((s) => s.apiOpenapiVersion);
  const apiDescription = useAppStore((s) => s.apiDescription);
  const apiTermsOfService = useAppStore((s) => s.apiTermsOfService);
  const apiContact = useAppStore((s) => s.apiContact);
  const apiLicense = useAppStore((s) => s.apiLicense);
  const apiServers = useAppStore((s) => s.apiServers);
  const apiExternalDocs = useAppStore((s) => s.apiExternalDocs);
  const characterEncoding = useAppStore((s) => s.fileEncodingCharacterEncoding);
  const lineEnding = useAppStore((s) => s.fileEncodingLineEnding);
  const insertFinalNewline = useAppStore((s) => s.fileEncodingInsertFinalNewline);
  const formattingIndentSize = useAppStore((s) => s.formattingIndentSize);
  const formattingIndentStyle = useAppStore((s) => s.formattingIndentStyle);

  const endpoints = useSpecStore((s) => s.endpoints);
  const schemas = useSpecStore((s) => s.schemas);
  const enabledSecuritySchemes = useSpecStore((s) => s.enabledSecuritySchemes);
  const securityScopes = useSpecStore((s) => s.securityScopes);

  const [state, setState] = useState<FetchState>({ status: 'loading' });

  useEffect(() => {
    fetchSecurityTypes()
      .then((types) => setState({ status: 'ready', types }))
      .catch(() => setState({ status: 'error' }));
  }, []);

  const download = (variant: 'full' | 'clean') => {
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
      securityTypes: state.status === 'ready' ? state.types : [],
      variant,
    });
    const slug = slugifyFilename(apiTitle);
    const filename = variant === 'full' ? `${slug}.apiforge.yaml` : `${slug}.yaml`;
    const indentSize = resolveIndentUnit('yaml', formattingIndentSize, formattingIndentStyle).length;
    const yaml = applyLineEndingPrefs(documentToYaml(doc, indentSize), { lineEnding, insertFinalNewline });
    downloadTextFile(filename, withByteOrderMark(yaml, characterEncoding), 'application/yaml');
    closeExportModal();
  };

  return (
    <div className={styles.scrim} onClick={closeExportModal}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <div className={styles.headerText}>
            <div className={styles.title}>Export OpenAPI document</div>
            <div className={styles.subtitle}>
              {apiTitle} · {apiVersion} · <span className={styles.mono}>YAML</span>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} title="Close" onClick={closeExportModal}>
            <X size={15} />
          </button>
        </div>

        <div className={styles.body}>
          <button type="button" className={styles.optionCard} data-variant="full" onClick={() => download('full')}>
            <div className={styles.optionHead}>
              <span className={styles.optionIcon}>
                <Download size={15} />
              </span>
              <span className={styles.optionTitle}>Full APIforge Export</span>
              <span className={styles.badgeAccent}>x-apiforge</span>
            </div>
            <div className={styles.optionDesc}>
              Includes an <code className={styles.mono}>x-apiforge-primitive</code> extension marking properties
              backed by the primitives library. Best for round-tripping back into APIforge.
            </div>
          </button>

          <button type="button" className={styles.optionCard} data-variant="clean" onClick={() => download('clean')}>
            <div className={styles.optionHead}>
              <span className={styles.optionIconDim}>
                <Download size={15} />
              </span>
              <span className={styles.optionTitle}>Clean OpenAPI Export</span>
              <span className={styles.badgeNeutral}>standard OAS</span>
            </div>
            <div className={styles.optionDesc}>
              Strips all APIforge metadata. Best for public docs, client SDK generation, and partner delivery.
            </div>
          </button>

          {state.status === 'error' && (
            <div className={styles.warning}>
              Couldn&apos;t load security scheme details — exported schemes will use a generic placeholder
              definition.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
