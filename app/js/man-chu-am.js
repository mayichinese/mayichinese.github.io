// =========================================================
// CHỮ & ÂM (#/chu-am) – nền tảng trước khi học từ: tra cứu + luyện tập
//   #/chu-am/phien-am  Phiên âm: bảng thanh điệu, 23 âm đầu, 35 vần (chạm để nghe, mẹo phát âm so với tiếng Việt)
//   #/chu-am/net       Nét cơ bản (18 nét) + 7 quy tắc thứ tự nét (xem hoạt cảnh viết)
//   #/chu-am/bo-thu    45 bộ thủ hay gặp, kèm chữ ví dụ trong HSK 1–3 (bộ thủ được tô màu trong chữ)
//   #/chu-am/tu-loai   Từ loại & trật tự câu (man-tu-loai.js; trang một loại: #/chu-am/tu-loai/<mã>)
//   #/chu-am/luyen/phien-am  10 câu: nghe rồi chọn phiên âm đúng (đáp án nhiễu là âm dễ nhầm: zh/z, an/ang…)
//   #/chu-am/luyen/bo-thu    10 câu: bộ → nghĩa, nghĩa → bộ, chữ → bộ
// Dữ liệu: data/nen-tang.json (tạo bởi cong-cu/tao-nen-tang.py). Nét chữ: data/net-chu-*.json.
// Tiến độ: tienDo.nenTang.dung/sai theo khóa "d:zh" (âm đầu), "v:ang" (vần), "b:氵" (bộ thủ).
// =========================================================

import { layTienDo, luu, nhatKyHomNay, ghiLuot } from './luu-tru.js';
import { doc } from './phat-am.js';
import { esc, batDongHo, moHopThoai, nutLoa } from './giao-dien.js';
import { bieuTuong } from './bieu-tuong.js';
import { toMauPinyin } from './pinyin.js';
import { taiNetChu } from './net-chu.js';
import { htmlTongQuanTuLoai } from './man-tu-loai.js';

const SO_CAU = 10;
const DU_THAO = 5;   // trả lời đúng 5 lần → ô tô vàng "đã thạo"

let henDuLieu = null;
function taiDuLieu() {
  if (!henDuLieu) {
    henDuLieu = fetch('data/nen-tang.json')
      .then((r) => { if (!r.ok) throw new Error(`Không tìm thấy data/nen-tang.json (mã lỗi ${r.status}).`); return r.json(); })
      .catch((e) => { henDuLieu = null; throw e; });
  }
  return henDuLieu;
}

const soDung = (khoa) => layTienDo().nenTang.dung[khoa] || 0;
const phanTramThao = (khoa) => Math.min(100, Math.round((soDung(khoa) / DU_THAO) * 100));

/** Chữ Hán vẽ bằng SVG từ dữ liệu nét; các nét trong `toMau` được tô màu nhấn */
function svgChu(net, chu, toMau = [], lop = '') {
  const d = net[chu];
  if (!d) return `<span class="han svg-thay">${esc(chu)}</span>`;
  const to = new Set(toMau);
  return `<svg class="svg-chu ${lop}" viewBox="0 0 1024 1024" aria-label="${esc(chu)}" role="img">
    <g transform="translate(0, 900) scale(1, -1)">
      ${d.strokes.map((p, i) => `<path d="${p}" class="${to.has(i) ? 'net-to' : to.size ? 'net-mo' : 'net-thuong'}"/>`).join('')}
    </g></svg>`;
}

// =========================================================
// TRANG CHÍNH
// =========================================================
const CAC_PHAN = [
  { ma: 'phien-am', ten: '🔤 Phiên âm' },
  { ma: 'net', ten: '✏️ Nét cơ bản' },
  { ma: 'bo-thu', ten: '🧱 Bộ thủ' },
  { ma: 'tu-loai', ten: '🧩 Từ loại' },
];
let phanXem = 'phien-am';

