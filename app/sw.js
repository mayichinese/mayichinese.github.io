// =========================================================
// SERVICE WORKER – giúp app chạy được khi KHÔNG có mạng.
// Cách làm: "mạng trước, bộ nhớ sau"
//   - Có mạng: luôn lấy bản mới nhất (nên khi bạn sửa file JSON, app thấy ngay)
//     và cất một bản vào bộ nhớ của trình duyệt.
//   - Mất mạng: lấy bản đã cất.
// Phông chữ Google (Lexend, Noto Sans): lấy từ bộ nhớ trước, chưa có mới tải
// (phông không đổi nên không cần tải lại).
// Khi thêm file mới vào app, nhớ thêm vào danh sách TAP_TIN và tăng PHIEN_BAN.
// =========================================================

// Tên bộ nhớ đệm (chỉ chứa file của app, KHÔNG chứa tiến độ học – tiến độ nằm ở localStorage)
const PHIEN_BAN = 'mayi-v14';
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
  './js/man-ngu-phap.js',
  './data/ngu-phap-hsk1.json',
  './data/theo-sach-hsk1.json',
  './data/thi-thu-hsk1.json',
  './js/man-thi-thu.js',
  './data/thanh-dieu-hsk1.json',
  './lib/hanzi-writer.min.js',
  './data/net-chu-hsk1.json',
  './js/phien-hoc.js',
  './js/lich-on.js',
  './js/luu-tru.js',
  './js/du-lieu.js',
  './js/phat-am.js',
  './data/hsk1.json',
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
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(PHIEN_BAN).then((c) => c.addAll(TAP_TIN)).then(() => self.skipWaiting()));
});

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
