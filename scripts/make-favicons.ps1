# One-off: rasterize the bold E! favicon design at all needed sizes + multi-size ICO.
Add-Type -AssemblyName System.Drawing

$pub = Join-Path $PSScriptRoot "..\public" | Resolve-Path

function New-Badge([int]$size, [bool]$rounded) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $s = $size / 64.0

  $wine = [System.Drawing.Color]::FromArgb(255, 0x74, 0x2F, 0x38)
  $cream = [System.Drawing.Color]::FromArgb(255, 0xFF, 0xFE, 0xF9)
  $gold = [System.Drawing.Color]::FromArgb(255, 0xDE, 0xC6, 0x90)
  $bWine = New-Object System.Drawing.SolidBrush($wine)
  $bCream = New-Object System.Drawing.SolidBrush($cream)
  $bGold = New-Object System.Drawing.SolidBrush($gold)

  if ($rounded) {
    $r = [float](14 * $s)
    $d = [float](2 * $r)
    $w = [float]$size
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc(0, 0, $d, $d, 180, 90)
    $path.AddArc($w - $d, 0, $d, $d, 270, 90)
    $path.AddArc($w - $d, $w - $d, $d, $d, 0, 90)
    $path.AddArc(0, $w - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    $g.FillPath($bWine, $path)
    $path.Dispose()
  } else {
    $g.FillRectangle($bWine, 0, 0, $size, $size)
  }

  $g.FillRectangle($bCream, [float](15*$s), [float](14*$s), [float](8*$s),  [float](36*$s))
  $g.FillRectangle($bCream, [float](15*$s), [float](14*$s), [float](25*$s), [float](8*$s))
  $g.FillRectangle($bCream, [float](15*$s), [float](28*$s), [float](21*$s), [float](8*$s))
  $g.FillRectangle($bCream, [float](15*$s), [float](42*$s), [float](25*$s), [float](8*$s))
  $g.FillRectangle($bGold,  [float](43*$s), [float](14*$s), [float](7*$s),  [float](22*$s))
  $g.FillRectangle($bGold,  [float](43*$s), [float](43*$s), [float](7*$s),  [float](7*$s))

  $g.Dispose(); $bWine.Dispose(); $bCream.Dispose(); $bGold.Dispose()
  return $bmp
}

function Save-Png([System.Drawing.Bitmap]$bmp, [string]$name) {
  $p = Join-Path $pub $name
  $bmp.Save($p, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Host "wrote $name ($($bmp.Width)px)"
}

foreach ($spec in @(@(32, 'favicon-32x32.png'), @(192, 'icon-192.png'), @(512, 'icon-512.png'))) {
  $bmp = New-Badge $spec[0] $true
  Save-Png $bmp $spec[1]
  $bmp.Dispose()
}

# Apple touch icon: full-bleed square, iOS rounds it itself
$apple = New-Badge 180 $false
Save-Png $apple 'apple-touch-icon.png'
$apple.Dispose()

# Multi-size ICO with PNG-compressed entries (16, 32, 48)
$entries = @()
foreach ($sz in @(16, 32, 48)) {
  $bmp = New-Badge $sz $true
  $ms = New-Object System.IO.MemoryStream
  $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
  $entries += ,@($sz, $ms.ToArray())
  $ms.Dispose(); $bmp.Dispose()
}

$icoPath = Join-Path $pub 'favicon.ico'
$fs = [System.IO.File]::Create($icoPath)
$bw = New-Object System.IO.BinaryWriter($fs)
$bw.Write([uint16]0); $bw.Write([uint16]1); $bw.Write([uint16]$entries.Count)
$offset = 6 + 16 * $entries.Count
foreach ($e in $entries) {
  $sz = $e[0]; $data = $e[1]
  $bw.Write([byte]($(if ($sz -ge 256) { 0 } else { $sz })))  # width
  $bw.Write([byte]($(if ($sz -ge 256) { 0 } else { $sz })))  # height
  $bw.Write([byte]0)      # palette
  $bw.Write([byte]0)      # reserved
  $bw.Write([uint16]1)    # planes
  $bw.Write([uint16]32)   # bpp
  $bw.Write([uint32]$data.Length)
  $bw.Write([uint32]$offset)
  $offset += $data.Length
}
foreach ($e in $entries) { $bw.Write($e[1]) }
$bw.Dispose(); $fs.Dispose()
Write-Host "wrote favicon.ico ($((Get-Item $icoPath).Length) bytes, 16+32+48)"
