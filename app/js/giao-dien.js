// =========================================================
// GIAO DIỆN – vẽ các màn hình:
//   #/            Trang chủ "Hôm nay cần làm gì"
//   #/on          Ôn từ đến hạn
//   #/hoc-moi     Học từ mới (bài đang học)     #/hoc-moi/5  Học từ mới của bài 5
//   #/bai         Danh sách bài                 #/bai/5      Chi tiết bài 5
//   #/tu/<khóa>   Xem một từ
//   #/cai-dat     Cài đặt, sao lưu
// =========================================================

import {
  layTienDo, caiDat, luu, nhatKyHomNay, congGiay, chuoiNgayHoc, coLuuDuoc,
  xuatSaoLuu, nhapSaoLuu, xoaTienDo,
} from './luu-tru.js';
import { DANH_GIA, moTaKhoangCach, loaiThe } from './lich-on.js';
import { TEN_TU_LOAI, layBaiHoc, layTu, tatCaTu, timBai, nghiaNgan } from './du-lieu.js';
import { doc, giongTiengTrung, choGiong, tinhTrangPhatAm } from './phat-am.js';
import { demHomNay, taoPhien, theTiepTheo, traLoi, daXemTuMoi, conLai, tuChuaHoc, baiDangHoc } from './phien-hoc.js';

const $noiDung = () => document.getElementById('noi-dung');
let donDep = null; // hàm dọn dẹp của màn hình trước (tắt đồng hồ, bỏ phím tắt…)

// ---------- Tiện ích ----------
/** Chống lỗi hiển thị khi dữ liệu có ký tự đặc biệt như < > & " */
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const boDau = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase();

export function thongBao(chu) {
  const el = document.getElementById('thong-bao');
  el.textContent = chu;
  el.classList.add('hien');
  clearTimeout(thongBao._h);
  thongBao._h = setTimeout(() => el.classList.remove('hien'), 2600);
}

function nutLoa(chu, nho = false) {
  return `<button class="nut-loa ${nho ? 'nho' : ''}" data-doc="${esc(chu)}" aria-label="Nghe phát âm" title="Nghe">🔊</button>`;
}

const PHAN_TEN = { on: 'Ôn từ đến hạn', moi: 'Học từ mới' };

