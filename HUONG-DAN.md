# Hướng dẫn sử dụng app Mayi Chinese (Giai đoạn 4)

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
không cần kéo thả file bằng tay. Điện thoại tự nhận bản mới khi mở app lúc có mạng: app mở ngay bằng bản đã lưu trong máy, tải bản mới ở nền rồi tự chuyển sang (nếu đang làm bài thì đợi bạn về trang Hôm nay).

**Không đổi địa chỉ trang web:** tiến độ học lưu theo địa chỉ. Nếu đổi sang địa chỉ khác, phải
*Xuất file sao lưu* ở địa chỉ cũ rồi *Nhập* ở địa chỉ mới (xem mục 3).

## 3. Sao lưu và chuyển tiến độ giữa các máy

Tiến độ trên máy tính và trên điện thoại là **hai bản riêng**, không tự đồng bộ với nhau.

- **Sao lưu:** vào **Tôi → Cài đặt & sao lưu** → **Xuất file sao lưu**. File `mayi-chinese-sao-luu-NGÀY.json` sẽ nằm trong thư mục Tải về. Nên sao lưu mỗi tuần; app sẽ nhắc nếu bạn quên.
  - File sao lưu cũ tên `hoc-hsk-sao-luu-….json` (từ trước khi đổi tên) vẫn nhập lại được bình thường.
- **Chuyển sang máy khác:** gửi file sao lưu sang máy kia (qua Zalo, email, Google Drive…) → mở app trên máy đó → **Cài đặt** → **Nhập file sao lưu**.
- Nhập file sẽ **thay thế** toàn bộ tiến độ trên máy đang dùng.
- **Không xóa dữ liệu duyệt web** của trình duyệt đang dùng app. Làm vậy sẽ mất tiến độ nếu bạn chưa sao lưu.

## 4. Cách học mỗi ngày

**Các mục chính** nằm ở thanh dưới đáy màn hình (điện thoại) hoặc cột bên trái (máy tính):

| Mục | Dùng để |
|---|---|
| 🏠 **Hôm nay** | Trả lời câu hỏi "hôm nay học gì?": nút lớn **Tiếp tục** (app tự chọn việc nên làm tiếp), số phút đã học so với **mục tiêu bạn tự chọn**, chuỗi ngày học, **3 nhiệm vụ hằng ngày**, **nhiệm vụ tháng** và **bài đang học** |
| 📚 **Bài học** | **Lộ trình** học dạng đường đi: **Nhập môn** (7 chặng: học dần từng nhóm âm – mỗi chặng chỉ nghe, đọc những âm đã học – rồi nét chữ – học trước HSK 1, đã biết pinyin thì kiểm tra để bỏ qua), rồi chọn cấp (**HSK 1 / 2 / 3**, mỗi nút hiện % đã học), các bài nối nhau theo thứ tự, bài đang học tô đỏ, bài xong có dấu ✓. Tra từ (chữ Hán, pinyin, nghĩa, Hán Việt) ở ô tìm kiếm. Lộ trình đi theo thứ tự bài sách 《新HSK教程》 (HSK 1: 15 bài, HSK 2: 15 bài, HSK 3: 18 bài); cuối trang có **🗂️ Tra từ theo chủ đề** để xem từ theo nhóm nghĩa. Mở một chặng (= một bài giáo trình) sẽ thấy các **phần** (mỗi phần khoảng 5 từ, một hàng cửa ⭐ 🧩 📖) → **Ngữ pháp của chặng** → **Đọc hiểu** (một đoạn hội thoại / đoạn văn chỉ dùng từ đã học, có nút nghe cả bài, bật tắt pinyin và bản dịch, chạm từ xem nghĩa, rồi 3–4 câu hỏi) → **Kiểm tra bài**. Ngữ pháp, Đọc hiểu và Kiểm tra mở khi xong các phần, để mọi câu đều dùng từ bạn đã học; rồi danh sách từ |
| 🏋️ **Luyện tập** | **Cần ôn hôm nay**: từ vựng, ngữ pháp, chữ viết đến hạn và sổ câu sai – mỗi dòng bấm là vào ôn. **Luyện kỹ năng** theo 4 kỹ năng – mỗi ô mở danh sách bài: 🎧 Nghe (thanh điệu, nghe chọn chữ, nghe phiên âm), 🗣️ Nói (đọc từ, đọc câu, nghe & nhắc lại, nói theo nghĩa), 📖 Đọc (đọc hiểu các chặng đã học, trắc nghiệm chữ → nghĩa, nghĩa → chữ, pinyin), ✍️ Viết (viết chữ Hán, ôn chữ đến hạn, bộ thủ, nét); thêm ô 🧩 Ngữ pháp (thư viện 123 điểm HSK 1–3). **Chủ đề & thi thử**: 🗂️ Ôn theo chủ đề (từ theo nhóm nghĩa + trắc nghiệm chủ đề), 📋 Thi thử HSK 1–3 |
| 🔤 **Chữ & âm** | Nền tảng: **Phiên âm** (bảng thanh điệu, 23 thanh mẫu (âm đầu), 35 vận mẫu (vần) – chạm để nghe, có mẹo đọc so với tiếng Việt và phần ⚠️ Lưu ý cho người Việt; bài **Luyện nghe phiên âm** 10 câu), **Nét cơ bản** (25 nét + 10 quy tắc thứ tự nét, chạm để xem viết), **Bộ thủ** (49 bộ hay gặp, chữ ví dụ trong HSK 1–3 có tô màu bộ thủ; bài **Luyện bộ thủ** 10 câu), **Từ loại** (sơ đồ trật tự câu so với tiếng Việt + 13 từ loại: vị trí trong câu, công thức, lỗi người Việt hay nhầm, ngữ pháp liên quan). Ô chuyển vàng khi bạn đã đúng 5 lần. Trên thẻ từ, chạm vào nhãn từ loại (ví dụ **động từ ?**) để xem nhanh cách dùng từ đó trong câu |
| 👤 **Tôi** | Lối vào **Cài đặt & sao lưu**, chuỗi ngày học (hiện tại, dài nhất), biểu đồ số phút học 7 / 30 ngày, tiến độ từng cấp, tỉ lệ đúng, **những từ hay sai nhất**, chữ viết hay sai, thanh hay nhầm |

