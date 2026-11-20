// =========================================================
// LUYỆN VIẾT CHỮ HÁN (Giai đoạn 2)
//   #/luyen-viet            tổng quan: số chữ cần ôn / chữ mới hôm nay + lưới chữ cần viết tay
//                           (chọn Cấp 1–2: 100 chữ · Cấp 3: 150 chữ; chữ mới đi hết cấp 1–2 rồi mới sang cấp 3)
//   #/luyen-viet/phien      phiên luyện hôm nay (chữ đến hạn ôn + chữ mới)
//   #/luyen-viet/chu/<chữ>  luyện riêng một chữ
//
// Chữ MỚI học theo 3 bước: 1) xem thứ tự nét  2) viết theo nét mờ  3) viết không nhìn.
// Chữ ÔN chỉ làm bước 3. App tự chấm theo số nét viết sai ở bước 3:
//   0 nét sai → Nhớ · 1–3 nét sai → Khó · từ 4 nét sai hoặc bấm "Gợi ý" → Quên
// rồi xếp lịch ôn bằng cùng thuật toán SM-2 với thẻ từ (lich-on.js), lưu ở tienDo.theViet.
// =========================================================

import { caiDat, layTienDo, luu, nhatKyHomNay } from './luu-tru.js';
import { tinhLichMoi, moTaKhoangCach, loaiThe, dangHoc, DANH_GIA } from './lich-on.js';
import { tatCaTu, nghiaNgan } from './du-lieu.js';
import { doc } from './phat-am.js';
import { esc, batDongHo, moHopThoai, nutLoa, CHU_THICH_CHAM } from './giao-dien.js';
import { toMauPinyin, demChuHan } from './pinyin.js';
import { taiNetChu, taoBangVe, phatHoatCanh } from './net-chu.js';
import { capMo } from './cap-do.js';

const LAP_TOI_DA = 3;          // một chữ chưa thuộc được đưa lại tối đa 3 lần trong một phiên
const LA_CHU_HAN = /\p{Script=Han}/u;

const TEN_DANH_GIA = { 1: 'Quên', 2: 'Khó', 3: 'Nhớ', 4: 'Dễ' };
const MUC_DANH_GIA = { 1: 'quen', 2: 'kho', 3: 'nho', 4: 'de' };

/** Tự chấm theo số nét sai ở bước "viết không nhìn" */
function chamDiem(soLoi, dungGoiY) {
  if (dungGoiY || soLoi >= 4) return DANH_GIA.QUEN;
  if (soLoi >= 1) return DANH_GIA.KHO;
  return DANH_GIA.NHO;
}

/** Từ dùng làm gợi ý cho một chữ: ưu tiên từ chỉ có đúng chữ đó, sau đó từ đầu tiên chứa chữ. */
function tuChuaChu(chu) {
  const ds = tatCaTu().filter((t) => t.hanzi.includes(chu));
  return ds.find((t) => t.hanzi === chu) || ds[0] || null;
}

/** Danh sách chữ mới chưa luyện, chữ thuộc từ đã học được xếp lên trước. */
function chuMoiTheoThuTu(vietTay) {
  const td = layTienDo();
  const tuDaHoc = tatCaTu().filter((t) => td.the[t.khoa]);
  const daGapTrongTu = (c) => tuDaHoc.some((t) => t.hanzi.includes(c));
  const chua = vietTay.filter((c) => !td.theViet[c]);
  return [...chua.filter(daGapTrongTu), ...chua.filter((c) => !daGapTrongTu(c))];
}

/** Mọi chữ cần viết tay (cấp 1–2 rồi cấp 3) */
const tatCaChuViet = (duLieu) => [...duLieu.vietTay12, ...(duLieu.vietTay3 || [])];
/** Chữ mới theo thứ tự: hết cấp 1–2 rồi mới đến cấp 3 */
// (chữ cấp 3 chỉ đưa vào khi đã mở khóa HSK 3 – xem cap-do.js)
const chuMoiCacCap = (duLieu) => [...chuMoiTheoThuTu(duLieu.vietTay12), ...(capMo(3) ? chuMoiTheoThuTu(duLieu.vietTay3 || []) : [])];
let capVietXem = null;   // lưới đang xem: '12' | '3'

