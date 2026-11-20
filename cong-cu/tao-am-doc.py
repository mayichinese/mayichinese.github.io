# -*- coding: utf-8 -*-
"""
TẠO BẢNG "CHỮ → CÁCH ĐỌC" DÙNG ĐỂ CHẤM PHÁT ÂM → app/data/am-doc.json

Khi người học nói, trình duyệt nhận dạng giọng nói trả về CHỮ HÁN (vd. nói "shì" có thể ra 是, 事, 市…).
App cần biết mỗi chữ đọc thế nào để so với âm tiết đúng: cùng âm + cùng thanh = đọc đúng, dù máy viết ra chữ khác.

Đọc:
  - cong-cu/tu-dien-doi-chieu/Unihan_Readings.txt
      kTGHZ2013 = 8105 chữ của 《通用规范汉字表》 (bảng chữ thông dụng chuẩn 2013) kèm mọi cách đọc
      kMandarin = cách đọc phổ biến (bổ sung)
      (tải: https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip – giấy phép Unicode, được phép phân phối lại)
  - app/data/hsk1.json, hsk2.json, hsk3.json – bảo đảm mọi chữ trong từ vựng đều có cách đọc

Cách chạy (tại thư mục dự án):
    python -X utf8 cong-cu/tao-am-doc.py

Định dạng ra: { "_ghiChu": "...", "am": { "shi4": "是事市…", "zhong1": "中钟…", ... } }
  khóa = âm tiết không dấu + số thanh (1–4, 5 = thanh nhẹ), "ü" viết là "v".
Script không chứa chữ Hán nào: mọi chữ đều lấy từ file nguồn.
"""
import json
import re
import unicodedata
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent
APP = GOC / 'app'
UNIHAN = GOC / 'cong-cu' / 'tu-dien-doi-chieu' / 'Unihan_Readings.txt'
FILE_RA = APP / 'data' / 'am-doc.json'

DAU = {'̄': 1, '́': 2, '̌': 3, '̀': 4}


def doi_so(py):
    """'zhòu' → 'zhou4'; 'lǜ' → 'lv4'; không dấu → thanh 5"""
    tach = unicodedata.normalize('NFD', py.strip().lower())
    thanh = 5
    kq = ''
    for c in tach:
        if c in DAU:
            thanh = DAU[c]
        elif c == '̈':
            kq = kq[:-1] + 'v'   # ü
        else:
            kq += c
    if not re.fullmatch(r'[a-z]+', kq):
        return None
    return f'{kq}{thanh}'


def main():
    if not UNIHAN.exists():
        raise SystemExit(f'Thiếu file {UNIHAN} – tải Unihan.zip rồi giải nén Unihan_Readings.txt vào đó.')
    tghz = {}      # chữ → [cách đọc]
    mandarin = {}
    for dong in UNIHAN.read_text(encoding='utf8').splitlines():
        if not dong.startswith('U+'):
            continue
        ma, truong, gt = dong.split('\t', 2)
        chu = chr(int(ma[2:], 16))
        if truong == 'kTGHZ2013':
            # "482.140:zhòu" hoặc nhiều mục cách nhau bởi dấu cách
            tghz[chu] = [m.split(':', 1)[1] for m in gt.split() if ':' in m]
        elif truong == 'kMandarin':
            mandarin[chu] = gt.split()

    chu_hsk = set()
    for cap in (1, 2, 3):
        p = APP / 'data' / f'hsk{cap}.json'
        if not p.exists():
            continue
        for b in json.loads(p.read_text(encoding='utf8'))['baiHoc']:
            for t in b['tu']:
                chu_hsk.update(c for c in t['hanzi'] if '一' <= c <= '鿿')

    am = {}
    thieu = []
    for chu in sorted(set(tghz) | chu_hsk):
        doc = list(dict.fromkeys(tghz.get(chu, []) + mandarin.get(chu, [])))
        if not doc:
            thieu.append(chu)
            continue
        for py in doc:
            k = doi_so(py)
            if k:
                am.setdefault(k, [])
                if chu not in am[k]:
                    am[k].append(chu)

    du_lieu = {
        '_ghiChu': 'Tạo tự động bởi cong-cu/tao-am-doc.py từ Unihan (kTGHZ2013 + kMandarin). Không sửa tay.',
        'am': {k: ''.join(v) for k, v in sorted(am.items())},
    }
    FILE_RA.write_text(json.dumps(du_lieu, ensure_ascii=False, separators=(',', ':')), encoding='utf8')
    so_chu = len({c for v in am.values() for c in v})
    print(f'Đã ghi {FILE_RA.relative_to(GOC)}: {len(am)} âm tiết, {so_chu} chữ, {FILE_RA.stat().st_size // 1024} KB')
    if thieu:
        print(f'Chữ HSK không có cách đọc trong Unihan: {len(thieu)}')


if __name__ == '__main__':
    main()
