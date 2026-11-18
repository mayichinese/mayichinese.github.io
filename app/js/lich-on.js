// =========================================================
// LỊCH ÔN TẬP NGẮT QUÃNG (spaced repetition) – dựa trên thuật toán SM-2,
// điều chỉnh giống Anki cho 4 nút: Quên / Khó / Nhớ / Dễ.
//
// Mỗi thẻ có một trong các trạng thái:
//   (không có)  : chưa học
//   'hoc'       : đang học lần đầu – lặp lại sau vài phút
//   'on'        : đã thuộc bước đầu – ôn sau vài ngày, khoảng cách tăng dần
//   'hocLai'    : đang ôn thì quên – học lại sau vài phút rồi quay về 'on'
//
// Thông tin lưu cho mỗi thẻ:
//   han        : thời điểm đến hạn ôn (mili-giây)
//   khoangCach : số ngày giữa hai lần ôn (với thẻ 'on')
//   heSo       : hệ số dễ (2.5 lúc đầu; quên nhiều thì giảm → ôn dày hơn)
//   buoc       : đang ở bước thứ mấy của giai đoạn học (phút)
// =========================================================

import { GIO_BAT_DAU_NGAY } from './luu-tru.js';

const PHUT = 60 * 1000;
const NGAY = 24 * 60 * PHUT;

export const BUOC_HOC = [1, 10];   // học lần đầu: xem lại sau 1 phút, rồi 10 phút
export const BUOC_HOC_LAI = [10];  // quên khi ôn: xem lại sau 10 phút
const KHOANG_CACH_TOT_NGHIEP = 1;  // nhớ đủ các bước → ôn lại sau 1 ngày
const KHOANG_CACH_DE = 4;          // bấm "Dễ" khi đang học → ôn lại sau 4 ngày
const HE_SO_BAN_DAU = 2.5;
const HE_SO_TOI_THIEU = 1.3;
const KHOANG_CACH_TOI_DA = 365;    // tối đa 1 năm
export const NGAY_DA_THUOC = 21;   // khoảng cách ≥ 21 ngày thì coi là "đã thuộc"

export const DANH_GIA = { QUEN: 1, KHO: 2, NHO: 3, DE: 4 };

/** Mốc 4 giờ sáng của ngày học sau `soNgay` ngày (để thẻ ôn đến hạn vào đầu ngày). */
function dauNgaySau(soNgay, bayGio) {
  const d = new Date(bayGio - GIO_BAT_DAU_NGAY * 3600 * 1000);
  d.setHours(GIO_BAT_DAU_NGAY, 0, 0, 0);
  d.setDate(d.getDate() + soNgay);
  return d.getTime();
}

/** Làm lệch nhẹ khoảng cách (±5%) để các thẻ không dồn vào cùng một ngày. */
function lechNhe(soNgay) {
  if (soNgay < 3) return soNgay;
  const lech = Math.max(1, Math.round(soNgay * 0.05));
  return soNgay + Math.round((Math.random() * 2 - 1) * lech);
}

/**
 * Tính trạng thái MỚI của thẻ sau khi người học bấm một nút đánh giá.
 * Không thay đổi `the` cũ – trả về bản sao mới.
 * @param {object|undefined} the  trạng thái hiện tại (undefined = thẻ mới)
 * @param {number} danhGia        1 Quên, 2 Khó, 3 Nhớ, 4 Dễ
 * @param {number} bayGio         thời điểm hiện tại (ms)
 * @param {boolean} coLech        có làm lệch ngẫu nhiên không (tắt khi chỉ xem trước)
 */
