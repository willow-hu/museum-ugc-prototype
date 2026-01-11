/**
 * API Client for Backend Communication
 * 调用后端API发送数据
 */

const API_BASE_URL = 'http://localhost:3001/api';

interface UGCPayload {
  participantId: string;
  content: string;
  artifactId: string;
  mode: string;
  timestamp: number;
}

interface TimeRecordPayload {
  participantId: string;
  mode: string | null;
  artifactId: string | null;
  exitTime: number;
  durationMs: number;
}

class ApiClient {
  /**
   * 发送UGC内容到后端
   */
  async sendUGC(payload: UGCPayload): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/data/ugc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('[API] UGC sent successfully:', payload);
    } catch (error) {
      console.error('[API] Failed to send UGC:', error);
      // 不抛出错误，避免影响用户体验
    }
  }

  /**
   * 发送时间记录到后端
   */
  async sendTimeRecord(payload: TimeRecordPayload): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/data/time`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('[API] Time record sent successfully:', payload);
    } catch (error) {
      console.error('[API] Failed to send time record:', error);
      // 不抛出错误，避免影响用户体验
    }
  }

  /**
   * 健康检查
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('[API] Backend health check failed:', error);
      return false;
    }
  }
}

export const apiClient = new ApiClient();