export async function veChuAm(khung, phan) {
  if (CAC_PHAN.some((p) => p.ma === phan)) phanXem = phan;
  khung.innerHTML = '<div class="dang-tai">Đang tải…</div>';
  const tab = `<div class="nhom-chon chon-phan-chu-am">${CAC_PHAN.map((p) => `
    <a href="#/chu-am/${p.ma}" class="${p.ma === phanXem ? 'dang-chon' : ''}">${p.ten}</a>`).join('')}</div>`;
  if (phanXem === 'tu-loai') {
    let html;
    try { html = await htmlTongQuanTuLoai(); } catch (e) { html = `<div class="loi">${esc(e.message)}</div>`; }
    if (khung.isConnected) khung.innerHTML = tab + html;
    return;
  }
  let dl;
  let net = {};
  try {
    dl = await taiDuLieu();
    if (phanXem !== 'phien-am') net = (await taiNetChu()).net;
  } catch (e) { khung.innerHTML = `<div class="loi">${esc(e.message)}</div>`; return; }
  if (!khung.isConnected) return;

  if (phanXem === 'net') khung.innerHTML = tab + htmlNet(dl, net);
  else if (phanXem === 'bo-thu') khung.innerHTML = tab + htmlBoThu(dl, net);
  else khung.innerHTML = tab + htmlPhienAm(dl);

  // Chạm vào ô âm đầu / vần / bộ thủ → hộp thông tin
  khung.querySelectorAll('[data-am]').forEach((o) => {
    o.onclick = () => moAm(dl, o.dataset.am, o.dataset.loai);
  });
  khung.querySelectorAll('[data-bo]').forEach((o) => {
    o.onclick = () => moBoThu(dl, net, o.dataset.bo);
  });
  // Ô thanh điệu: nghe + hiện mẹo
  khung.querySelectorAll('[data-thanh]').forEach((o) => {
    o.onclick = () => {
      doc(o.dataset.h);
      const t = dl.phienAm.thanh.find((x) => String(x.t) === o.dataset.thanh);
      const $meo = khung.querySelector('#meo-thanh');
      if ($meo && t) $meo.innerHTML = `<b class="t${t.t}">${t.t ? `Thanh ${t.t}` : 'Thanh nhẹ'}:</b> ${esc(t.meo)}`;
      khung.querySelectorAll('[data-thanh]').forEach((x) => x.classList.toggle('dang-chon', x === o));
    };
  });
}

// ---------- Phiên âm ----------
function oAm(x, loai) {
  const khoa = `${loai}:${x.ma}`;
  const pt = phanTramThao(khoa);
  return `<button class="o-am ${pt >= 100 ? 'thao' : ''} ${x.vd.length ? '' : 'khong-vd'}" data-am="${esc(x.ma)}" data-loai="${loai}">
      <span class="pinyin">${esc(x.ma)}</span>
      <span class="thanh-tien-do"><span style="width:${pt}%"></span></span>
    </button>`;
}

function luoiTheoNhom(ds, loai) {
  const nhom = [];
  for (const x of ds) {
    if (!nhom.length || nhom[nhom.length - 1].ten !== x.nhom) nhom.push({ ten: x.nhom, ds: [] });
    nhom[nhom.length - 1].ds.push(x);
  }
  return nhom.map((n) => `
    <p class="ten-nhom-am">${esc(n.ten || '')}</p>
    <div class="luoi-am">${n.ds.map((x) => oAm(x, loai)).join('')}</div>`).join('');
}

function htmlPhienAm(dl) {
  const pa = dl.phienAm;
  return `
    <section class="khung gioi-thieu-chu-am">
      <b>Cùng học phiên âm tiếng Trung!</b>
      <span class="chu-phu nho">Mỗi âm tiết = âm đầu + vần + thanh điệu. Chạm vào ô để nghe và xem mẹo đọc.</span>
      <a class="nut nut-chinh nut-rong" href="#/chu-am/luyen/phien-am">🎧 Luyện nghe phiên âm (${SO_CAU} câu)</a>
      <a class="nut nut-rong" href="#/luyen-noi/doc-tu">🎤 Luyện đọc: máy chấm phát âm</a>
    </section>

    <h3 class="tieu-de-muc">Thanh điệu <small>chạm để nghe</small></h3>
    <div class="luoi-thanh-mau">
      ${pa.mauThanh.map((x) => `
        <button class="o-thanh-mau t${x.t}" data-thanh="${x.t}" data-h="${esc(x.h)}">
          <span class="pinyin">${esc(x.p)}</span><span class="nho">${x.t ? `thanh ${x.t}` : 'thanh nhẹ'}</span>
        </button>`).join('')}
    </div>
    <p class="chu-phu nho meo-thanh" id="meo-thanh">Mỗi âm tiết có 4 thanh và thanh nhẹ – cùng âm nhưng khác thanh là khác nghĩa.</p>

    <h3 class="tieu-de-muc">Âm đầu <small>${pa.amDau.length} âm</small></h3>
    ${luoiTheoNhom(pa.amDau, 'd')}

    <h3 class="tieu-de-muc">Vần <small>${pa.van.length} vần</small></h3>
    ${luoiTheoNhom(pa.van, 'v')}
    <p class="chu-phu nho" style="margin-top:16px">Thanh màu vàng = đã nghe đúng ${DU_THAO} lần trong bài luyện. Ví dụ nghe lấy từ chữ trong HSK 1–3;
      giọng đọc là giọng tiếng Trung có sẵn trong máy.</p>`;
}

