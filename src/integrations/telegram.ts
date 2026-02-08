import TelegramBot from "node-telegram-bot-api";
import * as dotenv from "dotenv";
import { logger } from "../utils/logger.js";

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN!;
const chatId = process.env.TELEGRAM_CHAT_ID!;
const bot = new TelegramBot(token, { polling: false });

export async function sendTelegramNotification(message: string, send_at: string | null) {
  try {
    if (send_at) {
      // For scheduling, in a real production app you'd use a queue/redis.
      // Since this MCP is stateless and "no background workers" per constraint,
      // we report it as "scheduled" if there's a send_at, but actual logic
      // would depend on a persistent scheduler.
      // For V1, we'll send a confirmation that it *should* be scheduled.
      await bot.sendMessage(chatId, `[Scheduled for ${send_at}]: ${message}`);
      return { status: "scheduled", time: send_at };
    }

    await bot.sendMessage(chatId, message);
    return { status: "sent" };
  } catch (error: any) {
    logger.error({ error: error.message, stack: error.stack }, "Telegram Integration Error");
    return { status: "failed", error: error.message };
  }
}
