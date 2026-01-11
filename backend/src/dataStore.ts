import fs from 'fs/promises';
import path from 'path';
import { ParticipantData, UGCContent, TimeRecord } from './types.js';

// 数据存储路径
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'participants.json');

// 内存中的数据缓存
let dataCache: Map<string, ParticipantData> = new Map();

/**
 * 数据存储服务
 * 使用JSON文件持久化数据
 */
class DataStore {
  
  /**
   * 初始化：创建数据目录，加载现有数据
   */
  async init(): Promise<void> {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      
      // 尝试加载现有数据
      try {
        const content = await fs.readFile(DATA_FILE, 'utf-8');
        const data: ParticipantData[] = JSON.parse(content);
        dataCache = new Map(data.map(d => [d.participantId, d]));
        console.log(`[DataStore] Loaded ${dataCache.size} participants from file`);
      } catch (err) {
        // 文件不存在，使用空数据
        console.log('[DataStore] No existing data file, starting fresh');
        await this.save();
      }
    } catch (err) {
      console.error('[DataStore] Initialization error:', err);
      throw err;
    }
  }

  /**
   * 保存数据到文件
   */
  private async save(): Promise<void> {
    const data = Array.from(dataCache.values());
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * 获取或创建参与者数据
   */
  private getOrCreateParticipant(participantId: string): ParticipantData {
    if (!dataCache.has(participantId)) {
      dataCache.set(participantId, {
        participantId,
        ugcContents: [],
        timeRecords: []
      });
    }
    return dataCache.get(participantId)!;
  }

  /**
   * 添加UGC内容
   */
  async addUGC(participantId: string, ugc: UGCContent): Promise<void> {
    const participant = this.getOrCreateParticipant(participantId);
    participant.ugcContents.push(ugc);
    await this.save();
    console.log(`[DataStore] Added UGC for ${participantId}: ${ugc.mode} - ${ugc.artifactId}`);
  }

  /**
   * 添加时间记录
   */
  async addTimeRecord(participantId: string, record: TimeRecord): Promise<void> {
    const participant = this.getOrCreateParticipant(participantId);
    participant.timeRecords.push(record);
    await this.save();
    console.log(`[DataStore] Added time record for ${participantId}: ${record.mode} - ${record.durationMs}ms`);
  }

  /**
   * 获取参与者的所有数据
   */
  getParticipantData(participantId: string): ParticipantData | null {
    return dataCache.get(participantId) || null;
  }

  /**
   * 获取所有参与者数据
   */
  getAllData(): ParticipantData[] {
    return Array.from(dataCache.values());
  }

  /**
   * 导出为CSV格式（用于科研分析）
   */
  exportToCSV(): { ugcCSV: string; timeCSV: string } {
    const allData = this.getAllData();
    
    // UGC CSV
    let ugcCSV = 'participantId,content,artifactId,mode,timestamp\n';
    for (const participant of allData) {
      for (const ugc of participant.ugcContents) {
        const content = ugc.content.replace(/"/g, '""'); // 转义引号
        ugcCSV += `"${participant.participantId}","${content}","${ugc.artifactId}","${ugc.mode}",${ugc.timestamp}\n`;
      }
    }
    
    // Time Records CSV
    let timeCSV = 'participantId,mode,artifactId,exitTime,durationMs,enterTime\n';
    for (const participant of allData) {
      for (const record of participant.timeRecords) {
        const enterTime = record.exitTime - record.durationMs;
        timeCSV += `"${participant.participantId}","${record.mode || ''}","${record.artifactId || ''}",${record.exitTime},${record.durationMs},${enterTime}\n`;
      }
    }
    
    return { ugcCSV, timeCSV };
  }
}

export const dataStore = new DataStore();
