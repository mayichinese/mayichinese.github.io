// =========================================================
// TRANG CHỦ "HÔM NAY" – trả lời câu hỏi "hôm nay học gì?"
//   - Banner: lời chào, số phút đã học / mục tiêu, MỘT nút "Tiếp tục" (chọn sẵn việc nên làm tiếp)
//     (chữ Hán mờ phía sau = từ mới tiếp theo, lấy từ file dữ liệu)
//   - Chuỗi ngày học + 7 ngày gần nhất (gộp trong một thẻ)
//   - Nhiệm vụ hôm nay: 5 phần của kế hoạch 60 phút, bấm là vào học ngay
//   - Bài đang học (mở bài trong lộ trình)
// Thống kê chi tiết nằm ở mục "Tôi"; danh sách bài ở "Bài học".
// =========================================================

import { caiDat, nhatKyHomNay, chuoiNgayHoc, coLuuDuoc, layTienDo, ngayHoc, coHocNgay } from './luu-tru.js';
import { dangHoc } from './lich-on.js';
import { tatCaTu, nhanBai } from './du-lieu.js';
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
  for (let i = 6; i >= 0; i--) {
    const khoa = ngayHoc(Date.now() - i * 86400000);
    const coHoc = coHocNgay(nhatKy[khoa]);
    const thu = new Date(`${khoa}T12:00:00`).getDay();
    html += `
      <div class="ngay-nho ${coHoc ? 'co-hoc' : ''} ${i === 0 ? 'hom-nay' : ''}">
        <span class="o-ngay emoji">${coHoc ? '🔥' : ''}</span>
        <span>${i === 0 ? 'Nay' : THU_NGAN[thu]}</span>
      </div>`;
  }
  return html;
}

