// =========================================================
// CÂU HỎI VỀ MỘT TỪ (dùng chung: Trắc nghiệm, Ôn từ vựng tự chấm, các chặng bài học)
//   nghia  : chữ Hán → chọn nghĩa        chu    : nghĩa → chọn chữ Hán
//   nghe   : nghe → chọn chữ Hán         pinyin : chữ Hán → chọn pinyin đúng (đáp án nhiễu: khác dấu thanh)
// Đáp án nhiễu KHÔNG trùng nghĩa với đáp án đúng; bài nghe không đặt các từ đồng âm cạnh nhau;
// chữ một âm tiết đa âm không hỏi dạng nghe (data/thanh-dieu-hsk1.json → daAm).
// =========================================================

import { tatCaTu, nghiaNgan } from './du-lieu.js';
import { esc, tenTuLoai } from './giao-dien.js';
import { demChuHan, bienTheThanh } from './pinyin.js';
import { bieuTuong } from './bieu-tuong.js';

export const TEN_DANG = {
  nghia: 'Chữ Hán → nghĩa', chu: 'Nghĩa → chữ Hán', nghe: 'Nghe → chọn chữ', pinyin: 'Chữ Hán → pinyin',
};

// ---------- Tiện ích ----------
export function tron(mang) {
  const m = mang.slice();
  for (let i = m.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [m[i], m[j]] = [m[j], m[i]];
  }
  return m;
}

/** Các nghĩa của một từ, đã chuẩn hóa ("xin chào (câu chào…)" → "xin chào") để so trùng */
function cacNghia(tu) {
  const ds = new Set();
  for (const n of tu.nghia || []) {
    String(n.nghia).replace(/\([^)]*\)/g, '').split(/[;,]/).forEach((x) => {
      const s = x.trim().toLowerCase();
      if (s) ds.add(s);
    });
  }
  return ds;
}
/** Hai nghĩa coi là trùng khi giống hệt, hoặc nghĩa này nằm trọn (nguyên từ) trong nghĩa kia: "bơi" ⊂ "bơi lội" */
const nghiaChua = (x, y) => x === y || ` ${y} `.includes(` ${x} `) || ` ${x} `.includes(` ${y} `);
const trungNghia = (a, b) => {
  const na = [...cacNghia(a)];
  return [...cacNghia(b)].some((x) => na.some((y) => nghiaChua(x, y)));
};
const pinyinChuan = (tu) => tu.pinyin.replace(/\s/g, '').toLowerCase().normalize('NFC');
/** Bỏ dấu thanh để so "cùng âm" (dùng cho đáp án nhiễu bài nghe) */
const pinyinKhongDau = (tu) => pinyinChuan(tu).normalize('NFD').replace(/[̀-ͯ]/g, '');
const rutGon = (s, toiDa = 70) => (s.length > toiDa ? `${s.slice(0, toiDa - 1).trim()}…` : s);

// ---------- Dữ liệu chữ đa âm (dùng chung file với luyện thanh điệu) ----------
let henDaAm = null;
export function taiDaAm() {
  if (!henDaAm) {
    henDaAm = fetch('data/thanh-dieu-hsk1.json')
      .then((r) => (r.ok ? r.json() : { daAm: [] }))
      .then((j) => new Set(j.daAm || []))
      .catch(() => new Set());
  }
  return henDaAm;
}

/** Các dạng câu hỏi dùng được cho một từ */
export function dangDungDuoc(tu, daAm, coGiong) {
  const ds = ['nghia', 'chu'];
  const soChu = demChuHan(tu.hanzi);
  if (coGiong && !(soChu === 1 && daAm.has(tu.hanzi))) ds.push('nghe');
  if (!tu.pinyin.includes('/') && bienTheThanh(tu.pinyin, soChu).length === 3) ds.push('pinyin');
  return ds;
}

/**
 * Chọn 3 đáp án nhiễu: lọc theo `hopLe`, ưu tiên theo điểm `uuTien`.
 * `khoaTrung(w)`: hai lựa chọn có cùng khóa này thì chỉ lấy một (kể cả trùng với đáp án đúng).
 */
function chonNhieu(tu, hopLe, uuTien, khoaTrung) {
  const daCo = new Set([khoaTrung(tu)]);
  const kq = [];
  const ung = tatCaTu()
    .filter((w) => w.khoa !== tu.khoa && hopLe(w))
    .map((w) => ({ w, diem: uuTien(w) + Math.random() * 1.5 }))
    .sort((a, b) => b.diem - a.diem);
  for (const { w } of ung) {
    const h = khoaTrung(w);
    if (daCo.has(h)) continue;
    daCo.add(h);
    kq.push(w);
    if (kq.length === 3) break;
  }
  return kq;
}

