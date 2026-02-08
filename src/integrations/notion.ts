import * as dotenv from "dotenv";
import { logger } from "../utils/logger.js";
import { Arcade } from "@arcadeai/arcadejs";

dotenv.config();

const arcade = new Arcade({
  apiKey: process.env.ARCADE_API_KEY,
});

export async function createNotionTask(
  token: string,
  title: string,
  due_date: string | null
) {
  try {
    // We use Arcade to call the 'notion.CreatePage' tool or similar
    // The 'userRef' is inferred from the token in Arcade AI Auth
    const result = await arcade.tools.execute({
      tool_name: "notion.CreateDatabaseItem",
      input: {
        database_id: process.env.NOTION_DATABASE_ID,
        properties: {
          Name: { title: [{ text: { content: title } }] },
          Date: due_date ? { date: { start: due_date } } : undefined,
        },
      },
      user_id: token || process.env.ARCADE_USER_ID, // fallback to specific user if token is just a server key
    });

    return {
      task_id: (result as any).id,
      status: "created",
    };
  } catch (error: any) {
    logger.error({ error: error.message }, "Arcade Notion Integration Error");
    return { status: "failed", error: error.message };
  }
}
