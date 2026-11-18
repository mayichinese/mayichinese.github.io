// =========================================================
// PHÁT ÂM – dùng giọng đọc tiếng Trung có sẵn của trình duyệt / hệ điều hành
// (Web Speech API, không cần mạng nếu máy đã có giọng đọc tiếng Trung).
// =========================================================

import { caiDat } from './luu-tru.js';

const coHoTro = typeof window !== 'undefined' && 'speechSynthesis' in window;
let dsGiong = [];

/** Danh sách giọng đọc tiếng Trung trên máy (ưu tiên giọng phổ thông đại lục zh-CN). */
export function giongTiengTrung() {
  return dsGiong
    .filter((g) => /^zh|^cmn/i.test(g.lang))
    .sort((a, b) => diem(b) - diem(a));
}
function diem(g) {
  let d = 0;
  if (/zh[-_]CN|cmn/i.test(g.lang)) d += 10;   // tiếng phổ thông đại lục
  if (/HK|yue|Cantonese/i.test(g.lang + g.name)) d -= 20; // tiếng Quảng Đông → tránh
  if (/TW/i.test(g.lang)) d -= 2;
  if (/Natural|Neural|Online|Google/i.test(g.name)) d += 3; // giọng tự nhiên hơn
  return d;
}

function napGiong() {
  if (!coHoTro) return;
  dsGiong = window.speechSynthesis.getVoices();
}
if (coHoTro) {
  napGiong();
  // Chrome/Edge tải danh sách giọng chậm → nghe sự kiện để cập nhật
  window.speechSynthesis.addEventListener?.('voiceschanged', napGiong);
}

/** Chờ danh sách giọng sẵn sàng (tối đa ~2 giây). */
export function choGiong() {
  return new Promise((xong) => {
    if (!coHoTro) return xong([]);
    let lan = 0;
    const kiem = () => {
      napGiong();
      if (dsGiong.length || lan++ > 20) xong(giongTiengTrung());
      else setTimeout(kiem, 100);
    };
    kiem();
  });
}

/** Trạng thái để hiển thị cảnh báo cho người dùng. */
export function tinhTrangPhatAm() {
  if (!coHoTro) return 'khong-ho-tro';
  if (!dsGiong.length) return 'chua-ro';
  return giongTiengTrung().length ? 'tot' : 'khong-co-giong';
}

/** Đọc một đoạn chữ Hán. */
export function doc(chu, tocDo) {
  if (!coHoTro || !chu) return;
  const s = window.speechSynthesis;
  s.cancel(); // dừng câu đang đọc dở
  const u = new SpeechSynthesisUtterance(chu.replace(/[0-9]/g, '')); // bỏ số phân biệt (本1 → 本)
  u.lang = 'zh-CN';
  const cd = caiDat();
  const ds = giongTiengTrung();
  const giong = ds.find((g) => g.name === cd.giongDoc) || ds[0];
  if (giong) u.voice = giong;
  u.rate = tocDo ?? cd.tocDoDoc ?? 0.8;
  s.speak(u);
}
