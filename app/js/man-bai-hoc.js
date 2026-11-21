// =========================================================
// BÀI HỌC – "lộ trình" kiểu Duolingo
//   #/bai          chọn cấp (HSK 1/2/3, kèm % đã học) + tổng quan cấp + cách chia bài + tìm từ
//                  + LỘ TRÌNH: các bài nối nhau theo thứ tự học, bài đang học nổi bật
//   #/bai/5        bài 5 theo chủ đề        #/bai/s5  bài 5 của sách 《新HSK教程 1》
//   #/bai/2-5      bài 5 của sách 《新HSK教程 2》   #/bai/c2-5  bài chủ đề 5 của HSK 2 (data/chu-de-hsk2.json)
//                  Trang một bài: các CHẶNG ~5 từ (man-chang.js: nghe → nói → viết → ghép → đọc),
//                  rồi Ngữ pháp của bài, Đọc hiểu, Kiểm tra bài (mở khi xong các chặng), rồi danh sách từ.
//   #/tu/<khóa>    xem một từ
// Lộ trình LUÔN theo thứ tự bài sách (du-lieu.js cheDoBai → 'sach'). Bài "theo chủ đề" (#/bai/5, #/bai/c2-5)
// chỉ còn là danh mục tra từ. Tiến độ lưu theo TỪNG TỪ (và tienDo.chang theo mã bài sách).
// =========================================================

import { layTienDo, caiDat } from './luu-tru.js';
import { loaiThe } from './lich-on.js';
import {
  layTu, tatCaTu, nghiaNgan, danhSachBai, timBaiTheoMa, cheDoBai, coTheoSach, tenSach,
  nhanBai, baiSachCuaTu, baiSachCuaNguPhap, cacCapCoDuLieu, chuDeCuaMotTu, TEN_TU_LOAI,
} from './du-lieu.js';
import { baiDangHoc } from './phien-hoc.js';
import { esc, boDau, htmlMatSau, dongTu, nutTuLoai, moHopThoai, CHU_THICH_CHAM, CHU_THICH_MAU_THANH } from './giao-dien.js';
import { trangThaiLoTrinh, saoCuaChang, changMo, changBiNhayQua, ketQuaKiemTra, viecTiepTheo, nhapMonXong, DIEM_QUA_KIEM_TRA } from './lo-trinh.js';
import { veDuongNhapMon } from './man-nhap-mon.js';
import { bieuTuong } from './bieu-tuong.js';
import { taiNguPhap } from './man-ngu-phap.js';
import { capMo, capHienTai, htmlCachMoKhoa } from './cap-do.js';
import { trangThaiCacChang, BIEU_TUONG_CUA } from './man-chang.js';
import { taiDocHieu, ketQuaDoc } from './man-doc-hieu.js';

// Cấp đang xem trong lộ trình (mặc định: cấp của bài đang học dở)
let capDangXem = null;

/** Đếm từ đã học / đã thuộc trong một danh sách từ */
function demTu(dsTu, the) {
  const daHoc = dsTu.filter((t) => the[t.khoa]).length;
  const thuoc = dsTu.filter((t) => loaiThe(the[t.khoa]) === 'da-thuoc').length;
  return { daHoc, thuoc, phanTram: dsTu.length ? Math.round((daHoc / dsTu.length) * 100) : 0 };
}

// ---------- Lộ trình: ĐƯỜNG ĐI các chặng (game hóa, 2026-11-21) ----------
// Nút tròn nối nhau uốn lượn; chặng khóa 🔒 / đang học (nổi bật) / đã qua kiểm tra (⭐). Tự cuộn tới chặng đang học,
// nút ☰ Mục lục để nhảy nhanh tới một chặng. Luật mở khóa và sao ở lo-trinh.js.
const LECH = [0, 58, 88, 58, 0, -58, -88, -58];   // độ lệch ngang (px) tạo đường uốn lượn
const htmlSao = (n) => `<span class="sao-duong" aria-label="${n} sao">${'⭐'.repeat(n)}${'<i>☆</i>'.repeat(3 - n)}</span>`;

/** Chọn cấp đang xem ở lộ trình (0 = Nhập môn) – dùng cho #/nhap-mon (giữ tab Nhập môn dù đã xong) */
let giuNhapMon = false;
export const xemCap = (c) => { capDangXem = c; giuNhapMon = c === 0; };

