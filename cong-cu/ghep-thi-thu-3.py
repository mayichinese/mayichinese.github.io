# -*- coding: utf-8 -*-
"""
GHÉP + KIỂM TRA DỮ LIỆU THI THỬ HSK 3 (Giai đoạn 5.4)

Cấu trúc đề (theo đề thi thử trong sách bài tập 《新HSK教程 3》, câu hỏi tự soạn):
  NGHE 30: P1 (1–10) nghe hội thoại chọn tranh – 2 nhóm · P2 (11–20) hội thoại + câu hỏi · P3 (21–30) nghe một đoạn + câu hỏi
  ĐỌC 30 (30′): P1 (31–40) ghép câu với câu đáp – 2 nhóm · P2 (41–50) điền từ: 5 câu + 5 hội thoại
                P3 (51–60) đọc đoạn văn trả lời ★: 6 đoạn một câu hỏi + 2 đoạn hai câu hỏi
  VIẾT 10 (20′): P1 (61–65) viết tay chữ còn thiếu (có pinyin) · P2 (66–70) nhìn tranh, sắp xếp câu có từ cho sẵn

Đọc:
  cong-cu/nguon-thi-thu/tranh3*.txt   bộ tranh emoji:
      ## từ khóa1,từ khóa2 | emoji | nhóm
      D câu 1 | pinyin 1 | câu 2 | pinyin 2 | dịch          hội thoại khớp tranh       → Nghe P1
      C từ cho sẵn | mảnh1/mảnh2/…/mảnhN。 | pinyin | dịch  câu mẫu để sắp xếp      → Viết P2
      ~ mảnh…/…。                                           thứ tự khác cũng đúng (cho dòng C ngay trên)
  cong-cu/nguon-thi-thu/cap3-*.txt    ngân hàng câu hỏi:
      ### hd…    ghép: 5 cặp Q câu | pinyin  /  A câu đáp | pinyin               → Đọc P1
      ### dt…    điền từ – câu: 6 dòng W từ | pinyin, 5 dòng F câu（ ）| pinyin | từ đúng   → Đọc P2 (41–45)
      ### dh…    điền từ – hội thoại: như dt nhưng F gồm 2 lượt lời nối bằng ／ (cả câu và pinyin) → Đọc P2 (46–50)
      ### hoi…   2 dòng N (lời thoại) + H câu hỏi + A đáp án đúng + 2 dòng X đáp án sai  → Nghe P2
      ### doan…  P đoạn | pinyin + H + A + 2 X                                    → Nghe P3 và Đọc P3 (51–56)
      ### dai…   P đoạn | pinyin, rồi HAI lần (H, A, X, X)                         → Đọc P3 (57–60)
      ### viet   V câu（ ）| pinyin cả câu | chữ | dịch   (chữ thuộc 250 chữ viết tay cấp 1–3) → Viết P1
Ghi: app/data/thi-thu-hsk3.json · báo cáo cong-cu/bao-cao-thi-thu-hsk3.txt (có LỖI thì không ghi JSON)

Cách chạy (tại thư mục dự án):
    python -X utf8 cong-cu/ghep-thi-thu-3.py

KIỂM TRA: pinyin so với CC-CEDICT (LỖI nếu không khớp chữ), biến điệu 不/一, chữ ngoài cấp 1–3 (CẢNH BÁO),
hội thoại của tranh phải chứa từ khóa tranh đó, câu sắp xếp phải chứa từ cho sẵn và các thứ tự ~ phải dùng đúng
các mảnh đó, đủ dòng mỗi mục, đáp án điền từ không trùng, câu trùng lặp giữa các mục (CẢNH BÁO), đủ số mục cho một đề.
"""
import importlib.util
import json
import re
from collections import Counter
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent
THU_MUC = GOC / 'cong-cu' / 'nguon-thi-thu'
FILE_RA = GOC / 'app' / 'data' / 'thi-thu-hsk3.json'
BAO_CAO = GOC / 'cong-cu' / 'bao-cao-thi-thu-hsk3.txt'
LA_CHU_HAN = re.compile(r'[一-鿿]')
DAU_CUOI = '。？！'
CHO_TRONG = '（ ）'
NOI_LUOT = '／'

