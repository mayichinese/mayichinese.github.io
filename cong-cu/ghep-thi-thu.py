# -*- coding: utf-8 -*-
"""
GHÉP + KIỂM TRA DỮ LIỆU THI THỬ HSK 1 (Giai đoạn 5.2)

Đọc:
  cong-cu/nguon-thi-thu/tranh.txt     bộ tranh emoji (từ → biểu tượng)
  cong-cu/nguon-thi-thu/cap1-*.txt    ngân hàng câu hỏi soạn tay (hỏi–đáp, điền từ, câu hỏi theo câu)
  app/data/hsk1.json                  300 từ + 625 câu ví dụ (để lấy câu có tranh)
Ghi: app/data/thi-thu-hsk1.json · báo cáo cong-cu/bao-cao-thi-thu.txt

Cách chạy (tại thư mục dự án):
    python -X utf8 cong-cu/ghep-thi-thu.py

ĐỊNH DẠNG NGÂN HÀNG CÂU HỎI (mỗi nhóm bắt đầu bằng "### <loại><số>"):
  ### hd1   nhóm HỎI–ĐÁP 5 cặp:   Q câu hỏi | pinyin · A trả lời đúng | pinyin · X trả lời sai | pinyin (2 dòng)
            (mỗi câu A chỉ khớp ĐÚNG MỘT câu hỏi trong nhóm – dùng cho bài ghép hỏi–đáp)
  ### dt1   nhóm ĐIỀN TỪ:          W từ | pinyin (6 dòng) · F câu có （ ） | pinyin câu đầy đủ | từ đúng (5 dòng)
  ### cau   CÂU HỎI THEO CÂU:      S câu | pinyin · H câu hỏi | pinyin · A đúng | pinyin · X sai | pinyin (2 dòng)

KIỂM TRA: chữ ngoài cấp 1 (CẢNH BÁO), pinyin so với CC-CEDICT (LỖI nếu không khớp chữ), biến điệu 不/一,
đủ số dòng của mỗi nhóm, đáp án điền từ nằm trong 6 từ và không trùng nhau.
"""
import importlib.util
import json
import re
import sys
import unicodedata
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent
THU_MUC = GOC / 'cong-cu' / 'nguon-thi-thu'
FILE_RA = GOC / 'app' / 'data' / 'thi-thu-hsk1.json'
BAO_CAO = GOC / 'cong-cu' / 'bao-cao-thi-thu.txt'
LA_CHU_HAN = re.compile(r'[一-鿿]')

# Dùng lại hàm kiểm tra pinyin / biến điệu của script ngữ pháp (không sửa script đó)
_spec = importlib.util.spec_from_file_location('ghep_ngu_phap', GOC / 'cong-cu' / 'ghep-ngu-phap.py')
gnp = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(gnp)
kt = gnp.kt


def chuan(py):
    return re.sub(r"[\s'’\-·]", '', unicodedata.normalize('NFC', py.lower()))


def tach(dong):
    return [p.strip() for p in dong.split('|')]


