import { LogEntry, ModeType } from '../types';

class LoggerService {
  private logs: LogEntry[] = [];
  private pageEnterTime: number = 0;

  // Log mode selection
  logModeSelect(mode: ModeType) {
    const entry: LogEntry = {
      timestamp: Date.now(),
      eventType: 'mode_select',
      details: { mode }
    };
    this.logs.push(entry);
    console.log('[Logger] Mode Selected:', entry);
  }

  // Start timing a view
  startPageTimer() {
    this.pageEnterTime = Date.now();
  }

  // End timing and log duration
  logPageDwell(mode: ModeType) {
    if (this.pageEnterTime === 0) return;
    
    const duration = Date.now() - this.pageEnterTime;
    const entry: LogEntry = {
      timestamp: Date.now(),
      eventType: 'page_view',
      details: { 
        mode,
        durationMs: duration
      }
    };
    this.logs.push(entry);
    console.log('[Logger] Page Dwell Time:', entry);
    this.pageEnterTime = 0;
  }

  // Log user submission
  logSubmission(mode: ModeType, inputType: 'text' | 'audio', content: string | Blob, blobUrl?: string) {
    const entry: LogEntry = {
      timestamp: Date.now(),
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