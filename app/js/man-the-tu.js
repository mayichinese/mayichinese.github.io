// =========================================================
// PHIÊN HỌC THẺ TỪ: Ôn tập / Học từ mới – APP TỰ CHẤM (không còn tự bấm Quên/Khó/Nhớ/Dễ)
//   #/on          ôn các thẻ đến hạn
//   #/hoc-moi     học từ mới (bài đang học)     #/hoc-moi/5  học từ mới của bài 5
// Thứ tự thẻ và lịch ôn do phien-hoc.js + lich-on.js (SM-2) quyết định.
// File này lo phần HIỂN THỊ:
//   - Từ mới: hiện đầy đủ (mặt sau) để làm quen → "Đã hiểu – luyện tiếp".
//   - Thẻ luyện / thẻ ôn: một CÂU HỎI THẬT 4 lựa chọn (js/cau-hoi-tu.js: nghia | chu | nghe | pinyin),
//     trả lời xong mới hiện mặt sau chi tiết. Điểm SM-2 do app tính (chamDiem):
//       sai → Quên · đúng nhưng chậm → Khó · đúng → Nhớ · đúng nhanh → Dễ
//     (thẻ đang học lần đầu chỉ được "Dễ" ở bước cuối – nghĩa là đã đúng ít nhất 2 lần).
//   - Dạng câu: thẻ mới học hỏi nghe/nghĩa trước (nhận ra), bước sau hỏi chữ/pinyin (nhớ lại);
//     thẻ ôn đổi dạng so với lần trước (lưu the.dangCuoi).
// Phím tắt: 1–4 chọn đáp án · Space = nghe lại (câu nghe) · Enter/Space = tiếp tục
// =========================================================

import { caiDat, layTienDo, luu } from './luu-tru.js';
import { DANH_GIA, moTaKhoangCach } from './lich-on.js';
import { layTu, nhanBaiCuaTu, cheDoBai, timBaiTheoMa, nhanBai, tiengDoc } from './du-lieu.js';
import { doc, tinhTrangPhatAm } from './phat-am.js';
import { demHomNay, taoPhien, theTiepTheo, traLoi, daXemTuMoi, conLai, tuChuaHoc, baiDangHoc } from './phien-hoc.js';
import { htmlMatSau, batDongHo, esc } from './giao-dien.js';
import { taiDaAm, dangDungDuoc, taoCau, htmlDeBai, htmlLuaChon, TEN_DANG } from './cau-hoi-tu.js';
import { amCham } from './am-thanh.js';

const KET_QUA = [
  { dg: DANH_GIA.QUEN, muc: 'quen', ten: 'Sai', emoji: '😵' },
  { dg: DANH_GIA.KHO,  muc: 'kho',  ten: 'Đúng chậm', emoji: '🤔' },
  { dg: DANH_GIA.NHO,  muc: 'nho',  ten: 'Đúng', emoji: '🙂' },
  { dg: DANH_GIA.DE,   muc: 'de',   ten: 'Đúng nhanh', emoji: '😎' },
];

// Ngưỡng thời gian trả lời (giây). Câu nghe được cộng thêm thời gian phát âm.
const NHANH = { nghia: 5, chu: 5, pinyin: 6, nghe: 6 };
const CHAM = 15;

/**
 * App chấm điểm SM-2 từ kết quả thật.
 * @param the  trạng thái thẻ TRƯỚC khi trả lời
 */
export function chamDiem(dung, giay, dang, the) {
  if (!dung) return DANH_GIA.QUEN;
  if (giay > CHAM) return DANH_GIA.KHO;
  if (giay <= (NHANH[dang] || 5)) {
    // Thẻ đang học: chỉ cho "Dễ" ở bước cuối (đã đúng ít nhất một lần trước đó trong giai đoạn học)
    const dangHocLanDau = the && the.trangThai === 'hoc';
    if (!dangHocLanDau || (the.buoc || 0) >= 1) return DANH_GIA.DE;
  }
  return DANH_GIA.NHO;
}

