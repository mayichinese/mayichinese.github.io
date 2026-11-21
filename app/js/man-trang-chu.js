// =========================================================
// TRANG CHỦ "HÔM NAY" – trả lời câu hỏi "hôm nay học gì?"
//   - (lần đầu) chọn mục tiêu số phút mỗi ngày: 10 / 20 / 30 / 60 – không ép học 60 phút
//   - Banner: lời chào, số phút đã học / mục tiêu, MỘT nút "Tiếp tục" (chọn sẵn việc nên làm tiếp)
//     (chữ Hán mờ phía sau = từ mới tiếp theo, lấy từ file dữ liệu)
//   - Chuỗi ngày học + 7 ngày gần nhất
//   - 3 nhiệm vụ hằng ngày ngẫu nhiên (nhiem-vu.js) + nhiệm vụ tháng
//   - Bài đang học (mở bài trong lộ trình)
// =========================================================

import {
  caiDat, luu, chuoiNgayHoc, coLuuDuoc, layTienDo, ngayHoc, coHocNgay, phutMoiNgay, tongPhutNgay, CAC_MUC_TIEU,
} from './luu-tru.js';
import { tatCaTu, nhanBai } from './du-lieu.js';
import { tinhTrangPhatAm } from './phat-am.js';
import { demHomNay, baiDangHoc, tuChuaHoc } from './phien-hoc.js';
import { nhiemVuHomNay, nhiemVuThang, gioConLai } from './nhiem-vu.js';
import { layCapVuaMo } from './cap-do.js';
import { esc, thongBao, duKienHsk3, moTaThoiGian } from './giao-dien.js';
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

/** Khung chọn mục tiêu mỗi ngày (hiện khi chưa chọn) */
function htmlChonMucTieu() {
  return `
    <section class="khung chon-muc-tieu" id="chon-muc-tieu">
      <b>Bạn muốn học bao nhiêu phút mỗi ngày?</b>
      <p class="chu-phu nho" style="margin:2px 0 10px">Chọn mức vừa sức – học đều mỗi ngày quan trọng hơn học nhiều. Đổi lại được trong Cài đặt.</p>
      <div class="luoi-muc-tieu">
        ${CAC_MUC_TIEU.map((m) => `<button class="o-muc-tieu" data-phut="${m.phut}"><b>${m.phut} phút</b><span>${m.ten}</span>
          <span>xong HSK 3 ${moTaThoiGian(duKienHsk3(m.phut).ngay)}</span></button>`).join('')}
      </div>
      <p class="chu-phu nho du-kien">Khuyên học tối thiểu 30 phút mỗi ngày. Thời gian là ước tính theo kinh nghiệm, không phải số liệu chính thức.</p>
    </section>`;
}

/** Một dòng nhiệm vụ hằng ngày */
function dongNhiemVu(nv, hrefMacDinh) {
  const pt = Math.round((nv.daLam / nv.muc) * 100);
  return `
    <a class="dong-nhiem-vu khung ${nv.xong ? 'da-xong' : ''}" href="${nv.href || hrefMacDinh}">
      <span class="giua">
        <b>${nv.ten}</b>
        <span class="thanh-nhiem-vu"><span style="width:${pt}%"></span><i>${nv.daLam} / ${nv.muc}</i></span>
      </span>
      <span class="ruong emoji" aria-label="${nv.xong ? 'đã xong' : 'chưa xong'}">${nv.xong ? '✅' : '🎁'}</span>
    </a>`;
}

