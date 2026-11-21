// =========================================================
// PHẦN & CỬA – học như em bé, từng từ một: NGHE → NÓI THEO → VIẾT → NHỚ, rồi GHÉP CÂU, ĐỌC
// Cấu trúc: HSK → CHẶNG (= 1 bài giáo trình, trang #/bai/<mã>) → PHẦN (~5 từ) → CỬA (chỉ hiện biểu tượng)
//   #/cua/<mã chặng>/<số phần>/<số cửa>    (đếm từ 0) · #/chang/<mã>/<phần> → chuyển tới cửa chưa xong của phần
// Một phần n từ có n + 2 cửa:
//   ⭐ Cửa TỪ (mỗi từ một cửa): giới thiệu (nghe trước) → nghe chọn nghĩa → nghe chọn chữ → nói theo (máy chấm)
//      → tô từng chữ → nghĩa → chữ (+ pinyin). Câu trắc nghiệm SAI được hỏi lại tới khi ĐÚNG (tối đa 3 lần) –
//      nhớ xong từ này mới sang từ sau. Xong cửa: từ (nếu mới) vào lịch SM-2 theo số lần sai
//      (0 → ôn sau 1 ngày · 1–2 → 10 phút · ≥ 3 → 1 phút).
//   🧩 Cửa GHÉP: ghép cặp chữ ↔ nghĩa cả phần, ôn nghe / nghĩa → chữ từng từ, sắp xếp mảnh thành câu.
//   📖 Cửa ĐỌC: đọc câu ví dụ → chọn nghĩa.
// Tiến độ: tienDo.cua['<mã>/<phần>'] = [số cửa đã xong]; xong cửa cuối → tienDo.chang[mã] thêm số phần (như cũ).
// Tương thích tiến độ cũ: phần đã ghi trong tienDo.chang (hoặc chưa có tienDo.cua mà đã học hết từ) = xong hết cửa;
// cửa từ của từ đã học trước đây coi là xong. Nói, viết, sắp xếp câu chỉ tính điểm cửa, không làm sai lịch ôn.
// =========================================================

import { layTienDo, luu, nhatKyHomNay, ghiLuot, caiDat, ngayHoc } from './luu-tru.js';
import { tinhLichMoi, DANH_GIA } from './lich-on.js';
import { tatCaTu, timBaiTheoMa, nhanBai, nghiaNgan, tiengDoc } from './du-lieu.js';
import { doc, tinhTrangPhatAm } from './phat-am.js';
import { demHomNay } from './phien-hoc.js';
import { esc, batDongHo, htmlMatSau, nutLoa } from './giao-dien.js';
import { toMauPinyin, toMauChuHan, demChuHan, bienTheThanh } from './pinyin.js';
import { tron, taiDaAm, taoCau, htmlDeBai, htmlLuaChon } from './cau-hoi-tu.js';
import { taiNetChu, taoBangVe, phatHoatCanh, saiToiDa } from './net-chu.js';
import { ganKhungNoi, htmlNhacBienDieu } from './man-luyen-noi.js';
import { coNhanDang, coGhiAm } from './nhan-giong.js';
import { DIEM_DAT } from './cham-phat-am.js';
import { htmlCauCham, tachTu } from './cham-tu.js';
import { amCham, amDung, amSai, amXong } from './am-thanh.js';
import { changMo } from './lo-trinh.js';
import { htmlPhaoHoa } from './man-kiem-tra.js';

const CO_PHAN = 5;             // số từ mỗi phần (chia đều: 13 từ → 5 + 4 + 4)
const HOI_LAI_TOI_DA = 3;      // một câu sai được hỏi lại tối đa 3 lần trong cửa
// Đúng dưới tỉ lệ này (tính cả câu hỏi lại, không tính phần Nói) thì CHƯA qua cửa → làm lại (đánh giá tester 2026-11-21)
export const TI_LE_QUA_CUA = 0.6;
let boNoiDen = 0;              // "Tạm bỏ phần nói": bỏ câu nói ở mọi cửa tới thời điểm này (30 phút)

