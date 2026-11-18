// =========================================================
// ĐỌC DỮ LIỆU TỪ VỰNG từ file data/hsk1.json
// (file này được tạo bởi cong-cu/ghep-du-lieu-hsk1.py từ danh sách chính thức + phần soạn tay)
// =========================================================

// Tên tiếng Việt của các ký hiệu từ loại trong danh sách chính thức
export const TEN_TU_LOAI = {
  '名': 'danh từ', '动': 'động từ', '形': 'tính từ', '副': 'phó từ', '代': 'đại từ',
  '数': 'số từ', '量': 'lượng từ', '数量': 'số lượng từ', '助': 'trợ từ', '介': 'giới từ',
  '连': 'liên từ', '叹': 'thán từ', '前缀': 'tiền tố', '后缀': 'hậu tố', 'cụm': 'cụm từ',
};

// Các cấp đã có dữ liệu. Giai đoạn sau sẽ thêm 'data/hsk2.json', 'data/hsk3.json'.
const CAC_FILE = [{ cap: 1, duongDan: 'data/hsk1.json' }];

let baiHoc = [];       // [{ cap, so, ten, tu: [ ... ] }]
let tuTheoKhoa = {};   // khóa "1:爱" → từ

/** Tải toàn bộ dữ liệu. Ném lỗi có giải thích tiếng Việt nếu file hỏng. */
export async function taiDuLieu() {
  baiHoc = [];
  tuTheoKhoa = {};
  for (const f of CAC_FILE) {
    let phanHoi;
    try {
      phanHoi = await fetch(f.duongDan, { cache: 'no-cache' });
    } catch (e) {
      throw new Error(`Không mở được file ${f.duongDan}.\n` +
        'Nếu bạn mở app bằng cách bấm đúp vào index.html thì trình duyệt sẽ chặn đọc file. ' +
        'Hãy chạy bằng file CHAY-APP.bat (xem HUONG-DAN.md).');
    }
    if (!phanHoi.ok) throw new Error(`Không tìm thấy file ${f.duongDan} (mã lỗi ${phanHoi.status}).`);
    const chuoi = await phanHoi.text();
    let json;
    try {
      json = JSON.parse(chuoi);
    } catch (e) {
      throw new Error(`File ${f.duongDan} bị sai định dạng JSON:\n${e.message}\n` +
        'Thường do thiếu/thừa dấu phẩy, dấu ngoặc kép hoặc ngoặc nhọn ở chỗ vừa sửa.');
    }
    for (const b of json.baiHoc || []) {
      const dsTu = (b.tu || [])
        .filter((t) => t.daSoan) // chỉ dùng từ đã soạn đủ nội dung
        .map((t) => ({ ...t, cap: f.cap, khoa: `${f.cap}:${t.dangGoc}`, bai: b.so }));
      dsTu.forEach((t) => { tuTheoKhoa[t.khoa] = t; });
      baiHoc.push({ cap: f.cap, so: b.so, ten: b.ten, tu: dsTu });
    }
  }
  if (!baiHoc.length) throw new Error('File dữ liệu không có bài học nào.');
  return baiHoc;
}

export const layBaiHoc = () => baiHoc;
export const layTu = (khoa) => tuTheoKhoa[khoa];
export const tatCaTu = () => baiHoc.flatMap((b) => b.tu);
export const timBai = (cap, so) => baiHoc.find((b) => b.cap === cap && b.so === so);

/** Nghĩa ngắn gọn để hiện trong danh sách: "yêu; thích". */
export function nghiaNgan(tu) {
  return (tu.nghia || []).map((n) => n.nghia).join('; ');
}
