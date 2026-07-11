import { useAppStore } from './state/useAppStore';
import { AppShell } from './components/Shell/AppShell';
import { LandingPage } from './components/Landing/LandingPage';

function App() {
  const signedIn = useAppStore((s) => s.signedIn);
  return signedIn ? <AppShell /> : <LandingPage />;
}

export default App;
