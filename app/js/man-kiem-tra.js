// =========================================================
// KIỂM TRA CUỐI CHẶNG (#/kiem-tra/<mã>) và NHẢY CHẶNG (#/kiem-tra/nhay/<mã chặng muốn mở>)
//   - 15 câu: phần lớn về từ của chặng (nghĩa / chữ / pinyin / nghe), tối đa 4 câu điền từ ngữ pháp của chặng.
//   - Đạt từ 80% (DIEM_QUA_KIEM_TRA) mới mở chặng sau. Không hỏi lại; cuối bài hiện câu sai.
//   - Nhảy chặng: câu hỏi lấy từ mọi chặng bị bỏ qua; đạt thì các chặng đó được ghi "qua (nhảy)".
//   - Từ trả lời sai mà đang ôn → đến hạn ôn ngay.
// =========================================================

import { layTienDo, luu, ghiLuot, nhatKyHomNay } from './luu-tru.js';
import { timBaiTheoMa, nhanBai, tiengDoc } from './du-lieu.js';
import { doc, tinhTrangPhatAm } from './phat-am.js';
import { esc, batDongHo } from './giao-dien.js';
import { toMauPinyin, toMauChuHan, demChuHan } from './pinyin.js';
import { tron, taiDaAm, dangDungDuoc, taoCau, htmlDeBai, htmlLuaChon } from './cau-hoi-tu.js';
import { taiNguPhap } from './man-ngu-phap.js';
import { amCham, amXong, amSai } from './am-thanh.js';
import { capMo, htmlCachMoKhoa } from './cap-do.js';
import {
  DIEM_QUA_KIEM_TRA, SO_CAU_KIEM_TRA, xongTuVung, changMo, changBiNhayQua, diemNguPhapCuaChang, ghiKiemTra,
  ketQuaKiemTra, trangThaiLoTrinh,
} from './lo-trinh.js';

const SO_CAU_NGU_PHAP_TOI_DA = 4;

/** Câu điền từ ngữ pháp: { loai: 'np', cau, luaChon: [{ hien, dung }], pinyin, dich } */
function cauNguPhap(d, x) {
  return { loai: 'np', diem: d, cau: x.cau, pinyin: x.pinyin, dich: x.dich,
    luaChon: tron([{ hien: x.dapAn, dung: true }, ...x.nhieu.map((h) => ({ hien: h, dung: false }))]) };
}

/** HTML pháo hoa (màn chúc mừng) */
export const htmlPhaoHoa = () => `<div class="phao-hoa" aria-hidden="true">${'🎉⭐✨🎊⭐✨🎉🎊'.match(/./gu)
  .map((e, i) => `<span style="--i:${i}">${e}</span>`).join('')}</div>`;

/**
 * @param {string} ma  mã chặng
 * @param {boolean} nhay  true: kiểm tra để nhảy tới chặng `ma` (hỏi về các chặng bị bỏ qua)
 * @returns {Function} dọn dẹp
 */
