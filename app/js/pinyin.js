// =========================================================
// PINYIN – tách âm tiết, nhận ra thanh điệu, tô màu theo thanh.
// Ví dụ (chỉ là chữ Latinh): "nǐhǎo" → [nǐ (thanh 3), hǎo (thanh 3)]
// File này KHÔNG chứa từ vựng; chỉ có quy tắc ghép vần pinyin.
// Màu: thanh 1 đỏ · 2 cam · 3 xanh lá · 4 xanh dương · nhẹ xám (xem style.css, lớp .t1–.t4, .t0)
// =========================================================

// Nguyên âm có dấu → [nguyên âm gốc, số thanh]
const DAU_THANH = {
  'ā': ['a', 1], 'á': ['a', 2], 'ǎ': ['a', 3], 'à': ['a', 4],
  'ē': ['e', 1], 'é': ['e', 2], 'ě': ['e', 3], 'è': ['e', 4],
  'ī': ['i', 1], 'í': ['i', 2], 'ǐ': ['i', 3], 'ì': ['i', 4],
  'ō': ['o', 1], 'ó': ['o', 2], 'ǒ': ['o', 3], 'ò': ['o', 4],
  'ū': ['u', 1], 'ú': ['u', 2], 'ǔ': ['u', 3], 'ù': ['u', 4],
  'ǖ': ['v', 1], 'ǘ': ['v', 2], 'ǚ': ['v', 3], 'ǜ': ['v', 4], 'ü': ['v', 0],
};

// Một âm tiết hợp lệ = (phụ âm đầu) + vần (+ r cuối khi đọc uốn lưỡi). "v" thay cho "ü".
const PHU_AM_DAU = '(?:zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?';
const VAN = '(?:iang|iong|uang|ang|eng|ing|ong|iao|ian|uai|uan|van|ai|ei|ui|ao|ou|iu|ie|ve|ue|er|an|en|in|un|vn|ia|ua|uo|io|a|o|e|i|u|v)';
const AM_TIET_HOP_LE = new RegExp('^' + PHU_AM_DAU + VAN + 'r?$');

