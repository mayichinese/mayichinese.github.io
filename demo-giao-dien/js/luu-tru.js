/* ============================================================
   LƯU TRỮ — ghi nhớ tiến độ học trên trình duyệt (localStorage)
   Gồm:
   - caiDat : phương án màu, chế độ sáng/tối
   - the    : trạng thái ôn tập của từng từ (lịch ôn)
   - ngayHoc: số phút học mỗi ngày, chia theo 5 phần của kế hoạch
   ============================================================ */
const LuuTru = (() => {
  const TIEN_TO = 'demoHSK.';   // tiền tố tên khóa, tránh lẫn với trang khác

  // Mục tiêu mỗi ngày (phút) cho 5 phần — tổng 60 phút
  const KE_HOACH = [
    { ma: 'on',      ten: 'Ôn từ đến hạn',          phut: 15, emoji: '🔁' },
    { ma: 'moi',     ten: 'Học từ mới',              phut: 15, emoji: '✨' },
    { ma: 'nghe',    ten: 'Nghe & thanh điệu',       phut: 10, emoji: '🎧' },
    { ma: 'viet',    ten: 'Viết chữ',                phut: 10, emoji: '✍️' },
    { ma: 'nguPhap', ten: 'Ngữ pháp & trắc nghiệm',  phut: 10, emoji: '🧩' }
  ];
  const TU_MOI_MOI_NGAY = 10;  // số từ mới mục tiêu mỗi ngày
  const NGAY_DA_THUOC = 7;     // khoảng ôn từ 7 ngày trở lên = "đã thuộc"

  /* ---------- Đọc / ghi an toàn (không lỗi nếu trình duyệt chặn) ---------- */
  function doc(khoa, macDinh) {
    try {
      const giaTri = localStorage.getItem(TIEN_TO + khoa);
      return giaTri ? JSON.parse(giaTri) : macDinh;
    } catch (e) { return macDinh; }
  }
  function ghi(khoa, giaTri) {
    try { localStorage.setItem(TIEN_TO + khoa, JSON.stringify(giaTri)); } catch (e) { /* bỏ qua */ }
  }

  /* ---------- Ngày tháng (theo giờ máy, dạng 2026-11-18) ---------- */
  function chuoiNgay(ngay = new Date()) {
    const y = ngay.getFullYear();
    const m = String(ngay.getMonth() + 1).padStart(2, '0');
    const d = String(ngay.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  function homNay() { return chuoiNgay(); }
  /** Cộng thêm n ngày vào hôm nay (n âm = lùi lại) */
  function congNgay(n) {
    const ngay = new Date();
    ngay.setDate(ngay.getDate() + n);
    return chuoiNgay(ngay);
  }

  /* ---------- Cài đặt ---------- */
  // cheDo: 'mac-dinh' (A sáng, B tối) | 'tu-dong' (theo máy) | 'sang' | 'toi'
  function layCaiDat() { return Object.assign({ bangMau: 'b', cheDo: 'mac-dinh' }, doc('caiDat', {})); }
  function luuCaiDat(thayDoi) { ghi('caiDat', Object.assign(layCaiDat(), thayDoi)); }

  /* ---------- Lịch ôn từng từ ----------
     Mỗi từ lưu: { khoang: số ngày đến lần ôn sau, han: ngày đến hạn,
                   soLan: số lần đã ôn, lanDau: ngày học lần đầu, quen: số lần quên } */
  function layTatCaThe() { return doc('the', {}); }
  function layThe(id) { return layTatCaThe()[id] || null; }

  /**
   * Tính khoảng ôn tiếp theo (số ngày) cho mỗi lựa chọn.
   * 0 = ôn lại ngay trong buổi học này.
   */
  function tinhKhoang(theCu, muc) {
    const k = theCu ? theCu.khoang : 0;
    if (muc === 'quen') return 0;
    if (!theCu || k === 0) return { kho: 1, nho: 3, de: 5 }[muc];      // lần đầu
    if (muc === 'kho') return Math.max(1, Math.round(k * 1.2));
    if (muc === 'nho') return Math.max(3, Math.round(k * 2.5));
    return Math.max(5, Math.round(k * 3.5));                            // 'de'
  }

  /** Ghi kết quả ôn 1 từ. muc = 'quen' | 'kho' | 'nho' | 'de' */
  function capNhatThe(id, muc) {
    const tatCa = layTatCaThe();
    const cu = tatCa[id] || null;
    const khoang = tinhKhoang(cu, muc);
    tatCa[id] = {
      khoang,
      han: congNgay(khoang),
      soLan: (cu ? cu.soLan : 0) + 1,
      lanDau: cu ? cu.lanDau : homNay(),
      quen: (cu ? cu.quen : 0) + (muc === 'quen' ? 1 : 0)
    };
    ghi('the', tatCa);
    return tatCa[id];
  }

  function daHoc(id) { return !!layTatCaThe()[id]; }
  function daThuoc(the) { return !!the && the.khoang >= NGAY_DA_THUOC; }
  function denHan(the) { return !!the && the.han <= homNay(); }

  /** Diễn đạt khoảng ôn thành chữ: "1 ngày", "2 tuần"... */
  function dienDatKhoang(ngay) {
    if (ngay <= 0) return 'ôn lại ngay';
    if (ngay < 14) return `${ngay} ngày`;
    if (ngay < 60) return `${Math.round(ngay / 7)} tuần`;
    return `${Math.round(ngay / 30)} tháng`;
  }

  /* ---------- Thời gian học mỗi ngày ---------- */
  function layNgayHoc() { return doc('ngayHoc', {}); }

  /** Cộng thêm số giây học vào một phần (ma) của ngày hôm nay */
  function congThoiGian(ma, giay) {
    if (!giay || giay <= 0) return;
    const tatCa = layNgayHoc();
    const ngay = tatCa[homNay()] || (tatCa[homNay()] = { giay: {}, tuMoi: 0 });
    ngay.giay[ma] = (ngay.giay[ma] || 0) + giay;
    ghi('ngayHoc', tatCa);
  }
  /** Đếm thêm 1 từ mới đã học hôm nay */
  function demTuMoi() {
    const tatCa = layNgayHoc();
    const ngay = tatCa[homNay()] || (tatCa[homNay()] = { giay: {}, tuMoi: 0 });
    ngay.tuMoi = (ngay.tuMoi || 0) + 1;
    ghi('ngayHoc', tatCa);
  }
  /** Số liệu một ngày: { phut: {on, moi, ...}, tongPhut, tuMoi } */
  function soLieuNgay(chuoi = homNay()) {
    const ngay = layNgayHoc()[chuoi] || { giay: {}, tuMoi: 0 };
    const phut = {};
    let tong = 0;
    KE_HOACH.forEach(p => {
      phut[p.ma] = Math.floor((ngay.giay[p.ma] || 0) / 60);
      tong += (ngay.giay[p.ma] || 0);
    });
    return { phut, tongPhut: Math.floor(tong / 60), tuMoi: ngay.tuMoi || 0, coHoc: tong > 0 };
  }

  /** Chuỗi ngày học liên tục (tính cả hôm qua nếu hôm nay chưa học) */
  function chuoiNgayLienTuc() {
    let dem = 0;
    let lui = soLieuNgay(homNay()).coHoc ? 0 : -1;
    while (soLieuNgay(congNgay(lui)).coHoc) { dem++; lui--; }
    return dem;
  }

  /* ---------- Số liệu mẫu (để xem giao diện khi chưa học) ---------- */
  function taoSoLieuMau() {
    const tatCa = layNgayHoc();
    // 6 ngày trước: mỗi ngày một ít phút khác nhau (chỉ để xem thử)
    const mau = [42, 55, 30, 61, 48, 25];
    mau.forEach((phut, i) => {
      const ngay = congNgay(-(6 - i));
      const giay = phut * 60;
      tatCa[ngay] = {
        giay: { on: giay * .25, moi: giay * .25, nghe: giay * .17, viet: giay * .17, nguPhap: giay * .16 },
        tuMoi: 8
      };
    });
    // Hôm nay: đã làm được một phần nghe & viết
    const homNayCu = tatCa[homNay()] || { giay: {}, tuMoi: 0 };
    homNayCu.giay.nghe = Math.max(homNayCu.giay.nghe || 0, 4 * 60);
    homNayCu.giay.viet = Math.max(homNayCu.giay.viet || 0, 6 * 60);
    tatCa[homNay()] = homNayCu;
    ghi('ngayHoc', tatCa);
  }

  /** Xóa toàn bộ tiến độ (giữ lại cài đặt màu) */
  function xoaTienDo() {
    try {
      localStorage.removeItem(TIEN_TO + 'the');
      localStorage.removeItem(TIEN_TO + 'ngayHoc');
    } catch (e) { /* bỏ qua */ }
  }

  return {
    KE_HOACH, TU_MOI_MOI_NGAY,
    homNay, congNgay,
    layCaiDat, luuCaiDat,
    layTatCaThe, layThe, tinhKhoang, capNhatThe, daHoc, daThuoc, denHan, dienDatKhoang,
    congThoiGian, demTuMoi, soLieuNgay, chuoiNgayLienTuc,
    taoSoLieuMau, xoaTienDo
  };
})();
