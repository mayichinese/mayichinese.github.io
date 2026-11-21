// =========================================================
// NÓI & PHÁT ÂM (#/luyen-noi) – chấm phát âm bằng micro, luyện nói
//   #/luyen-noi            trang chọn dạng bài + "âm hay đọc sai"
//   #/luyen-noi/<dạng>     một lượt luyện:
//       doc-tu     🗣️ Đọc từ        – nhìn chữ + pinyin, nghe mẫu rồi đọc (10 từ)
//       doc-cau    📖 Đọc câu       – đọc câu ví dụ của từ đã học (6 câu)
//       nhac-lai   🔁 Nghe & nhắc lại – chỉ nghe, không nhìn chữ, nói lại (6 câu)
//       noi-nghia  💬 Nói theo nghĩa – nhìn nghĩa tiếng Việt, tự nói từ tiếng Trung (8 từ)
//   moChamNhanh(hanzi, pinyin): hộp "🎤 Đọc thử" mở từ thẻ từ (nút trên mặt sau thẻ)
//
// Chấm: cham-phat-am.js (so theo cách đọc từng chữ). Micro: nhan-giong.js.
// Máy không nhận dạng được giọng nói → ghi âm, nghe lại và tự đánh giá.
// Tiến độ: tienDo.noi = { tu: { khóa: { diem, dau, lan, luc } }, dung: { "shi4": n }, sai: { "shi4": n }, soCau, tongDiem }
//   diem = điểm cao nhất (để chọn từ cần luyện); soCau/tongDiem/dung/sai tính theo LẦN ĐỌC ĐẦU (phản ánh trình độ thật)
//   nk.noi = số câu nói đạt (≥ 70 điểm) trong ngày; lượt xong → ghiLuot('noi', ...)
// Thời gian luyện nói tính vào phần "nghe" (Nghe & nói) của biểu đồ.
// =========================================================

import { layTienDo, nhatKyHomNay, luu, ghiLuot } from './luu-tru.js';
import { tatCaTu, nghiaNgan, layBaiHoc } from './du-lieu.js';
import { baiDangHoc } from './phien-hoc.js';
import { capDaMo } from './cap-do.js';
import { esc, batDongHo, moHopThoai, dongHopThoai, nutLoa, tenTuLoai } from './giao-dien.js';
import { toMauPinyin, toMauChuHan, demChuHan, tachPinyin } from './pinyin.js';
import { doc } from './phat-am.js';
import { bieuTuong } from './bieu-tuong.js';
import { napAmDoc, chamPhatAm, nhanXet, nhacBienDieu, DIEM_DAT } from './cham-phat-am.js';
import { coNhanDang, coGhiAm, ngheNoi, ghiAm } from './nhan-giong.js';

export const CAC_DANG_NOI = {
  'doc-tu': { emoji: '🗣️', ten: 'Đọc từ', so: 10, moTa: 'Nhìn chữ và pinyin, nghe mẫu rồi đọc' },
  'doc-cau': { emoji: '📖', ten: 'Đọc câu', so: 6, moTa: 'Đọc to câu ví dụ của từ đã học' },
  'nhac-lai': { emoji: '🔁', ten: 'Nghe & nhắc lại', so: 6, moTa: 'Chỉ nghe, không nhìn chữ, rồi nói lại' },
  'noi-nghia': { emoji: '💬', ten: 'Nói theo nghĩa', so: 8, moTa: 'Nhìn nghĩa tiếng Việt, tự nói bằng tiếng Trung' },
};

function tienDoNoi() {
  const td = layTienDo();
  td.noi = td.noi || { tu: {}, dung: {}, sai: {}, soCau: 0, tongDiem: 0 };
  return td.noi;
}

/** Kho từ để luyện: từ đã học (cấp đã mở); chưa học từ nào thì lấy từ của bài đang học */
function khoTu() {
  const td = layTienDo();
  const mo = capDaMo();
  const daHoc = tatCaTu().filter((t) => mo.includes(t.cap) && td.the[t.khoa]);
  if (daHoc.length >= 4) return { ds: daHoc, daHoc: true };
  const bai = baiDangHoc() || layBaiHoc()[0];
  return { ds: [...daHoc, ...(bai?.tu || []).filter((t) => !td.the[t.khoa])].slice(0, 15), daHoc: false, bai };
}

