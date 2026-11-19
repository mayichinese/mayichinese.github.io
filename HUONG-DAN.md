# Hướng dẫn sử dụng app Mayi Chinese (Giai đoạn 1)

App chạy hoàn toàn trên trình duyệt, không cần đăng nhập, không cần mạng sau lần mở đầu tiên.
Tiến độ học được lưu **ngay trong trình duyệt của máy đang dùng**.

---

## 1. Chạy trên máy tính Windows

1. Mở thư mục `d:\Project\MayiChinese`.
2. **Bấm đúp vào file `CHAY-APP.bat`.**
3. Một cửa sổ đen hiện ra, và trình duyệt tự mở trang `http://localhost:8080/`.
4. Học xong thì **đóng cửa sổ đen** để tắt app.

Một số lỗi có thể gặp:

- **Windows hỏi "Windows protected your PC":** bấm *More info* → *Run anyway*. File này chỉ chạy máy chủ mini có sẵn trong Windows, không cài thêm gì.
- **Trình duyệt không tự mở:** tự mở Chrome hoặc Edge và gõ địa chỉ hiện trong cửa sổ đen, ví dụ `http://localhost:8080/`.
- **Không bấm đúp vào `index.html`:** mở kiểu đó thì trình duyệt sẽ chặn việc đọc dữ liệu từ vựng.
- **Bấm 🔊 mà không có tiếng:** máy chưa có giọng đọc tiếng Trung. Cài như sau: *Cài đặt (Settings) → Thời gian & ngôn ngữ → Ngôn ngữ & vùng → Thêm ngôn ngữ → 中文(中华人民共和国)*, nhớ tích chọn mục *Giọng nói / Text-to-speech*. Cài xong thì khởi động lại trình duyệt.

## 2. Dùng trên điện thoại (qua GitHub Pages, miễn phí)

Địa chỉ app: **<https://mayichinese.github.io>**

App được đặt trên GitHub Pages (miễn phí). Kho chứa code là `mayichinese/mayichinese.github.io`,
thuộc tổ chức `mayichinese` do tài khoản `duchoa1297` làm chủ. Kho để **Public** vì bản miễn phí
bắt buộc như vậy: người khác xem được code, nhưng **không** thấy tiến độ học (tiến độ chỉ nằm trong máy bạn).

**Cài lên điện thoại:** mở địa chỉ trên rồi
- **Android (Chrome):** menu ⋮ → **Thêm vào màn hình chính**.
- **iPhone (Safari):** nút Chia sẻ → **Thêm vào MH chính**.

App sẽ có biểu tượng **chú kiến Mayi** trên màn hình, tên ngắn là "Mayi", và chạy được cả khi không có mạng.

**Cập nhật app sau này:** chỉ cần đẩy code lên GitHub (nút *Sync Changes* trong VS Code, hoặc nhờ Claude).
GitHub sẽ tự lấy thư mục `app/` làm trang web sau khoảng 1–2 phút (file `.github/workflows/dang-trang-web.yml` lo việc này),
không cần kéo thả file bằng tay. Điện thoại tự nhận bản mới khi mở app lúc có mạng.

**Không đổi địa chỉ trang web:** tiến độ học lưu theo địa chỉ. Nếu đổi sang địa chỉ khác, phải
*Xuất file sao lưu* ở địa chỉ cũ rồi *Nhập* ở địa chỉ mới (xem mục 3).

## 3. Sao lưu và chuyển tiến độ giữa các máy

Tiến độ trên máy tính và trên điện thoại là **hai bản riêng**, không tự đồng bộ với nhau.

- **Sao lưu:** vào **Cài đặt** → **Xuất file sao lưu**. File `mayi-chinese-sao-luu-NGÀY.json` sẽ nằm trong thư mục Tải về. Nên sao lưu mỗi tuần; app sẽ nhắc nếu bạn quên.
  - File sao lưu cũ tên `hoc-hsk-sao-luu-….json` (từ trước khi đổi tên) vẫn nhập lại được bình thường.
