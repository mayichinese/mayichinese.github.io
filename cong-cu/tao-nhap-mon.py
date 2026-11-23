# -*- coding: utf-8 -*-
"""
TẠO DỮ LIỆU MỤC "NHẬP MÔN" (trước HSK 1) → app/data/nhap-mon.json

Đọc:  cong-cu/nguon-nhap-mon/nhap-mon.txt   (định dạng ghi ở đầu file nguồn)
      app/data/nen-tang.json                  (thanh điệu, âm đầu, vần, lưu ý, nét, quy tắc, bộ thủ, ngân hàng âm tiết)
      app/data/hsk1.json, hsk2.json, hsk3.json (từ cho cửa "tu" / "noi", ví dụ hai chữ trên thẻ học)
      app/data/net-chu-hsk1.json, net-chu-hsk23.json (chữ cho cửa "to")
      cong-cu/nguon-nhap-mon/nhap-mon-cu-1.json (cấu trúc bản 1 – 6 chặng – để app chuyển tiến độ cũ)
Kiểm tra mọi mã có thật; với cửa "cap" (cặp dễ nhầm) tìm sẵn các cặp âm tiết trong ngân hàng âm tiết
chỉ khác nhau đúng chỗ cần phân biệt (vd. zhī / chī, ān / āng, lǚ / lǔ, má / mǎ).

CHỈ DÙNG ÂM ĐÃ HỌC (2026-11-23): âm đã học = các mục "hoc" thanh / am-dau / van từ đầu tới HẾT PHẦN đang xét
(y, w, không âm đầu luôn dùng được). Cửa nghe ghi "daHoc" {d, v} để app chỉ hỏi âm tiết gồm âm đã học; cặp dễ nhầm và
ví dụ trên thẻ học ("vd") cũng lọc như vậy; từ ở cửa tu / noi có âm hoặc thanh chưa học → LỖI.

Cách chạy (tại thư mục dự án):
    python -X utf8 cong-cu/tao-nhap-mon.py
Báo cáo: cong-cu/bao-cao-nhap-mon.txt
"""
import json
import re
import unicodedata
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent
APP = GOC / 'app' / 'data'
NGUON = GOC / 'cong-cu' / 'nguon-nhap-mon' / 'nhap-mon.txt'
CU = GOC / 'cong-cu' / 'nguon-nhap-mon' / 'nhap-mon-cu-1.json'
FILE_RA = APP / 'nhap-mon.json'
BAO_CAO = GOC / 'cong-cu' / 'bao-cao-nhap-mon.txt'
PHIEN_BAN = 2   # tăng khi đổi cấu trúc chặng/phần/cửa (app chuyển tiến độ theo "cu")

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

