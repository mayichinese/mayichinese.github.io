# -*- coding: utf-8 -*-
"""
TẠO DỮ LIỆU MỤC "NHẬP MÔN" (trước HSK 1) → app/data/nhap-mon.json

Đọc:  cong-cu/nguon-nhap-mon/nhap-mon.txt   (định dạng ghi ở đầu file nguồn)
      app/data/nen-tang.json                  (thanh điệu, âm đầu, vần, lưu ý, nét, quy tắc, bộ thủ, ngân hàng âm tiết)
      app/data/hsk1.json, hsk2.json, hsk3.json (từ cho cửa "tu" / "noi")
      app/data/net-chu-hsk1.json, net-chu-hsk23.json (chữ cho cửa "to")
Kiểm tra mọi mã có thật; với cửa "cap" (cặp dễ nhầm) tìm sẵn các cặp âm tiết trong ngân hàng âm tiết
chỉ khác nhau đúng chỗ cần phân biệt (vd. zhī / chī, ān / āng, lǚ / lǔ, má / mǎ).

Cách chạy (tại thư mục dự án):
    python -X utf8 cong-cu/tao-nhap-mon.py
Báo cáo: cong-cu/bao-cao-nhap-mon.txt
"""
import json
import re
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent
APP = GOC / 'app' / 'data'
NGUON = GOC / 'cong-cu' / 'nguon-nhap-mon' / 'nhap-mon.txt'
FILE_RA = APP / 'nhap-mon.json'
BAO_CAO = GOC / 'cong-cu' / 'bao-cao-nhap-mon.txt'

nt = json.loads((APP / 'nen-tang.json').read_text(encoding='utf8'))
pa = nt['phienAm']
MA = {
    'thanh': {str(x['t']) for x in pa['thanh']},
    'am-dau': {x['ma'] for x in pa['amDau']},
    'van': {x['ma'] for x in pa['van']},
    'luu-y': {str(i + 1) for i in range(len(pa.get('luuY', [])))},
    'net': {x['ten'] for x in nt['net']},
    'quy-tac': {str(i + 1) for i in range(len(nt['quyTac']))},
    'bo': {x['bo'] for x in nt['boThu']},
}
ngan_hang = pa['nganHang']   # [{h, p, d, v, t}]

tu_hsk = {}
for cap in (1, 2, 3):
    for bai in json.loads((APP / f'hsk{cap}.json').read_text(encoding='utf8'))['baiHoc']:
        for t in bai['tu']:
            if t.get('daSoan') and t['hanzi'] not in tu_hsk:
                tu_hsk[t['hanzi']] = {'h': t['hanzi'], 'p': t['pinyin'], 'cap': cap}
net_chu = {}
for f in ('net-chu-hsk1.json', 'net-chu-hsk23.json'):
    p = APP / f
    if p.exists():
        net_chu.update(json.loads(p.read_text(encoding='utf8')).get('net', {}))

loi, bao_cao = [], []


def tim_cap(nhom, a, b):
    """Các cặp âm tiết (ngân hàng) chỉ khác nhau ở thanh / âm đầu / vần a ↔ b"""
    kq = []
    if nhom == 'thanh':
        ta, tb = int(a), int(b)
        theo_goc = {}
        for x in ngan_hang:
            theo_goc.setdefault((x['d'], x['v']), {})[x['t']] = x
        for g in theo_goc.values():
            if ta in g and tb in g:
                kq.append([g[ta], g[tb]])
    else:
        k = 'd' if nhom == 'am-dau' else 'v'
        khac = 'v' if k == 'd' else 'd'
        A = [x for x in ngan_hang if x[k] == a]
        # ưu tiên cặp cùng thanh; thiếu thì lấy cặp khác thanh (vẫn chỉ khác đúng phần cần phân biệt ở âm đầu / vần)
        for x in A:
            cung = [y for y in ngan_hang if y[k] == b and y[khac] == x[khac] and y['t'] == x['t']]
            if cung:
                kq.append([x, cung[0]])
        if len(kq) < 4:
            for x in A:
                khac_thanh = [y for y in ngan_hang if y[k] == b and y[khac] == x[khac] and y['t'] != x['t']]
                if khac_thanh:
                    kq.append([x, khac_thanh[0]])
    da = set()
    gon = []
    for x, y in kq:
        if (x['p'], y['p']) not in da:
            da.add((x['p'], y['p']))
            gon.append([{'h': x['h'], 'p': x['p']}, {'h': y['h'], 'p': y['p']}])
    return gon[:8]


