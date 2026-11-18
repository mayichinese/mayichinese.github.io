// =========================================================
// ĐỐI CHIẾU ÂM HÁN VIỆT (và pinyin) trong app/data/hsk1.json với từ điển Hanzii
// (https://hanzii.net/?hl=vi).
//
// Hanzii là trang web chạy bằng JavaScript nên script mở trình duyệt Edge ở chế độ ẩn
// (MỘT lần duy nhất), rồi lần lượt mở trang của từng từ và đọc phần "[pinyin] [Hán Việt]".
// - Nghỉ ~1,5 giây giữa các lần tra để không làm phiền trang web.
// - Kết quả lưu vào cong-cu/tu-dien-doi-chieu/hanzii-cache.json → chạy lại không tra lại.
// - Báo cáo: cong-cu/bao-cao-hanzii.txt
//
// Cách chạy (cần Node.js, từ thư mục d:\Project\HocTieng):
//   node cong-cu/doi-chieu-hanzii.mjs
// =========================================================
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..');
const DU_LIEU = join(GOC, 'app', 'data', 'hsk1.json');
const CACHE = join(GOC, 'cong-cu', 'tu-dien-doi-chieu', 'hanzii-cache.json');
const BAO_CAO = join(GOC, 'cong-cu', 'bao-cao-hanzii.txt');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const CONG = 9334;
const nghi = (ms) => new Promise((r) => setTimeout(r, ms));
// Chuẩn hóa để KHÔNG coi khác biệt chính tả là khác âm:
//  - vị trí dấu thanh: hòa = hoà, tọa = toạ, thùy = thuỳ
//  - i / y cuối âm tiết sau phụ âm: lý = lí, kỷ = kỉ, ty = ti
const DAU = { '̀': 'f', '́': 's', '̃': 'x', '̉': 'r', '̣': 'j' };
const chuan = (s) => String(s || '').toLowerCase().trim().split(/\s+/).map((at) => {
  let thanh = '';
  const goc = at.normalize('NFD').replace(/[̣̀́̃̉]/g, (d) => { thanh = DAU[d]; return ''; }).normalize('NFC');
  return goc.replace(/^([^aeiouyăâêôơư]+)y$/, '$1i') + thanh;
}).join(' ');
// Hanzii có thể ghi nhiều âm trong một ô: "xà | tha"
const tachAm = (s) => String(s || '').split('|').map(chuan);

// ---------- Mở Edge ẩn và kết nối điều khiển ----------
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${CONG}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'edge-hanzii-'))}`, 'about:blank'], { stdio: 'ignore' });
let tab;
for (let i = 0; i < 60 && !tab; i++) {
  try { tab = (await (await fetch(`http://127.0.0.1:${CONG}/json/list`)).json()).find((t) => t.type === 'page'); } catch { /* đợi Edge khởi động */ }
  if (!tab) await nghi(250);
}
if (!tab) { console.error('Không mở được Edge.'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let soLenh = 0;
const cho = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && cho.has(m.id)) { cho.get(m.id)(m); cho.delete(m.id); } });
const gui = (method, params = {}) => new Promise((r) => { const i = ++soLenh; cho.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const chayJs = async (bt) => (await gui('Runtime.evaluate', { expression: bt, returnByValue: true })).result?.result?.value;

// Trong trang: tìm các dòng dạng "[ài][ÁI]" (pinyin + Hán Việt) nằm ngay dưới dòng chứa chính từ đang tra
// (kiểm tra dòng phía trên để chắc chắn không đọc nhầm nội dung của trang trước).
const docMucTu = (tu) => `(() => {
  const d = document.body ? document.body.innerText.split('\\n').map(s => s.trim()).filter(Boolean) : [];
  const cap = [];
  for (let i = 1; i < Math.min(d.length, 400); i++) {
    const m = d[i].match(/^\\[([^\\]]+)\\]\\s*\\[([^\\]]+)\\]$/);
    if (m && d[i - 1].startsWith(${JSON.stringify(tu)})) cap.push({ pinyin: m[1].trim(), hanViet: m[2].trim() });
  }
  return { cap, khongCo: /Không tìm thấy|không có kết quả/i.test(document.body?.innerText || '') };
})()`;

async function tra(tu) {
  await gui('Page.navigate', { url: `https://hanzii.net/search/word/${encodeURIComponent(tu)}?hl=vi` });
  for (let i = 0; i < 40; i++) { // đợi tối đa ~12 giây
    await nghi(300);
    const kq = await chayJs(docMucTu(tu));
    if (kq?.cap?.length || kq?.khongCo) return kq.cap;
  }
  return null; // quá giờ
}

// ---------- Tra từng từ ----------
const duLieu = JSON.parse(readFileSync(DU_LIEU, 'utf8'));
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};
const dsTu = duLieu.baiHoc.flatMap((b) => b.tu);
for (const [i, t] of dsTu.entries()) {
  if (cache[t.hanzi]?.length) continue;
  const cap = await tra(t.hanzi);
  if (cap === null) { console.log(`  ! quá giờ: ${t.hanzi}`); continue; }
  cache[t.hanzi] = cap;
  writeFileSync(CACHE, JSON.stringify(cache, null, 1));
  console.log(`[${i + 1}/${dsTu.length}] ${t.hanzi}: ${cap.slice(0, 2).map((c) => `[${c.pinyin}] ${c.hanViet}`).join('; ')}`);
  await nghi(1500);
}
ws.close();
edge.kill();

// ---------- So sánh và ghi báo cáo ----------
const khop = [], khac = [], khongCo = [];
for (const t of dsTu) {
  const cap = cache[t.hanzi];
  if (!cap?.length) { khongCo.push(`${t.hanzi} (${t.hanViet}): Hanzii không có dữ liệu / chưa tra được`); continue; }
  if (cap.some((c) => tachAm(c.hanViet).includes(chuan(t.hanViet)))) khop.push(t.hanzi);
  else khac.push(`${t.hanzi}: app ghi '${t.hanViet}' — Hanzii ghi ${cap.slice(0, 4).map((c) => `[${c.pinyin}] ${c.hanViet}`).join('; ')}`);
}
writeFileSync(BAO_CAO, [
  'ĐỐI CHIẾU ÂM HÁN VIỆT VỚI HANZII (https://hanzii.net)',
  `Khớp: ${khop.length} | Khác: ${khac.length} | Không có dữ liệu: ${khongCo.length}`, '',
  '== KHÁC (cần xem lại) ==', ...khac, '', '== KHÔNG CÓ DỮ LIỆU ==', ...khongCo, '',
].join('\n'));
console.log(`\nKhớp: ${khop.length} | Khác: ${khac.length} | Không có dữ liệu: ${khongCo.length}`);
console.log(`Báo cáo: ${relative(GOC, BAO_CAO)}`);
process.exit(0);
