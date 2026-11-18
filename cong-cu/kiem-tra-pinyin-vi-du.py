# -*- coding: utf-8 -*-
"""
Kiểm tra pinyin của các câu ví dụ trong app/data/hsk1.json bằng từ điển CC-CEDICT.

Script CHỈ ĐỌC dữ liệu, không sửa file nào. Kết quả in ra màn hình và ghi vào
cong-cu/bao-cao-pinyin-vi-du.txt.

Cách hoạt động: với mỗi câu, thử ghép lần lượt từng từ trong CC-CEDICT (mỗi chữ/từ
có thể có nhiều cách đọc) sao cho khớp với pinyin đã soạn, chọn cách ghép ít sai thanh nhất.
  - LỖI     : pinyin không khớp chữ Hán (sai âm, thiếu/thừa âm tiết).
  - SAI THANH: âm đúng nhưng dấu thanh khác từ điển, không giải thích được bằng quy tắc.
  - Bỏ qua (hợp lệ): biến điệu của 不 / 一, và khác biệt do thanh nhẹ.
Giới hạn: nếu chữ có nhiều cách đọc (ví dụ 行 háng/xíng) thì cách đọc nào có trong
từ điển cũng được chấp nhận — script không biết ngữ cảnh.

Cách chạy (từ thư mục d:\\Project\\HocTieng):
  python -X utf8 cong-cu/kiem-tra-pinyin-vi-du.py [đường-dẫn-json]
"""
import json
import os
import re
import sys
import unicodedata
from functools import lru_cache

GOC = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILE_JSON = sys.argv[1] if len(sys.argv) > 1 else os.path.join(GOC, "app", "data", "hsk1.json")
FILE_CEDICT = os.path.join(GOC, "cong-cu", "tu-dien-doi-chieu", "cedict.txt")
FILE_BAO_CAO = os.path.join(GOC, "cong-cu", "bao-cao-pinyin-vi-du.txt")

LA_CHU_HAN = re.compile(r"[\u4e00-\u9fff]")
DAU_THANH = {"\u0304": 1, "\u0301": 2, "\u030c": 3, "\u0300": 4}
CHU_BU, CHU_YI = "\u4e0d", "\u4e00"   # 不, 一 (viết mã để file không chứa chữ Hán)


# ---------- Tách từng ký tự pinyin thành (chữ cái gốc, thanh) ----------
def phan_tich_ky_tu(c):
    """'ǎ' -> ('a', 3); 'ü' -> ('u', 0); 'b' -> ('b', 0)."""
    nfd = unicodedata.normalize("NFD", c)
    thanh = next((DAU_THANH[m] for m in nfd[1:] if m in DAU_THANH), 0)
    return nfd[0], thanh


def chuan_bi_pinyin(py):
    """Giữ lại chữ cái, bỏ dấu câu/khoảng trắng/số. Trả về (chuỗi gốc không dấu, danh sách thanh theo ký tự)."""
    goc, thanh = [], []
    for c in unicodedata.normalize("NFC", py.lower()):
        b, t = phan_tich_ky_tu(c)
        if "a" <= b <= "z":
            goc.append(b)
            thanh.append(t)
    return "".join(goc), thanh


# ---------- Đọc CC-CEDICT ----------
def doc_cedict(canChu):
    """chữ/từ giản thể -> tập các cách đọc, mỗi cách đọc là tuple((âm không dấu, thanh), ...)."""
    tuDien = {}
    with open(FILE_CEDICT, encoding="utf-8") as f:
        for dong in f:
            if dong.startswith("#"):
                continue
            m = re.match(r"\S+ (\S+) \[([^\]]+)\]", dong)
            if not m or not set(m.group(1)) <= canChu:
                continue
            amTiet = []
            for a in m.group(2).lower().replace("u:", "u").split():
                mm = re.fullmatch(r"([a-z]+)([1-5])", a)
                if not mm:
                    amTiet = None
                    break
                amTiet.append((mm.group(1), int(mm.group(2))))
            if amTiet and len(amTiet) == len(m.group(1)):
                tuDien.setdefault(m.group(1), set()).add(tuple(amTiet))
    return tuDien