const KHONG_HOI_NGHIA = ['助', '后缀', '前缀', '量', '介', '副', '叹'];
// Từ nghĩa tiếng Việt quá rộng hoặc chỉ khác từ khác ở cách dùng: không hỏi "nói theo nghĩa"
const TU_KHONG_HOI_NGHIA = ['打', '要', '看', '上', '下', '二', '两', '刚', '刚才', '不', '没'];

/** Các phần nghĩa của một từ (tách theo dấu phẩy / chấm phẩy, bỏ phần trong ngoặc) */
function phanNghia(t, chiNghiaDau) {
  const ds = (t.nghia || []).slice(0, chiNghiaDau ? 1 : undefined);
  return new Set(ds.flatMap((n) => String(n.nghia || '').replace(/\([^)]*\)/g, '').split(/[,;，；/]/))
    .map((x) => x.trim().toLowerCase()).filter((x) => x.length >= 2));
}
/** Từ HSK khác có cùng một nghĩa tiếng Việt với từ đang hỏi (nói từ này cũng tính đúng nghĩa) */
function tuDongNghia(t) {
  const can = phanNghia(t, true);
  if (!can.size) return [];
  return tatCaTu().filter((x) => x.hanzi !== t.hanzi && [...phanNghia(x)].some((n) => can.has(n)))
    .slice(0, 6).map((x) => ({ hanzi: x.hanzi, pinyin: x.pinyin }));
}

const tron = (mang) => mang.map((x) => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);

/** Chọn câu hỏi: ưu tiên từ chưa luyện nói hoặc điểm thấp */
function taoCauHoi(dang) {
  let { ds } = khoTu();
  const noi = tienDoNoi();
  // "Nói theo nghĩa": không hỏi lượng từ, trợ từ, giới từ, phó từ, tiền tố/hậu tố, thán từ và các từ nghĩa quá rộng
  // hoặc chỉ khác nhau về cách dùng (theo bản soát chuyên gia, mục 8.7)
  if (dang === 'noi-nghia') {
    const loc = ds.filter((t) => !KHONG_HOI_NGHIA.includes((t.tuLoaiChinhThuc || '').split('、')[0])
      && !(t.nghia || []).every((n) => KHONG_HOI_NGHIA.includes(n.tuLoai))
      && !TU_KHONG_HOI_NGHIA.includes(t.hanzi));
    if (loc.length >= 4) ds = loc;
  }
  // ưu tiên từ chưa luyện nói (-10) hoặc điểm thấp, có trộn ngẫu nhiên
  const khoaUuTien = new Map(ds.map((t) => [t, (noi.tu[t.khoa]?.diem ?? -10) + Math.random() * 40]));
  const tu = [...ds].sort((a, b) => khoaUuTien.get(a) - khoaUuTien.get(b));
  const so = CAC_DANG_NOI[dang].so;
  if (dang === 'doc-tu' || dang === 'noi-nghia') {
    return tron(tu.slice(0, so)).map((t) => ({ hanzi: t.hanzi, pinyin: t.pinyin, khoa: t.khoa, tu: t,
      dongNghia: dang === 'noi-nghia' ? tuDongNghia(t) : [] }));
  }
  // câu ví dụ: câu ngắn (nhắc lại cần ngắn hơn vì phải nhớ)
  const toiDa = dang === 'nhac-lai' ? 9 : 12;
  const cau = [];
  const daCo = new Set();
  for (const t of tu) {
    const vd = tron((t.viDu || []).filter((v) => demChuHan(v.han) <= toiDa && !daCo.has(v.han)))[0];
    if (!vd) continue;
    daCo.add(vd.han);
    cau.push({ hanzi: vd.han, pinyin: vd.pinyin, dich: vd.dich, khoa: t.khoa, tu: t, laCau: true });
    if (cau.length === so) break;
  }
  return cau;
}

