import type { FC, PropsWithChildren } from 'hono/jsx';

export const Layout: FC<PropsWithChildren<{ title?: string }>> = ({ title, children }) => (
  <html lang="th">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{title ?? 'Jungdee'}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <script
        dangerouslySetInnerHTML={{
          __html: `tailwind.config = { theme: { extend: { colors: {
            primary: { 50:'#eff6ff',100:'#dbeafe',500:'#2563eb',600:'#1d4ed8',700:'#1e40af' },
            accent:  { 50:'#fef2f2',500:'#dc2626',600:'#b91c1c' }
          } } } }`,
        }}
      />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style dangerouslySetInnerHTML={{ __html: `body{font-family:'Noto Sans Thai',ui-sans-serif,system-ui}` }} />
    </head>
    <body class="min-h-screen bg-white text-slate-900 antialiased">{children}</body>
  </html>
);
