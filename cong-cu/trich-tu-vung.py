# Đọc danh sách từ vựng HSK 1-3 từ text trích ra của đề cương
import sys, re, json
txt = open(sys.argv[1], encoding="utf-8").read()
pages = re.split(r"\n=====PAGE (\d+)=====\n", txt)
# pages: ['', '1', body, '2', body, ...]
recs = []
WM = {"汉考国际", "际", "汉"}
for k in range(1, len(pages), 2):
    pno = int(pages[k]); body = pages[k+1]
    if pno < 80 or pno > 110: continue
    lines = [l.strip() for l in body.split("\n")]
    # bỏ phần watermark cuối trang
    if "汉考国际" in lines:
        lines = lines[:lines.index("汉考国际")]
    lines = [l for l in lines if l != ""]
    if lines[:5] == ["序号","等级","词语","拼音","词性"]:
        lines = lines[5:]
    else:
        print("NOHEADER page", pno, lines[:6], file=sys.stderr)
    i = 0
    while i < len(lines):
        if not re.fullmatch(r"\d+", lines[i]):
            print("UNEXPECTED", pno, i, lines[i:i+5], file=sys.stderr); i += 1; continue
        idx = int(lines[i]); lvl = lines[i+1]; word = lines[i+2]; py = lines[i+3]
        pos = ""
        j = i + 4
        if j < len(lines) and not re.fullmatch(r"\d+", lines[j]):
            pos = lines[j]; j += 1
        recs.append(dict(page=pno, idx=idx, level=lvl, word=word, pinyin=py, pos=pos))
        i = j
json.dump(recs, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=0)
from collections import Counter
c = Counter(r["level"][0] for r in recs)
print(c)
# kiểm tra số thứ tự liên tục
prev = None
for r in recs:
    if prev and r["idx"] != prev["idx"] + 1 and r["idx"] != 1:
        print("GAP", prev["idx"], r["idx"], r["page"])
    prev = r