// ---------- Khung micro dùng chung (lượt luyện + hộp "Đọc thử") ----------
/**
 * Vẽ nút micro + vùng kết quả vào `vung`.
 * @param {object} muc { hanzi, pinyin }
 * @param {Function} khiCham (kq) gọi sau mỗi lần chấm: { diem, chiTiet, vanBan, tuCham }
 * @returns {Function} hàm hủy (dừng micro nếu đang nghe)
 */
export function ganKhungNoi(vung, muc, khiCham) {
  let dangNghe = null;
  let dangGhi = null;
  let daHuy = false;
  const tuDong = coNhanDang();
  const ghiDuoc = coGhiAm();
  vung.innerHTML = `
    <div class="khung-noi">
      <button class="nut-mic" type="button" aria-label="Bấm để nói">${bieuTuong('mic')}</button>
      <p class="trang-thai-mic chu-phu nho">${tuDong ? 'Bấm 🎤 rồi đọc to, rõ ràng' : ghiDuoc ? 'Bấm 🎤 để ghi âm giọng bạn' : 'Máy này không dùng được micro'}</p>
      <p class="chu-dang-nghe han" hidden></p>
      <div class="ket-qua-noi"></div>
    </div>`;
  const $ = (s) => vung.querySelector(s);
  const $nut = $('.nut-mic');
  const trangThai = (chu) => { $('.trang-thai-mic').textContent = chu; };
  if (!tuDong && !ghiDuoc) $nut.disabled = true;

  async function batDauNhanDang() {
    $('.ket-qua-noi').innerHTML = '';
    $('.chu-dang-nghe').hidden = false;
    $('.chu-dang-nghe').textContent = '';
    $nut.classList.add('dang-nghe');
    trangThai('Đang nghe… nói xong máy tự chấm (hoặc bấm 🎤 lần nữa)');
    const n = ngheNoi({ khiNghe: (chu) => { $('.chu-dang-nghe').textContent = chu; }, toiDa: muc.laCau ? 15 : 8 });
    dangNghe = n;
    let cacCach;
    try {
      [cacCach] = await Promise.all([n.ketQua, napAmDoc()]);
    } catch (loi) {
      if (daHuy) return;
      dangNghe = null;
      $nut.classList.remove('dang-nghe');
      $('.chu-dang-nghe').hidden = true;
      trangThai('Bấm 🎤 để thử lại');
      $('.ket-qua-noi').innerHTML = `<p class="loi-noi">⚠️ ${esc(loi?.chu || loi?.message || 'Có lỗi khi nghe.')}</p>`;
      return;
    }
    if (daHuy) return;
    dangNghe = null;
    $nut.classList.remove('dang-nghe');
    $('.chu-dang-nghe').hidden = true;
    trangThai('Bấm 🎤 để đọc lại');
    if (!cacCach.length) return;
    let kq = chamPhatAm(muc.hanzi, muc.pinyin, cacCach, { laTu: !muc.laCau });
    // Nói một từ khác cùng nghĩa (知道 thay cho 认识…) → tính đúng nghĩa, nhắc từ đang học
    if (kq.diem < DIEM_DAT) {
      for (const dn of muc.dongNghia || []) {
        const kq2 = chamPhatAm(dn.hanzi, dn.pinyin, cacCach, { laTu: true });
        if (kq2.diem >= DIEM_DAT) { kq = { ...kq2, dongNghia: dn, tuDangHoc: muc }; break; }
      }
    }
    $('.ket-qua-noi').innerHTML = htmlKetQua(kq, muc);
    khiCham(kq);
  }

  async function batDauGhiAm() {
    $('.ket-qua-noi').innerHTML = '';
    try {
      dangGhi = await ghiAm(muc.laCau ? 12 : 6);
    } catch (loi) {
      $('.ket-qua-noi').innerHTML = `<p class="loi-noi">⚠️ ${esc(loi?.chu || 'Không mở được micro.')}</p>`;
      return;
    }
    if (daHuy) { dangGhi.dung(); return; }
    $nut.classList.add('dang-nghe');
    trangThai('Đang ghi âm… bấm 🎤 lần nữa khi nói xong');
  }

  async function dungGhiAm() {
    const g = dangGhi;
    dangGhi = null;
    $nut.classList.remove('dang-nghe');
    const url = await g.dung();
    if (daHuy || !url) return;
    trangThai('Bấm 🎤 để ghi âm lại');
    $('.ket-qua-noi').innerHTML = `
      <div class="tu-cham">
        <p class="chu-phu nho" style="margin:0">Nghe lại giọng bạn rồi so với giọng mẫu 🔊:</p>
        <audio controls src="${url}"></audio>
        <p style="margin:4px 0 0"><b>Bạn thấy giống giọng mẫu không?</b></p>
        <div class="hang-tu-cham">
          <button class="nut" data-tu-cham="30">😕 Chưa giống</button>
          <button class="nut" data-tu-cham="70">🙂 Gần giống</button>
          <button class="nut" data-tu-cham="100">😀 Giống</button>
        </div>
      </div>`;
    vung.querySelectorAll('[data-tu-cham]').forEach((b) => {
      b.onclick = () => {
        vung.querySelectorAll('[data-tu-cham]').forEach((x) => { x.disabled = true; x.classList.toggle('dang-chon', x === b); });
        khiCham({ diem: Number(b.dataset.tuCham), chiTiet: [], vanBan: '', tuCham: true });
      };
    });
  }

  $nut.onclick = () => {
    if (tuDong) {
      if (dangNghe) dangNghe.dung();
      else batDauNhanDang();
    } else if (dangGhi) dungGhiAm();
    else batDauGhiAm();
  };

  return () => {
    daHuy = true;
    dangNghe?.dung();
    dangGhi?.dung();
  };
}

