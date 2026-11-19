# -*- coding: utf-8 -*-
"""
TẠO CÁCH CHIA BÀI "THEO CHỦ ĐỀ" CHO HSK 2 / HSK 3

HSK 1 có hai cách chia: 20 bài theo chủ đề (hsk1.json) và 15 bài theo sách (theo-sach-hsk1.json).
HSK 2, 3 trong hsk2.json / hsk3.json chia theo bài sách; script này tạo thêm cách chia theo chủ đề.

Đọc:  cong-cu/nguon-hskN/chu-de.txt
      Mỗi dòng: số bài | tên chủ đề | các từ (đúng dạng gốc như trong phan-bai.txt, cách nhau bằng dấu cách)
      Một chủ đề dài có thể viết thành nhiều dòng cùng số bài và cùng tên (các dòng được gộp lại).
Ghi:  app/data/chu-de-hskN.json  { cap, bai: [{ so, ten, tu: [khóa theo thứ tự học] }], tu: { "N:dạng gốc": số bài } }
      Thứ tự từ trong một chủ đề = thứ tự ghi trong chu-de.txt (cũng là thứ tự học từ mới).
      (có LỖI thì không ghi)

Cách chạy (tại thư mục dự án):
    python -X utf8 cong-cu/tao-chu-de.py 2
    python -X utf8 cong-cu/tao-chu-de.py 3

KIỂM TRA: mỗi từ của cấp xuất hiện ĐÚNG MỘT lần, không có từ lạ, số bài liên tục 1, 2, 3…,
cùng số bài thì cùng tên; CẢNH BÁO nếu một chủ đề có ít hơn 8 hoặc nhiều hơn 25 từ.
"""
import json
import sys
from collections import Counter
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent


def main():
    cap = int(sys.argv[1]) if len(sys.argv) > 1 else 2
    nguon = GOC / 'cong-cu' / f'nguon-hsk{cap}' / 'chu-de.txt'
    du_lieu = json.loads((GOC / 'app' / 'data' / f'hsk{cap}.json').read_text(encoding='utf-8'))
    file_ra = GOC / 'app' / 'data' / f'chu-de-hsk{cap}.json'
    loi, canh_bao = [], []

    tu_cap = [t['dangGoc'] for b in du_lieu['baiHoc'] for t in b['tu']]
    con_lai = set(tu_cap)

    bai = {}          # số → { ten, tu: [] }
    gap = Counter()
    if not nguon.exists():
        print(f'Chưa có file {nguon.relative_to(GOC)}')
        raise SystemExit(1)
    for so_dong, dong in enumerate(nguon.read_text(encoding='utf-8').splitlines(), 1):
        dong = dong.strip()
        if not dong or dong.startswith('#'):
            continue
        p = [x.strip() for x in dong.split('|')]
        if len(p) != 3 or not p[0].isdigit():
            loi.append(f'dòng {so_dong}: cần "số bài | tên chủ đề | các từ"')
            continue
        so, ten, ds = int(p[0]), p[1], p[2].split()
        if so in bai and bai[so]['ten'] != ten:
            loi.append(f'dòng {so_dong}: bài {so} đã có tên "{bai[so]["ten"]}", dòng này ghi "{ten}"')
        bai.setdefault(so, {'ten': ten, 'tu': []})
        for t in ds:
            gap[t] += 1
            if t not in set(tu_cap):
                loi.append(f'dòng {so_dong}: "{t}" không phải từ HSK {cap} (xem dạng gốc trong cong-cu/nguon-hsk{cap}/phan-bai.txt)')
            bai[so]['tu'].append(t)
            con_lai.discard(t)

    for t, k in gap.items():
        if k > 1:
            loi.append(f'"{t}" xuất hiện {k} lần – mỗi từ chỉ thuộc một chủ đề')
    if con_lai:
        loi.append(f'Còn {len(con_lai)} từ chưa xếp chủ đề: {" ".join(sorted(con_lai))}')
    so_bai = sorted(bai)
    if so_bai != list(range(1, len(so_bai) + 1)):
        loi.append(f'Số bài phải liên tục từ 1: đang có {so_bai}')
    for so in so_bai:
        n = len(bai[so]['tu'])
        if n < 8 or n > 25:
            canh_bao.append(f'Bài {so} "{bai[so]["ten"]}" có {n} từ (nên 8–25)')

    dong_bao = [f'HSK {cap}: {len(so_bai)} chủ đề · đã xếp {len(set(tu_cap)) - len(con_lai)}/{len(set(tu_cap))} từ',
                f'LỖI: {len(loi)} · CẢNH BÁO: {len(canh_bao)}']
    dong_bao += [f'  {so:>2}. {bai[so]["ten"]} ({len(bai[so]["tu"])})' for so in so_bai]
    if loi:
        dong_bao += ['===== LỖI (chưa ghi file) ====='] + ['  - ' + x for x in loi]
    if canh_bao:
        dong_bao += ['===== CẢNH BÁO ====='] + ['  - ' + x for x in canh_bao]
    if not loi:
        goi = {'_ghiChu': f'File tạo tự động bởi cong-cu/tao-chu-de.py từ cong-cu/nguon-hsk{cap}/chu-de.txt – không sửa tay.',
               'cap': cap,
               'bai': [{'so': so, 'ten': bai[so]['ten'], 'tu': [f'{cap}:{t}' for t in bai[so]['tu']]} for so in so_bai],
               'tu': {f'{cap}:{t}': so for so in so_bai for t in bai[so]['tu']}}
        file_ra.write_text(json.dumps(goi, ensure_ascii=False, indent=1), encoding='utf-8')
        dong_bao.append(f'Đã ghi {file_ra.relative_to(GOC)}')
    print('\n'.join(dong_bao))
    raise SystemExit(1 if loi else 0)


if __name__ == '__main__':
    main()
