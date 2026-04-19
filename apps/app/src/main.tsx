import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App.tsx';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

const rootEl = document.getElementById('root')!;
const tenantSlug = rootEl.dataset.tenantSlug ?? 'unknown';
const tenantName = rootEl.dataset.tenantName ?? tenantSlug;
const basePath = rootEl.dataset.basePath ?? `/t/${tenantSlug}`;

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={basePath}>
        <App tenantSlug={tenantSlug} tenantName={tenantName} />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
