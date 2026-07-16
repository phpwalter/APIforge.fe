import { render } from '@testing-library/react';
import { createRef } from 'react';
import { YamlMonacoEditor } from './YamlMonacoEditor';

// YamlMonacoEditor's only monaco-specific dependency is setupMonacoOpenApiYaml() — mock it with a
// minimal fake `monaco` namespace so these tests exercise the component's own wiring (model
// creation, change/blur listeners, external-value sync, disposal) without needing a real Monaco
// runtime, which jsdom can't provide.
const listeners: { change: Array<() => void>; blur: Array<() => void> } = { change: [], blur: [] };
let modelValue = '';
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
  dispose: vi.fn(),
};
const createModel = vi.fn((value: string) => {
  modelValue = value;
  return model;
});
const create = vi.fn(() => editor);
const setTheme = vi.fn();

vi.mock('../../lib/monaco/setup', () => ({
  setupMonacoOpenApiYaml: () => ({
    editor: { createModel, create, setTheme },
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
  vi.clearAllMocks();
});

describe('YamlMonacoEditor', () => {
  it('creates the model as YAML with the given initial value', () => {
    render(
      <YamlMonacoEditor
        value="openapi: 3.1.0"
        theme="dark"
        wrapRef={createRef()}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );

    expect(createModel).toHaveBeenCalledWith('openapi: 3.1.0', 'yaml', 'file:///openapi.yaml');
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('calls onChange with the model value whenever the content changes', () => {
    const onChange = vi.fn();
    render(
      <YamlMonacoEditor value="a: 1" theme="dark" wrapRef={createRef()} onChange={onChange} onCommit={vi.fn()} />,
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
      <YamlMonacoEditor value="a: 1" theme="dark" wrapRef={wrapRef} onChange={vi.fn()} onCommit={onCommit} />,
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
      <YamlMonacoEditor value="a: 1" theme="dark" wrapRef={wrapRef} onChange={vi.fn()} onCommit={onCommit} />,
    );
    fireChange('a: 2');
    fireBlur();

    expect(onCommit).not.toHaveBeenCalled();
    panel.remove();
  });

  it('pushes an external value change (e.g. after a commit regenerates the doc) into the model', () => {
    const { rerender } = render(
      <YamlMonacoEditor value="a: 1" theme="dark" wrapRef={createRef()} onChange={vi.fn()} onCommit={vi.fn()} />,
    );

    rerender(
      <YamlMonacoEditor value="a: 2" theme="dark" wrapRef={createRef()} onChange={vi.fn()} onCommit={vi.fn()} />,
    );

    expect(model.setValue).toHaveBeenCalledWith('a: 2');
  });

  it('does not call setValue when the model already matches the incoming value (avoids clobbering the cursor mid-type)', () => {
    modelValue = 'a: 1';
    const { rerender } = render(
      <YamlMonacoEditor value="a: 1" theme="dark" wrapRef={createRef()} onChange={vi.fn()} onCommit={vi.fn()} />,
    );
    model.setValue.mockClear();

    rerender(
      <YamlMonacoEditor value="a: 1" theme="dark" wrapRef={createRef()} onChange={vi.fn()} onCommit={vi.fn()} />,
    );

    expect(model.setValue).not.toHaveBeenCalled();
  });

  it('switches the global Monaco theme when the theme prop changes', () => {
    const { rerender } = render(
      <YamlMonacoEditor value="a: 1" theme="dark" wrapRef={createRef()} onChange={vi.fn()} onCommit={vi.fn()} />,
    );
    expect(setTheme).toHaveBeenCalledWith('vs-dark');

    rerender(
      <YamlMonacoEditor value="a: 1" theme="light" wrapRef={createRef()} onChange={vi.fn()} onCommit={vi.fn()} />,
    );
    expect(setTheme).toHaveBeenCalledWith('vs');
  });

  it('disposes the editor and model on unmount', () => {
    const { unmount } = render(
      <YamlMonacoEditor value="a: 1" theme="dark" wrapRef={createRef()} onChange={vi.fn()} onCommit={vi.fn()} />,
    );

    unmount();

    expect(editor.dispose).toHaveBeenCalledTimes(1);
    expect(model.dispose).toHaveBeenCalledTimes(1);
  });
});
