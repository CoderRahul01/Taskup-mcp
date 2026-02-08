import { Annotation, StateGraph, END } from "@langchain/langgraph";
import { HuggingFaceInference } from "@langchain/community/llms/hf";
import * as dotenv from "dotenv";

dotenv.config();

// Define the state for the graph
const GraphState = Annotation.Root({
  text: Annotation<string>,
  extracted_data: Annotation<any>,
});

// Since standard HF free endpoints might not support structuredOutput() natively like OpenAI,
// we use a robust prompt and JSON parsing logic.
async function extractNode(state: typeof GraphState.State) {
  const model = new HuggingFaceInference({
    model: process.env.HF_MODEL_ID || "HuggingFaceH4/zephyr-7b-beta",
    apiKey: process.env.HUGGINGFACEHUB_API_TOKEN,
    temperature: 0.1,
    maxTokens: 1000,
    // Note: If you encounter task mismatch, you can try specifying a different model 
    // or use the @huggingface/inference client directly for more control.
  });

  const prompt = `
    Analyze the following user intent and extract tasks, meetings, and notifications.
    User Intent: "${state.text}"
    Current Time: ${new Date().toISOString()}

    Rules:
    - Extract tasks for Notion.
    - Extract meetings for Calendar (detect participants and duration if possible).
    - Extract notifications for Telegram (reminders).
    - If a time is relative (e.g., "tomorrow at 11 AM"), convert it to a strict ISO 8601 string based on the current time provided.
    - RETURN ONLY VALID JSON. DO NOT INCLUDE ANY PROSE OR EXPLANATIONS.

    Output Schema:
    {
      "tasks": [{"title": "string", "due_time": "ISO_8601 | null"}],
      "meetings": [{"title": "string", "start_time": "ISO_8601", "duration_minutes": number, "participants": ["string"]}],
      "notifications": [{"message": "string", "send_at": "ISO_8601 | null"}]
    }

    Strict JSON Output:
  `;

  const response = await model.invoke(prompt);
  
  // Clean the response to find the JSON block if the model included prose
  let cleanJson = response.trim();
  const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleanJson = jsonMatch[0];
  }

  try {
    const result = JSON.parse(cleanJson);
    return { extracted_data: result };
  } catch {
    console.error("Failed to parse LLM response as JSON:", response);
    return { 
      extracted_data: { tasks: [], meetings: [], notifications: [] } 
    };
  }
}

// Build the graph
const builder = new StateGraph(GraphState)
  .addNode("extract", extractNode)
  .addEdge("__start__", "extract")
  .addEdge("extract", END);

const graph = builder.compile();

export async function analyzeIntent(text: string) {
  const initialState = { text };
  const result = await graph.invoke(initialState);
  return result.extracted_data;
}
