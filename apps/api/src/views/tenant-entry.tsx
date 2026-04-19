import { Layout } from './layout.tsx';

/**
 * HTML entry for tenant subdomain — boots the React SPA.
 * In dev, points to Vite dev server (:5173). In prod, points to built /assets.
 */
export const renderTenantEntry = (slug: string) => {
  const isDev = process.env.NODE_ENV !== 'production';
  const scriptSrc = isDev
    ? 'http://localhost:5173/@vite/client'
    : '/assets/index.js';
  const appScript = isDev ? 'http://localhost:5173/src/main.tsx' : '/assets/main.js';

  return (
    <Layout title={`${slug} — Jungdee`}>
      <div id="root" data-tenant-slug={slug} />
      {isDev && <script type="module" src={scriptSrc}></script>}
      <script type="module" src={appScript}></script>
    </Layout>
  );
};