/** Đếm cho trang tổng quan và trang Hôm nay. Cần dữ liệu nét đã tải. */
export function demViet(vietTay, bayGio = Date.now()) {
  const td = layTienDo();
  const cd = caiDat();
  const nk = nhatKyHomNay();
  const canOn = vietTay
    .filter((c) => td.theViet[c] && (dangHoc(td.theViet[c]) || td.theViet[c].han <= bayGio))
    .sort((a, b) => td.theViet[a].han - td.theViet[b].han);
  const conMoi = Math.max(0, cd.soChuVietMoiMoiNgay - (nk.vietMoi || 0));
  const thongKe = { 'chua-hoc': 0, 'dang-hoc': 0, 'dang-on': 0, 'da-thuoc': 0 };
  vietTay.forEach((c) => thongKe[loaiThe(td.theViet[c])]++);
  return { canOn, conMoi, daMoiHomNay: nk.vietMoi || 0, thongKe, tong: vietTay.length };
}

/** Phần gợi ý phía trên ô viết: từ chứa chữ, pinyin, nghĩa. `an`: che chữ cần viết. */
function htmlGoiY(chu, an) {
  const tu = tuChuaChu(chu);
  if (!tu) {
    return `<div class="goi-y-chu">${an ? '' : `<span class="han goi-y-han">${esc(chu)}</span>`}
      <span class="chu-phu nho">Chữ HSK 2 – chưa có từ trong dữ liệu. Bấm loa để nghe.</span>${nutLoa(chu, true)}</div>`;
  }
  const hanzi = [...tu.hanzi].map((c) => (c === chu
    ? (an ? '<span class="o-trong">？</span>' : `<mark>${esc(c)}</mark>`)
    : esc(c))).join('');
  return `
    <div class="goi-y-chu">
      <span class="han goi-y-han">${hanzi}</span>
      <span class="goi-y-giua">
        <span class="pinyin">${toMauPinyin(tu.pinyin, demChuHan(tu.hanzi))}</span>
        <span class="chu-phu nho">${esc(nghiaNgan(tu))}</span>
      </span>
      ${nutLoa(tu.hanzi, true)}
    </div>`;
}

