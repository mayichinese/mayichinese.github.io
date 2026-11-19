# -*- coding: utf-8 -*-
"""
Ghép dữ liệu HSK cấp 2 (hoặc 3) thành app/data/hsk<cấp>.json, tự kiểm tra và kiểm tra luôn
pinyin câu ví dụ. (Cấp 1 vẫn dùng ghep-du-lieu-hsk1.py như cũ.)

Đọc từ các file CÓ SẴN (script không chứa danh sách từ nào):
  - app/data/chinh-thuc/tu-vung-hsk1-3.json : danh sách từ chính thức (pinyin, từ loại)
  - app/data/chinh-thuc/chu-han-hsk1-3.json : chữ Hán chính thức theo cấp
  - cong-cu/nguon-hsk<cấp>/phan-bai.txt     : chia từ thành các bài
  - cong-cu/nguon-hsk<cấp>/bai-*.txt        : phần soạn tay (định dạng giống nguon-hsk1)
  - cong-cu/tu-dien-doi-chieu/cedict.txt    : CC-CEDICT để đối chiếu pinyin

Mục từ trùng mặt chữ trong cùng một cấp (ví dụ 过 guò / 过 guo): mục đầu giữ nguyên dạng gốc,
mục sau thêm pinyin trong ngoặc: 过(guo). Dùng đúng dạng đó trong phan-bai.txt và bai-*.txt.

Câu ví dụ chỉ nên dùng chữ từ cấp 1 đến cấp đang soạn (chữ ngoài → cảnh báo).

Cách chạy (từ thư mục dự án):
  python -X utf8 cong-cu/ghep-du-lieu-cap.py 2
Kết quả: app/data/hsk2.json + báo cáo cong-cu/bao-cao-hsk2.txt
"""
import glob
import importlib.util
import json
import os
import re
import sys
from collections import Counter

GOC = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAP = int(sys.argv[1]) if len(sys.argv) > 1 else 2
THU_MUC_NGUON = os.path.join(GOC, "cong-cu", f"nguon-hsk{CAP}")
DUONG_DAN = {
    "tuVung": os.path.join(GOC, "app", "data", "chinh-thuc", "tu-vung-hsk1-3.json"),
    "chuHan": os.path.join(GOC, "app", "data", "chinh-thuc", "chu-han-hsk1-3.json"),
    "phanBai": os.path.join(THU_MUC_NGUON, "phan-bai.txt"),
    "nguon": os.path.join(THU_MUC_NGUON, "bai-*.txt"),
    "ketQua": os.path.join(GOC, "app", "data", f"hsk{CAP}.json"),
    "baoCao": os.path.join(GOC, "cong-cu", f"bao-cao-hsk{CAP}.txt"),
}
LA_CHU_HAN = re.compile(r"[一-鿿]")

# Dùng lại các hàm của script cấp 1 (không sửa script đó):
#   kiem-tra-pinyin-vi-du.py: đọc CC-CEDICT, kiểm tra pinyin cả câu
def nap(ten, tep):
    spec = importlib.util.spec_from_file_location(ten, os.path.join(GOC, "cong-cu", tep))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


kt = nap("kiem_tra_pinyin", "kiem-tra-pinyin-vi-du.py")

loi = []       # lỗi nghiêm trọng: phải sửa
canhBao = []   # cảnh báo: nên xem lại