- **Chuyển sang máy khác:** gửi file sao lưu sang máy kia (qua Zalo, email, Google Drive…) → mở app trên máy đó → **Cài đặt** → **Nhập file sao lưu**.
- Nhập file sẽ **thay thế** toàn bộ tiến độ trên máy đang dùng.
- **Không xóa dữ liệu duyệt web** của trình duyệt đang dùng app. Làm vậy sẽ mất tiến độ nếu bạn chưa sao lưu.

## 4. Cách học mỗi ngày

**Các mục chính** nằm ở thanh dưới đáy màn hình (điện thoại) hoặc cột bên trái (máy tính):

| Mục | Dùng để |
|---|---|
| 🏠 **Hôm nay** | Xem việc cần làm hôm nay, chuỗi ngày học liên tục, 7 ngày trong tuần, kế hoạch 60 phút |
| 📚 **Bài học** | Vào Ôn tập / Từ mới, chọn bài, tìm từ (chữ Hán, pinyin, nghĩa, Hán Việt) |
| ✏️ **Luyện tập** | Luyện thanh điệu, luyện viết, trắc nghiệm: **Sắp có** |
| 📊 **Thống kê** | **Sắp có** |

Hai nút ở góc trên bên phải: **🌙/☀️** chuyển nhanh giữa giao diện tối và sáng; nút **Cài đặt** (biểu tượng thanh trượt) mở phần cài đặt và sao lưu.
Mặc định app sáng/tối **theo máy**. Muốn quay lại chế độ này: **Cài đặt → Giao diện → Theo máy**.

**Màu thanh điệu:** pinyin và chữ Hán ở mặt sau thẻ được tô màu theo thanh, giúp nhớ thanh điệu:
thanh 1 **đỏ**, thanh 2 **cam**, thanh 3 **xanh lá**, thanh 4 **xanh dương**, thanh nhẹ **xám**.

Màn hình **Hôm nay** hiện 5 phần theo thứ tự. Giai đoạn 1 mới có phần 1 và 2. Nút **Bắt đầu** trên khung chào sẽ chọn sẵn việc nên làm tiếp theo.

1. **Ôn từ đến hạn (~15 phút):** app đưa ra chữ Hán trong ô chữ điền. Bạn tự nhớ lại cách đọc và nghĩa → chạm vào thẻ hoặc bấm **Lật thẻ** → tự chấm điểm:
   - **Quên:** không nhớ, sẽ hỏi lại sau vài phút.
   - **Khó:** nhớ ra nhưng rất chật vật.
   - **Nhớ:** nhớ được, cách ôn sẽ giãn ra.
   - **Dễ:** nhớ ngay, cách ôn giãn ra rất xa.

   Dưới mỗi nút có ghi thời gian đến lần ôn tiếp theo. Hết phiên, app hiện bảng tổng kết số lần Quên / Khó / Nhớ / Dễ.
2. **Học từ mới (~15 phút, mặc định 15 từ/ngày):** học lần lượt theo 20 bài chủ đề. Mỗi từ mới hiện đầy đủ thông tin trước (bấm **Đã hiểu – luyện tiếp**, hoặc **Đã biết từ này** nếu bạn đã thuộc), rồi được hỏi lại sau 1 phút và 10 phút. Mỗi lúc chỉ luyện tối đa 5 từ mới, để không bị ngợp. Muốn học từ mới của một bài cụ thể: **Bài học** → chọn bài → **Học từ mới của bài này**.

Khi đang học thẻ, góc trên có **đồng hồ** đếm số phút đã học cho phần đó (chỉ đếm khi bạn đang thao tác).

Trên máy tính có phím tắt: **Space** để lật thẻ, các số **1 2 3 4** tương ứng Quên / Khó / Nhớ / Dễ.

Đổi số từ mới mỗi ngày, tốc độ đọc, giọng đọc, giao diện sáng/tối, hoặc kiểu chữ viết tay (Khải thư) trong **Cài đặt**.

## 5. Dữ liệu từ vựng: kiểm tra và sửa

