import { z } from "zod";

// 1. analyze_intent
export const AnalyzeIntentSchema = z.object({
  text: z.string().describe("The natural language input from the user to be analyzed."),
});

// 2. create_notion_task
export const CreateNotionTaskSchema = z.object({
  title: z.string().describe("The title of the task."),
  due_time: z.string().nullable().describe("ISO 8601 formatted due date/time, or null if not specified."),
  metadata: z.record(z.string(), z.any()).optional().describe("Additional metadata for the task."),
});

// 3. schedule_calendar_event
export const ScheduleCalendarEventSchema = z.object({
  title: z.string().describe("The title of the meeting."),
  start_time: z.string().describe("ISO 8601 formatted start time."),
  duration_minutes: z.number().describe("Duration of the meeting in minutes."),
  participants: z.array(z.string()).describe("List of participant names or email addresses."),
});

// 4. send_telegram_notification
export const SendTelegramNotificationSchema = z.object({
  message: z.string().describe("The message to be sent."),
  send_at: z.string().nullable().describe("ISO 8601 formatted time to send the notification at, or null for immediate delivery."),
});

export const schemas = {
  analyze_intent: AnalyzeIntentSchema,
  create_notion_task: CreateNotionTaskSchema,
  schedule_calendar_event: ScheduleCalendarEventSchema,
  send_telegram_notification: SendTelegramNotificationSchema,
};
