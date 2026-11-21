// =========================================================
// LỘ TRÌNH GAME HÓA (2026-11-21, theo đánh giá tester + duyệt của người dùng)
//   - Chặng mở theo thứ tự: chặng đầu của cấp đã mở; chặng sau mở khi chặng trước QUA KIỂM TRA (≥ 80%).
//     Chặng đã có tiến độ (đã học từ / đã làm cửa / đã kiểm tra) thì không bao giờ bị khóa lại.
//   - Kiểm tra cuối chặng (man-kiem-tra.js): 15 câu từ + ngữ pháp, kết quả ở tienDo.kiemTraChang[mã] = { tot, lan, luc, dat, nhay }.
//     "Nhảy chặng": làm kiểm tra gộp các chặng bị bỏ qua; đạt thì các chặng đó được ghi dat + nhay (không có sao).
//   - Sao: ⭐ qua kiểm tra · ⭐⭐ thêm xong ngữ pháp + đọc hiểu của chặng · ⭐⭐⭐ thêm kiểm tra đạt 100%.
// Chỉ ĐỌC/GHI tiến độ; giao diện ở man-bai-hoc.js (đường đi), man-kiem-tra.js (bài kiểm tra).
// =========================================================

import { layTienDo, luu } from './luu-tru.js';
import { danhSachBai, cheDoBai, baiSachCuaNguPhap, cacCapCoDuLieu, tatCaTu } from './du-lieu.js';
import { trangThaiCacChang, cuaTiepTheo } from './man-chang.js';
import { capMo } from './cap-do.js';

export const DIEM_QUA_KIEM_TRA = 80;   // % đúng để qua kiểm tra chặng
export const SO_CAU_KIEM_TRA = 15;

/** Các chặng (bài sách có từ) của một cấp, theo thứ tự */
export const cacChang = (cap) => danhSachBai(cheDoBai(), cap).filter((b) => b.sach && b.tu.length);

export const ketQuaKiemTra = (ma) => layTienDo().kiemTraChang?.[ma] || null;
export const daQuaKiemTra = (ma) => !!ketQuaKiemTra(ma)?.dat;

/** Chặng đã có tiến độ nào chưa (để không khóa lại) */
export function coTienDo(b) {
  const td = layTienDo();
  return b.tu.some((t) => td.the[t.khoa])
    || Object.keys(td.cua || {}).some((k) => k.startsWith(`${b.ma}/`))
    || (td.chang?.[b.ma] || []).length > 0
    || !!ketQuaKiemTra(b.ma);
}

/**
 * Đã xong (hoặc bỏ qua) mục Nhập môn chưa. Người đã có tiến độ HSK 1 / đã mở HSK 2 từ trước được coi là xong.
 * Nhập môn chưa xong → Chặng 1 của HSK 1 còn khóa (man-nhap-mon.js).
 */
export function nhapMonXong() {
  const td = layTienDo();
  if (td.nhapMon?.xong || td.nhapMon?.boQua) return true;
  return tatCaTu().some((t) => t.cap === 1 && td.the[t.khoa]) || capMo(2);
}

/** Đã xong mọi phần từ vựng của chặng chưa */
export const xongTuVung = (b) => trangThaiCacChang(b).every((c) => !c.tu.length || c.xong);

/**
 * Trạng thái mọi chặng của một cấp: [{ b, mo, xongTu, dat, kt }]
 * mo: cấp đã mở VÀ (chặng đầu, hoặc chặng trước đã qua kiểm tra, hoặc chặng này đã có tiến độ)
 */
export function trangThaiLoTrinh(cap) {
  const ds = cacChang(cap);
  const capDaMo = capMo(cap);
  return ds.map((b, i) => {
    const kt = ketQuaKiemTra(b.ma);
    return {
      b, kt, dat: !!kt?.dat,
      mo: capDaMo && ((i === 0 && (cap !== 1 || nhapMonXong())) || (i > 0 && daQuaKiemTra(ds[i - 1].ma)) || coTienDo(b)),
      xongTu: xongTuVung(b),
    };
  });
}

/** Chặng có mở không (dùng để chặn vào thẳng bằng địa chỉ) */
export function changMo(b) {
  if (!b?.sach) return true;
  const x = trangThaiLoTrinh(b.cap).find((c) => c.b.ma === b.ma);
  return x ? x.mo : true;
}

