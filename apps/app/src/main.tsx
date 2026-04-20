import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App.tsx';
import { CattleProApp } from './cattlepro/CattleProApp.tsx';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

const rootEl = document.getElementById('root')!;
const product = rootEl.dataset.product ?? 'jungdee';

const Tree =
  product === 'cattlepro' ? (
    <BrowserRouter basename="/app">
      <CattleProApp farmSlug={rootEl.dataset.farmSlug ?? ''} farmName={rootEl.dataset.farmName ?? ''} />
    </BrowserRouter>
  ) : (
    <BrowserRouter basename={rootEl.dataset.basePath ?? `/t/${rootEl.dataset.tenantSlug ?? 'unknown'}`}>
      <App
        tenantSlug={rootEl.dataset.tenantSlug ?? 'unknown'}
        tenantName={rootEl.dataset.tenantName ?? rootEl.dataset.tenantSlug ?? 'unknown'}
      />
    </BrowserRouter>
  );

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>{Tree}</QueryClientProvider>
  </StrictMode>,
);
