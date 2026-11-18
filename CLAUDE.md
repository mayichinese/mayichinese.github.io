# Mayi Chinese – app học tiếng Trung HSK 3.0 (cá nhân)

## Tên và nhận diện
- Tên app: **Mayi Chinese** (mǎyǐ 蚂蚁 = con kiến). Tên ngắn trên màn hình điện thoại: "Mayi".
- Logo gốc: `avatar.jpg` (2048×2048): nền đỏ, chú kiến đỏ trong vòng tròn cam ở nửa trái, chữ
  "MAYI CHINESE" vàng ở nửa phải.
  - Icon app (favicon, icon 180/192/512, icon maskable): chỉ cắt phần vòng tròn chú kiến
    (khoảng x 230–1070, y 590–1460 trên ảnh gốc), đặt giữa nền đỏ cùng màu, chừa lề để
    vừa vùng an toàn của icon maskable. Ở cỡ nhỏ không đọc được chữ nên không đưa chữ vào icon.
  - Logo đầy đủ có chữ dùng cho màn hình giới thiệu/trang chủ.
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
  - `js/phien-hoc.js`, `js/giao-dien.js`, `js/phat-am.js` (Web Speech API zh-CN), `sw.js` (cache offline).
  - `data/hsk1.json`: dữ liệu HSK 1 (20 bài, 300 từ, 625 câu ví dụ) – **file được tạo tự động, không sửa tay**.
  - `data/chinh-thuc/`: danh sách từ và chữ Hán chính thức HSK 3.0, trích từ đề cương 2025.
- `demo-giao-dien/` – bản demo giao diện (tạm thời; sẽ ghép vào `app/` rồi xóa).
- `cong-cu/` – script tạo và kiểm tra dữ liệu. `cong-cu/nguon-hsk1/bai-*.txt` là nguồn soạn tay.
- `tai-lieu/` – PDF đề cương thi HSK 2025.
- `CHAY-APP.bat` – chạy app trên máy (máy chủ nhỏ ở localhost). `HUONG-DAN.md` – hướng dẫn người dùng.

## Dữ liệu
- Sửa nguồn trong `cong-cu/nguon-hsk1/`, rồi chạy lại cả hai lệnh (không viết lại hai script này):
  ```
  python -X utf8 cong-cu/ghep-du-lieu-hsk1.py
  python -X utf8 cong-cu/kiem-tra-pinyin-vi-du.py
  ```
- Pinyin và từ loại lấy theo danh sách chính thức. Câu ví dụ tự đặt, không chép giáo trình.

## Quy tắc quan trọng
- **Tránh lỗi "Output blocked by content filtering policy"**: lỗi này xảy ra khi một lần trả lời
  viết ra khối lớn từ vựng/câu tiếng Trung. Vì vậy:
  - Không đưa danh sách từ hay câu tiếng Trung vào code; code luôn đọc từ file JSON.
  - Viết từng file một, mỗi lần vừa phải. Soạn dữ liệu mới mỗi lần ≤ 15 từ.
- Không làm mất tiến độ học đã lưu trong localStorage khi đổi cấu trúc dữ liệu (viết code chuyển đổi nếu cần).
- Mỗi khi sửa file trong `app/`, tăng `PHIEN_BAN` trong `app/sw.js` để điện thoại nhận bản mới;
  thêm file mới thì thêm vào danh sách `TAP_TIN`.
- Chỉ một phiên AI được sửa `app/` tại một thời điểm.
