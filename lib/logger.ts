import * as FileSystem from 'expo-file-system';

const LOG_FILE_NAME = 'liblogs.log';
const LOG_PATH = FileSystem.documentDirectory ? `${FileSystem.documentDirectory}${LOG_FILE_NAME}` : undefined;

export async function logEvent(message: string) {
  try {
    if (!LOG_PATH) return;
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${message}\n`;
    const info = await FileSystem.getInfoAsync(LOG_PATH);
    let content = '';
    if (info.exists) {
      try {
        content = await FileSystem.readAsStringAsync(LOG_PATH, { encoding: FileSystem.EncodingType.UTF8 });
      } catch {}
    }
    await FileSystem.writeAsStringAsync(LOG_PATH, content + line, { encoding: FileSystem.EncodingType.UTF8 });
  } catch (e) {
    // swallow in prototype
  }
}

export function getLogPath() {
  return LOG_PATH;
}
