# -*- coding: utf-8 -*-
"""
Tạo file dữ liệu CHÍNH THỨC (chỉ chép lại, không thêm thắt) từ đề cương thi HSK 2025
(《HSK考试大纲》, 中外语言交流合作中心, công bố 2025-11, áp dụng 2026-07).

Cách chạy (chỉ cần khi muốn tạo lại):
  python cong-cu/trich-text-pdf.py tai-lieu/de-cuong-2025/HSK-de-cuong-thi-2025.pdf syl.txt
  python cong-cu/tao-du-lieu-chinh-thuc.py syl.txt app/data/chinh-thuc
"""
import sys, re, json, os

txt = open(sys.argv[1], encoding="utf-8").read()
out_dir = sys.argv[2]
parts = re.split(r"\n=====PAGE (\d+)=====\n", txt)
PAGES = {int(parts[k]): parts[k + 1] for k in range(1, len(parts), 2)}

def clean(body):
    """Bỏ dòng trống và khối hình mờ '汉考国际' + số trang ở cuối mỗi trang."""
    lines = [l.strip() for l in body.split("\n")]
    if "汉考国际" in lines:
        lines = lines[: lines.index("汉考国际")]
    return [l for l in lines if l]

# ---------- 1. Từ vựng (trang PDF 80 → 110 chứa cấp 1–4) ----------
words = []
for p in range(80, 111):
    lines = clean(PAGES[p])
    if lines[:5] == ["序号", "等级", "词语", "拼音", "词性"]:
        lines = lines[5:]
    i = 0
    while i < len(lines):
        idx, lvl, word, py = int(lines[i]), lines[i + 1], lines[i + 2], lines[i + 3]
        pos, j = "", i + 4
        if j < len(lines) and not re.fullmatch(r"\d+", lines[j]):
            pos, j = lines[j], j + 1
        if lvl[0] in "123":
            words.append({
                "capDo": int(lvl[0]),        # cấp của từ
                "soThuTu": idx,               # số thứ tự trong danh sách của cấp đó
                "dangGoc": word,              # nguyên văn (có thể kèm số 1, 2 để phân biệt từ đồng hình)
                "hanzi": re.sub(r"\d", "", word),
                "pinyin": py.replace("’", "'"),
                "dangCap": lvl,               # ví dụ "1（4）": một số cách dùng thuộc cấp 4
                "tuLoai": pos,                # ví dụ "形、介、（动、量）": phần trong ngoặc thuộc cấp cao hơn
            })
        i = j

# ---------- 2. Chữ Hán: chữ cần nhận biết (认读字) và chữ cần viết (书写字) ----------
lists, cur = {}, None
for p in range(356, 385):
    for l in clean(PAGES[p]):
        if re.search(r"(认读字|书写字)$", l):
            cur = l; lists[cur] = []; continue
        if cur is None: continue
        if re.fullmatch(r"[\u4e00-\u9fff]", l) and lists[cur] and lists[cur][-1] == "":
            lists[cur][-1] = l; continue
        for m in re.finditer(r"(\d+)\.\s*([\u4e00-\u9fff]?)", l):
            lists[cur].append(m.group(2))

chars = {
    "nguon": "HSK考试大纲 (2025) – HSK 汉字大纲",
    "nhanBiet": {
        "1": lists["HSK（一级）认读字"],
        "2": lists["HSK（二级）认读字"],
        "3": lists["HSK（三级）认读字"],
    },
    "vietTay": {
        "1-2": lists["HSK（一级）~（二级）书写字"],
        "3": lists["HSK（三级）书写字"],
    },
}
vocab = {
    "nguon": "HSK考试大纲 (2025) – HSK 词汇大纲, cấp 1–3. Chép nguyên văn, KHÔNG chỉnh sửa.",
    "ghiChu": "dangCap '1（4）' và phần từ loại trong ngoặc '（动、量）' = cách dùng đó thuộc cấp cao hơn.",
    "tu": words,
}
os.makedirs(out_dir, exist_ok=True)
json.dump(vocab, open(os.path.join(out_dir, "tu-vung-hsk1-3.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
json.dump(chars, open(os.path.join(out_dir, "chu-han-hsk1-3.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
from collections import Counter
print("Từ vựng:", Counter(w["capDo"] for w in words))
print("Chữ nhận biết:", {k: len(v) for k, v in chars["nhanBiet"].items()}, "Chữ viết:", {k: len(v) for k, v in chars["vietTay"].items()})
