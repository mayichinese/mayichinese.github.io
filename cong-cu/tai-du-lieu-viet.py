# -*- coding: utf-8 -*-
"""
TẢI DỮ LIỆU LUYỆN VIẾT CHỮ HÁN (Giai đoạn 2) – chỉ cần chạy lại khi thêm cấp mới.

Việc script làm:
  1. Tải thư viện Hanzi Writer (vẽ thứ tự nét, chấm bài viết) về app/lib/
  2. Gom các chữ Hán cần dữ liệu nét, chia HAI file (file 1 giữ nguyên như Giai đoạn 2):
       - net-chu-hsk1.json : mọi chữ trong từ của hsk1.json + 100 chữ cần viết tay cấp 1–2   (khóa vietTay12)
       - net-chu-hsk23.json: chữ CÒN LẠI trong từ của hsk2.json, hsk3.json + 150 chữ cần viết tay cấp 3 (khóa vietTay3)
       (danh sách chữ viết tay lấy từ app/data/chinh-thuc/chu-han-hsk1-3.json)
  3. Tải dữ liệu nét của từng chữ (gói hanzi-writer-data, nguồn gốc: dự án Make Me a Hanzi).
     Chữ đã có trong file cũ thì dùng lại, không tải lại.
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
FILE_RA_23 = APP / 'data' / 'net-chu-hsk23.json'


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


def chu_trong_cap(cap):
    """Các chữ Hán trong từ của app/data/hsk<cap>.json, theo thứ tự xuất hiện (không có file thì rỗng)."""
    f = APP / 'data' / f'hsk{cap}.json'
    if not f.exists():
        return []
    kq = []
    for bai in json.loads(f.read_text(encoding='utf-8'))['baiHoc']:
        for tu in bai['tu']:
            kq += [c for c in tu['hanzi'] if la_chu_han(c)]
    return kq


def khong_trung(ds, bo_qua=()):
    da_co, kq = set(bo_qua), []
    for c in ds:
        if c not in da_co:
            da_co.add(c)
            kq.append(c)
    return kq


def gom_chu():
    """Trả về (chữ file 1, chữ viết tay 1–2, chữ file 2, chữ viết tay cấp 3) – theo thứ tự xuất hiện."""
    chinh_thuc = json.loads((APP / 'data' / 'chinh-thuc' / 'chu-han-hsk1-3.json').read_text(encoding='utf-8'))
    viet_12 = list(chinh_thuc['vietTay']['1-2'])
    viet_3 = list(chinh_thuc['vietTay']['3'])
    # chữ viết tay không có trong từ HSK 1 (thuộc từ HSK 2) vẫn nằm ở file 1 như trước
    chu_1 = khong_trung(chu_trong_cap(1) + viet_12)
    chu_2 = khong_trung(chu_trong_cap(2) + chu_trong_cap(3) + viet_3, chu_1)
    # chữ viết tay cấp 3: theo thứ tự xuất hiện trong bài HSK 3, chữ không có trong từ thì xếp cuối
    tap_3 = set(viet_3)
    viet_3_thu_tu = khong_trung([c for c in chu_trong_cap(3) if c in tap_3] + viet_3)
    return chu_1, viet_12, chu_2, viet_3_thu_tu


def du_lieu_cu():
    """Dữ liệu nét đã tải ở lần trước (để không tải lại)."""
    cu = {}
    for f in (FILE_RA, FILE_RA_23):
        if f.exists():
            cu.update(json.loads(f.read_text(encoding='utf-8'))['net'])
    return cu


def main():
    # 1. Thư viện + giấy phép
    for url, dich in TAI_THU_VIEN:
        dich.parent.mkdir(parents=True, exist_ok=True)
        dich.write_bytes(tai(url))
        print(f'Đã tải {dich.relative_to(GOC)} ({dich.stat().st_size:,} byte)')

    # 2–3. Dữ liệu nét chữ
    chu_1, viet_12, chu_2, viet_3 = gom_chu()
    cac_chu = chu_1 + chu_2
    print(f'Cần dữ liệu nét cho {len(cac_chu)} chữ (file 1: {len(chu_1)}, file 2: {len(chu_2)}; '
          f'viết tay cấp 1–2: {len(viet_12)}, cấp 3: {len(viet_3)}).')
    cu = du_lieu_cu()
    du_lieu = {}
    thieu = []
    so_tai = 0
    for i, c in enumerate(cac_chu, 1):
        if c in cu:
            du_lieu[c] = cu[c]
            continue
        so_tai += 1
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

    ghi_chu = ('File tạo tự động bởi cong-cu/tai-du-lieu-viet.py – không sửa tay. '
               f'Dữ liệu nét: hanzi-writer-data {PHIEN_BAN_DU_LIEU} (Make Me a Hanzi), '
               'giấy phép Arphic Public License – xem GIAY-PHEP-net-chu.txt.')
    tap_12 = set(viet_12)
    goi_1 = {'_ghiChu': ghi_chu,
             'vietTay12': [c for c in chu_1 if c in tap_12],  # theo thứ tự xuất hiện trong bài
             'net': {c: du_lieu[c] for c in chu_1 if c in du_lieu}}
    goi_2 = {'_ghiChu': ghi_chu,
             'vietTay3': viet_3,
             'net': {c: du_lieu[c] for c in chu_2 if c in du_lieu}}
    for f, goi in ((FILE_RA, goi_1), (FILE_RA_23, goi_2)):
        f.write_text(json.dumps(goi, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
        print(f'Đã ghi {f.relative_to(GOC)}: {len(goi["net"])} chữ, {f.stat().st_size:,} byte')
    print(f'(tải mới {so_tai} chữ, dùng lại {len(cac_chu) - so_tai} chữ đã có)')
    if thieu:
        print(f'LỖI: thiếu dữ liệu nét cho {len(thieu)} chữ (xem cảnh báo phía trên).')
        sys.exit(1)
    print('Xong.')


if __name__ == '__main__':
    main()
