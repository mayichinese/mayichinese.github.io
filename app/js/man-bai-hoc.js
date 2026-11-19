// =========================================================
// BÀI HỌC – "lộ trình" kiểu Duolingo
//   #/bai          chọn cấp (HSK 1/2/3, kèm % đã học) + tổng quan cấp + cách chia bài + tìm từ
//                  + LỘ TRÌNH: các bài nối nhau theo thứ tự học, bài đang học nổi bật
//   #/bai/5        bài 5 theo chủ đề        #/bai/s5  bài 5 của sách 《新HSK教程 1》
//   #/bai/2-5      bài 5 của sách 《新HSK教程 2》   #/bai/c2-5  bài chủ đề 5 của HSK 2 (data/chu-de-hsk2.json)
//                  Trang một bài có 3 bước: ① Học từ mới ② Ngữ pháp của bài ③ Kiểm tra bài, rồi danh sách từ.
//   #/tu/<khóa>    xem một từ
// Cách chia bài (caiDat.cheDoBai, chung cho mọi cấp): 'chu-de' = theo nhóm nghĩa, 'sach' = theo thứ tự bài sách.
// Tiến độ lưu theo TỪNG TỪ nên đổi cách chia không ảnh hưởng tiến độ.
// =========================================================

import { layTienDo, caiDat, luu } from './luu-tru.js';
import { loaiThe } from './lich-on.js';
import {
  layTu, tatCaTu, nghiaNgan, danhSachBai, timBaiTheoMa, cheDoBai, coTheoSach, tenSach,
  nhanBai, baiSachCuaTu, baiSachCuaNguPhap, cacCapCoDuLieu, coChuDe, chuDeCuaMotTu,
} from './du-lieu.js';
import { demHomNay, tuChuaHoc, baiDangHoc } from './phien-hoc.js';
import { esc, boDau, htmlMatSau, dongTu, CHU_THICH_CHAM, CHU_THICH_MAU_THANH } from './giao-dien.js';
import { bieuTuong } from './bieu-tuong.js';
import { taiNguPhap } from './man-ngu-phap.js';

// Cấp đang xem trong lộ trình (mặc định: cấp của bài đang học dở)
let capDangXem = null;

/** Đếm từ đã học / đã thuộc trong một danh sách từ */
function demTu(dsTu, the) {
  const daHoc = dsTu.filter((t) => the[t.khoa]).length;
  const thuoc = dsTu.filter((t) => loaiThe(the[t.khoa]) === 'da-thuoc').length;
  return { daHoc, thuoc, phanTram: dsTu.length ? Math.round((daHoc / dsTu.length) * 100) : 0 };
}

