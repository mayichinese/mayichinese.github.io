// =========================================================
// ĐỌC DỮ LIỆU TỪ VỰNG từ data/hsk1.json, data/hsk2.json…
// (tạo bởi cong-cu/ghep-du-lieu-hsk1.py và cong-cu/ghep-du-lieu-cap.py từ danh sách chính thức + phần soạn tay)
// Mã bài: cấp 1 theo chủ đề là SỐ (3); cấp 1 theo sách là 's3'; cấp 2 trở lên theo sách là '2-3' (bài 3 của HSK 2,
// chia theo thứ tự bài của sách 《新HSK教程 2》); cấp 2 trở lên theo chủ đề là 'c2-3'
// (data/chu-de-hsk2.json, tạo bởi cong-cu/tao-chu-de.py).
// Một cài đặt chung caiDat.cheDoBai ('chu-de' | 'sach') áp dụng cho MỌI cấp.
// =========================================================

// Tên tiếng Việt của các ký hiệu từ loại trong danh sách chính thức
export const TEN_TU_LOAI = {
  '名': 'danh từ', '动': 'động từ', '形': 'tính từ', '副': 'phó từ', '代': 'đại từ',
  '数': 'số từ', '量': 'lượng từ', '数量': 'số lượng từ', '助': 'trợ từ', '介': 'giới từ',
  '连': 'liên từ', '叹': 'thán từ', '前缀': 'tiền tố', '后缀': 'hậu tố', 'cụm': 'cụm từ',
};

// Các cấp có dữ liệu. tuyChon: thiếu file thì bỏ qua (cấp đang soạn).
const CAC_FILE = [
  { cap: 1, duongDan: 'data/hsk1.json' },
  { cap: 2, duongDan: 'data/hsk2.json', tuyChon: true },
  { cap: 3, duongDan: 'data/hsk3.json', tuyChon: true },
];

let baiHoc = [];       // [{ cap, so, ma, ten, tu: [ ... ], soTu, sach: false }]
let tuTheoKhoa = {};   // khóa "1:爱" → từ

/** Lấy file: dùng yêu cầu đã bắt đầu sẵn trong index.html (nếu có, chỉ một lần), không thì tải mới */
function taiFile(duongDan) {
  const san = window.__taiTruoc?.[duongDan];
  if (san) { delete window.__taiTruoc[duongDan]; return san; }
  return fetch(duongDan, { cache: 'no-cache' });
}

/** Tải toàn bộ dữ liệu. Ném lỗi có giải thích tiếng Việt nếu file hỏng. */
export async function taiDuLieu() {
  baiHoc = [];
  tuTheoKhoa = {};
  // Tải mọi file CÙNG LÚC (nhanh hơn tải lần lượt), rồi xử lý theo thứ tự cấp
  const cacPhanHoi = CAC_FILE.map((f) => taiFile(f.duongDan));
  cacPhanHoi.forEach((p) => p.catch(() => {}));   // lỗi được xử lý bên dưới, tránh cảnh báo "chưa bắt lỗi"
  const henTheoSach = taiFile('data/theo-sach-hsk1.json').catch(() => null);
  const henChuDe = Object.fromEntries([2, 3].map((cap) => [cap,
    taiFile(`data/chu-de-hsk${cap}.json`).catch(() => null)]));
  for (const [i, f] of CAC_FILE.entries()) {
    let phanHoi;
    try {
      phanHoi = await cacPhanHoi[i];
    } catch (e) {
      if (f.tuyChon) continue;
      throw new Error(`Không mở được file ${f.duongDan}.\n` +
        'Nếu bạn mở app bằng cách bấm đúp vào index.html thì trình duyệt sẽ chặn đọc file. ' +
        'Hãy chạy bằng file CHAY-APP.bat (xem HUONG-DAN.md).');
    }
    if (!phanHoi.ok && f.tuyChon) continue;
    if (!phanHoi.ok) throw new Error(`Không tìm thấy file ${f.duongDan} (mã lỗi ${phanHoi.status}).`);
    const chuoi = await phanHoi.text();
    let json;
    try {
      json = JSON.parse(chuoi);
    } catch (e) {
      throw new Error(`File ${f.duongDan} bị sai định dạng JSON:\n${e.message}\n` +
        'Thường do thiếu/thừa dấu phẩy, dấu ngoặc kép hoặc ngoặc nhọn ở chỗ vừa sửa.');
    }
    for (const b of json.baiHoc || []) {
      const ma = f.cap === 1 ? b.so : `${f.cap}-${b.so}`;
      const dsTu = (b.tu || [])
        .filter((t) => t.daSoan) // chỉ dùng từ đã soạn đủ nội dung
        .map((t) => ({ ...t, cap: f.cap, khoa: `${f.cap}:${t.dangGoc}`, bai: b.so, maBai: ma }));
      dsTu.forEach((t) => { tuTheoKhoa[t.khoa] = t; });
      // soTu: số từ chính thức của bài (kể cả từ chưa soạn) – để hiện "đang soạn"
      // cấp 1 trong hsk1.json chia theo chủ đề; cấp 2 trở lên chia theo bài sách
      baiHoc.push({ cap: f.cap, so: b.so, ma, ...tachTenChang(b.ten), tu: dsTu, soTu: b.soTu ?? dsTu.length, sach: f.cap > 1 });
    }
  }
  if (!baiHoc.length) throw new Error('File dữ liệu không có bài học nào.');
  await taiTheoSach(henTheoSach);
  await taiChuDe(henChuDe);
  return baiHoc;
}

