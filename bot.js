import 'dotenv/config';
import { bot } from './api/webhook.js';
import { logger } from './services/logger.js';

bot.start({
  onStart: (info) => logger.info(`Bot started: @${info.username}`)
});
