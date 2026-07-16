import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColorStylePreview } from './ColorStylePreview';
import { DEFAULT_COLOR_STYLE_PREFS } from '../../lib/colorStyle';

// Mirrors ProjectionMonacoEditor.test.tsx's fake `monaco` namespace — jsdom can't run real Monaco.
const model = { dispose: vi.fn() };
const editor = { layout: vi.fn(), render: vi.fn(), dispose: vi.fn() };
const createModel = vi.fn(() => model);
const create = vi.fn(() => editor);
const setTheme = vi.fn();
const defineTheme = vi.fn();

vi.mock('../../lib/monaco/setup', () => ({
  setupMonacoOpenApiEditors: () => ({
    editor: { createModel, create, setTheme, defineTheme },
    Uri: { parse: (s: string) => s },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ColorStylePreview', () => {
  it('creates a read-only YAML model by default, at a URI distinct from the real editor (avoids a duplicate-model collision)', () => {
    render(
      <ColorStylePreview
        monacoTheme="vs-dark"
        colorStylePrefs={DEFAULT_COLOR_STYLE_PREFS}
        colorStyleCustomColors={{}}
      />,
    );

    expect(createModel).toHaveBeenCalledTimes(1);
    const [content, language, uri] = createModel.mock.calls[0];
    expect(language).toBe('yaml');
    expect(uri).not.toBe('file:///openapi.yaml');
    expect(content).toContain('openapi: 3.1.0');
    expect(create.mock.calls[0][1]).toMatchObject({ readOnly: true });
  });

  it('switches to a JSON sample model when the format pill is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ColorStylePreview
        monacoTheme="vs-dark"
        colorStylePrefs={DEFAULT_COLOR_STYLE_PREFS}
        colorStyleCustomColors={{}}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'JSON' }));

    expect(model.dispose).toHaveBeenCalledTimes(1);
    expect(createModel).toHaveBeenCalledTimes(2);
    const [content, language] = createModel.mock.calls[1];
    expect(language).toBe('json');
    expect(content).toContain('"openapi": "3.1.0"');
  });

  it('defines and applies the derived theme, including custom colors', () => {
    render(
      <ColorStylePreview
        monacoTheme="vs-dark"
        colorStylePrefs={DEFAULT_COLOR_STYLE_PREFS}
        colorStyleCustomColors={{ strings: '#ff8800' }}
      />,
    );

    expect(defineTheme).toHaveBeenCalledWith(
      'apiforge-projection',
      expect.objectContaining({
        base: 'vs-dark',
        rules: expect.arrayContaining([{ token: 'string', foreground: 'ff8800' }]),
      }),
    );
    expect(setTheme).toHaveBeenCalledWith('apiforge-projection');
  });

  it('disposes the editor and model on unmount', () => {
    const { unmount } = render(
      <ColorStylePreview
        monacoTheme="vs-dark"
        colorStylePrefs={DEFAULT_COLOR_STYLE_PREFS}
        colorStyleCustomColors={{}}
      />,
    );

    unmount();

    expect(editor.dispose).toHaveBeenCalledTimes(1);
    expect(model.dispose).toHaveBeenCalledTimes(1);
  });
});
