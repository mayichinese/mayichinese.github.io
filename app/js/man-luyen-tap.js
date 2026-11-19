// =========================================================
// LUYỆN TẬP (#/luyen-tap) – trang chọn bài luyện
//   🎧 Thanh điệu  → #/thanh-dieu   (Giai đoạn 2)
//   ✍️ Viết chữ    → #/luyen-viet   (Giai đoạn 2)
//   📝 Trắc nghiệm → #/trac-nghiem  (Giai đoạn 3)
//   🧩 Ngữ pháp    → #/ngu-phap     (Giai đoạn 4)
// =========================================================

import { caiDat, nhatKyHomNay } from './luu-tru.js';
import { bieuTuong } from './bieu-tuong.js';

const CAC_PHAN = [
  { ma: 'nghe', emoji: '🎧', ten: 'Luyện thanh điệu', href: '#/thanh-dieu', phut: 'nghe',
    moTa: 'Nghe rồi chọn thanh; cặp thanh 2–3, biến điệu 不/一, hai thanh 3 liền nhau.' },
  { ma: 'viet', emoji: '✍️', ten: 'Luyện viết chữ Hán', href: '#/luyen-viet', phut: 'viet',
    moTa: '100 chữ cần viết tay HSK 1–2: xem thứ tự nét, viết theo, viết không nhìn.' },
  { ma: 'nguPhap', emoji: '📝', ten: 'Trắc nghiệm', href: '#/trac-nghiem', phut: 'nguPhap',
    moTa: 'Chữ → nghĩa, nghĩa → chữ, nghe → chữ, chọn pinyin đúng. Câu sai vào sổ để ôn lại.' },
  { ma: 'nguPhap', emoji: '🧩', ten: 'Ngữ pháp', href: '#/ngu-phap', phut: 'nguPhap',
    moTa: 'Điểm ngữ pháp HSK 1: công thức, lỗi hay mắc, sắp xếp câu, điền từ.' },
];

export function veLuyenTap(khung) {
  const nk = nhatKyHomNay();
  const mt = caiDat().phutMucTieu;
  khung.innerHTML = `
    <div class="ke-hoach" style="margin-top:6px">
      ${CAC_PHAN.map((p) => {
        const phut = p.phut ? Math.floor((nk.giay[p.phut] || 0) / 60) : 0;
        const the = p.sapCo ? 'div' : 'a';
        return `
        <${the} class="dong-ke-hoach khung phan-${p.ma} ${p.sapCo ? 'sap-co' : ''}" ${p.href && !p.sapCo ? `href="${p.href}"` : ''}>
          <span class="o-emoji emoji">${p.emoji}</span>
          <span class="giua">
            <span class="dong-tren"><b>${p.ten}</b>
              <span class="so-phut">${p.sapCo ? 'Sắp có' : `${phut}/${mt[p.phut]}′`}</span></span>
            <span class="mo-ta">${p.moTa}</span>
          </span>
          <span class="cuoi-dong">${p.sapCo ? '' : bieuTuong('phai')}</span>
        </${the}>`;
      }).join('')}
    </div>`;
}