def doc_json(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


# ---------- 1. Danh sách chính thức của cấp này (khóa không trùng) ----------
chinhThuc = {}
for t in doc_json(DUONG_DAN["tuVung"])["tu"]:
    if t["capDo"] != CAP:
        continue
    khoa = t["dangGoc"] if t["dangGoc"] not in chinhThuc else f"{t['dangGoc']}({t['pinyin']})"
    chinhThuc[khoa] = t
nhanBiet = doc_json(DUONG_DAN["chuHan"])["nhanBiet"]
chuChoPhep = set().union(*(set(nhanBiet[str(c)]) for c in range(1, CAP + 1)))


def tach_tu_loai(chuoi):
    """'形、介、（动、量）' -> ({'形','介'}, {'动','量'}): (thuộc cấp này, thuộc cấp cao hơn)."""
    chinh, caoHon = set(), set()
    for phan in re.findall(r"（[^）]*）|[^、（）]+", chuoi or ""):
        if phan.startswith("（"):
            caoHon |= {x for x in phan.strip("（）").split("、") if x}
        else:
            chinh.add(phan)
    return chinh, caoHon


# ---------- 2. File phân bài ----------
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


# ---------- 3. Các file soạn tay (định dạng giống nguon-hsk1/bai-*.txt) ----------
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


# ---------- 4. Ghép và kiểm tra từng từ ----------
TU_LOAI_HOP_LE = {"名", "动", "形", "副", "代", "数", "量", "助", "介", "连", "叹", "前缀", "后缀", "数量", "cụm"}
ketQua = {"capDo": CAP, "nguon": "Danh sách chính thức HSK 3.0 (đề cương 2025) + phần soạn tay",
          "baiHoc": []}
thongKe = Counter()
cacCau = []   # (nơi, dạng gốc, câu, pinyin) để kiểm tra pinyin ở bước 5

for bai in baiHoc:
    dsTu = []
    for dg in bai["dangGoc"]:
        ct = chinhThuc.get(dg)
        if not ct:
            continue
        hanzi, pinyin = ct["hanzi"], ct["pinyin"]
        tuLoaiChinh, tuLoaiCaoHon = tach_tu_loai(ct["tuLoai"])
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
            if len(s["viDu"]) < 2:
                canhBao.append(f"[{noi}] '{dg}' có {len(s['viDu'])} câu ví dụ (nên có 2)")
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
                ngoai = sorted({c for c in v["han"] if LA_CHU_HAN.match(c) and c not in chuChoPhep})
                if ngoai:
                    canhBao.append(f"[{noi}] '{dg}' câu '{v['han']}' có chữ ngoài cấp 1–{CAP}: {' '.join(ngoai)}")
                cacCau.append((f"Bài {bai['so']} | {dg}", v["han"], v["pinyin"]))
            if s["canKiemTra"]:
                thongKe["canKiemTra"] += 1
            muc.update({k: s[k] for k in ("hanViet", "nghia", "viDu", "ghiChu", "canKiemTra")})
        dsTu.append(muc)
    soXong = sum(t["daSoan"] for t in dsTu)
    ketQua["baiHoc"].append({"so": bai["so"], "ten": bai["ten"], "soTu": len(dsTu),
                             "daSoanXong": soXong == len(dsTu), "tu": dsTu})

# ---------- 5. Kiểm tra pinyin câu ví dụ bằng CC-CEDICT ----------
# Pinyin của từ đơn lẻ lấy nguyên văn danh sách chính thức nên không cần kiểm tra lại.
canChu = {c for _, han, _ in cacCau for c in han if LA_CHU_HAN.match(c)}
tuDien = kt.doc_cedict(canChu)
dai = max((len(k) for k in tuDien), default=1)
saiThanh = []
for noi, han, py in cacCau:
    l, st = kt.kiem_tra_cau(han, py, tuDien, dai)
    if l:
        loi.append(f"[pinyin] {noi} | {han} | {py}\n      → {l}")
    for x in st:
        saiThanh.append(f"[pinyin] {noi} | {han} | {py}\n      → {x}")

# ---------- 6. Ghi kết quả và báo cáo ----------
with open(DUONG_DAN["ketQua"], "w", encoding="utf-8") as f:
    json.dump(ketQua, f, ensure_ascii=False, indent=1)

dong = [f"Đã ghi {os.path.relpath(DUONG_DAN['ketQua'], GOC)}",
        f"Từ chính thức cấp {CAP}: {len(chinhThuc)} | đã xếp bài: {len(set(tatCaTrongBai))} | "
        f"đã soạn: {thongKe['daSoan']} | còn thiếu: {len(chinhThuc) - thongKe['daSoan']} | "
        f"câu ví dụ: {len(cacCau)} | có mục cần kiểm tra: {thongKe['canKiemTra']}"]
for b in ketQua["baiHoc"]:
    xong = sum(t["daSoan"] for t in b["tu"])
    dong.append(f"  Bài {b['so']:>2}: {xong:>2}/{b['soTu']:<2} {'✓' if b['daSoanXong'] else ' '} {b['ten']}")
dong += ["", f"LỖI ({len(loi)}):"] + ["  - " + x for x in loi]
dong += ["", f"CẢNH BÁO ({len(canhBao)}):"] + ["  - " + x for x in canhBao]
dong += ["", f"SAI THANH trong câu ví dụ – nên xem lại ({len(saiThanh)}):"] + ["  - " + x for x in saiThanh]
baoCao = "\n".join(dong)
with open(DUONG_DAN["baoCao"], "w", encoding="utf-8") as f:
    f.write(baoCao + "\n")
print(baoCao)
print(f"\nĐã ghi báo cáo: {os.path.relpath(DUONG_DAN['baoCao'], GOC)}")
sys.exit(1 if loi else 0)
