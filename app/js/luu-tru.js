// =========================================================
// LƯU TRỮ TIẾN ĐỘ HỌC (trên chính máy/trình duyệt đang dùng – localStorage)
// - Toàn bộ tiến độ nằm trong MỘT đối tượng `tienDo`, lưu dưới khóa KHOA.
// - Có xuất/nhập file sao lưu (.json) để chuyển sang máy khác hoặc phòng mất dữ liệu.
// =========================================================

// CẢNH BÁO: KHÔNG đổi KHOA và TEN_UNG_DUNG (kể cả khi đổi tên app thành Mayi Chinese)
//  - đổi KHOA → app không tìm thấy tiến độ đã lưu (mất hết tiến độ)
//  - đổi TEN_UNG_DUNG → không nhập lại được các file sao lưu cũ
const KHOA = 'hoc-hsk-tien-do';
const TEN_UNG_DUNG = 'hoc-tieng-trung-hsk';
const PHIEN_BAN = 1;

// Cài đặt mặc định – người dùng chỉnh trong màn hình Cài đặt
export const CAI_DAT_MAC_DINH = {
  soTuMoiMoiNgay: 15,     // số từ mới mỗi ngày
  gioiHanOnMoiNgay: 200,  // tối đa số thẻ ôn mỗi ngày
  tuPhatAm: true,         // tự đọc từ khi hiện đáp án (thẻ từ, trắc nghiệm)
  amHieuUng: true,        // tiếng ting / bụp khi trả lời đúng / sai (am-thanh.js)
  tocDoDoc: 0.8,          // tốc độ giọng đọc (1 = bình thường)
  giongDoc: '',           // tên giọng đọc đã chọn ('' = tự chọn)
  kieuChuKhai: false,     // hiển thị chữ Hán kiểu viết tay (Khải thư)
  tatMauThanh: false,     // true = không tô màu pinyin theo thanh điệu (mặc định có tô màu)
  cheDo: 'tu-dong',       // giao diện: 'tu-dong' (theo máy) | 'sang' | 'toi'
  soChuVietMoiMoiNgay: 5, // số chữ mới luyện viết mỗi ngày (Giai đoạn 2)
  cheDoBai: 'chu-de',     // chia bài (chung cho HSK 1–3): 'chu-de' (theo nhóm nghĩa) | 'sach' (theo bài sách 《新HSK教程》)
  // Mục tiêu số phút mỗi ngày do người học tự chọn (CAC_MUC_TIEU). null = chưa chọn → trang Hôm nay hỏi,
  // trong lúc chưa chọn tạm dùng MUC_TIEU_MAC_DINH.
  phutMoiNgay: null,
  // (cũ) chia 60 phút cho 5 phần – không còn dùng làm mục tiêu, giữ lại để đọc được bản sao lưu cũ
  phutMucTieu: { on: 15, moi: 15, nghe: 10, viet: 10, nguPhap: 10 },
};
export const MUC_TIEU_MAC_DINH = 20;
export const CAC_MUC_TIEU = [
  { phut: 10, ten: 'Thoải mái' },
  { phut: 20, ten: 'Vừa phải' },
  { phut: 30, ten: 'Nghiêm túc' },
  { phut: 60, ten: 'Chuyên sâu' },
];

