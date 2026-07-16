import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { RefObject } from 'react';
import { setupMonacoOpenApiEditors } from '../../lib/monaco/setup';
import type { RestProjectionFormat } from '../../types/ui';
import type { MonacoThemeId } from '../../lib/colorScheme';
import styles from './RestProjectionCanvas.module.css';

interface ProjectionMonacoEditorProps {
  value: string;
  format: RestProjectionFormat;
  /** Resolved Monaco theme id — Settings :: Editor Preferences :: Color Scheme, with 'auto' already resolved against the app's Day/Night theme. */
  monacoTheme: MonacoThemeId;
  /** The panel's own root element — a blur that lands back inside it (our toolbar) doesn't count as "leaving the editor". */
  wrapRef: RefObject<HTMLDivElement | null>;
  /** Off switches the model's language to plaintext — no tokens/colors, but also no schema validation, hover, or autocomplete while off. */
  highlightingEnabled: boolean;
  lineNumbersEnabled: boolean;
  /** Visual width of a tab stop / auto-indent step — from Settings :: Editor Preferences :: Formatting. */
  tabSize: number;
  /** Whether pressing Tab inserts spaces (vs. a literal tab character) — always true for YAML, since tab indentation is invalid there. */
  insertSpaces: boolean;
  wordWrap: boolean;
  onChange: (value: string) => void;
  onCommit: (value: string) => void;
}

export interface ProjectionMonacoEditorHandle {
  /** Scrolls the given 1-based line into the center of the viewport and moves the cursor there — used by the outline panel's jump-to-section clicks. */
  revealLine: (line: number) => void;
}

/**
 * A real code editor for the REST Projection panel: Monaco, validating both the YAML (via
 * monaco-yaml) and JSON (via Monaco's built-in JSON language service) views against the official
 * OpenAPI 3.1 JSON Schema (hover, autocomplete, and Shift+Alt+F formatting come from the schema
 * once registered — see lib/monaco/setup.ts).
 */
export const ProjectionMonacoEditor = forwardRef<ProjectionMonacoEditorHandle, ProjectionMonacoEditorProps>(
  function ProjectionMonacoEditor(
    { value, format, monacoTheme, wrapRef, highlightingEnabled, lineNumbersEnabled, tabSize, insertSpaces, wordWrap, onChange, onCommit },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<import('monaco-editor').editor.IStandaloneCodeEditor | null>(null);
    const onChangeRef = useRef(onChange);
    const onCommitRef = useRef(onCommit);
    onChangeRef.current = onChange;
    onCommitRef.current = onCommit;

    useEffect(() => {
      if (!containerRef.current) return;
      const monaco = setupMonacoOpenApiEditors();

      const model = monaco.editor.createModel(
        value,
        highlightingEnabled ? format : 'plaintext',
        monaco.Uri.parse(`file:///openapi.${format}`),
      );
      const editor = monaco.editor.create(containerRef.current, {
        model,
        automaticLayout: true,
        minimap: { enabled: false },
        theme: monacoTheme,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12.5,
        lineHeight: 1.7 * 12.5,
        scrollBeyondLastLine: false,
        tabSize,
        insertSpaces,
        wordWrap: wordWrap ? 'on' : 'off',
        lineNumbers: lineNumbersEnabled ? 'on' : 'off',
      });
      editorRef.current = editor;
      // Monaco's own initial paint doesn't reliably fire when mounted behind a Suspense boundary
      // (the container can still be mid-layout on the same tick create() runs) — force one so the
      // very first open of the tab doesn't show a blank editor until the next resize/keystroke.
      editor.layout();
      editor.render(true);

      const changeSub = model.onDidChangeContent(() => onChangeRef.current(model.getValue()));
      const blurSub = editor.onDidBlurEditorText(() => {
        const next = document.activeElement;
        if (next && wrapRef.current?.contains(next)) return;
        onCommitRef.current(model.getValue());
      });

      return () => {
        changeSub.dispose();
        blurSub.dispose();
        editor.dispose();
        model.dispose();
        editorRef.current = null;
      };
      // Only re-run when the format changes (a genuinely new model/editor) — value/theme/toggles are
      // synced by the effects below, and re-running this for those would recreate the editor and
      // drop focus/undo-history on every toggle click.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [format]);

    useEffect(() => {
      const model = editorRef.current?.getModel();
      if (model && model.getValue() !== value) model.setValue(value);
    }, [value]);

    useEffect(() => {
      // Global (there's only ever one Monaco instance mounted at a time, since the panel shows one format).
      setupMonacoOpenApiEditors().editor.setTheme(monacoTheme);
    }, [monacoTheme]);

    useEffect(() => {
      editorRef.current?.updateOptions({ lineNumbers: lineNumbersEnabled ? 'on' : 'off' });
    }, [lineNumbersEnabled]);

    useEffect(() => {
      editorRef.current?.updateOptions({ tabSize, insertSpaces, wordWrap: wordWrap ? 'on' : 'off' });
    }, [tabSize, insertSpaces, wordWrap]);

    useEffect(() => {
      const model = editorRef.current?.getModel();
      const monaco = setupMonacoOpenApiEditors();
      if (model) monaco.editor.setModelLanguage(model, highlightingEnabled ? format : 'plaintext');
    }, [format, highlightingEnabled]);

    useImperativeHandle(
      ref,
      () => ({
        revealLine: (line) => {
          const editor = editorRef.current;
          if (!editor) return;
          editor.revealLineInCenter(line);
          editor.setPosition({ lineNumber: line, column: 1 });
          editor.focus();
        },
      }),
      [],
    );

    return <div ref={containerRef} className={styles.monacoContainer} />;
  },
);
