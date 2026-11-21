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
  - ĐỌC HIỂU (`js/man-doc-hieu.js`, `#/doc-hieu/<mã bài>`; bước cuối trang bài, mở khi xong chặng): nguồn soạn tay
    `cong-cu/nguon-doc-hieu/capN.txt` (định dạng ở đầu script; `$` = tên riêng cho phép) → `python -X utf8 cong-cu/ghep-doc-hieu.py N`
    → `data/doc-hieu-hskN.json`. Script BÁO LỖI nếu chữ Hán (câu, câu hỏi, đáp án) có từ chưa học tới bài (dùng chua_hoc() của
    kiem-tra-tu-chua-hoc.py) hoặc pinyin sai. Kết quả `tienDo.docHieu[mã]={diem,tot,lan,luc}`, ghiLuot('docHieu'). Soạn mỗi lần ≤ 3 bài.
    ĐÃ SOẠN ĐỦ 48 bài (HSK 1: 15, HSK 2: 15, HSK 3: 18) – nhiều file capN-*.txt được gộp; soạn song song thì mỗi người một file và
    kiểm tra bằng `ghep-doc-hieu.py N --chi-kiem <file>`. Xem từ/ngữ pháp một bài: `python -X utf8 cong-cu/tu-cua-bai.py <cấp> <bài>`.
    Tên riêng đã dùng: 小明, 小文, 小李, 小张, 李明, 李.
  - CHẠM TỪ XEM NGHĨA (`js/cham-tu.js`): htmlCauCham(câu, {danh, chiChuaHoc}) tách câu bằng từ điển HSK (tachChuoiHan: khớp dài nhất
    ≤4 chữ HAI CHIỀU, chọn ít đoạn → ít chữ lẻ → từ cấp thấp hơn → chiều phải sang; Python cùng thuật toán ở tach_chuoi),
    mỗi từ là nút data-xem-tu → moXemTu (app.js); từ chưa học gạch chân chấm. Dùng ở htmlMatSau, ngữ pháp, chặng, từ loại.
    Câu đang là câu hỏi dùng chiChuaHoc (không lộ đáp án). Luyện ngữ pháp đưa câu toàn từ đã học lên trước (cauDaBiet).
  - Danh sách ngữ pháp sắp theo cấp → bài sách (taiNguPhap); hocSauBai (bài chủ đề cũ) KHÔNG còn dùng.
  - Câu ngữ pháp phải chỉ dùng từ đã học tới bài của điểm (HSK 1: bài theo theo-sach; HSK 2–3: `& N`): kiểm tra bằng
    `python -X utf8 cong-cu/kiem-tra-tu-chua-hoc.py [cấp bài-bài]` → `cong-cu/bao-cao-tu-chua-hoc.txt` (cả số câu ví dụ từ dùng được
    cho chặng). Soạn lại dần, mỗi lần ≤ 15 câu, rồi chạy ghep-ngu-phap.py. ĐÃ SỬA: HSK 1 (cả 15 bài), HSK 2 (gei-gen → & 5, chu-vi-vi-ngu → & 11),
    HSK 3 (bo-ngu-muc-do → & 7, gioi-tu-3 → & 17) – TẤT CẢ 869 câu đã sạch (2026-11-20); câu mới phải giữ 0 lỗi. Điểm có từ khóa học muộn
    thì CHUYỂN BÀI trong theo-sach.txt (mục NGU PHAP, rồi tao-theo-sach.py): tu-de-hoi→3, ne-ba→7 (吧), hui-neng→8 (能),
    phuong-vi→9 (上/边), zenme→10 (怎么样), xiang-yao→11 (要), cau-khien-cam-than→14 (请/不要). Script coi là đã biết: chữ nằm trong từ đã học (没 ⊂ 没有),
    từ ghép mà mọi chữ là từ đơn đã học (这个, 他们), chữ lẻ có trong từ đã học (起 ⊂ 起床). Tránh cụm bị tách nhầm
    như 说的话 (app hiểu thành 的话 = nếu).
  - CẤU TRÚC BÀI HỌC (2026-11-20, theo yêu cầu người dùng): HSK → CHẶNG (= 1 bài giáo trình; nhanBai() = "Chặng N";
    trang #/bai/<mã>) → PHẦN (~5 từ, chiaChang) → CỬA (chỉ biểu tượng ⭐ từ / 🧩 ghép / 📖 đọc). `js/man-chang.js`:
    `#/cua/<mã>/<phần>/<cửa>`; `#/chang/<mã>/<phần>` (cũ) và `#/hoc-moi` chuyển tới cửa chưa xong đầu tiên (cuaTiepTheo).
    Cửa TỪ: giới thiệu → nghe→nghĩa → nghe→chữ → nói theo → tô từng chữ → nghĩa→chữ (+pinyin); câu sai hỏi lại tới khi đúng
    (tối đa 3 lần) → xong cửa từ mới vào SM-2 (0 sai → 1 ngày, 1–2 → 10 phút, ≥3 → 1 phút). Cửa GHÉP: ghép cặp + ôn từng từ
    + sắp xếp câu. Cửa ĐỌC: đọc câu → nghĩa. Tiến độ `tienDo.cua['<mã>/<phần>']=[cửa xong]`; đủ cửa → `tienDo.chang[mã]`
    thêm phần (tên biến cũ). Tương thích: phần trong tienDo.chang / từ đã học trước khi có cửa = xong. ghiLuot('cua'), ghiLuot('chang').
    "🔇 Tạm bỏ nói 30′" bỏ câu nói ở mọi cửa 30 phút. Âm thanh đúng/sai: `js/am-thanh.js` (Web Audio, caiDat.amHieuUng).
  - Thẻ từ (`js/man-the-tu.js`, #/on; chế độ 'moi' cũ không còn đường vào) APP TỰ CHẤM – KHÔNG còn lật thẻ / tự bấm Quên…Dễ: mỗi thẻ là câu hỏi 4 lựa chọn
    (`js/cau-hoi-tu.js`, dùng chung với trắc nghiệm: nghia | chu | nghe | pinyin). chamDiem(): sai → Quên, > 15 giây → Khó,
    nhanh (≈5–6 giây) → Dễ (thẻ 'hoc' chỉ ở buoc ≥ 1), còn lại Nhớ. Thẻ 'hoc' buoc 0 hỏi nghe/nghĩa, sau đó chữ/pinyin;
    `the.dangCuoi` để lần sau đổi dạng. Đã bỏ nút "Đã biết từ này".
  - `js/phien-hoc.js` (chọn thẻ tiếp theo), `js/phat-am.js` (Web Speech API zh-CN), `sw.js` (cache offline).
  - Điều hướng 5 mục (2026-11-21): Hôm nay `#/` · Bài học `#/bai` (lộ trình CHỈ theo bài sách; trang bài = các CHẶNG ~5 từ
    → Ngữ pháp của bài → Đọc hiểu → Kiểm tra; Ngữ pháp/Kiểm tra khóa tới khi xong chặng) · Luyện tập `#/luyen-tap` (cần ôn + kỹ năng: 4 ô Nghe/Nói/Đọc/Viết → `#/ky-nang/<nghe|noi|doc|viet>` (veKyNang, man-luyen-tap.js; Đọc liệt kê đọc hiểu các chặng đã xong từ) + ô Ngữ pháp
    + 🗂️ Ôn theo chủ đề `#/chu-de[/<mã>]` + 📋 Thi thử `#/thi-thu`) · Chữ & âm `#/chu-am`
    · Tôi `#/toi` (thống kê + lối vào Cài đặt; `#/thong-ke` là địa chỉ cũ). Không có nút Cài đặt trên thanh trên cùng.
    `#/bai/<mã chủ đề>` chuyển sang `#/chu-de/<mã>`. Màn chào 3 bước lần đầu (caiDat.daChao) ở man-trang-chu.js.
  - Mục tiêu phút do người học chọn: `caiDat.phutMoiNgay` (10/20/30/60; null = chưa chọn → Hôm nay hỏi). `phutMucTieu` (chia
    60 phút cho 5 phần) KHÔNG còn dùng làm mục tiêu. Đồng hồ `batDongHo` hiện tổng phút hôm nay / mục tiêu.
  - `js/nhiem-vu.js`: 3 nhiệm vụ/ngày ngẫu nhiên (hạt giống = ngày) từ 3 trong 4 nhóm (số lượng, thời gian, dạng bài, chính xác),
    không trùng chủ đề; lưu `nk.nhiemVu=[{ma,muc}]`, tiến độ tính từ bộ đếm nhật ký. Lượt bài xong gọi `ghiLuot(loai, dung, sai)`
    (luu-tru.js) → `nk.luot[loai]`, `nk.luotTot` (≥80%), `nk.luotHoanHao`. Nhiệm vụ tháng: số NGÀY làm đủ 3 nhiệm vụ, mục tiêu 20 (giảm nếu bắt đầu giữa tháng).
  - `js/cap-do.js`: mở khóa cấp dần – HSK N mở khi học hết từ cấp N−1, hoặc đạt thi thử cấp N−1 (học vượt), hoặc đã có từ cấp N
    (tiến độ cũ). Ghi `tienDo.capDaMo`. Khóa: học từ mới, bài, ngữ pháp, thi thử, chữ viết cấp 3 của cấp đang khóa.
  - `js/man-chu-am.js` (Chữ & âm): phiên âm (thanh, 23 âm đầu, 35 vần), 25 nét (18 + 7 nét ghép) + 10 quy tắc thứ tự nét, 49 bộ thủ; luyện 10 câu
    phiên âm / bộ thủ; tiến độ `tienDo.nenTang.dung/sai` theo "d:zh", "v:ang", "b:氵". Dữ liệu `data/nen-tang.json` tạo từ
    `cong-cu/nguon-nen-tang/*.txt` bằng `python -X utf8 cong-cu/tao-nen-tang.py` (cần makemeahanzi-dictionary.txt và
    Unihan_Readings.txt trong `cong-cu/tu-dien-doi-chieu/`; ví dụ nghe lấy tự động, bỏ chữ đa âm).
  - `js/man-tu-loai.js` (Từ loại & trật tự câu, `#/chu-am/tu-loai[/<mã>]`, tab thứ 4 của Chữ & âm): dữ liệu soạn tay `data/tu-loai.json`
    (13 loại; ví dụ TRỎ tới câu có sẵn {tu, so} – không chép câu mới; nguPhap = mã điểm). Kiểm tra: `python -X utf8 cong-cu/kiem-tra-tu-loai.py`
    (báo cả từ loại mới trong hsk*.json chưa có hướng dẫn). Nhãn từ loại trên thẻ = `nutTuLoai()` (giao-dien.js) → app.js `data-tu-loai` → moTuLoai().
  - Kế hoạch đang làm (duyệt 2026-11-20): A từ loại (XONG) → B Ôn luyện tự chấm bằng câu hỏi thật (XONG)
    → C bài = các chặng ~5 từ: Nghe → Nói theo → Viết → Ghép → Đọc, rồi Ngữ pháp, Đọc hiểu, Kiểm tra (XONG đợt 1) → D ngữ pháp mở sau từ vựng,
    chạm từ xem nghĩa (XONG), sửa câu có từ chưa học (XONG: 0/869) → E soạn đọc hiểu (XONG: 48 bài). Lộ trình CHỈ theo sách; "Theo chủ đề" thành danh mục tra cứu.
  - `js/man-luyen-noi.js` (Nói & phát âm, `#/luyen-noi[/doc-tu|doc-cau|nhac-lai|noi-nghia]`, trong ô 🗣️ Nói của "Luyện kỹ năng";
    nút "🎤 Đọc thử" trên mặt sau thẻ từ → moChamNhanh qua `data-noi-thu`). `js/nhan-giong.js`: Web Speech SpeechRecognition zh-CN
    (cần mạng) + MediaRecorder ghi âm tự chấm khi không có nhận dạng. `js/cham-phat-am.js`: dóng hàng chữ nghe được với câu đúng theo
    CÁCH ĐỌC (đồng âm cùng thanh = đúng, cùng âm khác thanh = ½), đổi số Ả Rập → chữ Hán. Bảng `data/am-doc.json` (8105 chữ
    kTGHZ2013) tạo bằng `python -X utf8 cong-cu/tao-am-doc.py` (cần Unihan_Readings.txt). Tiến độ `tienDo.noi` (tu/dung/sai theo
    âm tiết), `nk.noi` = số câu ≥ 70 điểm, ghiLuot('noi'); thời gian tính vào phần `nghe` ("Nghe & nói"). Nhiệm vụ `noi`/`luot-noi`
    chỉ giao khi máy có SpeechRecognition.
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
- "Theo sách" (từ 2026-11-20 lộ trình LUÔN theo sách – du-lieu.js cheDoBai() trả 'sach'; caiDat.cheDoBai bỏ không dùng): `data/theo-sach-hsk1.json` tạo từ `cong-cu/nguon-hsk1/theo-sach.txt`
  bằng `python -X utf8 cong-cu/tao-theo-sach.py`. Mã bài: số = bài chủ đề, 's3' = bài 3 của sách (du-lieu.js: timBaiTheoMa).
- "Theo chủ đề" cho HSK 2, 3: `cong-cu/nguon-hskN/chu-de.txt` → `python -X utf8 cong-cu/tao-chu-de.py N` → `data/chu-de-hskN.json`
  (16 / 31 chủ đề) – chỉ còn là DANH MỤC tra từ (chip cuối trang lộ trình; #/bai/5, #/bai/c2-3 hiện danh sách từ, không có chặng).
  Mã bài chủ đề cấp ≥2 là 'c2-3', bài sách '2-3'. Ngữ pháp chỉ gắn bài sách. nhanBai(): "Bài N" (sách) / "Chủ đề N".
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
  tên bài theo mục lục sách, dịch tiếng Việt – đổi 2026-11-20) + `bai-NN.txt` (định dạng như HSK 1) → `python -X utf8 cong-cu/ghep-du-lieu-cap.py 2` → `app/data/hsk2.json`
  + `cong-cu/bao-cao-hsk2.txt` (đã gồm kiểm tra pinyin câu ví dụ; chữ cho phép = cấp 1–2). Từ chưa soạn không hiện, bài hiện
  "Đang soạn". Mã bài HSK 2 = '2-3' (du-lieu.js), khóa thẻ '2:<dạng gốc>'; mục trùng mặt chữ trong cùng cấp: `过(guo)`.
  Từ mới đi theo thứ tự HSK 1 → HSK 2. `tao-du-lieu-thanh-dieu.py` đọc mọi `hsk[0-9].json`. Soạn HSK 2: dừng báo sau mỗi 3 bài.
- Giai đoạn 5.4 (HSK 3 – XONG: 500 từ, 150 chữ viết tay cấp 3, 52 điểm ngữ pháp cấp 3, thi thử HSK 3): `cong-cu/nguon-hsk3/phan-bai.txt` (500 từ theo 18 bài sách 《新HSK教程 3》; 450 từ khớp
  bảng từ sách, 49 từ xếp tay theo chủ đề; mục trùng: `得(děi)`) + `bai-NN.txt` → `python -X utf8 cong-cu/ghep-du-lieu-cap.py 3`
  → `app/data/hsk3.json` (chữ cho phép cấp 1–3). Mã bài '3-5'. Chữ viết tay cấp 3 (150) XONG: `data/net-chu-hsk23.json` (khóa vietTay3 + nét của
  mọi chữ trong từ HSK 2–3; file 1 net-chu-hsk1.json giữ nguyên), net-chu.js gộp hai file; Luyện viết có chip Cấp 1–2 / Cấp 3,
  chữ mới hết cấp 1–2 mới sang cấp 3. Ngữ pháp cấp 3 XONG: 52 điểm `cap3-01…05.txt` (thêm `you-zai` 又/再 ở bài 2, 2026-11-21)
  (`ghep-ngu-phap.py 3` → `data/ngu-phap-hsk3.json`; danh sách điểm theo thứ tự bài sách, soạn song song rồi soát độc lập).
- Thi thử HSK 3 (5.4): cùng `js/man-thi-thu.js` (CAU_HINH[3], taoDe3; kiểu mới `xepCau`). Nghe 30 + đọc 30 (30′) + viết 10 (20′).
  Viết P2 của đề thật (nhìn tranh tự viết câu) đổi thành sắp xếp mảnh có từ cho sẵn – mọi thứ tự khác cũng đúng phải có dòng `~`.
  Điền từ hội thoại: hai lượt lời nối bằng ／. Dữ liệu `data/thi-thu-hsk3.json` từ `cong-cu/nguon-thi-thu/` (tranh3a/3b.txt + cap3-*.txt)
  bằng `python -X utf8 cong-cu/ghep-thi-thu-3.py`. Chữ 王, 京, 戴, 镜, 美, 油… nằm NGOÀI cấp 1–3 – không dùng (tên người: 小李, 小张, 李明).
- Giai đoạn 5.1: `js/man-thong-ke.js` (chỉ đọc tiến độ; biểu đồ SVG tự vẽ, màu `--bd-1…5` đã kiểm tra mù màu).
- `CHAY-APP.bat` – chạy app trên máy (máy chủ nhỏ ở localhost). `HUONG-DAN.md` – hướng dẫn người dùng.

## Game hóa lộ trình (2026-11-21, theo đánh giá tester `tai-lieu/danh-gia-tester-2026-11-21.md`)
- `js/lo-trinh.js`: chặng mở theo thứ tự – chặng đầu của cấp đã mở; chặng sau mở khi chặng trước QUA KIỂM TRA (≥ 80%);
  chặng đã có tiến độ không bị khóa lại. Sao: ⭐ qua KT · ⭐⭐ + ngữ pháp & đọc hiểu xong · ⭐⭐⭐ + KT 100%.
  `viecTiepTheo()` = cửa chưa xong của chặng đang mở, hoặc kiểm tra nếu đã xong từ (dùng cho #/hoc-moi và nút Tiếp tục).
- `js/man-kiem-tra.js`: `#/kiem-tra/<mã>` (15 câu: từ + ≤ 4 câu điền từ ngữ pháp) và `#/kiem-tra/nhay/<mã>` (nhảy chặng: hỏi các
  chặng bị bỏ qua). Kết quả `tienDo.kiemTraChang[mã] = {tot, lan, luc, dat, nhay}`. `#/trac-nghiem/bai/<mã sách>` chuyển sang đây.
- Lộ trình `#/bai` là đường đi uốn lượn (nút tròn, tự cuộn tới chặng đang học, ☰ Mục lục). Cửa đúng < 60% (TI_LE_QUA_CUA,
  không tính phần Nói) thì chưa qua – vẫn ghi `tienDo.cua[k]` (mảng có thể rỗng) để luật tiến độ cũ không tự tính là xong.

- Ôn từ (`man-the-tu.js`): thẻ ÔN đôi khi hỏi NHỚ CHỦ ĐỘNG – ⌨️ gõ pinyin (dấu hoặc số thanh; 不/一 nhận cả thanh gốc) và
  ✍️ viết chữ không nét mờ (từ một chữ). `the.saiNgay` = ngày sai gần nhất (ở cửa hoặc khi ôn) → hôm đó không được chấm "Dễ".
  Cửa Đọc: đáp án nhiễu ưu tiên câu cùng từ → cùng phần → cùng chặng. Không có giọng đọc: câu 2 của cửa từ hỏi pinyin.
- NHẬP MÔN (cấp 0, chip đầu ở Bài học): `js/man-nhap-mon.js`, dữ liệu `cong-cu/nguon-nhap-mon/nhap-mon.txt` →
  `python -X utf8 cong-cu/tao-nhap-mon.py` → `data/nhap-mon.json` (6 chặng, cửa: hoc/nghe/cap/tu/noi/to/bo; dùng nen-tang.json).
  Tiến độ `tienDo.nhapMon = {cua, xong, boQua}`. HSK 1 · Chặng 1 mở khi `nhapMonXong()` (xong / qua kiểm tra bỏ qua 15 câu ≥ 80% /
  đã có tiến độ HSK 1). Địa chỉ: `#/nhap-mon[/<chặng>[/<phần>/<cửa>]]`, `#/nhap-mon/tiep`, `#/nhap-mon/bo-qua`.

- Tên chặng (2026-11-21): nguồn ghi `Tên chủ đề // Tên bài theo sách` (theo-sach.txt mục TEN BAI, phan-bai.txt cấp 2–3);
  du-lieu.js tách thành `b.ten` (chủ đề, hiện chính) + `b.tenSach`. Tên PHẦN = `chuDeChinh(tu)` (chủ đề nhiều từ nhất, lặp thì đánh số).
  Bảng mẫu thanh điệu cố định ở `@ mau-thanh` trong phien-am.txt (mā má mǎ mà ma). Giao diện gọi âm đầu = "thanh mẫu", vần = "vận mẫu".

## Soát chuyên môn 2026-11-21 (tai-lieu/Mayi Chinese – Các điểm cần chuyên gia xác nhận.md) – ĐÃ ÁP DỤNG, giữ nguyên khi soạn mới
- PINYIN CÂU (`cong-cu/quy-tac-pinyin.txt` + `python -X utf8 cong-cu/chuan-hoa-pinyin.py [--sua]`, chạy sau khi soạn câu mới, rồi ghép lại dữ liệu):
  bổ ngữ xu hướng kép sau động từ ghi 来/去 thanh nhẹ, viết rời khỏi động từ (kàn qǐlai); làm động từ chính giữ thanh gốc (huílái);
  động từ 1 âm tiết + bổ ngữ 1 âm tiết viết liền (zhǎodào, kànwán); động từ 2 âm tiết + bổ ngữ viết rời; 了/着/过 viết rời.
- Âm Hán Việt: chữ giản thể gộp nhiều chữ phồn thể → âm của chữ phồn thể đúng nghĩa (面=麵 miến, 只=隻 chích); 你 nhĩ, 吃 cật, 爸爸 bả bả, 爱好 ái hiếu.
- Chấm nói (`cham-phat-am.js`): đọc TỪ sai thanh → tối đa 60 (không đạt); 二/两 chỉ coi là một khi máy trả CHỮ SỐ; `nhacBienDieu()` nhắc
  biến điệu trước khi đọc; thống kê nói tính LẦN ĐỌC ĐẦU (`tienDo.noi.tu[k].dau`); "Nói theo nghĩa" chấp nhận từ đồng nghĩa (cùng nghĩa tiếng Việt).
- Thi thử: HSK 3 ẩn pinyin (CAU_HINH[3].anPinyin, viết P1 chỉ ghi pinyin chữ cần viết); học vượt = ≥ 70% tổng VÀ mọi phần ≥ 60
  (`datHocVuot`); mức đạt 60% ghi "ước tính theo kỳ thi cũ"; sau khi nộp HSK 3 có ô tự gõ câu (không tính điểm) ở Viết P2.
- Viết tay: số nét sai tối đa `saiToiDa(soNet)` (net-chu.js): ≤5 nét → 1, 6–9 → 2, ≥10 → 3 (thi thử, Luyện viết, cửa từ).
- Chữ đa âm nhiều mục (得 还 长 只 地 过): thẻ có dòng "Chữ này còn đọc là…" (`cachDocKhac`), loa đọc câu ví dụ (`tiengDoc(tu)` – dùng thay `tu.hanzi` khi phát âm một từ).
- Mục tiêu mặc định 30 phút; 10 phút = "Ôn tập, giữ chuỗi"; ước tính ngày xong HSK 3 = 250 giờ × phần từ còn lại (`duKienHsk3`, giao-dien.js).
- Chữ & âm: ví dụ nghe có TỪ HAI CHỮ (`vdTu`), mục "⚠️ Lưu ý cho người Việt" (`@ luu-y` trong phien-am.txt); 25 nét, 10 quy tắc, 49 bộ thủ.
- Bài sắp xếp: không cho 在+nơi chốn lên đầu câu (trừ nơi chốn trừu tượng); chủ ngữ A和/跟B phải chấp nhận cả B和/跟A;
  không chấp nhận phó từ trước chủ ngữ (trừ 都……了); hai mảnh giống hệt nhau thì ghep-thi-thu-3 báo lỗi.

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
- Mỗi khi sửa file trong `app/`, tăng `PHIEN_BAN` trong `app/sw.js` để điện thoại nhận bản mới (sw.js: bộ nhớ trước, KHÔNG tải lại
  ngầm – quên tăng PHIEN_BAN thì điện thoại không nhận; riêng localhost là mạng trước. index.html tải sẵn data/hsk*.json
  (window.__taiTruoc, du-lieu.js dùng lại); thời gian mở ghi ở khóa riêng `mayi-thoi-gian-mo`, xem Cài đặt → Thông tin kỹ thuật. app.js nghe `controllerchange` để tự tải lại khi vừa mở hoặc khi về trang Hôm nay);
  thêm file mới thì thêm vào danh sách `TAP_TIN`.
- Chỉ một phiên AI được sửa `app/` tại một thời điểm.