/** Điểm ngữ pháp của một chặng (danh sách điểm từ taiNguPhap()) */
export function diemNguPhapCuaChang(b, tatCaDiem) {
  return (tatCaDiem || []).filter((d) => (b.cap > 1 ? d.cap === b.cap && d.bai === b.so
    : d.cap === 1 && baiSachCuaNguPhap(d.id) === b.so));
}

/**
 * Số sao của chặng (0–3). Cần dữ liệu ngữ pháp (taiNguPhap) và đọc hiểu (taiDocHieu) đã tải.
 * Chặng chỉ "nhảy qua" (chưa làm kiểm tra thật) → 0 sao.
 */
export function saoCuaChang(b, tatCaDiem, tatCaDoc) {
  const kt = ketQuaKiemTra(b.ma);
  if (!kt?.dat || !(kt.tot >= DIEM_QUA_KIEM_TRA)) return 0;
  const td = layTienDo();
  const npXong = diemNguPhapCuaChang(b, tatCaDiem).every((d) => td.nguPhap.the[d.id]);
  const dhXong = !tatCaDoc?.[b.ma] || (td.docHieu?.[b.ma]?.tot || 0) >= 80;
  if (!npXong || !dhXong) return 1;
  return kt.tot >= 100 ? 3 : 2;
}

/**
 * Ghi kết quả kiểm tra.
 * @param {string[]} cacMa  mã chặng (một chặng; hoặc các chặng bị nhảy qua)
 * @param {number} phanTram % đúng
 * @param {boolean} nhay    kiểm tra nhảy chặng (không ghi điểm, chỉ ghi qua/không)
 */
export function ghiKiemTra(cacMa, phanTram, nhay = false) {
  const td = layTienDo();
  td.kiemTraChang = td.kiemTraChang || {};
  const dat = phanTram >= DIEM_QUA_KIEM_TRA;
  for (const ma of cacMa) {
    const cu = td.kiemTraChang[ma] || {};
    if (nhay) {
      if (dat && !cu.dat) td.kiemTraChang[ma] = { ...cu, dat: true, nhay: true, luc: Date.now() };
      continue;
    }
    td.kiemTraChang[ma] = {
      tot: Math.max(cu.tot || 0, phanTram), lan: (cu.lan || 0) + 1, luc: Date.now(),
      dat: !!cu.dat || dat, nhay: !!cu.nhay && !dat && !(cu.tot >= DIEM_QUA_KIEM_TRA),
    };
  }
  luu();
}

/** Các chặng sẽ được nhảy qua nếu muốn mở chặng `b`: chặng liền trước chưa qua kiểm tra, tính lùi tới chặng đã qua */
export function changBiNhayQua(b) {
  const ds = cacChang(b.cap);
  const i = ds.findIndex((x) => x.ma === b.ma);
  const kq = [];
  for (let j = i - 1; j >= 0 && !daQuaKiemTra(ds[j].ma); j--) kq.unshift(ds[j]);
  return kq;
}

/**
 * Việc nên làm tiếp trên lộ trình (cho "Học tiếp" và nút Tiếp tục ở trang Hôm nay):
 * cửa chưa xong đầu tiên của chặng đang mở → nếu chặng đã xong từ mà chưa qua kiểm tra thì làm kiểm tra.
 * @returns {{ href, chu, b } | null}
 */
export function viecTiepTheo() {
  if (!nhapMonXong()) return { href: '#/nhap-mon/tiep', chu: 'Nhập môn', nhapMon: true, b: null };
  for (const cap of cacCapCoDuLieu().sort((a, b) => a - b)) {
    if (!capMo(cap)) continue;
    for (const x of trangThaiLoTrinh(cap)) {
      if (!x.mo) break;
      const tiep = cuaTiepTheo(x.b);
      if (tiep) return { href: `#/cua/${x.b.ma}/${tiep.phan}/${tiep.cua}`, chu: 'Học tiếp', b: x.b };
      if (!x.dat) return { href: `#/kiem-tra/${x.b.ma}`, chu: 'Kiểm tra', b: x.b, kiemTra: true };
    }
  }
  return null;
}
