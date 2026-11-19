// =========================================================
// BÀI HỌC
//   #/bai          2 ô lớn (Ôn tập / Từ mới) + chọn cấp + chọn cách chia bài + lưới các bài + tìm từ
//   #/bai/5        chi tiết bài 5 theo chủ đề        #/bai/s5  chi tiết bài 5 của sách 《新HSK教程 1》
//   #/bai/2-5      bài 5 của sách 《新HSK教程 2》   #/bai/c2-5  bài chủ đề 5 của HSK 2 (data/chu-de-hsk2.json)
//   #/tu/<khóa>    xem một từ
// Cách chia bài (caiDat.cheDoBai, chung cho mọi cấp): 'chu-de' = theo nhóm nghĩa, 'sach' = theo thứ tự bài sách.
// Tiến độ lưu theo TỪNG TỪ nên đổi cách chia không ảnh hưởng tiến độ.
// =========================================================

import { layTienDo, caiDat, luu } from './luu-tru.js';
import { loaiThe } from './lich-on.js';
import {
  layTu, tatCaTu, nghiaNgan, danhSachBai, timBaiTheoMa, cheDoBai, coTheoSach, tenSach,
  nhanBai, baiSachCuaTu, baiSachCuaNguPhap, cacCapCoDuLieu, coChuDe, chuDeCuaMotTu,
} from './du-lieu.js';
import { demHomNay, tuChuaHoc, baiDangHoc } from './phien-hoc.js';
import { esc, boDau, htmlMatSau, dongTu, CHU_THICH_CHAM } from './giao-dien.js';
import { taiNguPhap } from './man-ngu-phap.js';

// Cấp đang xem trong lưới bài (mặc định: cấp của bài đang học dở)
let capDangXem = null;

// ---------- Danh sách bài ----------
export function veDanhSachBai(khung) {
  const td = layTienDo();
  const cd = caiDat();
  const dem = demHomNay();
  const soCanOn = dem.onDenHan + dem.dangHocDenHan;
  const soChuaHoc = tuChuaHoc().length;
  const cheDo = cheDoBai(cd);
  const coCap = cacCapCoDuLieu();
  if (!coCap.includes(capDangXem)) capDangXem = baiDangHoc()?.cap || 1;
  const cap = capDangXem;

  // Cấp chưa có dữ liệu thì khóa lại
  const chipCap = [1, 2, 3].map((c) => (coCap.includes(c)
    ? `<button class="chip ${c === cap ? 'dang-chon' : ''}" data-cap="${c}">HSK ${c}</button>`
    : `<button class="chip" disabled title="Sắp có">HSK ${c} <span class="emoji">🔒</span></button>`)).join('');

  // Hai cách chia bài (chung cho mọi cấp): theo chủ đề / theo thứ tự bài sách 《新HSK教程 N》
  const coHaiCach = coTheoSach() && coChuDe(cap);
  const soBaiChuDe = danhSachBai('chu-de', cap).length;
  const soBaiSach = danhSachBai('sach', cap).length;
  const tenSachCap = cap === 1 ? tenSach() : `《新HSK教程 ${cap}》`;
  const chipCheDo = coHaiCach ? `
    <div class="nhom-chon chon-che-do-bai" id="chon-che-do">
      <button data-che-do="chu-de" class="${cheDo === 'chu-de' ? 'dang-chon' : ''}">🗂️ Chủ đề · ${soBaiChuDe} bài</button>
      <button data-che-do="sach" class="${cheDo === 'sach' ? 'dang-chon' : ''}">📖 Theo sách · ${soBaiSach} bài</button>
    </div>
    <p class="chu-phu nho" style="margin:6px 2px 0">${cheDo === 'sach' ? `Theo thứ tự bài của ${esc(tenSachCap)}.` : 'Từ cùng nhóm nghĩa học cùng nhau.'} Cách chia áp dụng cho cả ba cấp; đổi cách chia không ảnh hưởng tiến độ.</p>`
    : cap > 1 ? `<p class="chu-phu nho" style="margin:6px 2px 0">HSK ${cap} chia theo thứ tự bài của sách ${esc(tenSachCap)}.</p>` : '';

  const htmlLuoi = () => danhSachBai(cheDo, cap).map((b) => {
    const nhan = b.sach ? `Bài ${b.so} (sách)` : `Bài ${b.so}`;
    if (!b.tu.length) {
      return `
      <div class="o-bai dang-soan" aria-disabled="true">
        <span class="so-bai">${nhan}</span>
        <span class="xem-truoc emoji">📝</span>
        <span class="ten-bai">${esc(b.ten)}</span>
        <span class="chu-phu nho">Đang soạn · ${b.soTu} từ</span>
      </div>`;
    }
    const daHoc = b.tu.filter((t) => td.the[t.khoa]).length;
    const thuoc = b.tu.filter((t) => loaiThe(td.the[t.khoa]) === 'da-thuoc').length;
    const phanTram = b.tu.length ? Math.round((daHoc / b.tu.length) * 100) : 0;
    return `
      <a class="o-bai ${phanTram === 100 ? 'xong' : ''}" href="#/bai/${b.ma}">
        <span class="so-bai">${nhan}${phanTram === 100 ? ' <span class="emoji">✅</span>' : ''}</span>
        <span class="xem-truoc han">${b.tu[0] ? esc(b.tu[0].hanzi) : ''}</span>
        <span class="ten-bai">${esc(b.ten)}</span>
        <span class="thanh-tien-do"><span style="width:${phanTram}%"></span></span>
        <span class="chu-phu nho">${daHoc}/${b.tu.length} từ${thuoc ? ` · thuộc ${thuoc}` : ''}${b.tu.length < b.soTu ? ' · đang soạn' : ''}</span>
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

  // Đổi cấp
  khung.querySelectorAll('[data-cap]').forEach((nut) => {
    nut.onclick = () => { capDangXem = Number(nut.dataset.cap); veDanhSachBai(khung); };
  });
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

  // Bài của sách (HSK 1, 2, 3 theo sách): liệt kê các điểm ngữ pháp gắn với bài này
  if (b.sach) {
    const diem = await taiNguPhap().catch(() => []);
    const cua = diem.filter((d) => (b.cap > 1 ? d.cap === b.cap && d.bai === b.so
      : d.cap === 1 && baiSachCuaNguPhap(d.id) === b.so));
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
      <div class="chu-phu nho">${tu.cap > 1
        ? `HSK ${tu.cap} · Bài ${tu.bai} trong sách 《新HSK教程 ${tu.cap}》${chuDeCuaMotTu(tu) ? ` · chủ đề Bài ${chuDeCuaMotTu(tu).so}: ${esc(chuDeCuaMotTu(tu).ten)}` : ''}`
        : `HSK 1 · Bài ${tu.bai} (theo chủ đề)${baiSach ? ` · Bài ${baiSach} trong sách` : ''}`}</div>
      <div class="chu-phu nho">Danh sách chính thức: STT ${tu.soThuTu} · từ loại ${esc(tu.tuLoaiChinhThuc || '(cụm từ)')}</div>
    </div>`;
}
