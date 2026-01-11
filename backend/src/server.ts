import express, { Request, Response } from 'express';
import cors from 'cors';
import { dataStore } from './dataStore.js';
import { UGCContent, TimeRecord } from './types.js';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors()); // 允许跨域请求
app.use(express.json());

// 请求日志中间件
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * POST /api/data/ugc
 * 提交UGC内容
 */
app.post('/api/data/ugc', async (req: Request, res: Response) => {
  try {
    const { participantId, content, artifactId, mode, timestamp } = req.body;
    
    // 验证必填字段
    if (!participantId || !content || !artifactId || !mode || !timestamp) {
      return res.status(400).json({ 
        error: 'Missing required fields: participantId, content, artifactId, mode, timestamp' 
      });
    }

    const ugc: UGCContent = { content, artifactId, mode, timestamp };
    await dataStore.addUGC(participantId, ugc);
    
    res.status(201).json({ 
      success: true, 
      message: 'UGC content added successfully' 
    });
  } catch (err) {
    console.error('[API] Error adding UGC:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/data/time
 * 提交时间记录
 */
app.post('/api/data/time', async (req: Request, res: Response) => {
  try {
    const { participantId, mode, artifactId, exitTime, durationMs } = req.body;
    
    // 验证必填字段
    if (!participantId || exitTime === undefined || durationMs === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: participantId, exitTime, durationMs' 
      });
    }

    const record: TimeRecord = { 
      mode: mode || null, 
      artifactId: artifactId || null, 
      exitTime, 
      durationMs 
    };
    await dataStore.addTimeRecord(participantId, record);
    
    res.status(201).json({ 
      success: true, 
      message: 'Time record added successfully' 
    });
  } catch (err) {
    console.error('[API] Error adding time record:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/data/:participantId
 * 获取单个参与者的所有数据
 */
app.get('/api/data/:participantId', (req: Request, res: Response) => {
  try {
    const { participantId } = req.params;
    const data = dataStore.getParticipantData(participantId);
    
    if (!data) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    
    res.json(data);
  } catch (err) {
    console.error('[API] Error getting participant data:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/data/export/all
 * 导出所有数据（支持JSON和CSV格式）
 */
app.get('/api/data/export/all', (req: Request, res: Response) => {
  try {
    const format = req.query.format || 'json';
    
    if (format === 'csv') {
      const { ugcCSV, timeCSV } = dataStore.exportToCSV();
      
      // 返回压缩包或分别返回两个CSV
      // 这里简化处理，返回合并的CSV
      const combinedCSV = `=== UGC Contents ===\n${ugcCSV}\n\n=== Time Records ===\n${timeCSV}`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="experiment_data.csv"');
      res.send(combinedCSV);
    } else {
      // JSON格式
      const allData = dataStore.getAllData();
      res.json({
        totalParticipants: allData.length,
        data: allData
      });
    }
  } catch (err) {
    console.error('[API] Error exporting data:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/health
 * 健康检查
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: Date.now(),
    participants: dataStore.getAllData().length
  });
});

/**
 * 启动服务器
 */
async function startServer() {
  try {
    // 初始化数据存储
    await dataStore.init();
    
    // 启动HTTP服务器
    app.listen(PORT, () => {
      console.log('=================================');
      console.log('🚀 Museum UGC Backend Server');
      console.log(`📡 Server running on http://localhost:${PORT}`);
      console.log(`📊 API endpoints:`);
      console.log(`   POST /api/data/ugc`);
      console.log(`   POST /api/data/time`);
      console.log(`   GET  /api/data/:participantId`);
      console.log(`   GET  /api/data/export/all?format=json|csv`);
      console.log('=================================');
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// 启动
startServer();
