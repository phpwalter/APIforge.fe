import { render, screen } from '@testing-library/react';
import App from './App';
import { useAppStore } from './state/useAppStore';
import { useSpecStore } from './state/useSpecStore';

const initialAppState = useAppStore.getState();
const initialSpecState = useSpecStore.getState();

beforeEach(() => {
  useAppStore.setState(initialAppState, true);
  useSpecStore.setState(initialSpecState, true);
});

describe('App', () => {
  it('shows the landing page when signed out', () => {
    render(<App />);
    expect(screen.getByText('APIforge')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('shows the app shell when signed in', () => {
    useAppStore.setState({ signedIn: true });
    render(<App />);
    expect(screen.getByText('No API document loaded')).toBeInTheDocument();
  });
});
