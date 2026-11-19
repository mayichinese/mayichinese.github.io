// =========================================================
// BÀI HỌC
//   #/bai          2 ô lớn (Ôn tập / Từ mới) + chọn cấp + chọn cách chia bài + lưới các bài + tìm từ
//   #/bai/5        chi tiết bài 5 theo chủ đề        #/bai/s5  chi tiết bài 5 của sách 《新HSK教程 1》
//   #/tu/<khóa>    xem một từ
// Cách chia bài (lưu ở caiDat.cheDoBai): 'chu-de' = 20 bài theo chủ đề, 'sach' = 15 bài theo sách.
// Tiến độ lưu theo TỪNG TỪ nên đổi cách chia không ảnh hưởng tiến độ.
// =========================================================

import { layTienDo, caiDat, luu } from './luu-tru.js';
import { loaiThe } from './lich-on.js';
import {
  layTu, tatCaTu, nghiaNgan, danhSachBai, timBaiTheoMa, cheDoBai, coTheoSach, tenSach,
  nhanBai, baiSachCuaTu, baiSachCuaNguPhap,
} from './du-lieu.js';
import { demHomNay, tuChuaHoc } from './phien-hoc.js';
import { esc, boDau, htmlMatSau, dongTu, CHU_THICH_CHAM } from './giao-dien.js';
import { taiNguPhap } from './man-ngu-phap.js';

// ---------- Danh sách bài ----------
export function veDanhSachBai(khung) {
  const td = layTienDo();
  const cd = caiDat();
  const dem = demHomNay();
  const soCanOn = dem.onDenHan + dem.dangHocDenHan;
  const soChuaHoc = tuChuaHoc().length;
  const cheDo = cheDoBai(cd);

  // Cấp chưa có dữ liệu thì khóa lại
  const chipCap = [1, 2, 3].map((c) => (c === 1
    ? '<span class="chip dang-chon">HSK 1</span>'
    : `<button class="chip" disabled title="Sắp có">HSK ${c} <span class="emoji">🔒</span></button>`)).join('');

  const chipCheDo = coTheoSach() ? `
    <div class="nhom-chon chon-che-do-bai" id="chon-che-do">
      <button data-che-do="chu-de" class="${cheDo === 'chu-de' ? 'dang-chon' : ''}">🗂️ Chủ đề · 20 bài</button>
      <button data-che-do="sach" class="${cheDo === 'sach' ? 'dang-chon' : ''}">📖 Theo sách · 15 bài</button>
    </div>
    ${cheDo === 'sach' ? `<p class="chu-phu nho" style="margin:6px 2px 0">Theo thứ tự bài của ${esc(tenSach())}. Đổi cách chia không ảnh hưởng tiến độ.</p>` : ''}` : '';

  const htmlLuoi = () => danhSachBai(cheDo).map((b) => {
    const daHoc = b.tu.filter((t) => td.the[t.khoa]).length;
    const thuoc = b.tu.filter((t) => loaiThe(td.the[t.khoa]) === 'da-thuoc').length;
    const phanTram = b.tu.length ? Math.round((daHoc / b.tu.length) * 100) : 0;
    return `
      <a class="o-bai ${phanTram === 100 ? 'xong' : ''}" href="#/bai/${b.ma}">
        <span class="so-bai">${nhanBai(b)}${phanTram === 100 ? ' <span class="emoji">✅</span>' : ''}</span>
        <span class="xem-truoc han">${b.tu[0] ? esc(b.tu[0].hanzi) : ''}</span>
        <span class="ten-bai">${esc(b.ten)}</span>
        <span class="thanh-tien-do"><span style="width:${phanTram}%"></span></span>
        <span class="chu-phu nho">${daHoc}/${b.tu.length} từ${thuoc ? ` · thuộc ${thuoc}` : ''}</span>
      </a>`;
  }).join('');

  khung.innerHTML = `
    <div class="hai-o">
      <a class="o-lon khung phan-on" href="#/on">
        <span class="o-emoji emoji">🔁</span>
        <span class="so-lon">${soCanOn}</span>
        <b>Ôn tập</b>
        <span class="chu-phu nho">thẻ cần ôn hôm nay</span>
      </a>
      <a class="o-lon khung phan-moi" href="#/hoc-moi">
        <span class="o-emoji emoji">✨</span>
        <span class="so-lon">${soChuaHoc}</span>
        <b>Từ mới</b>
        <span class="chu-phu nho">từ chưa học</span>
      </a>
    </div>
    <h3 class="tieu-de-muc">Chọn bài</h3>
    <div class="hang-chip">${chipCap}</div>
    ${chipCheDo}
    <input class="o-tim" id="o-tim" type="search" placeholder="🔍 Tìm từ: chữ Hán, pinyin, nghĩa, Hán Việt…" autocomplete="off">
    <div id="ket-qua"><div class="luoi-bai">${htmlLuoi()}</div></div>`;

  // Đổi cách chia bài
  khung.querySelectorAll('#chon-che-do [data-che-do]').forEach((nut) => {
    nut.onclick = () => {
      cd.cheDoBai = nut.dataset.cheDo;
      luu();
      veDanhSachBai(khung);
    };
  });

  const $tim = khung.querySelector('#o-tim');
  const $kq = khung.querySelector('#ket-qua');
  $tim.oninput = () => {
    const goc = $tim.value.trim();
    const q = boDau(goc);
    if (!q) { $kq.innerHTML = `<div class="luoi-bai">${htmlLuoi()}</div>`; return; }
    const qLien = q.replace(/\s/g, '');
    const kq = tatCaTu().filter((t) =>
      t.hanzi.includes(goc) || boDau(t.pinyin).replace(/\s/g, '').includes(qLien) ||
      boDau(nghiaNgan(t)).includes(q) || boDau(t.hanViet).includes(q));
    $kq.innerHTML = kq.length
      ? `<p class="chu-phu nho" style="margin:12px 2px 8px">${kq.length} kết quả</p>
         <div class="khung ds-tu">${kq.slice(0, 80).map(dongTu).join('')}</div>`
      : '<p class="chu-phu" style="margin:16px 2px">Không tìm thấy từ nào.</p>';
  };
}

