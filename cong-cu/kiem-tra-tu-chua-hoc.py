# -*- coding: utf-8 -*-
"""
KIỂM TRA "TỪ CHƯA HỌC" TRONG CÂU (bước D – ngữ pháp đúng lúc)

Lộ trình học theo bài sách: HSK 1 bài 1 → 15, HSK 2 bài 1 → 15, HSK 3 bài 1 → 18.
Một từ coi là "đã học" ở bài (cấp C, bài N) nếu nó thuộc cấp thấp hơn, hoặc cùng cấp và bài ≤ N.
Câu được tách thành từ bằng từ điển HSK 1–3 (khớp dài nhất, tối đa 4 chữ – giống app/js/cham-tu.js).

Báo cáo:
  1. Câu NGỮ PHÁP (ví dụ + điền từ) có từ chưa học tính tới bài của điểm ngữ pháp đó
     (HSK 1: bài theo data/theo-sach-hsk1.json; HSK 2–3: dòng "& N" trong nguồn).
  2. Câu VÍ DỤ CỦA TỪ (dùng ở phần Ghép / Đọc của chặng) – mỗi bài còn bao nhiêu câu dùng được
     (toàn từ đã học tới bài đó).
  Chữ không nằm trong từ nào của HSK 1–3 (tên riêng…) ghi là "ngoài từ điển".

Chạy:  python -X utf8 cong-cu/kiem-tra-tu-chua-hoc.py          → cong-cu/bao-cao-tu-chua-hoc.txt
       python -X utf8 cong-cu/kiem-tra-tu-chua-hoc.py 1 3      → chỉ in chi tiết câu ngữ pháp HSK 1 bài 1–3 ra màn hình
"""
import json
import re
import sys
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent
DATA = GOC / 'app' / 'data'
LA_HAN = re.compile(r'[㐀-鿿]')


def doc(ten):
    p = DATA / ten
    return json.loads(p.read_text(encoding='utf-8')) if p.exists() else None


theo_sach = doc('theo-sach-hsk1.json')
tu_dien = {}          # chữ Hán → (cấp, bài sách) nhỏ nhất
vi_du_tu = []         # (cấp, bài, chữ Hán của từ, câu)
for cap in (1, 2, 3):
    d = doc(f'hsk{cap}.json')
    if not d:
        continue
    for b in d['baiHoc']:
        for t in b['tu']:
            if not t.get('daSoan'):
                continue
            bai = theo_sach['tu'].get(f'1:{t["dangGoc"]}') if cap == 1 else b['so']
            if bai is None:
                continue
            moc = (cap, bai)
            if t['hanzi'] not in tu_dien or moc < tu_dien[t['hanzi']]:
                tu_dien[t['hanzi']] = moc
            for v in t.get('viDu', []):
                vi_du_tu.append((cap, bai, t['hanzi'], v['han']))


def tach_chuoi(s):
    """Tách chuỗi toàn chữ Hán: khớp dài nhất (≤ 4 chữ) hai chiều, chọn ít đoạn → ít chữ lẻ → từ cấp thấp hơn → chiều từ phải sang.
    Cùng thuật toán với app/js/cham-tu.js (tachChuoiHan): 一起床 → 一/起床, 穿上衣服 → 穿/上/衣服."""
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


def tach(cau):
    """Tách câu → danh sách (đoạn, mốc (cấp, bài) hoặc None nếu ngoài từ điển); bỏ dấu câu"""
    ds = []
    for chuoi in re.findall(r'[㐀-鿿]+', cau):
        for doan in tach_chuoi(chuoi):
            ds.append((doan, tu_dien.get(doan)))
    return ds


chu_moc = {}          # chữ → mốc sớm nhất của một từ có chứa chữ đó (没 nằm trong 没有, 没事…)
for hz, m in tu_dien.items():
    for c in hz:
        if c not in chu_moc or m < chu_moc[c]:
            chu_moc[c] = m


def chua_hoc(cau, moc):
    """Các từ chưa học (mốc > moc) và chữ ngoài từ điển.
    Chữ lẻ không phải một từ riêng nhưng nằm trong một từ đã học (没 trong 没有) thì coi là đã biết."""
    sau, ngoai = [], []
    for doan, m in tach(cau):
        if m is None:
            if chu_moc.get(doan) and chu_moc[doan] <= moc:
                continue
            ngoai.append(doan)
        elif m > moc:
            # Từ ghép "trong suốt": mọi chữ đều là từ một chữ đã học (这个 = 这 + 个, 他们 = 他 + 们) → coi như đã biết
            if len(doan) > 1 and all(tu_dien.get(c) and tu_dien[c] <= moc for c in doan):
                continue
            # Chữ lẻ đã gặp trong một từ đã học (起 trong 起床, 跳 khi tách 跳舞) → coi như đã biết
            if len(doan) == 1 and chu_moc.get(doan) and chu_moc[doan] <= moc:
                continue
            sau.append(f'{doan}(HSK{m[0]}-B{m[1]})')
    return sau, ngoai


