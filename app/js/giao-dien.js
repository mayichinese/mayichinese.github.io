// =========================================================
// CÔNG CỤ GIAO DIỆN DÙNG CHUNG cho mọi màn hình:
//   - esc, boDau        : xử lý chữ an toàn
//   - thongBao          : thông báo nhỏ hiện lên rồi tự ẩn
//   - datTieuDe         : chữ trên thanh trên cùng + nút quay lại
//   - apDungGiaoDien    : sáng / tối
//   - nutLoa, oChuDien, htmlMatSau, dongTu : các mảnh giao diện dùng lại
// Mỗi màn hình nằm ở một file riêng: man-*.js
// =========================================================

import { caiDat, luu, layTienDo, nhatKyHomNay, congGiay, phutMoiNgay } from './luu-tru.js';
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
  // Tô màu pinyin theo thanh điệu (tắt được trong Cài đặt)
  document.body.classList.toggle('khong-mau-thanh', !!caiDat().tatMauThanh);
}

/** Chú thích màu thanh điệu: mā thanh 1 · má thanh 2 · … */
export const CHU_THICH_MAU_THANH = `
  <div class="chu-thich-mau-thanh">
    <span><b class="t1">mā</b> thanh 1 (ngang)</span><span><b class="t2">má</b> thanh 2 (lên)</span>
    <span><b class="t3">mǎ</b> thanh 3 (xuống–lên)</span><span><b class="t4">mà</b> thanh 4 (xuống)</span>
    <span><b class="t0">ma</b> thanh nhẹ</span>
  </div>`;

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

// ---------- Đồng hồ tính phút học (thanh trên cùng) ----------
/**
 * Bắt đầu đếm giờ cho một phần học ('on' | 'moi' | 'viet' | 'nghe').
 * Chỉ đếm khi trang đang mở và có thao tác (chạm/bấm phím) trong 90 giây gần nhất.
 * @returns {Function} hàm dừng đồng hồ (gọi khi xong phiên hoặc rời màn hình)
 */
export function batDongHo(phan) {
  // Đồng hồ hiện TỔNG thời gian học hôm nay so với mục tiêu mỗi ngày (người học tự chọn);
  // giây vẫn được ghi riêng cho từng phần để vẽ biểu đồ ở mục Tôi.
  const mucTieu = phutMoiNgay();
  const $dongHo = document.getElementById('dong-ho');
  let lanTuongTac = Date.now();
  let demLuu = 0;
  const tongGiay = () => Object.values(nhatKyHomNay().giay).reduce((a, b) => a + b, 0);
  const veDongHo = () => {
    const giay = tongGiay();
    $dongHo.textContent = `⏱ ${Math.floor(giay / 60)}:${String(giay % 60).padStart(2, '0')} / ${mucTieu}′`;
  };
  const chamVao = () => { lanTuongTac = Date.now(); };
  const henGioDem = setInterval(() => {
    if (document.visibilityState !== 'visible' || Date.now() - lanTuongTac > 90000) return;
    congGiay(phan, 1);
    if (++demLuu % 10 === 0) luu();
    veDongHo();
    if (tongGiay() === mucTieu * 60) {
      thongBao(`🎉 Đã đạt mục tiêu ${mucTieu} phút hôm nay! Học thêm cũng tốt, hoặc nghỉ ngơi nhé.`, 4500);
    }
  }, 1000);
  document.addEventListener('keydown', chamVao);
  document.addEventListener('pointerdown', chamVao);
  $dongHo.hidden = false;
  veDongHo();
  let daDung = false;
  return () => {
    if (daDung) return;
    daDung = true;
    clearInterval(henGioDem);
    document.removeEventListener('keydown', chamVao);
    document.removeEventListener('pointerdown', chamVao);
    $dongHo.hidden = true;
    luu();
  };
}

// ---------- Hộp thoại (bảng trượt từ dưới lên) ----------
let khiDongHop = null;
/** Mở hộp thoại với nội dung HTML. Trả về phần tử hộp thoại. `khiDong`: chạy khi đóng. */
export function moHopThoai(html, khiDong = null) {
  dongHopThoai();
  const lopPhu = document.getElementById('lop-phu');
  lopPhu.innerHTML = `<div class="hop-thoai" role="dialog" aria-modal="true">${html}</div>`;
  lopPhu.hidden = false;
  lopPhu.onclick = (e) => {
    if (e.target === lopPhu || e.target.closest('[data-dong]')) dongHopThoai();
  };
  khiDongHop = khiDong;
  return lopPhu.firstElementChild;
}
export function dongHopThoai() {
  const lopPhu = document.getElementById('lop-phu');
  if (!lopPhu || lopPhu.hidden) return;
  lopPhu.hidden = true;
  lopPhu.innerHTML = '';
  const f = khiDongHop;
  khiDongHop = null;
  if (f) f();
}
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') dongHopThoai(); });

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
      <div class="chan-mat-sau">
        <button class="nut nut-nho" data-cach-viet="${esc(tu.hanzi)}"><span class="emoji">✍️</span> Cách viết</button>
        <a class="lien-ket-ngoai" href="https://hanzii.net/search/word/${encodeURIComponent(tu.hanzi)}?hl=vi" target="_blank" rel="noopener">Tra thêm trên Hanzii ↗</a>
      </div>
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