**🎨 Màu pinyin:** pinyin được tô màu theo thanh điệu: **đỏ** thanh 1 · **cam** thanh 2 · **xanh lá** thanh 3 · **xanh dương** thanh 4 · **xám** thanh nhẹ. Bảng chú thích ở Cài đặt (và trang Luyện thanh điệu); không thích thì bỏ chọn "Tô màu pinyin theo thanh điệu" trong Cài đặt.

Nút **🌙/☀️** ở góc trên bên phải chuyển nhanh giữa giao diện tối và sáng. **Cài đặt** (và sao lưu) nằm trong mục **Tôi**.
Mặc định app sáng/tối **theo máy**. Muốn quay lại chế độ này: **Cài đặt → Giao diện → Theo máy**.

**Màu thanh điệu:** pinyin và chữ Hán ở mặt sau thẻ được tô màu theo thanh, giúp nhớ thanh điệu:
thanh 1 **đỏ**, thanh 2 **cam**, thanh 3 **xanh lá**, thanh 4 **xanh dương**, thanh nhẹ **xám**.

**Mục tiêu mỗi ngày:** lần đầu mở app, trang **Hôm nay** hỏi bạn muốn học bao nhiêu phút mỗi ngày: **10** (thoải mái), **20** (vừa phải), **30** (nghiêm túc) hoặc **60** (chuyên sâu). Đổi lại lúc nào cũng được trong **Tôi → Cài đặt → Học tập**. Đồng hồ ⏱ khi học cho biết tổng số phút hôm nay so với mục tiêu.

**Nhiệm vụ hằng ngày:** mỗi ngày app giao **3 nhiệm vụ ngẫu nhiên**, mỗi cái một kiểu khác nhau – theo **số lượng** (vd. ôn 20 thẻ), **thời gian** (vd. học đủ 20 phút), **dạng bài** (vd. hoàn thành 1 bài ngữ pháp) hoặc **độ chính xác** (vd. 2 lượt đúng từ 80%). Nhiệm vụ hợp với trình độ hiện tại và to/nhỏ theo mục tiêu phút; chạm vào nhiệm vụ để làm ngay. Ngày mới (4 giờ sáng) có nhiệm vụ mới. **Nhiệm vụ tháng**: làm đủ cả 3 nhiệm vụ hằng ngày trong 20 ngày của tháng (bắt đầu giữa tháng thì mục tiêu ít ngày hơn).

**Mở khóa cấp HSK:** bắt đầu từ HSK 1; **HSK 2 mở khi bạn học hết HSK 1** hoặc **học vượt** bằng cách đạt bài **thi thử HSK 1** (từ 120/200). HSK 3 mở tương tự sau HSK 2. Cấp đang khóa hiện 🔒: vẫn xem được tên bài nhưng chưa học được từ, ngữ pháp, chữ viết cấp 3 và thi thử của cấp đó. Cấp đã mở thì không bao giờ bị khóa lại.

