import {
  deleteProject,
  generateProjectId,
  getProject,
  listProjects,
  saveProject,
  type ProjectEntry,
} from './projects';

beforeEach(() => {
  localStorage.clear();
});

function entry(overrides: Partial<ProjectEntry> = {}): ProjectEntry {
  return { id: 'a', name: 'Project A', savedAt: 1000, specJson: '{}', ...overrides };
}

describe('projects', () => {
  it('lists nothing when none are saved', () => {
    expect(listProjects()).toEqual([]);
  });

  it('saveProject persists an entry retrievable by id', () => {
    saveProject(entry());
    expect(getProject('a')).toEqual(entry());
  });

  it('listProjects omits specJson and sorts most-recently-saved first', () => {
    saveProject(entry({ id: 'a', savedAt: 1000 }));
    saveProject(entry({ id: 'b', name: 'Project B', savedAt: 2000 }));

    expect(listProjects()).toEqual([
      { id: 'b', name: 'Project B', savedAt: 2000 },
      { id: 'a', name: 'Project A', savedAt: 1000 },
    ]);
  });

  it('saving again with the same id updates the entry in place instead of duplicating it', () => {
    saveProject(entry({ id: 'a', name: 'First name', savedAt: 1000 }));
    saveProject(entry({ id: 'a', name: 'Renamed', savedAt: 2000 }));

    expect(listProjects()).toEqual([{ id: 'a', name: 'Renamed', savedAt: 2000 }]);
  });

  it('caps the list at 5, dropping the oldest — nothing beyond that is ever stored', () => {
    for (let i = 0; i < 6; i++) {
      saveProject(entry({ id: `w${i}`, savedAt: i }));
    }
    const all = listProjects();
    expect(all).toHaveLength(5);
    expect(all.find((w) => w.id === 'w0')).toBeUndefined(); // oldest (savedAt: 0) dropped
    expect(all.find((w) => w.id === 'w5')).toBeDefined();
  });

  it('deleteProject removes just that entry', () => {
    saveProject(entry({ id: 'a' }));
    saveProject(entry({ id: 'b', name: 'Project B' }));

    deleteProject('a');

    expect(getProject('a')).toBeUndefined();
    expect(getProject('b')).toBeDefined();
  });

  it('falls back to an empty list when stored JSON is malformed', () => {
    localStorage.setItem('apiforge_recent_projects', 'not json');
    expect(listProjects()).toEqual([]);
  });

  it('generateProjectId returns distinct ids', () => {
    const a = generateProjectId();
    const b = generateProjectId();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(0);
  });

  it('migrates entries saved under the pre-rename ("Workspace") key the first time it reads', () => {
    localStorage.setItem('apiforge_recent_workspaces', JSON.stringify([entry({ id: 'legacy' })]));

    expect(listProjects()).toEqual([{ id: 'legacy', name: 'Project A', savedAt: 1000 }]);
    // The migration itself persisted the data onto the new key, not just returned it in memory.
    expect(JSON.parse(localStorage.getItem('apiforge_recent_projects')!)).toEqual([entry({ id: 'legacy' })]);
  });

  it('migrates the legacy entries once, then saving alongside them merges rather than replacing', () => {
    localStorage.setItem('apiforge_recent_workspaces', JSON.stringify([entry({ id: 'legacy' })]));
    saveProject(entry({ id: 'current', savedAt: 2000 }));

    expect(listProjects()).toEqual([
      { id: 'current', name: 'Project A', savedAt: 2000 },
      { id: 'legacy', name: 'Project A', savedAt: 1000 },
    ]);
  });

  it('does not re-read the legacy key once the new key has been written at all', () => {
    saveProject(entry({ id: 'current' }));
    localStorage.setItem('apiforge_recent_workspaces', JSON.stringify([entry({ id: 'legacy' })]));

    expect(listProjects()).toEqual([{ id: 'current', name: 'Project A', savedAt: 1000 }]);
  });

  it('caps legacy entries at 5 during migration too, keeping the most recent', () => {
    const legacyEntries = Array.from({ length: 7 }, (_, i) => entry({ id: `legacy${i}`, savedAt: i }));
    localStorage.setItem('apiforge_recent_workspaces', JSON.stringify(legacyEntries));

    const all = listProjects();

    expect(all).toHaveLength(5);
    expect(all.find((w) => w.id === 'legacy6')).toBeDefined(); // most recent (savedAt: 6) kept
    expect(all.find((w) => w.id === 'legacy0')).toBeUndefined(); // oldest dropped
    expect(all.find((w) => w.id === 'legacy1')).toBeUndefined();
  });
});
