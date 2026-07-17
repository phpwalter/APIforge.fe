import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FieldActionSlot } from './FieldActionSlot';
import { useAppStore } from '../../state/useAppStore';
import { getFieldActions } from './registry';
import { Wand2 } from 'lucide-react';

// useAppStore (imported below) transitively pulls in ./registry via lib/pluginPrefs.ts for its
// default-enabled-plugins list, so the mock has to cover PLUGINS too, not just getFieldActions.
vi.mock('./registry', () => ({
  PLUGINS: [],
  getFieldActions: vi.fn(),
}));

const initialState = useAppStore.getState();

beforeEach(() => {
  useAppStore.setState(initialState, true);
  vi.mocked(getFieldActions).mockReset();
});

describe('FieldActionSlot', () => {
  it('renders nothing when no action is registered for the slot', () => {
    vi.mocked(getFieldActions).mockReturnValue([]);
    const { container } = render(
      <FieldActionSlot slot="operationSummary" value="" onChange={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('runs the action on click and calls onChange with its result', async () => {
    const user = userEvent.setup();
    const run = vi.fn().mockResolvedValue('Generated summary');
    vi.mocked(getFieldActions).mockReturnValue([{ id: 'ai-generate', icon: Wand2, label: 'Generate with AI', run }]);
    const onChange = vi.fn();

    render(
      <FieldActionSlot
        slot="operationSummary"
        value="draft"
        onChange={onChange}
        hints={{ method: 'GET', path: '/users' }}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Generate with AI' }));

    expect(run).toHaveBeenCalledWith({ slot: 'operationSummary', value: 'draft', hints: { method: 'GET', path: '/users' } });
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('Generated summary'));
  });

  it('shows an error state and surfaces the message as a tooltip when the action rejects, without calling onChange', async () => {
    const user = userEvent.setup();
    const run = vi.fn().mockRejectedValue(new Error('AI is not available on this deployment yet.'));
    vi.mocked(getFieldActions).mockReturnValue([{ id: 'ai-generate', icon: Wand2, label: 'Generate with AI', run }]);
    const onChange = vi.fn();

    render(<FieldActionSlot slot="operationSummary" value="" onChange={onChange} />);
    const button = screen.getByRole('button', { name: 'Generate with AI' });
    await user.click(button);

    await waitFor(() => expect(button).toHaveAttribute('data-state', 'error'));
    expect(button).toHaveAttribute('title', 'AI is not available on this deployment yet.');
    expect(onChange).not.toHaveBeenCalled();
  });
});