// ---------- HSK 2 trở lên "Theo chủ đề" ----------
// data/chu-de-hskN.json: { cap, bai: [{ so, ten, tu: [khóa theo thứ tự học] }], tu: { khóa: số bài } }
let baiChuDe = [];         // [{ ma: 'c2-3', cap, so, ten, tu: [...], chuDe: true }]
let chuDeCuaTu = {};       // khóa → { so, ten }

async function taiChuDe(henSan = {}) {
  baiChuDe = [];
  chuDeCuaTu = {};
  // HSK 1: hsk1.json chia theo 20 chủ đề → chủ đề của từng từ (để đặt tên PHẦN theo chủ đề)
  for (const b of baiHoc) {
    if (b.cap === 1 && !b.sach) b.tu.forEach((t) => { chuDeCuaTu[t.khoa] = { so: b.so, ten: b.ten }; });
  }
  for (const cap of cacCapCoDuLieu().filter((c) => c > 1)) {
    try {
      const r = await (henSan[cap] || fetch(`data/chu-de-hsk${cap}.json`, { cache: 'no-cache' }));
      if (!r?.ok) continue;
      const json = await r.json();
      for (const b of json.bai) {
        const tu = b.tu.map((k) => tuTheoKhoa[k]).filter(Boolean);
        tu.forEach((t) => { chuDeCuaTu[t.khoa] = { so: b.so, ten: b.ten }; });
        baiChuDe.push({ ma: `c${cap}-${b.so}`, cap, so: b.so, ten: b.ten, tu, soTu: b.tu.length, sach: false, chuDe: true });
      }
    } catch {
      // không có file → cấp này chỉ chia theo sách
    }
  }
}
/** Cấp này có cách chia theo chủ đề không */
export const coChuDe = (cap) => (cap === 1 ? true : baiChuDe.some((b) => b.cap === cap));
/** Chủ đề (cấp 2 trở lên) của một từ: { so, ten } hoặc null */
export const chuDeCuaMotTu = (tu) => chuDeCuaTu[tu.khoa] || null;

// ---------- Học "Theo sách" 《新HSK教程 1》 (Giai đoạn 5) ----------
// data/theo-sach-hsk1.json (tạo bởi cong-cu/tao-theo-sach.py): từ nào thuộc bài nào của sách.
// Bài theo chủ đề có mã là SỐ (3); bài theo sách có mã là chuỗi 's3'.
/**
 * Tên chặng trong nguồn ghi "Tên chủ đề // Tên bài theo sách" (2026-11-21: người dùng muốn tên dễ hiểu theo chủ đề).
 * → { ten: tên chủ đề (hiện chính), tenSach: tên theo mục lục sách (hiện phụ) }
 */
function tachTenChang(ten) {
  const [a, b] = String(ten || '').split('//').map((x) => x.trim());
  return b ? { ten: a, tenSach: b } : { ten: a, tenSach: null };
}