/** Chọn dạng câu hỏi cho một thẻ */
function chonDang(tu, the, kieu, daAm, coGiong) {
  const ds = dangDungDuoc(tu, daAm, coGiong);
  let uuTien = ds;
  if (kieu === 'luyen' && the?.trangThai === 'hoc') {
    // bước đầu: nhận ra (nghe → chữ, chữ → nghĩa); bước sau: nhớ lại (nghĩa → chữ, pinyin)
    const nhanRa = ds.filter((d) => d === 'nghe' || d === 'nghia');
    const nhoLai = ds.filter((d) => d === 'chu' || d === 'pinyin');
    uuTien = (the.buoc || 0) === 0 ? nhanRa : nhoLai;
    if (!uuTien.length) uuTien = ds;
  }
  const khac = uuTien.filter((d) => d !== the?.dangCuoi);
  const chon = khac.length ? khac : uuTien;
  return chon[Math.floor(Math.random() * chon.length)];
}

/**
 * Vẽ một phiên học vào `khung`.
 * @param {'on'|'moi'} loai
 * @param {number|string|null} soBai  chỉ học từ mới của bài này (null = bài đang học)
 * @returns {Function} hàm dọn dẹp khi rời màn hình
 */
export function vePhien(khung, loai, soBai = null) {
  const cd = caiDat();
  const phien = taoPhien(loai, soBai);
  const ketQua = { quen: 0, kho: 0, nho: 0, de: 0 };
  let soTuMoiDaXem = 0;
  let hienTai = null;                // { khoa, kieu: 'gioi-thieu' | 'on' | 'luyen' }
  let cau = null;                    // câu hỏi đang hiện (null khi đang giới thiệu từ mới)
  let daTraLoi = false;
  let batDau = 0;                    // lúc hiện câu hỏi (để đo thời gian trả lời)
  let luotThe = 0;                   // tăng mỗi khi sang thẻ mới (bỏ các hẹn giờ cũ)
  let daAm = new Set();
  let coGiong = false;
  let daRoi = false;

  document.body.classList.add('dang-hoc');
  const dungDongHo = batDongHo(loai); // đồng hồ tính phút học trên thanh trên cùng

  khung.innerHTML = `
    <div class="phien">
      <div class="tien-do-phien">
        <div class="thanh-tien-do"><span style="width:0%"></span></div>
        <span class="dem"></span>
      </div>
      <div class="the-tu"></div>
      <div class="vung-tra-loi"></div>
    </div>`;
  const $the = khung.querySelector('.the-tu');
  const $vung = khung.querySelector('.vung-tra-loi');
  const nghe = (cham = false) => { if (cau) doc(tiengDoc(cau.tu), cham ? 0.55 : undefined); };

  // --- Phím tắt trên máy tính ---
  const phim = (e) => {
    if (!hienTai || e.target.closest?.('input, select, textarea')) return;
    const dangONut = e.target.closest?.('button, a');
    const laTiep = (e.key === ' ' || e.key === 'Enter') && !dangONut;
    if (hienTai.kieu === 'gioi-thieu' || daTraLoi) {
      if (laTiep) { e.preventDefault(); khung.querySelector('#nut-tiep')?.click(); }
      return;
    }
    if (!cau) return;
    if (e.key === ' ' && cau.dang === 'nghe' && !dangONut) { e.preventDefault(); nghe(); return; }
    if (/^[1-4]$/.test(e.key)) $vung.querySelectorAll('[data-i]')[Number(e.key) - 1]?.click();
  };
  document.addEventListener('keydown', phim);

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
    if (daRoi) return;
    luotThe++;
    cau = null;
    daTraLoi = false;
    hienTai = theTiepTheo(phien);
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
    else veCauHoi(tu);
    hieuUngVao();
    window.scrollTo(0, 0);
  }

  /** Thẻ luyện / thẻ ôn: một câu hỏi 4 lựa chọn */
  function veCauHoi(tu) {
    const the = layTienDo().the[hienTai.khoa];
    cau = taoCau(tu, chonDang(tu, the, hienTai.kieu, daAm, coGiong));
    const nhan = hienTai.kieu === 'luyen'
      ? '<span class="nhan nhan-vang">📖 Đang học</span>'
      : '<span class="nhan">🔁 Ôn tập</span>';
    $the.innerHTML = `
      <div class="cau-the-tu">
        <div class="goc-the">${nhan}<span class="chu-phu nho">${esc(TEN_DANG[cau.dang])} · HSK ${tu.cap} · ${esc(nhanBaiCuaTu(tu, cheDoBai(cd)))}</span></div>
        ${htmlDeBai(cau)}
      </div>`;
    $vung.innerHTML = `
      ${htmlLuaChon(cau)}
      <p class="phim-tat">Phím tắt: 1–4 chọn đáp án${cau.dang === 'nghe' ? ' · Space = nghe lại' : ''}</p>`;
    $vung.querySelectorAll('[data-i]').forEach((b) => { b.onclick = () => chon(Number(b.dataset.i)); });
    batDau = Date.now();
    if (cau.dang === 'nghe') {
      $the.querySelector('#nut-nghe').onclick = () => nghe();
      $the.querySelector('#nut-cham').onclick = () => nghe(true);
      setTimeout(() => { if (cau && !daTraLoi) nghe(); }, 250);
    }
  }

  /** Người học chọn đáp án → app chấm, xếp lịch, hiện mặt sau */
  function chon(i) {
    if (daTraLoi || !cau || !hienTai) return;
    daTraLoi = true;
    const giay = (Date.now() - batDau) / 1000;
    const dung = cau.luaChon[i].dung;
    amCham(dung);
    const theCu = layTienDo().the[hienTai.khoa];
    const dg = chamDiem(dung, giay, cau.dang, theCu);
    const kq = KET_QUA[dg - 1];
    const khiNao = moTaKhoangCach(theCu, dg);
    ketQua[kq.muc]++;
    traLoi(phien, hienTai.khoa, dg);
    const theMoi = layTienDo().the[hienTai.khoa];
    if (theMoi) { theMoi.dangCuoi = cau.dang; luu(); }   // lần sau hỏi dạng khác

    // Tô màu đáp án ngay trên các nút
    $vung.querySelectorAll('[data-i]').forEach((b) => {
      const l = cau.luaChon[Number(b.dataset.i)];
      b.classList.toggle('dung', l.dung);
      b.classList.toggle('sai', Number(b.dataset.i) === i && !dung);
      b.disabled = true;
    });
    const tu = cau.tu;
    const dapAnDung = cau.luaChon.find((l) => l.dung).hien;
    const luc = luotThe;
    // Để người học kịp thấy nút xanh/đỏ rồi mới lật sang mặt sau
    setTimeout(() => {
      if (luc !== luotThe || daRoi) return;
      $the.innerHTML = `
        <div class="ket-qua-cham ${dung ? 'la-dung' : 'la-sai'}">
          <b>${dung ? '✅ Đúng!' : '❌ Chưa đúng'}</b>
          ${dung ? '' : `<span>Bạn chọn <span class="${cau.dang === 'nghia' ? '' : cau.dang === 'pinyin' ? 'pinyin' : 'han'}">${esc(cau.luaChon[i].hien)}</span>
            – đáp án: <b class="${cau.dang === 'nghia' ? '' : cau.dang === 'pinyin' ? 'pinyin' : 'han'}">${esc(dapAnDung)}</b></span>`}
          <span class="chu-phu nho">App chấm: <b>${kq.ten}</b>${dung ? ` (${Math.round(giay)} giây)` : ''} · gặp lại sau ${khiNao}</span>
        </div>
        ${htmlMatSau(tu)}`;
      $vung.innerHTML = `
        <button class="nut nut-chinh nut-rong" id="nut-tiep">Tiếp tục ▶</button>
        <p class="phim-tat">Phím tắt: Enter / Space = tiếp tục</p>`;
      $vung.querySelector('#nut-tiep').onclick = tiepTheo;
      if (cau.dang !== 'nghe' && cd.tuPhatAm) doc(tiengDoc(tu));
    }, dung ? 450 : 900);
  }

  /** Từ mới: hiện đầy đủ nội dung để làm quen trước khi luyện */
  function veGioiThieu(tu) {
    $the.innerHTML = `
      <div class="goc-the" style="margin-bottom:10px">
        <span class="nhan nhan-chinh">✨ Từ mới</span><span class="chu-phu nho">HSK ${tu.cap} · ${esc(nhanBaiCuaTu(tu, cheDoBai(cd)))}</span>
      </div>
      ${htmlMatSau(tu)}`;
    $vung.innerHTML = `
      <button class="nut nut-chinh nut-rong" id="nut-tiep">Đã hiểu – luyện tiếp ▶</button>
      <p class="phim-tat">Lát nữa app sẽ hỏi lại từ này để kiểm tra · Phím tắt: Space</p>`;
    $vung.querySelector('#nut-tiep').onclick = xemXongTuMoi;
    if (cd.tuPhatAm) doc(tiengDoc(tu));
  }

  function xemXongTuMoi() {
    if (!hienTai) return;
    soTuMoiDaXem++;
    daXemTuMoi(phien, hienTai.khoa, false);
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
    } else if (soBai != null && !tuChuaHoc(soBai).length) {
      const b = timBaiTheoMa(soBai);
      loiNhan = `Bạn đã học hết các từ của ${b ? nhanBai(b) : 'chặng này'}.`;
    } else {
      loiNhan = 'Đã xong phần học từ mới.';
    }
    const coViec = phien.daLam > 0;
    khung.innerHTML = `
      <div class="ket-thuc">
        <div class="emoji emoji-to">${!coViec ? '🎉' : tot >= 0.8 ? '🏆' : tot >= 0.5 ? '🎉' : '💪'}</div>
        <h2>${!coViec ? 'Hoàn thành!' : tot >= 0.8 ? 'Xuất sắc!' : tot >= 0.5 ? 'Làm tốt lắm!' : 'Cố lên, ôn thêm nhé!'}</h2>
        <p class="chu-phu">${loiNhan}</p>
        ${coViec ? `<p class="chu-phu nho">${tongTraLoi} câu hỏi${soTuMoiDaXem ? ` · ${soTuMoiDaXem} từ mới` : ''}</p>` : ''}
        ${tongTraLoi ? `<div class="bang-ket-qua">
          ${KET_QUA.map((l) => `<div class="o-ket-qua muc-${l.muc}"><span class="emoji">${l.emoji}</span><b>${ketQua[l.muc]}</b><span>${l.ten}</span></div>`).join('')}
        </div>
        <p class="chu-phu nho">App tự chấm theo câu trả lời: sai thì gặp lại sớm, đúng nhanh thì giãn lịch ôn.</p>` : ''}
        <a class="nut nut-chinh nut-rong" href="#/">Về trang Hôm nay</a>
        ${loai === 'on' && dem.conTuMoi > 0 && baiDangHoc()
          ? '<a class="nut nut-rong" href="#/hoc-moi">✨ Học từ mới</a>'
          : '<a class="nut nut-rong" href="#/bai">📚 Xem bài học</a>'}
      </div>`;
  }

  // Tải danh sách chữ đa âm (để không hỏi nghe chữ đa âm) rồi bắt đầu
  const ttGiong = tinhTrangPhatAm();
  coGiong = ttGiong !== 'khong-ho-tro' && ttGiong !== 'khong-co-giong';
  taiDaAm().then((ds) => { daAm = ds; if (!daRoi) tiepTheo(); });

  // --- Dọn dẹp khi rời màn hình ---
  return () => {
    daRoi = true;
    dungDongHo();
    document.removeEventListener('keydown', phim);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    document.body.classList.remove('dang-hoc');
  };
}