def main():
    loi, canh_bao = [], []
    hsk1 = json.loads((GOC / 'app' / 'data' / 'hsk1.json').read_text(encoding='utf-8'))
    chinh_thuc = json.loads((GOC / 'app' / 'data' / 'chinh-thuc' / 'chu-han-hsk1-3.json').read_text(encoding='utf-8'))
    cac_tu = [t for b in hsk1['baiHoc'] for t in b['tu'] if t.get('daSoan')]
    chu_cap1 = set(chinh_thuc['nhanBiet']['1'])
    for t in cac_tu:
        chu_cap1.update(c for c in t['hanzi'] if LA_CHU_HAN.match(c))
    cac_cau_vd = [v for t in cac_tu for v in t.get('viDu', [])]

    can_kiem = []   # (chữ Hán, pinyin, vị trí) để kiểm tra pinyin

    # ---------- 1. Bộ tranh ----------
    tranh = []
    for so, dong in enumerate((THU_MUC / 'tranh.txt').read_text(encoding='utf-8').splitlines(), 1):
        dong = dong.strip()
        if not dong or dong.startswith('#'):
            continue
        noi = f'tranh.txt:{so}'
        if dong.startswith('='):
            han, py, emoji, nhom = tach(dong[1:])
            tranh.append({'id': f'cum{so}', 'han': han, 'pinyin': py, 'emoji': emoji, 'nhom': nhom, 'nghia': '', 'cau': []})
            can_kiem.append((han, py, noi))
            continue
        trai, emoji, nhom = tach(dong)
        goi_y = ''.join(LA_CHU_HAN.findall(trai))
        py = LA_CHU_HAN.sub('', trai).strip()
        ung = [t for t in cac_tu if any(chuan(p) == chuan(py) for p in t['pinyin'].split('/'))]
        if goi_y:
            ung = [t for t in ung if t['hanzi'] == goi_y]
        if len(ung) != 1:
            loi.append(f'{noi}: "{trai}" khớp {len(ung)} từ HSK 1 (cần đúng 1; thêm chữ Hán nếu đồng âm)')
            continue
        t = ung[0]
        tranh.append({'id': f'1:{t["dangGoc"]}', 'han': t['hanzi'], 'pinyin': t['pinyin'], 'emoji': emoji, 'nhom': nhom,
                      'nghia': '; '.join(n['nghia'] for n in t.get('nghia', [])), 'cau': []})

    # Câu ví dụ cho từng tranh: có chữ của từ đó, nhưng KHÔNG chỉ nằm trong một từ dài hơn mang nghĩa khác
    for tr in tranh:
        if tr['id'].startswith('cum'):
            continue
        tu_dai_hon = [t['hanzi'] for t in cac_tu if tr['han'] in t['hanzi'] and t['hanzi'] != tr['han']]
        for v in cac_cau_vd:
            if tr['han'] not in v['han']:
                continue
            con_lai = v['han']
            for d in sorted(tu_dai_hon, key=len, reverse=True):
                con_lai = con_lai.replace(d, '□' * len(d))
            if tr['han'] not in con_lai:
                continue      # chữ chỉ xuất hiện bên trong từ khác (vd. 家 trong 大家)
            tr['cau'].append({'han': v['han'], 'pinyin': v['pinyin'], 'dich': v['dich']})
    # Mỗi câu chứa những tranh nào (để app chọn câu chỉ khớp đúng 1 tranh trong 6 tranh của câu hỏi)
    for tr in tranh:
        for c in tr['cau']:
            c['coTranh'] = [x['id'] for x in tranh if not x['id'].startswith('cum') and x['han'] in c['han']]

    # Kiểm tra nhóm có đủ tranh để làm tranh nhiễu
    nhom_dem = {}
    for tr in tranh:
        nhom_dem[tr['nhom']] = nhom_dem.get(tr['nhom'], 0) + 1
    for n, k in nhom_dem.items():
        if k < 3:
            loi.append(f'tranh.txt: nhóm "{n}" chỉ có {k} tranh (cần ít nhất 3 để làm câu chọn 1 trong 3)')

    # ---------- 2. Ngân hàng câu hỏi ----------
    hoi_dap, dien_tu, theo_cau = [], [], []
    for f in sorted(THU_MUC.glob('cap1-*.txt')):
        nhom = None
        for so, dong in enumerate(f.read_text(encoding='utf-8').splitlines(), 1):
            dong = dong.rstrip()
            noi = f'{f.name}:{so}'
            if not dong.strip() or (dong.startswith('#') and not dong.startswith('###')):
                continue
            if dong.startswith('### '):
                ten = dong[4:].strip()
                if ten.startswith('hd'):
                    nhom = {'loai': 'hd', 'ten': ten, 'cap': [], 'noi': noi}
                    hoi_dap.append(nhom)
                elif ten.startswith('dt'):
                    nhom = {'loai': 'dt', 'ten': ten, 'tu': [], 'cau': [], 'noi': noi}
                    dien_tu.append(nhom)
                elif ten.startswith('cau'):
                    nhom = {'loai': 'cau', 'noi': noi}
                else:
                    loi.append(f'{noi}: không hiểu loại nhóm "{ten}"')
                    nhom = None
                continue
            if nhom is None:
                loi.append(f'{noi}: nội dung nằm ngoài nhóm nào')
                continue
            ky, _, nd = dong.partition(' ')
            phan = tach(nd)
            if nhom['loai'] == 'hd':
                if ky == 'Q':
                    nhom['cap'].append({'q': phan[0], 'qp': phan[1], 'a': '', 'ap': '', 'x': [], 'noi': noi})
                elif ky in ('A', 'X') and nhom['cap']:
                    if ky == 'A':
                        nhom['cap'][-1]['a'], nhom['cap'][-1]['ap'] = phan[0], phan[1]
                    else:
                        nhom['cap'][-1]['x'].append({'h': phan[0], 'p': phan[1]})
                else:
                    loi.append(f'{noi}: dòng "{ky}" không đúng chỗ trong nhóm hỏi–đáp')
                    continue
                can_kiem.append((phan[0], phan[1], noi))
            elif nhom['loai'] == 'dt':
                if ky == 'W':
                    nhom['tu'].append({'h': phan[0], 'p': phan[1]})
                    can_kiem.append((phan[0], phan[1], noi))
                elif ky == 'F':
                    if len(phan) != 3 or '（ ）' not in phan[0]:
                        loi.append(f'{noi}: câu điền từ cần dạng "câu có （ ） | pinyin | từ đúng"')
                        continue
                    nhom['cau'].append({'cau': phan[0], 'pinyin': phan[1], 'dapAn': phan[2]})
                    can_kiem.append((phan[0].replace('（ ）', phan[2]), phan[1], noi))
                else:
                    loi.append(f'{noi}: dòng "{ky}" không đúng chỗ trong nhóm điền từ')
            elif nhom['loai'] == 'cau':
                if ky == 'S':
                    theo_cau.append({'s': phan[0], 'sp': phan[1], 'h': '', 'hp': '', 'a': '', 'ap': '', 'x': [], 'noi': noi})
                elif ky in ('H', 'A', 'X') and theo_cau:
                    c = theo_cau[-1]
                    if ky == 'H':
                        c['h'], c['hp'] = phan[0], phan[1]
                    elif ky == 'A':
                        c['a'], c['ap'] = phan[0], phan[1]
                    else:
                        c['x'].append({'h': phan[0], 'p': phan[1]})
                else:
                    loi.append(f'{noi}: dòng "{ky}" không đúng chỗ')
                    continue
                can_kiem.append((phan[0], phan[1], noi))

    # Kiểm tra cấu trúc
    for n in hoi_dap:
        if len(n['cap']) != 5:
            loi.append(f'{n["noi"]}: nhóm {n["ten"]} cần đúng 5 cặp hỏi–đáp (đang có {len(n["cap"])})')
        for c in n['cap']:
            if not c['a'] or len(c['x']) != 2:
                loi.append(f'{c["noi"]}: cặp hỏi–đáp cần 1 dòng A và 2 dòng X')
        cac_a = [c['a'] for c in n['cap']]
        if len(set(cac_a)) != len(cac_a):
            loi.append(f'{n["noi"]}: nhóm {n["ten"]} có hai câu trả lời A giống nhau')
    for n in dien_tu:
        tu = [w['h'] for w in n['tu']]
        if len(tu) != 6 or len(n['cau']) != 5:
            loi.append(f'{n["noi"]}: nhóm {n["ten"]} cần 6 từ (W) và 5 câu (F)')
        dap = [c['dapAn'] for c in n['cau']]
        if any(d not in tu for d in dap):
            loi.append(f'{n["noi"]}: nhóm {n["ten"]} có đáp án không nằm trong 6 từ')
        if len(set(dap)) != len(dap):
            loi.append(f'{n["noi"]}: nhóm {n["ten"]} có hai câu cùng một đáp án')
    for c in theo_cau:
        if not (c['h'] and c['a'] and len(c['x']) == 2):
            loi.append(f'{c["noi"]}: câu hỏi theo câu cần đủ S, H, A và 2 dòng X')

    # Kiểm tra chữ và pinyin
    can_chu = {ch for han, _, _ in can_kiem for ch in han if LA_CHU_HAN.match(ch)}
    tu_dien = kt.doc_cedict(can_chu)
    dai = max((len(k) for k in tu_dien), default=1)
    for han, py, noi in can_kiem:
        ngoai = sorted({ch for ch in han if LA_CHU_HAN.match(ch) and ch not in chu_cap1})
        if ngoai:
            canh_bao.append(f'{noi}: dùng chữ ngoài cấp 1: {"、".join(ngoai)}')
        l, sai_thanh = kt.kiem_tra_cau(han, py, tu_dien, dai)
        if l:
            loi.append(f'{noi}: {han} | {py} → {l}')
        for x in sai_thanh:
            canh_bao.append(f'{noi}: {han} | {py} → sai thanh? {x}')
        for x in gnp.kiem_tra_bien_dieu(han, py):
            canh_bao.append(f'{noi}: {han} | {py} → {x}')

    def sach(x):
        if isinstance(x, dict):
            return {k: sach(v) for k, v in x.items() if k != 'noi'}
        if isinstance(x, list):
            return [sach(v) for v in x]
        return x

    goi = {
        '_ghiChu': 'File tạo tự động bởi cong-cu/ghep-thi-thu.py – không sửa tay. Đề mô phỏng, không phải đề chính thức.',
        'cauTruc': 'Theo cấu trúc đề thi thử HSK (一级) trong sách bài tập 《新HSK教程 1》 (2026): 40 câu, nghe 20 + đọc 20.',
        'tranh': tranh, 'hoiDap': sach(hoi_dap), 'dienTu': sach(dien_tu), 'theoCau': sach(theo_cau),
    }
    if not loi:
        FILE_RA.write_text(json.dumps(goi, ensure_ascii=False, indent=1), encoding='utf-8')

    tranh_co_cau = sum(1 for t in tranh if len(t['cau']) >= 1)
    dong = [f'Tranh: {len(tranh)} (có câu ví dụ dùng được: {tranh_co_cau}) · nhóm: '
            + ', '.join(f'{n}={k}' for n, k in nhom_dem.items()),
            f'Hỏi–đáp: {len(hoi_dap)} nhóm ({sum(len(n["cap"]) for n in hoi_dap)} cặp) · '
            f'điền từ: {len(dien_tu)} nhóm · câu hỏi theo câu: {len(theo_cau)}',
            f'LỖI: {len(loi)} · CẢNH BÁO: {len(canh_bao)}', '']
    if loi:
        dong += ['===== LỖI (chưa ghi file) ====='] + ['  - ' + x for x in loi] + ['']
    if canh_bao:
        dong += ['===== CẢNH BÁO ====='] + ['  - ' + x for x in canh_bao] + ['']
    if not loi:
        dong.append(f'Đã ghi {FILE_RA.relative_to(GOC)}')
    BAO_CAO.write_text('\n'.join(dong) + '\n', encoding='utf-8')
    print('\n'.join(dong))
    sys.exit(1 if loi else 0)


if __name__ == '__main__':
    main()
