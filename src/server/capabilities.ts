import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AnalyzeIntentSchema, CreateNotionTaskSchema, ScheduleCalendarEventSchema, SendTelegramNotificationSchema } from "../schemas/index.js";
import { analyzeIntent } from "../tools/parse_intent.js";
import { createNotionTask } from "../integrations/notion.js";
import { scheduleCalendarEvent } from "../integrations/calendar.js";
import { sendTelegramNotification } from "../integrations/telegram.js";
import { authStore } from "../utils/auth-store.js";

export function registerTools(server: McpServer) {
  // 1. analyze_intent
  server.registerTool(
    "analyze_intent",
    {
      title: "Analyze Intent",
      description: "Extract structured workspace actions from natural language input.",
      inputSchema: AnalyzeIntentSchema.shape,
    },
    async ({ text }) => {
      const result = await analyzeIntent(text);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // 2. create_notion_task
  server.registerTool(
    "create_notion_task",
    {
      title: "Create Notion Task",
      description: "Create a new task in Notion.",
      inputSchema: CreateNotionTaskSchema.shape,
    },
    async ({ title, due_time }) => {
      const auth = authStore.getStore();
      const result = await createNotionTask(auth?.userId || auth?.token || "", title, due_time);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // 3. schedule_calendar_event
  server.registerTool(
    "schedule_calendar_event",
    {
      title: "Schedule Calendar Event",
      description: "Create a meeting in Google Calendar.",
      inputSchema: ScheduleCalendarEventSchema.shape,
    },
    async ({ title, start_time, duration_minutes, participants }) => {
      const auth = authStore.getStore();
      const result = await scheduleCalendarEvent(auth?.userId || auth?.token || "", title, start_time, duration_minutes, participants);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // 4. send_telegram_notification
  server.registerTool(
    "send_telegram_notification",
    {
      title: "Send Telegram Notification",
      description: "Send a message or schedule a reminder via Telegram.",
      inputSchema: SendTelegramNotificationSchema.shape,
    },
    async ({ message, send_at }) => {
      const result = await sendTelegramNotification(message, send_at);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
