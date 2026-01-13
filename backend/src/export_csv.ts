
import fs from 'fs/promises';
import path from 'path';
import { ParticipantData } from './types.js';

/**
 * 将participants.json导出为CSV格式
 * 生成单个CSV文件，包含UGC内容和时间记录，通过record_type字段区分
 * Columns: participant_id, record_type, timestamp, duration_ms, mode, artifact_id, content
 * 
 * @param jsonPath JSON文件的路径
 * @param outputDir 输出目录（可选，默认为JSON文件所在目录）
 */
export async function exportParticipantsJsonToCsv(jsonPath: string, outputDir?: string): Promise<string> {
  // 1. 读取JSON文件
  let data: ParticipantData[] = [];
  try {
    const fileContent = await fs.readFile(jsonPath, 'utf-8');
    data = JSON.parse(fileContent);
  } catch (err) {
    console.error(`Error reading or parsing JSON file at ${jsonPath}:`, err);
    throw err;
  }

  // 2. 准备CSV内容
  const headers = ['participant_id', 'record_type', 'timestamp', 'duration_ms', 'mode', 'artifact_id', 'content'];
  const rows: string[] = [headers.join(',')];

  // 辅助函数：处理CSV字段转义
  const escapeCsvField = (field: any): string => {
    if (field === null || field === undefined) {
      return '';
    }
    const str = String(field);
    // 如果包含逗号、双引号或换行符，需要用双引号包裹，并将内部的双引号转义
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  for (const participant of data) {
    const pId = participant.participantId;

    // 处理 UGC 内容
    if (participant.ugcContents && Array.isArray(participant.ugcContents)) {
      for (const ugc of participant.ugcContents) {
        // participant_id, record_type, timestamp, duration_ms, mode, artifact_id, content
        const row = [
          escapeCsvField(pId),
          'ugc',
          escapeCsvField(ugc.timestamp),
          '', // duration_ms
          escapeCsvField(ugc.mode),
          escapeCsvField(ugc.artifactId),
          escapeCsvField(ugc.content)
        ];
        rows.push(row.join(','));
      }
    }

    // 处理 时间记录
    if (participant.timeRecords && Array.isArray(participant.timeRecords)) {
      for (const record of participant.timeRecords) {
        // participant_id, record_type, timestamp, duration_ms, mode, artifact_id, content
        const row = [
          escapeCsvField(pId),
          'time_record',
          escapeCsvField(record.exitTime), // timestamp mapped to exitTime
          escapeCsvField(record.durationMs),
          escapeCsvField(record.mode),
          escapeCsvField(record.artifactId),
          '' // content
        ];
        rows.push(row.join(','));
      }
    }
  }

  // 3. 写入CSV文件
  const parsedPath = path.parse(jsonPath);
  const outDir = outputDir || parsedPath.dir;
  const outputPath = path.join(outDir, `${parsedPath.name}.csv`);

  await fs.writeFile(outputPath, rows.join('\n'), 'utf-8');
  console.log(`Successfully exported CSV to: ${outputPath}`);
  return outputPath;
}

// 如果直接运行此脚本
// 使用方法: npx tsx src/export_csv.ts [json_file_path]
import { fileURLToPath } from 'url';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const jsonPath = args[0] || path.join(process.cwd(), 'data', 'participants.json');
  
  console.log(`Exporting ${jsonPath}...`);
  
  exportParticipantsJsonToCsv(jsonPath)
    .catch(err => console.error('Export failed:', err));
}