Nút **Tiếp tục** trên khung chào chọn sẵn việc nên làm: ôn thẻ đến hạn → học từ mới → nhiệm vụ chưa xong. Các phần học dưới đây vẫn vào được bất cứ lúc nào từ **Bài học**, **Luyện tập** và **Chữ & âm**.

**🎤 Nói & phát âm (chấm bằng micro):** vào **Luyện tập → Nói & phát âm**. Có 4 dạng: **Đọc từ**, **Đọc câu**, **Nghe & nhắc lại** (chỉ nghe, không nhìn chữ) và **Nói theo nghĩa** (nhìn nghĩa tiếng Việt, tự nói tiếng Trung). Bấm nút 🎤 màu vàng rồi đọc to: máy nghe, viết ra chữ Hán và chấm **từng chữ** – ô xanh là đúng, ô cam là **đúng âm nhưng sai thanh** (có ghi "bạn: shí" để biết bạn đã đọc thành gì), ô đỏ là sai hoặc thiếu. Điểm từ 70 trở lên là đạt; được thử lại nhiều lần, app giữ điểm cao nhất. Trên thẻ từ (mặt sau) cũng có nút **🎤 Đọc thử** để kiểm tra nhanh một từ.
- Cần **kết nối mạng** và cho phép app dùng micro (lần đầu điện thoại sẽ hỏi). Dùng tốt nhất trên **Chrome** (Android, máy tính). iPhone: dùng Safari và bật *Cài đặt → Cài đặt chung → Bàn phím → Đọc chính tả*. App không lưu giọng nói của bạn.
- Máy không chấm được (trình duyệt không hỗ trợ): bạn vẫn bấm 🎤 để **ghi âm**, nghe lại giọng mình, so với giọng mẫu và tự đánh giá.
- Cách chấm là "máy có nghe hiểu bạn nói không" (giống một người Trung nghe), nên đọc rõ và đủ to; nơi ồn ào điểm sẽ thấp hơn thực tế.

1. **Ôn từ đến hạn (~15 phút):** mỗi thẻ là **một câu hỏi thật** có 4 đáp án, lần lượt đổi dạng: nhìn chữ chọn nghĩa, đọc nghĩa chọn chữ, nghe chọn chữ, chọn pinyin đúng dấu thanh. Bạn **không phải tự chấm**: app chấm theo câu trả lời rồi xếp lịch ôn:
   - **Sai:** gặp lại sau vài phút.
   - **Đúng chậm** (quá 15 giây): ôn lại sớm hơn bình thường.
   - **Đúng:** khoảng cách ôn giãn ra.
   - **Đúng nhanh** (khoảng 5 giây): khoảng cách giãn ra rất xa.

   Trả lời xong, app hiện đáp án, lời chấm ("gặp lại sau 3 ngày"…) và đầy đủ thông tin của từ. Bấm **Tiếp tục** để sang câu sau. Hết phiên có bảng tổng kết.
2. **Học từ mới theo chặng – phần – cửa (mặc định 15 từ/ngày):** mỗi **chặng** là một bài của giáo trình; chặng chia thành các **phần** khoảng 5 từ; mỗi phần có một hàng **cửa** (chỉ có biểu tượng). Bấm **Học tiếp** ở trang Hôm nay để vào cửa đang chờ.
   - ⭐ **Cửa từ** (mỗi từ một cửa – nhớ xong từ này mới sang từ sau): nghe từ (xem đầy đủ nghĩa, ví dụ) → nghe chọn nghĩa → nghe chọn chữ → nói theo (máy chấm; ở nơi đông người bấm **🔇 Tạm bỏ nói 30′**) → tô từng chữ → nhìn nghĩa chọn chữ / chọn pinyin. **Câu nào sai sẽ được hỏi lại tới khi đúng.**
   - 🧩 **Cửa ghép**: ghép chữ với nghĩa cả phần, ôn từng từ, sắp xếp mảnh thành câu.
   - 📖 **Cửa đọc**: đọc câu ví dụ → chọn nghĩa.

   Trả lời đúng có tiếng "ting", sai có tiếng trầm (tắt trong **Cài đặt → Âm thanh khi trả lời đúng / sai**). **App tự chấm**: từ không sai lần nào sẽ ôn lại sau 1 ngày; từ còn sai gặp lại sau vài phút ở **Luyện tập**. Cửa đã qua có thể làm lại bất cứ lúc nào.

