// =========================================================
// THỐNG KÊ (Giai đoạn 5.1)  – #/thong-ke
//   - Tổng quan: chuỗi ngày hiện tại / dài nhất, số ngày đã học, tổng số giờ
//   - Theo cấp HSK: từ vựng, chữ viết tay, ngữ pháp
//   - Biểu đồ số phút học 7 / 30 ngày, chia theo 5 phần của kế hoạch 60 phút
//   - Những từ hay sai nhất, chữ viết hay sai, thanh hay nhầm
// Chỉ ĐỌC tiến độ đã lưu, không ghi gì.
// Màu biểu đồ: bộ màu đã kiểm tra cho người mù màu (biến --bd-* trong man-hinh.css).
// =========================================================

import { layTienDo, caiDat, chuoiNgayHoc, coHocNgay, ngayHoc } from './luu-tru.js';
import { loaiThe } from './lich-on.js';
import { tatCaTu, tongTuCap } from './du-lieu.js';
import { esc, dongTu } from './giao-dien.js';
import { taiNetChu } from './net-chu.js';
import { taiNguPhap } from './man-ngu-phap.js';
import { diemThiCaoNhat } from './man-thi-thu.js';

const CAC_PHAN = [
  { ma: 'on', ten: 'Ôn từ' },
  { ma: 'moi', ten: 'Từ mới' },
  { ma: 'nghe', ten: 'Thanh điệu' },
  { ma: 'viet', ten: 'Viết chữ' },
  { ma: 'nguPhap', ten: 'Trắc nghiệm & ngữ pháp' },
];
const TEN_THANH = { 1: 'thanh 1', 2: 'thanh 2', 3: 'thanh 3', 4: 'thanh 4', 0: 'thanh nhẹ' };
const THU_NGAN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/** Chuỗi ngày học dài nhất từ trước đến nay */
function chuoiDaiNhat(nhatKy) {
  const ngay = Object.keys(nhatKy).filter((k) => coHocNgay(nhatKy[k])).sort();
  let dai = 0;
  let hienTai = 0;
  let truoc = null;
  for (const k of ngay) {
    const t = new Date(`${k}T12:00:00`).getTime();
    hienTai = truoc !== null && Math.round((t - truoc) / 86400000) === 1 ? hienTai + 1 : 1;
    dai = Math.max(dai, hienTai);
    truoc = t;
  }
  return dai;
}

/** Số phút từng phần của một ngày */
const phutNgay = (nk) => Object.fromEntries(CAC_PHAN.map((p) => [p.ma, ((nk?.giay?.[p.ma]) || 0) / 60]));

/** Thanh tiến độ nhiều đoạn: đã thuộc / đang ôn / đang học / chưa học */
function thanhNhieuDoan(tk, tong) {
  const doan = [['da-thuoc', 'thuộc chắc'], ['dang-on', 'đang ôn'], ['dang-hoc', 'đang học']];
  return `
    <div class="thanh-nhieu-doan" role="img" aria-label="${doan.map(([k, t]) => `${tk[k]} ${t}`).join(', ')} trên ${tong}">
      ${doan.map(([k]) => (tk[k] ? `<span class="${k}" style="width:${(tk[k] / tong) * 100}%"></span>` : '')).join('')}
    </div>
    <div class="chu-thich-cham">
      <span><i class="cham da-thuoc"></i>thuộc chắc ${tk['da-thuoc']}</span>
      <span><i class="cham dang-on"></i>đang ôn ${tk['dang-on']}</span>
      <span><i class="cham dang-hoc"></i>đang học ${tk['dang-hoc']}</span>
      <span><i class="cham"></i>chưa học ${tk['chua-hoc']}</span>
    </div>`;
}

function demTheoLoai(danhSach, layThe) {
  const tk = { 'chua-hoc': 0, 'dang-hoc': 0, 'dang-on': 0, 'da-thuoc': 0 };
  danhSach.forEach((x) => tk[loaiThe(layThe(x))]++);
  return tk;
}

