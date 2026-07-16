import hljs from 'highlight.js/lib/core';
import yaml from 'highlight.js/lib/languages/yaml';
import json from 'highlight.js/lib/languages/json';
import xml from 'highlight.js/lib/languages/xml';
import type { RestProjectionFormat } from '../types/ui';

hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('json', json);
hljs.registerLanguage('xml', xml);

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Highlighted HTML (hljs `<span class="hljs-*">` markup) for the REST Projection code view.
 * Falls back to escaped plain text when highlighting is off, or if hljs can't tokenize the
 * current (possibly mid-edit, invalid) text.
 */
export function highlightCode(text: string, format: RestProjectionFormat, highlighting: boolean): string {
  if (!highlighting) return escapeHtml(text);
  try {
    return hljs.highlight(text, { language: format }).value;
  } catch {
    return escapeHtml(text);
  }
}