3. **Nghe & thanh điệu (~10 phút):** **Luyện tập → Nghe & thanh điệu**. Mỗi phiên 10 câu, app đọc bằng giọng tiếng Trung của máy. Có 5 dạng bài:
   - **Nghe 1 âm tiết:** nghe một chữ, chọn thanh 1–4.
   - **Thanh 2 hay thanh 3?:** cặp người Việt hay nhầm nhất.
   - **Từ 2 âm tiết:** chọn thanh cho âm 1 rồi âm 2 (có thanh nhẹ).
   - **Biến điệu 不 và 一:** chọn cách đọc đúng (bù/bú, yī/yí/yì) trong câu ví dụ.
   - **Hai thanh 3 liền nhau:** âm đầu đổi thành thanh 2 hay giữ thanh 3?

   Mỗi dạng có khung **📖 Quy tắc** giải thích ngắn. Câu sai được hỏi lại ở cuối phiên. Trang Luyện thanh điệu có **bảng thanh điệu** (chạm để nghe mẫu) và cho biết bạn **hay nhầm thanh nào với thanh nào**. Nút **🐢 Chậm** đọc chậm lại.
   Chữ có nhiều cách đọc được loại khỏi bài "nghe 1 âm tiết", vì giọng máy có thể đọc khác pinyin trong dữ liệu.
4. **Viết chữ Hán (~10 phút, mặc định 5 chữ mới/ngày):** **Luyện tập → Viết chữ Hán**. Luyện **100 chữ cần viết tay cấp 1–2** và **150 chữ cấp 3** theo đề cương HSK 2025 (chọn bằng nút **Cấp 1–2 / Cấp 3**; chữ mới đi hết cấp 1–2 rồi mới sang cấp 3). Chữ thuộc từ bạn đã học được xếp lên trước.
   - Chữ mới học qua 3 bước: **xem thứ tự nét** → **viết theo nét mờ** → **viết không nhìn** (chỉ có pinyin và nghĩa làm gợi ý).
   - Viết bằng ngón tay (điện thoại) hoặc chuột (máy tính), viết **đúng thứ tự nét**. Viết sai nét thì app báo, sai nhiều lần thì nét đúng tự sáng lên.
   - App **tự chấm** ở bước viết không nhìn: không sai nét nào → Nhớ; sai 1–3 nét → Khó; sai từ 4 nét hoặc bấm 💡 Gợi ý → Quên. Rồi app xếp lịch ôn lại như thẻ từ.
   - Chạm vào một chữ trong lưới 100 chữ để luyện riêng chữ đó.
   - Mặt sau mỗi thẻ từ và trang xem từ có nút **✍️ Cách viết** để xem thứ tự nét của mọi chữ HSK 1.
5. **Trắc nghiệm (~10 phút):** **Luyện tập → Trắc nghiệm từ**. Mỗi lượt 10 câu, mỗi câu 4 lựa chọn, hỏi các **từ bạn đã học** (cần ít nhất 4 từ). Có 4 dạng, hoặc **🔀 Trộn 4 dạng** (nên làm hằng ngày):
   - **Chữ Hán → nghĩa** · **Nghĩa → chữ Hán** · **Nghe → chọn chữ** · **Chữ Hán → pinyin**. Dạng cuối có các đáp án chỉ khác dấu thanh, nên phải nhớ đúng thanh.
   - Đáp án sai không bao giờ trùng nghĩa với đáp án đúng. Bài nghe không có hai lựa chọn đọc giống nhau.
   - **Câu sai:** từ đó vào **📒 Sổ câu sai**. Nếu từ đó đang ở lịch ôn thẻ từ thì **thẻ đến hạn ôn ngay hôm nay**. Câu sai còn được hỏi lại ở cuối lượt.
   - **Ôn câu sai:** chỉ hỏi các từ trong sổ. Một từ được xóa khỏi sổ khi bạn trả lời đúng **2 lượt liên tiếp**.
   - **Kiểm tra theo bài:** trong trang Trắc nghiệm chọn "Bài 1…20", hoặc vào **Bài học → chọn bài → ③ Kiểm tra bài**. Cách này hỏi cả những từ chưa học, hợp để tự kiểm tra trước hoặc sau khi học một bài.

   **Ngữ pháp** (cùng phần 5): **Luyện tập → 🧩 Ngữ pháp** (hoặc bước **Ngữ pháp của bài** trong trang bài – mở khi xong các chặng từ vựng). Có **35 điểm ngữ pháp HSK 1**, xếp theo thứ tự nên học, phủ hết các mục ngữ pháp cấp 1 trong đề cương 2025.
   - Mỗi điểm có một trang bài học: **công thức**, **giải thích ngắn**, **⚠️ lỗi người Việt hay mắc**, **ví dụ** (pinyin tô màu, nút nghe). Dòng "dùng từ đến Bài N" cho biết ví dụ cần từ vựng của bài nào.
   - **Luyện tập điểm này:** khoảng 7 câu, gồm **sắp xếp câu** (chạm từng mảnh theo đúng thứ tự, chạm lại để bỏ ra, rồi bấm Kiểm tra; có câu chấp nhận hai thứ tự) và **điền từ** (chọn 1 trong 4).
   - App **tự chấm và xếp lịch ôn**: điểm mới làm đúng từ 80% trở lên → ôn lại sau 4 ngày; dưới 80% → luyện lại sớm. Khi ôn: từ 80% → Nhớ, 50–80% → Khó, dưới 50% → Quên. Điểm đến hạn hiện ở **Cần ôn** và trên trang Hôm nay.
   - Ngữ pháp cấp 2–3 sẽ làm ở Giai đoạn 5, cùng với từ vựng HSK 2–3.

