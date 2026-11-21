// =========================================================
// LUYỆN TẬP (#/luyen-tap) – nơi ôn lại và luyện kỹ năng (giống "Practice hub" của Duolingo)
//   1. Cần ôn hôm nay: mọi thứ đã đến hạn, mỗi dòng bấm là vào ôn ngay
//        🔁 Từ vựng  → #/on                 🧩 Ngữ pháp → #/ngu-phap/on
//        ✍️ Chữ viết → #/luyen-viet/phien    📒 Sổ câu sai → #/trac-nghiem/so-sai
//   2. Luyện kỹ năng – 4 kỹ năng (2026-11-21), mỗi ô mở trang con #/ky-nang/<nghe|noi|doc|viet> liệt kê các bài:
//        🎧 Nghe: thanh điệu · nghe → chọn chữ · nghe phiên âm
//        🗣️ Nói: đọc từ · đọc câu · nghe & nhắc lại · nói theo nghĩa
//        📖 Đọc: đọc hiểu các chặng đã mở · chữ → nghĩa · nghĩa → chữ · pinyin · trắc nghiệm tổng hợp
//        ✍️ Viết: viết chữ Hán · ôn chữ đến hạn · bộ thủ · nét cơ bản
//      + ô rộng 🧩 Ngữ pháp → #/ngu-phap (dùng cho cả 4 kỹ năng)
//   3. Chủ đề & thi thử: 🗂️ Ôn theo chủ đề → #/chu-de · 📋 Thi thử → #/thi-thu (trước 2026-11-21 Thi thử có mục riêng)
// Chỉ ĐỌC tiến độ, đếm thẳng từ lịch ôn (không cần tải dữ liệu ngữ pháp / nét chữ).
// =========================================================

import { caiDat, nhatKyHomNay, layTienDo } from './luu-tru.js';
import { dangHoc } from './lich-on.js';
import { tatCaTu, danhSachBai, coChuDe, cacCapCoDuLieu, nhanBai } from './du-lieu.js';
import { capMo } from './cap-do.js';
import { esc } from './giao-dien.js';
import { demHomNay } from './phien-hoc.js';
import { bieuTuong } from './bieu-tuong.js';
import { CAC_DANG as DANG_TN } from './man-trac-nghiem.js';
import { CAC_DANG_NOI } from './man-luyen-noi.js';
import { tinhTrangPhatAm } from './phat-am.js';
import { trangThaiCacChang } from './man-chang.js';
import { taiDocHieu, ketQuaDoc } from './man-doc-hieu.js';

/** 4 kỹ năng: ô ở trang Luyện tập → trang con #/ky-nang/<ma> */
export const KY_NANG = {
  nghe: { emoji: '🎧', ten: 'Nghe', lop: 'nghe', moTa: 'Thanh điệu · nghe chọn chữ · phiên âm' },
  noi: { emoji: '🗣️', ten: 'Nói', lop: 'noi', moTa: 'Đọc to, máy chấm · nhắc lại · nói theo nghĩa' },
  doc: { emoji: '📖', ten: 'Đọc', lop: 'on', moTa: 'Đọc hiểu · chữ → nghĩa · pinyin' },
  viet: { emoji: '✍️', ten: 'Viết', lop: 'viet', moTa: 'Viết chữ Hán · bộ thủ · nét' },
};
const SO_TU_TRAC_NGHIEM = 4;   // trắc nghiệm cần ít nhất 4 từ đã học (như man-trac-nghiem.js)

