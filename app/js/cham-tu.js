// =========================================================
// CHẠM TỪ XEM NGHĨA – trong mọi câu ví dụ (thẻ từ, ngữ pháp, chặng bài học)
//   tachTu(cau)            tách câu thành các đoạn { chu, tu? } theo từ điển HSK 1–3 (khớp dài nhất, tối đa 4 chữ)
//   htmlCauCham(cau, tuyChon) câu chữ Hán, mỗi từ HSK là một nút nhỏ (data-xem-tu); từ CHƯA HỌC có gạch chân chấm
//   moXemTu(khoa)          bảng nhỏ: chữ, pinyin, nghĩa, Hán Việt, trạng thái + "Xem đầy đủ" (gọi từ app.js)
// =========================================================

import { tatCaTu, layTu, nghiaNgan } from './du-lieu.js';
import { layTienDo } from './luu-tru.js';
import { loaiThe } from './lich-on.js';
import { esc, moHopThoai, nutLoa } from './giao-dien.js';
import { toMauPinyin, toMauChuHan, demChuHan } from './pinyin.js';

let tuDien = null;          // chữ Hán của từ → từ (lấy từ đầu tiên nếu trùng mặt chữ)
let soLuongTu = 0;
function layTuDien() {
  const ds = tatCaTu();
  if (!tuDien || ds.length !== soLuongTu) {
    tuDien = new Map();
    for (const t of ds) if (!tuDien.has(t.hanzi)) tuDien.set(t.hanzi, t);
    soLuongTu = ds.length;
  }
  return tuDien;
}

const LA_HAN = /\p{Script=Han}/u;

/**
 * Tách câu thành các đoạn theo thứ tự: { chu, tu } – tu là từ HSK (nếu có), đoạn không phải chữ Hán giữ nguyên.
 * Khớp dài nhất (tối đa 4 chữ); chữ lẻ không có trong từ điển → { chu, tu: null }.
 */
export function tachTu(cau) {
  const td = layTuDien();
  const chu = [...String(cau)];
  const ds = [];
  for (let i = 0; i < chu.length;) {
    if (!LA_HAN.test(chu[i])) {
      let j = i;
      while (j < chu.length && !LA_HAN.test(chu[j])) j++;
      ds.push({ chu: chu.slice(i, j).join(''), tu: null, han: false });
      i = j;
      continue;
    }
    let l = 4;
    while (l > 1 && !(i + l <= chu.length && chu.slice(i, i + l).every((c) => LA_HAN.test(c)) && td.has(chu.slice(i, i + l).join('')))) l--;
    const doan = chu.slice(i, i + l).join('');
    ds.push({ chu: doan, tu: td.get(doan) || null, han: true });
    i += l;
  }
  return ds;
}

/** Câu chỉ toàn từ đã học? (chữ lẻ không có trong từ điển – tên riêng… – không tính) */
export function cauDaBiet(cau) {
  const the = layTienDo().the;
  return tachTu(cau).every((d) => !d.tu || the[d.tu.khoa]);
}

/**
 * HTML của câu, mỗi từ HSK chạm được để xem nghĩa.
 * @param tuyChon.danh      chữ Hán của từ đang học → tô đậm (<mark>)
 * @param tuyChon.chiChuaHoc chỉ cho chạm từ CHƯA học (dùng khi câu đang là câu hỏi – không lộ đáp án)
 */
export function htmlCauCham(cau, { danh = '', chiChuaHoc = false } = {}) {
  const the = layTienDo().the;
  // tách riêng từ đang học để tô đậm đúng chỗ (kể cả khi từ điển khớp thành từ dài hơn)
  const phan = danh ? String(cau).split(danh) : [String(cau)];
  return phan.map((p, i) => {
    const html = tachTu(p).map((d) => {
      if (!d.han || !d.tu) return esc(d.chu);
      const chuaHoc = !the[d.tu.khoa];
      if (chiChuaHoc && !chuaHoc) return esc(d.chu);
      return `<button type="button" class="tu-cham ${chuaHoc ? 'chua-hoc' : ''}" data-xem-tu="${esc(d.tu.khoa)}">${esc(d.chu)}</button>`;
    }).join('');
    if (i === 0) return html;
    const tuDanh = layTuDien().get(danh);
    const mark = tuDanh && !chiChuaHoc
      ? `<mark><button type="button" class="tu-cham" data-xem-tu="${esc(tuDanh.khoa)}">${esc(danh)}</button></mark>`
      : `<mark>${esc(danh)}</mark>`;
    return mark + html;
  }).join('');
}

/** Bảng nhỏ xem nhanh một từ */
export function moXemTu(khoa) {
  const t = layTu(khoa);
  if (!t) return;
  const the = layTienDo().the[khoa];
  const trangThai = { 'chua-hoc': 'Chưa học', 'dang-hoc': 'Đang học', 'dang-on': 'Đang ôn', 'da-thuoc': 'Đã thuộc chắc' }[loaiThe(the)];
  moHopThoai(`
    <div class="dau-hop">
      <h2 class="han">${toMauChuHan(t.hanzi, t.pinyin)}</h2>
      <button class="nut-bieu-tuong" data-dong aria-label="Đóng">✕</button>
    </div>
    <div class="dong-xem-tu">
      <span class="pinyin pinyin-to">${toMauPinyin(t.pinyin, demChuHan(t.hanzi))}</span>
      ${nutLoa(t.hanzi, true)}
    </div>
    ${t.hanViet ? `<p class="chu-phu" style="margin:4px 0 0">Hán Việt: <b>${esc(t.hanViet)}</b></p>` : ''}
    <p style="margin:8px 0 0;font-weight:700">${esc(nghiaNgan(t))}</p>
    <p class="chu-phu nho" style="margin:8px 0 0">HSK ${t.cap} · ${trangThai}${the ? '' : ' – từ này sẽ học ở bài sau'}</p>
    <a class="nut nut-rong" href="#/tu/${encodeURIComponent(khoa)}" style="margin-top:12px">Xem đầy đủ →</a>`);
}
