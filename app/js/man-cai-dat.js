// =========================================================
// CÀI ĐẶT & SAO LƯU  (#/cai-dat – mở bằng nút ⚙️ trên thanh trên cùng)
// =========================================================

import { caiDat, luu, layTienDo, xuatSaoLuu, nhapSaoLuu, xoaTienDo, phutMoiNgay, CAC_MUC_TIEU } from './luu-tru.js';
import { tatCaTu } from './du-lieu.js';
import { doc, giongTiengTrung, choGiong } from './phat-am.js';
import { esc, thongBao, apDungGiaoDien, dongTu, CHU_THICH_MAU_THANH } from './giao-dien.js';
import { bieuTuong } from './bieu-tuong.js';
import { amDung } from './am-thanh.js';

export async function veCaiDat(khung) {
  const cd = caiDat();
  const td = layTienDo();
  const soTheDaHoc = Object.keys(td.the).length;
  const canKiemTra = tatCaTu().filter((t) => (t.canKiemTra || []).length);
  const cheDo = cd.cheDo || 'tu-dong';
  const chon = (gt) => (gt === cheDo ? 'dang-chon' : '');

  khung.innerHTML = `
    <h3 class="tieu-de-muc">Giao diện</h3>
    <div class="khung khung-cai-dat">
      <div class="nhom-chon" id="chon-giao-dien">
        <button data-gt="tu-dong" class="${chon('tu-dong')}">${bieuTuong('man-hinh')} Theo máy</button>
        <button data-gt="sang" class="${chon('sang')}">${bieuTuong('mat-troi')} Sáng</button>
        <button data-gt="toi" class="${chon('toi')}">${bieuTuong('mat-trang')} Tối</button>
      </div>
      <div class="dong-cai-dat"><label for="cd-khai">Chữ Hán kiểu viết tay (Khải thư)</label>
        <input id="cd-khai" type="checkbox" ${cd.kieuChuKhai ? 'checked' : ''}></div>
      <div class="dong-cai-dat"><label for="cd-mau-thanh">Tô màu pinyin theo thanh điệu</label>
        <input id="cd-mau-thanh" type="checkbox" ${cd.tatMauThanh ? '' : 'checked'}></div>
      <p class="chu-phu nho" style="margin:6px 0 0">Màu cho biết thanh điệu của từng âm tiết, nhìn là biết đọc thanh mấy:</p>
      ${CHU_THICH_MAU_THANH}
    </div>

    <h3 class="tieu-de-muc">Học tập</h3>
    <div class="khung khung-cai-dat">
      <p style="margin:0 0 8px"><b>Mục tiêu mỗi ngày</b></p>
      <div class="nhom-chon" id="chon-muc-tieu-cd">
        ${CAC_MUC_TIEU.map((m) => `<button data-phut="${m.phut}" class="${m.phut === phutMoiNgay() ? 'dang-chon' : ''}">${m.phut} phút<br><small>${m.ten}</small></button>`).join('')}
      </div>
      <div class="dong-cai-dat"><label for="cd-moi">Số từ mới mỗi ngày</label>
        <input id="cd-moi" type="number" min="1" max="50" value="${cd.soTuMoiMoiNgay}"></div>
      <div class="dong-cai-dat"><label for="cd-on">Số thẻ ôn tối đa mỗi ngày</label>
        <input id="cd-on" type="number" min="10" max="999" value="${cd.gioiHanOnMoiNgay}"></div>
      <div class="dong-cai-dat"><label for="cd-viet">Số chữ mới luyện viết mỗi ngày</label>
        <input id="cd-viet" type="number" min="1" max="30" value="${cd.soChuVietMoiMoiNgay}"></div>
    </div>

    <h3 class="tieu-de-muc">Phát âm</h3>
    <div class="khung khung-cai-dat">
      <div class="dong-cai-dat"><label for="cd-tu-doc">Tự đọc khi hiện đáp án</label>
        <input id="cd-tu-doc" type="checkbox" ${cd.tuPhatAm ? 'checked' : ''}></div>
      <div class="dong-cai-dat"><label for="cd-am-hieu-ung">Âm thanh khi trả lời đúng / sai</label>
        <input id="cd-am-hieu-ung" type="checkbox" ${cd.amHieuUng !== false ? 'checked' : ''}></div>
      <div class="dong-cai-dat"><label for="cd-toc-do">Tốc độ đọc: <b id="gt-toc-do">${cd.tocDoDoc}</b></label>
        <input id="cd-toc-do" type="range" min="0.5" max="1.2" step="0.1" value="${cd.tocDoDoc}"></div>
      <div class="dong-cai-dat"><label for="cd-giong">Giọng đọc</label>
        <select id="cd-giong"><option>Đang tìm giọng đọc…</option></select></div>
      <div class="dong-cai-dat"><span>Nghe thử</span>
        <button class="nut nut-nho" data-doc="你好！我是你的汉语老师。">${bieuTuong('loa')} Nghe</button></div>
      <p class="chu-phu nho" id="ghi-chu-giong"></p>
    </div>

    <h3 class="tieu-de-muc">Sao lưu tiến độ</h3>
    <div class="khung">
      <p class="chu-phu" style="margin-top:0">Tiến độ được lưu trong trình duyệt của máy này (${soTheDaHoc} từ đã học).
        Hãy sao lưu thường xuyên. Muốn học tiếp trên máy khác: xuất file ở máy này → nhập file ở máy kia.</p>
      <p class="chu-phu">Lần sao lưu gần nhất: <b>${td.saoLuuLanCuoi ? new Date(td.saoLuuLanCuoi).toLocaleString('vi-VN') : 'chưa có'}</b></p>
      <div class="hang-nut">
        <button class="nut nut-chinh" id="nut-xuat"><span class="emoji">💾</span> Xuất file sao lưu</button>
        <label class="nut" for="file-nhap"><span class="emoji">📂</span> Nhập file sao lưu</label>
        <input id="file-nhap" type="file" accept=".json,application/json" hidden>
      </div>
    </div>

    <h3 class="tieu-de-muc">Dữ liệu và nguồn tham khảo</h3>
    <div class="khung">
      <ul class="chu-phu" style="margin-top:0;padding-left:18px">
        <li>Danh sách từ, pinyin, từ loại, chữ Hán, mục ngữ pháp: <b>Đề cương thi HSK 2025</b> (HSK考试大纲, 中外语言交流合作中心).</li>
        <li>Cấu trúc đề thi thử: 《新版HSK（1-6级）考试结构与样题示例》 (汉考国际, 12/2025) và sách bài tập 《新HSK教程》 1–3 (2026).
          Thang điểm: mỗi phần 100 điểm (cách chấm của 汉考国际); điểm đạt 60% là ước tính.</li>
        <li>Thứ tự bài “Theo sách”: 《新HSK教程》 1–3 (chỉ lấy thứ tự bài, không chép nội dung).</li>
        <li>Kiểm tra pinyin: từ điển CC-CEDICT · nét chữ: Make Me a Hanzi / Hanzi Writer.</li>
        <li>Âm Hán Việt, nghĩa tiếng Việt, câu ví dụ, giải thích ngữ pháp, bài tập: soạn riêng cho app – có thể còn sai sót.</li>
      </ul>
      <p class="chu-phu">Tra cứu thêm: <a href="https://hanzii.net/?hl=vi" target="_blank" rel="noopener">Hanzii ↗</a></p>
      <p class="chu-phu">${tatCaTu().length} từ HSK 1–3 · ${canKiemTra.length} từ có mục ⚠️ cần kiểm tra:</p>
      <div class="ds-tu" style="padding:0">${canKiemTra.map(dongTu).join('')}</div>
    </div>

    <h3 class="tieu-de-muc">Vùng nguy hiểm</h3>
    <div class="khung">
      <button class="nut" id="nut-xoa" style="color:#dc2626"><span class="emoji">🗑</span> Xóa toàn bộ tiến độ học</button>
    </div>

    <h3 class="tieu-de-muc">Thông tin kỹ thuật</h3>
    <div class="khung">
      <p class="chu-phu nho" id="thong-tin-ky-thuat" style="margin:0;line-height:1.7">Đang kiểm tra…</p>
    </div>

    <div class="chan-trang">
      <img src="icons/icon-192.png" alt="" width="56" height="56">
      <p class="chu-phu nho">Mayi Chinese · Giai đoạn 5</p>
    </div>`;

  const $ = (sel) => khung.querySelector(sel);

  // --- Giao diện ---
  khung.querySelectorAll('#chon-giao-dien button').forEach((nut) => {
    nut.onclick = () => {
      cd.cheDo = nut.dataset.gt;
      luu();
      apDungGiaoDien();
      khung.querySelectorAll('#chon-giao-dien button').forEach((b) => b.classList.toggle('dang-chon', b === nut));
    };
  });
  $('#cd-khai').onchange = (e) => { cd.kieuChuKhai = e.target.checked; document.body.classList.toggle('kieu-khai', cd.kieuChuKhai); luu(); };
  $('#cd-mau-thanh').onchange = (e) => { cd.tatMauThanh = !e.target.checked; luu(); apDungGiaoDien(); };

  khung.querySelectorAll('#chon-muc-tieu-cd [data-phut]').forEach((nut) => {
    nut.onclick = () => {
      cd.phutMoiNgay = Number(nut.dataset.phut);
      luu();
      khung.querySelectorAll('#chon-muc-tieu-cd button').forEach((b) => b.classList.toggle('dang-chon', b === nut));
      thongBao(`Mục tiêu: ${cd.phutMoiNgay} phút mỗi ngày`);
    };
  });

  // --- Lưu khi thay đổi ---
  const soNguyen = (el, min, max, macDinh) => {
    const n = Math.round(Number(el.value));
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : macDinh;
  };
  $('#cd-moi').onchange = (e) => { cd.soTuMoiMoiNgay = soNguyen(e.target, 1, 50, 15); e.target.value = cd.soTuMoiMoiNgay; luu(); thongBao('Đã lưu'); };
  $('#cd-on').onchange = (e) => { cd.gioiHanOnMoiNgay = soNguyen(e.target, 10, 999, 200); e.target.value = cd.gioiHanOnMoiNgay; luu(); thongBao('Đã lưu'); };
  $('#cd-viet').onchange = (e) => { cd.soChuVietMoiMoiNgay = soNguyen(e.target, 1, 30, 5); e.target.value = cd.soChuVietMoiMoiNgay; luu(); thongBao('Đã lưu'); };
  $('#cd-tu-doc').onchange = (e) => { cd.tuPhatAm = e.target.checked; luu(); };
  $('#cd-am-hieu-ung').onchange = (e) => { cd.amHieuUng = e.target.checked; luu(); if (cd.amHieuUng) amDung(); };
  $('#cd-toc-do').oninput = (e) => { cd.tocDoDoc = Number(e.target.value); $('#gt-toc-do').textContent = cd.tocDoDoc; luu(); };

  // --- Sao lưu ---
  const veLai = () => { if (location.hash === '#/cai-dat') veCaiDat(khung); };
  $('#nut-xuat').onclick = () => { xuatSaoLuu(); thongBao('Đã tạo file sao lưu – xem trong thư mục Tải về (Downloads)'); setTimeout(veLai, 300); };
  $('#file-nhap').onchange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!confirm('Nhập file sao lưu sẽ THAY THẾ toàn bộ tiến độ hiện tại trên máy này. Tiếp tục?')) { e.target.value = ''; return; }
    try {
      const n = await nhapSaoLuu(f);
      document.body.classList.toggle('kieu-khai', !!caiDat().kieuChuKhai);
      apDungGiaoDien();
      thongBao(`Đã nhập xong: ${n} từ đã học`);
      veLai();
    } catch (err) {
      alert(err.message);
    }
    e.target.value = '';
  };
  $('#nut-xoa').onclick = () => {
    if (!confirm('Xóa TOÀN BỘ tiến độ học trên máy này? (Cài đặt được giữ lại)')) return;
    if (!confirm('Chắc chắn chưa? Không thể hoàn tác nếu bạn chưa có file sao lưu.')) return;
    xoaTienDo();
    thongBao('Đã xóa tiến độ');
    veLai();
  };

  // --- Thông tin kỹ thuật: phiên bản đang chạy, thời gian mở app lần này (để báo lỗi chậm) ---
  (async () => {
    let tg = null;
    try { tg = JSON.parse(localStorage.getItem('mayi-thoi-gian-mo') || 'null'); } catch { /* bỏ qua */ }
    let banApp = 'không rõ';
    try { banApp = (await caches.keys()).find((k) => /^mayi-v\d+$/.test(k)) || 'chưa cài bản offline'; } catch { /* bỏ qua */ }
    const $tt = $('#thong-tin-ky-thuat');
    if (!$tt?.isConnected) return;
    $tt.innerHTML = `Phiên bản: <b>${esc(banApp)}</b><br>
      Chế độ offline: <b>${navigator.serviceWorker?.controller ? 'đang bật' : 'chưa bật'}</b><br>
      Lần mở app gần nhất: ${tg ? `<b>${(tg.ms / 1000).toFixed(1).replace('.', ',')} giây</b> (lúc ${new Date(tg.luc).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})` : 'chưa đo'}`;
  })();

  // --- Danh sách giọng đọc (tải chậm trên một số trình duyệt) ---
  await choGiong();
  const $giong = $('#cd-giong');
  if (!$giong || !$giong.isConnected) return; // người dùng đã chuyển màn hình
  const ds = giongTiengTrung();
  const $ghiChu = $('#ghi-chu-giong');
  if (!ds.length) {
    $giong.innerHTML = '<option>Không có giọng tiếng Trung</option>';
    $giong.disabled = true;
    $ghiChu.innerHTML = 'Máy chưa có giọng đọc tiếng Trung. <b>Windows</b>: Cài đặt → Thời gian & ngôn ngữ → Ngôn ngữ & vùng → Thêm ngôn ngữ → '
      + '“中文(中华人民共和国)” (tích chọn Giọng nói / Text-to-speech), rồi khởi động lại trình duyệt. '
      + '<b>Android</b>: Cài đặt → Hệ thống → Ngôn ngữ → Đầu ra chuyển văn bản thành lời nói → Google → cài dữ liệu giọng nói tiếng Trung. '
      + '<b>iPhone</b>: thường đã có sẵn.';
    return;
  }
  $giong.innerHTML = `<option value="">Tự chọn (${esc(ds[0].name)})</option>` +
    ds.map((g) => `<option value="${esc(g.name)}" ${g.name === cd.giongDoc ? 'selected' : ''}>${esc(g.name)} (${esc(g.lang)})</option>`).join('');
  $giong.onchange = () => { cd.giongDoc = $giong.value; luu(); doc('你好'); };
  $ghiChu.textContent = `Tìm thấy ${ds.length} giọng tiếng Trung. Giọng có chữ “Online/Natural” nghe tự nhiên hơn nhưng cần mạng.`;
}
