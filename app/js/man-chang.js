// =========================================================
// CHẶNG BÀI HỌC – học như em bé: NGHE → NÓI THEO → VIẾT → GHÉP → ĐỌC
//   #/chang/<mã bài>/<số chặng>   (số chặng đếm từ 0)
// Mỗi bài (theo sách) chia thành các chặng ~5 từ (chiaChang). Một chặng gồm:
//   👂 Nghe : giới thiệu từng từ (nghe trước) → nghe chọn nghĩa; thêm 2 câu nghe chọn chữ
//   🗣️ Nói : nghe rồi nói theo 3 từ (máy chấm – ganKhungNoi; có nút "Không nói được lúc này")
//   ✍️ Viết : tô theo nét ≤ 3 chữ mới của chặng (Hanzi Writer)
//   🧩 Ghép : ghép cặp chữ ↔ nghĩa, nghĩa → chữ / pinyin, sắp xếp mảnh thành câu (câu chỉ gồm chữ đã biết)
//   📖 Đọc : đọc câu ví dụ → chọn nghĩa
// Câu trắc nghiệm sai được hỏi lại một lần cuối chặng.
// APP TỰ CHẤM (không tự đánh giá): xong chặng, mỗi từ MỚI được xếp lịch SM-2 theo số lần sai của từ đó
//   0 sai → ôn sau 1 ngày · 1–2 sai → gặp lại sau 10 phút · ≥ 3 sai → gặp lại sau 1 phút (ở Ôn luyện)
// Học lại chặng đã xong: từ nào sai thì thẻ ôn đến hạn ngay.
// Tiến độ: tienDo.chang[mã bài] = [số chặng đã xong]. Chặng cũng coi là xong khi mọi từ của chặng đã học
// (tiến độ từ trước khi có chặng). Nói, viết, sắp xếp câu chỉ tính điểm chặng, không làm sai lịch ôn từ.
// =========================================================

import { layTienDo, luu, nhatKyHomNay, ghiLuot, caiDat } from './luu-tru.js';
import { tinhLichMoi, DANH_GIA } from './lich-on.js';
import { tatCaTu, timBaiTheoMa, nhanBai, nghiaNgan } from './du-lieu.js';
import { doc, tinhTrangPhatAm } from './phat-am.js';
import { demHomNay } from './phien-hoc.js';
import { esc, batDongHo, htmlMatSau, nutLoa } from './giao-dien.js';
import { toMauPinyin, toMauChuHan, demChuHan, bienTheThanh } from './pinyin.js';
import { tron, taiDaAm, taoCau, htmlDeBai, htmlLuaChon } from './cau-hoi-tu.js';
import { taiNetChu, taoBangVe, phatHoatCanh } from './net-chu.js';
import { ganKhungNoi } from './man-luyen-noi.js';
import { coNhanDang, coGhiAm } from './nhan-giong.js';
import { DIEM_DAT } from './cham-phat-am.js';
import { htmlCauCham, tachTu } from './cham-tu.js';

const CO_CHANG = 5;            // số từ mỗi chặng (chia đều: 13 từ → 5 + 4 + 4)
const SO_NOI = 3;              // số từ nói theo mỗi chặng
const SO_VIET = 3;             // số chữ tô mỗi chặng

export const CAC_KY = [
  { ma: 'nghe', emoji: '👂', ten: 'Nghe' },
  { ma: 'noi', emoji: '🗣️', ten: 'Nói' },
  { ma: 'viet', emoji: '✍️', ten: 'Viết' },
  { ma: 'ghep', emoji: '🧩', ten: 'Ghép' },
  { ma: 'doc', emoji: '📖', ten: 'Đọc' },
];
const KY = Object.fromEntries(CAC_KY.map((k) => [k.ma, k]));

// ---------- Chia chặng + trạng thái ----------
/** Chia từ của bài thành các chặng ~5 từ, giữ thứ tự bài: [{ so, tu }] */
export function chiaChang(b) {
  const n = b.tu.length;
  const k = Math.max(1, Math.ceil(n / CO_CHANG));
  const ds = [];
  let dau = 0;
  for (let c = 0; c < k; c++) {
    const so = Math.floor(n / k) + (c < n % k ? 1 : 0);
    ds.push({ so: c, tu: b.tu.slice(dau, dau + so) });
    dau += so;
  }
  return ds;
}

/** Các chặng kèm trạng thái: xong (đã làm hoặc đã học hết từ), mo (được vào: chặng đầu hoặc chặng trước đã xong) */
export function trangThaiCacChang(b) {
  const td = layTienDo();
  const daXong = new Set(td.chang?.[b.ma] || []);
  const ds = chiaChang(b).map((c) => ({ ...c, xong: daXong.has(c.so) || (c.tu.length > 0 && c.tu.every((t) => td.the[t.khoa])) }));
  ds.forEach((c, i) => { c.mo = c.xong || i === 0 || ds[i - 1].xong; });
  return ds;
}
/** Chặng đầu tiên chưa xong của bài (null nếu xong hết) */
export const changTiepTheo = (b) => trangThaiCacChang(b).find((c) => !c.xong) || null;

