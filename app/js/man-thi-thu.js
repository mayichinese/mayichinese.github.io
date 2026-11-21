// =========================================================
// THI THỬ HSK 1 / 2 / 3 (Giai đoạn 5.2, 5.3, 5.4) – ĐỀ MÔ PHỎNG, không phải đề chính thức
//   #/thi-thu            giới thiệu cấu trúc đề + lịch sử điểm (chọn cấp HSK 1 / 2 / 3)
//   #/thi-thu/lam        làm một đề HSK 1 (40 câu)     #/thi-thu/lam/2  đề HSK 2 (60 câu)   #/thi-thu/lam/3  đề HSK 3 (70 câu)
// Cấu trúc theo đề thi thử trong sách bài tập 《新HSK教程 1》, 《新HSK教程 2》, 《新HSK教程 3》 (2026):
//   HSK 1 – NGHE 20: P1 nghe chọn 1/3 tranh · P2 nghe câu, chọn câu đáp · P3 nghe câu, chọn tranh A–F · P4 nghe câu + hỏi
//           ĐỌC 20 (20 phút): P1 câu ↔ tranh · P2 ghép hỏi–đáp · P3 điền từ · P4 đọc câu, trả lời
//   HSK 2 – NGHE 25: P1 nghe câu chọn 1/3 tranh · P2 nghe hội thoại chọn tranh A–F (2 nhóm) · P3 hội thoại + câu hỏi
//           ĐỌC 25 (25 phút): P1 câu ↔ tranh · P2 điền từ · P3 ghép hỏi–đáp (2 nhóm) · P4 đoạn văn + câu hỏi ★
//           VIẾT 10 (10 phút): P1 chọn phần còn thiếu của chữ · P2 viết tay một chữ (Hanzi Writer chấm theo nét)
//   HSK 3 – NGHE 30: P1 nghe hội thoại chọn tranh (2 nhóm: 6 tranh + 5 tranh) · P2 hội thoại + câu hỏi · P3 nghe một đoạn + câu hỏi
//           ĐỌC 30 (30 phút): P1 ghép câu với câu đáp (2 nhóm) · P2 điền từ (5 câu + 5 hội thoại) · P3 đoạn văn + câu hỏi ★
//           VIẾT 10 (20 phút): P1 viết tay chữ còn thiếu · P2 nhìn tranh + từ cho sẵn, sắp xếp mảnh thành câu
//           (đề thật P2 là tự viết câu – app không chấm được câu tự do nên đổi thành sắp xếp, tự chấm)
// Dữ liệu: data/thi-thu-hsk1.json (cong-cu/ghep-thi-thu.py), data/thi-thu-hsk2.json (cong-cu/ghep-thi-thu-2.py),
//          data/thi-thu-hsk3.json (cong-cu/ghep-thi-thu-3.py).
// Điểm: theo cách chấm của 汉考国际 (CTI) – mỗi phần nghe / đọc / viết tối đa 100 điểm (số câu đúng ÷ số câu × 100),
// tổng = cộng các phần → HSK 1: 200, HSK 2 và 3: 300. Đạt từ 60% tổng (120 / 180) theo quy ước kỳ thi cũ –
// thang chính thức của kỳ thi mới (áp dụng 7/2026) chưa công bố. Lần thi đã lưu được tính lại theo thang này.
// Mỗi câu có "kieu" quyết định cách hiện: tranh3, chon, tranh6, ghep, dien, docHoi, boThu, vietChu, xepCau.
// =========================================================

import { layTienDo, luu, nhatKyHomNay, congGiay } from './luu-tru.js';
import { docLanLuot, tinhTrangPhatAm } from './phat-am.js';
import { esc, thongBao } from './giao-dien.js';
import { tatCaTu } from './du-lieu.js';
import { bieuTuong } from './bieu-tuong.js';
import { toMauPinyin, tachPinyin, demChuHan } from './pinyin.js';
import { taoBangVe, taiNetChu, saiToiDa } from './net-chu.js';
import { capMo, htmlCachMoKhoa, layCapVuaMo } from './cap-do.js';