**📋 Thi thử HSK 1** (**Luyện tập → 📋 Thi thử**) – **đề mô phỏng, không phải đề chính thức**. Cấu trúc theo đề thi thử trong sách bài tập 《新HSK教程 1》 (2026):
- **Nghe 20 câu**: P1 nghe chọn 1 trong 3 tranh · P2 nghe câu, chọn câu đáp lại · P3 nghe câu, chọn tranh (A–F) · P4 nghe câu + câu hỏi, chọn đáp án. Mỗi câu được đọc **2 lần** (như thi thật); muốn được bấm nghe lại thì tích ô "Cho phép bấm nghe lại" trước khi thi.
- **Đọc 20 câu, 20 phút** (đồng hồ đếm ngược, hết giờ tự nộp): P1 đọc câu chọn tranh · P2 ghép hỏi–đáp · P3 điền từ (6 từ cho sẵn) · P4 đọc câu trả lời câu hỏi. Chữ Hán có **pinyin nhỏ phía trên** như đề cấp 1.
- Mỗi câu 5 điểm (mỗi phần 100), **tổng 200, đạt từ 120**. Nộp bài xong xem điểm từng phần và **xem lại từng câu** (đáp án đúng, pinyin, nghĩa). Lịch sử điểm lưu ở trang Thi thử và mục Tôi.
- **Tranh là biểu tượng (emoji)** – chỉ dùng cho những từ vẽ được rõ ràng (đồ ăn, đồ vật, nơi chốn, thời tiết, giờ…); từ trừu tượng nằm ở các câu dạng chữ. Mỗi lần thi là một đề khác (chọn ngẫu nhiên).

**Về thang điểm:** cách tính \"mỗi phần 100 điểm, cộng lại\" lấy theo hướng dẫn chấm điểm của 汉考国际 (cơ quan tổ chức thi HSK). Thang điểm chính thức của kỳ thi mới (từ 7/2026) chưa công bố, nên mức đạt 60% (120 / 180) chỉ là ước tính theo kỳ thi cũ. Lần thi cũ trong lịch sử được tự tính lại theo thang này.

**📋 Thi thử HSK 2** (trang Thi thử → chọn **HSK 2**) – cũng là đề mô phỏng, cấu trúc theo đề trong sách bài tập 《新HSK教程 2》 (60 câu, khoảng 55 phút):
- **Nghe 25 câu**: P1 nghe câu chọn 1 trong 3 tranh · P2 nghe hội thoại chọn tranh (A–F, hai nhóm) · P3 nghe hội thoại + câu hỏi, chọn đáp án.
- **Đọc 25 câu, 25 phút**: P1 đọc câu chọn tranh · P2 điền từ · P3 ghép hỏi–đáp (hai nhóm) · P4 đọc đoạn văn, trả lời câu hỏi ★.
- **Viết 10 câu, 10 phút**: P1 chữ bị thiếu một phần (hiện trong ô nét đứt), chọn phần còn thiếu (A–F) · P2 **viết tay** chữ còn thiếu vào ô (có pinyin cả câu). Viết đúng thứ tự nét; chữ đến 5 nét được sai 1 nét, 6–9 nét sai 2, từ 10 nét sai 3 vẫn tính đúng; không biết thì bấm "Không biết – bỏ qua".
- Phần Đọc và phần Viết có đồng hồ riêng; hết giờ phần Đọc thì tự chuyển sang phần Viết (không quay lại được), hết giờ phần Viết thì tự nộp bài.
- Điểm: mỗi phần nghe / đọc / viết tối đa **100 điểm** (số câu đúng ÷ số câu × 100), **tổng 300, đạt từ 180**.