// =========================================================
// ĐIỀU HƯỚNG
// =========================================================
export function veTheoDiaChi() {
  if (donDep) { donDep(); donDep = null; }
  document.getElementById('dong-ho').hidden = true;
  const duong = decodeURIComponent(location.hash.replace(/^#\/?/, '')).split('/');
  const [muc, thamSo] = duong;
  // tô sáng mục đang chọn ở thanh dưới
  const mucDuoi = { '': 'trang-chu', bai: 'bai', tu: 'bai', 'cai-dat': 'cai-dat' }[muc] ?? 'trang-chu';
  document.querySelectorAll('.thanh-duoi a').forEach((a) => a.classList.toggle('dang-chon', a.dataset.muc === mucDuoi));
  window.scrollTo(0, 0);

  if (muc === 'on') return vePhien('on');
  if (muc === 'hoc-moi') return vePhien('moi', thamSo ? Number(thamSo) : null);
  if (muc === 'bai' && thamSo) return veBai(Number(thamSo));
  if (muc === 'bai') return veDanhSachBai();
  if (muc === 'tu') return veTu(duong.slice(1).join('/'));
  if (muc === 'cai-dat') return veCaiDat();
  return veTrangChu();
}

// Bấm vào bất kỳ nút 🔊 nào (dùng chung cho mọi màn hình)
document.addEventListener('click', (e) => {
  const nut = e.target.closest('[data-doc]');
  if (nut) {
    e.stopPropagation();
    doc(nut.dataset.doc);
  }
});

// =========================================================
// TRANG CHỦ – "Hôm nay cần làm gì"
// =========================================================
function veTrangChu() {
  const cd = caiDat();
  const nk = nhatKyHomNay();
  const dem = demHomNay();
  const phut = (phan) => Math.floor((nk.giay[phan] || 0) / 60);
  const td = layTienDo();
  const tatCa = tatCaTu();
  const thongKe = { 'chua-hoc': 0, 'dang-hoc': 0, 'dang-on': 0, 'da-thuoc': 0 };
  tatCa.forEach((t) => thongKe[loaiThe(td.the[t.khoa])]++);
  const daHoc = tatCa.length - thongKe['chua-hoc'];
  const bai = baiDangHoc();
  const chuoi = chuoiNgayHoc();

  // --- Phần 1: Ôn ---
  const tongOn = dem.daOn + dem.onDenHan;
  const onXong = dem.onDenHan === 0 && dem.dangHocDenHan === 0;
  const moTaOn = onXong
    ? (dem.daOn ? `Đã ôn xong ${dem.daOn} thẻ hôm nay ✓` : 'Hôm nay chưa có thẻ nào đến hạn ôn ✓')
    : [dem.onDenHan ? `Còn <b>${dem.onDenHan}</b> thẻ đến hạn` : '',
      dem.dangHocDenHan ? `<b>${dem.dangHocDenHan}</b> thẻ đang học dở cần luyện tiếp` : ''].filter(Boolean).join(' + ');
  const tienDoOn = onXong ? 100 : tongOn ? Math.round((dem.daOn / tongOn) * 100) : 0;

  // --- Phần 2: Từ mới ---
  const moiXong = dem.conTuMoi === 0 || !bai;
  const moTaMoi = !bai
    ? 'Bạn đã học hết các từ hiện có 🎉'
    : `${dem.daHocMoi}/${cd.soTuMoiMoiNgay} từ mới hôm nay · đang ở <b>Bài ${bai.so}: ${esc(bai.ten)}</b>`;
  const tienDoMoi = Math.min(100, Math.round((dem.daHocMoi / cd.soTuMoiMoiNgay) * 100));

  const viec = (so, href, tieuDe, moTa, phutDaHoc, phutMucTieu, phanTram, xong, sapCo = '') => `
    <a class="o o-viec ${xong ? 'xong' : ''} ${sapCo ? 'sap-co' : ''}" ${href ? `href="${href}"` : ''}>
      <span class="so-thu-tu">${xong ? '✓' : so}</span>
      <span class="than">
        <span class="tieu-de">${tieuDe}</span>
        <span class="phu"> · ~${phutMucTieu} phút</span><br>
        <span class="phu">${sapCo || moTa}</span>
        ${sapCo ? '' : `<span class="phu"> · ⏱ ${phutDaHoc}/${phutMucTieu} phút</span>
        <div class="tien-do"><span style="width:${phanTram}%"></span></div>`}
      </span>
      ${href ? '<span class="mui-ten">›</span>' : ''}
    </a>`;

  const canhBao = [];
  if (!coLuuDuoc()) canhBao.push('⚠️ Trình duyệt đang chặn lưu dữ liệu (có thể do chế độ ẩn danh). Tiến độ sẽ mất khi đóng trang.');
  const ttPhatAm = tinhTrangPhatAm();
  if (ttPhatAm === 'khong-ho-tro') canhBao.push('⚠️ Trình duyệt này không hỗ trợ đọc phát âm. Hãy dùng Chrome, Edge hoặc Safari.');
  if (ttPhatAm === 'khong-co-giong') canhBao.push('⚠️ Máy chưa có giọng đọc tiếng Trung nên nút 🔊 sẽ không có tiếng. Xem cách cài trong <a href="#/cai-dat">Cài đặt</a>.');
  const ngaySaoLuu = td.saoLuuLanCuoi ? new Date(td.saoLuuLanCuoi) : null;
  if (daHoc >= 10 && (!ngaySaoLuu || Date.now() - ngaySaoLuu > 7 * 86400000)) {
    canhBao.push(`💾 ${ngaySaoLuu ? 'Đã hơn 7 ngày bạn chưa sao lưu.' : 'Bạn chưa sao lưu lần nào.'} <a href="#/cai-dat">Sao lưu ngay</a> để không mất tiến độ.`);
  }

  $noiDung().innerHTML = `
    <h1>Hôm nay cần làm gì</h1>
    <p class="phu">${new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' })}
      ${chuoi ? ` · 🔥 Chuỗi ${chuoi} ngày học liên tục` : ''}</p>
    ${canhBao.map((c) => `<div class="can-kiem-tra" style="margin-bottom:10px">${c}</div>`).join('')}

    ${viec(1, '#/on', 'Ôn từ đến hạn', moTaOn, phut('on'), cd.phutMucTieu.on, tienDoOn, onXong)}
    ${viec(2, bai ? '#/hoc-moi' : '', 'Học từ mới', moTaMoi, phut('moi'), cd.phutMucTieu.moi, tienDoMoi, moiXong)}
    ${viec(3, '', 'Luyện nghe & thanh điệu', '', 0, cd.phutMucTieu.nghe, 0, false, 'Sắp có – Giai đoạn 2')}
    ${viec(4, '', 'Luyện viết chữ Hán', '', 0, cd.phutMucTieu.viet, 0, false, 'Sắp có – Giai đoạn 2')}
    ${viec(5, '', 'Ngữ pháp / Trắc nghiệm', '', 0, cd.phutMucTieu.nguPhap, 0, false, 'Sắp có – Giai đoạn 3, 4')}

    <h2>Tổng quan HSK 1</h2>
    <div class="hang-so">
      <div class="o"><div class="so">${daHoc}</div><div class="phu">đã học / ${tatCa.length} từ</div></div>
      <div class="o"><div class="so">${thongKe['da-thuoc']}</div><div class="phu">đã thuộc chắc</div></div>
      <div class="o"><div class="so">${thongKe['dang-hoc'] + thongKe['dang-on']}</div><div class="phu">đang học / đang ôn</div></div>
    </div>
    <div class="tien-do"><span style="width:${tatCa.length ? Math.round((daHoc / tatCa.length) * 100) : 0}%"></span></div>
  `;
}

// =========================================================
// PHIÊN HỌC (Ôn / Học từ mới) – FLASHCARD
// =========================================================
function vePhien(loai, soBai = null) {
  const cd = caiDat();
  const phien = taoPhien(loai, soBai);
  const phan = loai; // 'on' | 'moi' – để tính giờ
  let hienTai = null;     // { khoa, kieu }
  let matSau = false;     // đang xem mặt sau?
  let lanTuongTac = Date.now();

  // --- Đồng hồ: chỉ đếm khi trang đang mở và có thao tác trong 90 giây gần nhất ---
  const $dongHo = document.getElementById('dong-ho');
  $dongHo.hidden = false;
  const capNhatDongHo = () => {
    const giay = nhatKyHomNay().giay[phan] || 0;
    const mm = Math.floor(giay / 60);
    const ss = String(giay % 60).padStart(2, '0');
    $dongHo.textContent = `⏱ ${mm}:${ss} / ${cd.phutMucTieu[phan]} phút`;
  };
  let demLuu = 0;
  const dongHo = setInterval(() => {
    if (document.visibilityState !== 'visible' || Date.now() - lanTuongTac > 90000) return;
    congGiay(phan, 1);
    if (++demLuu % 10 === 0) luu();
    capNhatDongHo();
    const giay = nhatKyHomNay().giay[phan];
    if (giay === cd.phutMucTieu[phan] * 60) thongBao(`Đã đủ ${cd.phutMucTieu[phan]} phút cho phần này. Bạn có thể chuyển sang phần tiếp theo!`);
  }, 1000);
  capNhatDongHo();

  // --- Phím tắt trên máy tính ---
  const phim = (e) => {
    if (e.target.matches('input, select, textarea')) return;
    lanTuongTac = Date.now();
    if (!hienTai) return;
    if (hienTai.kieu === 'gioi-thieu') {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); xemXongTuMoi(false); }
      return;
    }
    if (!matSau && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); lat(); return; }
    if (matSau && ['1', '2', '3', '4'].includes(e.key)) danhGia(Number(e.key));
    if (matSau && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); danhGia(DANH_GIA.NHO); }
  };
  const chamVao = () => { lanTuongTac = Date.now(); };
  document.addEventListener('keydown', phim);
  document.addEventListener('pointerdown', chamVao);
  donDep = () => {
    clearInterval(dongHo);
    luu();
    document.removeEventListener('keydown', phim);
    document.removeEventListener('pointerdown', chamVao);
  };

  // --- Hiển thị thẻ tiếp theo ---
  function tiepTheo() {
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
    if (hienTai.kieu === 'gioi-thieu') return veGioiThieu(tu);
    veMatTruoc(tu);
  }

  const dauPhien = () => {
    const ten = loai === 'on' ? 'Ôn tập' : soBai ? `Học từ mới · Bài ${soBai}` : 'Học từ mới';
    return `<div class="dau-phien"><span>${ten}</span><span>Còn ${conLai(phien)} thẻ · đã làm ${phien.daLam}</span></div>`;
  };

  function veMatTruoc(tu) {
    $noiDung().innerHTML = `
      <div class="khung-the">
        ${dauPhien()}
        <div class="the-hoc">
          <div class="mat-truoc" id="mat-truoc" role="button" tabindex="0" aria-label="Lật thẻ">
            <span class="nhan">Bài ${tu.bai}${hienTai.kieu === 'luyen' ? ' · đang học' : ''}</span>
            <div class="han chu-to">${esc(tu.hanzi)}</div>
            <div class="goi-y">Nhớ lại cách đọc và nghĩa, rồi chạm để lật thẻ</div>
          </div>
        </div>
        <button class="nut nut-chinh nut-rong" id="nut-lat">Xem đáp án</button>
        <div class="phim-tat">Phím tắt: Space = lật thẻ</div>
      </div>`;
    document.getElementById('mat-truoc').onclick = lat;
    document.getElementById('nut-lat').onclick = lat;
  }

  function lat() {
    const tu = layTu(hienTai.khoa);
    matSau = true;
    const the = layTienDo().the[hienTai.khoa];
    const nut = (dg, lop, ten) =>
      `<button class="${lop}" data-dg="${dg}">${ten}<small>${moTaKhoangCach(the, dg)}</small></button>`;
    $noiDung().innerHTML = `
      <div class="khung-the">
        ${dauPhien()}
        <div class="the-hoc">${htmlMatSau(tu)}</div>
        <div class="nut-danh-gia">
          ${nut(DANH_GIA.QUEN, 'quen', 'Quên')}
          ${nut(DANH_GIA.KHO, 'kho', 'Khó')}
          ${nut(DANH_GIA.NHO, 'nho', 'Nhớ')}
          ${nut(DANH_GIA.DE, 'de', 'Dễ')}
        </div>
        <div class="phim-tat">Phím tắt: 1 Quên · 2 Khó · 3 Nhớ · 4 Dễ</div>
      </div>`;
    document.querySelectorAll('[data-dg]').forEach((b) => { b.onclick = () => danhGia(Number(b.dataset.dg)); });
    if (cd.tuPhatAm) doc(tu.hanzi);
  }

  function danhGia(dg) {
    traLoi(phien, hienTai.khoa, dg);
    tiepTheo();
  }

  function veGioiThieu(tu) {
    $noiDung().innerHTML = `
      <div class="khung-the">
        ${dauPhien()}
        <div class="the-hoc">
          <div style="margin-bottom:8px"><span class="nhan">✨ TỪ MỚI · Bài ${tu.bai}</span></div>
          ${htmlMatSau(tu)}
        </div>
        <div class="hang-nut">
          <button class="nut" id="nut-biet" style="flex:1">Tôi đã biết từ này</button>
          <button class="nut nut-chinh" id="nut-tiep" style="flex:2">Đã hiểu – luyện tiếp ▶</button>
        </div>
        <div class="phim-tat">Phím tắt: Space = luyện tiếp</div>
      </div>`;
    document.getElementById('nut-biet').onclick = () => xemXongTuMoi(true);
    document.getElementById('nut-tiep').onclick = () => xemXongTuMoi(false);
    if (cd.tuPhatAm) doc(tu.hanzi);
  }

  function xemXongTuMoi(biet) {
    daXemTuMoi(phien, hienTai.khoa, biet);
    tiepTheo();
  }

  function veKetThuc() {
    const dem = demHomNay();
    let loiNhan;
    if (loai === 'on') {
      loiNhan = phien.daLam ? `Bạn đã ôn xong các thẻ đến hạn hôm nay (${phien.daLam} lượt).` : 'Hôm nay không có thẻ nào cần ôn.';
    } else if (dem.conTuMoi === 0) {
      loiNhan = `Bạn đã học đủ ${cd.soTuMoiMoiNgay} từ mới hôm nay. Ngày mai các từ này sẽ xuất hiện trong phần Ôn tập.`;
    } else if (soBai && !tuChuaHoc(soBai).length) {
      loiNhan = `Bạn đã học hết các từ của Bài ${soBai}.`;
    } else {
      loiNhan = 'Đã xong phần học từ mới.';
    }
    $noiDung().innerHTML = `
      <div class="o chuc-mung">
        <div class="lon">🎉</div>
        <h1>Hoàn thành!</h1>
        <p>${loiNhan}</p>
        <div class="hang-nut" style="justify-content:center">
          <a class="nut nut-chinh" href="#/">Về trang chủ</a>
          ${loai === 'on' && dem.conTuMoi > 0 && baiDangHoc() ? '<a class="nut" href="#/hoc-moi">Học từ mới</a>' : ''}
        </div>
      </div>`;
  }

  tiepTheo();
}

