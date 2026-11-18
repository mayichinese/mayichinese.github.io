# -*- coding: utf-8 -*-
"""
Ghép dữ liệu HSK 1 thành app/data/hsk1.json và tự kiểm tra.

Đọc từ các file CÓ SẴN (script không chứa danh sách từ nào):
  - app/data/chinh-thuc/tu-vung-hsk1-3.json : danh sách từ chính thức (pinyin, từ loại)
  - app/data/chinh-thuc/chu-han-hsk1-3.json : chữ Hán chính thức theo cấp
  - cong-cu/nguon-hsk1/phan-bai.txt         : chia 300 từ thành các bài
  - cong-cu/nguon-hsk1/bai-*.txt            : phần soạn tay (Hán Việt, nghĩa, ví dụ, ghi chú)
  - cong-cu/tu-dien-doi-chieu/cedict.txt    : từ điển CC-CEDICT để đối chiếu pinyin

Cách chạy (từ thư mục d:\\Project\\HocTieng):
  python -X utf8 cong-cu/ghep-du-lieu-hsk1.py
"""
import glob
import json
import os
import re
import sys
import unicodedata
from collections import Counter

GOC = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DUONG_DAN = {
    "tuVung": os.path.join(GOC, "app", "data", "chinh-thuc", "tu-vung-hsk1-3.json"),
    "chuHan": os.path.join(GOC, "app", "data", "chinh-thuc", "chu-han-hsk1-3.json"),
    "phanBai": os.path.join(GOC, "cong-cu", "nguon-hsk1", "phan-bai.txt"),
    "nguon": os.path.join(GOC, "cong-cu", "nguon-hsk1", "bai-*.txt"),
    "cedict": os.path.join(GOC, "cong-cu", "tu-dien-doi-chieu", "cedict.txt"),
    "ketQua": os.path.join(GOC, "app", "data", "hsk1.json"),
}
CAP = 1
LA_CHU_HAN = re.compile(r"[\u4e00-\u9fff]")

loi = []       # lỗi nghiêm trọng: phải sửa
canhBao = []   # cảnh báo: nên xem lại