// ---------- Tiện ích ----------
const chuHan = (s) => [...String(s).replace(/[^\p{Script=Han}]/gu, '')];
const rutGon = (s, toiDa = 34) => (s.length > toiDa ? `${s.slice(0, toiDa - 1).trim()}…` : s);
/** Nghĩa đầu tiên, bỏ phần giải thích trong ngoặc – cho ô ghép cặp */
const nghiaGon = (w) => rutGon(String(w.nghia?.[0]?.nghia || nghiaNgan(w)).replace(/\s*\([^)]*\)/g, '').trim(), 30);

/** Tách câu thành mảnh theo từ điển HSK (cùng cách tách với chạm-xem-nghĩa) – bỏ dấu câu */
const tachManh = (cau) => tachTu(cau).filter((d) => d.han).map((d) => d.chu);

/** Câu ví dụ dùng cho Ghép / Đọc */
function chonCau(W, td) {
  const Wkhoa = new Set(W.map((w) => w.khoa));
  const tuBiet = tatCaTu().filter((t) => td.the[t.khoa] || Wkhoa.has(t.khoa));
  const chuBiet = new Set(tuBiet.flatMap((t) => chuHan(t.hanzi)));
  const biet = (s) => chuHan(s).every((c) => chuBiet.has(c));
  const ung = tron(W.flatMap((w) => (w.viDu || []).map((v) => ({ v, w }))));
  const deDoc = [...ung.filter((x) => biet(x.v.han)), ...ung.filter((x) => !biet(x.v.han))];

  // Sắp xếp câu: chỉ câu gồm toàn chữ đã biết, không có số / chữ La-tinh, 3–6 mảnh
  let sapXep = null;
  for (const x of ung) {
    if (!biet(x.v.han) || /[0-9A-Za-z]/.test(x.v.han)) continue;
    const manh = tachManh(x.v.han);
    if (manh.length >= 3 && manh.length <= 6) { sapXep = { cau: x.v, manh }; break; }
  }

  // Đọc: 2 câu (ưu tiên câu khác câu sắp xếp, khác từ), đáp án nhiễu là nghĩa của câu khác
  const nguonNhieu = [...new Set([...tuBiet, ...tatCaTu().filter((t) => t.cap === W[0].cap)]
    .flatMap((t) => (t.viDu || []).map((v) => v.dich)))];
  const doc2 = [];
  const daDung = new Set([sapXep?.cau.han]);
  const tuDaDung = new Set();
  for (const x of deDoc) {
    if (doc2.length === 2) break;
    if (daDung.has(x.v.han) || (tuDaDung.has(x.w.khoa) && deDoc.length > 3)) continue;
    const nhieu = tron(nguonNhieu.filter((d) => d !== x.v.dich)).slice(0, 2);
    if (nhieu.length < 2) continue;
    daDung.add(x.v.han);
    tuDaDung.add(x.w.khoa);
    doc2.push({
      cau: x.v, tu: x.w, coPinyin: !biet(x.v.han),
      luaChon: tron([{ hien: x.v.dich, dung: true }, ...nhieu.map((d) => ({ hien: d, dung: false }))]),
    });
  }
  return { sapXep, doc: doc2 };
}

// =========================================================
// MỘT CHẶNG
// =========================================================
/**
 * @param maBai mã bài ('s3', '2-5'…) · @param so số chặng (từ 0)
 * @returns {Function} hàm dọn dẹp
 */
