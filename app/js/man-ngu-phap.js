// =========================================================
// NGỮ PHÁP (Giai đoạn 4)
//   #/ngu-phap              danh sách điểm ngữ pháp HSK 1, HSK 2 (theo thứ tự nên học)
//   #/ngu-phap/<mã>         bài học: công thức, giải thích, lỗi hay mắc, ví dụ
//   #/ngu-phap/<mã>/luyen   luyện tập một điểm (sắp xếp câu + điền từ)
//   #/ngu-phap/on           ôn các điểm đến hạn
// Dữ liệu: data/ngu-phap-hsk1.json, data/ngu-phap-hsk2.json (tạo bởi cong-cu/ghep-ngu-phap.py [cấp]
// từ cong-cu/nguon-ngu-phap/). Mỗi điểm có thêm trường cap; điểm cấp 2 có d.bai = bài HSK 2.
// Mã điểm không trùng giữa các cấp nên tiến độ vẫn lưu chung ở tienDo.nguPhap.the.
// Tự chấm sau mỗi lượt và xếp lịch ôn SM-2 (lich-on.js), lưu ở tienDo.nguPhap.the:
//   điểm MỚI : ≥ 80% đúng → Dễ (ôn sau 4 ngày) · dưới 80% → Khó (luyện lại sớm)
//   điểm ÔN  : ≥ 80% → Nhớ · 50–80% → Khó · dưới 50% → Quên
// =========================================================

import { layTienDo, luu, nhatKyHomNay, caiDat } from './luu-tru.js';
import { tinhLichMoi, moTaKhoangCach, loaiThe, dangHoc, DANH_GIA } from './lich-on.js';
import { tatCaTu, baiSachCuaNguPhap } from './du-lieu.js';

// Các file ngữ pháp theo cấp. tuyChon: thiếu file thì bỏ qua (cấp đang soạn).
const CAC_FILE_NP = [
  { cap: 1, duongDan: 'data/ngu-phap-hsk1.json' },
  { cap: 2, duongDan: 'data/ngu-phap-hsk2.json', tuyChon: true },
];
import { doc } from './phat-am.js';
import { esc, batDongHo, nutLoa, CHU_THICH_CHAM } from './giao-dien.js';
import { toMauPinyin } from './pinyin.js';

const SO_DIEM_MOI_LUOT_ON = 6;     // lượt ôn: tối đa 6 điểm, mỗi điểm 2 bài
const TEN_DG = { 1: 'Quên', 2: 'Khó', 3: 'Nhớ', 4: 'Dễ' };
const MUC_DG = { 1: 'quen', 2: 'kho', 3: 'nho', 4: 'de' };

