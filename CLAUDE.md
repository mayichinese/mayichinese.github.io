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
  - Điều hướng 5 mục kiểu Duolingo: Hôm nay `#/` (nhiệm vụ 60 phút + nút Tiếp tục) · Bài học `#/bai` (lộ trình;
    trang bài = ① Từ mới ② Ngữ pháp của bài ③ Kiểm tra) · Ôn luyện `#/luyen-tap` (cần ôn + 4 kỹ năng) · Thi thử `#/thi-thu`
    · Tôi `#/toi` (thống kê + lối vào Cài đặt; `#/thong-ke` là địa chỉ cũ). Không có nút Cài đặt trên thanh trên cùng.
  - Giao diện: `js/app.js` (khởi động, chuyển màn hình), `js/giao-dien.js` (mảnh dùng chung, sáng/tối),
    mỗi màn hình một file `js/man-*.js`; `js/pinyin.js` tô màu thanh điệu (tắt được: caiDat.tatMauThanh → lớp body .khong-mau-thanh; chú thích CHU_THICH_MAU_THANH); `css/style.css` (biến màu
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
  Ngữ pháp cấp 2: `cong-cu/nguon-ngu-phap/cap2-*.txt` (thêm dòng `& N` = bài HSK 2) → `python -X utf8 cong-cu/ghep-ngu-phap.py 2`
  → `data/ngu-phap-hsk2.json`. Mã không trùng cấp 1 (tiến độ lưu chung). App gộp hai file, mỗi điểm có `cap`; chữ cho phép cấp 1–2.
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
- "Theo chủ đề" cho HSK 2, 3: `cong-cu/nguon-hskN/chu-de.txt` → `python -X utf8 cong-cu/tao-chu-de.py N` → `data/chu-de-hskN.json`
  (16 / 31 chủ đề). caiDat.cheDoBai CHUNG cho mọi cấp; mã bài chủ đề cấp ≥2 là 'c2-3', bài sách '2-3'. Ngữ pháp chỉ gắn bài sách.
- Giai đoạn 5.2: `js/man-thi-thu.js` – thi thử HSK 1 mô phỏng (cấu trúc theo đề thi thử trong sách bài tập 《新HSK教程 1》:
  nghe 20 + đọc 20, 5 điểm/câu, đạt 120/200; lịch sử `tienDo.thiThu`). Dữ liệu `data/thi-thu-hsk1.json` tạo từ
  `cong-cu/nguon-thi-thu/` (tranh.txt + cap1-*.txt) bằng `python -X utf8 cong-cu/ghep-thi-thu.py`. Câu hỏi tự soạn,
  KHÔNG chép đề trong sách; nhóm hỏi–đáp / điền từ phải bảo đảm chỉ một đáp án đúng.
- Thi thử HSK 2 (5.3): cùng `js/man-thi-thu.js` (cấu hình theo cấp CAU_HINH; mỗi câu có `kieu`: tranh3, chon, tranh6, ghep, dien,
  docHoi, boThu, vietChu). Nghe 25 + đọc 25 (25′) + viết 10 (10′, đồng hồ riêng, hết giờ thì khóa phần và chuyển tiếp);
  điểm: mỗi phần 100 (đúng ÷ số câu × 100), HSK 1 tổng 200/đạt 120, HSK 2–3 tổng 300/đạt 180 (cách chấm CTI; mức đạt là ước tính)
  – thangDiem()/diemCuaLan() tính lại cả lần thi cũ; lịch sử `tienDo.thiThu` có `cap` (HSK 1 lưu điểm phần, HSK 2–3 lưu số câu đúng). Dữ liệu `data/thi-thu-hsk2.json` từ `cong-cu/nguon-thi-thu/`
  (tranh2.txt + cap2-*.txt) bằng `python -X utf8 cong-cu/ghep-thi-thu-2.py`. Viết tay dùng Hanzi Writer, chữ thuộc 100 chữ cấp 1–2.
  Câu bộ thủ KHÔNG lấy lại 帮忙/红色/但是/不懂/点菜 của đề sách.
- Giai đoạn 5.3 (HSK 2: đủ 200 từ, 36 điểm ngữ pháp cấp 2, thi thử HSK 2 – XONG): `cong-cu/nguon-hsk2/phan-bai.txt` (200 từ chia theo 15 bài sách 《新HSK教程 2》,
  tên bài tự đặt) + `bai-NN.txt` (định dạng như HSK 1) → `python -X utf8 cong-cu/ghep-du-lieu-cap.py 2` → `app/data/hsk2.json`
  + `cong-cu/bao-cao-hsk2.txt` (đã gồm kiểm tra pinyin câu ví dụ; chữ cho phép = cấp 1–2). Từ chưa soạn không hiện, bài hiện
  "Đang soạn". Mã bài HSK 2 = '2-3' (du-lieu.js), khóa thẻ '2:<dạng gốc>'; mục trùng mặt chữ trong cùng cấp: `过(guo)`.
  Từ mới đi theo thứ tự HSK 1 → HSK 2. `tao-du-lieu-thanh-dieu.py` đọc mọi `hsk[0-9].json`. Soạn HSK 2: dừng báo sau mỗi 3 bài.
- Giai đoạn 5.4 (HSK 3 – XONG: 500 từ, 150 chữ viết tay cấp 3, 51 điểm ngữ pháp cấp 3, thi thử HSK 3): `cong-cu/nguon-hsk3/phan-bai.txt` (500 từ theo 18 bài sách 《新HSK教程 3》; 450 từ khớp
  bảng từ sách, 49 từ xếp tay theo chủ đề; mục trùng: `得(děi)`) + `bai-NN.txt` → `python -X utf8 cong-cu/ghep-du-lieu-cap.py 3`
  → `app/data/hsk3.json` (chữ cho phép cấp 1–3). Mã bài '3-5'. Chữ viết tay cấp 3 (150) XONG: `data/net-chu-hsk23.json` (khóa vietTay3 + nét của
  mọi chữ trong từ HSK 2–3; file 1 net-chu-hsk1.json giữ nguyên), net-chu.js gộp hai file; Luyện viết có chip Cấp 1–2 / Cấp 3,
  chữ mới hết cấp 1–2 mới sang cấp 3. Ngữ pháp cấp 3 XONG: 51 điểm `cap3-01…05.txt`
  (`ghep-ngu-phap.py 3` → `data/ngu-phap-hsk3.json`; danh sách điểm theo thứ tự bài sách, soạn song song rồi soát độc lập).
- Thi thử HSK 3 (5.4): cùng `js/man-thi-thu.js` (CAU_HINH[3], taoDe3; kiểu mới `xepCau`). Nghe 30 + đọc 30 (30′) + viết 10 (20′).
  Viết P2 của đề thật (nhìn tranh tự viết câu) đổi thành sắp xếp mảnh có từ cho sẵn – mọi thứ tự khác cũng đúng phải có dòng `~`.
  Điền từ hội thoại: hai lượt lời nối bằng ／. Dữ liệu `data/thi-thu-hsk3.json` từ `cong-cu/nguon-thi-thu/` (tranh3a/3b.txt + cap3-*.txt)
  bằng `python -X utf8 cong-cu/ghep-thi-thu-3.py`. Chữ 王, 京, 戴, 镜, 美, 油… nằm NGOÀI cấp 1–3 – không dùng (tên người: 小李, 小张, 李明).
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
