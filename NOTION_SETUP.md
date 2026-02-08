# Notion Integration Setup Guide

To get your `NOTION_API_KEY` and `NOTION_DATABASE_ID`, follow these steps:

### 1. Create a Notion Integration

1. Go to [Notion My Integrations](https://www.notion.so/my-integrations).
2. Click **+ New integration**.
3. **Type**: Internal (usually).
4. **Name**: e.g., "Personal Execution MCP".
5. **Website Link**: Notion requires a URL for the integration's landing page. You can use any valid URL if you don't have one, such as your GitHub profile link or `https://localhost:3000`.
6. Click **Submit**.
7. Copy the **Internal Integration Token** — this is your `NOTION_API_KEY`.

### 2. Share the Database with the Integration

1. Open the Notion database you want to use.
2. Click the **...** (three dots) in the top right corner.
3. Click **Add connections**.
4. Search for your integration name and select it.
5. Click **Confirm**.

### 3. Get the Database ID

1. With the database open, look at the URL.
2. The Database ID is the 32-character string between the last `/` and before the `?v=`.
   - URL: `https://www.notion.so/workspace/88805318abe84d16add098fae3add91e?v=...`
   - ID: `88805318abe84d16add098fae3add91e`

### 4. Database Property Setup (CRITICAL)

For the MCP server to create tasks correctly, your Notion database **MUST** have the following properties configured exactly as named:

| Property Name | Property Type | Description                            |
| :------------ | :------------ | :------------------------------------- |
| **Name**      | Title         | The primary field (default in Notion). |
| **Date**      | Date          | Used to store the `due_time`.          |

> [!TIP]
> You can add more columns for your own use, but the server only requires these two to function.
