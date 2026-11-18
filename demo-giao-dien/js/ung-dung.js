/* ============================================================
   ỨNG DỤNG — phần điều khiển chung:
   - Chuyển giữa các màn hình (theo địa chỉ #hom-nay, #the-tu...)
   - Đổi phương án màu A/B, chế độ sáng/tối
   - Hộp thoại, thông báo ngắn, bảng cài đặt
   ============================================================ */
const UngDung = (() => {
  const cacManHinh = {};      // danh sách màn hình đã đăng ký
  let manHienTai = null;      // màn hình đang hiển thị
  const $ = sel => document.querySelector(sel);

  const TEN_BANG_MAU = { a: 'A – Giấy ô ly', b: 'B – Đỏ đêm' };

  /* ==================== 1. Màn hình ==================== */

  /**
   * Mỗi màn hình đăng ký với:
   *  tieuDe : chữ hiện trên thanh trên cùng
   *  ve(khung, thamSo) : vẽ nội dung vào khung
   *  roi()  : (không bắt buộc) chạy khi rời màn hình
   */
  function dangKy(ten, manHinh) { cacManHinh[ten] = manHinh; }

  /** Đọc địa chỉ "#the-tu?bai=3" -> { ten: 'the-tu', thamSo: {bai: '3'} } */
  function docDiaChi() {
    const [ten, truyVan] = (location.hash.slice(1) || 'hom-nay').split('?');
    return { ten, thamSo: Object.fromEntries(new URLSearchParams(truyVan || '')) };
  }

  /** Vẽ màn hình theo địa chỉ hiện tại */
  function veLai() {
    const { ten, thamSo } = docDiaChi();
    const man = cacManHinh[ten] || cacManHinh['hom-nay'];
    if (manHienTai && manHienTai.roi) manHienTai.roi();
    manHienTai = man;

    document.body.classList.remove('dang-hoc');
    datTieuDe(man.tieuDe);
    document.querySelectorAll('.dieu-huong a[data-man]').forEach(a => {
      a.classList.toggle('dang-chon', a.dataset.man === ten);
      if (a.dataset.man === ten) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });

    const khung = $('#noi-dung');
    khung.innerHTML = '';
    window.scrollTo(0, 0);
    man.ve(khung, thamSo);
  }

  /** Đổi tiêu đề; nếu có hàm quayLai thì hiện nút mũi tên quay lại */
  function datTieuDe(chu, quayLai) {
    $('#tieu-de-man-hinh').textContent = chu;
    const nut = $('#nut-quay-lai');
    nut.classList.toggle('an', !quayLai);
    nut.onclick = quayLai || null;
  }

  function diDen(diaChi) { location.hash = diaChi; }

  /* ==================== 2. Màu sắc & sáng/tối ==================== */

  const truyVanToi = window.matchMedia('(prefers-color-scheme: dark)');

  function apDungGiaoDien() {
    const caiDat = LuuTru.layCaiDat();
    const toi = caiDat.cheDo === 'toi' ||
      (caiDat.cheDo === 'tu-dong' && truyVanToi.matches) ||
      (caiDat.cheDo === 'mac-dinh' && caiDat.bangMau === 'b');   // mặc định: A sáng, B tối
    const goc = document.documentElement;
    goc.dataset.bangMau = caiDat.bangMau;
    goc.dataset.giaoDien = toi ? 'toi' : 'sang';
    // Biểu tượng nút: đang sáng thì hiện mặt trăng (bấm để tối) và ngược lại
    $('#nut-sang-toi').innerHTML = BieuTuong.ve(toi ? 'mat-troi' : 'mat-trang');
    $('#nut-doi-mau').innerHTML = BieuTuong.ve('bang-mau') +
      `<span class="chu-mau">${caiDat.bangMau.toUpperCase()}</span>`;
  }

  function doiBangMau() {
    const moi = LuuTru.layCaiDat().bangMau === 'a' ? 'b' : 'a';
    // Đổi phương án thì dùng luôn giao diện đẹp nhất của phương án đó (A sáng, B tối)
    LuuTru.luuCaiDat({ bangMau: moi, cheDo: 'mac-dinh' });
    apDungGiaoDien();
    thongBao(`Phương án màu ${TEN_BANG_MAU[moi]}`);
  }

  function doiSangToi() {
    const dangToi = document.documentElement.dataset.giaoDien === 'toi';
    LuuTru.luuCaiDat({ cheDo: dangToi ? 'sang' : 'toi' });
    apDungGiaoDien();
  }

  /* ==================== 3. Hộp thoại & thông báo ==================== */

  function moHopThoai(html) {
    const lopPhu = $('#lop-phu');
    lopPhu.innerHTML = `<div class="hop-thoai" role="dialog" aria-modal="true">${html}</div>`;
    lopPhu.hidden = false;
    lopPhu.onclick = e => {
      if (e.target === lopPhu || e.target.closest('[data-dong]')) dongHopThoai();
    };
    const hop = lopPhu.firstElementChild;
    const nutDauTien = hop.querySelector('button');
    if (nutDauTien) nutDauTien.focus();
    return hop;
  }

  function dongHopThoai() {
    const lopPhu = $('#lop-phu');
    lopPhu.hidden = true;
    lopPhu.innerHTML = '';
  }

  let henGioThongBao;
  function thongBao(chu, thoiGian = 2200) {
    const o = $('#thong-bao');
    o.textContent = chu;
    o.classList.add('hien');
    clearTimeout(henGioThongBao);
    henGioThongBao = setTimeout(() => o.classList.remove('hien'), thoiGian);
  }

  /* ==================== 4. Bảng cài đặt ==================== */

  function moCaiDat() {
    const cd = LuuTru.layCaiDat();
    const chon = (gt, hienTai) => (String(gt) === String(hienTai) ? 'dang-chon' : '');
    const hop = moHopThoai(`
      <div class="dau-hop">
        <h2>Cài đặt</h2>
        <button class="nut-bieu-tuong" data-dong aria-label="Đóng">${BieuTuong.ve('dong')}</button>
      </div>

      <p class="tieu-de-muc">Phương án màu</p>
      <div class="nhom-chon" data-nhom="bangMau">
        <button data-gt="a" class="${chon('a', cd.bangMau)}"><span class="mau-mau mau-a"></span> A – Giấy ô ly</button>
        <button data-gt="b" class="${chon('b', cd.bangMau)}"><span class="mau-mau mau-b"></span> B – Đỏ đêm</button>
      </div>

      <p class="tieu-de-muc">Giao diện</p>
      <div class="nhom-chon" data-nhom="cheDo">
        <button data-gt="mac-dinh" class="${chon('mac-dinh', cd.cheDo)}">Mặc định</button>
        <button data-gt="tu-dong" class="${chon('tu-dong', cd.cheDo)}">Theo máy</button>
        <button data-gt="sang" class="${chon('sang', cd.cheDo)}">Sáng</button>
        <button data-gt="toi" class="${chon('toi', cd.cheDo)}">Tối</button>
      </div>

      <p class="tieu-de-muc">Tốc độ đọc</p>
      <div class="nhom-chon" data-nhom="tocDo">
        <button data-gt="0.6" class="${chon(0.6, GiongDoc.layTocDo())}">Rất chậm</button>
        <button data-gt="0.8" class="${chon(0.8, GiongDoc.layTocDo())}">Chậm</button>
        <button data-gt="1" class="${chon(1, GiongDoc.layTocDo())}">Bình thường</button>
      </div>
      <p class="chu-phu" id="trang-thai-giong">Đang kiểm tra giọng đọc…</p>
      <div class="nhom-chon">
        <button id="nut-nghe-thu">${BieuTuong.ve('loa')} Nghe thử</button>
        <button id="nut-huong-dan-giong">Cách cài giọng</button>
      </div>

      <p class="tieu-de-muc">Dữ liệu demo</p>
      <div class="nhom-chon">
        <button id="nut-so-lieu-mau">Tạo số liệu mẫu 7 ngày</button>
        <button id="nut-xoa-tien-do">Xóa tiến độ</button>
      </div>
      <p class="chu-phu">Tiến độ chỉ lưu trong trình duyệt này.</p>
    `);

    GiongDoc.trangThai().then(t => { const o = hop.querySelector('#trang-thai-giong'); if (o) o.textContent = t; });

    // Bấm vào một lựa chọn trong nhóm
    hop.querySelectorAll('[data-nhom] button').forEach(nut => nut.addEventListener('click', () => {
      const nhom = nut.parentElement.dataset.nhom;
      nut.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('dang-chon', b === nut));
      if (nhom === 'tocDo') {
        GiongDoc.datTocDo(Number(nut.dataset.gt));
        LuuTru.luuCaiDat({ tocDo: Number(nut.dataset.gt) });
      } else {
        LuuTru.luuCaiDat({ [nhom]: nut.dataset.gt });
        apDungGiaoDien();
      }
    }));

    // Nghe thử: đọc từ đầu tiên trong dữ liệu (không gõ sẵn chữ Hán trong code)
    hop.querySelector('#nut-nghe-thu').addEventListener('click', e => {
      const tu = DuLieu.tatCaTuDaSoan()[0];
      if (tu) GiongDoc.doc(tu.hanzi, e.currentTarget);
    });
    hop.querySelector('#nut-huong-dan-giong').addEventListener('click', GiongDoc.hienHuongDan);

    hop.querySelector('#nut-so-lieu-mau').addEventListener('click', () => {
      LuuTru.taoSoLieuMau();
      dongHopThoai();
      veLai();
      thongBao('Đã tạo số liệu mẫu cho 7 ngày gần đây');
    });
    hop.querySelector('#nut-xoa-tien-do').addEventListener('click', () => {
      if (!confirm('Xóa toàn bộ tiến độ học trong bản demo?')) return;
      LuuTru.xoaTienDo();
      dongHopThoai();
      veLai();
      thongBao('Đã xóa tiến độ');
    });
  }

  /* ==================== 5. Màn hình tạm (làm ở Bước 3) ==================== */

  function manHinhChuaLam(tieuDe, emoji, moTa) {
    return {
      tieuDe,
      ve(khung) {
        khung.innerHTML = `
          <div class="chua-lam">
            <div class="emoji emoji-to">${emoji}</div>
            <h2>${tieuDe}</h2>
            <p class="chu-phu">${moTa}</p>
            <p><span class="nhan nhan-chinh">Sẽ làm ở Bước 3</span></p>
            <a class="nut nut-chinh" href="#the-tu"><span class="emoji">🃏</span> Học thẻ từ</a>
          </div>`;
      }
    };
  }

  /* ==================== 6. Khởi động ==================== */

  async function khoiDong() {
    BieuTuong.gan();
    $('#nut-quay-lai').innerHTML = BieuTuong.ve('trai');
    $('#nut-cai-dat').innerHTML = BieuTuong.ve('cai-dat');
    apDungGiaoDien();
    GiongDoc.datTocDo(LuuTru.layCaiDat().tocDo || 0.8);

    $('#nut-doi-mau').addEventListener('click', doiBangMau);
    $('#nut-sang-toi').addEventListener('click', doiSangToi);
    $('#nut-cai-dat').addEventListener('click', moCaiDat);
    truyVanToi.addEventListener('change', apDungGiaoDien);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') dongHopThoai(); });

    // Các màn hình sẽ làm ở Bước 3
    dangKy('bai-hoc', manHinhChuaLam('Bài học', '📚',
      'Chọn cấp HSK 1/2/3, xem từng bài và phần trăm đã học. Tạm thời bạn có thể chọn bài trong mục Thẻ từ.'));
    dangKy('luyen-tap', manHinhChuaLam('Luyện tập', '🎯',
      'Luyện thanh điệu, luyện viết chữ (thứ tự nét) và trắc nghiệm.'));
    dangKy('thong-ke', manHinhChuaLam('Thống kê', '📊',
      'Số từ đã học/đã thuộc theo cấp và biểu đồ số phút học 7 ngày.'));

    const coDuLieu = await DuLieu.khoiDong();
    if (!coDuLieu) {
      $('#noi-dung').innerHTML = `
        <div class="chua-lam">
          <div class="emoji emoji-to">⚠️</div>
          <h2>Không đọc được dữ liệu</h2>
          <p class="chu-phu">Hãy mở demo bằng cách <b>bấm đúp file chay-demo.bat</b>
          trong thư mục demo-giao-dien (không mở trực tiếp file index.html).</p>
        </div>`;
      return;
    }

    window.addEventListener('hashchange', veLai);
    veLai();
  }

  return { khoiDong, dangKy, diDen, veLai, datTieuDe, moHopThoai, dongHopThoai, thongBao };
})();