// =========================================================
// TRANG TỔNG QUAN
// =========================================================
export async function veLuyenViet(khung) {
  khung.innerHTML = '<div class="dang-tai">Đang tải dữ liệu nét chữ…</div>';
  let duLieu;
  try {
    duLieu = await taiNetChu();
  } catch (e) {
    khung.innerHTML = `<div class="loi">${esc(e.message)}</div>`;
    return;
  }
  if (!khung.isConnected) return;
  const td = layTienDo();
  const dem = demViet(tatCaChuViet(duLieu));
  const soBatDau = dem.canOn.length + Math.min(dem.conMoi, chuMoiCacCap(duLieu).length);
  const coCap3 = (duLieu.vietTay3 || []).length > 0 && capMo(3);
  const cap3Khoa = (duLieu.vietTay3 || []).length > 0 && !capMo(3);
  // Mặc định xem cấp đang học: còn chữ cấp 1–2 chưa luyện thì xem cấp 1–2
  if (!capVietXem || (capVietXem === '3' && !coCap3)) {
    capVietXem = coCap3 && !chuMoiTheoThuTu(duLieu.vietTay12).length ? '3' : '12';
  }
  const dsXem = capVietXem === '3' ? duLieu.vietTay3 : duLieu.vietTay12;
  const demXem = demViet(dsXem);

  const oChu = dsXem.map((c) => `
    <a class="o-chu-nho han ${loaiThe(td.theViet[c])}" href="#/luyen-viet/chu/${encodeURIComponent(c)}" title="Luyện riêng chữ này">${esc(c)}</a>`).join('');

  khung.innerHTML = `
    <div class="hai-o">
      <div class="o-lon khung phan-on">
        <span class="o-emoji emoji">🔁</span>
        <span class="so-lon">${dem.canOn.length}</span>
        <b>Cần ôn</b>
        <span class="chu-phu nho">chữ đến hạn viết lại</span>
      </div>
      <div class="o-lon khung phan-viet">
        <span class="o-emoji emoji">✨</span>
        <span class="so-lon">${dem.conMoi}</span>
        <b>Chữ mới</b>
        <span class="chu-phu nho">còn lại hôm nay (đã học ${dem.daMoiHomNay}/${caiDat().soChuVietMoiMoiNgay})</span>
      </div>
    </div>
    <p style="margin-top:16px">
      ${soBatDau
        ? `<a class="nut nut-chinh nut-rong" href="#/luyen-viet/phien"><span class="emoji">✍️</span> Bắt đầu luyện viết (${soBatDau} chữ)</a>`
        : '<span class="nut nut-rong" aria-disabled="true">✅ Hôm nay đã luyện xong – chạm một chữ bên dưới để luyện thêm</span>'}
    </p>

    ${coCap3 || cap3Khoa ? `<div class="hang-chip" style="margin-top:14px">
      <button class="chip ${capVietXem === '12' ? 'dang-chon' : ''}" data-cap-viet="12">Cấp 1–2 · ${duLieu.vietTay12.length} chữ</button>
      ${cap3Khoa
        ? `<button class="chip" disabled title="Mở khóa HSK 3 để luyện">Cấp 3 · ${duLieu.vietTay3.length} chữ <span class="emoji">🔒</span></button>`
        : `<button class="chip ${capVietXem === '3' ? 'dang-chon' : ''}" data-cap-viet="3">Cấp 3 · ${duLieu.vietTay3.length} chữ</button>`}
    </div>` : ''}
    <h3 class="tieu-de-muc">${dsXem.length} chữ cần viết ${capVietXem === '3' ? 'cấp 3' : 'cấp 1–2'} <small>${demXem.tong - demXem.thongKe['chua-hoc']}/${demXem.tong} đã luyện</small></h3>
    ${CHU_THICH_CHAM}
    <div class="luoi-chu">${oChu}</div>
    <p class="chu-phu nho" style="margin-top:18px">Danh sách theo Đề cương thi HSK 2025 (汉字大纲 – chữ cần viết tay cấp 1–2 và cấp 3).
      Chữ mới đi theo thứ tự: hết cấp 1–2 rồi mới sang cấp 3; chữ thuộc từ bạn đã học được xếp lên trước.
      Dữ liệu nét chữ: Make Me a Hanzi / Hanzi Writer.</p>`;
  khung.querySelectorAll('[data-cap-viet]').forEach((b) => {
    b.onclick = () => { capVietXem = b.dataset.capViet; veLuyenViet(khung); };
  });
}

// =========================================================
// PHIÊN LUYỆN VIẾT
// =========================================================
/**
 * @param {string|null} chuChon  luyện riêng một chữ (null = phiên hôm nay)
 * @returns {Function} hàm dọn dẹp khi rời màn hình
 */
