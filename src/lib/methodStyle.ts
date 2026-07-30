import { ArrowDownToLine, Plus, ArrowUpToLine, Pencil, Trash, SlidersHorizontal, Info, Search, Braces } from 'lucide-react';
import type { ComponentType } from 'react';
import type { HttpMethod } from '../types/spec';

const METHOD_COLORS: Partial<Record<HttpMethod, string>> = {
  GET: '#3b9c6e',
  POST: '#4a82d8',
  PUT: '#c79a3a',
  PATCH: '#c79a3a',
  DELETE: '#c75c5c',
};

export function methodColor(method: HttpMethod): string {
  return METHOD_COLORS[method] || '#7c7c8a';
}

const METHOD_ICONS: Partial<Record<HttpMethod, ComponentType<{ size?: number | string }>>> = {
  GET: ArrowDownToLine,
  POST: Plus,
  PUT: ArrowUpToLine,
  PATCH: Pencil,
  DELETE: Trash,
  OPTIONS: SlidersHorizontal,
  HEAD: Info,
  TRACE: Search,
};

export function methodIcon(method: HttpMethod): ComponentType<{ size?: number | string }> {
  return METHOD_ICONS[method] || Braces;
}

/** Method pill sort order used throughout the endpoints panel and tree editor. */
export const METHOD_PRIORITY: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'TRACE'];

const IDEMPOTENT_METHODS: HttpMethod[] = ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE', 'TRACE'];
const UNSAFE_METHODS: HttpMethod[] = ['POST', 'PUT', 'PATCH', 'DELETE'];
const BODY_METHODS: HttpMethod[] = ['POST', 'PUT', 'PATCH'];

export function isIdempotent(method: HttpMethod): boolean {
  return IDEMPOTENT_METHODS.includes(method);
}

export function isUnsafe(method: HttpMethod): boolean {
  return UNSAFE_METHODS.includes(method);
}

export function methodAllowsBody(method: HttpMethod): boolean {
  return BODY_METHODS.includes(method);
}