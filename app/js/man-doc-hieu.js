// =========================================================
// ĐỌC HIỂU (bước cuối của mỗi bài, sau các chặng và ngữ pháp)
//   #/doc-hieu/<mã bài>   ('s3' = HSK 1 bài 3; '2-5' = HSK 2 bài 5)
// Một đoạn hội thoại / đoạn văn ngắn CHỈ dùng từ đã học tới bài đó (cong-cu/ghep-doc-hieu.py kiểm tra),
// rồi các câu hỏi chọn đáp án và đúng / sai.
//   - Nghe cả bài / từng câu; bật tắt pinyin, bản dịch; chạm từ để xem nghĩa (cham-tu.js)
//   - Kết quả lưu ở tienDo.docHieu[mã] = { diem (%), tot (% cao nhất), lan, luc }; ghiLuot('docHieu')
// Dữ liệu: data/doc-hieu-hsk1.json … (tạo từ cong-cu/nguon-doc-hieu/capN.txt). Bài chưa soạn → không có bài đọc.
// =========================================================

import { layTienDo, luu, ghiLuot, nhatKyHomNay } from './luu-tru.js';
import { timBaiTheoMa, nhanBai } from './du-lieu.js';
import { doc, docLanLuot } from './phat-am.js';
import { esc, batDongHo, nutLoa } from './giao-dien.js';
import { toMauPinyin } from './pinyin.js';
import { htmlCauCham } from './cham-tu.js';
import { tron } from './cau-hoi-tu.js';
import { capMo, htmlCachMoKhoa } from './cap-do.js';
import { trangThaiCacChang } from './man-chang.js';
import { amCham, amXong } from './am-thanh.js';

let henDuLieu = null;
/** Tải mọi bài đọc → { mã bài: bài đọc } (thiếu file của một cấp thì bỏ qua) */
export function taiDocHieu() {
  if (!henDuLieu) {
    henDuLieu = Promise.all([1, 2, 3].map((cap) => fetch(`data/doc-hieu-hsk${cap}.json`)
      .then((r) => (r.ok ? r.json() : null)).catch(() => null)))
      .then((ds) => {
        const theoMa = {};
        for (const j of ds) {
          if (!j) continue;
          for (const b of j.bai) theoMa[j.capDo === 1 ? `s${b.so}` : `${j.capDo}-${b.so}`] = { ...b, cap: j.capDo };
        }
        return theoMa;
      });
  }
  return henDuLieu;
}

/** Tiến độ đọc hiểu của một bài (hoặc undefined) */
export const ketQuaDoc = (ma) => layTienDo().docHieu?.[ma];

const laChuHan = (s) => /\p{Script=Han}/u.test(s);

/**
 * @returns {Function} hàm dọn dẹp
 */
