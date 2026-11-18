@echo off
REM Bam dup vao file nay de chay app Mayi Chinese tren may tinh.
REM Dong cua so den de tat app.
title Mayi Chinese - dang chay (dong cua so nay de tat)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0cong-cu\may-chu.ps1"
if errorlevel 1 pause
