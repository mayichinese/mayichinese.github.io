// =========================================================
// TRANG CHỦ "HÔM NAY"
//   - Banner chào + nút "Bắt đầu" (chọn sẵn việc nên làm tiếp)
//     (chữ Hán mờ phía sau = từ mới tiếp theo, lấy từ file dữ liệu)
//   - 3 ô chỉ số: chuỗi ngày, phút hôm nay, số từ đã học
//   - Tuần này: 7 ngày có học / không học
//   - Kế hoạch 60 phút chia 5 phần (phần chưa có hiện "Sắp có")
//   - Tiến độ HSK 1
// =========================================================

import { caiDat, nhatKyHomNay, chuoiNgayHoc, coLuuDuoc, layTienDo, ngayHoc, coHocNgay } from './luu-tru.js';
import { loaiThe, dangHoc } from './lich-on.js';
import { tatCaTu } from './du-lieu.js';
import { tinhTrangPhatAm } from './phat-am.js';
import { demHomNay, baiDangHoc, tuChuaHoc } from './phien-hoc.js';
import { esc } from './giao-dien.js';
import { bieuTuong } from './bieu-tuong.js';

const THU = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const THU_NGAN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function loiChao() {
  const gio = new Date().getHours();
  if (gio < 4) return 'Khuya rồi đó!';
  if (gio < 11) return 'Chào buổi sáng!';
  if (gio < 13) return 'Chào buổi trưa!';
  if (gio < 18) return 'Chào buổi chiều!';
  return 'Chào buổi tối!';
}

/** 7 ngày học gần nhất (một "ngày học" bắt đầu lúc 4 giờ sáng) */
function veTuanNay() {
  const nhatKy = layTienDo().nhatKy;
  let html = '';
  let soNgayHoc = 0;
  for (let i = 6; i >= 0; i--) {
    const khoa = ngayHoc(Date.now() - i * 86400000);
    const coHoc = coHocNgay(nhatKy[khoa]);
    if (coHoc) soNgayHoc++;
    const thu = new Date(`${khoa}T12:00:00`).getDay();
    html += `
      <div class="ngay-nho ${coHoc ? 'co-hoc' : ''} ${i === 0 ? 'hom-nay' : ''}">
        <span>${THU_NGAN[thu]}</span>
        <span class="o-ngay emoji">${coHoc ? '🔥' : ''}</span>
      </div>`;
  }
  return { html, soNgayHoc };
}

/** Một dòng trong kế hoạch 60 phút */
function dongKeHoach({ ma, emoji, ten, phut, mucTieu, moTa, href, phanTram, xong, sapCo }) {
  const the = href ? 'a' : 'div';
  return `
    <${the} class="dong-ke-hoach khung phan-${ma} ${xong ? 'da-xong' : ''} ${sapCo ? 'sap-co' : ''}" ${href ? `href="${href}"` : ''}>
      <span class="o-emoji emoji">${emoji}</span>
      <span class="giua">
        <span class="dong-tren">
          <b>${ten}</b>
          <span class="so-phut">${sapCo ? `~${mucTieu}′` : `${Math.min(phut, 999)}/${mucTieu}′`}</span>
        </span>
        <span class="mo-ta">${moTa}${sapCo ? ' · <i>Sắp có</i>' : ''}</span>
        ${sapCo ? '' : `<span class="thanh-tien-do"><span style="width:${phanTram}%"></span></span>`}
      </span>
      <span class="cuoi-dong">${xong ? '<span class="emoji">✅</span>' : href ? bieuTuong('phai') : ''}</span>
    </${the}>`;
}