// ---------- Mặt sau của thẻ (dùng cho flashcard và trang xem từ) ----------
function htmlMatSau(tu) {
  const toSang = (cau) => esc(cau).split(esc(tu.hanzi)).join(`<mark>${esc(tu.hanzi)}</mark>`);
  const nghia = (tu.nghia || []).map((n, i) => {
    const viDu = (tu.viDu || []).filter((v) => (v.nghiaSo ?? 0) === i);
    return `
      <div class="nghia">
        <span class="tu-loai">${esc(TEN_TU_LOAI[n.tuLoai] || n.tuLoai)}</span>
        <span class="nghia-chu">${esc(n.nghia)}</span>
        ${viDu.map((v) => `
          <div class="vi-du">
            ${nutLoa(v.han, true)}
            <div>
              <div class="han">${toSang(v.han)}</div>
              <div class="py">${esc(v.pinyin)}</div>
              <div class="dich">${esc(v.dich)}</div>
            </div>
          </div>`).join('')}
      </div>`;
  }).join('');
  const ghiChu = (tu.ghiChu || []).length
    ? `<div class="ghi-chu">${tu.ghiChu.map((g) => `<p>💡 ${esc(g)}</p>`).join('')}</div>` : '';
  const kiemTra = (tu.canKiemTra || []).length
    ? `<div class="can-kiem-tra">⚠️ Cần kiểm tra: ${tu.canKiemTra.map((k) => esc(k.lyDo)).join('; ')}</div>` : '';
  return `
    <div class="mat-sau">
      <div class="dau">
        <div class="han chu-vua">${esc(tu.hanzi)}</div>
        <div style="flex:1">
          <div class="pinyin">${esc(tu.pinyin)}</div>
          <div class="han-viet">${esc(tu.hanViet || '')}</div>
        </div>
        ${nutLoa(tu.hanzi)}
      </div>
      ${nghia}
      ${ghiChu}
      ${kiemTra}
      <a class="lien-ket-ngoai" href="https://hanzii.net/search/word/${encodeURIComponent(tu.hanzi)}?hl=vi" target="_blank" rel="noopener">Tra thêm trên Hanzii ↗</a>
    </div>`;
}

