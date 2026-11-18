import sys, pymupdf
doc = pymupdf.open(sys.argv[1])
out = open(sys.argv[2], "w", encoding="utf-8")
for i, p in enumerate(doc):
    out.write(f"\n=====PAGE {i+1}=====\n")
    out.write(p.get_text())
out.close()
print(len(doc))
