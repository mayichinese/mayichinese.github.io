// =========================================================
// ĐIỂM KHỞI ĐỘNG CỦA APP MAYI CHINESE
// 1. Đọc tiến độ đã lưu trên máy, áp dụng sáng/tối
// 2. Tải dữ liệu từ vựng
// 3. Vẽ màn hình theo địa chỉ (#/...) và vẽ lại mỗi khi địa chỉ đổi
// 4. Đăng ký chạy offline (service worker)
//
// Các địa chỉ:
//   #/             Hôm nay (trang chủ)          → man-trang-chu.js
//   #/on           Ôn từ đến hạn                → man-the-tu.js
//   #/hoc-moi[/5]  Học từ mới (của bài 5)       → man-the-tu.js
//   #/bai[/5]      Bài học / chi tiết bài 5     → man-bai-hoc.js
//   #/tu/<khóa>    Xem một từ                   → man-bai-hoc.js
//   #/luyen-tap    Luyện tập (chọn bài luyện)   → man-luyen-tap.js
//   #/luyen-viet   Luyện viết: tổng quan        → man-luyen-viet.js
//   #/luyen-viet/phien        phiên luyện viết hôm nay
//   #/luyen-viet/chu/<chữ>    luyện riêng một chữ
//   #/thanh-dieu   Luyện thanh điệu: chọn dạng  → man-thanh-dieu.js
//   #/thanh-dieu/<dạng>       phiên 10 câu (mot, hai-ba, hai, bat-nhat, ba-ba)
//   #/trac-nghiem  Trắc nghiệm: chọn dạng       → man-trac-nghiem.js
//   #/trac-nghiem/<dạng>      lượt 10 câu (tron, nghia, chu, nghe, pinyin, so-sai)
//   #/trac-nghiem/bai/<số>    kiểm tra từ của một bài
//   #/ngu-phap     Ngữ pháp: danh sách điểm     → man-ngu-phap.js
//   #/ngu-phap/<mã>           bài học một điểm      #/ngu-phap/<mã>/luyen  luyện tập điểm đó
//   #/ngu-phap/on             ôn các điểm đến hạn
//   #/thong-ke     Thống kê                     → man-thong-ke.js
//   #/cai-dat      Cài đặt, sao lưu             → man-cai-dat.js
// =========================================================

import { docTienDo, caiDat } from './luu-tru.js';
import { taiDuLieu, layTu } from './du-lieu.js';
import { doc } from './phat-am.js';
import { esc, datTieuDe, apDungGiaoDien, doiSangToi, dongHopThoai } from './giao-dien.js';
import { ganBieuTuong, bieuTuong } from './bieu-tuong.js';
import { veTrangChu } from './man-trang-chu.js';
import { vePhien } from './man-the-tu.js';
import { veDanhSachBai, veBai, veTu } from './man-bai-hoc.js';
import { veCaiDat } from './man-cai-dat.js';
import { veThongKe } from './man-thong-ke.js';
import { veLuyenTap } from './man-luyen-tap.js';
import { veLuyenViet, vePhienViet, moCachViet } from './man-luyen-viet.js';
import { veThanhDieu, vePhienThanh, CAC_DANG } from './man-thanh-dieu.js';
import { veTracNghiem, vePhienTracNghiem, CAC_DANG as DANG_TRAC_NGHIEM } from './man-trac-nghiem.js';
import { veNguPhap, veDiemNguPhap, vePhienNguPhap } from './man-ngu-phap.js';

const $noiDung = () => document.getElementById('noi-dung');
let donDep = null; // hàm dọn dẹp của màn hình trước (tắt đồng hồ, bỏ phím tắt…)