export function tinhLichMoi(the, danhGia, bayGio = Date.now(), coLech = true) {
  const t = the
    ? { ...the }
    : { trangThai: 'hoc', buoc: 0, khoangCach: 0, heSo: HE_SO_BAN_DAU, soLanOn: 0, soLanQuen: 0, hocLuc: bayGio };
  t.soLanOn = (t.soLanOn || 0) + 1;
  t.lanCuoi = bayGio;
  const lech = coLech ? lechNhe : (x) => x;

  // ----- Thẻ đang học lần đầu, hoặc đang học lại sau khi quên -----
  if (t.trangThai === 'hoc' || t.trangThai === 'hocLai') {
    const cacBuoc = t.trangThai === 'hoc' ? BUOC_HOC : BUOC_HOC_LAI;
    if (danhGia === DANH_GIA.QUEN) {
      t.buoc = 0;
      t.han = bayGio + cacBuoc[0] * PHUT;
    } else if (danhGia === DANH_GIA.KHO) {
      // ở lại bước hiện tại; bước đầu thì đợi lâu hơn một chút
      const phut = t.buoc === 0 && cacBuoc.length > 1 ? (cacBuoc[0] + cacBuoc[1]) / 2 : cacBuoc[t.buoc];
      t.han = bayGio + phut * PHUT;
    } else if (danhGia === DANH_GIA.NHO && t.buoc + 1 < cacBuoc.length) {
      t.buoc += 1;
      t.han = bayGio + cacBuoc[t.buoc] * PHUT;
    } else {
      // Nhớ ở bước cuối, hoặc bấm Dễ → chuyển sang ôn theo ngày
      let soNgay;
      if (t.trangThai === 'hoc') {
        soNgay = danhGia === DANH_GIA.DE ? KHOANG_CACH_DE : KHOANG_CACH_TOT_NGHIEP;
      } else {
        soNgay = (t.khoangCachSauQuen || 1) + (danhGia === DANH_GIA.DE ? 1 : 0);
      }
      t.trangThai = 'on';
      t.buoc = 0;
      t.khoangCach = soNgay;
      t.han = dauNgaySau(soNgay, bayGio);
    }
    return t;
  }

  // ----- Thẻ đang ôn theo ngày -----
  const cu = t.khoangCach || 1;
  const treNgay = Math.max(0, Math.floor((bayGio - t.han) / NGAY)); // ôn trễ bao nhiêu ngày
  let moi;
  if (danhGia === DANH_GIA.QUEN) {
    t.soLanQuen = (t.soLanQuen || 0) + 1;
    t.heSo = Math.max(HE_SO_TOI_THIEU, t.heSo - 0.2);
    t.khoangCachSauQuen = Math.max(1, Math.round(cu * 0.5));
    t.trangThai = 'hocLai';
    t.buoc = 0;
    t.han = bayGio + BUOC_HOC_LAI[0] * PHUT;
    return t;
  } else if (danhGia === DANH_GIA.KHO) {
    t.heSo = Math.max(HE_SO_TOI_THIEU, t.heSo - 0.15);
    moi = Math.max(cu + 1, cu * 1.2);
  } else if (danhGia === DANH_GIA.NHO) {
    moi = Math.max(cu + 1, (cu + treNgay / 2) * t.heSo);
  } else {
    moi = Math.max(cu + 1, (cu + treNgay) * t.heSo * 1.3);
    t.heSo += 0.15;
  }
  moi = Math.min(KHOANG_CACH_TOI_DA, lech(Math.round(moi)));
  t.khoangCach = moi;
  t.han = dauNgaySau(moi, bayGio);
  return t;
}

/** Chữ hiển thị dưới mỗi nút: "1 phút", "10 phút", "3 ngày", "2 tháng"… */
export function moTaKhoangCach(the, danhGia, bayGio = Date.now()) {
  const sau = tinhLichMoi(the, danhGia, bayGio, false);
  const ms = sau.han - bayGio;
  if (sau.trangThai !== 'on') {
    const phut = Math.max(1, Math.round(ms / PHUT));
    return phut < 60 ? `${phut} phút` : `${Math.round(phut / 60)} giờ`;
  }
  const ngay = sau.khoangCach;
  if (ngay < 30) return `${ngay} ngày`;
  if (ngay < 365) return `${Math.round(ngay / 30)} tháng`;
  return `${(ngay / 365).toFixed(1)} năm`;
}

/** Phân loại thẻ để hiển thị màu: 'chua-hoc' | 'dang-hoc' | 'dang-on' | 'da-thuoc' */
export function loaiThe(the) {
  if (!the) return 'chua-hoc';
  if (the.trangThai !== 'on') return 'dang-hoc';
  return the.khoangCach >= NGAY_DA_THUOC ? 'da-thuoc' : 'dang-on';
}

export const denHan = (the, bayGio = Date.now()) => !!the && the.han <= bayGio;
export const dangHoc = (the) => !!the && (the.trangThai === 'hoc' || the.trangThai === 'hocLai');