function tienDoTrong() {
  return {
    phienBan: PHIEN_BAN,
    the: {},        // trạng thái từng thẻ: khóa "1:爱" → { trangThai, buoc, khoangCach, heSo, han, ... }
    nhatKy: {},     // theo ngày "2026-11-18" → { moi, on, giay: { on, moi, viet, nghe }, vietMoi, viet, thanh }
    // Giai đoạn 2 – lịch ôn chữ VIẾT TAY, theo từng chữ: "爱" → cùng dạng với `the` (thuật toán SM-2)
    theViet: {},
    // Giai đoạn 2 – thống kê luyện thanh: { dung, sai, nham: { "2>3": số lần nghe thanh 2 mà chọn thanh 3 } }
    thanhDieu: { dung: 0, sai: 0, nham: {} },
    // Giai đoạn 3 – trắc nghiệm: tổng đúng/sai + SỔ CÂU SAI theo khóa từ
    //   soSai: { "1:爱": { lanSai, dungLienTiep, phienDungCuoi, themLuc } }
    //   Từ ra khỏi sổ khi trả lời đúng 2 lần liên tiếp ở 2 phiên khác nhau.
    tracNghiem: { dung: 0, sai: 0, soSai: {} },
    // Giai đoạn 4 – ngữ pháp: the = lịch ôn SM-2 theo mã điểm ("la-shi" → như `the`),
    //   daXem = lần đầu mở bài học của điểm đó, dung/sai = tổng số bài tập
    nguPhap: { the: {}, daXem: {}, dung: 0, sai: 0 },
    // Giai đoạn 5.2 – lịch sử thi thử: [{ cap, luc (ISO), diem, nghe, doc, giay }] (giữ 30 lần gần nhất)
    thiThu: [],
    // Cấp HSK đã mở khóa (mở dần: học hết cấp trước, hoặc đạt thi thử cấp trước = "học vượt") – xem cap-do.js
    capDaMo: [1],
    // Chữ & âm: số lần đúng/sai theo từng âm đầu / vần ("d:b", "v:ang") và từng bộ thủ ("b:氵")
    nenTang: { dung: {}, sai: {} },
    // Nói & phát âm (man-luyen-noi.js): điểm gần nhất của từng từ, số lần đọc đúng/sai theo âm tiết ("shì")
    noi: { tu: {}, dung: {}, sai: {}, soCau: 0, tongDiem: 0 },
    chang: {},              // chặng bài học đã xong: { mã bài: [số chặng] } (man-chang.js)
    docHieu: {},            // đọc hiểu: { mã bài: { diem, tot, lan, luc } } (man-doc-hieu.js)
    caiDat: { ...CAI_DAT_MAC_DINH },
    saoLuuLanCuoi: null,
  };
}

let tienDo = tienDoTrong();
let luuDuoc = true; // false nếu trình duyệt chặn localStorage (chế độ ẩn danh…)

/** Đọc tiến độ đã lưu. Gọi một lần khi mở app. */
export function docTienDo() {
  try {
    const chuoi = localStorage.getItem(KHOA);
    if (chuoi) tienDo = hopNhat(JSON.parse(chuoi));
  } catch (e) {
    luuDuoc = false;
    console.warn('Không đọc được localStorage', e);
  }
  return tienDo;
}

/** Ghép dữ liệu cũ với giá trị mặc định (để bản cập nhật sau thêm cài đặt mới không bị lỗi). */
function hopNhat(cu) {
  const moi = tienDoTrong();
  return {
    ...moi,
    ...cu,
    caiDat: { ...moi.caiDat, ...(cu.caiDat || {}), phutMucTieu: { ...moi.caiDat.phutMucTieu, ...(cu.caiDat?.phutMucTieu || {}) } },
    the: cu.the || {},
    nhatKy: cu.nhatKy || {},
    theViet: cu.theViet || {},
    thanhDieu: { ...moi.thanhDieu, ...(cu.thanhDieu || {}), nham: { ...(cu.thanhDieu?.nham || {}) } },
    tracNghiem: { ...moi.tracNghiem, ...(cu.tracNghiem || {}), soSai: { ...(cu.tracNghiem?.soSai || {}) } },
    nguPhap: {
      ...moi.nguPhap, ...(cu.nguPhap || {}),
      the: { ...(cu.nguPhap?.the || {}) }, daXem: { ...(cu.nguPhap?.daXem || {}) },
    },
    thiThu: Array.isArray(cu.thiThu) ? cu.thiThu : [],
    capDaMo: Array.isArray(cu.capDaMo) && cu.capDaMo.length ? cu.capDaMo : [1],
    nenTang: { dung: { ...(cu.nenTang?.dung || {}) }, sai: { ...(cu.nenTang?.sai || {}) } },
    chang: { ...(cu.chang || {}) },
    docHieu: { ...(cu.docHieu || {}) },
    noi: {
      ...moi.noi, ...(cu.noi || {}),
      tu: { ...(cu.noi?.tu || {}) }, dung: { ...(cu.noi?.dung || {}) }, sai: { ...(cu.noi?.sai || {}) },
    },
  };
}

/** Ghi tiến độ xuống máy. Gọi sau mỗi lần thay đổi. */
export function luu() {
  if (!luuDuoc) return false;
  try {
    localStorage.setItem(KHOA, JSON.stringify(tienDo));
    return true;
  } catch (e) {
    luuDuoc = false;
    console.warn('Không lưu được', e);
    return false;
  }
}

export const coLuuDuoc = () => luuDuoc;
export const layTienDo = () => tienDo;
export const caiDat = () => tienDo.caiDat;

// ---------- Ngày học ----------
// Một "ngày học" bắt đầu lúc 4 giờ sáng (học khuya sau 0h vẫn tính cho hôm trước).
export const GIO_BAT_DAU_NGAY = 4;

