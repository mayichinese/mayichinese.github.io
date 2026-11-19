// =========================================================
// BIỂU TƯỢNG (icon) vẽ bằng SVG – không cần tải ảnh từ ngoài.
// Cách dùng:  bieuTuong('nha')  → trả về đoạn HTML <svg>
// =========================================================

// Mỗi biểu tượng là các nét vẽ trong khung 24 x 24
const NET_VE = {
  'nha':       '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  'sach':      '<path d="M4 19V5a2 2 0 0 1 2-2h14v14H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 0 2 2h14v-4"/>',
  'but':       '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  'bieu-do':   '<path d="M3 3v18h18"/><path d="M8 17v-5M13 17V8M18 17V5"/>',
  'mat-troi':  '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  'mat-trang': '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  'man-hinh':  '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  'cai-dat':   '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  'loa':       '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>',
  'phai':      '<path d="m9 6 6 6-6 6"/>',
  'trai':      '<path d="m15 6-6 6 6 6"/>',
  'bat-dau':   '<path d="M7 4v16l13-8z"/>',
  'ta':        '<path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11"/>',
  'thi':       '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2.5h6V4"/><path d="m9 13 2 2 4-4"/>',
  'nguoi':     '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
};

/**
 * Trả về thẻ <svg> của biểu tượng.
 * @param {string} ten  tên biểu tượng (khóa trong NET_VE)
 * @param {string} lop  thêm lớp CSS nếu cần
 */
export function bieuTuong(ten, lop = '') {
  return `<svg class="bt ${lop}" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
         `stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${NET_VE[ten] || ''}</svg>`;
}

/** Tìm mọi phần tử có thuộc tính data-bt="ten" và chèn biểu tượng vào */
export function ganBieuTuong(goc = document) {
  goc.querySelectorAll('[data-bt]').forEach((el) => { el.innerHTML = bieuTuong(el.dataset.bt); });
}