// =========================================================
// DANH SÁCH BÀI HỌC (+ tìm kiếm)
// =========================================================
function veDanhSachBai() {
  const td = layTienDo();
  const dsBai = layBaiHoc();
  const htmlBai = () => dsBai.map((b) => {
    const daHoc = b.tu.filter((t) => td.the[t.khoa]).length;
    const thuoc = b.tu.filter((t) => loaiThe(td.the[t.khoa]) === 'da-thuoc').length;
    return `
      <a class="o o-viec ${daHoc === b.tu.length ? 'xong' : ''}" href="#/bai/${b.so}">
        <span class="so-thu-tu">${daHoc === b.tu.length ? '✓' : b.so}</span>
        <span class="than">
          <span class="tieu-de">Bài ${b.so}: ${esc(b.ten)}</span><br>
          <span class="phu">Đã học ${daHoc}/${b.tu.length} · thuộc chắc ${thuoc}</span>
          <div class="tien-do"><span style="width:${Math.round((daHoc / b.tu.length) * 100)}%"></span></div>
        </span>
        <span class="mui-ten">›</span>
      </a>`;
  }).join('');

  $noiDung().innerHTML = `
    <h1>Bài học HSK 1</h1>
    <input class="o-tim" id="o-tim" type="search" placeholder="Tìm từ: chữ Hán, pinyin, nghĩa, Hán Việt…" autocomplete="off">
    <div id="ket-qua" style="margin-top:12px">${htmlBai()}</div>`;
  const $tim = document.getElementById('o-tim');
  $tim.oninput = () => {
    const q = boDau($tim.value.trim());
    const $kq = document.getElementById('ket-qua');
    if (!q) { $kq.innerHTML = htmlBai(); return; }
    const kq = tatCaTu().filter((t) =>
      t.hanzi.includes($tim.value.trim()) || boDau(t.pinyin).replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
      boDau(nghiaNgan(t)).includes(q) || boDau(t.hanViet).includes(q));
    $kq.innerHTML = kq.length
      ? `<p class="phu">${kq.length} kết quả</p>${kq.slice(0, 80).map(dongTu).join('')}`
      : '<p class="phu">Không tìm thấy từ nào.</p>';
  };
}

