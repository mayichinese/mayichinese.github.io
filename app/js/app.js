// =========================================================
// ĐIỂM KHỞI ĐỘNG CỦA APP MAYI CHINESE
// 1. Đọc tiến độ đã lưu trên máy, áp dụng sáng/tối
// 2. Tải dữ liệu từ vựng
// 3. Vẽ màn hình theo địa chỉ (#/...) và vẽ lại mỗi khi địa chỉ đổi
// 4. Đăng ký chạy offline (service worker)
//
// Thanh điều hướng (5 mục, sắp xếp kiểu Duolingo):
//   Hôm nay (#/) · Bài học (#/bai) · Ôn luyện (#/luyen-tap) · Chữ & âm (#/chu-am) · Thi thử (#/thi-thu) · Tôi (#/toi)
//   Cấp HSK mở khóa dần (cap-do.js): bài / thi thử của cấp đang khóa không vào được.
//
// Các địa chỉ:
//   #/             Hôm nay (trang chủ)          → man-trang-chu.js
//   #/on           Ôn từ đến hạn                → man-the-tu.js
//   #/hoc-moi[/s5] Học từ mới → chuyển tới chặng tiếp theo của bài (hoặc bài đang học)
//   #/chang/<mã bài>/<số>  một chặng bài học: nghe → nói → viết → ghép → đọc → man-chang.js
//   #/doc-hieu/<mã bài>  đọc hiểu cuối bài (hội thoại / đoạn văn + câu hỏi) → man-doc-hieu.js
//   #/bai[/5]      Bài học (lộ trình) / bài 5   → man-bai-hoc.js
//   #/tu/<khóa>    Xem một từ                   → man-bai-hoc.js
//   #/luyen-tap    Ôn luyện: cần ôn + kỹ năng   → man-luyen-tap.js
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
//   #/chu-am[/phien-am|net|bo-thu|tu-loai]  Chữ & âm: tra cứu phiên âm, nét cơ bản, bộ thủ, từ loại → man-chu-am.js
//   #/chu-am/tu-loai/<mã>  một từ loại (vị trí trong câu, công thức, lỗi hay nhầm) → man-tu-loai.js
//   #/chu-am/luyen/<phien-am|bo-thu>  lượt luyện 10 câu
//   #/luyen-noi[/<dạng>]  Nói & phát âm: chấm phát âm bằng micro → man-luyen-noi.js
//   #/thi-thu[/cap/2] Thi thử HSK 1 / 2 / 3: giới thiệu → man-thi-thu.js  #/thi-thu/lam  đề HSK 1 · #/thi-thu/lam/2 · #/thi-thu/lam/3
//   #/toi          Tôi: tiến độ, thống kê       → man-thong-ke.js   (#/thong-ke: địa chỉ cũ, vẫn dùng được)
//   #/cai-dat      Cài đặt, sao lưu (mở từ "Tôi") → man-cai-dat.js
// =========================================================

import { docTienDo, caiDat } from './luu-tru.js';
import { taiDuLieu, layTu, timBaiTheoMa, maBaiTuDiaChi, nhanBai, maBaiCuaTu, cheDoBai } from './du-lieu.js';
import { doc } from './phat-am.js';
import { esc, datTieuDe, apDungGiaoDien, doiSangToi, dongHopThoai, thongBao } from './giao-dien.js';
import { ganBieuTuong, bieuTuong } from './bieu-tuong.js';
import { veTrangChu } from './man-trang-chu.js';
import { vePhien } from './man-the-tu.js';
import { baiDangHoc } from './phien-hoc.js';
import { veDanhSachBai, veBai, veTu } from './man-bai-hoc.js';
import { veCaiDat } from './man-cai-dat.js';
import { veThongKe } from './man-thong-ke.js';
import { veLuyenTap } from './man-luyen-tap.js';
import { veLuyenViet, vePhienViet, moCachViet } from './man-luyen-viet.js';
import { veThanhDieu, vePhienThanh, CAC_DANG } from './man-thanh-dieu.js';
import { veTracNghiem, vePhienTracNghiem, CAC_DANG as DANG_TRAC_NGHIEM } from './man-trac-nghiem.js';
import { veNguPhap, veDiemNguPhap, vePhienNguPhap } from './man-ngu-phap.js';
import { veThiThu, veLamBai } from './man-thi-thu.js';
import { veChuAm, vePhienChuAm } from './man-chu-am.js';
import { veTuLoai, moTuLoai } from './man-tu-loai.js';
import { veChang, changTiepTheo } from './man-chang.js';
import { moXemTu } from './cham-tu.js';
import { veDocHieu } from './man-doc-hieu.js';
import { capMo } from './cap-do.js';
import { veLuyenNoi, vePhienNoi, moChamNhanh, CAC_DANG_NOI } from './man-luyen-noi.js';

