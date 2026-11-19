# -*- coding: utf-8 -*-
"""
GHÉP + KIỂM TRA DỮ LIỆU THI THỬ HSK 2 (Giai đoạn 5.3)

Đọc:
  cong-cu/nguon-thi-thu/tranh2.txt    bộ tranh emoji + câu kể + hội thoại (định dạng ở đầu file)
  cong-cu/nguon-thi-thu/cap2-*.txt    ngân hàng câu hỏi soạn tay:
      ### hd…    hỏi–đáp 5 cặp (Q/A)                       → Đọc phần 3
      ### dt…    điền từ: 6 từ (W) + 5 câu (F)               → Đọc phần 2
      ### hoi…   hội thoại 2 câu (N) + câu hỏi (H) + A + 2 X → Nghe phần 3
      ### doan…  đoạn văn (P) + câu hỏi (H) + A + 2 X        → Đọc phần 4
      ### bo     bộ thủ: B từ | pinyin | chữ | phần thiếu | phần còn lại   → Viết phần 1
      ### viet   viết chữ: V câu （ ） | pinyin | chữ | dịch              → Viết phần 2
Ghi: app/data/thi-thu-hsk2.json · báo cáo cong-cu/bao-cao-thi-thu-hsk2.txt (có LỖI thì không ghi JSON)

Cách chạy (tại thư mục dự án):
    python -X utf8 cong-cu/ghep-thi-thu-2.py

KIỂM TRA: pinyin so với CC-CEDICT (LỖI nếu không khớp chữ), biến điệu 不/一, chữ ngoài cấp 1–2 (CẢNH BÁO),
câu kể của tranh phải chứa từ khóa của tranh đó, đủ dòng của mỗi mục, đáp án điền từ không trùng,
chữ viết tay thuộc 100 chữ cấp 1–2.
"""
import importlib.util
import json
import re
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent
THU_MUC = GOC / 'cong-cu' / 'nguon-thi-thu'
FILE_RA = GOC / 'app' / 'data' / 'thi-thu-hsk2.json'
BAO_CAO = GOC / 'cong-cu' / 'bao-cao-thi-thu-hsk2.txt'
LA_CHU_HAN = re.compile(r'[一-鿿]')

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
    chu_cho_phep = set(chinh_thuc['nhanBiet']['1']) | set(chinh_thuc['nhanBiet']['2'])
    for f in ('hsk1.json', 'hsk2.json'):
        for b in doc_json(GOC / 'app' / 'data' / f)['baiHoc']:
            for t in b['tu']:
                chu_cho_phep.update(c for c in t['hanzi'] if LA_CHU_HAN.match(c))
    viet_tay = set(doc_json(GOC / 'app' / 'data' / 'net-chu-hsk1.json')['vietTay12'])

    # ---------- 1. Bộ tranh ----------
    tranh, hien_tai = [], None
    for so, dong in enumerate((THU_MUC / 'tranh2.txt').read_text(encoding='utf-8').splitlines(), 1):
        dong = dong.strip()
        noi = f'tranh2.txt:{so}'
        if not dong or (dong.startswith('#') and not dong.startswith('## ')):
            continue
        if dong.startswith('## '):
            p = tach(dong[3:])
            if len(p) != 3:
                loi.append(f'{noi}: dòng tranh cần "từ khóa | emoji | nhóm"')
                hien_tai = None
                continue
            khoa = [k.strip() for k in p[0].split(',') if k.strip()]
            hien_tai = {'id': khoa[0], 'khoa': khoa, 'emoji': p[1], 'nhom': p[2], 'cau': [], 'hoiThoai': [], '_noi': noi}
            tranh.append(hien_tai)
            continue
        if hien_tai is None:
            loi.append(f'{noi}: dòng nằm ngoài tranh nào')
            continue
        ky, nd = dong[0], dong[1:].strip()
        p = tach(nd)
        if ky == 'S' and len(p) == 3:
            hien_tai['cau'].append({'han': p[0], 'pinyin': p[1], 'dich': p[2], '_noi': noi})
            can_kiem.append((p[0], p[1], noi))
        elif ky == 'D' and len(p) == 5:
            hien_tai['hoiThoai'].append({'cau': [{'han': p[0], 'pinyin': p[1]}, {'han': p[2], 'pinyin': p[3]}],
                                         'dich': p[4], '_noi': noi})
            can_kiem += [(p[0], p[1], noi), (p[2], p[3], noi)]
        else:
            loi.append(f'{noi}: sai định dạng (S câu | pinyin | dịch · D câu1 | py1 | câu2 | py2 | dịch)')

    def co_tranh(han):
        return [t['id'] for t in tranh if any(k in han for k in t['khoa'])]

    for t in tranh:
        if len(t['cau']) < 2:
            loi.append(f'{t["_noi"]}: tranh "{t["id"]}" cần ít nhất 2 câu kể (S)')
        if not t['hoiThoai']:
            loi.append(f'{t["_noi"]}: tranh "{t["id"]}" cần ít nhất 1 hội thoại (D)')
        for c in t['cau']:
            c['coTranh'] = co_tranh(c['han'])
            if t['id'] not in c['coTranh']:
                loi.append(f'{c["_noi"]}: câu "{c["han"]}" không chứa từ khóa của tranh "{t["id"]}"')
        for d in t['hoiThoai']:
            d['coTranh'] = co_tranh(d['cau'][0]['han'] + d['cau'][1]['han'])
            if t['id'] not in d['coTranh']:
                loi.append(f'{d["_noi"]}: hội thoại không chứa từ khóa của tranh "{t["id"]}"')
    nhom_dem = {}
    for t in tranh:
        nhom_dem[t['nhom']] = nhom_dem.get(t['nhom'], 0) + 1
    for n, k in nhom_dem.items():
        if k < 3:
            loi.append(f'tranh2.txt: nhóm "{n}" chỉ có {k} tranh (cần ít nhất 3)')

    # ---------- 2. Ngân hàng câu hỏi ----------
    hoi_dap, dien_tu, hoi, doan, bo_thu, viet = [], [], [], [], [], []
    for f in sorted(THU_MUC.glob('cap2-*.txt')):
        muc = None
        for so, dong in enumerate(f.read_text(encoding='utf-8').splitlines(), 1):
            dong = dong.strip()
            noi = f'{f.name}:{so}'
            if not dong or (dong.startswith('#') and not dong.startswith('### ')):
                continue
            if dong.startswith('### '):
                ten = dong[4:].strip()
                loai = re.match(r'[a-z]+', ten).group(0)
                muc = {'loai': loai, 'ten': ten, 'dong': [], '_noi': noi}
                if loai == 'hd':
                    hoi_dap.append(muc)
                elif loai == 'dt':
                    dien_tu.append(muc)
                elif loai == 'hoi':
                    hoi.append(muc)
                elif loai == 'doan':
                    doan.append(muc)
                elif loai == 'bo':
                    bo_thu.append(muc)
                elif loai == 'viet':
                    viet.append(muc)
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

    # Hỏi–đáp
    ra_hd = []
    for m in hoi_dap:
        q, a = lay(m, 'Q', 2), lay(m, 'A', 2)
        if len(q) != 5 or len(a) != 5:
            loi.append(f'{m["_noi"]}: nhóm hỏi–đáp cần đúng 5 câu hỏi (Q) và 5 câu trả lời (A)')
            continue
        for x in q + a:
            can_kiem.append((x[0], x[1], m['_noi']))
        ra_hd.append({'cap': [{'q': qq[0], 'qp': qq[1], 'a': aa[0], 'ap': aa[1]} for qq, aa in zip(q, a)]})
    # Điền từ
    ra_dt = []
    for m in dien_tu:
        w, fc = lay(m, 'W', 2), lay(m, 'F', 3)
        if len(w) != 6 or len(fc) != 5:
            loi.append(f'{m["_noi"]}: nhóm điền từ cần 6 từ (W) và 5 câu (F)')
            continue
        tu = [x[0] for x in w]
        dap = [x[2] for x in fc]
        if len(set(dap)) != 5 or any(d not in tu for d in dap):
            loi.append(f'{m["_noi"]}: đáp án điền từ phải là 5 từ khác nhau trong 6 từ của nhóm')
        for x in fc:
            if x[0].count('（ ）') != 1:
                loi.append(f'{m["_noi"]}: câu "{x[0]}" phải có đúng một chỗ （ ）')
            can_kiem.append((x[0].replace('（ ）', x[2]), x[1], m['_noi']))
        ra_dt.append({'tu': [{'h': x[0], 'p': x[1]} for x in w],
                      'cau': [{'cau': x[0], 'pinyin': x[1], 'dapAn': x[2]} for x in fc]})
    # Hội thoại + câu hỏi
    ra_hoi = []
    for m in hoi:
        n, h, a, x = lay(m, 'N', 2), lay(m, 'H', 2), lay(m, 'A', 2), lay(m, 'X', 2)
        if len(n) != 2 or len(h) != 1 or len(a) != 1 or len(x) != 2:
            loi.append(f'{m["_noi"]}: mục "{m["ten"]}" cần 2 dòng N, 1 dòng H, 1 dòng A, 2 dòng X')
            continue
        for y in n + h + a + x:
            can_kiem.append((y[0], y[1], m['_noi']))
        if a[0][0] in [y[0] for y in x]:
            loi.append(f'{m["_noi"]}: đáp án đúng trùng đáp án sai')
        ra_hoi.append({'n': [{'han': y[0], 'pinyin': y[1]} for y in n], 'h': h[0][0], 'hp': h[0][1],
                       'a': a[0][0], 'ap': a[0][1], 'x': [{'h': y[0], 'p': y[1]} for y in x]})
    # Đoạn văn + câu hỏi
    ra_doan = []
    for m in doan:
        p, h, a, x = lay(m, 'P', 2), lay(m, 'H', 2), lay(m, 'A', 2), lay(m, 'X', 2)
        if len(p) != 1 or len(h) != 1 or len(a) != 1 or len(x) != 2:
            loi.append(f'{m["_noi"]}: mục "{m["ten"]}" cần 1 dòng P, 1 dòng H, 1 dòng A, 2 dòng X')
            continue
        for y in p + h + a + x:
            can_kiem.append((y[0], y[1], m['_noi']))
        ra_doan.append({'p': p[0][0], 'pp': p[0][1], 'h': h[0][0], 'hp': h[0][1], 'a': a[0][0], 'ap': a[0][1],
                        'x': [{'h': y[0], 'p': y[1]} for y in x]})
    # Bộ thủ
    ra_bo = []
    for m in bo_thu:
        for k, p, noi in m['dong']:
            if k != 'B' or len(p) != 5:
                loi.append(f'{noi}: dòng bộ thủ cần "B từ | pinyin | chữ | phần thiếu | phần còn lại"')
                continue
            tu, py, chu, bo, con = p
            if chu not in tu or len(chu) != 1 or len(bo) != 1 or len(con) != 1:
                loi.append(f'{noi}: "{chu}" phải là một chữ trong "{tu}"; phần thiếu / còn lại mỗi thứ một ký tự')
                continue
            can_kiem.append((tu, py, noi))
            ra_bo.append({'tu': tu, 'py': py, 'chu': chu, 'viTri': tu.index(chu), 'bo': bo, 'conLai': con})
    if len({b['bo'] for b in ra_bo}) < 6:
        loi.append('Phần bộ thủ cần ít nhất 6 bộ khác nhau để tạo 6 lựa chọn A–F')
    # Viết chữ
    ra_viet = []
    for m in viet:
        for k, p, noi in m['dong']:
            if k != 'V' or len(p) != 4:
                loi.append(f'{noi}: dòng viết chữ cần "V câu （ ） | pinyin | chữ | dịch"')
                continue
            cau, py, chu, dich = p
            if cau.count('（ ）') != 1:
                loi.append(f'{noi}: câu phải có đúng một chỗ （ ）')
            if chu not in viet_tay:
                loi.append(f'{noi}: chữ "{chu}" không thuộc 100 chữ viết tay cấp 1–2')
            can_kiem.append((cau.replace('（ ）', chu), py, noi))
            ra_viet.append({'cau': cau, 'pinyin': py, 'chu': chu, 'dich': dich})

    # ---------- 3. Kiểm tra pinyin, biến điệu, chữ ngoài cấp ----------
    can_chu = {c for han, _, _ in can_kiem for c in han if LA_CHU_HAN.match(c)}
    tu_dien = kt.doc_cedict(can_chu)
    dai = max((len(k) for k in tu_dien), default=1)
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
            canh_bao.append(f'{noi}: {han} – chữ ngoài cấp 1–2: {"、".join(ngoai)}')

    # ---------- 4. Ghi ----------
    def sach(x):
        if isinstance(x, dict):
            return {k: sach(v) for k, v in x.items() if not k.startswith('_')}
        if isinstance(x, list):
            return [sach(v) for v in x]
        return x

    goi = {'_ghiChu': 'File tạo tự động bởi cong-cu/ghep-thi-thu-2.py – không sửa tay. Câu hỏi tự soạn, không phải đề chính thức.',
           'capDo': 2, 'tranh': sach(tranh), 'hoiDap': ra_hd, 'dienTu': ra_dt, 'hoi': ra_hoi, 'doan': ra_doan,
           'boThu': ra_bo, 'viet': ra_viet}
    if not loi:
        FILE_RA.write_text(json.dumps(goi, ensure_ascii=False, indent=1), encoding='utf-8')
    so_cau_tranh = sum(len(t['cau']) for t in tranh)
    so_ht = sum(len(t['hoiThoai']) for t in tranh)
    dong = [f'Tranh: {len(tranh)} (câu kể {so_cau_tranh}, hội thoại {so_ht}) · hỏi–đáp: {len(ra_hd)} nhóm · '
            f'điền từ: {len(ra_dt)} nhóm · hội thoại+hỏi: {len(ra_hoi)} · đoạn văn: {len(ra_doan)} · '
            f'bộ thủ: {len(ra_bo)} · viết chữ: {len(ra_viet)}',
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
