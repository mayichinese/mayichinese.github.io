/* ============================================================
   BIỂU TƯỢNG (icon) vẽ bằng SVG — không cần tải ảnh từ ngoài.
   Cách dùng:  BieuTuong.ve('nha')  -> trả về đoạn HTML <svg>
   ============================================================ */
const BieuTuong = (() => {
  // Mỗi biểu tượng là các nét vẽ trong khung 24 x 24
  const NET_VE = {
    'nha':        '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    'sach':       '<path d="M4 19V5a2 2 0 0 1 2-2h14v14H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 0 2 2h14v-4"/>',
    'the':        '<rect x="3" y="7" width="13" height="14" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v11"/>',
    'but':        '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    'bieu-do':    '<path d="M3 3v18h18"/><path d="M8 17v-5M13 17V8M18 17V5"/>',
    'mat-troi':   '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    'mat-trang':  '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    'bang-mau':   '<path d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.3A5.7 5.7 0 0 0 22 9.7C22 5.4 17.5 2 12 2z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="6.8" r="1.2"/><circle cx="15" cy="6.8" r="1.2"/>',
    'cai-dat':    '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
    'loa':        '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>',
    'lua':        '<path d="M12 22c4 0 7-2.8 7-6.8 0-3.2-2-5.7-3.5-7.2.1 2-1 3.3-2.3 3.5C13.8 8 12.5 4.5 9 2c.4 3.2-1.6 5.3-3 7.2C4.8 10.8 5 12.6 5 15.2 5 19.2 8 22 12 22z"/>',
    'dong':       '<path d="M6 6l12 12M18 6 6 18"/>',
    'phai':       '<path d="m9 6 6 6-6 6"/>',
    'trai':       '<path d="m15 6-6 6 6 6"/>',
    'on-lai':     '<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/>',
    'tu-moi':     '<path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z"/>',
    'tai-nghe':   '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z"/>',
    'trac-nghiem':'<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    'bat-dau':    '<path d="M7 4v16l13-8z"/>',
    'dong-ho':    '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    'xong':       '<path d="M5 12.5l4.5 4.5L19 7.5"/>'
  };

  /**
   * Trả về thẻ <svg> của biểu tượng.
   * @param {string} ten  tên biểu tượng (khóa trong NET_VE)
   * @param {string} lop  thêm lớp CSS nếu cần
   */
  function ve(ten, lop = '') {
    const net = NET_VE[ten] || '';
    return `<svg class="bt ${lop}" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
           `stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${net}</svg>`;
  }

  /** Tìm mọi phần tử có thuộc tính data-bt="ten" và chèn biểu tượng vào */
  function gan(goc = document) {
    goc.querySelectorAll('[data-bt]').forEach(el => { el.innerHTML = ve(el.dataset.bt); });
  }

  return { ve, gan };
})();
