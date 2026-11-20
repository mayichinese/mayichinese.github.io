# -*- coding: utf-8 -*-
"""
XEM TỪ VỰNG + NGỮ PHÁP CỦA MỘT BÀI SÁCH (để soạn bài đọc hiểu / câu ví dụ chỉ dùng từ đã học)

Chạy:  python -X utf8 cong-cu/tu-cua-bai.py <cấp> <bài>            từ MỚI của bài + ngữ pháp của bài
       python -X utf8 cong-cu/tu-cua-bai.py <cấp> <bài> --tat-ca   thêm toàn bộ từ được phép dùng (mọi bài trước)

Được phép dùng: mọi từ của cấp dưới + các bài ≤ <bài> của cấp này (cùng quy tắc với kiem-tra-tu-chua-hoc.py).
"""
import json
import sys
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent
DATA = GOC / 'app' / 'data'


def doc(ten):
    p = DATA / ten
    return json.loads(p.read_text(encoding='utf-8')) if p.exists() else None


cap, bai = int(sys.argv[1]), int(sys.argv[2])
tat_ca = '--tat-ca' in sys.argv
theo_sach = doc('theo-sach-hsk1.json')

tu = []   # (cấp, bài, chữ, pinyin, nghĩa)
for c in (1, 2, 3):
    d = doc(f'hsk{c}.json')
    if not d:
        continue
    for b in d['baiHoc']:
        for t in b['tu']:
            if not t.get('daSoan'):
                continue
            so = theo_sach['tu'].get(f'1:{t["dangGoc"]}') if c == 1 else b['so']
            if so is None:
                continue
            nghia = '; '.join(n['nghia'] for n in t['nghia'])[:60]
            tu.append((c, so, t['hanzi'], t['pinyin'], nghia))

ten_bai = ''
if cap == 1:
    ten_bai = next((b['ten'] for b in theo_sach['bai'] if b['so'] == bai), '')
else:
    ten_bai = next((b['ten'] for b in doc(f'hsk{cap}.json')['baiHoc'] if b['so'] == bai), '')
print(f'HSK {cap} · Bài {bai}: {ten_bai}')

moi = [x for x in tu if (x[0], x[1]) == (cap, bai)]
print(f'\nTỪ MỚI CỦA BÀI ({len(moi)}):')
for _, _, h, p, n in moi:
    print(f'  {h} ({p}) – {n}')

np = doc(f'ngu-phap-hsk{cap}.json')
if np:
    cua = [d for d in np['diem'] if (theo_sach['nguPhap'].get(d['id']) if cap == 1 else d.get('bai')) == bai]
    print(f'\nNGỮ PHÁP CỦA BÀI ({len(cua)}):')
    for d in cua:
        print(f'  {d["id"]}: {d["ten"]} – {d["congThuc"][0] if d["congThuc"] else ""}')

duoc = [x for x in tu if (x[0], x[1]) <= (cap, bai)]
print(f'\nTổng số từ được phép dùng tới bài này: {len(duoc)}')
if tat_ca:
    for c in sorted({x[0] for x in duoc}):
        for so in sorted({x[1] for x in duoc if x[0] == c}):
            ds = [x[2] for x in duoc if x[0] == c and x[1] == so]
            print(f'  HSK {c} B{so}: {" ".join(ds)}')
