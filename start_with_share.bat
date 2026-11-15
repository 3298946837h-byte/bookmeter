@echo off
chcp 65001 >nul
title BookMeter - 全网书评与真实电子书聚合系统 (公网免代理分享)

echo ======================================================================
echo    正在启动 BookMeter 系统与 Cloudflare 免代理公网隧道...
echo ======================================================================
echo.

cd /d "%~dp0"

node scripts/share-runner.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [错误] share-runner 执行异常，退出代码: %ERRORLEVEL%
    pause
)

pause
