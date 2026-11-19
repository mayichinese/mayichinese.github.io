// =========================================================
// THI THỬ HSK 1 / HSK 2 (Giai đoạn 5.2, 5.3) – ĐỀ MÔ PHỎNG, không phải đề chính thức
//   #/thi-thu            giới thiệu cấu trúc đề + lịch sử điểm (chọn cấp HSK 1 / HSK 2)
//   #/thi-thu/lam        làm một đề HSK 1 (40 câu)     #/thi-thu/lam/2  làm một đề HSK 2 (60 câu)
// Cấu trúc theo đề thi thử trong sách bài tập 《新HSK教程 1》, 《新HSK教程 2》 (2026):
//   HSK 1 – NGHE 20: P1 nghe chọn 1/3 tranh · P2 nghe câu, chọn câu đáp · P3 nghe câu, chọn tranh A–F · P4 nghe câu + hỏi
//           ĐỌC 20 (20 phút): P1 câu ↔ tranh · P2 ghép hỏi–đáp · P3 điền từ · P4 đọc câu, trả lời
//   HSK 2 – NGHE 25: P1 nghe câu chọn 1/3 tranh · P2 nghe hội thoại chọn tranh A–F (2 nhóm) · P3 hội thoại + câu hỏi
//           ĐỌC 25 (25 phút): P1 câu ↔ tranh · P2 điền từ · P3 ghép hỏi–đáp (2 nhóm) · P4 đoạn văn + câu hỏi ★
//           VIẾT 10 (10 phút): P1 chọn phần còn thiếu của chữ · P2 viết tay một chữ (Hanzi Writer chấm theo nét)
// Dữ liệu: data/thi-thu-hsk1.json (cong-cu/ghep-thi-thu.py), data/thi-thu-hsk2.json (cong-cu/ghep-thi-thu-2.py).
// Điểm quy về thang 200 (số câu đúng × 200 / số câu), đạt từ 120.
// Mỗi câu có "kieu" quyết định cách hiện: tranh3, chon, tranh6, ghep, dien, docHoi, boThu, vietChu.
// =========================================================

import { layTienDo, luu, nhatKyHomNay, congGiay } from './luu-tru.js';
import { docLanLuot, tinhTrangPhatAm } from './phat-am.js';
import { esc, thongBao } from './giao-dien.js';
import { bieuTuong } from './bieu-tuong.js';
import { toMauPinyin } from './pinyin.js';
import { taoBangVe } from './net-chu.js';

const DIEM_DAT = 120;
const CHU_CAI = 'ABCDEF';
const LOI_VIET_TOI_DA = 3;      // viết chữ: hoàn thành với tối đa 3 nét sai thì tính đúng
const LOI_VIET_DUNG_LAI = 8;    // sai từ 8 nét thì dừng, tính sai

const PHAN_1 = [
  { ma: 'n1', ky: 'Nghe', ten: 'Phần 1', huongDan: 'Nghe và chọn tranh đúng.' },
  { ma: 'n2', ky: 'Nghe', ten: 'Phần 2', huongDan: 'Nghe một câu, chọn câu đáp lại phù hợp.' },
  { ma: 'n3', ky: 'Nghe', ten: 'Phần 3', huongDan: 'Nghe một câu, chọn tranh phù hợp (A–F).' },
  { ma: 'n4', ky: 'Nghe', ten: 'Phần 4', huongDan: 'Nghe một câu và câu hỏi, chọn đáp án đúng.' },
  { ma: 'd1', ky: 'Đọc', ten: 'Phần 1', huongDan: 'Đọc câu, chọn tranh phù hợp (A–F).' },
  { ma: 'd2', ky: 'Đọc', ten: 'Phần 2', huongDan: 'Chọn câu trả lời phù hợp cho mỗi câu hỏi (A–E).' },
  { ma: 'd3', ky: 'Đọc', ten: 'Phần 3', huongDan: 'Chọn từ phù hợp điền vào chỗ trống (A–F).' },
  { ma: 'd4', ky: 'Đọc', ten: 'Phần 4', huongDan: 'Đọc câu, trả lời câu hỏi.' },
];
const PHAN_2 = [
  { ma: 'n1', ky: 'Nghe', ten: 'Phần 1', huongDan: 'Nghe một câu, chọn tranh đúng (1 trong 3).' },
  { ma: 'n2', ky: 'Nghe', ten: 'Phần 2', huongDan: 'Nghe hội thoại, chọn tranh phù hợp (A–F).' },
  { ma: 'n3', ky: 'Nghe', ten: 'Phần 3', huongDan: 'Nghe hội thoại và câu hỏi, chọn đáp án đúng.' },
  { ma: 'd1', ky: 'Đọc', ten: 'Phần 1', huongDan: 'Đọc câu, chọn tranh phù hợp (A–F).' },
  { ma: 'd2', ky: 'Đọc', ten: 'Phần 2', huongDan: 'Chọn từ phù hợp điền vào chỗ trống (A–F).' },
  { ma: 'd3', ky: 'Đọc', ten: 'Phần 3', huongDan: 'Chọn câu trả lời phù hợp cho mỗi câu hỏi (A–E).' },
  { ma: 'd4', ky: 'Đọc', ten: 'Phần 4', huongDan: 'Đọc đoạn văn, trả lời câu hỏi ★.' },
  { ma: 'v1', ky: 'Viết', ten: 'Phần 1', huongDan: 'Chọn phần còn thiếu để thành chữ đúng (A–F).' },
  { ma: 'v2', ky: 'Viết', ten: 'Phần 2', huongDan: 'Viết chữ Hán còn thiếu vào ô (có pinyin gợi ý).' },
];
export const CAC_PHAN = PHAN_1;

const TEN_KY = { n: 'Nghe', d: 'Đọc', v: 'Viết' };
const EMOJI_KY = { n: '🎧', d: '📖', v: '✍️' };

