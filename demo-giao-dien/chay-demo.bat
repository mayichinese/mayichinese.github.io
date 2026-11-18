@echo off
rem ============================================================
rem  Bam dup file nay de chay ban demo giao dien hoc HSK.
rem  - Bat may chu nho (Python) tren chinh may nay
rem  - Tu mo trinh duyet vao trang demo
rem  Muon tat demo: dong cua so den nay lai.
rem ============================================================
title Demo hoc HSK - dang chay (dong cua so nay de tat)

rem Chuyen vao thu muc chua file nay
cd /d "%~dp0"

rem --- Tim Python: uu tien lenh "py", neu khong co thi dung "python" ---
set "PY="
where py >nul 2>nul && set "PY=py"
if not defined PY (
  where python >nul 2>nul && set "PY=python"
)
if not defined PY (
  echo Khong tim thay Python tren may.
  echo Hay cai Python tai https://www.python.org/downloads/ roi bam dup lai file nay.
  pause
  exit /b 1
)

echo Dang khoi dong demo...
rem Doi 2 giay cho may chu san sang roi moi mo trinh duyet
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:8765/demo-giao-dien/'"

rem Chay may chu (cua so nay se dung o day cho den khi ban dong no)
%PY% "%~dp0may-chu.py"
