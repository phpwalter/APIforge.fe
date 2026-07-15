import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RestProjectionCanvas } from './RestProjectionCanvas';
import { useAppStore } from '../../state/useAppStore';
import { useSpecStore } from '../../state/useSpecStore';

vi.mock('../../lib/api/securityTypes', () => ({
  fetchSecurityTypes: vi.fn(() => Promise.resolve([])),
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

  it('Regenerate discards a pending edit and restores the live-generated doc', async () => {
    const user = userEvent.setup();
    render(<RestProjectionCanvas />);
    const textarea = screen.getByLabelText('REST Projection document (YAML)') as HTMLTextAreaElement;

    fireEvent.change(textarea, { target: { value: 'scratch text' } });
    expect(screen.getByText('edited')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Regenerate' }));

    expect(screen.getByText('generated')).toBeInTheDocument();
    expect(textarea.value).not.toBe('scratch text');
  });
});