function moAm(dl, ma, loai) {
  const ds = loai === 'd' ? dl.phienAm.amDau : dl.phienAm.van;
  const x = ds.find((a) => a.ma === ma);
  if (!x) return;
  if (x.vd[0]) doc(x.vd[0].h);
  moHopThoai(`
    <div class="dau-hop">
      <h2><span class="pinyin">${esc(x.ma)}</span> <small class="chu-phu">${loai === 'd' ? 'âm đầu' : 'vần'}${x.nhom ? ` · ${esc(x.nhom)}` : ''}</small></h2>
      <button class="nut-bieu-tuong" data-dong aria-label="Đóng">✕</button>
    </div>
    <p class="meo-doc">💡 ${esc(x.meo)}</p>
    ${x.vd.length ? `<p class="chu-phu nho" style="margin:12px 0 6px">Chạm để nghe ví dụ:</p>
      <div class="luoi-vd-am">${x.vd.map((v) => `
        <button class="o-vd-am" data-doc="${esc(v.h)}"><span class="han">${esc(v.h)}</span><span class="pinyin">${toMauPinyin(v.p)}</span></button>`).join('')}</div>`
      : '<p class="chu-phu nho">Âm này ít gặp đứng riêng trong HSK 1–3 nên chưa có ví dụ nghe.</p>'}
    <p class="chu-phu nho" style="margin-top:12px">Đã nghe đúng: <b>${soDung(`${loai}:${x.ma}`)}</b> lần</p>`);
}

// ---------- Nét cơ bản ----------
function htmlNet(dl, net) {
  return `
    <section class="khung gioi-thieu-chu-am">
      <b>Chữ Hán được ghép từ các nét</b>
      <span class="chu-phu nho">Nắm vững nét cơ bản và thứ tự nét giúp viết đúng, nhớ chữ nhanh và tra từ điển dễ hơn.
        Chạm vào một nét để xem cả chữ được viết thế nào.</span>
    </section>
    <h3 class="tieu-de-muc">${dl.net.length} nét cơ bản <small>nét màu đỏ trong chữ ví dụ</small></h3>
    <div class="luoi-net">
      ${dl.net.map((n) => `
        <button class="o-net khung" data-cach-viet="${esc(n.chu)}">
          ${svgChu(net, n.chu, [n.so - 1])}
          <span class="ten-net"><span class="han">${esc(n.ten)}</span> <span class="pinyin">${esc(n.py)}</span></span>
          <b>${esc(n.viet)}</b>
          <span class="chu-phu nho">${esc(n.cach)}</span>
        </button>`).join('')}
    </div>
    <h3 class="tieu-de-muc">Quy tắc thứ tự nét <small>chạm để xem viết</small></h3>
    <div class="ds-quy-tac">
      ${dl.quyTac.map((q, i) => `
        <button class="dong-quy-tac khung" data-cach-viet="${esc(q.chu)}">
          <span class="so-diem">${i + 1}</span>
          <span class="giua"><b>${esc(q.ten)}</b><span class="chu-phu nho">${esc(q.giai)}</span></span>
          ${svgChu(net, q.chu, [], 'nho')}
        </button>`).join('')}
    </div>
    <p class="chu-phu nho" style="margin-top:16px">Luyện viết từng chữ ở <a href="#/luyen-viet">Ôn luyện → Viết chữ Hán</a>.</p>`;
}

