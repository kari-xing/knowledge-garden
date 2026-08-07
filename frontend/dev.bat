@echo off
rem ============================================================
rem  藤蔓 · 知识花园 - 前端一键启动（Windows）
rem  自动切换控制台为 UTF-8（chcp 65001），解决中文乱码
rem ============================================================
chcp 65001 >nul
cd /d "%~dp0"

if not exist node_modules (
    echo [1/2] 首次运行，正在安装依赖...
    call npm install --no-audit --no-fund
)

echo [2/2] 启动前端开发服务器: http://localhost:5173
echo       按 Ctrl+C 可停止。
call npm run dev

pause
