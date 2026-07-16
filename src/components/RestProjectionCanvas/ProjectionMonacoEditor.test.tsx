import { render } from '@testing-library/react';
import { createRef } from 'react';
import { ProjectionMonacoEditor, type ProjectionMonacoEditorHandle } from './ProjectionMonacoEditor';

// ProjectionMonacoEditor's only monaco-specific dependency is setupMonacoOpenApiEditors() — mock
// it with a minimal fake `monaco` namespace so these tests exercise the component's own wiring
// (model creation, change/blur listeners, external-value sync, disposal) without needing a real
// Monaco runtime, which jsdom can't provide.
const listeners: { change: Array<() => void>; blur: Array<() => void> } = { change: [], blur: [] };
let modelValue = '';
let modelLanguage = 'yaml';
const model = {
  getValue: vi.fn(() => modelValue),
  setValue: vi.fn((v: string) => {
    modelValue = v;
  }),
  onDidChangeContent: vi.fn((cb: () => void) => {
    listeners.change.push(cb);
    return { dispose: vi.fn() };
  }),
  dispose: vi.fn(),
};
const editor = {
  getModel: vi.fn(() => model),
  onDidBlurEditorText: vi.fn((cb: () => void) => {
    listeners.blur.push(cb);
    return { dispose: vi.fn() };
  }),
  layout: vi.fn(),
  render: vi.fn(),
  updateOptions: vi.fn(),
  revealLineInCenter: vi.fn(),
  setPosition: vi.fn(),
  focus: vi.fn(),
  dispose: vi.fn(),
};
const createModel = vi.fn((value: string, language: string) => {
  modelValue = value;
  modelLanguage = language;
  return model;
});
const create = vi.fn(() => editor);
const setTheme = vi.fn();
const setModelLanguage = vi.fn((_model: unknown, language: string) => {
  modelLanguage = language;
});

vi.mock('../../lib/monaco/setup', () => ({
  setupMonacoOpenApiEditors: () => ({
    editor: { createModel, create, setTheme, setModelLanguage },
    Uri: { parse: (s: string) => s },
  }),
}));

function fireChange(newValue: string) {
  modelValue = newValue;
  listeners.change.forEach((cb) => cb());
}

function fireBlur() {
  listeners.blur.forEach((cb) => cb());
}

beforeEach(() => {
  listeners.change = [];
  listeners.blur = [];
  modelValue = '';
  modelLanguage = 'yaml';
  vi.clearAllMocks();
});

