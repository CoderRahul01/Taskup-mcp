# Contributing to TaskUp MCP

Thank you for your interest in contributing to TaskUp MCP! We welcome contributions from the community to help make this MCP server even better.

## Development Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/your-username/taskup-mcp.git
   cd taskup-mcp
   ```

2. **Install dependencies**:

   ```bash
   bun install
   ```

3. **Environment Setup**:
   Copy `.env.example` to `.env` and fill in the required API keys for Notion, Google Calendar, and Telegram.

4. **Run in development mode**:
   ```bash
   bun run dev
   ```

## Contribution Process

1. **Search for existing issues**: Before starting work, check if there's already an issue or PR for your task.
2. **Create an Issue**: If you find a bug or have a feature request, please open an issue first.
3. **Fork and Branch**: Fork the repository and create a branch for your changes (e.g., `feat/add-new-tool` or `fix/parse-error`).
4. **Implement and Test**: Write your code and ensure it follows the project's standards.
5. **Submit a Pull Request**: Provide a clear description of your changes and link to any relevant issues.

## Coding Standards

- Use TypeScript for all new code.
- Follow the existing architectural patterns (modular integrations, Zod schemas).
- Ensure all new tools are properly documented in the README.
- Run `bun run lint` before submitting.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
