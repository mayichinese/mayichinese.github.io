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
//   - Thẻ ÔN đôi khi hỏi dạng NHỚ CHỦ ĐỘNG (đánh giá tester 2026-11-21): ⌨️ gõ pinyin (dấu hoặc số thanh: ni3 hao3),
//     ✍️ viết chữ không có nét mờ (từ một chữ). Đã sai từ trong ngày (the.saiNgay) thì không được chấm "Dễ".
// Phím tắt: 1–4 chọn đáp án · Space = nghe lại (câu nghe) · Enter/Space = tiếp tục
// =========================================================

import { caiDat, layTienDo, luu, ngayHoc } from './luu-tru.js';
import { toMauPinyin, toMauChuHan, demChuHan, tachPinyin } from './pinyin.js';
import { amSo } from './cham-phat-am.js';
import { taiNetChu, taoBangVe, saiToiDa } from './net-chu.js';
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
  if (dang === 'viet') return DANH_GIA.NHO;          // viết tay: đúng là nhớ (không tính nhanh/chậm)
  if (giay > (dang === 'go-pinyin' ? CHAM * 2 : CHAM)) return DANH_GIA.KHO;
  // Đã sai từ này trong hôm nay (ở cửa học hoặc lần ôn trước) → tối đa "Nhớ" (đánh giá tester 2026-11-21)
  if (the?.saiNgay === ngayHoc()) return DANH_GIA.NHO;
  if (giay <= (dang === 'go-pinyin' ? 12 : NHANH[dang] || 5)) {
    // Thẻ đang học: chỉ cho "Dễ" ở bước cuối (đã đúng ít nhất một lần trước đó trong giai đoạn học)
    const dangHocLanDau = the && the.trangThai === 'hoc';
    if (!dangHocLanDau || (the.buoc || 0) >= 1) return DANH_GIA.DE;
  }
  return DANH_GIA.NHO;
}

