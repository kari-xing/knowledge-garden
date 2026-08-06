# -_-
融合笔记管理 + AI 智能处理 + 知识图谱可视化的个人知识操作系统。把知识"种"进去，AI 帮你浇水施肥——自动打标签、推荐关联、构建知识网络，让知识像花园一样自然生长。
# 🌿 藤蔓 · 知识花园

> 融合笔记管理 + AI 智能处理 + 知识图谱可视化的个人知识操作系统。
> 你把知识"种"进去，AI 帮你浇水施肥——自动打标签、推荐关联、构建知识网络，让知识像花园一样自然生长。

[技术栈](#-技术栈) · [功能特性](#-功能特性) · [快速开始](#-快速开始) · [核心概念](#-核心概念) · [项目结构](#-项目结构) · [API 概览](#-api-概览) · [路线图](#-开发路线图)

---

## ✨ 功能特性

| 特性 | 说明 |
|---|---|
| 🔗 **自动知识关联** | 新笔记写入后自动与已有知识建立语义关联，AI 生成"为什么有关联"的一句话理由 |
| 🕸️ **动态知识图谱** | D3.js 力导向图实时呈现隐性知识网络，支持拖拽、缩放、路径探索 |
| 🌱 **知识生命周期** | `种子 → 生长 → 成熟 → 枯萎` 游戏化机制，配合间隔重复复习，有效提升知识留存 |
| 🤖 **AI 自动化流水线** | 保存即触发：自动生成标题建议、3-5 个标签、一句话摘要、相似笔记推荐 |
| 🔍 **混合检索** | PostgreSQL 全文检索 + ChromaDB 向量检索的 RRF 融合，关键词与自然语言提问都能找 |
| 📄 **多格式导入** | PDF（pdfplumber）、Markdown、纯文本批量导入，导入后自动进入 AI 处理流水线 |
| 🏡 **花园首页看板** | 今日种子 🌱、即将枯萎 🥀、推荐复习、花园统计、最新关联 一站式呈现 |
| ⚡ **快速捕获** | 全局快捷键 `Ctrl+Shift+K` 随时唤起，想法零成本沉淀 |

---

## 🛠 技术栈

**前端**：React 18 · TypeScript · Vite · Tailwind CSS · D3.js（d3-force） · TipTap · Zustand · TanStack Query

**后端**：FastAPI · asyncio · asyncpg · Pydantic v2 · ARQ（异步任务队列）

**数据与 AI**：PostgreSQL 16 · ChromaDB · Redis · Ollama（本地 LLM，支持 OpenAI 兼容 API 切换）

**部署**：Docker Compose 一键启动

---

## 🚀 快速开始

### 方式一：Docker Compose（推荐）

```bash
# 1. 克隆/进入项目根目录
cd 藤蔓·知识花园

# 2. 启动全部服务（前端 + 后端 + 数据库 + AI）
docker compose up -d

# 3. 访问
#    前端   http://localhost
#    后端   http://localhost:8000/docs   （FastAPI 自动生成的 API 文档）
```

> 首次使用需先安装本地 LLM 模型：`ollama pull qwen2.5:7b && ollama pull bge-m3`

### 方式二：本地开发

```bash
# 后端
cd backend
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 前端
cd frontend
npm install
npm run dev
```

### 环境要求

| 服务 | 要求 |
|---|---|
| Node.js | ≥ 18 |
| Python | ≥ 3.11 |
| PostgreSQL | ≥ 15（16 推荐） |
| Ollama | ≥ 0.3（可选，AI 功能必需） |

---

## 🌱 核心概念

### 知识生命周期

```
     AI 流水线完成          累计复习 ≥ 3 次
seed ────────────────► growing ──────────────► mature
  ▲                       │                        │
  │  复习后恢复            │ 超过 30 天未复习        │ 超过 30 天未复习
  └───────────────────────▼────────────────────────▼
                      wilted（枯萎，可复习复活）
```

| 状态 | 含义 | 图谱表现 |
|---|---|---|
| seed | 刚创建，AI 处理中 | 琥珀色发光动画 |
| growing | 处理完成，持续生长 | 绿色 |
| mature | 已复习 ≥ 3 次，知识成熟 | 蓝色 |
| wilted | 30 天未复习，即将遗忘 | 灰色半透明 |

### 间隔重复复习（艾宾浩斯变体）

复习按 `1 → 3 → 7 → 15 → 30` 天间隔推进，点击"已复习"即自动进入下一阶段；评价"模糊"则回退一档。超过 30 天未复习的笔记会"枯萎"并进入首页提醒。

### AI 处理流水线

```
保存笔记 → ①生成标签(3-5个) → ②生成一句话摘要 → ③生成向量存入 ChromaDB
        → ④检索最相似 5 篇 → ⑤AI 生成关联理由 → ⑥更新知识图谱
```

整个流程**异步执行**（不阻塞保存），任一步失败自动重试 3 次，仍失败可手动"重新处理"。

---

## 📁 项目结构

```
├── frontend/                 # React 前端
│   └── src/
│       ├── api/              # 接口封装
│       ├── components/       # 编辑器 / 图谱画布 / 看板组件
│       ├── pages/            # 花园首页 / 笔记 / 图谱 / 搜索 / 标签 / 设置
│       └── stores/           # zustand 状态
├── backend/                  # FastAPI 后端
│   └── app/
│       ├── routers/          # notes / graph / search / garden / auth...
│       ├── services/         # ai_pipeline / review / import...
│       └── models/           # SQLAlchemy 模型
├── docker-compose.yml        # 一键部署
└── docs/
    ├── 需求.md               # 原始需求 v1.0
    └── 需求-详细设计.md       # 详细需求与设计方案 v2.0
```

---

## 📡 API 概览

Base URL：`/api/v1` · 鉴权：`Authorization: Bearer <JWT>`

| 模块 | 接口 |
|---|---|
| 认证 | `POST /api/auth/register` · `POST /api/auth/login` |
| 笔记 | `GET/POST /api/notes` · `GET/PUT/DELETE /api/notes/{id}` · `POST /api/notes/{id}/review` |
| 检索 | `GET /api/search`（全文 + 向量 + 标签/时间筛选） |
| 图谱 | `GET /api/graph/nodes` · `/api/graph/links` · `/api/graph/path` |
| 花园 | `GET /api/garden/dashboard` · `/api/garden/seeds` · `/api/garden/wilting` · `/api/garden/review-today` |
| 标签 | `GET /api/tags` · `PUT/DELETE /api/tags/{id}` |
| 导入 | `POST /api/import/pdf` · `POST /api/import/text` |

完整契约见 [《需求-详细设计.md》§7](需求-详细设计.md)。

---

## 🗺 开发路线图

| 周次 | 里程碑 |
|---|---|
| 第 1 周 | 环境搭建 + 笔记 CRUD + AI 流水线（标签/摘要/嵌入） |
| 第 2 周 | 关联推荐 + RRF 混合检索 + 前端框架 |
| 第 3 周 | 花园看板 + 复习流 + 定时任务 + 知识图谱可视化 |
| 第 4 周 | 搜索/设置打磨 + 测试 + Docker 部署 + 文档 |

---

## 📚 文档

- [《需求.md》](需求.md) —— 原始需求（快速浏览）
- [《需求-详细设计.md》](需求-详细设计.md) —— 完整需求与设计方案：功能模块、数据模型、算法、API 契约、验收标准

---

## 📄 License

MIT License — 个人学习与二次开发友好。

