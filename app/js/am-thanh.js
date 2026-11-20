// =========================================================
// ÂM THANH ĐÚNG / SAI – tạo bằng Web Audio (không cần file âm thanh, chạy offline)
//   amDung()  : "ting-tinh" vui (hai nốt đi lên)
//   amSai()   : "bụp" trầm ngắn
//   amXong()  : ba nốt đi lên khi xong một cửa / một lượt
// Tắt được trong Cài đặt (caiDat.amHieuUng = false).
// =========================================================

import { caiDat } from './luu-tru.js';

let ctx = null;
function layCtx() {
  if (caiDat().amHieuUng === false) return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** Một nốt: tần số (Hz), lúc bắt đầu (giây, tính từ bây giờ), độ dài, kiểu sóng, âm lượng */
function not(c, tan, batDau, dai, kieu = 'sine', to = 0.18) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = kieu;
  o.frequency.value = tan;
  const t0 = c.currentTime + batDau;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(to, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dai);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dai + 0.02);
}

export function amDung() {
  const c = layCtx();
  if (!c) return;
  not(c, 880, 0, 0.12);        // A5
  not(c, 1318.5, 0.09, 0.22);  // E6
}

export function amSai() {
  const c = layCtx();
  if (!c) return;
  not(c, 196, 0, 0.18, 'triangle', 0.22);   // G3
  not(c, 155.6, 0.12, 0.26, 'triangle', 0.2); // D#3
}

export function amXong() {
  const c = layCtx();
  if (!c) return;
  [659.3, 830.6, 987.8, 1318.5].forEach((f, i) => not(c, f, i * 0.09, 0.2));
}

/** Gọi khi chấm một câu: đúng → amDung, sai → amSai */
export const amCham = (dung) => (dung ? amDung() : amSai());
