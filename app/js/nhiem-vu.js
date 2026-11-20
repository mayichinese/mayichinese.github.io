// =========================================================
// NHIỆM VỤ HẰNG NGÀY (giống "Daily quests" của Duolingo)
//   - Mỗi ngày 3 nhiệm vụ, chọn NGẪU NHIÊN từ 3 trong 4 nhóm khác nhau:
//       số lượng (ôn N thẻ, học N từ…) · thời gian (học N phút…) · dạng bài (hoàn thành N lượt…) · độ chính xác
//   - Chỉ chọn nhiệm vụ làm được với tiến độ hiện tại (vd. chưa đủ 4 từ thì không giao trắc nghiệm).
//   - Số lượng to/nhỏ theo mục tiêu phút mỗi ngày.
//   - Chọn xong thì lưu vào nhật ký ngày (nk.nhiemVu = [{ ma, muc }]) nên trong ngày không đổi.
//   - Tiến độ tính thẳng từ các bộ đếm trong nhật ký (nk.on, nk.moi, nk.luot…), không lưu riêng.
//   - Nhiệm vụ tháng: hoàn thành MUC_THANG nhiệm vụ hằng ngày trong tháng.
// =========================================================

import { layTienDo, nhatKyHomNay, ngayHoc, phutMoiNgay, tongPhutNgay, luu, GIO_BAT_DAU_NGAY } from './luu-tru.js';
import { tatCaTu } from './du-lieu.js';
import { demHomNay, tuChuaHoc } from './phien-hoc.js';
import { coNhanDang } from './nhan-giong.js';

export const MUC_THANG = 50;
const luot = (nk, loai) => nk.luot?.[loai] || 0;

