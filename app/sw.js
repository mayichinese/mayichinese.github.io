// =========================================================
// SERVICE WORKER – giúp app chạy được khi KHÔNG có mạng.
// Cách làm: "mạng trước, bộ nhớ sau"
//   - Có mạng: luôn lấy bản mới nhất (nên khi bạn sửa file JSON, app thấy ngay)
//     và cất một bản vào bộ nhớ của trình duyệt.
//   - Mất mạng: lấy bản đã cất.
// Khi thêm file mới vào app, nhớ thêm vào danh sách TAP_TIN và tăng PHIEN_BAN.
// =========================================================

const PHIEN_BAN = 'hoc-hsk-v1';
const TAP_TIN = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/app.js',
  './js/giao-dien.js',
  './js/phien-hoc.js',
  './js/lich-on.js',
  './js/luu-tru.js',
  './js/du-lieu.js',
  './js/phat-am.js',
  './data/hsk1.json',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png',
];

// Lần đầu cài: tải sẵn mọi file
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(PHIEN_BAN).then((c) => c.addAll(TAP_TIN)).then(() => self.skipWaiting()));
});

// Xóa bộ nhớ của phiên bản cũ
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ds) => Promise.all(ds.filter((k) => k !== PHIEN_BAN).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  // Chỉ xử lý file của chính app (bỏ qua link ngoài như Hanzii)
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
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
