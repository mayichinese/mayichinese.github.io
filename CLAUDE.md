# Mayi Chinese – app học tiếng Trung HSK 3.0 (cá nhân)

## Tên và nhận diện
- Tên app: **Mayi Chinese** (mǎyǐ 蚂蚁 = con kiến). Tên ngắn trên màn hình điện thoại: "Mayi".
- Logo gốc: `avatar.jpg` (2048×2048): nền đỏ, chú kiến đỏ trong vòng tròn cam ở nửa trái, chữ
  "MAYI CHINESE" vàng ở nửa phải.
  - Icon app (favicon, icon 180/192/512, icon maskable): chỉ cắt phần vòng tròn chú kiến
    (khoảng x 230–1070, y 590–1460 trên ảnh gốc), đặt giữa nền đỏ cùng màu, chừa lề để
    vừa vùng an toàn của icon maskable. Ở cỡ nhỏ không đọc được chữ nên không đưa chữ vào icon.
  - Trang chủ KHÔNG hiện logo lớn (người dùng đã bỏ). Logo nhỏ chú kiến ở thanh trên cùng / cột trái.
- Màu thương hiệu lấy từ logo: đỏ nền, cam/vàng vòng tròn, vàng chữ.
- **Không đổi khóa localStorage `hoc-hsk-tien-do`** trong `app/js/luu-tru.js` khi đổi tên,
  nếu không sẽ mất tiến độ đã học.

## Người dùng
- Người Việt, học tiếng Trung từ số 0, 60 phút/ngày, mục tiêu HSK 3.0 cấp 1 → 3.
- Không biết lập trình: giải thích bằng tiếng Việt, đơn giản, hướng dẫn từng bước.
- Mọi giao diện, chú thích code và tài liệu đều bằng tiếng Việt.

## Cấu trúc thư mục
- `app/` – **app chính** (HTML/CSS/JS thuần, ES module, không build). PWA chạy offline.
  - `js/lich-on.js`: ôn tập ngắt quãng SM-2 (Quên/Khó/Nhớ/Dễ). `js/luu-tru.js`: lưu tiến độ localStorage.
  - `js/phien-hoc.js` (chọn thẻ tiếp theo), `js/phat-am.js` (Web Speech API zh-CN), `sw.js` (cache offline).
  - Giao diện: `js/app.js` (khởi động, chuyển màn hình), `js/giao-dien.js` (mảnh dùng chung, sáng/tối),
    mỗi màn hình một file `js/man-*.js`; `js/pinyin.js` tô màu thanh điệu; `css/style.css` (biến màu
    sáng/tối theo logo) + `css/man-hinh.css`.
  - Giai đoạn 2: `js/man-luyen-viet.js` (100 chữ viết tay cấp 1–2, lịch ôn SM-2 riêng ở `tienDo.theViet`,
    tự chấm theo số nét sai), `js/net-chu.js` + `lib/hanzi-writer.min.js` (Hanzi Writer 3.7.3, tải khi cần),
    `js/man-thanh-dieu.js` (5 dạng bài, câu hỏi sinh từ hsk1.json; thống kê `tienDo.thanhDieu`).
  - Giai đoạn 3: `js/man-trac-nghiem.js` (4 dạng, từ đã học ≥ 4 từ; đáp án nhiễu không trùng nghĩa/đồng âm;
    sổ câu sai `tienDo.tracNghiem.soSai` – sai thì thẻ từ đang ôn đến hạn ngay; ra sổ khi đúng 2 lượt liên tiếp).
    Thời gian trắc nghiệm tính vào phần `nguPhap` của kế hoạch 60 phút.
  - Giai đoạn 4: `js/man-ngu-phap.js` (35 điểm ngữ pháp HSK 1; sắp xếp câu + điền từ; tự chấm + SM-2 ở
    `tienDo.nguPhap.the` theo MÃ điểm – không đổi mã của điểm đã có). Dữ liệu `data/ngu-phap-hsk1.json` tạo từ
    `cong-cu/nguon-ngu-phap/cap1-*.txt` bằng `python -X utf8 cong-cu/ghep-ngu-phap.py` (định dạng ghi ở đầu script).
    Đáp án nhiễu bài điền từ chọn tay: phải chắc chắn SAI khi thay vào (tránh 吗/是/很/在… nếu câu vẫn đúng).
  - `data/net-chu-hsk1.json` (tạo bởi `cong-cu/tai-du-lieu-viet.py`) và `data/thanh-dieu-hsk1.json`
    (tạo bởi `cong-cu/tao-du-lieu-thanh-dieu.py`, cần CC-CEDICT) – **file tự động, không sửa tay**.
  - `data/hsk1.json`: dữ liệu HSK 1 (20 bài, 300 từ, 625 câu ví dụ) – **file được tạo tự động, không sửa tay**.
  - `data/chinh-thuc/`: danh sách từ và chữ Hán chính thức HSK 3.0, trích từ đề cương 2025.
