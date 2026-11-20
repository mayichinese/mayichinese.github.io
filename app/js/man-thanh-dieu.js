// =========================================================
// LUYỆN THANH ĐIỆU (Giai đoạn 2)
//   #/thanh-dieu             trang chọn dạng bài + bảng thanh điệu + thống kê hay nhầm
//   #/thanh-dieu/<dạng>      một phiên 10 câu
// Các dạng bài (câu hỏi tạo tự động từ data/hsk1.json – không có danh sách từ trong code):
//   mot       nghe 1 âm tiết → chọn thanh 1–4 (bỏ chữ đa âm, xem data/thanh-dieu-hsk1.json)
//   hai       nghe từ 2 âm tiết → chọn thanh từng âm tiết (có thanh nhẹ)
//   hai-ba    cặp dễ nhầm: thanh 2 hay thanh 3?
//   bat-nhat  biến điệu của 不 và 一 (câu lấy từ câu ví dụ, chỉ dùng câu khớp quy tắc)
//   ba-ba     hai thanh 3 liền nhau: âm tiết đầu đổi thành thanh 2 hay giữ thanh 3?
// Câu trả lời sai được hỏi lại một lần ở cuối phiên.
// =========================================================

import { caiDat, layTienDo, luu, nhatKyHomNay, ghiLuot } from './luu-tru.js';
import { tatCaTu, nghiaNgan } from './du-lieu.js';
import { doc } from './phat-am.js';
import { esc, batDongHo, nutLoa } from './giao-dien.js';
import { tachPinyin, toMauPinyin, toMauChuHan, demChuHan } from './pinyin.js';
import { bieuTuong } from './bieu-tuong.js';
import { amCham } from './am-thanh.js';

const SO_CAU = 10;
const HAN = /\p{Script=Han}/u;
const TEN_THANH = { 1: 'thanh 1', 2: 'thanh 2', 3: 'thanh 3', 4: 'thanh 4', 0: 'thanh nhẹ' };
const DAU_MAU = { 1: 'ā', 2: 'á', 3: 'ǎ', 4: 'à', 0: 'a' };
const CHU_BAT = '不';
const CHU_NHAT = '一';

// ---------- Mô tả các dạng bài + quy tắc (hiện trong khung "Quy tắc") ----------
export const CAC_DANG = {
  mot: {
    emoji: '👂', ten: 'Nghe 1 âm tiết', moTa: 'Nghe một chữ, chọn thanh 1 – 2 – 3 – 4.',
    quyTac: `<b>Thanh 1</b> (ā): cao và đều, kéo ngang. <b>Thanh 2</b> (á): đi lên, gần giống thanh sắc.
      <b>Thanh 3</b> (ǎ): xuống thấp rồi mới lên, giọng trầm – gần giống thanh hỏi.
      <b>Thanh 4</b> (à): rơi mạnh từ cao xuống, dứt khoát. <b>Thanh nhẹ</b>: ngắn, nhẹ, không dấu.`,
  },
  'hai-ba': {
    emoji: '⚖️', ten: 'Thanh 2 hay thanh 3?', moTa: 'Cặp người Việt hay nhầm nhất.',
    quyTac: `<b>Thanh 2</b> đi lên ngay từ đầu, liền một mạch (như khi hỏi lại "Hả?").
      <b>Thanh 3</b> bắt đầu bằng một đoạn <b>trầm xuống</b> (giọng thấp, hơi khàn) rồi mới lên.
      Mẹo: chú ý nửa đầu âm tiết – đi lên ngay là thanh 2, chìm xuống trước là thanh 3.`,
  },
  hai: {
    emoji: '🎵', ten: 'Từ 2 âm tiết', moTa: 'Nghe cả từ, chọn thanh cho từng âm tiết (có thanh nhẹ).',
    quyTac: `Nghe cả từ rồi chọn thanh cho <b>âm 1</b> và <b>âm 2</b>. Thanh nhẹ thường ở âm tiết sau,
      đọc ngắn và nhẹ (như chữ thứ hai của từ chỉ người thân trong gia đình).
      Từ có 不/一 được ghi theo cách đọc đã biến điệu.`,
  },
  'bat-nhat': {
    emoji: '🔀', ten: 'Biến điệu 不 và 一', moTa: 'Chọn cách đọc đúng của 不 (bù/bú) và 一 (yī/yí/yì).',
    quyTac: `<b>${CHU_BAT}</b> vốn là <b>bù</b> (thanh 4). Đứng trước một chữ <b>thanh 4</b> → đọc <b>bú</b> (thanh 2).<br>
      <b>${CHU_NHAT}</b> vốn là <b>yī</b> (thanh 1) – giữ nguyên khi đếm số, số thứ tự, đứng cuối hoặc đứng một mình.
      Đứng trước <b>thanh 4</b> → <b>yí</b>; đứng trước <b>thanh 1, 2, 3</b> → <b>yì</b>.<br>
      Pinyin trong app ghi theo cách đọc đã biến điệu.`,
  },
  'ba-ba': {
    emoji: '🔁', ten: 'Hai thanh 3 liền nhau', moTa: 'Âm tiết thanh 3 đầu: đổi thành thanh 2 hay giữ?',
    quyTac: `Hai âm tiết <b>thanh 3</b> đứng liền nhau: âm thứ nhất <b>đọc thành thanh 2</b>
      (viết nǐ hǎo nhưng đọc ní hǎo). <b>Khi viết pinyin vẫn ghi dấu thanh 3.</b><br>
      Thanh 3 đứng trước thanh <b>khác</b> (1, 2, 4, nhẹ): <b>giữ thanh 3</b> nhưng chỉ đọc nửa đầu – xuống thấp, không lên lại.`,
  },
};