function htmlKetQua(kq, muc) {
  const nx = nhanXet(kq.diem);
  const ghiChu = { thanh: (c) => `bạn: ${esc(c.ngheAm || '?')}`, sai: () => 'sai', thieu: () => 'thiếu' };
  const saiThanh = (kq.saiThanh || []).map((c) => `<span class="han">${esc(c.chu)}</span> (bạn đọc ${esc(c.ngheAm || '?')}, đúng là ${esc((c.py || '').toLowerCase())})`);
  const coBienDieu = muc && nhacBienDieu(muc.hanzi, muc.pinyin).length;
  return `
    <div class="ket-qua-cham muc-${nx.muc}">
      <div class="diem-noi"><b>${kq.diem}</b><span>điểm</span></div>
      <p class="nhan-xet-noi">${nx.emoji} ${esc(nx.chu)}</p>
    </div>
    ${kq.dongNghia ? `<p class="nhac-noi dung-nghia">✅ Đúng nghĩa! Bạn nói <span class="han">${esc(kq.dongNghia.hanzi)}</span>. Từ đang học là
      <span class="han">${esc(kq.tuDangHoc.hanzi)}</span> <span class="pinyin">${esc(kq.tuDangHoc.pinyin)}</span>.</p>` : ''}
    ${saiThanh.length ? `<p class="nhac-noi">🎵 Sai thanh ở chữ ${saiThanh.join(', ')}.${muc && !muc.laCau ? ' Đọc từ phải đúng mọi thanh mới đạt.' : ''}</p>` : ''}
    <div class="chu-cham">${kq.chiTiet.map((c) => `
      <span class="o-cham ${c.kq}">
        <span class="han">${esc(c.chu)}</span>
        ${c.py ? `<small class="pinyin">${esc(c.py.toLowerCase())}</small>` : ''}
        ${ghiChu[c.kq] ? `<small class="ghi-chu-cham">${ghiChu[c.kq](c)}</small>` : ''}
      </span>`).join('')}</div>
    <p class="chu-phu nho may-nghe">Máy nghe được: <span class="han">${esc(kq.vanBan) || '…'}</span></p>
    ${coBienDieu ? '<p class="chu-phu nho may-nghe">ℹ️ Máy không chấm được biến điệu – hãy nghe mẫu và tự so.</p>' : ''}`;
}

