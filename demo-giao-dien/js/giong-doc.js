/* ============================================================
   GIỌNG ĐỌC — đọc chữ Hán bằng giọng tiếng Trung có sẵn trong máy
   (Web Speech API). Nếu máy chưa có giọng zh-CN thì hiện hướng dẫn.
   ============================================================ */
const GiongDoc = (() => {
  const hoTro = 'speechSynthesis' in window;
  let giong = null;          // giọng tiếng Trung tìm được
  let daTim = false;         // đã tìm giọng xong chưa
  let tocDo = 0.8;           // tốc độ đọc (1 = bình thường; người mới học nên chậm)

  /** Danh sách giọng của máy (một số trình duyệt cần chờ mới có) */
  function layDanhSachGiong() {
    return new Promise(xong => {
      if (!hoTro) return xong([]);
      const ds = speechSynthesis.getVoices();
      if (ds.length) return xong(ds);
      const cho = setTimeout(() => xong(speechSynthesis.getVoices()), 1500);
      speechSynthesis.addEventListener('voiceschanged', () => {
        clearTimeout(cho);
        xong(speechSynthesis.getVoices());
      }, { once: true });
    });
  }

  /** Chọn giọng phổ thông Trung Quốc (zh-CN). Không dùng zh-HK vì là tiếng Quảng Đông. */
  async function timGiong() {
    if (daTim) return giong;
    const ds = await layDanhSachGiong();
    const ma = g => (g.lang || '').replace('_', '-').toLowerCase();
    giong =
      ds.find(g => ma(g) === 'zh-cn' && /natural|online/i.test(g.name)) || // giọng tự nhiên (Edge)
      ds.find(g => ma(g) === 'zh-cn') ||
      ds.find(g => ma(g).startsWith('cmn')) ||
      ds.find(g => ma(g) === 'zh-tw') ||
      null;
    daTim = true;
    return giong;
  }

  /**
   * Đọc một đoạn chữ Hán.
   * nutBam: (không bắt buộc) nút loa để làm hiệu ứng "đang đọc".
   */
  async function doc(chu, nutBam) {
    if (!chu) return;
    const g = await timGiong();
    if (!hoTro || !g) { hienHuongDan(); return; }

    speechSynthesis.cancel(); // dừng câu đang đọc dở
    const cau = new SpeechSynthesisUtterance(chu);
    cau.lang = 'zh-CN';
    cau.voice = g;
    cau.rate = tocDo;
    if (nutBam) {
      nutBam.classList.add('dang-doc');
      const tat = () => nutBam.classList.remove('dang-doc');
      cau.onend = tat;
      cau.onerror = tat;
    }
    speechSynthesis.speak(cau);
  }

  /** Thông tin để hiện trong phần Cài đặt */
  async function trangThai() {
    if (!hoTro) return 'Trình duyệt này không hỗ trợ đọc giọng nói.';
    const g = await timGiong();
    return g ? `Đang dùng giọng: ${g.name}` : 'Chưa có giọng tiếng Trung trên máy.';
  }

  function datTocDo(so) { tocDo = so; }
  function layTocDo() { return tocDo; }

  /** Hộp hướng dẫn cài giọng tiếng Trung trên Windows */
  function hienHuongDan() {
    UngDung.moHopThoai(`
      <div class="dau-hop">
        <h2>Máy chưa có giọng đọc tiếng Trung</h2>
        <button class="nut-bieu-tuong" data-dong aria-label="Đóng">${BieuTuong.ve('dong')}</button>
      </div>
      <p class="chu-phu">Cách nhanh nhất: mở demo bằng trình duyệt <b>Microsoft Edge</b> hoặc
        <b>Google Chrome</b> khi có mạng — hai trình duyệt này thường có sẵn giọng tiếng Trung.</p>
      <p><b>Nếu vẫn chưa có, cài giọng trên Windows 11:</b></p>
      <ol class="huong-dan">
        <li>Bấm nút <b>Start</b> → mở <b>Cài đặt</b> (Settings).</li>
        <li>Chọn <b>Thời gian và ngôn ngữ</b> → <b>Giọng nói</b> (Speech).</li>
        <li>Ở mục <b>Quản lý giọng nói</b>, bấm <b>Thêm giọng nói</b> (Add voices).</li>
        <li>Gõ <b>Chinese</b> để tìm, tích chọn <b>Tiếng Trung (Giản thể, Trung Quốc)</b>,
            bấm <b>Thêm</b> và chờ tải xong.</li>
        <li><b>Đóng hẳn trình duyệt</b> rồi bấm đúp lại <b>chay-demo.bat</b>.</li>
      </ol>
      <p class="chu-phu">Cách khác: Cài đặt → Thời gian và ngôn ngữ → Ngôn ngữ và khu vực →
        Thêm ngôn ngữ → chọn Tiếng Trung (Giản thể, Trung Quốc) → nhớ tích ô
        <b>Chuyển văn bản thành giọng nói</b> (Text-to-speech).</p>
      <button class="nut nut-chinh nut-rong" data-dong>Đã hiểu</button>
    `);
  }

  return { doc, timGiong, trangThai, datTocDo, layTocDo, hienHuongDan, hoTro };
})();
