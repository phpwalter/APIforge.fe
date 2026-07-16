import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { forwardRef, useImperativeHandle, type Ref, type RefObject } from 'react';
import { RestProjectionCanvas } from './RestProjectionCanvas';
import { useAppStore } from '../../state/useAppStore';
import { useSpecStore } from '../../state/useSpecStore';

vi.mock('../../lib/api/securityTypes', () => ({
  fetchSecurityTypes: vi.fn(() => Promise.resolve([])),
}));

// Spy the outline panel's jump-to-line calls land on — asserted separately from the mocked
// editor's own DOM, since revealLine has no visible effect on a plain textarea stand-in.
const revealLineSpy = vi.fn();

// The real ProjectionMonacoEditor needs a browser Monaco can run in — not available under jsdom.
// This stand-in mirrors its actual contract (a controlled textarea, the same "don't commit
// when blurring back into our own toolbar" boundary check, and the revealLine ref handle) so the
// parent's wiring is still exercised meaningfully. ProjectionMonacoEditor's own Monaco-specific
// behavior is covered separately in ProjectionMonacoEditor.test.tsx with mocked monaco-editor/monaco-yaml.
vi.mock('./ProjectionMonacoEditor', () => ({
  ProjectionMonacoEditor: forwardRef(
    (
      {
        value,
        format,
        wrapRef,
        onChange,
        onCommit,
      }: {
        value: string;
        format: string;
        wrapRef: RefObject<HTMLDivElement | null>;
        onChange: (value: string) => void;
        onCommit: (value: string) => void;
      },
      ref: Ref<{ revealLine: (line: number) => void }>,
    ) => {
      useImperativeHandle(ref, () => ({ revealLine: revealLineSpy }), []);
      return (
        <textarea
          aria-label={`REST Projection document (${format.toUpperCase()})`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => {
            const next = e.relatedTarget as Node | null;
            if (next && wrapRef.current?.contains(next)) return;
            onCommit(e.target.value);
          }}
        />
      );
    },
  ),
}));

const initialAppState = useAppStore.getState();
const initialSpecState = useSpecStore.getState();

beforeEach(() => {
  useAppStore.setState(initialAppState, true);
  useSpecStore.setState(initialSpecState, true);
  useSpecStore.getState().loadSampleProject();
  revealLineSpy.mockClear();
});

