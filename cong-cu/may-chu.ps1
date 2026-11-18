# =========================================================
# MÁY CHỦ MINI để chạy app trên máy tính Windows (không cần cài thêm gì).
# - Phục vụ các file trong thư mục "app" tại địa chỉ http://localhost:8080/
# - Tự mở trình duyệt.
# - Đóng cửa sổ đen này (hoặc bấm Ctrl+C) để tắt.
# Chỉ máy này truy cập được (localhost), máy khác trong mạng không vào được.
# =========================================================

param([switch]$KhongMoTrinhDuyet)  # dùng khi kiểm thử: không tự mở trình duyệt
$ErrorActionPreference = 'Stop'
$thuMucApp = Join-Path (Split-Path -Parent $PSScriptRoot) 'app'
$thuMucApp = [System.IO.Path]::GetFullPath($thuMucApp)

# Loại nội dung của từng đuôi file
$loaiFile = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.webmanifest' = 'application/manifest+json; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.ico'  = 'image/x-icon'
  '.txt'  = 'text/plain; charset=utf-8'
}

# Thử cổng 8080; nếu đã bị chương trình khác dùng thì thử 8081, 8082…
$listener = $null
foreach ($cong in 8080..8090) {
  try {
    $l = New-Object System.Net.HttpListener
    $l.Prefixes.Add("http://localhost:$cong/")
    $l.Start()
    $listener = $l
    break
  } catch {
    if ($l) { $l.Close() }
  }
}
if (-not $listener) {
  Write-Host 'Khong mo duoc may chu (cong 8080-8090 deu ban).' -ForegroundColor Red
  Read-Host 'Bam Enter de dong'
  exit 1
}

$diaChi = "http://localhost:$cong/"
Write-Host ''
Write-Host '  MAYI CHINESE dang chay tai: ' -NoNewline
Write-Host $diaChi -ForegroundColor Green
Write-Host '  (Dong cua so nay de tat app)'
Write-Host ''
if (-not $KhongMoTrinhDuyet) { Start-Process $diaChi }

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $res = $ctx.Response
  try {
    $duong = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
    if ($duong -eq '') { $duong = 'index.html' }
    $tep = [System.IO.Path]::GetFullPath((Join-Path $thuMucApp $duong))
    # Chặn truy cập ra ngoài thư mục app
    if (-not $tep.StartsWith($thuMucApp) -or -not (Test-Path $tep -PathType Leaf)) {
      $res.StatusCode = 404
      $bytes = [System.Text.Encoding]::UTF8.GetBytes('Khong tim thay')
    } else {
      $duoi = [System.IO.Path]::GetExtension($tep).ToLower()
      $res.ContentType = $(if ($loaiFile.ContainsKey($duoi)) { $loaiFile[$duoi] } else { 'application/octet-stream' })
      $res.Headers.Add('Cache-Control', 'no-cache')
      $bytes = [System.IO.File]::ReadAllBytes($tep)
    }
    $res.ContentLength64 = $bytes.Length
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
  } catch {
    $res.StatusCode = 500
  } finally {
    $res.OutputStream.Close()
  }
}
