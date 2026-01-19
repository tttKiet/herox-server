@echo off
setlocal enabledelayedexpansion
title Herox LAN Launcher
cd /d "%~dp0"

echo ======================================================
echo        KHOI DONG HEROX (CHE DO LAN/WIFI)
echo ======================================================

echo [1/3] Dang do tim dia chi IP cua may...
set IP_ADDRESS=
for /f "tokens=*" %%a in ('powershell -command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike '*Loopback*' -and $_.InterfaceAlias -notlike '*vEthernet*' -and $_.InterfaceAlias -notlike '*Docker*'} | Select-Object -First 1 -ExpandProperty IPAddress"') do (
    set IP_ADDRESS=%%a
)

if "%IP_ADDRESS%"=="" (
    set IP_ADDRESS=localhost
    echo [!] Khong tim thay IP LAN, se chay bang localhost.
) else (
    echo [OK] Da tim thay IP LAN: %IP_ADDRESS%
)

echo.
echo [2/3] Dang khoi dong Containers...
docker-compose up -d

if %errorlevel% neq 0 (
    color 4
    echo [LOI] Docker chua bat hoac chua cai dat!
    pause
    exit
)

echo.
echo [3/3] Doi server khoi dong (5s)...
timeout /t 5 >nul

echo ======================================================
echo    THANH CONG!
echo    - Truy cap tren may nay: http://%IP_ADDRESS%:4454
echo    - Cac may khac trong mang cung vao dia chi tren.
echo ======================================================

start http://%IP_ADDRESS%:4454

timeout /t 10