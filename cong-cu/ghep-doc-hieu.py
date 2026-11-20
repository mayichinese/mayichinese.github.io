# -*- coding: utf-8 -*-
"""
GHÉP + KIỂM TRA BÀI ĐỌC HIỂU (bước E)

Đọc cong-cu/nguon-doc-hieu/cap<N>.txt → app/data/doc-hieu-hsk<N>.json, báo cáo cong-cu/bao-cao-doc-hieu-hsk<N>.txt
Chạy:  python -X utf8 cong-cu/ghep-doc-hieu.py        (cấp 1)
       python -X utf8 cong-cu/ghep-doc-hieu.py 2      (cấp 2)

ĐỊNH DẠNG (mỗi bài đọc bắt đầu bằng "## số bài" – số bài theo SÁCH của cấp đó, mỗi bài một bài đọc):
    ## 3
    @ Tên bài đọc (tiếng Việt)
    % hoi-thoai                  hoặc  % doan-van
    > A | 你好！ | Nǐ hǎo! | Xin chào!                     hội thoại: người nói | chữ Hán | pinyin | dịch
    > 我是学生。 | Wǒ shì xuéshēng. | Tôi là học sinh.      đoạn văn: chữ Hán | pinyin | dịch
    ? 她是谁？ | 老师 | 学生; 同学                            chọn đáp án: câu hỏi | đáp án đúng | 2–3 đáp án nhiễu (;)
    ?= Cô ấy là ai?                                          (tùy chọn, ngay sau) dịch câu hỏi
    ! 她是老师。 | đúng                                       đúng / sai: mệnh đề | đúng hoặc sai
    != Cô ấy là giáo viên.                                   (tùy chọn, ngay sau) dịch mệnh đề
    $ 李明; 小李                                             (ở bất cứ đâu) tên riêng được phép dùng dù ngoài từ điển
    # ...                                                    chú thích, bỏ qua
Câu hỏi / đáp án có thể viết tiếng Việt (bài đầu HSK 1, khi người học chưa đủ từ để hỏi bằng tiếng Trung).

KIỂM TRA:
    LỖI      : mọi chữ Hán (câu, câu hỏi, đáp án, mệnh đề) phải chỉ dùng từ đã học TỚI BÀI ĐÓ (cùng quy tắc
               với cong-cu/kiem-tra-tu-chua-hoc.py); pinyin không khớp chữ Hán (CC-CEDICT); đáp án đúng nằm trong
               đáp án nhiễu / đáp án trùng; bài đọc thiếu câu (< 3) hoặc thiếu câu hỏi (< 3); số bài không có.
    CẢNH BÁO : sai thanh so với từ điển, 不/一 chưa ghi theo cách đọc đã biến điệu.
NỘI DUNG TỰ SOẠN, không chép giáo trình. Câu hỏi phải chỉ có MỘT đáp án đúng theo bài đọc.
"""
import importlib.util
import json
import re
import sys
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent
LA_CHU_HAN = re.compile(r'[㐀-鿿]')


def nap(ten, tep):
    spec = importlib.util.spec_from_file_location(ten, GOC / 'cong-cu' / tep)
    m = importlib.util.module_from_spec(spec)
    luu_argv = sys.argv
    sys.argv = sys.argv[:1]
    spec.loader.exec_module(m)
    sys.argv = luu_argv
    return m


np_ = nap('ghep_ngu_phap', 'ghep-ngu-phap.py')     # có kt (CC-CEDICT) + kiem_tra_bien_dieu
tch = nap('kiem_tra_tu_chua_hoc', 'kiem-tra-tu-chua-hoc.py')   # tu_dien, chua_hoc()
kt = np_.kt


