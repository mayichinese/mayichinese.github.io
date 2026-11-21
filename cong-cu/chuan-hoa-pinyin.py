# -*- coding: utf-8 -*-
"""
CHUẨN HÓA PINYIN CÂU theo quy tắc trong cong-cu/quy-tac-pinyin.txt (bản soát chuyên gia, mục 1.6 và 4.1).

Quét mọi file nguồn soạn tay có câu chữ Hán + pinyin:
  cong-cu/nguon-hsk1/, nguon-hsk2/, nguon-hsk3/, nguon-ngu-phap/, nguon-doc-hieu/, nguon-thi-thu/
Trong một dòng, ô (ngăn bởi |) có chữ Hán đứng ngay trước ô pinyin → một cặp câu.
Script dóng từng chữ Hán với một âm tiết pinyin (cách đọc theo CC-CEDICT), tách câu thành từ
theo từ điển HSK 1–3, rồi áp các quy tắc:
  R1  động từ + bổ ngữ xu hướng kép (起来…): viết rời khỏi động từ, 来/去 thanh nhẹ   (kàn qǐlai)
  R1b động từ mang/chuyển + 来/去 đơn: viết liền, 来/去 thanh nhẹ                    (sònglai)
  R2  động từ 1 âm tiết + bổ ngữ kết quả 1 âm tiết: viết liền                         (zhǎodào)
  R3  động từ ≥ 2 âm tiết + bổ ngữ kết quả: viết rời                                 (zhěnglǐ hǎo)
  R4  了 / 着 / 过 (thanh nhẹ) viết rời                                               (kàn le)

Cách chạy (tại thư mục dự án):
    python -X utf8 cong-cu/chuan-hoa-pinyin.py          chỉ báo cáo → cong-cu/bao-cao-chuan-hoa-pinyin.txt
    python -X utf8 cong-cu/chuan-hoa-pinyin.py --sua    sửa thẳng vào file nguồn (xem báo cáo trước!)
    python -X utf8 cong-cu/chuan-hoa-pinyin.py --bo R1b,R4   bỏ qua một số quy tắc
Sửa xong phải chạy lại các script ghép dữ liệu (xem CLAUDE.md).
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent
APP = GOC / 'app'
CEDICT = GOC / 'cong-cu' / 'tu-dien-doi-chieu' / 'cedict.txt'
QUY_TAC = GOC / 'cong-cu' / 'quy-tac-pinyin.txt'
BAO_CAO = GOC / 'cong-cu' / 'bao-cao-chuan-hoa-pinyin.txt'
THU_MUC = ['nguon-hsk1', 'nguon-hsk2', 'nguon-hsk3', 'nguon-ngu-phap', 'nguon-doc-hieu', 'nguon-thi-thu']

SUA = '--sua' in sys.argv
BO = set()
if '--bo' in sys.argv:
    BO = set(sys.argv[sys.argv.index('--bo') + 1].split(','))

LA_HAN = re.compile(r'[㐀-鿿]')
DAU = {'̄': 1, '́': 2, '̌': 3, '̀': 4}
# Chữ được phép trong ô pinyin (ngoài chữ cái a–z): nguyên âm có dấu thanh và ü
CHU_PINYIN = set('āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü')
KHONG_DAU = {c: unicodedata.normalize('NFC', ''.join(x for x in unicodedata.normalize('NFD', c) if x not in DAU))
             for c in CHU_PINYIN}

# ---------- Quy tắc ----------
qt = {}
for dong in QUY_TAC.read_text(encoding='utf8').splitlines():
    if '=' in dong and not dong.startswith('#'):
        k, v = dong.split('=', 1)
        qt[k.strip()] = v.split()
BN_KEP = set(qt['bo-ngu-xu-huong-kep'])
BN_DON = set(qt['bo-ngu-xu-huong-don'])
DT_MANG = set(qt['dong-tu-mang-don'])
BN_KQ = set(qt['bo-ngu-ket-qua'])
KHONG_NHAN = set(qt['khong-nhan-bo-ngu'])
NGOAI_LE = set(qt['ngoai-le-bo-ngu'])
BO_QUA_CUM = qt.get('bo-qua-cum', [])
TRO_TU_THE = {'了', '着', '过'}   # 了 着 过

# ---------- Từ điển HSK ----------
tu_dien = {}   # chữ → (cấp, pinyin chính thức, là động từ)
for cap in (1, 2, 3):
    p = APP / 'data' / f'hsk{cap}.json'
    for bai in json.loads(p.read_text(encoding='utf8'))['baiHoc']:
        for t in bai['tu']:
            h = t['hanzi']
            dt = any(n.get('tuLoai') == '动' for n in t.get('nghia', []))
            if h in tu_dien:
                c0, p0, d0 = tu_dien[h]
                tu_dien[h] = (c0, p0, d0 or dt)
            else:
                tu_dien[h] = (cap, t['pinyin'], dt)


def la_dong_tu(h):
    return h in tu_dien and tu_dien[h][2]


def tach_chuoi(s):
    """Khớp dài nhất ≤ 4 chữ hai chiều (cùng thuật toán kiem-tra-tu-chua-hoc.py)"""
    xuoi, i = [], 0
    while i < len(s):
        l = min(4, len(s) - i)
        while l > 1 and s[i:i + l] not in tu_dien:
            l -= 1
        xuoi.append(s[i:i + l])
        i += l
    nguoc, j = [], len(s)
    while j > 0:
        l = min(4, j)
        while l > 1 and s[j - l:j] not in tu_dien:
            l -= 1
        nguoc.insert(0, s[j - l:j])
        j -= l
    if len(xuoi) != len(nguoc):
        return xuoi if len(xuoi) < len(nguoc) else nguoc
    le = lambda ds: sum(1 for x in ds if len(x) == 1)
    if le(xuoi) != le(nguoc):
        return xuoi if le(xuoi) < le(nguoc) else nguoc
    cap_cao = lambda ds: max((tu_dien[x][0] if x in tu_dien else 4) for x in ds)
    return xuoi if cap_cao(xuoi) < cap_cao(nguoc) else nguoc


# ---------- Cách đọc từng chữ (CC-CEDICT) ----------
doc_chu = {}
for dong in CEDICT.read_text(encoding='utf8').splitlines():
    if dong.startswith('#'):
        continue
    m = re.match(r'\S+ (\S+) \[([^\]]+)\]', dong)
    if not m:
        continue
    han, py = m.group(1), m.group(2).lower().replace('u:', 'v').split()
    if len(han) != len(py):
        continue
    for c, a in zip(han, py):
        doc_chu.setdefault(c, set()).add(re.sub(r'\d', '', a))


# ---------- Tách ô pinyin thành chữ cái ----------
def chu_cai(py):
    """→ danh sách (vị trí trong chuỗi, chữ cái gốc, thanh); ranh giới = tập vị trí (trong danh sách) bắt đầu một nhóm mới"""
    ds, ranh = [], set()
    truoc_la_chu = False
    for i, c in enumerate(py):
        nfd = unicodedata.normalize('NFD', c.lower())
        goc = nfd[0]
        if 'a' <= goc <= 'z':
            thanh = next((DAU[x] for x in nfd[1:] if x in DAU), 0)
            if '̈' in nfd:
                goc = 'v'
            if not truoc_la_chu:
                ranh.add(len(ds))
            ds.append((i, goc, thanh))
            truoc_la_chu = True
        else:
            truoc_la_chu = False
    return ds, ranh


def dong_hang(chu_han, cc, ranh):
    """Dóng mỗi chữ Hán với một đoạn [đầu, cuối) trong danh sách chữ cái. Trả về None nếu không khớp."""
    chuoi = ''.join(x[1] for x in cc)
    n = len(chu_han)
    nho = {}

    def thu(i, pos):
        if i == n:
            return [] if pos == len(chuoi) else None
        if (i, pos) in nho:
            return nho[(i, pos)]
        kq = None
        doc = doc_chu.get(chu_han[i], set())
        if chu_han[i] == '儿' and i > 0:          # 儿 cuốn lưỡi: chỉ một chữ r, dính âm trước
            doc = doc | {'r'}
        for L in range(6, 0, -1):
            doan = chuoi[pos:pos + L]
            if len(doan) < L or doan not in doc:
                continue
            if any(b in ranh for b in range(pos + 1, pos + L)):
                continue
            if doan == 'r' and pos in ranh:
                continue
            sau = thu(i + 1, pos + L)
            if sau is not None:
                kq = [(pos, pos + L)] + sau
                break
        nho[(i, pos)] = kq
        return kq

    return thu(0, 0)


# ---------- Áp quy tắc cho một cặp câu ----------
def xu_ly(han, py):
    """→ (pinyin mới, [tên quy tắc đã áp]) hoặc None nếu không dóng được"""
    chu_han = LA_HAN.findall(han)
    if not chu_han or any(c in han for c in BO_QUA_CUM):
        return None
    cc, ranh = chu_cai(py)
    am = dong_hang(chu_han, cc, ranh)
    if am is None:
        return None
    # Tách câu thành từ, giữ chỉ số chữ toàn cục
    tu = []   # (chuỗi, [chỉ số chữ], chỉ số đoạn liền)
    k = 0
    for so_doan, doan in enumerate(re.findall(r'[㐀-鿿]+', han)):
        for t in tach_chuoi(doan):
            tu.append((t, list(range(k, k + len(t))), so_doan))
            k += len(t)

    nhe = set()        # chỉ số chữ đổi sang thanh nhẹ
    noi = {}           # chỉ số chữ i → 'lien' (bỏ khoảng trắng trước i) / 'roi' (thêm khoảng trắng trước i)
    da_ap = []

    def khoang(i):
        """Khoảng giữa âm tiết i-1 và i trong chuỗi gốc"""
        return py[cc[am[i - 1][1] - 1][0] + 1: cc[am[i][0]][0]]

    def dat(i, kieu, ten):
        hien = khoang(i)
        if kieu == 'lien' and hien.strip() == '' and hien != '':
            noi[i] = 'lien'
            da_ap.append(ten)
        elif kieu == 'roi' and hien in ('', "'", '’'):
            noi[i] = 'roi'
            da_ap.append(ten)

    def dat_nhe(i, ten):
        if any(cc[j][2] for j in range(*am[i])):
            nhe.add(i)
            da_ap.append(ten)

    for vt in range(1, len(tu)):
        t, ci, sd = tu[vt]
        tr, ctr, sdt = tu[vt - 1]
        if sd != sdt:
            continue
        nhan_bo_ngu = la_dong_tu(tr) and tr not in KHONG_NHAN
        if t in BN_KEP and 'R1' not in BO and (nhan_bo_ngu or tr + t in NGOAI_LE):
            dat(ci[0], 'roi', 'R1 ' + tr + '+' + t)
            dat(ci[1], 'lien', 'R1 ' + tr + '+' + t)
            dat_nhe(ci[1], 'R1 ' + tr + '+' + t)
        elif t in BN_DON and 'R1b' not in BO and tr in DT_MANG:
            dat(ci[0], 'lien', 'R1b ' + tr + '+' + t)
            dat_nhe(ci[0], 'R1b ' + tr + '+' + t)
        elif t in BN_KQ and len(t) == 1:
            if len(tr) == 1 and (nhan_bo_ngu or tr + t in NGOAI_LE) and 'R2' not in BO:
                dat(ci[0], 'lien', 'R2 ' + tr + '+' + t)
            elif len(tr) >= 2 and la_dong_tu(tr) and 'R3' not in BO:
                dat(ci[0], 'roi', 'R3 ' + tr + '+' + t)
        elif t in TRO_TU_THE and 'R4' not in BO:
            if not any(cc[j][2] for j in range(*am[ci[0]])):   # chỉ khi đọc nhẹ (le, zhe, guo)
                dat(ci[0], 'roi', 'R4 ' + tr + '+' + t)

    if not da_ap:
        return py, []
    # Dựng lại chuỗi pinyin
    ra = py[:cc[am[0][0]][0]]
    for i, (a, b) in enumerate(am):
        if i:
            g = khoang(i)
            if noi.get(i) == 'lien':
                g = "'" if cc[a][1] in 'aoe' else ''
            elif noi.get(i) == 'roi':
                g = ' '
            ra += g
        doan = py[cc[a][0]: cc[b - 1][0] + 1]
        if i in nhe:
            doan = ''.join(KHONG_DAU.get(c, c) for c in doan)
        ra += doan
    ra += py[cc[am[-1][1] - 1][0] + 1:]
    return ra, da_ap


def la_o_pinyin(o):
    o = o.strip()
    if not o or LA_HAN.search(o) or not re.search(r'[a-zA-Z]', o):
        return False
    return all(('a' <= c.lower() <= 'z') or c in CHU_PINYIN or c in CHU_PINYIN_HOA or not c.isalpha() for c in o)


CHU_PINYIN_HOA = {c.upper() for c in CHU_PINYIN}
CHO_TRONG = re.compile(r'_{2,}|（\s*）|\(\s*\)')

# ---------- Quét file ----------
bao_cao = {}
khong_dong = 0
so_cap = 0
for tm in THU_MUC:
    for f in sorted((GOC / 'cong-cu' / tm).glob('*.txt')):
        dong_ds = f.read_text(encoding='utf8').split('\n')
        doi = False
        for so, dong in enumerate(dong_ds):
            if dong.lstrip().startswith('#') or '|' not in dong:
                continue
            o = dong.split('|')
            for j in range(1, len(o)):
                if not la_o_pinyin(o[j]):
                    continue
                goc = o[j].strip()
                kq = None
                han = ''
                # Câu chữ Hán: ô gần nhất phía trước dóng được; câu có chỗ trống thì thử điền đáp án (ô chữ Hán khác)
                dap_an = [x.strip() for x in o if LA_HAN.search(x) and ';' not in x and not CHO_TRONG.search(x)]
                for i in range(j - 1, -1, -1):
                    if not LA_HAN.search(o[i]) or ';' in o[i]:
                        continue
                    cau = o[i].replace('/', '')
                    thu_cau = [CHO_TRONG.sub(d, cau, 1) for d in dap_an if len(d) <= 4] if CHO_TRONG.search(cau) else [cau]
                    for c in thu_cau:
                        kq = xu_ly(c, goc)
                        if kq is not None:
                            han = c
                            break
                    if kq is not None:
                        break
                so_cap += 1
                if kq is None:
                    khong_dong += 1
                    if '--loi' in sys.argv:
                        print('không dóng được:', f.name, so + 1, goc[:60])
                    continue
                moi, ap = kq
                if moi != goc:
                    for ten in sorted({x.split()[0] for x in ap}):
                        cap_tu = ' '.join(sorted({x.split()[1] for x in ap if x.split()[0] == ten}))
                        bao_cao.setdefault(ten, []).append(
                            f'{f.relative_to(GOC).as_posix()}:{so + 1}  [{cap_tu}]  {"".join(LA_HAN.findall(han))}\n    {goc}\n  → {moi}')
                    o[j] = o[j].replace(goc, moi, 1)
                    doi = True
            if doi:
                dong_ds[so] = '|'.join(o)
                doi_file = True
        if SUA and doi_file:
            f.write_text('\n'.join(dong_ds), encoding='utf8')

TEN = {'R1': 'Bổ ngữ xu hướng kép sau động từ (viết rời, 来/去 nhẹ)', 'R1b': 'Động từ mang + 来/去 (viết liền, nhẹ)',
       'R2': 'Động từ 1 âm tiết + bổ ngữ 1 âm tiết (viết liền)', 'R3': 'Động từ ≥ 2 âm tiết + bổ ngữ (viết rời)',
       'R4': '了 / 着 / 过 viết rời'}
ra = [f'Cặp câu chữ Hán + pinyin: {so_cap} · không dóng được (bỏ qua): {khong_dong}',
      'CHẾ ĐỘ: ' + ('ĐÃ SỬA FILE NGUỒN' if SUA else 'chỉ báo cáo (thêm --sua để sửa)'), '']
for ten in ('R1', 'R1b', 'R2', 'R3', 'R4'):
    ds = bao_cao.get(ten, [])
    ra.append(f'===== {ten} · {TEN[ten]}: {len(ds)} câu =====')
    ra.extend(ds)
    ra.append('')
BAO_CAO.write_text('\n'.join(ra), encoding='utf8')
print('\n'.join(x for x in ra if x.startswith(('Cặp', 'CHẾ', '====='))))
print(f'→ {BAO_CAO.relative_to(GOC)}')
