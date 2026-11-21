// =========================================================
// TRẮC NGHIỆM (Giai đoạn 3)
//   #/trac-nghiem              trang chọn dạng bài, kiểm tra theo bài, sổ câu sai
//   #/trac-nghiem/<dạng>       một lượt 10 câu: tron | nghia | chu | nghe | pinyin | so-sai
//   #/trac-nghiem/bai/<số>     kiểm tra từ của một bài (kể cả từ chưa học)
// Các dạng câu hỏi (nghia | chu | nghe | pinyin) và cách chọn đáp án nhiễu: js/cau-hoi-tu.js (dùng chung).
// Câu sai: vào SỔ CÂU SAI (tienDo.tracNghiem.soSai) + thẻ từ (nếu đang ôn) đến hạn ôn ngay;
// được hỏi lại một lần cuối lượt. Ra khỏi sổ khi đúng 2 lần liên tiếp ở 2 lượt khác nhau.
// =========================================================

import { caiDat, layTienDo, luu, nhatKyHomNay, ghiLuot } from './luu-tru.js';
import { capMo } from './cap-do.js';
import { tatCaTu, layTu, nghiaNgan, danhSachBai, timBaiTheoMa, cheDoBai, nhanBai, cacCapCoDuLieu, tiengDoc } from './du-lieu.js';
import { doc, tinhTrangPhatAm } from './phat-am.js';
import { esc, batDongHo, nutLoa, dongTu } from './giao-dien.js';
import { toMauPinyin, toMauChuHan, demChuHan } from './pinyin.js';
import { bieuTuong } from './bieu-tuong.js';
import { tron, taiDaAm, dangDungDuoc, taoCau, htmlDeBai, htmlLuaChon } from './cau-hoi-tu.js';
import { amCham } from './am-thanh.js';

const SO_CAU = 10;
const SO_TU_TOI_THIEU = 4;   // cần ít nhất 4 từ đã học mới làm trắc nghiệm theo "từ đã học"

export const CAC_DANG = {
  tron:   { emoji: '🔀', ten: 'Trộn 4 dạng', moTa: 'Mỗi câu một dạng ngẫu nhiên – nên làm hằng ngày.' },
  nghia:  { emoji: '🀄', ten: 'Chữ Hán → nghĩa', moTa: 'Nhìn chữ Hán, chọn nghĩa tiếng Việt đúng.' },
  chu:    { emoji: '💬', ten: 'Nghĩa → chữ Hán', moTa: 'Đọc nghĩa tiếng Việt, chọn chữ Hán đúng.' },
  nghe:   { emoji: '👂', ten: 'Nghe → chọn chữ', moTa: 'Nghe phát âm, chọn chữ Hán đúng.' },
  pinyin: { emoji: '🔤', ten: 'Chữ Hán → pinyin', moTa: 'Chọn pinyin đúng – các đáp án chỉ khác dấu thanh!' },
};
const CAC_DANG_CAU = ['nghia', 'chu', 'nghe', 'pinyin'];

// ---------- Ghi kết quả + sổ câu sai ----------
/** Trả về dòng thông báo về sổ câu sai / thẻ từ để hiện cho người học */
function ghiKetQua(tu, dung, maLuot) {
  const td = layTienDo();
  const tn = td.tracNghiem;
  tn[dung ? 'dung' : 'sai']++;
  const nk = nhatKyHomNay();
  nk.tracNghiem = (nk.tracNghiem || 0) + 1;
  const muc = tn.soSai[tu.khoa];
  let thongTin = '';
  if (dung) {
    if (muc && muc.phienDungCuoi !== maLuot) {
      muc.dungLienTiep = (muc.dungLienTiep || 0) + 1;
      muc.phienDungCuoi = maLuot;
      if (muc.dungLienTiep >= 2) {
        delete tn.soSai[tu.khoa];
        thongTin = '🎉 Đã đúng 2 lượt liên tiếp – xóa khỏi sổ câu sai.';
      } else {
        thongTin = '📒 Từ trong sổ câu sai: đúng thêm 1 lượt nữa sẽ được xóa khỏi sổ.';
      }
    }
  } else {
    tn.soSai[tu.khoa] = { lanSai: (muc?.lanSai || 0) + 1, dungLienTiep: 0, phienDungCuoi: null, themLuc: muc?.themLuc || Date.now() };
    thongTin = '📒 Đã thêm vào sổ câu sai.';
    // Thẻ từ đang ôn theo ngày mà chưa đến hạn → cho đến hạn ôn ngay hôm nay
    const the = td.the[tu.khoa];
    if (the && the.trangThai === 'on' && the.han > Date.now()) {
      the.han = Date.now();
      thongTin += ' Thẻ từ này đến hạn ôn ngay hôm nay.';
    }
  }
  luu();
  return thongTin;
}