- `cong-cu/` – script tạo và kiểm tra dữ liệu. `cong-cu/nguon-hsk1/bai-*.txt` là nguồn soạn tay.
- `tai-lieu/` – PDF đề cương thi HSK 2025. `tai-lieu/giao-trinh/` – sách 《新HSK教程》 bản 2026 (PDF ảnh scan,
  có bản quyền): CHỈ tham khảo cấu trúc (thứ tự bài, dạng đề thi), không chép nội dung; thư mục đã nằm trong
  `.gitignore` – không bao giờ đưa lên GitHub (kho công khai).
- "Theo sách" (caiDat.cheDoBai 'chu-de' | 'sach'): `data/theo-sach-hsk1.json` tạo từ `cong-cu/nguon-hsk1/theo-sach.txt`
  bằng `python -X utf8 cong-cu/tao-theo-sach.py`. Mã bài: số = bài chủ đề, 's3' = bài 3 của sách (du-lieu.js: timBaiTheoMa).
- Giai đoạn 5.2: `js/man-thi-thu.js` – thi thử HSK 1 mô phỏng (cấu trúc theo đề thi thử trong sách bài tập 《新HSK教程 1》:
  nghe 20 + đọc 20, 5 điểm/câu, đạt 120/200; lịch sử `tienDo.thiThu`). Dữ liệu `data/thi-thu-hsk1.json` tạo từ
  `cong-cu/nguon-thi-thu/` (tranh.txt + cap1-*.txt) bằng `python -X utf8 cong-cu/ghep-thi-thu.py`. Câu hỏi tự soạn,
  KHÔNG chép đề trong sách; nhóm hỏi–đáp / điền từ phải bảo đảm chỉ một đáp án đúng.
- Giai đoạn 5.1: `js/man-thong-ke.js` (chỉ đọc tiến độ; biểu đồ SVG tự vẽ, màu `--bd-1…5` đã kiểm tra mù màu).
- `CHAY-APP.bat` – chạy app trên máy (máy chủ nhỏ ở localhost). `HUONG-DAN.md` – hướng dẫn người dùng.

## Dữ liệu
- Sửa nguồn trong `cong-cu/nguon-hsk1/`, rồi chạy lại cả hai lệnh (không viết lại hai script này):
  ```
  python -X utf8 cong-cu/ghep-du-lieu-hsk1.py
  python -X utf8 cong-cu/kiem-tra-pinyin-vi-du.py
  ```
- Sau khi sửa từ vựng, chạy thêm `python -X utf8 cong-cu/tao-du-lieu-thanh-dieu.py` (chữ đa âm);
  thêm chữ mới cần nét thì chạy `python -X utf8 cong-cu/tai-du-lieu-viet.py` (cần mạng).
- Pinyin và từ loại lấy theo danh sách chính thức. Câu ví dụ tự đặt, không chép giáo trình.
- Pinyin của 不/一 ghi theo cách đọc đã biến điệu (bú, yí, yì); hai thanh 3 liền nhau vẫn ghi thanh 3.

## Quy tắc quan trọng
- **Tránh lỗi "Output blocked by content filtering policy"**: lỗi này xảy ra khi một lần trả lời
  viết ra khối lớn từ vựng/câu tiếng Trung. Vì vậy:
  - Không đưa danh sách từ hay câu tiếng Trung vào code; code luôn đọc từ file JSON.
  - Viết từng file một, mỗi lần vừa phải. Soạn dữ liệu mới mỗi lần ≤ 15 từ.
- Không làm mất tiến độ học đã lưu trong localStorage khi đổi cấu trúc dữ liệu (viết code chuyển đổi nếu cần).
- Mỗi khi sửa file trong `app/`, tăng `PHIEN_BAN` trong `app/sw.js` để điện thoại nhận bản mới;
  thêm file mới thì thêm vào danh sách `TAP_TIN`.
- Chỉ một phiên AI được sửa `app/` tại một thời điểm.
