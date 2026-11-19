// =========================================================
// PHIÊN HỌC THẺ TỪ (flashcard): Ôn tập / Học từ mới
//   #/on          ôn các thẻ đến hạn
//   #/hoc-moi     học từ mới (bài đang học)     #/hoc-moi/5  học từ mới của bài 5
// Thứ tự thẻ và lịch ôn do phien-hoc.js + lich-on.js (SM-2) quyết định –
// file này chỉ lo phần HIỂN THỊ (ô chữ điền, lật thẻ, 4 nút trả lời, tổng kết).
// Phím tắt trên máy tính: Space/Enter = lật thẻ; 1/2/3/4 = Quên/Khó/Nhớ/Dễ
// =========================================================

import { caiDat, layTienDo } from './luu-tru.js';
import { DANH_GIA, moTaKhoangCach } from './lich-on.js';
import { layTu } from './du-lieu.js';
import { doc } from './phat-am.js';
import { demHomNay, taoPhien, theTiepTheo, traLoi, daXemTuMoi, conLai, tuChuaHoc, baiDangHoc } from './phien-hoc.js';
import { oChuDien, htmlMatSau, batDongHo } from './giao-dien.js';

const LUA_CHON = [
  { dg: DANH_GIA.QUEN, muc: 'quen', ten: 'Quên', emoji: '😵' },
  { dg: DANH_GIA.KHO,  muc: 'kho',  ten: 'Khó',  emoji: '🤔' },
  { dg: DANH_GIA.NHO,  muc: 'nho',  ten: 'Nhớ',  emoji: '🙂' },
  { dg: DANH_GIA.DE,   muc: 'de',   ten: 'Dễ',   emoji: '😎' },
];

/**
 * Vẽ một phiên học vào `khung`.
 * @param {'on'|'moi'} loai
 * @param {number|null} soBai  chỉ học từ mới của bài này (null = bài đang học)
 * @returns {Function} hàm dọn dẹp khi rời màn hình
 */