// ---------- Bộ thủ ----------
function htmlBoThu(dl) {
  return `
    <section class="khung gioi-thieu-chu-am">
      <b>Bộ thủ – "chìa khóa" của chữ Hán</b>
      <span class="chu-phu nho">Phần lớn chữ Hán có một bộ thủ gợi nghĩa: thấy 氵 là biết liên quan đến nước.
        Chạm vào bộ để xem các chữ HSK 1–3 có bộ đó.</span>
      <a class="nut nut-chinh nut-rong" href="#/chu-am/luyen/bo-thu">🧱 Luyện bộ thủ (${SO_CAU} câu)</a>
    </section>
    <h3 class="tieu-de-muc">${dl.boThu.length} bộ thủ hay gặp</h3>
    <div class="luoi-bo-thu">
      ${dl.boThu.map((b) => {
        const pt = phanTramThao(`b:${b.bo}`);
        return `
        <button class="o-bo-thu ${pt >= 100 ? 'thao' : ''}" data-bo="${esc(b.bo)}">
          <span class="han bo-lon">${esc(b.bo)}${b.bien.length ? `<small>${esc(b.bien.join(' '))}</small>` : ''}</span>
          <b>${esc(b.hv)}</b>
          <span class="chu-phu nho">${esc(b.nghia)}</span>
          <span class="thanh-tien-do"><span style="width:${pt}%"></span></span>
        </button>`;
      }).join('')}
    </div>`;
}

function moBoThu(dl, net, bo) {
  const b = dl.boThu.find((x) => x.bo === bo);
  if (!b) return;
  moHopThoai(`
    <div class="dau-hop">
      <h2><span class="han">${esc(b.bo)}</span>${b.bien.length ? ` <span class="han chu-phu">${esc(b.bien.join(' '))}</span>` : ''}
        <small class="chu-phu">Bộ ${esc(b.hv)} · <span class="pinyin">${esc(b.py)}</span></small></h2>
      <button class="nut-bieu-tuong" data-dong aria-label="Đóng">✕</button>
    </div>
    <p style="margin:0"><b>Nghĩa:</b> ${esc(b.nghia)}</p>
    <p class="meo-doc">💡 ${esc(b.goi)}</p>
    <p class="chu-phu nho" style="margin:12px 0 6px">${b.soChu} chữ trong HSK 1–3 có bộ này${b.vd.length < b.soChu ? ` (hiện ${b.vd.length})` : ''} · phần tô đỏ là bộ thủ:</p>
    <div class="luoi-vd-bo">
      ${b.vd.map((v) => `
        <div class="o-vd-bo">
          <button class="nut-chu-vd" data-cach-viet="${esc(v.c)}" title="Xem cách viết">${svgChu(net, v.c, net[v.c]?.radStrokes || [])}</button>
          <span class="giua"><button class="lien-ket-doc han" data-doc="${esc(v.tu)}">${esc(v.tu)}</button>
            <span class="pinyin nho">${toMauPinyin(v.py)}</span>
            <span class="chu-phu nho">${esc(v.nghia)}</span></span>
        </div>`).join('')}
    </div>`);
}

// =========================================================
// LƯỢT LUYỆN 10 CÂU
// =========================================================
const GAN_DAU = [['b', 'p'], ['d', 't'], ['g', 'k'], ['j', 'q', 'x'], ['zh', 'ch', 'sh', 'r'], ['z', 'c', 's'],
  ['zh', 'z', 'j'], ['ch', 'c', 'q'], ['sh', 's', 'x'], ['n', 'l'], ['f', 'h'], ['r', 'l']];
const GAN_VAN = [['an', 'ang'], ['en', 'eng'], ['in', 'ing'], ['ian', 'iang'], ['uan', 'uang'], ['u', 'ü'], ['ie', 'üe'],
  ['ou', 'uo'], ['ui', 'ei'], ['iu', 'ou'], ['ao', 'ou'], ['ong', 'iong'], ['e', 'o', 'uo'], ['un', 'ün'], ['uan', 'üan'], ['en', 'un']];
const gan = (bang, a, b) => bang.some((nhom) => nhom.includes(a) && nhom.includes(b));

function tron(mang) {
  const m = [...mang];
  for (let i = m.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [m[i], m[j]] = [m[j], m[i]];
  }
  return m;
}

