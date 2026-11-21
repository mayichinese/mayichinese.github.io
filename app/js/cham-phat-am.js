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
//      Đọc TỪ (không phải câu) thì phải đúng mọi thanh mới đạt: sai thanh → tối đa DIEM_TU_SAI_THANH
//      (theo bản soát chuyên gia: từ 2 âm tiết sai 1 thanh trước đây vẫn được 75 điểm = đạt).
//   4. 二 và 两 chỉ coi là một khi máy viết ra CHỮ SỐ (2): máy viết chữ Hán 二 mà câu đúng là 两 thì là đọc sai.
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
/** → [{ c: chữ Hán, so: true nếu chữ này đổi từ chữ số máy viết ra }] */
function chuanHoaCauNoi(chuoi) {
  const DAU_SO = '#';   // dấu (không phải chữ Hán) đặt trước mỗi chữ Hán đổi từ chữ số
  const danhDau = (t) => [...t].map((c) => DAU_SO + c).join('');
  const s = String(chuoi || '')
    .replace(/(\d{4})(?=年)/g, (x) => danhDau([...x].map((c) => CHU_SO[c]).join('')))   // năm đọc từng số
    .replace(/(\d+):(\d+)/g, (_, h, p) => `${danhDau(soThanhChu(h))}点${danhDau(soThanhChu(p))}`)
    .replace(/\d+/g, (x) => danhDau(soThanhChu(x)));
  const kq = [];
  let tuSo = false;
  for (const c of s) {
    if (c === DAU_SO) { tuSo = true; continue; }
    if (/\p{Script=Han}/u.test(c)) kq.push({ c, so: tuSo });
    tuSo = false;
  }
  return kq;
}

/** Âm tiết mong đợi của từng chữ Hán trong câu đúng (lấy theo pinyin của dữ liệu nếu khớp số chữ) */
function amCauDung(hanzi, pinyin) {
  const chu = [...hanzi].filter((c) => LA_HAN.test(c));
  const am = pinyin ? tachPinyin(pinyin, demChuHan(hanzi)).filter((p) => p.thanh !== undefined) : [];
  const khop = am.length === chu.length;
  return chu.map((c, i) => ({ chu: c, py: khop ? am[i].chu : '', am: khop ? amSo(am[i].chu) : null }));
}

// Máy viết chữ số "2" thì không biết người học nói 二 hay 两 → coi như đúng chữ của câu đúng
const TUONG_DUONG_SO = [['二', '两']];

/** So một chữ của câu đúng (o) với một chữ máy nghe được ({c, so}): 'dung' | 'thanh' | 'sai' */
function soChu(o, { c: r, so: tuSo }) {
  if (o.chu === r) return { kq: 'dung' };
  if (tuSo && TUONG_DUONG_SO.some((cap) => cap.includes(o.chu) && cap.includes(r))) return { kq: 'dung' };
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
      chiTiet[i - 1].nghe = nghe[j - 1].c;
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
  return { diem, chiTiet, thua, vanBan: nghe.map((x) => x.c).join('') };
}

/**
 * Chấm phát âm.
 * @param {string} hanzi   câu/từ đúng (chữ Hán, có thể có dấu câu)
 * @param {string} pinyin  pinyin của câu đúng (để biết chữ đa âm đọc thế nào); có thể rỗng
 * @param {string[]} cacCachNghe  các phương án máy nhận dạng được (lấy phương án điểm cao nhất)
 * @param {{laTu?: boolean}} [tuyChon]  laTu: đang đọc một TỪ → sai thanh thì không đạt
 * @returns {{ diem, chiTiet: [{chu, py, kq: 'dung'|'thanh'|'sai'|'thieu', nghe, ngheAm}], thua, vanBan, saiThanh }}
 *   saiThanh: danh sách chữ đúng âm nhưng sai thanh
 */
export function chamPhatAm(hanzi, pinyin, cacCachNghe, tuyChon = {}) {
  const cauDung = amCauDung(hanzi, pinyin);
  let tot = null;
  for (const v of cacCachNghe || []) {
    const kq = chamMot(cauDung, v);
    if (!tot || kq.diem > tot.diem) tot = kq;
  }
  tot = tot || chamMot(cauDung, '');
  tot.saiThanh = tot.chiTiet.filter((c) => c.kq === 'thanh');
  if (tuyChon.laTu && tot.saiThanh.length) tot.diem = Math.min(tot.diem, DIEM_TU_SAI_THANH);
  return tot;
}

/**
 * Nhắc biến điệu trước khi đọc (máy nhận dạng KHÔNG bắt được lỗi biến điệu).
 * @returns {string[]} tối đa 2 lời nhắc, ví dụ "不去 đọc là bú qù (不 trước thanh 4 → thanh 2)"
 */
export function nhacBienDieu(hanzi, pinyin) {
  const chu = [...(hanzi || '')].filter((c) => LA_HAN.test(c));
  const am = pinyin ? tachPinyin(pinyin, demChuHan(hanzi)).filter((p) => p.thanh !== undefined) : [];
  if (am.length !== chu.length) return [];
  const nhac = [];
  const daCo = new Set();
  const them = (loai, chuoi) => { if (!daCo.has(loai)) { daCo.add(loai); nhac.push(chuoi); } };
  for (let i = 0; i + 1 < chu.length; i++) {
    const a = am[i].chu.toLowerCase();
    const cap = `${chu[i]}${chu[i + 1]}`;
    const doc = `${a} ${am[i + 1].chu.toLowerCase()}`;
    if (chu[i] === '不' && a === 'bú') them('bu', `${cap} đọc là ${doc} (不 đứng trước thanh 4 thì đổi sang thanh 2)`);
    else if (chu[i] === '一' && a === 'yí') them('yi2', `${cap} đọc là ${doc} (一 đứng trước thanh 4 thì đổi sang thanh 2)`);
    else if (chu[i] === '一' && a === 'yì') them('yi4', `${cap} đọc là ${doc} (一 đứng trước thanh 1, 2, 3 thì đổi sang thanh 4)`);
    else if (am[i].thanh === 3 && am[i + 1].thanh === 3) {
      them('33', `${cap} ghi ${doc} nhưng chữ đầu đọc gần thanh 2 (hai thanh 3 liền nhau)`);
    }
    if (nhac.length >= 2) break;
  }
  return nhac;
}

/** Lời nhận xét theo điểm */
export function nhanXet(diem) {
  if (diem >= 90) return { muc: 'tot', emoji: '🌟', chu: 'Tuyệt vời! Máy nghe rõ từng chữ.' };
  if (diem >= 70) return { muc: 'kha', emoji: '👍', chu: 'Khá tốt! Chú ý các chữ tô màu.' };
  if (diem >= 40) return { muc: 'tb', emoji: '💪', chu: 'Gần đúng rồi, nghe mẫu rồi thử lại nhé.' };
  return { muc: 'yeu', emoji: '🔁', chu: 'Máy chưa nghe ra. Nói chậm, rõ từng chữ và thử lại.' };
}
export const DIEM_DAT = 70;
/** Điểm tối đa của bài đọc TỪ khi có chữ sai thanh (dưới mức đạt) */
export const DIEM_TU_SAI_THANH = 60;
