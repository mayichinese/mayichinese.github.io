// =========================================================
// NÉT CHỮ – vẽ thứ tự nét và chấm bài viết bằng thư viện Hanzi Writer (app/lib/).
// Dữ liệu nét nằm sẵn trong app/data/net-chu-hsk1.json (tạo bởi cong-cu/tai-du-lieu-viet.py)
// nên chạy được khi không có mạng.
// Thư viện chỉ được tải khi cần (lần đầu mở Luyện viết hoặc "Cách viết").
// =========================================================

let henThuVien = null;
let henDuLieu = null;

/** Tải thư viện Hanzi Writer (một lần). Trả về đối tượng HanziWriter. */
function taiThuVien() {
  if (!henThuVien) {
    henThuVien = new Promise((xong, loi) => {
      if (window.HanziWriter) { xong(window.HanziWriter); return; }
      const the = document.createElement('script');
      the.src = 'lib/hanzi-writer.min.js';
      the.onload = () => xong(window.HanziWriter);
      the.onerror = () => { henThuVien = null; loi(new Error('Không tải được thư viện vẽ nét chữ (lib/hanzi-writer.min.js).')); };
      document.head.appendChild(the);
    });
  }
  return henThuVien;
}

/** Tải dữ liệu nét chữ (một lần): { vietTay12: [chữ…], net: { chữ: dữ liệu nét } } */
export function taiNetChu() {
  if (!henDuLieu) {
    henDuLieu = fetch('data/net-chu-hsk1.json')
      .then((r) => {
        if (!r.ok) throw new Error(`Không tìm thấy file data/net-chu-hsk1.json (mã lỗi ${r.status}).`);
        return r.json();
      })
      .catch((e) => { henDuLieu = null; throw e; });
  }
  return henDuLieu;
}

/** Màu nét theo giao diện sáng/tối đang dùng (đọc từ biến CSS). */
function mauNet() {
  const css = getComputedStyle(document.documentElement);
  const bien = (ten) => css.getPropertyValue(ten).trim();
  const toi = document.documentElement.dataset.giaoDien === 'toi';
  return {
    strokeColor: bien('--chu'),                     // nét chữ hoàn chỉnh
    radicalColor: null,
    outlineColor: toi ? '#3d3330' : '#e6d6cf',      // nét mờ để viết theo
    drawingColor: bien('--chinh-chu'),              // nét người dùng đang vẽ
    highlightColor: bien('--thanh-3'),              // nét gợi ý / nét vừa đúng
  };
}

/**
 * Tạo bảng vẽ một chữ trong phần tử `khung`.
 * @param {HTMLElement} khung   phần tử chứa (nên có lớp .o-viet để có lưới ô chữ điền)
 * @param {string} chu          một chữ Hán
 * @param {object} tuyChon      tùy chọn thêm của Hanzi Writer (showOutline, showCharacter…)
 * @returns {Promise<object>}   đối tượng writer (animateCharacter, quiz, cancelQuiz…)
 */
export async function taoBangVe(khung, chu, tuyChon = {}) {
  const [HanziWriter, duLieu] = await Promise.all([taiThuVien(), taiNetChu()]);
  if (!duLieu.net[chu]) throw new Error('Chưa có dữ liệu nét cho chữ này.');
  khung.innerHTML = '';
  const co = Math.round(khung.clientWidth || 260);
  return HanziWriter.create(khung, chu, {
    width: co,
    height: co,
    padding: Math.round(co * 0.06),
    showOutline: true,
    showCharacter: true,
    strokeAnimationSpeed: 1,
    delayBetweenStrokes: 220,
    strokeHighlightSpeed: 2,
    renderer: 'svg',
    ...mauNet(),
    ...tuyChon,
    charDataLoader: (c, onLoad, onError) => {
      if (duLieu.net[c]) onLoad(duLieu.net[c]);
      else onError(new Error('Không có dữ liệu nét'));
    },
  });
}

/** Phát hoạt cảnh viết chữ (trả về Promise khi xong). */
export function phatHoatCanh(writer) {
  return new Promise((xong) => writer.animateCharacter({ onComplete: xong }));
}
