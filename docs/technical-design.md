# 技术设计文档

## 一、技术栈

| 层 | 技术 |
|----|------|
| 后端框架 | Python 3.12+ / FastAPI |
| ORM | SQLAlchemy 2.0 |
| 数据校验 | Pydantic v2 |
| 数据库 | SQLite（后续可迁移至 PostgreSQL） |
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite |
| UI 组件库 | Ant Design 5 |
| HTTP 客户端 | axios（前端调用后端） |

## 二、工程结构

```
TerminologyServer/
├── docs/
│   ├── business-design.md    # 业务设计文档
│   └── technical-design.md   # 技术设计文档（本文件）
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py           # FastAPI 入口，路由注册，CORS 配置
│   │   ├── database.py       # 数据库连接、会话、建表
│   │   ├── models.py         # SQLAlchemy ORM 模型
│   │   ├── schemas.py        # Pydantic 请求/响应模型
│   │   └── crud.py           # 数据库增删改查操作
│   ├── requirements.txt
│   └── run.py                # uvicorn 启动脚本
├── frontend/
│   ├── src/
│   │   ├── main.tsx          # React 入口
│   │   ├── App.tsx           # 根组件 + 路由
│   │   ├── api/
│   │   │   └── terms.ts      # 术语 API 调用封装
│   │   ├── types/
│   │   │   └── term.ts       # TypeScript 类型定义
│   │   ├── components/
│   │   │   ├── TermTable.tsx  # 术语列表表格
│   │   │   └── TermModal.tsx  # 新建/编辑弹窗
│   │   └── pages/
│   │       └── TermListPage.tsx  # 术语列表页面（搜索+筛选+表格）
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── .gitignore
├── LICENSE
└── README.md
```

## 三、数据库设计

### 3.1 表结构

```sql
-- 术语概念表
CREATE TABLE term (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    domain     VARCHAR(100)  NOT NULL,
    status     VARCHAR(20)   NOT NULL DEFAULT 'draft',  -- draft / approved / deprecated
    created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 术语名称表
CREATE TABLE term_name (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    term_id    INTEGER       NOT NULL,
    language   VARCHAR(10)   NOT NULL,
    name_type  VARCHAR(20)   NOT NULL,  -- full_name / abbreviation / synonym
    name       VARCHAR(500)  NOT NULL,
    definition TEXT,
    FOREIGN KEY (term_id) REFERENCES term(id) ON DELETE CASCADE,
    UNIQUE (term_id, language, name_type)
);

CREATE INDEX idx_term_name_term_id ON term_name(term_id);
CREATE INDEX idx_term_name_language ON term_name(language);
CREATE INDEX idx_term_domain ON term(domain);
CREATE INDEX idx_term_status ON term(status);
```

### 3.2 ER 关系

```
┌──────────┐       ┌───────────┐
│   term   │ 1──n │ term_name │
│          │      │           │
│ id       │◄─────│ term_id   │
│ domain   │      │ language  │
│ status   │      │ name_type │
│ created  │      │ name      │
│ updated  │      │ definition│
└──────────┘      └───────────┘
```

## 四、API 设计

Base URL: `http://localhost:8000/api`

### 4.1 端点列表

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/terms | 创建术语 |
| GET | /api/terms | 获取术语列表（分页+筛选） |
| GET | /api/terms/{id} | 获取术语详情 |
| PUT | /api/terms/{id} | 更新术语 |
| DELETE | /api/terms/{id} | 删除术语 |
| GET | /api/terms/search | 关键字搜索 |

### 4.2 请求/响应格式

#### POST /api/terms — 创建术语

**Request:**
```json
{
  "domain": "医学",
  "status": "draft",
  "names": [
    {
      "language": "zh",
      "name_type": "full_name",
      "name": "急性心肌梗死",
      "definition": "因冠状动脉急性闭塞导致..."
    },
    {
      "language": "en",
      "name_type": "abbreviation",
      "name": "AMI",
      "definition": null
    }
  ]
}
```