export const CAC_KY = [
  { ma: 'nghe', emoji: '👂', ten: 'Nghe' },
  { ma: 'noi', emoji: '🗣️', ten: 'Nói' },
  { ma: 'viet', emoji: '✍️', ten: 'Viết' },
  { ma: 'nho', emoji: '🧠', ten: 'Nhớ' },
  { ma: 'ghep', emoji: '🧩', ten: 'Ghép' },
  { ma: 'doc', emoji: '📖', ten: 'Đọc' },
];
const KY = Object.fromEntries(CAC_KY.map((k) => [k.ma, k]));
/** Biểu tượng cửa (không tên): cửa từ ⭐, ghép 🧩, đọc 📖 */
export const BIEU_TUONG_CUA = { tu: '⭐', ghep: '🧩', doc: '📖' };

// ---------- Chia phần + trạng thái ----------
/** Chia từ của chặng (bài) thành các phần ~5 từ, giữ thứ tự: [{ so, tu }] */
export function chiaChang(b) {
  const n = b.tu.length;
  const k = Math.max(1, Math.ceil(n / CO_PHAN));
  const ds = [];
  let dau = 0;
  for (let c = 0; c < k; c++) {
    const so = Math.floor(n / k) + (c < n % k ? 1 : 0);
    ds.push({ so: c, tu: b.tu.slice(dau, dau + so) });
    dau += so;
  }
  return ds;
}

/** Danh sách cửa của một phần: mỗi từ một cửa, rồi cửa ghép, cửa đọc */
export const cacCua = (phan) => [
  ...phan.tu.map((w, i) => ({ so: i, loai: 'tu', tu: w })),
  { so: phan.tu.length, loai: 'ghep' },
  { so: phan.tu.length + 1, loai: 'doc' },
];

const khoaCua = (maBai, soPhan) => `${maBai}/${soPhan}`;

/** Các cửa của phần kèm trạng thái xong / mo (mở: đã xong, hoặc là cửa đầu tiên chưa xong) */
export function trangThaiCua(b, phan) {
  const td = layTienDo();
  const ghi = td.cua?.[khoaCua(b.ma, phan.so)];
  const xongPhan = (td.chang?.[b.ma] || []).includes(phan.so)
    || (!ghi && phan.tu.length > 0 && phan.tu.every((t) => td.the[t.khoa]));   // tiến độ cũ
  const daXong = new Set(ghi || []);
  const ds = cacCua(phan).map((c) => ({
    ...c, xong: xongPhan || daXong.has(c.so) || (c.loai === 'tu' && !ghi && !!td.the[c.tu.khoa]),
  }));
  let daMo = false;
  ds.forEach((c) => { c.mo = c.xong || !daMo; if (!c.xong) daMo = true; });
  return ds;
}