/** Các từ trong sổ câu sai (bỏ khóa không còn trong dữ liệu) */
export function tuTrongSoSai() {
  const soSai = layTienDo().tracNghiem.soSai;
  return Object.keys(soSai).map((k) => layTu(k)).filter(Boolean)
    .sort((a, b) => (soSai[b.khoa].lanSai - soSai[a.khoa].lanSai));
}

/** Từ đã học (đã có thẻ) – nguồn câu hỏi mặc định */
const tuDaHoc = () => { const td = layTienDo(); return tatCaTu().filter((t) => td.the[t.khoa]); };

// =========================================================
// TRANG CHỌN
// =========================================================
export function veTracNghiem(khung) {
  const tn = layTienDo().tracNghiem;
  const daHoc = tuDaHoc();
  const soSai = tuTrongSoSai();
  const duTu = daHoc.length >= SO_TU_TOI_THIEU;
  const nk = nhatKyHomNay();

  const dongDang = (ma, d, href, khoa) => `
    <${khoa ? 'div' : 'a'} class="dong-ke-hoach khung phan-nguPhap ${khoa ? 'sap-co' : ''}" ${khoa ? '' : `href="${href}"`}>
      <span class="o-emoji emoji">${d.emoji}</span>
      <span class="giua">
        <span class="dong-tren"><b>${d.ten}</b><span class="so-phut">${khoa ? 'chưa đủ từ' : `${SO_CAU} câu`}</span></span>
        <span class="mo-ta">${d.moTa}</span>
      </span>
      <span class="cuoi-dong">${khoa ? '' : bieuTuong('phai')}</span>
    </${khoa ? 'div' : 'a'}>`;

  khung.innerHTML = `
    <div class="hai-o">
      <div class="o-lon khung phan-on">
        <span class="o-emoji emoji">📚</span>
        <span class="so-lon">${daHoc.length}</span>
        <b>Từ đã học</b>
        <span class="chu-phu nho">nguồn câu hỏi</span>
      </div>
      <${soSai.length ? 'a href="#/trac-nghiem/so-sai"' : 'div'} class="o-lon khung phan-viet">
        <span class="o-emoji emoji">📒</span>
        <span class="so-lon">${soSai.length}</span>
        <b>Sổ câu sai</b>
        <span class="chu-phu nho">${soSai.length ? 'chạm để ôn lại' : 'chưa có từ nào'}</span>
      </${soSai.length ? 'a' : 'div'}>
    </div>
    <p style="margin-top:16px">
      ${duTu
        ? `<a class="nut nut-chinh nut-rong" href="#/trac-nghiem/tron"><span class="emoji">🔀</span> Bắt đầu: trộn 4 dạng (${SO_CAU} câu)</a>`
        : `<span class="can-kiem-tra" style="display:block">Bạn mới học ${daHoc.length} từ (cần ít nhất ${SO_TU_TOI_THIEU}).
            Hãy <a href="#/hoc-moi">học thêm từ mới</a>, hoặc <b>kiểm tra theo chặng</b> ở bên dưới.</span>`}
    </p>

    <h3 class="tieu-de-muc">Chọn dạng bài <small>${Math.floor((nk.giay.nguPhap || 0) / 60)} phút hôm nay</small></h3>
    <div class="ke-hoach">
      ${CAC_DANG_CAU.map((ma) => dongDang(ma, CAC_DANG[ma], `#/trac-nghiem/${ma}`, !duTu)).join('')}
      ${dongDang('so-sai', { emoji: '📒', ten: 'Ôn câu sai', moTa: 'Chỉ hỏi các từ trong sổ câu sai.' }, '#/trac-nghiem/so-sai', !soSai.length)}
    </div>

    <h3 class="tieu-de-muc">Kiểm tra theo chặng <small>hỏi cả từ chưa học</small></h3>
    ${cacCapCoDuLieu().filter(capMo).map((cap) => {
      const ds = danhSachBai(cheDoBai(caiDat()), cap).filter((b) => b.tu.length >= 4);
      if (!ds.length) return '';
      return `${cacCapCoDuLieu().length > 1 ? `<p class="chu-phu nho" style="margin:10px 2px 6px"><b>HSK ${cap}</b></p>` : ''}
      <div class="hang-chip">
        ${ds.map((b) => `<a class="chip" href="#/trac-nghiem/bai/${b.ma}" title="${esc(b.ten)}">${b.sach ? '' : '🗂️ '}${b.sach ? 'Chặng' : 'Chủ đề'} ${b.so}</a>`).join('')}
      </div>`;
    }).join('')}

    <h3 class="tieu-de-muc">Kết quả của bạn</h3>
    <div class="khung">
      ${tn.dung + tn.sai
        ? `<p style="margin:0">Đã làm <b>${tn.dung + tn.sai}</b> câu · đúng <b>${Math.round((tn.dung / (tn.dung + tn.sai)) * 100)}%</b></p>`
        : '<p class="chu-phu" style="margin:0">Chưa làm câu nào.</p>'}
    </div>

    ${soSai.length ? `
      <h3 class="tieu-de-muc">Sổ câu sai <small>${soSai.length} từ · sai nhiều nhất lên đầu</small></h3>
      <div class="khung ds-tu">${soSai.slice(0, 30).map(dongTu).join('')}</div>` : ''}`;
}

// =========================================================
// MỘT LƯỢT LÀM BÀI
// =========================================================
/**
 * @param {string} dang  tron | nghia | chu | nghe | pinyin | so-sai | bai
 * @param {number|string} soBai mã bài (3 hoặc 's3' – bài của sách), chỉ dùng khi dang = 'bai'
 * @returns {Function} hàm dọn dẹp
 */
export function vePhienTracNghiem(khung, dang, soBai = null) {
  let daRoi = false;
  let dungDongHo = () => {};
  let xuLyPhim = null;
  const maLuot = Date.now();       // mã lượt – để đếm "đúng ở 2 lượt khác nhau"
  khung.innerHTML = '<div class="dang-tai">Đang chuẩn bị câu hỏi…</div>';

  taiDaAm().then((daAm) => {
    if (daRoi) return;
    const ttGiong = tinhTrangPhatAm();
    const coGiong = ttGiong !== 'khong-ho-tro' && ttGiong !== 'khong-co-giong';

    // --- Nguồn từ ---
    let nguon;
    let nhanLuot;
    if (dang === 'bai') {
      const b = timBaiTheoMa(soBai);
      nguon = b ? b.tu : [];
      nhanLuot = `📝 Kiểm tra ${b ? nhanBai(b) : 'bài'}`;
    } else if (dang === 'so-sai') {
      nguon = tuTrongSoSai();
      nhanLuot = '📒 Ôn câu sai';
    } else if (CAC_DANG[dang]) {
      nguon = tuDaHoc();
      nhanLuot = `${CAC_DANG[dang].emoji} ${CAC_DANG[dang].ten}`;
    } else {
      khung.innerHTML = '<p class="loi">Không có dạng bài này.</p>';
      return;
    }
    if (dang !== 'bai' && dang !== 'so-sai' && nguon.length < SO_TU_TOI_THIEU) {
      khung.innerHTML = `<div class="chua-lam"><div class="emoji emoji-to">📚</div><h2>Chưa đủ từ đã học</h2>
        <p class="chu-phu">Cần ít nhất ${SO_TU_TOI_THIEU} từ đã học. Hãy học thêm từ mới, hoặc kiểm tra theo bài.</p>
        <a class="nut nut-chinh" href="#/trac-nghiem">Quay lại</a></div>`;
      return;
    }

    // --- Chọn từ + dạng cho từng câu ---
    const coDinh = CAC_DANG_CAU.includes(dang) ? dang : null;   // dạng cố định hay trộn
    const soSaiHienTai = layTienDo().tracNghiem.soSai;
    const sapXep = [...tron(nguon.filter((t) => soSaiHienTai[t.khoa])), ...tron(nguon.filter((t) => !soSaiHienTai[t.khoa]))];
    const hangDoi = [];
    for (const tu of (dang === 'bai' || dang === 'so-sai') ? tron(nguon) : sapXep) {
      if (hangDoi.length >= SO_CAU) break;
      const dsDang = dangDungDuoc(tu, daAm, coGiong);
      if (coDinh && !dsDang.includes(coDinh)) continue;
      hangDoi.push(taoCau(tu, coDinh || dsDang[Math.floor(Math.random() * dsDang.length)]));
    }
    if (!hangDoi.length) {
      khung.innerHTML = '<div class="chua-lam"><h2>Chưa có câu hỏi</h2><a class="nut" href="#/trac-nghiem">Quay lại</a></div>';
      return;
    }
    hangDoi.splice(0, hangDoi.length, ...tron(hangDoi));

    document.body.classList.add('dang-hoc');
    dungDongHo = batDongHo('nguPhap');
    const tong = hangDoi.length;
    const ketQua = { dung: 0, sai: 0 };
    const tuSai = new Map();
    const daHoiLai = new Set();
    let daLam = 0;
    let cau = null;
    let daTraLoi = false;

    khung.innerHTML = `
      <div class="phien">
        <div class="tien-do-phien">
          <div class="thanh-tien-do"><span style="width:0%"></span></div>
          <span class="dem"></span>
        </div>
        <div class="khung the-thanh the-trac-nghiem" id="the"></div>
        <div class="vung-tra-loi" id="vung-nut"></div>
      </div>`;
    const $ = (s) => khung.querySelector(s);
    const nghe = (cham = false) => { if (cau) doc(tiengDoc(cau.tu), cham ? 0.55 : undefined); };

    function capNhatTienDo() {
      const tongCau = Math.max(tong, daLam + hangDoi.length + (daTraLoi ? 0 : 1));
      $('.tien-do-phien .thanh-tien-do > span').style.width = `${(daLam / tongCau) * 100}%`;
      $('.tien-do-phien .dem').textContent = `Câu ${daTraLoi ? daLam : daLam + 1}/${tongCau} · đúng ${ketQua.dung}`;
    }

    function cauTiepTheo() {
      if (daRoi) return;
      cau = hangDoi.shift();
      if (!cau) return veKetThuc();
      daTraLoi = false;
      capNhatTienDo();
      const { tu } = cau;
      const hoiLai = daHoiLai.has(cau) ? '<span class="nhan nhan-vang">↺ Hỏi lại</span>' : '';
      const deBai = htmlDeBai(cau);
      $('#the').innerHTML = `
        <div class="goc-the"><span class="nhan">${nhanLuot}${dang === 'tron' || dang === 'bai' || dang === 'so-sai' ? ` · ${esc(CAC_DANG[cau.dang].ten)}` : ''}</span>${hoiLai}</div>
        ${deBai}
        <div id="dap-an" class="dap-an"></div>`;
      $('#vung-nut').innerHTML = `
        ${htmlLuaChon(cau)}
        <p class="phim-tat">Phím tắt: 1–${cau.luaChon.length} chọn đáp án${cau.dang === 'nghe' ? ' · Space = nghe lại' : ''}</p>`;
      $('#vung-nut').querySelectorAll('[data-i]').forEach((b) => { b.onclick = () => traLoi(Number(b.dataset.i)); });
      if (cau.dang === 'nghe') {
        $('#nut-nghe').onclick = () => nghe();
        $('#nut-cham').onclick = () => nghe(true);
        setTimeout(() => nghe(), 250);
      }
    }

    function traLoi(i) {
      if (daTraLoi || daRoi) return;
      daTraLoi = true;
      daLam++;
      const dung = cau.luaChon[i].dung;
      amCham(dung);
      ketQua[dung ? 'dung' : 'sai']++;
      $('#vung-nut').querySelectorAll('[data-i]').forEach((b) => {
        const l = cau.luaChon[Number(b.dataset.i)];
        b.classList.toggle('dung', l.dung);
        b.classList.toggle('sai', Number(b.dataset.i) === i && !dung);
        b.disabled = true;
      });
      const thongTin = ghiKetQua(cau.tu, dung, maLuot);
      if (!dung) {
        tuSai.set(cau.tu.khoa, cau.tu);
        if (!daHoiLai.has(cau)) {   // hỏi lại cuối lượt, bằng một dạng câu khác nếu được
          const dsDang = dangDungDuoc(cau.tu, daAm, coGiong);
          const dangKhac = coDinh || dsDang[Math.floor(Math.random() * dsDang.length)];
          const cauLai = taoCau(cau.tu, dangKhac);
          daHoiLai.add(cauLai);
          hangDoi.push(cauLai);
        }
      }
      const { tu } = cau;
      $('#dap-an').innerHTML = `
        ${dung ? '✅ Đúng!' : '❌ Chưa đúng.'}
        <div class="tu-sau-tra-loi">
          <span class="han tu-lon">${toMauChuHan(tu.hanzi, tu.pinyin)}</span>
          <span class="giua"><span class="pinyin">${toMauPinyin(tu.pinyin, demChuHan(tu.hanzi))}</span>
          <span class="chu-phu nho">${esc(nghiaNgan(tu))}</span></span>${nutLoa(tiengDoc(tu), true)}
        </div>
        ${thongTin ? `<p class="chu-phu nho" style="margin:8px 0 0">${thongTin}</p>` : ''}`;
      $('#dap-an').classList.add(dung ? 'la-dung' : 'la-sai');
      $('#vung-nut .phim-tat')?.remove();
      $('#vung-nut').insertAdjacentHTML('beforeend',
        `<button class="nut nut-chinh nut-rong" id="nut-tiep" style="margin-top:10px">${hangDoi.length ? 'Câu tiếp ▶' : 'Xem kết quả ▶'}</button>`);
      $('#nut-tiep').onclick = cauTiepTheo;
      if (cau.dang !== 'nghe' && caiDat().tuPhatAm) doc(tiengDoc(tu));
      capNhatTienDo();
      $('#nut-tiep').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    function veKetThuc() {
      dungDongHo();
      document.body.classList.remove('dang-hoc');
      const ti = ketQua.dung + ketQua.sai ? ketQua.dung / (ketQua.dung + ketQua.sai) : 0;
      ghiLuot('tracNghiem', ketQua.dung, ketQua.sai);   // cho nhiệm vụ hằng ngày
      const soTrongSo = tuTrongSoSai().length;
      khung.innerHTML = `
        <div class="ket-thuc">
          <div class="emoji emoji-to">${ti >= 0.8 ? '🏆' : ti >= 0.5 ? '🎉' : '💪'}</div>
          <h2>${ti >= 0.8 ? 'Xuất sắc!' : ti >= 0.5 ? 'Làm tốt lắm!' : 'Cố lên, ôn thêm nhé!'}</h2>
          <p class="chu-phu">${ketQua.dung} đúng · ${ketQua.sai} sai (câu sai đã được hỏi lại)</p>
          ${tuSai.size ? `<div class="khung ds-tu" style="width:100%;text-align:left">
              <p class="chu-phu nho" style="margin:8px 0 0">Từ sai lần này – đã vào sổ câu sai:</p>
              ${[...tuSai.values()].map(dongTu).join('')}</div>` : ''}
          <a class="nut nut-chinh nut-rong" href="${location.hash}" id="nut-lai">↺ Làm lượt mới (${SO_CAU} câu)</a>
          ${soTrongSo && dang !== 'so-sai' ? `<a class="nut nut-rong" href="#/trac-nghiem/so-sai">📒 Ôn câu sai (${soTrongSo} từ)</a>` : ''}
          <a class="nut nut-rong" href="#/trac-nghiem">📝 Chọn dạng bài khác</a>
          <a class="nut nut-rong" href="#/">🏠 Về trang Hôm nay</a>
        </div>`;
      // cùng địa chỉ thì trình duyệt không vẽ lại → tự vẽ lại lượt mới
      khung.querySelector('#nut-lai').onclick = (e) => { e.preventDefault(); window.dispatchEvent(new HashChangeEvent('hashchange')); };
    }

    xuLyPhim = (e) => {
      if (!cau || e.target.closest?.('input, select, textarea')) return;
      const dangONut = e.target.closest?.('button, a');
      if (e.key === ' ' && cau.dang === 'nghe' && !dangONut) { e.preventDefault(); nghe(); return; }
      if (e.key === 'Enter' && daTraLoi && !dangONut) { e.preventDefault(); cauTiepTheo(); return; }
      if (!daTraLoi && /^[1-4]$/.test(e.key)) $('#vung-nut').querySelectorAll('[data-i]')[Number(e.key) - 1]?.click();
    };
    document.addEventListener('keydown', xuLyPhim);

    cauTiepTheo();
  });

  return () => {
    daRoi = true;
    dungDongHo();
    if (xuLyPhim) document.removeEventListener('keydown', xuLyPhim);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    document.body.classList.remove('dang-hoc');
  };
}