const $noiDung = () => document.getElementById('noi-dung');
let donDep = null; // hàm dọn dẹp của màn hình trước (tắt đồng hồ, bỏ phím tắt…)

// =========================================================
// ĐIỀU HƯỚNG
// =========================================================
function veTheoDiaChi() {
  // Có bản mới đã tải xong và người học về trang Hôm nay → tải lại để dùng bản mới (không cắt ngang bài đang làm)
  if (coBanMoi && !location.hash.replace(/^#\/?/, '')) { location.reload(); return; }
  if (donDep) { donDep(); donDep = null; }
  dongHopThoai();
  const duong = decodeURIComponent(location.hash.replace(/^#\/?/, '')).split('/');
  const [muc, thamSo] = duong;
  const khung = $noiDung();
  window.scrollTo(0, 0);

  // tô sáng mục đang chọn ở thanh điều hướng
  let mucChon = {
    '': 'trang-chu', bai: 'bai', tu: 'bai', 'hoc-moi': 'bai', chang: 'bai', 'doc-hieu': 'bai',
    on: 'luyen-tap', 'luyen-tap': 'luyen-tap', 'luyen-viet': 'luyen-tap', 'thanh-dieu': 'luyen-tap',
    'trac-nghiem': 'luyen-tap', 'ngu-phap': 'luyen-tap', 'luyen-noi': 'luyen-tap',
    'thi-thu': 'thi-thu', toi: 'toi', 'thong-ke': 'toi', 'cai-dat': 'toi', 'chu-am': 'chu-am',
  }[muc] ?? '';
  if (muc === 'trac-nghiem' && thamSo === 'bai') mucChon = 'bai'; // kiểm tra một bài = bước 3 của bài học
  document.querySelectorAll('.dieu-huong a[data-muc]').forEach((a) => {
    const chon = a.dataset.muc === mucChon;
    a.classList.toggle('dang-chon', chon);
    if (chon) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });

  if (muc === 'on') {
    datTieuDe('Ôn từ vựng', '#/luyen-tap');
    donDep = vePhien(khung, 'on');
  } else if (muc === 'hoc-moi') {
    // "Học từ mới" = chặng tiếp theo của bài (thamSo) hoặc của bài đang học
    let bai = thamSo ? timBaiTheoMa(maBaiTuDiaChi(thamSo)) : baiDangHoc();
    if (bai && !bai.sach) bai = baiDangHoc();
    const chang = bai && capMo(bai.cap) ? changTiepTheo(bai) : null;
    location.replace(chang ? `#/chang/${bai.ma}/${chang.so}` : bai ? `#/bai/${bai.ma}` : '#/bai');
    return;
  } else if (muc === 'doc-hieu' && thamSo) {
    const bai = timBaiTheoMa(maBaiTuDiaChi(thamSo));
    datTieuDe('Đọc hiểu', bai ? `#/bai/${bai.ma}` : '#/bai');
    donDep = veDocHieu(khung, bai ? bai.ma : thamSo);
  } else if (muc === 'chang' && thamSo) {
    const bai = timBaiTheoMa(maBaiTuDiaChi(thamSo));
    if (bai && !capMo(bai.cap)) { location.replace(`#/bai/${bai.ma}`); return; }   // cấp đang khóa
    datTieuDe(bai ? `${nhanBai(bai)} · Chặng ${Number(duong[2] || 0) + 1}` : 'Chặng', bai ? `#/bai/${bai.ma}` : '#/bai');
    donDep = veChang(khung, bai ? bai.ma : thamSo, Number(duong[2] || 0));
  } else if (muc === 'bai' && thamSo) {
    const bai = timBaiTheoMa(maBaiTuDiaChi(thamSo));
    datTieuDe(bai ? nhanBai(bai) : 'Bài học', '#/bai');
    veBai(khung, maBaiTuDiaChi(thamSo));
  } else if (muc === 'bai') {
    datTieuDe('Bài học');
    veDanhSachBai(khung);
  } else if (muc === 'tu') {
    const khoa = duong.slice(1).join('/');
    const tu = layTu(khoa);
    datTieuDe('Xem từ', tu ? `#/bai/${maBaiCuaTu(tu, cheDoBai(caiDat()))}` : '#/bai');
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
  } else if (muc === 'thi-thu' && thamSo === 'lam') {
    const capThi = ['2', '3'].includes(duong[2]) ? Number(duong[2]) : 1;
    if (!capMo(capThi)) { location.replace(`#/thi-thu/cap/${capThi}`); return; }   // cấp đang khóa
    datTieuDe(`Thi thử HSK ${capThi}`, '#/thi-thu');
    donDep = veLamBai(khung, capThi);
  } else if (muc === 'thi-thu') {
    datTieuDe('Thi thử');
    veThiThu(khung, thamSo === 'cap' && ['1', '2', '3'].includes(duong[2]) ? Number(duong[2]) : null);
  } else if (muc === 'chu-am' && thamSo === 'luyen') {
    datTieuDe(duong[2] === 'bo-thu' ? 'Luyện bộ thủ' : 'Luyện phiên âm', `#/chu-am/${duong[2] === 'bo-thu' ? 'bo-thu' : 'phien-am'}`);
    donDep = vePhienChuAm(khung, duong[2] === 'bo-thu' ? 'bo-thu' : 'phien-am');
  } else if (muc === 'chu-am' && thamSo === 'tu-loai' && duong[2]) {
    datTieuDe('Từ loại', '#/chu-am/tu-loai');
    veTuLoai(khung, duong[2]);
  } else if (muc === 'chu-am') {
    datTieuDe('Chữ & âm');
    veChuAm(khung, thamSo);
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
    const bai = timBaiTheoMa(maBaiTuDiaChi(duong[2]));
    datTieuDe(bai ? `Kiểm tra ${nhanBai(bai)}` : 'Kiểm tra bài', bai ? `#/bai/${bai.ma}` : '#/bai');
    donDep = vePhienTracNghiem(khung, 'bai', bai ? bai.ma : null);
  } else if (muc === 'trac-nghiem' && thamSo) {
    datTieuDe(thamSo === 'so-sai' ? 'Ôn câu sai' : DANG_TRAC_NGHIEM[thamSo]?.ten || 'Trắc nghiệm', '#/trac-nghiem');
    donDep = vePhienTracNghiem(khung, thamSo);
  } else if (muc === 'trac-nghiem') {
    datTieuDe('Trắc nghiệm', '#/luyen-tap');
    veTracNghiem(khung);
  } else if (muc === 'luyen-noi' && CAC_DANG_NOI[thamSo]) {
    datTieuDe(CAC_DANG_NOI[thamSo].ten, '#/luyen-noi');
    donDep = vePhienNoi(khung, thamSo);
  } else if (muc === 'luyen-noi') {
    datTieuDe('Nói & phát âm', '#/luyen-tap');
    veLuyenNoi(khung);
  } else if (muc === 'thanh-dieu' && thamSo) {
    datTieuDe(CAC_DANG[thamSo]?.ten || 'Thanh điệu', '#/thanh-dieu');
    donDep = vePhienThanh(khung, thamSo);
  } else if (muc === 'thanh-dieu') {
    datTieuDe('Thanh điệu', '#/luyen-tap');
    veThanhDieu(khung);
  } else if (muc === 'luyen-tap') {
    datTieuDe('Ôn luyện');
    veLuyenTap(khung);
  } else if (muc === 'toi' || muc === 'thong-ke') {
    datTieuDe('Tôi');
    veThongKe(khung);
  } else if (muc === 'cai-dat') {
    datTieuDe('Cài đặt', '#/toi');
    veCaiDat(khung);
  } else {
    datTieuDe('Hôm nay');
    veTrangChu(khung);
  }
}

// Bấm vào bất kỳ nút loa nào, nút "✍️ Cách viết" hoặc "🎤 Đọc thử" (dùng chung cho mọi màn hình)
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
    return;
  }
  const nutTu = e.target.closest('[data-xem-tu]');
  if (nutTu) {
    e.stopPropagation();
    moXemTu(nutTu.dataset.xemTu);
    return;
  }
  const nutTL = e.target.closest('[data-tu-loai]');
  if (nutTL) {
    e.stopPropagation();
    moTuLoai(nutTL.dataset.tuLoai, nutTL.dataset.khoa || '');
    return;
  }
  const nutNoi = e.target.closest('[data-noi-thu]');
  if (nutNoi) {
    e.stopPropagation();
    moChamNhanh(nutNoi.dataset.noiThu, nutNoi.dataset.py || '');
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
  document.getElementById('nut-sang-toi').onclick = doiSangToi;

  try {
    await taiDuLieu();
  } catch (e) {
    $noiDung().innerHTML = `<h2>Không tải được dữ liệu</h2><div class="loi">${esc(e.message)}</div>`;
    return;
  }
  window.addEventListener('hashchange', veTheoDiaChi);
  veTheoDiaChi();
  // Ghi thời gian mở app (từ lúc trình duyệt bắt đầu tải trang đến khi hiện màn hình đầu) – xem ở Cài đặt → Thông tin kỹ thuật.
  // Khóa riêng, không đụng tới tiến độ học.
  try {
    localStorage.setItem('mayi-thoi-gian-mo', JSON.stringify({
      ms: Math.round(performance.now()), luc: Date.now(), offline: !!navigator.serviceWorker?.controller,
    }));
  } catch { /* không lưu được thì thôi */ }
}

khoiDong();

// Chạy offline: service worker lưu sẵn các file của app trong máy.
// Chỉ hoạt động khi mở qua http://localhost hoặc https:// (không hoạt động khi mở file trực tiếp).
// App mở ngay bằng bản đã cất trong máy; bản mới (nếu có) được tải ở nền. Tải xong:
//   - vừa mở app (≤ 15 giây) và chưa vào bài nào → tải lại luôn cho người học dùng bản mới
//   - đang học → báo một dòng, khi về trang Hôm nay mới tải lại
let coBanMoi = false;
const lucMo = Date.now();
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  const daCoBanCu = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!daCoBanCu || coBanMoi) return;   // lần cài đầu tiên: không cần tải lại
    coBanMoi = true;
    if (Date.now() - lucMo < 15000 && !document.body.classList.contains('dang-hoc') && !location.hash.replace(/^#\/?/, '')) {
      location.reload();
    } else {
      thongBao('🆕 Đã tải bản cập nhật – sẽ dùng khi bạn về trang Hôm nay.', 4500);
    }
  });
  navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Không đăng ký được chế độ offline', e));
}