// ---------- Chi tiết một bài ----------
/** @param ma số (bài theo chủ đề) hoặc 's5' (bài 5 của sách) */
export async function veBai(khung, ma) {
  const b = timBaiTheoMa(ma);
  if (!b) { khung.innerHTML = '<p class="loi">Không tìm thấy bài này.</p>'; return; }
  const chuaHoc = tuChuaHoc(b.ma).length;
  const { conTuMoi } = demHomNay();
  let nutHoc;
  if (!chuaHoc) nutHoc = '<p class="chu-phu">✓ Bạn đã học hết các từ của bài này.</p>';
  else if (conTuMoi) {
    nutHoc = `<a class="nut nut-chinh nut-rong" href="#/hoc-moi/${b.ma}">✨ Học từ mới của bài này (tối đa ${Math.min(chuaHoc, conTuMoi)} từ hôm nay)</a>`;
  } else {
    nutHoc = '<p class="can-kiem-tra">Bạn đã học đủ số từ mới hôm nay. Có thể tăng số từ mới mỗi ngày trong <a href="#/cai-dat">Cài đặt</a>.</p>';
  }
  khung.innerHTML = `
    <div class="dau-bai">
      <h2>${nhanBai(b)}: ${esc(b.ten)}</h2>
      <p class="chu-phu" style="margin:0">${b.tu.length} từ · còn ${chuaHoc} từ chưa học</p>
    </div>
    ${nutHoc}
    <a class="nut nut-rong" href="#/trac-nghiem/bai/${b.ma}" style="margin-top:12px">📝 Kiểm tra bài này (10 câu trắc nghiệm)</a>
    <div id="np-cua-bai"></div>
    ${CHU_THICH_CHAM}
    <div class="khung ds-tu">${b.tu.map(dongTu).join('')}</div>`;

  // Bài của sách: liệt kê các điểm ngữ pháp gắn với bài này
  if (b.sach) {
    const diem = await taiNguPhap().catch(() => []);
    const cua = diem.filter((d) => baiSachCuaNguPhap(d.id) === b.so);
    const vung = khung.querySelector('#np-cua-bai');
    if (vung && cua.length) {
      vung.innerHTML = `<h3 class="tieu-de-muc">Ngữ pháp của bài <small>gần đúng theo sách</small></h3>
        <div class="hang-chip">${cua.map((d) => `<a class="chip" href="#/ngu-phap/${d.id}">🧩 ${esc(d.ten)}</a>`).join('')}</div>`;
    }
  }
}

// ---------- Xem một từ ----------
export function veTu(khung, khoa) {
  const tu = layTu(khoa);
  if (!tu) { khung.innerHTML = '<p class="loi">Không tìm thấy từ này.</p>'; return; }
  const the = layTienDo().the[khoa];
  const moTa = { 'chua-hoc': 'Chưa học', 'dang-hoc': 'Đang học', 'dang-on': 'Đang ôn', 'da-thuoc': 'Đã thuộc chắc' }[loaiThe(the)];
  const lanToi = the?.han ? new Date(the.han).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '';
  const baiSach = baiSachCuaTu(tu);
  khung.innerHTML = `
    <div class="khung the-xem">${htmlMatSau(tu)}</div>
    <div class="khung trang-thai-tu">
      <div><b>Trạng thái:</b> ${moTa}${the ? ` · đã ôn ${the.soLanOn || 0} lần · quên ${the.soLanQuen || 0} lần` : ''}</div>
      ${lanToi ? `<div><b>Lần ôn tới:</b> ${lanToi}</div>` : ''}
      <div class="chu-phu nho">Bài ${tu.bai} (theo chủ đề)${baiSach ? ` · Bài ${baiSach} trong sách` : ''}</div>
      <div class="chu-phu nho">Danh sách chính thức: STT ${tu.soThuTu} · từ loại ${esc(tu.tuLoaiChinhThuc || '(cụm từ)')}</div>
    </div>`;
}
