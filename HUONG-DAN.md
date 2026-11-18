# Hướng dẫn sử dụng app Học HSK (Giai đoạn 1)

App chạy hoàn toàn trên trình duyệt, không cần đăng nhập, không cần mạng sau lần mở đầu tiên.
Tiến độ học được lưu **ngay trong trình duyệt của máy đang dùng**.

---

## 1. Chạy trên máy tính Windows

1. Mở thư mục `d:\Project\HocTieng`.
2. **Bấm đúp vào file `CHAY-APP.bat`.**
3. Một cửa sổ đen hiện ra, và trình duyệt tự mở trang `http://localhost:8080/`.
4. Học xong thì **đóng cửa sổ đen** để tắt app.

Một số lỗi có thể gặp:

- **Windows hỏi "Windows protected your PC":** bấm *More info* → *Run anyway*. File này chỉ chạy máy chủ mini có sẵn trong Windows, không cài thêm gì.
- **Trình duyệt không tự mở:** tự mở Chrome hoặc Edge và gõ địa chỉ hiện trong cửa sổ đen, ví dụ `http://localhost:8080/`.
- **Không bấm đúp vào `index.html`:** mở kiểu đó thì trình duyệt sẽ chặn việc đọc dữ liệu từ vựng.
- **Bấm 🔊 mà không có tiếng:** máy chưa có giọng đọc tiếng Trung. Cài như sau: *Cài đặt (Settings) → Thời gian & ngôn ngữ → Ngôn ngữ & vùng → Thêm ngôn ngữ → 中文(中华人民共和国)*, nhớ tích chọn mục *Giọng nói / Text-to-speech*. Cài xong thì khởi động lại trình duyệt.

## 2. Dùng trên điện thoại (qua GitHub Pages, miễn phí)

Điện thoại không chạy được file `.bat`, nên bạn đưa app lên một trang web miễn phí của GitHub.
Việc này chỉ cần làm một lần.

1. Vào <https://github.com> → **Sign up** để tạo tài khoản (cần email).
2. Bấm dấu **+** ở góc trên bên phải → **New repository**.
   - *Repository name*: ví dụ `hoc-hsk`.
   - Chọn **Public**. Bản miễn phí chỉ cho phép GitHub Pages với kho công khai. Người khác có link sẽ xem được app, nhưng **không** thấy tiến độ học của bạn.
   - Bấm **Create repository**.
3. Trong trang kho vừa tạo, bấm **uploading an existing file**.
4. Mở thư mục `d:\Project\HocTieng\app`, chọn **tất cả file và thư mục bên trong** (`index.html`, `css`, `js`, `data`, `icons`, `sw.js`, `manifest.webmanifest`) rồi **kéo thả** vào trang GitHub.
   - Chỉ kéo phần *bên trong* thư mục `app`, không kéo cả thư mục `app`.
   - Không cần tải thư mục `cong-cu` và `tai-lieu` lên.
5. Bấm **Commit changes** và đợi tải lên xong.
6. Vào **Settings** → **Pages** (menu bên trái) → mục *Branch* chọn **main** và **/ (root)** → **Save**.
7. Đợi 1–2 phút rồi tải lại trang. GitHub sẽ hiện địa chỉ dạng `https://<tên-tài-khoản>.github.io/hoc-hsk/`.
8. Mở địa chỉ đó trên điện thoại:
   - **Android (Chrome):** menu ⋮ → **Thêm vào màn hình chính**.
   - **iPhone (Safari):** nút Chia sẻ → **Thêm vào MH chính**.

   App sẽ có biểu tượng chữ 学 trên màn hình và chạy được cả khi không có mạng.

**Cập nhật app sau này:** tải lại đúng file đã thay đổi lên GitHub (ví dụ `data/hsk1.json`). File mới sẽ ghi đè file cũ, và điện thoại tự nhận bản mới khi có mạng.

## 3. Sao lưu và chuyển tiến độ giữa các máy

Tiến độ trên máy tính và trên điện thoại là **hai bản riêng**, không tự đồng bộ với nhau.

- **Sao lưu:** vào ⚙️ **Cài đặt** → **Xuất file sao lưu**. File `hoc-hsk-sao-luu-NGÀY.json` sẽ nằm trong thư mục Tải về. Nên sao lưu mỗi tuần; app sẽ nhắc nếu bạn quên.
- **Chuyển sang máy khác:** gửi file sao lưu sang máy kia (qua Zalo, email, Google Drive…) → mở app trên máy đó → ⚙️ **Cài đặt** → **Nhập file sao lưu**.
- Nhập file sẽ **thay thế** toàn bộ tiến độ trên máy đang dùng.
- **Không xóa dữ liệu duyệt web** của trình duyệt đang dùng app. Làm vậy sẽ mất tiến độ nếu bạn chưa sao lưu.

## 4. Cách học mỗi ngày

Màn hình **Hôm nay** hiện 5 phần theo thứ tự. Giai đoạn 1 mới có phần 1 và 2.

1. **Ôn từ đến hạn (~15 phút):** app đưa ra chữ Hán. Bạn tự nhớ lại cách đọc và nghĩa → **Xem đáp án** → tự chấm điểm:
   - **Quên:** không nhớ, sẽ hỏi lại sau vài phút.
   - **Khó:** nhớ ra nhưng rất chật vật.
   - **Nhớ:** nhớ được, cách ôn sẽ giãn ra.
   - **Dễ:** nhớ ngay, cách ôn giãn ra rất xa.

   Dưới mỗi nút có ghi thời gian đến lần ôn tiếp theo.
