# Agent Guidelines for planner-mcp

## Build/Test/Lint Commands
- **Format**: `yarn biome format --write .`
- **Lint**: `yarn biome lint --write .`
- **Check**: `yarn biome check --write .` (format + lint)
- **TypeScript**: `yarn tsc --noEmit` (type checking)
- **No test framework configured** - add tests if needed

## Code Style Guidelines
- **Formatting**: Use Biome with tab indentation, double quotes
- **TypeScript**: Strict mode enabled, target ES5/CommonJS
- **Imports**: Organize imports automatically (Biome assist enabled)
- **Naming**: Use camelCase for variables/functions, PascalCase for types/classes
- **Error Handling**: Use proper TypeScript error types, avoid `any`
- **File Structure**: Keep source in `src/`, main entry at `src/index.ts`

## Project Context
- MCP (Model Context Protocol) server implementation
- Uses Yarn 4.9.2 package manager
- Dependencies: @modelcontextprotocol/sdk, TypeScript, Biome
- No existing Cursor/Copilot rules found