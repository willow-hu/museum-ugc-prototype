基于您的项目代码分析，我为您规划一个适合科研实验数据收集的后端架构方案：

## 📊 **数据收集需求分析**

### 当前前端已有的数据埋点：
查看了您的 logger.ts 和 sessionStore.ts，已经有较好的本地记录基础：
- ✅ 模式选择记录（`mode_select`）
- ✅ 页面停留时长（`page_view`）
- ✅ 用户提交记录（`submission`）- 包含输入类型、内容长度、语音blob URL

---

## 🏗️ **后端架构建议**

### **技术栈推荐**
```
后端框架：Node.js + Express / Fastify（轻量快速）
数据库：PostgreSQL + MongoDB 组合
  - PostgreSQL：结构化数据（用户行为、时间序列）
  - MongoDB：非结构化UGC内容、日志
文件存储：MinIO / AWS S3（语音文件）
```

**理由**：
- Node.js 与前端 TypeScript 技术栈一致，类型共享方便
- PostgreSQL 适合时序分析和关系查询
- MongoDB 灵活存储各种格式的UGC

---

## 📦 **数据模型设计（精简版）**

### **数据结构（按参与者编号组织）**
```typescript
{
  participantId: string,       // 参与者编号（最外层）
  ugcContents: UGCContent[],   // UGC内容列表
  timeRecords: TimeRecord[]    // 时间记录列表
}
```

### **1. UGC内容**
```typescript
interface UGCContent {
  content: string,             // 内容（文本或"[语音]"标记）
  artifactId: string,          // 对应文物ID
  mode: ModeType,              // 对应模式
  timestamp: number            // 提交时间戳
}
```

### **2. 时间记录**
```typescript
interface TimeRecord {
  mode: ModeType | null,       // 对应模式（null表示主页）
  artifactId: string | null,   // 对应文物ID（null表示列表页/Tour模式）
  exitTime: number,            // 退出时间戳
  durationMs: number           // 停留时长（毫秒）
  // 进入时间 = exitTime - durationMs
}
```

---

## 🔄 **现有数据映射关系**

### **sessionStore.ts → ugcContents**
```typescript
// Comment Board 的 ContentItem
sessionStore.getComments(artifactId) 
→ { content: item.content, artifactId, mode: 'comment_board', timestamp }

// Crowd Chat 的 ContentItem
sessionStore.getChatMessages(artifactId)
→ { content: item.content, artifactId, mode: 'crowd_chat', timestamp }

// Follow Me / Collective Story 的用户回复
NarrativeState.history 中 type='user_text' 的消息
→ { content: msg.content, artifactId: msg.artifact.id, mode, timestamp }
```

### **logger.ts → timeRecords**
```typescript
// 已经在记录，只需要调整
logPageDwell(mode, artifactId?) 
→ { mode, artifactId, exitTime: Date.now(), durationMs }
```

### **需要调整的地方**
1. ✅ **UGC数据**：sessionStore已完整，直接用
2. ✅ **时间记录**：logger.ts已经在记录时长，只需要：
   - 添加 artifactId 参数（现在只有mode）
   - 记录退出时刻（exitTime = Date.now()）
   - 删除不需要的 mode_select 和 submission 事件
3. ⚠️ **数据发送**：退出页面时发送到后端

---

## 🔌 **API端点设计**

```
POST   /api/data/ugc          # 提交UGC内容
       Body: { participantId, content, artifactId, mode, timestamp }

POST   /api/data/time         # 提交时间记录
       Body: { participantId, action, mode, artifactId, timestamp }

GET    /api/data/:participantId    # 获取参与者所有数据
       Response: { participantId, ugcContents[], timeRecords[] }

GET    /api/data/export/all        # 导出所有数据（CSV/JSON）
```