// ---------- Dữ liệu ----------
let henDaAm = null;
/** Tập chữ đa âm (không dùng trong bài nghe 1 âm tiết) */
function taiDaAm() {
  if (!henDaAm) {
    henDaAm = fetch('data/thanh-dieu-hsk1.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`mã lỗi ${r.status}`))))
      .then((j) => new Set(j.daAm || []))
      .catch((e) => { henDaAm = null; throw new Error(`Không đọc được data/thanh-dieu-hsk1.json (${e.message}).`); });
  }
  return henDaAm;
}

/** Các âm tiết (có thanh) của một chuỗi pinyin */
const amTietCua = (pinyin, soChu) => tachPinyin(pinyin, soChu).filter((p) => p.thanh !== undefined);

/** Vị trí (trong chuỗi) của từng chữ Hán: [{ c, viTri }] */
function cacChuHan(chuoi) {
  const ds = [];
  [...chuoi].forEach((c, viTri) => { if (HAN.test(c)) ds.push({ c, viTri }); });
  return ds;
}

/** Ngân hàng câu hỏi cho mọi dạng bài */
function taoNganHang(daAm) {
  const td = layTienDo();
  const nh = { mot: [], 'hai-ba': [], hai: [], 'bat-nhat': [], 'ba-ba': [] };
  const daCoBatNhat = new Set();
  const daCoBaBa = new Set();

  for (const t of tatCaTu()) {
    const daHoc = !!td.the[t.khoa];
    const chu = cacChuHan(t.hanzi);
    const am = amTietCua(t.pinyin, chu.length);
    if (am.length === chu.length) {
      if (chu.length === 1 && am[0].thanh > 0 && !daAm.has(t.hanzi)) {
        nh.mot.push({ tu: t, doc: t.hanzi, dapAn: [am[0].thanh], daHoc });
        if (am[0].thanh === 2 || am[0].thanh === 3) nh['hai-ba'].push({ tu: t, doc: t.hanzi, dapAn: [am[0].thanh], daHoc });
      }
      if (chu.length === 2) {
        const baBa = am[0].thanh === 3 && am[1].thanh === 3;
        if (!baBa) nh.hai.push({ tu: t, doc: t.hanzi, dapAn: am.map((a) => a.thanh), daHoc });
        if (am[0].thanh === 3) {
          daCoBaBa.add(t.hanzi);
          nh['ba-ba'].push({ han: t.hanzi, pinyin: t.pinyin, dich: nghiaNgan(t), viTri: [chu[0].viTri, chu[1].viTri],
            am: [am[0], am[1]], doi: baBa, doc: t.hanzi, daHoc });
        }
      }
      themBatNhat(nh, daCoBatNhat, chu, am, { han: t.hanzi, pinyin: t.pinyin, dich: nghiaNgan(t), daHoc });
    }
    for (const v of t.viDu || []) {
      const chuV = cacChuHan(v.han);
      const amV = amTietCua(v.pinyin);
      if (amV.length !== chuV.length) continue; // không tách khớp được → bỏ qua (tránh chấm sai)
      const nguCanh = { han: v.han, pinyin: v.pinyin, dich: v.dich, daHoc };
      themBatNhat(nh, daCoBatNhat, chuV, amV, nguCanh);
      // Hai thanh 3 liền nhau trong câu (hai chữ sát nhau, không có dấu câu ở giữa)
      for (let i = 0; i + 1 < chuV.length; i++) {
        if (amV[i].thanh !== 3 || amV[i + 1].thanh !== 3 || chuV[i + 1].viTri !== chuV[i].viTri + 1) continue;
        const cap = chuV[i].c + chuV[i + 1].c;
        if (daCoBaBa.has(cap)) continue;
        daCoBaBa.add(cap);
        nh['ba-ba'].push({ ...nguCanh, viTri: [chuV[i].viTri, chuV[i + 1].viTri], am: [amV[i], amV[i + 1]], doi: true, doc: cap });
      }
    }
  }
  return nh;
}

/** Thêm câu hỏi biến điệu 不/一 nếu pinyin trong dữ liệu khớp quy tắc */
function themBatNhat(nh, daCo, chu, am, nguCanh) {
  chu.forEach(({ c, viTri }, i) => {
    if ((c !== CHU_BAT && c !== CHU_NHAT) || i + 1 >= chu.length) return;
    if (chu[i + 1].viTri !== viTri + 1) return;             // chữ sau phải đứng sát
    const sau = am[i + 1].thanh;
    if (![1, 2, 3, 4].includes(sau)) return;
    const thucTe = am[i].chu.toLowerCase();
    const dung = c === CHU_BAT ? (sau === 4 ? 'bú' : 'bù') : (sau === 4 ? 'yí' : 'yì');
    if (thucTe !== dung) return;                             // dữ liệu khác quy tắc (vd. số thứ tự) → bỏ
    const khoa = nguCanh.han + '|' + viTri;
    if (daCo.has(khoa)) return;
    daCo.add(khoa);
    nh['bat-nhat'].push({ ...nguCanh, chu: c, viTri, viTriSau: chu[i + 1].viTri, chiSoAm: i, amSau: am[i + 1], dapAn: dung, doc: nguCanh.han });
  });
}

// ---------- Chọn câu cho một phiên ----------
function tron(mang) {
  const m = mang.slice();
  for (let i = m.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [m[i], m[j]] = [m[j], m[i]];
  }
  return m;
}
/** Ưu tiên câu thuộc từ đã học, rồi đến các câu khác */
const uuTienDaHoc = (ds) => [...tron(ds.filter((c) => c.daHoc)), ...tron(ds.filter((c) => !c.daHoc))];

/** Lấy lần lượt từ các nhóm (để các thanh/các loại xuất hiện đều nhau) */
function layXenKe(cacNhom, soLuong) {
  const kq = [];
  const ds = cacNhom.map((n) => n.slice()).filter((n) => n.length);
  while (kq.length < soLuong && ds.some((n) => n.length)) {
    for (const n of ds) if (n.length && kq.length < soLuong) kq.push(n.shift());
  }
  return kq;
}

function chonCau(nh, dang) {
  const ds = nh[dang];
  if (dang === 'mot' || dang === 'hai-ba') {
    const theoThanh = [1, 2, 3, 4].map((t) => uuTienDaHoc(ds.filter((c) => c.dapAn[0] === t)));
    return tron(layXenKe(theoThanh, SO_CAU));
  }
  if (dang === 'ba-ba') {
    return tron(layXenKe([uuTienDaHoc(ds.filter((c) => c.doi)), uuTienDaHoc(ds.filter((c) => !c.doi))], SO_CAU));
  }
  if (dang === 'bat-nhat') {
    return tron(layXenKe([uuTienDaHoc(ds.filter((c) => c.chu === CHU_BAT)), uuTienDaHoc(ds.filter((c) => c.chu === CHU_NHAT))], SO_CAU));
  }
  return uuTienDaHoc(ds).slice(0, SO_CAU);
}

// ---------- Ghi kết quả ----------
function ghiKetQua(dung, cacCapNham = []) {
  const td = layTienDo();
  td.thanhDieu[dung ? 'dung' : 'sai']++;
  for (const [nghe, chon] of cacCapNham) {
    const k = `${nghe}>${chon}`;
    td.thanhDieu.nham[k] = (td.thanhDieu.nham[k] || 0) + 1;
  }
  const nk = nhatKyHomNay();
  nk.thanh = (nk.thanh || 0) + 1;
  luu();
}

// ---------- Mảnh giao diện ----------
const nutThanh = (t, phim) => `
  <button class="nut-thanh t${t}" data-thanh="${t}">
    <b>${t || 'nhẹ'}</b><span class="pinyin">${DAU_MAU[t]}</span>${phim ? `<kbd>${phim}</kbd>` : ''}
  </button>`;

/** Câu có tô đậm các vị trí `viTri` */
function toDam(chuoi, cacViTri) {
  return [...chuoi].map((c, i) => (cacViTri.includes(i) ? `<mark>${esc(c)}</mark>` : esc(c))).join('');
}

/** Pinyin tô màu, che âm tiết thứ `chiSo` bằng ô trống */
function pinyinChe(pinyin, chiSo) {
  let dem = -1;
  return tachPinyin(pinyin).map((p) => {
    if (p.thanh === undefined) return esc(p.chu);
    dem++;
    return dem === chiSo ? '<span class="o-trong">＿＿</span>' : `<span class="t${p.thanh}">${esc(p.chu)}</span>`;
  }).join('');
}

// =========================================================
// TRANG CHỌN DẠNG BÀI
// =========================================================
export async function veThanhDieu(khung) {
  khung.innerHTML = '<div class="dang-tai">Đang chuẩn bị câu hỏi…</div>';
  let nh;
  try {
    nh = taoNganHang(await taiDaAm());
  } catch (e) {
    khung.innerHTML = `<div class="loi">${esc(e.message)}</div>`;
    return;
  }
  if (!khung.isConnected) return;
  const td = layTienDo();
  const tk = td.thanhDieu;
  const nk = nhatKyHomNay();

  // Âm mẫu cho từng thanh (chữ đầu tiên của mỗi thanh trong bài nghe 1 âm tiết)
  const mau = [1, 2, 3, 4].map((t) => uuTienDaHoc(nh.mot.filter((c) => c.dapAn[0] === t))[0]);
  const bangThanh = [1, 2, 3, 4].map((t, i) => `
    <div class="o-thanh t${t}">
      <span class="pinyin dau-thanh">${DAU_MAU[t]}</span>
      <b>Thanh ${t}</b>
      ${mau[i] ? `<button class="nut nut-nho nut-mau" data-doc="${esc(mau[i].doc)}">${bieuTuong('loa')}
        <span class="han">${esc(mau[i].doc)}</span></button>` : ''}
    </div>`).join('');

  const hayNham = Object.entries(tk.nham).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([k, n]) => { const [nghe, chon] = k.split('>'); return `<li>Nghe <b class="t${nghe}">${TEN_THANH[nghe]}</b> nhưng chọn <b class="t${chon}">${TEN_THANH[chon]}</b>: ${n} lần</li>`; }).join('');

  khung.innerHTML = `
    <section class="khung">
      <div class="dong-tren"><b>Bảng thanh điệu</b><span class="chu-phu nho">chạm để nghe mẫu</span></div>
      <div class="bang-thanh">${bangThanh}</div>
      <p class="chu-phu nho" style="margin:10px 0 0">${CAC_DANG.mot.quyTac}</p>
      <p class="chu-phu nho" style="margin:8px 0 0">🎨 Khắp app, pinyin được tô màu theo thanh như bảng trên (thanh nhẹ màu <span class="t0">xám</span>) để nhìn là biết đọc thanh mấy. Tắt màu trong Cài đặt.</p>
    </section>

    <h3 class="tieu-de-muc">Chọn dạng bài <small>${Math.floor((nk.giay.nghe || 0) / 60)} phút hôm nay</small></h3>
    <div class="ke-hoach">
      ${Object.entries(CAC_DANG).map(([ma, d]) => `
        <a class="dong-ke-hoach khung phan-nghe" href="#/thanh-dieu/${ma}">
          <span class="o-emoji emoji">${d.emoji}</span>
          <span class="giua">
            <span class="dong-tren"><b>${d.ten}</b><span class="so-phut">${Math.min(SO_CAU, nh[ma].length)} câu</span></span>
            <span class="mo-ta">${d.moTa}</span>
          </span>
          <span class="cuoi-dong">${bieuTuong('phai')}</span>
        </a>`).join('')}
    </div>

    <h3 class="tieu-de-muc">Kết quả của bạn</h3>
    <div class="khung">
      ${tk.dung + tk.sai
        ? `<p style="margin-top:0">Đã trả lời <b>${tk.dung + tk.sai}</b> câu · đúng <b>${Math.round((tk.dung / (tk.dung + tk.sai)) * 100)}%</b></p>
           ${hayNham ? `<p class="chu-phu nho" style="margin-bottom:4px">Hay nhầm nhất:</p><ul class="ds-nham">${hayNham}</ul>` : '<p class="chu-phu">Chưa nhầm thanh nào 👏</p>'}`
        : '<p class="chu-phu" style="margin:0">Chưa có kết quả. Hãy bắt đầu với "Nghe 1 âm tiết".</p>'}
    </div>`;
}