export function veTrangChu(khung) {
  const cd = caiDat();
  const td = layTienDo();
  const nk = nhatKyHomNay();
  const dem = demHomNay();
  const bai = baiDangHoc();
  const chuoi = chuoiNgayHoc();
  const homNay = new Date();
  const phut = (phan) => Math.floor((nk.giay[phan] || 0) / 60);

  // Thống kê từ
  const tatCa = tatCaTu();
  const thongKe = { 'chua-hoc': 0, 'dang-hoc': 0, 'dang-on': 0, 'da-thuoc': 0 };
  tatCa.forEach((t) => thongKe[loaiThe(td.the[t.khoa])]++);
  const daHoc = tatCa.length - thongKe['chua-hoc'];
  const phanTramCap = tatCa.length ? Math.round((daHoc / tatCa.length) * 100) : 0;

  // Phút học hôm nay
  const mt = cd.phutMucTieu;
  const mucTieu = mt.on + mt.moi + mt.nghe + mt.viet + mt.nguPhap;
  const tongPhut = Math.floor(Object.values(nk.giay).reduce((a, b) => a + b, 0) / 60);

  // --- Phần 1: Ôn ---
  const tongOn = dem.daOn + dem.onDenHan;
  const onXong = dem.onDenHan === 0 && dem.dangHocDenHan === 0;
  const moTaOn = onXong
    ? (dem.daOn ? `Đã ôn xong ${dem.daOn} thẻ hôm nay` : 'Hôm nay chưa có thẻ nào đến hạn')
    : [dem.onDenHan ? `Còn <b>${dem.onDenHan}</b> thẻ đến hạn` : '',
      dem.dangHocDenHan ? `<b>${dem.dangHocDenHan}</b> thẻ đang học dở` : ''].filter(Boolean).join(' + ');
  const tienDoOn = onXong ? 100 : tongOn ? Math.round((dem.daOn / tongOn) * 100) : 0;

  // --- Phần 2: Từ mới ---
  const moiXong = dem.conTuMoi === 0 || !bai;
  const moTaMoi = !bai
    ? 'Bạn đã học hết các từ hiện có 🎉'
    : `<b>${dem.daHocMoi}/${cd.soTuMoiMoiNgay}</b> từ mới · Bài ${bai.so}: ${esc(bai.ten)}`;
  const tienDoMoi = Math.min(100, Math.round((dem.daHocMoi / cd.soTuMoiMoiNgay) * 100));

  // --- Phần 3: Nghe & thanh điệu (xong khi đủ số phút mục tiêu) ---
  const ngheXong = phut('nghe') >= mt.nghe;
  const moTaNghe = nk.thanh
    ? `Đã trả lời <b>${nk.thanh}</b> câu hôm nay`
    : 'Nghe chọn thanh, cặp thanh 2–3, biến điệu 不/一';
  const tienDoNghe = Math.min(100, Math.round((phut('nghe') / mt.nghe) * 100));

  // --- Phần 4: Viết chữ (đếm thẳng từ lịch ôn chữ viết, không cần tải dữ liệu nét) ---
  const bayGio = Date.now();
  const vietCanOn = Object.values(td.theViet).filter((t) => dangHoc(t) || t.han <= bayGio).length;
  const vietMoi = nk.vietMoi || 0;
  const vietConMoi = Math.max(0, cd.soChuVietMoiMoiNgay - vietMoi);
  const vietXong = vietCanOn === 0 && vietConMoi === 0;
  const moTaViet = `${vietCanOn ? `<b>${vietCanOn}</b> chữ cần ôn · ` : ''}<b>${vietMoi}/${cd.soChuVietMoiMoiNgay}</b> chữ mới`;
  const tienDoViet = vietXong ? 100 : Math.min(100, Math.round((vietMoi / cd.soChuVietMoiMoiNgay) * 100));

  // --- Phần 5: Trắc nghiệm (Giai đoạn 3; ngữ pháp làm ở Giai đoạn 4) – xong khi đủ số phút ---
  const tnXong = phut('nguPhap') >= mt.nguPhap;
  const soSai = Object.keys(td.tracNghiem.soSai).length;
  const duTuTracNghiem = daHoc >= 4;
  const moTaTracNghiem = [
    nk.tracNghiem ? `Đã làm <b>${nk.tracNghiem}</b> câu` : (duTuTracNghiem ? 'Trắc nghiệm từ đã học' : 'Học từ 4 từ trở lên để làm trắc nghiệm'),
    soSai ? `sổ câu sai: <b>${soSai}</b>` : '',
  ].filter(Boolean).join(' · ');
  const tienDoTracNghiem = Math.min(100, Math.round((phut('nguPhap') / mt.nguPhap) * 100));

  // Nút "Bắt đầu": chọn phần nên làm tiếp theo (theo thứ tự kế hoạch 60 phút)
  let batDau;
  if (!onXong) batDau = { chu: `Ôn ${dem.onDenHan + dem.dangHocDenHan} thẻ`, href: '#/on' };
  else if (!moiXong) batDau = { chu: 'Học từ mới', href: '#/hoc-moi' };
  else if (!ngheXong) batDau = { chu: 'Luyện thanh điệu', href: '#/thanh-dieu' };
  else if (!vietXong) batDau = { chu: 'Luyện viết chữ', href: '#/luyen-viet/phien' };
  else if (!tnXong && duTuTracNghiem) batDau = { chu: 'Làm trắc nghiệm', href: '#/trac-nghiem/tron' };
  else batDau = { chu: 'Xem lại bài học', href: '#/bai' };

  // Cảnh báo
  const canhBao = [];
  if (!coLuuDuoc()) canhBao.push('⚠️ Trình duyệt đang chặn lưu dữ liệu (có thể do chế độ ẩn danh). Tiến độ sẽ mất khi đóng trang.');
  const ttPhatAm = tinhTrangPhatAm();
  if (ttPhatAm === 'khong-ho-tro') canhBao.push('⚠️ Trình duyệt này không hỗ trợ đọc phát âm. Hãy dùng Chrome, Edge hoặc Safari.');
  if (ttPhatAm === 'khong-co-giong') canhBao.push('⚠️ Máy chưa có giọng đọc tiếng Trung nên nút 🔊 sẽ không có tiếng. Xem cách cài trong <a href="#/cai-dat">Cài đặt</a>.');
  const ngaySaoLuu = td.saoLuuLanCuoi ? new Date(td.saoLuuLanCuoi) : null;
  if (daHoc >= 10 && (!ngaySaoLuu || Date.now() - ngaySaoLuu > 7 * 86400000)) {
    canhBao.push(`💾 ${ngaySaoLuu ? 'Đã hơn 7 ngày bạn chưa sao lưu.' : 'Bạn chưa sao lưu lần nào.'} <a href="#/cai-dat">Sao lưu ngay</a> để không mất tiến độ.`);
  }

  const tuan = veTuanNay();
  const tuTiepTheo = tuChuaHoc()[0];

  const keHoach = [
    { ma: 'on', emoji: '🔁', ten: 'Ôn từ đến hạn', phut: phut('on'), mucTieu: mt.on, moTa: moTaOn,
      href: '#/on', phanTram: tienDoOn, xong: onXong },
    { ma: 'moi', emoji: '✨', ten: 'Học từ mới', phut: phut('moi'), mucTieu: mt.moi, moTa: moTaMoi,
      href: bai ? '#/hoc-moi' : '', phanTram: tienDoMoi, xong: moiXong },
    { ma: 'nghe', emoji: '🎧', ten: 'Nghe & thanh điệu', phut: phut('nghe'), mucTieu: mt.nghe, moTa: moTaNghe,
      href: '#/thanh-dieu', phanTram: tienDoNghe, xong: ngheXong },
    { ma: 'viet', emoji: '✍️', ten: 'Viết chữ Hán', phut: phut('viet'), mucTieu: mt.viet, moTa: moTaViet,
      href: '#/luyen-viet', phanTram: tienDoViet, xong: vietXong },
    { ma: 'nguPhap', emoji: '📝', ten: 'Trắc nghiệm & ngữ pháp', phut: phut('nguPhap'), mucTieu: mt.nguPhap, moTa: moTaTracNghiem,
      href: '#/trac-nghiem', phanTram: tienDoTracNghiem, xong: tnXong },
  ];

  khung.innerHTML = `
    ${canhBao.length ? `<div class="ds-canh-bao">${canhBao.map((c) => `<div class="can-kiem-tra">${c}</div>`).join('')}</div>` : ''}

    <section class="hero">
      <div class="hero-noi-dung">
        <span class="nhan nhan-chinh">${THU[homNay.getDay()]} · ${homNay.getDate()}/${homNay.getMonth() + 1}</span>
        <h2 class="hero-tieu-de">${loiChao()}
          <span>${tongPhut >= mucTieu ? `Đã đủ ${mucTieu} phút!` : tongPhut ? `Đã học ${tongPhut}/${mucTieu} phút` : `Cùng học ${mucTieu} phút nhé!`}</span></h2>
        <p class="chu-phu">Ôn từ cũ, học ${cd.soTuMoiMoiNgay} từ mới, rồi luyện nghe và viết.</p>
        <a class="nut nut-chinh nut-bat-dau" href="${batDau.href}">${bieuTuong('bat-dau')} Bắt đầu: ${batDau.chu}</a>
      </div>
      ${tuTiepTheo ? `<div class="hero-han han" aria-hidden="true">${esc(tuTiepTheo.hanzi)}</div>` : ''}
    </section>

    <div class="hang-chi-so">
      <div class="khung o-chi-so ${chuoi ? 'dang-chay' : ''}">
        <span class="emoji">🔥</span><b>${chuoi}</b><span>ngày liên tục</span>
      </div>
      <div class="khung o-chi-so">
        <span class="emoji">⏱️</span><b>${tongPhut}<small>/${mucTieu}</small></b><span>phút hôm nay</span>
      </div>
      <div class="khung o-chi-so">
        <span class="emoji">📚</span><b>${daHoc}</b><span>từ đã học</span>
      </div>
    </div>

    <section class="khung tuan-nay">
      <div class="dong-tren"><b>Tuần này</b><span class="chu-phu nho">${tuan.soNgayHoc}/7 ngày có học</span></div>
      <div class="bay-ngay">${tuan.html}</div>
    </section>

    <h3 class="tieu-de-muc">Kế hoạch ${mucTieu} phút <small>${tongPhut}/${mucTieu}′</small></h3>
    <div class="ke-hoach">${keHoach.map(dongKeHoach).join('')}</div>

    <h3 class="tieu-de-muc">Tiến độ HSK 1 <small>${daHoc}/${tatCa.length} từ</small></h3>
    <a class="khung tien-do-cap" href="#/bai">
      <div class="dong-tren"><b>${phanTramCap}% đã học</b><span class="nhan nhan-vang">⭐ Thuộc chắc ${thongKe['da-thuoc']}</span></div>
      <div class="thanh-tien-do"><span style="width:${phanTramCap}%"></span></div>
      <span class="chu-phu nho">Đang học/ôn ${thongKe['dang-hoc'] + thongKe['dang-on']} từ · Chạm để xem các bài →</span>
    </a>
  `;
}
