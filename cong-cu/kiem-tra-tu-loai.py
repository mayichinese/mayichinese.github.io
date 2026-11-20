# Kiểm tra app/data/tu-loai.json (hướng dẫn từ loại & trật tự câu – soạn tay)
#   - mỗi ví dụ trỏ tới từ có thật, câu ví dụ có thật, câu có chứa từ đó,
#     và nghĩa của câu đó đúng từ loại đang nói (chỉ cảnh báo)
#   - mã điểm ngữ pháp có thật
#   - mọi từ loại xuất hiện trong hsk1/2/3.json đều có trang hướng dẫn
# Chạy: python -X utf8 cong-cu/kiem-tra-tu-loai.py
import json
import pathlib
import sys

GOC = pathlib.Path(__file__).resolve().parent.parent / 'app' / 'data'


def doc(ten):
    return json.loads((GOC / ten).read_text(encoding='utf-8'))


tl = doc('tu-loai.json')
tu = {}
for cap in (1, 2, 3):
    p = GOC / f'hsk{cap}.json'
    if not p.exists():
        continue
    for b in doc(p.name)['baiHoc']:
        for t in b['tu']:
            tu[f'{cap}:{t["dangGoc"]}'] = t
diem = set()
for cap in (1, 2, 3):
    p = GOC / f'ngu-phap-hsk{cap}.json'
    if p.exists():
        diem |= {d['id'] for d in doc(p.name)['diem']}

loi, canhBao = [], []
daCo = set()
maDaCo = set()
for l in tl['loai']:
    if l['ma'] in maDaCo:
        loi.append(f'{l["ma"]}: trùng mã')
    maDaCo.add(l['ma'])
    daCo |= set(l['kyHieu'])
    for v in l['viDu']:
        t = tu.get(v['tu'])
        if not t:
            loi.append(f'{l["ma"]}: không có từ {v["tu"]}')
            continue
        if v['so'] >= len(t['viDu']):
            loi.append(f'{l["ma"]}: từ {v["tu"]} không có câu ví dụ số {v["so"]}')
            continue
        cau = t['viDu'][v['so']]
        if t['hanzi'] not in cau['han']:
            loi.append(f'{l["ma"]}: câu {v["so"]} của {v["tu"]} không chứa từ')
        tl_cau = t['nghia'][cau.get('nghiaSo', 0)].get('tuLoai')
        if tl_cau not in l['kyHieu']:
            canhBao.append(f'{l["ma"]}: câu {v["so"]} của {v["tu"]} thuộc nghĩa có từ loại {tl_cau}')
    for m in l['nguPhap']:
        if m not in diem:
            loi.append(f'{l["ma"]}: không có điểm ngữ pháp "{m}"')
for th in tl['tratTu']['thuTu']:
    if th['loai'] not in maDaCo:
        loi.append(f'trật tự câu: không có từ loại "{th["loai"]}"')

dungTrongDuLieu = {n.get('tuLoai') for t in tu.values() for n in t['nghia'] if n.get('tuLoai')}
for k in sorted(dungTrongDuLieu - daCo):
    loi.append(f'từ loại "{k}" có trong dữ liệu từ nhưng chưa có hướng dẫn')

print(f'{len(tl["loai"])} từ loại, {sum(len(l["viDu"]) for l in tl["loai"])} ví dụ, '
      f'{sum(len(l["nguPhap"]) for l in tl["loai"])} liên kết ngữ pháp.')
for c in canhBao:
    print('Cảnh báo:', c)
for x in loi:
    print('LỖI:', x)
print('Không có lỗi.' if not loi else f'{len(loi)} lỗi.')
sys.exit(1 if loi else 0)