**Response** (201):
```json
{
  "id": 1,
  "domain": "医学",
  "status": "draft",
  "names": [
    { "id": 1, "language": "zh", "name_type": "full_name", "name": "急性心肌梗死", "definition": "..." },
    { "id": 2, "language": "en", "name_type": "abbreviation", "name": "AMI", "definition": null }
  ],
  "created_at": "2026-08-07T12:00:00",
  "updated_at": "2026-08-07T12:00:00"
}
```

#### GET /api/terms — 列表查询

**Query Parameters:**
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| page_size | int | 20 | 每页条数（最大 100） |
| domain | string | - | 按领域筛选 |
| status | string | - | 按状态筛选 |
| language | string | - | 按语言筛选（匹配 term_name.language） |

**Response:**
```json
{
  "total": 100,
  "page": 1,
  "page_size": 20,
  "items": [ { "id": 1, "domain": "医学", ... }, ... ]
}
```

#### PUT /api/terms/{id} — 更新术语

**Request:**
```json
{
  "domain": "医学",
  "status": "approved",
  "names": [
    { "id": 1, "language": "zh", "name_type": "full_name", "name": "急性心肌梗死", "definition": "..." },
    { "language": "ja", "name_type": "full_name", "name": "急性心筋梗塞", "definition": "..." }
  ]
}
```

规则：names 列表中已有 `id` 的更新，无 `id` 的新增，不在列表中的已有名称被删除。

#### GET /api/terms/search — 搜索

**Query Parameters:**
| 参数 | 类型 | 说明 |
|------|------|------|
| q | string | 搜索关键词 |
| language | string | 限定语言（可选） |

在 term_name.name 和 term_name.definition 中进行模糊匹配（LIKE %q%）。

## 五、前端路由

| 路径 | 页面 | 说明 |
|------|------|------|
| / | TermListPage | 术语列表，含搜索栏、筛选器、分页表格 |

### 前端组件树

```
App
 └── TermListPage
      ├── SearchBar (Ant Design Input.Search)
      ├── FilterBar (Ant Design Select x3: domain, status, language)
      ├── TermTable (Ant Design Table)
      │    └── 每行操作：编辑按钮 / 删除按钮
      └── TermModal (Ant Design Modal + Form)
           └── 动态名称行（Form.List）
```

## 六、开发环境配置

### 环境要求

- Python 3.12+
- Node.js 18+

### 后端

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run.py  # http://localhost:8000
```

启动后访问 `http://localhost:8000/docs` 查看 Swagger 自动生成的 API 文档。

### 前端

```bash
cd frontend
npm install
npm run dev  # http://localhost:5173
```

前端开发服务器通过 Vite proxy 将 `/api` 请求代理到 `http://localhost:8000`。

## 七、API 使用说明

### 创建术语

```bash
curl -X POST http://localhost:8000/api/terms \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "医学",
    "status": "draft",
    "names": [
      {
        "language": "zh",
        "name_type": "full_name",
        "name": "急性心肌梗死",
        "definition": "因冠状动脉急性闭塞导致心肌缺血坏死的临床综合征"
      },
      {
        "language": "zh",
        "name_type": "abbreviation",
        "name": "心梗",
        "definition": null
      },
      {
        "language": "en",
        "name_type": "full_name",
        "name": "acute myocardial infarction",
        "definition": "Myocardial necrosis resulting from acute coronary artery occlusion"
      },
      {
        "language": "en",
        "name_type": "abbreviation",
        "name": "AMI",
        "definition": null
      }
    ]
  }'
```

**约束：**
- `names` 至少包含 1 个名称（前端和 API 均校验）
- 同一术语内 `(language, name_type)` 组合必须唯一（数据库 UNIQUE 约束）
- `domain` 为必填；`status` 默认为 `"draft"`
- `status` 可选值：`draft` / `approved` / `deprecated`
- `name_type` 可选值：`full_name` / `abbreviation` / `synonym`

### 查询术语列表

