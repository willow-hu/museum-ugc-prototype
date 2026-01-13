/**
 * API Client for Backend Communication
 * 调用后端API发送数据
 */

// 开发环境：指向本机后端；生产环境：使用当前站点域名下的 /api
const API_BASE_URL = import.meta.env.PROD
  ? '/api'
  : 'http://localhost:3001/api';

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
    console.log('[API] Attempting to send UGC:', payload);
    console.log('[API] API URL:', `${API_BASE_URL}/data/ugc`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/data/ugc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('[API] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const result = await response.json();
      console.log('[API] ✅ UGC sent successfully:', result);
    } catch (error) {
      console.error('[API] ❌ Failed to send UGC:', error);
      console.error('[API] Error details:', error instanceof Error ? error.message : error);
      // 不抛出错误，避免影响用户体验
    }
  }

  /**
   * 发送时间记录到后端
   */
  async sendTimeRecord(payload: TimeRecordPayload): Promise<void> {
    console.log('[API] Attempting to send time record:', payload);
    console.log('[API] API URL:', `${API_BASE_URL}/data/time`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/data/time`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('[API] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const result = await response.json();
      console.log('[API] ✅ Time record sent successfully:', result);
    } catch (error) {
      console.error('[API] ❌ Failed to send time record:', error);
      console.error('[API] Error details:', error instanceof Error ? error.message : error);
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