def doc_nguon(cap):
    tep = GOC / 'cong-cu' / 'nguon-doc-hieu' / f'cap{cap}.txt'
    ds, ten_rieng, loi = [], set(), []
    bai = None
    hoi_cuoi = None
    for so_dong, dong in enumerate(tep.read_text(encoding='utf-8').splitlines(), 1):
        dong = dong.strip()
        noi = f'{tep.name}:{so_dong}'
        if not dong or (dong.startswith('#') and not dong.startswith('## ')):
            continue
        if dong.startswith('$'):
            ten_rieng |= {x.strip() for x in dong[1:].split(';') if x.strip()}
            continue
        if dong.startswith('## '):
            bai = {'so': int(dong[3:].strip()), 'ten': '', 'kieu': '', 'cau': [], 'hoi': [], '_noi': noi}
            ds.append(bai)
            hoi_cuoi = None
            continue
        if bai is None:
            loi.append(f'{noi}: dòng nằm ngoài bài đọc nào (thiếu "## số bài")')
            continue
        if dong.startswith('@'):
            bai['ten'] = dong[1:].strip()
        elif dong.startswith('%'):
            bai['kieu'] = dong[1:].strip()
        elif dong.startswith('>'):
            phan = [x.strip() for x in dong[1:].split('|')]
            if len(phan) == 4:
                ai, han, py, dich = phan
            elif len(phan) == 3:
                ai, (han, py, dich) = '', phan
            else:
                loi.append(f'{noi}: câu cần 3 phần (chữ | pinyin | dịch) hoặc 4 phần (người nói | chữ | pinyin | dịch)')
                continue
            bai['cau'].append({'ai': ai, 'han': han, 'pinyin': py, 'dich': dich, '_noi': noi})
        elif dong.startswith('?='):
            if hoi_cuoi is None:
                loi.append(f'{noi}: "?=" phải đứng ngay sau một câu hỏi')
            else:
                hoi_cuoi['dich'] = dong[2:].strip()
        elif dong.startswith('!='):
            if hoi_cuoi is None:
                loi.append(f'{noi}: "!=" phải đứng ngay sau một mệnh đề đúng/sai')
            else:
                hoi_cuoi['dich'] = dong[2:].strip()
        elif dong.startswith('?'):
            phan = [x.strip() for x in dong[1:].split('|')]
            if len(phan) != 3:
                loi.append(f'{noi}: câu hỏi cần 3 phần: câu hỏi | đáp án đúng | đáp án nhiễu')
                continue
            hoi_cuoi = {'loai': 'chon', 'hoi': phan[0], 'dapAn': phan[1],
                        'nhieu': [x.strip() for x in phan[2].split(';') if x.strip()], '_noi': noi}
            bai['hoi'].append(hoi_cuoi)
        elif dong.startswith('!'):
            phan = [x.strip() for x in dong[1:].split('|')]
            if len(phan) != 2 or phan[1] not in ('đúng', 'sai'):
                loi.append(f'{noi}: mệnh đề cần 2 phần: mệnh đề | đúng / sai')
                continue
            hoi_cuoi = {'loai': 'dungSai', 'hoi': phan[0], 'dung': phan[1] == 'đúng', '_noi': noi}
            bai['hoi'].append(hoi_cuoi)
        else:
            loi.append(f'{noi}: không hiểu dòng này')
    return ds, ten_rieng, loi


