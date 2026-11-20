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
  nhanBai, baiSachCuaTu, baiSachCuaNguPhap, cacCapCoDuLieu, coChuDe, chuDeCuaMotTu, TEN_TU_LOAI,
} from './du-lieu.js';
import { baiDangHoc } from './phien-hoc.js';
import { esc, boDau, htmlMatSau, dongTu, nutTuLoai, CHU_THICH_CHAM, CHU_THICH_MAU_THANH } from './giao-dien.js';
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

// ---------- Lộ trình (danh sách bài) ----------
export function veDanhSachBai(khung) {
  const td = layTienDo();
  const cd = caiDat();
  const cheDo = cheDoBai(cd);
  const coCap = cacCapCoDuLieu();
  if (!coCap.includes(capDangXem)) capDangXem = baiDangHoc()?.cap || capHienTai();
  const cap = capDangXem;
  const khoa = !capMo(cap);   // cấp đang xem còn khóa → chỉ xem trước tên bài, không vào học

  // Chọn cấp: mỗi chip kèm % đã học; cấp chưa mở khóa hiện 🔒 (vẫn bấm được để xem cách mở khóa)
  const chipCap = [1, 2, 3].map((c) => {
    if (!coCap.includes(c)) return `<button class="chip" disabled title="Sắp có">HSK ${c} <span class="emoji">🔒</span></button>`;
    const nhan = capMo(c)
      ? `<small> · ${demTu(tatCaTu().filter((t) => t.cap === c), td.the).phanTram}%</small>`
      : ' <span class="emoji">🔒</span>';
    return `<button class="chip ${c === cap ? 'dang-chon' : ''} ${capMo(c) ? '' : 'chip-khoa'}" data-cap="${c}">HSK ${c}${nhan}</button>`;
  }).join('');

  // Tổng quan cấp đang xem
  const tuCap = tatCaTu().filter((t) => t.cap === cap);
  const tk = demTu(tuCap, td.the);

  // Lộ trình đi theo thứ tự bài sách 《新HSK教程 N》; nhóm "theo chủ đề" chỉ còn là danh mục tra từ (cuối trang)
  const tenSachCap = cap === 1 ? tenSach().split('–')[0].trim() : `《新HSK教程 ${cap}》`;
  const chuDe = coChuDe(cap) ? danhSachBai('chu-de', cap).filter((x) => !x.sach && x.tu.length) : [];
  const htmlChuDe = chuDe.length && !khoa ? `
    <h3 class="tieu-de-muc">🗂️ Tra từ theo chủ đề <small>${chuDe.length} nhóm</small></h3>
    <div class="hang-chip">${chuDe.map((x) => `<a class="chip" href="#/bai/${x.ma}">${esc(x.ten)}</a>`).join('')}</div>` : '';

  // Lộ trình: bài đang học = bài đầu tiên của cấp còn từ chưa học
  const dsBai = danhSachBai(cheDo, cap);
  const baiHienTai = dsBai.find((b) => b.tu.length && b.tu.some((t) => !td.the[t.khoa]));
  const htmlLoTrinh = () => `<ol class="lo-trinh">${dsBai.map((b) => {
    const nhan = `Chặng ${b.so}`;
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
    if (khoa) {
      return `
      <li class="buoc-lo-trinh bi-khoa">
        <div class="the-lo-trinh" aria-disabled="true">
          <span class="nut-tron emoji">🔒</span>
          <span class="khung the-phai"><span class="giua"><span class="so-bai">${nhan}</span><b>${esc(b.ten)}</b>
            <span class="chu-phu nho">${b.tu.length} từ</span></span></span>
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
    ${khoa ? `<div style="margin-top:12px">${htmlCachMoKhoa(cap)}</div>` : ''}
    <section class="khung tong-quan-cap">
      <div class="dong-tren"><b>HSK ${cap} · ${tuCap.length} từ · ${dsBai.length} chặng</b>
        ${tk.thuoc ? `<span class="nhan nhan-vang">⭐ Thuộc chắc ${tk.thuoc}</span>` : ''}</div>
      <span class="thanh-tien-do"><span style="width:${tk.phanTram}%"></span></span>
      <span class="chu-phu nho">Đã học ${tk.daHoc}/${tuCap.length} từ (${tk.phanTram}%) · theo thứ tự bài của ${esc(tenSachCap)}</span>
    </section>
    <input class="o-tim" id="o-tim" type="search" placeholder="🔍 Tra từ: chữ Hán, pinyin, nghĩa, Hán Việt…" autocomplete="off">
    <div id="ket-qua">${htmlLoTrinh()}</div>
    <div id="chu-de">${htmlChuDe}</div>`;

  // Đổi cấp
  khung.querySelectorAll('[data-cap]').forEach((nut) => {
    nut.onclick = () => { capDangXem = Number(nut.dataset.cap); veDanhSachBai(khung); };
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
    khung.querySelector('#chu-de').hidden = !!q;
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

/** Bài theo chủ đề (không nằm trên lộ trình): chỉ là danh mục từ để tra cứu */
function veDanhMucChuDe(khung, b) {
  const td = layTienDo();
  const t = demTu(b.tu, td.the);
  khung.innerHTML = `
    <section class="khung dau-bai">
      <span class="so-bai">🗂️ Chủ đề${b.cap > 1 ? ` · HSK ${b.cap}` : ''}</span>
      <h2>${esc(b.ten)}</h2>
      <p class="chu-phu nho" style="margin:6px 0 0">${t.daHoc}/${b.tu.length} từ đã học · danh mục để tra cứu theo nhóm nghĩa.
        Học từ mới theo lộ trình ở <a href="#/bai">Bài học</a> (theo bài sách, có nghe – nói – viết – đọc).</p>
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
  const buocKiemTra = b.tu.length >= 4
    ? buocBai({ so: dsChang.length + 3, ma: 'on', emoji: '📝', ten: 'Kiểm tra chặng',
      href: xongTu ? `#/trac-nghiem/bai/${b.ma}` : '', moTa: xongTu ? '10 câu trắc nghiệm về từ của chặng' : `🔒 ${khoaSau}`, khoa: !xongTu })
    : '';

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
