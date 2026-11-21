// =========================================================
// MỞ KHÓA CẤP HSK DẦN DẦN (giống "Phần" của Duolingo)
//   - HSK 1 luôn mở.
//   - HSK N mở khi cấp N−1 đã mở VÀ một trong các điều kiện:
//       ① đã học hết mọi từ của cấp N−1, hoặc
//       ② "học vượt": thi thử HSK N−1 từ 70% tổng điểm VÀ không phần nào dưới 60 (bản soát chuyên gia 6.8;
//          mức "đạt" của bài thi thử vẫn là 60%), hoặc
//       ③ đã học từ của cấp N từ trước (bản cũ cho chọn cấp tự do – không khóa lại tiến độ đã có).
//   - Cấp đã mở được ghi vào tienDo.capDaMo nên không bị khóa lại (kể cả khi lịch sử thi cũ bị xóa bớt).
// =========================================================

import { layTienDo, luu } from './luu-tru.js';
import { tatCaTu, cacCapCoDuLieu } from './du-lieu.js';
import { datHocVuot, moTaHocVuot } from './man-thi-thu.js';

/** Đã có lần thi thử của một cấp đủ điều kiện học vượt chưa */
export function daDatThiThu(cap) {
  return (layTienDo().thiThu || []).some((x) => (x.cap || 1) === cap && datHocVuot(x));
}

/** Số từ của một cấp chưa học */
export function soTuChuaHoc(cap) {
  const the = layTienDo().the;
  return tatCaTu().filter((t) => t.cap === cap && !the[t.khoa]).length;
}

/** Danh sách cấp đã mở, ví dụ [1, 2]. Tự ghi thêm cấp vừa đủ điều kiện. */
let vuaMo = [];
export function capDaMo() {
  const td = layTienDo();
  const mo = new Set(td.capDaMo || [1]);
  mo.add(1);
  const the = td.the;
  for (const cap of cacCapCoDuLieu().sort()) {
    if (cap === 1 || mo.has(cap)) continue;
    const truoc = cap - 1;
    if (!mo.has(truoc)) break;
    const duDieuKien = soTuChuaHoc(truoc) === 0 || daDatThiThu(truoc)
      || tatCaTu().some((t) => t.cap === cap && the[t.khoa]);
    if (!duDieuKien) break;
    mo.add(cap);
    vuaMo.push(cap);
  }
  const ds = [...mo].sort();
  if (ds.length !== (td.capDaMo || []).length) { td.capDaMo = ds; luu(); }
  return ds;
}

export const capMo = (cap) => capDaMo().includes(cap);
/** Cấp cao nhất đã mở (= trình độ hiện tại) */
export const capHienTai = () => Math.max(...capDaMo());

/** Lấy (và xóa) danh sách cấp vừa mở khóa – để hiện lời chúc mừng một lần */
export function layCapVuaMo() {
  capDaMo();
  const ds = vuaMo;
  vuaMo = [];
  return ds;
}

/** Khung HTML giải thích cách mở khóa một cấp */
export function htmlCachMoKhoa(cap) {
  const truoc = cap - 1;
  if (!capMo(truoc)) {
    return `<div class="khung the-khoa"><span class="emoji khoa-to">🔒</span>
      <b>HSK ${cap} đang khóa</b>
      <p class="chu-phu nho">Hãy mở khóa HSK ${truoc} trước.</p></div>`;
  }
  const con = soTuChuaHoc(truoc);
  return `
    <div class="khung the-khoa">
      <span class="emoji khoa-to">🔒</span>
      <b>HSK ${cap} đang khóa</b>
      <p class="chu-phu nho" style="margin:0">Mở khóa bằng một trong hai cách:</p>
      <ol class="cach-mo-khoa">
        <li><b>Học hết HSK ${truoc}</b> – còn <b>${con}</b> từ chưa học.</li>
        <li><b>Học vượt:</b> làm bài thi thử HSK ${truoc} và đạt <b>${moTaHocVuot(truoc)}</b>.</li>
      </ol>
      <a class="nut nut-chinh nut-rong" href="#/thi-thu/cap/${truoc}">📋 Thi thử HSK ${truoc} để học vượt</a>
    </div>`;
}