def main():
    cap = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    ds, ten_rieng, loi = doc_nguon(cap)
    canh_bao = []

    # Bài có thật? (HSK 1: bài sách theo theo-sach-hsk1.json; HSK 2–3: bài trong hskN.json)
    if cap == 1:
        co_bai = {b['so'] for b in json.loads((GOC / 'app' / 'data' / 'theo-sach-hsk1.json').read_text(encoding='utf-8'))['bai']}
    else:
        co_bai = {b['so'] for b in json.loads((GOC / 'app' / 'data' / f'hsk{cap}.json').read_text(encoding='utf-8'))['baiHoc']}

    def bo_ten(chu):
        for t in sorted(ten_rieng, key=len, reverse=True):
            chu = chu.replace(t, '')
        return chu

    # CC-CEDICT cho mọi chữ trong câu bài đọc
    can_chu = {c for b in ds for x in b['cau'] for c in x['han'] if LA_CHU_HAN.match(c)}
    tu_dien = kt.doc_cedict(can_chu)
    dai = max((len(k) for k in tu_dien), default=1)

    da_co = set()
    for b in ds:
        noi = b['_noi']
        moc = (cap, b['so'])
        if b['so'] not in co_bai:
            loi.append(f'{noi}: không có Bài {b["so"]} ở HSK {cap}')
        if b['so'] in da_co:
            loi.append(f'{noi}: Bài {b["so"]} đã có bài đọc')
        da_co.add(b['so'])
        if not b['ten']:
            loi.append(f'{noi}: thiếu tên (@)')
        if b['kieu'] not in ('hoi-thoai', 'doan-van'):
            loi.append(f'{noi}: kiểu (%) phải là hoi-thoai hoặc doan-van')
        if len(b['cau']) < 3:
            loi.append(f'{noi}: bài đọc cần ít nhất 3 câu (>)')
        if len(b['hoi']) < 3:
            loi.append(f'{noi}: cần ít nhất 3 câu hỏi (? hoặc !)')

        # Mọi chữ Hán chỉ dùng từ đã học tới bài này
        cac_chu_han = [(x['han'], x['_noi']) for x in b['cau']]
        for h in b['hoi']:
            cac_chu_han.append((h['hoi'], h['_noi']))
            if h['loai'] == 'chon':
                cac_chu_han += [(d, h['_noi']) for d in [h['dapAn']] + h['nhieu']]
        for chu, n in cac_chu_han:
            if not LA_CHU_HAN.search(chu):
                continue
            sau, ngoai = tch.chua_hoc(bo_ten(chu), moc)
            if sau or ngoai:
                loi.append(f'{n}: "{chu}" có từ chưa học tới Bài {b["so"]}: '
                           + ', '.join(sau + [f'{x}(ngoài từ điển – thêm vào "$" nếu là tên riêng)' for x in ngoai]))

        # Câu hỏi chọn đáp án
        for h in b['hoi']:
            if h['loai'] != 'chon':
                continue
            if not 2 <= len(h['nhieu']) <= 3:
                loi.append(f'{h["_noi"]}: cần 2–3 đáp án nhiễu')
            if h['dapAn'] in h['nhieu']:
                loi.append(f'{h["_noi"]}: đáp án đúng nằm trong đáp án nhiễu')
            if len(set(h['nhieu'])) != len(h['nhieu']):
                loi.append(f'{h["_noi"]}: đáp án nhiễu bị trùng')

        # Pinyin của câu bài đọc
        for x in b['cau']:
            han, py = x['han'], x['pinyin']
            l, sai_thanh = kt.kiem_tra_cau(han, py, tu_dien, dai)
            if l:
                loi.append(f'{x["_noi"]}: {han} | {py} → {l}')
            for s in sai_thanh:
                canh_bao.append(f'{x["_noi"]}: {han} | {py} → sai thanh? {s}')
            for s in np_.kiem_tra_bien_dieu(han, py):
                canh_bao.append(f'{x["_noi"]}: {han} | {py} → {s}')

    def sach(x):
        if isinstance(x, dict):
            return {k: sach(v) for k, v in x.items() if not k.startswith('_')}
        if isinstance(x, list):
            return [sach(v) for v in x]
        return x

    ra = {
        '_ghiChu': f'File tạo tự động bởi cong-cu/ghep-doc-hieu.py {cap} từ cong-cu/nguon-doc-hieu/cap{cap}.txt – không sửa tay.',
        'capDo': cap,
        'tenRieng': sorted(ten_rieng),
        'bai': sach(sorted(ds, key=lambda b: b['so'])),
    }
    bao_cao = [f'Bài đọc HSK {cap}: {len(ds)} bài · {sum(len(b["cau"]) for b in ds)} câu · {sum(len(b["hoi"]) for b in ds)} câu hỏi',
               f'LỖI: {len(loi)} · CẢNH BÁO: {len(canh_bao)}', '']
    bao_cao += [f'LỖI: {x}' for x in loi] + [f'CẢNH BÁO: {x}' for x in canh_bao]
    (GOC / 'cong-cu' / f'bao-cao-doc-hieu-hsk{cap}.txt').write_text('\n'.join(bao_cao) + '\n', encoding='utf-8')
    print('\n'.join(bao_cao))
    if loi:
        print('Có lỗi – CHƯA ghi file JSON.')
        sys.exit(1)
    tep_ra = GOC / 'app' / 'data' / f'doc-hieu-hsk{cap}.json'
    tep_ra.write_text(json.dumps(ra, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(f'Đã ghi {tep_ra.relative_to(GOC)}')


if __name__ == '__main__':
    main()
