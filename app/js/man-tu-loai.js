// =========================================================
// TỪ LOẠI & TRẬT TỰ CÂU (trong mục Chữ & âm)
//   #/chu-am/tu-loai          sơ đồ trật tự câu (so với tiếng Việt) + danh sách 13 từ loại
//   #/chu-am/tu-loai/<mã>     một từ loại: vai trò, vị trí, công thức, lỗi người Việt hay mắc,
//                             ví dụ, các từ đã học thuộc loại này, điểm ngữ pháp liên quan
//   moTuLoai(kyHieu, khoa)    bảng nhỏ khi bấm nhãn từ loại trên thẻ từ (giao-dien.js → app.js)
// Dữ liệu: data/tu-loai.json (soạn tay; ví dụ trỏ tới câu ví dụ có sẵn của từ).
// Kiểm tra dữ liệu: python -X utf8 cong-cu/kiem-tra-tu-loai.py
// =========================================================

import { layTienDo } from './luu-tru.js';
import { tatCaTu, layTu } from './du-lieu.js';
import { esc, moHopThoai, nutLoa, dongTu } from './giao-dien.js';
import { toMauPinyin } from './pinyin.js';
import { bieuTuong } from './bieu-tuong.js';
import { taiNguPhap } from './man-ngu-phap.js';
import { htmlCauCham } from './cham-tu.js';

let henDuLieu = null;
export function taiTuLoai() {
  if (!henDuLieu) {
    henDuLieu = fetch('data/tu-loai.json')
      .then((r) => { if (!r.ok) throw new Error(`Không tìm thấy data/tu-loai.json (mã lỗi ${r.status}).`); return r.json(); })
      .catch((e) => { henDuLieu = null; throw e; });
  }
  return henDuLieu;
}

const NHOM = [
  { ma: 'chinh', ten: 'Từ loại chính' },
  { ma: 'chuc-nang', ten: 'Hư từ – từ nối, từ nhỏ' },
  { ma: 'khac', ten: 'Khác' },
];

/** Các từ có ít nhất một nghĩa thuộc từ loại này */
const tuThuocLoai = (l) => tatCaTu().filter((t) => (t.nghia || []).some((n) => l.kyHieu.includes(n.tuLoai)));

/** Một câu ví dụ (lấy từ dữ liệu từ vựng), tô đậm từ đang nói tới */
function htmlViDu(v) {
  const tu = layTu(v.tu);
  const cau = tu?.viDu?.[v.so];
  if (!cau) return '';
  const han = htmlCauCham(cau.han, { danh: tu.hanzi });
  return `
    <div class="vi-du">
      <div class="vi-du-chu">
        <p class="han vi-du-han">${han}</p>
        <p class="pinyin vi-du-pinyin">${toMauPinyin(cau.pinyin)}</p>
        <p class="vi-du-dich">${esc(cau.dich)}</p>
        ${v.ghiChu ? `<p class="ghi-chu-vi-du">👉 ${esc(v.ghiChu)}</p>` : ''}
      </div>
      ${nutLoa(cau.han, true)}
    </div>`;
}

/** Hàng mảnh câu có màu theo vai trò (dùng cho sơ đồ trật tự câu) */
function hangManh(manh, coVai = true) {
  return `<div class="hang-manh">${manh.map((m) => `
    <span class="manh-cau vai-${m.mau}">
      <span class="${coVai ? 'han' : ''} chu-manh">${esc(m.chu)}</span>
      ${coVai && m.vai ? `<small>${esc(m.vai)}</small>` : ''}
    </span>`).join('')}</div>`;
}

