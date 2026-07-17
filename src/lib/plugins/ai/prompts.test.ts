import { buildGeneratePrompt } from './prompts';

describe('buildGeneratePrompt', () => {
  it('builds an operationSummary prompt with method/path hints', () => {
    const { prompt } = buildGeneratePrompt({
      slot: 'operationSummary',
      value: '',
      hints: { method: 'GET', path: '/users/{id}' },
    });
    expect(prompt).toContain('GET');
    expect(prompt).toContain('/users/{id}');
    expect(prompt).toContain('no existing text');
  });

  it('includes the existing value verbatim when present', () => {
    const { prompt } = buildGeneratePrompt({
      slot: 'requestBodyDescription',
      value: 'A partial draft',
      hints: { method: 'POST', path: '/users' },
    });
    expect(prompt).toContain('A partial draft');
  });

  it('builds a responseDescription prompt including the status code hint', () => {
    const { prompt } = buildGeneratePrompt({
      slot: 'responseDescription',
      value: '',
      hints: { method: 'GET', path: '/users', statusCode: '404' },
    });
    expect(prompt).toContain('404');
  });

  it('builds a schemaDescription prompt including the schema name hint', () => {
    const { prompt } = buildGeneratePrompt({
      slot: 'schemaDescription',
      value: '',
      hints: { schemaName: 'User' },
    });
    expect(prompt).toContain('User');
  });

  it('shares the same system prompt across all slots', () => {
    const a = buildGeneratePrompt({ slot: 'operationSummary', value: '', hints: {} });
    const b = buildGeneratePrompt({ slot: 'schemaDescription', value: '', hints: {} });
    expect(a.system).toBe(b.system);
  });
});