/** @param {boolean} tuChip  vẽ lại do bấm chip cấp (giữ lựa chọn của người dùng) */
export function veDanhSachBai(khung, tuChip = false) {
  const td = layTienDo();
  const coCap = cacCapCoDuLieu();
  // Vào từ địa chỉ #/bai: Nhập môn đã xong / bỏ qua thì mở cấp đang học thay vì tab Nhập môn
  if (!tuChip && capDangXem === 0 && nhapMonXong() && !giuNhapMon) capDangXem = null;
  giuNhapMon = false;
  if (capDangXem !== 0 && !coCap.includes(capDangXem)) {
    capDangXem = !nhapMonXong() ? 0 : viecTiepTheo()?.b?.cap || baiDangHoc()?.cap || capHienTai();
  }
  const cap = capDangXem;
  const chipNhapMon = `<button class="chip ${cap === 0 ? 'dang-chon' : ''}" data-cap="0">Nhập môn${nhapMonXong() ? ' <small>✓</small>' : ''}</button>`;
  if (cap === 0) {
    khung.innerHTML = `<div class="hang-chip chon-cap">${chipNhapMon}${[1, 2, 3].map((c) => `<button class="chip ${capMo(c) ? '' : 'chip-khoa'}" data-cap="${c}">HSK ${c}${capMo(c) ? '' : ' <span class="emoji">🔒</span>'}</button>`).join('')}</div>
      <div id="duong-nhap-mon"></div>`;
    khung.querySelectorAll('[data-cap]').forEach((nut) => { nut.onclick = () => { capDangXem = Number(nut.dataset.cap); veDanhSachBai(khung, true); }; });
    veDuongNhapMon(khung.querySelector('#duong-nhap-mon'));
    return;
  }
  const khoa = !capMo(cap);   // cấp đang xem còn khóa → chỉ xem trước tên chặng, không vào học

  // Chọn cấp: mỗi chip kèm % đã học; cấp chưa mở khóa hiện 🔒 (vẫn bấm được để xem cách mở khóa)
  const chipCap = [1, 2, 3].map((c) => {
    if (!coCap.includes(c)) return `<button class="chip" disabled title="Sắp có">HSK ${c} <span class="emoji">🔒</span></button>`;
    const nhan = capMo(c)
      ? `<small> · ${demTu(tatCaTu().filter((t) => t.cap === c), td.the).phanTram}%</small>`
      : ' <span class="emoji">🔒</span>';
    return `<button class="chip ${c === cap ? 'dang-chon' : ''} ${capMo(c) ? '' : 'chip-khoa'}" data-cap="${c}">HSK ${c}${nhan}</button>`;
  }).join('');

  const tuCap = tatCaTu().filter((t) => t.cap === cap);
  const tk = demTu(tuCap, td.the);
  const tenSachCap = cap === 1 ? tenSach().split('–')[0].trim() : `《新HSK教程 ${cap}》`;
  const ds = trangThaiLoTrinh(cap);
  const soQua = ds.filter((x) => x.dat).length;

  khung.innerHTML = `
    <div class="hang-chip chon-cap">${chipNhapMon}${chipCap}</div>
    ${khoa ? `<div style="margin-top:12px">${htmlCachMoKhoa(cap)}</div>` : ''}
    ${cap === 1 && !nhapMonXong() ? `<div class="khung the-nhay" style="margin-top:12px"><b>🔒 Chặng 1 mở sau khi xong Nhập môn</b>
      <p class="chu-phu nho" style="margin:4px 0 10px">Nhập môn dạy phiên âm, thanh điệu, nét chữ – nền móng để học từ vựng.</p>
      <a class="nut nut-chinh nut-rong" href="#/nhap-mon/tiep">▶ Học Nhập môn</a>
      <a class="nut nut-rong" href="#/nhap-mon/bo-qua" style="margin-top:8px">⏭️ Đã biết pinyin – kiểm tra để bỏ qua</a></div>` : ''}
    <section class="khung tong-quan-cap">
      <div class="dong-tren"><b>HSK ${cap} · ${tuCap.length} từ · ${ds.length} chặng</b>
        <button class="nut nut-nho" id="nut-muc-luc">☰ Mục lục</button></div>
      <span class="thanh-tien-do"><span style="width:${tk.phanTram}%"></span></span>
      <span class="chu-phu nho">Đã học ${tk.daHoc}/${tuCap.length} từ · qua ${soQua}/${ds.length} chặng · theo thứ tự bài của ${esc(tenSachCap)}</span>
    </section>
    <input class="o-tim" id="o-tim" type="search" placeholder="🔍 Tra từ: chữ Hán, pinyin, nghĩa, Hán Việt…" autocomplete="off">
    <div id="ket-qua"><div class="dang-tai">Đang vẽ lộ trình…</div></div>`;

  khung.querySelectorAll('[data-cap]').forEach((nut) => {
    nut.onclick = () => { capDangXem = Number(nut.dataset.cap); veDanhSachBai(khung, true); };
  });

  const $kq = khung.querySelector('#ket-qua');
  let htmlDuong = '';
  const dangHocMa = ds.find((x) => x.mo && !x.dat)?.b.ma;

  // Mục lục: danh sách gọn mọi chặng
  khung.querySelector('#nut-muc-luc').onclick = () => {
    moHopThoai(`
      <div class="dau-hop"><h2>Mục lục HSK ${cap}</h2><button class="nut-bieu-tuong" data-dong aria-label="Đóng">✕</button></div>
      <div class="ds-muc-luc">${ds.map((x) => `
        <a class="dong-muc-luc ${x.b.ma === dangHocMa ? 'dang' : ''}" href="#/bai/${x.b.ma}">
          <span class="so">${x.b.so}</span><span class="giua">${esc(x.b.ten)}</span>
          <span>${!x.mo || khoa ? '🔒' : x.dat ? '✅' : x.b.ma === dangHocMa ? '▶' : ''}</span></a>`).join('')}</div>`);
  };

  Promise.all([taiNguPhap().catch(() => []), taiDocHieu().catch(() => ({}))]).then(([diem, tatCaDoc]) => {
    if (!khung.isConnected) return;
    htmlDuong = `<div class="duong-di">${ds.map((x, i) => {
      const b = x.b;
      const t = demTu(b.tu, td.the);
      const trangThai = khoa || !x.mo ? 'khoa' : x.dat ? 'xong' : b.ma === dangHocMa ? 'dang' : 'do-dang';
      const sao = x.dat ? saoCuaChang(b, diem, tatCaDoc) : 0;
      const nhayQua = x.dat && x.kt?.nhay && !sao;
      const chu = esc([...b.tu[0].hanzi].slice(0, 2).join(''));
      const noiDung = trangThai === 'khoa' ? '<span class="emoji">🔒</span>'
        : trangThai === 'xong' ? `${chu}<i class="dau-xong">✓</i>` : chu;
      const phu = trangThai === 'khoa' ? `${b.tu.length} từ`
        : trangThai === 'xong' ? (nhayQua ? '⏭️ đã nhảy qua' : htmlSao(sao))
          : x.xongTu ? '🔑 Làm kiểm tra để mở chặng sau' : `${t.daHoc}/${b.tu.length} từ`;
      const bong = trangThai === 'dang' ? `<span class="bong-noi">${x.xongTu ? 'KIỂM TRA' : t.daHoc ? 'TIẾP TỤC' : 'BẮT ĐẦU'}</span>` : '';
      return `
        <div class="nut-duong ${trangThai}" style="--lech:${LECH[i % LECH.length]}px" id="chang-${b.ma}">
          ${bong}
          <a class="tron-duong han" href="#/bai/${b.ma}" aria-label="Chặng ${b.so}: ${esc(b.ten)}">${noiDung}</a>
          <a class="nhan-duong" href="#/bai/${b.ma}"><span class="so-bai">Chặng ${b.so}</span><b>${esc(b.ten)}</b>
            <span class="chu-phu nho">${phu}</span></a>
        </div>`;
    }).join('')}</div>`;
    if (!khung.querySelector('#o-tim').value.trim()) $kq.innerHTML = htmlDuong;
    // Tự cuộn tới chặng đang học
    const $dang = khung.querySelector('.nut-duong.dang');
    if ($dang && $dang.getBoundingClientRect().top > window.innerHeight * 0.6) {
      requestAnimationFrame(() => $dang.scrollIntoView({ block: 'center' }));
    }
  });

  const $tim = khung.querySelector('#o-tim');
  $tim.oninput = () => {
    const goc = $tim.value.trim();
    const q = boDau(goc);
    if (!q) { $kq.innerHTML = htmlDuong || '<div class="dang-tai">Đang vẽ lộ trình…</div>'; return; }
    const qLien = q.replace(/\s/g, '');
    const kq = tatCaTu().filter((t) =>
      t.hanzi.includes(goc) || boDau(t.pinyin).replace(/\s/g, '').includes(qLien) ||
      boDau(nghiaNgan(t)).includes(q) || boDau(t.hanViet).includes(q));
    $kq.innerHTML = kq.length
      ? `<p class="chu-phu nho" style="margin:12px 2px 8px">${kq.length} kết quả (cả 3 cấp)</p>
         <div class="khung ds-tu">${kq.slice(0, 80).map(dongTu).join('')}</div>`
      : '<p class="chu-phu" style="margin:16px 2px">Không tìm thấy từ nào.</p>';
  };
}

