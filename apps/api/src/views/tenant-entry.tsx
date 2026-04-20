import { Layout } from './layout.tsx';

/**
 * HTML entry for tenant URL (/t/:slug/...) — boots the React SPA.
 * In dev, Vite serves the SPA at :5173; in prod, built assets live under /assets.
 */
export const renderTenantEntry = (slug: string, nameTh: string, orgType: string) => {
  const isDev = process.env.NODE_ENV !== 'production';
  return (
    <Layout title={`${nameTh} — Jungdee`}>
      <div id="root" data-tenant-slug={slug} data-tenant-name={nameTh} data-tenant-org-type={orgType} data-base-path={`/t/${slug}`} />
      {isDev ? (
        <>
          <script type="module" src="http://localhost:5173/@vite/client"></script>
          <script type="module" src="http://localhost:5173/src/main.tsx"></script>
        </>
      ) : (
        <script type="module" src="/assets/main.js"></script>
      )}
    </Layout>
  );
};