// =========================================================
// PHIÊN LUYỆN
// =========================================================
export function vePhienThanh(khung, dang) {
  let daRoi = false;
  let dungDongHo = () => {};
  let xuLyPhim = null;
  const d = CAC_DANG[dang];
  if (!d) { khung.innerHTML = '<p class="loi">Không có dạng bài này.</p>'; return () => {}; }
  khung.innerHTML = '<div class="dang-tai">Đang chuẩn bị câu hỏi…</div>';

  taiDaAm().then((daAm) => {
    if (daRoi) return;
    const hangDoi = chonCau(taoNganHang(daAm), dang);
    if (!hangDoi.length) {
      khung.innerHTML = '<div class="chua-lam"><h2>Chưa có câu hỏi</h2><a class="nut" href="#/thanh-dieu">Quay lại</a></div>';
      return;
    }
    document.body.classList.add('dang-hoc');
    dungDongHo = batDongHo('nghe');
    const tong = hangDoi.length;
    const ketQua = { dung: 0, sai: 0, nham: {} };
    const daHoiLai = new Set();
    let daLam = 0;
    let cau = null;
    let daTraLoi = false;
    let chon = [];     // dạng "hai": thanh đã chọn cho âm 1, âm 2

    khung.innerHTML = `
      <div class="phien">
        <div class="tien-do-phien">
          <div class="thanh-tien-do"><span style="width:0%"></span></div>
          <span class="dem"></span>
        </div>
        <details class="khung quy-tac"><summary>📖 Quy tắc: ${esc(d.ten)}</summary><p>${d.quyTac}</p></details>
        <div class="khung the-thanh" id="the"></div>
        <div class="vung-tra-loi" id="vung-nut"></div>
      </div>`;
    const $ = (s) => khung.querySelector(s);

    const nghe = (cham = false) => { if (cau) doc(cau.doc, cham ? 0.55 : undefined); };

    function capNhatTienDo() {
      // tổng = câu đã làm + câu còn chờ + câu đang hỏi (nếu chưa trả lời); câu sai được thêm vào cuối
      const tongCau = Math.max(tong, daLam + hangDoi.length + (daTraLoi ? 0 : 1));
      $('.tien-do-phien .thanh-tien-do > span').style.width = `${(daLam / tongCau) * 100}%`;
      $('.tien-do-phien .dem').textContent = `Câu ${daTraLoi ? daLam : daLam + 1}/${tongCau} · đúng ${ketQua.dung}`;
    }

    // ----- Vẽ một câu -----
    function cauTiepTheo() {
      if (daRoi) return;
      cau = hangDoi.shift();
      if (!cau) return veKetThuc();
      daTraLoi = false;
      chon = [];
      capNhatTienDo();
      const hoiLai = daHoiLai.has(cau) ? '<span class="nhan nhan-vang">↺ Hỏi lại</span>' : '';
      const nutNghe = `
        <div class="hang-nghe">
          <button class="nut-loa nut-nghe-lon" id="nut-nghe" aria-label="Nghe">${bieuTuong('loa')}</button>
          <button class="nut nut-nho" id="nut-cham">🐢 Chậm</button>
        </div>`;

      if (dang === 'mot' || dang === 'hai-ba') {
        const cacThanh = dang === 'mot' ? [1, 2, 3, 4] : [2, 3];
        $('#the').innerHTML = `
          <div class="goc-the"><span class="nhan">${d.emoji} ${esc(d.ten)}</span>${hoiLai}</div>
          <p class="cau-hoi">Nghe và chọn thanh điệu</p>
          ${nutNghe}
          <div id="dap-an" class="dap-an"></div>`;
        $('#vung-nut').innerHTML = `<div class="hang-thanh so-${cacThanh.length}">${cacThanh.map((t, i) => nutThanh(t, i + 1)).join('')}</div>
          <p class="phim-tat">Phím tắt: ${cacThanh.map((t, i) => `${i + 1} = thanh ${t}`).join(' · ')} · Space = nghe lại</p>`;
        $('#vung-nut').querySelectorAll('[data-thanh]').forEach((b) => { b.onclick = () => traLoiThanh([Number(b.dataset.thanh)]); });
        setTimeout(() => nghe(), 250);
      } else if (dang === 'hai') {
        $('#the').innerHTML = `
          <div class="goc-the"><span class="nhan">${d.emoji} ${esc(d.ten)}</span>${hoiLai}</div>
          <p class="cau-hoi">Nghe cả từ, chọn thanh của âm 1 rồi âm 2</p>
          ${nutNghe}
          <div id="dap-an" class="dap-an"></div>`;
        $('#vung-nut').innerHTML = [0, 1].map((a) => `
          <div class="dong-chon-am" data-am="${a}">
            <span class="ten-am">Âm ${a + 1}</span>
            <div class="hang-thanh so-5">${[1, 2, 3, 4, 0].map((t) => nutThanh(t)).join('')}</div>
          </div>`).join('') + '<p class="phim-tat">Phím tắt: 1–4 = thanh 1–4, 5 = thanh nhẹ (chọn âm 1 rồi âm 2) · Space = nghe lại</p>';
        $('#vung-nut').querySelectorAll('.dong-chon-am').forEach((dong) => {
          dong.querySelectorAll('[data-thanh]').forEach((b) => { b.onclick = () => chonAm(Number(dong.dataset.am), Number(b.dataset.thanh)); });
        });
        setTimeout(() => nghe(), 250);
      } else if (dang === 'bat-nhat') {
        const luaChon = cau.chu === CHU_BAT ? ['bù', 'bú'] : ['yī', 'yí', 'yì'];
        $('#the').innerHTML = `
          <div class="goc-the"><span class="nhan">${d.emoji} ${esc(d.ten)}</span>${hoiLai}</div>
          <p class="cau-hoi">Chữ <b class="han">${esc(cau.chu)}</b> trong câu này đọc thế nào?</p>
          <p class="han cau-vi-du">${toDam(cau.han, [cau.viTri])}</p>
          <p class="pinyin cau-pinyin">${pinyinChe(cau.pinyin, cau.chiSoAm)}</p>
          <p class="chu-phu nho">${esc(cau.dich)}</p>
          <div id="dap-an" class="dap-an"></div>`;
        $('#vung-nut').innerHTML = `<div class="hang-thanh so-${luaChon.length}">${luaChon.map((l, i) => `
          <button class="nut-thanh nut-chu" data-chon="${l}"><b class="pinyin">${l}</b><kbd>${i + 1}</kbd></button>`).join('')}</div>
          <p class="phim-tat">Phím tắt: ${luaChon.map((l, i) => `${i + 1} = ${l}`).join(' · ')}</p>`;
        $('#vung-nut').querySelectorAll('[data-chon]').forEach((b) => { b.onclick = () => traLoiBatNhat(b.dataset.chon); });
      } else if (dang === 'ba-ba') {
        const [a1, a2] = cau.am;
        $('#the').innerHTML = `
          <div class="goc-the"><span class="nhan">${d.emoji} ${esc(d.ten)}</span>${hoiLai}</div>
          <p class="cau-hoi">Khi đọc liền, âm tiết <b class="t3 pinyin">${esc(a1.chu)}</b> đứng trước
            <b class="t${a2.thanh} pinyin">${esc(a2.chu)}</b> (${TEN_THANH[a2.thanh]}) sẽ…</p>
          <p class="han cau-vi-du">${toDam(cau.han, cau.viTri)}</p>
          <p class="pinyin cau-pinyin">${toMauPinyin(cau.pinyin, demChuHan(cau.han))}</p>
          <p class="chu-phu nho">${esc(cau.dich)}</p>
          <div id="dap-an" class="dap-an"></div>`;
        $('#vung-nut').innerHTML = `<div class="hang-thanh so-2">
            <button class="nut-thanh nut-chu" data-chon="doi"><b>Đổi thành thanh 2</b><kbd>1</kbd></button>
            <button class="nut-thanh nut-chu" data-chon="giu"><b>Giữ thanh 3</b><kbd>2</kbd></button>
          </div>
          <p class="phim-tat">Phím tắt: 1 = đổi thành thanh 2 · 2 = giữ thanh 3</p>`;
        $('#vung-nut').querySelectorAll('[data-chon]').forEach((b) => { b.onclick = () => traLoiBaBa(b.dataset.chon === 'doi'); });
      }
      const $nghe = $('#nut-nghe');
      if ($nghe) { $nghe.onclick = () => nghe(); $('#nut-cham').onclick = () => nghe(true); }
    }

    // ----- Trả lời từng dạng -----
    function chonAm(am, thanh) {
      if (daTraLoi) return;
      chon[am] = thanh;
      const dong = $(`.dong-chon-am[data-am="${am}"]`);
      dong.querySelectorAll('[data-thanh]').forEach((b) => b.classList.toggle('dang-chon', Number(b.dataset.thanh) === thanh));
      if (chon[0] !== undefined && chon[1] !== undefined) traLoiThanh(chon);
    }

    function traLoiThanh(daChon) {
      if (daTraLoi) return;
      const dapAn = cau.dapAn;
      const dung = dapAn.every((t, i) => t === daChon[i]);
      const nham = dapAn.map((t, i) => [t, daChon[i]]).filter(([t, c]) => t !== c);
      // tô màu nút: đúng xanh, chọn sai đỏ
      if (dang === 'hai') {
        [0, 1].forEach((a) => $(`.dong-chon-am[data-am="${a}"]`).querySelectorAll('[data-thanh]').forEach((b) => {
          const t = Number(b.dataset.thanh);
          b.classList.toggle('dung', t === dapAn[a]);
          b.classList.toggle('sai', t === daChon[a] && t !== dapAn[a]);
        }));
      } else {
        $('#vung-nut').querySelectorAll('[data-thanh]').forEach((b) => {
          const t = Number(b.dataset.thanh);
          b.classList.toggle('dung', t === dapAn[0]);
          b.classList.toggle('sai', t === daChon[0] && t !== dapAn[0]);
        });
      }
      const loiGiai = dung
        ? `✅ Đúng! ${dapAn.map((t) => TEN_THANH[t]).join(' + ')}`
        : `❌ Đáp án: <b>${dapAn.map((t) => `<span class="t${t}">${TEN_THANH[t]}</span>`).join(' + ')}</b>`
          + (dang === 'hai-ba' ? `<br><span class="chu-phu nho">${dapAn[0] === 2 ? 'Thanh 2 đi lên ngay từ đầu.' : 'Thanh 3 trầm xuống trước rồi mới lên.'}</span>` : '');
      xongCau(dung, nham, `${loiGiai}${htmlTu(cau.tu)}`);
    }

    function traLoiBatNhat(daChon) {
      if (daTraLoi) return;
      const dung = daChon === cau.dapAn;
      $('#vung-nut').querySelectorAll('[data-chon]').forEach((b) => {
        b.classList.toggle('dung', b.dataset.chon === cau.dapAn);
        b.classList.toggle('sai', b.dataset.chon === daChon && !dung);
      });
      const chuSau = esc(cau.han[cau.viTriSau]);
      const lyDo = cau.amSau.thanh === 4
        ? `Chữ sau <b class="han">${chuSau}</b> (<span class="t4">${esc(cau.amSau.chu)}</span>) là thanh 4 → ${esc(cau.chu)} đọc <b>${cau.dapAn}</b> (thanh 2).`
        : `Chữ sau <b class="han">${chuSau}</b> (<span class="t${cau.amSau.thanh}">${esc(cau.amSau.chu)}</span>) là ${TEN_THANH[cau.amSau.thanh]}, không phải thanh 4 → ${esc(cau.chu)} đọc <b>${cau.dapAn}</b>.`;
      $('.cau-pinyin').innerHTML = toMauPinyin(cau.pinyin);
      xongCau(dung, [], `${dung ? '✅ Đúng!' : `❌ Đáp án: <b class="pinyin">${cau.dapAn}</b>`}<br>${lyDo}`);
      nghe();
    }

    function traLoiBaBa(chonDoi) {
      if (daTraLoi) return;
      const dung = chonDoi === cau.doi;
      $('#vung-nut').querySelectorAll('[data-chon]').forEach((b) => {
        const laDoi = b.dataset.chon === 'doi';
        b.classList.toggle('dung', laDoi === cau.doi);
        b.classList.toggle('sai', laDoi === chonDoi && !dung);
      });
      const [a1, a2] = cau.am;
      const lyDo = cau.doi
        ? `<b class="t3">${esc(a1.chu)}</b> + <b class="t3">${esc(a2.chu)}</b>: hai thanh 3 liền nhau → âm đầu đọc thành <b class="t2">thanh 2</b> (vẫn viết dấu thanh 3).`
        : `<b class="t3">${esc(a1.chu)}</b> đứng trước ${TEN_THANH[a2.thanh]} → <b class="t3">giữ thanh 3</b>, chỉ đọc nửa đầu (xuống thấp).`;
      xongCau(dung, [], `${dung ? '✅ Đúng!' : '❌ Chưa đúng.'}<br>${lyDo}`);
      nghe();
    }

    /** Phần hiện thêm sau khi trả lời: chữ Hán, pinyin tô màu, nghĩa */
    function htmlTu(tu) {
      if (!tu) return '';
      return `<div class="tu-sau-tra-loi">
        <span class="han tu-lon">${toMauChuHan(tu.hanzi, tu.pinyin)}</span>
        <span class="giua"><span class="pinyin">${toMauPinyin(tu.pinyin, demChuHan(tu.hanzi))}</span>
        <span class="chu-phu nho">${esc(nghiaNgan(tu))}</span></span>${nutLoa(tu.hanzi, true)}</div>`;
    }

    function xongCau(dung, nham, html) {
      amCham(dung);
      daTraLoi = true;
      daLam++;
      ketQua[dung ? 'dung' : 'sai']++;
      nham.forEach(([t, c]) => { const k = `${t}>${c}`; ketQua.nham[k] = (ketQua.nham[k] || 0) + 1; });
      ghiKetQua(dung, nham);
      if (!dung && !daHoiLai.has(cau)) { daHoiLai.add(cau); hangDoi.push(cau); } // hỏi lại cuối phiên
      $('#dap-an').innerHTML = html;
      $('#dap-an').classList.add(dung ? 'la-dung' : 'la-sai');
      $('#vung-nut').insertAdjacentHTML('beforeend',
        `<button class="nut nut-chinh nut-rong" id="nut-tiep" style="margin-top:10px">${hangDoi.length ? 'Câu tiếp ▶' : 'Xem kết quả ▶'}</button>`);
      $('#nut-tiep').onclick = cauTiepTheo;
      $('#vung-nut .phim-tat')?.remove();
      capNhatTienDo();
      $('#nut-tiep').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    function veKetThuc() {
      dungDongHo();
      document.body.classList.remove('dang-hoc');
      const ti = ketQua.dung + ketQua.sai ? ketQua.dung / (ketQua.dung + ketQua.sai) : 0;
      ghiLuot('thanh', ketQua.dung, ketQua.sai);   // cho nhiệm vụ hằng ngày
      const nham = Object.entries(ketQua.nham).sort((a, b) => b[1] - a[1])
        .map(([k, n]) => { const [t, c] = k.split('>'); return `<li>Nghe <b class="t${t}">${TEN_THANH[t]}</b> → chọn <b class="t${c}">${TEN_THANH[c]}</b>: ${n} lần</li>`; }).join('');
      khung.innerHTML = `
        <div class="ket-thuc">
          <div class="emoji emoji-to">${ti >= 0.8 ? '🏆' : ti >= 0.5 ? '🎉' : '💪'}</div>
          <h2>${ti >= 0.8 ? 'Tai rất thính!' : ti >= 0.5 ? 'Làm tốt lắm!' : 'Luyện thêm nhé!'}</h2>
          <p class="chu-phu">${ketQua.dung} đúng · ${ketQua.sai} sai (câu sai đã được hỏi lại)</p>
          ${nham ? `<div class="khung" style="width:100%;text-align:left"><b>Lần này hay nhầm:</b><ul class="ds-nham">${nham}</ul></div>` : ''}
          <a class="nut nut-chinh nut-rong" href="#/thanh-dieu/${dang}" id="nut-lai">↺ Luyện thêm 10 câu</a>
          <a class="nut nut-rong" href="#/thanh-dieu">🎧 Chọn dạng bài khác</a>
          <a class="nut nut-rong" href="#/">🏠 Về trang Hôm nay</a>
        </div>`;
      // cùng địa chỉ thì trình duyệt không vẽ lại → tự vẽ lại phiên mới
      khung.querySelector('#nut-lai').onclick = (e) => { e.preventDefault(); window.dispatchEvent(new HashChangeEvent('hashchange')); };
    }

    // ----- Phím tắt -----
    xuLyPhim = (e) => {
      if (!cau || e.target.closest?.('input, select, textarea')) return;
      const dangONut = e.target.closest?.('button, a, summary');
      if (e.key === ' ' && !dangONut) { e.preventDefault(); nghe(); return; }
      if (e.key === 'Enter' && daTraLoi && !dangONut) { e.preventDefault(); cauTiepTheo(); return; }
      if (daTraLoi || !/^[1-5]$/.test(e.key)) return;
      const so = Number(e.key);
      if (dang === 'hai') {
        const thanh = so === 5 ? 0 : so;
        chonAm(chon[0] === undefined ? 0 : 1, thanh);
      } else {
        const nut = $('#vung-nut').querySelectorAll('[data-thanh], [data-chon]')[so - 1];
        nut?.click();
      }
    };
    document.addEventListener('keydown', xuLyPhim);

    cauTiepTheo();
  }).catch((e) => {
    if (!daRoi) khung.innerHTML = `<div class="loi">${esc(e.message)}</div>`;
  });

  return () => {
    daRoi = true;
    dungDongHo();
    if (xuLyPhim) document.removeEventListener('keydown', xuLyPhim);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    document.body.classList.remove('dang-hoc');
  };
}
