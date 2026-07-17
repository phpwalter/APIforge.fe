import { render, screen, fireEvent } from '@testing-library/react';
import { UserMenu } from './UserMenu';
import { useAppStore } from '../../state/useAppStore';

const initialState = useAppStore.getState();

beforeEach(() => {
  useAppStore.setState(initialState, true);
});

describe('UserMenu — avatar', () => {
  it('shows the real avatar photo when the profile has one', () => {
    useAppStore.setState({
      signedIn: true,
      userProfile: { name: 'Ada Lovelace', email: 'ada@example.com', avatarUrl: 'https://example.com/ada.png' },
    });
    render(<UserMenu />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/ada.png');
  });

  it('falls back to initials when the profile has no avatar photo', () => {
    useAppStore.setState({
      signedIn: true,
      userProfile: { name: 'Ada Lovelace', email: 'ada@example.com' },
    });
    render(<UserMenu />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByTitle('Ada Lovelace · Account')).toHaveTextContent('AL');
  });

  it('falls back to initials if the avatar photo fails to load', () => {
    useAppStore.setState({
      signedIn: true,
      userProfile: { name: 'Ada Lovelace', email: 'ada@example.com', avatarUrl: 'https://example.com/broken.png' },
    });
    render(<UserMenu />);

    fireEvent.error(screen.getByRole('img'));

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByTitle('Ada Lovelace · Account')).toHaveTextContent('AL');
  });
});

describe('UserMenu — provider line under the email', () => {
  it('shows the real provider\'s display label in brackets, below the email', () => {
    useAppStore.setState({
      signedIn: true,
      userMenuOpen: true,
      userProfile: { name: 'Ada Lovelace', email: 'ada@example.com' },
      authProvider: 'github',
    });
    render(<UserMenu />);

    expect(screen.getByText('[GitHub]')).toBeInTheDocument();
  });

  it('resolves each known provider id to its display label', () => {
    useAppStore.setState({
      signedIn: true,
      userMenuOpen: true,
      userProfile: { name: 'Ada Lovelace', email: 'ada@example.com' },
      authProvider: 'google',
    });
    render(<UserMenu />);

    expect(screen.getByText('[Google]')).toBeInTheDocument();
  });

  it('falls back to the raw provider id when it isn\'t in the known providers list', () => {
    useAppStore.setState({
      signedIn: true,
      userMenuOpen: true,
      userProfile: { name: 'Ada Lovelace', email: 'ada@example.com' },
      authProvider: 'some-future-provider',
    });
    render(<UserMenu />);

    expect(screen.getByText('[some-future-provider]')).toBeInTheDocument();
  });

  it('shows nothing when there is no real provider (demo sign-in)', () => {
    useAppStore.setState({
      signedIn: true,
      userMenuOpen: true,
      userProfile: { name: 'Ada Lovelace', email: 'ada@example.com' },
      authProvider: null,
    });
    render(<UserMenu />);

    expect(screen.queryByText(/^\[.*\]$/)).not.toBeInTheDocument();
  });
});