function dongTu(t) {
  const loai = loaiThe(layTienDo().the[t.khoa]);
  return `
    <a class="dong-tu" href="#/tu/${encodeURIComponent(t.khoa)}">
      <span class="cham ${loai}"></span>
      <span class="han">${esc(t.hanzi)}</span>
      <span class="giua">
        <div class="py">${esc(t.pinyin)} <span class="phu">· ${esc(t.hanViet || '')}</span>${(t.canKiemTra || []).length ? ' ⚠️' : ''}</div>
        <div class="ng">${esc(nghiaNgan(t))}</div>
      </span>
    </a>`;
}

const CHU_THICH_CHAM = `
  <div class="chu-thich-cham">
    <span><i class="cham"></i>chưa học</span><span><i class="cham dang-hoc"></i>đang học</span>
    <span><i class="cham dang-on"></i>đang ôn</span><span><i class="cham da-thuoc"></i>thuộc chắc (≥ 21 ngày)</span>
  </div>`;

// =========================================================
// CHI TIẾT MỘT BÀI
// =========================================================
function veBai(so) {
  const b = timBai(1, so);
  if (!b) { $noiDung().innerHTML = '<p class="loi">Không tìm thấy bài này.</p>'; return; }
  const chuaHoc = tuChuaHoc(so).length;
  const { conTuMoi } = demHomNay();
  $noiDung().innerHTML = `
    <p><a href="#/bai">‹ Tất cả bài</a></p>
    <h1>Bài ${b.so}: ${esc(b.ten)}</h1>
    <p class="phu">${b.tu.length} từ · còn ${chuaHoc} từ chưa học</p>
    ${chuaHoc ? (conTuMoi
      ? `<a class="nut nut-chinh nut-rong" href="#/hoc-moi/${b.so}">Học từ mới của bài này (tối đa ${Math.min(chuaHoc, conTuMoi)} từ hôm nay)</a>`
      : `<p class="can-kiem-tra">Bạn đã học đủ số từ mới hôm nay. Có thể tăng số từ mới mỗi ngày trong <a href="#/cai-dat">Cài đặt</a>.</p>`)
      : '<p class="phu">✓ Bạn đã học hết các từ của bài này.</p>'}
    ${CHU_THICH_CHAM}
    <div class="o" style="padding:4px 12px">${b.tu.map(dongTu).join('')}</div>`;
}

