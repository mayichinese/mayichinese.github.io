// =========================================================
// NHẬP MÔN (trước HSK 1) – 6 chặng phiên âm, thanh điệu, đọc cả từ, nét và bộ thủ (đánh giá tester 2026-11-21)
//   Dữ liệu: data/nhap-mon.json (cong-cu/tao-nhap-mon.py) + data/nen-tang.json (mẹo, ví dụ nghe, nét, bộ thủ).
//   #/nhap-mon                    → lộ trình Nhập môn (chip "Nhập môn" ở Bài học)
//   #/nhap-mon/<chặng>            → trang chặng: các phần, mỗi phần một hàng cửa
//   #/nhap-mon/<chặng>/<phần>/<cửa> → làm một cửa: 📖 học · 🎧 nghe · ⚖️ cặp dễ nhầm · 🎵 nghe từ · 🎤 đọc · ✍️ tô · 🧱 bộ thủ
//   #/nhap-mon/tiep               → cửa chưa xong đầu tiên       #/nhap-mon/bo-qua → kiểm tra 15 câu để bỏ qua
// Tiến độ: tienDo.nhapMon = { cua: { "<chặng>/<phần>": [số cửa xong] }, boQuaCua: { "<chặng>/<phần>": [cửa tạm bỏ qua] }, xong, boQua }.
// Cửa tạm bỏ qua (máy không có giọng đọc) cho đi tiếp nhưng KHÔNG tính là xong (hiện ⏭); có giọng rồi thì trang Hôm nay nhắc làm lại.
// Xong cả 6 chặng (hoặc qua kiểm tra bỏ qua) → mở Chặng 1 của HSK 1 (lo-trinh.js nhapMonXong).
// =========================================================

import { layTienDo, luu, ghiLuot } from './luu-tru.js';
import { doc, tinhTrangPhatAm } from './phat-am.js';
import { esc, batDongHo, htmlChanBaiNghe } from './giao-dien.js';
import { toMauPinyin, datThanh, bienTheThanh, demChuHan } from './pinyin.js';
import { tron } from './cau-hoi-tu.js';
import { taiNetChu, taoBangVe, saiToiDa } from './net-chu.js';
import { svgChu } from './man-chu-am.js';
import { ganKhungNoi, htmlNhacBienDieu } from './man-luyen-noi.js';
import { coNhanDang, coGhiAm } from './nhan-giong.js';
import { amCham, amXong, amSai } from './am-thanh.js';
import { htmlPhaoHoa } from './man-kiem-tra.js';
import { bieuTuong } from './bieu-tuong.js';

export const BIEU_TUONG_NM = { hoc: '📖', nghe: '🎧', cap: '⚖️', tu: '🎵', noi: '🎤', to: '✍️', bo: '🧱' };
const TEN_CUA = { hoc: 'Học', nghe: 'Nghe chọn', cap: 'Cặp dễ nhầm', tu: 'Nghe cả từ', noi: 'Đọc theo', to: 'Tô chữ', bo: 'Bộ thủ' };
const CAN_GIONG = new Set(['nghe', 'cap', 'tu']);
const TI_LE_QUA = 0.6;
const DIEM_BO_QUA = 80;

let hen = null;
/** Tải dữ liệu Nhập môn + nền tảng (một lần) */
export function taiNhapMon() {
  if (!hen) {
    const json = (f) => fetch(f).then((r) => { if (!r.ok) throw new Error(`Không tìm thấy ${f}`); return r.json(); });
    hen = Promise.all([json('data/nhap-mon.json'), json('data/nen-tang.json')])
      .then(([nm, nt]) => ({ nm, nt })).catch((e) => { hen = null; throw e; });
  }
  return hen;
}

const tienDoNM = () => {
  const td = layTienDo();
  td.nhapMon = td.nhapMon || { cua: {} };
  td.nhapMon.cua = td.nhapMon.cua || {};
  td.nhapMon.boQuaCua = td.nhapMon.boQuaCua || {};
  return td.nhapMon;
};