export function veDocHieu(khung, ma) {
  let daRoi = false;
  let dungDongHo = () => {};
  khung.innerHTML = '<div class="dang-tai">Đang tải bài đọc…</div>';

  taiDocHieu().then((tatCa) => {
    if (daRoi) return;
    const bd = tatCa[ma];
    const b = timBaiTheoMa(ma);
    if (!bd || !b) {
      khung.innerHTML = `<div class="chua-lam"><div class="emoji emoji-to">📝</div><h2>Bài đọc đang soạn</h2>
        <p class="chu-phu">Bài này chưa có đoạn đọc hiểu. Sẽ có trong bản cập nhật sau.</p>
        <a class="nut nut-chinh" href="#/bai/${esc(ma)}">← Về bài</a></div>`;
      return;
    }
    if (!capMo(b.cap)) { khung.innerHTML = htmlCachMoKhoa(b.cap); return; }
    // Đọc hiểu là bước sau từ vựng: chưa xong mọi phần của chặng thì chưa mở (kể cả khi vào thẳng bằng địa chỉ)
    if (b.sach && trangThaiCacChang(b).some((c) => c.tu.length && !c.xong)) {
      khung.innerHTML = `<div class="chua-lam"><div class="emoji emoji-to">🔒</div><h2>Bài đọc chưa mở</h2>
        <p class="chu-phu">Học xong các phần từ vựng của ${esc(nhanBai(b))} rồi mới đọc bài này.</p>
        <a class="nut nut-chinh" href="#/bai/${esc(ma)}">← Về chặng</a></div>`;
      return;
    }

    dungDongHo = batDongHo('nguPhap');
    // Bài đầu HSK 1 hiện sẵn pinyin; về sau ẩn để luyện đọc chữ
    let coPinyin = b.cap === 1 && b.so <= 5;
    let coDich = false;
    const cu = ketQuaDoc(ma);

    khung.innerHTML = `
      <section class="khung dau-bai">
        <span class="so-bai">📖 Đọc hiểu · ${nhanBai(b)}</span>
        <h2>${esc(bd.ten)}</h2>
        <p class="chu-phu nho" style="margin:6px 0 0">${bd.kieu === 'hoi-thoai' ? 'Hội thoại' : 'Đoạn văn'} · ${bd.cau.length} câu · ${bd.hoi.length} câu hỏi
          ${cu ? ` · lần trước đúng ${cu.diem}%` : ''}</p>
      </section>
      <div class="thanh-cong-cu-doc">
        <button class="nut nut-nho" id="nut-nghe-ca">🔊 Nghe cả bài</button>
        <button class="chip ${coPinyin ? 'dang-chon' : ''}" id="nut-py">Pinyin</button>
        <button class="chip" id="nut-dich">Dịch</button>
      </div>
      <p class="chu-phu nho" style="margin:6px 2px 0">Chạm vào một từ để xem nghĩa · từ gạch chân là từ bạn chưa học.</p>
      <section class="khung bai-doc ${bd.kieu}" id="bai-doc">
        ${bd.cau.map((c, i) => `
          <div class="dong-doc">
            ${c.ai ? `<span class="ai-noi">${laChuHan(c.ai) ? `<span class="han">${esc(c.ai)}</span>` : esc(c.ai)}</span>` : ''}
            <div class="giua">
              <p class="han cau-doc">${htmlCauCham(c.han)}</p>
              <p class="pinyin py-doc">${toMauPinyin(c.pinyin)}</p>
              <p class="dich-doc">${esc(c.dich)}</p>
            </div>
            ${nutLoa(c.han, true)}
          </div>`).join('')}
      </section>
      <h3 class="tieu-de-muc">Câu hỏi <small id="dem-dung"></small></h3>
      <div id="cac-cau-hoi"></div>
      <div id="ket-qua-doc"></div>`;

    const $ = (s) => khung.querySelector(s);
    const capNhatHien = () => {
      $('#bai-doc').classList.toggle('an-py', !coPinyin);
      $('#bai-doc').classList.toggle('an-dich', !coDich);
      $('#nut-py').classList.toggle('dang-chon', coPinyin);
      $('#nut-dich').classList.toggle('dang-chon', coDich);
      khung.querySelectorAll('.dich-hoi').forEach((x) => { x.hidden = !coDich; });
    };
    $('#nut-py').onclick = () => { coPinyin = !coPinyin; capNhatHien(); };
    $('#nut-dich').onclick = () => { coDich = !coDich; capNhatHien(); };
    $('#nut-nghe-ca').onclick = () => docLanLuot(bd.cau.map((c) => c.han));

    // ----- Câu hỏi -----
    const ketQua = [];   // true / false theo từng câu
    const htmlChu = (s) => (laChuHan(s) ? `<span class="han">${esc(s)}</span>` : esc(s));
    $('#cac-cau-hoi').innerHTML = bd.hoi.map((h, i) => {
      const luaChon = h.loai === 'chon'
        ? tron([{ hien: h.dapAn, dung: true }, ...h.nhieu.map((x) => ({ hien: x, dung: false }))])
        : [{ hien: '✓ Đúng', dung: h.dung }, { hien: '✗ Sai', dung: !h.dung }];
      h._luaChon = luaChon;
      return `
        <div class="khung cau-hoi-doc" data-cau="${i}">
          <p class="de-hoi-doc"><b>${i + 1}.</b> ${h.loai === 'dungSai' ? '<span class="nhan">Đúng hay sai?</span> ' : ''}
            ${laChuHan(h.hoi) ? `<span class="han">${htmlCauCham(h.hoi)}</span>` : esc(h.hoi)}</p>
          ${h.dich ? `<p class="chu-phu nho dich-hoi" hidden>${esc(h.dich)}</p>` : ''}
          <div class="luoi-lua-chon ${h.loai === 'chon' ? 'mot-cot' : 'hai-cot'}">
            ${luaChon.map((l, j) => `<button class="nut-lua-chon" data-j="${j}">${htmlChu(l.hien)}</button>`).join('')}
          </div>
        </div>`;
    }).join('');
    capNhatHien();

    khung.querySelectorAll('.cau-hoi-doc').forEach(($c) => {
      const i = Number($c.dataset.cau);
      const h = bd.hoi[i];
      $c.querySelectorAll('[data-j]').forEach((nut) => {
        nut.onclick = () => {
          if (ketQua[i] !== undefined) return;
          const dung = h._luaChon[Number(nut.dataset.j)].dung;
          amCham(dung);
          ketQua[i] = dung;
          $c.querySelectorAll('[data-j]').forEach((x) => {
            x.classList.toggle('dung', h._luaChon[Number(x.dataset.j)].dung);
            x.classList.toggle('sai', x === nut && !dung);
            x.disabled = true;
          });
          $c.classList.add(dung ? 'la-dung' : 'la-sai');
          if (laChuHan(h.hoi)) doc(h.hoi);
          const soDung = ketQua.filter(Boolean).length;
          const daLam = ketQua.filter((x) => x !== undefined).length;
          $('#dem-dung').textContent = `${soDung}/${daLam} đúng`;
          if (daLam === bd.hoi.length) xong(soDung);
        };
      });
    });

    function xong(soDung) {
      const tong = bd.hoi.length;
      const diem = Math.round((soDung / tong) * 100);
      const td = layTienDo();
      td.docHieu = td.docHieu || {};
      const truoc = td.docHieu[ma];
      td.docHieu[ma] = { diem, tot: Math.max(diem, truoc?.tot || 0), lan: (truoc?.lan || 0) + 1, luc: Date.now() };
      const nk = nhatKyHomNay();
      nk.docHieu = (nk.docHieu || 0) + 1;
      ghiLuot('docHieu', soDung, tong - soDung);   // đã lưu
      setTimeout(amXong, 350);
      luu();
      dungDongHo();
      $('#ket-qua-doc').innerHTML = `
        <div class="ket-thuc" style="padding-top:8px">
          <div class="emoji emoji-to">${diem >= 80 ? '🏆' : diem >= 50 ? '🎉' : '💪'}</div>
          <h2>${soDung}/${tong} câu đúng</h2>
          <p class="chu-phu">${diem >= 80 ? 'Bạn đã đọc hiểu bài này!' : 'Bật "Dịch" để đọc lại từng câu, rồi làm lại nhé.'}</p>
          <button class="nut nut-rong" id="nut-lam-lai">↺ Làm lại</button>
          <a class="nut nut-chinh nut-rong" href="#/bai/${esc(ma)}">← Về bài</a>
        </div>`;
      // cùng địa chỉ → báo cho bộ điều hướng vẽ lại (đồng hồ, dọn dẹp đi đúng đường)
      $('#nut-lam-lai').onclick = () => window.dispatchEvent(new HashChangeEvent('hashchange'));
      $('#ket-qua-doc').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  return () => {
    daRoi = true;
    dungDongHo();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };
}
