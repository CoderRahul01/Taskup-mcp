import { Arcade } from "@arcadeai/arcadejs";
import { logger } from "../utils/logger.js";

const arcade = new Arcade({
  apiKey: process.env.ARCADE_API_KEY,
});

export async function scheduleCalendarEvent(
  token: string,
  title: string,
  start_time: string,
  duration_minutes: number,
  participants: string[]
) {
  try {
    const end_time = new Date(new Date(start_time).getTime() + duration_minutes * 60000).toISOString();

    const result = await arcade.tools.execute({
      tool_name: "google.CreateCalendarEvent",
      input: {
        calendar_id: "primary",
        summary: title,
        start_time: start_time,
        end_time: end_time,
        attendees: participants,
      },
      user_id: token || process.env.ARCADE_USER_ID,
    });

    return {
      event_id: (result as any).id,
      join_link: (result as any).hangoutLink || null,
      status: "created",
    };
  } catch (error: any) {
    logger.error({ error: error.message }, "Arcade Calendar Integration Error");
    return { status: "failed", error: error.message };
  }
}