describe('RestProjectionCanvas', () => {
  it('renders the generated YAML by default, with the filename and "generated" badge', async () => {
    render(<RestProjectionCanvas />);

    expect(screen.getByText('openapi.yaml')).toBeInTheDocument();
    expect(screen.getByText('generated')).toBeInTheDocument();
    await waitFor(() => {
      const textarea = screen.getByLabelText('REST Projection document (YAML)') as HTMLTextAreaElement;
      expect(textarea.value).toContain('openapi:');
    });
  });

  it('switches format and regenerates the content for JSON', async () => {
    const user = userEvent.setup();
    render(<RestProjectionCanvas />);

    await user.click(screen.getByRole('button', { name: 'JSON' }));
    expect(screen.getByText('openapi.json')).toBeInTheDocument();
    const jsonArea = screen.getByLabelText('REST Projection document (JSON)') as HTMLTextAreaElement;
    expect(jsonArea.value).toContain('"openapi"');
  });

  it('only offers YAML and JSON in the format switcher', () => {
    render(<RestProjectionCanvas />);

    expect(screen.getByRole('button', { name: 'YAML' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'JSON' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'XML' })).not.toBeInTheDocument();
  });

  it('toggles x-apiforge metadata visibility', async () => {
    const user = userEvent.setup();
    render(<RestProjectionCanvas />);

    const toggle = screen.getByRole('button', { name: /x-apiforge/ });
    expect(toggle).toHaveAttribute('data-active', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('data-active', 'true');
    expect(useAppStore.getState().restProjectionShowMeta).toBe(true);
  });

  it('turns syntax highlighting off and on via the toolbar button, available on every format including YAML', async () => {
    const user = userEvent.setup();
    render(<RestProjectionCanvas />);

    // Present on YAML too — ProjectionMonacoEditor.test.tsx covers the Monaco-side wiring.
    expect(useAppStore.getState().restProjectionHighlighting.yaml).toBe(true);
    const offToggle = screen.getByRole('button', { name: 'Turn off syntax highlighting' });
    expect(offToggle).toHaveAttribute('data-active', 'true');

    await user.click(offToggle);
    expect(useAppStore.getState().restProjectionHighlighting.yaml).toBe(false);
    const onToggle = screen.getByRole('button', { name: 'Turn on syntax highlighting' });
    expect(onToggle).toHaveAttribute('data-active', 'false');

    await user.click(onToggle);
    expect(useAppStore.getState().restProjectionHighlighting.yaml).toBe(true);
  });

  it('keeps syntax highlighting and line numbers independent per format — toggling one tab does not affect the other', async () => {
    const user = userEvent.setup();
    render(<RestProjectionCanvas />);

    // Turn off highlighting for YAML only.
    await user.click(screen.getByRole('button', { name: 'Turn off syntax highlighting' }));
    expect(useAppStore.getState().restProjectionHighlighting).toEqual({ yaml: false, json: true });

    // JSON still shows its own toggle as on.
    await user.click(screen.getByRole('button', { name: 'JSON' }));
    expect(screen.getByRole('button', { name: 'Turn off syntax highlighting' })).toHaveAttribute('data-active', 'true');

    // Turn off line numbers for JSON only.
    await user.click(screen.getByRole('button', { name: 'Hide line numbers' }));
    expect(useAppStore.getState().restProjectionLineNumbers).toEqual({ yaml: true, json: false });

    // YAML's line numbers and highlighting toggles are unaffected by the JSON-only changes above.
    await user.click(screen.getByRole('button', { name: 'YAML' }));
    expect(screen.getByRole('button', { name: 'Hide line numbers' })).toHaveAttribute('data-active', 'true');
    expect(screen.getByRole('button', { name: 'Turn on syntax highlighting' })).toHaveAttribute('data-active', 'false');
  });

  it('toggles line numbers via the toolbar button, independently per format', async () => {
    const user = userEvent.setup();
    render(<RestProjectionCanvas />);

    expect(screen.getByRole('button', { name: 'Hide line numbers' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'JSON' }));

    expect(useAppStore.getState().restProjectionLineNumbers.json).toBe(true);
    const hideToggle = screen.getByRole('button', { name: 'Hide line numbers' });
    expect(hideToggle).toHaveAttribute('data-active', 'true');

    await user.click(hideToggle);
    expect(useAppStore.getState().restProjectionLineNumbers.json).toBe(false);
    expect(screen.getByRole('button', { name: 'Show line numbers' })).toHaveAttribute('data-active', 'false');
  });

  it('copies the current document to the clipboard and briefly shows a "copied" state', async () => {
    // userEvent.setup() installs its own Clipboard stub on navigator.clipboard, replacing
    // anything defined beforehand — spy on the stub it installs rather than swapping it out.
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    render(<RestProjectionCanvas />);

    await user.click(screen.getByRole('button', { name: 'Copy to clipboard' }));

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toContain('openapi:');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
    });
  });

  it('applies the File Encoding line-ending preference to what gets copied', async () => {
    useAppStore.getState().setFileEncodingLineEnding('crlf');
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    render(<RestProjectionCanvas />);

    await user.click(screen.getByRole('button', { name: 'Copy to clipboard' }));

    const copied = writeText.mock.calls[0][0];
    expect(copied).toContain('\r\n');
    expect(copied).not.toMatch(/[^\r]\n/);
  });

  it('generates JSON with the Formatting indent size and style preferences', async () => {
    useAppStore.getState().setFormattingIndentSize(4);
    const user = userEvent.setup();
    render(<RestProjectionCanvas />);

    await user.click(screen.getByRole('button', { name: 'JSON' }));

    const jsonArea = screen.getByLabelText('REST Projection document (JSON)') as HTMLTextAreaElement;
    expect(jsonArea.value).toContain('\n    "openapi"');
  });

  it('generates YAML with 2-space indentation even when Indent Style is Tabs, since tab indentation is invalid YAML', async () => {
    useAppStore.getState().setFormattingIndentStyle('tabs');
    render(<RestProjectionCanvas />);

    const yamlArea = screen.getByLabelText('REST Projection document (YAML)') as HTMLTextAreaElement;
    await waitFor(() => {
      expect(yamlArea.value).not.toContain('\t');
    });
  });

  it('commits a pending edit when the panel unmounts (e.g. switching to a different canvas tab), even though no blur ever fires', async () => {
    const { unmount } = render(<RestProjectionCanvas />);
    const textarea = screen.getByLabelText('REST Projection document (YAML)') as HTMLTextAreaElement;

    const edited = 'openapi: 3.1.0\ninfo:\n  title: Unmount Commit\n  version: 3.3.3\npaths:\n  /ping:\n    get:\n      summary: Ping\n      responses:\n        \'200\':\n          description: OK\n';
    fireEvent.change(textarea, { target: { value: edited } });
    expect(screen.getByText('edited')).toBeInTheDocument();

    unmount();

    await waitFor(() => {
      expect(useAppStore.getState().apiTitle).toBe('Unmount Commit');
    });
    expect(useSpecStore.getState().endpoints.map((e) => e.path)).toEqual(['/ping']);
    expect(useAppStore.getState().restProjectionManual).toEqual({ yaml: null, json: null });
  });

  it('commits a valid edit back into the spec store on blur, and clears the "edited" state', async () => {
    render(<RestProjectionCanvas />);
    const textarea = screen.getByLabelText('REST Projection document (YAML)') as HTMLTextAreaElement;

    const edited = 'openapi: 3.1.0\ninfo:\n  title: Renamed API\n  version: 9.9.9\npaths:\n  /ping:\n    get:\n      summary: Ping\n      responses:\n        \'200\':\n          description: OK\n';
    fireEvent.change(textarea, { target: { value: edited } });
    expect(screen.getByText('edited')).toBeInTheDocument();

    fireEvent.blur(textarea);

    await waitFor(() => {
      expect(useAppStore.getState().apiTitle).toBe('Renamed API');
    });
    expect(useSpecStore.getState().endpoints.map((e) => e.path)).toEqual(['/ping']);
    expect(screen.getByText('generated')).toBeInTheDocument();
    expect(screen.getByText('Synced with canvas')).toBeInTheDocument();
  });

  it('surfaces a parse error on blur for invalid input and keeps the edit', async () => {
    render(<RestProjectionCanvas />);
    const textarea = screen.getByLabelText('REST Projection document (YAML)') as HTMLTextAreaElement;

    fireEvent.change(textarea, { target: { value: 'not: [valid' } });
    fireEvent.blur(textarea);

    await waitFor(() => {
      expect(useAppStore.getState().restProjectionError).toBeTruthy();
    });
    expect(screen.getByText('edited')).toBeInTheDocument();
    expect(textarea.value).toBe('not: [valid');
  });

  it('switching format tabs mid-edit does not commit the pending edit or leak it into the other format', async () => {
    const user = userEvent.setup();
    render(<RestProjectionCanvas />);
    const yamlArea = screen.getByLabelText('REST Projection document (YAML)') as HTMLTextAreaElement;

    fireEvent.change(yamlArea, { target: { value: 'scratch: text' } });
    expect(screen.getByText('edited')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'JSON' }));

    // The switch itself must not have committed the YAML edit into the canvas model.
    expect(useAppStore.getState().apiTitle).not.toBe('scratch');
    expect(useAppStore.getState().restProjectionError).toBeNull();
    const jsonArea = screen.getByLabelText('REST Projection document (JSON)') as HTMLTextAreaElement;
    expect(jsonArea.value).not.toContain('scratch');
    expect(screen.getByText('generated')).toBeInTheDocument();

    // Switching back to YAML shows the untouched pending edit, still uncommitted.
    await user.click(screen.getByRole('button', { name: 'YAML' }));
    expect(screen.getByLabelText('REST Projection document (YAML)')).toHaveValue('scratch: text');
    expect(screen.getByText('edited')).toBeInTheDocument();
  });

  it('renders the document outline panel with real spec data, and clicking a leaf reveals it in the editor', async () => {
    const user = userEvent.setup();
    render(<RestProjectionCanvas />);

    expect(screen.getByText('OpenAPI')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'General' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tags' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Paths' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Components' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Tags' }));
    const usersTag = await screen.findByRole('button', { name: 'Users' });
    await user.click(usersTag);

    expect(revealLineSpy).toHaveBeenCalledTimes(1);
    expect(revealLineSpy.mock.calls[0][0]).toEqual(expect.any(Number));
  });
});
