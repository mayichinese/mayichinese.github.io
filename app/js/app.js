// =========================================================
// ĐIỂM KHỞI ĐỘNG CỦA APP
// 1. Đọc tiến độ đã lưu trên máy
// 2. Tải dữ liệu từ vựng
// 3. Vẽ màn hình theo địa chỉ (#/...) và vẽ lại mỗi khi địa chỉ đổi
// 4. Đăng ký chạy offline (service worker)
// =========================================================

import { docTienDo, caiDat } from './luu-tru.js';
import { taiDuLieu } from './du-lieu.js';
import { veTheoDiaChi, esc } from './giao-dien.js';

async function khoiDong() {
  docTienDo();
  document.body.classList.toggle('kieu-khai', !!caiDat().kieuChuKhai);
  try {
    await taiDuLieu();
  } catch (e) {
    document.getElementById('noi-dung').innerHTML =
      `<h1>Không tải được dữ liệu</h1><div class="loi">${esc(e.message)}</div>`;
    return;
  }
  window.addEventListener('hashchange', veTheoDiaChi);
  veTheoDiaChi();
}

khoiDong();

// Chạy offline: service worker lưu sẵn các file của app trong máy.
// Chỉ hoạt động khi mở qua http://localhost hoặc https:// (không hoạt động khi mở file trực tiếp).
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Không đăng ký được chế độ offline', e));
}
