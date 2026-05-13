# opencode

## Overview

opencode (sst/opencode, distributed as the npm package `opencode-ai` and the CLI binary `opencode`) is an open-source, provider-agnostic coding agent built by the team behind SST and terminal.shop. Its tagline is "the open source AI coding agent." Architecturally it is a TypeScript/Bun monorepo built around a headless HTTP/SSE server that hosts the actual agent loop, with multiple front-ends (a terminal-native TUI, a CLI `run` mode, an Electron desktop app, an Agent Client Protocol bridge, and the OpenCode web/console). The codebase is heavily structured around the Effect runtime (effect/Service, Layer, Schema) and uses the Vercel AI SDK (`ai`, `@ai-sdk/*`) for the actual model calls, with Drizzle/SQLite (Bun's native driver) as durable storage for sessions, messages, parts, and an event log.

What makes it notable, beyond being one of the most-starred open-source alternatives to Claude Code: a strict client/server split that lets the same agent be driven from terminal, desktop, mobile, or a hosted console; a model catalog ingested live from `https://models.dev`; a sync-event/event-sourcing layer behind sessions that enables both replay and the famous "shareable sessions" links; and a plugin/skill/agent extension surface that mirrors and extends Claude Code conventions (`.claude/skills`, `AGENTS.md`, custom subagents, MCP).

## Architecture

### Repository layout

Top-level monorepo (`pnpm`/`bun` workspaces). Relevant packages under `packages/`:

- `packages/opencode/` — the main package; ships the `opencode` binary, hosts the HTTP server, the agent loop, all tools, and the terminal UI as in-process code.
- `packages/sdk/js/` — `@opencode-ai/sdk`, the generated TypeScript SDK against the opencode HTTP API (`./src/client.ts`, `./src/v2/client.ts`, with codegen output in `./src/gen/` and `./src/v2/gen/`). Used by every client and by plugins.
- `packages/plugin/` — `@opencode-ai/plugin`, the public plugin contract (hooks, custom tools, auth providers, workspace adapters): `packages/plugin/src/index.ts`, `packages/plugin/src/tool.ts`.
- `packages/core/` — shared utilities (`Global`, `Flag`, `AppFileSystem`, logging, npm/installation helpers).
- `packages/desktop/` — Electron desktop wrapper (`@opencode-ai/desktop`), see `packages/desktop/package.json` and `README.md`.
- `packages/console/`, `packages/web/` — marketing site, the hosted "console", and the share-rendering web app.
- `packages/llm/`, `packages/identity/`, `packages/containers/`, `packages/enterprise/`, `packages/slack/` — supporting services (mostly behind opencode's own backend / opencode Zen).
- `packages/storybook/`, `packages/ui/` — shared UI primitives.

The "core" — agent runtime, server, sessions, tools, providers — all lives in `packages/opencode/src/`. Subdirectories: `agent/`, `session/`, `tool/`, `provider/`, `mcp/`, `plugin/`, `permission/`, `server/`, `share/`, `acp/`, `skill/`, `command/`, `snapshot/`, `cli/`, `v2/`, `sync/`, `bus/`, `effect/`, etc.

### Language and runtime

100% TypeScript, executed by Bun. The previous Go-based TUI has been replaced by a SolidJS + OpenTUI terminal renderer running in-process (see `packages/opencode/src/cli/cmd/tui/app.tsx:1-2`, which imports `@opentui/solid` and `@opentui/keymap`). `package.json` declares dual `bun`/`node` import conditions for the platform-specific modules — `db` and `pty` have separate Bun and Node implementations, while `#httpapi-server` resolves to the same `.node.ts` file under both conditions:

```
"#db":             { "bun": "./src/storage/db.bun.ts", "node": "./src/storage/db.node.ts", "default": "./src/storage/db.bun.ts" }
"#pty":            { "bun": "./src/pty/pty.bun.ts",    "node": "./src/pty/pty.node.ts",    "default": "./src/pty/pty.bun.ts"    }
"#httpapi-server": { "bun": "./src/server/httpapi-server.node.ts", "node": "./src/server/httpapi-server.node.ts", "default": "./src/server/httpapi-server.node.ts" }
```
(`packages/opencode/package.json:25-40`)

The Effect framework (v4 beta) is used pervasively: every long-lived concern is an `Effect.Service` with a `Layer` and a `defaultLayer`. `packages/opencode/AGENTS.md` codifies the conventions (`Effect.gen`, `Effect.fn("Domain.method")`, `Effect.fnUntraced`, `InstanceState` vs `makeRuntime`, namespace projection via `export * as Foo from "./foo"`, snake_case Drizzle columns).

### Process model: client/server split

Even when run as a single `opencode` command, the architecture is server-first.

- `opencode serve` (`packages/opencode/src/cli/cmd/serve.ts`) starts a headless server. It reads `OPENCODE_SERVER_PASSWORD` for basic auth (`packages/opencode/src/server/auth.ts:17-20`); if unset it warns "server is unsecured."
- `opencode run` is non-interactive and creates an in-process server, talks to it via the SDK, streams events to stdout, exits when idle (`packages/opencode/src/cli/cmd/run.ts:1-13`).
- `opencode` (the default subcommand is the TUI) launches the SolidJS TUI, which spawns a Bun worker that runs the same server in-process and talks to it via a JSON-RPC-over-IPC `fetch` shim (`packages/opencode/src/cli/cmd/tui/worker.ts:50-78`):

  ```ts
  let server: Awaited<ReturnType<typeof Server.listen>> | undefined
  ...
  async server(input: { port: number; hostname: string; mdns?: boolean; cors?: string[] }) {
    if (server) await server.stop(true)
    server = await Server.listen(input)
    return { url: server.url.toString() }
  }
  ```

- `opencode attach <url>` (`packages/opencode/src/cli/cmd/tui/attach.ts`) lets the TUI connect to a remote server instead of starting its own. Headers are basic-auth-encoded via `ServerAuth.headers({ password, username })`.
- The Electron desktop app and the web/console are additional clients of the same HTTP/SSE API.

The TUI never imports the agent loop directly. Even when colocated, it goes through `createOpencodeClient` → HTTP fetch → server handlers (the in-process shim in `worker.ts` literally invokes `Server.Default().app.fetch(request)`). This is the entire point: "the TUI frontend is just one of the possible clients" (README.md:137).

### Entry point and command flow

- Binary entry: `packages/opencode/bin/opencode` → `packages/opencode/src/index.ts`.
- `index.ts` wires `yargs`, performs a one-time SQLite migration of pre-1.x JSON state (`JsonMigration.run`, line 129), initializes logs, and registers every subcommand: `RunCommand`, `ServeCommand`, `AcpCommand`, `McpCommand`, `AttachCommand`, `TuiThreadCommand`, `AgentCommand`, `ModelsCommand`, `SessionCommand`, `ProvidersCommand`, `GithubCommand`, `PluginCommand`, etc. (`src/index.ts:157-179`).
- For an interactive session, the user-facing flow is: TUI keystroke → SolidJS event → SDK call (`createOpencodeClient(...).session.prompt(...)`) → HTTP → server handler (`packages/opencode/src/server/routes/instance/httpapi/handlers/session.ts`) → `SessionPrompt.prompt` (`packages/opencode/src/session/prompt.ts`) → `runLoop` → `LLM.stream` → AI-SDK `streamText` → provider SDK → model. Events come back via SSE on `GET /event` and are streamed to whichever client is subscribed.

### Server: routing and layering

The server is implemented on top of Effect's `@effect/platform` HttpApi (`effect/unstable/http`, `effect/unstable/httpapi`). The composition is in `packages/opencode/src/server/routes/instance/httpapi/server.ts`. Notable pieces:

- Two `HttpApi` definitions: `RootHttpApi` for control routes and `/global/*`, `InstanceHttpApi` for per-instance routes (config, experimental, file, instance, mcp, project, pty, question, permission, provider, session, sync, v2, tui, workspace). `OpenCodeHttpApi` composes both plus the SSE `EventApi` and a raw `PtyConnectApi` (`packages/opencode/src/server/routes/instance/httpapi/api.ts:30-59`).
- Each route group is a separately-defined `HttpApiGroup` under `groups/` with its handler in `handlers/`. All groups are typed end-to-end via Effect Schema, and the same definitions feed `OpenApi.fromApi(PublicApi)` to generate the OpenAPI spec served on `GET /doc`.
- Middlewares: `authorizationLayer` / `authorizationRouterMiddleware` enforce basic auth, `instanceContextLayer` resolves the per-directory project instance from the `?directory=` query or `x-opencode-directory` header, `workspaceRouterMiddleware` resolves workspace routing, plus `compressionLayer`, `corsVaryFix`, `fenceLayer`, `errorLayer`, `schemaErrorLayer`.
- `Server.listen` (`packages/opencode/src/server/server.ts:59-156`) opens a port (defaulting to 4096 when port `0` is requested), optionally publishes mDNS (`packages/opencode/src/server/mdns.ts`), and returns a `{ url, stop }` handle.

The result is that every client — TUI, CLI run mode, Electron, web — speaks one well-typed HTTP API plus one SSE event stream. The `@opencode-ai/sdk` package is generated by `@hey-api/openapi-ts` from this spec (`packages/sdk/js/package.json`), so it is always in lockstep with the server.

## Agent Loop

The agent loop has three coordinated layers: a top-level "session loop" that walks turns, a per-turn "processor" that drives the AI SDK stream and applies its events to the message/part graph, and the raw `LLM.stream` call into the AI SDK.

### Top-level loop: `SessionPrompt.runLoop`

`packages/opencode/src/session/prompt.ts:1625-1853`. The session loop is a `while (true)` that, for each iteration:

1. Reads the recent messages and finds the last user message, the last assistant message, and the last finished assistant (`lastUser`, `lastAssistant`, `lastFinished`).
2. Decides whether to exit. Loop exits when `lastAssistant.finish` is something other than `"tool-calls"`, no pending tool calls exist, and the user message id is older than the assistant id (lines 1665-1673).
3. On step 1, kicks off a title generation fork (`title({ session, modelID, providerID, history }).pipe(Effect.ignore, Effect.forkIn(scope))`).
4. Handles two special interleaved tasks: a queued `subtask` (delegated work returning into the parent stream) or a queued `compaction` instruction (`compaction.process(...)`).
5. If the last finished message tipped the context past the overflow threshold (`compaction.isOverflow`), it queues an auto-compaction turn and continues.
6. Resolves the active agent, computes `maxSteps = agent.steps ?? Infinity`, injects `<system-reminder>` tags for any unaddressed user messages after the last finished assistant, calls `plugin.trigger("experimental.chat.messages.transform", ...)`, and assembles system, environment, instructions, skills.
7. Creates a fresh assistant message row and a `SessionProcessor` handle, then calls `handle.process(...)` for this turn (line 1802).
8. If the turn returned `"compact"`, queues a compaction; if `"stop"`, breaks; otherwise iterates.

A `MAX_STEPS` prompt (`session/prompt/max-steps.txt`) is appended to the very last allowed step to push the model to wrap up rather than emit another tool call.

### Per-turn processor

`packages/opencode/src/session/processor.ts`. Each turn is a single AI-SDK stream consumed event-by-event:

- The processor maintains a `ProcessorContext` with active `toolcalls`, the current `TextPart`, a `reasoningMap`, a snapshot id, and `shouldBreak` / `needsCompaction` / `blocked` flags (lines 72-80).
- A precapture of the snapshot happens before the stream starts (`snapshot.track()`, line 122).
- The stream is `llm.stream(input)` — a `Stream.Stream<LLM.Event>` — and is consumed via:
  ```ts
  yield* stream.pipe(
    Stream.tap((event) => handleEvent(event)),
    Stream.takeUntil(() => ctx.needsCompaction),
    Stream.runDrain,
  )
  ```
  (lines 738-742). Compaction can short-circuit mid-stream.
- The event handler is a switch over the AI-SDK event types (lines 227-635): `start`, `reasoning-start/delta/end`, `tool-input-start/delta/end`, `tool-call`, `tool-result`, `tool-error`, `start-step`, `finish-step`, `text-start/delta/end`, `finish`, `error`. Each writes the corresponding `MessageV2.Part` mutation through `session.updatePart` / `session.updatePartDelta` and, when the `OPENCODE_EXPERIMENTAL_EVENT_SYSTEM` flag is set, dual-writes a sync event via `sync.run(SessionEvent.…, ...)` (the v2 event-sourced session log).
- "Doom loop" detection: after every `tool-call`, if the last three parts are identical tool calls with identical inputs, the processor asks the user for a `doom_loop` permission to keep going (lines 366-391).
- Interruption: `Effect.onInterrupt` sets `aborted = true` and writes an aborted-error onto the assistant message (lines 744-751). Any in-flight tool call is finalized with `status: "error", error: "Tool execution aborted", metadata: { interrupted: true }` in `cleanup` (lines 676-693).
- Retry: the whole turn is wrapped in `Effect.retry(SessionRetry.policy({ provider, parse, set }))`. `SessionRetry.policy` (`packages/opencode/src/session/retry.ts:174-197`) reads `Retry-After` / `retry-after-ms` headers when available, exponentially backs off otherwise (`RETRY_INITIAL_DELAY = 2000`, factor 2, cap 30s without headers, 32-bit max with headers), and pushes a `{ type: "retry", attempt, message, action, next }` status onto the session bus so the TUI can display it.
- `tool-error` from the AI SDK that comes from `Permission.RejectedError` or `Question.RejectedError` sets `ctx.blocked = ctx.shouldBreak`. The default behavior is to break out of the loop on a deny, but `experimental.continue_loop_on_deny: true` keeps the loop going (line 730).

### Stream-time tool dispatch

`packages/opencode/src/session/llm.ts:337-416` is the `streamText` call. The interesting parts:

- System messages are composed from agent prompt (or provider-default prompt, see "Provider & Model Abstraction"), call-site additions, and any custom prompt on the user message (lines 103-128). After `plugin.trigger("experimental.chat.system.transform", ...)` the array is re-flattened into a two-part structure (header + everything else) so prompt-caching breakpoints are preserved.
- `resolveTools(input)` (line 450-456) filters the candidate tool set by the agent permission ruleset and by `user.tools[k] !== false`.
- A `_noop` dummy tool is injected when the provider is LiteLLM-flavored (auto-detected by id or opted-in via `litellmProxy: true`) or `github-copilot` and the message history contains tool calls but no active tools (e.g. during compaction). The inline comment notes that LiteLLM/Bedrock rejects tools-less requests that contain tool history (lines 203-227).
- `experimental_repairToolCall` (lines 343-363): if the model calls a tool with the wrong case (e.g. `Read` instead of `read`), the call is rewritten; otherwise it's routed to the `invalid` tool with the parse error as input. This means the "the tool you tried to call doesn't exist" path is just another tool result the model can recover from.
- Telemetry/OTel: when `experimental.openTelemetry` is enabled in config, a proxied OTel tracer is passed to the AI SDK's `experimental_telemetry`; every `streamText` span is annotated with `session.id` (the tracer proxy intercepts `startSpan` and sets the attribute, lines 317-331) and the AI SDK metadata adds `userId` and `sessionId`.
- The model is wrapped via `wrapLanguageModel({ model, middleware: [{ transformParams: ... ProviderTransform.message(prompt, model, options) }] })`, which is where provider-specific message coercion lives (line 392-405).

### Workflow provider (GitLab DWS Agent Platform)

When the underlying language model is a `GitLabWorkflowLanguageModel`, `LLM.run` injects two extras into the model: a `toolExecutor` that runs opencode's resolved tools and returns the output, and an `approvalHandler` that calls `Permission.ask(...)` for "server-side" tool approval (lines 233-315). This is how opencode bridges its own permission model to a remote workflow service that runs its own tool loop.

### Multi-step reasoning

`agent.steps` (per-agent step cap, defaults to `Infinity`) gates the loop. On the final allowed step, an assistant-side `MAX_STEPS` message is appended to the prompt to tell the model "you are out of steps, finalize." If the user message has `format: { type: "json_schema" }`, a synthetic `StructuredOutput` tool is forced via `toolChoice: "required"` and `tool-call` finishReason becomes mandatory (lines 1761-1832).

## Provider & Model Abstraction

opencode wraps the Vercel AI SDK provider ecosystem rather than building its own. `packages/opencode/src/provider/provider.ts` is the single home of this logic (~1.7k lines).

### Bundled providers

`BUNDLED_PROVIDERS` (`packages/opencode/src/provider/provider.ts:92-117`) lazy-imports every supported provider on demand:

```ts
const BUNDLED_PROVIDERS: Record<string, () => Promise<(opts: any) => BundledSDK>> = {
  "@ai-sdk/amazon-bedrock":         () => import("@ai-sdk/amazon-bedrock").then(m => m.createAmazonBedrock),
  "@ai-sdk/anthropic":              () => import("@ai-sdk/anthropic").then(m => m.createAnthropic),
  "@ai-sdk/azure":                  () => import("@ai-sdk/azure").then(m => m.createAzure),
  "@ai-sdk/google":                 () => import("@ai-sdk/google").then(m => m.createGoogleGenerativeAI),
  "@ai-sdk/google-vertex":          () => import("@ai-sdk/google-vertex").then(m => m.createVertex),
  "@ai-sdk/google-vertex/anthropic":() => import("@ai-sdk/google-vertex/anthropic").then(m => m.createVertexAnthropic),
  "@ai-sdk/openai":                 () => import("@ai-sdk/openai").then(m => m.createOpenAI),
  "@ai-sdk/openai-compatible":      () => import("@ai-sdk/openai-compatible").then(m => m.createOpenAICompatible),
  "@openrouter/ai-sdk-provider":    () => import("@openrouter/ai-sdk-provider").then(m => m.createOpenRouter),
  "@ai-sdk/xai": ..., "@ai-sdk/mistral": ..., "@ai-sdk/groq": ..., "@ai-sdk/deepinfra": ...,
  "@ai-sdk/cerebras": ..., "@ai-sdk/cohere": ..., "@ai-sdk/gateway": ..., "@ai-sdk/togetherai": ...,
  "@ai-sdk/perplexity": ..., "@ai-sdk/vercel": ..., "@ai-sdk/alibaba": ...,
  "gitlab-ai-provider": ..., "@ai-sdk/github-copilot": ..., "venice-ai-sdk-provider": ...,
}
```
(23 entries total; the `@ai-sdk/github-copilot` key actually points at an in-tree adapter under `./sdk/copilot/copilot-provider`.)

For local models, `@ai-sdk/openai-compatible` is the generic adapter — point it at an LM Studio / Ollama / vLLM URL and it works.

### Custom per-provider behavior

`custom(dep)` (line 149) returns per-provider hooks: vary `getModel(sdk, modelID, options)` (so OpenAI uses `sdk.responses(modelID)` for the Responses API, xAI does the same, Anthropic gets `interleaved-thinking-2025-05-14` and `fine-grained-tool-streaming-2025-05-14` betas), `vars(options)` to project options into env vars (e.g. AWS region), `discoverModels()` for providers that need a live model list (GitHub Copilot), `autoload` to decide whether the provider is on by default. The `opencode` provider itself has a clever trick: if there's no API key it filters down to only the free models (line 160-181).

### `models.dev` integration

`packages/opencode/src/provider/models.ts:106` reads from `Flag.OPENCODE_MODELS_URL || "https://models.dev"`. The catalog (`<source>/api.json`) is cached on disk under `Global.Path.cache` with a 5-minute mtime-based freshness check (line 111), and a background fiber re-runs `refresh()` every 60 minutes (`Effect.repeat(Schedule.spaced("60 minutes"))`, line 187). A bundled snapshot (`./models-snapshot.js`, generated at build time) is the fallback when offline. Models carry cost, limits (context/input/output), capabilities (tool_call, temperature, reasoning, attachment), modalities, and a release date; the Model schema is at `models.ts:28-79`.

This means: when a new model lands on models.dev, opencode picks it up within an hour with no code change. Users override per-model behavior under `provider.<id>.options` and `provider.<id>.models.<id>.options` in `opencode.json`; an agent's `model.options` override that; per-user-message `variant` overrides further. The merge happens in `LLM.run`:

```ts
const options = mergeOptions(mergeOptions(mergeOptions(base, input.model.options), input.agent.options), variant)
```
(`packages/opencode/src/session/llm.ts:141`).

### The unified `Provider` service

`Provider.Service` (`provider.ts:969`) exposes:

```ts
export interface Interface {
  readonly list: () => Effect.Effect<Record<ProviderID, Info>>
  readonly getProvider: (providerID: ProviderID) => Effect.Effect<Info>
  readonly getModel: (providerID: ProviderID, modelID: ModelID) => Effect.Effect<Model>
  readonly getLanguage: (model: Model) => Effect.Effect<LanguageModelV3>
  readonly closest: (providerID, query) => ...
  readonly getSmallModel: (providerID) => Effect.Effect<Model | undefined>
  readonly defaultModel: () => Effect.Effect<{ providerID; modelID }>
}
```

`getLanguage(model)` is the only API session code uses; it returns a cached `LanguageModelV3` instance (the AI SDK's provider-neutral abstraction). `getSmallModel` (line 1629) is the model used for cheap utility work like title generation; it walks a priority list (`claude-haiku-4-5`, `gemini-3-flash`, `gpt-5-nano`, …) and finds the closest match in the active provider, with cross-region prefix logic for Bedrock.

### Default model

`defaultModel` (line 1685) reads `cfg.model` first, then the `recent` list from `<Global.Path.state>/model.json`, then the highest-sorted model of the first available provider. This is how the "last used model" sticks.

### Provider-aware system prompts

`packages/opencode/src/session/system.ts:19-33`:

```ts
export function provider(model: Provider.Model) {
  if (model.api.id.includes("gpt-4") || model.api.id.includes("o1") || model.api.id.includes("o3")) return [PROMPT_BEAST]
  if (model.api.id.includes("gpt")) {
    if (model.api.id.includes("codex")) return [PROMPT_CODEX]
    return [PROMPT_GPT]
  }
  if (model.api.id.includes("gemini-")) return [PROMPT_GEMINI]
  if (model.api.id.includes("claude")) return [PROMPT_ANTHROPIC]
  if (model.api.id.toLowerCase().includes("trinity")) return [PROMPT_TRINITY]
  if (model.api.id.toLowerCase().includes("kimi")) return [PROMPT_KIMI]
  return [PROMPT_DEFAULT]
}
```

Each prompt is a hand-tuned `.txt` file under `packages/opencode/src/session/prompt/` (`anthropic.txt`, `gpt.txt`, `beast.txt`, `gemini.txt`, `kimi.txt`, `codex.txt`, `trinity.txt`, `default.txt`). The Anthropic prompt starts: "You are OpenCode, the best coding agent on the planet." and mirrors the Claude Code system prompt's structure (todo discipline, professional objectivity, tone/style, "NEVER create files unless absolutely necessary").

## Tool System

### Registry

`packages/opencode/src/tool/registry.ts`. `ToolRegistry.Service` exposes `all()`, `ids()`, `tools(model)`, `named()`. The state is built once per project instance:

```ts
const tool = yield* Effect.all({
  invalid: Tool.init(invalid),
  shell: Tool.init(shell),
  read: Tool.init(read),
  glob: Tool.init(globtool),
  grep: Tool.init(greptool),
  edit: Tool.init(edit),
  write: Tool.init(writetool),
  task: Tool.init(task),
  fetch: Tool.init(webfetch),
  todo: Tool.init(todo),
  search: Tool.init(websearch),
  code: Tool.init(codesearch),
  repo_clone: Tool.init(repoClone),
  repo_overview: Tool.init(repoOverview),
  skill: Tool.init(skilltool),
  patch: Tool.init(patchtool),
  question: Tool.init(question),
  lsp: Tool.init(lsptool),
  plan: Tool.init(plan),
})
```
(`registry.ts:215-235`)

The final tool set is `[invalid, question?, shell, read, glob, grep, edit, write, task, fetch, todo, search, (code, repo_clone, repo_overview)?, skill, patch, lsp?, plan?]` plus any custom/plugin tools (lines 239-257). `question` is only included when `OPENCODE_CLIENT` is `app`/`cli`/`desktop` or `OPENCODE_ENABLE_QUESTION_TOOL` is set; `code`/`repo_clone`/`repo_overview` are gated on `OPENCODE_EXPERIMENTAL_SCOUT`; `lsp` on `OPENCODE_EXPERIMENTAL_LSP_TOOL`; `plan` on `OPENCODE_EXPERIMENTAL_PLAN_MODE && OPENCODE_CLIENT === "cli"`. `webSearchEnabled(providerID)` (line 57) gates `websearch` behind the opencode-Zen provider or `OPENCODE_ENABLE_EXA` / `OPENCODE_ENABLE_PARALLEL` flags. The model-aware switch in `tools(input)` (line 307-319) swaps `edit`+`write` for the unified `apply_patch` tool when the model id contains `gpt-` (and not `gpt-4` or `*-oss`) — GPT-5 reasoning models prefer one big patch operation over many small edits.

### Tool definition shape

`packages/opencode/src/tool/tool.ts`:

```ts
export interface Def<Parameters, M extends Metadata = Metadata> {
  id: string
  description: string
  parameters: Parameters                                       // Effect Schema
  jsonSchema?: JSONSchema7
  execute(args, ctx: Context): Effect.Effect<ExecuteResult<M>>
  formatValidationError?(error: unknown): string
}
```

`Tool.define(id, init)` wraps the body so that on every call:
1. `Schema.decodeUnknownEffect(parameters)` validates args; on failure, the formatted error becomes a regular tool error the model can read and self-correct from.
2. Real execution runs under `Effect.withSpan("Tool.execute", { attributes: { "tool.name", "session.id", "message.id", "tool.call_id" } })`.
3. Output is post-processed by `Truncate.output(...)`: oversize tool outputs get truncated and the full output is written to a managed temp file. The metadata carries `{ truncated, outputPath }` so the model knows where to look. The whitelist in `agent.ts` allows `external_directory` reads of `Truncate.GLOB` automatically.

### Built-in tools (descriptions live as `.txt` next to each)

- `shell.ts` — bash/PowerShell execution with tree-sitter command parsing (`web-tree-sitter`) for permission scoping by binary, path, and flags. Permission requests carry the parsed `dirs`/`patterns`/`always` sets so users can approve `git status` once and have all future `git *` go through.
- `read.ts` / `write.ts` / `edit.ts` — file ops. `edit` requires the model to have read the file first ("You must use your `Read` tool at least once in the conversation before editing"); enforces exact string match; supports `replaceAll`. `apply_patch.ts` is a stripped-down unified-diff-like format used for GPT models.
- `glob.ts` / `grep.ts` — `ripgrep`-backed (see `packages/opencode/src/file/ripgrep.ts`).
- `webfetch.ts` / `websearch.ts` — HTTP fetch with HTML→markdown via `turndown`, and a web search tool whose backend depends on opencode-Zen or Exa/Parallel flags.
- `task.ts` — the subagent dispatcher. Asks `Permission.ask({ permission: "task", patterns: [subagent_type], always: ["*"] })`, spawns a child session inheriting filtered permissions from the parent, runs the subagent loop, returns the final response part. Subagent permissions are derived in `agent/subagent-permissions.ts`.
- `todo.ts` / `todowrite.txt` — durable todo list per session (own `todo` table in SQLite).
- `question.ts` — interactive question to the user; gated behind `OPENCODE_ENABLE_QUESTION_TOOL` for non-interactive runs.
- `skill.ts` — loads a skill body into context (see "Plugins, Modes & Custom Agents").
- `plan.ts` / `plan-enter.txt` / `plan-exit.txt` — mode-switching tools used by the `plan` agent.
- `lsp.ts` — opt-in LSP queries (experimental).
- `codesearch.ts` / `repo_clone.ts` / `repo_overview.ts` — experimental "scout" subagent's deep-research toolset, gated by `OPENCODE_EXPERIMENTAL_SCOUT`.
- `invalid.ts` — sink for malformed/non-existent tool calls (see `experimental_repairToolCall`).

### Permission gating

Every tool dispatch is permission-gated. `Permission.evaluate(permission, pattern, ...rulesets)` (`packages/opencode/src/permission/index.ts:128`) returns `{ permission, pattern, action: "allow" | "deny" | "ask" }`. The `ask` flow:

1. `Permission.ask({ id, sessionID, permission, patterns, always, metadata, ruleset })` evaluates each pattern against `ruleset` then the accumulated `approved` ruleset. `deny` throws `PermissionDeniedError`; `allow` passes; `ask` enqueues a request, publishes `Event.Asked` on the bus, and awaits a Deferred.
2. The TUI / client receives the SSE event, prompts the user, and calls `Permission.reply({ requestID, reply: "once" | "always" | "reject", message? })`.
3. On `always`, the request's `always` patterns are appended to `approved` and any other pending request that becomes allowable is auto-resolved.

The action levels are stored per project (`PermissionTable.data: Permission.Ruleset` in `session.sql.ts`) so "always allow `git status`" persists across sessions in the same project.

### Built-in agent permissions

`packages/opencode/src/agent/agent.ts:98-117` defines `defaults`:

```ts
const defaults = Permission.fromConfig({
  "*": "allow",
  doom_loop: "ask",
  external_directory: {
    "*": "ask",
    ...Object.fromEntries(whitelistedDirs.map((dir) => [dir, "allow"])),
  },
  question: "deny",
  plan_enter: "deny",
  plan_exit: "deny",
  repo_clone: "deny",
  repo_overview: "deny",
  // mirrors github.com/github/gitignore Node.gitignore pattern for .env files
  read: {
    "*": "allow",
    "*.env": "ask",
    "*.env.*": "ask",
    "*.env.example": "allow",
  },
})
```

`whitelistedDirs` is `Truncate.GLOB`, `Global.Path.tmp/*`, and the configured skill directories.

`build` adds `question: "allow"` and `plan_enter: "allow"`. `plan` adds `plan_exit: "allow"`, allow-lists `<Global.Path.data>/plans/*` for `external_directory`, and sets `edit: { "*": "deny", ".opencode/plans/*.md": "allow", … }` — i.e., the plan agent can write plan files into a project-local `.opencode/plans/` directory (and the mirrored global plans path) but nothing else. The user's `permission` config is merged last.

### MCP support

`packages/opencode/src/mcp/index.ts`. Three transports per `config/mcp.ts`:

- `Local` — spawns a stdio MCP server with `command: string[]`.
- `Remote` with `StreamableHTTPClientTransport` (the recommended modern transport).
- `Remote` with `SSEClientTransport` as fallback.

Remote MCP servers can require OAuth. `oauth-provider.ts` implements RFC 7591 dynamic client registration; `oauth-callback.ts` runs a tiny local callback server. The MCP status enum is `connected | disabled | failed | needs_auth | needs_client_registration`, surfaced in the TUI's `dialog-mcp.tsx`.

MCP tools are exposed to the model with sanitized names (`/[^a-zA-Z0-9_-]/g → _`, line 119). MCP prompts are exposed as opencode slash-commands (`packages/opencode/src/command/index.ts:112-138`). `ToolListChangedNotificationSchema` is honored: when an MCP server signals tool list change, `Bus.publish(ToolsChanged, { server })` fires and clients refetch.

### Plugin tools

A plugin can declare `tool: { [id: string]: ToolDefinition }` where `ToolDefinition` (from `@opencode-ai/plugin`) is `{ description, args: ZodRawShape, execute(args, ctx) }`. `registry.ts:139-187` wraps it: the Zod schema is converted to JSON Schema via `z.toJSONSchema(... { io: "input" })` and the model sees the original JSON Schema. Plugin tools run in the same process as the agent (not isolated) and have access to `ctx.directory`, `ctx.worktree`, `ctx.metadata(...)`, `ctx.ask(...)`. There is also a filesystem hook: any TypeScript or JavaScript file under `<config_dir>/{tool,tools}/*.{js,ts}` is auto-loaded as a tool, with the filename becoming the namespace.

## Sessions, Persistence & Sharing

### Storage

SQLite via Drizzle ORM (`packages/opencode/src/storage/db.ts`, `packages/opencode/AGENTS.md`). The DB path is `Global.Path.data / opencode.db` (with per-channel suffixes — `latest`, `beta`, etc.) or a `OPENCODE_DB` override. On first boot, `JsonMigration.run` (`src/index.ts:129`) migrates pre-1.x JSON state.

Key tables (`packages/opencode/src/session/session.sql.ts`):

- `session`: `id` (ULID-ish), `project_id` FK, `workspace_id`, `parent_id` (forks/subagents), `slug`, `directory`, `path`, `title`, `version`, `share_url`, `summary_*`, `revert` (json), `permission` (json), `agent`, `model` (json: `{id, providerID, variant}`), timestamps including `time_compacting` and `time_archived`.
- `message`: per assistant/user message; `data` is the v2 `MessageV2.Info` JSON minus id/sessionID.
- `part`: per `MessageV2.Part` (text, reasoning, tool, step-start, step-finish, patch, file, agent, subtask, compaction, …). Composite index `(message_id, id)` so streaming UIs can fetch a single message's parts efficiently.
- `todo`: per-session todo list (`(session_id, position)` composite PK).
- `session_message`: the new v2 session-message log keyed by `(session_id, type)`, written by the v2 session-message code path (`packages/opencode/src/v2/`).
- `permission`: the per-project `approved` ruleset.

Naming convention from `AGENTS.md`: snake_case columns, `<entity>_id` joins, `<table>_<column>_idx` indexes.

### Sessions, forks, subagents

`Session.create({ parentID?, title?, agent?, model?, permission?, workspaceID? })` creates a session row. `parentID` is used both for **forks** (`session.fork({ sessionID })` clones state at a point) and **subagent sessions** (the `task` tool creates a child session with `parentID: ctx.sessionID`). `session.children(id)` enumerates them.

The TUI exposes session forking via `dialog-fork-from-timeline.tsx` and `dialog-timeline.tsx`, letting the user "rewind" the session to a prior assistant message and branch.

### Revert / snapshot

`packages/opencode/src/snapshot/index.ts`. Snapshotting uses a **side git repo** kept out of the user's worktree:

```
gitdir = Global.Path.data / snapshot / <project.id> / <hash(worktree)>
```

Every `step-start` / `start` event captures a snapshot (`snapshot.track()`; pre-captured at `processor.ts:122` before the LLM stream starts). After `finish-step`, `snapshot.patch(hash)` produces a `Patch { hash, files }` (just the snapshot hash and the changed file list) which is stored as a `MessageV2.PatchPart`. `session.revert(messageID)` replays the patches in reverse. This works for non-git projects too because the side index is independent. `SessionRevert` (`session/revert.ts`) exposes the API.

### Compaction

`packages/opencode/src/session/compaction.ts` (and `session/overflow.ts`) handle context-window pressure. After every `finish-step`, `isOverflow` compares used tokens against the model's `limit.context` (with safety margin). When triggered, the loop:

1. Queues a `compaction` task.
2. On the next iteration, runs the `compaction` agent (hidden built-in, `agent.ts:228`) with `PROMPT_COMPACTION` (`agent/prompt/compaction.txt`) which asks the model to summarize the conversation so far.
3. Replaces the history with the summary and a synthetic `continue` user turn (gated by the `experimental.compaction.autocontinue` plugin hook, plugin contract line 314).
4. The plugin hook `experimental.session.compacting` lets plugins customize the compaction prompt entirely.

### Auto-summary

`packages/opencode/src/session/summary.ts`. After every `finish-step` (and on step 1 of every loop), a fire-and-forget `summary.summarize(...)` updates the session's `summary_*` columns (diff summary across the snapshot, file counts, additions/deletions). The data is surfaced in the share UI and the TUI sidebar.

### Sharing

A single share pipeline (`packages/opencode/src/share/share-next.ts`) chooses one of two destinations per request, based on `Account.active()` (lines 210-226):

- No active account/org: posts to `cfg.enterprise?.url ?? "https://opncd.ai"` using the legacy API surface.
- Active account/org: posts to `active.value.url` (the hosted console) with `Authorization: Bearer <token>` and `x-org-id`.

`packages/opencode/src/share/session.ts` exposes `create`, `share`, `unshare`. The pattern:

```ts
const share = Effect.fn("SessionShare.share")(function* (sessionID) {
  if (conf.share === "disabled") throw new Error("Sharing is disabled in configuration")
  const result = yield* shareNext.create(sessionID)
  yield* sync.run(Session.Event.Updated, { sessionID, info: { share: { url: result.url } } })
  return result
})
```

`SessionShare.create` auto-shares new sessions when `Flag.OPENCODE_AUTO_SHARE` or `share: "auto"`.

`ShareNext` (`packages/opencode/src/share/share-next.ts`) implements the actual sync. It subscribes to the bus (lines 183-204):

- `Session.Event.Updated` → push session data
- `MessageV2.Event.Updated` → push message and the user's model record
- `MessageV2.Event.PartUpdated` → push part
- `Session.Event.Diff` → push snapshot diff
- `Session.Event.Deleted` → remove share

Each event enqueues into a per-session debounced map (key dedup'd by `key(item)`), then `flush(sessionID)` fires 1s later (`Effect.delay(1000)`, line 138), posting JSON to `<baseUrl>/api/share/<id>/sync` (legacy) or `<baseUrl>/api/shares/<id>/sync` (console) with the share `secret`. The remote console can replay messages and parts to display a live, scrolling read-only view of the session — that is the "shareable session" link people see.

### Event sourcing (the v2 sync layer)

`packages/opencode/src/sync/README.md` documents this layer. Standard `Bus` events are fire-and-forget; the new `SyncEvent` system additionally **records every state-mutating event** in the dedicated `event` + `event_sequence` tables (`packages/opencode/src/sync/event.sql.ts`) with a monotonic per-aggregate `seq`. Definitions look like:

```ts
const Created = SyncEvent.define({
  type: "session.created",
  version: 1,
  aggregate: "sessionID",
  schema: Schema.Struct({ sessionID, info }),
})
SyncEvent.run(Created, { ... })
```

The model is single-writer: only one process owns the session, total ordering is trivial. "Projectors" (server/projectors.ts) consume the events to update database rows. The same events get re-published through the existing `Bus` for backwards compatibility, optionally reshaped through `busSchema`. This is the foundation for true session replay and multi-device sync that the road map keeps pointing to.

## Plugins, Modes & Custom Agents

### Agents (modes)

Agents are first-class. `packages/opencode/src/agent/agent.ts` ships with:

- `build` — default, full-access, `mode: "primary"`.
- `plan` — read-only-by-default plan mode, allows writing `.opencode/plans/*.md` only, edits otherwise denied.
- `general` — built-in subagent for "complex searches and multistep tasks" (mentioned in README), denies `todowrite`.
- `explore` — read-only exploration subagent (`grep`, `glob`, `list`, `read`, `bash`, `webfetch`, `websearch` allow-listed, everything else denied; `external_directory` reads gated on the whitelisted dirs only), prompted by `agent/prompt/explore.txt`.
- `scout` (experimental, behind `OPENCODE_EXPERIMENTAL_SCOUT`) — clones external repos into `Global.Path.repos` for deep research.
- `compaction`, `title`, `summary` — internal hidden agents used by the loop.

The user can declare additional agents in `opencode.json`:

```jsonc
{
  "agent": {
    "reviewer": {
      "mode": "subagent",
      "model": "anthropic/claude-sonnet-4",
      "prompt": "You are a careful code reviewer...",
      "permission": { "edit": { "*": "deny" } },
      "steps": 12
    }
  }
}
```

`Agent.Info` fields: `name`, `description`, `mode: subagent | primary | all`, `native`, `hidden`, `topP`, `temperature`, `color`, `permission` (Ruleset), `model`, `variant`, `prompt`, `options`, `steps`. Subagents are invoked via the `task` tool with `subagent_type: <name>`; primaries are the user-facing default for new sessions and are switched with the `Tab` key in the TUI (README.md:102). The `@<agent>` convention for invoking subagents in messages (e.g. `@general`) is backed by `AgentAttachment` in `packages/opencode/src/v2/session-prompt.ts:27`, which models it as a first-class prompt part type.

`Agent.generate({ description, model? })` (`agent.ts:369`) asks the current model to produce a fresh agent config from a natural-language description and returns `{ identifier, whenToUse, systemPrompt }`. The CLI exposes this as `opencode agent ...`.

### Skills

`packages/opencode/src/skill/index.ts`. Skills are markdown files (`SKILL.md`) with YAML frontmatter (`name`, `description`). The discovery walks (in order):

1. Built-in skill `customize-opencode` (bundled, content from `skill/prompt/customize-opencode.md`).
2. `~/.claude/skills/**/SKILL.md` (interop with Claude Code) and `~/.agents/skills/**/SKILL.md`.
3. Project-level `.claude/skills/...` and `.agents/skills/...` walked up the directory tree to the worktree.
4. `<config_dirs>/{skill,skills}/**/SKILL.md` — opencode-managed locations.
5. `skills.paths` (user-configured local paths) and `skills.urls` (remote URLs pulled by `Discovery.pull`).

Skills are surfaced two ways: as slash-commands (`Command.list` merges them in) and as descriptions in the `skill` tool's system message so the model can `skill(name)` to load one mid-conversation. `Skill.available(agent)` filters by `Permission.evaluate("skill", name, agent.permission)` so per-agent disabling is possible.

### Commands

`packages/opencode/src/command/index.ts`. Sources:

1. Built-ins: `init` (uses `command/template/initialize.txt` to guide AGENTS.md setup), `review` (uses `command/template/review.txt`, runs as a subtask).
2. User-defined under `cfg.command.<name>` with `{ agent?, model?, description?, template, subtask?, hints }`.
3. MCP prompts (each MCP server's `listPrompts` becomes a command).
4. Skills (a skill becomes a command using the skill body as the template).

Templates support `$1, $2, …` positional args and `$ARGUMENTS`. The TUI's command palette (`packages/opencode/src/cli/cmd/tui/context/command-palette.tsx`) shows them.

### Plugins

`@opencode-ai/plugin` package contract: `packages/plugin/src/index.ts`.

```ts
export type Plugin = (input: PluginInput, options?: PluginOptions) => Promise<Hooks>
export type PluginInput = {
  client: ReturnType<typeof createOpencodeClient>
  project: Project
  directory: string
  worktree: string
  experimental_workspace: { register(type: string, adapter: WorkspaceAdapter): void }
  serverUrl: URL
  $: BunShell
}
```

Hooks:

| Hook | Purpose |
| --- | --- |
| `event(input: { event })` | Listen to any server bus event. |
| `config(input: Config)` | Mutate config in memory. |
| `tool: { [id]: ToolDefinition }` | Register custom tools. |
| `auth: AuthHook` | Add a provider auth flow (oauth or api), with prompts and `authorize()`. |
| `provider: { id, models(provider, ctx) }` | Augment a provider's model list dynamically. |
| `chat.message` | Observe new user messages. |
| `chat.params` | Mutate `{ temperature, topP, topK, maxOutputTokens, options }` before send. |
| `chat.headers` | Inject HTTP headers per provider request. |
| `permission.ask` | Pre-empt `Permission.ask` by returning a decision. |
| `command.execute.before` | Modify parts before a command runs. |
| `tool.execute.before` / `tool.execute.after` | Mutate tool args / outputs. |
| `tool.definition` | Modify a tool's description/parameters as advertised to the LLM. |
| `shell.env` | Inject env vars into shell tool. |
| `experimental.chat.messages.transform` | Rewrite the whole message list. |
| `experimental.chat.system.transform` | Rewrite the system prompt stack. |
| `experimental.session.compacting` | Append extra context (or replace `prompt` entirely) before compaction starts. |
| `experimental.compaction.autocontinue` | Disable the synthetic "continue" turn after compaction. |
| `experimental.text.complete` | Final transform of assistant text parts. |

Plugins are configured under `plugin: ["@scope/pkg", ["@scope/pkg", { ...options }]]` in `opencode.json`. The loader (`packages/opencode/src/plugin/loader.ts`) handles npm install on demand, version compatibility checks, deprecation warnings, and entrypoint detection. Plugins receive an in-process `client` (uses `Server.Default().app.fetch` directly, no socket) so they can call any HTTP endpoint without overhead.

Several built-in plugins live under `packages/opencode/src/plugin/`: `codex.ts`, `github-copilot/`, `cloudflare.ts`, `azure.ts`. They primarily contribute auth flows for those providers.

The Plugin contract also has a `tui?: ...` slot (currently unused publicly per `PluginModule` typing — TUI plugins exist internally; see `packages/opencode/src/cli/cmd/tui/plugin/`).

### Workspace adapters (experimental)

`PluginInput.experimental_workspace.register(type, adapter)` (plugin/src/index.ts:48). A `WorkspaceAdapter` can implement custom `create / remove / configure / target` for non-local workspaces (e.g. ephemeral remote sandboxes). The `target()` returns either `{ type: "local", directory }` or `{ type: "remote", url, headers }`. This is the hook backing opencode's "containers" package.

## Server / Client Split

This is the most distinctive piece. opencode is structured as:

```
  ┌─────────────────────────────┐    ┌─────────────────────────────┐
  │ CLIENTS                     │    │ SERVER (opencode core)      │
  │ ───────────────────────     │    │ ───────────────────────     │
  │  TUI (OpenTUI/Solid)        │ ── HTTP/SSE ──► HttpApi router  │
  │  CLI run                    │    │   ├─ auth                   │
  │  Electron desktop           │    │   ├─ session group          │
  │  Web/Console (share viewer) │    │   ├─ file group             │
  │  ACP bridge (Zed et al.)    │    │   ├─ mcp / provider / pty   │
  │  3rd-party via SDK          │    │   ├─ permission / question  │
  └─────────────────────────────┘    │   ├─ workspace / v2 / tui   │
                                     │   └─ /event (SSE)           │
                                     │ Bus + SyncEvent + DB        │
                                     │ Provider + LLM + Processor  │
                                     │ Tool registry + MCP + LSP   │
                                     │ Plugins                     │
                                     └─────────────────────────────┘
```

### Transport details

- HTTP + SSE. WebSockets exist only for PTY connections (`ptyConnectRoute` in `httpapi/server.ts:149`).
- `GET /event?directory=...` opens an SSE stream that publishes every bus event. The server appends a `server.heartbeat` every 10s (`packages/opencode/src/server/routes/instance/httpapi/event.ts:42-66`) so proxies don't kill it. The stream lifecycle is tied to a `Bus.InstanceDisposed` sentinel.
- Per-request instance resolution: a request without an instance context (e.g. `/global/*`) is fine; instance-scoped routes require `x-opencode-directory` header or `?directory=` query, resolved by `instanceContextLayer` middleware.
- Auth: HTTP basic, `Authorization: Basic <base64(user:pass)>`. Server emits a warning if `OPENCODE_SERVER_PASSWORD` is unset (`packages/opencode/src/cli/cmd/serve.ts:15`).
- mDNS: when bound to non-loopback host with `--mdns`, the server publishes a Bonjour service named `opencode-<port>` of type `http` via `packages/opencode/src/server/mdns.ts`. This is how the mobile/desktop "find local opencode" UX works.

### SDK

`@opencode-ai/sdk` is generated from the server's OpenAPI by `@hey-api/openapi-ts`. The repo has a v1 SDK (`packages/sdk/js/src/`) and a v2 SDK (`./src/v2/`) coexisting during the v2 migration. v2 is what new code uses (`packages/opencode/src/cli/cmd/run.ts:24` imports `@opencode-ai/sdk/v2`). Plugins use the v1 SDK currently. Each `createOpencodeClient(config)` returns a fully-typed RPC-style client (`sdk.session.prompt(...)`, `sdk.provider.list()`, `sdk.permission.reply(...)`, …) with optional fetch override (`fetch: (...args) => Server.Default().app.fetch(...args)` for in-process calls — see `packages/opencode/src/plugin/index.ts:125-130`).

### ACP (Agent Client Protocol)

`packages/opencode/src/acp/` implements the [Agent Client Protocol](https://agentclientprotocol.com/) spec v1 over JSON-RPC/stdio using `@agentclientprotocol/sdk`. `opencode acp` is the entrypoint. README notes Zed integration:

```jsonc
{ "agent_servers": { "OpenCode": { "command": "opencode", "args": ["acp"] } } }
```

ACP sessions map onto opencode internal sessions; tool execution goes through the existing tool registry. Some pieces are still stubbed (streaming responses, tool-call reporting in progress).

### Worker model

The TUI runs the actual server in a Bun **worker** process (`packages/opencode/src/cli/cmd/tui/worker.ts`) and uses a thin RPC channel (`Rpc.emit`, the `rpc.fetch(...)` shim) to talk to it. This means: the TUI is responsive even when the server is busy spinning a long LLM call; signals/Ctrl-C affect the worker; the same TUI binary can either spawn its own worker or attach to a remote server with no code change.

## Design Philosophy & Distinctive Choices

The README's FAQ explicitly contrasts opencode with Claude Code (README.md:133-137):

> - 100% open source
> - Not coupled to any provider. Although we recommend the models we provide through OpenCode Zen, OpenCode can be used with Claude, OpenAI, Google, or even local models. As models evolve, the gaps between them will close and pricing will drop, so being provider-agnostic is important.
> - Built-in opt-in LSP support
> - A focus on TUI. OpenCode is built by neovim users and the creators of terminal.shop; we are going to push the limits of what's possible in the terminal.
> - A client/server architecture. This, for example, can allow OpenCode to run on your computer while you drive it remotely from a mobile app, meaning that the TUI frontend is just one of the possible clients.

What that looks like in the code:

- **API-first, UI-last.** Every UI decision is a client decision; the server has no opinion about whether you're typing in a terminal, clicking in Electron, or chatting from a mobile app. The OpenAPI doc is published at `/doc`. The plugin and SDK packages are first-class.
- **Provider-agnosticism is structural, not nominal.** The provider list is dynamic (`https://models.dev`), the SDK is `@ai-sdk/*`, and the agent loop only ever sees a `LanguageModelV3`. New providers are mostly a `BUNDLED_PROVIDERS` entry plus optional `custom` hook.
- **Effect everywhere.** The codebase is dogmatically Effect-ish. `packages/opencode/AGENTS.md` and `packages/opencode/specs/effect/migration.md` (referenced from AGENTS) document Service/Layer patterns, `InstanceState` for per-project state with `ScopedCache` cleanup, `Effect.cached` for in-flight dedup, `Instance.bind` for native callback ALS, branded `Schema` types. The result is uniform tracing, structured concurrency, and deterministic teardown.
- **Hand-tuned prompts per provider.** Eight provider-flavored system prompts live in `session/prompt/`. Each starts "You are OpenCode, the best coding agent on the planet" but the rest is shaped to the model's quirks.
- **Sessions as event streams, with a sync log.** The `sync/` README spells this out: events are recorded before mutation, projectors apply them, and the same events flow through the bus for backwards compatibility. This is the foundation for replay, sharing, and eventual multi-device sync.
- **Permissioning is pattern-based and persistable.** Every dangerous operation (`shell`, `edit`, `task`, `external_directory`, `doom_loop`, `repo_clone`) flows through `Permission.ask` with `patterns: [...]` and `always: [...]`. Approve-once vs approve-always lives in the data, not in cached agent state.
- **`AGENTS.md` is the source of contract.** opencode reads `AGENTS.md` for its own development, ships `init` and `review` commands to seed AGENTS.md in user repos, and built-in skills like `customize-opencode` are scoped tightly to "only when editing opencode's own config." It's a small but consistent bet that this convention will become standard across agent tools.
- **Composability with Claude Code conventions.** The skill discovery walks `~/.claude/skills/` and project `.claude/skills/`. Plugin tools accept Zod schemas. The Anthropic system prompt is structurally similar. The pitch is: bring your existing artifacts, swap providers freely.

### Representative snippet — the top-level loop, heavily trimmed

Paraphrased from `packages/opencode/src/session/prompt.ts:1625-1853`. Variable destructuring, error handling, the queued-subtask/compaction branches, and `Effect.ensuring` cleanup are elided for brevity.

```ts
const runLoop = Effect.fn("SessionPrompt.run")(function* (sessionID) {
  let step = 0
  const session = yield* sessions.get(sessionID).pipe(Effect.orDie)

  while (true) {
    yield* status.set(sessionID, { type: "busy" })
    let msgs = yield* MessageV2.filterCompactedEffect(sessionID)
    /* find lastUser, lastAssistant, lastFinished, queued tasks/compactions */
    if (/* lastAssistant.finish && no tool-calls && older than user */) break

    step++
    if (step === 1) yield* title({ ... }).pipe(Effect.ignore, Effect.forkIn(scope))

    const model = yield* getModel(lastUser.model.providerID, lastUser.model.modelID, sessionID)
    const agent = yield* agents.get(lastUser.agent)
    const maxSteps = agent.steps ?? Infinity
    const isLastStep = step >= maxSteps

    const handle = yield* processor.create({ assistantMessage: msg, sessionID, model })

    const tools = yield* resolveTools({ agent, session, model, tools: lastUser.tools, ... })
    if (lastUser.format?.type === "json_schema") tools["StructuredOutput"] = createStructuredOutputTool({...})
    if (step === 1) yield* summary.summarize({ sessionID, messageID: lastUser.id })
                                  .pipe(Effect.ignore, Effect.forkIn(scope))

    yield* plugin.trigger("experimental.chat.messages.transform", {}, { messages: msgs })

    const [skills, env, instructions, modelMsgs] = yield* Effect.all([
      sys.skills(agent), sys.environment(model), instruction.system(), MessageV2.toModelMessagesEffect(msgs, model),
    ])

    const result = yield* handle.process({
      user: lastUser, agent, sessionID, model,
      permission: session.permission,
      system: [...env, ...instructions, ...(skills ? [skills] : [])],
      messages: [...modelMsgs, ...(isLastStep ? [{ role: "assistant", content: MAX_STEPS }] : [])],
      tools,
      toolChoice: lastUser.format?.type === "json_schema" ? "required" : undefined,
    })

    if (result === "stop") return "break"
    if (result === "compact") yield* compaction.create({ sessionID, ... })
    // else continue
  }
})
```

## Key Takeaways

- **opencode is an HTTP-and-SSE service, not a CLI.** The CLI, TUI, desktop app, mobile, and Zed ACP bridge are all clients of the same typed HTTP API; the SDK is generated from the OpenAPI spec. This is what makes "run on your machine, drive from your phone" actually work.
- **Provider abstraction is delegated to the AI SDK plus a live models.dev catalog.** Twenty-ish providers, including local ones via `@ai-sdk/openai-compatible`, all flow through a single `LanguageModelV3` interface; new models appear within an hour without code changes.
- **The agent loop is two nested loops and one stream.** Session-level loop in `session/prompt.ts:runLoop` decides when to compact, summarize, fork to subagents, or stop. Per-turn processor in `session/processor.ts` consumes AI-SDK stream events and projects them into a typed message-part graph. The actual model call is `streamText(...)` in `session/llm.ts:run`. Provider-specific system prompts and provider-aware options merging happen in those last two files.
- **Sessions are event-sourced and snapshot-versioned.** A monotonic `SyncEvent` log records every state change; a side git directory snapshots files at every step. This gives free `session.revert(messageID)`, share-link replay, and the foundation for multi-device sync — all without ever putting state in a `.opencode` directory that pollutes the user's worktree.
- **Permissions are a first-class system, not a tool flag.** `Permission.Ruleset` is `Array<{ permission, pattern, action: allow|deny|ask }>`, evaluated with wildcards, merged from agent defaults + user config + session ruleset, persisted per project. Every shell command, file edit, external read, `task` invocation, and even repeated identical tool calls (`doom_loop`) flows through the same Ask/Reply machinery.
- **Extensibility is heavily layered: plugins → custom tools → custom agents → skills → MCP → commands.** Each has its own contract and lifecycle, but they unify through the registry and the system-prompt assembly. Claude-Code's `.claude/skills/` and `AGENTS.md` conventions are first-class citizens; bringing existing artifacts requires no rewrite.
- **Effect.ts is load-bearing.** The codebase is a study in Effect Service/Layer composition; everything from the HTTP server (`HttpApi`/`HttpRouter`) to the LLM stream (`Stream.fromAsyncIterable`), tool execution (`Effect.withSpan`), permission deferred awaits, retry policies (`Schedule.fromStepWithMetadata`), and instance lifecycle (`InstanceState.make` with `ScopedCache`) is uniform. This is unusual for an AI tool and is worth highlighting as a stylistic differentiator.
