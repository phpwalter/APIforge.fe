import { computeHasSavableContent, hasSavableContent } from './projectEligibility';
import { useAppStore } from '../state/useAppStore';
import { useSpecStore } from '../state/useSpecStore';

const initialAppState = useAppStore.getState();
const initialSpecState = useSpecStore.getState();

beforeEach(() => {
  useAppStore.setState(initialAppState, true);
  useSpecStore.setState(initialSpecState, true);
});

describe('computeHasSavableContent', () => {
  it('is false with no name at all', () => {
    expect(computeHasSavableContent(null, 1, 0)).toBe(false);
  });

  it('is false for any name starting with "Untitled"', () => {
    expect(computeHasSavableContent('Untitled Project', 1, 0)).toBe(false);
    expect(computeHasSavableContent('Untitled API', 1, 0)).toBe(false);
    expect(computeHasSavableContent('UntitledThing', 1, 0)).toBe(false);
  });

  it('is false with a real name but zero endpoints and zero schemas', () => {
    expect(computeHasSavableContent('My API', 0, 0)).toBe(false);
  });

  it('is true with a real name and at least one endpoint', () => {
    expect(computeHasSavableContent('My API', 1, 0)).toBe(true);
  });

  it('is true with a real name and at least one schema', () => {
    expect(computeHasSavableContent('My API', 0, 1)).toBe(true);
  });
});

describe('hasSavableContent', () => {
  it('reads live store state', () => {
    expect(hasSavableContent()).toBe(false);

    useSpecStore.getState().loadSampleProject();
    useAppStore.setState({ currentProjectName: 'My API' });

    expect(hasSavableContent()).toBe(true);
  });
});
