import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router';

/**
 * Responsive app shell:
 *  - on desktop (md+): sidebar is always visible to the left
 *  - on mobile: sidebar is a slide-in drawer toggled by a hamburger button
 *
 * The shell renders a sticky top bar on mobile only, with the brand + menu.
 */
export function MobileShell({
  brand,
  sidebar,
  children,
  accent,
}: {
  brand: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
  accent?: 'primary' | 'accent';
}) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const accentBtn =
    accent === 'accent'
      ? 'text-accent-600 hover:bg-accent-50'
      : 'text-primary-600 hover:bg-primary-50';

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:block">
        {sidebar}
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          {brand}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="เปิดเมนู"
            className={`rounded-md p-2 transition ${accentBtn}`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </header>

        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-30 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="ปิดเมนู"
            className="absolute inset-0 bg-slate-900/60"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] overflow-y-auto bg-white shadow-xl">
            <div className="flex items-center justify-end border-b border-slate-200 px-4 py-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="ปิดเมนู"
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {sidebar}
          </div>
        </div>
      )}
    </div>
  );
}
