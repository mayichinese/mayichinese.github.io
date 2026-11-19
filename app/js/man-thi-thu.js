// =========================================================
// THI THỬ HSK 1 (Giai đoạn 5.2)  – ĐỀ MÔ PHỎNG, không phải đề chính thức
//   #/thi-thu        giới thiệu cấu trúc đề + lịch sử điểm
//   #/thi-thu/lam    làm một đề 40 câu (mỗi lần một đề khác)
// Cấu trúc theo đề thi thử HSK（一级）trong sách bài tập 《新HSK教程 1》 (2026):
//   NGHE (20 câu): P1 nghe chọn 1/3 tranh · P2 nghe câu, chọn câu đáp · P3 nghe câu, chọn tranh A–F
//                  · P4 nghe câu + câu hỏi, chọn đáp án
//   ĐỌC (20 câu, 20 phút): P1 câu ↔ tranh A–F · P2 ghép hỏi–đáp · P3 điền từ (6 từ) · P4 đọc câu, trả lời
// Tranh = emoji (data/thi-thu-hsk1.json, tạo bởi cong-cu/ghep-thi-thu.py). Mỗi câu 5 điểm, tổng 200, đạt từ 120.
// =========================================================

import { layTienDo, luu, nhatKyHomNay, congGiay } from './luu-tru.js';
import { docLanLuot, tinhTrangPhatAm } from './phat-am.js';
import { esc, thongBao } from './giao-dien.js';
import { bieuTuong } from './bieu-tuong.js';
import { toMauPinyin } from './pinyin.js';

const DIEM_MOI_CAU = 5;
const DIEM_DAT = 120;
const PHUT_DOC = 20;
const CHU_CAI = 'ABCDEF';

export const CAC_PHAN = [
  { ma: 'n1', ky: 'Nghe', ten: 'Phần 1', huongDan: 'Nghe và chọn tranh đúng.' },
  { ma: 'n2', ky: 'Nghe', ten: 'Phần 2', huongDan: 'Nghe một câu, chọn câu đáp lại phù hợp.' },
  { ma: 'n3', ky: 'Nghe', ten: 'Phần 3', huongDan: 'Nghe một câu, chọn tranh phù hợp (A–F).' },
  { ma: 'n4', ky: 'Nghe', ten: 'Phần 4', huongDan: 'Nghe một câu và câu hỏi, chọn đáp án đúng.' },
  { ma: 'd1', ky: 'Đọc', ten: 'Phần 1', huongDan: 'Đọc câu, chọn tranh phù hợp (A–F).' },
  { ma: 'd2', ky: 'Đọc', ten: 'Phần 2', huongDan: 'Chọn câu trả lời phù hợp cho mỗi câu hỏi (A–E).' },
  { ma: 'd3', ky: 'Đọc', ten: 'Phần 3', huongDan: 'Chọn từ phù hợp điền vào chỗ trống (A–F).' },
  { ma: 'd4', ky: 'Đọc', ten: 'Phần 4', huongDan: 'Đọc câu, trả lời câu hỏi.' },
];

// ---------- Dữ liệu ----------
let henDuLieu = null;
function taiDuLieuThi() {
  if (!henDuLieu) {
    henDuLieu = fetch('data/thi-thu-hsk1.json')
      .then((r) => { if (!r.ok) throw new Error(`Không tìm thấy data/thi-thu-hsk1.json (mã lỗi ${r.status}).`); return r.json(); })
      .catch((e) => { henDuLieu = null; throw e; });
  }
  return henDuLieu;
}

function tron(mang) {
  const m = mang.slice();
  for (let i = m.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [m[i], m[j]] = [m[j], m[i]];
  }
  return m;
}
const layNgauNhien = (mang, n) => tron(mang).slice(0, n);

/** Chữ Hán có pinyin nhỏ phía trên (như đề cấp 1) */
const hanPy = (han, py, lop = '') => `<span class="han-py ${lop}"><span class="py-tren">${esc(py)}</span><span class="han">${esc(han)}</span></span>`;