def ten_moc(m):
    return f'HSK {m[0]} · Bài {m[1]}'


def main():
    # ---------- 1. Ngữ pháp ----------
    dong = []
    thong_ke_np = {}      # mốc → [số câu, số câu có từ chưa học]
    chi_tiet_np = []      # (mốc, mã, tên, câu, từ chưa học, ngoài)
    for cap in (1, 2, 3):
        d = doc(f'ngu-phap-hsk{cap}.json')
        if not d:
            continue
        for p in d['diem']:
            bai = theo_sach['nguPhap'].get(p['id']) if cap == 1 else p.get('bai')
            if not bai:
                continue
            moc = (cap, bai)
            cau = [v['han'] for v in p['viDu']] + [x['cau'].replace('___', x['dapAn']) for x in p['dienTu']]
            tk = thong_ke_np.setdefault(moc, [0, 0])
            for c in cau:
                sau, ngoai = chua_hoc(c, moc)
                tk[0] += 1
                if sau or ngoai:
                    tk[1] += 1
                    chi_tiet_np.append((moc, p['id'], p['ten'], c, sau, ngoai))

    # ---------- 2. Câu ví dụ của từ ----------
    thong_ke_vd = {}      # mốc → [số câu, số câu dùng được]
    for cap, bai, hz, c in vi_du_tu:
        moc = (cap, bai)
        sau, ngoai = chua_hoc(c, moc)
        tk = thong_ke_vd.setdefault(moc, [0, 0])
        tk[0] += 1
        if not sau and not ngoai:
            tk[1] += 1

    # ---------- Ghi báo cáo ----------
    tong_np = sum(v[0] for v in thong_ke_np.values())
    xau_np = sum(v[1] for v in thong_ke_np.values())
    dong.append('BÁO CÁO TỪ CHƯA HỌC TRONG CÂU (tạo bởi cong-cu/kiem-tra-tu-chua-hoc.py – không sửa tay)')
    dong.append('')
    dong.append(f'NGỮ PHÁP: {xau_np}/{tong_np} câu còn từ chưa học (hoặc chữ ngoài từ điển) tính tới bài của điểm.')
    dong.append('Câu ví dụ của từ dùng được cho chặng (toàn từ đã học tới bài đó):')
    for moc in sorted(set(thong_ke_np) | set(thong_ke_vd)):
        np_ = thong_ke_np.get(moc, [0, 0])
        vd = thong_ke_vd.get(moc, [0, 0])
        dong.append(f'  {ten_moc(moc):16} ngữ pháp: {np_[1]:3}/{np_[0]:3} câu cần sửa · ví dụ từ dùng được: {vd[1]:3}/{vd[0]:3}')
    dong.append('')
    dong.append('CHI TIẾT CÂU NGỮ PHÁP CẦN SỬA (theo thứ tự bài):')
    for moc, ma, ten, c, sau, ngoai in sorted(chi_tiet_np, key=lambda x: x[0]):
        ghi = ', '.join(sau + [f'{x}(ngoài từ điển)' for x in ngoai])
        dong.append(f'[{ten_moc(moc)}] {ma}: {c}   ← {ghi}')
    (GOC / 'cong-cu' / 'bao-cao-tu-chua-hoc.txt').write_text('\n'.join(dong) + '\n', encoding='utf-8')

    print(f'Ngữ pháp: {xau_np}/{tong_np} câu còn từ chưa học. Ví dụ từ dùng được: '
          f'{sum(v[1] for v in thong_ke_vd.values())}/{sum(v[0] for v in thong_ke_vd.values())}.')
    print('Đã ghi cong-cu/bao-cao-tu-chua-hoc.txt')

    # Chi tiết ra màn hình cho một khoảng bài (để soạn lại từng ít một)
    if len(sys.argv) >= 3:
        cap = int(sys.argv[1])
        tu, den = (int(x) for x in sys.argv[2].split('-')) if '-' in sys.argv[2] else (1, int(sys.argv[2]))
        for moc, ma, ten, c, sau, ngoai in sorted(chi_tiet_np, key=lambda x: x[0]):
            if moc[0] == cap and tu <= moc[1] <= den:
                print(f'[B{moc[1]}] {ma}: {c} ← {", ".join(sau + [x + "(ngoài)" for x in ngoai])}')


# Dùng lại được từ script khác (ghep-doc-hieu.py): tu_dien, tach(), chua_hoc()
if __name__ == '__main__':
    main()
