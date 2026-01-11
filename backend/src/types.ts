// 数据类型定义
export type ModeType = 'comment_board' | 'follow_me' | 'crowd_chat' | 'collective_story';

// UGC内容
export interface UGCContent {
  content: string;             // 内容（文本或"[语音]"标记）
  artifactId: string;          // 对应文物ID
  mode: ModeType;              // 对应模式
  timestamp: number;           // 提交时间戳
}

// 时间记录
export interface TimeRecord {
  mode: ModeType | null;       // 对应模式（null表示主页）
  artifactId: string | null;   // 对应文物ID（null表示列表页/Tour模式）
  exitTime: number;            // 退出时间戳
  durationMs: number;          // 停留时长（毫秒）
}

// 参与者数据（完整数据结构）
export interface ParticipantData {
  participantId: string;       // 参与者编号
  ugcContents: UGCContent[];   // UGC内容列表
  timeRecords: TimeRecord[];   // 时间记录列表
}
