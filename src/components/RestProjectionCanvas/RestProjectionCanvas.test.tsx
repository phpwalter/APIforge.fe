import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RefObject } from 'react';
import { RestProjectionCanvas } from './RestProjectionCanvas';
import { useAppStore } from '../../state/useAppStore';
import { useSpecStore } from '../../state/useSpecStore';

vi.mock('../../lib/api/securityTypes', () => ({
  fetchSecurityTypes: vi.fn(() => Promise.resolve([])),
}));

// The real YamlMonacoEditor needs a browser Monaco can run in — not available under jsdom.
// This stand-in mirrors its actual contract (a controlled textarea, and the same "don't commit
// when blurring back into our own toolbar" boundary check) so the parent's wiring is still
// exercised meaningfully. YamlMonacoEditor's own Monaco-specific behavior is covered separately
// in YamlMonacoEditor.test.tsx with mocked monaco-editor/monaco-yaml.
vi.mock('./YamlMonacoEditor', () => ({
  YamlMonacoEditor: ({
    value,
    wrapRef,
    onChange,
    onCommit,
  }: {
    value: string;
    wrapRef: RefObject<HTMLDivElement | null>;
    onChange: (value: string) => void;
    onCommit: (value: string) => void;
  }) => (
    <textarea
      aria-label="REST Projection document (YAML)"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => {
        const next = e.relatedTarget as Node | null;
        if (next && wrapRef.current?.contains(next)) return;
        onCommit(e.target.value);
      }}
    />
  ),
}));

const initialAppState = useAppStore.getState();
const initialSpecState = useSpecStore.getState();

beforeEach(() => {
  useAppStore.setState(initialAppState, true);
  useSpecStore.setState(initialSpecState, true);
  useSpecStore.getState().loadSampleProject();
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

  it('switches format and regenerates the content for JSON and XML', async () => {
    const user = userEvent.setup();
    render(<RestProjectionCanvas />);

    await user.click(screen.getByRole('button', { name: 'JSON' }));
    expect(screen.getByText('openapi.json')).toBeInTheDocument();
    const jsonArea = screen.getByLabelText('REST Projection document (JSON)') as HTMLTextAreaElement;
    expect(jsonArea.value).toContain('"openapi"');

    await user.click(screen.getByRole('button', { name: 'XML' }));
    expect(screen.getByText('openapi.xml')).toBeInTheDocument();
    const xmlArea = screen.getByLabelText('REST Projection document (XML)') as HTMLTextAreaElement;
    expect(xmlArea.value).toContain('<openapi>');
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

  it('turns syntax highlighting off and on via the toolbar button (JSON/XML only — YAML has its own Monaco highlighting)', async () => {
    const user = userEvent.setup();
    render(<RestProjectionCanvas />);

    // The toggle only applies to the JSON/XML textarea+highlight.js view.
    expect(screen.queryByTitle('Turn off syntax highlighting')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'JSON' }));

    expect(useAppStore.getState().highlightingEnabled).toBe(true);
    const offToggle = screen.getByRole('button', { name: 'Turn off syntax highlighting' });
    expect(offToggle).toHaveAttribute('data-active', 'true');

    await user.click(offToggle);
    expect(useAppStore.getState().highlightingEnabled).toBe(false);
    const onToggle = screen.getByRole('button', { name: 'Turn on syntax highlighting' });
    expect(onToggle).toHaveAttribute('data-active', 'false');

    await user.click(onToggle);
    expect(useAppStore.getState().highlightingEnabled).toBe(true);
  });

  it('shows a line-number gutter by default for JSON/XML, toggleable via the toolbar button (not shown for YAML)', async () => {
    const user = userEvent.setup();
    render(<RestProjectionCanvas />);

    expect(screen.queryByTitle('Hide line numbers')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'JSON' }));

    expect(useAppStore.getState().restProjectionLineNumbers).toBe(true);
    const hideToggle = screen.getByRole('button', { name: 'Hide line numbers' });
    expect(hideToggle).toHaveAttribute('data-active', 'true');
    expect(screen.getByText('1')).toBeInTheDocument();

    await user.click(hideToggle);
    expect(useAppStore.getState().restProjectionLineNumbers).toBe(false);
    expect(screen.getByRole('button', { name: 'Show line numbers' })).toHaveAttribute('data-active', 'false');
    expect(screen.queryByText('1')).not.toBeInTheDocument();
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
    expect(useAppStore.getState().restProjectionManual).toEqual({ yaml: null, json: null, xml: null });
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

  it('switching format tabs mid-edit does not commit the pending edit or leak it into the other formats', async () => {
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
    expect(yamlArea.value).toBe('scratch: text');
    expect(screen.getByText('edited')).toBeInTheDocument();
  });

});