# ---------- 1. Đọc danh sách chính thức ----------
def doc_json(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


chinhThuc = {t["dangGoc"]: t for t in doc_json(DUONG_DAN["tuVung"])["tu"] if t["capDo"] == CAP}
chuCap1 = set(doc_json(DUONG_DAN["chuHan"])["nhanBiet"][str(CAP)])


def tach_tu_loai(chuoi):
    """'形、介、（动、量）' -> ({'形','介'}, {'动','量'}): (thuộc cấp này, thuộc cấp cao hơn)."""
    chinh, caoHon = set(), set()
    for phan in re.findall(r"（[^）]*）|[^、（）]+", chuoi or ""):
        if phan.startswith("（"):
            caoHon |= {x for x in phan.strip("（）").split("、") if x}
        else:
            chinh.add(phan)
    return chinh, caoHon


# ---------- 2. Đọc file phân bài ----------
baiHoc = []
with open(DUONG_DAN["phanBai"], encoding="utf-8") as f:
    for dong in f:
        dong = dong.strip()
        if not dong or dong.startswith("#"):
            continue
        so, ten, cacTu = [x.strip() for x in dong.split("|")]
        baiHoc.append({"so": int(so), "ten": ten, "dangGoc": cacTu.split()})

tatCaTrongBai = [t for b in baiHoc for t in b["dangGoc"]]
for tu, n in Counter(tatCaTrongBai).items():
    if n > 1:
        loi.append(f"[phân bài] từ '{tu}' xuất hiện {n} lần")
for tu in tatCaTrongBai:
    if tu not in chinhThuc:
        loi.append(f"[phân bài] từ '{tu}' không có trong danh sách chính thức cấp {CAP}")
for tu in chinhThuc:
    if tu not in tatCaTrongBai:
        loi.append(f"[phân bài] từ chính thức '{tu}' chưa được xếp vào bài nào")


# ---------- 3. Đọc các file soạn tay ----------
def doc_nguon(p):
    muc, hienTai = {}, None
    with open(p, encoding="utf-8") as f:
        for soDong, dong in enumerate(f, 1):
            dong = dong.rstrip("\n").strip()
            if not dong or dong.startswith("#"):
                continue
            noi = f"{os.path.basename(p)}:{soDong}"
            kyHieu, noiDung = dong[0], dong[1:].strip()
            cot = [x.strip() for x in noiDung.split("|")]
            if kyHieu == "@":
                hienTai = {"dangGoc": cot[0], "hanViet": cot[1] if len(cot) > 1 else "",
                           "nghia": [], "viDu": [], "ghiChu": [], "canKiemTra": [], "noi": noi}
                if cot[0] in muc:
                    loi.append(f"[{noi}] từ '{cot[0]}' bị soạn trùng")
                muc[cot[0]] = hienTai
            elif hienTai is None:
                loi.append(f"[{noi}] dòng nằm ngoài mục từ nào: {dong}")
            elif kyHieu == "-" and len(cot) == 2:
                hienTai["nghia"].append({"tuLoai": cot[0], "nghia": cot[1]})
            elif kyHieu == ">" and len(cot) == 3:
                # "nghiaSo": câu ví dụ này minh họa cho nghĩa thứ mấy (0, 1, 2…) của từ
                hienTai["viDu"].append({"han": cot[0], "pinyin": cot[1], "dich": cot[2],
                                        "nghiaSo": max(len(hienTai["nghia"]) - 1, 0)})
            elif kyHieu == "*":
                hienTai["ghiChu"].append(noiDung)
            elif kyHieu == "?" and len(cot) == 2:
                hienTai["canKiemTra"].append({"truong": cot[0], "lyDo": cot[1]})
            else:
                loi.append(f"[{noi}] sai định dạng: {dong}")
    return muc


daSoan = {}
for p in sorted(glob.glob(DUONG_DAN["nguon"])):
    for k, v in doc_nguon(p).items():
        if k in daSoan:
            loi.append(f"[{v['noi']}] từ '{k}' đã soạn ở {daSoan[k]['noi']}")
        daSoan[k] = v
for k, v in daSoan.items():
    if k not in chinhThuc:
        loi.append(f"[{v['noi']}] từ '{k}' không có trong danh sách chính thức cấp {CAP}")


# ---------- 4. Từ điển CC-CEDICT để đối chiếu pinyin ----------
NGUYEN_AM = "aeiouü"
DAU = {"a": "āáǎà", "e": "ēéěè", "i": "īíǐì", "o": "ōóǒò", "u": "ūúǔù", "ü": "ǖǘǚǜ"}


def am_tiet_co_dau(am):
    """'hao3' -> 'hǎo', 'ma5' -> 'ma', 'nu:3' -> 'nǚ'."""
    am = am.lower().replace("u:", "ü").replace("v", "ü")
    m = re.fullmatch(r"([a-zü]+)([1-5])", am)
    if not m:
        return am
    goc, thanh = m.group(1), int(m.group(2))
    if thanh == 5:
        return goc
    if "a" in goc:
        vt = goc.index("a")
    elif "e" in goc:
        vt = goc.index("e")
    elif "ou" in goc:
        vt = goc.index("o")
    else:
        vt = max(i for i, c in enumerate(goc) if c in NGUYEN_AM)
    return goc[:vt] + DAU[goc[vt]][thanh - 1] + goc[vt + 1:]


def chuan_hoa(py):
    return re.sub(r"[\s'’·-]", "", unicodedata.normalize("NFC", py)).lower()


def bo_dau(py):
    return "".join(c for c in unicodedata.normalize("NFD", py) if not unicodedata.combining(c))


cedict = {}
canTim = {t["hanzi"] for t in chinhThuc.values()}
with open(DUONG_DAN["cedict"], encoding="utf-8") as f:
    for dong in f:
        if dong.startswith("#"):
            continue
        m = re.match(r"\S+ (\S+) \[([^\]]+)\]", dong)
        if m and m.group(1) in canTim:
            cedict.setdefault(m.group(1), set()).add(
                chuan_hoa("".join(am_tiet_co_dau(a) for a in m.group(2).split())))


# ---------- 5. Ghép và kiểm tra từng từ ----------
TU_LOAI_HOP_LE = {"名", "动", "形", "副", "代", "数", "量", "助", "介", "连", "叹", "前缀", "后缀", "数量", "cụm"}
ketQua = {"capDo": CAP, "nguon": "Danh sách chính thức HSK 3.0 (đề cương 2025) + phần soạn tay",
          "baiHoc": []}
thongKe = Counter()

for bai in baiHoc:
    dsTu = []
    for dg in bai["dangGoc"]:
        ct = chinhThuc.get(dg)
        if not ct:
            continue
        hanzi, pinyin = ct["hanzi"], ct["pinyin"]
        tuLoaiChinh, tuLoaiCaoHon = tach_tu_loai(ct["tuLoai"])

        # Đối chiếu pinyin chính thức với CC-CEDICT
        ds = cedict.get(hanzi, set())
        if not ds:
            canhBao.append(f"[pinyin] '{dg}' không có trong CC-CEDICT để đối chiếu")
        elif chuan_hoa(pinyin) not in ds:
            if bo_dau(chuan_hoa(pinyin)) in {bo_dau(x) for x in ds}:
                canhBao.append(f"[pinyin] '{dg}': chính thức '{pinyin}' khác dấu thanh với CC-CEDICT {sorted(ds)} (thường do biến điệu/thanh nhẹ)")
            else:
                canhBao.append(f"[pinyin] '{dg}': chính thức '{pinyin}' khác CC-CEDICT {sorted(ds)}")

        muc = {"dangGoc": dg, "hanzi": hanzi, "pinyin": pinyin, "tuLoaiChinhThuc": ct["tuLoai"],
               "soThuTu": ct["soThuTu"], "daSoan": dg in daSoan}
        s = daSoan.get(dg)
        if s:
            thongKe["daSoan"] += 1
            noi = s["noi"]
            if not s["hanViet"]:
                canhBao.append(f"[{noi}] '{dg}' thiếu âm Hán Việt")
            if not s["nghia"]:
                loi.append(f"[{noi}] '{dg}' chưa có nghĩa")
            if not s["viDu"]:
                canhBao.append(f"[{noi}] '{dg}' chưa có câu ví dụ")
            for n in s["nghia"]:
                tl = n["tuLoai"]
                if tl not in TU_LOAI_HOP_LE:
                    loi.append(f"[{noi}] '{dg}' từ loại lạ: '{tl}'")
                elif tl == "cụm":
                    if ct["tuLoai"]:
                        canhBao.append(f"[{noi}] '{dg}' ghi 'cụm' nhưng chính thức là '{ct['tuLoai']}'")
                elif tl in tuLoaiCaoHon:
                    canhBao.append(f"[{noi}] '{dg}' từ loại '{tl}' thuộc cấp cao hơn (chính thức '{ct['tuLoai']}')")
                elif tl not in tuLoaiChinh:
                    loi.append(f"[{noi}] '{dg}' từ loại '{tl}' không khớp chính thức '{ct['tuLoai']}'")
            for v in s["viDu"]:
                if hanzi not in v["han"]:
                    loi.append(f"[{noi}] '{dg}' câu ví dụ không chứa từ đang học: {v['han']}")
                ngoai = sorted({c for c in v["han"] if LA_CHU_HAN.match(c) and c not in chuCap1})
                if ngoai:
                    canhBao.append(f"[{noi}] '{dg}' câu '{v['han']}' có chữ ngoài cấp {CAP}: {' '.join(ngoai)}")
            if s["canKiemTra"]:
                thongKe["canKiemTra"] += 1
            muc.update({k: s[k] for k in ("hanViet", "nghia", "viDu", "ghiChu", "canKiemTra")})
        dsTu.append(muc)
    soXong = sum(t["daSoan"] for t in dsTu)
    ketQua["baiHoc"].append({"so": bai["so"], "ten": bai["ten"], "soTu": len(dsTu),
                             "daSoanXong": soXong == len(dsTu), "tu": dsTu})

# ---------- 6. Ghi kết quả và báo cáo ----------
with open(DUONG_DAN["ketQua"], "w", encoding="utf-8") as f:
    json.dump(ketQua, f, ensure_ascii=False, indent=1)

print(f"Đã ghi {os.path.relpath(DUONG_DAN['ketQua'], GOC)}")
print(f"Từ chính thức cấp {CAP}: {len(chinhThuc)} | đã xếp bài: {len(set(tatCaTrongBai))} | "
      f"đã soạn: {thongKe['daSoan']} | còn thiếu: {len(chinhThuc) - thongKe['daSoan']} | "
      f"có mục cần kiểm tra: {thongKe['canKiemTra']}")
for b in ketQua["baiHoc"]:
    xong = sum(t["daSoan"] for t in b["tu"])
    print(f"  Bài {b['so']:>2}: {xong:>2}/{b['soTu']:<2} {'✓' if b['daSoanXong'] else ' '} {b['ten']}")
print(f"\nLỖI ({len(loi)}):")
for x in loi:
    print("  - " + x)
print(f"\nCẢNH BÁO ({len(canhBao)}):")
for x in canhBao:
    print("  - " + x)
sys.exit(1 if loi else 0)