// ---------- Một bài: 3 bước + danh sách từ ----------
/** Một bước trong bài (dùng kiểu dòng nhiệm vụ của trang Hôm nay) */
function buocBai({ so, ma, emoji, ten, moTa, href, xong, them = '', khoa = false }) {
  const the = href ? 'a' : 'div';
  return `
    <${the} class="dong-ke-hoach khung phan-${ma} ${xong ? 'da-xong' : ''} ${khoa ? 'sap-co' : ''}" ${href ? `href="${href}"` : ''}>
      <span class="o-emoji emoji">${emoji}</span>
      <span class="giua">
        <span class="dong-tren"><b>${so}. ${ten}</b></span>
        <span class="mo-ta">${moTa}</span>
        ${them}
      </span>
      <span class="cuoi-dong">${xong ? '<span class="emoji">✅</span>' : href ? bieuTuong('phai') : ''}</span>
    </${the}>`;
}

/** Một chủ đề (#/chu-de/<mã>): danh sách từ theo nhóm nghĩa + trắc nghiệm ôn theo chủ đề */
export function veChuDe(khung, ma) {
  const b = timBaiTheoMa(ma);
  if (!b || b.sach) { khung.innerHTML = '<p class="loi">Không tìm thấy chủ đề này.</p><a class="nut" href="#/chu-de">← Các chủ đề</a>'; return; }
  if (!capMo(b.cap)) { khung.innerHTML = htmlCachMoKhoa(b.cap); return; }
  veDanhMucChuDe(khung, b);
}