// Các ký tự được coi là "chữ" trong pinyin
const LA_CHU = /[a-zA-Züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/;
const LA_CHU_HAN = /\p{Script=Han}/u;

const thoat = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Bỏ dấu, viết thường: "Nǐ" → "ni"; "lǚ" → "lv" */
function boDauPinyin(chu) {
  let kq = '';
  for (const c of chu.normalize('NFC').toLowerCase()) kq += DAU_THANH[c] ? DAU_THANH[c][0] : c;
  return kq;
}

/** Thanh của một âm tiết: 1–4, hoặc 0 = thanh nhẹ (không dấu) */
function layThanh(amTiet) {
  for (const c of amTiet.normalize('NFC').toLowerCase()) {
    if (DAU_THANH[c] && DAU_THANH[c][1]) return DAU_THANH[c][1];
  }
  return 0;
}

/**
 * Tách một cụm chữ liền (vd "kèqi") thành các âm tiết.
 * Quy tắc: âm tiết sau không được bắt đầu bằng a/o/e (nếu có, pinyin chuẩn phải viết dấu ').
 * soMongMuon: nếu biết số chữ Hán thì ưu tiên cách tách có đúng số âm tiết đó.
 */
function tachCum(cum, soMongMuon) {
  const goc = boDauPinyin(cum);
  const cacCach = [];
  function thu(viTri, daTach) {
    if (cacCach.length >= 20) return;
    if (viTri === goc.length) { cacCach.push(daTach.slice()); return; }
    for (let dai = Math.min(7, goc.length - viTri); dai >= 1; dai--) {
      const doan = goc.slice(viTri, viTri + dai);
      if (!AM_TIET_HOP_LE.test(doan)) continue;
      const tiepTheo = goc[viTri + dai];
      if (tiepTheo && 'aoe'.includes(tiepTheo)) continue;
      daTach.push([viTri, viTri + dai]);
      thu(viTri + dai, daTach);
      daTach.pop();
    }
  }
  thu(0, []);
  if (!cacCach.length) return [cum]; // không tách được → giữ nguyên cả cụm
  let chon = cacCach.find((c) => c.length === soMongMuon);
  if (!chon) chon = cacCach.reduce((a, b) => (b.length < a.length ? b : a)); // ít âm tiết nhất
  const chuGoc = [...cum.normalize('NFC')];
  return chon.map(([dau, cuoi]) => chuGoc.slice(dau, cuoi).join(''));
}

/**
 * Tách cả chuỗi pinyin thành danh sách phần:
 *   { chu: "nǐ", thanh: 3 }  → âm tiết
 *   { chu: ", " }            → dấu câu, khoảng trắng (không có thanh)
 */
export function tachPinyin(chuoi, soChuHan) {
  const ketQua = [];
  const cum = [];
  for (const c of (chuoi || '').normalize('NFC')) {
    const laChu = LA_CHU.test(c);
    const cuoi = cum[cum.length - 1];
    if (cuoi && cuoi.laChu === laChu) cuoi.noiDung += c;
    else cum.push({ laChu, noiDung: c });
  }
  const soCumChu = cum.filter((c) => c.laChu).length;
  cum.forEach((c) => {
    if (!c.laChu) { ketQua.push({ chu: c.noiDung }); return; }
    // Chỉ dùng "số chữ Hán" khi toàn bộ pinyin là một cụm liền
    const mongMuon = soCumChu === 1 ? soChuHan : undefined;
    tachCum(c.noiDung, mongMuon).forEach((a) => ketQua.push({ chu: a, thanh: layThanh(a) }));
  });
  return ketQua;
}

// ---------- Đổi dấu thanh (dùng cho trắc nghiệm "chọn pinyin đúng") ----------
const NGUYEN_AM_CO_DAU = { a: 'āáǎà', e: 'ēéěè', i: 'īíǐì', o: 'ōóǒò', u: 'ūúǔù', ü: 'ǖǘǚǜ' };

/** Bỏ dấu thanh nhưng giữ chữ ü: "lǚ" → "lü" */
function boDauGiuU(chu) {
  let kq = '';
  for (const c of chu.normalize('NFC')) {
    const d = DAU_THANH[c];
    kq += d ? (d[0] === 'v' ? 'ü' : d[0]) : c;
  }
  return kq;
}

/**
 * Đặt dấu thanh cho MỘT âm tiết theo quy tắc pinyin:
 * có a hoặc e → dấu trên a/e; có "ou" → dấu trên o; còn lại → dấu trên nguyên âm cuối.
 * thanh = 0 → bỏ dấu (thanh nhẹ). Ví dụ: datThanh("hǎo", 4) → "hào"
 */
export function datThanh(amTiet, thanh) {
  const goc = boDauGiuU(amTiet);
  if (!thanh) return goc;
  const thap = goc.toLowerCase();
  let viTri = thap.search(/[ae]/);
  if (viTri < 0) viTri = thap.indexOf('ou');
  if (viTri < 0) {
    for (let i = thap.length - 1; i >= 0; i--) if ('iouü'.includes(thap[i])) { viTri = i; break; }
  }
  if (viTri < 0) return goc;
  return goc.slice(0, viTri) + NGUYEN_AM_CO_DAU[thap[viTri]][thanh - 1] + goc.slice(viTri + 1);
}

/**
 * Tạo các cách viết pinyin "cùng âm, khác dấu thanh" để làm đáp án nhiễu.
 * Trả về [] nếu không tách được âm tiết khớp số chữ Hán.
 */
export function bienTheThanh(pinyin, soChuHan, soLuong = 3) {
  const phan = tachPinyin(pinyin, soChuHan);
  const viTriAm = phan.map((p, i) => (p.thanh === undefined ? -1 : i)).filter((i) => i >= 0);
  if (!viTriAm.length || viTriAm.length !== soChuHan) return [];
  const daCo = new Set([pinyin.normalize('NFC')]);
  const kq = [];
  for (let lan = 0; lan < 60 && kq.length < soLuong; lan++) {
    const ban = phan.map((p) => ({ ...p }));
    // đổi thanh 1 âm tiết (đôi khi 2 âm tiết với từ dài)
    const soDoi = viTriAm.length > 1 && Math.random() < 0.35 ? 2 : 1;
    const chon = [...viTriAm].sort(() => Math.random() - 0.5).slice(0, soDoi);
    for (const i of chon) {
      const cacThanh = [1, 2, 3, 4].filter((t) => t !== ban[i].thanh);
      ban[i].chu = datThanh(ban[i].chu, cacThanh[Math.floor(Math.random() * cacThanh.length)]);
    }
    const chuoi = ban.map((p) => p.chu).join('').normalize('NFC');
    if (!daCo.has(chuoi)) { daCo.add(chuoi); kq.push(chuoi); }
  }
  return kq;
}

/** Đếm số chữ Hán trong một chuỗi */
export function demChuHan(chuoi) {
  return ((chuoi || '').match(/\p{Script=Han}/gu) || []).length;
}

/** HTML pinyin đã tô màu theo thanh: <span class="t3">nǐ</span>… */
export function toMauPinyin(chuoi, soChuHan) {
  return tachPinyin(chuoi, soChuHan)
    .map((p) => (p.thanh === undefined ? thoat(p.chu) : `<span class="t${p.thanh}">${thoat(p.chu)}</span>`))
    .join('');
}

/** Tô màu từng chữ Hán theo thanh của âm tiết tương ứng (chỉ khi số chữ = số âm tiết) */
export function toMauChuHan(hanzi, pinyin) {
  const chu = [...(hanzi || '')];
  const soChu = chu.filter((c) => LA_CHU_HAN.test(c)).length;
  const amTiet = tachPinyin(pinyin, soChu).filter((p) => p.thanh !== undefined);
  if (amTiet.length !== soChu) return thoat(hanzi);
  let i = 0;
  return chu.map((c) => (LA_CHU_HAN.test(c) ? `<span class="t${amTiet[i++].thanh}">${thoat(c)}</span>` : thoat(c))).join('');
}
