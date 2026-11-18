# -*- coding: utf-8 -*-
"""
Máy chủ nhỏ để chạy bản demo trên máy của bạn.

- Phục vụ thư mục gốc dự án (HocTieng) để trang demo đọc được app/data/hsk1.json.
- Chỉ cho phép ĐỌC file (không ghi, không xóa gì).
- Chỉ mở cho chính máy này (127.0.0.1), máy khác trong mạng không vào được.
- Báo trình duyệt không lưu tạm, để mỗi lần tải lại luôn thấy bản mới nhất.
"""
import http.server
import os
import sys

CONG = 8765  # cổng mạng; trang demo sẽ ở http://localhost:8765/demo-giao-dien/

# Thư mục gốc dự án = thư mục cha của thư mục chứa file này
THU_MUC_GOC = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class XuLyYeuCau(http.server.SimpleHTTPRequestHandler):
    # Khai báo rõ loại file (trên Windows đôi khi bị nhận sai loại file .js)
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".html": "text/html; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".svg": "image/svg+xml",
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=THU_MUC_GOC, **kwargs)

    def end_headers(self):
        # Không cho trình duyệt lưu tạm -> luôn thấy dữ liệu và giao diện mới nhất
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, format, *args):
        # Không in từng yêu cầu ra màn hình cho đỡ rối
        pass


def chay():
    try:
        may_chu = http.server.ThreadingHTTPServer(("127.0.0.1", CONG), XuLyYeuCau)
    except OSError:
        print("Cong %d dang ban - co the demo da dang chay o mot cua so khac." % CONG)
        print("Hay mo trinh duyet vao: http://localhost:%d/demo-giao-dien/" % CONG)
        input("Bam Enter de dong cua so nay...")
        sys.exit(1)

    print("Demo dang chay tai: http://localhost:%d/demo-giao-dien/" % CONG)
    print("De TAT demo: dong cua so nay (hoac bam Ctrl + C).")
    try:
        may_chu.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    chay()