# ---------- So một câu ----------
def danh_gia_thanh(chu, mong, viet, chuSau):
    """Trả về None nếu chấp nhận được, ngược lại trả về mô tả lỗi thanh."""
    if mong == viet or mong == 5 or viet in (0, 5):
        return None
    if chu == CHU_BU and mong == 4 and viet == 2:
        return None
    if chu == CHU_YI and mong == 1 and viet in (2, 4):
        return None
    return f"{chu}: từ điển thanh {mong}, đang ghi thanh {viet}"


def kiem_tra_cau(han, py, tuDien, dai):
    chu = "".join(c for c in han if LA_CHU_HAN.match(c))
    goc, thanh = chuan_bi_pinyin(py)
    n, m = len(chu), len(goc)

    @lru_cache(maxsize=None)
    def tim(i, j):
        """Ghép chu[i:] với goc[j:]. Trả về (số lỗi thanh, danh sách lỗi) hoặc None nếu không ghép được."""
        if i == n:
            return (0, ()) if j == m else None
        tot = None
        for k in range(min(dai, n - i), 0, -1):
            for docAm in tuDien.get(chu[i:i + k], ()):
                jj, loiThanh = j, []
                for idx, (am, t) in enumerate(docAm):
                    if goc[jj:jj + len(am)] != am:
                        break
                    viet = max(thanh[jj:jj + len(am)])
                    l = danh_gia_thanh(chu[i + idx], t, viet, None)
                    if l:
                        loiThanh.append(l)
                    jj += len(am)
                else:
                    sau = tim(i + k, jj)
                    if sau is not None:
                        ung = (len(loiThanh) + sau[0], tuple(loiThanh) + sau[1])
                        if tot is None or ung[0] < tot[0]:
                            tot = ung
        return tot

    kq = tim(0, 0)
    if kq is not None:
        return None, list(kq[1])
    # Không ghép được: đi từ đầu câu, tìm chữ xa nhất còn ghép được để báo vị trí
    daDen, hang, xaNhat = {(0, 0)}, [(0, 0)], 0
    while hang:
        i, j = hang.pop()
        xaNhat = max(xaNhat, i)
        for k in range(1, min(dai, n - i) + 1):
            for docAm in tuDien.get(chu[i:i + k], ()):
                am = "".join(a for a, _ in docAm)
                if goc[j:j + len(am)] == am and (i + k, j + len(am)) not in daDen:
                    daDen.add((i + k, j + len(am)))
                    hang.append((i + k, j + len(am)))
    return f"pinyin không khớp chữ Hán (sai từ chữ thứ {xaNhat + 1}: '{chu[xaNhat:xaNhat + 3]}')", []


def main():
    with open(FILE_JSON, encoding="utf-8") as f:
        duLieu = json.load(f)
    cacCau = []
    for bai in duLieu["baiHoc"]:
        for tu in bai["tu"]:
            for v in tu.get("viDu", []):
                cacCau.append((bai["so"], tu["dangGoc"], v["han"], v["pinyin"]))

    canChu = {c for _, _, han, _ in cacCau for c in han if LA_CHU_HAN.match(c)}
    tuDien = doc_cedict(canChu)
    dai = max((len(k) for k in tuDien), default=1)

    loi, saiThanh = [], []
    for so, dg, han, py in cacCau:
        l, st = kiem_tra_cau(han, py, tuDien, dai)
        noi = f"Bài {so} | {dg} | {han} | {py}"
        if l:
            loi.append(f"{noi}\n      → {l}")
        for x in st:
            saiThanh.append(f"{noi}\n      → {x}")

    dong = [f"Đã kiểm tra {len(cacCau)} câu ví dụ trong {FILE_JSON}",
            f"LỖI (pinyin không khớp chữ): {len(loi)}",
            f"SAI THANH (nên xem lại): {len(saiThanh)}", ""]
    if loi:
        dong += ["===== LỖI ====="] + ["  - " + x for x in loi] + [""]
    if saiThanh:
        dong += ["===== SAI THANH ====="] + ["  - " + x for x in saiThanh]
    baoCao = "\n".join(dong)
    with open(FILE_BAO_CAO, "w", encoding="utf-8") as f:
        f.write(baoCao + "\n")
    print(baoCao)
    print(f"\nĐã ghi báo cáo: {os.path.relpath(FILE_BAO_CAO, GOC)}")
    sys.exit(1 if loi else 0)


if __name__ == "__main__":
    main()