/** Chọn dạng câu hỏi cho một thẻ. Thẻ ÔN đôi khi hỏi dạng nhớ chủ động: gõ pinyin, viết chữ (không nét mờ) */
function chonDang(tu, the, kieu, daAm, coGiong, net = {}) {
  if (kieu === 'on' && the?.trangThai === 'on') {
    const r = Math.random();
    const motChu = demChuHan(tu.hanzi) === 1 && net[tu.hanzi];
    if (motChu && r < 0.15 && the.dangCuoi !== 'viet') return 'viet';
    if (r < 0.35 && !tu.pinyin.includes('/') && the.dangCuoi !== 'go-pinyin') return 'go-pinyin';
  }
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
  let net = {};                      // dữ liệu nét (cho dạng viết chữ)
  let huyViet = null;
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
    if (!cau || cau.dang === 'go-pinyin' || cau.dang === 'viet') return;
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
    if (huyViet) { huyViet(); huyViet = null; }
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
    const dang = chonDang(tu, the, hienTai.kieu, daAm, coGiong, net);
    if (dang === 'go-pinyin' || dang === 'viet') { veNhoChuDong(tu, dang); return; }
    cau = taoCau(tu, dang);
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

  // ----- Nhớ chủ động: gõ pinyin / viết chữ không nét mờ -----
  /** Chuẩn hóa pinyin thành ["ni3","hao3"] (thanh nhẹ = 5). Nhận cả dấu thanh lẫn số thanh, bỏ dấu cách / dấu nháy. */
  function amTietPinyin(chuoi, soChu) {
    const s = String(chuoi || '').toLowerCase().replace(/v/g, 'ü').replace(/u:/g, 'ü').trim();
    if (/\d/.test(s)) {
      // "ni3hao3" → ["ni","3","hao","3",""]; âm tiết cuối không có số = thanh nhẹ
      const phan = s.replace(/[^a-zü0-5]/g, '').replace(/ü/g, 'v').split(/([0-5])/);
      const kq = [];
      for (let i = 0; i < phan.length; i += 2) {
        if (phan[i]) kq.push(`${phan[i]}${phan[i + 1] && phan[i + 1] !== '0' ? phan[i + 1] : '5'}`);
      }
      return kq;
    }
    return tachPinyin(s, soChu).filter((x) => x.thanh !== undefined).map((x) => amSo(x.chu));
  }
  function veNhoChuDong(tu, dang) {
    cau = { tu, dang, luaChon: [] };
    const nhan = '<span class="nhan">🔁 Ôn tập · nhớ chủ động</span>';
    batDau = Date.now();
    if (dang === 'go-pinyin') {
      $the.innerHTML = `
        <div class="cau-the-tu">
          <div class="goc-the">${nhan}<span class="chu-phu nho">⌨️ Gõ pinyin · HSK ${tu.cap}</span></div>
          <p class="cau-hoi">Gõ pinyin của từ này (dấu thanh hoặc số: <b>ni3 hao3</b>)</p>
          <p class="han tu-hoi">${esc(tu.hanzi)}</p>
          <p class="chu-phu nho" style="margin:0">${esc(nghiaNganThe(tu))}</p>
        </div>`;
      $vung.innerHTML = `
        <div class="hang-tu-viet"><input id="o-pinyin" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="vd. xue2 sheng5">
          <button class="nut nut-chinh" id="nut-kiem">Kiểm tra</button></div>
        <button class="nut nut-rong" id="nut-khong-biet" style="margin-top:8px">Không nhớ – xem đáp án</button>`;
      const $o = $vung.querySelector('#o-pinyin');
      $o.focus();
      const kiem = (boQua) => {
        if (daTraLoi) return;
        const n = demChuHan(tu.hanzi);
        const dapAn = amTietPinyin(tu.pinyin, n);
        const ban = boQua ? [] : amTietPinyin($o.value, n);
        // 不 / 一: chấp nhận cả thanh gốc lẫn thanh đã biến điệu (bù / bú, yī / yí / yì)
        const chu = [...tu.hanzi].filter((c) => /\p{Script=Han}/u.test(c));
        const khop = (a, b, i) => a === b || (a.slice(0, -1) === b.slice(0, -1)
          && ((chu[i] === '不' && a.startsWith('bu')) || (chu[i] === '一' && a.startsWith('yi'))));
        const dung = !boQua && ban.length === dapAn.length && ban.every((a, i) => khop(a, dapAn[i], i));
        ketThucCau(dung, dang, boQua ? '(không nhớ)' : $o.value, tu.pinyin, 'pinyin');
      };
      $vung.querySelector('#nut-kiem').onclick = () => kiem(false);
      $o.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); kiem(false); } };
      $vung.querySelector('#nut-khong-biet').onclick = () => kiem(true);
      return;
    }
    // Viết chữ (từ một chữ), không có nét mờ
    $the.innerHTML = `
      <div class="cau-the-tu">
        <div class="goc-the">${nhan}<span class="chu-phu nho">✍️ Viết chữ · HSK ${tu.cap}</span></div>
        <p class="cau-hoi">Viết chữ Hán có nghĩa:</p>
        <p class="nghia-hoi">${esc(nghiaNganThe(tu))}</p>
        <p class="pinyin" style="margin:0">${toMauPinyin(tu.pinyin, demChuHan(tu.hanzi))}</p>
        <div class="o-viet" id="o-viet-on"></div>
        <p class="chu-phu nho" id="loi-viet" style="margin:0">Viết theo đúng thứ tự nét – không có nét mờ để tô.</p>
      </div>`;
    $vung.innerHTML = '<button class="nut nut-rong" id="nut-khong-biet">Không nhớ – xem đáp án</button>';
    const luc = luotThe;
    $vung.querySelector('#nut-khong-biet').onclick = () => { if (!daTraLoi) ketThucCau(false, dang, '(không nhớ)', tu.hanzi, 'han'); };
    taoBangVe($the.querySelector('#o-viet-on'), tu.hanzi, { showCharacter: false, showOutline: false }).then((wr) => {
      if (daRoi || luc !== luotThe) return;
      const nguong = saiToiDa(net[tu.hanzi]?.strokes.length || 5);
      wr.quiz({ showHintAfterMisses: 3,
        onMistake: (d) => { const $l = $the.querySelector('#loi-viet'); if ($l) $l.textContent = `Sai nét (${d.totalMistakes} lần).`; },
        onComplete: (kq) => {
          if (daRoi || luc !== luotThe || daTraLoi) return;
          ketThucCau(kq.totalMistakes <= nguong, dang, `sai ${kq.totalMistakes} nét`, tu.hanzi, 'han');
        } });
      huyViet = () => { try { wr.cancelQuiz(); } catch { /* đã hủy */ } };
    }).catch(() => { if (!daTraLoi) ketThucCau(false, dang, '(không tải được nét)', tu.hanzi, 'han'); });
  }
  const nghiaNganThe = (tu) => (tu.nghia || []).map((n) => n.nghia).join('; ');

  /** Chấm điểm SM-2 + ghi lịch + lật sang mặt sau (dùng cho mọi dạng câu) */
  function ketThucCau(dung, dang, banTraLoi, dapAnDung, lop) {
    daTraLoi = true;
    const giay = (Date.now() - batDau) / 1000;
    amCham(dung);
    const theCu = layTienDo().the[hienTai.khoa];
    const dg = chamDiem(dung, giay, dang, theCu);
    const kq = KET_QUA[dg - 1];
    const khiNao = moTaKhoangCach(theCu, dg);
    ketQua[kq.muc]++;
    traLoi(phien, hienTai.khoa, dg);
    const theMoi = layTienDo().the[hienTai.khoa];
    if (theMoi) {
      theMoi.dangCuoi = dang;                       // lần sau hỏi dạng khác
      if (!dung) theMoi.saiNgay = ngayHoc();        // sai hôm nay → lần ôn sau trong ngày không được "Dễ"
      luu();
    }
    const tu = cau.tu;
    const luc = luotThe;
    setTimeout(() => {
      if (luc !== luotThe || daRoi) return;
      $the.innerHTML = `
        <div class="ket-qua-cham ${dung ? 'la-dung' : 'la-sai'}">
          <b>${dung ? '✅ Đúng!' : '❌ Chưa đúng'}</b>
          ${dung ? '' : `<span>Bạn: <span class="${lop}">${esc(banTraLoi)}</span> – đáp án: <b class="${lop}">${esc(dapAnDung)}</b></span>`}
          <span class="chu-phu nho">App chấm: <b>${kq.ten}</b>${dung && dang !== 'viet' ? ` (${Math.round(giay)} giây)` : ''} · gặp lại sau ${khiNao}</span>
        </div>
        ${htmlMatSau(tu)}`;
      $vung.innerHTML = `
        <button class="nut nut-chinh nut-rong" id="nut-tiep">Tiếp tục ▶</button>
        <p class="phim-tat">Phím tắt: Enter / Space = tiếp tục</p>`;
      $vung.querySelector('#nut-tiep').onclick = tiepTheo;
      if (dang !== 'nghe' && cd.tuPhatAm) doc(tiengDoc(tu));
    }, dung ? 450 : 900);
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
    if (theMoi) {
      theMoi.dangCuoi = cau.dang;                   // lần sau hỏi dạng khác
      if (!dung) theMoi.saiNgay = ngayHoc();        // sai hôm nay → lần ôn sau trong ngày không được "Dễ"
      luu();
    }

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
  Promise.all([taiDaAm(), taiNetChu().catch(() => ({ net: {} }))]).then(([ds, nc]) => {
    daAm = ds;
    net = nc.net || {};
    if (!daRoi) tiepTheo();
  });

  // --- Dọn dẹp khi rời màn hình ---
  return () => {
    daRoi = true;
    if (huyViet) huyViet();
    dungDongHo();
    document.removeEventListener('keydown', phim);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    document.body.classList.remove('dang-hoc');
  };
}
