import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyProjectState } from './EmptyProjectState';
import { useSpecStore } from '../../state/useSpecStore';
import { useAppStore } from '../../state/useAppStore';

const initialSpecState = useSpecStore.getState();
const initialAppState = useAppStore.getState();

beforeEach(() => {
  useSpecStore.setState(initialSpecState, true);
  useAppStore.setState(initialAppState, true);
});

describe('EmptyProjectState', () => {
  it('prompts with inline links, reading as one coherent sentence', () => {
    const { container } = render(<EmptyProjectState />);
    expect(screen.getByText('No API document loaded')).toBeInTheDocument();
    expect(container.querySelector('[class*="subtitle"]')!.textContent).toBe(
      'This project is empty. Create a new project, import an OpenAPI document (JSON or YAML), or load a sample project to explore the interface.',
    );
  });

  it('"Create a new project" starts a blank, named project', async () => {
    const user = userEvent.setup();
    render(<EmptyProjectState />);

    await user.click(screen.getByRole('button', { name: 'Create a new project' }));

    expect(useSpecStore.getState().hasDocument).toBe(true);
    expect(useAppStore.getState().projectNamePromptOpen).toBe(true);
    expect(useAppStore.getState().projectNamePromptDefault).toBe('Untitled API');
  });

  it('"load a sample project" loads the sample and starts a named project', async () => {
    const user = userEvent.setup();
    render(<EmptyProjectState />);

    expect(useSpecStore.getState().hasDocument).toBe(false);
    await user.click(screen.getByRole('button', { name: 'load a sample project' }));

    const spec = useSpecStore.getState();
    expect(spec.hasDocument).toBe(true);
    expect(spec.endpoints.length).toBeGreaterThan(0);

    const app = useAppStore.getState();
    expect(app.currentProjectId).not.toBeNull();
    expect(app.projectNamePromptOpen).toBe(true);
    expect(app.projectNamePromptDefault).toBe('Sample Project');
  });

  it('"import an OpenAPI document" opens the file picker (no XML in the accepted types)', async () => {
    const user = userEvent.setup();
    const { container } = render(<EmptyProjectState />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.accept).not.toContain('xml');

    // Clicking the link forwards the click to the hidden file input.
    const clickSpy = vi.spyOn(input, 'click');
    await user.click(screen.getByRole('button', { name: 'import an OpenAPI document' }));
    expect(clickSpy).toHaveBeenCalled();
  });
});