# Số mục tối thiểu để tạo được một đề (nên có gấp 2–3 lần để đề thay đổi)
TOI_THIEU = {'tranh có hội thoại': 11, 'tranh có câu sắp xếp': 5, 'nhóm ghép (hd)': 2, 'nhóm điền từ câu (dt)': 1,
             'nhóm điền từ hội thoại (dh)': 1, 'hội thoại + hỏi (hoi)': 10, 'đoạn + hỏi (doan)': 16,
             'đoạn hai câu hỏi (dai)': 2, 'viết chữ (viet)': 5}

# Dùng lại hàm kiểm tra pinyin / biến điệu của script ngữ pháp (không sửa script đó)
_spec = importlib.util.spec_from_file_location('ghep_ngu_phap', GOC / 'cong-cu' / 'ghep-ngu-phap.py')
gnp = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(gnp)
kt = gnp.kt


def tach(nd):
    return [p.strip() for p in nd.split('|')]


def doc_json(p):
    return json.loads(p.read_text(encoding='utf-8'))


def main():
    loi, canh_bao = [], []
    can_kiem = []   # (chữ Hán, pinyin, vị trí)

    chinh_thuc = doc_json(GOC / 'app' / 'data' / 'chinh-thuc' / 'chu-han-hsk1-3.json')
    chu_cho_phep = set()
    for k in ('1', '2', '3'):
        chu_cho_phep |= set(chinh_thuc['nhanBiet'][k])
    for f in ('hsk1.json', 'hsk2.json', 'hsk3.json'):
        for b in doc_json(GOC / 'app' / 'data' / f)['baiHoc']:
            for t in b['tu']:
                chu_cho_phep.update(c for c in t['hanzi'] if LA_CHU_HAN.match(c))
    viet_tay = set(doc_json(GOC / 'app' / 'data' / 'net-chu-hsk1.json')['vietTay12'])
    viet_tay |= set(doc_json(GOC / 'app' / 'data' / 'net-chu-hsk23.json')['vietTay3'])

    # ---------- 1. Bộ tranh ----------
    tranh, hien_tai, cau_c = [], None, None
    for f in sorted(THU_MUC.glob('tranh3*.txt')):
        for so, dong in enumerate(f.read_text(encoding='utf-8').splitlines(), 1):
            dong = dong.strip()
            noi = f'{f.name}:{so}'
            if not dong or (dong.startswith('#') and not dong.startswith('## ')):
                continue
            if dong.startswith('## '):
                p = tach(dong[3:])
                cau_c = None
                if len(p) != 3:
                    loi.append(f'{noi}: dòng tranh cần "từ khóa | emoji | nhóm"')
                    hien_tai = None
                    continue
                khoa = [k.strip() for k in p[0].split(',') if k.strip()]
                hien_tai = {'id': khoa[0], 'khoa': khoa, 'emoji': p[1], 'nhom': p[2], 'hoiThoai': [], 'xep': [], '_noi': noi}
                tranh.append(hien_tai)
                continue
            if hien_tai is None:
                loi.append(f'{noi}: dòng nằm ngoài tranh nào')
                continue
            ky, nd = dong[0], dong[1:].strip()
            p = tach(nd)
            if ky == 'D' and len(p) == 5:
                hien_tai['hoiThoai'].append({'cau': [{'han': p[0], 'pinyin': p[1]}, {'han': p[2], 'pinyin': p[3]}],
                                             'dich': p[4], '_noi': noi})
                can_kiem += [(p[0], p[1], noi), (p[2], p[3], noi)]
                cau_c = None
            elif ky == 'C' and len(p) == 4:
                tu, chuoi, py, dich = p
                manh = [m.strip() for m in chuoi.split('/')]
                dau = ''
                if manh and manh[-1] and manh[-1][-1] in DAU_CUOI:
                    dau = manh[-1][-1]
                    manh[-1] = manh[-1][:-1].strip()
                han = ''.join(manh) + dau
                if not dau:
                    loi.append(f'{noi}: câu sắp xếp phải kết thúc bằng 。？！')
                if any(not m for m in manh) or not 3 <= len(manh) <= 7:
                    loi.append(f'{noi}: câu sắp xếp cần 3–7 mảnh, không mảnh rỗng')
                if tu not in han:
                    loi.append(f'{noi}: câu "{han}" không chứa từ cho sẵn "{tu}"')
                if not any(k in han for k in hien_tai['khoa']) and tu not in hien_tai['khoa']:
                    canh_bao.append(f'{noi}: câu "{han}" không chứa từ khóa nào của tranh "{hien_tai["id"]}"')
                if len(set(manh)) != len(manh):
                    loi.append(f'{noi}: hai mảnh giống hệt nhau – app không phân biệt được')
                cau_c = {'tu': tu, 'manh': manh, 'khac': [], 'dauCau': dau, 'han': han, 'pinyin': py, 'dich': dich, '_noi': noi}
                hien_tai['xep'].append(cau_c)
                can_kiem.append((han, py, noi))
            elif ky == '~':
                if cau_c is None:
                    loi.append(f'{noi}: dòng ~ phải đứng ngay sau dòng C')
                    continue
                m2 = [m.strip() for m in nd.split('/')]
                if m2 and m2[-1] and m2[-1][-1] in DAU_CUOI:
                    m2[-1] = m2[-1][:-1].strip()
                if Counter(m2) != Counter(cau_c['manh']):
                    loi.append(f'{noi}: thứ tự ~ phải dùng đúng các mảnh của câu C')
                elif m2 == cau_c['manh'] or m2 in cau_c['khac']:
                    loi.append(f'{noi}: thứ tự ~ trùng câu C hoặc trùng dòng ~ khác')
                else:
                    cau_c['khac'].append(m2)
            else:
                loi.append(f'{noi}: sai định dạng (D câu1 | py1 | câu2 | py2 | dịch · C từ | mảnh/…。 | pinyin | dịch · ~ mảnh/…)')

    def co_tranh(han):
        return [t['id'] for t in tranh if any(k in han for k in t['khoa'])]

    for t in tranh:
        if not t['hoiThoai'] and not t['xep']:
            loi.append(f'{t["_noi"]}: tranh "{t["id"]}" chưa có hội thoại (D) hay câu sắp xếp (C)')
        for d in t['hoiThoai']:
            d['coTranh'] = co_tranh(d['cau'][0]['han'] + d['cau'][1]['han'])
            if t['id'] not in d['coTranh']:
                loi.append(f'{d["_noi"]}: hội thoại không chứa từ khóa của tranh "{t["id"]}"')
    dem_emoji = Counter(t['emoji'] for t in tranh)
    for e, k in dem_emoji.items():
        if k > 1:
            loi.append(f'Bộ tranh: emoji {e} dùng cho {k} tranh – mỗi tranh một emoji')
    dem_id = Counter(t['id'] for t in tranh)
    for e, k in dem_id.items():
        if k > 1:
            loi.append(f'Bộ tranh: từ khóa đầu "{e}" trùng {k} tranh')

    # ---------- 2. Ngân hàng câu hỏi ----------
    muc_theo_loai = {k: [] for k in ('hd', 'dt', 'dh', 'hoi', 'doan', 'dai', 'viet')}
    for f in sorted(THU_MUC.glob('cap3-*.txt')):
        muc = None
        for so, dong in enumerate(f.read_text(encoding='utf-8').splitlines(), 1):
            dong = dong.strip()
            noi = f'{f.name}:{so}'
            if not dong or (dong.startswith('#') and not dong.startswith('### ')):
                continue
            if dong.startswith('### '):
                ten = dong[4:].strip()
                loai = re.match(r'[a-z]+', ten).group(0) if re.match(r'[a-z]+', ten) else ''
                muc = {'loai': loai, 'ten': ten, 'dong': [], '_noi': noi}
                if loai in muc_theo_loai:
                    muc_theo_loai[loai].append(muc)
                else:
                    loi.append(f'{noi}: không hiểu loại mục "{ten}"')
                continue
            if muc is None:
                loi.append(f'{noi}: dòng nằm ngoài mục nào')
                continue
            muc['dong'].append((dong[0], tach(dong[1:].strip()), noi))

    def lay(muc, ky, so_phan):
        ds = [(p, noi) for k, p, noi in muc['dong'] if k == ky]
        for p, noi in ds:
            if len(p) != so_phan:
                loi.append(f'{noi}: dòng "{ky}" cần {so_phan} phần, đang có {len(p)}')
        return [p for p, _ in ds if len(p) == so_phan]

    def kiem_dong_la(muc, cho_phep):
        for k, _, noi in muc['dong']:
            if k not in cho_phep:
                loi.append(f'{noi}: mục "{muc["ten"]}" không dùng dòng "{k}"')

    def lua_chon(muc, a, x):
        """Đáp án đúng không được trùng đáp án sai; các đáp án sai không trùng nhau"""
        tat_ca = [a[0]] + [y[0] for y in x]
        if len(set(tat_ca)) != len(tat_ca):
            loi.append(f'{muc["_noi"]}: các lựa chọn A / X bị trùng nhau')

    # Ghép câu ↔ câu đáp
    ra_hd = []
    for m in muc_theo_loai['hd']:
        kiem_dong_la(m, 'QA')
        q, a = lay(m, 'Q', 2), lay(m, 'A', 2)
        if len(q) != 5 or len(a) != 5:
            loi.append(f'{m["_noi"]}: nhóm ghép cần đúng 5 dòng Q và 5 dòng A')
            continue
        for x in q + a:
            can_kiem.append((x[0], x[1], m['_noi']))
        ra_hd.append({'cap': [{'q': qq[0], 'qp': qq[1], 'a': aa[0], 'ap': aa[1]} for qq, aa in zip(q, a)]})

    # Điền từ (câu / hội thoại)
    def dien_tu(ds, hoi_thoai):
        ra = []
        for m in ds:
            kiem_dong_la(m, 'WF')
            w, fc = lay(m, 'W', 2), lay(m, 'F', 3)
            if len(w) != 6 or len(fc) != 5:
                loi.append(f'{m["_noi"]}: nhóm điền từ cần 6 từ (W) và 5 câu (F)')
                continue
            tu = [x[0] for x in w]
            if len(set(tu)) != 6:
                loi.append(f'{m["_noi"]}: 6 từ W phải khác nhau')
            dap = [x[2] for x in fc]
            if len(set(dap)) != 5 or any(d not in tu for d in dap):
                loi.append(f'{m["_noi"]}: đáp án điền từ phải là 5 từ khác nhau trong 6 từ của nhóm')
            for x in fc:
                cau, py, d = x
                if cau.count(CHO_TRONG) != 1:
                    loi.append(f'{m["_noi"]}: câu "{cau}" phải có đúng một chỗ {CHO_TRONG}')
                    continue
                luot_h, luot_p = cau.split(NOI_LUOT), py.split(NOI_LUOT)
                if hoi_thoai and (len(luot_h) != 2 or len(luot_p) != 2):
                    loi.append(f'{m["_noi"]}: hội thoại "{cau}" cần đúng 2 lượt lời nối bằng {NOI_LUOT} (cả câu và pinyin)')
                    continue
                if not hoi_thoai and (len(luot_h) != 1 or len(luot_p) != 1):
                    loi.append(f'{m["_noi"]}: câu điền từ (dt) không dùng {NOI_LUOT}')
                    continue
                for h, p in zip(luot_h, luot_p):
                    can_kiem.append((h.replace(CHO_TRONG, d), p.strip(), m['_noi']))
            ra.append({'tu': [{'h': x[0], 'p': x[1]} for x in w],
                       'cau': [{'cau': x[0], 'pinyin': x[1], 'dapAn': x[2]} for x in fc]})
        return ra
    ra_dt = dien_tu(muc_theo_loai['dt'], False)
    ra_dh = dien_tu(muc_theo_loai['dh'], True)

    # Hội thoại + câu hỏi
    ra_hoi = []
    for m in muc_theo_loai['hoi']:
        kiem_dong_la(m, 'NHAX')
        n, h, a, x = lay(m, 'N', 2), lay(m, 'H', 2), lay(m, 'A', 2), lay(m, 'X', 2)
        if len(n) != 2 or len(h) != 1 or len(a) != 1 or len(x) != 2:
            loi.append(f'{m["_noi"]}: mục "{m["ten"]}" cần 2 dòng N, 1 dòng H, 1 dòng A, 2 dòng X')
            continue
        for y in n + h + a + x:
            can_kiem.append((y[0], y[1], m['_noi']))
        lua_chon(m, a[0], x)
        ra_hoi.append({'n': [{'han': y[0], 'pinyin': y[1]} for y in n], 'h': h[0][0], 'hp': h[0][1],
                       'a': a[0][0], 'ap': a[0][1], 'x': [{'h': y[0], 'p': y[1]} for y in x]})

    # Đoạn + một câu hỏi
    ra_doan = []
    for m in muc_theo_loai['doan']:
        kiem_dong_la(m, 'PHAX')
        p, h, a, x = lay(m, 'P', 2), lay(m, 'H', 2), lay(m, 'A', 2), lay(m, 'X', 2)
        if len(p) != 1 or len(h) != 1 or len(a) != 1 or len(x) != 2:
            loi.append(f'{m["_noi"]}: mục "{m["ten"]}" cần 1 dòng P, 1 dòng H, 1 dòng A, 2 dòng X')
            continue
        for y in p + h + a + x:
            can_kiem.append((y[0], y[1], m['_noi']))
        lua_chon(m, a[0], x)
        ra_doan.append({'p': p[0][0], 'pp': p[0][1], 'h': h[0][0], 'hp': h[0][1], 'a': a[0][0], 'ap': a[0][1],
                        'x': [{'h': y[0], 'p': y[1]} for y in x]})

    # Đoạn + hai câu hỏi (H, A, X, X lặp hai lần theo thứ tự)
    ra_dai = []
    for m in muc_theo_loai['dai']:
        kiem_dong_la(m, 'PHAX')
        p = lay(m, 'P', 2)
        ky_tu = ''.join(k for k, _, _ in m['dong'])
        if len(p) != 1 or ky_tu != 'PHAXXHAXX' or any(len(pp) != 2 for _, pp, _ in m['dong']):
            loi.append(f'{m["_noi"]}: mục "{m["ten"]}" cần đúng thứ tự P, H, A, X, X, H, A, X, X (mỗi dòng "câu | pinyin")')
            continue
        dong = [pp for _, pp, _ in m['dong']]
        for y in dong:
            can_kiem.append((y[0], y[1], m['_noi']))
        cau = []
        for k in (1, 5):
            h, a, x = dong[k], dong[k + 1], dong[k + 2:k + 4]
            lua_chon(m, a, x)
            cau.append({'h': h[0], 'hp': h[1], 'a': a[0], 'ap': a[1], 'x': [{'h': y[0], 'p': y[1]} for y in x]})
        ra_dai.append({'p': p[0][0], 'pp': p[0][1], 'cau': cau})

    # Viết chữ
    ra_viet = []
    for m in muc_theo_loai['viet']:
        for k, p, noi in m['dong']:
            if k != 'V' or len(p) != 4:
                loi.append(f'{noi}: dòng viết chữ cần "V câu（ ）| pinyin | chữ | dịch"')
                continue
            cau, py, chu, dich = p
            if cau.count(CHO_TRONG) != 1:
                loi.append(f'{noi}: câu phải có đúng một chỗ {CHO_TRONG}')
            if chu not in viet_tay:
                loi.append(f'{noi}: chữ "{chu}" không thuộc 250 chữ viết tay cấp 1–3')
            can_kiem.append((cau.replace(CHO_TRONG, chu), py, noi))
            ra_viet.append({'cau': cau, 'pinyin': py, 'chu': chu, 'dich': dich})

    # ---------- 3. Kiểm tra pinyin, biến điệu, chữ ngoài cấp, câu trùng ----------
    can_chu = {c for han, _, _ in can_kiem for c in han if LA_CHU_HAN.match(c)}
    tu_dien = kt.doc_cedict(can_chu)
    dai = max((len(k) for k in tu_dien), default=1)
    gap = {}
    for han, py, noi in can_kiem:
        l, sai = kt.kiem_tra_cau(han, py, tu_dien, dai)
        if l:
            loi.append(f'{noi}: {han} | {py} → {l}')
        for x in sai:
            canh_bao.append(f'{noi}: {han} | {py} → sai thanh? {x}')
        for x in gnp.kiem_tra_bien_dieu(han, py):
            canh_bao.append(f'{noi}: {han} | {py} → {x}')
        ngoai = sorted({c for c in han if LA_CHU_HAN.match(c) and c not in chu_cho_phep})
        if ngoai:
            canh_bao.append(f'{noi}: {han} – chữ ngoài cấp 1–3: {"、".join(ngoai)}')
        if len([c for c in han if LA_CHU_HAN.match(c)]) >= 8:     # câu dài trùng ở hai mục → đề có thể lộ đáp án
            khoa = re.sub(r'[^一-鿿]', '', han)
            if khoa in gap and gap[khoa] != noi:
                canh_bao.append(f'{noi}: câu "{han}" trùng với {gap[khoa]}')
            gap.setdefault(khoa, noi)

    # ---------- 4. Đủ số mục cho một đề ----------
    dem = {'tranh có hội thoại': sum(1 for t in tranh if t['hoiThoai']),
           'tranh có câu sắp xếp': sum(1 for t in tranh if t['xep']),
           'nhóm ghép (hd)': len(ra_hd), 'nhóm điền từ câu (dt)': len(ra_dt), 'nhóm điền từ hội thoại (dh)': len(ra_dh),
           'hội thoại + hỏi (hoi)': len(ra_hoi), 'đoạn + hỏi (doan)': len(ra_doan), 'đoạn hai câu hỏi (dai)': len(ra_dai),
           'viết chữ (viet)': len({v['chu'] for v in ra_viet})}
    for k, toi_thieu in TOI_THIEU.items():
        if dem[k] < toi_thieu:
            loi.append(f'Chưa đủ {k}: có {dem[k]}, cần ít nhất {toi_thieu} để tạo một đề')

    # ---------- 5. Ghi ----------
    def sach(x):
        if isinstance(x, dict):
            return {k: sach(v) for k, v in x.items() if not k.startswith('_')}
        if isinstance(x, list):
            return [sach(v) for v in x]
        return x

    goi = {'_ghiChu': 'File tạo tự động bởi cong-cu/ghep-thi-thu-3.py – không sửa tay. Câu hỏi tự soạn, không phải đề chính thức.',
           'capDo': 3, 'tranh': sach(tranh), 'hoiDap': ra_hd, 'dienTu': ra_dt, 'dienHoiThoai': ra_dh, 'hoi': ra_hoi,
           'doan': ra_doan, 'doanDai': ra_dai, 'viet': ra_viet}
    if not loi:
        FILE_RA.write_text(json.dumps(goi, ensure_ascii=False, indent=1), encoding='utf-8')
    so_ht = sum(len(t['hoiThoai']) for t in tranh)
    so_xep = sum(len(t['xep']) for t in tranh)
    dong = [f'Tranh: {len(tranh)} (hội thoại {so_ht}, câu sắp xếp {so_xep}) · ghép: {len(ra_hd)} nhóm · '
            f'điền từ: {len(ra_dt)} nhóm câu + {len(ra_dh)} nhóm hội thoại · hội thoại+hỏi: {len(ra_hoi)} · '
            f'đoạn: {len(ra_doan)} · đoạn 2 câu hỏi: {len(ra_dai)} · viết chữ: {len(ra_viet)} ({dem["viết chữ (viet)"]} chữ khác nhau)',
            f'LỖI: {len(loi)} · CẢNH BÁO: {len(canh_bao)}', '']
    if loi:
        dong += ['===== LỖI (chưa ghi file JSON) ====='] + ['  - ' + x for x in loi] + ['']
    if canh_bao:
        dong += ['===== CẢNH BÁO ====='] + ['  - ' + x for x in canh_bao] + ['']
    if not loi:
        dong.append(f'Đã ghi {FILE_RA.relative_to(GOC)}')
    bao_cao = '\n'.join(dong)
    BAO_CAO.write_text(bao_cao + '\n', encoding='utf-8')
    print(bao_cao)
    raise SystemExit(1 if loi else 0)


if __name__ == '__main__':
    main()
