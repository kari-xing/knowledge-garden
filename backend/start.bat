@echo off
rem ============================================================
rem  藤蔓 · 知识花园 - 后端一键启动（Windows）
rem  自动切 UTF-8 防乱码；自动建 venv / 装依赖（首次）
rem  默认端口 8011（8000 常被系统进程占用）
rem ============================================================
chcp 65001 >nul
cd /d "%~dp0"

if not exist .venv\Scripts\python.exe (
    echo [1/3] 创建虚拟环境...
    py -3 -m venv --without-pip .venv
    .venv\Scripts\python.exe -m ensurepip --upgrade
)

if not exist .venv\Lib\site-packages\fastapi (
    echo [2/3] 安装依赖（首次需要几分钟）...
    set PYTHONUTF8=1
    .venv\Scripts\python.exe -m pip install -r requirements.txt
)

echo [3/3] 启动后端: http://localhost:8011/docs
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8011

pause
