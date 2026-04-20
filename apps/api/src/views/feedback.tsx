import { Layout } from './layout.tsx';

export const renderFeedback = (product: 'jungdee' | 'cattlepro') => {
  const isCP = product === 'cattlepro';
  const accent = isCP ? 'accent' : 'primary';
  return (
    <Layout title="ส่งความคิดเห็น — Jungdee / Cattle Pro">
      <main class="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <a href="/" class={`text-sm text-slate-500 hover:text-${accent}-600`}>← กลับหน้าแรก</a>
        <h1 class="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">ส่งความคิดเห็น</h1>
        <p class="mt-2 text-slate-600">
          ร้องเรียน ติชม พบปัญหา หรือแนะนำปรับปรุง — เราอ่านทุกข้อความและตอบกลับโดยเร็ว
        </p>

        <form id="f" class="mt-8 space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <fieldset>
            <legend class="text-sm font-medium text-slate-700">ประเภท <span class={`text-${accent}-500`}>*</span></legend>
            <div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { v: 'complaint', l: 'ร้องเรียน', e: '😠' },
                { v: 'compliment', l: 'ติชม', e: '💙' },
                { v: 'bug', l: 'เจอปัญหา', e: '🐞' },
                { v: 'suggestion', l: 'แนะนำปรับปรุง', e: '💡' },
              ].map((o, i) => (
                <label class="relative cursor-pointer rounded-lg border border-slate-300 bg-white p-3 text-center text-sm font-medium text-slate-700 transition has-[:checked]:border-slate-900 has-[:checked]:bg-slate-50">
                  <input type="radio" name="type" value={o.v} required checked={i === 3} class="peer absolute inset-0 cursor-pointer opacity-0" />
                  <span class="text-lg">{o.e}</span>
                  <br />
                  <span>{o.l}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label class="block">
            <span class="text-sm font-medium text-slate-700">หัวข้อ <span class={`text-${accent}-500`}>*</span></span>
            <input
              name="subject"
              required
              maxlength={200}
              class={`mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-${accent}-500 focus:outline-none focus:ring-1 focus:ring-${accent}-500`}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">เนื้อหา <span class={`text-${accent}-500`}>*</span></span>
            <textarea
              name="message"
              required
              rows={6}
              maxlength={5000}
              class={`mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-${accent}-500 focus:outline-none focus:ring-1 focus:ring-${accent}-500`}
            />
          </label>

          <hr class="border-slate-200" />
          <p class="text-xs text-slate-500">ข้อมูลติดต่อ (ไม่บังคับ) — หากต้องการให้เราติดต่อกลับ</p>
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="text-sm font-medium text-slate-700">ชื่อ</span>
              <input name="contactName" class={`mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-${accent}-500 focus:outline-none focus:ring-1 focus:ring-${accent}-500`} />
            </label>
            <label class="block">
              <span class="text-sm font-medium text-slate-700">เบอร์โทร</span>
              <input name="contactPhone" class={`mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-${accent}-500 focus:outline-none focus:ring-1 focus:ring-${accent}-500`} />
            </label>
          </div>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">อีเมล</span>
            <input
              name="contactEmail"
              type="email"
              class={`mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-${accent}-500 focus:outline-none focus:ring-1 focus:ring-${accent}-500`}
            />
          </label>

          <input type="hidden" name="pageUrl" id="page_url" />
          <div id="msg" class="text-sm" />
          <button type="submit" class={`w-full rounded-lg bg-${accent}-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-${accent}-700`}>
            ส่งความคิดเห็น
          </button>
        </form>

        <script
          dangerouslySetInnerHTML={{
            __html: `
document.getElementById('page_url').value = location.href;
document.getElementById('f').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  for (const k of ['contactName','contactEmail','contactPhone','pageUrl']) if (!data[k]) delete data[k];
  const msg = document.getElementById('msg');
  msg.textContent = 'กำลังส่ง...';
  const r = await fetch('/api/feedback', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data),
  });
  const j = await r.json();
  if (r.ok) {
    msg.textContent = 'ส่งเรียบร้อย ขอบคุณที่ช่วยให้เราพัฒนาระบบ';
    msg.className = 'rounded-md bg-green-50 p-3 text-sm text-green-700';
    e.target.reset();
    document.getElementById('page_url').value = location.href;
  } else {
    msg.textContent = 'ผิดพลาด: ' + (j.error ?? 'ลองใหม่');
    msg.className = 'rounded-md bg-red-50 p-3 text-sm text-red-700';
  }
});
`,
          }}
        />
      </main>
    </Layout>
  );
};
