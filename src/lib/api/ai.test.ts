import { aiComplete, fetchAiStatus } from './ai';
import { apiGet, apiPost } from './client';

vi.mock('./client', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiUrl: vi.fn((path: string) => `http://api.test${path}`),
}));

describe('ai API wrappers', () => {
  it('aiComplete calls POST /ai/complete with the request body', () => {
    aiComplete({ system: 'sys', prompt: 'do the thing', max_tokens: 200 });
    expect(apiPost).toHaveBeenCalledWith('/ai/complete', { system: 'sys', prompt: 'do the thing', max_tokens: 200 });
  });

  it('fetchAiStatus calls GET /ai/status', () => {
    fetchAiStatus();
    expect(apiGet).toHaveBeenCalledWith('/ai/status');
  });
});
