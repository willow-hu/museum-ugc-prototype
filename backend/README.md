# Museum UGC Backend

科研实验数据收集后端服务

## 功能

- 收集用户UGC内容（按参与者编号组织）
- 记录用户浏览时间（进入/退出时间戳 + 时长）
- 数据导出（JSON/CSV格式）

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

服务器将运行在 `http://localhost:3001`

### 3. 生产环境

```bash
npm run build
npm start
```

## API 端点

### POST /api/data/ugc
提交UGC内容

**请求体：**
```json
{
  "participantId": "P001",
  "content": "这件文物真美",
  "artifactId": "A1",
  "mode": "comment_board",
  "timestamp": 1641900000000
}
```

### POST /api/data/time
提交时间记录

**请求体：**
```json
{
  "participantId": "P001",
  "mode": "comment_board",
  "artifactId": "A1",
  "exitTime": 1641900150000,
  "durationMs": 150000
}
```

### GET /api/data/:participantId
获取参与者数据

**响应：**
```json
{
  "participantId": "P001",
  "ugcContents": [...],
  "timeRecords": [...]
}
```

### GET /api/data/export/all?format=json|csv
导出所有数据

- `format=json`（默认）：返回JSON格式
- `format=csv`：返回CSV格式

## 数据存储

数据保存在 `backend/data/participants.json` 文件中

## 技术栈

- **Runtime**: Node.js
- **Framework**: Express
- **Language**: TypeScript
- **Storage**: JSON文件（可扩展为MongoDB/PostgreSQL）
