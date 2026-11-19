// =========================================================
// CÔNG CỤ GIAO DIỆN DÙNG CHUNG cho mọi màn hình:
//   - esc, boDau        : xử lý chữ an toàn
//   - thongBao          : thông báo nhỏ hiện lên rồi tự ẩn
//   - datTieuDe         : chữ trên thanh trên cùng + nút quay lại
//   - apDungGiaoDien    : sáng / tối
//   - nutLoa, oChuDien, htmlMatSau, dongTu : các mảnh giao diện dùng lại
// Mỗi màn hình nằm ở một file riêng: man-*.js
// =========================================================

import { caiDat, luu, layTienDo } from './luu-tru.js';
import { TEN_TU_LOAI, nghiaNgan } from './du-lieu.js';
import { loaiThe } from './lich-on.js';
import { bieuTuong } from './bieu-tuong.js';
import { toMauPinyin, toMauChuHan, demChuHan } from './pinyin.js';

// ---------- Tiện ích chữ ----------
/** Chống lỗi hiển thị khi dữ liệu có ký tự đặc biệt như < > & " */
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
/** Bỏ dấu tiếng Việt / pinyin để tìm kiếm: "Hán Việt" → "han viet" */
export const boDau = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase();

// ---------- Thông báo ----------
let henGio;
export function thongBao(chu, thoiGian = 2600) {
  const el = document.getElementById('thong-bao');
  el.textContent = chu;
  el.classList.add('hien');
  clearTimeout(henGio);
  henGio = setTimeout(() => el.classList.remove('hien'), thoiGian);
}

// ---------- Thanh trên cùng ----------
/** Đổi chữ trên thanh trên cùng; nếu có `quayLai` (địa chỉ #/...) thì hiện nút mũi tên quay lại. */
export function datTieuDe(chu, quayLai = '') {
  document.getElementById('tieu-de-man-hinh').textContent = chu;
  document.title = chu === 'Mayi Chinese' ? chu : `${chu} · Mayi Chinese`;
  const nut = document.getElementById('nut-quay-lai');
  nut.classList.toggle('an', !quayLai);
  nut.onclick = quayLai ? () => { location.hash = quayLai; } : null;
  document.querySelector('.thanh-tren .logo-nho').classList.toggle('an', !!quayLai);
}

// ---------- Sáng / tối ----------
const truyVanToi = window.matchMedia('(prefers-color-scheme: dark)');

/** Áp dụng chế độ sáng/tối theo cài đặt ('tu-dong' = theo máy). */
export function apDungGiaoDien() {
  const cheDo = caiDat().cheDo || 'tu-dong';
  const toi = cheDo === 'toi' || (cheDo === 'tu-dong' && truyVanToi.matches);
  document.documentElement.dataset.giaoDien = toi ? 'toi' : 'sang';
  // màu thanh trạng thái của điện thoại
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', toi ? '#141010' : '#b81f1a');
  // Đang sáng thì hiện mặt trăng (bấm để tối) và ngược lại
  const nut = document.getElementById('nut-sang-toi');
  if (nut) nut.innerHTML = bieuTuong(toi ? 'mat-troi' : 'mat-trang');
}

/** Nút trên thanh trên cùng: chuyển nhanh giữa sáng và tối. */
export function doiSangToi() {
  const dangToi = document.documentElement.dataset.giaoDien === 'toi';
  caiDat().cheDo = dangToi ? 'sang' : 'toi';
  luu();
  apDungGiaoDien();
  thongBao(dangToi ? 'Giao diện sáng (đổi về "Theo máy" trong Cài đặt)' : 'Giao diện tối (đổi về "Theo máy" trong Cài đặt)');
}

// Máy đổi sáng/tối (vd. tự tối buổi tối) → app đổi theo nếu đang để "Theo máy"
truyVanToi.addEventListener?.('change', apDungGiaoDien);

// ---------- Các mảnh giao diện dùng lại ----------
/** Nút loa: bấm để nghe đọc `chu` (xử lý chung trong app.js qua thuộc tính data-doc) */
export function nutLoa(chu, nho = false) {
  return `<button class="nut-loa ${nho ? 'nho' : ''}" data-doc="${esc(chu)}" aria-label="Nghe phát âm" title="Nghe">${bieuTuong('loa')}</button>`;
}

