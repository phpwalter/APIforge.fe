import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import App from './App.tsx';
import { AuthBootstrap } from './components/Auth/AuthBootstrap';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthBootstrap>
      <App />
    </AuthBootstrap>
  </StrictMode>,
);
