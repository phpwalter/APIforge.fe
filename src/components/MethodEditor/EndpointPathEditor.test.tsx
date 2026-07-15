import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EndpointPathEditor } from './EndpointPathEditor';
import { useSpecStore } from '../../state/useSpecStore';

const initialSpecState = useSpecStore.getState();

beforeEach(() => {
  useSpecStore.setState(initialSpecState, true);
});

// Mirrors how DesignCanvas re-renders with the endpoint's fresh path after a store-driven rename.
function Harness({ id }: { id: string }) {
  const endpoints = useSpecStore((s) => s.endpoints);
  const endpoint = endpoints.find((e) => e.id === id)!;
  return <EndpointPathEditor path={endpoint.path} />;
}

describe('EndpointPathEditor — root-level path', () => {
  it('locks the leading slash as inert text and only exposes the rest as editable', () => {
    useSpecStore.getState().pickMethod('/users', 'GET');
    const id = useSpecStore.getState().endpoints[0].id;
    render(<Harness id={id} />);
    expect(screen.getByText('/')).toBeInTheDocument();
    expect(screen.getByDisplayValue('users')).toBeInTheDocument();
  });

  it('renames the path and every method sharing it on commit', async () => {
    useSpecStore.getState().pickMethod('/users', 'GET');
    useSpecStore.getState().pickMethod('/users', 'POST');
    const id = useSpecStore.getState().endpoints[0].id;
    const user = userEvent.setup();
    render(<Harness id={id} />);

    const input = screen.getByDisplayValue('users');
    await user.clear(input);
    await user.type(input, 'accounts');
    await user.tab();

    const paths = useSpecStore.getState().endpoints.map((e) => e.path);
    expect(paths).toEqual(['/accounts', '/accounts']);
  });

  it('shows a Duplicate path badge as a warning, matching format-valid commits regardless', async () => {
    useSpecStore.getState().pickMethod('/users', 'GET');
    useSpecStore.getState().pickMethod('/posts', 'GET');
    const id = useSpecStore.getState().endpoints[0].id;
    const user = userEvent.setup();
    render(<Harness id={id} />);

    const input = screen.getByDisplayValue('users');
    await user.clear(input);
    await user.type(input, 'posts');
    expect(screen.getByText('Duplicate path')).toBeInTheDocument();

    await user.tab();
    const paths = useSpecStore.getState().endpoints.map((e) => e.path);
    expect(paths).toEqual(['/posts', '/posts']);
  });

  it('reverts to the committed path on Escape without renaming', async () => {
    useSpecStore.getState().pickMethod('/users', 'GET');
    const id = useSpecStore.getState().endpoints[0].id;
    const user = userEvent.setup();
    render(<Harness id={id} />);

    const input = screen.getByDisplayValue('users');
    await user.clear(input);
    await user.type(input, 'bogus{escape}');

    expect(useSpecStore.getState().endpoints[0].path).toBe('/users');
  });

  it('supports multi-segment root paths without exposing the leading slash in the input', () => {
    useSpecStore.getState().pickMethod('/auth/session', 'GET');
    const id = useSpecStore.getState().endpoints[0].id;
    render(<Harness id={id} />);
    expect(screen.getByDisplayValue('auth/session')).toBeInTheDocument();
  });

  it('treats the bare "/" root endpoint as valid, with an empty editable segment', () => {
    useSpecStore.getState().pickMethod('/', 'GET');
    const id = useSpecStore.getState().endpoints[0].id;
    render(<Harness id={id} />);
    expect(screen.getByText('/')).toBeInTheDocument();
    expect(screen.queryByText('Invalid path')).not.toBeInTheDocument();
  });
});

describe('EndpointPathEditor — nested child path', () => {
  it('locks the parent root as inert text and only exposes the suffix as editable', () => {
    useSpecStore.getState().pickMethod('/users', 'GET');
    useSpecStore.getState().pickMethod('/users/{id}', 'GET');
    const child = useSpecStore.getState().endpoints[1];
    render(<Harness id={child.id} />);

    expect(screen.getByText('/users')).toBeInTheDocument();
    const input = screen.getByDisplayValue('/{id}');
    expect(input).toBeInTheDocument();
  });

  it('renaming the suffix cascades into further-nested descendants but leaves the locked root untouched', async () => {
    useSpecStore.getState().pickMethod('/users', 'GET');
    useSpecStore.getState().pickMethod('/users/{id}', 'GET');
    useSpecStore.getState().pickMethod('/users/{id}/posts', 'GET');
    const child = useSpecStore.getState().endpoints[1];
    const user = userEvent.setup();
    render(<Harness id={child.id} />);

    const input = screen.getByDisplayValue('/{id}');
    await user.clear(input);
    await user.type(input, '/{{userId}');
    await user.tab();

    const paths = useSpecStore.getState().endpoints.map((e) => e.path);
    expect(paths).toEqual(['/users', '/users/{userId}', '/users/{userId}/posts']);
  });

  it('locks to the longest matching ancestor when multiple ancestor endpoints exist', () => {
    useSpecStore.getState().pickMethod('/a', 'GET');
    useSpecStore.getState().pickMethod('/a/b', 'GET');
    useSpecStore.getState().pickMethod('/a/b/c', 'GET');
    const grandchild = useSpecStore.getState().endpoints[2];
    render(<Harness id={grandchild.id} />);

    expect(screen.getByText('/a/b')).toBeInTheDocument();
    expect(screen.getByDisplayValue('/c')).toBeInTheDocument();
  });
});