**📋 Thi thử HSK 3** (trang Thi thử → chọn **HSK 3**) – đề mô phỏng, cấu trúc theo đề trong sách bài tập 《新HSK教程 3》 (70 câu, khoảng 75 phút):
- **Nghe 30 câu**: P1 nghe hội thoại chọn tranh (hai nhóm: 6 tranh và 5 tranh) · P2 nghe hội thoại + câu hỏi, chọn đáp án · P3 nghe một đoạn nói + câu hỏi, chọn đáp án.
- **Đọc 30 câu, 30 phút**: P1 chọn câu đáp lại phù hợp (hai nhóm) · P2 điền từ (5 câu + 5 hội thoại) · P3 đọc đoạn văn trả lời câu hỏi ★ (hai đoạn cuối mỗi đoạn có 2 câu hỏi).
- **Viết 10 câu, 20 phút**: P1 **viết tay** chữ còn thiếu (có pinyin cả câu) · P2 nhìn tranh và từ cho sẵn, **chạm các mảnh theo đúng thứ tự** để thành câu (bấm vào mảnh đã xếp để bỏ ra, "Xếp lại" để làm lại). Đề thật yêu cầu tự viết câu; app đổi thành sắp xếp để tự chấm được.
- Đồng hồ và cách tính điểm (mỗi phần 100, tổng 300, đạt từ 180) giống HSK 2.

Khi đang học, góc trên có **đồng hồ** đếm số phút đã học cho phần đó (chỉ đếm khi bạn đang thao tác).

Trên máy tính có phím tắt: **Space** để nghe lại (câu nghe, bài thanh điệu), các số **1 2 3 4** để chọn đáp án (thẻ từ, trắc nghiệm) hoặc chọn thanh; **Enter** sang câu tiếp.

Đổi số từ mới mỗi ngày, số chữ viết mới mỗi ngày, tốc độ đọc, giọng đọc, giao diện sáng/tối, hoặc kiểu chữ viết tay (Khải thư) trong **Cài đặt**.

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

**Dữ liệu luyện viết và thanh điệu (tạo tự động, không sửa tay):**
- `app/data/net-chu-hsk1.json`, `app/data/net-chu-hsk23.json` (thứ tự nét; file 2 gồm 150 chữ viết tay cấp 3 và chữ của từ HSK 2–3) và `app/lib/hanzi-writer.min.js` (thư viện vẽ nét): tạo bằng
  `python -X utf8 cong-cu/tai-du-lieu-viet.py` (cần mạng). Chỉ cần chạy lại khi thêm cấp HSK mới.
  Dữ liệu nét lấy từ dự án Make Me a Hanzi (giấy phép Arphic, xem `app/data/GIAY-PHEP-net-chu.txt`).
- `app/data/thanh-dieu-hsk1.json` (chữ đa âm): tạo bằng `python -X utf8 cong-cu/tao-du-lieu-thanh-dieu.py`.
  Chạy lại sau khi sửa dữ liệu từ vựng.

**Dữ liệu thi thử HSK 2:** `cong-cu/nguon-thi-thu/tranh2.txt` (tranh emoji + câu kể + hội thoại; cách viết ở đầu file) và `cap2-01.txt` … `cap2-04.txt` (hỏi–đáp, điền từ, hội thoại + câu hỏi, đoạn văn, bộ thủ, viết chữ – cách viết ở đầu `cong-cu/ghep-thi-thu-2.py`). Sửa xong chạy `python -X utf8 cong-cu/ghep-thi-thu-2.py` → tạo `app/data/thi-thu-hsk2.json`.

**Dữ liệu thi thử HSK 3:** `cong-cu/nguon-thi-thu/tranh3a.txt`, `tranh3b.txt` (tranh emoji + hội thoại + câu sắp xếp) và `cap3-01.txt` … `cap3-05.txt` (ghép câu, viết chữ, điền từ, hội thoại + câu hỏi, đoạn văn – cách viết ở đầu `cong-cu/ghep-thi-thu-3.py`). Sửa xong chạy `python -X utf8 cong-cu/ghep-thi-thu-3.py` → tạo `app/data/thi-thu-hsk3.json`. Câu sắp xếp: mọi thứ tự khác cũng đúng phải thêm dòng `~`.

**Dữ liệu thi thử:** `cong-cu/nguon-thi-thu/tranh.txt` (từ → emoji) và `cap1-01.txt` … `cap1-04.txt` (nhóm hỏi–đáp, nhóm điền từ, câu hỏi theo câu – soạn tay, cách viết ở đầu `cong-cu/ghep-thi-thu.py`). Sửa xong chạy `python -X utf8 cong-cu/ghep-thi-thu.py` → tạo `app/data/thi-thu-hsk1.json`. Khi soạn thêm: trong một nhóm hỏi–đáp, mỗi câu trả lời chỉ được khớp đúng một câu hỏi; trong một nhóm điền từ, mỗi từ chỉ điền vừa đúng một câu.

