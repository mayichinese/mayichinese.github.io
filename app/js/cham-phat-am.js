// =========================================================
// CHẤM PHÁT ÂM – so câu người học nói (máy nhận dạng ra chữ Hán) với câu đúng
//
// Cách chấm (không cần máy chủ riêng):
//   1. Trình duyệt nghe và đoán ra chữ Hán (nhan-giong.js). Máy chỉ viết ra được chữ đúng
//      khi bạn đọc đủ rõ âm đầu, vần và thanh điệu.
//   2. So TỪNG CHỮ với câu đúng theo CÁCH ĐỌC chứ không theo mặt chữ
//      (bảng data/am-doc.json: âm tiết → các chữ đọc như thế):
//        - cùng chữ, hoặc khác chữ nhưng cùng âm + cùng thanh (đồng âm)  → đúng
//        - cùng âm nhưng khác thanh                                        → sai thanh (nửa điểm)
//        - khác âm / thiếu chữ                                             → sai
//      Hai chuỗi được dóng hàng như so văn bản (cho phép thiếu / thừa chữ).
//   3. Điểm = (số chữ đúng + ½ số chữ sai thanh) / số chữ  (chữ thừa trừ nhẹ) × 100.
// Lưu ý: đây là chấm "máy có hiểu bạn nói gì không", gần với người Trung nghe hiểu,
// không phải chấm từng âm vị như phòng thí nghiệm.
// =========================================================

import { tachPinyin, datThanh, demChuHan } from './pinyin.js';

const LA_HAN = /\p{Script=Han}/u;
let amCuaChu = null;   // chữ → ['shi4', ...]
let dangNap = null;

/** Nạp bảng cách đọc (một lần). */
export function napAmDoc() {
  if (amCuaChu) return Promise.resolve();
  if (!dangNap) {
    dangNap = fetch('data/am-doc.json').then((r) => {
      if (!r.ok) throw new Error('Không tải được data/am-doc.json');
      return r.json();
    }).then((json) => datBangAm(json)).catch((e) => { dangNap = null; throw e; });
  }
  return dangNap;
}

/** Dựng bảng chữ → cách đọc từ JSON (tách riêng để kiểm tra bằng Node) */
export function datBangAm(json) {
  amCuaChu = new Map();
  for (const [am, cacChu] of Object.entries(json.am)) {
    for (const c of cacChu) {
      if (!amCuaChu.has(c)) amCuaChu.set(c, []);
      amCuaChu.get(c).push(am);
    }
  }
}

const DAU = { '̄': 1, '́': 2, '̌': 3, '̀': 4 };
/** "zhòu" → "zhou4"; "lǜ" → "lv4"; không dấu → thanh 5 (thanh nhẹ) */
export function amSo(py) {
  let thanh = 5;
  let kq = '';
  for (const c of String(py).toLowerCase().normalize('NFD')) {
    if (DAU[c]) thanh = DAU[c];
    else if (c === '̈') kq = `${kq.slice(0, -1)}v`;
    else if (/[a-z]/.test(c)) kq += c;
  }
  return kq ? kq + thanh : null;
}
/** "shi4" → "shì" (để hiện cho người học) */
export function amDau(so) {
  const m = /^([a-z]+)([1-5])$/.exec(so || '');
  if (!m) return so || '';
  return datThanh(m[1].replace(/v/g, 'ü'), m[2] === '5' ? 0 : Number(m[2]));
}
const goc = (so) => so.slice(0, -1);
const thanhCua = (so) => so.slice(-1);

// ---------- Đổi số Ả Rập máy viết ra thành chữ Hán ("3" → 三, "15" → 十五, "2026年" → 二〇二六年) ----------
const CHU_SO = '零一二三四五六七八九';
function soThanhChu(chuoi) {
  const n = Number(chuoi);
  if (!Number.isInteger(n) || n < 0 || n > 99999) return [...chuoi].map((c) => CHU_SO[c] || '').join('');
  if (n < 10) return CHU_SO[n];
  const DON_VI = ['', '十', '百', '千', '万'];
  const so = String(n).split('').map(Number);
  let kq = '';
  let coKhong = false;
  so.forEach((d, i) => {
    const vi = so.length - 1 - i;
    if (d === 0) { coKhong = true; return; }
    if (coKhong && kq) kq += '零';
    coKhong = false;
    kq += (d === 1 && vi === 1 && i === 0 ? '' : CHU_SO[d]) + DON_VI[vi];
  });
  return kq;
}
function chuanHoaCauNoi(chuoi) {
  return String(chuoi || '')
    .replace(/(\d{4})(?=年)/g, (s) => [...s].map((c) => CHU_SO[c]).join(''))   // năm đọc từng số
    .replace(/(\d+):(\d+)/g, (_, h, p) => `${soThanhChu(h)}点${soThanhChu(p)}`)
    .replace(/\d+/g, soThanhChu)
    .replace(/[^\p{Script=Han}]/gu, '');
}

/** Âm tiết mong đợi của từng chữ Hán trong câu đúng (lấy theo pinyin của dữ liệu nếu khớp số chữ) */
function amCauDung(hanzi, pinyin) {
  const chu = [...hanzi].filter((c) => LA_HAN.test(c));
  const am = pinyin ? tachPinyin(pinyin, demChuHan(hanzi)).filter((p) => p.thanh !== undefined) : [];
  const khop = am.length === chu.length;
  return chu.map((c, i) => ({ chu: c, py: khop ? am[i].chu : '', am: khop ? amSo(am[i].chu) : null }));
}

