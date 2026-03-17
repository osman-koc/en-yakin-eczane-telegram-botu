import 'dotenv/config';
import { bot } from './api/webhook.js';

bot.start({
  onStart: (info) => console.log(`Bot başlatıldı: @${info.username}`)
});
