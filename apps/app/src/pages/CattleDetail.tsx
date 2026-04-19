import { useState, type ChangeEvent } from 'react';
import { Link, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api.ts';
import { cattleSexLabel, type CattleRow, type PedigreeNode } from '@beefasso/shared';

type DetailRes = {
  cattle: CattleRow;
  parents: { id: string; regNo: string; name: string | null; sex: 'male' | 'female' }[];
  owner: { id: string; memberNo: string; fullName: string } | null;
};

export function CattleDetailPage() {
  const { id } = useParams();
  const { data, isLoading, error } = useQuery<DetailRes>({
    queryKey: ['cattle', id],
    queryFn: ({ signal }) => api(`/api/cattle/${id}`, { signal }),
    enabled: !!id,
  });

  if (isLoading) return <div className="text-sm text-slate-500">กำลังโหลด...</div>;
  if (error || !data) return <div className="text-sm text-accent-600">ไม่พบข้อมูล</div>;

  const c = data.cattle;
  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs text-primary-700">{c.regNo}</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{c.name ?? c.earTag}</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {cattleSexLabel(c.sex)}
            {c.breed ? ' · ' + c.breed : ''}
            {c.dob ? ' · เกิด ' + new Date(c.dob).toLocaleDateString('th-TH') : ''}
          </p>
        </div>
      </header>

      <PhotoGallery cattleId={c.id} photoUrls={c.photoUrls} />

      <Section title="ข้อมูลทั่วไป">
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <Info label="เลขทะเบียน" value={c.regNo} />
          <Info label="เบอร์หู" value={c.earTag} mono />
          <Info label="สายพันธุ์" value={c.breed ?? '—'} />
          <Info label="สี" value={c.color ?? '—'} />
          <Info
            label="เจ้าของปัจจุบัน"
            value={data.owner ? `${data.owner.memberNo} · ${data.owner.fullName}` : '—'}
          />
        </dl>
      </Section>

      <Pedigree rootId={c.id} />
    </div>
  );
}

// ---------- Photo gallery + upload ----------
function PhotoGallery({ cattleId, photoUrls }: { cattleId: string; photoUrls: string[] }) {
  const qc = useQueryClient();
  const upload = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch(`/api/cattle/${cattleId}/photos`, { method: 'POST', body: fd, credentials: 'include' });
      if (!r.ok) throw new Error(await r.text());
      return r.json() as Promise<{ key: string; photoUrls: string[] }>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cattle', cattleId] }),
  });

  const remove = useMutation({
    mutationFn: (key: string) => api(`/api/cattle/${cattleId}/photos`, { method: 'DELETE', body: { key } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cattle', cattleId] }),
  });

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) upload.mutate(f);
    e.target.value = '';
  };

  return (
    <Section
      title="รูปภาพ"
      right={
        <label className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-primary-500 hover:text-primary-600">
          {upload.isPending ? 'กำลังอัปโหลด...' : '+ เพิ่มรูป'}
          <input type="file" accept="image/*" className="hidden" onChange={onPick} disabled={upload.isPending} />
        </label>
      }
    >
      {photoUrls.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          ยังไม่มีรูปภาพ
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photoUrls.map((key) => (
            <div key={key} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              <img src={`/api/cattle/photos/${key}`} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  if (confirm('ลบรูปนี้?')) remove.mutate(key);
                }}
                className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100"
              >
                ลบ
              </button>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

// ---------- Pedigree tree (4 generations) ----------
function Pedigree({ rootId }: { rootId: string }) {
  const { data, isLoading } = useQuery<{ rootId: string; nodes: Record<string, PedigreeNode> }>({
    queryKey: ['cattle-pedigree', rootId],
    queryFn: ({ signal }) => api(`/api/cattle/${rootId}/pedigree`, { signal }),
  });

  if (isLoading) return <Section title="เพ็ดดีกรี"><div className="text-sm text-slate-500">โหลด...</div></Section>;
  if (!data) return null;

  return (
    <Section title="เพ็ดดีกรี (4 generations)">
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          <TreeNode id={rootId} nodes={data.nodes} depth={0} maxDepth={3} />
        </div>
      </div>
    </Section>
  );
}

function TreeNode({
  id,
  nodes,
  depth,
  maxDepth,
}: {
  id: string | null;
  nodes: Record<string, PedigreeNode>;
  depth: number;
  maxDepth: number;
}) {
  const n = id ? nodes[id] : undefined;
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <NodeCard node={n} sex={depth === 0 ? undefined : undefined} />
        {depth < maxDepth && (
          <div className="mt-2 flex flex-col gap-2 pl-4 border-l-2 border-slate-200">
            <TreeNode id={n?.sireId ?? null} nodes={nodes} depth={depth + 1} maxDepth={maxDepth} />
            <TreeNode id={n?.damId ?? null} nodes={nodes} depth={depth + 1} maxDepth={maxDepth} />
          </div>
        )}
      </div>
    </div>
  );
}

function NodeCard({ node }: { node?: PedigreeNode; sex?: 'male' | 'female' }) {
  if (!node) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-400">
        —
      </div>
    );
  }
  const bar = node.sex === 'male' ? 'border-l-primary-500' : 'border-l-accent-500';
  return (
    <Link
      to={`../${node.id}`}
      className={`block rounded-md border border-slate-200 bg-white border-l-4 ${bar} px-3 py-2 text-sm hover:border-primary-500 hover:shadow-sm`}
    >
      <div className="font-mono text-xs text-primary-700">{node.regNo}</div>
      <div className="font-medium text-slate-900">{node.name ?? '—'}</div>
      <div className="text-xs text-slate-500">{node.sex === 'male' ? '♂ พ่อ' : '♀ แม่'}</div>
    </Link>
  );
}

// ---------- Layout primitives ----------
function Section({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className={`mt-0.5 text-sm text-slate-900 ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  );
}