/** Các phần kèm trạng thái: xong (mọi cửa xong), mo (phần đầu hoặc phần trước đã xong) */
export function trangThaiCacChang(b) {
  const ds = chiaChang(b).map((c) => {
    const cua = trangThaiCua(b, c);
    return { ...c, cua, xong: c.tu.length > 0 && cua.every((x) => x.xong) };
  });
  ds.forEach((c, i) => { c.mo = c.xong || i === 0 || ds[i - 1].xong; });
  return ds;
}
/** Phần đầu tiên chưa xong của chặng (null nếu xong hết) */
export const changTiepTheo = (b) => trangThaiCacChang(b).find((c) => !c.xong) || null;
/** Cửa tiếp theo của chặng: { phan, cua } (null nếu xong hết) */
export function cuaTiepTheo(b) {
  const p = changTiepTheo(b);
  if (!p || !p.mo) return null;
  const c = p.cua.find((x) => !x.xong);
  return c ? { phan: p.so, cua: c.so } : null;
}

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

  // Đọc: 2 câu (ưu tiên câu khác câu sắp xếp, khác từ). Đáp án nhiễu là nghĩa của câu GẦN chủ đề
  // (đánh giá tester: nhiễu lệch chủ đề thì không cần đọc cũng loại được) – ưu tiên: câu khác của cùng từ →
  // câu của các từ cùng phần → câu của các từ cùng chặng → câu khác cùng cấp.
  // Không lấy câu có thể cũng đúng (kiểm tra lại của tester: 您好 ↔ "Em chào thầy/cô ạ!"): bỏ câu chứa chính từ khóa,
  // câu của từ gần nghĩa với từ khóa (你好 ↔ 您好) và câu thuộc từ mà câu đúng có chứa.
  const phanNghia = (t) => new Set(String(nghiaNgan(t)).toLowerCase().replace(/\([^)]*\)/g, '').split(/[,;/]/)
    .map((x) => x.trim()).filter((x) => x.length >= 3));
  const ganNghia = (a, b) => { const na = phanNghia(a); return [...phanNghia(b)].some((x) => na.has(x)); };
  const cauCua = (ds, x) => ds.filter((t) => t.khoa !== x.w.khoa && !ganNghia(t, x.w) && !x.v.han.includes(t.hanzi))
    .flatMap((t) => (t.viDu || []).filter((v) => !v.han.includes(x.w.hanzi)).map((v) => v.dich));
  const tuCungChang = tatCaTu().filter((t) => t.maBai === W[0].maBai);
  const nhieuTheoTang = (x) => {
    const tang = [cauCua(W, x), cauCua(tuCungChang, x), cauCua([...tuBiet, ...tatCaTu().filter((t) => t.cap === W[0].cap)], x)];
    const kq = [];
    for (const ds of tang) {
      for (const d of tron([...new Set(ds)])) {
        if (kq.length === 2) return kq;
        if (d !== x.v.dich && !kq.includes(d)) kq.push(d);
      }
    }
    return kq;
  };
  const doc2 = [];
  const daDung = new Set([sapXep?.cau.han]);
  const tuDaDung = new Set();
  for (const x of deDoc) {
    if (doc2.length === 2) break;
    if (daDung.has(x.v.han) || (tuDaDung.has(x.w.khoa) && deDoc.length > 3)) continue;
    const nhieu = nhieuTheoTang(x);
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
// MỘT CỬA
// =========================================================
/**
 * @param maBai mã chặng ('s3', '2-5'…) · @param so số phần (từ 0) · @param soCua số cửa (từ 0)
 * @returns {Function} hàm dọn dẹp
 */
export function veChang(khung, maBai, so, soCua = 0) {
  const b = timBaiTheoMa(maBai);
  const dsChang = b ? trangThaiCacChang(b) : [];
  const chang = dsChang[so];
  const cua = chang ? chang.cua[soCua] : null;
  if (!b || !chang || !chang.tu.length || !cua) {
    khung.innerHTML = '<p class="loi">Không tìm thấy cửa này.</p><a class="nut nut-rong" href="#/bai">← Về lộ trình</a>';
    return () => {};
  }
  if (!changMo(b)) {
    khung.innerHTML = `<div class="chua-lam"><div class="emoji emoji-to">🔒</div><h2>${esc(nhanBai(b))} chưa mở</h2>
      <p class="chu-phu">Qua kiểm tra chặng trước để mở, hoặc làm kiểm tra nhảy chặng.</p>
      <a class="nut nut-chinh" href="#/bai/${b.ma}">Xem cách mở</a><a class="nut" href="#/bai">← Lộ trình</a></div>`;
    return () => {};
  }
  if (!chang.mo || !cua.mo) {
    khung.innerHTML = `<div class="chua-lam"><div class="emoji emoji-to">🔒</div><h2>Cửa này chưa mở</h2>
      <p class="chu-phu">Hãy vượt qua các cửa trước.</p><a class="nut nut-chinh" href="#/bai/${b.ma}">← Về chặng</a></div>`;
    return () => {};
  }

  let daRoi = false;
  let dungDongHo = () => {};
  let xuLyPhim = null;
  let huyHienTai = null;           // dọn dẹp mục đang hiện (micro, bảng viết…)

  // Cửa từ của một từ MỚI mà hôm nay đã đủ số từ mới → hỏi trước khi học thêm
  const W = chang.tu;
  const laTuMoi = cua.loai === 'tu' && !layTienDo().the[cua.tu.khoa];
  const { conTuMoi } = demHomNay();
  if (laTuMoi && conTuMoi < 1) {
    khung.innerHTML = `
      <div class="chua-lam">
        <div class="emoji emoji-to">🌙</div>
        <h2>Hôm nay đã đủ từ mới</h2>
        <p class="chu-phu">Mục tiêu là ${caiDat().soTuMoiMoiNgay} từ mới mỗi ngày. Học thêm vẫn được,
          nhưng ngày mai sẽ có nhiều thẻ cần ôn hơn.</p>
        <button class="nut nut-chinh nut-rong" id="nut-van-hoc">Vẫn học từ này</button>
        <a class="nut nut-rong" href="#/on">🔁 Ôn từ đến hạn</a>
        <a class="nut nut-rong" href="#/bai/${b.ma}">← Về chặng</a>
      </div>`;
    khung.querySelector('#nut-van-hoc').onclick = () => batDau();
  } else {
    batDau();
  }

  function batDau() {
    khung.innerHTML = '<div class="dang-tai">Đang mở cửa…</div>';
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

    // --- Hàng đợi bài tập của cửa ---
    const hang = [];
    if (cua.loai === 'tu') {
      const w = cua.tu;
      hang.push({ ky: 'nghe', loai: 'gioi-thieu', tu: w });
      hang.push({ ky: 'nghe', loai: 'hoi', tu: w, dang: ngheDuoc(w) ? 'nghe-nghia' : 'nghia' });
      // Không nghe được: câu 2 hỏi pinyin (nếu được) để không trùng câu "nghĩa → chữ" của bước Nhớ
      hang.push({ ky: 'nghe', loai: 'hoi', tu: w, dang: ngheDuoc(w) ? 'nghe' : pinyinDuoc(w) ? 'pinyin' : 'chu' });
      if ((coNhanDang() || coGhiAm()) && Date.now() > boNoiDen) hang.push({ ky: 'noi', loai: 'noi', tu: w });
      for (const c of [...new Set(chuHan(w.hanzi))].filter((x) => net[x]).slice(0, 3)) {
        hang.push({ ky: 'viet', loai: 'viet', chu: c, tu: w });
      }
      hang.push({ ky: 'nho', loai: 'hoi', tu: w, dang: 'chu' });
      if (pinyinDuoc(w) && ngheDuoc(w)) hang.push({ ky: 'nho', loai: 'hoi', tu: w, dang: 'pinyin' });
    } else if (cua.loai === 'ghep') {
      if (W.length >= 3) hang.push({ ky: 'ghep', loai: 'ghep-cap', ds: W });
      tron(W).forEach((w, i) => {
        const dang = i % 3 === 1 && ngheDuoc(w) ? 'nghe' : i % 3 === 2 && pinyinDuoc(w) ? 'pinyin' : 'chu';
        hang.push({ ky: 'ghep', loai: 'hoi', tu: w, dang });
      });
      const { sapXep } = chonCau(W, td);
      if (sapXep) hang.push({ ky: 'ghep', loai: 'sap-xep', ...sapXep });
    } else {
      for (const d of chonCau(W, td).doc) hang.push({ ky: 'doc', loai: 'doc', ...d });
      // thiếu câu dùng được → ôn nghĩa từng từ cho đủ bài
      if (hang.length < 2) for (const w of W) hang.push({ ky: 'doc', loai: 'hoi', tu: w, dang: 'nghia' });
    }
    /** Câu sai → hỏi lại cuối cửa (cửa từ: tới khi đúng, tối đa HOI_LAI_TOI_DA lần; cửa khác: một lần) */
    const hoiLai = (m) => {
      const lan = (m.lanLai || 0) + 1;
      if (lan <= (cua.loai === 'tu' ? HOI_LAI_TOI_DA : 1)) hang.push({ ...m, laiLan: true, lanLai: lan, nghe: undefined, nutTiep: undefined });
    };

    const coKy = new Set(hang.map((m) => m.ky));
    const ketQua = Object.fromEntries(CAC_KY.map((k) => [k.ma, { dung: 0, tong: 0 }]));
    const saiTu = {};                 // khóa từ → số lần sai (chỉ câu trắc nghiệm + ghép cặp)
    const boQuaViet = new Set();      // chữ bấm "Bỏ qua" ở bước tô chữ → đưa lên đầu hàng Luyện viết
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
        <div class="buoc-ky" style="grid-template-columns:repeat(${coKy.size}, 1fr)" ${coKy.size < 2 ? 'hidden' : ''}>${CAC_KY.filter((k) => coKy.has(k.ma)).map((k) => `
          <span class="o-ky" data-ky="${k.ma}"><span class="emoji">${k.emoji}</span><small>${k.ten}</small></span>`).join('')}</div>
        <div class="the-tu the-chang"></div>
        <div class="vung-tra-loi"></div>
      </div>`;
    const $the = khung.querySelector('.the-chang');
    const $vung = khung.querySelector('.vung-tra-loi');

    function capNhatTienDo() {
      const tong = daLam + hang.length + (muc ? 1 : 0);
      khung.querySelector('.tien-do-phien .thanh-tien-do > span').style.width = `${tong ? (daLam / tong) * 100 : 0}%`;
      khung.querySelector('.tien-do-phien .dem').textContent = muc?.laiLan ? '↺ Sửa câu sai' : `Phần ${so + 1}/${dsChang.length}`;
      const thuTu = CAC_KY.map((k) => k.ma).filter((k) => coKy.has(k));
      // câu hỏi lại cuối cửa (laiLan) → coi như đã qua đủ các bước
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
          <span class="chu-phu nho">${esc(nghiaNgan(w))}</span></span>${nutLoa(tiengDoc(w), true)}
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
      if (dung !== null) $vung.querySelector('.phan-hoi').scrollIntoView({ block: 'center', behavior: 'smooth' });
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
      $the.innerHTML = `${nhanKy(m, '<span class="nhan nhan-vang">✨ Từ mới</span>')}${htmlNhacBienDieu(m.tu.hanzi, m.tu.pinyin)}${htmlMatSau(m.tu)}`;
      $vung.innerHTML = '';
      hienPhanHoi(null, '<span class="chu-phu nho">Nghe vài lần, đọc theo khẽ, nhìn câu ví dụ – lát nữa app sẽ hỏi lại.</span>', 'Đã hiểu – tiếp ▶');
      doc(tiengDoc(m.tu));
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
      const nghe = (cham) => doc(tiengDoc(m.tu), cham ? 0.55 : undefined);
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
          amCham(dung);
          ketQua[m.ky].tong++;
          if (dung) ketQua[m.ky].dung++;
          else {
            saiTu[m.tu.khoa] = (saiTu[m.tu.khoa] || 0) + 1;
            hoiLai(m);
          }
          hienPhanHoi(dung, tuNho(m.tu));
          if (!cau.dang.startsWith('nghe')) doc(tiengDoc(m.tu));
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
          ${htmlNhacBienDieu(w.hanzi, w.pinyin)}
          ${nutLoa(tiengDoc(w))}
        </div>`;
      $vung.innerHTML = `
        <div id="vung-noi"></div>
        <div class="hang-nut" style="margin-top:10px">
          <button class="nut" id="nut-khong-noi">🔇 Tạm bỏ nói 30′</button>
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
        boNoiDen = Date.now() + 30 * 60 * 1000;
        for (let i = hang.length - 1; i >= 0; i--) if (hang[i].loai === 'noi') hang.splice(i, 1);
        tiepTheo();
      };
      m.nutTiep = '#nut-tiep-noi';
      setTimeout(() => { if (muc === m) doc(tiengDoc(w)); }, 250);
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
      $vung.querySelector('#nut-bo-viet').onclick = () => { boQuaViet.add(m.chu); tiepTheo(); };
      let writer = null;
      let nguong = 3;   // số nét sai tối đa vẫn tính đúng, theo số nét của chữ (net-chu.js saiToiDa)
      taiNetChu().then((d) => { const n = d.net[m.chu]?.strokes.length; if (n) nguong = saiToiDa(n); }).catch(() => {});
      const batDauTo = () => writer.quiz({
        showHintAfterMisses: 2,
        onMistake: (d) => {
          const $ln = khung.querySelector('#loi-nhan');
          if ($ln) $ln.textContent = `Chưa đúng nét (sai ${d.totalMistakes} lần)${d.mistakesOnStroke >= 2 ? ' – nét đúng đang nhấp nháy gợi ý' : ''}.`;
        },
        onComplete: (kq) => {
          if (daRoi || muc !== m) return;
          ketQua.viet.tong++;
          if (kq.totalMistakes <= nguong) ketQua.viet.dung++;
          amCham(kq.totalMistakes <= nguong);
          const nk = nhatKyHomNay();
          nk.viet = (nk.viet || 0) + 1;
          $vung.innerHTML = '';
          hienPhanHoi(kq.totalMistakes <= nguong,
            `<span class="chu-phu nho">${kq.totalMistakes ? `Sai ${kq.totalMistakes} nét` : 'Không sai nét nào'} · luyện thêm ở Luyện tập → Viết chữ.</span>`);
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
          amDung();
          setTimeout(() => doc(a.hanzi), 250);
          ketQua.ghep.tong++;
          if (!saiCap.has(a.khoa)) ketQua.ghep.dung++;
          if (--conLai === 0) hienPhanHoi(saiCap.size === 0, saiCap.size ? '<span class="chu-phu nho">Đã ghép xong (có cặp phải chọn lại).</span>' : '');
        } else {
          amSai();
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
        amCham(dung);
        ketQua.ghep.tong++;
        if (dung) ketQua.ghep.dung++;
        else hoiLai(m);
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
          amCham(dung);
          ketQua.doc.tong++;
          if (dung) ketQua.doc.dung++;
          else hoiLai(m);
          $the.querySelector('#py').hidden = false;
          $the.querySelector('#cau-doc').innerHTML = htmlCauCham(m.cau.han);
          hienPhanHoi(dung);
          doc(m.cau.han);
        };
      });
    }

    // ----- Tổng kết cửa: app tự chấm, xếp lịch ôn, mở cửa tiếp -----
    function veKetThuc() {
      dungDongHo();
      document.body.classList.remove('dang-hoc');
      const tdN = layTienDo();
      const nk = nhatKyHomNay();
      const bayGio = Date.now();
      let soMoi = 0;
      for (const w of cua.loai === 'tu' ? [cua.tu] : W) {
        const m = saiTu[w.khoa] || 0;
        const cu = tdN.the[w.khoa];
        if (!cu) {
          soMoi++;
          nk.moi = (nk.moi || 0) + 1;
          let t = tinhLichMoi(undefined, m >= 3 ? DANH_GIA.QUEN : DANH_GIA.NHO, bayGio);
          if (m === 0) t = tinhLichMoi(t, DANH_GIA.NHO, bayGio);
          tdN.the[w.khoa] = t;
        } else if (m > 0 && cu.trangThai === 'on' && cu.han > bayGio) {
          cu.han = bayGio;   // làm lại cửa mà còn sai → ôn từ này ngay
        }
        if (m > 0) tdN.the[w.khoa].saiNgay = ngayHoc();   // sai trong ngày → khi ôn hôm nay không được chấm "Dễ"
      }
      // Tỉ lệ đúng (không tính Nói – micro/nơi ồn không nên làm trượt cửa)
      const tongDung = Object.values(ketQua).reduce((t, x) => t + x.dung, 0);
      const tong = Object.values(ketQua).reduce((t, x) => t + x.tong, 0);
      const chamDung = CAC_KY.filter((x) => x.ma !== 'noi').reduce((t, x) => t + ketQua[x.ma].dung, 0);
      const chamTong = CAC_KY.filter((x) => x.ma !== 'noi').reduce((t, x) => t + ketQua[x.ma].tong, 0);
      const ti = chamTong ? chamDung / chamTong : 1;
      const quaCua = ti >= TI_LE_QUA_CUA;
      // Ghi cửa đã xong (kèm các cửa đang được tính là xong theo tiến độ cũ, để không mất khi bắt đầu ghi).
      // Trượt cửa vẫn ghi mảng (có thể rỗng) để luật "tiến độ cũ" (từ đã học = cửa xong) không tự tính cửa này là xong.
      tdN.cua = tdN.cua || {};
      const k = khoaCua(b.ma, so);
      const daXong = new Set(tdN.cua[k] || []);
      chang.cua.forEach((c) => { if (c.xong) daXong.add(c.so); });
      if (quaCua) daXong.add(cua.so);
      tdN.cua[k] = [...daXong].sort((x, y) => x - y);
      const xongPhan = quaCua && chang.cua.every((c) => daXong.has(c.so));
      // Chữ bỏ qua bước viết → Luyện viết đưa lên trước
      if (boQuaViet.size) tdN.vietBoQua = [...new Set([...(tdN.vietBoQua || []), ...boQuaViet])];
      if (xongPhan) {
        tdN.chang = tdN.chang || {};
        tdN.chang[b.ma] = [...new Set([...(tdN.chang[b.ma] || []), so])].sort((x, y) => x - y);
        ghiLuot('chang', tongDung, tong - tongDung);
      }
      ghiLuot('cua', tongDung, tong - tongDung);   // ghiLuot đã lưu
      luu();
      setTimeout(quaCua ? amXong : amSai, 150);

      const tiep = cuaTiepTheo(b);
      const canOn = (cua.loai === 'tu' ? [cua.tu] : W).filter((w) => saiTu[w.khoa]);
      const tu = cua.loai === 'tu' ? cua.tu : null;
      khung.innerHTML = `
        <div class="ket-thuc">
          ${xongPhan ? htmlPhaoHoa() : ''}
          <div class="emoji emoji-to">${!quaCua ? '💪' : xongPhan ? '🏆' : ti >= 0.8 ? '🌟' : '👍'}</div>
          <h2>${!quaCua ? 'Chưa qua cửa' : xongPhan ? `Xong phần ${so + 1}!` : 'Qua cửa!'}</h2>
          ${quaCua ? '' : `<p class="chu-phu">Đúng ${Math.round(ti * 100)}% – cần từ ${Math.round(TI_LE_QUA_CUA * 100)}% để qua. Xem lại từ rồi làm lại cửa này nhé.</p>`}
          ${tu ? `<p class="han" style="font-size:2.2rem;margin:4px 0 0">${toMauChuHan(tu.hanzi, tu.pinyin)}</p>
            <p class="chu-phu">${toMauPinyin(tu.pinyin, demChuHan(tu.hanzi))} · ${esc(nghiaNgan(tu))}</p>`
            : `<p class="chu-phu">${nhanBai(b)} · ${esc(b.ten)}</p>`}
          <div class="bang-ky">${CAC_KY.filter((x) => ketQua[x.ma].tong).map((x) => `
            <div class="o-ket-qua"><span class="emoji">${x.emoji}</span><b>${ketQua[x.ma].dung}/${ketQua[x.ma].tong}</b><span>${x.ten}</span></div>`).join('')}
          </div>
          <p class="chu-phu nho">${soMoi ? (canOn.length ? 'Từ này còn sai vài lần – sẽ gặp lại sớm ở Luyện tập.' : 'Đã nhớ – lần ôn tới sau 1 ngày.')
            : canOn.length ? `Còn sai: <span class="han">${canOn.map((w) => esc(w.hanzi)).join('、')}</span> – sẽ gặp lại sớm ở Luyện tập.` : ''}</p>
          ${boQuaViet.size ? `<p class="chu-phu nho">✍️ Bỏ qua viết: <span class="han">${[...boQuaViet].map(esc).join(' ')}</span> – đã đưa lên đầu hàng Luyện viết.</p>` : ''}
          ${!quaCua ? `<button class="nut nut-chinh nut-rong" id="nut-lam-lai">↺ Làm lại cửa này</button>`
            : tiep ? `<a class="nut nut-chinh nut-rong" href="#/cua/${b.ma}/${tiep.phan}/${tiep.cua}" id="nut-cua-tiep">${tiep.phan === so ? 'Cửa tiếp theo ▶' : `Phần ${tiep.phan + 1} ▶`}</a>`
            : `<p class="chu-phu nho" style="margin:0">🎉 Xong từ vựng của ${esc(nhanBai(b))}! Làm kiểm tra (đạt 80%) để mở chặng sau.</p>
              <a class="nut nut-chinh nut-rong" href="#/kiem-tra/${b.ma}">🔑 Kiểm tra ${esc(nhanBai(b))} ▶</a>`}
          <a class="nut nut-rong" href="#/bai/${b.ma}">← Về chặng</a>
        </div>`;
      const $lai = khung.querySelector('#nut-lam-lai');
      if ($lai) $lai.onclick = () => window.dispatchEvent(new HashChangeEvent('hashchange'));
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