// Mẫu nhiệm vụ. cac: các mức có thể giao · dk(ng): có giao được không (ng = ngữ cảnh hiện tại)
const MAU = [
  // ----- Số lượng -----
  { ma: 'on', nhom: 'so-luong', emoji: '🔁', ten: (n) => `Ôn ${n} thẻ từ vựng`, dem: (nk) => nk.on || 0,
    href: '#/on', cac: [10, 20, 30], dk: (ng) => ng.denHan >= 10, toiDa: (ng) => ng.denHan },
  { ma: 'moi', nhom: 'so-luong', emoji: '✨', ten: (n) => `Học ${n} từ mới`, dem: (nk) => nk.moi || 0,
    href: '#/hoc-moi', cac: [5, 8, 10], dk: (ng) => ng.conTuMoi >= 5, toiDa: (ng) => ng.conTuMoi },
  { ma: 'thanh', nhom: 'so-luong', emoji: '🎧', ten: (n) => `Trả lời ${n} câu thanh điệu`, dem: (nk) => nk.thanh || 0,
    href: '#/thanh-dieu', cac: [10, 20, 30] },
  { ma: 'viet', nhom: 'so-luong', emoji: '✍️', ten: (n) => `Luyện viết ${n} chữ Hán`, dem: (nk) => nk.viet || 0,
    href: '#/luyen-viet/phien', cac: [3, 5, 8] },
  { ma: 'cau-tn', nhom: 'so-luong', emoji: '📝', ten: (n) => `Trả lời ${n} câu trắc nghiệm`, dem: (nk) => nk.tracNghiem || 0,
    href: '#/trac-nghiem/tron', cac: [10, 20, 30], dk: (ng) => ng.daHoc >= 4 },
  { ma: 'noi', nhom: 'so-luong', emoji: '🎤', ten: (n) => `Nói đạt ${n} câu (từ 70 điểm)`, dem: (nk) => nk.noi || 0,
    href: '#/luyen-noi/doc-tu', cac: [5, 10, 15], dk: (ng) => ng.coMic },
  // ----- Thời gian -----
  { ma: 'phut', nhom: 'thoi-gian', emoji: '⏱️', ten: (n) => `Học đủ ${n} phút`, dem: (nk) => tongPhutNgay(nk),
    href: '', cac: (ng) => [Math.max(5, Math.round(ng.mucTieu / 2)), ng.mucTieu] },
  { ma: 'phut-nghe', nhom: 'thoi-gian', emoji: '🎧', ten: (n) => `Luyện nghe & nói ${n} phút`,
    dem: (nk) => Math.floor((nk.giay?.nghe || 0) / 60), href: '#/thanh-dieu', cac: [3, 5, 10] },
  { ma: 'phut-viet', nhom: 'thoi-gian', emoji: '✍️', ten: (n) => `Luyện viết chữ ${n} phút`,
    dem: (nk) => Math.floor((nk.giay?.viet || 0) / 60), href: '#/luyen-viet/phien', cac: [3, 5, 10] },
  // ----- Dạng bài -----
  { ma: 'luot-tn', nhom: 'dang-bai', emoji: '📝', ten: (n) => `Hoàn thành ${n} lượt trắc nghiệm`, dem: (nk) => luot(nk, 'tracNghiem'),
    href: '#/trac-nghiem/tron', cac: [1, 2], dk: (ng) => ng.daHoc >= 4 },
  { ma: 'luot-np', nhom: 'dang-bai', emoji: '🧩', ten: (n) => `Hoàn thành ${n} bài luyện ngữ pháp`, dem: (nk) => luot(nk, 'nguPhap'),
    href: '#/ngu-phap', cac: [1, 2] },
  { ma: 'luot-thanh', nhom: 'dang-bai', emoji: '🎵', ten: (n) => `Hoàn thành ${n} lượt luyện thanh điệu`, dem: (nk) => luot(nk, 'thanh'),
    href: '#/thanh-dieu', cac: [1, 2] },
  { ma: 'luot-pa', nhom: 'dang-bai', emoji: '🔤', ten: (n) => `Hoàn thành ${n} lượt luyện phiên âm`, dem: (nk) => luot(nk, 'phienAm'),
    href: '#/chu-am/luyen/phien-am', cac: [1, 2] },
  { ma: 'luot-bt', nhom: 'dang-bai', emoji: '🧱', ten: (n) => `Hoàn thành ${n} lượt luyện bộ thủ`, dem: (nk) => luot(nk, 'boThu'),
    href: '#/chu-am/luyen/bo-thu', cac: [1] },
  { ma: 'luot-noi', nhom: 'dang-bai', emoji: '🗣️', ten: (n) => `Hoàn thành ${n} lượt luyện nói`, dem: (nk) => luot(nk, 'noi'),
    href: '#/luyen-noi', cac: [1, 2], dk: (ng) => ng.coMic },
  // ----- Độ chính xác -----
  { ma: 'tot', nhom: 'chinh-xac', emoji: '🎯', ten: (n) => `Hoàn thành ${n} lượt đúng từ 80% trở lên`, dem: (nk) => nk.luotTot || 0,
    href: '#/luyen-tap', cac: [1, 2, 3] },
  { ma: 'hoan-hao', nhom: 'chinh-xac', emoji: '💯', ten: () => 'Hoàn thành 1 lượt không sai câu nào', dem: (nk) => nk.luotHoanHao || 0,
    href: '#/luyen-tap', cac: [1] },
];
const MAU_THEO_MA = Object.fromEntries(MAU.map((m) => [m.ma, m]));
// Chủ đề của từng mẫu: 3 nhiệm vụ trong ngày không trùng chủ đề (vd. không giao 2 nhiệm vụ đều về thanh điệu)
const CHU_DE = {
  on: 'on', moi: 'moi', thanh: 'nghe', 'phut-nghe': 'nghe', 'luot-thanh': 'nghe', viet: 'viet', 'phut-viet': 'viet',
  'cau-tn': 'tn', 'luot-tn': 'tn', 'luot-np': 'np', 'luot-pa': 'pa', 'luot-bt': 'bt', noi: 'noi', 'luot-noi': 'noi', phut: 'phut', tot: 'chinh-xac', 'hoan-hao': 'chinh-xac',
};

