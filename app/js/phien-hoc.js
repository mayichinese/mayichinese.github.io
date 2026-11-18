// =========================================================
// PHIÊN HỌC – quyết định thẻ nào hiện tiếp theo.
//   Phiên 'on'  : ôn các thẻ đến hạn hôm nay (+ thẻ đang học dở)
//   Phiên 'moi' : học từ mới theo bài, mỗi lần chỉ "mở" tối đa 5 từ mới cùng lúc
//                 để không bị ngợp; từ mới được giới thiệu → luyện lại sau 1 phút, 10 phút…
// =========================================================

import { layTienDo, caiDat, nhatKyHomNay, luu } from './luu-tru.js';
import { tinhLichMoi, dangHoc, DANH_GIA } from './lich-on.js';
import { layBaiHoc, tatCaTu } from './du-lieu.js';

const PHUT = 60 * 1000;
const HOC_TRUOC = 20 * PHUT;   // thẻ đang học đến hạn trong 20 phút tới thì cho hiện luôn
const TOI_DA_DANG_HOC = 5;     // số từ mới tối đa đang luyện cùng lúc

// ---------- Đếm số lượng cho màn hình chính ----------
export function demHomNay(bayGio = Date.now()) {
  const td = layTienDo();
  const cd = caiDat();
  const nk = nhatKyHomNay();
  let onDenHan = 0;
  let dangHocDenHan = 0;
  for (const tu of tatCaTu()) {
    const t = td.the[tu.khoa];
    if (!t) continue;
    if (t.trangThai === 'on' && t.han <= bayGio) onDenHan++;
    else if (dangHoc(t) && t.han <= bayGio + HOC_TRUOC) dangHocDenHan++;
  }
  const conLuotOn = Math.max(0, cd.gioiHanOnMoiNgay - nk.on);
  return {
    onDenHan: Math.min(onDenHan, conLuotOn),
    onDenHanThucTe: onDenHan,
    dangHocDenHan,
    daOn: nk.on,
    daHocMoi: nk.moi,
    conTuMoi: Math.max(0, cd.soTuMoiMoiNgay - nk.moi),
  };
}

/** Các từ chưa học, theo thứ tự bài (hoặc chỉ trong một bài). */
export function tuChuaHoc(soBai = null) {
  const td = layTienDo();
  const ds = soBai ? layBaiHoc().filter((b) => b.so === soBai) : layBaiHoc();
  return ds.flatMap((b) => b.tu).filter((t) => !td.the[t.khoa]);
}

/** Bài đầu tiên còn từ chưa học (để gợi ý học tiếp). */
export function baiDangHoc() {
  const td = layTienDo();
  return layBaiHoc().find((b) => b.tu.some((t) => !td.the[t.khoa])) || null;
}

// ---------- Tạo một phiên học ----------
export function taoPhien(loai, soBai = null) {
  const td = layTienDo();
  const bayGio = Date.now();
  const phien = {
    loai,
    soBai,
    // Thẻ ôn đến hạn (chỉ phiên 'on'), thẻ đến hạn lâu nhất được ôn trước
    hangOn: [],
    // Từ mới chờ giới thiệu (chỉ phiên 'moi')
    hangMoi: [],
    // Các thẻ đang học được mở trong phiên này
    dangLuyen: new Set(),
    daLam: 0,
  };
  if (loai === 'on') {
    const { onDenHan } = demHomNay(bayGio);
    phien.hangOn = tatCaTu()
      .filter((tu) => td.the[tu.khoa]?.trangThai === 'on' && td.the[tu.khoa].han <= bayGio)
      .sort((a, b) => td.the[a.khoa].han - td.the[b.khoa].han)
      .slice(0, onDenHan)
      .map((tu) => tu.khoa);
    // thẻ đang học dở từ trước cũng ôn luôn
    tatCaTu().forEach((tu) => { if (dangHoc(td.the[tu.khoa])) phien.dangLuyen.add(tu.khoa); });
  } else {
    const { conTuMoi } = demHomNay(bayGio);
    phien.hangMoi = tuChuaHoc(soBai).slice(0, conTuMoi).map((tu) => tu.khoa);
    // thẻ đang học dở của bài này (hoặc mọi bài) cũng luyện tiếp
    tatCaTu().forEach((tu) => {
      if (dangHoc(td.the[tu.khoa]) && (!soBai || tu.bai === soBai)) phien.dangLuyen.add(tu.khoa);
    });
  }
  return phien;
}

