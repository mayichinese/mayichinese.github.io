// =========================================================
// CÁC MÀN HÌNH CHƯA CÓ CHỨC NĂNG THẬT – hiện "Sắp có"
//   #/luyen-tap   Luyện thanh điệu, luyện viết chữ Hán, trắc nghiệm
//   #/thong-ke    Thống kê
// =========================================================

const PHAN_LUYEN_TAP = [
  { ma: 'nghe', emoji: '🎧', ten: 'Luyện thanh điệu', moTa: 'Nghe một âm, chọn đúng thanh 1–4 hoặc thanh nhẹ.' },
  { ma: 'viet', emoji: '✍️', ten: 'Luyện viết chữ Hán', moTa: 'Xem thứ tự nét và tập viết theo trong ô chữ điền.' },
  { ma: 'nguPhap', emoji: '🧩', ten: 'Trắc nghiệm', moTa: 'Câu hỏi nhanh ôn nghĩa, pinyin và ngữ pháp của từng bài.' },
];

export function veLuyenTap(khung) {
  khung.innerHTML = `
    <div class="ke-hoach" style="margin-top:6px">
      ${PHAN_LUYEN_TAP.map((p) => `
        <div class="dong-ke-hoach khung phan-${p.ma} sap-co">
          <span class="o-emoji emoji">${p.emoji}</span>
          <span class="giua">
            <span class="dong-tren"><b>${p.ten}</b><span class="so-phut">Sắp có</span></span>
            <span class="mo-ta">${p.moTa}</span>
          </span>
        </div>`).join('')}
    </div>
    <div class="chua-lam">
      <p class="chu-phu">Các phần luyện tập đang được làm. Trong lúc chờ, hãy ôn thẻ từ mỗi ngày nhé!</p>
      <a class="nut nut-chinh" href="#/bai"><span class="emoji">🃏</span> Học thẻ từ</a>
    </div>`;
}

export function veThongKe(khung) {
  khung.innerHTML = `
    <div class="chua-lam">
      <div class="emoji emoji-to">📊</div>
      <h2>Thống kê</h2>
      <p class="chu-phu">Số từ đã học, đã thuộc theo từng cấp và biểu đồ số phút học mỗi ngày.</p>
      <p><span class="nhan nhan-chinh">Sắp có</span></p>
      <a class="nut nut-chinh" href="#/"><span class="emoji">🏠</span> Về trang Hôm nay</a>
    </div>`;
}