**Thứ tự bài theo sách:** `cong-cu/nguon-hsk1/theo-sach.txt` ghi pinyin + số bài của từng từ (chép từ bảng từ cuối sách 《新HSK教程 1》) và bài sách của từng điểm ngữ pháp (gần đúng). Sửa xong chạy `python -X utf8 cong-cu/tao-theo-sach.py` → tạo `app/data/theo-sach-hsk1.json` (báo cáo ở `cong-cu/bao-cao-theo-sach.txt`).

**Chia bài theo chủ đề HSK 2, 3:** sửa `cong-cu/nguon-hsk2/chu-de.txt` hoặc `cong-cu/nguon-hsk3/chu-de.txt` (mỗi dòng: số bài | tên chủ đề | các từ), rồi chạy `python -X utf8 cong-cu/tao-chu-de.py 2` (hoặc `3`) → `app/data/chu-de-hsk2.json` / `chu-de-hsk3.json`. Script báo lỗi nếu có từ bị sót hoặc lặp.

**Từ vựng HSK 3:** giống HSK 2 nhưng ở `cong-cu/nguon-hsk3/` (18 bài theo sách 《新HSK教程 3》), chạy `python -X utf8 cong-cu/ghep-du-lieu-cap.py 3` (báo cáo ở `cong-cu/bao-cao-hsk3.txt`). Hai mục cùng viết 得: `得` = dé (được), `得(děi)` = phải.

**Từ vựng HSK 2:** soạn tay trong `cong-cu/nguon-hsk2/bai-01.txt` … (cùng cách viết như HSK 1). `phan-bai.txt` chia 200 từ theo 15 bài của sách 《新HSK教程 2》 (tên bài tự đặt). Hai mục cùng viết 过 được phân biệt: `过` = guò, `过(guo)` = trợ từ. Sửa xong chạy:
   ```
   python -X utf8 cong-cu/ghep-du-lieu-cap.py 2
   python -X utf8 cong-cu/tao-du-lieu-thanh-dieu.py
   ```
   Lệnh thứ nhất tạo `app/data/hsk2.json` và kiểm tra luôn: từ loại, chữ ngoài cấp 1–2, pinyin câu ví dụ (so với CC-CEDICT). Báo cáo ở `cong-cu/bao-cao-hsk2.txt`. Từ chưa soạn sẽ không hiện trong app.

**Dữ liệu ngữ pháp:** soạn tay trong `cong-cu/nguon-ngu-phap/cap1-01.txt` … `cap1-07.txt` (mỗi file 5 điểm; cách viết ghi ở đầu file `cong-cu/ghep-ngu-phap.py`). Sửa xong chạy:
   ```
   python -X utf8 cong-cu/ghep-ngu-phap.py
   ```
   Script kiểm tra chữ ngoài cấp 1, pinyin (so với CC-CEDICT), biến điệu 不/一, mảnh sắp xếp và đáp án điền từ, rồi tạo `app/data/ngu-phap-hsk1.json`.
   **Ngữ pháp HSK 3:** 51 điểm trong `cong-cu/nguon-ngu-phap/cap3-01.txt` … `cap3-05.txt`, chạy `python -X utf8 cong-cu/ghep-ngu-phap.py 3` → `app/data/ngu-phap-hsk3.json`.
   **Ngữ pháp HSK 2:** soạn trong `cong-cu/nguon-ngu-phap/cap2-01.txt` … (thêm dòng `& số bài` = bài HSK 2 của điểm đó), chạy `python -X utf8 cong-cu/ghep-ngu-phap.py 2` → tạo `app/data/ngu-phap-hsk2.json`, báo cáo ở `cong-cu/bao-cao-ngu-phap-hsk2.txt`. Mã điểm cấp 2 không được trùng mã cấp 1 (script tự kiểm tra). Có **LỖI** thì không ghi file. Báo cáo nằm ở `cong-cu/bao-cao-ngu-phap.txt`. Không sửa mã điểm (dòng `## mã`) của điểm đã học, vì lịch ôn gắn theo mã đó.

