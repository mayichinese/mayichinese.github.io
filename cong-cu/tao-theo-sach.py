# -*- coding: utf-8 -*-
"""
TẠO DỮ LIỆU "HỌC THEO SÁCH" (Giai đoạn 5) – ghép từ HSK 1 với bài của sách 《新HSK教程 1》.

Đọc cong-cu/nguon-hsk1/theo-sach.txt (pinyin + số bài, chép từ bảng từ cuối sách) và
app/data/hsk1.json, ghép mỗi dòng với một từ chính thức theo pinyin, rồi ghi
app/data/theo-sach-hsk1.json. Báo cáo ghi vào cong-cu/bao-cao-theo-sach.txt.

Cách chạy (tại thư mục dự án):
    python -X utf8 cong-cu/tao-theo-sach.py

Cách ghép:
  1. pinyin giống hệt (bỏ khoảng trắng, dấu nháy, chữ hoa) → ghép thẳng
  2. nếu có chữ Hán ghi kèm (từ đồng âm) → chỉ chọn từ có đúng chữ đó
  3. không khớp đúng dấu thì thử bỏ dấu thanh → CẢNH BÁO "khớp gần đúng" (nên xem lại)
Từ trong 300 từ mà sách không có → gom vào nhóm "Từ đề cương sách chưa dạy".
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent
NGUON = GOC / 'cong-cu' / 'nguon-hsk1' / 'theo-sach.txt'
HSK1 = GOC / 'app' / 'data' / 'hsk1.json'
NGU_PHAP = GOC / 'app' / 'data' / 'ngu-phap-hsk1.json'
FILE_RA = GOC / 'app' / 'data' / 'theo-sach-hsk1.json'
BAO_CAO = GOC / 'cong-cu' / 'bao-cao-theo-sach.txt'
LA_CHU_HAN = re.compile(r'[一-鿿]')


def chuan(py):
    """Chuẩn hóa pinyin để so: viết thường, bỏ khoảng trắng / dấu nháy / gạch nối."""
    py = unicodedata.normalize('NFC', py.lower())
    return re.sub(r"[\s'’\-·]", '', py)


def bo_dau(py):
    s = unicodedata.normalize('NFD', chuan(py))
    return ''.join(c for c in s if not unicodedata.combining(c)).replace('ü', 'v')


def doc_nguon():
    ten_bai, dong_tu, dong_np = {}, [], []
    muc = None
    for so, dong in enumerate(NGUON.read_text(encoding='utf-8').splitlines(), 1):
        dong = dong.strip()
        if not dong or (dong.startswith('#') and not dong.startswith('##')):
            continue
        if dong.startswith('## '):
            muc = dong[3:].strip()
            continue
        trai, _, phai = dong.partition('|')
        trai, phai = trai.strip(), phai.strip()
        if muc == 'TEN BAI':
            ten_bai[int(trai)] = phai
        elif muc == 'TU':
            cac_bai = [int(x) for x in re.findall(r'\d+', phai)]
            goi_y = ''.join(LA_CHU_HAN.findall(trai))
            py = LA_CHU_HAN.sub('', trai).strip()
            dong_tu.append({'py': py, 'goiY': goi_y, 'bai': cac_bai, 'dong': so})
        elif muc == 'NGU PHAP':
            dong_np.append((trai, int(phai), so))
    return ten_bai, dong_tu, dong_np


def main():
    ten_bai, dong_tu, dong_np = doc_nguon()
    hsk1 = json.loads(HSK1.read_text(encoding='utf-8'))
    cac_tu = [t for b in hsk1['baiHoc'] for t in b['tu']]
    loi, canh_bao = [], []

    def cac_cach_doc(t):
        return [p for p in t['pinyin'].split('/') if p.strip()]

    gan = {}   # khoa → số bài
    for d in dong_tu:
        ung = [t for t in cac_tu if any(chuan(p) == chuan(d['py']) for p in cac_cach_doc(t))]
        if d['goiY']:
            ung = [t for t in ung if t['hanzi'] == d['goiY']] or \
                  [t for t in cac_tu if t['hanzi'] == d['goiY'] and any(bo_dau(p) == bo_dau(d['py']) for p in cac_cach_doc(t))]
        gan_dung = True
        if not ung:
            ung = [t for t in cac_tu if any(bo_dau(p) == bo_dau(d['py']) for p in cac_cach_doc(t))]
            gan_dung = False
        if not ung:
            # Sách đôi khi tách riêng một từ mà danh sách chính thức gộp vào từ khác → bỏ qua
            canh_bao.append(f'dòng {d["dong"]}: "{d["py"]}" có trong sách nhưng không phải mục riêng trong 300 từ HSK 1 – bỏ qua')
            continue
        if len(ung) > 1:
            loi.append(f'dòng {d["dong"]}: "{d["py"]}" khớp {len(ung)} từ – cần ghi thêm chữ Hán để phân biệt')
            continue
        t = ung[0]
        khoa = f'1:{t["dangGoc"]}'
        if khoa in gan:
            loi.append(f'dòng {d["dong"]}: "{d["py"]}" trùng với một dòng phía trên')
            continue
        if not gan_dung:
            canh_bao.append(f'dòng {d["dong"]}: "{d["py"]}" chỉ khớp khi bỏ dấu thanh (dữ liệu ghi "{t["pinyin"]}") – nên xem lại')
        gan[khoa] = min(d['bai'])

    ngoai_sach = [f'1:{t["dangGoc"]}' for t in cac_tu if f'1:{t["dangGoc"]}' not in gan]

    # Ngữ pháp
    ma_np = set()
    if NGU_PHAP.exists():
        ma_np = {d['id'] for d in json.loads(NGU_PHAP.read_text(encoding='utf-8'))['diem']}
    np = {}
    for ma, bai, so in dong_np:
        if ma_np and ma not in ma_np:
            loi.append(f'dòng {so}: mã ngữ pháp "{ma}" không có trong ngu-phap-hsk1.json')
            continue
        np[ma] = bai
    thieu_np = sorted(ma_np - set(np))
    if thieu_np:
        canh_bao.append(f'điểm ngữ pháp chưa gắn bài sách: {", ".join(thieu_np)}')

    so_tu_bai = {}
    for b in gan.values():
        so_tu_bai[b] = so_tu_bai.get(b, 0) + 1
    goi = {
        '_ghiChu': 'File tạo tự động bởi cong-cu/tao-theo-sach.py từ cong-cu/nguon-hsk1/theo-sach.txt – không sửa tay.',
        'sach': '《新HSK教程 1》– NXB Ngoại ngữ Giáo dục và Nghiên cứu (外语教学与研究出版社), 2026',
        'bai': [{'so': so, 'ten': ten_bai.get(so, f'Bài {so}')} for so in sorted(ten_bai)],
        'tu': gan,
        'ngoaiSach': ngoai_sach,
        'nguPhap': np,
    }
    if not loi:
        FILE_RA.write_text(json.dumps(goi, ensure_ascii=False, indent=1), encoding='utf-8')
    dong = [f'Dòng từ trong nguồn: {len(dong_tu)} · ghép được: {len(gan)}/{len(cac_tu)} từ HSK 1 · '
            f'sách chưa dạy: {len(ngoai_sach)} · ngữ pháp gắn bài: {len(np)}',
            'Số từ mỗi bài: ' + ', '.join(f'B{b}={n}' for b, n in sorted(so_tu_bai.items())),
            f'LỖI: {len(loi)} · CẢNH BÁO: {len(canh_bao)}', '']
    if loi:
        dong += ['===== LỖI (chưa ghi file) ====='] + ['  - ' + x for x in loi] + ['']
    if canh_bao:
        dong += ['===== CẢNH BÁO ====='] + ['  - ' + x for x in canh_bao] + ['']
    if ngoai_sach:
        dong += [f'Từ đề cương sách chưa dạy (theo số thứ tự trong danh sách chính thức): '
                 + ', '.join(str(t['soThuTu']) for t in cac_tu if f'1:{t["dangGoc"]}' in ngoai_sach)]
    if not loi:
        dong.append(f'Đã ghi {FILE_RA.relative_to(GOC)}')
    BAO_CAO.write_text('\n'.join(dong) + '\n', encoding='utf-8')
    print('\n'.join(dong))
    sys.exit(1 if loi else 0)


if __name__ == '__main__':
    main()