export function veKiemTra(khung, ma, nhay = false) {
  let daRoi = false;
  let dungDongHo = () => {};
  let xuLyPhim = null;
  const b = timBaiTheoMa(ma);
  if (!b || !b.sach) { khung.innerHTML = '<p class="loi">Không tìm thấy chặng này.</p><a class="nut" href="#/bai">← Lộ trình</a>'; return () => {}; }
  if (!capMo(b.cap)) { khung.innerHTML = htmlCachMoKhoa(b.cap); return () => {}; }

  // Chặng được kiểm tra: chặng này (kiểm tra thường) hoặc các chặng bị nhảy qua
  const dsChang = nhay ? changBiNhayQua(b) : [b];
  if (nhay && !dsChang.length) { location.replace(`#/bai/${b.ma}`); return () => {}; }
  if (!nhay && !changMo(b)) {
    khung.innerHTML = `<div class="chua-lam"><div class="emoji emoji-to">🔒</div><h2>${esc(nhanBai(b))} chưa mở</h2>
      <a class="nut nut-chinh" href="#/kiem-tra/nhay/${b.ma}">Kiểm tra để nhảy tới đây</a><a class="nut" href="#/bai">← Lộ trình</a></div>`;
    return () => {};
  }
  if (!nhay && !xongTuVung(b)) {
    khung.innerHTML = `<div class="chua-lam"><div class="emoji emoji-to">📚</div><h2>Chưa thể kiểm tra</h2>
      <p class="chu-phu">Học xong các phần từ vựng của ${esc(nhanBai(b))} rồi làm kiểm tra nhé.</p>
      <a class="nut nut-chinh" href="#/bai/${b.ma}">← Về chặng</a></div>`;
    return () => {};
  }

  khung.innerHTML = '<div class="dang-tai">Đang soạn bài kiểm tra…</div>';
  Promise.all([taiDaAm(), taiNguPhap().catch(() => [])]).then(([daAm, tatCaDiem]) => {
    if (daRoi) return;
    const ttGiong = tinhTrangPhatAm();
    const coGiong = ttGiong !== 'khong-ho-tro' && ttGiong !== 'khong-co-giong';
    // --- Soạn câu hỏi ---
    const npNguon = tron(dsChang.flatMap((c) => diemNguPhapCuaChang(c, tatCaDiem))
      .flatMap((d) => (d.dienTu || []).map((x) => ({ d, x }))));
    const daLayDiem = new Set();
    const cauNp = [];
    for (const { d, x } of npNguon) {            // mỗi điểm một câu, tối đa 4
      if (cauNp.length >= SO_CAU_NGU_PHAP_TOI_DA) break;
      if (daLayDiem.has(d.id)) continue;
      daLayDiem.add(d.id);
      cauNp.push(cauNguPhap(d, x));
    }
    const tu = tron(dsChang.flatMap((c) => c.tu));
    const cauTu = [];
    for (let i = 0; cauTu.length < SO_CAU_KIEM_TRA - cauNp.length && i < tu.length * 2; i++) {
      const w = tu[i % tu.length];
      const cacDang = dangDungDuoc(w, daAm, coGiong);
      cauTu.push({ loai: 'tu', ...taoCau(w, cacDang[Math.floor(Math.random() * cacDang.length)]) });
    }
    const hang = tron([...cauTu, ...cauNp]);
    const tong = hang.length;
    let viTri = -1;
    let daTraLoi = false;
    let dung = 0;
    const saiDs = [];

    document.body.classList.add('dang-hoc');
    dungDongHo = batDongHo('nguPhap');
    const tieuDe = nhay
      ? `⏭️ Nhảy tới ${nhanBai(b)} · hỏi ${dsChang.length === 1 ? nhanBai(dsChang[0]) : `${nhanBai(dsChang[0])} – ${dsChang[dsChang.length - 1].so}`}`
      : `🔑 Kiểm tra ${nhanBai(b)}`;
    khung.innerHTML = `
      <div class="phien">
        <div class="tien-do-phien"><div class="thanh-tien-do"><span style="width:0%"></span></div><span class="dem"></span></div>
        <div class="khung the-thanh the-trac-nghiem" id="the"></div>
        <div class="vung-tra-loi" id="vung-nut"></div>
      </div>`;
    const $ = (s) => khung.querySelector(s);

    function capNhat() {
      $('.tien-do-phien .thanh-tien-do > span').style.width = `${((viTri + (daTraLoi ? 1 : 0)) / tong) * 100}%`;
      $('.tien-do-phien .dem').textContent = `Câu ${viTri + 1}/${tong} · cần ${DIEM_QUA_KIEM_TRA}%`;
    }

    function cauTiep() {
      if (daRoi) return;
      viTri++;
      daTraLoi = false;
      if (viTri >= tong) { ketThuc(); return; }
      const c = hang[viTri];
      capNhat();
      window.scrollTo(0, 0);
      if (c.loai === 'tu') {
        $('#the').innerHTML = `<div class="goc-the"><span class="nhan">${esc(tieuDe)}</span></div>${htmlDeBai(c)}<div id="dap-an" class="dap-an"></div>`;
        $('#vung-nut').innerHTML = htmlLuaChon(c);
        if (c.dang === 'nghe') {
          const nghe = (cham) => doc(tiengDoc(c.tu), cham ? 0.55 : undefined);
          $('#nut-nghe').onclick = () => nghe(false);
          $('#nut-cham').onclick = () => nghe(true);
          setTimeout(() => { if (hang[viTri] === c && !daTraLoi) nghe(false); }, 250);
        }
      } else {
        $('#the').innerHTML = `<div class="goc-the"><span class="nhan">${esc(tieuDe)} · 🧩 Ngữ pháp</span></div>
          <p class="cau-hoi">Chọn từ điền vào chỗ trống</p>
          <p class="han cau-doc">${esc(c.cau).replace('___', '<span class="o-dien">（　）</span>')}</p>
          <p class="chu-phu nho" style="margin:0">${esc(c.dich)}</p><div id="dap-an" class="dap-an"></div>`;
        $('#vung-nut').innerHTML = `<div class="luoi-lua-chon hai-cot">${c.luaChon.map((l, i) =>
          `<button class="nut-lua-chon" data-i="${i}"><span class="han">${esc(l.hien)}</span><kbd>${i + 1}</kbd></button>`).join('')}</div>`;
      }
      $('#vung-nut').querySelectorAll('[data-i]').forEach((nut) => { nut.onclick = () => traLoi(Number(nut.dataset.i)); });
    }

    function traLoi(i) {
      if (daTraLoi || daRoi) return;
      daTraLoi = true;
      const c = hang[viTri];
      const laDung = c.luaChon[i].dung;
      amCham(laDung);
      if (laDung) dung++;
      else saiDs.push(c);
      $('#vung-nut').querySelectorAll('[data-i]').forEach((x) => {
        const l = c.luaChon[Number(x.dataset.i)];
        x.classList.toggle('dung', l.dung);
        x.classList.toggle('sai', Number(x.dataset.i) === i && !laDung);
        x.disabled = true;
      });
      const giai = c.loai === 'tu'
        ? `<span class="han">${toMauChuHan(c.tu.hanzi, c.tu.pinyin)}</span> <span class="pinyin">${toMauPinyin(c.tu.pinyin, demChuHan(c.tu.hanzi))}</span>`
        : `<span class="han">${esc(c.cau.replace('___', c.luaChon.find((l) => l.dung).hien))}</span> <span class="pinyin">${toMauPinyin(c.pinyin)}</span>`;
      $('#dap-an').innerHTML = `${laDung ? '✅ Đúng!' : '❌ Chưa đúng.'} ${giai}`;
      $('#dap-an').classList.add(laDung ? 'la-dung' : 'la-sai');
      $('#vung-nut').insertAdjacentHTML('beforeend',
        `<button class="nut nut-chinh nut-rong" id="nut-tiep" style="margin-top:10px">${viTri + 1 < tong ? 'Câu tiếp ▶' : 'Xem kết quả ▶'}</button>`);
      $('#nut-tiep').onclick = cauTiep;
      capNhat();
    }

    function ketThuc() {
      dungDongHo();
      document.body.classList.remove('dang-hoc');
      const phanTram = tong ? Math.round((dung / tong) * 100) : 0;
      const dat = phanTram >= DIEM_QUA_KIEM_TRA;
      const truocDo = ketQuaKiemTra(b.ma);
      ghiKiemTra(dsChang.map((c) => c.ma), phanTram, nhay);
      ghiLuot('kiemTra', dung, tong - dung);
      // Từ sai đang ôn → ôn ngay
      const td = layTienDo();
      for (const c of saiDs) {
        const the = c.loai === 'tu' ? td.the[c.tu.khoa] : null;
        if (the && the.trangThai === 'on' && the.han > Date.now()) the.han = Date.now();
      }
      nhatKyHomNay();
      luu();
      setTimeout(dat ? amXong : amSai, 150);
      // Chặng vừa mở
      const ds = trangThaiLoTrinh(b.cap);
      const iB = ds.findIndex((x) => x.b.ma === b.ma);
      const changMoi = nhay ? b : (dat && ds[iB + 1] ? ds[iB + 1].b : null);
      const vuaMo = dat && changMoi && (nhay || !truocDo?.dat);
      khung.innerHTML = `
        <div class="ket-thuc">
          ${dat ? htmlPhaoHoa() : ''}
          <div class="emoji emoji-to">${dat ? (phanTram === 100 ? '🏆' : '🎉') : '💪'}</div>
          <h2>${dat ? (nhay ? `Đã mở ${esc(nhanBai(b))}!` : `Qua kiểm tra ${esc(nhanBai(b))}!`) : 'Chưa qua kiểm tra'}</h2>
          <p class="diem-kiem-tra"><b>${phanTram}%</b> · ${dung}/${tong} câu đúng · cần ${DIEM_QUA_KIEM_TRA}%</p>
          ${dat && !nhay ? `<p class="sao-lon">${phanTram === 100 ? '⭐ kiểm tra tuyệt đối!' : '⭐ đã có sao đầu tiên'}</p>
            <p class="chu-phu nho">Thêm sao: xong ngữ pháp + đọc hiểu của chặng (⭐⭐), kiểm tra đạt 100% (⭐⭐⭐).</p>` : ''}
          ${vuaMo ? `<div class="khung the-mo-khoa"><span class="emoji">🔓</span><b>Đã mở ${esc(nhanBai(changMoi))}: ${esc(changMoi.ten)}</b>
            <a class="nut nut-chinh nut-rong" href="#/bai/${changMoi.ma}">Vào ${esc(nhanBai(changMoi))} ▶</a></div>` : ''}
          ${!dat ? `<p class="chu-phu">Ôn lại các từ sai rồi làm lại nhé – mỗi lần đề sẽ khác.</p>` : ''}
          ${saiDs.length ? `<div class="khung" style="width:100%;text-align:left"><b>Câu sai:</b><ul class="ds-nham">${saiDs.map((c) => (c.loai === 'tu'
            ? `<li><span class="han">${esc(c.tu.hanzi)}</span> <span class="pinyin">${toMauPinyin(c.tu.pinyin, demChuHan(c.tu.hanzi))}</span></li>`
            : `<li>🧩 <span class="han">${esc(c.cau.replace('___', c.luaChon.find((l) => l.dung).hien))}</span> · ${esc(c.diem.ten)}</li>`)).join('')}</ul></div>` : ''}
          ${!dat ? `<button class="nut nut-chinh nut-rong" id="nut-lai">↺ Làm lại kiểm tra</button>` : ''}
          <a class="nut nut-rong" href="#/bai/${b.ma}">← Về ${esc(nhanBai(b))}</a>
          <a class="nut nut-rong" href="#/bai">🗺️ Lộ trình</a>
        </div>`;
      const $lai = khung.querySelector('#nut-lai');
      if ($lai) $lai.onclick = () => window.dispatchEvent(new HashChangeEvent('hashchange'));
    }

    xuLyPhim = (e) => {
      if (e.target.closest?.('input, textarea')) return;
      if (e.key === 'Enter') { const n = khung.querySelector('#nut-tiep'); if (n) { e.preventDefault(); n.click(); } return; }
      if (!daTraLoi && /^[1-4]$/.test(e.key)) khung.querySelectorAll('#vung-nut [data-i]')[Number(e.key) - 1]?.click();
    };
    document.addEventListener('keydown', xuLyPhim);
    cauTiep();
  });

  return () => {
    daRoi = true;
    dungDongHo();
    if (xuLyPhim) document.removeEventListener('keydown', xuLyPhim);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    document.body.classList.remove('dang-hoc');
  };
}