describe('ProjectionMonacoEditor', () => {
  it('creates the model in the given format language with the initial value', () => {
    render(
      <ProjectionMonacoEditor
        value="openapi: 3.1.0"
        format="yaml"
        theme="dark"
        wrapRef={createRef()}
        highlightingEnabled
        lineNumbersEnabled
        tabSize={2}
        insertSpaces
        wordWrap={false}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );

    expect(createModel).toHaveBeenCalledWith('openapi: 3.1.0', 'yaml', 'file:///openapi.yaml');
    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][1]).toMatchObject({ lineNumbers: 'on' });
  });

  it('creates a JSON model with its own URI when format is json', () => {
    render(
      <ProjectionMonacoEditor
        value="{}"
        format="json"
        theme="dark"
        wrapRef={createRef()}
        highlightingEnabled
        lineNumbersEnabled
        tabSize={2}
        insertSpaces
        wordWrap={false}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );

    expect(createModel).toHaveBeenCalledWith('{}', 'json', 'file:///openapi.json');
  });

  it('creates the model as plaintext when highlighting is off, and with line numbers off', () => {
    render(
      <ProjectionMonacoEditor
        value="openapi: 3.1.0"
        format="yaml"
        theme="dark"
        wrapRef={createRef()}
        highlightingEnabled={false}
        lineNumbersEnabled={false}
        tabSize={2}
        insertSpaces
        wordWrap={false}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );

    expect(createModel).toHaveBeenCalledWith('openapi: 3.1.0', 'plaintext', 'file:///openapi.yaml');
    expect(create.mock.calls[0][1]).toMatchObject({ lineNumbers: 'off' });
  });

  it('calls onChange with the model value whenever the content changes', () => {
    const onChange = vi.fn();
    render(
      <ProjectionMonacoEditor
        value="a: 1"
        format="yaml"
        theme="dark"
        wrapRef={createRef()}
        highlightingEnabled
        lineNumbersEnabled
        tabSize={2}
        insertSpaces
        wordWrap={false}
        onChange={onChange}
        onCommit={vi.fn()}
      />,
    );

    fireChange('a: 2');

    expect(onChange).toHaveBeenCalledWith('a: 2');
  });

  it('commits on blur when focus moves outside the panel', () => {
    const wrapRef = createRef<HTMLDivElement>();
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();
    Object.defineProperty(wrapRef, 'current', { value: document.createElement('div'), writable: true });

    const onCommit = vi.fn();
    render(
      <ProjectionMonacoEditor
        value="a: 1"
        format="yaml"
        theme="dark"
        wrapRef={wrapRef}
        highlightingEnabled
        lineNumbersEnabled
        tabSize={2}
        insertSpaces
        wordWrap={false}
        onChange={vi.fn()}
        onCommit={onCommit}
      />,
    );
    fireChange('a: 2');
    fireBlur();

    expect(onCommit).toHaveBeenCalledWith('a: 2');
    outside.remove();
  });

  it('does not commit on blur when focus moves back into the panel (e.g. the toolbar)', () => {
    const wrapRef = createRef<HTMLDivElement>();
    const panel = document.createElement('div');
    const toolbarButton = document.createElement('button');
    panel.appendChild(toolbarButton);
    document.body.appendChild(panel);
    toolbarButton.focus();
    Object.defineProperty(wrapRef, 'current', { value: panel, writable: true });

    const onCommit = vi.fn();
    render(
      <ProjectionMonacoEditor
        value="a: 1"
        format="yaml"
        theme="dark"
        wrapRef={wrapRef}
        highlightingEnabled
        lineNumbersEnabled
        tabSize={2}
        insertSpaces
        wordWrap={false}
        onChange={vi.fn()}
        onCommit={onCommit}
      />,
    );
    fireChange('a: 2');
    fireBlur();

    expect(onCommit).not.toHaveBeenCalled();
    panel.remove();
  });

  it('pushes an external value change (e.g. after a commit regenerates the doc) into the model', () => {
    const { rerender } = render(
      <ProjectionMonacoEditor
        value="a: 1"
        format="yaml"
        theme="dark"
        wrapRef={createRef()}
        highlightingEnabled
        lineNumbersEnabled
        tabSize={2}
        insertSpaces
        wordWrap={false}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );

    rerender(
      <ProjectionMonacoEditor
        value="a: 2"
        format="yaml"
        theme="dark"
        wrapRef={createRef()}
        highlightingEnabled
        lineNumbersEnabled
        tabSize={2}
        insertSpaces
        wordWrap={false}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );

    expect(model.setValue).toHaveBeenCalledWith('a: 2');
  });

  it('does not call setValue when the model already matches the incoming value (avoids clobbering the cursor mid-type)', () => {
    modelValue = 'a: 1';
    const { rerender } = render(
      <ProjectionMonacoEditor
        value="a: 1"
        format="yaml"
        theme="dark"
        wrapRef={createRef()}
        highlightingEnabled
        lineNumbersEnabled
        tabSize={2}
        insertSpaces
        wordWrap={false}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );
    model.setValue.mockClear();

    rerender(
      <ProjectionMonacoEditor
        value="a: 1"
        format="yaml"
        theme="dark"
        wrapRef={createRef()}
        highlightingEnabled
        lineNumbersEnabled
        tabSize={2}
        insertSpaces
        wordWrap={false}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );

    expect(model.setValue).not.toHaveBeenCalled();
  });

  it('switches the global Monaco theme when the theme prop changes', () => {
    const { rerender } = render(
      <ProjectionMonacoEditor
        value="a: 1"
        format="yaml"
        theme="dark"
        wrapRef={createRef()}
        highlightingEnabled
        lineNumbersEnabled
        tabSize={2}
        insertSpaces
        wordWrap={false}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );
    expect(setTheme).toHaveBeenCalledWith('vs-dark');

    rerender(
      <ProjectionMonacoEditor
        value="a: 1"
        format="yaml"
        theme="light"
        wrapRef={createRef()}
        highlightingEnabled
        lineNumbersEnabled
        tabSize={2}
        insertSpaces
        wordWrap={false}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );
    expect(setTheme).toHaveBeenCalledWith('vs');
  });

  it('toggles Monaco line numbers on/off when lineNumbersEnabled changes', () => {
    const { rerender } = render(
      <ProjectionMonacoEditor
        value="a: 1"
        format="yaml"
        theme="dark"
        wrapRef={createRef()}
        highlightingEnabled
        lineNumbersEnabled
        tabSize={2}
        insertSpaces
        wordWrap={false}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );

    rerender(
      <ProjectionMonacoEditor
        value="a: 1"
        format="yaml"
        theme="dark"
        wrapRef={createRef()}
        highlightingEnabled
        lineNumbersEnabled={false}
        tabSize={2}
        insertSpaces
        wordWrap={false}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );

    expect(editor.updateOptions).toHaveBeenCalledWith({ lineNumbers: 'off' });
  });

  it('creates the editor with the given tabSize/insertSpaces/wordWrap, and updates them live when they change', () => {
    const { rerender } = render(
      <ProjectionMonacoEditor
        value="a: 1"
        format="yaml"
        theme="dark"
        wrapRef={createRef()}
        highlightingEnabled
        lineNumbersEnabled
        tabSize={4}
        insertSpaces
        wordWrap={false}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );
    expect(create.mock.calls[0][1]).toMatchObject({ tabSize: 4, insertSpaces: true, wordWrap: 'off' });

    rerender(
      <ProjectionMonacoEditor
        value="a: 1"
        format="yaml"
        theme="dark"
        wrapRef={createRef()}
        highlightingEnabled
        lineNumbersEnabled
        tabSize={2}
        insertSpaces={false}
        wordWrap
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );

    expect(editor.updateOptions).toHaveBeenCalledWith({ tabSize: 2, insertSpaces: false, wordWrap: 'on' });
  });

  it('switches the model language between the format language and plaintext when highlightingEnabled changes', () => {
    const { rerender } = render(
      <ProjectionMonacoEditor
        value="a: 1"
        format="yaml"
        theme="dark"
        wrapRef={createRef()}
        highlightingEnabled
        lineNumbersEnabled
        tabSize={2}
        insertSpaces
        wordWrap={false}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );

    rerender(
      <ProjectionMonacoEditor
        value="a: 1"
        format="yaml"
        theme="dark"
        wrapRef={createRef()}
        highlightingEnabled={false}
        lineNumbersEnabled
        tabSize={2}
        insertSpaces
        wordWrap={false}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );

    expect(setModelLanguage).toHaveBeenCalledWith(model, 'plaintext');
    expect(modelLanguage).toBe('plaintext');
  });

  it('recreates the editor with a new model when the format prop changes (switching REST Projection tabs)', () => {
    const { rerender } = render(
      <ProjectionMonacoEditor
        value="openapi: 3.1.0"
        format="yaml"
        theme="dark"
        wrapRef={createRef()}
        highlightingEnabled
        lineNumbersEnabled
        tabSize={2}
        insertSpaces
        wordWrap={false}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );
    expect(create).toHaveBeenCalledTimes(1);

    rerender(
      <ProjectionMonacoEditor
        value="{}"
        format="json"
        theme="dark"
        wrapRef={createRef()}
        highlightingEnabled
        lineNumbersEnabled
        tabSize={2}
        insertSpaces
        wordWrap={false}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );

    expect(editor.dispose).toHaveBeenCalledTimes(1);
    expect(model.dispose).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledTimes(2);
    expect(createModel).toHaveBeenLastCalledWith('{}', 'json', 'file:///openapi.json');
  });

  it('exposes revealLine via the ref, which reveals, positions, and focuses the editor at that line', () => {
    const handleRef = createRef<ProjectionMonacoEditorHandle>();
    render(
      <ProjectionMonacoEditor
        ref={handleRef}
        value="a: 1"
        format="yaml"
        theme="dark"
        wrapRef={createRef()}
        highlightingEnabled
        lineNumbersEnabled
        tabSize={2}
        insertSpaces
        wordWrap={false}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );

    handleRef.current?.revealLine(7);

    expect(editor.revealLineInCenter).toHaveBeenCalledWith(7);
    expect(editor.setPosition).toHaveBeenCalledWith({ lineNumber: 7, column: 1 });
    expect(editor.focus).toHaveBeenCalledTimes(1);
  });

  it('disposes the editor and model on unmount', () => {
    const { unmount } = render(
      <ProjectionMonacoEditor
        value="a: 1"
        format="yaml"
        theme="dark"
        wrapRef={createRef()}
        highlightingEnabled
        lineNumbersEnabled
        tabSize={2}
        insertSpaces
        wordWrap={false}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );

    unmount();

    expect(editor.dispose).toHaveBeenCalledTimes(1);
    expect(model.dispose).toHaveBeenCalledTimes(1);
  });
});
