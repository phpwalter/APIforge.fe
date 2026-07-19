import {
  deleteWorkspace,
  generateWorkspaceId,
  getWorkspace,
  listWorkspaces,
  saveWorkspace,
  type WorkspaceEntry,
} from './workspaces';

beforeEach(() => {
  localStorage.clear();
});

function entry(overrides: Partial<WorkspaceEntry> = {}): WorkspaceEntry {
  return { id: 'a', name: 'Workspace A', savedAt: 1000, specJson: '{}', ...overrides };
}

describe('workspaces', () => {
  it('lists nothing when none are saved', () => {
    expect(listWorkspaces()).toEqual([]);
  });

  it('saveWorkspace persists an entry retrievable by id', () => {
    saveWorkspace(entry());
    expect(getWorkspace('a')).toEqual(entry());
  });

  it('listWorkspaces omits specJson and sorts most-recently-saved first', () => {
    saveWorkspace(entry({ id: 'a', savedAt: 1000 }));
    saveWorkspace(entry({ id: 'b', name: 'Workspace B', savedAt: 2000 }));

    expect(listWorkspaces()).toEqual([
      { id: 'b', name: 'Workspace B', savedAt: 2000 },
      { id: 'a', name: 'Workspace A', savedAt: 1000 },
    ]);
  });

  it('saving again with the same id updates the entry in place instead of duplicating it', () => {
    saveWorkspace(entry({ id: 'a', name: 'First name', savedAt: 1000 }));
    saveWorkspace(entry({ id: 'a', name: 'Renamed', savedAt: 2000 }));

    expect(listWorkspaces()).toEqual([{ id: 'a', name: 'Renamed', savedAt: 2000 }]);
  });

  it('caps the list at 10, dropping the oldest', () => {
    for (let i = 0; i < 11; i++) {
      saveWorkspace(entry({ id: `w${i}`, savedAt: i }));
    }
    const all = listWorkspaces();
    expect(all).toHaveLength(10);
    expect(all.find((w) => w.id === 'w0')).toBeUndefined(); // oldest (savedAt: 0) dropped
    expect(all.find((w) => w.id === 'w10')).toBeDefined();
  });

  it('deleteWorkspace removes just that entry', () => {
    saveWorkspace(entry({ id: 'a' }));
    saveWorkspace(entry({ id: 'b', name: 'Workspace B' }));

    deleteWorkspace('a');

    expect(getWorkspace('a')).toBeUndefined();
    expect(getWorkspace('b')).toBeDefined();
  });

  it('falls back to an empty list when stored JSON is malformed', () => {
    localStorage.setItem('apiforge_recent_workspaces', 'not json');
    expect(listWorkspaces()).toEqual([]);
  });

  it('generateWorkspaceId returns distinct ids', () => {
    const a = generateWorkspaceId();
    const b = generateWorkspaceId();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(0);
  });
});
