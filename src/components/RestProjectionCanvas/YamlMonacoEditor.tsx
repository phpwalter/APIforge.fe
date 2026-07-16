import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { setupMonacoOpenApiYaml } from '../../lib/monaco/setup';
import styles from './RestProjectionCanvas.module.css';

interface YamlMonacoEditorProps {
  value: string;
  theme: 'dark' | 'light';
  /** The panel's own root element — a blur that lands back inside it (our toolbar) doesn't count as "leaving the editor". */
  wrapRef: RefObject<HTMLDivElement | null>;
  /** Off switches the model's language to plaintext — no tokens/colors, but also no schema validation, hover, or autocomplete while off. */
  highlightingEnabled: boolean;
  lineNumbersEnabled: boolean;
  onChange: (value: string) => void;
  onCommit: (value: string) => void;
}

/**
 * A real YAML editor for the REST Projection panel: Monaco + monaco-yaml, validating against the
 * official OpenAPI 3.1 JSON Schema (hover, autocomplete, and Shift+Alt+F formatting come from
 * monaco-yaml once the schema is registered — see lib/monaco/setup.ts). JSON and XML still use
 * the plain textarea + highlight.js overlay; only YAML gets the full editor for now.
 */
export function YamlMonacoEditor({
  value,
  theme,
  wrapRef,
  highlightingEnabled,
  lineNumbersEnabled,
  onChange,
  onCommit,
}: YamlMonacoEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<import('monaco-editor').editor.IStandaloneCodeEditor | null>(null);
  const onChangeRef = useRef(onChange);
  const onCommitRef = useRef(onCommit);
  onChangeRef.current = onChange;
  onCommitRef.current = onCommit;

  useEffect(() => {
    if (!containerRef.current) return;
    const monaco = setupMonacoOpenApiYaml();

    const model = monaco.editor.createModel(
      value,
      highlightingEnabled ? 'yaml' : 'plaintext',
      monaco.Uri.parse('file:///openapi.yaml'),
    );
    const editor = monaco.editor.create(containerRef.current, {
      model,
      automaticLayout: true,
      minimap: { enabled: false },
      theme: theme === 'dark' ? 'vs-dark' : 'vs',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12.5,
      lineHeight: 1.7 * 12.5,
      scrollBeyondLastLine: false,
      tabSize: 2,
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
    // Only re-run for a genuinely new editor instance — value/theme are synced by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const model = editorRef.current?.getModel();
    if (model && model.getValue() !== value) model.setValue(value);
  }, [value]);

  useEffect(() => {
    // Global (there's only ever one Monaco instance mounted, since it's YAML-tab-only).
    setupMonacoOpenApiYaml().editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs');
  }, [theme]);

  useEffect(() => {
    editorRef.current?.updateOptions({ lineNumbers: lineNumbersEnabled ? 'on' : 'off' });
  }, [lineNumbersEnabled]);

  useEffect(() => {
    const model = editorRef.current?.getModel();
    const monaco = setupMonacoOpenApiYaml();
    if (model) monaco.editor.setModelLanguage(model, highlightingEnabled ? 'yaml' : 'plaintext');
  }, [highlightingEnabled]);

  return <div ref={containerRef} className={styles.monacoContainer} />;
}
