# Agent Guidelines for planner-mcp

## Build/Test/Lint Commands
- **Test**: `yarn test` (Vitest with node environment)
- **Test Single File**: `yarn test src/filename.test.ts`
- **Test with coverage**: `yarn test --coverage`
- **Format**: `yarn biome format --write .`
- **Lint**: `yarn biome lint --write .`
- **Check**: `yarn biome check --write .` (format + lint)
- **TypeScript**: `yarn tsc --noEmit` (type checking)
- **Run MCP Server**: `yarn run:mcp`

## Code Style Guidelines
- **Formatting**: Use Biome with tab indentation, double quotes
- **TypeScript**: Strict mode enabled, target ESNext/CommonJS
- **Imports**: Organize imports automatically (Biome assist enabled)
- **Naming**: Use camelCase for variables/functions, PascalCase for types/classes
- **Error Handling**: Use proper TypeScript error types, avoid `any`
- **File Structure**: Keep source in `src/`, main entry at `src/index.ts`
- **Testing**: Use Vitest with `.test.ts` suffix, globals enabled

## Project Context
- MCP (Model Context Protocol) server implementation using fastmcp
- Uses Yarn 4.9.2 package manager
- Dependencies: fastmcp, TypeScript, Biome, Vitest
- No existing Cursor/Copilot rules found