let theoSach = null;       // { bai: [{ so, ten }], tu: { khoa: số bài }, nguPhap: { mã: số bài } }
let baiSach = [];          // [{ ma: 's3', so, ten, tu: [...], sach: true }]

async function taiTheoSach(henSan = null) {
  theoSach = null;
  baiSach = [];
  try {
    const r = await (henSan || fetch('data/theo-sach-hsk1.json', { cache: 'no-cache' }));
    if (!r?.ok) return;
    theoSach = await r.json();
    baiSach = theoSach.bai.map((b) => ({
      ma: `s${b.so}`, cap: 1, so: b.so, ...tachTenChang(b.ten), sach: true,
      tu: tatCaTu().filter((t) => theoSach.tu[t.khoa] === b.so),
    })).map((b) => ({ ...b, soTu: b.tu.length }));
  } catch {
    theoSach = null; // không có file → chỉ dùng cách chia theo chủ đề
  }
}

export const coTheoSach = () => !!theoSach;
export const tenSach = () => theoSach?.sach || '';
/**
 * Chế độ chia bài của LỘ TRÌNH: luôn 'sach' (theo thứ tự bài 《新HSK教程》, có ngữ pháp từng bài) – từ 2026-11-20
 * caiDat.cheDoBai không còn dùng; cách chia theo chủ đề chỉ còn là danh mục tra từ (danhSachBai('chu-de', cap)).
 * Chỉ khi thiếu data/theo-sach-hsk1.json mới phải dùng 'chu-de'.
 */
export function cheDoBai() {
  return theoSach ? 'sach' : 'chu-de';
}
/**
 * Danh sách bài theo thứ tự học: HSK 1 rồi đến HSK 2, HSK 3 – mỗi cấp theo chủ đề hoặc theo sách.
 * cap: chỉ lấy một cấp. Mỗi bài: { ma, cap, so, ten, tu, sach, chuDe? }.
 */
export function danhSachBai(cheDo, cap = null) {
  const baiCuaCap = (c) => {
    if (c === 1) return cheDo === 'sach' && theoSach ? baiSach : baiHoc.filter((b) => b.cap === 1);
    const chuDe = baiChuDe.filter((b) => b.cap === c);
    return cheDo === 'chu-de' && chuDe.length ? chuDe : baiHoc.filter((b) => b.cap === c);
  };
  return (cap ? [cap] : cacCapCoDuLieu()).flatMap(baiCuaCap);
}
/** Các cấp đã có dữ liệu: [1, 2] */
export const cacCapCoDuLieu = () => [...new Set(baiHoc.map((b) => b.cap))];
/** Số từ chính thức của một cấp (kể cả từ chưa soạn xong) */
export const tongTuCap = (cap) => baiHoc.filter((b) => b.cap === cap).reduce((s, b) => s + b.soTu, 0);
/** Tìm bài theo mã: 3 (chủ đề cấp 1), 's3' (sách cấp 1), '2-3' (bài sách HSK 2), 'c2-3' (chủ đề HSK 2) */
export function timBaiTheoMa(ma) {
  if (typeof ma === 'string' && /^s\d+$/.test(ma)) return baiSach.find((b) => b.ma === ma) || null;
  if (typeof ma === 'string' && /^c\d+-\d+$/.test(ma)) return baiChuDe.find((b) => b.ma === ma) || null;
  if (typeof ma === 'string' && /^\d+-\d+$/.test(ma)) return baiHoc.find((b) => b.ma === ma) || null;
  return baiHoc.find((b) => b.cap === 1 && b.so === Number(ma)) || null;
}
/** Đọc mã bài từ địa chỉ (#/bai/3, #/bai/s3, #/bai/2-3, #/bai/c2-3) */
export const maBaiTuDiaChi = (chuoi) => (/^(s\d+|c?\d+-\d+)$/.test(chuoi || '') ? chuoi : Number(chuoi));
/** Mã bài của một từ trong chế độ đang dùng */
export function maBaiCuaTu(tu, cheDo) {
  if (tu.cap === 1 && cheDo === 'sach' && theoSach?.tu[tu.khoa]) return `s${theoSach.tu[tu.khoa]}`;
  if (tu.cap > 1 && cheDo === 'chu-de' && chuDeCuaTu[tu.khoa]) return `c${tu.cap}-${chuDeCuaTu[tu.khoa].so}`;
  return tu.maBai;
}
/** Nhãn bài để hiện: "Bài 3" (bài sách – lộ trình), "HSK 2 · Bài 3", "Chủ đề 3" / "HSK 2 · Chủ đề 3" (danh mục) */
export const nhanBai = (b) => `${b.cap > 1 ? `HSK ${b.cap} · ` : ''}${b.sach ? 'Chặng' : 'Chủ đề'} ${b.so}`;
/** Bài trong sách của một điểm ngữ pháp (mã điểm → số bài), null nếu chưa gắn */
export const baiSachCuaNguPhap = (ma) => theoSach?.nguPhap?.[ma] ?? null;
/** Bài trong sách của một từ */
export const baiSachCuaTu = (tu) => theoSach?.tu?.[tu.khoa] ?? null;
/** Nhãn bài của một từ: "Bài 5" (bài sách) hoặc "Chủ đề 3" */
export function nhanBaiCuaTu(tu, cheDo) {
  if (tu.cap > 1) {
    const cd = cheDo === 'chu-de' ? chuDeCuaTu[tu.khoa] : null;
    return cd ? `Chủ đề ${cd.so}` : `Chặng ${tu.bai}`;
  }
  const s = cheDo === 'sach' ? baiSachCuaTu(tu) : null;
  return s ? `Chặng ${s}` : `Chủ đề ${tu.bai}`;
}