/** Tạo một câu hỏi: { tu, dang, luaChon: [{ hien, dung }] } */
export function taoCau(tu, dang) {
  const soChu = demChuHan(tu.hanzi);
  const cungBai = (w) => (w.maBai === tu.maBai ? 1 : w.cap === tu.cap ? 0.3 : 0);
  const cungSoChu = (w) => (demChuHan(w.hanzi) === soChu ? 2 : 0);
  let dung;
  let nhieu;
  if (dang === 'nghia') {
    const hien = (w) => rutGon(nghiaNgan(w));
    dung = hien(tu);
    nhieu = chonNhieu(tu, (w) => !trungNghia(w, tu),
      (w) => cungBai(w) * 2 + (w.nghia?.[0]?.tuLoai === tu.nghia?.[0]?.tuLoai ? 1.5 : 0), hien).map(hien);
  } else if (dang === 'chu') {
    dung = tu.hanzi;
    nhieu = chonNhieu(tu, (w) => !trungNghia(w, tu) && w.hanzi !== tu.hanzi,
      (w) => cungSoChu(w) + cungBai(w), (w) => w.hanzi).map((w) => w.hanzi);
  } else if (dang === 'nghe') {
    dung = tu.hanzi;
    // so trùng theo PINYIN → 4 lựa chọn luôn đọc khác nhau (không có cặp đồng âm nào)
    nhieu = chonNhieu(tu, (w) => w.hanzi !== tu.hanzi,
      (w) => cungSoChu(w) + (pinyinKhongDau(w) === pinyinKhongDau(tu) ? 2 : 0) + cungBai(w), pinyinChuan).map((w) => w.hanzi);
  } else {
    dung = tu.pinyin;
    nhieu = bienTheThanh(tu.pinyin, soChu, 3);
  }
  const luaChon = tron([{ hien: dung, dung: true }, ...nhieu.map((h) => ({ hien: h, dung: false }))]);
  return { tu, dang, luaChon };
}

// ---------- Hiển thị ----------
/** Đề bài của câu hỏi (dạng nghe có nút #nut-nghe và #nut-cham – nơi dùng tự gắn sự kiện) */
export function htmlDeBai(cau) {
  const { tu } = cau;
  if (cau.dang === 'nghia') return `<p class="cau-hoi">Từ này nghĩa là gì?</p><p class="han tu-hoi">${esc(tu.hanzi)}</p>`;
  if (cau.dang === 'chu') {
    const loai = tu.nghia?.[0]?.tuLoai ? `<span class="nhan nhan-chinh">${esc(tenTuLoai(tu.nghia[0].tuLoai))}</span>` : '';
    return `<p class="cau-hoi">Chữ Hán nào có nghĩa:</p><p class="nghia-hoi">${loai} ${esc(nghiaNgan(tu))}</p>`;
  }
  if (cau.dang === 'nghe') {
    return `<p class="cau-hoi">Nghe và chọn chữ Hán đúng</p>
      <div class="hang-nghe">
        <button class="nut-loa nut-nghe-lon" id="nut-nghe" aria-label="Nghe">${bieuTuong('loa')}</button>
        <button class="nut nut-nho" id="nut-cham">🐢 Chậm</button>
      </div>`;
  }
  return `<p class="cau-hoi">Chọn pinyin đúng (chú ý dấu thanh)</p><p class="han tu-hoi">${esc(tu.hanzi)}</p>`;
}

/** Lưới 4 nút đáp án (data-i = thứ tự trong cau.luaChon) */
export function htmlLuaChon(cau) {
  const kieuNut = cau.dang === 'nghia' ? 'mot-cot' : 'hai-cot';
  const lopChu = cau.dang === 'chu' || cau.dang === 'nghe' ? 'han' : cau.dang === 'pinyin' ? 'pinyin' : '';
  return `<div class="luoi-lua-chon ${kieuNut}">
      ${cau.luaChon.map((l, i) => `<button class="nut-lua-chon" data-i="${i}"><span class="${lopChu}">${esc(l.hien)}</span><kbd>${i + 1}</kbd></button>`).join('')}
    </div>`;
}