// =========================================================
// XEM MỘT TỪ
// =========================================================
function veTu(khoa) {
  const tu = layTu(khoa);
  if (!tu) { $noiDung().innerHTML = '<p class="loi">Không tìm thấy từ này.</p>'; return; }
  const the = layTienDo().the[khoa];
  const moTa = { 'chua-hoc': 'Chưa học', 'dang-hoc': 'Đang học', 'dang-on': 'Đang ôn', 'da-thuoc': 'Đã thuộc chắc' }[loaiThe(the)];
  const lanToi = the?.han ? new Date(the.han).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '';
  $noiDung().innerHTML = `
    <p><a href="#/bai/${tu.bai}">‹ Bài ${tu.bai}</a></p>
    <div class="the-hoc">${htmlMatSau(tu)}</div>
    <div class="o" style="margin-top:12px">
      <div><b>Trạng thái:</b> ${moTa}${the ? ` · đã ôn ${the.soLanOn || 0} lần · quên ${the.soLanQuen || 0} lần` : ''}</div>
      ${lanToi ? `<div><b>Lần ôn tới:</b> ${lanToi}</div>` : ''}
      <div class="phu">Danh sách chính thức: STT ${tu.soThuTu} · từ loại ${esc(tu.tuLoaiChinhThuc || '(cụm từ)')}</div>
    </div>`;
}

