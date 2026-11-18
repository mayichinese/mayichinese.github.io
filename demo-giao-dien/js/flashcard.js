/* ============================================================
   FLASHCARD (Thẻ từ) — chạy thật với dữ liệu các bài đã soạn.
   Địa chỉ:
     #the-tu              -> màn hình chọn: ôn / từ mới / chọn bài
     #the-tu?cap=2        -> màn hình chọn, xem bài của HSK 2
     #the-tu?che-do=on    -> ôn các từ đến hạn
     #the-tu?che-do=moi   -> học từ mới
     #the-tu?bai=3        -> học toàn bộ bài 3 (HSK 1)
   Phím tắt trên máy tính: Cách (Space) = lật thẻ; 1/2/3/4 = Quên/Khó/Nhớ/Dễ
   ============================================================ */
(() => {
  const thoat = Pinyin.thoat;
  const LUA_CHON = [
    { muc: 'quen', ten: 'Quên', emoji: '😵' },
    { muc: 'kho',  ten: 'Khó',  emoji: '🤔' },
    { muc: 'nho',  ten: 'Nhớ',  emoji: '🙂' },
    { muc: 'de',   ten: 'Dễ',   emoji: '😎' }
  ];
  const GIAY_TOI_DA_MOI_THE = 60;   // tránh tính giờ khi bỏ máy đi chỗ khác
  const SO_LAN_LAP_TOI_DA = 3;      // một từ "Quên" được đưa lại tối đa 3 lần/phiên

  let phien = null;                 // phiên học đang chạy
  let xuLyPhim = null;              // hàm nghe phím tắt

  /* ==================== Tiện ích ==================== */

  function tronNgauNhien(mang) {
    const m = mang.slice();
    for (let i = m.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [m[i], m[j]] = [m[j], m[i]];
    }
    return m;
  }

  const LA_CHU_HAN = /\p{Script=Han}/u;

  /** Tô màu từng chữ Hán theo thanh của âm tiết tương ứng (nếu số chữ = số âm tiết) */
  function toMauChuHan(hanzi, pinyin) {
    const chu = [...hanzi];
    const amTiet = Pinyin.tach(pinyin, Pinyin.demChuHan(hanzi)).filter(p => p.thanh !== undefined);
    if (amTiet.length !== chu.filter(c => LA_CHU_HAN.test(c)).length) return thoat(hanzi);
    let i = 0;
    return chu.map(c => (LA_CHU_HAN.test(c) ? `<span class="t${amTiet[i++].thanh}">${thoat(c)}</span>` : thoat(c))).join('');
  }

  /** Chữ Hán đặt trong ô chữ điền (ô vuông có đường kẻ chéo như vở tập viết) */
  function oChuDien(hanzi) {
    const chu = [...hanzi];
    return `<div class="hang-o-chu so-chu-${Math.min(chu.length, 4)}">
      ${chu.map(c => `<span class="o-chu han">${thoat(c)}</span>`).join('')}
    </div>`;
  }

  /* ==================== Màn hình chọn ==================== */

  function veManChon(khung, thamSo) {
    const capChon = Number(thamSo.cap) || 1;
    const the = LuuTru.layTatCaThe();
    const tatCa = DuLieu.tatCaTuDaSoan();
    const soDenHan = tatCa.filter(t => LuuTru.denHan(the[t.id])).length;
    const soMoi = tatCa.filter(t => !the[t.id]).length;

    // Nút chọn cấp HSK 1/2/3 (cấp chưa có dữ liệu thì mờ đi)
    const chipCap = [1, 2, 3].map(c => DuLieu.cap(c)
      ? `<a class="chip ${c === capChon ? 'dang-chon' : ''}" href="#the-tu?cap=${c}">HSK ${c}</a>`
      : `<button class="chip" disabled title="Sắp có">HSK ${c} <span class="emoji">🔒</span></button>`).join('');

    const oBai = DuLieu.danhSachBai(capChon).map(bai => {
      const xemTruoc = bai.tu[0] ? thoat(bai.tu[0].hanzi) : '';
      if (!bai.daSoan) {
        return `
          <div class="o-bai dang-soan" aria-disabled="true">
            <span class="so-bai">Bài ${bai.so}</span>
            <span class="xem-truoc han">${xemTruoc}</span>
            <span class="ten-bai">${thoat(bai.ten)}</span>
            <span class="nhan"><span class="emoji">🕒</span> Đang soạn</span>
          </div>`;
      }
      const daHoc = bai.tu.filter(t => the[t.id]).length;
      const phanTram = Math.round((daHoc / bai.soTu) * 100);
      return `
        <a class="o-bai ${phanTram === 100 ? 'xong' : ''}" href="#the-tu?cap=${capChon}&bai=${bai.so}">
          <span class="so-bai">Bài ${bai.so}${phanTram === 100 ? ' <span class="emoji">✅</span>' : ''}</span>
          <span class="xem-truoc han">${xemTruoc}</span>
          <span class="ten-bai">${thoat(bai.ten)}</span>
          <span class="thanh-tien-do"><span style="width:${phanTram}%"></span></span>
          <span class="chu-phu nho">${daHoc}/${bai.soTu} từ · ${phanTram}%</span>
        </a>`;
    }).join('');

    khung.innerHTML = `
      <div class="hai-o">
        <a class="o-lon khung phan-on" href="#the-tu?che-do=on">
          <span class="o-emoji emoji">🔁</span>
          <span class="so-lon">${soDenHan}</span>
          <b>Ôn tập</b>
          <span class="chu-phu nho">từ đến hạn hôm nay</span>
        </a>
        <a class="o-lon khung phan-moi" href="#the-tu?che-do=moi">
          <span class="o-emoji emoji">✨</span>
          <span class="so-lon">${soMoi}</span>
          <b>Từ mới</b>
          <span class="chu-phu nho">từ chưa học</span>
        </a>
      </div>
      <h3 class="tieu-de-muc">Chọn bài</h3>
      <div class="hang-chip">${chipCap}</div>
      <div class="luoi-bai">${oBai || '<p class="chu-phu">Chưa có bài nào.</p>'}</div>
    `;
  }

  /* ==================== Chuẩn bị phiên học ==================== */

  function taoPhien(thamSo) {
    const the = LuuTru.layTatCaThe();
    const tatCa = DuLieu.tatCaTuDaSoan();

    if (thamSo['che-do'] === 'on') {
      return { tieuDe: 'Ôn tập', danhSach: tronNgauNhien(tatCa.filter(t => LuuTru.denHan(the[t.id]))) };
    }
    if (thamSo['che-do'] === 'moi') {
      const soLuong = Math.max(5, LuuTru.TU_MOI_MOI_NGAY - LuuTru.soLieuNgay().tuMoi);
      return { tieuDe: 'Từ mới', danhSach: tatCa.filter(t => !the[t.id]).slice(0, soLuong) };
    }
    if (thamSo.bai) {
      const bai = DuLieu.bai(Number(thamSo.cap) || 1, Number(thamSo.bai));
      if (!bai) return { tieuDe: 'Không tìm thấy bài', danhSach: [] };
      if (!bai.daSoan) return { tieuDe: `Bài ${bai.so}`, danhSach: [], dangSoan: true };
      return { tieuDe: `Bài ${bai.so} · ${bai.ten}`, danhSach: bai.tu.filter(t => t.daSoan) };
    }
    return null; // không có tham số -> màn hình chọn
  }

  function veTrong(khung, thamSo, thongTin) {
    let noiDung;
    if (thongTin.dangSoan) {
      noiDung = `<div class="emoji emoji-to">🕒</div><h2>Bài này đang soạn</h2>
                 <p class="chu-phu">Dữ liệu bài này chưa xong. Hãy chọn bài khác nhé.</p>`;
    } else if (thamSo['che-do'] === 'on') {
      noiDung = `<div class="emoji emoji-to">🎉</div><h2>Không có từ nào cần ôn</h2>
                 <p class="chu-phu">Tuyệt vời! Hãy học thêm từ mới.</p>
                 <p><a class="nut nut-chinh" href="#the-tu?che-do=moi">✨ Học từ mới</a></p>`;
    } else {
      noiDung = `<div class="emoji emoji-to">🏆</div><h2>Đã học hết từ mới</h2>
                 <p class="chu-phu">Bạn đã học hết các từ đã soạn. Chờ thêm bài mới nhé.</p>`;
    }
    khung.innerHTML = `<div class="chua-lam">${noiDung}<p><a class="nut" href="#the-tu">Về danh sách</a></p></div>`;
  }

  /* ==================== Phiên học ==================== */

  function batDauPhien(khung, thongTin) {
    phien = {
      khung,
      hangDoi: thongTin.danhSach.slice(),
      viTri: 0,
      soLanLap: {},
      ketQua: { quen: 0, kho: 0, nho: 0, de: 0 },
      giayDaHoc: 0,
      daLat: false,
      batDauThe: Date.now()
    };
    document.body.classList.add('dang-hoc');
    UngDung.datTieuDe(thongTin.tieuDe, () => UngDung.diDen('the-tu'));

    khung.innerHTML = `
      <div class="phien">
        <div class="tien-do-phien">
          <div class="thanh-tien-do"><span></span></div>
          <span class="dem"></span>
        </div>
        <div class="the-tu" tabindex="0" role="button" aria-label="Thẻ từ – chạm để lật"></div>
        <div class="vung-tra-loi"></div>
      </div>`;

    khung.querySelector('.the-tu').addEventListener('click', e => {
      const nutLoa = e.target.closest('[data-doc]');
      if (nutLoa) { e.stopPropagation(); GiongDoc.doc(nutLoa.dataset.doc, nutLoa); return; }
      latThe();
    });

    // Phím tắt
    xuLyPhim = e => {
      if (!phien || document.querySelector('#lop-phu:not([hidden])')) return;
      // Đang chọn một nút/liên kết thì để nút đó tự xử lý (tránh lật 2 lần)
      const dangONut = e.target.closest && e.target.closest('button, a, input');
      if ((e.key === ' ' || e.key === 'Enter') && !dangONut) { e.preventDefault(); latThe(); }
      const so = Number(e.key);
      if (phien.daLat && so >= 1 && so <= 4) traLoi(LUA_CHON[so - 1].muc);
    };
    document.addEventListener('keydown', xuLyPhim);

    veThe();
  }

  /** Vẽ thẻ hiện tại (mặt trước) */
  function veThe() {
    const tu = phien.hangDoi[phien.viTri];
    if (!tu) { veKetThuc(); return; }
    const k = phien.khung;
    phien.daLat = false;
    phien.batDauThe = Date.now();

    const tong = phien.hangDoi.length;
    k.querySelector('.tien-do-phien .thanh-tien-do > span').style.width = `${(phien.viTri / tong) * 100}%`;
    k.querySelector('.tien-do-phien .dem').textContent = `${phien.viTri + 1}/${tong}`;

    const daHoc = !!LuuTru.layThe(tu.id);
    const the = k.querySelector('.the-tu');
    the.classList.remove('mat-sau-dang-hien');
    the.innerHTML = `
      <div class="mat-truoc">
        <div class="goc-the">
          <span class="nhan ${daHoc ? '' : 'nhan-chinh'}">${daHoc ? '🔁 Ôn tập' : '✨ Từ mới'}</span>
          <span class="chu-phu nho">HSK ${tu.cap} · Bài ${tu.bai}</span>
        </div>
        <div class="giua-the">${oChuDien(tu.hanzi)}</div>
        <p class="goi-y"><span class="emoji">👆</span> Chạm vào thẻ để lật</p>
      </div>`;
    the.classList.add('the-moi-vao');
    setTimeout(() => the.classList.remove('the-moi-vao'), 280);

    k.querySelector('.vung-tra-loi').innerHTML =
      `<button class="nut nut-chinh nut-rong nut-lat">Lật thẻ</button>`;
    k.querySelector('.nut-lat').addEventListener('click', latThe);
  }

  /** Nội dung mặt sau */
  function noiDungMatSau(tu) {
    const nghia = (tu.nghia || []).map(n => `
      <li>${n.tuLoai ? `<span class="nhan nhan-chinh">${thoat(DuLieu.tenTuLoai(n.tuLoai))}</span>` : ''}
          <span>${thoat(n.nghia)}</span></li>`).join('');

    const viDu = (tu.viDu || []).map(v => `
      <div class="vi-du">
        <div class="vi-du-chu">
          <p class="han vi-du-han">${thoat(v.han)}</p>
          <p class="pinyin vi-du-pinyin">${Pinyin.toMau(v.pinyin)}</p>
          <p class="vi-du-dich">${thoat(v.dich)}</p>
        </div>
        <button class="nut-loa nho" data-doc="${thoat(v.han)}" aria-label="Đọc câu ví dụ">${BieuTuong.ve('loa')}</button>
      </div>`).join('');

    const ghiChu = (tu.ghiChu || []).length
      ? `<div class="ghi-chu"><span class="emoji">💡</span><div><b>Ghi chú</b>
           <ul>${tu.ghiChu.map(g => `<li>${thoat(g)}</li>`).join('')}</ul></div></div>`
      : '';

    return `
      <div class="mat-sau">
        <div class="dau-mat-sau">
          <div class="han chu-han-vua">${toMauChuHan(tu.hanzi, tu.pinyin)}</div>
          <button class="nut-loa" data-doc="${thoat(tu.hanzi)}" aria-label="Đọc từ">${BieuTuong.ve('loa')}</button>
        </div>
        <div class="pinyin pinyin-to">${Pinyin.toMau(tu.pinyin, Pinyin.demChuHan(tu.hanzi))}</div>
        ${tu.hanViet ? `<div class="han-viet"><span>Hán Việt</span><b>${thoat(tu.hanViet)}</b></div>` : ''}
        <ul class="danh-sach-nghia">${nghia}</ul>
        ${viDu ? `<p class="tieu-de-nho">Ví dụ</p>${viDu}` : ''}
        ${ghiChu}
      </div>`;
  }

  /** Lật thẻ (có hiệu ứng xoay) */
  function latThe() {
    if (!phien) return;
    const tu = phien.hangDoi[phien.viTri];
    if (!tu) return;
    const the = phien.khung.querySelector('.the-tu');
    const dangHienMatSau = the.classList.contains('mat-sau-dang-hien');

    the.classList.add('dang-lat');
    setTimeout(() => {
      if (!the.querySelector('.mat-sau')) the.insertAdjacentHTML('beforeend', noiDungMatSau(tu));
      the.querySelector('.mat-truoc').hidden = !dangHienMatSau;
      the.querySelector('.mat-sau').hidden = dangHienMatSau;
      the.classList.toggle('mat-sau-dang-hien', !dangHienMatSau);
      the.classList.remove('dang-lat');
    }, 160);

    if (!phien.daLat) {
      phien.daLat = true;
      veNutTraLoi(tu);
    }
  }

  /** 4 nút Quên / Khó / Nhớ / Dễ, kèm thời gian đến lần ôn sau */
  function veNutTraLoi(tu) {
    const theCu = LuuTru.layThe(tu.id);
    const vung = phien.khung.querySelector('.vung-tra-loi');
    vung.innerHTML = `<div class="bon-nut">${LUA_CHON.map((l, i) => `
      <button class="nut-tra-loi muc-${l.muc}" data-muc="${l.muc}">
        <b>${l.ten}</b>
        <small>${LuuTru.dienDatKhoang(LuuTru.tinhKhoang(theCu, l.muc))}</small>
        <kbd>${i + 1}</kbd>
      </button>`).join('')}</div>`;
    vung.querySelectorAll('[data-muc]').forEach(nut =>
      nut.addEventListener('click', () => traLoi(nut.dataset.muc)));
  }

  /** Ghi nhận câu trả lời rồi sang thẻ tiếp theo */
  function traLoi(muc) {
    const tu = phien.hangDoi[phien.viTri];
    if (!tu || !phien.daLat) return;

    // Thời gian học thẻ này (tối đa 60 giây)
    const giay = Math.min(GIAY_TOI_DA_MOI_THE, Math.round((Date.now() - phien.batDauThe) / 1000));
    const laTuMoi = !LuuTru.layThe(tu.id);
    LuuTru.congThoiGian(laTuMoi ? 'moi' : 'on', giay);
    if (laTuMoi) LuuTru.demTuMoi();
    phien.giayDaHoc += giay;

    LuuTru.capNhatThe(tu.id, muc);
    phien.ketQua[muc]++;

    // "Quên": đưa từ này lại sau 3 thẻ nữa
    if (muc === 'quen') {
      phien.soLanLap[tu.id] = (phien.soLanLap[tu.id] || 0) + 1;
      if (phien.soLanLap[tu.id] <= SO_LAN_LAP_TOI_DA) {
        phien.hangDoi.splice(Math.min(phien.viTri + 4, phien.hangDoi.length), 0, tu);
      }
    }

    phien.viTri++;
    veThe();
  }

  /** Màn hình tổng kết cuối phiên */
  function veKetThuc() {
    const kq = phien.ketQua;
    const tong = kq.quen + kq.kho + kq.nho + kq.de;
    const phut = Math.max(1, Math.round(phien.giayDaHoc / 60));
    const tot = tong ? (kq.nho + kq.de) / tong : 0;
    phien.khung.innerHTML = `
      <div class="ket-thuc">
        <div class="emoji emoji-to">${tot >= .8 ? '🏆' : tot >= .5 ? '🎉' : '💪'}</div>
        <h2>${tot >= .8 ? 'Xuất sắc!' : tot >= .5 ? 'Làm tốt lắm!' : 'Cố lên, ôn thêm nhé!'}</h2>
        <p class="chu-phu">Khoảng ${phut} phút · ${tong} lượt trả lời</p>
        <div class="bang-ket-qua">
          ${LUA_CHON.map(l => `<div class="o-ket-qua muc-${l.muc}"><span class="emoji">${l.emoji}</span><b>${kq[l.muc]}</b><span>${l.ten}</span></div>`).join('')}
        </div>
        <a class="nut nut-chinh nut-rong" href="#hom-nay">Về trang Hôm nay</a>
        <a class="nut nut-rong" href="#the-tu">Học tiếp</a>
      </div>`;
    document.body.classList.remove('dang-hoc');
    ketThucPhien();
  }

  function ketThucPhien() {
    if (xuLyPhim) document.removeEventListener('keydown', xuLyPhim);
    xuLyPhim = null;
    phien = null;
  }

  /* ==================== Đăng ký màn hình ==================== */

  UngDung.dangKy('the-tu', {
    tieuDe: 'Thẻ từ',
    ve(khung, thamSo) {
      const thongTin = taoPhien(thamSo);
      if (!thongTin) { veManChon(khung, thamSo); return; }
      if (!thongTin.danhSach.length) { veTrong(khung, thamSo, thongTin); return; }
      batDauPhien(khung, thongTin);
    },
    roi() {
      if (window.speechSynthesis) speechSynthesis.cancel();
      ketThucPhien();
    }
  });
})();