# ---------- Tách âm tiết pinyin (cùng cách với tao-nen-tang.py) ----------
DAU = {'̄': 1, '́': 2, '̌': 3, '̀': 4}
AM_DAU = ['zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's', 'y', 'w']
VAN_Y = {'i': 'i', 'a': 'ia', 'ao': 'iao', 'an': 'ian', 'ang': 'iang', 'e': 'ie', 'ou': 'iu', 'ong': 'iong',
         'in': 'in', 'ing': 'ing', 'u': 'ü', 'ue': 'üe', 'uan': 'üan', 'un': 'ün'}
VAN_W = {'u': 'u', 'a': 'ua', 'o': 'uo', 'ai': 'uai', 'ei': 'ui', 'an': 'uan', 'en': 'un', 'ang': 'uang', 'eng': 'eng'}
VAN_VIET = ['a', 'o', 'e', 'i', 'u', 'ü', 'ai', 'ei', 'ao', 'ou', 'an', 'en', 'ang', 'eng', 'ong', 'er', 'ia', 'ie',
            'iao', 'iu', 'ian', 'in', 'iang', 'ing', 'iong', 'ua', 'uo', 'uai', 'ui', 'uan', 'un', 'uang', 'ue', 'üe', 'üan', 'ün']
CACH_VIET = {d + v for d in [''] + AM_DAU for v in VAN_VIET}
KHONG_DAU = {'y', 'w', ''}   # luôn dùng được (y, w chỉ là cách viết của i, u, ü)


def bo_dau(am):
    """'lǜ' → ('lü', 4); không dấu → thanh 0"""
    thanh, ra = 0, ''
    for ch in unicodedata.normalize('NFD', am):
        if ch in DAU:
            thanh = DAU[ch]
        else:
            ra += ch
    return unicodedata.normalize('NFC', ra).lower(), thanh


AM_THAT = {bo_dau(x['p'])[0] for x in ngan_hang}


def tach_am(goc):
    """'zhang' → ('zh', 'ang'); 'yue' → ('y', 'üe'); 'ju' → ('j', 'ü')"""
    dau = next((d for d in AM_DAU if goc.startswith(d) and len(goc) > len(d)), '')
    van = goc[len(dau):]
    if dau == 'y':
        van = VAN_Y.get(van, van)
    elif dau == 'w':
        van = VAN_W.get(van, van)
    elif dau in ('j', 'q', 'x') and van.startswith('u'):
        van = 'ü' + van[1:]
    return dau, van


def am_cua_tu(han, py):
    """'中国', 'Zhōngguó' → [('zh','ong',1), ('g','uo',2)]; 儿 cuốn lưỡi (nǎr) tính thêm vận mẫu er. None nếu không tách được."""
    so = sum(1 for c in han if '一' <= c <= '鿿')
    py = re.sub(r"[\s'’·]", '', py)
    cuon = han.endswith('儿') and so >= 2 and py.endswith('r') and not py.lower().endswith(('er', 'ér', 'ěr', 'èr', 'ēr'))
    if cuon:
        so -= 1
        py = py[:-1]
    cach = []

    def thu(i, da):
        if len(da) > so:
            return
        if i == len(py):
            if len(da) == so:
                cach.append(list(da))
            return
        for j in range(i + 1, min(len(py), i + 7) + 1):
            g, t = bo_dau(py[i:j])
            if g in CACH_VIET:
                da.append((g, t))
                thu(j, da)
                da.pop()
    thu(0, [])
    if not cach:
        return None
    cach.sort(key=lambda c: -sum(g in AM_THAT for g, _ in c))
    ra = [(*tach_am(g), t) for g, t in cach[0]]
    if cuon:
        ra.append(('', 'er', 0))
    return ra


def am_chua_hoc(am, D, V, T):
    """Các âm tiết có âm đầu / vần / thanh chưa học (để báo lỗi)"""
    return [f'{d}{v}{t}' for d, v, t in am if (d not in D and d not in KHONG_DAU) or v not in V or t not in T]


def tim_cap(nhom, a, b, kho):
    """Các cặp âm tiết (trong kho âm đã học) chỉ khác nhau ở thanh / âm đầu / vần a ↔ b"""
    kq = []
    if nhom == 'thanh':
        ta, tb = int(a), int(b)
        theo_goc = {}
        for x in kho:
            theo_goc.setdefault((x['d'], x['v']), {})[x['t']] = x
        for g in theo_goc.values():
            if ta in g and tb in g:
                kq.append([g[ta], g[tb]])
    else:
        k = 'd' if nhom == 'am-dau' else 'v'
        khac = 'v' if k == 'd' else 'd'
        A = [x for x in kho if x[k] == a]
        # ưu tiên cặp cùng thanh; thiếu thì lấy cặp khác thanh (vẫn chỉ khác đúng phần cần phân biệt ở âm đầu / vần)
        for x in A:
            cung = [y for y in kho if y[k] == b and y[khac] == x[khac] and y['t'] == x['t']]
            if cung:
                kq.append([x, cung[0]])
        if len(kq) < 4:
            for x in A:
                khac_thanh = [y for y in kho if y[k] == b and y[khac] == x[khac] and y['t'] != x['t']]
                if khac_thanh:
                    kq.append([x, khac_thanh[0]])
    da = set()
    gon = []
    for x, y in kq:
        if (x['p'], y['p']) not in da:
            da.add((x['p'], y['p']))
            gon.append([{'h': x['h'], 'p': x['p']}, {'h': y['h'], 'p': y['p']}])
    return gon[:8]


# Từ hai chữ dùng làm ví dụ trên thẻ học (bỏ từ có 不 / 一 vì pinyin ghi biến điệu)
tu_hai = []
for w in tu_hsk.values():
    if len(w['h']) == 2 and not set(w['h']) & {'不', '一'} and w['h'][0] != w['h'][1]:
        am = am_cua_tu(w['h'], w['p'])
        if am and len(am) == 2 and all(t for _, _, t in am):
            tu_hai.append({**w, 'am': am})
tu_hai.sort(key=lambda w: w['cap'])


def vi_du(nhom, m, kho, D, V, T):
    """Ví dụ trên thẻ học: tối đa 2 từ hai chữ + 4 âm tiết, chỉ gồm âm đã học"""
    k = 0 if nhom == 'am-dau' else 1
    hai = [w for w in tu_hai if any(a[k] == m for a in w['am']) and not am_chua_hoc(w['am'], D, V, T)][:2]
    mot = [x for x in kho if (x['d'] if k == 0 else x['v']) == m]
    mot.sort(key=lambda x: (x['t'], x['p']))
    da, don = set(), []
    for x in mot:   # mỗi gốc âm một ví dụ, ưu tiên đủ thanh
        g = (x['d'], x['v'])
        if g not in da:
            da.add(g)
            don.append(x)
    return [{'h': w['h'], 'p': w['p']} for w in hai] + [{'h': x['h'], 'p': x['p']} for x in don[:4]]


# ---------- Đọc nguồn ----------
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
    chang[-1]['phan'][-1]['cua'].append({'loai': loai, 'nhom': nhom, 'muc': muc.split(), '_dong': so_dong})

# ---------- Kiểm tra từng cửa; âm đã học tính tới HẾT phần đang xét ----------
D, V, T = set(), set(), set()
for c in chang:
    for ph in c['phan']:
        for x in ph['cua']:
            if x['loai'] == 'hoc' and x['nhom'] == 'am-dau':
                D.update(x['muc'])
            elif x['loai'] == 'hoc' and x['nhom'] == 'van':
                V.update(x['muc'])
            elif x['loai'] == 'hoc' and x['nhom'] == 'thanh':
                T.update(int(m) for m in x['muc'])
        kho = [a for a in ngan_hang if (a['d'] in D or a['d'] in KHONG_DAU) and a['v'] in V]
        for cua in ph['cua']:
            loai, nhom, muc = cua['loai'], cua['nhom'], cua['muc']
            vi_tri = f"dòng {cua.pop('_dong')}"
            if loai == 'cap':
                cap_am = []
                for m in muc:
                    a, b = m.split('/')
                    for x in (a, b):
                        if x not in MA[nhom] and not (nhom == 'van' and x == 'u'):
                            loi.append(f'{vi_tri}: "{x}" không có trong nhóm {nhom}')
                    cac = tim_cap(nhom, a, b, kho)
                    if len(cac) < 2:
                        loi.append(f'{vi_tri}: cặp {m} chỉ tìm được {len(cac)} cặp âm tiết gồm âm đã học')
                    bao_cao.append(f'  cặp {m}: ' + ', '.join(f"{x['p']}/{y['p']}" for x, y in cac))
                    cap_am.append({'ma': m, 'cap': cac})
                cua['capAm'] = cap_am
            elif nhom == 'tu':
                for m in muc:
                    if m not in tu_hsk:
                        loi.append(f'{vi_tri}: từ {m} không có trong HSK 1–3')
                        continue
                    am = am_cua_tu(m, tu_hsk[m]['p'])
                    if am is None:
                        loi.append(f'{vi_tri}: không tách được âm tiết của {m} {tu_hsk[m]["p"]}')
                    elif am_chua_hoc(am, D, V, T):
                        loi.append(f'{vi_tri}: từ {m} {tu_hsk[m]["p"]} có âm chưa học: {", ".join(am_chua_hoc(am, D, V, T))}')
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
                    so_am = [x for x in kho if str(x[k]) in muc]
                    if len(so_am) < 6:
                        loi.append(f'{vi_tri}: chỉ có {len(so_am)} âm tiết gồm âm đã học để nghe')
                    cua['daHoc'] = {'d': sorted(D), 'v': sorted(V)}
                    bao_cao.append(f'  nghe {nhom} {" ".join(muc)}: {len(so_am)} âm tiết')
                if loai == 'hoc' and nhom in ('am-dau', 'van'):
                    cua['vd'] = {m: vi_du(nhom, m, kho, D, V, T) for m in muc}
                    for m in muc:
                        if not cua['vd'][m]:
                            bao_cao.append(f'  ⚠️ {vi_tri}: {m} không có ví dụ gồm âm đã học (thẻ chỉ hiện mẹo)')

# ---------- Cấu trúc cũ (để chuyển tiến độ): {"<chặng>/<phần>": [[loại, nhóm, [mục]], …]} ----------
cu = {}
if CU.exists():
    for c in json.loads(CU.read_text(encoding='utf8'))['chang']:
        for ip, ph in enumerate(c['phan']):
            cu[f"{c['so']}/{ip}"] = [[x['loai'], x['nhom'], x['muc']] for x in ph['cua']]

so_cua = sum(len(p['cua']) for c in chang for p in c['phan'])
ra = {'_ghiChu': 'File tạo tự động bởi cong-cu/tao-nhap-mon.py – không sửa tay. Nguồn: cong-cu/nguon-nhap-mon/nhap-mon.txt.',
      'phienBan': PHIEN_BAN, 'cu': cu, 'chang': chang}
if not loi:
    FILE_RA.write_text(json.dumps(ra, ensure_ascii=False, separators=(',', ':')), encoding='utf8')
dau = [f'Nhập môn: {len(chang)} chặng · {sum(len(c["phan"]) for c in chang)} phần · {so_cua} cửa',
       f'LỖI: {len(loi)}', *[f'  - {x}' for x in loi], 'Cặp âm tiết dễ nhầm / số âm tiết nghe:']
BAO_CAO.write_text('\n'.join(dau + bao_cao) + '\n', encoding='utf8')
print('\n'.join(dau[:2] + [f'  - {x}' for x in loi]))
print('→ ' + (str(FILE_RA.relative_to(GOC)) if not loi else '(chưa ghi file JSON vì còn lỗi)'))