/** Trạng thái: [{ c, so, xong, mo, phan: [{ p, so, xong, mo, cua: [{ cua, so, xong, mo }] }] }] */
export function trangThaiNhapMon(nm) {
  const t = tienDoNM();
  let changTruocXong = true;
  return nm.chang.map((c) => {
    let phanTruocXong = true;
    const phan = c.phan.map((p, ip) => {
      const xongDs = new Set(t.cua[`${c.so}/${ip}`] || []);
      const boQuaDs = new Set(t.boQuaCua[`${c.so}/${ip}`] || []);
      let mo = true;
      const cua = p.cua.map((x, ic) => {
        const xong = xongDs.has(ic);
        const boQua = !xong && boQuaDs.has(ic);
        const r = { cua: x, so: ic, xong, boQua, qua: xong || boQua, mo: xong || boQua || mo };
        if (!r.qua) mo = false;
        return r;
      });
      // "xong" của phần/chặng tính cả cửa tạm bỏ qua (để đi tiếp được); cửa bỏ qua vẫn hiện ⏭ và được nhắc làm lại
      const r = { p, so: ip, xong: cua.every((x) => x.qua), mo: phanTruocXong, cua };
      phanTruocXong = r.xong;
      return r;
    });
    const r = { c, so: c.so, phan, xong: phan.every((x) => x.xong), mo: changTruocXong || !!t.boQua };
    changTruocXong = r.xong;
    return r;
  });
}

/** Cửa chưa xong đầu tiên: { chang, phan, cua } hoặc null */
export function cuaTiepNM(nm) {
  for (const c of trangThaiNhapMon(nm)) {
    if (!c.mo) return null;
    for (const p of c.phan) {
      const x = p.mo && p.cua.find((y) => !y.qua);
      if (x) return { chang: c.so, phan: p.so, cua: x.so };
    }
  }
  return null;
}

// ---------- Lộ trình Nhập môn (dùng trong trang Bài học, chip "Nhập môn") ----------
export function veDuongNhapMon(vung) {
  vung.innerHTML = '<div class="dang-tai">Đang tải…</div>';
  taiNhapMon().then(({ nm }) => {
    if (!vung.isConnected) return;
    const t = tienDoNM();
    const ds = trangThaiNhapMon(nm);
    const dang = t.xong || t.boQua ? null : ds.find((c) => c.mo && !c.xong);
    const LECH = [0, 58, 88, 58, 0, -58, -88, -58];
    vung.innerHTML = `
      <section class="khung tong-quan-cap">
        <div class="dong-tren"><b>Nhập môn · ${ds.length} chặng</b>${t.xong || t.boQua ? '<span class="nhan nhan-vang">✓ Đã mở HSK 1</span>' : ''}</div>
        <span class="thanh-tien-do"><span style="width:${Math.round((ds.filter((c) => c.xong).length / ds.length) * 100)}%"></span></span>
        <span class="chu-phu nho">Phiên âm, thanh điệu, đọc cả từ, nét và bộ thủ – nền móng trước khi học từ vựng HSK 1.</span>
        ${t.xong || t.boQua ? '' : '<a class="nut nut-rong" href="#/nhap-mon/bo-qua" style="margin-top:8px">⏭️ Đã biết pinyin? Kiểm tra 15 câu để bỏ qua</a>'}
      </section>
      <div class="duong-di">${ds.map((c, i) => {
        const trangThai = !c.mo ? 'khoa' : c.xong ? 'xong' : c === dang ? 'dang' : 'do-dang';
        const soCua = c.phan.reduce((s, p) => s + p.cua.length, 0);
        const xongCua = c.phan.reduce((s, p) => s + p.cua.filter((x) => x.xong).length, 0);
        return `
        <div class="nut-duong ${trangThai}" style="--lech:${LECH[i % LECH.length]}px">
          ${trangThai === 'dang' ? `<span class="bong-noi">${xongCua ? 'TIẾP TỤC' : 'BẮT ĐẦU'}</span>` : ''}
          <a class="tron-duong" href="#/nhap-mon/${c.so}">${trangThai === 'khoa' ? '<span class="emoji">🔒</span>' : `<span>${c.so}</span>`}${c.xong ? '<i class="dau-xong">✓</i>' : ''}</a>
          <a class="nhan-duong" href="#/nhap-mon/${c.so}"><span class="so-bai">Nhập môn ${c.so}</span><b>${esc(c.c.ten)}</b>
            <span class="chu-phu nho">${c.xong ? '⭐ Xong' : `${xongCua}/${soCua} cửa`}</span></a>
        </div>`;
      }).join('')}</div>
      <p class="chu-phu nho" style="text-align:center">Tra cứu đầy đủ phiên âm, nét, bộ thủ ở mục <a href="#/chu-am">Chữ & âm</a>.</p>`;
    const $dang = vung.querySelector('.nut-duong.dang');
    if ($dang && $dang.getBoundingClientRect().top > window.innerHeight * 0.7) requestAnimationFrame(() => $dang.scrollIntoView({ block: 'center' }));
  }).catch((e) => { vung.innerHTML = `<p class="loi">${esc(e.message)}</p>`; });
}