// ---------- Lộ trình (danh sách bài) ----------
export function veDanhSachBai(khung) {
  const td = layTienDo();
  const cd = caiDat();
  const cheDo = cheDoBai(cd);
  const coCap = cacCapCoDuLieu();
  if (!coCap.includes(capDangXem)) capDangXem = baiDangHoc()?.cap || 1;
  const cap = capDangXem;

  // Chọn cấp: mỗi chip kèm % đã học của cấp đó; cấp chưa có dữ liệu thì khóa lại
  const chipCap = [1, 2, 3].map((c) => {
    if (!coCap.includes(c)) return `<button class="chip" disabled title="Sắp có">HSK ${c} <span class="emoji">🔒</span></button>`;
    const { phanTram } = demTu(tatCaTu().filter((t) => t.cap === c), td.the);
    return `<button class="chip ${c === cap ? 'dang-chon' : ''}" data-cap="${c}">HSK ${c}<small> · ${phanTram}%</small></button>`;
  }).join('');

  // Tổng quan cấp đang xem
  const tuCap = tatCaTu().filter((t) => t.cap === cap);
  const tk = demTu(tuCap, td.the);

  // Hai cách chia bài (chung cho mọi cấp): theo chủ đề / theo thứ tự bài sách 《新HSK教程 N》
  const coHaiCach = coTheoSach() && coChuDe(cap);
  const tenSachCap = cap === 1 ? tenSach() : `《新HSK教程 ${cap}》`;
  const chonCachChia = coHaiCach ? `
      <div class="nhom-chon chon-che-do-bai" id="chon-che-do">
        <button data-che-do="chu-de" class="${cheDo === 'chu-de' ? 'dang-chon' : ''}">🗂️ Theo chủ đề</button>
        <button data-che-do="sach" class="${cheDo === 'sach' ? 'dang-chon' : ''}">📖 Theo sách</button>
      </div>
      <p class="chu-phu nho" style="margin:6px 0 0">${cheDo === 'sach' ? `Theo thứ tự bài của ${esc(tenSachCap)}, có ngữ pháp từng bài.` : 'Từ cùng nhóm nghĩa học cùng nhau.'}
        Đổi cách chia không ảnh hưởng tiến độ.</p>`
    : cap > 1 ? `<p class="chu-phu nho" style="margin:10px 0 0">Chia theo thứ tự bài của sách ${esc(tenSachCap)}.</p>` : '';

  // Lộ trình: bài đang học = bài đầu tiên của cấp còn từ chưa học
  const dsBai = danhSachBai(cheDo, cap);
  const baiHienTai = dsBai.find((b) => b.tu.length && b.tu.some((t) => !td.the[t.khoa]));
  const htmlLoTrinh = () => `<ol class="lo-trinh">${dsBai.map((b) => {
    const nhan = `Bài ${b.so}${b.sach ? ' · sách' : ''}`;
    if (!b.tu.length) {
      return `
      <li class="buoc-lo-trinh dang-soan">
        <div class="the-lo-trinh" aria-disabled="true">
          <span class="nut-tron emoji">📝</span>
          <span class="khung the-phai"><span class="giua"><span class="so-bai">${nhan}</span><b>${esc(b.ten)}</b>
            <span class="chu-phu nho">Đang soạn · ${b.soTu} từ</span></span></span>
        </div>
      </li>`;
    }
    const t = demTu(b.tu, td.the);
    const trangThai = t.phanTram === 100 ? 'xong' : b === baiHienTai ? 'dang' : t.daHoc ? 'do-dang' : 'chua';
    return `
      <li class="buoc-lo-trinh ${trangThai}">
        <a class="the-lo-trinh" href="#/bai/${b.ma}">
          <span class="nut-tron han">${esc([...b.tu[0].hanzi].slice(0, 2).join(''))}${trangThai === 'xong' ? '<i class="dau-xong">✓</i>' : ''}</span>
          <span class="khung the-phai">
            <span class="giua">
              <span class="so-bai">${nhan}${trangThai === 'dang' ? ' · Đang học' : ''}</span>
              <b>${esc(b.ten)}</b>
              <span class="thanh-tien-do"><span style="width:${t.phanTram}%"></span></span>
              <span class="chu-phu nho">${t.daHoc}/${b.tu.length} từ${t.thuoc ? ` · thuộc ${t.thuoc}` : ''}${b.tu.length < b.soTu ? ' · đang soạn' : ''}</span>
            </span>
            <span class="cuoi-dong">${bieuTuong('phai')}</span>
          </span>
        </a>
      </li>`;
  }).join('')}</ol>`;

  khung.innerHTML = `
    <div class="hang-chip chon-cap">${chipCap}</div>
    <section class="khung tong-quan-cap">
      <div class="dong-tren"><b>HSK ${cap} · ${tuCap.length} từ · ${dsBai.length} bài</b>
        ${tk.thuoc ? `<span class="nhan nhan-vang">⭐ Thuộc chắc ${tk.thuoc}</span>` : ''}</div>
      <span class="thanh-tien-do"><span style="width:${tk.phanTram}%"></span></span>
      <span class="chu-phu nho">Đã học ${tk.daHoc}/${tuCap.length} từ (${tk.phanTram}%)</span>
      ${chonCachChia}
    </section>
    <input class="o-tim" id="o-tim" type="search" placeholder="🔍 Tra từ: chữ Hán, pinyin, nghĩa, Hán Việt…" autocomplete="off">
    <div id="ket-qua">${htmlLoTrinh()}</div>`;

  // Đổi cấp
  khung.querySelectorAll('[data-cap]').forEach((nut) => {
    nut.onclick = () => { capDangXem = Number(nut.dataset.cap); veDanhSachBai(khung); };
  });
  // Đổi cách chia bài
  khung.querySelectorAll('#chon-che-do [data-che-do]').forEach((nut) => {
    nut.onclick = () => {
      cd.cheDoBai = nut.dataset.cheDo;
      luu();
      veDanhSachBai(khung);
    };
  });

  // Đưa bài đang học vào giữa màn hình (chỉ khi bài đó nằm khuất bên dưới)
  const $dang = khung.querySelector('.buoc-lo-trinh.dang');
  if ($dang && $dang.getBoundingClientRect().top > window.innerHeight * 0.8) {
    requestAnimationFrame(() => $dang.scrollIntoView({ block: 'center' }));
  }

  const $tim = khung.querySelector('#o-tim');
  const $kq = khung.querySelector('#ket-qua');
  $tim.oninput = () => {
    const goc = $tim.value.trim();
    const q = boDau(goc);
    if (!q) { $kq.innerHTML = htmlLoTrinh(); return; }
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
function buocBai({ so, ma, emoji, ten, moTa, href, xong, them = '' }) {
  const the = href ? 'a' : 'div';
  return `
    <${the} class="dong-ke-hoach khung phan-${ma} ${xong ? 'da-xong' : ''}" ${href ? `href="${href}"` : ''}>
      <span class="o-emoji emoji">${emoji}</span>
      <span class="giua">
        <span class="dong-tren"><b>${so}. ${ten}</b></span>
        <span class="mo-ta">${moTa}</span>
        ${them}
      </span>
      <span class="cuoi-dong">${xong ? '<span class="emoji">✅</span>' : href ? bieuTuong('phai') : ''}</span>
    </${the}>`;
}

/** @param ma số (bài theo chủ đề) hoặc 's5' (bài 5 của sách), '2-5', 'c2-5' */
export async function veBai(khung, ma) {
  const b = timBaiTheoMa(ma);
  if (!b) { khung.innerHTML = '<p class="loi">Không tìm thấy bài này.</p>'; return; }
  const td = layTienDo();
  const chuaHoc = tuChuaHoc(b.ma).length;
  const { conTuMoi } = demHomNay();
  const t = demTu(b.tu, td.the);

  // Bước 1: học từ mới
  let buoc1;
  if (!chuaHoc) {
    buoc1 = buocBai({ so: 1, ma: 'moi', emoji: '✨', ten: 'Học từ mới', xong: true,
      moTa: `Đã học hết ${b.tu.length} từ. Từ đến hạn sẽ hiện ở <b>Ôn luyện</b>.` });
  } else if (conTuMoi) {
    buoc1 = buocBai({ so: 1, ma: 'moi', emoji: '✨', ten: 'Học từ mới', href: `#/hoc-moi/${b.ma}`,
      moTa: `Còn <b>${chuaHoc}</b> từ chưa học · hôm nay học tối đa ${Math.min(chuaHoc, conTuMoi)} từ` });
  } else {
    buoc1 = buocBai({ so: 1, ma: 'moi', emoji: '✨', ten: 'Học từ mới',
      moTa: `Hôm nay đã đủ số từ mới. Muốn học thêm: tăng "Số từ mới mỗi ngày" trong <a href="#/cai-dat">Cài đặt</a>.` });
  }
  // Bước 2: ngữ pháp (điền sau khi tải dữ liệu ngữ pháp)
  const buoc2 = '<div id="buoc-ngu-phap"></div>';
  // Bước 3: kiểm tra bài
  const buoc3 = b.tu.length >= 4 ? buocBai({ so: 3, ma: 'on', emoji: '📝', ten: 'Kiểm tra bài', href: `#/trac-nghiem/bai/${b.ma}`,
    moTa: '10 câu trắc nghiệm về từ của bài (hỏi cả từ chưa học)' }) : '';

  khung.innerHTML = `
    <section class="khung dau-bai">
      <span class="so-bai">${nhanBai(b)}</span>
      <h2>${esc(b.ten)}</h2>
      <span class="thanh-tien-do"><span style="width:${t.phanTram}%"></span></span>
      <p class="chu-phu nho" style="margin:6px 0 0">${t.daHoc}/${b.tu.length} từ đã học${t.thuoc ? ` · thuộc chắc ${t.thuoc}` : ''}</p>
    </section>
    <div class="ke-hoach" style="margin-top:14px">${buoc1}${buoc2}${buoc3}</div>
    <h3 class="tieu-de-muc">Từ vựng của bài <small>${b.tu.length} từ</small></h3>
    ${CHU_THICH_CHAM}
    ${caiDat().tatMauThanh ? '' : CHU_THICH_MAU_THANH}
    <div class="khung ds-tu">${b.tu.map(dongTu).join('')}</div>`;

  // Bước 2: bài của sách (HSK 1, 2, 3 theo sách) → các điểm ngữ pháp gắn với bài;
  // bài theo chủ đề không gắn ngữ pháp → dẫn sang thư viện ngữ pháp.
  const diem = await taiNguPhap().catch(() => []);
  const vung = khung.querySelector('#buoc-ngu-phap');
  if (!vung || !vung.isConnected) return;
  const cua = b.sach ? diem.filter((d) => (b.cap > 1 ? d.cap === b.cap && d.bai === b.so
    : d.cap === 1 && baiSachCuaNguPhap(d.id) === b.so)) : [];
  const ng = td.nguPhap.the;
  if (cua.length) {
    const daLuyen = cua.filter((d) => ng[d.id]).length;
    vung.outerHTML = buocBai({ so: 2, ma: 'nguPhap', emoji: '🧩', ten: 'Ngữ pháp của bài', xong: daLuyen === cua.length,
      moTa: `${daLuyen}/${cua.length} điểm đã luyện · chạm từng điểm để học`,
      them: `<span class="ds-diem-bai">${cua.map((d) => `
        <a class="chip" href="#/ngu-phap/${d.id}"><i class="cham ${loaiThe(ng[d.id])}"></i>${esc(d.ten)}</a>`).join('')}</span>` });
  } else {
    vung.outerHTML = buocBai({ so: 2, ma: 'nguPhap', emoji: '🧩', ten: 'Ngữ pháp', href: '#/ngu-phap',
      moTa: b.sach ? 'Bài này không có điểm ngữ pháp mới. Ôn lại trong thư viện ngữ pháp.'
        : `Chia theo chủ đề nên ngữ pháp học riêng theo thứ tự (chọn "Theo sách" để học ngữ pháp từng bài).` });
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
        ? `HSK ${tu.cap} · Bài ${tu.bai} trong sách 《新HSK教程 ${tu.cap}》${chuDeCuaMotTu(tu) ? ` · chủ đề Bài ${chuDeCuaMotTu(tu).so}: ${esc(chuDeCuaMotTu(tu).ten)}` : ''}`
        : `HSK 1 · Bài ${tu.bai} (theo chủ đề)${baiSach ? ` · Bài ${baiSach} trong sách` : ''}`}</div>
      <div class="chu-phu nho">Danh sách chính thức: STT ${tu.soThuTu} · từ loại ${esc(tu.tuLoaiChinhThuc || '(cụm từ)')}</div>
    </div>`;
}
