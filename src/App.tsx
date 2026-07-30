import { useAppStore } from './state/useAppStore';
import { AppShell } from './components/Shell/AppShell';
import { LandingPage } from './components/Landing/LandingPage';
import { OAuthCallbackPage } from './components/Auth/OAuthCallbackPage';
import { readOAuthCallbackFromLocation } from './lib/api/auth';

function App() {
  const signedIn = useAppStore((state) => state.signedIn);

  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const callback = readOAuthCallbackFromLocation(window.location.search);

  // OAuth completion must take precedence over normal authentication routing.
  // Some backend deployments return to /oauth/callback, while others return
  // to the configured frontend root with the one-time code in the query string.
  if (path === '/oauth/callback' || callback.code !== null) {
    return <OAuthCallbackPage />;
  }

  return signedIn ? <AppShell /> : <LandingPage />;
}

export default App;