// ---------- Tạo đề ----------
/** Chọn 6 tranh có câu ví dụ, sao cho mỗi tranh trong 5 tranh đầu có một câu chỉ khớp đúng tranh đó */
function chonBoTranhCau(dl, daDungCau) {
  const coCau = dl.tranh.filter((t) => t.cau.length);
  for (let lan = 0; lan < 80; lan++) {
    const sau = layNgauNhien(coCau, 6);
    const idSau = new Set(sau.map((t) => t.id));
    const cauHoi = [];
    for (const t of sau.slice(0, 5)) {
      const hop = tron(t.cau).find((c) => !daDungCau.has(c.han) && c.coTranh.filter((x) => idSau.has(x)).length === 1);
      if (!hop) break;
      cauHoi.push({ tranh: t, cau: hop });
    }
    if (cauHoi.length === 5) {
      cauHoi.forEach((c) => daDungCau.add(c.cau.han));
      return { tranh: tron(sau), cauHoi };
    }
  }
  return null;
}

function taoDe(dl) {
  const de = [];
  // NGHE 1: nghe một từ, chọn 1 trong 3 tranh cùng nhóm
  const nhom = {};
  dl.tranh.forEach((t) => { (nhom[t.nhom] = nhom[t.nhom] || []).push(t); });
  const dich1 = layNgauNhien(dl.tranh, 5);
  dich1.forEach((t) => {
    const khac = layNgauNhien(nhom[t.nhom].filter((x) => x.id !== t.id), 2);
    const lc = tron([t, ...khac]);
    de.push({ phan: 'n1', doc: [t.han, t.han], luaChon: lc.map((x) => ({ emoji: x.emoji })), dung: lc.indexOf(t),
      loiGiai: { han: t.han, py: t.pinyin, nghia: t.nghia, emoji: t.emoji } });
  });
  // Nhóm hỏi–đáp: 1 nhóm cho Đọc 2, các cặp còn lại cho Nghe 2
  const nhomHd = tron(dl.hoiDap);
  const hdDoc = nhomHd[0];
  const capNghe = layNgauNhien(nhomHd.slice(1).flatMap((n) => n.cap), 5);
  capNghe.forEach((c) => {
    const lc = tron([{ h: c.a, p: c.ap, dung: true }, ...c.x]);
    de.push({ phan: 'n2', doc: [c.q, c.q], luaChon: lc.map((x) => ({ h: x.h, p: x.p })), dung: lc.findIndex((x) => x.dung),
      loiGiai: { han: c.q, py: c.qp, dapAn: `${c.a} (${c.ap})` } });
  });
  // NGHE 3 và ĐỌC 1: câu ví dụ ↔ 6 tranh
  const daDungCau = new Set();
  const bo3 = chonBoTranhCau(dl, daDungCau);
  const bo5 = chonBoTranhCau(dl, daDungCau);
  [['n3', bo3], ['d1', bo5]].forEach(([phan, bo]) => {
    if (!bo) return;
    bo.cauHoi.forEach(({ tranh, cau }) => {
      de.push({ phan, doc: phan === 'n3' ? [cau.han, cau.han] : null, cau, tranhChung: bo.tranh.map((t) => t.emoji),
        dung: bo.tranh.indexOf(tranh), loiGiai: { han: cau.han, py: cau.pinyin, dich: cau.dich, emoji: tranh.emoji } });
    });
  });
  // Câu hỏi theo câu: 5 cho Nghe 4, 5 cho Đọc 4
  const tc = tron(dl.theoCau);
  [['n4', tc.slice(0, 5)], ['d4', tc.slice(5, 10)]].forEach(([phan, ds]) => {
    ds.forEach((c) => {
      const lc = tron([{ h: c.a, p: c.ap, dung: true }, ...c.x]);
      de.push({ phan, doc: phan === 'n4' ? [c.s, c.h, c.s, c.h] : null, cauS: c, luaChon: lc.map((x) => ({ h: x.h, p: x.p })),
        dung: lc.findIndex((x) => x.dung), loiGiai: { han: c.s, py: c.sp, hoi: `${c.h} → ${c.a} (${c.ap})` } });
    });
  });
  // ĐỌC 2: ghép hỏi–đáp trong một nhóm
  const traLoi = tron(hdDoc.cap.map((c, i) => ({ h: c.a, p: c.ap, i })));
  hdDoc.cap.forEach((c, i) => {
    de.push({ phan: 'd2', cauQ: c, luaChonChung: traLoi, dung: traLoi.findIndex((x) => x.i === i),
      loiGiai: { han: c.q, py: c.qp, dapAn: `${c.a} (${c.ap})` } });
  });
  // ĐỌC 3: điền từ (một nhóm 6 từ)
  const dt = dl.dienTu[Math.floor(Math.random() * dl.dienTu.length)];
  const tuChung = tron(dt.tu);
  tron(dt.cau).forEach((c) => {
    const tuDung = dt.tu.find((w) => w.h === c.dapAn);
    // pinyin câu nhưng che phần của từ cần điền
    const re = new RegExp(tuDung.p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const pyChe = re.test(c.pinyin) ? c.pinyin.replace(re, '＿＿') : '';
    de.push({ phan: 'd3', cauF: c, pyChe, tuChung, dung: tuChung.findIndex((w) => w.h === c.dapAn),
      loiGiai: { han: c.cau.replace('（ ）', c.dapAn), py: c.pinyin } });
  });
  // sắp theo thứ tự phần
  const thuTu = CAC_PHAN.map((p) => p.ma);
  return de.sort((a, b) => thuTu.indexOf(a.phan) - thuTu.indexOf(b.phan));
}

// =========================================================
// TRANG GIỚI THIỆU
// =========================================================
export function veThiThu(khung) {
  const lichSu = (layTienDo().thiThu || []).slice().reverse();
  const tt = tinhTrangPhatAm();
  const tot = lichSu.length ? Math.max(...lichSu.map((x) => x.diem)) : null;
  khung.innerHTML = `
    <section class="khung gioi-thieu-thi">
      <div class="goc-the"><span class="nhan nhan-chinh">📋 HSK 1 · đề mô phỏng</span><span class="chu-phu nho">40 câu · ~35 phút</span></div>
      <h2>Thi thử HSK 1</h2>
      <table class="bang-cau-truc">
        <tr><th rowspan="4">🎧 Nghe<br><small>20 câu</small></th><td>P1 · Nghe, chọn 1 trong 3 tranh</td></tr>
        <tr><td>P2 · Nghe câu, chọn câu đáp lại</td></tr>
        <tr><td>P3 · Nghe câu, chọn tranh (A–F)</td></tr>
        <tr><td>P4 · Nghe câu + câu hỏi, chọn đáp án</td></tr>
        <tr><th rowspan="4">📖 Đọc<br><small>20 câu · ${PHUT_DOC} phút</small></th><td>P1 · Đọc câu, chọn tranh (A–F)</td></tr>
        <tr><td>P2 · Ghép câu hỏi với câu trả lời</td></tr>
        <tr><td>P3 · Chọn từ điền vào chỗ trống</td></tr>
        <tr><td>P4 · Đọc câu, trả lời câu hỏi</td></tr>
      </table>
      <p class="chu-phu nho">Mỗi câu ${DIEM_MOI_CAU} điểm · tổng 200 · <b>đạt từ ${DIEM_DAT} điểm</b>. Mỗi câu nghe được đọc 2 lần (như thi thật).
        Cấu trúc theo đề thi thử trong sách bài tập 《新HSK教程 1》 (2026); câu hỏi tự soạn, tranh là biểu tượng – <b>không phải đề chính thức</b>.</p>
      ${tt === 'khong-ho-tro' || tt === 'khong-co-giong' ? '<p class="can-kiem-tra">⚠️ Máy chưa có giọng đọc tiếng Trung nên phần Nghe sẽ không có tiếng. Xem cách cài trong Cài đặt.</p>' : ''}
      <label class="dong-cai-dat" style="border:0;padding:6px 0"><span>Cho phép bấm nghe lại (thi thật không có)</span>
        <input type="checkbox" id="cho-nghe-lai"></label>
      <a class="nut nut-chinh nut-rong" href="#/thi-thu/lam" id="nut-bat-dau"><span class="emoji">📋</span> Bắt đầu thi</a>
    </section>
    <h3 class="tieu-de-muc">Lịch sử thi thử <small>${lichSu.length ? `cao nhất ${tot}/200` : ''}</small></h3>
    ${lichSu.length ? `<div class="khung">${lichSu.slice(0, 10).map((x) => `
      <div class="dong-lich-su-thi">
        <span class="giua"><b>${x.diem}/200</b> <span class="nhan ${x.diem >= DIEM_DAT ? 'nhan-dat' : ''}">${x.diem >= DIEM_DAT ? '✅ Đạt' : 'Chưa đạt'}</span>
          <span class="chu-phu nho">Nghe ${x.nghe}/100 · Đọc ${x.doc}/100 · ${Math.round(x.giay / 60)} phút</span></span>
        <span class="chu-phu nho">${new Date(x.luc).toLocaleDateString('vi-VN')}</span>
      </div>`).join('')}</div>` : '<p class="chu-phu">Chưa thi lần nào.</p>'}`;
  const $cho = khung.querySelector('#cho-nghe-lai');
  try { $cho.checked = sessionStorage.getItem('mayi-thi-nghe-lai') === '1'; } catch { /* bỏ qua */ }
  $cho.onchange = () => { try { sessionStorage.setItem('mayi-thi-nghe-lai', $cho.checked ? '1' : '0'); } catch { /* bỏ qua */ } };
}

// =========================================================
// LÀM BÀI
// =========================================================
export function veLamBai(khung) {
  let daRoi = false;
  let henGio = null;
  const $dongHo = document.getElementById('dong-ho');
  let choNgheLai = false;
  try { choNgheLai = sessionStorage.getItem('mayi-thi-nghe-lai') === '1'; } catch { /* bỏ qua */ }
  khung.innerHTML = '<div class="dang-tai">Đang tạo đề…</div>';

  taiDuLieuThi().then((dl) => {
    if (daRoi) return;
    const de = taoDe(dl);
    const traLoi = new Array(de.length).fill(null);
    let viTri = 0;
    let giayDaLam = 0;
    let conGiayDoc = PHUT_DOC * 60;
    const daNghe = new Set();     // câu nghe đã phát tự động (chỉ phát 1 lần khi vào câu)
    let daNop = false;

    document.body.classList.add('dang-hoc');
    $dongHo.hidden = false;

    const laNghe = (c) => c.phan.startsWith('n');
    const veDongHo = () => {
      const c = de[viTri];
      if (c && !laNghe(c)) {
        const m = Math.floor(conGiayDoc / 60);
        $dongHo.textContent = `📖 còn ${m}:${String(conGiayDoc % 60).padStart(2, '0')}`;
        $dongHo.classList.toggle('sap-het', conGiayDoc <= 120);
      } else {
        $dongHo.textContent = `🎧 ${Math.floor(giayDaLam / 60)}:${String(giayDaLam % 60).padStart(2, '0')}`;
        $dongHo.classList.remove('sap-het');
      }
    };
    henGio = setInterval(() => {
      if (document.visibilityState !== 'visible' || daNop) return;
      giayDaLam++;
      const c = de[viTri];
      congGiay(laNghe(c) ? 'nghe' : 'nguPhap', 1);   // tính vào phút học của phần nghe / phần 5
      if (!laNghe(c)) {
        conGiayDoc--;
        if (conGiayDoc <= 0) { thongBao('Hết giờ phần Đọc – tự động nộp bài.'); nopBai(); return; }
      }
      veDongHo();
      if (giayDaLam % 15 === 0) luu();
    }, 1000);

    function nghe(c) {
      if (c.doc) docLanLuot(c.doc);
    }

    function veCau() {
      if (daRoi) return;
      const c = de[viTri];
      const p = CAC_PHAN.find((x) => x.ma === c.phan);
      const dau = viTri === 0 || de[viTri - 1].phan !== c.phan;
      const daChon = traLoi[viTri];
      const nutLc = (i, noiDung, lop = '') => `<button class="nut-thi ${lop} ${daChon === i ? 'dang-chon' : ''}" data-i="${i}"><b class="chu-cai">${CHU_CAI[i]}</b>${noiDung}</button>`;
      let than = '';
      if (c.phan === 'n1') {
        than = `<div class="luoi-tranh ba">${c.luaChon.map((x, i) => nutLc(i, `<span class="emoji tranh">${x.emoji}</span>`)).join('')}</div>`;
      } else if (c.phan === 'n2' || c.phan === 'n4') {
        than = `<div class="ds-lua-chon-thi">${c.luaChon.map((x, i) => nutLc(i, hanPy(x.h, x.p))).join('')}</div>`;
      } else if (c.phan === 'n3' || c.phan === 'd1') {
        const cauHien = c.phan === 'd1' ? `<p class="cau-thi">${hanPy(c.cau.han, c.cau.pinyin)}</p>` : '';
        than = `${cauHien}<div class="luoi-tranh sau">${c.tranhChung.map((e, i) => nutLc(i, `<span class="emoji tranh">${e}</span>`)).join('')}</div>`;
      } else if (c.phan === 'd2') {
        than = `<p class="cau-thi">${hanPy(c.cauQ.q, c.cauQ.qp)}</p>
          <div class="ds-lua-chon-thi">${c.luaChonChung.map((x, i) => nutLc(i, hanPy(x.h, x.p))).join('')}</div>`;
      } else if (c.phan === 'd3') {
        const [truoc, sau] = c.cauF.cau.split('（ ）');
        than = `<div class="kho-tu-thi">${c.tuChung.map((w, i) => `<span class="o-tu-thi"><b>${CHU_CAI[i]}</b> ${hanPy(w.h, w.p)}</span>`).join('')}</div>
          <p class="cau-thi">${c.pyChe ? `<span class="py-tren-cau">${esc(c.pyChe)}</span>` : ''}<span class="han">${esc(truoc)}<span class="o-dien">（${daChon !== null ? esc(c.tuChung[daChon].h) : '　'}）</span>${esc(sau)}</span></p>
          <div class="luoi-chu-cai">${c.tuChung.map((w, i) => nutLc(i, '', 'nho')).join('')}</div>`;
      } else if (c.phan === 'd4') {
        than = `<p class="cau-thi">${hanPy(c.cauS.s, c.cauS.sp)}</p>
          <p class="cau-thi hoi">★ ${hanPy(c.cauS.h, c.cauS.hp)}</p>
          <div class="ds-lua-chon-thi">${c.luaChon.map((x, i) => nutLc(i, hanPy(x.h, x.p))).join('')}</div>`;
      }
      const conNgheLai = laNghe(c) && choNgheLai;
      khung.innerHTML = `
        <div class="phien">
          <div class="tien-do-phien">
            <div class="thanh-tien-do"><span style="width:${(traLoi.filter((x) => x !== null).length / de.length) * 100}%"></span></div>
            <span class="dem">Câu ${viTri + 1}/${de.length}</span>
          </div>
          <div class="khung the-thi">
            <div class="goc-the"><span class="nhan nhan-chinh">${laNghe(c) ? '🎧' : '📖'} ${p.ky} · ${p.ten}</span>
              <span class="chu-phu nho">${p.huongDan}</span></div>
            ${laNghe(c) ? `<div class="hang-nghe-thi">
              <span class="emoji" style="font-size:1.6rem">🔊</span>
              <span class="chu-phu nho" id="trang-thai-nghe">${dau ? 'Bắt đầu phần mới…' : 'Đang đọc (2 lần)…'}</span>
              ${conNgheLai ? `<button class="nut nut-nho" id="nut-nghe-lai">${bieuTuong('loa')} Nghe lại</button>` : ''}
            </div>` : ''}
            ${than}
          </div>
          <div class="hang-nut dieu-huong-thi">
            <button class="nut" id="nut-truoc" ${viTri === 0 ? 'disabled' : ''}>‹ Câu trước</button>
            ${viTri + 1 < de.length
              ? `<button class="nut nut-chinh" id="nut-sau">Câu sau ›</button>`
              : '<button class="nut nut-chinh" id="nut-nop">Nộp bài ✓</button>'}
          </div>
        </div>`;
      khung.querySelectorAll('[data-i]').forEach((b) => {
        b.onclick = () => { traLoi[viTri] = Number(b.dataset.i); veCau(); };
      });
      khung.querySelector('#nut-truoc').onclick = () => { if (viTri > 0) { viTri--; veCau(); } };
      khung.querySelector('#nut-sau')?.addEventListener('click', () => { viTri++; veCau(); });
      khung.querySelector('#nut-nop')?.addEventListener('click', () => {
        const chuaLam = traLoi.filter((x) => x === null).length;
        if (chuaLam && !confirm(`Còn ${chuaLam} câu chưa trả lời. Nộp bài luôn?`)) return;
        nopBai();
      });
      khung.querySelector('#nut-nghe-lai')?.addEventListener('click', () => nghe(c));
      veDongHo();
      // Câu nghe: tự đọc 2 lần khi vào câu lần đầu
      if (laNghe(c) && !daNghe.has(viTri)) {
        daNghe.add(viTri);
        setTimeout(() => {
          if (daRoi || de[viTri] !== c) return;
          docLanLuot(c.doc).then(() => {
            const $tt = khung.querySelector('#trang-thai-nghe');
            if ($tt && de[viTri] === c) $tt.textContent = 'Đã đọc xong – chọn đáp án.';
          });
          const $tt = khung.querySelector('#trang-thai-nghe');
          if ($tt) $tt.textContent = 'Đang đọc (2 lần)…';
        }, dau ? 900 : 350);
      } else if (laNghe(c)) {
        const $tt = khung.querySelector('#trang-thai-nghe');
        if ($tt) $tt.textContent = 'Đã nghe câu này.';
      }
    }

    function nopBai() {
      if (daNop) return;
      daNop = true;
      clearInterval(henGio);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      $dongHo.hidden = true;
      document.body.classList.remove('dang-hoc');
      const dung = de.map((c, i) => traLoi[i] === c.dung);
      const diemNghe = de.reduce((s, c, i) => s + (laNghe(c) && dung[i] ? DIEM_MOI_CAU : 0), 0);
      const diemDoc = de.reduce((s, c, i) => s + (!laNghe(c) && dung[i] ? DIEM_MOI_CAU : 0), 0);
      const tong = diemNghe + diemDoc;
      const td = layTienDo();
      td.thiThu = [...(td.thiThu || []), { cap: 1, luc: new Date().toISOString(), diem: tong, nghe: diemNghe, doc: diemDoc, giay: giayDaLam }].slice(-30);
      const nk = nhatKyHomNay();
      nk.thiThu = (nk.thiThu || 0) + 1;
      luu();
      veKetQua(de, traLoi, dung, diemNghe, diemDoc, giayDaLam);
    }

    function veKetQua(de, traLoi, dung, diemNghe, diemDoc, giay) {
      const tong = diemNghe + diemDoc;
      const dat = tong >= DIEM_DAT;
      const theoPhan = CAC_PHAN.map((p) => {
        const cs = de.map((c, i) => [c, i]).filter(([c]) => c.phan === p.ma);
        return `<tr><td>${p.ky} ${p.ten}</td><td><b>${cs.filter(([, i]) => dung[i]).length}</b>/${cs.length}</td></tr>`;
      }).join('');
      const xemLai = de.map((c, i) => {
        const p = CAC_PHAN.find((x) => x.ma === c.phan);
        const lg = c.loiGiai;
        const chon = traLoi[i] === null ? '—' : CHU_CAI[traLoi[i]];
        return `<div class="dong-xem-lai ${dung[i] ? 'dung' : 'sai'}">
          <div class="dong-tren"><b>Câu ${i + 1} · ${p.ky} ${p.ten}</b>
            <span>${dung[i] ? '✅' : '❌'} bạn chọn <b>${chon}</b> · đáp án <b>${CHU_CAI[c.dung]}</b></span></div>
          <div class="noi-dung-xem-lai">
            ${lg.emoji ? `<span class="emoji tranh-nho">${lg.emoji}</span>` : ''}
            <span><span class="han">${esc(lg.han)}</span> <span class="pinyin">${toMauPinyin(lg.py)}</span>
            ${lg.nghia ? `<br><span class="chu-phu nho">${esc(lg.nghia)}</span>` : ''}
            ${lg.dich ? `<br><span class="chu-phu nho">${esc(lg.dich)}</span>` : ''}
            ${lg.dapAn ? `<br><span class="chu-phu nho">Trả lời đúng: <span class="han">${esc(lg.dapAn)}</span></span>` : ''}
            ${lg.hoi ? `<br><span class="chu-phu nho">Câu hỏi: <span class="han">${esc(lg.hoi)}</span></span>` : ''}</span>
          </div>
        </div>`;
      }).join('');
      khung.innerHTML = `
        <div class="ket-thuc">
          <div class="emoji emoji-to">${dat ? '🏆' : '💪'}</div>
          <h2>${tong}/200 điểm</h2>
          <p><span class="nhan ${dat ? 'nhan-dat' : ''}" style="font-size:.95rem">${dat ? '✅ Đạt (từ 120 điểm)' : `Chưa đạt – cần thêm ${DIEM_DAT - tong} điểm`}</span></p>
          <p class="chu-phu">Nghe ${diemNghe}/100 · Đọc ${diemDoc}/100 · ${Math.round(giay / 60)} phút</p>
          <div class="khung" style="width:100%"><table class="bang-diem-phan">${theoPhan}</table></div>
          <a class="nut nut-chinh nut-rong" href="#/thi-thu" id="nut-thi-lai">📋 Thi đề khác</a>
          <a class="nut nut-rong" href="#/">🏠 Về trang Hôm nay</a>
        </div>
        <h3 class="tieu-de-muc">Xem lại từng câu</h3>
        <div class="ds-xem-lai">${xemLai}</div>`;
    }

    // Nút quay lại khi đang thi: hỏi trước khi bỏ bài
    const $quayLai = document.getElementById('nut-quay-lai');
    $quayLai.onclick = () => {
      if (daNop || confirm('Thoát bây giờ thì bài thi này sẽ không được tính. Thoát?')) location.hash = '#/thi-thu';
    };
    veCau();
  }).catch((e) => {
    if (!daRoi) khung.innerHTML = `<div class="loi">${esc(e.message)}</div>`;
  });

  return () => {
    daRoi = true;
    clearInterval(henGio);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    $dongHo.hidden = true;
    $dongHo.classList.remove('sap-het');
    document.body.classList.remove('dang-hoc');
    luu();
  };
}

/** Điểm thi thử cao nhất (cho trang Thống kê); null nếu chưa thi */
export const diemThiCaoNhat = () => {
  const ls = layTienDo().thiThu || [];
  return ls.length ? Math.max(...ls.map((x) => x.diem)) : null;
};
