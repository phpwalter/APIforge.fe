import { describe, expect, it } from 'vitest';
import {
  canonicalDocumentName,
  selectPrimaryDocument,
  type ServerDocument,
} from './projectServer';

function document(
  id: string,
  name: string,
  createdAt: string,
  deletedAt: string | null = null,
): ServerDocument {
  return {
    id,
    project_id: 'project-1',
    name,
    document: {},
    created_at: createdAt,
    updated_at: createdAt,
    deleted_at: deletedAt,
  };
}

describe('canonicalDocumentName', () => {
  it('uses the visible project name as the document name', () => {
    expect(canonicalDocumentName(' Customer Billing API ')).toBe('Customer Billing API');
  });

  it('uses the same fallback as the project UI', () => {
    expect(canonicalDocumentName('   ')).toBe('Untitled Project');
  });
});

describe('selectPrimaryDocument', () => {
  const older = document('doc-a', 'Legacy document', '2026-01-01T00:00:00Z');
  const named = document('doc-b', 'Customer Billing API', '2026-02-01T00:00:00Z');
  const newer = document('doc-c', 'Other', '2026-03-01T00:00:00Z');

  it('retains the previously selected canonical document', () => {
    expect(selectPrimaryDocument([older, named], 'Customer Billing API', older.id)?.id).toBe(older.id);
  });

  it('prefers an exact project-name match for an older multi-document project', () => {
    expect(selectPrimaryDocument([older, named, newer], 'Customer Billing API', null)?.id).toBe(named.id);
  });

  it('falls back deterministically to the oldest active document', () => {
    expect(selectPrimaryDocument([newer, older], 'No Match', null)?.id).toBe(older.id);
  });

  it('ignores soft-deleted documents', () => {
    const deleted = document('doc-deleted', 'Customer Billing API', '2025-01-01T00:00:00Z', '2026-01-01T00:00:00Z');
    expect(selectPrimaryDocument([deleted, older], 'Customer Billing API', null)?.id).toBe(older.id);
  });
});
