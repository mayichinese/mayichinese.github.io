# -*- coding: utf-8 -*-
"""
TẠO DỮ LIỆU MỤC "CHỮ & ÂM" (phiên âm, nét cơ bản, bộ thủ) → app/data/nen-tang.json

Đọc:
  - cong-cu/nguon-nen-tang/phien-am.txt   mẹo phát âm thanh điệu, âm đầu, vần (soạn tay, tiếng Việt)
  - cong-cu/nguon-nen-tang/net-co-ban.txt nét cơ bản + quy tắc thứ tự nét (soạn tay)
  - cong-cu/nguon-nen-tang/bo-thu.txt     bộ thủ cơ bản (soạn tay)
  - app/data/hsk1.json, hsk2.json, hsk3.json   từ vựng (lấy ví dụ nghe, chữ ví dụ của bộ thủ)
  - app/data/thanh-dieu-hsk1.json         chữ đa âm (bỏ khỏi ví dụ nghe vì giọng máy có thể đọc khác)
  - app/data/net-chu-hsk1.json, net-chu-hsk23.json  dữ liệu nét (kiểm tra chữ ví dụ, thứ tự nét)
  - cong-cu/tu-dien-doi-chieu/makemeahanzi-dictionary.txt  bộ thủ của từng chữ
      (tải: https://raw.githubusercontent.com/skishore/makemeahanzi/master/dictionary.txt)

Cách chạy (tại thư mục dự án):
    python -X utf8 cong-cu/tao-nen-tang.py

Ví dụ nghe lấy từ các TỪ MỘT CHỮ của HSK 1–3 nên script không chứa chữ Hán nào.
Báo cáo: cong-cu/bao-cao-nen-tang.txt
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent
APP = GOC / 'app'
NGUON = GOC / 'cong-cu' / 'nguon-nen-tang'
TU_DIEN = GOC / 'cong-cu' / 'tu-dien-doi-chieu' / 'makemeahanzi-dictionary.txt'
FILE_RA = APP / 'data' / 'nen-tang.json'
BAO_CAO = GOC / 'cong-cu' / 'bao-cao-nen-tang.txt'

bao_cao = []


def doc_json(p):
    return json.loads(Path(p).read_text(encoding='utf8'))


# ---------- Từ vựng ----------
cac_tu = []   # (cap, hanzi, pinyin, nghia)
for cap in (1, 2, 3):
    p = APP / 'data' / f'hsk{cap}.json'
    if not p.exists():
        continue
    for bai in doc_json(p)['baiHoc']:
        for t in bai['tu']:
            if t.get('daSoan'):
                ng = t.get('nghia') or ''
                if isinstance(ng, list):
                    ng = ng[0] if ng else ''
                if isinstance(ng, dict):
                    ng = ng.get('nghia', '')
                cac_tu.append((cap, t['hanzi'], t['pinyin'], ng))

da_am = set(doc_json(APP / 'data' / 'thanh-dieu-hsk1.json').get('daAm', []))

# ---------- Tách âm tiết pinyin ----------
DAU = {'̄': 1, '́': 2, '̌': 3, '̀': 4}
AM_DAU = ['zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's', 'y', 'w']
# Âm tiết bắt đầu bằng y / w → vần thật (để xếp vào bảng vần)
VAN_Y = {'i': 'i', 'a': 'ia', 'ao': 'iao', 'an': 'ian', 'ang': 'iang', 'e': 'ie', 'ou': 'iu', 'ong': 'iong',
         'in': 'in', 'ing': 'ing', 'u': 'ü', 'ue': 'üe', 'uan': 'üan', 'un': 'ün'}
VAN_W = {'u': 'u', 'a': 'ua', 'o': 'uo', 'ai': 'uai', 'ei': 'ui', 'an': 'uan', 'en': 'un', 'ang': 'uang', 'eng': 'eng'}


def bo_dau(am):
    """'lǜ' → ('lü', 4); không dấu → thanh 0"""
    tach = unicodedata.normalize('NFD', am)
    thanh = 0
    ra = ''
    for ch in tach:
        if ch in DAU:
            thanh = DAU[ch]
        else:
            ra += ch
    ra = unicodedata.normalize('NFC', ra)
    return ra.lower(), thanh


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


# Ngân hàng âm tiết: từ MỘT chữ, đọc một âm tiết có thanh 1–4, không phải chữ đa âm
ngan_hang = []
da_co = set()
for cap, han, py, nghia in cac_tu:
    if len(han) != 1 or han in da_am or not re.fullmatch(r"[^\s'·]+", py) or py[0].isupper():
        continue
    goc, thanh = bo_dau(py)
    if not thanh or not re.fullmatch(r'[a-zü]+', goc):
        continue
    dau, van = tach_am(goc)
    if (goc, thanh) in da_co:
        continue
    da_co.add((goc, thanh))
    ngan_hang.append({'h': han, 'p': py, 'g': goc, 'd': dau, 'v': van, 't': thanh, 'c': cap})

# Bổ sung: chữ trong các từ nhiều chữ của HSK 1–3, lấy cách đọc chuẩn trong Unihan (kMandarin).
# Bỏ chữ có từ hai cách đọc trở lên (theo kTGHZ2013 / kXHC1983 / kHanyuPinyin) – giọng máy có thể đọc khác.
UNIHAN = GOC / 'cong-cu' / 'tu-dien-doi-chieu' / 'Unihan_Readings.txt'
if UNIHAN.exists():
    doc_chuan, cac_cach = {}, {}
    for dong in UNIHAN.read_text(encoding='utf8').splitlines():
        o = dong.split('\t')
        if len(o) != 3 or not o[0].startswith('U+'):
            continue
        c = chr(int(o[0][2:], 16))
        if o[1] == 'kMandarin':
            doc_chuan[c] = o[2].split()[0]
        elif o[1] in ('kTGHZ2013', 'kXHC1983', 'kHanyuPinyin'):
            for phan_tu in o[2].split():
                for am in phan_tu.split(':')[-1].split(','):
                    cac_cach.setdefault(c, set()).add(am)
    thu_tu_chu = []
    for cap, han, py, nghia in cac_tu:
        for c in han:
            if '一' <= c <= '鿿' and c not in [x[0] for x in thu_tu_chu]:
                thu_tu_chu.append((c, cap))
    for c, cap in thu_tu_chu:
        py = doc_chuan.get(c)
        if not py or c in da_am or len(cac_cach.get(c, {py})) > 1:
            continue
        goc, thanh = bo_dau(py)
        if not thanh or (goc, thanh) in da_co or not re.fullmatch(r'[a-zü]+', goc):
            continue
        dau, van = tach_am(goc)
        da_co.add((goc, thanh))
        ngan_hang.append({'h': c, 'p': py, 'g': goc, 'd': dau, 'v': van, 't': thanh, 'c': cap})
else:
    bao_cao.append(f'⚠️ Thiếu {UNIHAN.name}: ví dụ nghe chỉ lấy từ các từ một chữ')


# ---------- Đọc nguồn phiên âm ----------
def doc_nguon_phien_am():
    phan = {}
    hien_tai = None
    nhom = None
    for dong in (NGUON / 'phien-am.txt').read_text(encoding='utf8').splitlines():
        dong = dong.strip()
        if not dong or dong.startswith('#'):
            continue
        if dong.startswith('@'):
            hien_tai = dong[1:].strip()
            phan[hien_tai] = []
            nhom = None
        elif dong.startswith('='):
            nhom = dong[1:].strip()
        else:
            ma, meo = [x.strip() for x in dong.split('|', 1)]
            phan[hien_tai].append({'ma': ma, 'nhom': nhom, 'meo': meo})
    return phan


def vi_du(dk, toi_da=6):
    """Ví dụ nghe: ưu tiên HSK 1, nhiều thanh/vần khác nhau"""
    ds = sorted([x for x in ngan_hang if dk(x)], key=lambda x: x['c'])
    chon, da = [], set()
    for x in ds:                       # lượt 1: mỗi âm tiết gốc một ví dụ
        if x['g'] not in da:
            chon.append(x)
            da.add(x['g'])
    for x in ds:                       # lượt 2: thêm cho đủ
        if x not in chon:
            chon.append(x)
    return [{'h': x['h'], 'p': x['p']} for x in chon[:toi_da]]


nguon = doc_nguon_phien_am()
thanh = []
for x in nguon['thanh']:
    t = int(x['ma'])
    thanh.append({'t': t, 'meo': x['meo'], 'vd': vi_du(lambda y, t=t: y['t'] == t, 4) if t else []})

# Bảng mẫu 4 thanh trên cùng một âm tiết (vd. ma): chọn âm tiết gốc có nhiều thanh nhất
dem_thanh = {}
for x in ngan_hang:
    dem_thanh.setdefault(x['g'], {})
    dem_thanh[x['g']].setdefault(x['t'], x)
goc_mau = max(dem_thanh, key=lambda g: (len(dem_thanh[g]), -min(v['c'] for v in dem_thanh[g].values())))
mau_thanh = [{'t': t, 'h': dem_thanh[goc_mau][t]['h'], 'p': dem_thanh[goc_mau][t]['p']} for t in sorted(dem_thanh[goc_mau])]
# Thanh nhẹ: từ láy hai chữ có âm tiết sau đọc nhẹ (không dấu); ưu tiên cùng âm tiết gốc với bảng mẫu
ung_vien = []
for cap, han, py, nghia in cac_tu:
    if len(han) != 2 or han[0] != han[1] or ' ' in py:
        continue
    g, _ = bo_dau(py)
    nua = len(g) // 2
    if len(g) % 2 or g[:nua] != g[nua:] or bo_dau(py[-nua:])[1]:
        continue
    ung_vien.append((g[:nua] != goc_mau, cap, han, py))
if ung_vien:
    _, _, han, py = min(ung_vien)
    mau_thanh.append({'t': 0, 'h': han, 'p': py})

# ---------- Ví dụ TỪ HAI CHỮ (máy đọc cả từ chuẩn hơn đọc chữ đứng riêng) ----------
# Tách pinyin của từ hai chữ thành hai âm tiết hợp lệ (bảng âm tiết lấy từ ngân hàng + Unihan nếu có)
am_hop_le = {x['g'] for x in ngan_hang}
if UNIHAN.exists():
    am_hop_le |= {bo_dau(a)[0] for a in doc_chuan.values()}


def tach_hai_am(py):
    py = py.replace("'", '').replace('’', '')
    if not re.fullmatch(r'[^\s·]+', py) or py[0].isupper():
        return None
    cach = []
    for k in range(1, len(py)):
        a, b = bo_dau(py[:k]), bo_dau(py[k:])
        if a[0] in am_hop_le and b[0] in am_hop_le:
            cach.append((py[:k], py[k:]))
    return cach[0] if len(cach) == 1 else None


tu_hai = []   # {h, p, am: [(dau, van), …]}
da_tu = set()
for cap, han, py, nghia in cac_tu:
    if len(han) != 2 or han in da_tu or han[0] == han[1] or set(han) & {'不', '一'}:
        continue   # bỏ từ có 不 / 一 (pinyin ghi biến điệu, dễ rối khi học âm)
    hai = tach_hai_am(py)
    if not hai:
        continue
    am = []
    for mot in hai:
        g, t = bo_dau(mot)
        if not t:            # bỏ từ có thanh nhẹ (khó nghe rõ âm)
            break
        am.append(tach_am(g))
    if len(am) != 2:
        continue
    da_tu.add(han)
    tu_hai.append({'h': han, 'p': py, 'am': am, 'c': cap})


def vi_du_tu(dk, toi_da=4):
    """Từ hai chữ có âm tiết khớp điều kiện; ưu tiên HSK 1 và âm tiết khớp đứng đầu. i = vị trí âm tiết khớp"""
    ds = []
    for x in tu_hai:
        for i, (d, v) in enumerate(x['am']):
            if dk(d, v):
                ds.append((x['c'], i, x['h'], x['p']))
                break
    ds.sort()
    return [{'h': h, 'p': p, 'i': i} for c, i, h, p in ds[:toi_da]]


am_dau = [{**x, 'vd': vi_du(lambda y, d=x['ma']: y['d'] == d),
           'vdTu': vi_du_tu(lambda d, v, m=x['ma']: d == m)} for x in nguon['am-dau']]
van = [{**x, 'vd': vi_du(lambda y, v=x['ma']: y['v'] == v),
        'vdTu': vi_du_tu(lambda d, v, m=x['ma']: v == m and not (m == 'i' and d in ('z', 'c', 's', 'zh', 'ch', 'sh', 'r')))}
       for x in nguon['van']]
# Vần i: ví dụ đọc "i" thật lên trước, ví dụ đọc gần "ư" (sau z c s zh ch sh r) xuống sau
for x in van:
    if x['ma'] == 'i':
        tach = lambda y: bo_dau(y['p'])[0].startswith(('z', 'c', 's', 'r'))
        x['vd'] = vi_du(lambda y: y['v'] == 'i' and not tach(y), 4) + vi_du(lambda y: y['v'] == 'i' and tach(y), 2)
for x in am_dau + van:
    if not x['vd'] and not x['vdTu']:
        bao_cao.append(f"⚠️ Phiên âm '{x['ma']}': không có ví dụ nghe trong HSK 1–3")
    elif not x['vdTu']:
        bao_cao.append(f"⚠️ Phiên âm '{x['ma']}': không có từ hai chữ làm ví dụ")

# ---------- Nét cơ bản ----------
net_du_lieu = {}
for f in ('net-chu-hsk1.json', 'net-chu-hsk23.json'):
    p = APP / 'data' / f
    if p.exists():
        net_du_lieu.update(doc_json(p).get('net', {}))

net, quy_tac = [], []
phan = None
for dong in (NGUON / 'net-co-ban.txt').read_text(encoding='utf8').splitlines():
    dong = dong.strip()
    if not dong or dong.startswith('#'):
        continue
    if dong.startswith('@'):
        phan = dong[1:].strip()
        continue
    o = [x.strip() for x in dong.split('|')]
    if phan == 'net':
        ten, py, viet, cach, chu, so = o
        so = int(so)
        if chu not in net_du_lieu:
            bao_cao.append(f'❌ Nét {ten}: chữ ví dụ {chu} không có dữ liệu nét')
            continue
        if not 1 <= so <= len(net_du_lieu[chu]['strokes']):
            bao_cao.append(f'❌ Nét {ten}: chữ {chu} không có nét thứ {so}')
            continue
        net.append({'ten': ten, 'py': py, 'viet': viet, 'cach': cach, 'chu': chu, 'so': so})
    elif phan == 'quy-tac':
        ten, giai_thich, chu = o
        if chu not in net_du_lieu:
            bao_cao.append(f'❌ Quy tắc "{ten}": chữ {chu} không có dữ liệu nét')
        quy_tac.append({'ten': ten, 'giai': giai_thich, 'chu': chu})

# ---------- Bộ thủ ----------
if not TU_DIEN.exists():
    sys.exit(f'Thiếu {TU_DIEN} – tải từ https://raw.githubusercontent.com/skishore/makemeahanzi/master/dictionary.txt')
bo_cua_chu = {}
for dong in TU_DIEN.read_text(encoding='utf8').splitlines():
    if dong.strip():
        d = json.loads(dong)
        bo_cua_chu[d['character']] = d.get('radical', '')

# Chữ trong từ HSK, theo thứ tự xuất hiện; kèm từ ví dụ đầu tiên chứa chữ
chu_hsk = {}
for cap, han, py, nghia in cac_tu:
    for c in han:
        if '一' <= c <= '鿿' and c not in chu_hsk:
            chu_hsk[c] = {'c': c, 'cap': cap, 'tu': han, 'py': py, 'nghia': nghia}

bo_thu = []
for dong in (NGUON / 'bo-thu.txt').read_text(encoding='utf8').splitlines():
    dong = dong.strip()
    if not dong or dong.startswith('#'):
        continue
    bo, bien, py, hv, nghia, goi = [x.strip() for x in dong.split('|')]
    dang = [bo] + ([] if bien == '-' else bien.split())
    vd = [x for x in chu_hsk.values() if bo_cua_chu.get(x['c']) in dang and x['c'] != bo and x['c'] in net_du_lieu]
    if len(vd) < 2:
        bao_cao.append(f'⚠️ Bộ {bo}: chỉ có {len(vd)} chữ ví dụ trong HSK 1–3')
    bo_thu.append({'bo': bo, 'bien': [] if bien == '-' else bien.split(), 'py': py, 'hv': hv, 'nghia': nghia, 'goi': goi,
                   'soChu': len(vd), 'vd': vd[:8]})

# ---------- Ghi file ----------
ra = {
    '_ghiChu': 'File tạo tự động bởi cong-cu/tao-nen-tang.py – không sửa tay. Nguồn: cong-cu/nguon-nen-tang/.',
    'phienAm': {'thanh': thanh, 'mauThanh': mau_thanh, 'amDau': am_dau, 'van': van,
                'luuY': [{'ten': x['ma'], 'noi': x['meo']} for x in nguon.get('luu-y', [])],
                'nganHang': [{k: x[k] for k in ('h', 'p', 'd', 'v', 't')} for x in ngan_hang]},
    'net': net,
    'quyTac': quy_tac,
    'boThu': bo_thu,
}
FILE_RA.write_text(json.dumps(ra, ensure_ascii=False, separators=(',', ':')), encoding='utf8')
bao_cao[:0] = [
    f'Ngân hàng âm tiết nghe: {len(ngan_hang)} (từ một chữ HSK 1–3, bỏ chữ đa âm)',
    f'Bảng mẫu thanh: âm "{goc_mau}" – ' + ', '.join(f"{x['p']}" for x in mau_thanh),
    f'Từ hai chữ làm ví dụ nghe: {len(tu_hai)}',
    f'Âm đầu: {len(am_dau)} · vần: {len(van)} · nét: {len(net)} · quy tắc: {len(quy_tac)} · bộ thủ: {len(bo_thu)}',
    *[f"  bộ {b['bo']} ({b['hv']}): {b['soChu']} chữ" for b in bo_thu],
]
BAO_CAO.write_text('\n'.join(bao_cao) + '\n', encoding='utf8')
print('\n'.join(bao_cao))
print(f'→ {FILE_RA.relative_to(GOC)} ({FILE_RA.stat().st_size // 1024} KB)')