chang = []
for so_dong, dong in enumerate(NGUON.read_text(encoding='utf8').splitlines(), 1):
    dong = dong.strip()
    if not dong or dong.startswith('# '):
        continue
    if dong.startswith('## '):
        so, ten, mo_ta = [x.strip() for x in dong[3:].split('|')]
        chang.append({'so': int(so), 'ten': ten, 'moTa': mo_ta, 'phan': []})
        continue
    if dong.startswith('### '):
        chang[-1]['phan'].append({'ten': dong[4:].strip(), 'cua': []})
        continue
    if dong.startswith('#'):
        continue
    loai, nhom, muc = [x.strip() for x in dong.split('|')]
    muc = muc.split()
    cua = {'loai': loai, 'nhom': nhom, 'muc': muc}
    vi_tri = f'dòng {so_dong}'
    if loai == 'cap':
        cap_am = []
        for m in muc:
            a, b = m.split('/')
            for x in (a, b):
                if x not in MA[nhom] and not (nhom == 'van' and x == 'u'):
                    loi.append(f'{vi_tri}: "{x}" không có trong nhóm {nhom}')
            cac = tim_cap(nhom, a, b)
            if len(cac) < 2:
                loi.append(f'{vi_tri}: cặp {m} chỉ tìm được {len(cac)} cặp âm tiết')
            bao_cao.append(f'  cặp {m}: ' + ', '.join(f"{x['p']}/{y['p']}" for x, y in cac))
            cap_am.append({'ma': m, 'cap': cac})
        cua['capAm'] = cap_am
    elif nhom in ('tu',):
        for m in muc:
            if m not in tu_hsk:
                loi.append(f'{vi_tri}: từ {m} không có trong HSK 1–3')
        cua['tu'] = [tu_hsk[m] for m in muc if m in tu_hsk]
    elif nhom == 'chu':
        for m in muc:
            if m not in net_chu:
                loi.append(f'{vi_tri}: chữ {m} không có dữ liệu nét')
    else:
        for m in muc:
            if m not in MA.get(nhom, set()):
                loi.append(f'{vi_tri}: "{m}" không có trong nhóm {nhom}')
        if loai == 'nghe':
            k = {'thanh': 't', 'am-dau': 'd', 'van': 'v'}[nhom]
            so_am = [x for x in ngan_hang if str(x[k]) in muc]
            if len(so_am) < 6:
                loi.append(f'{vi_tri}: chỉ có {len(so_am)} âm tiết để nghe')
    chang[-1]['phan'][-1]['cua'].append(cua)

so_cua = sum(len(p['cua']) for c in chang for p in c['phan'])
ra = {'_ghiChu': 'File tạo tự động bởi cong-cu/tao-nhap-mon.py – không sửa tay. Nguồn: cong-cu/nguon-nhap-mon/nhap-mon.txt.',
      'chang': chang}
if not loi:
    FILE_RA.write_text(json.dumps(ra, ensure_ascii=False, separators=(',', ':')), encoding='utf8')
dau = [f'Nhập môn: {len(chang)} chặng · {sum(len(c["phan"]) for c in chang)} phần · {so_cua} cửa',
       f'LỖI: {len(loi)}', *[f'  - {x}' for x in loi], 'Cặp âm tiết dễ nhầm:']
BAO_CAO.write_text('\n'.join(dau + bao_cao) + '\n', encoding='utf8')
print('\n'.join(dau[:2] + [f'  - {x}' for x in loi]))
print('→ ' + (str(FILE_RA.relative_to(GOC)) if not loi else '(chưa ghi file JSON vì còn lỗi)'))
