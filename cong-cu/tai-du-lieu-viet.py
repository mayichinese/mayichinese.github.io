# -*- coding: utf-8 -*-
"""
TẢI DỮ LIỆU LUYỆN VIẾT CHỮ HÁN (Giai đoạn 2) – chỉ cần chạy lại khi thêm cấp mới.

Việc script làm:
  1. Tải thư viện Hanzi Writer (vẽ thứ tự nét, chấm bài viết) về app/lib/
  2. Gom các chữ Hán cần dữ liệu nét:
       - mọi chữ xuất hiện trong từ của app/data/hsk1.json (để nút "Cách viết" xem được mọi chữ)
       - 100 chữ cần viết tay cấp 1–2 trong app/data/chinh-thuc/chu-han-hsk1-3.json
  3. Tải dữ liệu nét của từng chữ (gói hanzi-writer-data, nguồn gốc: dự án Make Me a Hanzi)
     rồi ghép thành MỘT file app/data/net-chu-hsk1.json
  4. Tải kèm các file giấy phép (bắt buộc khi phân phối lại dữ liệu)

Cách chạy (tại thư mục dự án, cần có mạng):
    python -X utf8 cong-cu/tai-du-lieu-viet.py

Script không chứa danh sách chữ nào – mọi chữ đều đọc từ file JSON.
"""
import json
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent
APP = GOC / 'app'

PHIEN_BAN_THU_VIEN = '3.7.3'   # hanzi-writer
PHIEN_BAN_DU_LIEU = '2.0.1'    # hanzi-writer-data
CDN = 'https://cdn.jsdelivr.net/npm'

TAI_THU_VIEN = [
    (f'{CDN}/hanzi-writer@{PHIEN_BAN_THU_VIEN}/dist/hanzi-writer.min.js', APP / 'lib' / 'hanzi-writer.min.js'),
    (f'{CDN}/hanzi-writer@{PHIEN_BAN_THU_VIEN}/LICENSE', APP / 'lib' / 'GIAY-PHEP-hanzi-writer.txt'),
    (f'{CDN}/hanzi-writer-data@{PHIEN_BAN_DU_LIEU}/ARPHICPL.TXT', APP / 'data' / 'GIAY-PHEP-net-chu.txt'),
]
FILE_RA = APP / 'data' / 'net-chu-hsk1.json'


def tai(url, so_lan_thu=3):
    """Tải một địa chỉ, trả về bytes. Thử lại vài lần nếu mạng chập chờn."""
    for lan in range(1, so_lan_thu + 1):
        try:
            with urllib.request.urlopen(url, timeout=30) as phan_hoi:
                return phan_hoi.read()
        except Exception as loi:  # noqa: BLE001 – báo lỗi dễ hiểu cho người dùng
            if lan == so_lan_thu:
                raise RuntimeError(f'Không tải được {url}: {loi}') from loi
            time.sleep(1.5 * lan)


def la_chu_han(c):
    return '一' <= c <= '鿿' or '㐀' <= c <= '䶿'


def gom_chu():
    """Trả về (danh sách chữ theo thứ tự xuất hiện, tập chữ cần viết tay)."""
    hsk1 = json.loads((APP / 'data' / 'hsk1.json').read_text(encoding='utf-8'))
    chinh_thuc = json.loads((APP / 'data' / 'chinh-thuc' / 'chu-han-hsk1-3.json').read_text(encoding='utf-8'))
    viet_tay = list(chinh_thuc['vietTay']['1-2'])

    thu_tu = []
    da_co = set()
    for bai in hsk1['baiHoc']:
        for tu in bai['tu']:
            for c in tu['hanzi']:
                if la_chu_han(c) and c not in da_co:
                    da_co.add(c)
                    thu_tu.append(c)
    for c in viet_tay:  # chữ viết tay không có trong từ HSK 1 (thuộc từ HSK 2)
        if c not in da_co:
            da_co.add(c)
            thu_tu.append(c)
    return thu_tu, set(viet_tay)


def main():
    # 1. Thư viện + giấy phép
    for url, dich in TAI_THU_VIEN:
        dich.parent.mkdir(parents=True, exist_ok=True)
        dich.write_bytes(tai(url))
        print(f'Đã tải {dich.relative_to(GOC)} ({dich.stat().st_size:,} byte)')

    # 2–3. Dữ liệu nét chữ
    cac_chu, viet_tay = gom_chu()
    print(f'Cần dữ liệu nét cho {len(cac_chu)} chữ ({len(viet_tay)} chữ cần viết tay cấp 1–2).')
    du_lieu = {}
    thieu = []
    for i, c in enumerate(cac_chu, 1):
        url = f'{CDN}/hanzi-writer-data@{PHIEN_BAN_DU_LIEU}/{urllib.parse.quote(c)}.json'
        try:
            net = json.loads(tai(url))
            # chỉ giữ phần thư viện cần: hình nét (strokes) và đường giữa nét (medians, dùng để chấm)
            du_lieu[c] = {'strokes': net['strokes'], 'medians': net['medians']}
            if 'radStrokes' in net:
                du_lieu[c]['radStrokes'] = net['radStrokes']
        except Exception as loi:  # noqa: BLE001
            thieu.append(c)
            print(f'  CẢNH BÁO: không có dữ liệu nét cho chữ U+{ord(c):04X}: {loi}')
        if i % 25 == 0:
            print(f'  … {i}/{len(cac_chu)}')

    goi = {
        '_ghiChu': 'File tạo tự động bởi cong-cu/tai-du-lieu-viet.py – không sửa tay. '
                   f'Dữ liệu nét: hanzi-writer-data {PHIEN_BAN_DU_LIEU} (Make Me a Hanzi), '
                   'giấy phép Arphic Public License – xem GIAY-PHEP-net-chu.txt.',
        'vietTay12': [c for c in cac_chu if c in viet_tay],  # theo thứ tự xuất hiện trong bài
        'net': du_lieu,
    }
    FILE_RA.write_text(json.dumps(goi, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'Đã ghi {FILE_RA.relative_to(GOC)}: {len(du_lieu)} chữ, {FILE_RA.stat().st_size:,} byte')
    if thieu:
        print(f'LỖI: thiếu dữ liệu nét cho {len(thieu)} chữ (xem cảnh báo phía trên).')
        sys.exit(1)
    print('Xong.')


if __name__ == '__main__':
    main()