| Nội dung | Nguồn |
|---|---|
| Danh sách 300 từ HSK 1, pinyin, từ loại | Đề cương thi HSK 2025 (`tai-lieu/de-cuong-2025/HSK-de-cuong-thi-2025.pdf`), chép nguyên văn vào `app/data/chinh-thuc/` |
| Âm Hán Việt, nghĩa tiếng Việt, câu ví dụ, ghi chú | Soạn tay, nằm trong `cong-cu/nguon-hsk1/bai-01-05.txt` … `bai-20.txt` |
| Tra cứu thêm | [Hanzii](https://hanzii.net/?hl=vi). Mỗi thẻ trong app có link "Tra thêm trên Hanzii". |

Từ nào có dấu ⚠️ là chỗ còn **cần kiểm tra**. Danh sách các từ này nằm trong **Cài đặt → Dữ liệu từ vựng**.

**Cách sửa một từ:**

1. Mở file `cong-cu/nguon-hsk1/bai-XX.txt` bằng Notepad hoặc VS Code, rồi sửa.
   - `@` là dòng từ và âm Hán Việt.
   - `-` là một nghĩa (kèm từ loại).
   - `>` là câu ví dụ, dạng `chữ Hán | pinyin | dịch`.
   - `*` là ghi chú.
   - `?` là đánh dấu cần kiểm tra. Xóa dòng `?` khi bạn đã kiểm tra xong.
2. Mở cửa sổ lệnh tại thư mục `d:\Project\MayiChinese` và chạy **cả hai** lệnh sau, theo đúng thứ tự:
   ```
   python -X utf8 cong-cu/ghep-du-lieu-hsk1.py
   python -X utf8 cong-cu/kiem-tra-pinyin-vi-du.py
   ```
   - Lệnh thứ nhất tạo lại `app/data/hsk1.json`. Nó báo **LỖI** hoặc **CẢNH BÁO** nếu có, ví dụ sai từ loại so với danh sách chính thức, hoặc câu ví dụ dùng chữ ngoài cấp 1.
   - Lệnh thứ hai đối chiếu pinyin của từng câu ví dụ với từ điển CC-CEDICT. Nó báo **LỖI** khi pinyin không khớp chữ Hán, và **SAI THANH** khi dấu thanh khác từ điển. Kết quả ghi vào `cong-cu/bao-cao-pinyin-vi-du.txt`.
3. Tải lại trang app. Muốn điện thoại cũng có dữ liệu mới thì đẩy code lên GitHub.

Không nên sửa thẳng `app/data/hsk1.json`, vì lần chạy script sau sẽ ghi đè lên chỗ bạn đã sửa.

**Đối chiếu âm Hán Việt với Hanzii:** chạy `node cong-cu/doi-chieu-hanzii.mjs` (cần cài [Node.js](https://nodejs.org)). Kết quả nằm trong `cong-cu/bao-cao-hanzii.txt`.

## 6. Cấu trúc thư mục

```
Mayi Chinese/
├── CHAY-APP.bat            ← bấm đúp để chạy trên Windows
├── HUONG-DAN.md            ← file này
├── avatar.jpg              ← logo gốc Mayi Chinese
├── app/                    ← TOÀN BỘ app (thư mục này được đưa lên GitHub Pages)
│   ├── index.html
│   ├── css/style.css       ← giao diện chung, màu sáng/tối (theo logo)
│   ├── css/man-hinh.css    ← giao diện riêng từng màn hình
│   ├── icons/              ← icon chú kiến (cắt từ avatar.jpg)
│   ├── js/                 ← mã chương trình (có chú thích tiếng Việt)
│   │   ├── app.js          ← khởi động, chuyển màn hình
│   │   ├── giao-dien.js    ← mảnh giao diện dùng chung, sáng/tối
│   │   ├── man-trang-chu.js← màn hình Hôm nay
│   │   ├── man-the-tu.js   ← thẻ từ (flashcard)
│   │   ├── man-bai-hoc.js  ← Bài học, tìm từ, xem từ
│   │   ├── man-cai-dat.js  ← Cài đặt, sao lưu
│   │   ├── man-sap-co.js   ← Luyện tập, Thống kê (sắp có)
│   │   ├── pinyin.js       ← tô màu thanh điệu
│   │   ├── bieu-tuong.js   ← các biểu tượng
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
