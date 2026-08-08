# TerminologyServer

多语言术语管理系统，支持术语的创建、查询、编辑、删除和关键字搜索。

## 快速开始

### 环境要求

- Python 3.12+
- Node.js 18+

### 后端

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run.py
```

后端运行在 `http://localhost:8000`，API 文档自动生成在 `http://localhost:8000/docs`。

### 前端

```bash
cd frontend
npm install
npm run dev
```

前端运行在 `http://localhost:5173`，打开浏览器即可使用。

## 功能

- 创建术语（支持多语言全称、简写、同义词）
- 分页列表（按领域、状态、语言筛选）
- 关键字搜索（搜索名称和定义）
- 编辑术语（增删改名称行）
- 删除术语

## 数据模型

一个术语（Term）是一个语言无关的概念实体，包含一个或多个名称（TermName）：

```
Term: domain="医学", status="approved"
  ├── TermName: zh / full_name  / "急性心肌梗死"
  ├── TermName: zh / abbreviation / "心梗"
  ├── TermName: en / full_name  / "acute myocardial infarction"
  └── TermName: en / abbreviation / "AMI"
```

每个名称由 `(language, name_type)` 唯一标识。

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/terms` | 创建术语 |
| `GET` | `/api/terms` | 获取术语列表（分页+筛选） |
| `GET` | `/api/terms/search?q=` | 关键字搜索 |
| `GET` | `/api/terms/{id}` | 获取术语详情 |
| `PUT` | `/api/terms/{id}` | 更新术语 |
| `DELETE` | `/api/terms/{id}` | 删除术语 |

### 使用示例

```bash
# 创建术语
curl -X POST http://localhost:8000/api/terms \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "医学",
    "status": "draft",
    "names": [
      {"language": "zh", "name_type": "full_name", "name": "急性心肌梗死", "definition": "因冠状动脉急性闭塞导致心肌缺血坏死的临床综合征"},
      {"language": "en", "name_type": "full_name", "name": "acute myocardial infarction", "definition": "Myocardial necrosis resulting from acute coronary artery occlusion"}
    ]
  }'

# 查询列表（支持筛选）
curl "http://localhost:8000/api/terms?domain=医学&status=draft&page=1&page_size=20"

# 关键字搜索
curl "http://localhost:8000/api/terms/search?q=心脏&language=zh"

# 更新术语
curl -X PUT http://localhost:8000/api/terms/1 \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "医学",
    "status": "approved",
    "names": [
      {"id": 1, "language": "zh", "name_type": "full_name", "name": "急性心肌梗死", "definition": "更新后的定义"}
    ]
  }'

# 删除术语
curl -X DELETE http://localhost:8000/api/terms/1
```

## 技术栈

- **后端**: Python / FastAPI / SQLAlchemy / SQLite
- **前端**: React / TypeScript / Ant Design / Vite

## 工程结构

```
TerminologyServer/
├── backend/
│   ├── app/
│   │   ├── main.py       # FastAPI 入口
│   │   ├── database.py   # 数据库连接
│   │   ├── models.py     # ORM 模型
│   │   ├── schemas.py    # 请求/响应校验
│   │   └── crud.py       # 数据库操作
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   └── src/
│       ├── api/terms.ts      # API 调用
│       ├── types/term.ts     # 类型定义
│       ├── components/       # 组件
│       └── pages/            # 页面
└── docs/
    ├── business-design.md
    └── technical-design.md
```
