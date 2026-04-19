export function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">ภาพรวม</h1>
      <p className="mt-1 text-slate-600">หน้า dashboard ของสมาคม (placeholder)</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card label="สมาชิกทั้งหมด" value="—" />
        <Card label="โคขึ้นทะเบียน" value="—" />
        <Card label="รายได้เดือนนี้" value="—" />
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}
