/* ============================================================
   TRANG CHỦ "HÔM NAY"
   - Banner chào + số phút còn lại + nút Bắt đầu
     (chữ Hán mờ phía sau = từ mới tiếp theo, lấy từ file dữ liệu)
   - 3 ô chỉ số: chuỗi ngày, phút hôm nay, số từ đã học
   - Tuần này: 7 ngày có học / không học
   - Kế hoạch 60 phút chia 5 phần, mỗi phần một màu
   ============================================================ */
(() => {
  const thoat = Pinyin.thoat;
  const THU = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const THU_NGAN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  function loiChao() {
    const gio = new Date().getHours();
    if (gio < 11) return 'Chào buổi sáng!';
    if (gio < 13) return 'Chào buổi trưa!';
    if (gio < 18) return 'Chào buổi chiều!';
    return 'Chào buổi tối!';
  }

  /** Thống kê nhanh về các từ */
  function demTu() {
    const the = LuuTru.layTatCaThe();
    const tatCa = DuLieu.tatCaTuDaSoan();
    return {
      tong: tatCa.length,
      denHan: tatCa.filter(t => LuuTru.denHan(the[t.id])).length,
      conMoi: tatCa.filter(t => !the[t.id]).length,
      daHoc: tatCa.filter(t => the[t.id]).length,
      daThuoc: tatCa.filter(t => LuuTru.daThuoc(the[t.id])).length,
      tuTiepTheo: tatCa.find(t => !the[t.id]) || tatCa[0] || null   // từ mới kế tiếp
    };
  }

  /** Lịch 7 ngày gần nhất */
  function veTuanNay() {
    let html = '';
    let soNgayHoc = 0;
    for (let i = -6; i <= 0; i++) {
      const chuoi = LuuTru.congNgay(i);
      const ngay = new Date(chuoi + 'T00:00:00');
      const coHoc = LuuTru.soLieuNgay(chuoi).coHoc;
      if (coHoc) soNgayHoc++;
      html += `
        <div class="ngay-nho ${coHoc ? 'co-hoc' : ''} ${i === 0 ? 'hom-nay' : ''}">
          <span>${THU_NGAN[ngay.getDay()]}</span>
          <span class="cham emoji">${coHoc ? '🔥' : ''}</span>
        </div>`;
    }
    return { html, soNgayHoc };
  }

  /** Một dòng trong kế hoạch 60 phút */
  function veDongKeHoach(phan, phut, moTa, diaChi, sapCo) {
    const xong = phut >= phan.phut;
    const tiLe = Math.min(100, Math.round((phut / phan.phut) * 100));
    return `
      <a class="dong-ke-hoach khung phan-${phan.ma} ${xong ? 'da-xong' : ''}" href="${diaChi}">
        <span class="o-emoji emoji">${phan.emoji}</span>
        <span class="giua">
          <span class="dong-tren">
            <b>${phan.ten}</b>
            <span class="so-phut">${Math.min(phut, 999)}/${phan.phut}′</span>
          </span>
          <span class="mo-ta">${moTa}${sapCo ? ' · <i>sắp có</i>' : ''}</span>
          <span class="thanh-tien-do"><span style="width:${tiLe}%"></span></span>
        </span>
        <span class="cuoi-dong">${xong ? '<span class="emoji">✅</span>' : BieuTuong.ve('phai')}</span>
      </a>`;
  }

  function ve(khung) {
    const homNay = new Date();
    const soLieu = LuuTru.soLieuNgay();
    const chuoi = LuuTru.chuoiNgayLienTuc();
    const dem = demTu();
    const kh = LuuTru.KE_HOACH;
    const mucTieu = kh.reduce((tong, p) => tong + p.phut, 0);
    const conLai = Math.max(0, mucTieu - soLieu.tongPhut);
    const tuan = veTuanNay();

    const moTa = {
      on: dem.denHan ? `${dem.denHan} từ đang chờ ôn` : 'Chưa có từ nào đến hạn',
      moi: `${soLieu.tuMoi}/${LuuTru.TU_MOI_MOI_NGAY} từ mới hôm nay`,
      nghe: 'Nghe một âm, chọn đúng thanh',
      viet: 'Thứ tự nét, tập viết theo',
      nguPhap: 'Câu hỏi nhanh ôn bài'
    };
    const diaChi = {
      on: '#the-tu?che-do=on', moi: '#the-tu?che-do=moi',
      nghe: '#luyen-tap', viet: '#luyen-tap', nguPhap: '#luyen-tap'
    };

    // Nút "Bắt đầu": chọn phần nên làm tiếp theo
    let batDau;
    if (dem.denHan && soLieu.phut.on < kh[0].phut) batDau = { chu: `Ôn ${dem.denHan} từ`, diaChi: diaChi.on };
    else if (dem.conMoi && soLieu.tuMoi < LuuTru.TU_MOI_MOI_NGAY) batDau = { chu: 'Học từ mới', diaChi: diaChi.moi };
    else batDau = { chu: 'Luyện tập', diaChi: '#luyen-tap' };

    const phanTramCap = dem.tong ? Math.round((dem.daHoc / dem.tong) * 100) : 0;

    khung.innerHTML = `
      <section class="hero">
        <div class="hero-noi-dung">
          <span class="nhan nhan-chinh">${THU[homNay.getDay()]} · ${homNay.getDate()}/${homNay.getMonth() + 1}</span>
          <h2 class="hero-tieu-de">${loiChao()}
            <span>${conLai ? `Hôm nay còn ${conLai} phút` : 'Đã đủ 60 phút!'}</span></h2>
          <p class="chu-phu">Ôn từ cũ, học ${LuuTru.TU_MOI_MOI_NGAY} từ mới, rồi luyện nghe và viết.</p>
          <a class="nut nut-chinh nut-bat-dau" href="${batDau.diaChi}">${BieuTuong.ve('bat-dau')} Bắt đầu: ${batDau.chu}</a>
        </div>
        ${dem.tuTiepTheo ? `<div class="hero-han han" aria-hidden="true">${thoat(dem.tuTiepTheo.hanzi)}</div>` : ''}
      </section>

      <div class="hang-chi-so">
        <div class="khung o-chi-so ${chuoi ? 'dang-chay' : ''}">
          <span class="emoji">🔥</span><b>${chuoi}</b><span>ngày liên tục</span>
        </div>
        <div class="khung o-chi-so">
          <span class="emoji">⏱️</span><b>${soLieu.tongPhut}<small>/${mucTieu}</small></b><span>phút hôm nay</span>
        </div>
        <div class="khung o-chi-so">
          <span class="emoji">📚</span><b>${dem.daHoc}</b><span>từ đã học</span>
        </div>
      </div>

      <section class="khung tuan-nay">
        <div class="dong-tren"><b>Tuần này</b><span class="chu-phu nho">${tuan.soNgayHoc}/7 ngày có học</span></div>
        <div class="bay-ngay">${tuan.html}</div>
      </section>

      <h3 class="tieu-de-muc">Kế hoạch 60 phút <small>${soLieu.tongPhut}/${mucTieu}′</small></h3>
      <div class="ke-hoach">
        ${kh.map(p => veDongKeHoach(p, soLieu.phut[p.ma], moTa[p.ma], diaChi[p.ma], !['on', 'moi'].includes(p.ma))).join('')}
      </div>

      <h3 class="tieu-de-muc">Tiến độ HSK 1 <small>${dem.daHoc}/${dem.tong} từ</small></h3>
      <a class="khung tien-do-cap" href="#the-tu">
        <div class="dong-tren"><b>${phanTramCap}% đã học</b><span class="nhan nhan-chinh">⭐ Đã thuộc ${dem.daThuoc}</span></div>
        <div class="thanh-tien-do"><span style="width:${phanTramCap}%"></span></div>
        <span class="chu-phu nho">Chạm để chọn bài và học thẻ từ →</span>
      </a>
    `;
  }

  UngDung.dangKy('hom-nay', { tieuDe: 'Hôm nay', ve });
})();
