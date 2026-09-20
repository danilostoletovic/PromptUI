import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@openuidev/react-ui/styles/index.css';
import './index.css';
import App from './App';

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