// ---------- Trang tổng quan ----------
export async function htmlTongQuanTuLoai() {
  const dl = await taiTuLoai();
  const tt = dl.tratTu;
  const td = layTienDo();
  const the = (l) => {
    const ds = tuThuocLoai(l);
    const daHoc = ds.filter((t) => td.the[t.khoa]).length;
    return `
      <a class="khung the-tu-loai" href="#/chu-am/tu-loai/${l.ma}">
        <span class="emoji o-emoji-tl">${l.emoji}</span>
        <span class="giua">
          <b>${esc(l.ten)} <span class="han chu-phu">${esc(l.tenTrung)}</span></b>
          <span class="chu-phu nho">${esc(l.vaiTro.split(':')[0])}</span>
          ${ds.length ? `<span class="chu-phu nho">Đã học ${daHoc}/${ds.length} từ</span>` : ''}
        </span>
        <span class="cuoi-dong">${bieuTuong('phai')}</span>
      </a>`;
  };
  return `
    <section class="khung gioi-thieu-chu-am">
      <b>Từ loại & trật tự câu</b>
      <span class="chu-phu nho">Biết một từ thuộc loại nào thì biết nó đứng ở đâu trong câu. Trên thẻ từ, chạm vào nhãn
        từ loại (ví dụ <span class="nhan nhan-chinh">động từ</span>) để xem nhanh.</span>
    </section>

    <h3 class="tieu-de-muc">Trật tự câu <small>so với tiếng Việt</small></h3>
    <section class="khung so-do-cau">
      <p class="chu-phu nho" style="margin:0 0 10px">${esc(tt.moTa)}</p>
      <div class="dong-so-do"><span class="nhan">Tiếng Trung</span>${nutLoa(tt.cau.manh.map((m) => m.chu).join(''), true)}</div>
      ${hangManh(tt.cau.manh)}
      <p class="pinyin vi-du-pinyin" style="margin:6px 0 0">${toMauPinyin(tt.cau.pinyin)}</p>
      <div class="dong-so-do" style="margin-top:12px"><span class="nhan">Tiếng Việt</span></div>
      ${hangManh(tt.cau.tiengViet, false)}
      <p class="chu-phu nho" style="margin:6px 0 0">${esc(tt.cau.dich)}</p>
      <p class="meo-doc">💡 Màu vàng (thời gian, nơi chốn) trong tiếng Việt hay đứng cuối, trong tiếng Trung phải đứng TRƯỚC động từ.</p>
    </section>

    <section class="khung so-do-cau" style="margin-top:12px">
      <b>Thứ tự đầy đủ trong câu</b>
      <p class="chu-phu nho" style="margin:4px 0 0">Mục 2–5 đều đứng TRƯỚC động từ. Chạm để xem từ loại.</p>
      <ol class="thu-tu-cau">${tt.thuTu.map((x) => `
        <li class="vai-${x.mau}"><a href="#/chu-am/tu-loai/${x.loai}"><b>${esc(x.ten)}</b> <span class="han">${esc(x.vd)}</span></a></li>`).join('')}
      </ol>
    </section>

    <section class="khung so-do-cau" style="margin-top:12px">
      <b>Bổ nghĩa cho danh từ</b>
      <div class="dong-so-do" style="margin-top:8px"><span class="nhan">Tiếng Trung</span>${nutLoa(tt.dinhNgu.manh.map((m) => m.chu).join(''), true)}</div>
      ${hangManh(tt.dinhNgu.manh)}
      <p class="pinyin vi-du-pinyin" style="margin:6px 0 0">${toMauPinyin(tt.dinhNgu.pinyin)}</p>
      <div class="dong-so-do" style="margin-top:12px"><span class="nhan">Tiếng Việt</span></div>
      ${hangManh(tt.dinhNgu.tiengViet, false)}
      <p class="meo-doc">💡 ${esc(tt.dinhNgu.giaiThich)}</p>
    </section>

    ${NHOM.map((n) => {
      const ds = dl.loai.filter((l) => l.nhom === n.ma);
      return ds.length ? `<h3 class="tieu-de-muc">${n.ten} <small>${ds.length}</small></h3>
        <div class="ds-tu-loai">${ds.map(the).join('')}</div>` : '';
    }).join('')}`;
}

