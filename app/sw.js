// =========================================================
// SERVICE WORKER – giúp app chạy được khi KHÔNG có mạng.
// Cách làm trên điện thoại / trang web: "bộ nhớ trước" → mở app gần như tức thì, không tốn mạng
//   - Lấy thẳng bản đã cất trong máy (KHÔNG tải lại mỗi lần mở – tiết kiệm mạng và bộ nhớ máy).
//   - Có bản mới: trình duyệt tự thấy sw.js đổi (vì tăng PHIEN_BAN) → cài bản mới ở nền, tải trọn bộ file,
//     rồi app.js tự tải lại trang. ⇒ SỬA FILE TRONG app/ MÀ QUÊN TĂNG PHIEN_BAN THÌ ĐIỆN THOẠI KHÔNG NHẬN.
//   - Mất mạng: vẫn chạy bằng bản đã cất.
// Trên máy tính khi chạy CHAY-APP.bat (localhost): "mạng trước" như cũ, sửa file JSON là thấy ngay.
// Phông chữ Google (Lexend, Noto Sans): lấy từ bộ nhớ trước, chưa có mới tải
// (phông không đổi nên không cần tải lại).
// Khi thêm file mới vào app, nhớ thêm vào danh sách TAP_TIN và tăng PHIEN_BAN.
// =========================================================

// Tên bộ nhớ đệm (chỉ chứa file của app, KHÔNG chứa tiến độ học – tiến độ nằm ở localStorage)
const PHIEN_BAN = 'mayi-v47';
const BO_NHO_PHONG = 'mayi-phong-chu-v1';  // phông chữ – giữ qua các phiên bản
const TAP_TIN = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './css/man-hinh.css',
  './js/app.js',
  './js/giao-dien.js',
  './js/bieu-tuong.js',
  './js/pinyin.js',
  './js/man-trang-chu.js',
  './js/man-the-tu.js',
  './js/man-bai-hoc.js',
  './js/man-cai-dat.js',
  './js/man-thong-ke.js',
  './js/man-luyen-tap.js',
  './js/man-luyen-viet.js',
  './js/net-chu.js',
  './js/man-thanh-dieu.js',
  './js/man-trac-nghiem.js',
  './js/cap-do.js',
  './js/nhiem-vu.js',
  './js/man-chu-am.js',
  './js/man-tu-loai.js',
  './js/cau-hoi-tu.js',
  './js/man-chang.js',
  './js/lo-trinh.js',
  './js/man-kiem-tra.js',
  './js/am-thanh.js',
  './js/cham-tu.js',
  './js/man-doc-hieu.js',
  './data/doc-hieu-hsk1.json',
  './data/doc-hieu-hsk2.json',
  './data/doc-hieu-hsk3.json',
  './data/tu-loai.json',
  './data/nen-tang.json',
  './js/man-luyen-noi.js',
  './js/cham-phat-am.js',
  './js/nhan-giong.js',
  './data/am-doc.json',
  './js/man-ngu-phap.js',
  './data/ngu-phap-hsk1.json',
  './data/ngu-phap-hsk2.json',
  './data/ngu-phap-hsk3.json',
  './data/theo-sach-hsk1.json',
  './data/thi-thu-hsk1.json',
  './data/thi-thu-hsk2.json',
  './data/thi-thu-hsk3.json',
  './js/man-thi-thu.js',
  './data/thanh-dieu-hsk1.json',
  './lib/hanzi-writer.min.js',
  './data/net-chu-hsk1.json',
  './data/net-chu-hsk23.json',
  './js/phien-hoc.js',
  './js/lich-on.js',
  './js/luu-tru.js',
  './js/du-lieu.js',
  './js/phat-am.js',
  './data/hsk1.json',
  './data/hsk2.json',
  './data/hsk3.json',
  './data/chu-de-hsk2.json',
  './data/chu-de-hsk3.json',
  './icons/favicon.ico',
  './icons/favicon-32.png',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
];
const NGUON_PHONG = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];

// Lần đầu cài: tải sẵn mọi file
// (cache: 'reload' = bỏ qua bộ nhớ tạm HTTP của trình duyệt, chắc chắn lấy bản mới nhất trên máy chủ)
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(PHIEN_BAN)
    .then((c) => c.addAll(TAP_TIN.map((f) => new Request(f, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

const MAY_NHA = ['localhost', '127.0.0.1'].includes(self.location.hostname);

// Xóa bộ nhớ của phiên bản cũ (giữ lại bộ nhớ phông chữ)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ds) => Promise.all(ds.filter((k) => k !== PHIEN_BAN && k !== BO_NHO_PHONG).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const nguon = new URL(req.url).origin;

  // Phông chữ Google: bộ nhớ trước, chưa có thì tải về rồi cất
  if (NGUON_PHONG.includes(nguon)) {
    e.respondWith(
      caches.open(BO_NHO_PHONG).then((c) => c.match(req).then((daCo) => daCo || fetch(req).then((res) => {
        if (res.ok) c.put(req, res.clone());
        return res;
      }))),
    );
    return;
  }

  // Chỉ xử lý file của chính app (bỏ qua link ngoài như Hanzii)
  if (nguon !== location.origin) return;

  if (!MAY_NHA) {
    // Bộ nhớ trước; chưa có (file lạ) thì tải về rồi cất
    e.respondWith(
      caches.match(req, { ignoreSearch: true }).then((daCo) => daCo || fetch(req).then(async (res) => {
        if (res.ok) await (await caches.open(PHIEN_BAN)).put(req, res.clone());
        return res;
      }).catch(() => caches.match('./index.html'))),
    );
    return;
  }

  // Máy nhà (localhost): mạng trước, mất mạng mới dùng bản đã cất
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const banSao = res.clone();
          caches.open(PHIEN_BAN).then((c) => c.put(req, banSao));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./index.html'))),
  );
});