/** Ba đáp án nhiễu: cùng thanh, khác âm đầu HOẶC khác vần – ưu tiên âm dễ nhầm */
function dapAnNhieu(dung, nganHang) {
  const cungThanh = nganHang.filter((x) => x.t === dung.t && x.p !== dung.p);
  const nhom1 = cungThanh.filter((x) => (x.v === dung.v && gan(GAN_DAU, x.d, dung.d)) || (x.d === dung.d && gan(GAN_VAN, x.v, dung.v)));
  const nhom2 = cungThanh.filter((x) => x.v === dung.v || x.d === dung.d);
  const chon = [];
  for (const ds of [tron(nhom1), tron(nhom2), tron(cungThanh)]) {
    for (const x of ds) {
      if (chon.length < 3 && !chon.some((c) => c.p === x.p)) chon.push(x);
    }
  }
  return chon;
}

function taoCauPhienAm(dl) {
  const nh = dl.phienAm.nganHang;
  const nt = layTienDo().nenTang;
  // Ưu tiên âm còn yếu: ít lần đúng, nhiều lần sai (có chút ngẫu nhiên)
  const diem = (x) => (nt.dung[`d:${x.d}`] || 0) + (nt.dung[`v:${x.v}`] || 0) - 2 * ((nt.sai[`d:${x.d}`] || 0) + (nt.sai[`v:${x.v}`] || 0));
  const chon = nh.map((x) => [diem(x) + Math.random() * 6, x]).sort((a, b) => a[0] - b[0]).slice(0, SO_CAU * 3).map((x) => x[1]);
  return tron(chon).slice(0, SO_CAU).map((x) => ({
    loai: 'phien-am', dung: x, khoa: [x.d ? `d:${x.d}` : null, `v:${x.v}`].filter(Boolean),
    luaChon: tron([{ hien: x.p, dung: true }, ...dapAnNhieu(x, nh).map((y) => ({ hien: y.p, dung: false }))]),
  }));
}

function taoCauBoThu(dl) {
  const ds = dl.boThu;
  const nt = layTienDo().nenTang;
  const diem = (b) => (nt.dung[`b:${b.bo}`] || 0) - 2 * (nt.sai[`b:${b.bo}`] || 0);
  const chon = tron(ds.map((b) => [diem(b) + Math.random() * 4, b]).sort((a, b) => a[0] - b[0]).slice(0, SO_CAU * 2).map((x) => x[1])).slice(0, SO_CAU);
  return chon.map((b, i) => {
    const khac = tron(ds.filter((x) => x !== b && x.nghia !== b.nghia)).slice(0, 3);
    const dang = b.vd.length && i % 3 === 2 ? 'chu' : i % 3 === 1 ? 'nghia-bo' : 'bo-nghia';
    if (dang === 'bo-nghia') {
      return { loai: 'bo-thu', dang, b, khoa: [`b:${b.bo}`],
        luaChon: tron([{ hien: b.nghia, dung: true }, ...khac.map((x) => ({ hien: x.nghia, dung: false }))]) };
    }
    const vd = dang === 'chu' ? b.vd[Math.floor(Math.random() * Math.min(4, b.vd.length))] : null;
    return { loai: 'bo-thu', dang, b, vd, khoa: [`b:${b.bo}`],
      luaChon: tron([{ hien: b.bo, dung: true }, ...khac.map((x) => ({ hien: x.bo, dung: false }))]) };
  });
}