export function vePhien(khung, loai, soBai = null) {
  const cd = caiDat();
  const phien = taoPhien(loai, soBai);
  const phan = loai;                 // 'on' | 'moi' – để tính giờ
  const ketQua = { quen: 0, kho: 0, nho: 0, de: 0 };
  let soTuMoiDaXem = 0;
  let hienTai = null;                // { khoa, kieu: 'gioi-thieu' | 'on' | 'luyen' }
  let matSau = false;                // đang xem mặt sau?
  let luotThe = 0;                   // tăng mỗi khi sang thẻ mới (tránh hiệu ứng lật cũ vẽ đè thẻ mới)

  document.body.classList.add('dang-hoc');
  const dungDongHo = batDongHo(phan); // đồng hồ tính phút học trên thanh trên cùng

  // --- Khung phiên học ---
  khung.innerHTML = `
    <div class="phien">
      <div class="tien-do-phien">
        <div class="thanh-tien-do"><span style="width:0%"></span></div>
        <span class="dem"></span>
      </div>
      <div class="the-tu" tabindex="0"></div>
      <div class="vung-tra-loi"></div>
    </div>`;
  const $the = khung.querySelector('.the-tu');
  const $vung = khung.querySelector('.vung-tra-loi');

  // Chạm vào thẻ (mặt trước) để lật; bỏ qua khi chạm vào nút loa / đường dẫn
  $the.addEventListener('click', (e) => {
    if (e.target.closest('[data-doc], a, button')) return;
    if (hienTai && hienTai.kieu !== 'gioi-thieu' && !matSau) lat();
  });

  // --- Phím tắt trên máy tính ---
  const phim = (e) => {
    if (!hienTai || e.target.closest?.('input, select, textarea')) return;
    const dangONut = e.target.closest?.('button, a');   // để nút đang chọn tự xử lý Enter/Space
    const laLat = (e.key === ' ' || e.key === 'Enter') && !dangONut;
    if (hienTai.kieu === 'gioi-thieu') {
      if (laLat) { e.preventDefault(); xemXongTuMoi(false); }
      return;
    }
    if (!matSau && laLat) { e.preventDefault(); lat(); return; }
    if (matSau && ['1', '2', '3', '4'].includes(e.key)) danhGia(Number(e.key));
    else if (matSau && laLat) { e.preventDefault(); danhGia(DANH_GIA.NHO); }
  };
  document.addEventListener('keydown', phim);

  // --- Thanh tiến độ phía trên ---
  function capNhatTienDo() {
    const con = conLai(phien);
    const tong = phien.daLam + con;
    khung.querySelector('.tien-do-phien .thanh-tien-do > span').style.width = `${tong ? (phien.daLam / tong) * 100 : 0}%`;
    khung.querySelector('.tien-do-phien .dem').textContent = `Còn ${con} · đã làm ${phien.daLam}`;
  }

  function hieuUngVao() {
    $the.classList.remove('the-moi-vao');
    void $the.offsetWidth; // khởi động lại hiệu ứng
    $the.classList.add('the-moi-vao');
  }

  // --- Thẻ tiếp theo ---
  function tiepTheo() {
    luotThe++;
    $the.classList.remove('dang-lat');
    hienTai = theTiepTheo(phien);
    matSau = false;
    if (!hienTai) return veKetThuc();
    const tu = layTu(hienTai.khoa);
    if (!tu) { // dữ liệu bị xóa khỏi file → bỏ qua
      phien.hangOn = phien.hangOn.filter((k) => k !== hienTai.khoa);
      phien.hangMoi = phien.hangMoi.filter((k) => k !== hienTai.khoa);
      phien.dangLuyen.delete(hienTai.khoa);
      return tiepTheo();
    }
    capNhatTienDo();
    if (hienTai.kieu === 'gioi-thieu') veGioiThieu(tu);
    else veMatTruoc(tu);
    hieuUngVao();
  }

  function veMatTruoc(tu) {
    const nhan = hienTai.kieu === 'luyen'
      ? '<span class="nhan nhan-vang">📖 Đang học</span>'
      : '<span class="nhan">🔁 Ôn tập</span>';
    $the.classList.add('co-the-lat');
    $the.setAttribute('role', 'button');
    $the.setAttribute('aria-label', 'Thẻ từ – chạm để lật');
    $the.innerHTML = `
      <div class="mat-truoc">
        <div class="goc-the">${nhan}<span class="chu-phu nho">HSK ${tu.cap} · Bài ${tu.bai}</span></div>
        <div class="giua-the">${oChuDien(tu.hanzi)}</div>
        <p class="goi-y"><span class="emoji">👆</span> Nhớ lại cách đọc và nghĩa, rồi chạm để lật thẻ</p>
      </div>`;
    $vung.innerHTML = `
      <button class="nut nut-chinh nut-rong" id="nut-lat">Lật thẻ</button>
      <p class="phim-tat">Phím tắt: Space = lật thẻ</p>`;
    $vung.querySelector('#nut-lat').onclick = lat;
  }

  /** Lật thẻ (có hiệu ứng xoay) rồi hiện 4 nút Quên / Khó / Nhớ / Dễ */
  function lat() {
    if (matSau || !hienTai) return;
    matSau = true;
    const tu = layTu(hienTai.khoa);
    const theCu = layTienDo().the[hienTai.khoa];
    const luotLuc = luotThe;
    $the.classList.add('dang-lat');
    setTimeout(() => {
      if (luotLuc !== luotThe) return; // đã sang thẻ khác rồi
      $the.classList.remove('co-the-lat', 'dang-lat');
      $the.removeAttribute('role');
      $the.removeAttribute('aria-label');
      $the.innerHTML = htmlMatSau(tu);
    }, 160);
    $vung.innerHTML = `
      <div class="bon-nut">${LUA_CHON.map((l) => `
        <button class="nut-tra-loi muc-${l.muc}" data-dg="${l.dg}">
          <b>${l.ten}</b>
          <small>${moTaKhoangCach(theCu, l.dg)}</small>
          <kbd>${l.dg}</kbd>
        </button>`).join('')}</div>
      <p class="phim-tat">Phím tắt: 1 Quên · 2 Khó · 3 Nhớ · 4 Dễ</p>`;
    $vung.querySelectorAll('[data-dg]').forEach((b) => { b.onclick = () => danhGia(Number(b.dataset.dg)); });
    if (cd.tuPhatAm) doc(tu.hanzi);
  }

  function danhGia(dg) {
    if (!matSau || !hienTai) return;
    ketQua[LUA_CHON[dg - 1].muc]++;
    traLoi(phien, hienTai.khoa, dg);
    tiepTheo();
  }

  /** Từ mới: hiện đầy đủ nội dung để làm quen trước khi luyện */
  function veGioiThieu(tu) {
    $the.classList.remove('co-the-lat');
    $the.removeAttribute('role');
    $the.removeAttribute('aria-label');
    $the.innerHTML = `
      <div class="goc-the" style="margin-bottom:10px">
        <span class="nhan nhan-chinh">✨ Từ mới</span><span class="chu-phu nho">HSK ${tu.cap} · Bài ${tu.bai}</span>
      </div>
      ${htmlMatSau(tu)}`;
    $vung.innerHTML = `
      <div class="hang-nut">
        <button class="nut" id="nut-biet">Đã biết từ này</button>
        <button class="nut nut-chinh" id="nut-tiep">Đã hiểu – luyện tiếp ▶</button>
      </div>
      <p class="phim-tat">Phím tắt: Space = luyện tiếp</p>`;
    $vung.querySelector('#nut-biet').onclick = () => xemXongTuMoi(true);
    $vung.querySelector('#nut-tiep').onclick = () => xemXongTuMoi(false);
    if (cd.tuPhatAm) doc(tu.hanzi);
  }

  function xemXongTuMoi(biet) {
    if (!hienTai) return;
    soTuMoiDaXem++;
    daXemTuMoi(phien, hienTai.khoa, biet);
    tiepTheo();
  }

  /** Màn hình tổng kết cuối phiên */
  function veKetThuc() {
    dungDongHo();   // xong phiên thì ngừng tính giờ (và lưu)
    hienTai = null;
    document.body.classList.remove('dang-hoc');
    const dem = demHomNay();
    const tongTraLoi = ketQua.quen + ketQua.kho + ketQua.nho + ketQua.de;
    const tot = tongTraLoi ? (ketQua.nho + ketQua.de) / tongTraLoi : 1;
    let loiNhan;
    if (loai === 'on') {
      loiNhan = phien.daLam ? 'Bạn đã ôn xong các thẻ đến hạn hôm nay.' : 'Hôm nay không có thẻ nào cần ôn.';
    } else if (dem.conTuMoi === 0) {
      loiNhan = `Bạn đã học đủ ${cd.soTuMoiMoiNgay} từ mới hôm nay. Ngày mai các từ này sẽ xuất hiện trong phần Ôn tập.`;
    } else if (soBai && !tuChuaHoc(soBai).length) {
      loiNhan = `Bạn đã học hết các từ của Bài ${soBai}.`;
    } else {
      loiNhan = 'Đã xong phần học từ mới.';
    }
    const coViec = phien.daLam > 0;
    khung.innerHTML = `
      <div class="ket-thuc">
        <div class="emoji emoji-to">${!coViec ? '🎉' : tot >= 0.8 ? '🏆' : tot >= 0.5 ? '🎉' : '💪'}</div>
        <h2>${!coViec ? 'Hoàn thành!' : tot >= 0.8 ? 'Xuất sắc!' : tot >= 0.5 ? 'Làm tốt lắm!' : 'Cố lên, ôn thêm nhé!'}</h2>
        <p class="chu-phu">${loiNhan}</p>
        ${coViec ? `<p class="chu-phu nho">${phien.daLam} lượt${soTuMoiDaXem ? ` · ${soTuMoiDaXem} từ mới` : ''}</p>` : ''}
        ${tongTraLoi ? `<div class="bang-ket-qua">
          ${LUA_CHON.map((l) => `<div class="o-ket-qua muc-${l.muc}"><span class="emoji">${l.emoji}</span><b>${ketQua[l.muc]}</b><span>${l.ten}</span></div>`).join('')}
        </div>` : ''}
        <a class="nut nut-chinh nut-rong" href="#/">Về trang Hôm nay</a>
        ${loai === 'on' && dem.conTuMoi > 0 && baiDangHoc()
          ? '<a class="nut nut-rong" href="#/hoc-moi">✨ Học từ mới</a>'
          : '<a class="nut nut-rong" href="#/bai">📚 Xem bài học</a>'}
      </div>`;
  }

  tiepTheo();

  // --- Dọn dẹp khi rời màn hình ---
  return () => {
    dungDongHo();
    document.removeEventListener('keydown', phim);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    document.body.classList.remove('dang-hoc');
  };
}