/** Bài theo chủ đề (không nằm trên lộ trình): danh mục từ + nút ôn theo chủ đề */
function veDanhMucChuDe(khung, b) {
  const td = layTienDo();
  const t = demTu(b.tu, td.the);
  khung.innerHTML = `
    <section class="khung dau-bai">
      <span class="so-bai">🗂️ Chủ đề${b.cap > 1 ? ` · HSK ${b.cap}` : ''}</span>
      <h2>${esc(b.ten)}</h2>
      <span class="thanh-tien-do" style="margin-top:8px"><span style="width:${t.phanTram}%"></span></span>
      <p class="chu-phu nho" style="margin:6px 0 10px">${t.daHoc}/${b.tu.length} từ đã học. Học từ mới theo lộ trình ở
        <a href="#/bai">Bài học</a>; ở đây ôn lại theo nhóm nghĩa.</p>
      <a class="nut nut-chinh nut-rong" href="#/trac-nghiem/chu-de/${b.ma}">📝 Trắc nghiệm chủ đề (10 câu${t.daHoc >= 4 ? ', từ đã học' : ''})</a>
    </section>
    <h3 class="tieu-de-muc">Từ trong chủ đề <small>${b.tu.length} từ</small></h3>
    ${CHU_THICH_CHAM}
    <div class="khung ds-tu">${b.tu.map(dongTu).join('')}</div>`;
}

