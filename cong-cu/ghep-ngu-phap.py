# -*- coding: utf-8 -*-
"""
GHÉP + KIỂM TRA DỮ LIỆU NGỮ PHÁP (Giai đoạn 4)

Đọc các file soạn tay cong-cu/nguon-ngu-phap/cap<N>-*.txt (theo thứ tự tên file),
kiểm tra, rồi ghi app/data/ngu-phap-hsk<N>.json. Báo cáo: cong-cu/bao-cao-ngu-phap.txt (cấp 1),
cong-cu/bao-cao-ngu-phap-hsk2.txt (cấp 2)…

Cách chạy (tại thư mục dự án):
    python -X utf8 cong-cu/ghep-ngu-phap.py        (cấp 1)
    python -X utf8 cong-cu/ghep-ngu-phap.py 2      (cấp 2)

ĐỊNH DẠNG FILE NGUỒN (mỗi điểm ngữ pháp bắt đầu bằng dòng "## mã"):
    ## la-shi                       mã điểm (chữ thường không dấu, gạch nối) – KHÔNG đổi sau khi đã học
    @ Câu chữ 是                    tên tiếng Việt
    § 特殊句型 · “是”字句1           mục tương ứng trong đề cương 2025 (để đối chiếu)
    & 3                             (cấp 2 trở lên) điểm này thuộc bài mấy của cấp đó (bài theo sách)
    = A + 是 + B                    công thức (có thể nhiều dòng)
    - Giải thích ...                giải thích (nhiều dòng)
    ! Lỗi hay mắc ...               lỗi người Việt hay mắc (nhiều dòng)
    > 我/是/老师。 | Wǒ shì lǎoshī. | Tôi là giáo viên.
                                    câu ví dụ: chữ Hán chia MẢNH bằng dấu "/" (dùng cho bài sắp xếp câu)
                                    | pinyin | dịch. Dấu câu cuối câu không tính là mảnh.
    ~ 今天/我/去。                   (ngay sau dòng ">") một thứ tự KHÁC cũng đúng của câu ví dụ trên
    ? 他___老师。 | 是 | 很; 吗; 不 | Tā shì lǎoshī. | Anh ấy là giáo viên.
                                    bài điền từ: câu có ___ | đáp án | 3 đáp án nhiễu (cách nhau ";")
                                    | pinyin câu đầy đủ | dịch
    ?! Ghi chú cần kiểm tra         đánh dấu chỗ chưa chắc chắn (hiện ⚠️ trong app)
    # ...                           dòng chú thích, bị bỏ qua

KIỂM TRA:
    LỖI      : thiếu tên/công thức/ví dụ, mã trùng, mảnh sắp xếp không khớp, đáp án nằm trong nhiễu,
               câu điền từ không có đúng một chỗ ___, pinyin không khớp chữ Hán (CC-CEDICT).
    LỖI      : (cấp 2+) mã trùng với mã của cấp dưới.
    CẢNH BÁO : chữ ngoài cấp 1…N, sai thanh so với từ điển, 不/一 chưa ghi theo cách đọc đã biến điệu.
"""
import importlib.util
import json
import re
import sys
import unicodedata
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent
THU_MUC_NGUON = GOC / 'cong-cu' / 'nguon-ngu-phap'
FILE_RA = GOC / 'app' / 'data' / 'ngu-phap-hsk1.json'
FILE_BAO_CAO = GOC / 'cong-cu' / 'bao-cao-ngu-phap.txt'
LA_CHU_HAN = re.compile(r'[一-鿿]')
DAU_CAU_CUOI = '。？！?!.'
CHU_BU, CHU_YI = '不', '一'   # 不, 一 (viết mã để file không chứa chữ Hán)

# Dùng lại hàm so pinyin với CC-CEDICT của script kiểm tra câu ví dụ (không sửa script đó)
_spec = importlib.util.spec_from_file_location('kiem_tra_pinyin', GOC / 'cong-cu' / 'kiem-tra-pinyin-vi-du.py')
_saved_argv = sys.argv
sys.argv = sys.argv[:1]
kt = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(kt)
sys.argv = _saved_argv

# ---------- Tách pinyin thành âm tiết (giống app/js/pinyin.js) để kiểm tra biến điệu ----------
PHU_AM = r'(?:zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?'
VAN = r'(?:iang|iong|uang|ang|eng|ing|ong|iao|ian|uai|uan|van|ai|ei|ui|ao|ou|iu|ie|ve|ue|er|an|en|in|un|vn|ia|ua|uo|io|a|o|e|i|u|v)'
AM_TIET = re.compile('^' + PHU_AM + VAN + 'r?$')