```bash
# 全部术语（分页）
curl "http://localhost:8000/api/terms?page=1&page_size=20"

# 按领域筛选
curl "http://localhost:8000/api/terms?domain=医学"

# 按状态筛选
curl "http://localhost:8000/api/terms?status=draft"

# 按语言筛选（匹配 term_name.language）
curl "http://localhost:8000/api/terms?language=zh"

# 组合筛选
curl "http://localhost:8000/api/terms?domain=医学&status=approved&language=zh"
```

### 关键字搜索

```bash
# 全文搜索名称和定义
curl "http://localhost:8000/api/terms/search?q=心脏"

# 按语言限定搜索范围
curl "http://localhost:8000/api/terms/search?q=heart&language=en"
```

搜索在 `term_name.name` 和 `term_name.definition` 中进行不区分大小写的模糊匹配。

### 获取术语详情

```bash
curl "http://localhost:8000/api/terms/1"
```

### 更新术语

```bash
curl -X PUT http://localhost:8000/api/terms/1 \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "医学",
    "status": "approved",
    "names": [
      {
        "id": 1,
        "language": "zh",
        "name_type": "full_name",
        "name": "急性心肌梗死",
        "definition": "更新后的定义"
      },
      {
        "language": "ja",
        "name_type": "full_name",
        "name": "急性心筋梗塞",
        "definition": null
      }
    ]
  }'
```

**更新规则：**
- `names` 中已有 `id` 的条目 → 更新对应名称
- `names` 中无 `id` 的条目 → 新增名称
- 已在数据库中但不在 `names` 中的条目 → 删除

### 删除术语

```bash
curl -X DELETE http://localhost:8000/api/terms/1
```

返回 204 No Content。级联删除关联的所有 TermName。

### 错误响应

| 状态码 | 场景 |
|--------|------|
| 201 | 创建成功 |
| 204 | 删除成功 |
| 400 | 请求参数错误（如外键名称 ID） |
| 404 | 术语不存在 |
| 422 | 数据校验失败（如重复名称、无效枚举值） |

## 八、前端使用说明

### 页面布局

打开 `http://localhost:5173` 后进入术语列表页：

```
┌──────────────────────────────────────────────┐
│  术语管理系统                                  │
│                                              │
│  [🔍 搜索名称或定义]  [领域▼] [状态▼] [语言▼]  [+ 新建术语] │
│                                              │
│  ┌────┬────┬──────┬──────────────────┬──────┐│
│  │ ID │ 领域│ 状态  │ 名称              │ 操作  ││
│  ├────┼────┼──────┼──────────────────┼──────┤│
│  │ 1  │ 医学│ 已审核│ zh 全称 急性心肌梗死 │ 编辑  ││
│  │    │    │      │ zh 简写 心梗        │ 删除  ││
│  │    │    │      │ en 全称 AMI         │      ││
│  └────┴────┴──────┴──────────────────┴──────┘│
│                        < 1 2 3 ... 10 >      │
└──────────────────────────────────────────────┘
```

### 操作流程

**新建术语：**
1. 点击「新建术语」按钮
2. 填写领域（如 医学、IT、法律）
3. 选择状态（草稿 / 已审核 / 已废弃）
4. 添加至少一个名称行：选择语言、类型、输入名称文本和定义
5. 可点击「添加名称」增加更多语言/类型
6. 点击确定提交

**编辑术语：**
1. 在表格中点击目标行的「编辑」按钮
2. 弹窗预填当前数据
3. 修改领域、状态或名称行
4. 可增删名称行
5. 点击确定保存

**搜索术语：**
1. 在搜索框输入关键词
2. 按回车或点击搜索图标
3. 支持按语言限定搜索范围
4. 清空搜索框可退出搜索模式

**筛选术语：**
- 领域：从下拉框选择（医学 / IT / 法律 / 金融）
- 状态：草稿 / 已审核 / 已废弃
- 语言：中文 / English / 日本語 / 한국어
- 筛选条件可组合使用（搜索模式下仅语言筛选生效）

**删除术语：**
1. 点击目标行的「删除」按钮
2. 在弹出的确认框中点击确定
3. 术语及其所有名称将被永久删除
