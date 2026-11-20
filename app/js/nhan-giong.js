// =========================================================
// MICRO: NHẬN DẠNG GIỌNG NÓI + GHI ÂM
//   - ngheNoi(): dùng bộ nhận dạng giọng nói có sẵn của trình duyệt (Web Speech API, tiếng zh-CN).
//       Chrome (Android, máy tính) gửi tiếng nói tới máy chủ Google để chuyển thành chữ → CẦN MẠNG.
//       Safari trên iPhone dùng bộ đọc chính tả của Apple (cần bật "Đọc chính tả" trong Cài đặt).
//       App không lưu bản ghi giọng nói.
//   - ghiAm(): ghi âm giọng người học để tự nghe lại (dùng khi máy không nhận dạng được).
// =========================================================

const SR = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

/** Máy có chấm tự động được không */
export const coNhanDang = () => !!SR;
/** Máy có ghi âm được không */
export const coGhiAm = () => !!(typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia && window.MediaRecorder);

const LOI = {
  'not-allowed': 'App chưa được phép dùng micro. Hãy cho phép micro (biểu tượng 🔒 hoặc ⓘ cạnh địa chỉ trang, hoặc Cài đặt của điện thoại) rồi thử lại.',
  'service-not-allowed': 'Trình duyệt không cho dùng dịch vụ nhận dạng giọng nói. Trên iPhone: bật Cài đặt → Cài đặt chung → Bàn phím → Đọc chính tả.',
  'no-speech': 'Không nghe thấy tiếng. Bấm 🎤 rồi nói to, rõ hơn một chút.',
  'audio-capture': 'Không tìm thấy micro trên máy.',
  network: 'Cần kết nối mạng để chấm phát âm (máy gửi tiếng nói tới dịch vụ nhận dạng).',
  'language-not-supported': 'Máy chưa hỗ trợ nhận dạng tiếng Trung.',
};
export const moTaLoi = (ma) => LOI[ma] || `Có lỗi khi nghe (${ma}). Thử lại nhé.`;

/**
 * Bắt đầu nghe người học nói (tự dừng khi người nói ngừng, hoặc gọi dung()).
 * @param {object} tuyChon
 *   khiNghe(chuoi): gọi liên tục với chữ máy đang nghe được (để hiện ngay trên màn hình)
 *   toiDa: số giây tối đa (mặc định 10)
 * @returns {{ ketQua: Promise<string[]>, dung: Function }}
 *   ketQua: các phương án chữ Hán máy nhận dạng được (phương án tốt nhất đứng đầu);
 *   lỗi → Promise bị từ chối với { ma, chu } (chu = lời giải thích tiếng Việt)
 */
export function ngheNoi({ khiNghe = () => {}, toiDa = 10 } = {}) {
  if (!SR) return { ketQua: Promise.reject({ ma: 'khong-ho-tro', chu: 'Trình duyệt này chưa hỗ trợ nhận dạng giọng nói.' }), dung() {} };
  window.speechSynthesis?.cancel();   // dừng giọng mẫu đang đọc (để máy không tự nghe chính nó)
  const rec = new SR();
  rec.lang = 'zh-CN';
  rec.interimResults = true;
  rec.maxAlternatives = 5;
  rec.continuous = false;
  let loi = null;
  let cacKetQua = [];   // [[phương án 1, 2, ...] của từng đoạn]
  let henGio = null;
  let daDung = false;
  const ketQua = new Promise((xong, hong) => {
    rec.onresult = (e) => {
      cacKetQua = [];
      let dangNghe = '';
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        dangNghe += r[0].transcript;
        if (r.isFinal) cacKetQua.push(Array.from(r, (a) => a.transcript));
      }
      khiNghe(dangNghe);
    };
    rec.onerror = (e) => { loi = e.error; };
    rec.onend = () => {
      clearTimeout(henGio);
      if (cacKetQua.length) {
        // ghép các đoạn: phương án k = phương án k của mỗi đoạn (thiếu thì lấy phương án 1)
        const soPa = Math.max(...cacKetQua.map((d) => d.length));
        const ds = [];
        for (let k = 0; k < soPa; k++) ds.push(cacKetQua.map((d) => d[k] ?? d[0]).join(''));
        xong([...new Set(ds)]);
      } else if (loi === 'aborted' || (!loi && daDung)) {
        xong([]);
      } else {
        const ma = loi || 'no-speech';
        hong({ ma, chu: moTaLoi(ma) });
      }
    };
  });
  try {
    rec.start();
  } catch (e) {
    return { ketQua: Promise.reject({ ma: 'loi', chu: moTaLoi(e.message || 'start') }), dung() {} };
  }
  henGio = setTimeout(() => rec.stop(), toiDa * 1000);
  return {
    ketQua,
    dung() { if (!daDung) { daDung = true; try { rec.stop(); } catch { /* đã dừng */ } } },
  };
}

/**
 * Ghi âm giọng người học (tối đa `toiDa` giây).
 * @returns {Promise<{ dung: () => Promise<string|null> }>}  dung() trả về địa chỉ đoạn ghi âm để phát lại
 */
export async function ghiAm(toiDa = 8) {
  let luong;
  try {
    luong = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    throw { ma: 'not-allowed', chu: moTaLoi(e?.name === 'NotFoundError' ? 'audio-capture' : 'not-allowed') };
  }
  const may = new MediaRecorder(luong);
  const manh = [];
  may.ondataavailable = (e) => { if (e.data.size) manh.push(e.data); };
  const xong = new Promise((r) => {
    may.onstop = () => {
      luong.getTracks().forEach((t) => t.stop());
      r(manh.length ? URL.createObjectURL(new Blob(manh, { type: may.mimeType || 'audio/webm' })) : null);
    };
  });
  may.start();
  const henGio = setTimeout(() => { if (may.state === 'recording') may.stop(); }, toiDa * 1000);
  return {
    dung() {
      clearTimeout(henGio);
      if (may.state === 'recording') may.stop();
      return xong;
    },
  };
}