// ---------- Trang một chặng Nhập môn ----------
export function veChangNhapMon(khung, so) {
  khung.innerHTML = '<div class="dang-tai">Đang tải…</div>';
  taiNhapMon().then(({ nm }) => {
    if (!khung.isConnected) return;
    const c = trangThaiNhapMon(nm).find((x) => x.so === so);
    if (!c) { khung.innerHTML = '<p class="loi">Không tìm thấy chặng này.</p>'; return; }
    if (!c.mo) {
      khung.innerHTML = `<div class="chua-lam"><div class="emoji emoji-to">🔒</div><h2>Nhập môn ${so} chưa mở</h2>
        <p class="chu-phu">Học xong chặng trước để mở.</p><a class="nut nut-chinh" href="#/nhap-mon">← Lộ trình Nhập môn</a></div>`;
      return;
    }
    const dangHoc = c.phan.find((p) => !p.xong);
    const cuaDang = dangHoc?.cua.find((x) => !x.qua);
    khung.innerHTML = `
      <section class="khung dau-bai"><span class="so-bai">Nhập môn ${so}</span><h2>${esc(c.c.ten)}</h2>
        <p class="chu-phu nho" style="margin:6px 0 0">${esc(c.c.moTa)}</p></section>
      <p class="chu-phu nho" style="margin:12px 2px 0">📖 học · 🎧 nghe chọn · ⚖️ cặp dễ nhầm · 🎵 nghe cả từ · 🎤 đọc theo · ✍️ tô chữ · 🧱 bộ thủ.
        Đúng từ 60% mới qua cửa.</p>
      <div class="ds-chang">${c.phan.map((p) => `
        <section class="khung the-phan ${p.xong ? 'xong' : p === dangHoc ? 'dang' : ''} ${p.mo ? '' : 'khoa'}">
          <div class="dau-phan"><b>Phần ${p.so + 1} · ${esc(p.p.ten)}</b>
            ${p.xong ? '<span class="nhan nhan-vang">✓ Xong</span>' : p === dangHoc ? '<span class="nhan nhan-chinh">Đang học</span>' : p.mo ? '' : '<span class="nhan">🔒</span>'}</div>
          <div class="hang-cua">${p.cua.map((x) => {
            const nd = `<span class="emoji">${BIEU_TUONG_NM[x.cua.loai]}</span>${x.xong ? '<i class="dau-xong-cua">✓</i>' : x.boQua ? '<i class="dau-xong-cua bo-qua">⏭</i>' : ''}`;
            const ten = `${TEN_CUA[x.cua.loai]}`;
            return p.mo && x.mo
              ? `<a class="cua ${x.xong ? 'xong' : x === cuaDang ? 'dang' : x.boQua ? 'bo-qua' : 'khoa'}" href="#/nhap-mon/${so}/${p.so}/${x.so}" title="${ten}" aria-label="${ten}">${nd}</a>`
              : `<span class="cua khoa" title="${ten} – chưa mở">${nd}</span>`;
          }).join('<span class="noi-cua"></span>')}</div>
        </section>`).join('')}</div>
      <a class="nut nut-rong" href="#/nhap-mon" style="margin-top:14px">← Lộ trình Nhập môn</a>`;
  }).catch((e) => { khung.innerHTML = `<p class="loi">${esc(e.message)}</p>`; });
}

// ---------- Sinh mục học / câu hỏi ----------
const giongOk = () => !['khong-ho-tro', 'khong-co-giong'].includes(tinhTrangPhatAm());

/** Câu nghe một âm tiết: phát chữ, chọn pinyin */
function cauNghe(nt, nhom, muc, soCau = 8) {
  const nh = nt.phienAm.nganHang;
  const k = { thanh: 't', 'am-dau': 'd', van: 'v' }[nhom];
  const nguon = tron(nh.filter((x) => muc.includes(String(x[k]))));
  return nguon.slice(0, soCau).map((x) => {
    let nhieu;
    if (nhom === 'thanh') nhieu = [1, 2, 3, 4].filter((t) => t !== x.t).map((t) => datThanh(x.p, t));
    else {
      const khac = k === 'd' ? 'v' : 'd';
      const ung = tron(nh.filter((y) => y[k] !== x[k] && y.p !== x.p && (muc.length > 1 ? muc.includes(String(y[k])) : true)));
      ung.sort((a, b) => (b[khac] === x[khac]) - (a[khac] === x[khac]) || (b.t === x.t) - (a.t === x.t));
      nhieu = [...new Set(ung.map((y) => y.p))].slice(0, 3);
    }
    return { loai: 'hoi', doc: x.h, hoi: 'Nghe và chọn phiên âm đúng', lop: 'pinyin',
      luaChon: tron([{ hien: x.p, dung: true }, ...nhieu.map((h) => ({ hien: h, dung: false }))]), giai: `${x.h} · ${x.p}` };
  });
}

