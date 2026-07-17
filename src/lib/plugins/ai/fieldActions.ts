import { Wand2 } from 'lucide-react';
import type { FieldSlot, PluginFieldAction } from '../types';
import { aiComplete } from '../../api/ai';
import { buildGeneratePrompt } from './prompts';

const generateAction: PluginFieldAction = {
  id: 'ai-generate',
  icon: Wand2,
  label: 'Generate with AI',
  run: async (context) => {
    const { system, prompt } = buildGeneratePrompt(context);
    const { text } = await aiComplete({ system, prompt, max_tokens: 200 });
    return text.trim();
  },
};

export const AI_FIELD_ACTIONS: Partial<Record<FieldSlot, PluginFieldAction[]>> = {
  operationSummary: [generateAction],
  requestBodyDescription: [generateAction],
  responseDescription: [generateAction],
  schemaDescription: [generateAction],
};
