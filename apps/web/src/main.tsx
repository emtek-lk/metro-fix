import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrandLogo } from '@metro-fix/ui';
import { ThemeProvider } from './theme/ThemeProvider';
import './index.css';
import App from './App';

function setAppFavicon(href: string) {
  if (typeof document === 'undefined') {
    return;
  }

  let link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');

  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }

  link.type = 'image/png';
  link.href = href;
}

setAppFavicon(BrandLogo);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
