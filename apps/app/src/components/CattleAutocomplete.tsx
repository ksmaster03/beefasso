import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api.ts';

type Match = { id: string; regNo: string; name: string | null; earTag: string; sex: 'male' | 'female' };

export function CattleAutocomplete({
  value,
  onChange,
  sex,
  placeholder,
}: {
  value: string | null;
  onChange: (id: string | null, label?: string) => void;
  sex?: 'male' | 'female';
  placeholder?: string;
}) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [debounced, setDebounced] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const { data } = useQuery<{ matches: Match[] }>({
    queryKey: ['cattle-autocomplete', debounced, sex],
    queryFn: ({ signal }) => {
      const p = new URLSearchParams();
      p.set('q', debounced);
      if (sex) p.set('sex', sex);
      return api(`/api/cattle/_autocomplete?${p}`, { signal });
    },
    enabled: debounced.length >= 2,
  });

  // Prefill label if value was set from outside
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  useEffect(() => {
    if (!value) setSelectedLabel(null);
  }, [value]);

  return (
    <div className="relative" ref={ref}>
      {value && selectedLabel ? (
        <div className="flex items-center gap-2 rounded-md border border-primary-200 bg-primary-50 px-3 py-2 text-sm">
          <span className="text-primary-800">{selectedLabel}</span>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setSelectedLabel(null);
              setQ('');
            }}
            className="ml-auto text-xs text-primary-600 hover:text-accent-600"
          >
            เปลี่ยน
          </button>
        </div>
      ) : (
        <>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder ?? 'พิมพ์เลขทะเบียนหรือชื่อ...'}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          {open && data && data.matches.length > 0 && (
            <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg">
              {data.matches.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => {
                      const label = `${m.regNo}${m.name ? ' — ' + m.name : ''}`;
                      onChange(m.id, label);
                      setSelectedLabel(label);
                      setOpen(false);
                      setQ('');
                    }}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-primary-50"
                  >
                    <span className="font-mono text-xs text-primary-700">{m.regNo}</span>
                    {m.name && <span className="ml-2 text-slate-900">{m.name}</span>}
                    <span className="ml-2 text-xs text-slate-500">
                      {m.sex === 'male' ? '♂' : '♀'} · {m.earTag}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