export const layBaiHoc = () => baiHoc;
export const layTu = (khoa) => tuTheoKhoa[khoa];
export const tatCaTu = () => baiHoc.flatMap((b) => b.tu);
export const timBai = (cap, so) => baiHoc.find((b) => b.cap === cap && b.so === so);

/** Chủ đề chiếm nhiều từ nhất trong một nhóm từ (tên PHẦN của chặng); null nếu không rõ */
export function chuDeChinh(dsTu) {
  const dem = new Map();
  for (const t of dsTu) {
    const c = chuDeCuaTu[t.khoa]?.ten;
    if (c) dem.set(c, (dem.get(c) || 0) + 1);
  }
  return [...dem.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

/** Nghĩa ngắn gọn để hiện trong danh sách: "yêu; thích". */
export function nghiaNgan(tu) {
  return (tu.nghia || []).map((n) => n.nghia).join('; ');
}

// ---------- Chữ đa âm có nhiều mục từ (得 de / dé / děi, 还 hái / huán, 长, 只, 地, 过) ----------
let nhomDaAm = null;
let soTuKhiTinh = -1;
function bangDaAm() {
  const ds = tatCaTu();
  if (!nhomDaAm || ds.length !== soTuKhiTinh) {
    nhomDaAm = new Map();
    for (const t of ds) {
      if (!nhomDaAm.has(t.hanzi)) nhomDaAm.set(t.hanzi, new Map());
      const nhom = nhomDaAm.get(t.hanzi);
      const py = String(t.pinyin).toLowerCase();
      if (!nhom.has(py)) nhom.set(py, t);
    }
    soTuKhiTinh = ds.length;
  }
  return nhomDaAm;
}
/** Các mục từ CÙNG chữ nhưng đọc khác (để ghi "Chữ này còn đọc là …" trên thẻ) */
export function cachDocKhac(tu) {
  const nhom = bangDaAm().get(tu.hanzi);
  if (!nhom || nhom.size < 2) return [];
  return [...nhom.values()].filter((t) => String(t.pinyin).toLowerCase() !== String(tu.pinyin).toLowerCase());
}
/**
 * Chữ để giọng máy đọc khi phát âm một từ. Chữ đa âm đọc riêng thì máy hầu như luôn đọc âm phổ biến
 * (得 → dé dù thẻ là děi) → phát CÂU VÍ DỤ đầu tiên thay cho chữ đứng một mình (bản soát chuyên gia 6.6).
 */
export function tiengDoc(tu) {
  if (!tu) return '';
  return cachDocKhac(tu).length && tu.viDu?.[0]?.han ? tu.viDu[0].han : tu.hanzi;
}