// ---------- Biểu đồ cột chồng (SVG tự vẽ, không cần thư viện) ----------
function veBieuDo(nhatKy, soNgay, mucTieu) {
  const ngay = [];
  for (let i = soNgay - 1; i >= 0; i--) {
    const khoa = ngayHoc(Date.now() - i * 86400000);
    ngay.push({ khoa, phut: phutNgay(nhatKy[khoa]) });
  }
  const tongNgay = (d) => CAC_PHAN.reduce((s, p) => s + d.phut[p.ma], 0);
  const lonNhat = Math.max(mucTieu, ...ngay.map(tongNgay));
  const tran = Math.ceil(lonNhat / 15) * 15;           // trục Y tròn 15 phút
  // Kích thước gốc gần bằng màn hình điện thoại để chữ trên trục không bị thu nhỏ
  const W = 360;
  const H = 200;
  const trai = 34;
  const duoi = 26;
  const tren = 10;
  const cao = H - duoi - tren;
  const buoc = (W - trai - 8) / soNgay;
  const rong = Math.max(4, Math.min(28, buoc * 0.62));
  const y = (phut) => tren + cao - (phut / tran) * cao;

  let luoi = '';
  for (let v = 0; v <= tran; v += 15) {
    if (v % (tran > 90 ? 30 : 15)) continue;
    luoi += `<line class="bd-luoi" x1="${trai}" x2="${W - 4}" y1="${y(v)}" y2="${y(v)}"/>
      <text class="bd-truc" x="${trai - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
  }
  const cot = ngay.map((d, i) => {
    const x = trai + i * buoc + (buoc - rong) / 2;
    let dinh = y(0);
    const doan = CAC_PHAN.map((p, j) => {
      const v = d.phut[p.ma];
      if (v <= 0) return '';
      const h = Math.max(1, (v / tran) * cao);
      dinh -= h;
      return `<rect class="bd-${j + 1}" x="${x}" y="${dinh}" width="${rong}" height="${h}" rx="2"/>`;
    }).join('');
    const ngayD = new Date(`${d.khoa}T12:00:00`);
    const hienNhan = soNgay <= 7 || i % 5 === 4 || i === soNgay - 1;
    const nhan = soNgay <= 7 ? THU_NGAN[ngayD.getDay()] : `${ngayD.getDate()}/${ngayD.getMonth() + 1}`;
    return `<g class="bd-cot" data-i="${i}">
      <rect class="bd-vung" x="${trai + i * buoc}" y="${tren}" width="${buoc}" height="${cao}"/>
      ${doan}
      ${hienNhan ? `<text class="bd-truc" x="${x + rong / 2}" y="${H - 8}" text-anchor="middle">${nhan}</text>` : ''}
    </g>`;
  }).join('');
  const muc = `<line class="bd-muc-tieu" x1="${trai}" x2="${W - 4}" y1="${y(mucTieu)}" y2="${y(mucTieu)}"/>
    <text class="bd-truc" x="${W - 6}" y="${y(mucTieu) < tren + 14 ? y(mucTieu) + 13 : y(mucTieu) - 5}" text-anchor="end">mục tiêu ${mucTieu}′</text>`;
  const svg = `<svg class="bieu-do" viewBox="0 0 ${W} ${H}" role="img"
      aria-label="Số phút học mỗi ngày trong ${soNgay} ngày gần nhất, chia theo 5 phần">${luoi}${muc}${cot}</svg>`;

  const bang = `
    <details class="bang-so-lieu"><summary>Xem dạng bảng</summary>
      <div class="cuon-ngang"><table>
        <thead><tr><th>Ngày</th>${CAC_PHAN.map((p) => `<th>${esc(p.ten)}</th>`).join('')}<th>Tổng</th></tr></thead>
        <tbody>${ngay.slice().reverse().map((d) => `<tr><td>${d.khoa.slice(8)}/${d.khoa.slice(5, 7)}</td>
          ${CAC_PHAN.map((p) => `<td>${Math.round(d.phut[p.ma])}</td>`).join('')}<td><b>${Math.round(tongNgay(d))}</b></td></tr>`).join('')}</tbody>
      </table></div>
    </details>`;
  return { svg, bang, ngay, tongNgay };
}

// =========================================================
export async function veThongKe(khung) {
  const td = layTienDo();
  const mt = caiDat().phutMucTieu;
  const mucTieu = mt.on + mt.moi + mt.nghe + mt.viet + mt.nguPhap;
  const nk = td.nhatKy;

  // Dữ liệu chữ viết tay và ngữ pháp (đã có sẵn trong máy, kể cả khi không có mạng)
  const [netChu, nguPhap] = await Promise.all([taiNetChu().catch(() => null), taiNguPhap().catch(() => [])]);
  if (!khung.isConnected) return;

  // --- Tổng quan ---
  const soNgayHoc = Object.values(nk).filter(coHocNgay).length;
  const tongPhut = Math.round(Object.values(nk).reduce((s, n) => s + Object.values(n.giay || {}).reduce((a, b) => a + b, 0), 0) / 60);

  // --- Theo cấp ---
  const tuCap1 = tatCaTu().filter((t) => t.cap === 1);
  const tkTu = demTheoLoai(tuCap1, (t) => td.the[t.khoa]);
  const vietTay = netChu?.vietTay12 || Object.keys(td.theViet);
  const tkViet = demTheoLoai(vietTay, (c) => td.theViet[c]);
  const np1 = nguPhap.filter((d) => (d.cap || 1) === 1);
  const tkNp = demTheoLoai(np1, (d) => td.nguPhap.the[d.id]);

  // --- Hay sai ---
  const soSai = td.tracNghiem.soSai;
  const tuHaySai = tatCaTu()
    .map((t) => ({ t, quen: td.the[t.khoa]?.soLanQuen || 0, sai: soSai[t.khoa]?.lanSai || 0 }))
    .filter((x) => x.quen + x.sai > 0)
    .sort((a, b) => (b.quen + b.sai) - (a.quen + a.sai))
    .slice(0, 10);
  const chuHaySai = Object.entries(td.theViet)
    .filter(([, t]) => (t.soLanQuen || 0) > 0)
    .sort((a, b) => b[1].soLanQuen - a[1].soLanQuen)
    .slice(0, 12);
  const tkThanh = td.thanhDieu;
  const nham = Object.entries(tkThanh.nham).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const phanTram = (dung, sai) => (dung + sai ? `${Math.round((dung / (dung + sai)) * 100)}%` : '–');

  const khoiCap = (tieuDe, tk, tong, ghiChu) => `
    <div class="khoi-cap">
      <div class="dong-tren"><b>${tieuDe}</b><span class="chu-phu nho">${tong - tk['chua-hoc']}/${tong}${ghiChu ? ` · ${ghiChu}` : ''}</span></div>
      ${thanhNhieuDoan(tk, Math.max(1, tong))}
    </div>`;

  khung.innerHTML = `
    <div class="hang-chi-so">
      <div class="khung o-chi-so ${chuoiNgayHoc() ? 'dang-chay' : ''}"><span class="emoji">🔥</span><b>${chuoiNgayHoc()}</b><span>ngày liên tục</span></div>
      <div class="khung o-chi-so"><span class="emoji">🏆</span><b>${chuoiDaiNhat(nk)}</b><span>chuỗi dài nhất</span></div>
      <div class="khung o-chi-so"><span class="emoji">📅</span><b>${soNgayHoc}</b><span>ngày đã học · ${Math.floor(tongPhut / 60)} giờ ${tongPhut % 60} phút</span></div>
    </div>

    <h3 class="tieu-de-muc">Số phút học mỗi ngày</h3>
    <section class="khung">
      <div class="hang-chip" id="chon-so-ngay">
        <button class="chip dang-chon" data-n="7">7 ngày</button>
        <button class="chip" data-n="30">30 ngày</button>
      </div>
      <div class="chu-giai-bd">${CAC_PHAN.map((p, j) => `<span><i class="o-mau bd-${j + 1}"></i>${esc(p.ten)}</span>`).join('')}</div>
      <div id="vung-bieu-do"></div>
      <p class="chu-phu nho" id="chi-tiet-ngay">Chạm vào một cột để xem chi tiết ngày đó.</p>
    </section>

    <h3 class="tieu-de-muc">Theo cấp HSK</h3>
    <section class="khung">
      <div class="dong-tren"><b class="nhan nhan-chinh">HSK 1</b></div>
      ${khoiCap('Từ vựng', tkTu, tuCap1.length)}
      ${khoiCap('Chữ viết tay (cấp 1–2)', tkViet, vietTay.length)}
      ${np1.length ? khoiCap('Ngữ pháp', tkNp, np1.length) : ''}
    </section>
    ${[2, 3].map((cap) => {
      // Khung cho từng cấp 2, 3 (chỉ hiện khi đã có dữ liệu)
      const tuCap = tatCaTu().filter((t) => t.cap === cap);
      if (!tuCap.length) return '';
      const tong = tongTuCap(cap);
      const npCap = nguPhap.filter((d) => d.cap === cap);
      return `
    <section class="khung" style="margin-top:12px">
      <div class="dong-tren"><b class="nhan nhan-chinh">HSK ${cap}</b></div>
      ${khoiCap('Từ vựng', demTheoLoai(tuCap, (t) => td.the[t.khoa]), tuCap.length, tuCap.length < tong ? `đã soạn ${tuCap.length}/${tong} từ` : '')}
      ${cap === 3 && netChu?.vietTay3?.length ? khoiCap('Chữ viết tay (cấp 3)', demTheoLoai(netChu.vietTay3, (c) => td.theViet[c]), netChu.vietTay3.length) : ''}
      ${npCap.length ? khoiCap('Ngữ pháp', demTheoLoai(npCap, (d) => td.nguPhap.the[d.id]), npCap.length) : ''}
    </section>`;
    }).join('')}

    <h3 class="tieu-de-muc">Kết quả luyện tập</h3>
    <div class="hang-chi-so">
      <div class="khung o-chi-so"><span class="emoji">🎧</span><b>${phanTram(tkThanh.dung, tkThanh.sai)}</b><span>thanh điệu đúng (${tkThanh.dung + tkThanh.sai} câu)</span></div>
      <div class="khung o-chi-so"><span class="emoji">📝</span><b>${phanTram(td.tracNghiem.dung, td.tracNghiem.sai)}</b><span>trắc nghiệm đúng (${td.tracNghiem.dung + td.tracNghiem.sai} câu)</span></div>
      <div class="khung o-chi-so"><span class="emoji">🧩</span><b>${phanTram(td.nguPhap.dung, td.nguPhap.sai)}</b><span>ngữ pháp đúng (${td.nguPhap.dung + td.nguPhap.sai} câu)</span></div>
    </div>
    ${[1, 2].map((cap) => {
      const ls = (td.thiThu || []).filter((x) => (x.cap || 1) === cap);
      if (!ls.length) return '';
      const tot = diemThiCaoNhat(cap);
      return `<a class="khung tien-do-cap" href="#/thi-thu" style="margin-top:10px">
      <div class="dong-tren"><b>📋 Thi thử HSK ${cap}</b><span class="nhan ${tot >= 120 ? 'nhan-dat' : ''}">cao nhất ${tot}/200</span></div>
      <span class="chu-phu nho">${ls.length} lần thi · lần gần nhất ${ls[ls.length - 1].diem}/200 · đạt từ 120</span>
    </a>`;
    }).join('')}

    <h3 class="tieu-de-muc">Những từ hay sai nhất <small>quên khi ôn + sai trắc nghiệm</small></h3>
    ${tuHaySai.length
      ? `<div class="khung ds-tu">${tuHaySai.map((x) => `<div class="dong-hay-sai">${dongTu(x.t)}
          <span class="nhan">${x.quen ? `quên ${x.quen}` : ''}${x.quen && x.sai ? ' · ' : ''}${x.sai ? `sai ${x.sai}` : ''}</span></div>`).join('')}</div>`
      : '<p class="chu-phu">Chưa có từ nào bị quên hay trả lời sai. 👏</p>'}

    <h3 class="tieu-de-muc">Chữ viết hay sai</h3>
    ${chuHaySai.length
      ? `<div class="luoi-chu">${chuHaySai.map(([c, t]) => `<a class="o-chu-nho han dang-hoc" href="#/luyen-viet/chu/${encodeURIComponent(c)}" title="Quên ${t.soLanQuen} lần">${esc(c)}</a>`).join('')}</div>`
      : '<p class="chu-phu">Chưa có chữ nào viết sai nhiều.</p>'}

    <h3 class="tieu-de-muc">Thanh hay nhầm</h3>
    ${nham.length
      ? `<div class="khung"><ul class="ds-nham" style="margin:0">${nham.map(([k, n]) => { const [a, b] = k.split('>'); return `<li>Nghe <b class="t${a}">${TEN_THANH[a]}</b> nhưng chọn <b class="t${b}">${TEN_THANH[b]}</b>: ${n} lần</li>`; }).join('')}</ul></div>`
      : '<p class="chu-phu">Chưa nhầm thanh nào.</p>'}`;

  // --- Biểu đồ: đổi 7 / 30 ngày, chạm cột để xem chi tiết ---
  const veLai = (soNgay) => {
    const bd = veBieuDo(nk, soNgay, mucTieu);
    const vung = khung.querySelector('#vung-bieu-do');
    vung.innerHTML = bd.svg + bd.bang;
    const chiTiet = khung.querySelector('#chi-tiet-ngay');
    vung.querySelectorAll('.bd-cot').forEach((g) => {
      const hien = () => {
        const d = bd.ngay[Number(g.dataset.i)];
        vung.querySelectorAll('.bd-cot').forEach((x) => x.classList.toggle('dang-chon', x === g));
        const tong = Math.round(bd.tongNgay(d));
        chiTiet.innerHTML = `<b>${d.khoa.slice(8)}/${d.khoa.slice(5, 7)}</b>: ${tong} phút`
          + (tong ? ` – ${CAC_PHAN.filter((p) => d.phut[p.ma] >= 0.5).map((p) => `${esc(p.ten)} ${Math.round(d.phut[p.ma])}′`).join(' · ')}` : ' (không học)');
      };
      g.addEventListener('click', hien);
      g.addEventListener('mouseenter', hien);
    });
  };
  khung.querySelectorAll('#chon-so-ngay [data-n]').forEach((b) => {
    b.onclick = () => {
      khung.querySelectorAll('#chon-so-ngay [data-n]').forEach((x) => x.classList.toggle('dang-chon', x === b));
      veLai(Number(b.dataset.n));
    };
  });
  veLai(7);
}
