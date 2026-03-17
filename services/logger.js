const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

function getConfiguredLevel() {
  const raw = (process.env.LOG_LEVEL || 'info').toLowerCase();
  return LEVELS[raw] ?? LEVELS.info;
}

function timestamp() {
  // sv-SE locale produces clean ISO-like: 2026-03-17 07:54:22
  return new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Istanbul' });
}

function buildLine(level, chatId, message) {
  const lvl = level.toUpperCase().padEnd(5);
  const ctx = chatId ? `[chat:${chatId}]` : '[system]     ';
  return `[${timestamp()}] [${lvl}] ${ctx} ${message}`;
}

function write(level, chatId, message) {
  if (LEVELS[level] < getConfiguredLevel()) return;
  const line = buildLine(level, chatId, message);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message, chatId = null) => write('debug', chatId, message),
  info:  (message, chatId = null) => write('info',  chatId, message),
  warn:  (message, chatId = null) => write('warn',  chatId, message),
  error: (message, chatId = null) => write('error', chatId, message),
};
