# opencode-agentic

A small suite of MCP (Model Context Protocol) servers and agent bundles that provide agentic workflows for software development. This project is built to support the task-focused flow provided at `workflow/task.flow` — the codebase and bundled agents assume that flow as the canonical example, though the system itself can load other flows.

Important note about integration
- The MCP servers in `dist/` are local agent endpoints: they do not automatically integrate with any external coding tool. You (the integrator) must wire these servers into your own agent tooling or platform.
- This project is designed to work with opencode tooling (see `opencode.json`). If you use a different tool, adapt the startup commands and MCP client wiring to your environment. Agents and how they select models are left to you — this repo provides the MCP server runtimes, flow assets, and agent bundles, but not opinionated integrations into third‑party coding assistants.

Production usage (build once, run from dist/)
1. Install dependencies
   ```bash
   yarn install
   ```

2. Build production bundles (creates `dist/`)
   ```bash
   yarn build
   ```

3. Run the bundled production servers from `dist/`
   - Start the Planner MCP server:
     ```bash
     node dist/planner/mcp.js
     ```

   - Start the Workflow MCP server (load the canonical task flow):
     ```bash
     node dist/workflow/mcp.js --workflow=dist/workflow/task.flow
     ```

Notes:
- Use the bundles in `dist/` for production runs. The `yarn build` step bundles the server entrypoints and copies prompts and `.flow` assets into `dist/`.
- Agents or integrators should run their own MCP client processes (or embed an MCP client in their tool) and connect to these local servers according to their chosen transport/wiring.

Architecture — how the pieces fit together
- `dist/workflow/mcp.js`
  - Bundled Workflow MCP server.
  - Loads one or more workflow files supplied via `--workflow=<path>`.
  - Exposes the workflow-related MCP tools (`transition`, `find`) used by agent clients to validate/execute state transitions.

- `dist/planner/mcp.js`
  - Bundled Planner MCP server.
  - Exposes a task-centric set of MCP tools (`get_project`, `create_task`, `update_task`, `delete_task`, `reorder_tasks`, `goto`) intended for managing tasks and plans.
  - Uses the Jujutsu adapter for persistent storage when run from a workspace containing Jujutsu commit structures.

- `dist/workflow/*.flow` and `dist/prompts/*`
  - Flow files and prompts copied into `dist/` at build time. The canonical flow in this project is `dist/workflow/task.flow`.

- Agent bundles (copied to `dist/`)
  - Provided as runnable MCP clients after build. Agent behavior, model selection, and integration into a coding environment are intentionally left to the integrator.

Design intent and the single-flow focus
- The project was developed around a canonical flow (`workflow/task.flow`). That flow demonstrates the intended end-to-end behaviors and is the primary, recommended configuration for users and integrators.
- The system is not strictly limited to that flow — `workflow/mcp.js` loads any `.flow` file provided via `--workflow` — but the rest of the code and agent bundles expect the task-focused flow as the default scenario.

Runtime sequence and how to run the task flow
- `task.flow` requires the Planner MCP server to be available at runtime. The expected production sequence is:
  1. Build once: `yarn build`
  2. Start the Planner MCP server (from the workspace you want to persist, if using persistence):
     ```bash
     node dist/planner/mcp.js
     ```
  3. Start the Workflow MCP server and load the bundled task flow:
     ```bash
     node dist/workflow/mcp.js --workflow=dist/workflow/task.flow
     ```
  4. Start your agent/integration (an MCP client) and instruct it to "start task flow". The agent should call the Workflow MCP server's `find`/`transition` tools and use the Planner MCP server for any task operations required by the flow.

- Agents are responsible for initiating the "start task flow" action and orchestrating the execution of the `task.flow` state machine. The repository provides bundled agent clients as examples, but integrating them into your coding assistant or tooling is your responsibility.

Opencode integration
- `opencode.json` in the repository declares how opencode can install and start the MCP services:
  - `flow`: `yarn run:mcp:workflow --workflow=workflow/task.flow`
  - `planner`: `yarn run:mcp:planner`
- For production deployments using the built bundles, run the equivalent `dist/` commands shown above.
- If you integrate with opencode tooling, use `opencode.json` as a reference or adapt it to call the `dist/` bundles.

Persistence and working directory
- Planner persistence relies on Jujutsu commit structures (the `.jj/` workspace). For full persistence, run the planner server from the repository workspace (or another workspace initialized for Jujutsu) so `Jujutsu.cwd(process.cwd())` resolves correctly.
- If no Jujutsu data is available, the planner will not operate correctly.

Integration responsibilities (what you must provide)
- MCP client wiring in your coding tool or agent runtime (how agents call the planner and workflow servers).
- Model selection, credentials, and runtime configuration for any LLMs your agents will use.
- Any UI or orchestration around agent prompts and tool invocation — agents in `dist/` are starting points and examples, not fully-managed integrations.

Troubleshooting (production)
- `dist/` assets missing: re-run `yarn build` and confirm `dist/workflow/task.flow` exists.
- Agent cannot connect: ensure servers are started from the correct working directory and your MCP client wiring matches the chosen transport.
- Persistence errors: verify you started the planner from a workspace containing Jujutsu commit structures (or accept reduced persistence).
- MCP not connecting: these MCP server are `local`, not `remote`. Additionally it is required that you start the `planner` mcp server in the directory where your `jujutsu` repo is. That means your LLM client needs to support that.

Files of note
- `opencode.json` — opencode installer integration (reference)
- `workflow/task.flow` — canonical flow used by this project (bundled to `dist/workflow`)
- `planner/mcp.ts`, `workflow/mcp.ts` — server entrypoints (bundled to `dist/` on build)