export function veChang(khung, maBai, so) {
  const b = timBaiTheoMa(maBai);
  const dsChang = b ? trangThaiCacChang(b) : [];
  const chang = dsChang[so];
  if (!b || !chang || !chang.tu.length) {
    khung.innerHTML = '<p class="loi">Không tìm thấy chặng này.</p><a class="nut nut-rong" href="#/bai">← Về lộ trình</a>';
    return () => {};
  }
  if (!chang.mo) {
    khung.innerHTML = `<div class="chua-lam"><div class="emoji emoji-to">🔒</div><h2>Chặng này chưa mở</h2>
      <p class="chu-phu">Hãy làm xong chặng trước của bài.</p><a class="nut nut-chinh" href="#/bai/${b.ma}">← Về bài</a></div>`;
    return () => {};
  }

  let daRoi = false;
  let dungDongHo = () => {};
  let xuLyPhim = null;
  let huyHienTai = null;           // dọn dẹp mục đang hiện (micro, bảng viết…)

  // Đã đủ số từ mới hôm nay → hỏi trước khi học thêm
  const W = chang.tu;
  const td0 = layTienDo();
  const soTuMoi = W.filter((w) => !td0.the[w.khoa]).length;
  const { conTuMoi } = demHomNay();
  if (soTuMoi && conTuMoi < soTuMoi) {
    khung.innerHTML = `
      <div class="chua-lam">
        <div class="emoji emoji-to">🌙</div>
        <h2>Hôm nay đã đủ từ mới</h2>
        <p class="chu-phu">Mục tiêu là ${caiDat().soTuMoiMoiNgay} từ mới mỗi ngày${conTuMoi ? ` (còn ${conTuMoi})` : ''}; chặng này có ${soTuMoi} từ mới.
          Học thêm vẫn được, nhưng ngày mai sẽ có nhiều thẻ cần ôn hơn.</p>
        <button class="nut nut-chinh nut-rong" id="nut-van-hoc">Vẫn học chặng này</button>
        <a class="nut nut-rong" href="#/on">🔁 Ôn từ đến hạn</a>
        <a class="nut nut-rong" href="#/bai/${b.ma}">← Về bài</a>
      </div>`;
    khung.querySelector('#nut-van-hoc').onclick = () => batDau();
  } else {
    batDau();
  }

  function batDau() {
    khung.innerHTML = '<div class="dang-tai">Đang chuẩn bị chặng…</div>';
    Promise.all([taiDaAm(), taiNetChu().catch(() => ({ net: {} }))]).then(([daAm, netChu]) => {
      if (!daRoi) chay(daAm, netChu.net || {});
    });
  }

  function chay(daAm, net) {
    const td = layTienDo();
    const ttGiong = tinhTrangPhatAm();
    const coGiong = ttGiong !== 'khong-ho-tro' && ttGiong !== 'khong-co-giong';
    const ngheDuoc = (w) => coGiong && !(demChuHan(w.hanzi) === 1 && daAm.has(w.hanzi));
    const pinyinDuoc = (w) => !w.pinyin.includes('/') && bienTheThanh(w.pinyin, demChuHan(w.hanzi)).length === 3;

    // --- Hàng đợi bài tập theo thứ tự kỹ năng ---
    const hang = [];
    for (const w of W) {
      hang.push({ ky: 'nghe', loai: 'gioi-thieu', tu: w });
      hang.push({ ky: 'nghe', loai: 'hoi', tu: w, dang: ngheDuoc(w) ? 'nghe-nghia' : 'nghia' });
    }
    for (const w of tron(W).slice(0, 2)) hang.push({ ky: 'nghe', loai: 'hoi', tu: w, dang: ngheDuoc(w) ? 'nghe' : 'chu' });
    if (coNhanDang() || coGhiAm()) {
      for (const w of tron(W).slice(0, SO_NOI)) hang.push({ ky: 'noi', loai: 'noi', tu: w });
    }
    const Wkhoa = new Set(W.map((w) => w.khoa));
    const chuTruoc = new Set(tatCaTu().filter((t) => td.the[t.khoa] && !Wkhoa.has(t.khoa)).flatMap((t) => chuHan(t.hanzi)));
    const chuCuaChang = [...new Set(W.flatMap((w) => chuHan(w.hanzi)))].filter((c) => net[c]);
    const chuMoi = chuCuaChang.filter((c) => !chuTruoc.has(c));
    for (const c of (chuMoi.length ? chuMoi : chuCuaChang).slice(0, SO_VIET)) {
      hang.push({ ky: 'viet', loai: 'viet', chu: c, tu: W.find((w) => w.hanzi.includes(c)) });
    }
    if (W.length >= 3) hang.push({ ky: 'ghep', loai: 'ghep-cap', ds: W });
    tron(W).slice(0, 3).forEach((w, i) => {
      hang.push({ ky: 'ghep', loai: 'hoi', tu: w, dang: i === 0 && pinyinDuoc(w) ? 'pinyin' : 'chu' });
    });
    const { sapXep, doc: dsDoc } = chonCau(W, td);
    if (sapXep) hang.push({ ky: 'ghep', loai: 'sap-xep', ...sapXep });
    for (const d of dsDoc) hang.push({ ky: 'doc', loai: 'doc', ...d });

    const coKy = new Set(hang.map((m) => m.ky));
    const ketQua = Object.fromEntries(CAC_KY.map((k) => [k.ma, { dung: 0, tong: 0 }]));
    const saiTu = {};                 // khóa từ → số lần sai (chỉ câu trắc nghiệm + ghép cặp)
    let daLam = 0;
    let muc = null;
    let daXongMuc = false;            // mục hiện tại đã trả lời / làm xong → Enter = tiếp

    document.body.classList.add('dang-hoc');
    dungDongHo = batDongHo('moi');
    khung.innerHTML = `
      <div class="phien phien-chang">
        <div class="tien-do-phien">
          <div class="thanh-tien-do"><span style="width:0%"></span></div>
          <span class="dem"></span>
        </div>
        <div class="buoc-ky">${CAC_KY.map((k) => `
          <span class="o-ky ${coKy.has(k.ma) ? '' : 'bo'}" data-ky="${k.ma}"><span class="emoji">${k.emoji}</span><small>${k.ten}</small></span>`).join('')}</div>
        <div class="the-tu the-chang"></div>
        <div class="vung-tra-loi"></div>
      </div>`;
    const $the = khung.querySelector('.the-chang');
    const $vung = khung.querySelector('.vung-tra-loi');

    function capNhatTienDo() {
      const tong = daLam + hang.length + (muc ? 1 : 0);
      khung.querySelector('.tien-do-phien .thanh-tien-do > span').style.width = `${tong ? (daLam / tong) * 100 : 0}%`;
      khung.querySelector('.tien-do-phien .dem').textContent = muc?.laiLan ? '↺ Sửa câu sai' : `Chặng ${so + 1}/${dsChang.length}`;
      const thuTu = CAC_KY.map((k) => k.ma);
      // câu hỏi lại cuối chặng (laiLan) → coi như đã qua đủ 5 bước
      const i = muc && !muc.laiLan ? thuTu.indexOf(muc.ky) : thuTu.length;
      khung.querySelectorAll('.o-ky').forEach((o) => {
        const j = thuTu.indexOf(o.dataset.ky);
        o.classList.toggle('dang', j === i);
        o.classList.toggle('xong', j < i);
      });
    }

    const nhanKy = (m, them = '') => `<div class="goc-the"><span class="nhan nhan-chinh">${KY[m.ky].emoji} ${KY[m.ky].ten}</span>${them}</div>`;
    const tuNho = (w) => `
      <div class="tu-sau-tra-loi">
        <span class="han tu-lon">${toMauChuHan(w.hanzi, w.pinyin)}</span>
        <span class="giua"><span class="pinyin">${toMauPinyin(w.pinyin, demChuHan(w.hanzi))}</span>
          <span class="chu-phu nho">${esc(nghiaNgan(w))}</span></span>${nutLoa(w.hanzi, true)}
      </div>`;

    /** Hiện phản hồi + nút Tiếp ở cuối vùng trả lời */
    function hienPhanHoi(dung, noiDung = '', chuNut = 'Tiếp tục ▶') {
      daXongMuc = true;
      $vung.querySelector('.phim-tat')?.remove();
      $vung.insertAdjacentHTML('beforeend', `
        <div class="phan-hoi ${dung === null ? '' : dung ? 'la-dung' : 'la-sai'}">
          ${dung === null ? '' : `<b>${dung ? '✅ Đúng rồi!' : '❌ Chưa đúng'}</b>`}${noiDung}
        </div>
        <button class="nut nut-chinh nut-rong" id="nut-tiep">${chuNut}</button>`);
      $vung.querySelector('#nut-tiep').onclick = tiepTheo;
      $vung.querySelector('#nut-tiep').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    function tiepTheo() {
      if (daRoi) return;
      if (huyHienTai) { huyHienTai(); huyHienTai = null; }
      if (muc) daLam++;
      muc = hang.shift() || null;
      daXongMuc = false;
      if (!muc) return veKetThuc();
      capNhatTienDo();
      $the.classList.remove('the-moi-vao');
      void $the.offsetWidth;
      $the.classList.add('the-moi-vao');
      window.scrollTo(0, 0);
      ({ 'gioi-thieu': veGioiThieu, hoi: veHoi, noi: veNoi, viet: veViet, 'ghep-cap': veGhepCap, 'sap-xep': veSapXep, doc: veDoc })[muc.loai](muc);
    }

    // ----- 👂 Giới thiệu từ mới: nghe trước, xem đầy đủ -----
    function veGioiThieu(m) {
      $the.innerHTML = `${nhanKy(m, '<span class="nhan nhan-vang">✨ Từ mới</span>')}${htmlMatSau(m.tu)}`;
      $vung.innerHTML = '';
      hienPhanHoi(null, '<span class="chu-phu nho">Nghe vài lần, đọc theo khẽ, nhìn câu ví dụ – lát nữa app sẽ hỏi lại.</span>', 'Đã hiểu – tiếp ▶');
      doc(m.tu.hanzi);
    }

    // ----- Câu trắc nghiệm về một từ (nghe / ghép) -----
    function veHoi(m) {
      const cau = taoCau(m.tu, m.dang);
      $the.innerHTML = `
        <div class="cau-the-tu">
          ${nhanKy(m, m.laiLan ? '<span class="nhan nhan-vang">↺ Hỏi lại</span>' : '')}
          ${htmlDeBai(cau)}
        </div>`;
      $vung.innerHTML = `${htmlLuaChon(cau)}
        <p class="phim-tat">Phím tắt: 1–4 chọn đáp án${cau.dang.startsWith('nghe') ? ' · Space = nghe lại' : ''}</p>`;
      const nghe = (cham) => doc(m.tu.hanzi, cham ? 0.55 : undefined);
      if (cau.dang.startsWith('nghe')) {
        $the.querySelector('#nut-nghe').onclick = () => nghe(false);
        $the.querySelector('#nut-cham').onclick = () => nghe(true);
        setTimeout(() => { if (muc === m && !daXongMuc) nghe(false); }, 250);
        m.nghe = nghe;
      }
      $vung.querySelectorAll('[data-i]').forEach((nut) => {
        nut.onclick = () => {
          if (daXongMuc) return;
          const i = Number(nut.dataset.i);
          const dung = cau.luaChon[i].dung;
          $vung.querySelectorAll('[data-i]').forEach((x) => {
            const l = cau.luaChon[Number(x.dataset.i)];
            x.classList.toggle('dung', l.dung);
            x.classList.toggle('sai', x === nut && !dung);
            x.disabled = true;
          });
          ketQua[m.ky].tong++;
          if (dung) ketQua[m.ky].dung++;
          else {
            saiTu[m.tu.khoa] = (saiTu[m.tu.khoa] || 0) + 1;
            if (!m.laiLan) hang.push({ ...m, laiLan: true });
          }
          hienPhanHoi(dung, tuNho(m.tu));
          if (!cau.dang.startsWith('nghe')) doc(m.tu.hanzi);
        };
      });
    }

    // ----- 🗣️ Nghe rồi nói theo -----
    function veNoi(m) {
      const w = m.tu;
      $the.innerHTML = `
        <div class="cau-the-tu">
          ${nhanKy(m)}
          <p class="cau-hoi">Nghe rồi nói theo</p>
          <p class="han tu-hoi">${toMauChuHan(w.hanzi, w.pinyin)}</p>
          <p class="pinyin pinyin-to" style="margin:0">${toMauPinyin(w.pinyin, demChuHan(w.hanzi))}</p>
          <p class="chu-phu" style="margin:0">${esc(nghiaNgan(w))}</p>
          ${nutLoa(w.hanzi)}
        </div>`;
      $vung.innerHTML = `
        <div id="vung-noi"></div>
        <div class="hang-nut" style="margin-top:10px">
          <button class="nut" id="nut-khong-noi">🔇 Tạm bỏ phần nói</button>
          <button class="nut nut-chinh" id="nut-tiep-noi">Bỏ qua ▶</button>
        </div>`;
      let diem = null;
      huyHienTai = ganKhungNoi($vung.querySelector('#vung-noi'), { hanzi: w.hanzi, pinyin: w.pinyin }, (kq) => {
        diem = kq.diem;
        $vung.querySelector('#nut-tiep-noi').textContent = 'Tiếp tục ▶';
        daXongMuc = true;
      });
      const xong = () => {
        if (diem !== null) {
          ketQua.noi.tong++;
          if (diem >= DIEM_DAT) {
            ketQua.noi.dung++;
            const nk = nhatKyHomNay();
            nk.noi = (nk.noi || 0) + 1;
          }
        }
        tiepTheo();
      };
      $vung.querySelector('#nut-tiep-noi').onclick = xong;
      // Không nói được (nơi đông người…) → bỏ mọi câu nói còn lại của chặng
      $vung.querySelector('#nut-khong-noi').onclick = () => {
        for (let i = hang.length - 1; i >= 0; i--) if (hang[i].loai === 'noi') hang.splice(i, 1);
        tiepTheo();
      };
      m.nutTiep = '#nut-tiep-noi';
      setTimeout(() => { if (muc === m) doc(w.hanzi); }, 250);
    }

    // ----- ✍️ Tô theo nét -----
    function veViet(m) {
      const w = m.tu;
      $the.innerHTML = `
        <div class="cau-the-tu">
          ${nhanKy(m)}
          <p class="cau-hoi">Tô chữ <span class="han">${esc(m.chu)}</span> theo nét mờ, đúng thứ tự nét</p>
          <p class="chu-phu nho" style="margin:0">trong từ <span class="han">${esc(w.hanzi)}</span> · ${toMauPinyin(w.pinyin, demChuHan(w.hanzi))} · ${esc(rutGon(nghiaNgan(w), 40))}</p>
          <div class="o-viet" id="o-viet"></div>
          <p class="chu-phu nho" id="loi-nhan" style="margin:0">Vẽ từng nét bằng ngón tay (hoặc chuột).</p>
        </div>`;
      $vung.innerHTML = `
        <div class="hang-nut">
          <button class="nut" id="nut-xem-viet">▶ Xem cách viết</button>
          <button class="nut" id="nut-bo-viet">Bỏ qua ▶</button>
        </div>`;
      $vung.querySelector('#nut-bo-viet').onclick = tiepTheo;
      let writer = null;
      const batDauTo = () => writer.quiz({
        showHintAfterMisses: 2,
        onMistake: (d) => {
          const $ln = khung.querySelector('#loi-nhan');
          if ($ln) $ln.textContent = `Chưa đúng nét (sai ${d.totalMistakes} lần)${d.mistakesOnStroke >= 2 ? ' – nét đúng đang nhấp nháy gợi ý' : ''}.`;
        },
        onComplete: (kq) => {
          if (daRoi || muc !== m) return;
          ketQua.viet.tong++;
          if (kq.totalMistakes <= 3) ketQua.viet.dung++;
          const nk = nhatKyHomNay();
          nk.viet = (nk.viet || 0) + 1;
          $vung.innerHTML = '';
          hienPhanHoi(kq.totalMistakes <= 3,
            `<span class="chu-phu nho">${kq.totalMistakes ? `Sai ${kq.totalMistakes} nét` : 'Không sai nét nào'} · luyện thêm ở Ôn luyện → Viết chữ.</span>`);
        },
      });
      taoBangVe(khung.querySelector('#o-viet'), m.chu, { showCharacter: false }).then((wr) => {
        if (daRoi || muc !== m) return;
        writer = wr;
        batDauTo();
        $vung.querySelector('#nut-xem-viet').onclick = async () => {
          writer.cancelQuiz();
          await phatHoatCanh(writer);
          if (muc !== m || daXongMuc) return;
          writer.hideCharacter();
          batDauTo();
        };
      }).catch(() => { if (muc === m) tiepTheo(); });
      huyHienTai = () => { try { writer?.cancelQuiz(); } catch { /* đã hủy */ } };
    }

    // ----- 🧩 Ghép cặp chữ ↔ nghĩa -----
    function veGhepCap(m) {
      const trai = tron(m.ds);
      const phai = tron(m.ds);
      $the.innerHTML = `
        ${nhanKy(m)}
        <p class="cau-hoi" style="text-align:center">Ghép chữ Hán với nghĩa đúng</p>
        <div class="luoi-ghep">
          <div class="cot-ghep">${trai.map((w) => `<button class="o-ghep han" data-k="${esc(w.khoa)}">${esc(w.hanzi)}</button>`).join('')}</div>
          <div class="cot-ghep">${phai.map((w) => `<button class="o-ghep" data-n="${esc(w.khoa)}">${esc(nghiaGon(w))}</button>`).join('')}</div>
        </div>`;
      $vung.innerHTML = '<p class="phim-tat" style="text-align:center">Chạm một chữ rồi chạm nghĩa của nó</p>';
      let chonK = null;
      let chonN = null;
      let conLai = m.ds.length;
      const saiCap = new Set();
      const theoKhoa = Object.fromEntries(m.ds.map((w) => [w.khoa, w]));
      const thu = () => {
        if (!chonK || !chonN) return;
        const a = theoKhoa[chonK.dataset.k];
        const bN = theoKhoa[chonN.dataset.n];
        const dung = a === bN || nghiaGon(a) === nghiaGon(bN);
        const [x, y] = [chonK, chonN];
        chonK = null; chonN = null;
        x.classList.remove('dang-chon'); y.classList.remove('dang-chon');
        if (dung) {
          x.classList.add('xong'); y.classList.add('xong');
          x.disabled = true; y.disabled = true;
          doc(a.hanzi);
          ketQua.ghep.tong++;
          if (!saiCap.has(a.khoa)) ketQua.ghep.dung++;
          if (--conLai === 0) hienPhanHoi(saiCap.size === 0, saiCap.size ? '<span class="chu-phu nho">Đã ghép xong (có cặp phải chọn lại).</span>' : '');
        } else {
          saiCap.add(a.khoa);
          saiTu[a.khoa] = (saiTu[a.khoa] || 0) + 1;
          x.classList.add('sai'); y.classList.add('sai');
          setTimeout(() => { x.classList.remove('sai'); y.classList.remove('sai'); }, 600);
        }
      };
      $the.querySelectorAll('[data-k]').forEach((o) => {
        o.onclick = () => { chonK?.classList.remove('dang-chon'); chonK = o; o.classList.add('dang-chon'); doc(theoKhoa[o.dataset.k].hanzi); thu(); };
      });
      $the.querySelectorAll('[data-n]').forEach((o) => {
        o.onclick = () => { chonN?.classList.remove('dang-chon'); chonN = o; o.classList.add('dang-chon'); thu(); };
      });
    }

    // ----- 🧩 Sắp xếp mảnh thành câu -----
    function veSapXep(m) {
      const thuTu = tron(m.manh.map((_, i) => i));
      const daChon = [];
      $the.innerHTML = `
        <div class="cau-the-tu">
          ${nhanKy(m, m.laiLan ? '<span class="nhan nhan-vang">↺ Làm lại</span>' : '')}
          <p class="cau-hoi">Sắp xếp thành câu có nghĩa:</p>
          <p class="nghia-hoi">${esc(m.cau.dich)}</p>
          <div class="dong-sap-xep" id="dong"></div>
          <div class="kho-manh" id="kho"></div>
        </div>`;
      $vung.innerHTML = '<button class="nut nut-chinh nut-rong" id="nut-kiem-tra" disabled>Kiểm tra</button>';
      const ve = () => {
        $the.querySelector('#dong').innerHTML = daChon.length
          ? daChon.map((i, k) => `<button class="manh da-chon han" data-k="${k}">${esc(m.manh[i])}</button>`).join('')
          : '<span class="chu-phu nho">Chạm vào các mảnh bên dưới theo đúng thứ tự</span>';
        $the.querySelector('#kho').innerHTML = thuTu.map((i) => `<button class="manh han" data-i="${i}" ${daChon.includes(i) ? 'disabled' : ''}>${esc(m.manh[i])}</button>`).join('');
        $vung.querySelector('#nut-kiem-tra').disabled = daChon.length !== m.manh.length;
        $the.querySelectorAll('#kho [data-i]').forEach((x) => { x.onclick = () => { if (!daXongMuc) { daChon.push(Number(x.dataset.i)); doc(m.manh[Number(x.dataset.i)]); ve(); } }; });
        $the.querySelectorAll('#dong [data-k]').forEach((x) => { x.onclick = () => { if (!daXongMuc) { daChon.splice(Number(x.dataset.k), 1); ve(); } }; });
      };
      ve();
      $vung.querySelector('#nut-kiem-tra').onclick = () => {
        if (daXongMuc || daChon.length !== m.manh.length) return;
        const dung = daChon.map((i) => m.manh[i]).join('') === m.manh.join('');
        ketQua.ghep.tong++;
        if (dung) ketQua.ghep.dung++;
        else if (!m.laiLan) hang.push({ ...m, laiLan: true });
        $the.querySelector('#dong').classList.add(dung ? 'la-dung' : 'la-sai');
        $vung.innerHTML = '';
        hienPhanHoi(dung, `
          <p class="han" style="margin:6px 0 0;font-size:1.3rem">${htmlCauCham(m.cau.han)} ${nutLoa(m.cau.han, true)}</p>
          <p class="pinyin" style="margin:0">${toMauPinyin(m.cau.pinyin)}</p>`);
        doc(m.cau.han);
      };
      m.nutTiep = '#nut-kiem-tra';
    }

    // ----- 📖 Đọc câu → chọn nghĩa -----
    function veDoc(m) {
      const luaChon = tron(m.luaChon);
      $the.innerHTML = `
        <div class="cau-the-tu">
          ${nhanKy(m, m.laiLan ? '<span class="nhan nhan-vang">↺ Đọc lại</span>' : '')}
          <p class="cau-hoi">Đọc câu rồi chọn nghĩa đúng</p>
          <p class="han cau-vi-du" id="cau-doc">${htmlCauCham(m.cau.han, { chiChuaHoc: true })}</p>
          <p class="pinyin cau-pinyin" id="py" ${m.coPinyin ? '' : 'hidden'}>${toMauPinyin(m.cau.pinyin)}</p>
          <div class="hang-nut" style="justify-content:center">
            ${m.coPinyin ? '' : '<button class="nut nut-nho" id="nut-py">Hiện pinyin</button>'}
            ${nutLoa(m.cau.han, true)}
          </div>
        </div>`;
      $vung.innerHTML = `<div class="luoi-lua-chon mot-cot">${luaChon.map((l, i) => `
          <button class="nut-lua-chon" data-i="${i}"><span>${esc(l.hien)}</span><kbd>${i + 1}</kbd></button>`).join('')}</div>
        <p class="phim-tat">Phím tắt: 1–${luaChon.length} chọn đáp án</p>`;
      const $py = $the.querySelector('#nut-py');
      if ($py) $py.onclick = () => { $the.querySelector('#py').hidden = false; $py.remove(); };
      $vung.querySelectorAll('[data-i]').forEach((nut) => {
        nut.onclick = () => {
          if (daXongMuc) return;
          const dung = luaChon[Number(nut.dataset.i)].dung;
          $vung.querySelectorAll('[data-i]').forEach((x) => {
            x.classList.toggle('dung', luaChon[Number(x.dataset.i)].dung);
            x.classList.toggle('sai', x === nut && !dung);
            x.disabled = true;
          });
          ketQua.doc.tong++;
          if (dung) ketQua.doc.dung++;
          else if (!m.laiLan) hang.push({ ...m, laiLan: true });
          $the.querySelector('#py').hidden = false;
          $the.querySelector('#cau-doc').innerHTML = htmlCauCham(m.cau.han);
          hienPhanHoi(dung);
          doc(m.cau.han);
        };
      });
    }

    // ----- Tổng kết: app tự chấm, xếp lịch ôn -----
    function veKetThuc() {
      dungDongHo();
      document.body.classList.remove('dang-hoc');
      const tdN = layTienDo();
      const nk = nhatKyHomNay();
      const bayGio = Date.now();
      let soMoi = 0;
      for (const w of W) {
        const m = saiTu[w.khoa] || 0;
        const cu = tdN.the[w.khoa];
        if (!cu) {
          soMoi++;
          nk.moi = (nk.moi || 0) + 1;
          let t = tinhLichMoi(undefined, m >= 3 ? DANH_GIA.QUEN : DANH_GIA.NHO, bayGio);
          if (m === 0) t = tinhLichMoi(t, DANH_GIA.NHO, bayGio);
          tdN.the[w.khoa] = t;
        } else if (m > 0 && cu.trangThai === 'on' && cu.han > bayGio) {
          cu.han = bayGio;   // học lại chặng mà còn sai → ôn từ này ngay
        }
      }
      tdN.chang = tdN.chang || {};
      const ds = new Set(tdN.chang[b.ma] || []);
      ds.add(so);
      tdN.chang[b.ma] = [...ds].sort((x, y) => x - y);
      const tongDung = Object.values(ketQua).reduce((s, k) => s + k.dung, 0);
      const tong = Object.values(ketQua).reduce((s, k) => s + k.tong, 0);
      ghiLuot('chang', tongDung, tong - tongDung);   // ghiLuot đã lưu
      luu();

      const ti = tong ? tongDung / tong : 1;
      const sau = trangThaiCacChang(b).find((c) => !c.xong);
      const canOn = W.filter((w) => saiTu[w.khoa]);
      khung.innerHTML = `
        <div class="ket-thuc">
          <div class="emoji emoji-to">${ti >= 0.8 ? '🏆' : ti >= 0.5 ? '🎉' : '💪'}</div>
          <h2>Xong chặng ${so + 1}!</h2>
          <p class="chu-phu">${nhanBai(b)} · ${esc(b.ten)}</p>
          <div class="bang-ky">${CAC_KY.filter((k) => ketQua[k.ma].tong).map((k) => `
            <div class="o-ket-qua"><span class="emoji">${k.emoji}</span><b>${ketQua[k.ma].dung}/${ketQua[k.ma].tong}</b><span>${k.ten}</span></div>`).join('')}
          </div>
          <p class="chu-phu nho">${soMoi ? `${soMoi} từ mới đã vào lịch ôn. ` : ''}${canOn.length
            ? `Từ còn sai sẽ gặp lại sớm ở Ôn luyện: <span class="han">${canOn.map((w) => esc(w.hanzi)).join('、')}</span>`
            : 'Không sai từ nào – lần ôn tới sau 1 ngày.'}</p>
          ${sau ? `<a class="nut nut-chinh nut-rong" href="#/chang/${b.ma}/${sau.so}">Chặng ${sau.so + 1} ▶</a>`
            : `<a class="nut nut-chinh nut-rong" href="#/bai/${b.ma}">🎉 Đã xong từ vựng của bài – sang ngữ pháp ▶</a>`}
          <a class="nut nut-rong" href="#/bai/${b.ma}">← Về bài</a>
          <a class="nut nut-rong" href="#/">🏠 Về trang Hôm nay</a>
        </div>`;
    }

    xuLyPhim = (e) => {
      if (!muc || e.target.closest?.('input, select, textarea')) return;
      const dangONut = e.target.closest?.('button, a');
      if (e.key === 'Enter' && !dangONut) {
        const nut = khung.querySelector('#nut-tiep') || (m0() && khung.querySelector(muc.nutTiep));
        if (nut && !nut.disabled) { e.preventDefault(); nut.click(); }
        return;
      }
      if (e.key === ' ' && !dangONut && muc.nghe && !daXongMuc) { e.preventDefault(); muc.nghe(false); return; }
      if (!daXongMuc && /^[1-4]$/.test(e.key)) $vung.querySelectorAll('[data-i]')[Number(e.key) - 1]?.click();
    };
    const m0 = () => !!muc?.nutTiep;
    document.addEventListener('keydown', xuLyPhim);

    tiepTheo();
  }

  return () => {
    daRoi = true;
    dungDongHo();
    if (huyHienTai) huyHienTai();
    if (xuLyPhim) document.removeEventListener('keydown', xuLyPhim);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    document.body.classList.remove('dang-hoc');
  };
}