2. **Học từ mới (~15 phút, mặc định 15 từ/ngày):** học lần lượt theo 20 bài chủ đề. Mỗi từ mới hiện đầy đủ thông tin trước, rồi được hỏi lại sau 1 phút và 10 phút. Mỗi lúc chỉ luyện tối đa 5 từ mới, để không bị ngợp.

Trên máy tính có phím tắt: **Space** để lật thẻ, các số **1 2 3 4** tương ứng Quên / Khó / Nhớ / Dễ.

Đổi số từ mới mỗi ngày, tốc độ đọc, giọng đọc, hoặc kiểu chữ viết tay (Khải thư) trong ⚙️ **Cài đặt**.

## 5. Dữ liệu từ vựng: kiểm tra và sửa

| Nội dung | Nguồn |
|---|---|
| Danh sách 300 từ HSK 1, pinyin, từ loại | Đề cương thi HSK 2025 (`tai-lieu/de-cuong-2025/HSK-de-cuong-thi-2025.pdf`), chép nguyên văn vào `app/data/chinh-thuc/` |
| Âm Hán Việt, nghĩa tiếng Việt, câu ví dụ, ghi chú | Soạn tay, nằm trong `cong-cu/nguon-hsk1/bai-01-05.txt` … `bai-20.txt` |
| Tra cứu thêm | [Hanzii](https://hanzii.net/?hl=vi). Mỗi thẻ trong app có link "Tra thêm trên Hanzii". |

Từ nào có dấu ⚠️ là chỗ còn **cần kiểm tra**. Danh sách các từ này nằm trong ⚙️ **Cài đặt → Dữ liệu từ vựng**.

**Cách sửa một từ:**

1. Mở file `cong-cu/nguon-hsk1/bai-XX.txt` bằng Notepad hoặc VS Code, rồi sửa.
   - `@` là dòng từ và âm Hán Việt.
   - `-` là một nghĩa (kèm từ loại).
   - `>` là câu ví dụ, dạng `chữ Hán | pinyin | dịch`.
   - `*` là ghi chú.
   - `?` là đánh dấu cần kiểm tra. Xóa dòng `?` khi bạn đã kiểm tra xong.
2. Mở cửa sổ lệnh tại thư mục `d:\Project\HocTieng` và chạy **cả hai** lệnh sau, theo đúng thứ tự:
   ```
   python -X utf8 cong-cu/ghep-du-lieu-hsk1.py
   python -X utf8 cong-cu/kiem-tra-pinyin-vi-du.py
   ```
   - Lệnh thứ nhất tạo lại `app/data/hsk1.json`. Nó báo **LỖI** hoặc **CẢNH BÁO** nếu có, ví dụ sai từ loại so với danh sách chính thức, hoặc câu ví dụ dùng chữ ngoài cấp 1.
   - Lệnh thứ hai đối chiếu pinyin của từng câu ví dụ với từ điển CC-CEDICT. Nó báo **LỖI** khi pinyin không khớp chữ Hán, và **SAI THANH** khi dấu thanh khác từ điển. Kết quả ghi vào `cong-cu/bao-cao-pinyin-vi-du.txt`.
3. Tải lại trang app. Nếu dùng GitHub Pages thì tải lại file `data/hsk1.json` lên GitHub.

Không nên sửa thẳng `app/data/hsk1.json`, vì lần chạy script sau sẽ ghi đè lên chỗ bạn đã sửa.

**Đối chiếu âm Hán Việt với Hanzii:** chạy `node cong-cu/doi-chieu-hanzii.mjs` (cần cài [Node.js](https://nodejs.org)). Kết quả nằm trong `cong-cu/bao-cao-hanzii.txt`.

## 6. Cấu trúc thư mục

```
HocTieng/
├── CHAY-APP.bat            ← bấm đúp để chạy trên Windows
├── HUONG-DAN.md            ← file này
├── app/                    ← TOÀN BỘ app (thư mục này được đưa lên GitHub Pages)
│   ├── index.html
│   ├── css/style.css       ← giao diện
│   ├── js/                 ← mã chương trình (có chú thích tiếng Việt)
│   │   ├── app.js          ← khởi động
│   │   ├── giao-dien.js    ← các màn hình
│   │   ├── phien-hoc.js    ← chọn thẻ tiếp theo khi học/ôn
│   │   ├── lich-on.js      ← thuật toán lịch ôn (SM-2)
│   │   ├── luu-tru.js      ← lưu tiến độ, sao lưu
│   │   ├── du-lieu.js      ← đọc file từ vựng
│   │   └── phat-am.js      ← giọng đọc
│   ├── data/hsk1.json      ← dữ liệu từ vựng đã ghép (do script tạo ra)
│   ├── data/chinh-thuc/    ← danh sách chính thức HSK 1–3 (từ vựng, chữ Hán)
│   └── sw.js               ← giúp chạy offline
├── cong-cu/                ← công cụ tạo và kiểm tra dữ liệu (chạy trên máy tính)
│   ├── nguon-hsk1/         ← nội dung soạn tay của từng bài  ← SỬA Ở ĐÂY
│   ├── ghep-du-lieu-hsk1.py
│   ├── kiem-tra-pinyin-vi-du.py
│   ├── doi-chieu-hanzii.mjs
│   └── may-chu.ps1         ← máy chủ mini dùng cho CHAY-APP.bat
└── tai-lieu/               ← đề cương thi HSK 2025 (PDF gốc)
```
