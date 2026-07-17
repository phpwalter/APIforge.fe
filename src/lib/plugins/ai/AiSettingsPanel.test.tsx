import { render, screen, waitFor } from '@testing-library/react';
import { AiSettingsPanel } from './AiSettingsPanel';
import { fetchAiStatus } from '../../api/ai';

vi.mock('../../api/ai', () => ({
  fetchAiStatus: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(fetchAiStatus).mockReset();
});

describe('AiSettingsPanel', () => {
  it('shows a loading state before the status check resolves', () => {
    vi.mocked(fetchAiStatus).mockReturnValue(new Promise(() => {})); // never resolves
    render(<AiSettingsPanel />);
    expect(screen.getByText('Checking connection…')).toBeInTheDocument();
  });

  it('shows Connected with the model name when available', async () => {
    vi.mocked(fetchAiStatus).mockResolvedValue({ available: true, model: 'claude-sonnet' });
    render(<AiSettingsPanel />);
    await waitFor(() => expect(screen.getByText('Connected · claude-sonnet')).toBeInTheDocument());
  });

  it('shows an unavailable message when the backend reports it is not configured', async () => {
    vi.mocked(fetchAiStatus).mockResolvedValue({ available: false });
    render(<AiSettingsPanel />);
    await waitFor(() => expect(screen.getByText("AI isn't available on this deployment yet.")).toBeInTheDocument());
  });

  it('treats a failed status request the same as unavailable, rather than an error state', async () => {
    vi.mocked(fetchAiStatus).mockRejectedValue(new Error('network error'));
    render(<AiSettingsPanel />);
    await waitFor(() => expect(screen.getByText("AI isn't available on this deployment yet.")).toBeInTheDocument());
  });
});