export function veLuyenTap(khung) {
  const td = layTienDo();
  const nk = nhatKyHomNay();
  const bayGio = Date.now();
  const denHan = (dsThe) => Object.values(dsThe).filter((t) => dangHoc(t) || t.han <= bayGio).length;

  const dem = demHomNay();
  const canOn = [
    { ma: 'on', emoji: '🔁', ten: 'Từ vựng', donVi: 'thẻ', so: dem.onDenHan + dem.dangHocDenHan, href: '#/on' },
    { ma: 'nguPhap', emoji: '🧩', ten: 'Ngữ pháp', donVi: 'điểm', so: denHan(td.nguPhap.the), href: '#/ngu-phap/on' },
    { ma: 'viet', emoji: '✍️', ten: 'Chữ viết', donVi: 'chữ', so: denHan(td.theViet), href: '#/luyen-viet/phien' },
    { ma: 'moi', emoji: '📒', ten: 'Sổ câu sai', donVi: 'từ', so: Object.keys(td.tracNghiem.soSai).length, href: '#/trac-nghiem/so-sai' },
  ];
  const tongCanOn = canOn.reduce((s, x) => s + x.so, 0);
  const chuaHocGi = !tatCaTu().some((t) => td.the[t.khoa]);

  const dongCanOn = (x) => (x.so ? `
    <a class="dong-ke-hoach khung phan-${x.ma}" href="${x.href}">
      <span class="o-emoji emoji">${x.emoji}</span>
      <span class="giua"><span class="dong-tren"><b>${x.ten}</b><span class="so-phut">${x.so} ${x.donVi}</span></span></span>
      <span class="cuoi-dong">${bieuTuong('phai')}</span>
    </a>` : `
    <div class="dong-ke-hoach khung phan-${x.ma} da-xong khong-noi">
      <span class="o-emoji emoji">${x.emoji}</span>
      <span class="giua"><span class="dong-tren"><b>${x.ten}</b><span class="chu-phu nho">không có</span></span></span>
      <span class="cuoi-dong"><span class="emoji">✅</span></span>
    </div>`);

  khung.innerHTML = `
    <h3 class="tieu-de-muc" style="margin-top:6px">Cần ôn hôm nay <small>${tongCanOn ? `${tongCanOn} mục` : 'đã xong'}</small></h3>
    ${tongCanOn ? '' : `<p class="chu-phu nho" style="margin:-4px 2px 12px">${chuaHocGi
      ? 'Chưa có gì để ôn. Hãy bắt đầu ở <a href="#/bai">Bài học</a>: từ đã học sẽ đến hạn ôn ở đây.'
      : '🎉 Đã ôn hết phần đến hạn. Có thể luyện thêm kỹ năng bên dưới.'}</p>`}
    <div class="ke-hoach">${canOn.map(dongCanOn).join('')}</div>

    <h3 class="tieu-de-muc">Luyện kỹ năng</h3>
    <div class="luoi-ky-nang">
      ${Object.entries(KY_NANG).map(([ma, k]) => `
        <a class="o-ky-nang khung phan-${k.lop}" href="#/ky-nang/${ma}">
          <span class="o-emoji emoji">${k.emoji}</span>
          <b>${k.ten}</b>
          <span class="chu-phu nho">${k.moTa}</span>
        </a>`).join('')}
      <a class="o-ky-nang khung phan-nguPhap o-ky-nang-rong" href="#/ngu-phap">
        <span class="o-emoji emoji">🧩</span>
        <b>Ngữ pháp</b>
        <span class="chu-phu nho">Dùng cho cả 4 kỹ năng: công thức, sắp xếp câu, điền từ</span>
      </a>
    </div>
    <h3 class="tieu-de-muc">Chủ đề & thi thử</h3>
    <div class="luoi-ky-nang">
      <a class="o-ky-nang khung phan-on" href="#/chu-de">
        <span class="o-emoji emoji">🗂️</span><b>Ôn theo chủ đề</b>
        <span class="chu-phu nho">Từ vựng theo nhóm nghĩa: gia đình, ăn uống, thời gian…</span>
      </a>
      <a class="o-ky-nang khung phan-nguPhap" href="#/thi-thu">
        <span class="o-emoji emoji">📋</span><b>Thi thử</b>
        <span class="chu-phu nho">Đề mô phỏng HSK 1 · 2 · 3, chấm điểm từng phần</span>
      </a>
    </div>
    <p class="chu-phu nho" style="margin-top:14px">Hôm nay: nghe & nói ${Math.floor((nk.giay.nghe || 0) / 60)}′ ·
      viết ${Math.floor((nk.giay.viet || 0) / 60)}′ · ngữ pháp & trắc nghiệm ${Math.floor((nk.giay.nguPhap || 0) / 60)}′</p>`;
}