// =========================================================
// CÀI ĐẶT & SAO LƯU
// =========================================================
async function veCaiDat() {
  const cd = caiDat();
  const td = layTienDo();
  const soTheDaHoc = Object.keys(td.the).length;
  const canKiemTra = tatCaTu().filter((t) => (t.canKiemTra || []).length);

  $noiDung().innerHTML = `
    <h1>Cài đặt</h1>

    <h2>Học tập</h2>
    <div class="o">
      <div class="dong-cai-dat"><label for="cd-moi">Số từ mới mỗi ngày</label>
        <input id="cd-moi" type="number" min="1" max="50" value="${cd.soTuMoiMoiNgay}"></div>
      <div class="dong-cai-dat"><label for="cd-on">Số thẻ ôn tối đa mỗi ngày</label>
        <input id="cd-on" type="number" min="10" max="999" value="${cd.gioiHanOnMoiNgay}"></div>
      <div class="dong-cai-dat"><label for="cd-khai">Chữ Hán kiểu viết tay (Khải thư)</label>
        <input id="cd-khai" type="checkbox" ${cd.kieuChuKhai ? 'checked' : ''}></div>
    </div>

    <h2>Phát âm</h2>
    <div class="o">
      <div class="dong-cai-dat"><label for="cd-tu-doc">Tự đọc khi lật thẻ</label>
        <input id="cd-tu-doc" type="checkbox" ${cd.tuPhatAm ? 'checked' : ''}></div>
      <div class="dong-cai-dat"><label for="cd-toc-do">Tốc độ đọc: <b id="gt-toc-do">${cd.tocDoDoc}</b></label>
        <input id="cd-toc-do" type="range" min="0.5" max="1.2" step="0.1" value="${cd.tocDoDoc}"></div>
      <div class="dong-cai-dat"><label for="cd-giong">Giọng đọc</label>
        <select id="cd-giong"><option>Đang tìm giọng đọc…</option></select></div>
      <div class="dong-cai-dat"><span>Nghe thử</span>
        <button class="nut nut-nho" data-doc="你好！我是你的汉语老师。">🔊 你好！</button></div>
      <p class="phu" id="ghi-chu-giong"></p>
    </div>

    <h2>Sao lưu tiến độ</h2>
    <div class="o">
      <p class="phu">Tiến độ được lưu trong trình duyệt của máy này (${soTheDaHoc} từ đã học).
        Hãy sao lưu thường xuyên. Muốn học tiếp trên máy khác: xuất file ở máy này → nhập file ở máy kia.</p>
      <p class="phu">Lần sao lưu gần nhất: <b>${td.saoLuuLanCuoi ? new Date(td.saoLuuLanCuoi).toLocaleString('vi-VN') : 'chưa có'}</b></p>
      <div class="hang-nut">
        <button class="nut nut-chinh" id="nut-xuat">💾 Xuất file sao lưu</button>
        <label class="nut" for="file-nhap">📂 Nhập file sao lưu</label>
        <input id="file-nhap" type="file" accept=".json,application/json" hidden>
      </div>
    </div>

    <h2>Dữ liệu từ vựng</h2>
    <div class="o">
      <p class="phu">Danh sách từ, pinyin, từ loại: <b>Đề cương thi HSK 2025</b> (HSK考试大纲, 中外语言交流合作中心).
        Âm Hán Việt, nghĩa tiếng Việt, câu ví dụ: soạn riêng cho app – có thể còn sai sót.
        Tra cứu thêm: <a href="https://hanzii.net/?hl=vi" target="_blank" rel="noopener">Hanzii ↗</a></p>
      <p class="phu">${tatCaTu().length} từ HSK 1 · ${canKiemTra.length} từ có mục ⚠️ cần kiểm tra:</p>
      <div>${canKiemTra.map(dongTu).join('')}</div>
    </div>

    <h2>Vùng nguy hiểm</h2>
    <div class="o">
      <button class="nut" id="nut-xoa" style="color:var(--quen)">🗑 Xóa toàn bộ tiến độ học</button>
    </div>
    <p class="phu" style="text-align:center">Học HSK · Giai đoạn 1</p>`;

  // --- Lưu khi thay đổi ---
  const soNguyen = (el, min, max, macDinh) => {
    const n = Math.round(Number(el.value));
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : macDinh;
  };
  document.getElementById('cd-moi').onchange = (e) => { cd.soTuMoiMoiNgay = soNguyen(e.target, 1, 50, 15); e.target.value = cd.soTuMoiMoiNgay; luu(); thongBao('Đã lưu'); };
  document.getElementById('cd-on').onchange = (e) => { cd.gioiHanOnMoiNgay = soNguyen(e.target, 10, 999, 200); e.target.value = cd.gioiHanOnMoiNgay; luu(); thongBao('Đã lưu'); };
  document.getElementById('cd-khai').onchange = (e) => { cd.kieuChuKhai = e.target.checked; document.body.classList.toggle('kieu-khai', cd.kieuChuKhai); luu(); };
  document.getElementById('cd-tu-doc').onchange = (e) => { cd.tuPhatAm = e.target.checked; luu(); };
  document.getElementById('cd-toc-do').oninput = (e) => { cd.tocDoDoc = Number(e.target.value); document.getElementById('gt-toc-do').textContent = cd.tocDoDoc; luu(); };

  // --- Sao lưu ---
  document.getElementById('nut-xuat').onclick = () => { xuatSaoLuu(); thongBao('Đã tạo file sao lưu – xem trong thư mục Tải về (Downloads)'); setTimeout(veCaiDat, 300); };
  document.getElementById('file-nhap').onchange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!confirm('Nhập file sao lưu sẽ THAY THẾ toàn bộ tiến độ hiện tại trên máy này. Tiếp tục?')) { e.target.value = ''; return; }
    try {
      const n = await nhapSaoLuu(f);
      document.body.classList.toggle('kieu-khai', caiDat().kieuChuKhai);
      thongBao(`Đã nhập xong: ${n} từ đã học`);
      veCaiDat();
    } catch (err) {
      alert(err.message);
    }
    e.target.value = '';
  };
  document.getElementById('nut-xoa').onclick = () => {
    if (!confirm('Xóa TOÀN BỘ tiến độ học trên máy này? (Cài đặt được giữ lại)')) return;
    if (!confirm('Chắc chắn chưa? Không thể hoàn tác nếu bạn chưa có file sao lưu.')) return;
    xoaTienDo();
    thongBao('Đã xóa tiến độ');
    veCaiDat();
  };

  // --- Danh sách giọng đọc (tải chậm trên một số trình duyệt) ---
  await choGiong();
  const $giong = document.getElementById('cd-giong');
  if (!$giong) return; // người dùng đã chuyển màn hình
  const ds = giongTiengTrung();
  const $ghiChu = document.getElementById('ghi-chu-giong');
  if (!ds.length) {
    $giong.innerHTML = '<option>Không có giọng tiếng Trung</option>';
    $giong.disabled = true;
    $ghiChu.innerHTML = 'Máy chưa có giọng đọc tiếng Trung. <b>Windows</b>: Cài đặt → Thời gian & ngôn ngữ → Ngôn ngữ & vùng → Thêm ngôn ngữ → '
      + '“中文(中华人民共和国)” (tích chọn Giọng nói / Text-to-speech), rồi khởi động lại trình duyệt. '
      + '<b>Android</b>: Cài đặt → Hệ thống → Ngôn ngữ → Đầu ra chuyển văn bản thành lời nói → Google → cài dữ liệu giọng nói tiếng Trung. '
      + '<b>iPhone</b>: thường đã có sẵn.';
    return;
  }
  $giong.innerHTML = `<option value="">Tự chọn (${esc(ds[0].name)})</option>` +
    ds.map((g) => `<option value="${esc(g.name)}" ${g.name === cd.giongDoc ? 'selected' : ''}>${esc(g.name)} (${esc(g.lang)})</option>`).join('');
  $giong.onchange = () => { cd.giongDoc = $giong.value; luu(); doc('你好'); };
  $ghiChu.textContent = `Tìm thấy ${ds.length} giọng tiếng Trung. Giọng có chữ “Online/Natural” nghe tự nhiên hơn nhưng cần mạng.`;
}