**Đối chiếu âm Hán Việt với Hanzii:** chạy `node cong-cu/doi-chieu-hanzii.mjs` (cần cài [Node.js](https://nodejs.org)). Kết quả nằm trong `cong-cu/bao-cao-hanzii.txt`.

## 6. Cấu trúc thư mục

```
MayiChinese/
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
│   │   ├── man-trang-chu.js← màn hình Hôm nay (nhiệm vụ hôm nay)
│   │   ├── man-the-tu.js   ← thẻ từ (flashcard)
│   │   ├── man-bai-hoc.js  ← Bài học (lộ trình, 3 bước mỗi bài), tìm từ, xem từ
│   │   ├── man-cai-dat.js  ← Cài đặt, sao lưu
│   │   ├── man-luyen-tap.js← trang chọn bài luyện
│   │   ├── man-thanh-dieu.js ← luyện thanh điệu
│   │   ├── man-luyen-viet.js ← luyện viết chữ Hán, hộp "Cách viết"
│   │   ├── net-chu.js      ← vẽ thứ tự nét (dùng thư viện Hanzi Writer)
│   │   ├── man-trac-nghiem.js ← trắc nghiệm, sổ câu sai, kiểm tra theo bài
│   │   ├── man-ngu-phap.js ← ngữ pháp: bài học, sắp xếp câu, điền từ
│   │   ├── man-thong-ke.js ← mục Tôi: thống kê (biểu đồ phút học, từ hay sai…)
│   │   ├── man-thi-thu.js  ← Thi thử HSK 1 (40 câu), HSK 2 (60 câu), HSK 3 (70 câu) – đề mô phỏng
│   │   ├── pinyin.js       ← tô màu thanh điệu, tách âm tiết
│   │   ├── bieu-tuong.js   ← các biểu tượng
│   │   ├── phien-hoc.js    ← chọn thẻ tiếp theo khi học/ôn
│   │   ├── lich-on.js      ← thuật toán lịch ôn (SM-2)
│   │   ├── luu-tru.js      ← lưu tiến độ, sao lưu
│   │   ├── du-lieu.js      ← đọc file từ vựng
│   │   └── phat-am.js      ← giọng đọc
│   ├── data/hsk1.json      ← dữ liệu từ vựng đã ghép (do script tạo ra)
│   ├── data/chinh-thuc/    ← danh sách chính thức HSK 1–3 (từ vựng, chữ Hán)
│   ├── data/net-chu-hsk1.json   ← thứ tự nét chữ HSK 1 + 100 chữ viết tay cấp 1–2 (do script tạo ra)
│   ├── data/net-chu-hsk23.json  ← thứ tự nét chữ HSK 2–3 + 150 chữ viết tay cấp 3 (do script tạo ra)
│   ├── data/thanh-dieu-hsk1.json← chữ đa âm cho bài thanh điệu (do script tạo ra)
│   ├── data/ngu-phap-hsk1.json  ← 35 điểm ngữ pháp HSK 1 (do script tạo ra)
│   ├── lib/                ← thư viện Hanzi Writer (vẽ và chấm nét chữ)
│   └── sw.js               ← giúp chạy offline
├── cong-cu/                ← công cụ tạo và kiểm tra dữ liệu (chạy trên máy tính)
│   ├── nguon-hsk1/         ← nội dung soạn tay của từng bài  ← SỬA Ở ĐÂY
│   ├── nguon-hsk2/         ← từ vựng HSK 2 soạn tay (phan-bai.txt + bai-01 …)  ← SỬA Ở ĐÂY
│   ├── ghep-du-lieu-cap.py ← ghép + kiểm tra từ vựng HSK 2 (và 3 sau này)
│   ├── nguon-ngu-phap/     ← ngữ pháp soạn tay (cap1-01 … cap1-07)  ← SỬA Ở ĐÂY
│   ├── ghep-ngu-phap.py    ← ghép + kiểm tra ngữ pháp
│   ├── ghep-du-lieu-hsk1.py
│   ├── kiem-tra-pinyin-vi-du.py
│   ├── tai-du-lieu-viet.py ← tải thư viện + dữ liệu nét chữ
│   ├── tao-du-lieu-thanh-dieu.py ← đánh dấu chữ đa âm
│   ├── tao-theo-sach.py    ← ghép từ / ngữ pháp với bài của sách 《新HSK教程 1》
│   ├── nguon-thi-thu/      ← tranh + ngân hàng câu hỏi thi thử (soạn tay)
│   ├── ghep-thi-thu.py     ← ghép + kiểm tra dữ liệu thi thử HSK 1
│   ├── ghep-thi-thu-2.py   ← ghép + kiểm tra dữ liệu thi thử HSK 2
│   ├── ghep-thi-thu-3.py   ← ghép + kiểm tra dữ liệu thi thử HSK 3
│   ├── doi-chieu-hanzii.mjs
│   └── may-chu.ps1         ← máy chủ mini dùng cho CHAY-APP.bat
└── tai-lieu/               ← đề cương thi HSK 2025 (PDF gốc)
```
