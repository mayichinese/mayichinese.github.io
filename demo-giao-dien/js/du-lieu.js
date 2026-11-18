/* ============================================================
   DỮ LIỆU — đọc file JSON của app (CHỈ ĐỌC, không ghi gì).
   Mọi nội dung tiếng Trung đều lấy từ file, không gõ trong code.
   ============================================================ */
const DuLieu = (() => {
  // Đường dẫn file dữ liệu từng cấp (tính từ thư mục demo-giao-dien/)
  const DUONG_DAN = {
    1: '../app/data/hsk1.json',
    2: '../app/data/hsk2.json',
    3: '../app/data/hsk3.json'
  };

  const cacCap = {};     // dữ liệu đã tải: cacCap[1] = { capDo, baiHoc: [...] } hoặc null nếu chưa có file
  let bangTuLoai = {};   // bảng đổi từ loại -> tiếng Việt (từ file tu-loai.json)

  /** Tải một file JSON; trả về null nếu không có file */
  async function taiJson(duongDan) {
    try {
      const phanHoi = await fetch(duongDan, { cache: 'no-store' });
      if (!phanHoi.ok) return null;
      return await phanHoi.json();
    } catch (e) {
      return null;
    }
  }

  /** Chuẩn hóa dữ liệu một cấp để các màn hình dùng cho tiện */
  function chuanHoa(json, cap) {
    const baiHoc = (json.baiHoc || []).map(bai => {
      const tu = (bai.tu || []).map((t, viTri) => ({
        ...t,
        // Mã riêng cho mỗi từ (dùng để lưu tiến độ). Ưu tiên số thứ tự chính thức.
        id: t.soThuTu != null ? `hsk${cap}-${t.soThuTu}` : `hsk${cap}-b${bai.so}-${viTri}`,
        cap,
        bai: bai.so,
        daSoan: t.daSoan === true
      }));
      return {
        so: bai.so,
        ten: bai.ten,
        cap,
        soTu: bai.soTu || tu.length,
        tu,
        // Bài học được khi đã soạn xong và có ít nhất một từ đã soạn
        daSoan: bai.daSoanXong === true && tu.some(t => t.daSoan)
      };
    });
    return { capDo: json.capDo || cap, baiHoc };
  }

  /** Tải dữ liệu một cấp (chỉ tải 1 lần, lần sau dùng lại) */
  async function taiCap(cap) {
    if (cap in cacCap) return cacCap[cap];
    const json = await taiJson(DUONG_DAN[cap]);
    cacCap[cap] = json ? chuanHoa(json, cap) : null;
    return cacCap[cap];
  }

  /** Tải mọi thứ cần lúc mở app */
  async function khoiDong() {
    const [tuLoai] = await Promise.all([taiJson('tu-loai.json'), taiCap(1), taiCap(2), taiCap(3)]);
    bangTuLoai = (tuLoai && tuLoai.bang) || {};
    return cacCap[1] !== null; // false = không đọc được dữ liệu HSK 1
  }

  /* ---------- Hàm tra cứu ---------- */

  /** Dữ liệu một cấp (null nếu chưa có file) */
  function cap(so) { return cacCap[so] || null; }

  /** Danh sách bài của một cấp */
  function danhSachBai(soCap) { return cap(soCap) ? cap(soCap).baiHoc : []; }

  /** Một bài cụ thể */
  function bai(soCap, soBai) { return danhSachBai(soCap).find(b => b.so === soBai) || null; }

  /** Mọi từ ĐÃ SOẠN của các cấp đã tải (dùng cho ôn tập) */
  function tatCaTuDaSoan() {
    const kq = [];
    [1, 2, 3].forEach(c => danhSachBai(c).forEach(b => {
      if (b.daSoan) b.tu.forEach(t => { if (t.daSoan) kq.push(t); });
    }));
    return kq;
  }

  /** Tìm một từ theo mã */
  function timTu(id) { return tatCaTuDaSoan().find(t => t.id === id) || null; }

  /**
   * Đổi từ loại sang tiếng Việt. Ký hiệu chưa có trong bảng thì giữ nguyên.
   * Ký hiệu có thể ghép nhiều loại, vd "A、B" -> đổi từng phần.
   */
  function tenTuLoai(kyHieu) {
    if (!kyHieu) return '';
    if (bangTuLoai[kyHieu]) return bangTuLoai[kyHieu];
    return kyHieu.split(/[、,，]/).map(p => p.trim()).filter(Boolean)
      .map(p => bangTuLoai[p] || p).join(', ');
  }

  return { khoiDong, taiCap, cap, danhSachBai, bai, tatCaTuDaSoan, timTu, tenTuLoai };
})();