// ---------- Dữ liệu ----------
let henDuLieu = null;
export function taiNguPhap() {
  if (!henDuLieu) {
    henDuLieu = Promise.all(CAC_FILE_NP.map((f) => fetch(f.duongDan)
      .then((r) => {
        if (!r.ok) {
          if (f.tuyChon) return { diem: [] };
          throw new Error(`Không tìm thấy ${f.duongDan} (mã lỗi ${r.status}).`);
        }
        return r.json();
      })
      .catch((e) => { if (f.tuyChon) return { diem: [] }; throw e; })
      .then((j) => (j.diem || []).map((d) => ({ ...d, cap: f.cap })))))
      .then((ds) => ds.flat())
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

/** Bài từ vựng xa nhất (của một cấp) mà người học đã học ít nhất một từ */
function baiDaHocToi(cap = 1) {
  const td = layTienDo();
  return tatCaTu().reduce((m, t) => (t.cap === cap && td.the[t.khoa] ? Math.max(m, t.bai) : m), 0);
}

/** Nhãn bài sách của một điểm: HSK 1 theo bảng theo-sach, HSK 2 theo d.bai */
const nhanSachCuaDiem = (d) => (d.cap > 1
  ? (d.bai ? `📖 HSK ${d.cap} · Bài ${d.bai}` : '')
  : (baiSachCuaNguPhap(d.id) ? `📖 Sách: Bài ${baiSachCuaNguPhap(d.id)}` : ''));

/** Các điểm đến hạn ôn (đang học dở hoặc đã đến hạn) */
export function diemCanOn(diem, bayGio = Date.now()) {
  const the = layTienDo().nguPhap.the;
  return diem.filter((d) => the[d.id] && (dangHoc(the[d.id]) || the[d.id].han <= bayGio))
    .sort((a, b) => the[a.id].han - the[b.id].han);
}

/** Tự chấm một điểm sau lượt luyện */
function chamDiem(laMoi, tiLe) {
  if (laMoi) return tiLe >= 0.8 ? DANH_GIA.DE : DANH_GIA.KHO;
  if (tiLe >= 0.8) return DANH_GIA.NHO;
  if (tiLe >= 0.5) return DANH_GIA.KHO;
  return DANH_GIA.QUEN;
}

/** Ví dụ có tô màu pinyin + nút nghe */
const htmlViDu = (v) => `
  <div class="vi-du">
    <div class="vi-du-chu">
      <p class="han vi-du-han">${esc(v.han)}</p>
      <p class="pinyin vi-du-pinyin">${toMauPinyin(v.pinyin)}</p>
      <p class="vi-du-dich">${esc(v.dich)}</p>
    </div>
    ${nutLoa(v.han, true)}
  </div>`;

// =========================================================
// DANH SÁCH ĐIỂM NGỮ PHÁP
// =========================================================
export async function veNguPhap(khung) {
  khung.innerHTML = '<div class="dang-tai">Đang tải ngữ pháp…</div>';
  let diem;
  try { diem = await taiNguPhap(); } catch (e) { khung.innerHTML = `<div class="loi">${esc(e.message)}</div>`; return; }
  if (!khung.isConnected) return;
  const ng = layTienDo().nguPhap;
  const canOn = diemCanOn(diem);
  const daLuyen = diem.filter((d) => ng.the[d.id]).length;
  const tiepTheo = diem.find((d) => !ng.the[d.id]);
  const cacCap = [...new Set(diem.map((d) => d.cap))];

  khung.innerHTML = `
    <div class="hai-o">
      <div class="o-lon khung phan-nguPhap">
        <span class="o-emoji emoji">🧩</span>
        <span class="so-lon">${daLuyen}<small class="chu-phu" style="font-size:1rem">/${diem.length}</small></span>
        <b>Đã luyện</b>
        <span class="chu-phu nho">điểm ngữ pháp HSK ${cacCap.join(', ')}</span>
      </div>
      <${canOn.length ? 'a href="#/ngu-phap/on"' : 'div'} class="o-lon khung phan-on">
        <span class="o-emoji emoji">🔁</span>
        <span class="so-lon">${canOn.length}</span>
        <b>Cần ôn</b>
        <span class="chu-phu nho">${canOn.length ? 'chạm để ôn' : 'chưa có điểm đến hạn'}</span>
      </${canOn.length ? 'a' : 'div'}>
    </div>
    <p style="margin-top:16px">
      ${canOn.length
        ? `<a class="nut nut-chinh nut-rong" href="#/ngu-phap/on"><span class="emoji">🔁</span> Ôn ngữ pháp (${Math.min(canOn.length, SO_DIEM_MOI_LUOT_ON)} điểm)</a>`
        : tiepTheo ? `<a class="nut nut-chinh nut-rong" href="#/ngu-phap/${tiepTheo.id}"><span class="emoji">📖</span> Học tiếp: ${esc(tiepTheo.ten)}</a>` : ''}
    </p>
    ${CHU_THICH_CHAM.replace('thuộc chắc (≥ 21 ngày)', 'thuộc chắc')}
    ${cacCap.map((cap) => {
      const ds = diem.filter((d) => d.cap === cap);
      const toiBai = baiDaHocToi(cap);
      return `
    <h3 class="tieu-de-muc">Ngữ pháp HSK ${cap} <small>${ds.filter((d) => ng.the[d.id]).length}/${ds.length} · theo thứ tự nên học</small></h3>
    <div class="ds-ngu-phap">
      ${ds.map((d, i) => `
        <a class="dong-ngu-phap khung" href="#/ngu-phap/${d.id}">
          <span class="so-diem">${i + 1}</span>
          <span class="giua">
            <b>${esc(d.ten)}</b>
            <span class="cong-thuc-nho han">${esc(d.congThuc[0] || '')}</span>
            <span class="hang-nhan">
              ${nhanSachCuaDiem(d) ? `<span class="nhan nhan-chinh">${nhanSachCuaDiem(d)}</span>` : ''}
              ${d.hocSauBai > toiBai ? `<span class="nhan">📚 dùng từ đến Bài ${d.hocSauBai}${cap > 1 ? ` HSK ${cap}` : ''}</span>` : ''}
            </span>
            ${(d.canKiemTra || []).length ? '<span class="nhan nhan-vang">⚠️ cần kiểm tra</span>' : ''}
          </span>
          <span class="cham ${loaiThe(ng.the[d.id])}"></span>
        </a>`).join('')}
    </div>`;
    }).join('')}
    <p class="chu-phu nho" style="margin-top:16px">Danh mục theo Đề cương thi HSK 2025 (语法大纲 cấp ${cacCap.join('–')}).
      Giải thích và ví dụ soạn riêng cho app – có thể còn sai sót.</p>`;
}

// =========================================================
// BÀI HỌC MỘT ĐIỂM
// =========================================================
export async function veDiemNguPhap(khung, ma) {
  khung.innerHTML = '<div class="dang-tai">Đang tải…</div>';
  let diem;
  try { diem = await taiNguPhap(); } catch (e) { khung.innerHTML = `<div class="loi">${esc(e.message)}</div>`; return; }
  if (!khung.isConnected) return;
  const d0 = diem.find((x) => x.id === ma);
  if (!d0) { khung.innerHTML = '<p class="loi">Không tìm thấy điểm ngữ pháp này.</p>'; return; }
  const cungCap = diem.filter((x) => x.cap === d0.cap);
  const i = cungCap.indexOf(d0);
  const d = d0;
  const j = diem.indexOf(d0);   // vị trí trong cả danh sách (để đi điểm trước / sau)
  const ng = layTienDo().nguPhap;
  if (!ng.daXem[ma]) { ng.daXem[ma] = Date.now(); luu(); }
  const the = ng.the[ma];
  const soBai = d.viDu.filter((v) => v.manh.length >= 3).length + d.dienTu.length;
  const trangThai = the
    ? `Đã luyện ${the.soLanOn || 0} lần · ${{ 'dang-hoc': 'đang học', 'dang-on': 'đang ôn', 'da-thuoc': 'thuộc chắc' }[loaiThe(the)]}
       · lần ôn tới: ${new Date(the.han).toLocaleDateString('vi-VN')}`
    : 'Chưa luyện điểm này.';

  khung.innerHTML = `
    <article class="khung bai-ngu-phap">
      <div class="goc-the"><span class="nhan nhan-chinh">Điểm ${i + 1}/${cungCap.length} · HSK ${d.cap}</span>
        <span class="chu-phu nho">${nhanSachCuaDiem(d)}${nhanSachCuaDiem(d) && d.hocSauBai ? ' · ' : ''}${d.hocSauBai ? `từ vựng đến Bài ${d.hocSauBai}` : ''}</span></div>
      <h2>${esc(d.ten)}</h2>
      <p class="de-cuong">Đề cương: <span class="han">${esc(d.deCuong)}</span></p>
      <div class="cong-thuc">${d.congThuc.map((c) => `<div class="han">${esc(c)}</div>`).join('')}</div>
      <ul class="giai-thich">${d.giaiThich.map((g) => `<li>${esc(g)}</li>`).join('')}</ul>
      ${d.loiHayMac.length ? `<div class="loi-hay-mac"><b>⚠️ Lỗi người Việt hay mắc</b>
        <ul>${d.loiHayMac.map((g) => `<li>${esc(g)}</li>`).join('')}</ul></div>` : ''}
      ${(d.canKiemTra || []).length ? `<div class="can-kiem-tra">⚠️ Cần kiểm tra: ${d.canKiemTra.map(esc).join('; ')}</div>` : ''}
    </article>

    <h3 class="tieu-de-muc">Ví dụ <small>chạm 🔊 để nghe</small></h3>
    ${d.viDu.map(htmlViDu).join('')}

    <p class="chu-phu nho" style="margin:14px 2px">${trangThai}</p>
    <a class="nut nut-chinh nut-rong" href="#/ngu-phap/${d.id}/luyen"><span class="emoji">✏️</span> Luyện tập điểm này (${soBai} câu)</a>
    <div class="hang-nut dieu-huong-diem">
      ${j > 0 ? `<a class="nut" href="#/ngu-phap/${diem[j - 1].id}">‹ Điểm trước</a>` : '<span></span>'}
      ${j + 1 < diem.length ? `<a class="nut" href="#/ngu-phap/${diem[j + 1].id}">Điểm sau ›</a>` : '<span></span>'}
    </div>`;
}

// =========================================================
// LUYỆN TẬP (một điểm, hoặc ôn các điểm đến hạn)
// =========================================================
/**
 * @param {string} ma  mã điểm, hoặc 'on' để ôn các điểm đến hạn
 * @returns {Function} hàm dọn dẹp
 */
export function vePhienNguPhap(khung, ma) {
  let daRoi = false;
  let dungDongHo = () => {};
  let xuLyPhim = null;
  khung.innerHTML = '<div class="dang-tai">Đang chuẩn bị bài tập…</div>';

  taiNguPhap().then((diem) => {
    if (daRoi) return;
    let cacDiem;
    if (ma === 'on') cacDiem = diemCanOn(diem).slice(0, SO_DIEM_MOI_LUOT_ON);
    else cacDiem = diem.filter((d) => d.id === ma);
    if (!cacDiem.length) {
      khung.innerHTML = `<div class="chua-lam"><div class="emoji emoji-to">🎉</div>
        <h2>${ma === 'on' ? 'Không có điểm nào cần ôn' : 'Không tìm thấy điểm ngữ pháp'}</h2>
        <a class="nut" href="#/ngu-phap">Về danh sách ngữ pháp</a></div>`;
      return;
    }

    // --- Tạo bài tập ---
    const baiTap = [];
    for (const d of cacDiem) {
      const sx = d.viDu.filter((v) => v.manh.length >= 3).map((v) => ({ loai: 'sx', d, v }));
      const dt = d.dienTu.map((t) => ({ loai: 'dt', d, t }));
      if (ma === 'on') baiTap.push(...tron(sx).slice(0, 1), ...tron(dt).slice(0, 1));
      else baiTap.push(...sx, ...dt);
    }
    const hangDoi = tron(baiTap);
    const ketQuaDiem = new Map(cacDiem.map((d) => [d.id, { d, dung: 0, tong: 0 }]));

    document.body.classList.add('dang-hoc');
    dungDongHo = batDongHo('nguPhap');
    const tong = hangDoi.length;
    let daLam = 0;
    let bt = null;
    let daTraLoi = false;

    khung.innerHTML = `
      <div class="phien">
        <div class="tien-do-phien">
          <div class="thanh-tien-do"><span style="width:0%"></span></div>
          <span class="dem"></span>
        </div>
        <div class="khung the-thanh" id="the"></div>
        <div class="vung-tra-loi" id="vung-nut"></div>
      </div>`;
    const $ = (s) => khung.querySelector(s);

    function capNhatTienDo() {
      $('.tien-do-phien .thanh-tien-do > span').style.width = `${(daLam / tong) * 100}%`;
      const dung = [...ketQuaDiem.values()].reduce((s, k) => s + k.dung, 0);
      $('.tien-do-phien .dem').textContent = `Câu ${Math.min(daLam + (daTraLoi ? 0 : 1), tong)}/${tong} · đúng ${dung}`;
    }

    function cauTiepTheo() {
      if (daRoi) return;
      bt = hangDoi.shift();
      if (!bt) return veKetThuc();
      daTraLoi = false;
      capNhatTienDo();
      const nhan = `<div class="goc-the"><span class="nhan">🧩 ${esc(bt.d.ten)}</span></div>`;
      if (bt.loai === 'sx') veSapXep(nhan);
      else veDienTu(nhan);
    }

    // ----- Sắp xếp câu -----
    function veSapXep(nhan) {
      const { v } = bt;
      // xáo các mảnh, tránh trùng đúng thứ tự gốc
      let thuTu = tron(v.manh.map((m, i) => i));
      for (let lan = 0; lan < 5 && thuTu.every((x, i) => x === i); lan++) thuTu = tron(thuTu);
      const daChon = [];
      $('#the').innerHTML = `${nhan}
        <p class="cau-hoi">Sắp xếp thành câu đúng</p>
        <p class="goi-y-dich">“${esc(v.dich)}”</p>
        <div class="dong-sap-xep" id="dong"></div>
        <div class="kho-manh" id="kho"></div>
        <div id="dap-an" class="dap-an"></div>`;
      $('#vung-nut').innerHTML = `
        <div class="hang-nut">
          <button class="nut" id="nut-lai">↺ Làm lại</button>
          <button class="nut nut-chinh" id="nut-kiem-tra" disabled>Kiểm tra</button>
        </div>`;
      const ve = () => {
        $('#dong').innerHTML = daChon.length
          ? daChon.map((i, k) => `<button class="manh da-chon han" data-k="${k}">${esc(v.manh[i])}</button>`).join('')
            + (v.dauCau ? `<span class="dau-cau han">${esc(v.dauCau)}</span>` : '')
          : '<span class="chu-phu nho">Chạm các mảnh bên dưới theo đúng thứ tự</span>';
        $('#kho').innerHTML = thuTu.map((i) => `<button class="manh han" data-i="${i}" ${daChon.includes(i) ? 'disabled' : ''}>${esc(v.manh[i])}</button>`).join('');
        $('#nut-kiem-tra').disabled = daChon.length !== v.manh.length;
        if (daTraLoi) return;
        $('#kho').querySelectorAll('[data-i]').forEach((b) => { b.onclick = () => { daChon.push(Number(b.dataset.i)); ve(); }; });
        $('#dong').querySelectorAll('[data-k]').forEach((b) => { b.onclick = () => { daChon.splice(Number(b.dataset.k), 1); ve(); }; });
      };
      $('#nut-lai').onclick = () => { if (!daTraLoi) { daChon.length = 0; ve(); } };
      $('#nut-kiem-tra').onclick = () => {
        if (daTraLoi) return;
        const traLoi = daChon.map((i) => v.manh[i]).join('');
        const cacDapAn = [v.manh, ...(v.khac || [])].map((m) => m.join(''));
        const dung = cacDapAn.includes(traLoi);
        daTraLoi = true;
        ve();
        $('#vung-nut .hang-nut')?.remove();   // đã kiểm tra → bỏ nút Làm lại / Kiểm tra
        $('#dong').classList.add(dung ? 'la-dung' : 'la-sai');
        const khacKhop = dung && traLoi !== v.manh.join('');
        xongCau(dung, `${dung ? `✅ Đúng!${khacKhop ? ' (cách sắp xếp khác cũng đúng)' : ''}` : '❌ Chưa đúng. Câu đúng:'}
          <p class="han cau-dung">${esc(v.han)}</p>
          ${(v.khac || []).length ? `<p class="chu-phu nho">Cũng đúng: <span class="han">${v.khac.map((m) => esc(m.join('') + v.dauCau)).join(' · ')}</span></p>` : ''}
          <p class="pinyin">${toMauPinyin(v.pinyin)}</p>
          <p class="chu-phu nho">${esc(v.dich)}</p>`, v.han);
      };
      ve();
    }

    // ----- Điền từ -----
    function veDienTu(nhan) {
      const { t } = bt;
      const luaChon = tron([t.dapAn, ...t.nhieu]);
      const [truoc, sau] = t.cau.split('___');
      $('#the').innerHTML = `${nhan}
        <p class="cau-hoi">Chọn từ điền vào chỗ trống</p>
        <p class="han cau-dien">${esc(truoc)}<span class="o-dien" id="o-dien">＿＿</span>${esc(sau)}</p>
        <p class="goi-y-dich">“${esc(t.dich)}”</p>
        <div id="dap-an" class="dap-an"></div>`;
      $('#vung-nut').innerHTML = `
        <div class="luoi-lua-chon hai-cot">
          ${luaChon.map((l, i) => `<button class="nut-lua-chon" data-l="${esc(l)}"><span class="han">${esc(l)}</span><kbd>${i + 1}</kbd></button>`).join('')}
        </div>
        <p class="phim-tat">Phím tắt: 1–4 chọn đáp án</p>`;
      $('#vung-nut').querySelectorAll('[data-l]').forEach((b) => {
        b.onclick = () => {
          if (daTraLoi) return;
          daTraLoi = true;
          const dung = b.dataset.l === t.dapAn;
          $('#vung-nut').querySelectorAll('[data-l]').forEach((x) => {
            x.classList.toggle('dung', x.dataset.l === t.dapAn);
            x.classList.toggle('sai', x === b && !dung);
            x.disabled = true;
          });
          $('#o-dien').textContent = t.dapAn;
          $('#o-dien').classList.add(dung ? 'la-dung' : 'la-sai');
          $('#vung-nut .phim-tat')?.remove();
          const caCau = t.cau.replace('___', t.dapAn);
          xongCau(dung, `${dung ? '✅ Đúng!' : `❌ Đáp án: <b class="han">${esc(t.dapAn)}</b>`}
            <p class="pinyin">${toMauPinyin(t.pinyin)}</p>
            <p class="chu-phu nho">${esc(t.dich)}</p>`, caCau);
        };
      });
    }

    function xongCau(dung, html, cauDoc) {
      daLam++;
      const kq = ketQuaDiem.get(bt.d.id);
      kq.tong++;
      if (dung) kq.dung++;
      const ng = layTienDo().nguPhap;
      ng[dung ? 'dung' : 'sai']++;
      const nk = nhatKyHomNay();
      nk.nguPhap = (nk.nguPhap || 0) + 1;
      luu();
      $('#dap-an').innerHTML = html;
      $('#dap-an').classList.add(dung ? 'la-dung' : 'la-sai');
      $('#vung-nut').insertAdjacentHTML('beforeend',
        `<button class="nut nut-chinh nut-rong" id="nut-tiep" style="margin-top:10px">${hangDoi.length ? 'Câu tiếp ▶' : 'Xem kết quả ▶'}</button>`);
      $('#nut-tiep').onclick = cauTiepTheo;
      if (caiDat().tuPhatAm) doc(cauDoc);
      capNhatTienDo();
      $('#nut-tiep').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    function veKetThuc() {
      dungDongHo();
      document.body.classList.remove('dang-hoc');
      // Tự chấm từng điểm và xếp lịch ôn
      const ng = layTienDo().nguPhap;
      const dong = [...ketQuaDiem.values()].filter((k) => k.tong).map((k) => {
        const cu = ng.the[k.d.id];
        const dg = chamDiem(!cu, k.dung / k.tong);
        const sau = moTaKhoangCach(cu, dg);
        ng.the[k.d.id] = tinhLichMoi(cu, dg);
        return `<div class="dong-ket-qua-np">
          <span class="giua"><b>${esc(k.d.ten)}</b><span class="chu-phu nho">${k.dung}/${k.tong} câu đúng · ôn lại sau ${sau}</span></span>
          <b class="chu-${MUC_DG[dg]}">${TEN_DG[dg]}</b></div>`;
      });
      luu();
      const dungHet = [...ketQuaDiem.values()].reduce((s, k) => s + k.dung, 0);
      const ti = tong ? dungHet / tong : 0;
      khung.innerHTML = `
        <div class="ket-thuc">
          <div class="emoji emoji-to">${ti >= 0.8 ? '🏆' : ti >= 0.5 ? '🎉' : '💪'}</div>
          <h2>${ti >= 0.8 ? 'Xuất sắc!' : ti >= 0.5 ? 'Làm tốt lắm!' : 'Cố lên, ôn thêm nhé!'}</h2>
          <p class="chu-phu">${dungHet}/${tong} câu đúng</p>
          <div class="khung" style="width:100%;text-align:left">${dong.join('')}</div>
          ${ma !== 'on' ? `<a class="nut nut-rong" href="#/ngu-phap/${ma}">📖 Xem lại bài học</a>` : ''}
          <a class="nut nut-chinh nut-rong" href="#/ngu-phap">🧩 Danh sách ngữ pháp</a>
          <a class="nut nut-rong" href="#/">🏠 Về trang Hôm nay</a>
        </div>`;
    }

    xuLyPhim = (e) => {
      if (!bt || e.target.closest?.('input, select, textarea')) return;
      const dangONut = e.target.closest?.('button, a');
      if (e.key === 'Enter' && daTraLoi && !dangONut) { e.preventDefault(); cauTiepTheo(); return; }
      if (!daTraLoi && bt.loai === 'dt' && /^[1-4]$/.test(e.key)) $('#vung-nut').querySelectorAll('[data-l]')[Number(e.key) - 1]?.click();
    };
    document.addEventListener('keydown', xuLyPhim);
    cauTiepTheo();
  }).catch((e) => {
    if (!daRoi) khung.innerHTML = `<div class="loi">${esc(e.message)}</div>`;
  });

  return () => {
    daRoi = true;
    dungDongHo();
    if (xuLyPhim) document.removeEventListener('keydown', xuLyPhim);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    document.body.classList.remove('dang-hoc');
  };
}
