// =========================================================
// ĐỌC DỮ LIỆU TỪ VỰNG từ data/hsk1.json, data/hsk2.json…
// (tạo bởi cong-cu/ghep-du-lieu-hsk1.py và cong-cu/ghep-du-lieu-cap.py từ danh sách chính thức + phần soạn tay)
// Mã bài: cấp 1 theo chủ đề là SỐ (3); cấp 1 theo sách là 's3'; cấp 2 trở lên là '2-3' (bài 3 của HSK 2,
// chia theo thứ tự bài của sách 《新HSK教程 2》).
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

/** Tải toàn bộ dữ liệu. Ném lỗi có giải thích tiếng Việt nếu file hỏng. */
export async function taiDuLieu() {
  baiHoc = [];
  tuTheoKhoa = {};
  for (const f of CAC_FILE) {
    let phanHoi;
    try {
      phanHoi = await fetch(f.duongDan, { cache: 'no-cache' });
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
      baiHoc.push({ cap: f.cap, so: b.so, ma, ten: b.ten, tu: dsTu, soTu: b.soTu ?? dsTu.length, sach: false });
    }
  }
  if (!baiHoc.length) throw new Error('File dữ liệu không có bài học nào.');
  await taiTheoSach();
  return baiHoc;
}

// ---------- Học "Theo sách" 《新HSK教程 1》 (Giai đoạn 5) ----------
// data/theo-sach-hsk1.json (tạo bởi cong-cu/tao-theo-sach.py): từ nào thuộc bài nào của sách.
// Bài theo chủ đề có mã là SỐ (3); bài theo sách có mã là chuỗi 's3'.
let theoSach = null;       // { bai: [{ so, ten }], tu: { khoa: số bài }, nguPhap: { mã: số bài } }
let baiSach = [];          // [{ ma: 's3', so, ten, tu: [...], sach: true }]

async function taiTheoSach() {
  theoSach = null;
  baiSach = [];
  try {
    const r = await fetch('data/theo-sach-hsk1.json', { cache: 'no-cache' });
    if (!r.ok) return;
    theoSach = await r.json();
    baiSach = theoSach.bai.map((b) => ({
      ma: `s${b.so}`, cap: 1, so: b.so, ten: b.ten, sach: true,
      tu: tatCaTu().filter((t) => theoSach.tu[t.khoa] === b.so),
    })).map((b) => ({ ...b, soTu: b.tu.length }));
  } catch {
    theoSach = null; // không có file → chỉ dùng cách chia theo chủ đề
  }
}

export const coTheoSach = () => !!theoSach;
export const tenSach = () => theoSach?.sach || '';
/** Chế độ chia bài đang dùng: 'sach' hoặc 'chu-de' (đọc từ cài đặt cheDoBai) */
export function cheDoBai(caiDatHienTai) {
  return caiDatHienTai?.cheDoBai === 'sach' && theoSach ? 'sach' : 'chu-de';
}
/**
 * Danh sách bài theo thứ tự học: HSK 1 (theo chủ đề hoặc theo sách) rồi đến HSK 2…
 * cap: chỉ lấy một cấp. Mỗi bài: { ma, cap, so, ten, tu, sach }.
 */
export function danhSachBai(cheDo, cap = null) {
  const cap1 = cheDo === 'sach' && theoSach ? baiSach : baiHoc.filter((b) => b.cap === 1);
  const ds = [...cap1, ...baiHoc.filter((b) => b.cap > 1)];
  return cap ? ds.filter((b) => b.cap === cap) : ds;
}
/** Các cấp đã có dữ liệu: [1, 2] */
export const cacCapCoDuLieu = () => [...new Set(baiHoc.map((b) => b.cap))];
/** Số từ chính thức của một cấp (kể cả từ chưa soạn xong) */
export const tongTuCap = (cap) => baiHoc.filter((b) => b.cap === cap).reduce((s, b) => s + b.soTu, 0);
/** Tìm bài theo mã: 3 (chủ đề), 's3' (sách cấp 1), '2-3' (bài 3 của HSK 2) */
export function timBaiTheoMa(ma) {
  if (typeof ma === 'string' && /^s\d+$/.test(ma)) return baiSach.find((b) => b.ma === ma) || null;
  if (typeof ma === 'string' && /^\d+-\d+$/.test(ma)) return baiHoc.find((b) => b.ma === ma) || null;
  return baiHoc.find((b) => b.cap === 1 && b.so === Number(ma)) || null;
}
/** Đọc mã bài từ địa chỉ (#/bai/3, #/bai/s3, #/bai/2-3) */
export const maBaiTuDiaChi = (chuoi) => (/^(s\d+|\d+-\d+)$/.test(chuoi || '') ? chuoi : Number(chuoi));
/** Mã bài của một từ trong chế độ đang dùng */
export function maBaiCuaTu(tu, cheDo) {
  if (cheDo === 'sach' && theoSach?.tu[tu.khoa]) return `s${theoSach.tu[tu.khoa]}`;
  return tu.maBai;
}
/** Nhãn bài để hiện: "Bài 3", "Bài 3 (sách)" hoặc "HSK 2 · Bài 3" */
export const nhanBai = (b) => (b.sach ? `Bài ${b.so} (sách)` : b.cap > 1 ? `HSK ${b.cap} · Bài ${b.so}` : `Bài ${b.so}`);
/** Bài trong sách của một điểm ngữ pháp (mã điểm → số bài), null nếu chưa gắn */
export const baiSachCuaNguPhap = (ma) => theoSach?.nguPhap?.[ma] ?? null;
/** Bài trong sách của một từ */
export const baiSachCuaTu = (tu) => theoSach?.tu?.[tu.khoa] ?? null;
/** Nhãn bài của một từ theo chế độ: "Bài 3" hoặc "Bài 5 (sách)" */
export function nhanBaiCuaTu(tu, cheDo) {
  const s = cheDo === 'sach' ? baiSachCuaTu(tu) : null;
  return s ? `Bài ${s} (sách)` : `Bài ${tu.bai}`;
}

export const layBaiHoc = () => baiHoc;
export const layTu = (khoa) => tuTheoKhoa[khoa];
export const tatCaTu = () => baiHoc.flatMap((b) => b.tu);
export const timBai = (cap, so) => baiHoc.find((b) => b.cap === cap && b.so === so);

/** Nghĩa ngắn gọn để hiện trong danh sách: "yêu; thích". */
export function nghiaNgan(tu) {
  return (tu.nghia || []).map((n) => n.nghia).join('; ');
}
