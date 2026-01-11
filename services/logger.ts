import { LogEntry, ModeType } from '../types';
import { apiClient } from './apiClient';

class LoggerService {
  private logs: LogEntry[] = [];
  private pageEnterTime: number = 0;
  private userId: string = 'unknown';
  private currentMode: ModeType | null = null;
  private currentArtifactId: string | null = null;

  setUserId(id: string) {
    this.userId = id;
  }

  // Log mode selection
  logModeSelect(mode: ModeType) {
    const entry: LogEntry = {
      timestamp: Date.now(),
      userId: this.userId,
      eventType: 'mode_select',
      details: { mode }
    };
    this.logs.push(entry);
    console.log('[Logger] Mode Selected:', entry);
  }

  // Start timing a view
  startPageTimer(mode: ModeType | null = null, artifactId: string | null = null) {
    this.pageEnterTime = Date.now();
    this.currentMode = mode;
    this.currentArtifactId = artifactId;
  }

  // End timing and log duration
  logPageDwell(mode?: ModeType, artifactId?: string) {
    if (this.pageEnterTime === 0) return;
    
    const exitTime = Date.now();
    const duration = exitTime - this.pageEnterTime;
    
    // 使用传入的参数或存储的值
    const finalMode = mode || this.currentMode;
    const finalArtifactId = artifactId || this.currentArtifactId;
    
    const entry: LogEntry = {
      timestamp: exitTime,
      userId: this.userId,
      eventType: 'page_view',
      details: { 
        mode: finalMode,
        durationMs: duration
      }
    };
    this.logs.push(entry);
    console.log('[Logger] Page Dwell Time:', entry);
    
    // 发送到后端
    const participantId = sessionStorage.getItem('participantId');
    if (participantId) {
      apiClient.sendTimeRecord({
        participantId,
        mode: finalMode,
        artifactId: finalArtifactId,
        exitTime,
        durationMs: duration
      });
    }
    
    this.pageEnterTime = 0;
    this.currentMode = null;
    this.currentArtifactId = null;
  }

  // Log user submission
  logSubmission(mode: ModeType, inputType: 'text' | 'audio', content: string | Blob, blobUrl?: string) {
    const entry: LogEntry = {
      timestamp: Date.now(),
      userId: this.userId,
      eventType: 'submission',
      details: {
        mode,
        inputType,
        contentLength: inputType === 'text' && typeof content === 'string' ? content.length : undefined,
        blobUrl: blobUrl
      }
    };
    this.logs.push(entry);
    console.log('[Logger] User Submission:', entry);
  }

  // In a real app, this would flush to a server
  exportLogs() {
    return this.logs;
  }
}

export const logger = new LoggerService();