/**
 * Chọn thẻ tiếp theo. Trả về { khoa, kieu } với kieu: 'gioi-thieu' (từ mới) | 'on' | 'luyen'
 * hoặc null nếu đã xong.
 */
export function theTiepTheo(phien, bayGio = Date.now()) {
  const td = layTienDo();
  // bỏ các thẻ đã "tốt nghiệp" khỏi danh sách đang luyện
  for (const k of [...phien.dangLuyen]) if (!dangHoc(td.the[k])) phien.dangLuyen.delete(k);

  const dangLuyen = [...phien.dangLuyen].sort((a, b) => td.the[a].han - td.the[b].han);

  // 1) Thẻ đang luyện đã đến hạn
  if (dangLuyen.length && td.the[dangLuyen[0]].han <= bayGio) return { khoa: dangLuyen[0], kieu: 'luyen' };
  // 2) Thẻ ôn theo ngày
  if (phien.hangOn.length) return { khoa: phien.hangOn[0], kieu: 'on' };
  // 3) Giới thiệu từ mới (nếu chưa đang luyện quá nhiều)
  if (phien.hangMoi.length && dangLuyen.length < TOI_DA_DANG_HOC) return { khoa: phien.hangMoi[0], kieu: 'gioi-thieu' };
  // 4) Còn thẻ đang luyện sắp đến hạn → cho hiện luôn, không bắt chờ
  if (dangLuyen.length && td.the[dangLuyen[0]].han <= bayGio + HOC_TRUOC) return { khoa: dangLuyen[0], kieu: 'luyen' };
  // 5) Còn từ mới nhưng đang luyện đủ 5 từ → luyện tiếp thẻ sớm nhất
  if (phien.hangMoi.length && dangLuyen.length) return { khoa: dangLuyen[0], kieu: 'luyen' };
  return null;
}

/** Ghi nhận kết quả khi người học bấm nút đánh giá (1–4). */
export function traLoi(phien, khoa, danhGia) {
  const td = layTienDo();
  const nk = nhatKyHomNay();
  const cu = td.the[khoa];
  if (cu?.trangThai === 'on') nk.on++;
  td.the[khoa] = tinhLichMoi(cu, danhGia);
  phien.hangOn = phien.hangOn.filter((k) => k !== khoa);
  if (dangHoc(td.the[khoa])) phien.dangLuyen.add(khoa);
  phien.daLam++;
  luu();
}

/** Từ mới: sau khi xem phần giới thiệu. biet=true nghĩa là "Tôi đã biết từ này". */
export function daXemTuMoi(phien, khoa, biet = false) {
  const td = layTienDo();
  const nk = nhatKyHomNay();
  nk.moi++;
  if (biet) {
    td.the[khoa] = tinhLichMoi(undefined, DANH_GIA.DE);
  } else {
    td.the[khoa] = {
      trangThai: 'hoc', buoc: 0, khoangCach: 0, heSo: 2.5, soLanOn: 0, soLanQuen: 0,
      hocLuc: Date.now(), han: Date.now() + PHUT,
    };
    phien.dangLuyen.add(khoa);
  }
  phien.hangMoi = phien.hangMoi.filter((k) => k !== khoa);
  phien.daLam++;
  luu();
}

/** Số thẻ còn lại trong phiên (để hiển thị). */
export function conLai(phien) {
  return phien.hangOn.length + phien.hangMoi.length + phien.dangLuyen.size;
}