// ---------- Ôn theo chủ đề (#/chu-de) ----------
/** Danh sách chủ đề của các cấp đã mở, mỗi chủ đề kèm số từ đã học */
export function veDanhSachChuDe(khung) {
  const td = layTienDo();
  const cacCap = cacCapCoDuLieu().filter((c) => coChuDe(c)).sort((a, b) => a - b);
  khung.innerHTML = `
    <p class="chu-phu nho" style="margin:4px 2px 12px">Từ vựng xếp theo nhóm nghĩa. Chọn một chủ đề để xem từ và làm trắc nghiệm ôn
      (ưu tiên từ đã học). Học từ mới thì theo lộ trình ở <a href="#/bai">Bài học</a>.</p>
    ${cacCap.map((cap) => {
      const ds = danhSachBai('chu-de', cap).filter((b) => !b.sach && b.tu.length);
      if (!capMo(cap)) {
        // Cấp đang khóa: xem trước tên chủ đề, chưa vào ôn được
        return `<h3 class="tieu-de-muc">HSK ${cap} 🔒 <small>${ds.length} chủ đề</small></h3>
          <p class="chu-phu nho" style="margin:-4px 2px 8px">Mở khi mở khóa HSK ${cap} (học hết HSK ${cap - 1} hoặc học vượt bằng thi thử).</p>
          <div class="hang-chip">${ds.map((b) => `<span class="chip chip-khoa">${esc(b.ten)}</span>`).join('')}</div>`;
      }
      return `<h3 class="tieu-de-muc">HSK ${cap} <small>${ds.length} chủ đề</small></h3>
        <div class="ds-chu-de">${ds.map((b) => {
          const daHoc = b.tu.filter((t) => td.the[t.khoa]).length;
          const pt = Math.round((daHoc / b.tu.length) * 100);
          return `<a class="dong-chu-de khung" href="#/chu-de/${b.ma}">
            <b>${esc(b.ten)}</b>
            <span class="thanh-tien-do"><span style="width:${pt}%"></span></span>
            <span class="chu-phu nho">${daHoc}/${b.tu.length} từ đã học</span></a>`;
        }).join('')}</div>`;
    }).join('') || '<p class="chu-phu">Chưa có chủ đề nào.</p>'}`;
}

// ---------- Trang một kỹ năng (#/ky-nang/<nghe|noi|doc|viet>) ----------
/** Một dòng bài luyện; có `khoa` (lý do) thì hiện mờ, không bấm được */
function dongBai(x, lop) {
  const the = x.khoa ? 'div' : 'a';
  return `
    <${the} class="dong-ke-hoach khung phan-${lop}${x.khoa ? ' sap-co' : ''}"${x.khoa ? '' : ` href="${x.href}"`}>
      <span class="o-emoji emoji">${x.emoji}</span>
      <span class="giua">
        <span class="dong-tren"><b>${x.ten}</b>${x.phai ? `<span class="so-phut">${x.phai}</span>` : ''}</span>
        <span class="mo-ta">${x.khoa ? `🔒 ${x.khoa}` : x.moTa}</span>
      </span>
      <span class="cuoi-dong">${x.khoa ? '' : bieuTuong('phai')}</span>
    </${the}>`;
}

