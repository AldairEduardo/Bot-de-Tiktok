@echo off
title Bot de voz del LIVE
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Falta instalar Node.js. Descargalo de https://nodejs.org ^(version LTS^), instalalo y vuelve a abrir este archivo.
  pause
  exit /b
)
if not exist node_modules (
  echo Instalando por primera vez, espera un momento...
  call npm install --no-audit --no-fund
)
start "" "http://localhost:3000/voz.html"
echo.
echo Bot de voz encendido. Para APAGARLO (y dejar de gastar saldo) cierra esta ventana o presiona Ctrl+C.
echo.
call npm start
pause