export function veTrangChu(khung) {
  const cd = caiDat();
  const td = layTienDo();
  const dem = demHomNay();
  const bai = baiDangHoc();
  const chuoi = chuoiNgayHoc();
  const homNay = new Date();
  const mucTieu = phutMoiNgay();
  const tongPhut = tongPhutNgay();
  const daHoc = tatCaTu().filter((t) => td.the[t.khoa]).length;

  // Cấp vừa mở khóa → chúc mừng (một lần)
  const vuaMo = layCapVuaMo();
  if (vuaMo.length) thongBao(`🎉 Đã mở khóa HSK ${vuaMo.join(', ')}!`, 5000);

  const nhiemVu = nhiemVuHomNay();
  const soXong = nhiemVu.filter((x) => x.xong).length;
  const thang = nhiemVuThang();

  // Nút "Tiếp tục": thẻ đến hạn → từ mới → nhiệm vụ chưa xong → ôn luyện
  const onXong = dem.onDenHan === 0 && dem.dangHocDenHan === 0;
  const nvChuaXong = nhiemVu.find((x) => !x.xong && x.href);
  let tiepTuc;
  if (!onXong) tiepTuc = { chu: `Ôn ${dem.onDenHan + dem.dangHocDenHan} thẻ từ`, href: '#/on' };
  else if (dem.conTuMoi && bai) tiepTuc = { chu: `Học tiếp · ${nhanBai(bai)}`, href: '#/hoc-moi' };
  else if (nvChuaXong) tiepTuc = { chu: nvChuaXong.ten, href: nvChuaXong.href };
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

  // Bài đang học (bài đầu tiên còn từ chưa học, theo cách chia bài đang chọn)
  let theBai = '';
  if (bai) {
    const daHocBai = bai.tu.filter((t) => td.the[t.khoa]).length;
    const pt = Math.round((daHocBai / bai.tu.length) * 100);
    theBai = `
    <h3 class="tieu-de-muc">Chặng đang học <small><a href="#/bai">Xem lộ trình →</a></small></h3>
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
    ${cd.phutMoiNgay ? '' : htmlChonMucTieu()}

    <section class="hero">
      <div class="hero-noi-dung">
        <span class="nhan nhan-chinh">${THU[homNay.getDay()]} · ${homNay.getDate()}/${homNay.getMonth() + 1}</span>
        <h2 class="hero-tieu-de">${loiChao()}
          <span>${tongPhut >= mucTieu ? 'Đã đạt mục tiêu! 🎉' : tongPhut ? `Đã học ${tongPhut}/${mucTieu} phút` : `Mục tiêu: ${mucTieu} phút`}</span></h2>
        <div class="muc-tieu-ngay">
          <span class="thanh-tien-do"><span style="width:${Math.min(100, Math.round((tongPhut / mucTieu) * 100))}%"></span></span>
          <a class="chu-phu nho" href="#/cai-dat" title="Đổi mục tiêu">${tongPhut}/${mucTieu}′</a>
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

    <h3 class="tieu-de-muc">Nhiệm vụ hằng ngày <small>⏱ còn ${gioConLai()} giờ</small></h3>
    <div class="ds-nhiem-vu">${nhiemVu.map((nv) => dongNhiemVu(nv, tiepTuc.href)).join('')}</div>
    ${soXong === nhiemVu.length ? '<p class="chu-phu nho" style="margin:10px 2px 0">🎉 Xong cả 3 nhiệm vụ hôm nay! Ngày mai sẽ có nhiệm vụ mới.</p>' : ''}

    <section class="khung nhiem-vu-thang">
      <div class="dong-tren"><b>Nhiệm vụ tháng ${thang.thang}</b><span class="emoji">🏆</span></div>
      <span class="chu-phu nho">Hoàn thành ${thang.muc} nhiệm vụ hằng ngày trong tháng</span>
      <span class="thanh-nhiem-vu"><span style="width:${Math.round((thang.xong / thang.muc) * 100)}%"></span><i>${thang.xong} / ${thang.muc}</i></span>
    </section>
    ${theBai}
  `;

  khung.querySelectorAll('#chon-muc-tieu [data-phut]').forEach((nut) => {
    nut.onclick = () => {
      cd.phutMoiNgay = Number(nut.dataset.phut);
      luu();
      thongBao(`Đã đặt mục tiêu ${cd.phutMoiNgay} phút mỗi ngày`);
      veTrangChu(khung);
    };
  });
}