// ---------- Dữ liệu ----------
const henDuLieu = {};
function taiDuLieuThi(cap) {
  const tep = `data/thi-thu-hsk${cap}.json`;
  if (!henDuLieu[cap]) {
    henDuLieu[cap] = fetch(tep)
      .then((r) => { if (!r.ok) throw new Error(`Không tìm thấy ${tep} (mã lỗi ${r.status}).`); return r.json(); })
      .catch((e) => { henDuLieu[cap] = null; throw e; });
  }
  return henDuLieu[cap];
}

function tron(mang) {
  const m = mang.slice();
  for (let i = m.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [m[i], m[j]] = [m[j], m[i]];
  }
  return m;
}
const layNgauNhien = (mang, n) => tron(mang).slice(0, n);

/** Chữ Hán có pinyin nhỏ phía trên (như đề cấp 1–2) */
const hanPy = (han, py, lop = '') => `<span class="han-py ${lop}"><span class="py-tren">${esc(py)}</span><span class="han">${esc(han)}</span></span>`;

/** Sắp đề theo thứ tự phần (sort ổn định nên giữ thứ tự trong cùng phần) */
const sapTheoPhan = (de, phan) => {
  const thuTu = phan.map((p) => p.ma);
  return de.sort((a, b) => thuTu.indexOf(a.phan) - thuTu.indexOf(b.phan));
};