def thanh_va_goc(am):
    goc, thanh = '', 0
    for c in unicodedata.normalize('NFC', am.lower()):
        b, t = kt.phan_tich_ky_tu(c)
        goc += 'v' if c in 'üǖǘǚǜ' else b
        thanh = t or thanh
    return goc, thanh


def tach_am_tiet(py):
    """Trả về danh sách (âm tiết, thanh) hoặc None nếu không tách được."""
    kq = []
    for cum in re.findall(r"[a-zA-Züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+", unicodedata.normalize('NFC', py)):
        goc, _ = thanh_va_goc(cum)
        chu = list(unicodedata.normalize('NFC', cum))

        def thu(i):
            if i == len(goc):
                return []
            for dai in range(min(7, len(goc) - i), 0, -1):
                doan = goc[i:i + dai]
                if not AM_TIET.match(doan):
                    continue
                if i + dai < len(goc) and goc[i + dai] in 'aoe':
                    continue
                sau = thu(i + dai)
                if sau is not None:
                    return [(i, i + dai)] + sau
            return None

        cach = thu(0)
        if cach is None:
            return None
        for a, b in cach:
            am = ''.join(chu[a:b])
            kq.append((am, thanh_va_goc(am)[1]))
    return kq


def kiem_tra_bien_dieu(han, py):
    """Cảnh báo nếu 不/一 trước một âm tiết chưa ghi theo cách đọc đã biến điệu."""
    chu = [c for c in han if LA_CHU_HAN.match(c)]
    am = tach_am_tiet(py)
    if not am or len(am) != len(chu):
        return []
    loi = []
    for i, c in enumerate(chu[:-1]):
        sau = am[i + 1][1]
        viet = am[i][0].lower()
        # "bu" (thanh nhẹ) hợp lệ trong câu hỏi chính phản: 去不去 qù bu qù
        if c == CHU_BU and sau == 4 and viet not in ('bú', 'bu'):
            loi.append(f'不 đứng trước thanh 4 nên ghi "bú" (đang ghi "{viet}")')
        if c == CHU_BU and sau in (1, 2, 3) and viet not in ('bù', 'bu'):
            loi.append(f'不 đứng trước thanh {sau} nên ghi "bù" (đang ghi "{viet}")')
        if c == CHU_YI and sau == 4 and viet not in ('yí', 'yī'):
            loi.append(f'一 trước thanh 4 thường ghi "yí" (đang ghi "{viet}")')
        if c == CHU_YI and sau in (1, 2, 3) and viet not in ('yì', 'yī'):
            loi.append(f'一 trước thanh {sau} thường ghi "yì" (đang ghi "{viet}")')
    return loi


# ---------- Đọc nguồn ----------
def doc_nguon(cap=1):
    cac_diem, loi = [], []
    files = sorted(THU_MUC_NGUON.glob(f'cap{cap}-*.txt'))
    if not files:
        loi.append(f'Không có file nguồn nào trong {THU_MUC_NGUON.relative_to(GOC)}')
    for f in files:
        diem = None
        for so_dong, dong in enumerate(f.read_text(encoding='utf-8').splitlines(), 1):
            dong = dong.rstrip()
            noi = f'{f.name}:{so_dong}'
            if not dong.strip() or (dong.startswith('#') and not dong.startswith('##')):
                continue
            if dong.startswith('## '):
                diem = {'id': dong[3:].strip(), 'ten': '', 'deCuong': '', 'congThuc': [], 'giaiThich': [],
                        'loiHayMac': [], 'viDu': [], 'dienTu': [], 'canKiemTra': [], '_noi': noi}
                cac_diem.append(diem)
                continue
            if diem is None:
                loi.append(f'{noi}: nội dung nằm ngoài điểm ngữ pháp nào (thiếu dòng "## mã")')
                continue
            ky, _, nd = dong.partition(' ')
            nd = nd.strip()
            if ky == '@':
                diem['ten'] = nd
            elif ky == '§':
                diem['deCuong'] = nd
            elif ky == '&':
                if not nd.isdigit():
                    loi.append(f'{noi}: dòng "&" phải là số bài')
                    continue
                diem['bai'] = int(nd)
            elif ky == '=':
                diem['congThuc'].append(nd)
            elif ky == '-':
                diem['giaiThich'].append(nd)
            elif ky == '!':
                diem['loiHayMac'].append(nd)
            elif ky == '?!':
                diem['canKiemTra'].append(nd)
            elif ky == '>':
                phan = [p.strip() for p in nd.split('|')]
                if len(phan) != 3:
                    loi.append(f'{noi}: câu ví dụ cần 3 phần "chữ Hán | pinyin | dịch"')
                    continue
                han_manh, py, dich = phan
                dau = ''
                while han_manh and han_manh[-1] in DAU_CAU_CUOI:
                    dau = han_manh[-1] + dau
                    han_manh = han_manh[:-1]
                manh = [m.strip() for m in han_manh.split('/') if m.strip()]
                diem['viDu'].append({'han': ''.join(manh) + dau, 'manh': manh, 'dauCau': dau, 'khac': [],
                                     'pinyin': py, 'dich': dich, '_noi': noi})
            elif ky == '~':
                if not diem['viDu']:
                    loi.append(f'{noi}: dòng "~" phải đứng sau một câu ví dụ')
                    continue
                vd = diem['viDu'][-1]
                han_manh = nd.rstrip(DAU_CAU_CUOI)
                manh = [m.strip() for m in han_manh.split('/') if m.strip()]
                if sorted(manh) != sorted(vd['manh']):
                    loi.append(f'{noi}: thứ tự khác phải dùng đúng các mảnh của câu ví dụ phía trên')
                    continue
                vd['khac'].append(manh)
            elif ky == '?':
                phan = [p.strip() for p in nd.split('|')]
                if len(phan) != 5:
                    loi.append(f'{noi}: bài điền từ cần 5 phần "câu ___ | đáp án | nhiễu1; nhiễu2; nhiễu3 | pinyin | dịch"')
                    continue
                cau, dap_an, nhieu, py, dich = phan
                nhieu = [x.strip() for x in nhieu.split(';') if x.strip()]
                diem['dienTu'].append({'cau': cau, 'dapAn': dap_an, 'nhieu': nhieu, 'pinyin': py, 'dich': dich, '_noi': noi})
            else:
                loi.append(f'{noi}: không hiểu ký hiệu đầu dòng "{ky}"')
    return cac_diem, loi