/** Một dòng nhiệm vụ. `nut` = các nút nhỏ bên trong (khi một nhiệm vụ có hai lựa chọn) */
function dongNhiemVu({ ma, emoji, ten, phut, mucTieu, moTa, href, phanTram, xong, nut }) {
  const the = href && !nut ? 'a' : 'div';
  return `
    <${the} class="dong-ke-hoach khung phan-${ma} ${xong ? 'da-xong' : ''}" ${the === 'a' ? `href="${href}"` : ''}>
      <span class="o-emoji emoji">${emoji}</span>
      <span class="giua">
        <span class="dong-tren">
          <b>${ten}</b>
          <span class="so-phut">${Math.min(phut, 999)}/${mucTieu}′</span>
        </span>
        <span class="mo-ta">${moTa}</span>
        <span class="thanh-tien-do"><span style="width:${phanTram}%"></span></span>
        ${nut ? `<span class="hang-nut-nho">${nut.map((n) => `<a class="nut nut-nho" href="${n.href}">${n.chu}</a>`).join('')}</span>` : ''}
      </span>
      <span class="cuoi-dong">${xong ? '<span class="emoji">✅</span>' : the === 'a' ? bieuTuong('phai') : ''}</span>
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
  const bayGio = Date.now();
  const phut = (phan) => Math.floor((nk.giay[phan] || 0) / 60);
  const daHoc = tatCaTu().filter((t) => td.the[t.khoa]).length;

  // Phút học hôm nay
  const mt = cd.phutMucTieu;
  const mucTieu = mt.on + mt.moi + mt.nghe + mt.viet + mt.nguPhap;
  const tongPhut = Math.floor(Object.values(nk.giay).reduce((a, b) => a + b, 0) / 60);

  // --- 1. Ôn từ ---
  const tongOn = dem.daOn + dem.onDenHan;
  const onXong = dem.onDenHan === 0 && dem.dangHocDenHan === 0;
  const moTaOn = onXong
    ? (dem.daOn ? `Đã ôn xong ${dem.daOn} thẻ` : 'Chưa có thẻ nào đến hạn')
    : [dem.onDenHan ? `Còn <b>${dem.onDenHan}</b> thẻ đến hạn` : '',
      dem.dangHocDenHan ? `<b>${dem.dangHocDenHan}</b> thẻ học dở` : ''].filter(Boolean).join(' + ');
  const tienDoOn = onXong ? 100 : tongOn ? Math.round((dem.daOn / tongOn) * 100) : 0;

  // --- 2. Từ mới ---
  const moiXong = dem.conTuMoi === 0 || !bai;
  const moTaMoi = !bai ? 'Bạn đã học hết các từ hiện có 🎉' : `<b>${dem.daHocMoi}/${cd.soTuMoiMoiNgay}</b> từ · ${nhanBai(bai)}`;
  const tienDoMoi = Math.min(100, Math.round((dem.daHocMoi / cd.soTuMoiMoiNgay) * 100));

  // --- 3. Nghe & thanh điệu (xong khi đủ số phút mục tiêu) ---
  const ngheXong = phut('nghe') >= mt.nghe;
  const moTaNghe = nk.thanh ? `Đã trả lời <b>${nk.thanh}</b> câu` : 'Nghe rồi chọn đúng thanh điệu';
  const tienDoNghe = Math.min(100, Math.round((phut('nghe') / mt.nghe) * 100));

  // --- 4. Viết chữ (đếm thẳng từ lịch ôn chữ viết, không cần tải dữ liệu nét) ---
  const vietCanOn = Object.values(td.theViet).filter((t) => dangHoc(t) || t.han <= bayGio).length;
  const vietMoi = nk.vietMoi || 0;
  const vietConMoi = Math.max(0, cd.soChuVietMoiMoiNgay - vietMoi);
  const vietXong = vietCanOn === 0 && vietConMoi === 0;
  const moTaViet = `${vietCanOn ? `<b>${vietCanOn}</b> chữ cần ôn · ` : ''}<b>${vietMoi}/${cd.soChuVietMoiMoiNgay}</b> chữ mới`;
  const tienDoViet = vietXong ? 100 : Math.min(100, Math.round((vietMoi / cd.soChuVietMoiMoiNgay) * 100));

  // --- 5. Ngữ pháp & trắc nghiệm (thời gian tính chung vào phần nguPhap) – xong khi đủ số phút ---
  const tnXong = phut('nguPhap') >= mt.nguPhap;
  const duTuTracNghiem = daHoc >= 4;
  // Ngữ pháp cần ôn: đếm thẳng từ lịch ôn (không cần tải dữ liệu ngữ pháp)
  const npCanOn = Object.values(td.nguPhap.the).filter((t) => dangHoc(t) || t.han <= bayGio).length;
  const daLam5 = (nk.tracNghiem || 0) + (nk.nguPhap || 0);
  const moTaNguPhap = daLam5 ? `Đã làm <b>${daLam5}</b> câu` : 'Học ngữ pháp hoặc làm trắc nghiệm từ đã học';
  const tienDoNguPhap = Math.min(100, Math.round((phut('nguPhap') / mt.nguPhap) * 100));
  const nutNguPhap = [
    { chu: npCanOn ? `🧩 Ôn ${npCanOn} điểm` : '🧩 Ngữ pháp', href: npCanOn ? '#/ngu-phap/on' : '#/ngu-phap' },
    duTuTracNghiem ? { chu: '📝 Trắc nghiệm', href: '#/trac-nghiem/tron' } : null,
  ].filter(Boolean);

  // Nút "Tiếp tục": chọn phần nên làm tiếp theo (theo thứ tự kế hoạch 60 phút)
  let tiepTuc;
  if (!onXong) tiepTuc = { chu: `Ôn ${dem.onDenHan + dem.dangHocDenHan} thẻ từ`, href: '#/on' };
  else if (!moiXong) tiepTuc = { chu: 'Học từ mới', href: '#/hoc-moi' };
  else if (!ngheXong) tiepTuc = { chu: 'Luyện thanh điệu', href: '#/thanh-dieu' };
  else if (!vietXong) tiepTuc = { chu: 'Luyện viết chữ', href: '#/luyen-viet/phien' };
  else if (!tnXong && npCanOn) tiepTuc = { chu: `Ôn ${npCanOn} điểm ngữ pháp`, href: '#/ngu-phap/on' };
  else if (!tnXong && duTuTracNghiem) tiepTuc = { chu: 'Làm trắc nghiệm', href: '#/trac-nghiem/tron' };
  else if (!tnXong) tiepTuc = { chu: 'Học ngữ pháp', href: '#/ngu-phap' };
  else tiepTuc = { chu: 'Luyện thêm', href: '#/luyen-tap' };

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

  const tuTiepTheo = tuChuaHoc()[0];

  const nhiemVu = [
    { ma: 'on', emoji: '🔁', ten: 'Ôn từ đến hạn', phut: phut('on'), mucTieu: mt.on, moTa: moTaOn,
      href: '#/on', phanTram: tienDoOn, xong: onXong },
    { ma: 'moi', emoji: '✨', ten: 'Học từ mới', phut: phut('moi'), mucTieu: mt.moi, moTa: moTaMoi,
      href: bai ? '#/hoc-moi' : '#/bai', phanTram: tienDoMoi, xong: moiXong },
    { ma: 'nghe', emoji: '🎧', ten: 'Nghe & thanh điệu', phut: phut('nghe'), mucTieu: mt.nghe, moTa: moTaNghe,
      href: '#/thanh-dieu', phanTram: tienDoNghe, xong: ngheXong },
    { ma: 'viet', emoji: '✍️', ten: 'Viết chữ Hán', phut: phut('viet'), mucTieu: mt.viet, moTa: moTaViet,
      href: vietXong ? '#/luyen-viet' : '#/luyen-viet/phien', phanTram: tienDoViet, xong: vietXong },
    { ma: 'nguPhap', emoji: '🧩', ten: 'Ngữ pháp & trắc nghiệm', phut: phut('nguPhap'), mucTieu: mt.nguPhap,
      moTa: moTaNguPhap, phanTram: tienDoNguPhap, xong: tnXong, nut: nutNguPhap },
  ];
  const soXong = nhiemVu.filter((k) => k.xong).length;

  // Bài đang học (bài đầu tiên còn từ chưa học, theo cách chia bài đang chọn)
  let theBai = '';
  if (bai) {
    const daHocBai = bai.tu.filter((t) => td.the[t.khoa]).length;
    const pt = Math.round((daHocBai / bai.tu.length) * 100);
    theBai = `
    <h3 class="tieu-de-muc">Bài đang học <small><a href="#/bai">Xem lộ trình →</a></small></h3>
    <a class="khung the-bai-dang-hoc" href="#/bai/${bai.ma}">
      <span class="nut-tron dang han">${esc([...(bai.tu[0]?.hanzi || '')].slice(0, 2).join(''))}</span>
      <span class="giua">
        <span class="so-bai">${nhanBai(bai)}</span>
        <b>${esc(bai.ten)}</b>
        <span class="thanh-tien-do"><span style="width:${pt}%"></span></span>
        <span class="chu-phu nho">${daHocBai}/${bai.tu.length} từ đã học</span>
      </span>
      <span class="cuoi-dong">${bieuTuong('phai')}</span>
    </a>`;
  }

  khung.innerHTML = `
    ${canhBao.length ? `<div class="ds-canh-bao">${canhBao.map((c) => `<div class="can-kiem-tra">${c}</div>`).join('')}</div>` : ''}

    <section class="hero">
      <div class="hero-noi-dung">
        <span class="nhan nhan-chinh">${THU[homNay.getDay()]} · ${homNay.getDate()}/${homNay.getMonth() + 1}</span>
        <h2 class="hero-tieu-de">${loiChao()}
          <span>${tongPhut >= mucTieu ? `Đã đủ ${mucTieu} phút! 🎉` : tongPhut ? `Đã học ${tongPhut}/${mucTieu} phút` : `Cùng học ${mucTieu} phút nhé!`}</span></h2>
        <div class="muc-tieu-ngay">
          <span class="thanh-tien-do"><span style="width:${Math.min(100, Math.round((tongPhut / mucTieu) * 100))}%"></span></span>
          <span class="chu-phu nho">${soXong}/5 nhiệm vụ</span>
        </div>
        <a class="nut nut-chinh nut-bat-dau" href="${tiepTuc.href}">${bieuTuong('bat-dau')} Tiếp tục: ${tiepTuc.chu}</a>
      </div>
      ${tuTiepTheo ? `<div class="hero-han han" aria-hidden="true">${esc(tuTiepTheo.hanzi)}</div>` : ''}
    </section>

    <section class="khung the-chuoi ${chuoi ? 'dang-chay' : ''}">
      <div class="chuoi-so">
        <span class="emoji">🔥</span>
        <b>${chuoi}</b>
        <span>ngày<br>liên tục</span>
      </div>
      <div class="bay-ngay">${veTuanNay()}</div>
    </section>

    <h3 class="tieu-de-muc">Nhiệm vụ hôm nay <small>${soXong}/5 xong</small></h3>
    <div class="ke-hoach">${nhiemVu.map(dongNhiemVu).join('')}</div>
    ${theBai}
  `;
}