const CHU_CAI = 'ABCDEF';
// viết chữ: hoàn thành với số nét sai ≤ saiToiDa(số nét của chữ) thì tính đúng (net-chu.js)
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
const PHAN_3 = [
  { ma: 'n1', ky: 'Nghe', ten: 'Phần 1', huongDan: 'Nghe hội thoại, chọn tranh phù hợp.' },
  { ma: 'n2', ky: 'Nghe', ten: 'Phần 2', huongDan: 'Nghe hội thoại và câu hỏi, chọn đáp án đúng.' },
  { ma: 'n3', ky: 'Nghe', ten: 'Phần 3', huongDan: 'Nghe một đoạn và câu hỏi, chọn đáp án đúng.' },
  { ma: 'd1', ky: 'Đọc', ten: 'Phần 1', huongDan: 'Chọn câu đáp lại phù hợp (A–E).' },
  { ma: 'd2', ky: 'Đọc', ten: 'Phần 2', huongDan: 'Chọn từ phù hợp điền vào chỗ trống (A–F).' },
  { ma: 'd3', ky: 'Đọc', ten: 'Phần 3', huongDan: 'Đọc đoạn văn, trả lời câu hỏi ★.' },
  { ma: 'v1', ky: 'Viết', ten: 'Phần 1', huongDan: 'Viết chữ Hán còn thiếu vào ô (có pinyin gợi ý).' },
  { ma: 'v2', ky: 'Viết', ten: 'Phần 2', huongDan: 'Nhìn tranh, dùng từ cho sẵn: sắp xếp các mảnh thành câu.' },
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

/** Đề đang làm có ẩn pinyin không (HSK 3: đề thật không in pinyin – mẫu đề 汉考国际 12/2025) */
let anPinyin = false;
/** Chữ Hán có pinyin nhỏ phía trên (như đề cấp 1–2); đề ẩn pinyin thì chỉ có chữ Hán */
const hanPy = (han, py, lop = '') => (anPinyin
  ? `<span class="han-py ${lop}"><span class="han">${esc(han)}</span></span>`
  : `<span class="han-py ${lop}"><span class="py-tren">${esc(py)}</span><span class="han">${esc(han)}</span></span>`);

/** Pinyin của chữ ở chỗ trống （ ） trong câu (đề viết HSK 3 chỉ ghi pinyin của chữ cần viết) */
function pinyinChoTrong(cau, chu, pinyin) {
  const [truoc] = cau.split('（ ）');
  const viTri = demChuHan(truoc);
  const am = tachPinyin(pinyin, demChuHan(cau.replace('（ ）', chu))).filter((x) => x.thanh !== undefined);
  return am[viTri] ? am[viTri].chu.toLowerCase() : null;
}

/** Sắp đề theo thứ tự phần (sort ổn định nên giữ thứ tự trong cùng phần) */
const sapTheoPhan = (de, phan) => {
  const thuTu = phan.map((p) => p.ma);
  return de.sort((a, b) => thuTu.indexOf(a.phan) - thuTu.indexOf(b.phan));
};

/**
 * Câu điền từ: che phần pinyin của từ cần điền.
 * Câu hội thoại (HSK 3) gồm hai lượt lời nối bằng ／ (cả chữ Hán lẫn pinyin) → mỗi lượt một dòng.
 */
const NOI_LUOT = '／';
function cauDienTu(phan, c, tuChung) {
  const tuDung = tuChung.find((w) => w.h === c.dapAn);
  const re = new RegExp(tuDung.p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const hanLuot = c.cau.split(NOI_LUOT);
  const pyLuot = c.pinyin.split(NOI_LUOT);
  const dong = hanLuot.map((han, i) => {
    const py = (pyLuot[i] || '').trim();
    const coCho = han.includes('（ ）');
    return { han, py: coCho ? (re.test(py) ? py.replace(re, '＿＿') : '') : py };
  });
  return { phan, kieu: 'dien', cauF: c, dong, hoiThoai: dong.length > 1, tuChung, dung: tuChung.findIndex((w) => w.h === c.dapAn),
    loiGiai: { han: hanLuot.map((h) => h.replace('（ ）', c.dapAn)).join(' – '), py: pyLuot.map((p) => p.trim()).join(' – ') } };
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

// ---------- Tạo đề HSK 3 ----------
/** Câu hỏi 3 lựa chọn từ một mục { a, ap, x: [{h,p}] } */
const luaChon3 = (c) => tron([{ h: c.a, p: c.ap, dung: true }, ...c.x]);

function taoDe3(dl) {
  const de = [];
  const daDung = new Set();
  // NGHE 1: hai nhóm hội thoại ↔ tranh (nhóm 1: 6 tranh, nhóm 2: 5 tranh; tranh hai nhóm không trùng)
  const daDungTranh = new Set();
  [6, 5].forEach((soTranh) => {
    const bo = chonBoTranh2(dl, 'hoiThoai', soTranh, 5, daDung, daDungTranh);
    if (!bo) return;
    bo.cauHoi.forEach(({ tranh, muc }) => {
      const [a, b] = muc.cau;
      de.push({ phan: 'n1', kieu: 'tranh6', doc: [a.han, b.han, a.han, b.han], tranhChung: bo.tranh.map((t) => t.emoji),
        dung: bo.tranh.indexOf(tranh), loiGiai: { han: `${a.han} ${b.han}`, py: `${a.pinyin} ${b.pinyin}`, dich: muc.dich, emoji: tranh.emoji } });
    });
  });
  // NGHE 2: 10 hội thoại + câu hỏi
  layNgauNhien(dl.hoi, 10).forEach((c) => {
    const lc = luaChon3(c);
    const [a, b] = c.n;
    de.push({ phan: 'n2', kieu: 'chon', doc: [a.han, b.han, c.h, a.han, b.han, c.h], luaChon: lc.map((x) => ({ h: x.h, p: x.p })),
      dung: lc.findIndex((x) => x.dung), loiGiai: { han: `${a.han} ${b.han}`, py: `${a.pinyin} ${b.pinyin}`, hoi: `${c.h} → ${c.a} (${c.ap})` } });
  });
  // Đoạn + câu hỏi: 10 cho NGHE 3, 6 cho ĐỌC 3 (không trùng nhau)
  const doan = tron(dl.doan);
  doan.slice(0, 10).forEach((c) => {
    const lc = luaChon3(c);
    de.push({ phan: 'n3', kieu: 'chon', doc: [c.p, c.h, c.p, c.h], luaChon: lc.map((x) => ({ h: x.h, p: x.p })),
      dung: lc.findIndex((x) => x.dung), loiGiai: { han: c.p, py: c.pp, hoi: `${c.h} → ${c.a} (${c.ap})` } });
  });
  // ĐỌC 1: hai nhóm ghép câu ↔ câu đáp
  layNgauNhien(dl.hoiDap, 2).forEach((n) => de.push(...cauGhep('d1', n)));
  // ĐỌC 2: điền từ – một nhóm câu (41–45) + một nhóm hội thoại (46–50)
  [dl.dienTu, dl.dienHoiThoai].forEach((ds) => {
    const nhom = ds[Math.floor(Math.random() * ds.length)];
    const tuChung = tron(nhom.tu);
    tron(nhom.cau).forEach((c) => de.push(cauDienTu('d2', c, tuChung)));
  });
  // ĐỌC 3: 6 đoạn một câu hỏi + 2 đoạn hai câu hỏi
  doan.slice(10, 16).forEach((c) => {
    const lc = luaChon3(c);
    de.push({ phan: 'd3', kieu: 'docHoi', cauS: { s: c.p, sp: c.pp, h: c.h, hp: c.hp }, luaChon: lc.map((x) => ({ h: x.h, p: x.p })),
      dung: lc.findIndex((x) => x.dung), loiGiai: { han: c.p, py: c.pp, hoi: `${c.h} → ${c.a} (${c.ap})` } });
  });
  layNgauNhien(dl.doanDai, 2).forEach((d) => {
    d.cau.forEach((c, k) => {
      const lc = luaChon3(c);
      de.push({ phan: 'd3', kieu: 'docHoi', cauS: { s: d.p, sp: d.pp, h: c.h, hp: c.hp, ghiChu: `Đoạn này có 2 câu hỏi · câu ${k + 1}/2` },
        luaChon: lc.map((x) => ({ h: x.h, p: x.p })), dung: lc.findIndex((x) => x.dung),
        loiGiai: { han: d.p, py: d.pp, hoi: `${c.h} → ${c.a} (${c.ap})` } });
    });
  });
  // VIẾT 1: viết tay 5 chữ khác nhau
  const vietDaChon = [];
  for (const v of tron(dl.viet)) {
    if (vietDaChon.length === 5) break;
    if (!vietDaChon.some((x) => x.chu === v.chu)) vietDaChon.push(v);
  }
  vietDaChon.forEach((v) => {
    de.push({ phan: 'v1', kieu: 'vietChu', vc: v, dung: null,
      loiGiai: { han: v.cau.replace('（ ）', v.chu), py: v.pinyin, dich: v.dich, dapAn: v.chu } });
  });
  // VIẾT 2: 5 tranh khác nhau, mỗi tranh một câu sắp xếp có từ cho sẵn
  layNgauNhien(dl.tranh.filter((t) => t.xep.length), 5).forEach((t) => {
    const xc = t.xep[Math.floor(Math.random() * t.xep.length)];
    let thuTu = tron(xc.manh.map((m, i) => i));
    for (let lan = 0; lan < 5 && thuTu.every((x, i) => x === i); lan++) thuTu = tron(thuTu);
    de.push({ phan: 'v2', kieu: 'xepCau', xc, emoji: t.emoji, thuTu, dung: null,
      loiGiai: { han: xc.han, py: xc.pinyin, dich: xc.dich, emoji: t.emoji,
        cungDung: xc.khac.map((m) => m.join('') + xc.dauCau).join(' · ') } });
  });
  return sapTheoPhan(de, PHAN_3);
}

/** Câu đã có câu trả lời chưa (câu sắp xếp phải xếp đủ mảnh) */
const daLamCau = (c, tl) => (c.kieu === 'xepCau' ? Array.isArray(tl) && tl.length === c.xc.manh.length : tl !== null);

// ---------- Cấu hình theo cấp ----------
const CAU_HINH = {
  1: { phan: PHAN_1, taoDe: taoDe1, soCau: 40, phut: 35, gioiHan: { d: 20 }, soKy: { n: 20, d: 20 }, sach: '《新HSK教程 1》',
    cauTruc: [
      ['🎧 Nghe', '20 câu', ['P1 · Nghe, chọn 1 trong 3 tranh', 'P2 · Nghe câu, chọn câu đáp lại', 'P3 · Nghe câu, chọn tranh (A–F)', 'P4 · Nghe câu + câu hỏi, chọn đáp án']],
      ['📖 Đọc', '20 câu · 20 phút', ['P1 · Đọc câu, chọn tranh (A–F)', 'P2 · Ghép câu hỏi với câu trả lời', 'P3 · Chọn từ điền vào chỗ trống', 'P4 · Đọc câu, trả lời câu hỏi']],
    ] },
  2: { phan: PHAN_2, taoDe: taoDe2, soCau: 60, phut: 55, gioiHan: { d: 25, v: 10 }, soKy: { n: 25, d: 25, v: 10 }, sach: '《新HSK教程 2》',
    cauTruc: [
      ['🎧 Nghe', '25 câu', ['P1 · Nghe câu, chọn 1 trong 3 tranh', 'P2 · Nghe hội thoại, chọn tranh (A–F)', 'P3 · Nghe hội thoại + câu hỏi, chọn đáp án']],
      ['📖 Đọc', '25 câu · 25 phút', ['P1 · Đọc câu, chọn tranh (A–F)', 'P2 · Chọn từ điền vào chỗ trống', 'P3 · Ghép câu hỏi với câu trả lời', 'P4 · Đọc đoạn văn, trả lời câu hỏi']],
      ['✍️ Viết', '10 câu · 10 phút', ['P1 · Chọn phần còn thiếu của chữ', 'P2 · Viết tay chữ còn thiếu (có pinyin)']],
    ] },
  3: { phan: PHAN_3, taoDe: taoDe3, soCau: 70, phut: 75, gioiHan: { d: 30, v: 20 }, soKy: { n: 30, d: 30, v: 10 }, sach: '《新HSK教程 3》', anPinyin: true,
    cauTruc: [
      ['🎧 Nghe', '30 câu', ['P1 · Nghe hội thoại, chọn tranh (2 nhóm)', 'P2 · Nghe hội thoại + câu hỏi, chọn đáp án', 'P3 · Nghe một đoạn + câu hỏi, chọn đáp án']],
      ['📖 Đọc', '30 câu · 30 phút', ['P1 · Chọn câu đáp lại phù hợp (2 nhóm)', 'P2 · Chọn từ điền vào câu và hội thoại', 'P3 · Đọc đoạn văn, trả lời câu hỏi']],
      ['✍️ Viết', '10 câu · 20 phút', ['P1 · Viết tay chữ còn thiếu (có pinyin của chữ đó)', 'P2 · Nhìn tranh, sắp xếp câu có từ cho sẵn']],
    ] },
};

// ---------- Thang điểm ----------
/**
 * Thang điểm của một cấp: mỗi phần 100 điểm; đạt từ 60% tổng (ƯỚC TÍNH theo kỳ thi cũ). HSK 1: 200/120 · HSK 2, 3: 300/180.
 * Học vượt (mở cấp sau): cần ≥ 70% tổng VÀ không phần nào dưới 60 (bản soát chuyên gia, mục 6.8).
 */
export function thangDiem(cap = 1) {
  const soPhan = Object.keys((CAU_HINH[cap] || CAU_HINH[1]).soKy).length;
  return { toiDa: soPhan * 100, dat: soPhan * 60, vuot: soPhan * 70, vuotPhan: 60 };
}
/** Một lần thi có đủ điều kiện học vượt không */
export function datHocVuot(x) {
  const thang = thangDiem(x.cap || 1);
  const { phan, tong } = diemCuaLan(x);
  return tong >= thang.vuot && Object.values(phan).every((d) => d >= thang.vuotPhan);
}
/** Điều kiện học vượt viết thành chữ */
export const moTaHocVuot = (cap) => {
  const t = thangDiem(cap);
  return `từ ${t.vuot}/${t.toiDa} điểm và không phần nào dưới ${t.vuotPhan}`;
};
/**
 * Điểm từng phần + tổng của một lần thi đã lưu.
 * HSK 1 lưu sẵn điểm từng phần (5 điểm/câu); HSK 2, 3 lưu số câu đúng → quy ra 100 điểm mỗi phần.
 * Vì tính lại từ số câu đúng nên các lần thi cũ (lưu theo thang 200) cũng hiện đúng thang mới.
 */
export function diemCuaLan(x) {
  const cap = x.cap || 1;
  if (cap === 1) return { phan: { n: x.nghe, d: x.doc }, tong: x.nghe + x.doc };
  const so = CAU_HINH[cap].soKy;
  const phan = { n: Math.round((x.nghe * 100) / so.n), d: Math.round((x.doc * 100) / so.d), v: Math.round((x.viet * 100) / so.v) };
  return { phan, tong: phan.n + phan.d + phan.v };
}
/** "Nghe 87 · Đọc 80 · Viết 70" (kèm số câu đúng với HSK 2, 3) */
function moTaDiemPhan(x) {
  const cap = x.cap || 1;
  const { phan } = diemCuaLan(x);
  const so = CAU_HINH[cap].soKy;
  const dem = { n: x.nghe, d: x.doc, v: x.viet };
  return Object.keys(so).map((k) => `${TEN_KY[k]} ${phan[k]}${cap > 1 ? ` (${dem[k]}/${so[k]} câu)` : ''}`).join(' · ');
}

// ---------- Viết P2 (HSK 3): bước tự viết câu, không tính điểm (bản soát chuyên gia 6.3) ----------
// Đề thật yêu cầu tự viết câu có từ cho sẵn; app chấm được phần sắp xếp, còn câu tự viết thì chỉ kiểm tra
// hai điều: có dùng từ bắt buộc không, mọi chữ có trong HSK 1–3 không – rồi hiện câu mẫu để tự so.
let chuChoPhep = null;
function kiemCauTuViet(cau, tu) {
  if (!chuChoPhep) chuChoPhep = new Set(tatCaTu().filter((t) => t.cap <= 3).flatMap((t) => [...t.hanzi]));
  const chu = [...cau].filter((c) => /\p{Script=Han}/u.test(c));
  if (chu.length < 4) return { tot: false, chu: '✏️ Câu hơi ngắn – thử viết ít nhất 4 chữ Hán.' };
  if (!cau.includes(tu)) return { tot: false, chu: `❌ Câu chưa dùng từ ${tu}.` };
  const ngoai = [...new Set(chu.filter((c) => !chuChoPhep.has(c)))];
  if (ngoai.length) return { tot: false, chu: `⚠️ Có chữ ngoài HSK 1–3: ${ngoai.join(' ')} – thử dùng từ đã học.` };
  return { tot: true, chu: `✅ Có dùng ${tu}, mọi chữ đều trong HSK 1–3. App không chấm được ngữ pháp – hãy tự so với câu mẫu bên trên.` };
}

/** Câu trả lời có đúng không */
function laDung(c, tl) {
  if (c.kieu === 'vietChu') return !!(tl && tl.xong && tl.loi <= saiToiDa(tl.soNet ?? 10));
  if (c.kieu === 'xepCau') {
    if (!daLamCau(c, tl)) return false;
    const cau = tl.map((i) => c.xc.manh[i]).join('');
    return [c.xc.manh, ...c.xc.khac].some((m) => m.join('') === cau);
  }
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
  const chip = [1, 2, 3].map((c) => `<button class="chip ${c === cap ? 'dang-chon' : ''} ${capMo(c) ? '' : 'chip-khoa'}" data-cap="${c}">HSK ${c}${capMo(c) ? '' : ' <span class="emoji">🔒</span>'}</button>`).join('');
  // Cấp đang khóa: chỉ hiện cách mở khóa (thi thử cấp dưới để học vượt)
  if (!capMo(cap)) {
    khung.innerHTML = `<div class="hang-chip" style="margin-top:4px">${chip}</div><div style="margin-top:12px">${htmlCachMoKhoa(cap)}</div>`;
    khung.querySelectorAll('[data-cap]').forEach((b) => { b.onclick = () => veThiThu(khung, Number(b.dataset.cap)); });
    return;
  }
  const moTiep = CAU_HINH[cap + 1] && !capMo(cap + 1)
    ? `<p class="can-kiem-tra" style="margin-top:0">🔓 <b>Học vượt:</b> bài này đạt ${moTaHocVuot(cap)} sẽ mở khóa <b>HSK ${cap + 1}</b>.</p>` : '';
  const lichSu = (layTienDo().thiThu || []).filter((x) => (x.cap || 1) === cap).reverse();
  const tt = tinhTrangPhatAm();
  const thang = thangDiem(cap);
  const tot = lichSu.length ? Math.max(...lichSu.map((x) => diemCuaLan(x).tong)) : null;
  const bang = ch.cauTruc.map(([ten, so, dong]) => dong.map((d, i) => `<tr>${i === 0
    ? `<th rowspan="${dong.length}">${ten}<br><small>${so}</small></th>` : ''}<td>${d}</td></tr>`).join('')).join('');
  khung.innerHTML = `
    <div class="hang-chip" style="margin-top:4px">${chip}</div>
    <section class="khung gioi-thieu-thi" style="margin-top:12px">
      ${moTiep}
      <div class="goc-the"><span class="nhan nhan-chinh">📋 HSK ${cap} · đề mô phỏng</span><span class="chu-phu nho">${ch.soCau} câu · ~${ch.phut} phút</span></div>
      <h2>Thi thử HSK ${cap}</h2>
      <table class="bang-cau-truc">${bang}</table>
      <p class="chu-phu nho">Mỗi phần (${Object.keys(ch.soKy).map((k) => TEN_KY[k].toLowerCase()).join(', ')}) tối đa 100 điểm, tổng <b>${thang.toiDa}</b> · <b>đạt từ ${thang.dat} điểm</b>
        – <b>mức đạt ước tính theo kỳ thi cũ</b> (thang điểm chính thức của kỳ thi mới chưa công bố). Mỗi câu nghe được đọc 2 lần (như thi thật).
        ${ch.anPinyin ? 'Đề không có pinyin (như đề thật HSK 3); pinyin hiện khi xem lại đáp án. ' : ''}
        ${cap > 1 ? 'Phần viết tay: viết đúng thứ tự nét; chữ đến 5 nét được sai 1 nét, 6–9 nét sai 2, từ 10 nét sai 3 vẫn tính đúng. ' : ''}
        ${cap > 2 ? 'Phần 2 của Viết: đề thật yêu cầu tự viết câu; app đổi thành sắp xếp mảnh có sẵn để tự chấm được. ' : ''}
        Cấu trúc theo đề thi thử trong sách bài tập ${ch.sach} (2026); câu hỏi tự soạn, tranh là biểu tượng – <b>không phải đề chính thức</b>.</p>
      ${tt === 'khong-ho-tro' || tt === 'khong-co-giong' ? '<p class="can-kiem-tra">⚠️ Máy chưa có giọng đọc tiếng Trung nên phần Nghe sẽ không có tiếng. Xem cách cài trong Cài đặt.</p>' : ''}
      <label class="dong-cai-dat" style="border:0;padding:6px 0"><span>Cho phép bấm nghe lại (thi thật không có)</span>
        <input type="checkbox" id="cho-nghe-lai"></label>
      <a class="nut nut-chinh nut-rong" href="#/thi-thu/lam${cap > 1 ? `/${cap}` : ''}" id="nut-bat-dau"><span class="emoji">📋</span> Bắt đầu thi HSK ${cap}</a>
    </section>
    <h3 class="tieu-de-muc">Lịch sử thi thử HSK ${cap} <small>${lichSu.length ? `cao nhất ${tot}/${thang.toiDa}` : ''}</small></h3>
    ${lichSu.length ? `<div class="khung">${lichSu.slice(0, 10).map((x) => {
      const d = diemCuaLan(x).tong;
      return `
      <div class="dong-lich-su-thi">
        <span class="giua"><b>${d}/${thang.toiDa}</b> <span class="nhan ${d >= thang.dat ? 'nhan-dat' : ''}">${d >= thang.dat ? '✅ Đạt' : 'Chưa đạt'}</span>
          <span class="chu-phu nho">${moTaDiemPhan(x)} · ${Math.round(x.giay / 60)} phút</span></span>
        <span class="chu-phu nho">${new Date(x.luc).toLocaleDateString('vi-VN')}</span>
      </div>`;
    }).join('')}</div>` : '<p class="chu-phu">Chưa thi lần nào.</p>'}`;
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
    anPinyin = !!ch.anPinyin;
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
          const dongCau = c.dong.map((d, k) => {
            const nhanLuot = c.hoiThoai ? `<b class="nhan-luot">${'AB'[k]}：</b>` : '';
            const [truoc, sau] = d.han.split('（ ）');
            const han = sau === undefined ? esc(d.han)
              : `${esc(truoc)}<span class="o-dien">（${daChon !== null ? esc(c.tuChung[daChon].h) : '　'}）</span>${esc(sau)}`;
            return `<p class="cau-thi ${c.hoiThoai ? 'luot' : ''}">${nhanLuot}<span class="khoi-luot">${d.py && !anPinyin ? `<span class="py-tren-cau">${esc(d.py)}</span>` : ''}<span class="han">${han}</span></span></p>`;
          }).join('');
          return `<div class="kho-tu-thi">${c.tuChung.map((w, i) => `<span class="o-tu-thi"><b>${CHU_CAI[i]}</b> ${hanPy(w.h, w.p)}</span>`).join('')}</div>
            ${dongCau}
            <div class="luoi-chu-cai">${c.tuChung.map((w, i) => nutLc(i, '', 'nho')).join('')}</div>`;
        }
        case 'xepCau': {
          const tl = Array.isArray(daChon) ? daChon : [];
          const x = c.xc;
          return `<div class="tranh-xep"><span class="emoji">${c.emoji}</span>
              <span class="tu-cho-san"><span class="chu-phu nho">Từ cho sẵn</span><b class="han">${esc(x.tu)}</b></span></div>
            <div class="dong-sap-xep">${tl.length
              ? tl.map((i, k) => `<button class="manh da-chon han" data-k="${k}">${esc(x.manh[i])}</button>`).join('')
                + (tl.length === x.manh.length ? `<span class="dau-cau han">${esc(x.dauCau)}</span>` : '')
              : '<span class="chu-phu nho">Chạm các mảnh bên dưới theo đúng thứ tự</span>'}</div>
            <div class="kho-manh">${c.thuTu.map((i) => `<button class="manh han" data-m="${i}" ${tl.includes(i) ? 'disabled' : ''}>${esc(x.manh[i])}</button>`).join('')}</div>
            ${tl.length ? '<div class="hang-nut" style="justify-content:center"><button class="nut nut-nho" id="nut-xep-lai">↺ Xếp lại</button></div>' : ''}`;
        }
        case 'docHoi':
          return `${c.cauS.ghiChu ? `<p class="chu-phu nho" style="text-align:center">${esc(c.cauS.ghiChu)}</p>` : ''}
            <p class="cau-thi ${c.cauS.s.length > 40 ? 'doan-dai' : ''}">${hanPy(c.cauS.s, c.cauS.sp)}</p>
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
          // Đề ẩn pinyin (HSK 3): như đề thật, chỉ ghi pinyin của chữ cần viết trong ngoặc
          const pyO = anPinyin ? pinyinChoTrong(v.cau, v.chu, v.pinyin) : null;
          const pyCau = anPinyin && pyO ? '' : `<span class="py-tren-cau">${esc(v.pinyin)}</span>`;
          return `<p class="cau-thi">${pyCau}<span class="han">${esc(truoc)}<span class="o-dien">（${tl?.xong ? esc(v.chu) : (pyO ? ` <span class="pinyin">${esc(pyO)}</span> ` : '　')}）</span>${esc(sau)}</span></p>
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
        const soNet = (await taiNetChu()).net[c.vc.chu]?.strokes.length ?? 10;
        const $nhan = khung.querySelector('#loi-nhan-viet');
        writer.quiz({
          showHintAfterMisses: 3,
          onMistake: (d) => {
            if ($nhan) $nhan.textContent = `Nét chưa đúng (đã sai ${d.totalMistakes} lần).`;
            if (d.totalMistakes >= LOI_VIET_DUNG_LAI && !traLoi[idx]) {
              huyViet();
              traLoi[idx] = { xong: false, loi: d.totalMistakes, soNet };
              if (viTri === idx) veCau();
            }
          },
          onComplete: (kq) => {
            traLoi[idx] = { xong: true, loi: kq.totalMistakes, soNet };
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
            <div class="thanh-tien-do"><span style="width:${(de.filter((x, i) => daLamCau(x, traLoi[i])).length / de.length) * 100}%"></span></div>
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
      // Câu sắp xếp: chạm mảnh để thêm, chạm mảnh đã xếp để bỏ ra
      khung.querySelectorAll('[data-m]').forEach((b) => {
        b.onclick = () => { traLoi[viTri] = [...(traLoi[viTri] || []), Number(b.dataset.m)]; veCau(); };
      });
      khung.querySelectorAll('[data-k]').forEach((b) => {
        b.onclick = () => {
          const m = [...traLoi[viTri]];
          m.splice(Number(b.dataset.k), 1);
          traLoi[viTri] = m.length ? m : null;
          veCau();
        };
      });
      khung.querySelector('#nut-xep-lai')?.addEventListener('click', () => { traLoi[viTri] = null; veCau(); });
      khung.querySelector('#nut-nop')?.addEventListener('click', () => {
        const chuaLam = de.filter((x, i) => !daLamCau(x, traLoi[i])).length;
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
      // Lưu: HSK 1 điểm từng phần (5 điểm/câu, như trước); HSK 2, 3 số câu đúng từng phần
      const ketQua = cap === 1
        ? { cap: 1, nghe: dem('n') * 5, doc: dem('d') * 5 }
        : { cap, nghe: dem('n'), doc: dem('d'), viet: dem('v') };
      const tong = diemCuaLan(ketQua).tong;
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
      if (c.kieu === 'xepCau') {
        if (!daLamCau(c, tl)) return 'chưa xếp xong';
        return `bạn xếp: <span class="han">${esc(tl.map((i) => c.xc.manh[i]).join('') + c.xc.dauCau)}</span>`;
      }
      return `bạn chọn <b>${tl === null ? '—' : CHU_CAI[tl]}</b> · đáp án <b>${CHU_CAI[c.dung]}</b>`;
    }

    function veKetQua(dung, tong, kq) {
      const thang = thangDiem(cap);
      const dat = tong >= thang.dat;
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
            ${lg.cungDung ? `<br><span class="chu-phu nho">Cũng đúng: <span class="han">${esc(lg.cungDung)}</span></span>` : ''}
            ${lg.hoi ? `<br><span class="chu-phu nho">Câu hỏi: <span class="han">${esc(lg.hoi)}</span></span>` : ''}</span>
          </div>
          ${c.kieu === 'xepCau' ? `<div class="tu-viet-cau">
            <label class="chu-phu nho" for="tu-viet-${i}">✍️ Luyện thêm (không tính điểm): tự gõ một câu KHÁC có dùng <b class="han">${esc(c.xc.tu)}</b></label>
            <div class="hang-tu-viet"><input id="tu-viet-${i}" type="text" lang="zh" autocomplete="off" placeholder="Gõ câu tiếng Trung…">
              <button class="nut nut-nho" data-kiem-cau="${i}">Kiểm tra</button></div>
            <p class="chu-phu nho kq-tu-viet" id="kq-tu-viet-${i}"></p>
          </div>` : ''}
        </div>`;
      }).join('');
      const tomTat = moTaDiemPhan(kq);
      const vuaMo = layCapVuaMo();   // đạt → có thể vừa mở khóa cấp sau ("học vượt")
      khung.innerHTML = `
        <div class="ket-thuc">
          <div class="emoji emoji-to">${dat ? '🏆' : '💪'}</div>
          <h2>${tong}/${thang.toiDa} điểm</h2>
          <p><span class="nhan ${dat ? 'nhan-dat' : ''}" style="font-size:.95rem">${dat ? `✅ Đạt (từ ${thang.dat} điểm)` : `Chưa đạt – cần thêm ${thang.dat - tong} điểm`}</span></p>
          <p class="chu-phu nho" style="margin:0">Mức đạt ước tính theo kỳ thi cũ.${CAU_HINH[cap + 1] && !capMo(cap + 1) && !vuaMo.length
            ? ` Học vượt sang HSK ${cap + 1} cần ${moTaHocVuot(cap)}.` : ''}</p>
          ${vuaMo.length ? `<div class="khung the-mo-khoa"><span class="emoji">🔓</span><b>Đã mở khóa HSK ${vuaMo.join(', ')}!</b>
            <a class="nut nut-chinh nut-rong" href="#/bai">Vào học HSK ${vuaMo[0]}</a></div>` : ''}
          <p class="chu-phu">${tomTat} · ${Math.round(giayDaLam / 60)} phút</p>
          <div class="khung" style="width:100%"><table class="bang-diem-phan">${theoPhan}</table></div>
          <a class="nut nut-chinh nut-rong" href="#/thi-thu" id="nut-thi-lai">📋 Thi đề khác</a>
          <a class="nut nut-rong" href="#/">🏠 Về trang Hôm nay</a>
        </div>
        <h3 class="tieu-de-muc">Xem lại từng câu</h3>
        <div class="ds-xem-lai">${xemLai}</div>`;
      khung.querySelectorAll('[data-kiem-cau]').forEach((nut) => {
        nut.onclick = () => {
          const i = Number(nut.dataset.kiemCau);
          const kq = kiemCauTuViet(khung.querySelector(`#tu-viet-${i}`).value.trim(), de[i].xc.tu);
          const $kq = khung.querySelector(`#kq-tu-viet-${i}`);
          $kq.textContent = kq.chu;
          $kq.classList.toggle('tot', kq.tot);
        };
      });
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
    anPinyin = false;
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
  return ls.length ? Math.max(...ls.map((x) => diemCuaLan(x).tong)) : null;
};