export function vePhienViet(khung, chuChon = null) {
  let daRoi = false;
  let dungDongHo = () => {};
  const ketQua = { soChu: 0, hoanHao: 0, quen: 0 };
  khung.innerHTML = '<div class="dang-tai">Đang tải dữ liệu nét chữ…</div>';

  taiNetChu().then((duLieu) => {
    if (daRoi) return;
    const td = layTienDo();
    let hangDoi;
    if (chuChon) {
      hangDoi = duLieu.net[chuChon] ? [chuChon] : [];
    } else {
      const dem = demViet(tatCaChuViet(duLieu));
      hangDoi = [...dem.canOn, ...chuMoiCacCap(duLieu).slice(0, dem.conMoi)];
    }
    if (!hangDoi.length) {
      khung.innerHTML = `
        <div class="chua-lam">
          <div class="emoji emoji-to">🎉</div>
          <h2>Hôm nay đã luyện xong</h2>
          <p class="chu-phu">Không còn chữ đến hạn và đã đủ chữ mới. Có thể tăng số chữ mới mỗi ngày trong Cài đặt.</p>
          <a class="nut" href="#/luyen-viet">Về danh sách chữ</a>
        </div>`;
      return;
    }
    document.body.classList.add('dang-hoc');
    dungDongHo = batDongHo('viet');
    const soLap = {};
    const tong0 = hangDoi.length;
    let daXong = 0;

    khung.innerHTML = `
      <div class="phien">
        <div class="tien-do-phien">
          <div class="thanh-tien-do"><span style="width:0%"></span></div>
          <span class="dem"></span>
        </div>
        <div class="khung the-viet">
          <div class="goc-the"><span id="nhan-chu"></span><span class="chu-phu nho" id="ten-buoc"></span></div>
          <div id="goi-y"></div>
          <div class="o-viet" id="o-viet"></div>
          <p class="goi-y" id="loi-nhan"></p>
        </div>
        <div class="vung-tra-loi" id="vung-nut"></div>
      </div>`;
    const $ = (s) => khung.querySelector(s);

    function capNhatTienDo() {
      const tong = Math.max(tong0, daXong + hangDoi.length);
      $('.tien-do-phien .thanh-tien-do > span').style.width = `${(daXong / tong) * 100}%`;
      $('.tien-do-phien .dem').textContent = `Còn ${hangDoi.length} · xong ${daXong}`;
    }

    // ----- Một chữ -----
    function chuTiepTheo() {
      if (daRoi) return;
      const chu = hangDoi.shift();
      if (!chu) return veKetThuc();
      capNhatTienDo();
      const laMoi = !layTienDo().theViet[chu];
      $('#nhan-chu').innerHTML = laMoi
        ? '<span class="nhan nhan-chinh">✨ Chữ mới</span>'
        : `<span class="nhan">🔁 Ôn viết${soLap[chu] ? ' lại' : ''}</span>`;
      if (laMoi && !soLap[chu]) buocXem(chu);
      else buocVietKhongNhin(chu, false);
    }

    // Bước 1: xem thứ tự nét
    async function buocXem(chu) {
      $('#ten-buoc').textContent = 'Bước 1/3 · Xem thứ tự nét';
      $('#goi-y').innerHTML = htmlGoiY(chu, false);
      $('#loi-nhan').textContent = 'Xem kỹ thứ tự từng nét.';
      $('#vung-nut').innerHTML = `
        <div class="hang-nut">
          <button class="nut" id="nut-xem-lai">▶ Xem lại</button>
          <button class="nut nut-chinh" id="nut-tiep">Viết theo ▶</button>
        </div>`;
      const writer = await taoBangVe($('#o-viet'), chu, { showCharacter: false });
      if (daRoi) return;
      $('#nut-xem-lai').onclick = () => { writer.hideCharacter(); phatHoatCanh(writer); };
      $('#nut-tiep').onclick = () => buocVietTheo(chu, writer);
      phatHoatCanh(writer);
      const tu = tuChuaChu(chu);
      if (caiDat().tuPhatAm) doc(tu ? tu.hanzi : chu);
    }

    // Bước 2: viết theo nét mờ
    function buocVietTheo(chu, writer) {
      $('#ten-buoc').textContent = 'Bước 2/3 · Viết theo nét mờ';
      $('#loi-nhan').textContent = 'Dùng ngón tay (hoặc chuột) tô theo từng nét, đúng thứ tự.';
      $('#vung-nut').innerHTML = '<button class="nut nut-rong" id="nut-xem-lai">▶ Xem lại cách viết</button>';
      $('#nut-xem-lai').onclick = () => {
        writer.cancelQuiz();
        phatHoatCanh(writer).then(() => { if (!daRoi) buocVietTheo(chu, writer); });
      };
      writer.showOutline();
      writer.quiz({
        showHintAfterMisses: 2,
        onMistake: () => { $('#loi-nhan').textContent = 'Chưa đúng nét – thử lại theo nét mờ.'; },
        onCorrectStroke: (d) => { $('#loi-nhan').textContent = d.strokesRemaining ? `Đúng! Còn ${d.strokesRemaining} nét.` : 'Đúng!'; },
        onComplete: () => {
          if (daRoi) return;
          $('#loi-nhan').textContent = 'Tốt lắm! Giờ viết lại mà không nhìn nét mờ.';
          $('#vung-nut').innerHTML = '<button class="nut nut-chinh nut-rong" id="nut-tiep">Viết không nhìn ▶</button>';
          $('#nut-tiep').onclick = () => buocVietKhongNhin(chu, true);
        },
      });
    }

    // Bước 3: viết không nhìn → tự chấm, xếp lịch ôn
    async function buocVietKhongNhin(chu, laMoi) {
      $('#ten-buoc').textContent = laMoi ? 'Bước 3/3 · Viết không nhìn' : 'Viết lại từ trí nhớ';
      $('#goi-y').innerHTML = htmlGoiY(chu, true);
      $('#loi-nhan').textContent = 'Nhớ lại chữ còn thiếu (？) và viết vào ô.';
      let dungGoiY = false;
      $('#vung-nut').innerHTML = '<button class="nut nut-rong" id="nut-goi-y">💡 Gợi ý (hiện nét mờ)</button>';
      const writer = await taoBangVe($('#o-viet'), chu, { showCharacter: false, showOutline: false });
      if (daRoi) return;
      if (!laMoi && caiDat().tuPhatAm) { const tu = tuChuaChu(chu); doc(tu ? tu.hanzi : chu); }
      $('#nut-goi-y').onclick = () => {
        dungGoiY = true;
        writer.showOutline();
        $('#nut-goi-y').disabled = true;
      };
      writer.quiz({
        showHintAfterMisses: 3,
        onMistake: (d) => { $('#loi-nhan').textContent = `Sai nét (đã sai ${d.totalMistakes} lần)${d.mistakesOnStroke >= 3 ? ' – nét đúng đang được gợi ý' : ''}.`; },
        onCorrectStroke: (d) => { $('#loi-nhan').textContent = d.strokesRemaining ? `Đúng! Còn ${d.strokesRemaining} nét.` : 'Đúng!'; },
        onComplete: (tongKet) => { if (!daRoi) ghiKetQua(chu, tongKet.totalMistakes, dungGoiY, writer); },
      });
    }

    function ghiKetQua(chu, soLoi, dungGoiY, writer) {
      const tdNay = layTienDo();
      const cu = tdNay.theViet[chu];
      const dg = chamDiem(soLoi, dungGoiY);
      const sauBao = moTaKhoangCach(cu, dg);
      tdNay.theViet[chu] = tinhLichMoi(cu, dg);
      const nk = nhatKyHomNay();
      nk.viet = (nk.viet || 0) + 1;
      if (!cu) nk.vietMoi = (nk.vietMoi || 0) + 1;
      luu();
      if (!soLap[chu]) ketQua.soChu++;
      if (dg === DANH_GIA.NHO) ketQua.hoanHao++;
      if (dg === DANH_GIA.QUEN) ketQua.quen++;

      // Chưa thuộc (còn ở bước học theo phút) → đưa lại cuối phiên
      const conHoc = dangHoc(tdNay.theViet[chu]) && (soLap[chu] || 0) < LAP_TOI_DA && !chuChon;
      if (conHoc) { soLap[chu] = (soLap[chu] || 0) + 1; hangDoi.push(chu); } else daXong++;

      $('#goi-y').innerHTML = htmlGoiY(chu, false);
      $('#loi-nhan').innerHTML = `${soLoi === 0 && !dungGoiY ? '✅ Viết đúng hết!' : `Sai ${soLoi} nét${dungGoiY ? ' · có xem gợi ý' : ''}`}
        → <b class="chu-${MUC_DANH_GIA[dg]}">${TEN_DANH_GIA[dg]}</b> · ôn lại sau ${sauBao}${conHoc ? ' (luyện lại cuối phiên)' : ''}`;
      $('#vung-nut').innerHTML = `
        <div class="hang-nut">
          <button class="nut" id="nut-viet-lai" title="Luyện thêm, không tính điểm">↺ Viết lại</button>
          <button class="nut nut-chinh" id="nut-tiep">${hangDoi.length ? 'Chữ tiếp ▶' : 'Xong ▶'}</button>
        </div>`;
      // "Viết thêm": chỉ để luyện tay, không chấm lại
      $('#nut-viet-lai').onclick = () => {
        writer.hideCharacter();
        writer.showOutline();
        $('#loi-nhan').textContent = 'Luyện thêm (không tính điểm).';
        writer.quiz({ showHintAfterMisses: 2, onComplete: () => { if (!daRoi) $('#loi-nhan').textContent = 'Tốt! Bấm tiếp khi sẵn sàng.'; } });
      };
      $('#nut-tiep').onclick = chuTiepTheo;
      capNhatTienDo();
    }

    function veKetThuc() {
      dungDongHo();
      document.body.classList.remove('dang-hoc');
      khung.innerHTML = `
        <div class="ket-thuc">
          <div class="emoji emoji-to">${ketQua.quen ? '💪' : '🏆'}</div>
          <h2>${ketQua.quen ? 'Làm tốt lắm!' : 'Xuất sắc!'}</h2>
          <p class="chu-phu">Đã luyện ${ketQua.soChu} chữ · ${ketQua.hoanHao} lượt viết đúng hết</p>
          <a class="nut nut-chinh nut-rong" href="#/">Về trang Hôm nay</a>
          <a class="nut nut-rong" href="#/luyen-viet">✍️ Danh sách chữ</a>
        </div>`;
    }

    chuTiepTheo();
  }).catch((e) => {
    if (!daRoi) khung.innerHTML = `<div class="loi">${esc(e.message)}</div>`;
  });

  return () => {
    daRoi = true;
    dungDongHo();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    document.body.classList.remove('dang-hoc');
  };
}