function taoMuc(cua, nt, net) {
  const pa = nt.phienAm;
  const { loai, nhom, muc } = cua;
  if (loai === 'hoc') {
    return muc.map((m) => {
      if (nhom === 'thanh') {
        const t = pa.thanh.find((x) => String(x.t) === m);
        const mau = pa.mauThanh.find((x) => String(x.t) === m);
        return { loai: 'the', html: `<p class="ma-am pinyin t${m}">${mau ? esc(mau.p) : ''}</p><h3>${m === '0' ? 'Thanh nhẹ' : `Thanh ${m}`}</h3>
          <p class="meo-doc">💡 ${esc(t?.meo || '')}</p>${mau ? `<button class="nut" data-doc="${esc(mau.h)}">🔊 Nghe <span class="han">${esc(mau.h)}</span></button>` : ''}
          <div class="luoi-vd-am">${pa.mauThanh.map((x) => `<button class="o-vd-am" data-doc="${esc(x.h)}"><span class="han">${esc(x.h)}</span><span class="pinyin">${toMauPinyin(x.p)}</span></button>`).join('')}</div>`,
        doc: mau?.h };
      }
      if (nhom === 'am-dau' || nhom === 'van') {
        const x = (nhom === 'am-dau' ? pa.amDau : pa.van).find((y) => y.ma === m);
        const vd = [...(x.vdTu || []), ...(x.vd || []).slice(0, 4)];
        return { loai: 'the', html: `<p class="ma-am pinyin">${esc(m)}</p><h3>${nhom === 'am-dau' ? 'Thanh mẫu' : 'Vận mẫu'}${x.nhom ? ` · ${esc(x.nhom)}` : ''}</h3>
          <p class="meo-doc">💡 ${esc(x.meo)}</p>
          <div class="luoi-vd-am">${vd.map((v) => `<button class="o-vd-am" data-doc="${esc(v.h)}"><span class="han">${esc(v.h)}</span><span class="pinyin">${toMauPinyin(v.p)}</span></button>`).join('')}</div>`,
        doc: vd[0]?.h };
      }
      if (nhom === 'luu-y') {
        const x = pa.luuY[Number(m) - 1];
        return { loai: 'the', html: `<p class="ma-am">⚠️</p><h3>${esc(x.ten)}</h3><p class="meo-doc">${esc(x.noi)}</p>` };
      }
      if (nhom === 'net') {
        const x = nt.net.find((y) => y.ten === m);
        return { loai: 'the', html: `<div class="hinh-net">${svgChu(net, x.chu, [x.so - 1])}</div>
          <h3><span class="han">${esc(x.ten)}</span> · ${esc(x.viet)}</h3><p class="meo-doc">✏️ ${esc(x.cach)}</p>
          <button class="nut" data-cach-viet="${esc(x.chu)}">▶ Xem viết chữ <span class="han">${esc(x.chu)}</span></button>` };
      }
      if (nhom === 'quy-tac') {
        const x = nt.quyTac[Number(m) - 1];
        return { loai: 'the', html: `<div class="hinh-net">${svgChu(net, x.chu)}</div><h3>${esc(x.ten)}</h3>
          <p class="meo-doc">${esc(x.giai)}</p><button class="nut" data-cach-viet="${esc(x.chu)}">▶ Xem thứ tự nét chữ <span class="han">${esc(x.chu)}</span></button>` };
      }
      const b = nt.boThu.find((y) => y.bo === m);
      return { loai: 'the', html: `<p class="ma-am han">${esc(b.bo)}${b.bien.length ? ` <small>${esc(b.bien.join(' '))}</small>` : ''}</p>
        <h3>Bộ ${esc(b.hv)} – ${esc(b.nghia)}</h3><p class="meo-doc">💡 ${esc(b.goi)}</p>
        <div class="luoi-vd-am">${b.vd.slice(0, 4).map((v) => `<button class="o-vd-am" data-doc="${esc(v.c)}"><span class="han">${esc(v.c)}</span><span class="chu-phu nho">${esc(v.tu)}</span></button>`).join('')}</div>` };
    });
  }
  if (loai === 'nghe') return cauNghe(nt, nhom, muc);
  if (loai === 'cap') {
    const ds = [];
    for (const c of cua.capAm) for (const cap of c.cap.slice(0, 3)) {
      const [a, b] = cap;
      const x = Math.random() < 0.5 ? a : b;
      ds.push({ loai: 'hoi', doc: x.h, hoi: 'Nghe kỹ: âm nào?', lop: 'pinyin', haiCot: true,
        luaChon: [{ hien: a.p, dung: x === a }, { hien: b.p, dung: x === b }], giai: `${x.h} · ${x.p}` });
    }
    return tron(ds).slice(0, 8);
  }
  if (loai === 'tu') {
    return tron(cua.tu).map((w) => ({ loai: 'hoi', doc: w.h, hoi: 'Nghe cả từ, chọn pinyin đúng thanh', lop: 'pinyin',
      luaChon: tron([{ hien: w.p, dung: true }, ...bienTheThanh(w.p, demChuHan(w.h), 3).map((h) => ({ hien: h, dung: false }))]),
      giai: `${w.h} · ${w.p}` }));
  }
  if (loai === 'noi') return cua.tu.map((w) => ({ loai: 'noi', tu: w }));
  if (loai === 'to') return muc.map((c) => ({ loai: 'to', chu: c }));
  // bộ thủ: bộ → nghĩa / nghĩa → bộ
  return tron(muc).map((m, i) => {
    const b = nt.boThu.find((y) => y.bo === m);
    const khac = tron(nt.boThu.filter((y) => y.bo !== m && y.nghia !== b.nghia)).slice(0, 3);
    return i % 2
      ? { loai: 'hoi', hoi: `Bộ nào nghĩa là “${b.nghia}”?`, lop: 'han', luaChon: tron([{ hien: b.bo, dung: true }, ...khac.map((y) => ({ hien: y.bo, dung: false }))]), giai: `${b.bo} – bộ ${b.hv}` }
      : { loai: 'hoi', hoi: `Bộ <span class="han">${esc(b.bo)}</span> nghĩa là gì?`, lop: '', luaChon: tron([{ hien: b.nghia, dung: true }, ...khac.map((y) => ({ hien: y.nghia, dung: false }))]), giai: `${b.bo} – bộ ${b.hv}` };
  });
}