/** Chữ Hán đặt trong ô chữ điền (ô vuông có đường kẻ như vở tập viết) */
export function oChuDien(hanzi) {
  const chu = [...hanzi];
  return `<div class="hang-o-chu so-chu-${Math.min(chu.length, 4)}">
    ${chu.map((c) => `<span class="o-chu han">${esc(c)}</span>`).join('')}
  </div>`;
}

/** Tên tiếng Việt của từ loại ("动" → "động từ") */
export const tenTuLoai = (kyHieu) => TEN_TU_LOAI[kyHieu] || kyHieu || '';

/** Mặt sau của thẻ (dùng cho flashcard và trang xem từ) */
export function htmlMatSau(tu) {
  // tô đậm từ đang học trong câu ví dụ
  const toSang = (cau) => esc(cau).split(esc(tu.hanzi)).join(`<mark>${esc(tu.hanzi)}</mark>`);
  const nghia = (tu.nghia || []).map((n, i) => {
    const viDu = (tu.viDu || []).filter((v) => (v.nghiaSo ?? 0) === i);
    return `
      <div class="nghia">
        <div class="dong-nghia">
          ${n.tuLoai ? `<span class="nhan nhan-chinh">${esc(tenTuLoai(n.tuLoai))}</span>` : ''}
          <span>${esc(n.nghia)}</span>
        </div>
        ${viDu.map((v) => `
          <div class="vi-du">
            <div class="vi-du-chu">
              <p class="han vi-du-han">${toSang(v.han)}</p>
              <p class="pinyin vi-du-pinyin">${toMauPinyin(v.pinyin)}</p>
              <p class="vi-du-dich">${esc(v.dich)}</p>
            </div>
            ${nutLoa(v.han, true)}
          </div>`).join('')}
      </div>`;
  }).join('');
  const ghiChu = (tu.ghiChu || []).length
    ? `<div class="ghi-chu"><span class="emoji">💡</span><div><b>Ghi chú</b>
         <ul>${tu.ghiChu.map((g) => `<li>${esc(g)}</li>`).join('')}</ul></div></div>`
    : '';
  const kiemTra = (tu.canKiemTra || []).length
    ? `<div class="can-kiem-tra">⚠️ Cần kiểm tra: ${tu.canKiemTra.map((k) => esc(k.lyDo)).join('; ')}</div>` : '';
  return `
    <div class="mat-sau">
      <div class="dau-mat-sau">
        <div class="han chu-han-vua">${toMauChuHan(tu.hanzi, tu.pinyin)}</div>
        ${nutLoa(tu.hanzi)}
      </div>
      <div class="pinyin pinyin-to">${toMauPinyin(tu.pinyin, demChuHan(tu.hanzi))}</div>
      ${tu.hanViet ? `<div class="han-viet"><span>Hán Việt</span><b>${esc(tu.hanViet)}</b></div>` : ''}
      ${nghia}
      ${ghiChu}
      ${kiemTra}
      <a class="lien-ket-ngoai" href="https://hanzii.net/search/word/${encodeURIComponent(tu.hanzi)}?hl=vi" target="_blank" rel="noopener">Tra thêm trên Hanzii ↗</a>
    </div>`;
}

/** Một dòng từ trong danh sách (bài học, tìm kiếm, cài đặt) */
export function dongTu(t) {
  const loai = loaiThe(layTienDo().the[t.khoa]);
  return `
    <a class="dong-tu" href="#/tu/${encodeURIComponent(t.khoa)}">
      <span class="cham ${loai}"></span>
      <span class="han">${esc(t.hanzi)}</span>
      <span class="giua">
        <div class="pinyin py">${toMauPinyin(t.pinyin, demChuHan(t.hanzi))} <span class="chu-phu">· ${esc(t.hanViet || '')}</span>${(t.canKiemTra || []).length ? ' ⚠️' : ''}</div>
        <div class="ng">${esc(nghiaNgan(t))}</div>
      </span>
    </a>`;
}

export const CHU_THICH_CHAM = `
  <div class="chu-thich-cham">
    <span><i class="cham"></i>chưa học</span><span><i class="cham dang-hoc"></i>đang học</span>
    <span><i class="cham dang-on"></i>đang ôn</span><span><i class="cham da-thuoc"></i>thuộc chắc (≥ 21 ngày)</span>
  </div>`;