// ---------- Trang một từ loại ----------
export async function veTuLoai(khung, ma) {
  khung.innerHTML = '<div class="dang-tai">Đang tải…</div>';
  let dl;
  try { dl = await taiTuLoai(); } catch (e) { khung.innerHTML = `<div class="loi">${esc(e.message)}</div>`; return; }
  if (!khung.isConnected) return;
  const l = dl.loai.find((x) => x.ma === ma);
  if (!l) { khung.innerHTML = '<p class="loi">Không tìm thấy từ loại này.</p>'; return; }

  const td = layTienDo();
  const ds = tuThuocLoai(l);
  const daHoc = ds.filter((t) => td.the[t.khoa]);
  const goiY = daHoc.length ? daHoc : ds.filter((t) => t.cap === 1).slice(0, 8);

  khung.innerHTML = `
    <section class="khung dau-tu-loai">
      <span class="emoji emoji-to">${l.emoji}</span>
      <h2>${esc(l.ten)}</h2>
      <p class="chu-phu" style="margin:0"><span class="han">${esc(l.tenTrung)}</span> · <span class="pinyin">${esc(l.pinyin)}</span>
        ${l.kyHieu.some((k) => /\p{Script=Han}/u.test(k))
          ? `· ký hiệu ${l.kyHieu.map((k) => `<span class="han">${esc(k)}</span>`).join(', ')}` : ''}</p>
      <p style="margin:10px 0 0">${esc(l.vaiTro)}</p>
    </section>

    <h3 class="tieu-de-muc">Vị trí trong câu</h3>
    <section class="khung"><ul class="ds-gach">${l.viTri.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>

    <h3 class="tieu-de-muc">Công thức</h3>
    <div class="ds-cong-thuc">${l.congThuc.map((x) => `<div class="cong-thuc-tl">${esc(x)}</div>`).join('')}</div>

    <h3 class="tieu-de-muc">Người Việt hay nhầm</h3>
    <section class="khung can-nho-tl"><ul class="ds-gach">${l.luuY.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>

    <h3 class="tieu-de-muc">Ví dụ</h3>
    <section class="khung">${l.viDu.map(htmlViDu).join('')}</section>

    <div id="np-tu-loai"></div>

    ${goiY.length ? `
    <h3 class="tieu-de-muc">${daHoc.length ? 'Từ bạn đã học thuộc loại này' : 'Một số từ HSK 1 thuộc loại này'}
      <small>${daHoc.length ? `${daHoc.length}/${ds.length}` : `${ds.length} từ trong HSK 1–3`}</small></h3>
    <div class="khung ds-tu">${goiY.slice(0, 40).map(dongTu).join('')}</div>
    ${goiY.length > 40 ? `<p class="chu-phu nho">… và ${goiY.length - 40} từ khác.</p>` : ''}` : ''}`;

  // Điểm ngữ pháp liên quan (tải sau, không chặn trang)
  if (!l.nguPhap.length) return;
  const diem = await taiNguPhap().catch(() => []);
  const vung = khung.querySelector('#np-tu-loai');
  if (!vung?.isConnected) return;
  const cua = l.nguPhap.map((m) => diem.find((d) => d.id === m)).filter(Boolean).sort((a, b) => a.cap - b.cap);
  if (!cua.length) return;
  vung.outerHTML = `
    <h3 class="tieu-de-muc">Ngữ pháp liên quan <small>${cua.length} điểm</small></h3>
    <div class="ds-diem-bai ds-np-tu-loai">${cua.map((d) => `
      <a class="chip" href="#/ngu-phap/${d.id}"><small class="chu-phu">HSK ${d.cap}</small> ${esc(d.ten)}</a>`).join('')}</div>`;
}

// ---------- Bảng nhỏ khi bấm nhãn từ loại trên thẻ từ ----------
/**
 * @param kyHieu ký hiệu từ loại trong dữ liệu ('动', '名', 'cụm'…)
 * @param khoa   khóa của từ đang xem (để hiện câu ví dụ của chính từ đó) – có thể bỏ trống
 */
export async function moTuLoai(kyHieu, khoa = '') {
  let dl;
  try { dl = await taiTuLoai(); } catch { return; }
  const l = dl.loai.find((x) => x.kyHieu.includes(kyHieu));
  if (!l) return;
  const tu = khoa ? layTu(khoa) : null;
  // Câu ví dụ của chính từ này, thuộc nghĩa có từ loại đang xem
  const viDuTu = tu ? (tu.viDu || [])
    .map((v, so) => ({ v, so }))
    .filter(({ v }) => tu.nghia?.[v.nghiaSo ?? 0]?.tuLoai === kyHieu)
    .slice(0, 2)
    .map(({ so }) => ({ tu: khoa, so })) : [];
  moHopThoai(`
    <div class="dau-hop">
      <h2><span class="emoji">${l.emoji}</span> ${esc(l.ten)} <small class="chu-phu"><span class="han">${esc(l.tenTrung)}</span></small></h2>
      <button class="nut-bieu-tuong" data-dong aria-label="Đóng">✕</button>
    </div>
    <p style="margin:4px 0 0">${esc(l.vaiTro)}</p>
    <p class="chu-phu nho" style="margin:12px 0 4px"><b>Vị trí trong câu</b></p>
    <ul class="ds-gach">${l.viTri.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    <div class="ds-cong-thuc">${l.congThuc.slice(0, 2).map((x) => `<div class="cong-thuc-tl">${esc(x)}</div>`).join('')}</div>
    ${viDuTu.length ? `<p class="chu-phu nho" style="margin:12px 0 0"><b>Trong câu với <span class="han">${esc(tu.hanzi)}</span></b></p>
      ${viDuTu.map(htmlViDu).join('')}` : ''}
    <p class="meo-doc">⚠️ ${esc(l.luuY[0])}</p>
    <a class="nut nut-rong" href="#/chu-am/tu-loai/${l.ma}" style="margin-top:12px">Xem đầy đủ về ${esc(l.ten.toLowerCase())} →</a>`);
}