// ---------- Chạy một cửa (hoặc bài kiểm tra bỏ qua) ----------
/**
 * @param {number|null} so chặng (null = kiểm tra bỏ qua)
 * @returns {Function} dọn dẹp
 */
export function veCuaNhapMon(khung, so, soPhan, soCua) {
  let daRoi = false;
  let dungDongHo = () => {};
  let huyHienTai = null;
  const boQua = so === null;
  khung.innerHTML = '<div class="dang-tai">Đang mở cửa…</div>';

  Promise.all([taiNhapMon(), taiNetChu().catch(() => ({ net: {} }))]).then(([{ nm, nt }, netChu]) => {
    if (daRoi) return;
    const net = netChu.net || {};
    let cua = null;
    let hang;
    if (boQua) {
      if (!giongOk()) {
        khung.innerHTML = `${htmlChanBaiNghe(tinhTrangPhatAm(), '#/nhap-mon')}
          <button class="nut nut-rong" id="nut-bo-khong-giong" style="margin-top:10px">Tôi đã biết pinyin – bỏ qua Nhập môn (không kiểm tra)</button>`;
        khung.querySelector('#nut-bo-khong-giong').onclick = () => { tienDoNM().boQua = true; luu(); location.hash = '#/bai'; };
        return;
      }
      const tat = (nhom) => [...new Set(nm.chang.flatMap((c) => c.phan.flatMap((p) => p.cua.filter((x) => x.loai === 'nghe' && x.nhom === nhom).flatMap((x) => x.muc))))];
      hang = tron([...cauNghe(nt, 'thanh', ['1', '2', '3', '4'], 5), ...cauNghe(nt, 'am-dau', tat('am-dau'), 5), ...cauNghe(nt, 'van', tat('van'), 5)]);
    } else {
      const c = trangThaiNhapMon(nm).find((x) => x.so === so);
      const p = c?.phan[soPhan];
      const x = p?.cua[soCua];
      if (!x) { khung.innerHTML = '<p class="loi">Không tìm thấy cửa này.</p><a class="nut" href="#/nhap-mon">← Nhập môn</a>'; return; }
      if (!c.mo || !p.mo || !x.mo) {
        khung.innerHTML = `<div class="chua-lam"><div class="emoji emoji-to">🔒</div><h2>Cửa này chưa mở</h2>
          <a class="nut nut-chinh" href="#/nhap-mon/${so}">← Về chặng</a></div>`;
        return;
      }
      cua = x.cua;
      // Máy không đọc được → cửa cần nghe cho bỏ qua; không có micro → cửa đọc theo tự qua
      if (CAN_GIONG.has(cua.loai) && !giongOk()) {
        khung.innerHTML = `${htmlChanBaiNghe(tinhTrangPhatAm(), `#/nhap-mon/${so}`)}
          <button class="nut nut-rong" id="nut-bo-cua" style="margin-top:10px">Tạm bỏ qua cửa này ▶</button>`;
        khung.querySelector('#nut-bo-cua').onclick = () => { ghiBoQua(); location.hash = `#/nhap-mon/${so}`; };
        return;
      }
      if (cua.loai === 'noi' && !(coNhanDang() || coGhiAm())) {
        ghiXong();
        khung.innerHTML = `<div class="chua-lam"><div class="emoji emoji-to">🎤</div><h2>Máy không dùng được micro</h2>
          <p class="chu-phu">Cửa đọc theo được tính là xong. Hãy tự đọc to các từ khi nghe mẫu nhé.</p>
          <a class="nut nut-chinh" href="#/nhap-mon/tiep">Cửa tiếp ▶</a></div>`;
        return;
      }
      hang = taoMuc(cua, nt, net);
    }

    /** Tạm bỏ qua cửa (máy không có giọng đọc): đi tiếp được nhưng không tính là xong */
    function ghiBoQua() {
      const t = tienDoNM();
      const k = `${so}/${soPhan}`;
      t.boQuaCua[k] = [...new Set([...(t.boQuaCua[k] || []), soCua])].sort((a, b) => a - b);
      if (trangThaiNhapMon(nm).every((c) => c.xong)) t.xong = true;
      luu();
    }

    function ghiXong() {
      const t = tienDoNM();
      const k = `${so}/${soPhan}`;
      t.cua[k] = [...new Set([...(t.cua[k] || []), soCua])].sort((a, b) => a - b);
      t.boQuaCua[k] = (t.boQuaCua[k] || []).filter((x) => x !== soCua);
      const ds = trangThaiNhapMon(nm);
      if (ds.every((c) => c.xong)) t.xong = true;
      luu();
    }

    const tong = hang.length;
    let viTri = -1;
    let dung = 0;
    let coCham = 0;
    let daTraLoi = false;
    document.body.classList.add('dang-hoc');
    dungDongHo = batDongHo('nghe');
    const nhan = boQua ? '⏭️ Kiểm tra bỏ qua Nhập môn' : `${BIEU_TUONG_NM[cua.loai]} ${TEN_CUA[cua.loai]} · Nhập môn ${so}`;
    khung.innerHTML = `
      <div class="phien">
        <div class="tien-do-phien"><div class="thanh-tien-do"><span style="width:0%"></span></div><span class="dem"></span></div>
        <div class="khung the-thanh the-trac-nghiem" id="the"></div>
        <div class="vung-tra-loi" id="vung-nut"></div>
      </div>`;
    const $ = (s) => khung.querySelector(s);
    const capNhat = () => {
      $('.tien-do-phien .thanh-tien-do > span').style.width = `${((viTri + (daTraLoi ? 1 : 0)) / tong) * 100}%`;
      $('.tien-do-phien .dem').textContent = `${viTri + 1}/${tong}`;
    };
    const nutTiep = (chu = 'Tiếp ▶') => {
      $('#vung-nut').insertAdjacentHTML('beforeend', `<button class="nut nut-chinh nut-rong" id="nut-tiep" style="margin-top:10px">${viTri + 1 < tong ? chu : 'Xem kết quả ▶'}</button>`);
      $('#nut-tiep').onclick = tiep;
    };

    function tiep() {
      if (daRoi) return;
      if (huyHienTai) { huyHienTai(); huyHienTai = null; }
      viTri++;
      daTraLoi = false;
      if (viTri >= tong) { ketThuc(); return; }
      const m = hang[viTri];
      capNhat();
      window.scrollTo(0, 0);
      const goc = `<div class="goc-the"><span class="nhan">${nhan}</span></div>`;
      if (m.loai === 'the') {
        $('#the').innerHTML = `${goc}<div class="the-nhap-mon">${m.html}</div>`;
        $('#vung-nut').innerHTML = '';
        daTraLoi = true;
        nutTiep('Đã hiểu – tiếp ▶');
        if (m.doc) doc(m.doc);
      } else if (m.loai === 'hoi') {
        $('#the').innerHTML = `${goc}<p class="cau-hoi">${m.hoi}</p>
          ${m.doc ? `<div class="hang-nghe"><button class="nut-loa nut-nghe-lon" id="nut-nghe" aria-label="Nghe">${bieuTuong('loa')}</button><button class="nut nut-nho" id="nut-cham">🐢 Chậm</button></div>` : ''}
          <div id="dap-an" class="dap-an"></div>`;
        $('#vung-nut').innerHTML = `<div class="luoi-lua-chon ${m.lop === '' ? 'mot-cot' : 'hai-cot'}">${m.luaChon.map((l, i) =>
          `<button class="nut-lua-chon" data-i="${i}"><span class="${m.lop}">${esc(l.hien)}</span><kbd>${i + 1}</kbd></button>`).join('')}</div>`;
        if (m.doc) {
          $('#nut-nghe').onclick = () => doc(m.doc);
          $('#nut-cham').onclick = () => doc(m.doc, 0.55);
          setTimeout(() => { if (hang[viTri] === m && !daTraLoi) doc(m.doc); }, 250);
        }
        $('#vung-nut').querySelectorAll('[data-i]').forEach((nut) => {
          nut.onclick = () => {
            if (daTraLoi) return;
            daTraLoi = true;
            const ok = m.luaChon[Number(nut.dataset.i)].dung;
            coCham++;
            if (ok) dung++;
            amCham(ok);
            $('#vung-nut').querySelectorAll('[data-i]').forEach((x) => {
              x.classList.toggle('dung', m.luaChon[Number(x.dataset.i)].dung);
              x.classList.toggle('sai', x === nut && !ok);
              x.disabled = true;
            });
            $('#dap-an').innerHTML = `${ok ? '✅ Đúng!' : '❌ Chưa đúng.'} <span class="han">${esc(m.giai)}</span>`;
            $('#dap-an').classList.add(ok ? 'la-dung' : 'la-sai');
            if (m.doc) doc(m.doc);
            nutTiep();
            capNhat();
          };
        });
      } else if (m.loai === 'noi') {
        const w = m.tu;
        $('#the').innerHTML = `${goc}<p class="cau-hoi">Nghe rồi đọc theo</p>
          <p class="han tu-hoi">${esc(w.h)}</p><p class="pinyin pinyin-to">${toMauPinyin(w.p, demChuHan(w.h))}</p>
          ${htmlNhacBienDieu(w.h, w.p)}<button class="nut" data-doc="${esc(w.h)}">🔊 Nghe mẫu</button>`;
        $('#vung-nut').innerHTML = '<div id="vung-noi"></div>';
        huyHienTai = ganKhungNoi($('#vung-noi'), { hanzi: w.h, pinyin: w.p }, () => {});
        daTraLoi = true;
        nutTiep();
        setTimeout(() => { if (hang[viTri] === m) doc(w.h); }, 250);
      } else {
        $('#the').innerHTML = `${goc}<p class="cau-hoi">Tô chữ <span class="han">${esc(m.chu)}</span> theo nét mờ, đúng thứ tự</p>
          <div class="o-viet" id="o-viet"></div><p class="chu-phu nho" id="loi-nhan" style="margin:0">Vẽ từng nét bằng ngón tay (hoặc chuột).</p>`;
        $('#vung-nut').innerHTML = '<div class="hang-nut"><button class="nut" data-cach-viet="' + esc(m.chu) + '">▶ Xem cách viết</button></div>';
        taoBangVe($('#o-viet'), m.chu, { showCharacter: false }).then((wr) => {
          if (daRoi || hang[viTri] !== m) return;
          const nguong = saiToiDa(net[m.chu]?.strokes.length || 5);
          wr.quiz({ showHintAfterMisses: 2,
            onMistake: (d) => { const $l = $('#loi-nhan'); if ($l) $l.textContent = `Chưa đúng nét (sai ${d.totalMistakes} lần).`; },
            onComplete: (kq) => {
              if (daRoi || hang[viTri] !== m) return;
              coCham++;
              const ok = kq.totalMistakes <= nguong;
              if (ok) dung++;
              amCham(ok);
              daTraLoi = true;
              $('#loi-nhan').textContent = ok ? '✅ Viết đúng!' : `Sai ${kq.totalMistakes} nét – xem cách viết rồi thử lại ở lần sau.`;
              nutTiep();
            } });
          huyHienTai = () => { try { wr.cancelQuiz(); } catch { /* đã hủy */ } };
        }).catch(() => { daTraLoi = true; nutTiep(); });
      }
    }

    function ketThuc() {
      dungDongHo();
      document.body.classList.remove('dang-hoc');
      const ti = coCham ? dung / coCham : 1;
      if (boQua) {
        const pt = Math.round(ti * 100);
        const dat = pt >= DIEM_BO_QUA;
        if (dat) { tienDoNM().boQua = true; luu(); }
        ghiLuot('kiemTra', dung, coCham - dung);
        setTimeout(dat ? amXong : amSai, 150);
        khung.innerHTML = `<div class="ket-thuc">${dat ? htmlPhaoHoa() : ''}<div class="emoji emoji-to">${dat ? '🎉' : '💪'}</div>
          <h2>${dat ? 'Đã mở HSK 1!' : 'Chưa qua kiểm tra'}</h2>
          <p class="diem-kiem-tra"><b>${pt}%</b> · ${dung}/${coCham} câu · cần ${DIEM_BO_QUA}%</p>
          ${dat ? '<a class="nut nut-chinh nut-rong" href="#/hoc-moi">▶ Học Chặng 1 của HSK 1</a>'
            : '<p class="chu-phu">Nên học Nhập môn để chắc phiên âm – mỗi chặng chỉ vài phút.</p><a class="nut nut-chinh nut-rong" href="#/nhap-mon/tiep">▶ Học Nhập môn</a>'}
          <a class="nut nut-rong" href="#/bai">🗺️ Lộ trình</a></div>`;
        return;
      }
      const qua = ti >= TI_LE_QUA;
      const truocXong = tienDoNM().xong;
      if (qua) ghiXong();
      ghiLuot('cua', dung, coCham - dung);
      setTimeout(qua ? amXong : amSai, 150);
      const ds = trangThaiNhapMon(nm);
      const c = ds.find((x) => x.so === so);
      const xongChang = qua && c.xong;
      const xongHet = qua && tienDoNM().xong && !truocXong;
      khung.innerHTML = `
        <div class="ket-thuc">
          ${xongChang ? htmlPhaoHoa() : ''}
          <div class="emoji emoji-to">${!qua ? '💪' : xongHet ? '🏆' : xongChang ? '🎉' : '👍'}</div>
          <h2>${!qua ? 'Chưa qua cửa' : xongHet ? 'Hoàn thành Nhập môn!' : xongChang ? `Xong Nhập môn ${so}!` : 'Qua cửa!'}</h2>
          ${coCham ? `<p class="diem-kiem-tra"><b>${Math.round(ti * 100)}%</b> · ${dung}/${coCham} câu đúng${qua ? '' : ' · cần 60%'}</p>` : ''}
          ${xongHet ? '<div class="khung the-mo-khoa"><span class="emoji">🔓</span><b>Đã mở HSK 1 – Chặng 1</b><a class="nut nut-chinh nut-rong" href="#/hoc-moi">▶ Học từ vựng đầu tiên</a></div>' : ''}
          ${!qua ? '<button class="nut nut-chinh nut-rong" id="nut-lai">↺ Làm lại cửa này</button>'
            : xongHet ? '' : '<a class="nut nut-chinh nut-rong" href="#/nhap-mon/tiep">Cửa tiếp theo ▶</a>'}
          <a class="nut nut-rong" href="#/nhap-mon/${so}">← Về Nhập môn ${so}</a>
        </div>`;
      const $lai = khung.querySelector('#nut-lai');
      if ($lai) $lai.onclick = () => window.dispatchEvent(new HashChangeEvent('hashchange'));
    }

    tiep();
  }).catch((e) => { if (!daRoi) khung.innerHTML = `<p class="loi">${esc(e.message)}</p>`; });

  return () => {
    daRoi = true;
    dungDongHo();
    if (huyHienTai) huyHienTai();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    document.body.classList.remove('dang-hoc');
  };
}

/** #/nhap-mon/tiep → cửa chưa xong đầu tiên (hết thì về lộ trình) */
export function chuyenCuaTiepNM() {
  taiNhapMon().then(({ nm }) => {
    const t = cuaTiepNM(nm);
    location.replace(t ? `#/nhap-mon/${t.chang}/${t.phan}/${t.cua}` : '#/nhap-mon');
  }).catch(() => location.replace('#/bai'));
}

/** Cửa Nhập môn đã tạm bỏ qua (để trang Hôm nay nhắc làm lại khi máy có giọng đọc): địa chỉ cửa đầu tiên hoặc null */
export function cuaBoQuaDauTien() {
  const ds = layTienDo().nhapMon?.boQuaCua || {};
  const k = Object.keys(ds).filter((x) => ds[x].length).sort((a, b) => {
    const [a1, a2] = a.split('/').map(Number);
    const [b1, b2] = b.split('/').map(Number);
    return a1 - b1 || a2 - b2;
  })[0];
  return k ? `#/nhap-mon/${k}/${ds[k][0]}` : null;
}
