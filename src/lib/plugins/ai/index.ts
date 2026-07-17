import { Sparkles } from 'lucide-react';
import type { Plugin } from '../types';
import { AI_FIELD_ACTIONS } from './fieldActions';
import { AiSettingsPanel } from './AiSettingsPanel';

export const AI_PLUGIN: Plugin = {
  id: 'ai',
  label: 'AI',
  icon: Sparkles,
  description: 'Generate operation summaries, request/response descriptions, and schema descriptions.',
  author: 'APIforge',
  version: 'Built-in',
  fieldActions: AI_FIELD_ACTIONS,
  settingsPanel: AiSettingsPanel,
};