export function ngayHoc(thoiDiem = Date.now()) {
  const d = new Date(thoiDiem - GIO_BAT_DAU_NGAY * 3600 * 1000);
  const t = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${t(d.getMonth() + 1)}-${t(d.getDate())}`;
}

/** Nhật ký của hôm nay (tự tạo nếu chưa có). */
export function nhatKyHomNay() {
  const k = ngayHoc();
  if (!tienDo.nhatKy[k]) tienDo.nhatKy[k] = { moi: 0, on: 0, giay: {} };
  return tienDo.nhatKy[k];
}

/** Mục tiêu số phút mỗi ngày (người học tự chọn) */
export const phutMoiNgay = () => tienDo.caiDat.phutMoiNgay || MUC_TIEU_MAC_DINH;

/** Tổng số phút đã học trong một ngày (mặc định hôm nay) */
export function tongPhutNgay(nk = nhatKyHomNay()) {
  return Math.floor(Object.values(nk?.giay || {}).reduce((a, b) => a + b, 0) / 60);
}

/**
 * Ghi lại một LƯỢT bài đã làm xong (dùng cho nhiệm vụ hằng ngày).
 * @param {string} loai  tracNghiem | thanh | nguPhap | phienAm | boThu | noi | chang | docHieu
 *   nk.luot[loai]: số lượt · nk.luotTot: số lượt đúng ≥ 80% · nk.luotHoanHao: số lượt không sai câu nào
 */
export function ghiLuot(loai, dung, sai) {
  const nk = nhatKyHomNay();
  nk.luot = nk.luot || {};
  nk.luot[loai] = (nk.luot[loai] || 0) + 1;
  const tong = dung + sai;
  if (tong && dung / tong >= 0.8) nk.luotTot = (nk.luotTot || 0) + 1;
  if (tong && sai === 0) nk.luotHoanHao = (nk.luotHoanHao || 0) + 1;
  luu();
}

/** Cộng thêm số giây học cho một phần (on / moi / ...). */
export function congGiay(phan, soGiay) {
  const nk = nhatKyHomNay();
  nk.giay[phan] = (nk.giay[phan] || 0) + soGiay;
}

/** Ngày này có học không: học/ôn thẻ từ, luyện viết, luyện thanh điệu hoặc làm trắc nghiệm. */
export function coHocNgay(nk) {
  return !!nk && (nk.moi > 0 || nk.on > 0 || nk.viet > 0 || nk.thanh > 0 || nk.tracNghiem > 0 || nk.nguPhap > 0 || nk.thiThu > 0
    || nk.nenTang > 0 || nk.noi > 0);
}

/** Số ngày học liên tục tính đến hôm nay (hoặc hôm qua nếu hôm nay chưa học). */
export function chuoiNgayHoc() {
  const coHoc = (k) => {
    return coHocNgay(tienDo.nhatKy[k]);
  };
  let dem = 0;
  let moc = Date.now();
  if (!coHoc(ngayHoc(moc))) moc -= 86400000; // hôm nay chưa học thì đếm từ hôm qua
  while (coHoc(ngayHoc(moc))) {
    dem++;
    moc -= 86400000;
  }
  return dem;
}

// ---------- Sao lưu ----------
/** Tạo file sao lưu và tải về máy. */
export function xuatSaoLuu() {
  tienDo.saoLuuLanCuoi = new Date().toISOString();
  luu();
  const goi = { ungDung: TEN_UNG_DUNG, phienBan: PHIEN_BAN, xuatLuc: tienDo.saoLuuLanCuoi, tienDo };
  const blob = new Blob([JSON.stringify(goi, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `mayi-chinese-sao-luu-${ngayHoc()}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

/** Đọc file sao lưu người dùng chọn. Trả về Promise<số thẻ đã nhập>. Ném lỗi (tiếng Việt) nếu file sai. */
export async function nhapSaoLuu(file) {
  const chuoi = await file.text();
  let goi;
  try {
    goi = JSON.parse(chuoi);
  } catch {
    throw new Error('File này không phải file sao lưu hợp lệ (không đọc được JSON).');
  }
  if (goi?.ungDung !== TEN_UNG_DUNG || !goi.tienDo) {
    throw new Error('File này không phải file sao lưu của ứng dụng Mayi Chinese.');
  }
  tienDo = hopNhat(goi.tienDo);
  luu();
  return Object.keys(tienDo.the).length;
}

/** Xóa toàn bộ tiến độ (giữ lại cài đặt). */
export function xoaTienDo() {
  const giuCaiDat = tienDo.caiDat;
  tienDo = tienDoTrong();
  tienDo.caiDat = giuCaiDat;
  luu();
}