/** @param ma 's5' (bài 5 sách HSK 1), '2-5' (bài sách HSK 2…); số / 'c2-5' = danh mục chủ đề */
export async function veBai(khung, ma) {
  const b = timBaiTheoMa(ma);
  if (!b) { khung.innerHTML = '<p class="loi">Không tìm thấy bài này.</p>'; return; }
  if (!capMo(b.cap)) {
    khung.innerHTML = `${htmlCachMoKhoa(b.cap)}<a class="nut nut-rong" href="#/bai" style="margin-top:12px">← Về lộ trình</a>`;
    return;
  }
  if (!b.sach) { veDanhMucChuDe(khung, b); return; }
  if (!changMo(b) && b.cap === 1 && b.so === 1 && !nhapMonXong()) {
    khung.innerHTML = `<div class="chua-lam"><div class="emoji emoji-to">🔒</div><h2>Chặng 1 mở sau khi xong Nhập môn</h2>
      <p class="chu-phu">Học phiên âm và thanh điệu trước để đọc đúng ngay từ đầu.</p>
      <a class="nut nut-chinh" href="#/nhap-mon/tiep">▶ Học Nhập môn</a>
      <a class="nut" href="#/nhap-mon/bo-qua">⏭️ Đã biết pinyin – kiểm tra để bỏ qua</a></div>`;
    return;
  }
  if (!changMo(b)) {
    const bo = changBiNhayQua(b);
    khung.innerHTML = `
      <section class="khung dau-bai"><span class="so-bai">🔒 ${esc(nhanBai(b))}</span><h2>${esc(b.ten)}</h2>
        <p class="chu-phu" style="margin:8px 0 0">Chặng này mở khi qua <b>Kiểm tra ${esc(nhanBai(bo[bo.length - 1] || b))}</b> (đúng từ ${DIEM_QUA_KIEM_TRA}%).</p></section>
      <div class="khung the-nhay">
        <b>⏭️ Đã biết nội dung trước đó?</b>
        <p class="chu-phu nho" style="margin:4px 0 10px">Làm bài kiểm tra 15 câu về ${bo.length === 1 ? esc(nhanBai(bo[0])) : `${bo.length} chặng bị bỏ qua (${esc(nhanBai(bo[0]))} – ${bo[bo.length - 1].so})`}.
          Đạt từ ${DIEM_QUA_KIEM_TRA}% thì mở ngay chặng này; các chặng bỏ qua vẫn học lại được bất cứ lúc nào.</p>
        <a class="nut nut-chinh nut-rong" href="#/kiem-tra/nhay/${b.ma}">Kiểm tra để nhảy tới đây</a>
      </div>
      <a class="nut nut-rong" href="#/bai" style="margin-top:12px">← Về lộ trình</a>
      <h3 class="tieu-de-muc">Từ vựng của chặng <small>${b.tu.length} từ</small></h3>
      <div class="khung ds-tu">${b.tu.map(dongTu).join('')}</div>`;
    return;
  }
  const td = layTienDo();
  const t = demTu(b.tu, td.the);
  const dsChang = trangThaiCacChang(b);
  const dangHoc = dsChang.find((c) => !c.xong);
  const xongTu = !dangHoc;

  // Một PHẦN: tên phần + từ của phần + hàng CỬA (chỉ biểu tượng; chạm để vào). Cửa đang học nổi bật.
  const cuaDangHoc = dangHoc?.cua.find((x) => !x.xong);
  const thePhan = (c) => {
    const nut = c.cua.map((x) => {
      const trangThai = x.xong ? 'xong' : x === cuaDangHoc ? 'dang' : 'khoa';
      const nhanTiep = x.loai === 'tu' ? `Từ ${x.so + 1}: ${x.tu.hanzi}` : x.loai === 'ghep' ? 'Ghép câu' : 'Đọc';
      const noiDung = `<span class="emoji">${BIEU_TUONG_CUA[x.loai]}</span>${x.xong ? '<i class="dau-xong-cua">✓</i>' : ''}`;
      return c.mo && x.mo
        ? `<a class="cua ${trangThai}" href="#/cua/${b.ma}/${c.so}/${x.so}" title="${esc(nhanTiep)}" aria-label="${esc(nhanTiep)}">${noiDung}</a>`
        : `<span class="cua khoa" title="${esc(nhanTiep)} – chưa mở" aria-label="${esc(nhanTiep)} – chưa mở">${noiDung}</span>`;
    }).join('<span class="noi-cua"></span>');
    return `
      <section class="khung the-phan ${c.xong ? 'xong' : c === dangHoc ? 'dang' : ''} ${c.mo ? '' : 'khoa'}">
        <div class="dau-phan">
          <b>Phần ${c.so + 1}</b>
          ${c.xong ? '<span class="nhan nhan-vang">✓ Xong</span>' : c === dangHoc ? '<span class="nhan nhan-chinh">Đang học</span>' : c.mo ? '' : '<span class="nhan">🔒</span>'}
        </div>
        <p class="han han-chang">${c.tu.map((x) => esc(x.hanzi)).join(' · ')}</p>
        <div class="hang-cua">${nut}</div>
      </section>`;
  };

  const khoaSau = 'Mở khi xong các phần từ vựng – để mọi câu đều dùng từ bạn đã học.';
  const buocDoc = '<div id="buoc-doc"></div>';
  const kt = ketQuaKiemTra(b.ma);
  const buocKiemTra = buocBai({ so: dsChang.length + 3, ma: 'on', emoji: '🔑', ten: 'Kiểm tra chặng (bắt buộc)',
    href: xongTu ? `#/kiem-tra/${b.ma}` : '', xong: !!kt?.dat,
    moTa: !xongTu ? `🔒 ${khoaSau}`
      : kt ? `Cao nhất ${kt.tot ?? 0}% · ${kt.dat ? '✅ đã qua – chặng sau đã mở' : `cần ${DIEM_QUA_KIEM_TRA}% để mở chặng sau`}`
        : `15 câu từ + ngữ pháp · đạt ${DIEM_QUA_KIEM_TRA}% để mở chặng sau`,
    khoa: !xongTu });

  khung.innerHTML = `
    <section class="khung dau-bai">
      <span class="so-bai">${nhanBai(b)}</span>
      <h2>${esc(b.ten)}</h2>
      <span class="thanh-tien-do"><span style="width:${t.phanTram}%"></span></span>
      <p class="chu-phu nho" style="margin:6px 0 0">${t.daHoc}/${b.tu.length} từ đã học${t.thuoc ? ` · thuộc chắc ${t.thuoc}` : ''}
        · ${dsChang.filter((c) => c.xong).length}/${dsChang.length} phần</p>
    </section>
    <p class="chu-phu nho" style="margin:12px 2px 0">Mỗi phần ~5 từ. ⭐ = một từ (nghe → nói theo → viết → nhớ, sai thì hỏi lại tới khi đúng) · 🧩 ghép câu · 📖 đọc. App tự chấm và xếp lịch ôn.</p>
    <div class="ds-chang">${dsChang.map(thePhan).join('')}</div>
    <div class="ke-hoach" style="margin-top:14px"><div id="buoc-ngu-phap"></div>${buocDoc}${buocKiemTra}</div>
    <h3 class="tieu-de-muc">Từ vựng của chặng <small>${b.tu.length} từ</small></h3>
    ${CHU_THICH_CHAM}
    ${caiDat().tatMauThanh ? '' : CHU_THICH_MAU_THANH}
    <div class="khung ds-tu">${b.tu.map(dongTu).join('')}</div>`;

  // Đọc hiểu (tải sau): mở khi xong các chặng; bài chưa soạn thì hiện "đang soạn"
  taiDocHieu().then((tatCa) => {
    const $d = khung.querySelector('#buoc-doc');
    if (!$d?.isConnected) return;
    const bd = tatCa[b.ma];
    const kq = ketQuaDoc(b.ma);
    const so = dsChang.length + 2;
    $d.outerHTML = !bd
      ? buocBai({ so, ma: 'nghe', emoji: '📖', ten: 'Đọc hiểu', khoa: true,
        moTa: 'Đoạn hội thoại / đoạn văn ngắn dùng từ của chặng – đang soạn, sắp có.' })
      : !xongTu
        ? buocBai({ so, ma: 'nghe', emoji: '📖', ten: `Đọc hiểu: ${esc(bd.ten)}`, khoa: true, moTa: `🔒 ${khoaSau}` })
        : buocBai({ so, ma: 'nghe', emoji: '📖', ten: `Đọc hiểu: ${esc(bd.ten)}`, href: `#/doc-hieu/${b.ma}`, xong: (kq?.tot || 0) >= 80,
          moTa: kq ? `Lần gần nhất đúng ${kq.diem}% · cao nhất ${kq.tot}%` : `${bd.kieu === 'hoi-thoai' ? 'Hội thoại' : 'Đoạn văn'} ${bd.cau.length} câu · ${bd.hoi.length} câu hỏi` });
  });

  // Ngữ pháp của bài (tải sau): chỉ mở khi đã xong các chặng từ vựng
  const diem = await taiNguPhap().catch(() => []);
  const vung = khung.querySelector('#buoc-ngu-phap');
  if (!vung || !vung.isConnected) return;
  const cua = diem.filter((d) => (b.cap > 1 ? d.cap === b.cap && d.bai === b.so
    : d.cap === 1 && baiSachCuaNguPhap(d.id) === b.so));
  const ng = td.nguPhap.the;
  const soBuoc = dsChang.length + 1;
  if (!cua.length) {
    vung.outerHTML = buocBai({ so: soBuoc, ma: 'nguPhap', emoji: '🧩', ten: 'Ngữ pháp', href: '#/ngu-phap',
      moTa: 'Chặng này không có điểm ngữ pháp mới. Ôn lại trong thư viện ngữ pháp.' });
  } else if (!xongTu) {
    vung.outerHTML = buocBai({ so: soBuoc, ma: 'nguPhap', emoji: '🧩', ten: `Ngữ pháp của chặng · ${cua.length} điểm`,
      moTa: `🔒 ${khoaSau}`, khoa: true });
  } else {
    const daLuyen = cua.filter((d) => ng[d.id]).length;
    vung.outerHTML = buocBai({ so: soBuoc, ma: 'nguPhap', emoji: '🧩', ten: 'Ngữ pháp của chặng', xong: daLuyen === cua.length,
      moTa: `${daLuyen}/${cua.length} điểm đã luyện · chạm từng điểm để học`,
      them: `<span class="ds-diem-bai">${cua.map((d) => `
        <a class="chip" href="#/ngu-phap/${d.id}"><i class="cham ${loaiThe(ng[d.id])}"></i>${esc(d.ten)}</a>`).join('')}</span>` });
  }
}