/** Số ngẫu nhiên "có hạt giống" theo ngày: cùng một ngày luôn ra cùng kết quả */
function taoNgauNhien(chuoi) {
  let h = 2166136261;
  for (const c of chuoi) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function nguCanh() {
  const td = layTienDo();
  const dem = demHomNay();
  return {
    denHan: dem.onDenHan + dem.dangHocDenHan,
    conTuMoi: Math.min(dem.conTuMoi, tuChuaHoc().length),
    daHoc: tatCaTu().filter((t) => td.the[t.khoa]).length,
    mucTieu: phutMoiNgay(),
    coMic: coNhanDang(),   // máy chấm phát âm được thì mới giao nhiệm vụ nói
  };
}

/** Chọn 3 nhiệm vụ cho một ngày */
function chonNhiemVu(khoaNgay) {
  const r = taoNgauNhien(`mayi-${khoaNgay}`);
  const ng = nguCanh();
  const tron = (mang) => mang.map((x) => [r(), x]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  // Mục tiêu ít phút → giao mức nhỏ; nhiều phút → có thể giao mức lớn
  const soMuc = ng.mucTieu <= 10 ? 1 : ng.mucTieu <= 20 ? 2 : 3;
  const ketQua = [];
  const daCoChuDe = new Set();
  for (const nhom of tron(['so-luong', 'thoi-gian', 'dang-bai', 'chinh-xac'])) {
    if (ketQua.length === 3) break;
    const hopLe = MAU.filter((m) => m.nhom === nhom && (!m.dk || m.dk(ng)) && !daCoChuDe.has(CHU_DE[m.ma]));
    if (!hopLe.length) continue;
    const m = hopLe[Math.floor(r() * hopLe.length)];
    let cac = typeof m.cac === 'function' ? m.cac(ng) : m.cac;
    cac = cac.slice(0, soMuc);
    let muc = cac[Math.floor(r() * cac.length)];
    if (m.toiDa) muc = Math.min(muc, Math.max(1, m.toiDa(ng)));
    daCoChuDe.add(CHU_DE[m.ma]);
    ketQua.push({ ma: m.ma, muc });
  }
  return ketQua;
}

/** Nhiệm vụ hôm nay kèm tiến độ: [{ ma, emoji, ten, muc, daLam, xong, href }] */
export function nhiemVuHomNay() {
  const nk = nhatKyHomNay();
  if (!Array.isArray(nk.nhiemVu) || !nk.nhiemVu.length) {
    nk.nhiemVu = chonNhiemVu(ngayHoc());
    luu();
  }
  return nk.nhiemVu.map((x) => moTa(x, nk)).filter(Boolean);
}

function moTa(x, nk) {
  const m = MAU_THEO_MA[x.ma];
  if (!m) return null;
  const daLam = Math.min(x.muc, m.dem(nk));
  return { ma: m.ma, emoji: m.emoji, ten: m.ten(x.muc), muc: x.muc, daLam, xong: daLam >= x.muc, href: m.href };
}

/** Nhiệm vụ tháng: số nhiệm vụ hằng ngày đã xong trong tháng này */
export function nhiemVuThang() {
  const khoa = ngayHoc().slice(0, 7);   // "2026-11"
  let xong = 0;
  for (const [ngay, nk] of Object.entries(layTienDo().nhatKy)) {
    if (!ngay.startsWith(khoa) || !Array.isArray(nk.nhiemVu)) continue;
    xong += nk.nhiemVu.map((x) => moTa(x, nk)).filter((x) => x?.xong).length;
  }
  return { thang: Number(khoa.slice(5)), xong: Math.min(xong, MUC_THANG), muc: MUC_THANG };
}

/** Số giờ còn lại đến khi đổi nhiệm vụ (ngày học mới bắt đầu lúc 4 giờ sáng) */
export function gioConLai() {
  const moc = new Date();
  if (moc.getHours() >= GIO_BAT_DAU_NGAY) moc.setDate(moc.getDate() + 1);
  moc.setHours(GIO_BAT_DAU_NGAY, 0, 0, 0);
  return Math.max(1, Math.ceil((moc - Date.now()) / 3600000));
}