/** Lời nhắc biến điệu hiện trước khi đọc */
export function htmlNhacBienDieu(hanzi, pinyin) {
  const nhac = nhacBienDieu(hanzi, pinyin);
  return nhac.length ? `<p class="nhac-bien-dieu">💡 ${nhac.map((x) => esc(x)).join('<br>💡 ')}</p>` : '';
}

/**
 * Ghi kết quả một câu vào tiến độ.
 * kq = lần tốt nhất (để chọn từ cần luyện, tính câu đạt); kqDau = lần đọc ĐẦU TIÊN (thống kê trình độ)
 */
function ghiKetQua(muc, kq, coGhiTu, kqDau = kq) {
  const noi = tienDoNoi();
  if (coGhiTu && muc.khoa) {
    const cu = noi.tu[muc.khoa] || { lan: 0 };
    noi.tu[muc.khoa] = { diem: kq.diem, dau: kqDau.diem, lan: cu.lan + 1, luc: Date.now() };
  }
  if (!kqDau.tuCham) {
    for (const c of kqDau.chiTiet) {
      if (!c.py) continue;
      const am = c.py.toLowerCase();
      const bang = c.kq === 'dung' ? noi.dung : noi.sai;
      bang[am] = (bang[am] || 0) + 1;
    }
  }
  noi.soCau = (noi.soCau || 0) + 1;
  noi.tongDiem = (noi.tongDiem || 0) + kqDau.diem;
  const nk = nhatKyHomNay();
  if (kq.diem >= DIEM_DAT) nk.noi = (nk.noi || 0) + 1;
  luu();
}

// ---------- Trang chọn dạng bài ----------
export function veLuyenNoi(khung) {
  const noi = tienDoNoi();
  const kho = khoTu();
  const tuDong = coNhanDang();
  const tb = noi.soCau ? Math.round(noi.tongDiem / noi.soCau) : null;
  // Âm hay đọc sai: sai nhiều hơn đúng, ít nhất 2 lần sai
  const amSai = Object.entries(noi.sai)
    .map(([am, s]) => [am, s, noi.dung[am] || 0])
    .filter(([, s, d]) => s >= 2 && s > d / 2)
    .sort((a, b) => (b[1] - b[2] / 2) - (a[1] - a[2] / 2))
    .slice(0, 8);

  khung.innerHTML = `
    <div class="khung the-gioi-thieu-noi">
      <span class="emoji emoji-lon">🎤</span>
      <div>
        <b>Luyện nói với micro</b>
        <p class="chu-phu nho">${tuDong
          ? 'Bấm 🎤 rồi đọc: máy nghe và chấm từng chữ (đúng âm, đúng thanh). Cần kết nối mạng; app không lưu giọng của bạn.'
          : 'Trình duyệt này chưa chấm tự động được (dùng Chrome trên Android/máy tính, hoặc Safari trên iPhone đã bật Đọc chính tả). Bạn vẫn luyện được: ghi âm, nghe lại và tự so với giọng mẫu.'}</p>
      </div>
    </div>
    ${kho.daHoc ? '' : `<p class="chu-phu nho" style="margin:0 2px 12px">Bạn chưa học đủ từ: tạm luyện các từ của ${esc(kho.bai ? `bài “${kho.bai.ten}”` : 'bài đầu tiên')}.
      Học thêm ở <a href="#/bai">Bài học</a> để có nhiều từ luyện nói hơn.</p>`}
    <div class="luoi-ky-nang">
      ${Object.entries(CAC_DANG_NOI).map(([ma, d]) => `
        <a class="o-ky-nang khung" href="#/luyen-noi/${ma}">
          <span class="o-emoji emoji">${d.emoji}</span>
          <b>${d.ten}</b>
          <span class="chu-phu nho">${d.moTa}</span>
        </a>`).join('')}
    </div>
    <h3 class="tieu-de-muc">Kết quả của bạn</h3>
    <div class="khung">
      ${noi.soCau ? `<p style="margin:0">Đã nói <b>${noi.soCau}</b> câu · điểm trung bình lần đọc đầu <b>${tb}</b></p>` : '<p class="chu-phu" style="margin:0">Chưa luyện câu nào.</p>'}
      ${amSai.length ? `
        <p class="chu-phu nho" style="margin:10px 0 6px">Âm bạn hay đọc chưa đúng (chạm để nghe):</p>
        <div class="hang-am-sai">${amSai.map(([am, s]) => `<button class="chip-am" data-am="${esc(am)}"><span class="pinyin">${esc(am)}</span><small>${s}×</small></button>`).join('')}</div>
        <p class="chu-phu nho" style="margin:8px 0 0">Mẹo đọc từng âm có ở mục <a href="#/chu-am/phien-am">Chữ & âm → Phiên âm</a>.</p>` : ''}
    </div>`;

  // Chạm âm hay sai → đọc một từ đã học có âm đó
  khung.querySelectorAll('[data-am]').forEach((b) => {
    b.onclick = () => {
      const am = b.dataset.am;
      const t = kho.ds.concat(tatCaTu()).find((x) => demChuHan(x.hanzi) === 1 && x.pinyin.toLowerCase() === am)
        || kho.ds.concat(tatCaTu()).find((x) => tachPinyin(x.pinyin, demChuHan(x.hanzi)).some((p) => p.chu.toLowerCase() === am));
      if (t) doc(t.hanzi);
    };
  });
}