def main():
    cap = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    file_ra = FILE_RA if cap == 1 else GOC / 'app' / 'data' / f'ngu-phap-hsk{cap}.json'
    file_bao_cao = FILE_BAO_CAO if cap == 1 else GOC / 'cong-cu' / f'bao-cao-ngu-phap-hsk{cap}.txt'
    cac_diem, loi = doc_nguon(cap)
    canh_bao = []

    chinh_thuc = json.loads((GOC / 'app' / 'data' / 'chinh-thuc' / 'chu-han-hsk1-3.json').read_text(encoding='utf-8'))
    # Chữ cho phép: chữ chính thức cấp 1…cap + chữ có trong từ vựng cấp 1…cap
    chu_cap1 = set().union(*(set(chinh_thuc['nhanBiet'][str(c)]) for c in range(1, cap + 1)))
    bai_cua_tu = {}   # từ của CẤP NÀY → bài (để biết điểm ngữ pháp dùng từ đến bài mấy)
    for c in range(1, cap + 1):
        for bai in json.loads((GOC / 'app' / 'data' / f'hsk{c}.json').read_text(encoding='utf-8'))['baiHoc']:
            for tu in bai['tu']:
                if c == cap:
                    bai_cua_tu.setdefault(tu['hanzi'], bai['so'])
                chu_cap1.update(x for x in tu['hanzi'] if LA_CHU_HAN.match(x))
    # Mã của các cấp dưới (tiến độ ngữ pháp lưu chung theo mã nên mã không được trùng)
    ma_cap_duoi = set()
    for c in range(1, cap):
        f = GOC / 'app' / 'data' / f'ngu-phap-hsk{c}.json'
        if f.exists():
            ma_cap_duoi |= {d['id'] for d in json.loads(f.read_text(encoding='utf-8'))['diem']}

    # Từ điển CC-CEDICT cho mọi chữ trong các câu
    tat_ca_cau = []
    for d in cac_diem:
        tat_ca_cau += [(v['han'], v['pinyin'], v['_noi']) for v in d['viDu']]
        tat_ca_cau += [(t['cau'].replace('___', t['dapAn']), t['pinyin'], t['_noi']) for t in d['dienTu']]
    can_chu = {c for han, _, _ in tat_ca_cau for c in han if LA_CHU_HAN.match(c)}
    tu_dien = kt.doc_cedict(can_chu)
    dai = max((len(k) for k in tu_dien), default=1)

    da_co_ma = set()
    for d in cac_diem:
        noi = d['_noi']
        if not re.fullmatch(r'[a-z0-9-]+', d['id']):
            loi.append(f'{noi}: mã "{d["id"]}" chỉ được dùng chữ thường không dấu, số và dấu gạch nối')
        if d['id'] in da_co_ma:
            loi.append(f'{noi}: mã "{d["id"]}" bị trùng')
        if d['id'] in ma_cap_duoi:
            loi.append(f'{noi}: mã "{d["id"]}" đã dùng ở cấp dưới')
        if cap > 1 and not d.get('bai'):
            canh_bao.append(f'{noi}: chưa ghi bài (dòng "& số bài")')
        da_co_ma.add(d['id'])
        for truong, ten in (('ten', 'tên (@)'), ('deCuong', 'mục đề cương (§)')):
            if not d[truong]:
                loi.append(f'{noi}: thiếu {ten}')
        if not d['congThuc']:
            loi.append(f'{noi}: thiếu công thức (=)')
        if len(d['viDu']) < 2:
            loi.append(f'{noi}: cần ít nhất 2 câu ví dụ (>)')
        if len(d['dienTu']) < 1:
            canh_bao.append(f'{noi}: chưa có bài điền từ (?)')

        hoc_sau = 0
        for v in d['viDu']:
            if len(v['manh']) < 2:
                canh_bao.append(f'{v["_noi"]}: câu ví dụ nên chia ít nhất 2–3 mảnh bằng "/" để làm bài sắp xếp')
            for m in v['manh']:
                if m in bai_cua_tu:
                    hoc_sau = max(hoc_sau, bai_cua_tu[m])
        for t in d['dienTu']:
            if t['cau'].count('___') != 1:
                loi.append(f'{t["_noi"]}: câu điền từ phải có đúng một chỗ trống ___')
            if len(t['nhieu']) != 3:
                loi.append(f'{t["_noi"]}: cần đúng 3 đáp án nhiễu')
            if t['dapAn'] in t['nhieu']:
                loi.append(f'{t["_noi"]}: đáp án đúng nằm trong các đáp án nhiễu')
            if len(set(t['nhieu'])) != len(t['nhieu']):
                loi.append(f'{t["_noi"]}: các đáp án nhiễu bị trùng nhau')
        d['hocSauBai'] = hoc_sau

    for han, py, noi in tat_ca_cau:
        ngoai = sorted({c for c in han if LA_CHU_HAN.match(c) and c not in chu_cap1})
        if ngoai:
            canh_bao.append(f'{noi}: dùng chữ ngoài cấp 1{f"–{cap}" if cap > 1 else ""}: {"、".join(ngoai)}')
        l, sai_thanh = kt.kiem_tra_cau(han, py, tu_dien, dai)
        if l:
            loi.append(f'{noi}: {han} | {py} → {l}')
        for x in sai_thanh:
            canh_bao.append(f'{noi}: {han} | {py} → sai thanh? {x}')
        for x in kiem_tra_bien_dieu(han, py):
            canh_bao.append(f'{noi}: {han} | {py} → {x}')

    # Ghi JSON (bỏ các trường nội bộ "_noi")
    def sach(x):
        if isinstance(x, dict):
            return {k: sach(v) for k, v in x.items() if not k.startswith('_')}
        if isinstance(x, list):
            return [sach(v) for v in x]
        return x

    goi = {
        '_ghiChu': 'File tạo tự động bởi cong-cu/ghep-ngu-phap.py từ cong-cu/nguon-ngu-phap/ – không sửa tay.',
        'capDo': cap,
        'nguon': f'Danh mục theo HSK考试大纲 (2025) – 语法大纲 cấp {cap}; giải thích và ví dụ soạn riêng cho app.',
        'diem': sach(cac_diem),
    }
    if not loi:
        file_ra.write_text(json.dumps(goi, ensure_ascii=False, indent=1), encoding='utf-8')

    so_vd = sum(len(d['viDu']) for d in cac_diem)
    so_dt = sum(len(d['dienTu']) for d in cac_diem)
    dong = [f'Điểm ngữ pháp: {len(cac_diem)} · câu ví dụ: {so_vd} · bài điền từ: {so_dt}',
            f'LỖI: {len(loi)} · CẢNH BÁO: {len(canh_bao)}', '']
    if loi:
        dong += ['===== LỖI (chưa ghi file JSON – sửa xong chạy lại) ====='] + ['  - ' + x for x in loi] + ['']
    if canh_bao:
        dong += ['===== CẢNH BÁO (nên xem lại) ====='] + ['  - ' + x for x in canh_bao] + ['']
    if not loi:
        dong.append(f'Đã ghi {file_ra.relative_to(GOC)}')
    bao_cao = '\n'.join(dong)
    file_bao_cao.write_text(bao_cao + '\n', encoding='utf-8')
    print(bao_cao)
    sys.exit(1 if loi else 0)


if __name__ == '__main__':
    main()
