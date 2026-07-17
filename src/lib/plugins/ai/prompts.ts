import type { FieldActionContext } from '../types';

const SYSTEM_PROMPT = 'You write concise, professional OpenAPI documentation text. Reply with only the text itself — no quotes, no preamble.';

/** Builds the { system, prompt } pair aiComplete needs — one per field slot, all sharing the same voice. */
export function buildGeneratePrompt({ slot, value, hints }: FieldActionContext): { system: string; prompt: string } {
  const existing = value.trim() ? `Existing text: "${value.trim()}"` : 'There is no existing text yet.';

  switch (slot) {
    case 'operationSummary':
      return {
        system: SYSTEM_PROMPT,
        prompt: `Write a one-line summary for this API operation.\nMethod: ${hints.method ?? '?'}\nPath: ${hints.path ?? '?'}\n${existing}`,
      };
    case 'requestBodyDescription':
      return {
        system: SYSTEM_PROMPT,
        prompt: `Write a one- or two-sentence description of the request body for this API operation.\nMethod: ${hints.method ?? '?'}\nPath: ${hints.path ?? '?'}\n${existing}`,
      };
    case 'responseDescription':
      return {
        system: SYSTEM_PROMPT,
        prompt: `Write a one-sentence description of this API response.\nMethod: ${hints.method ?? '?'}\nPath: ${hints.path ?? '?'}\nStatus code: ${hints.statusCode ?? '?'}\n${existing}`,
      };
    case 'schemaDescription':
      return {
        system: SYSTEM_PROMPT,
        prompt: `Write a one-sentence description of this schema.\nSchema name: ${hints.schemaName ?? '?'}\n${existing}`,
      };
  }
}