// =========================================================
// HỘP THOẠI "CÁCH VIẾT" – xem thứ tự nét mọi chữ trong một từ
// =========================================================
export async function moCachViet(hanzi) {
  const cacChu = [...hanzi].filter((c) => LA_CHU_HAN.test(c));
  const hop = moHopThoai(`
    <div class="dau-hop">
      <h2>Cách viết</h2>
      <button class="nut-bieu-tuong" data-dong aria-label="Đóng">✕</button>
    </div>
    <p class="chu-phu nho">Chạm vào một chữ để xem lại từng nét.</p>
    <div class="hang-cach-viet">
      ${cacChu.map((c, i) => `<div class="o-viet o-viet-nho" data-i="${i}" title="Xem lại"></div>`).join('')}
    </div>
    <button class="nut nut-rong" id="nut-xem-tat-ca" style="margin-top:14px">▶ Xem lại tất cả</button>`);
  const cacO = [...hop.querySelectorAll('.o-viet')];
  const writers = [];
  try {
    for (let i = 0; i < cacChu.length; i++) {
      try {
        writers[i] = await taoBangVe(cacO[i], cacChu[i], { showCharacter: false });
      } catch {
        cacO[i].innerHTML = `<span class="han khong-co-net">${esc(cacChu[i])}</span>`;
      }
    }
  } catch (e) {
    hop.insertAdjacentHTML('beforeend', `<div class="loi">${esc(e.message)}</div>`);
    return;
  }
  const xemTatCa = async () => {
    for (const w of writers) {
      if (!hop.isConnected) return;
      if (w) { w.hideCharacter(); await phatHoatCanh(w); }
    }
  };
  cacO.forEach((o, i) => { o.onclick = () => { if (writers[i]) { writers[i].hideCharacter(); phatHoatCanh(writers[i]); } }; });
  hop.querySelector('#nut-xem-tat-ca').onclick = xemTatCa;
  xemTatCa();
}