// Hai chữ hay bị máy viết lẫn nhau dù người nói đúng
const TUONG_DUONG = [['二', '两']];

/** So một chữ của câu đúng (o) với một chữ máy nghe được (r): 'dung' | 'thanh' | 'sai' */
function soChu(o, r) {
  if (o.chu === r) return { kq: 'dung' };
  if (TUONG_DUONG.some((cap) => cap.includes(o.chu) && cap.includes(r))) return { kq: 'dung' };
  const amR = amCuaChu?.get(r) || [];
  const amO = o.am ? [o.am] : (amCuaChu?.get(o.chu) || []);
  if (!amR.length || !amO.length) return { kq: 'sai' };
  if (amR.some((a) => amO.includes(a))) return { kq: 'dung' };
  // thanh nhẹ: máy khó phân biệt → cùng âm là đủ
  const cungGoc = amR.filter((a) => amO.some((b) => goc(a) === goc(b)));
  if (cungGoc.length) {
    if (amO.some((b) => thanhCua(b) === '5') || cungGoc.some((a) => thanhCua(a) === '5')) return { kq: 'dung' };
    // biến điệu 不/一 và thanh 3 + thanh 3: chữ đúng có thể đọc thanh khác cách ghi → chấp nhận nếu máy viết đúng chữ (đã xét ở trên)
    return { kq: 'thanh', nghe: cungGoc[0] };
  }
  return { kq: 'sai', nghe: amR[0] };
}

const PHAT = { dung: 0, thanh: 0.5, sai: 1 };
const PHAT_THIEU = 1;
const PHAT_THUA = 0.7;

/** Chấm một câu nhận dạng được */
function chamMot(cauDung, vanBan) {
  const nghe = [...chuanHoaCauNoi(vanBan)];
  const n = cauDung.length;
  const m = nghe.length;
  // Dóng hàng kiểu "khoảng cách sửa chữa" (edit distance)
  const so = Array.from({ length: n }, (_, i) => nghe.map((r) => soChu(cauDung[i], r)));
  const f = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) f[i][0] = i * PHAT_THIEU;
  for (let j = 1; j <= m; j++) f[0][j] = j * PHAT_THUA;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      f[i][j] = Math.min(
        f[i - 1][j - 1] + PHAT[so[i - 1][j - 1].kq],
        f[i - 1][j] + PHAT_THIEU,
        f[i][j - 1] + PHAT_THUA,
      );
    }
  }
  // Lần ngược để biết từng chữ của câu đúng được đọc thế nào
  const chiTiet = cauDung.map((o) => ({ chu: o.chu, py: o.py, kq: 'thieu', nghe: '' }));
  let thua = 0;
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && Math.abs(f[i][j] - (f[i - 1][j - 1] + PHAT[so[i - 1][j - 1].kq])) < 1e-9) {
      const s = so[i - 1][j - 1];
      chiTiet[i - 1].kq = s.kq;
      chiTiet[i - 1].nghe = nghe[j - 1];
      if (s.nghe) chiTiet[i - 1].ngheAm = amDau(s.nghe);
      i--; j--;
    } else if (i > 0 && Math.abs(f[i][j] - (f[i - 1][j] + PHAT_THIEU)) < 1e-9) {
      i--;
    } else {
      thua++;
      j--;
    }
  }
  const dung = chiTiet.filter((c) => c.kq === 'dung').length;
  const saiThanh = chiTiet.filter((c) => c.kq === 'thanh').length;
  const diem = n ? Math.round((100 * (dung + 0.5 * saiThanh)) / (n + 0.5 * thua)) : 0;
  return { diem, chiTiet, thua, vanBan: nghe.join('') };
}

/**
 * Chấm phát âm.
 * @param {string} hanzi   câu/từ đúng (chữ Hán, có thể có dấu câu)
 * @param {string} pinyin  pinyin của câu đúng (để biết chữ đa âm đọc thế nào); có thể rỗng
 * @param {string[]} cacCachNghe  các phương án máy nhận dạng được (lấy phương án điểm cao nhất)
 * @returns {{ diem, chiTiet: [{chu, py, kq: 'dung'|'thanh'|'sai'|'thieu', nghe, ngheAm}], thua, vanBan }}
 */
export function chamPhatAm(hanzi, pinyin, cacCachNghe) {
  const cauDung = amCauDung(hanzi, pinyin);
  let tot = null;
  for (const v of cacCachNghe || []) {
    const kq = chamMot(cauDung, v);
    if (!tot || kq.diem > tot.diem) tot = kq;
  }
  return tot || chamMot(cauDung, '');
}

/** Lời nhận xét theo điểm */
export function nhanXet(diem) {
  if (diem >= 90) return { muc: 'tot', emoji: '🌟', chu: 'Tuyệt vời! Máy nghe rõ từng chữ.' };
  if (diem >= 70) return { muc: 'kha', emoji: '👍', chu: 'Khá tốt! Chú ý các chữ tô màu.' };
  if (diem >= 40) return { muc: 'tb', emoji: '💪', chu: 'Gần đúng rồi, nghe mẫu rồi thử lại nhé.' };
  return { muc: 'yeu', emoji: '🔁', chu: 'Máy chưa nghe ra. Nói chậm, rõ từng chữ và thử lại.' };
}
export const DIEM_DAT = 70;