// ---------- Xem một từ ----------
export function veTu(khung, khoa) {
  const tu = layTu(khoa);
  if (!tu) { khung.innerHTML = '<p class="loi">Không tìm thấy từ này.</p>'; return; }
  const the = layTienDo().the[khoa];
  const moTa = { 'chua-hoc': 'Chưa học', 'dang-hoc': 'Đang học', 'dang-on': 'Đang ôn', 'da-thuoc': 'Đã thuộc chắc' }[loaiThe(the)];
  const lanToi = the?.han ? new Date(the.han).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '';
  const baiSach = baiSachCuaTu(tu);
  khung.innerHTML = `
    <div class="khung the-xem">${htmlMatSau(tu)}</div>
    <div class="khung trang-thai-tu">
      <div><b>Trạng thái:</b> ${moTa}${the ? ` · đã ôn ${the.soLanOn || 0} lần · quên ${the.soLanQuen || 0} lần` : ''}</div>
      ${lanToi ? `<div><b>Lần ôn tới:</b> ${lanToi}</div>` : ''}
      <div class="chu-phu nho">${tu.cap > 1
        ? `HSK ${tu.cap} · Chặng ${tu.bai} (bài ${tu.bai} sách 《新HSK教程 ${tu.cap}》)${chuDeCuaMotTu(tu) ? ` · chủ đề ${chuDeCuaMotTu(tu).so}: ${esc(chuDeCuaMotTu(tu).ten)}` : ''}`
        : `HSK 1${baiSach ? ` · Chặng ${baiSach} (bài ${baiSach} sách)` : ''} · chủ đề ${tu.bai}`}</div>
      <div class="chu-phu nho">Danh sách chính thức: STT ${tu.soThuTu} · từ loại ${tu.tuLoaiChinhThuc
        ? tu.tuLoaiChinhThuc.split('、').map((k) => {
          const goc = k.replace(/[（）()]/g, '');
          return TEN_TU_LOAI[goc] ? nutTuLoai(goc, khoa, '') : esc(k);
        }).join(' ')
        : nutTuLoai('cụm', khoa, '')}</div>
    </div>`;
}