// =========================================================
// ĐIỀU HƯỚNG
// =========================================================
function veTheoDiaChi() {
  if (donDep) { donDep(); donDep = null; }
  dongHopThoai();
  const duong = decodeURIComponent(location.hash.replace(/^#\/?/, '')).split('/');
  const [muc, thamSo] = duong;
  const khung = $noiDung();
  window.scrollTo(0, 0);

  // tô sáng mục đang chọn ở thanh điều hướng
  const mucChon = {
    '': 'trang-chu', bai: 'bai', tu: 'bai', on: 'bai', 'hoc-moi': 'bai',
    'luyen-tap': 'luyen-tap', 'luyen-viet': 'luyen-tap', 'thanh-dieu': 'luyen-tap', 'trac-nghiem': 'luyen-tap',
    'ngu-phap': 'luyen-tap', 'thong-ke': 'thong-ke',
  }[muc] ?? '';
  document.querySelectorAll('.dieu-huong a[data-muc]').forEach((a) => {
    const chon = a.dataset.muc === mucChon;
    a.classList.toggle('dang-chon', chon);
    if (chon) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });

  if (muc === 'on') {
    datTieuDe('Ôn tập', '#/');
    donDep = vePhien(khung, 'on');
  } else if (muc === 'hoc-moi') {
    const soBai = thamSo ? Number(thamSo) : null;
    datTieuDe(soBai ? `Từ mới · Bài ${soBai}` : 'Học từ mới', soBai ? `#/bai/${soBai}` : '#/');
    donDep = vePhien(khung, 'moi', soBai);
  } else if (muc === 'bai' && thamSo) {
    datTieuDe(`Bài ${Number(thamSo)}`, '#/bai');
    veBai(khung, Number(thamSo));
  } else if (muc === 'bai') {
    datTieuDe('Bài học');
    veDanhSachBai(khung);
  } else if (muc === 'tu') {
    const khoa = duong.slice(1).join('/');
    const tu = layTu(khoa);
    datTieuDe('Xem từ', tu ? `#/bai/${tu.bai}` : '#/bai');
    veTu(khung, khoa);
  } else if (muc === 'luyen-viet' && thamSo === 'phien') {
    datTieuDe('Luyện viết', '#/luyen-viet');
    donDep = vePhienViet(khung);
  } else if (muc === 'luyen-viet' && thamSo === 'chu' && duong[2]) {
    datTieuDe(`Luyện viết · ${duong[2]}`, '#/luyen-viet');
    donDep = vePhienViet(khung, duong[2]);
  } else if (muc === 'luyen-viet') {
    datTieuDe('Luyện viết', '#/luyen-tap');
    veLuyenViet(khung);
  } else if (muc === 'ngu-phap' && thamSo === 'on') {
    datTieuDe('Ôn ngữ pháp', '#/ngu-phap');
    donDep = vePhienNguPhap(khung, 'on');
  } else if (muc === 'ngu-phap' && thamSo && duong[2] === 'luyen') {
    datTieuDe('Luyện ngữ pháp', `#/ngu-phap/${thamSo}`);
    donDep = vePhienNguPhap(khung, thamSo);
  } else if (muc === 'ngu-phap' && thamSo) {
    datTieuDe('Ngữ pháp', '#/ngu-phap');
    veDiemNguPhap(khung, thamSo);
  } else if (muc === 'ngu-phap') {
    datTieuDe('Ngữ pháp', '#/luyen-tap');
    veNguPhap(khung);
  } else if (muc === 'trac-nghiem' && thamSo === 'bai' && duong[2]) {
    datTieuDe(`Kiểm tra Bài ${Number(duong[2])}`, `#/bai/${Number(duong[2])}`);
    donDep = vePhienTracNghiem(khung, 'bai', Number(duong[2]));
  } else if (muc === 'trac-nghiem' && thamSo) {
    datTieuDe(thamSo === 'so-sai' ? 'Ôn câu sai' : DANG_TRAC_NGHIEM[thamSo]?.ten || 'Trắc nghiệm', '#/trac-nghiem');
    donDep = vePhienTracNghiem(khung, thamSo);
  } else if (muc === 'trac-nghiem') {
    datTieuDe('Trắc nghiệm', '#/luyen-tap');
    veTracNghiem(khung);
  } else if (muc === 'thanh-dieu' && thamSo) {
    datTieuDe(CAC_DANG[thamSo]?.ten || 'Thanh điệu', '#/thanh-dieu');
    donDep = vePhienThanh(khung, thamSo);
  } else if (muc === 'thanh-dieu') {
    datTieuDe('Thanh điệu', '#/luyen-tap');
    veThanhDieu(khung);
  } else if (muc === 'luyen-tap') {
    datTieuDe('Luyện tập');
    veLuyenTap(khung);
  } else if (muc === 'thong-ke') {
    datTieuDe('Thống kê');
    veThongKe(khung);
  } else if (muc === 'cai-dat') {
    datTieuDe('Cài đặt', '#/');
    veCaiDat(khung);
  } else {
    datTieuDe('Hôm nay');
    veTrangChu(khung);
  }
}

// Bấm vào bất kỳ nút loa nào, hoặc nút "✍️ Cách viết" (dùng chung cho mọi màn hình)
document.addEventListener('click', (e) => {
  const nut = e.target.closest('[data-doc]');
  if (nut) {
    e.stopPropagation();
    doc(nut.dataset.doc);
    return;
  }
  const nutViet = e.target.closest('[data-cach-viet]');
  if (nutViet) {
    e.stopPropagation();
    moCachViet(nutViet.dataset.cachViet);
  }
});

// =========================================================
// KHỞI ĐỘNG
// =========================================================
async function khoiDong() {
  docTienDo();
  apDungGiaoDien();
  document.body.classList.toggle('kieu-khai', !!caiDat().kieuChuKhai);

  // Biểu tượng trên thanh điều hướng và thanh trên cùng
  ganBieuTuong();
  document.getElementById('nut-quay-lai').innerHTML = bieuTuong('trai');
  document.getElementById('nut-cai-dat').innerHTML = bieuTuong('cai-dat');
  document.getElementById('nut-sang-toi').onclick = doiSangToi;

  try {
    await taiDuLieu();
  } catch (e) {
    $noiDung().innerHTML = `<h2>Không tải được dữ liệu</h2><div class="loi">${esc(e.message)}</div>`;
    return;
  }
  window.addEventListener('hashchange', veTheoDiaChi);
  veTheoDiaChi();
}

khoiDong();

// Chạy offline: service worker lưu sẵn các file của app trong máy.
// Chỉ hoạt động khi mở qua http://localhost hoặc https:// (không hoạt động khi mở file trực tiếp).
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Không đăng ký được chế độ offline', e));
}
