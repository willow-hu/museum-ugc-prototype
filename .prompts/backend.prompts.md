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

## 📦 **数据模型设计**

### **1. 用户会话表（Sessions）**
```typescript
{
  sessionId: string,           // 唯一会话ID
  userId?: string,             // 可选真实用户ID
  startTime: timestamp,
  endTime: timestamp,
  device: {                    // 设备信息
    userAgent: string,
    screenSize: string,
    platform: string
  }
}
```

### **2. UGC内容表（UserContents）**
```typescript
{
  id: string,
  sessionId: string,
  artifactId: string,
  mode: ModeType,
  inputType: 'text' | 'audio',
  content: string,             // 文本内容
  audioUrl?: string,           // 语音文件URL
  contentLength: number,
  timestamp: timestamp,
  context: {                   // 上下文
    replyToTopic?: string,     // 回复的话题（Chat模式）
    viewDuration: number       // 提交前的浏览时长
  }
}
```

### **3. 行为事件表（BehaviorEvents）**
```typescript
{
  id: string,
  sessionId: string,
  eventType: 'mode_select' | 'page_view' | 'artifact_select' | 
             'back_button' | 'input_open' | 'input_cancel' | 
             'tour_start' | 'tour_complete' | 'lock_trigger',
  timestamp: timestamp,
  details: {
    mode?: ModeType,
    artifactId?: string,
    fromView?: string,
    toView?: string,
    durationMs?: number,
    wasLocked?: boolean        // 是否因锁定功能被阻止
  }
}
```

### **4. 页面停留表（PageDwells）**
```typescript
{
  id: string,
  sessionId: string,
  view: 'HOME' | 'ARTIFACT_LIST' | 'CONTENT_VIEW',
  mode?: ModeType,
  artifactId?: string,
  enterTime: timestamp,
  exitTime: timestamp,
  durationMs: number,
  scrollDepth?: number,        // 滚动深度百分比
  interactionCount: number     // 交互次数
}
```

---

## 🔌 **API端点设计**

```
POST   /api/session/start          # 创建会话
POST   /api/session/end            # 结束会话
POST   /api/events                 # 批量上报行为事件
POST   /api/ugc                    # 提交UGC内容
POST   /api/ugc/audio              # 上传语音文件
GET    /api/data/export/:sessionId # 导出单个会话数据（科研用）
```
