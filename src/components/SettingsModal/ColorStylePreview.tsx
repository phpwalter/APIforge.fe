import { useEffect, useRef, useState } from 'react';
import { setupMonacoOpenApiEditors } from '../../lib/monaco/setup';
import { buildColorStyleTheme, PROJECTION_THEME_ID, type ColorStylePrefs, type ThemeColorOverrides } from '../../lib/colorStyle';
import type { MonacoThemeId } from '../../lib/colorScheme';
import type { RestProjectionFormat } from '../../types/ui';
import styles from './ColorStylePreview.module.css';

const FORMATS: RestProjectionFormat[] = ['yaml', 'json'];

// Small, structurally-valid OpenAPI fragments — enough to exercise every Color Style category
// (Keys, Strings, Numbers, Literals, Comments) without tripping schema-validation squiggles that
// would distract from the actual color preview. JSON has no comment to demonstrate, since
// comments aren't valid JSON and Monaco's own diagnostics would flag one as a parse error.
const SAMPLE_YAML = `openapi: 3.1.0
info:
  title: Sample API # inline comment
  version: 1.0.0
paths:
  /users/{id}:
    get:
      summary: Get a user
      operationId: getUser
      responses:
        '200':
          description: OK
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        active:
          type: boolean
          default: true
        count:
          type: integer
          example: 3
`;

const SAMPLE_JSON = `{
  "openapi": "3.1.0",
  "info": {
    "title": "Sample API",
    "version": "1.0.0"
  },
  "paths": {
    "/users/{id}": {
      "get": {
        "summary": "Get a user",
        "operationId": "getUser",
        "responses": {
          "200": { "description": "OK" }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "User": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "active": { "type": "boolean", "default": true },
          "count": { "type": "integer", "example": 3 }
        }
      }
    }
  }
}
`;

interface ColorStylePreviewProps {
  monacoTheme: MonacoThemeId;
  colorStylePrefs: ColorStylePrefs;
  colorStyleCustomColors: ThemeColorOverrides;
}

/** Read-only live preview of the Color Style settings — a small Monaco instance over a fixed sample document, with its own YAML/JSON switcher above it. */
export function ColorStylePreview({ monacoTheme, colorStylePrefs, colorStyleCustomColors }: ColorStylePreviewProps) {
  const [format, setFormat] = useState<RestProjectionFormat>('yaml');
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<import('monaco-editor').editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const monaco = setupMonacoOpenApiEditors();
    const model = monaco.editor.createModel(
      format === 'yaml' ? SAMPLE_YAML : SAMPLE_JSON,
      format,
      monaco.Uri.parse(`inmemory://color-style-preview.${format}`),
    );
    const editor = monaco.editor.create(containerRef.current, {
      model,
      readOnly: true,
      domReadOnly: true,
      automaticLayout: true,
      minimap: { enabled: false },
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12,
      lineHeight: 1.6 * 12,
      scrollBeyondLastLine: false,
      renderLineHighlight: 'none',
    });
    editorRef.current = editor;
    editor.layout();
    editor.render(true);

    return () => {
      editor.dispose();
      model.dispose();
      editorRef.current = null;
    };
  }, [format]);

  useEffect(() => {
    const monaco = setupMonacoOpenApiEditors();
    const { rules, colors } = buildColorStyleTheme(monacoTheme, colorStylePrefs, colorStyleCustomColors);
    monaco.editor.defineTheme(PROJECTION_THEME_ID, { base: monacoTheme, inherit: true, rules, colors });
    monaco.editor.setTheme(PROJECTION_THEME_ID);
  }, [monacoTheme, colorStylePrefs, colorStyleCustomColors]);

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <span className={styles.label}>Preview</span>
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
      <div className={styles.editorWrap} ref={containerRef} />
    </div>
  );
}