/** @returns {Function} hàm dọn dẹp khi rời màn hình */
export function vePhienChuAm(khung, loai) {
  let daRoi = false;
  let dungDongHo = () => {};
  khung.innerHTML = '<div class="dang-tai">Đang chuẩn bị câu hỏi…</div>';
  Promise.all([taiDuLieu(), loai === 'bo-thu' ? taiNetChu() : null]).then(([dl, netChu]) => {
    if (daRoi) return;
    const net = netChu?.net || {};
    const hangDoi = loai === 'bo-thu' ? taoCauBoThu(dl) : taoCauPhienAm(dl);
    const tong = hangDoi.length;
    const ketQua = { dung: 0, sai: 0 };
    const saiLan = [];
    let cau = null;
    let daLam = 0;
    let daTraLoi = false;
    document.body.classList.add('dang-hoc');
    dungDongHo = batDongHo(loai === 'bo-thu' ? 'viet' : 'nghe');

    khung.innerHTML = `
      <div class="phien">
        <div class="tien-do-phien"><div class="thanh-tien-do"><span style="width:0%"></span></div><span class="dem"></span></div>
        <div class="khung the-thanh the-trac-nghiem" id="the"></div>
        <div class="vung-tra-loi" id="vung-nut"></div>
      </div>`;
    const $ = (s) => khung.querySelector(s);
    const nghe = (cham) => { if (cau?.loai === 'phien-am') doc(cau.dung.h, cham ? 0.55 : undefined); };

    function capNhat() {
      $('.tien-do-phien .thanh-tien-do > span').style.width = `${(daLam / tong) * 100}%`;
      $('.tien-do-phien .dem').textContent = `Câu ${daTraLoi ? daLam : daLam + 1}/${tong} · đúng ${ketQua.dung}`;
    }

    function cauTiep() {
      if (daRoi) return;
      cau = hangDoi.shift();
      if (!cau) { ketThuc(); return; }
      daTraLoi = false;
      capNhat();
      let deBai;
      let lop = 'pinyin';
      if (cau.loai === 'phien-am') {
        deBai = `<p class="cau-hoi">Nghe và chọn phiên âm đúng</p>
          <div class="hang-nghe">
            <button class="nut-loa nut-nghe-lon" id="nut-nghe" aria-label="Nghe">${bieuTuong('loa')}</button>
            <button class="nut nut-nho" id="nut-cham">🐢 Chậm</button>
          </div>`;
      } else if (cau.dang === 'bo-nghia') {
        deBai = `<p class="cau-hoi">Bộ thủ này nghĩa là gì?</p><p class="han tu-hoi">${esc(cau.b.bo)}${cau.b.bien.length ? `<small class="chu-phu"> ${esc(cau.b.bien.join(' '))}</small>` : ''}</p>`;
        lop = '';
      } else if (cau.dang === 'nghia-bo') {
        deBai = `<p class="cau-hoi">Bộ thủ nào có nghĩa:</p><p class="nghia-hoi">${esc(cau.b.nghia)}</p>`;
        lop = 'han';
      } else {
        deBai = `<p class="cau-hoi">Chữ này có bộ thủ nào?</p>
          <div class="chu-hoi-bo">${svgChu(net, cau.vd.c)}</div>
          <p class="chu-phu nho" style="margin:0">trong từ <span class="han">${esc(cau.vd.tu)}</span> · ${esc(cau.vd.nghia)}</p>`;
        lop = 'han';
      }
      $('#the').innerHTML = `
        <div class="goc-the"><span class="nhan">${cau.loai === 'phien-am' ? '🔤 Phiên âm' : '🧱 Bộ thủ'}</span></div>
        ${deBai}
        <div id="dap-an" class="dap-an"></div>`;
      $('#vung-nut').innerHTML = `
        <div class="luoi-lua-chon ${lop === '' ? 'mot-cot' : 'hai-cot'}">
          ${cau.luaChon.map((l, i) => `<button class="nut-lua-chon" data-i="${i}"><span class="${lop}">${esc(l.hien)}</span><kbd>${i + 1}</kbd></button>`).join('')}
        </div>`;
      $('#vung-nut').querySelectorAll('[data-i]').forEach((b) => { b.onclick = () => traLoi(Number(b.dataset.i)); });
      if (cau.loai === 'phien-am') {
        $('#nut-nghe').onclick = () => nghe();
        $('#nut-cham').onclick = () => nghe(true);
        setTimeout(() => nghe(), 250);
      }
    }

    function traLoi(i) {
      if (daTraLoi || daRoi) return;
      daTraLoi = true;
      daLam++;
      const dung = cau.luaChon[i].dung;
      ketQua[dung ? 'dung' : 'sai']++;
      // Ghi tiến độ từng âm / bộ
      const nt = layTienDo().nenTang;
      for (const k of cau.khoa) nt[dung ? 'dung' : 'sai'][k] = (nt[dung ? 'dung' : 'sai'][k] || 0) + 1;
      const nk = nhatKyHomNay();
      nk.nenTang = (nk.nenTang || 0) + 1;
      luu();
      if (!dung) saiLan.push(cau);
      $('#vung-nut').querySelectorAll('[data-i]').forEach((b) => {
        const l = cau.luaChon[Number(b.dataset.i)];
        b.classList.toggle('dung', l.dung);
        b.classList.toggle('sai', Number(b.dataset.i) === i && !dung);
        b.disabled = true;
      });
      let giaiThich;
      if (cau.loai === 'phien-am') {
        const x = cau.dung;
        const meo = [x.d && dl.phienAm.amDau.find((a) => a.ma === x.d), dl.phienAm.van.find((a) => a.ma === x.v)].filter(Boolean);
        giaiThich = `<div class="tu-sau-tra-loi"><span class="han tu-lon">${esc(x.h)}</span>
            <span class="giua"><span class="pinyin">${toMauPinyin(x.p)}</span>
            ${meo.map((m) => `<span class="chu-phu nho"><b class="pinyin">${esc(m.ma)}</b>: ${esc(m.meo)}</span>`).join('')}</span>${nutLoa(x.h, true)}</div>`;
      } else {
        const b = cau.b;
        giaiThich = `<div class="tu-sau-tra-loi"><span class="han tu-lon">${esc(b.bo)}</span>
            <span class="giua"><b>Bộ ${esc(b.hv)}</b> – ${esc(b.nghia)}<span class="chu-phu nho">${esc(b.goi)}</span></span></div>`;
      }
      $('#dap-an').innerHTML = `${dung ? '✅ Đúng!' : '❌ Chưa đúng.'}${giaiThich}`;
      $('#dap-an').classList.add(dung ? 'la-dung' : 'la-sai');
      $('#vung-nut').insertAdjacentHTML('beforeend',
        `<button class="nut nut-chinh nut-rong" id="nut-tiep" style="margin-top:10px">${hangDoi.length ? 'Câu tiếp ▶' : 'Xem kết quả ▶'}</button>`);
      $('#nut-tiep').onclick = cauTiep;
      capNhat();
      $('#nut-tiep').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    function ketThuc() {
      dungDongHo();
      document.body.classList.remove('dang-hoc');
      ghiLuot(loai === 'bo-thu' ? 'boThu' : 'phienAm', ketQua.dung, ketQua.sai);
      const ti = tong ? ketQua.dung / tong : 0;
      khung.innerHTML = `
        <div class="ket-thuc">
          <div class="emoji emoji-to">${ti === 1 ? '💯' : ti >= 0.8 ? '🏆' : ti >= 0.5 ? '🎉' : '💪'}</div>
          <h2>${ketQua.dung}/${tong} câu đúng</h2>
          <p class="chu-phu">${ti >= 0.8 ? 'Rất tốt!' : 'Luyện thêm vài lượt sẽ quen tai/quen mắt hơn.'}</p>
          ${saiLan.length ? `<div class="khung" style="width:100%;text-align:left"><b>Cần chú ý:</b><ul class="ds-nham">${saiLan.map((c) => (c.loai === 'phien-am'
            ? `<li><span class="han">${esc(c.dung.h)}</span> <span class="pinyin">${toMauPinyin(c.dung.p)}</span></li>`
            : `<li><span class="han">${esc(c.b.bo)}</span> – bộ ${esc(c.b.hv)}: ${esc(c.b.nghia)}</li>`)).join('')}</ul></div>` : ''}
          <a class="nut nut-chinh nut-rong" href="#/chu-am/luyen/${loai}" id="nut-lai">↺ Luyện thêm ${SO_CAU} câu</a>
          <a class="nut nut-rong" href="#/chu-am/${loai}">${loai === 'bo-thu' ? '🧱 Xem bảng bộ thủ' : '🔤 Xem bảng phiên âm'}</a>
          <a class="nut nut-rong" href="#/">🏠 Về trang Hôm nay</a>
        </div>`;
      khung.querySelector('#nut-lai').onclick = (e) => { e.preventDefault(); window.dispatchEvent(new HashChangeEvent('hashchange')); };
    }

    cauTiep();
  }).catch((e) => { if (!daRoi) khung.innerHTML = `<div class="loi">${esc(e.message)}</div>`; });

  return () => {
    daRoi = true;
    dungDongHo();
    document.body.classList.remove('dang-hoc');
  };
}
