import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Jungdee — ระบบบริหารสมาคมเลี้ยงวัว',
  description: 'SaaS สำหรับสมาคมผู้เลี้ยงโคในประเทศไทย',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-white text-slate-900 antialiased">{children}</body>
    </html>
  );
}
