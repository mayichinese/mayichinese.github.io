// =========================================================
// NÉT CHỮ – vẽ thứ tự nét và chấm bài viết bằng thư viện Hanzi Writer (app/lib/).
// Dữ liệu nét nằm sẵn trong app/data/net-chu-hsk1.json và net-chu-hsk23.json (tạo bởi cong-cu/tai-du-lieu-viet.py)
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

/**
 * Tải dữ liệu nét chữ (một lần), gộp hai file:
 *   data/net-chu-hsk1.json  – chữ trong từ HSK 1 + 100 chữ viết tay cấp 1–2 (bắt buộc)
 *   data/net-chu-hsk23.json – chữ còn lại trong từ HSK 2–3 + 150 chữ viết tay cấp 3 (thiếu thì bỏ qua)
 * Trả về { vietTay12: [chữ…], vietTay3: [chữ…], net: { chữ: dữ liệu nét } }
 */
export function taiNetChu() {
  if (!henDuLieu) {
    const doc = (tep, batBuoc) => fetch(tep)
      .then((r) => {
        if (!r.ok) {
          if (!batBuoc) return null;
          throw new Error(`Không tìm thấy file ${tep} (mã lỗi ${r.status}).`);
        }
        return r.json();
      })
      .catch((e) => { if (batBuoc) throw e; return null; });
    henDuLieu = Promise.all([doc('data/net-chu-hsk1.json', true), doc('data/net-chu-hsk23.json', false)])
      .then(([a, b]) => ({
        vietTay12: a.vietTay12 || [],
        vietTay3: b?.vietTay3 || [],
        net: { ...(b?.net || {}), ...a.net },
      }))
      .catch((e) => { henDuLieu = null; throw e; });
  }
  return henDuLieu;
}

/**
 * Số nét sai tối đa mà vẫn tính là viết đúng, theo độ dài chữ (bản soát chuyên gia 6.5):
 * chữ ≤ 5 nét → 1 · 6–9 nét → 2 · ≥ 10 nét → 3. (Trước đây mọi chữ đều cho sai 3 nét – quá rộng với 口, 人, 大.)
 */
export const saiToiDa = (soNet) => (soNet <= 5 ? 1 : soNet <= 9 ? 2 : 3);

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
