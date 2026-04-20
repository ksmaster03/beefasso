import { Layout } from './layout.tsx';

/**
 * HTML entry for Cattle Pro app (/app/*) — boots the same React SPA bundle
 * but with `data-product="cattlepro"` so the SPA router mounts the farm UI.
 */
export const renderCattleProAppEntry = (farmSlug: string, farmName: string) => {
  const isDev = process.env.NODE_ENV !== 'production';
  return (
    <Layout title={`${farmName} — Cattle Pro`}>
      <div id="root" data-product="cattlepro" data-farm-slug={farmSlug} data-farm-name={farmName} data-base-path="" />
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