/** Câu điền từ: che phần pinyin của từ cần điền */
function cauDienTu(phan, c, tuChung) {
  const tuDung = tuChung.find((w) => w.h === c.dapAn);
  const re = new RegExp(tuDung.p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const pyChe = re.test(c.pinyin) ? c.pinyin.replace(re, '＿＿') : '';
  return { phan, kieu: 'dien', cauF: c, pyChe, tuChung, dung: tuChung.findIndex((w) => w.h === c.dapAn),
    loiGiai: { han: c.cau.replace('（ ）', c.dapAn), py: c.pinyin } };
}

/** Một nhóm hỏi–đáp → 5 câu ghép, dùng chung 5 câu trả lời A–E */
function cauGhep(phan, nhom) {
  const traLoi = tron(nhom.cap.map((c, i) => ({ h: c.a, p: c.ap, i })));
  return nhom.cap.map((c, i) => ({ phan, kieu: 'ghep', cauQ: c, luaChonChung: traLoi, dung: traLoi.findIndex((x) => x.i === i),
    loiGiai: { han: c.q, py: c.qp, dapAn: `${c.a} (${c.ap})` } }));
}

// ---------- Tạo đề HSK 1 ----------
/** Chọn 6 tranh có câu ví dụ, sao cho mỗi tranh trong 5 tranh đầu có một câu chỉ khớp đúng tranh đó */
function chonBoTranhCau(dl, daDungCau) {
  const coCau = dl.tranh.filter((t) => t.cau.length);
  for (let lan = 0; lan < 80; lan++) {
    const sau = layNgauNhien(coCau, 6);
    const idSau = new Set(sau.map((t) => t.id));
    const cauHoi = [];
    for (const t of sau.slice(0, 5)) {
      const hop = tron(t.cau).find((c) => !daDungCau.has(c.han) && c.coTranh.filter((x) => idSau.has(x)).length === 1);
      if (!hop) break;
      cauHoi.push({ tranh: t, cau: hop });
    }
    if (cauHoi.length === 5) {
      cauHoi.forEach((c) => daDungCau.add(c.cau.han));
      return { tranh: tron(sau), cauHoi };
    }
  }
  return null;
}

function taoDe1(dl) {
  const de = [];
  // NGHE 1: nghe một từ, chọn 1 trong 3 tranh cùng nhóm
  const nhom = {};
  dl.tranh.forEach((t) => { (nhom[t.nhom] = nhom[t.nhom] || []).push(t); });
  layNgauNhien(dl.tranh, 5).forEach((t) => {
    const khac = layNgauNhien(nhom[t.nhom].filter((x) => x.id !== t.id), 2);
    const lc = tron([t, ...khac]);
    de.push({ phan: 'n1', kieu: 'tranh3', doc: [t.han, t.han], luaChon: lc.map((x) => ({ emoji: x.emoji })), dung: lc.indexOf(t),
      loiGiai: { han: t.han, py: t.pinyin, nghia: t.nghia, emoji: t.emoji } });
  });
  // Nhóm hỏi–đáp: 1 nhóm cho Đọc 2, các cặp còn lại cho Nghe 2
  const nhomHd = tron(dl.hoiDap);
  layNgauNhien(nhomHd.slice(1).flatMap((n) => n.cap), 5).forEach((c) => {
    const lc = tron([{ h: c.a, p: c.ap, dung: true }, ...c.x]);
    de.push({ phan: 'n2', kieu: 'chon', doc: [c.q, c.q], luaChon: lc.map((x) => ({ h: x.h, p: x.p })), dung: lc.findIndex((x) => x.dung),
      loiGiai: { han: c.q, py: c.qp, dapAn: `${c.a} (${c.ap})` } });
  });
  // NGHE 3 và ĐỌC 1: câu ví dụ ↔ 6 tranh
  const daDungCau = new Set();
  [['n3', chonBoTranhCau(dl, daDungCau)], ['d1', chonBoTranhCau(dl, daDungCau)]].forEach(([phan, bo]) => {
    if (!bo) return;
    bo.cauHoi.forEach(({ tranh, cau }) => {
      de.push({ phan, kieu: 'tranh6', doc: phan === 'n3' ? [cau.han, cau.han] : null, cauHien: phan === 'd1' ? cau : null,
        tranhChung: bo.tranh.map((t) => t.emoji), dung: bo.tranh.indexOf(tranh),
        loiGiai: { han: cau.han, py: cau.pinyin, dich: cau.dich, emoji: tranh.emoji } });
    });
  });
  // Câu hỏi theo câu: 5 cho Nghe 4, 5 cho Đọc 4
  const tc = tron(dl.theoCau);
  [['n4', tc.slice(0, 5)], ['d4', tc.slice(5, 10)]].forEach(([phan, ds]) => {
    ds.forEach((c) => {
      const lc = tron([{ h: c.a, p: c.ap, dung: true }, ...c.x]);
      de.push({ phan, kieu: phan === 'n4' ? 'chon' : 'docHoi', doc: phan === 'n4' ? [c.s, c.h, c.s, c.h] : null,
        cauS: c, luaChon: lc.map((x) => ({ h: x.h, p: x.p })), dung: lc.findIndex((x) => x.dung),
        loiGiai: { han: c.s, py: c.sp, hoi: `${c.h} → ${c.a} (${c.ap})` } });
    });
  });
  // ĐỌC 2: ghép hỏi–đáp trong một nhóm · ĐỌC 3: điền từ (một nhóm 6 từ)
  de.push(...cauGhep('d2', nhomHd[0]));
  const dt = dl.dienTu[Math.floor(Math.random() * dl.dienTu.length)];
  const tuChung = tron(dt.tu);
  tron(dt.cau).forEach((c) => de.push(cauDienTu('d3', c, tuChung)));
  return sapTheoPhan(de, PHAN_1);
}

// ---------- Tạo đề HSK 2 ----------
/**
 * Chọn `soTranh` tranh và `soCau` câu (loai: 'cau' câu kể | 'hoiThoai'), mỗi câu khớp đúng MỘT tranh đang hiện.
 * Trả về { tranh: [tranh đã trộn], cauHoi: [{ tranh, muc }] } hoặc null.
 */
function chonBoTranh2(dl, loai, soTranh, soCau, daDung, boQuaTranh = new Set()) {
  const coMuc = dl.tranh.filter((t) => t[loai].length && !boQuaTranh.has(t.id));
  for (let lan = 0; lan < 100; lan++) {
    const chon = layNgauNhien(coMuc, soTranh);
    const idChon = new Set(chon.map((t) => t.id));
    const cauHoi = [];
    for (const t of chon.slice(0, soCau)) {
      const hop = tron(t[loai]).find((m) => !daDung.has(m) && m.coTranh.filter((x) => idChon.has(x)).length === 1);
      if (!hop) break;
      cauHoi.push({ tranh: t, muc: hop });
    }
    if (cauHoi.length === soCau) {
      cauHoi.forEach((c) => daDung.add(c.muc));
      chon.forEach((t) => boQuaTranh.add(t.id));
      return { tranh: tron(chon), cauHoi };
    }
  }
  return null;
}

function taoDe2(dl) {
  const de = [];
  const daDung = new Set();
  // NGHE 1: nghe một câu kể, chọn 1 trong 3 tranh cùng nhóm
  const nhom = {};
  dl.tranh.forEach((t) => { (nhom[t.nhom] = nhom[t.nhom] || []).push(t); });
  let soN1 = 0;
  for (const t of tron(dl.tranh)) {
    if (soN1 === 5) break;
    const khac = layNgauNhien(nhom[t.nhom].filter((x) => x.id !== t.id), 2);
    const id3 = new Set([t.id, ...khac.map((x) => x.id)]);
    const cau = tron(t.cau).find((c) => !daDung.has(c) && c.coTranh.filter((x) => id3.has(x)).length === 1);
    if (khac.length < 2 || !cau) continue;
    daDung.add(cau);
    const lc = tron([t, ...khac]);
    de.push({ phan: 'n1', kieu: 'tranh3', doc: [cau.han, cau.han], luaChon: lc.map((x) => ({ emoji: x.emoji })), dung: lc.indexOf(t),
      loiGiai: { han: cau.han, py: cau.pinyin, dich: cau.dich, emoji: t.emoji } });
    soN1++;
  }
  // NGHE 2: hai nhóm, mỗi nhóm 6 tranh – 5 hội thoại (tranh của hai nhóm không trùng nhau)
  const daDungTranhN2 = new Set();
  for (let k = 0; k < 2; k++) {
    const bo = chonBoTranh2(dl, 'hoiThoai', 6, 5, daDung, daDungTranhN2);
    if (!bo) continue;
    bo.cauHoi.forEach(({ tranh, muc }) => {
      const [a, b] = muc.cau;
      de.push({ phan: 'n2', kieu: 'tranh6', doc: [a.han, b.han, a.han, b.han], tranhChung: bo.tranh.map((t) => t.emoji),
        dung: bo.tranh.indexOf(tranh), loiGiai: { han: `${a.han} ${b.han}`, py: `${a.pinyin} ${b.pinyin}`, dich: muc.dich, emoji: tranh.emoji } });
    });
  }
  // NGHE 3: 10 hội thoại + câu hỏi
  layNgauNhien(dl.hoi, 10).forEach((c) => {
    const lc = tron([{ h: c.a, p: c.ap, dung: true }, ...c.x]);
    const [a, b] = c.n;
    de.push({ phan: 'n3', kieu: 'chon', doc: [a.han, b.han, c.h, a.han, b.han, c.h], luaChon: lc.map((x) => ({ h: x.h, p: x.p })),
      dung: lc.findIndex((x) => x.dung), loiGiai: { han: `${a.han} ${b.han}`, py: `${a.pinyin} ${b.pinyin}`, hoi: `${c.h} → ${c.a} (${c.ap})` } });
  });
  // ĐỌC 1: câu kể ↔ 6 tranh
  const bo1 = chonBoTranh2(dl, 'cau', 6, 5, daDung);
  if (bo1) {
    bo1.cauHoi.forEach(({ tranh, muc }) => {
      de.push({ phan: 'd1', kieu: 'tranh6', doc: null, cauHien: muc, tranhChung: bo1.tranh.map((t) => t.emoji),
        dung: bo1.tranh.indexOf(tranh), loiGiai: { han: muc.han, py: muc.pinyin, dich: muc.dich, emoji: tranh.emoji } });
    });
  }
  // ĐỌC 2: điền từ (một nhóm 6 từ)
  const dt = dl.dienTu[Math.floor(Math.random() * dl.dienTu.length)];
  const tuChung = tron(dt.tu);
  tron(dt.cau).forEach((c) => de.push(cauDienTu('d2', c, tuChung)));
  // ĐỌC 3: hai nhóm ghép hỏi–đáp
  layNgauNhien(dl.hoiDap, 2).forEach((n) => de.push(...cauGhep('d3', n)));
  // ĐỌC 4: 5 đoạn văn + câu hỏi ★
  layNgauNhien(dl.doan, 5).forEach((c) => {
    const lc = tron([{ h: c.a, p: c.ap, dung: true }, ...c.x]);
    de.push({ phan: 'd4', kieu: 'docHoi', cauS: { s: c.p, sp: c.pp, h: c.h, hp: c.hp }, luaChon: lc.map((x) => ({ h: x.h, p: x.p })),
      dung: lc.findIndex((x) => x.dung), loiGiai: { han: c.p, py: c.pp, hoi: `${c.h} → ${c.a} (${c.ap})` } });
  });
  // VIẾT 1: 5 chữ thiếu một phần, 5 phần khác nhau + 1 phần nhiễu → 6 lựa chọn A–F
  const boDaChon = [];
  for (const b of tron(dl.boThu)) {
    if (boDaChon.length === 5) break;
    if (!boDaChon.some((x) => x.bo === b.bo || x.tu === b.tu)) boDaChon.push(b);
  }
  const boNhieu = tron(dl.boThu.map((b) => b.bo).filter((x) => !boDaChon.some((y) => y.bo === x)))[0];
  const boChung = tron([...boDaChon.map((b) => b.bo), boNhieu].filter(Boolean));
  boDaChon.forEach((b) => {
    de.push({ phan: 'v1', kieu: 'boThu', bt: b, boChung, dung: boChung.indexOf(b.bo),
      loiGiai: { han: b.tu, py: b.py, dapAn: `${b.chu} = ${b.bo} + ${b.conLai}` } });
  });
  // VIẾT 2: viết tay 5 chữ khác nhau
  const vietDaChon = [];
  for (const v of tron(dl.viet)) {
    if (vietDaChon.length === 5) break;
    if (!vietDaChon.some((x) => x.chu === v.chu)) vietDaChon.push(v);
  }
  vietDaChon.forEach((v) => {
    de.push({ phan: 'v2', kieu: 'vietChu', vc: v, dung: null,
      loiGiai: { han: v.cau.replace('（ ）', v.chu), py: v.pinyin, dich: v.dich, dapAn: v.chu } });
  });
  return sapTheoPhan(de, PHAN_2);
}

// ---------- Cấu hình theo cấp ----------
const CAU_HINH = {
  1: { phan: PHAN_1, taoDe: taoDe1, soCau: 40, phut: 35, gioiHan: { d: 20 }, sach: '《新HSK教程 1》',
    cauTruc: [
      ['🎧 Nghe', '20 câu', ['P1 · Nghe, chọn 1 trong 3 tranh', 'P2 · Nghe câu, chọn câu đáp lại', 'P3 · Nghe câu, chọn tranh (A–F)', 'P4 · Nghe câu + câu hỏi, chọn đáp án']],
      ['📖 Đọc', '20 câu · 20 phút', ['P1 · Đọc câu, chọn tranh (A–F)', 'P2 · Ghép câu hỏi với câu trả lời', 'P3 · Chọn từ điền vào chỗ trống', 'P4 · Đọc câu, trả lời câu hỏi']],
    ] },
  2: { phan: PHAN_2, taoDe: taoDe2, soCau: 60, phut: 55, gioiHan: { d: 25, v: 10 }, sach: '《新HSK教程 2》',
    cauTruc: [
      ['🎧 Nghe', '25 câu', ['P1 · Nghe câu, chọn 1 trong 3 tranh', 'P2 · Nghe hội thoại, chọn tranh (A–F)', 'P3 · Nghe hội thoại + câu hỏi, chọn đáp án']],
      ['📖 Đọc', '25 câu · 25 phút', ['P1 · Đọc câu, chọn tranh (A–F)', 'P2 · Chọn từ điền vào chỗ trống', 'P3 · Ghép câu hỏi với câu trả lời', 'P4 · Đọc đoạn văn, trả lời câu hỏi']],
      ['✍️ Viết', '10 câu · 10 phút', ['P1 · Chọn phần còn thiếu của chữ', 'P2 · Viết tay chữ còn thiếu (có pinyin)']],
    ] },
};

/** Câu trả lời có đúng không */
function laDung(c, tl) {
  if (c.kieu === 'vietChu') return !!(tl && tl.xong && tl.loi <= LOI_VIET_TOI_DA);
  return tl === c.dung;
}

// =========================================================
// TRANG GIỚI THIỆU
// =========================================================
let capXem = 1;
export function veThiThu(khung, capChon) {
  if (capChon) capXem = capChon;
  const cap = capXem;
  const ch = CAU_HINH[cap];
  const lichSu = (layTienDo().thiThu || []).filter((x) => (x.cap || 1) === cap).reverse();
  const tt = tinhTrangPhatAm();
  const tot = lichSu.length ? Math.max(...lichSu.map((x) => x.diem)) : null;
  const bang = ch.cauTruc.map(([ten, so, dong]) => dong.map((d, i) => `<tr>${i === 0
    ? `<th rowspan="${dong.length}">${ten}<br><small>${so}</small></th>` : ''}<td>${d}</td></tr>`).join('')).join('');
  khung.innerHTML = `
    <div class="hang-chip" style="margin-top:4px">${[1, 2].map((c) => `<button class="chip ${c === cap ? 'dang-chon' : ''}" data-cap="${c}">HSK ${c}</button>`).join('')}</div>
    <section class="khung gioi-thieu-thi" style="margin-top:12px">
      <div class="goc-the"><span class="nhan nhan-chinh">📋 HSK ${cap} · đề mô phỏng</span><span class="chu-phu nho">${ch.soCau} câu · ~${ch.phut} phút</span></div>
      <h2>Thi thử HSK ${cap}</h2>
      <table class="bang-cau-truc">${bang}</table>
      <p class="chu-phu nho">Điểm quy về thang 200 · <b>đạt từ ${DIEM_DAT} điểm</b>. Mỗi câu nghe được đọc 2 lần (như thi thật).
        ${cap > 1 ? 'Phần viết tay: viết đúng thứ tự nét, sai tối đa 3 nét vẫn tính đúng. ' : ''}
        Cấu trúc theo đề thi thử trong sách bài tập ${ch.sach} (2026); câu hỏi tự soạn, tranh là biểu tượng – <b>không phải đề chính thức</b>.</p>
      ${tt === 'khong-ho-tro' || tt === 'khong-co-giong' ? '<p class="can-kiem-tra">⚠️ Máy chưa có giọng đọc tiếng Trung nên phần Nghe sẽ không có tiếng. Xem cách cài trong Cài đặt.</p>' : ''}
      <label class="dong-cai-dat" style="border:0;padding:6px 0"><span>Cho phép bấm nghe lại (thi thật không có)</span>
        <input type="checkbox" id="cho-nghe-lai"></label>
      <a class="nut nut-chinh nut-rong" href="#/thi-thu/lam${cap > 1 ? `/${cap}` : ''}" id="nut-bat-dau"><span class="emoji">📋</span> Bắt đầu thi HSK ${cap}</a>
    </section>
    <h3 class="tieu-de-muc">Lịch sử thi thử HSK ${cap} <small>${lichSu.length ? `cao nhất ${tot}/200` : ''}</small></h3>
    ${lichSu.length ? `<div class="khung">${lichSu.slice(0, 10).map((x) => `
      <div class="dong-lich-su-thi">
        <span class="giua"><b>${x.diem}/200</b> <span class="nhan ${x.diem >= DIEM_DAT ? 'nhan-dat' : ''}">${x.diem >= DIEM_DAT ? '✅ Đạt' : 'Chưa đạt'}</span>
          <span class="chu-phu nho">${(x.cap || 1) > 1
            ? `Nghe ${x.nghe}/25 · Đọc ${x.doc}/25 · Viết ${x.viet}/10`
            : `Nghe ${x.nghe}/100 · Đọc ${x.doc}/100`} · ${Math.round(x.giay / 60)} phút</span></span>
        <span class="chu-phu nho">${new Date(x.luc).toLocaleDateString('vi-VN')}</span>
      </div>`).join('')}</div>` : '<p class="chu-phu">Chưa thi lần nào.</p>'}`;
  khung.querySelectorAll('[data-cap]').forEach((b) => { b.onclick = () => veThiThu(khung, Number(b.dataset.cap)); });
  const $cho = khung.querySelector('#cho-nghe-lai');
  try { $cho.checked = sessionStorage.getItem('mayi-thi-nghe-lai') === '1'; } catch { /* bỏ qua */ }
  $cho.onchange = () => { try { sessionStorage.setItem('mayi-thi-nghe-lai', $cho.checked ? '1' : '0'); } catch { /* bỏ qua */ } };
}

// =========================================================
// LÀM BÀI
// =========================================================
export function veLamBai(khung, cap = 1) {
  const ch = CAU_HINH[cap] || CAU_HINH[1];
  let daRoi = false;
  let henGio = null;
  let writer = null;              // bảng viết chữ đang mở (phần Viết 2)
  const $dongHo = document.getElementById('dong-ho');
  let choNgheLai = false;
  try { choNgheLai = sessionStorage.getItem('mayi-thi-nghe-lai') === '1'; } catch { /* bỏ qua */ }
  khung.innerHTML = '<div class="dang-tai">Đang tạo đề…</div>';

  const huyViet = () => { try { writer?.cancelQuiz(); } catch { /* bỏ qua */ } writer = null; };

  taiDuLieuThi(cap).then((dl) => {
    if (daRoi) return;
    const de = ch.taoDe(dl);
    const traLoi = new Array(de.length).fill(null);
    if (typeof window.__ghiDeThi === 'function') window.__ghiDeThi(de);   // chỉ dùng khi chạy thử tự động
    let viTri = 0;
    let giayDaLam = 0;
    const conGiay = Object.fromEntries(Object.entries(ch.gioiHan).map(([k, phut]) => [k, phut * 60]));
    const daKhoa = new Set();     // phần đã hết giờ (không quay lại được)
    const daNghe = new Set();     // câu nghe đã phát tự động
    let daNop = false;

    document.body.classList.add('dang-hoc');
    $dongHo.hidden = false;

    const kyCua = (c) => c.phan[0];               // 'n' | 'd' | 'v'
    const laNghe = (c) => kyCua(c) === 'n';
    const veDongHo = () => {
      const c = de[viTri];
      const k = c ? kyCua(c) : 'n';
      if (conGiay[k] != null) {
        const s = Math.max(0, conGiay[k]);
        $dongHo.textContent = `${EMOJI_KY[k]} còn ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
        $dongHo.classList.toggle('sap-het', s <= 120);
      } else {
        $dongHo.textContent = `🎧 ${Math.floor(giayDaLam / 60)}:${String(giayDaLam % 60).padStart(2, '0')}`;
        $dongHo.classList.remove('sap-het');
      }
    };
    function hetGio(k) {
      daKhoa.add(k);
      let cuoi = -1;
      de.forEach((c, i) => { if (kyCua(c) === k) cuoi = i; });
      const tiep = de.findIndex((c, i) => i > cuoi && !daKhoa.has(kyCua(c)));
      if (tiep >= 0) {
        thongBao(`Hết giờ phần ${TEN_KY[k]} – chuyển sang phần ${TEN_KY[kyCua(de[tiep])]}.`);
        viTri = tiep;
        veCau();
      } else {
        thongBao('Hết giờ – tự động nộp bài.');
        nopBai();
      }
    }
    henGio = setInterval(() => {
      if (document.visibilityState !== 'visible' || daNop) return;
      giayDaLam++;
      const c = de[viTri];
      const k = kyCua(c);
      congGiay({ n: 'nghe', d: 'nguPhap', v: 'viet' }[k], 1);   // tính vào phút học của phần tương ứng
      if (conGiay[k] != null) {
        conGiay[k]--;
        if (conGiay[k] <= 0) { hetGio(k); return; }
      }
      veDongHo();
      if (giayDaLam % 15 === 0) luu();
    }, 1000);

    function nghe(c) {
      if (c.doc) docLanLuot(c.doc);
    }

    /** Phần thân câu hỏi theo kiểu câu */
    function htmlThan(c, daChon, nutLc) {
      switch (c.kieu) {
        case 'tranh3':
          return `<div class="luoi-tranh ba">${c.luaChon.map((x, i) => nutLc(i, `<span class="emoji tranh">${x.emoji}</span>`)).join('')}</div>`;
        case 'chon':
          return `<div class="ds-lua-chon-thi">${c.luaChon.map((x, i) => nutLc(i, hanPy(x.h, x.p))).join('')}</div>`;
        case 'tranh6':
          return `${c.cauHien ? `<p class="cau-thi">${hanPy(c.cauHien.han, c.cauHien.pinyin)}</p>` : ''}
            <div class="luoi-tranh sau">${c.tranhChung.map((e, i) => nutLc(i, `<span class="emoji tranh">${e}</span>`)).join('')}</div>`;
        case 'ghep':
          return `<p class="cau-thi">${hanPy(c.cauQ.q, c.cauQ.qp)}</p>
            <div class="ds-lua-chon-thi">${c.luaChonChung.map((x, i) => nutLc(i, hanPy(x.h, x.p))).join('')}</div>`;
        case 'dien': {
          const [truoc, sau] = c.cauF.cau.split('（ ）');
          return `<div class="kho-tu-thi">${c.tuChung.map((w, i) => `<span class="o-tu-thi"><b>${CHU_CAI[i]}</b> ${hanPy(w.h, w.p)}</span>`).join('')}</div>
            <p class="cau-thi">${c.pyChe ? `<span class="py-tren-cau">${esc(c.pyChe)}</span>` : ''}<span class="han">${esc(truoc)}<span class="o-dien">（${daChon !== null ? esc(c.tuChung[daChon].h) : '　'}）</span>${esc(sau)}</span></p>
            <div class="luoi-chu-cai">${c.tuChung.map((w, i) => nutLc(i, '', 'nho')).join('')}</div>`;
        }
        case 'docHoi':
          return `<p class="cau-thi">${hanPy(c.cauS.s, c.cauS.sp)}</p>
            <p class="cau-thi hoi">★ ${hanPy(c.cauS.h, c.cauS.hp)}</p>
            <div class="ds-lua-chon-thi">${c.luaChon.map((x, i) => nutLc(i, hanPy(x.h, x.p))).join('')}</div>`;
        case 'boThu': {
          const b = c.bt;
          const truoc = b.tu.slice(0, b.viTri);
          const sau = b.tu.slice(b.viTri + 1);
          return `<div class="kho-tu-thi">${c.boChung.map((x, i) => `<span class="o-tu-thi"><b>${CHU_CAI[i]}</b> <span class="han bo-thu">${esc(x)}</span></span>`).join('')}</div>
            <p class="cau-thi tu-thieu"><span class="py-tren-cau">${esc(b.py)}</span><span class="han">${esc(truoc)}<span class="o-thieu">${esc(b.conLai)}</span>${esc(sau)}</span></p>
            <p class="chu-phu nho" style="text-align:center">Chữ trong ô nét đứt đang thiếu một phần. Chọn phần còn thiếu${daChon !== null ? ` · đã chọn <b class="han">${esc(c.boChung[daChon])}</b>` : ''}.</p>
            <div class="luoi-chu-cai">${c.boChung.map((x, i) => nutLc(i, '', 'nho')).join('')}</div>`;
        }
        case 'vietChu': {
          const v = c.vc;
          const [truoc, sau] = v.cau.split('（ ）');
          const tl = daChon;
          return `<p class="cau-thi"><span class="py-tren-cau">${esc(v.pinyin)}</span><span class="han">${esc(truoc)}<span class="o-dien">（${tl?.xong ? esc(v.chu) : '　'}）</span>${esc(sau)}</span></p>
            <div class="o-viet o-viet-thi" id="o-viet-thi"></div>
            <p class="chu-phu nho" id="loi-nhan-viet" style="text-align:center">${tl
              ? (tl.xong ? '✓ Đã viết xong câu này.' : 'Đã bỏ qua câu này.')
              : 'Viết chữ còn thiếu vào ô, theo đúng thứ tự nét.'}</p>
            ${tl ? '' : '<div class="hang-nut" style="justify-content:center"><button class="nut nut-nho" id="nut-bo-qua-viet">Không biết – bỏ qua</button></div>'}`;
        }
        default:
          return '';
      }
    }

    /** Mở bảng viết tay cho câu vietChu chưa làm */
    async function moBangViet(c, idx) {
      const $o = khung.querySelector('#o-viet-thi');
      if (!$o) return;
      const tl = traLoi[idx];
      try {
        if (tl) {
          if (tl.xong) await taoBangVe($o, c.vc.chu, { showOutline: false });
          else $o.innerHTML = '';
          return;
        }
        writer = await taoBangVe($o, c.vc.chu, { showCharacter: false, showOutline: false });
        if (daRoi || viTri !== idx) { huyViet(); return; }
        const $nhan = khung.querySelector('#loi-nhan-viet');
        writer.quiz({
          showHintAfterMisses: 3,
          onMistake: (d) => {
            if ($nhan) $nhan.textContent = `Nét chưa đúng (đã sai ${d.totalMistakes} lần).`;
            if (d.totalMistakes >= LOI_VIET_DUNG_LAI && !traLoi[idx]) {
              huyViet();
              traLoi[idx] = { xong: false, loi: d.totalMistakes };
              if (viTri === idx) veCau();
            }
          },
          onComplete: (kq) => {
            traLoi[idx] = { xong: true, loi: kq.totalMistakes };
            writer = null;
            if (viTri === idx) veCau();
          },
        });
      } catch (e) {
        $o.innerHTML = `<p class="loi">${esc(e.message)}</p>`;
      }
    }

    function veCau() {
      if (daRoi) return;
      huyViet();
      const c = de[viTri];
      const p = ch.phan.find((x) => x.ma === c.phan);
      const dau = viTri === 0 || de[viTri - 1].phan !== c.phan;
      const daChon = traLoi[viTri];
      const nutLc = (i, noiDung, lop = '') => `<button class="nut-thi ${lop} ${daChon === i ? 'dang-chon' : ''}" data-i="${i}"><b class="chu-cai">${CHU_CAI[i]}</b>${noiDung}</button>`;
      const than = htmlThan(c, daChon, nutLc);
      const conNgheLai = laNghe(c) && choNgheLai;
      const truocBiKhoa = viTri === 0 || daKhoa.has(kyCua(de[viTri - 1]));
      khung.innerHTML = `
        <div class="phien">
          <div class="tien-do-phien">
            <div class="thanh-tien-do"><span style="width:${(traLoi.filter((x) => x !== null).length / de.length) * 100}%"></span></div>
            <span class="dem">Câu ${viTri + 1}/${de.length}</span>
          </div>
          <div class="khung the-thi">
            <div class="goc-the"><span class="nhan nhan-chinh">${EMOJI_KY[kyCua(c)]} ${p.ky} · ${p.ten}</span>
              <span class="chu-phu nho">${p.huongDan}</span></div>
            ${laNghe(c) ? `<div class="hang-nghe-thi">
              <span class="emoji" style="font-size:1.6rem">🔊</span>
              <span class="chu-phu nho" id="trang-thai-nghe">${dau ? 'Bắt đầu phần mới…' : 'Đang đọc (2 lần)…'}</span>
              ${conNgheLai ? `<button class="nut nut-nho" id="nut-nghe-lai">${bieuTuong('loa')} Nghe lại</button>` : ''}
            </div>` : ''}
            ${than}
          </div>
          <div class="hang-nut dieu-huong-thi">
            <button class="nut" id="nut-truoc" ${truocBiKhoa ? 'disabled' : ''}>‹ Câu trước</button>
            ${viTri + 1 < de.length
              ? `<button class="nut nut-chinh" id="nut-sau">Câu sau ›</button>`
              : '<button class="nut nut-chinh" id="nut-nop">Nộp bài ✓</button>'}
          </div>
        </div>`;
      khung.querySelectorAll('[data-i]').forEach((b) => {
        b.onclick = () => { traLoi[viTri] = Number(b.dataset.i); veCau(); };
      });
      khung.querySelector('#nut-truoc').onclick = () => { if (!truocBiKhoa) { viTri--; veCau(); } };
      khung.querySelector('#nut-sau')?.addEventListener('click', () => { viTri++; veCau(); });
      khung.querySelector('#nut-nop')?.addEventListener('click', () => {
        const chuaLam = traLoi.filter((x) => x === null).length;
        if (chuaLam && !confirm(`Còn ${chuaLam} câu chưa trả lời. Nộp bài luôn?`)) return;
        nopBai();
      });
      khung.querySelector('#nut-nghe-lai')?.addEventListener('click', () => nghe(c));
      khung.querySelector('#nut-bo-qua-viet')?.addEventListener('click', () => {
        huyViet();
        traLoi[viTri] = { xong: false, loi: 0, boQua: true };
        veCau();
      });
      if (c.kieu === 'vietChu') moBangViet(c, viTri);
      veDongHo();
      // Câu nghe: tự đọc 2 lần khi vào câu lần đầu
      if (laNghe(c) && !daNghe.has(viTri)) {
        daNghe.add(viTri);
        setTimeout(() => {
          if (daRoi || de[viTri] !== c) return;
          docLanLuot(c.doc).then(() => {
            const $tt = khung.querySelector('#trang-thai-nghe');
            if ($tt && de[viTri] === c) $tt.textContent = 'Đã đọc xong – chọn đáp án.';
          });
          const $tt = khung.querySelector('#trang-thai-nghe');
          if ($tt) $tt.textContent = 'Đang đọc (2 lần)…';
        }, dau ? 900 : 350);
      } else if (laNghe(c)) {
        const $tt = khung.querySelector('#trang-thai-nghe');
        if ($tt) $tt.textContent = 'Đã nghe câu này.';
      }
    }

    function nopBai() {
      if (daNop) return;
      daNop = true;
      huyViet();
      clearInterval(henGio);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      $dongHo.hidden = true;
      document.body.classList.remove('dang-hoc');
      const dung = de.map((c, i) => laDung(c, traLoi[i]));
      const dem = (k) => de.reduce((s, c, i) => s + (kyCua(c) === k && dung[i] ? 1 : 0), 0);
      const soDung = dung.filter(Boolean).length;
      const tong = Math.round((soDung * 200) / de.length);
      const ketQua = cap === 1
        ? { cap: 1, nghe: dem('n') * 5, doc: dem('d') * 5 }
        : { cap, nghe: dem('n'), doc: dem('d'), viet: dem('v') };
      const td = layTienDo();
      td.thiThu = [...(td.thiThu || []), { ...ketQua, luc: new Date().toISOString(), diem: tong, giay: giayDaLam }].slice(-30);
      const nk = nhatKyHomNay();
      nk.thiThu = (nk.thiThu || 0) + 1;
      luu();
      veKetQua(dung, tong, ketQua);
    }

    /** Mô tả câu trả lời của người thi (cho phần xem lại) */
    function moTaTraLoi(c, tl) {
      if (c.kieu === 'vietChu') {
        if (!tl) return 'chưa làm';
        if (tl.boQua) return 'bỏ qua';
        return tl.xong ? `viết xong, sai ${tl.loi} nét` : `dừng sau ${tl.loi} nét sai`;
      }
      return `bạn chọn <b>${tl === null ? '—' : CHU_CAI[tl]}</b> · đáp án <b>${CHU_CAI[c.dung]}</b>`;
    }

    function veKetQua(dung, tong, kq) {
      const dat = tong >= DIEM_DAT;
      const theoPhan = ch.phan.map((p) => {
        const cs = de.map((c, i) => [c, i]).filter(([c]) => c.phan === p.ma);
        return `<tr><td>${p.ky} ${p.ten}</td><td><b>${cs.filter(([, i]) => dung[i]).length}</b>/${cs.length}</td></tr>`;
      }).join('');
      const xemLai = de.map((c, i) => {
        const p = ch.phan.find((x) => x.ma === c.phan);
        const lg = c.loiGiai;
        return `<div class="dong-xem-lai ${dung[i] ? 'dung' : 'sai'}">
          <div class="dong-tren"><b>Câu ${i + 1} · ${p.ky} ${p.ten}</b>
            <span>${dung[i] ? '✅' : '❌'} ${moTaTraLoi(c, traLoi[i])}</span></div>
          <div class="noi-dung-xem-lai">
            ${lg.emoji ? `<span class="emoji tranh-nho">${lg.emoji}</span>` : ''}
            <span><span class="han">${esc(lg.han)}</span> <span class="pinyin">${toMauPinyin(lg.py)}</span>
            ${lg.nghia ? `<br><span class="chu-phu nho">${esc(lg.nghia)}</span>` : ''}
            ${lg.dich ? `<br><span class="chu-phu nho">${esc(lg.dich)}</span>` : ''}
            ${lg.dapAn ? `<br><span class="chu-phu nho">Trả lời đúng: <span class="han">${esc(lg.dapAn)}</span></span>` : ''}
            ${lg.hoi ? `<br><span class="chu-phu nho">Câu hỏi: <span class="han">${esc(lg.hoi)}</span></span>` : ''}</span>
          </div>
        </div>`;
      }).join('');
      const tomTat = cap === 1
        ? `Nghe ${kq.nghe}/100 · Đọc ${kq.doc}/100`
        : `Nghe ${kq.nghe}/25 · Đọc ${kq.doc}/25 · Viết ${kq.viet}/10 câu đúng`;
      khung.innerHTML = `
        <div class="ket-thuc">
          <div class="emoji emoji-to">${dat ? '🏆' : '💪'}</div>
          <h2>${tong}/200 điểm</h2>
          <p><span class="nhan ${dat ? 'nhan-dat' : ''}" style="font-size:.95rem">${dat ? '✅ Đạt (từ 120 điểm)' : `Chưa đạt – cần thêm ${DIEM_DAT - tong} điểm`}</span></p>
          <p class="chu-phu">${tomTat} · ${Math.round(giayDaLam / 60)} phút</p>
          <div class="khung" style="width:100%"><table class="bang-diem-phan">${theoPhan}</table></div>
          <a class="nut nut-chinh nut-rong" href="#/thi-thu" id="nut-thi-lai">📋 Thi đề khác</a>
          <a class="nut nut-rong" href="#/">🏠 Về trang Hôm nay</a>
        </div>
        <h3 class="tieu-de-muc">Xem lại từng câu</h3>
        <div class="ds-xem-lai">${xemLai}</div>`;
    }

    // Nút quay lại khi đang thi: hỏi trước khi bỏ bài
    const $quayLai = document.getElementById('nut-quay-lai');
    $quayLai.onclick = () => {
      if (daNop || confirm('Thoát bây giờ thì bài thi này sẽ không được tính. Thoát?')) location.hash = '#/thi-thu';
    };
    veCau();
  }).catch((e) => {
    if (!daRoi) khung.innerHTML = `<div class="loi">${esc(e.message)}</div>`;
  });

  return () => {
    daRoi = true;
    huyViet();
    clearInterval(henGio);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    $dongHo.hidden = true;
    $dongHo.classList.remove('sap-het');
    document.body.classList.remove('dang-hoc');
    luu();
  };
}

/** Điểm thi thử cao nhất của một cấp (cho trang Thống kê); null nếu chưa thi */
export const diemThiCaoNhat = (cap = 1) => {
  const ls = (layTienDo().thiThu || []).filter((x) => (x.cap || 1) === cap);
  return ls.length ? Math.max(...ls.map((x) => x.diem)) : null;
};