/** @param {string} ma  nghe | noi | doc | viet */
export function veKyNang(khung, ma) {
  const k = KY_NANG[ma];
  const td = layTienDo();
  const coGiong = !['khong-ho-tro', 'khong-co-giong'].includes(tinhTrangPhatAm());
  const khongGiong = coGiong ? '' : 'Máy chưa có giọng đọc tiếng Trung (xem Cài đặt)';
  const soTuDaHoc = tatCaTu().filter((t) => td.the[t.khoa]).length;
  const thieuTu = soTuDaHoc >= SO_TU_TRAC_NGHIEM ? '' : `Cần học ít nhất ${SO_TU_TRAC_NGHIEM} từ (đã học ${soTuDaHoc})`;
  const tn = (d) => ({ ...DANG_TN[d], href: `#/trac-nghiem/${d}`, khoa: thieuTu });
  const bayGio = Date.now();
  const vietDenHan = Object.values(td.theViet).filter((t) => dangHoc(t) || t.han <= bayGio).length;

  const DS = {
    nghe: [
      { emoji: '🎵', ten: 'Thanh điệu', href: '#/thanh-dieu', khoa: khongGiong,
        moTa: 'Nghe chọn thanh · thanh 2 hay 3 · từ 2 âm tiết · biến điệu 不/一' },
      { ...tn('nghe'), khoa: thieuTu || khongGiong },
      { emoji: '🎧', ten: 'Nghe phiên âm', href: '#/chu-am/luyen/phien-am', khoa: khongGiong,
        moTa: 'Phân biệt thanh mẫu, vận mẫu dễ nhầm: zh/z, an/ang…' },
    ],
    noi: [
      ...Object.entries(CAC_DANG_NOI).map(([d, x]) => ({ ...x, href: `#/luyen-noi/${d}`, phai: `${x.so} câu`,
        khoa: d === 'nhac-lai' ? khongGiong : '' })),
      { emoji: '📊', ten: 'Tiến độ nói', href: '#/luyen-noi', moTa: 'Điểm trung bình, âm hay đọc sai' },
    ],
    doc: [
      tn('nghia'), tn('chu'), tn('pinyin'),
      { emoji: '📝', ten: 'Trắc nghiệm tổng hợp', href: '#/trac-nghiem', moTa: 'Trộn 4 dạng · sổ câu sai · kiểm tra theo chặng' },
    ],
    viet: [
      { emoji: '✍️', ten: 'Viết chữ Hán', href: '#/luyen-viet', moTa: 'Học viết chữ mới theo thứ tự nét, 250 chữ cấp 1–3' },
      { emoji: '🔁', ten: 'Ôn chữ đến hạn', href: '#/luyen-viet/phien', phai: vietDenHan ? `${vietDenHan} chữ` : '',
        khoa: vietDenHan ? '' : 'Chưa có chữ nào đến hạn ôn', moTa: 'Viết lại các chữ đã học theo lịch ôn' },
      { emoji: '🧱', ten: 'Luyện bộ thủ', href: '#/chu-am/luyen/bo-thu', moTa: 'Bộ → nghĩa, nghĩa → bộ, chữ → bộ' },
      { emoji: '〰️', ten: 'Nét & thứ tự nét', href: '#/chu-am/net', moTa: '25 nét cơ bản, 10 quy tắc viết' },
    ],
  }[ma];

  khung.innerHTML = `
    <p class="chu-phu nho" style="margin:4px 2px 12px">${k.emoji} <b>${k.ten}</b>: chọn một bài để luyện. Bài luyện dùng từ bạn đã học.</p>
    <div class="ke-hoach">${DS.map((x) => dongBai(x, k.lop)).join('')}</div>
    ${ma === 'doc' ? '<h3 class="tieu-de-muc">Đọc hiểu <small>bài đọc của các chặng</small></h3><div class="ke-hoach" id="ds-doc-hieu"><div class="dang-tai">Đang tải…</div></div>' : ''}
    <div class="hang-chip" style="margin-top:16px">${Object.entries(KY_NANG).filter(([m]) => m !== ma)
      .map(([m, x]) => `<a class="chip" href="#/ky-nang/${m}">${x.emoji} ${x.ten}</a>`).join('')}
      <a class="chip" href="#/ngu-phap">🧩 Ngữ pháp</a></div>`;

  if (ma !== 'doc') return;
  // Đọc hiểu: bài của các chặng đã xong phần từ vựng (cấp đã mở)
  taiDocHieu().then((tatCa) => {
    const $ds = khung.querySelector('#ds-doc-hieu');
    if (!$ds?.isConnected) return;
    const moDuoc = cacCapCoDuLieu().filter(capMo)
      .flatMap((cap) => danhSachBai('sach', cap).filter((b) => b.sach && tatCa[b.ma]))
      .filter((b) => trangThaiCacChang(b).every((c) => c.xong));
    $ds.innerHTML = moDuoc.length
      ? moDuoc.map((b) => {
        const bd = tatCa[b.ma];
        const kq = ketQuaDoc(b.ma);
        return dongBai({ emoji: (kq?.tot || 0) >= 80 ? '✅' : '📖', ten: esc(bd.ten), href: `#/doc-hieu/${b.ma}`,
          moTa: `HSK ${b.cap} · ${nhanBai(b)}: ${esc(b.ten)}<br>${kq ? `Lần gần nhất đúng ${kq.diem}% · cao nhất ${kq.tot}%`
            : `${bd.kieu === 'hoi-thoai' ? 'Hội thoại' : 'Đoạn văn'} ${bd.cau.length} câu · ${bd.hoi.length} câu hỏi`}` }, 'on');
      }).join('')
      : `<p class="chu-phu nho" style="margin:0 2px">Chưa có bài đọc nào. Học xong các phần từ vựng của một chặng ở
          <a href="#/bai">Bài học</a> để mở bài đọc hiểu của chặng đó.</p>`;
  });
}
