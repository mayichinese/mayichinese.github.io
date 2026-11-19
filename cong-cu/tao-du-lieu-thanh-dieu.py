# -*- coding: utf-8 -*-
"""
TẠO DỮ LIỆU PHỤ CHO LUYỆN THANH ĐIỆU (Giai đoạn 2).

Vấn đề: giọng đọc của máy (Web Speech) đọc MỘT chữ đứng riêng theo cách đọc phổ biến nhất.
Với chữ đa âm (một chữ nhiều cách đọc), máy có thể đọc khác pinyin trong dữ liệu HSK
→ bài "nghe 1 âm tiết" sẽ chấm sai. Script này tìm các từ MỘT chữ trong HSK 1 mà chữ đó
có nhiều cách đọc trong từ điển CC-CEDICT, để app KHÔNG dùng chúng trong bài nghe 1 âm tiết.
(Từ 2 chữ trở lên thì máy đọc theo ngữ cảnh của từ nên ít sai hơn – vẫn dùng.)

Cách chạy (tại thư mục dự án):
    python -X utf8 cong-cu/tao-du-lieu-thanh-dieu.py
Kết quả: app/data/thanh-dieu-hsk1.json (file tạo tự động, không sửa tay)
"""
import json
import re
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent
CEDICT = GOC / 'cong-cu' / 'tu-dien-doi-chieu' / 'cedict.txt'
HSK1 = GOC / 'app' / 'data' / 'hsk1.json'
FILE_RA = GOC / 'app' / 'data' / 'thanh-dieu-hsk1.json'

def doc_cedict():
    """Trả về {chữ giản thể: tập cách đọc dạng số} cho các mục MỘT chữ."""
    cach_doc = {}
    mau = re.compile(r'^(\S+) (\S+) \[([^\]]+)\] /(.*)/$')
    for dong in CEDICT.read_text(encoding='utf-8').splitlines():
        if dong.startswith('#'):
            continue
        m = mau.match(dong)
        if not m:
            continue
        _, gian_the, pinyin, nghia = m.groups()
        if len(gian_the) != 1:
            continue
        # Bỏ mục chỉ là họ/tên riêng (pinyin viết hoa) và mục "cách đọc cũ/biến thể"
        if pinyin[:1].isupper():
            continue
        if re.match(r'(old )?variant of|\(old\)|used in ', nghia):
            continue
        cach_doc.setdefault(gian_the, set()).add(pinyin.lower().replace(' ', ''))
    return cach_doc


def main():
    cach_doc = doc_cedict()
    hsk1 = json.loads(HSK1.read_text(encoding='utf-8'))
    da_am = []
    khong_co_trong_tu_dien = []
    tong_mot_chu = 0
    for bai in hsk1['baiHoc']:
        for tu in bai['tu']:
            if len(tu['hanzi']) != 1:
                continue
            tong_mot_chu += 1
            c = tu['hanzi']
            ds = cach_doc.get(c)
            if not ds:
                khong_co_trong_tu_dien.append(c)
                continue
            if len(ds) > 1:
                da_am.append(c)
    goi = {
        '_ghiChu': 'File tạo tự động bởi cong-cu/tao-du-lieu-thanh-dieu.py – không sửa tay. '
                   'daAm: chữ (từ một chữ của HSK 1) có nhiều cách đọc trong CC-CEDICT → '
                   'không dùng trong bài "nghe 1 âm tiết" vì giọng máy có thể đọc khác.',
        'daAm': da_am,
    }
    FILE_RA.write_text(json.dumps(goi, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'Từ một chữ trong HSK 1: {tong_mot_chu}')
    print(f'  - đa âm (bị loại khỏi bài nghe 1 âm tiết): {len(da_am)}')
    print(f'  - không tìm thấy trong CC-CEDICT: {len(khong_co_trong_tu_dien)}')
    print(f'  - dùng được: {tong_mot_chu - len(da_am) - len(khong_co_trong_tu_dien)}')
    print(f'Đã ghi {FILE_RA.relative_to(GOC)}')


if __name__ == '__main__':
    main()