// ---------- Một lượt luyện ----------
export function vePhienNoi(khung, dang) {
  const cauHinh = CAC_DANG_NOI[dang];
  let daRoi = false;
  let huyKhung = () => {};
  const hangDoi = taoCauHoi(dang);
  const tong = hangDoi.length;
  if (!tong) {
    khung.innerHTML = `<div class="khung"><p>Chưa có câu nào để luyện. Hãy học vài từ ở <a href="#/bai">Bài học</a> trước nhé.</p></div>`;
    return () => {};
  }
  napAmDoc().catch(() => {});
  document.body.classList.add('dang-hoc');
  const dungDongHo = batDongHo('nghe');
  const ketQua = [];   // [{ muc, diem }]
  let muc = null;
  let diemTot = null;
  let diemDau = null;
  let lanThu = 0;

  khung.innerHTML = `
    <div class="phien">
      <div class="tien-do-phien"><div class="thanh-tien-do"><span style="width:0%"></span></div><span class="dem"></span></div>
      <div class="khung the-thanh the-noi" id="the"></div>
      <div class="vung-tra-loi" id="vung-nut"></div>
    </div>`;
  const $ = (s) => khung.querySelector(s);

  function capNhat() {
    $('.tien-do-phien .thanh-tien-do > span').style.width = `${(ketQua.length / tong) * 100}%`;
    $('.tien-do-phien .dem').textContent = `Câu ${Math.min(ketQua.length + 1, tong)}/${tong}`;
  }

  function hienDeBai(daCham) {
    const anChu = dang === 'nhac-lai' && !daCham;
    const anTu = dang === 'noi-nghia' && !daCham;
    const nghe = `<div class="hang-nghe">
        <button class="nut-loa nut-nghe-lon" data-mau="1" aria-label="Nghe mẫu">${bieuTuong('loa')}</button>
        <button class="nut nut-nho" data-mau="0.55">🐢 Chậm</button>
      </div>`;
    let noiDung;
    if (dang === 'noi-nghia') {
      const t = muc.tu;
      noiDung = `<p class="cau-hoi">Nói bằng tiếng Trung:</p>
        <p class="nghia-hoi">${esc(nghiaNgan(t))}</p>
        ${t.nghia?.[0]?.tuLoai ? `<p class="chu-phu nho" style="margin:0">${esc(tenTuLoai(t.nghia[0].tuLoai))}</p>` : ''}
        ${anTu ? '<button class="nut nut-nho" id="nut-goi-y">💡 Gợi ý pinyin</button><p class="pinyin goi-y-noi" hidden></p>'
          : `<p class="han tu-hoi">${toMauChuHan(muc.hanzi, muc.pinyin)}</p><p class="pinyin pinyin-to">${toMauPinyin(muc.pinyin, demChuHan(muc.hanzi))}</p>${nghe}`}`;
    } else if (anChu) {
      noiDung = `<p class="cau-hoi">Nghe rồi nói lại câu này</p>${nghe}
        <p class="chu-phu nho">Chưa nghe rõ thì bấm nghe lại (hoặc nghe chậm) bao nhiêu lần cũng được.</p>`;
    } else {
      noiDung = `<p class="cau-hoi">${daCham && dang === 'nhac-lai' ? 'Câu bạn vừa nghe:' : muc.laCau ? 'Đọc to câu này' : 'Đọc to từ này'}</p>
        <p class="han ${muc.laCau ? 'cau-doc' : 'tu-hoi'}">${toMauChuHan(muc.hanzi, muc.pinyin)}</p>
        <p class="pinyin ${muc.laCau ? '' : 'pinyin-to'}">${toMauPinyin(muc.pinyin, demChuHan(muc.hanzi))}</p>
        ${muc.laCau ? `<p class="chu-phu nho" style="margin:0">${esc(muc.dich)}</p>` : `<p class="chu-phu nho" style="margin:0">${esc(nghiaNgan(muc.tu))}</p>`}
        ${htmlNhacBienDieu(muc.hanzi, muc.pinyin)}
        ${nghe}`;
    }
    $('#de-bai').innerHTML = noiDung;
    $('#de-bai').querySelectorAll('[data-mau]').forEach((b) => {
      b.onclick = () => doc(muc.hanzi, b.dataset.mau === '1' ? undefined : Number(b.dataset.mau));
    });
    const goiY = $('#nut-goi-y');
    if (goiY) goiY.onclick = () => { goiY.hidden = true; const p = $('.goi-y-noi'); p.hidden = false; p.innerHTML = toMauPinyin(muc.pinyin, demChuHan(muc.hanzi)); };
  }

  function cauTiep() {
    if (daRoi) return;
    huyKhung();
    muc = hangDoi.shift();
    if (!muc) { ketThuc(); return; }
    diemTot = null;
    diemDau = null;
    lanThu = 0;
    capNhat();
    $('#the').innerHTML = `
      <div class="goc-the"><span class="nhan">${cauHinh.emoji} ${cauHinh.ten}</span></div>
      <div id="de-bai" class="de-bai-noi"></div>
      <div id="vung-mic"></div>`;
    hienDeBai(false);
    $('#vung-nut').innerHTML = `<button class="nut nut-rong" id="nut-bo-qua">Bỏ qua ▶</button>`;
    $('#nut-bo-qua').onclick = () => { ketQua.push({ muc, diem: null }); cauTiep(); };
    huyKhung = ganKhungNoi($('#vung-mic'), muc, (kq) => {
      lanThu++;
      if (diemDau === null) diemDau = kq;
      if (diemTot === null || kq.diem > diemTot.diem) diemTot = kq;
      if (lanThu === 1) hienDeBai(true);
      $('#vung-nut').innerHTML = `<button class="nut nut-chinh nut-rong" id="nut-tiep">${hangDoi.length ? 'Câu tiếp ▶' : 'Xem kết quả ▶'}</button>
        ${diemTot.diem < DIEM_DAT ? '<p class="chu-phu nho" style="text-align:center;margin:6px 0 0">Có thể bấm 🎤 thử lại: app giữ điểm cao nhất (thống kê tiến bộ tính lần đọc đầu).</p>' : ''}`;
      $('#nut-tiep').onclick = () => {
        ghiKetQua(muc, diemTot, dang === 'doc-tu' || dang === 'noi-nghia', diemDau);
        ketQua.push({ muc, diem: diemTot.diem });
        cauTiep();
      };
    });
    // Tự đọc mẫu (trừ "nói theo nghĩa" – phải tự nhớ)
    if (dang !== 'noi-nghia') setTimeout(() => { if (!daRoi && muc) doc(muc.hanzi); }, 300);
  }

  function ketThuc() {
    dungDongHo();
    document.body.classList.remove('dang-hoc');
    const daLam = ketQua.filter((k) => k.diem !== null);
    const dat = daLam.filter((k) => k.diem >= DIEM_DAT).length;
    if (daLam.length) ghiLuot('noi', dat, daLam.length - dat);
    const tb = daLam.length ? Math.round(daLam.reduce((s, k) => s + k.diem, 0) / daLam.length) : 0;
    const canLuyen = ketQua.filter((k) => k.diem === null || k.diem < DIEM_DAT);
    khung.innerHTML = `
      <div class="ket-thuc">
        <div class="emoji emoji-to">${tb >= 90 ? '🌟' : tb >= 70 ? '🏆' : tb >= 40 ? '🎉' : '💪'}</div>
        <h2>${daLam.length ? `${tb} điểm` : 'Đã bỏ qua hết'}</h2>
        <p class="chu-phu">${daLam.length ? `Điểm trung bình · ${dat}/${tong} câu đạt từ ${DIEM_DAT} điểm` : 'Lần sau thử bấm 🎤 nhé.'}</p>
        ${canLuyen.length ? `<div class="khung" style="width:100%;text-align:left"><b>Cần luyện thêm:</b>
          <ul class="ds-nham">${canLuyen.map((k) => `<li><span class="han">${esc(k.muc.hanzi)}</span>
            <span class="pinyin">${toMauPinyin(k.muc.pinyin, demChuHan(k.muc.hanzi))}</span>
            ${k.diem === null ? '<span class="chu-phu nho">· bỏ qua</span>' : `<span class="chu-phu nho">· ${k.diem} điểm</span>`}
            ${nutLoa(k.muc.hanzi, true)}</li>`).join('')}</ul></div>` : ''}
        <a class="nut nut-chinh nut-rong" href="#/luyen-noi/${dang}" id="nut-lai">↺ Luyện thêm một lượt</a>
        <a class="nut nut-rong" href="#/luyen-noi">🎤 Chọn dạng khác</a>
        <a class="nut nut-rong" href="#/">🏠 Về trang Hôm nay</a>
      </div>`;
    khung.querySelector('#nut-lai').onclick = (e) => { e.preventDefault(); window.dispatchEvent(new HashChangeEvent('hashchange')); };
  }

  cauTiep();
  return () => {
    daRoi = true;
    huyKhung();
    dungDongHo();
    document.body.classList.remove('dang-hoc');
  };
}

// ---------- Hộp "🎤 Đọc thử" (mở từ thẻ từ) ----------
export function moChamNhanh(hanzi, pinyin) {
  let huy = () => {};
  const hop = moHopThoai(`
    <h3 style="margin:0 0 8px">🎤 Đọc thử</h3>
    <div class="the-doc-thu">
      <span class="han tu-hoi">${toMauChuHan(hanzi, pinyin)}</span>
      <span class="pinyin pinyin-to">${toMauPinyin(pinyin, demChuHan(hanzi))}</span>
      ${nutLoa(hanzi)}
    </div>
    ${htmlNhacBienDieu(hanzi, pinyin)}
    <div id="vung-mic-nhanh"></div>
    <button class="nut nut-rong" data-dong style="margin-top:12px">Đóng</button>`, () => huy());
  napAmDoc().catch(() => {});
  let daGhi = false;   // chỉ lần đọc đầu vào thống kê
  huy = ganKhungNoi(hop.querySelector('#vung-mic-nhanh'), { hanzi, pinyin, laCau: demChuHan(hanzi) > 4 }, (kq) => {
    if (!daGhi) ghiKetQua({ hanzi, pinyin }, kq, false);
    daGhi = true;
  });
  return dongHopThoai;
}
