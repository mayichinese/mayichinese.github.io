// =========================================================
// LUYỆN TẬP (#/luyen-tap) – nơi ôn lại và luyện kỹ năng (giống "Practice hub" của Duolingo)
//   1. Cần ôn hôm nay: mọi thứ đã đến hạn, mỗi dòng bấm là vào ôn ngay
//        🔁 Từ vựng  → #/on                 🧩 Ngữ pháp → #/ngu-phap/on
//        ✍️ Chữ viết → #/luyen-viet/phien    📒 Sổ câu sai → #/trac-nghiem/so-sai
//   2. Luyện kỹ năng (ô rộng 🎤 Nói & phát âm → #/luyen-noi, rồi 4 ô):
//        🎧 Nghe & thanh điệu → #/thanh-dieu    ✍️ Viết chữ Hán → #/luyen-viet
//        📝 Trắc nghiệm từ    → #/trac-nghiem   🧩 Ngữ pháp     → #/ngu-phap
//   3. Chủ đề & thi thử: 🗂️ Ôn theo chủ đề → #/chu-de · 📋 Thi thử → #/thi-thu (trước 2026-11-21 Thi thử có mục riêng)
// Chỉ ĐỌC tiến độ, đếm thẳng từ lịch ôn (không cần tải dữ liệu ngữ pháp / nét chữ).
// =========================================================

import { caiDat, nhatKyHomNay, layTienDo } from './luu-tru.js';
import { dangHoc } from './lich-on.js';
import { tatCaTu, danhSachBai, coChuDe, cacCapCoDuLieu } from './du-lieu.js';
import { capMo } from './cap-do.js';
import { esc } from './giao-dien.js';
import { demHomNay } from './phien-hoc.js';
import { bieuTuong } from './bieu-tuong.js';

const KY_NANG = [
  { ma: 'noi', emoji: '🎤', ten: 'Nói & phát âm', href: '#/luyen-noi', rong: true,
    moTa: 'Đọc to, máy chấm từng chữ · nghe và nhắc lại · nói theo nghĩa' },
  { ma: 'nghe', emoji: '🎧', ten: 'Nghe & thanh điệu', href: '#/thanh-dieu', phut: 'nghe',
    moTa: 'Nghe chọn thanh, biến điệu 不/一' },
  { ma: 'viet', emoji: '✍️', ten: 'Viết chữ Hán', href: '#/luyen-viet', phut: 'viet',
    moTa: '250 chữ viết tay cấp 1–3' },
  { ma: 'on', emoji: '📝', ten: 'Trắc nghiệm từ', href: '#/trac-nghiem', phut: 'nguPhap',
    moTa: 'Nghĩa, chữ, nghe, pinyin' },
  { ma: 'nguPhap', emoji: '🧩', ten: 'Ngữ pháp', href: '#/ngu-phap', phut: 'nguPhap',
    moTa: 'Công thức, sắp xếp câu, điền từ' },
];

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
      ${KY_NANG.map((k) => `
        <a class="o-ky-nang khung phan-${k.ma}${k.rong ? ' o-ky-nang-rong' : ''}" href="${k.href}">
          <span class="o-emoji emoji">${k.emoji}</span>
          <b>${k.ten}</b>
          <span class="chu-phu nho">${k.moTa}</span>
        </a>`).join('')}
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
  const cacCap = cacCapCoDuLieu().filter((c) => coChuDe(c) && capMo(c));
  khung.innerHTML = `
    <p class="chu-phu nho" style="margin:4px 2px 12px">Từ vựng xếp theo nhóm nghĩa. Chọn một chủ đề để xem từ và làm trắc nghiệm ôn
      (ưu tiên từ đã học). Học từ mới thì theo lộ trình ở <a href="#/bai">Bài học</a>.</p>
    ${cacCap.map((cap) => {
      const ds = danhSachBai('chu-de', cap).filter((b) => !b.sach && b.tu.length);
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
