# pi-mono

## Overview

pi (the "pi coding agent", package `@earendil-works/pi-coding-agent`, binary `pi`) is a hand-crafted minimal terminal coding agent by Mario Zechner ("badlogic"), distributed from the `earendil-works/pi-mono` monorepo. It is a Node-first, TypeScript codebase organized as a five-package npm workspace where the agent runtime, the LLM client, the TUI, and the coding-agent CLI are split into reusable libraries. The project's distinguishing posture is editorial restraint: the core ships four tools (`read`, `write`, `edit`, `bash`) plus three read-only ones (`grep`, `find`, `ls`), and explicitly refuses to ship sub-agents, plan mode, to-do tracking, background bash, permission popups, or MCP. Everything else - including those refused features - is expected to be built as a TypeScript Extension or installed as a Pi Package. pi-skills, a sibling repo, is explicit about interoperating with Claude Code, Codex CLI, Amp, and Droid by reusing the Agent Skills `SKILL.md` format.

## Architecture

### Runtime, language, build

- 100% TypeScript, ESM, Node `>=20.0.0` for the libraries, `>=20.6.0` for the coding-agent. Bun is supported as an optional compiled-binary target (`npm run build:binary` calls `bun build --compile`) but Node is the canonical runtime - see `packages/coding-agent/package.json:32-38`.
- Build is performed with `@typescript/native-preview` (`tsgo`), `biome` for lint/format, `vitest` for tests, see `package.json:13-22`.
- The repo ships a top-level `pi-test.sh` for running pi from sources from any directory (referenced in `AGENTS.md:71` for tmux-based TUI testing).

### Monorepo layout (`packages/`)

The top-level `package.json` declares the workspace (`package.json:5-12`). Five packages plus example/extension workspaces:

| Package | Path | Purpose |
|---|---|---|
| `@earendil-works/pi-ai` | `packages/ai` | Provider-agnostic LLM streaming/completion client, model registry, OAuth helpers |
| `@earendil-works/pi-agent-core` | `packages/agent` | Stateful `Agent` class and low-level `agentLoop()` over `pi-ai` |
| `@earendil-works/pi-coding-agent` | `packages/coding-agent` | The `pi` CLI: tools, sessions, extensions, skills, TUI |
| `@earendil-works/pi-tui` | `packages/tui` | Terminal UI library with differential rendering, used by the interactive mode |
| `@earendil-works/pi-web-ui` | `packages/web-ui` | Web components for provider dialogs and model discovery |

Dependencies flow: `pi-ai` → `pi-agent-core` → `pi-coding-agent`, with `pi-tui` consumed by `pi-coding-agent` and `pi-web-ui` (`packages/coding-agent/package.json:40-43`). Versions are lockstep ("All packages always share the same version number" - `AGENTS.md:178`).

### CLI entry points and run modes

The binary is registered as `"bin": { "pi": "dist/cli.js" }` in `packages/coding-agent/package.json:9`. `src/cli.ts` is a 20-line shim that imports `main` from `src/main.ts` and configures undici (the global HTTP dispatcher) to disable body and headers timeouts so long-stalling local LLMs don't get severed (`packages/coding-agent/src/cli.ts:17-20`).

`src/main.ts` is the actual entry point. It supports four modes selected by `parseArgs()`:

- `interactive` - the default; runs `InteractiveMode` (TUI) (`src/main.ts:687-711`)
- `print` / `-p` - one-shot non-interactive, prints answer to stdout, also auto-selected when stdin is not a TTY so `cat README.md | pi -p "summarize"` works (`src/main.ts:104-109`, `630-637`)
- `json` (via `--mode json`) - same as print but emits structured JSONL events
- `rpc` (via `--mode rpc`) - strict LF-delimited JSON-RPC over stdin/stdout for process integration

A `--export` flag short-circuits the agent entirely and exports a session JSONL to HTML (`src/main.ts:461-473`).

### Turn flow at the top level

The flow from terminal input to a model response, traced through the source:

1. **CLI parse + mode resolution** - `parseArgs` (`src/cli/args.ts`), `resolveAppMode` (`src/main.ts:98`).
2. **Session resolution** - `createSessionManager` picks between in-memory, fork, `--session <path|id>`, `--resume`, `--continue`, or fresh (`src/main.ts:214-285`). Sessions are JSONL files under `~/.pi/agent/sessions/<cwd-hash>/` with a tree structure for branching.
3. **Runtime construction** - `createAgentSessionRuntime` (`src/core/agent-session-runtime.ts`) calls `createAgentSessionServices` which loads settings, builds the `ModelRegistry`, builds the `ResourceLoader` (extensions + skills + prompts + themes + context files + system prompt), and constructs the `AgentSession`.
4. **Initial input assembly** - `prepareInitialMessage` merges `@file` arguments, piped stdin, and positional messages (`src/main.ts:115-134`, `src/cli/initial-message.ts`).
5. **Mode loop** - `InteractiveMode.run()`, `runPrintMode()`, or `runRpcMode()` calls `session.prompt(text, opts)` on `AgentSession`, which delegates to the underlying `Agent` from `pi-agent-core`.
6. **Agent loop** - see next section.

## Agent Loop

The loop has two layers:

1. **`Agent`** (`packages/agent/src/agent.ts`) - stateful wrapper that owns the transcript, the steering/follow-up queues, and one active `AbortController` per run.
2. **`agentLoop` / `agentLoopContinue`** (`packages/agent/src/agent-loop.ts`) - the pure async-generator-style loop that does the real work.

### `agentLoop()` core

Defined in `packages/agent/src/agent-loop.ts:31-93`. Returns an `EventStream<AgentEvent, AgentMessage[]>` that terminates on the `agent_end` event. The loop body is `runLoop()` (`agent-loop.ts:155-269`):

```ts
// agent-loop.ts:174-254 (abridged)
while (hasMoreToolCalls || pendingMessages.length > 0) {
  if (!firstTurn) await emit({ type: "turn_start" });
  for (const m of pendingMessages) {        // inject steering messages
    await emit({ type: "message_start", message: m });
    await emit({ type: "message_end",   message: m });
    currentContext.messages.push(m);
  }
  const message = await streamAssistantResponse(currentContext, config, signal, emit, streamFn);
  if (message.stopReason === "error" || message.stopReason === "aborted") {
    await emit({ type: "agent_end", messages: newMessages }); return;
  }
  const toolCalls = message.content.filter(c => c.type === "toolCall");
  if (toolCalls.length > 0) {
    const batch = await executeToolCalls(currentContext, message, config, signal, emit);
    toolResults.push(...batch.messages);
    hasMoreToolCalls = !batch.terminate;
  }
  await emit({ type: "turn_end", message, toolResults });
  if (await config.shouldStopAfterTurn?.({...})) { await emit({type:"agent_end",messages:newMessages}); return; }
  pendingMessages = (await config.getSteeringMessages?.()) || [];
}
```

Notable invariants of the loop:

- **Streaming bridge.** `streamAssistantResponse` (`agent-loop.ts:275-368`) is the only place where `AgentMessage[]` is converted to LLM `Message[]`. It runs `config.transformContext` (optional pruning/compaction hook), then `config.convertToLlm` (required filter for custom message types), then `streamSimple` (defaulted from `pi-ai`). As each provider event arrives (`start`, `text_delta`, `toolcall_delta`, …) it re-emits `message_update` events with the running partial message so the TUI can stream tokens.
- **Two-tier interruption.** Steering messages (`Enter` in interactive mode) are checked at the *end of each turn* before the next LLM call - see `pendingMessages = (await config.getSteeringMessages?.())` at `agent-loop.ts:253`. Follow-up messages (`Alt+Enter`) are only checked when the loop would otherwise exit, then re-arm the outer `while(true)` loop (`agent-loop.ts:257-262`). The README describes this verbatim: "Enter queues a steering message, delivered after the current assistant turn finishes executing its tool calls. Alt+Enter queues a follow-up message, delivered only after the agent finishes all work" (`packages/coding-agent/README.md:215-220`).
- **`shouldStopAfterTurn` and `prepareNextTurn`.** These config callbacks are the integration points session-level compaction and "stop after summarization" features hook into - they fire *after* `turn_end` and *before* steering polling, so they can mutate the context or model for the next turn (`agent-loop.ts:226-251`).
- **Retries.** Aborts and provider errors bubble back as a final assistant message with `stopReason: "aborted" | "error"`, the loop exits, and the higher layer (`AgentSession`) decides whether to re-issue with `agent.continue()`. Provider-level retries (rate limit backoff etc.) live inside `pi-ai`'s stream functions, controlled by `maxRetryDelayMs` in `AgentLoopConfig`.

### Tool batch execution

`executeToolCalls` (`agent-loop.ts:373-388`) dispatches to one of two implementations based on `config.toolExecution` (`"parallel"` default, `"sequential"`) plus per-tool overrides:

```ts
// agent-loop.ts:380-388
const hasSequentialToolCall = toolCalls.some(
  (tc) => currentContext.tools?.find((t) => t.name === tc.name)?.executionMode === "sequential",
);
if (config.toolExecution === "sequential" || hasSequentialToolCall) {
  return executeToolCallsSequential(...);
}
return executeToolCallsParallel(...);
```

If *any* call in the batch targets a `executionMode: "sequential"` tool, the entire batch becomes sequential - this is the safety hatch the built-in `bash`, `edit`, `write` tools use to avoid concurrent file mutation (see `packages/coding-agent/src/core/tools/file-mutation-queue.ts` and `tools/edit.ts`).

Each tool call goes through `prepareToolCall` → `executePreparedToolCall` → `finalizeExecutedToolCall` (`agent-loop.ts:552-684`). `prepareToolCall` calls `tool.prepareArguments?` (an arg-shim for provider quirks), then `validateToolArguments` (TypeBox validation re-exported from `pi-ai`), then the `beforeToolCall` hook which can block execution by returning `{ block: true, reason }`. `executePreparedToolCall` calls `tool.execute(toolCallId, args, signal, onUpdate)`, threading the `AbortSignal` from the active run. `finalizeExecutedToolCall` runs the `afterToolCall` hook, which can rewrite content/details/isError or set `terminate: true`.

The batch only terminates the loop when *every* finalized tool result sets `terminate: true` (`agent-loop.ts:534-536`). This is the mechanism extensions use to short-circuit further LLM calls after a `notify_done`-style tool fires.

### Event model

`Agent.subscribe()` registers an async listener that receives every `AgentEvent`. Awaited listeners block before the next phase emits, which is how `AgentSession` makes session persistence and extension dispatch deterministic. Event types (`packages/agent/src/types.ts` and `README.md:144-156`):

| Event | When |
|---|---|
| `agent_start` / `agent_end` | Begin/end of a `prompt()` or `continue()` run |
| `turn_start` / `turn_end` | One LLM call + tool execution; `turn_end.toolResults` lists results in assistant source order |
| `message_start` / `message_update` / `message_end` | Any role; `message_update` carries the raw `assistantMessageEvent` delta from `pi-ai` |
| `tool_execution_start` / `tool_execution_update` / `tool_execution_end` | Per tool call; `_update` is the streaming progress callback |

Note: in parallel mode, `tool_execution_end` events fire in *completion* order, but the persisted `toolResult` transcript entries still go back in *assistant source* order (`README.md:103-107`).

## Tool System

### Built-in tools

All under `packages/coding-agent/src/core/tools/`. The registry is declared in `tools/index.ts:83-84`:

```ts
export type ToolName = "read" | "bash" | "edit" | "write" | "grep" | "find" | "ls";
export const allToolNames: Set<ToolName> = new Set(["read","bash","edit","write","grep","find","ls"]);
```

The default-on set is the four coding tools (`createCodingTools` at `tools/index.ts:168-175`); `grep`, `find`, `ls` are read-only extras (`createReadOnlyTools` at `tools/index.ts:177-184`).

Each tool lives in a single file with both an `AgentTool` factory (for use by the agent loop, see `bash.ts`, `read.ts`, etc.) and a `ToolDefinition` factory (for use by the extension/UI layer, which adds `renderCall`/`renderResult`/`label`/`promptSnippet`). Example excerpt for `bash` (`tools/bash.ts:23-26`):

```ts
const bashSchema = Type.Object({
  command: Type.String({ description: "Bash command to execute" }),
  timeout: Type.Optional(Type.Number({ description: "Timeout in seconds (optional, no default timeout)" })),
});
```

Tools use TypeBox schemas exclusively. `validateToolArguments` (re-exported from `pi-ai`) runs every call through TypeBox's strict validator before the tool sees args; validation failure becomes a `toolResult` with `isError: true` so the model can self-correct.

### Pluggable operations

Every built-in tool has a pluggable operations interface so the *transport* of the side-effect can be swapped:

- `BashOperations` (`tools/bash.ts:39-57`) is `{ exec(cmd, cwd, opts) }`. The default implementation `createLocalBashOperations` spawns a shell via Node `child_process.spawn` (`tools/bash.ts:65-100`); SSH and sandbox extensions provide their own implementations. The user-bash event (`!cmd` / `!!cmd` editor prefix) is an event extensions can intercept to inject replacement operations - see `UserBashEventResult.operations` (`extensions/types.ts:990-996`).
- `ReadOperations`, `WriteOperations`, `EditOperations`, `GrepOperations`, `FindOperations`, `LsOperations` follow the same pattern.

This is the seam that `pi-ssh-remote` and sandbox extensions use to redirect every file/command operation to a remote host without forking pi internals.

### Tool definition shape

`ToolDefinition` (extensions/types.ts:426-473`) is the shape every tool the LLM can call - whether built-in, registered via an extension, or registered via the SDK:

```ts
interface ToolDefinition<TParams extends TSchema, TDetails, TState> {
  name: string;
  label: string;                           // UI display
  description: string;                     // sent to LLM
  promptSnippet?: string;                  // one-line under "Available tools"
  promptGuidelines?: string[];             // appended bullets in Guidelines
  parameters: TParams;                     // TypeBox schema
  renderShell?: "default" | "self";
  prepareArguments?: (args: unknown) => Static<TParams>;
  executionMode?: ToolExecutionMode;       // "sequential" | "parallel"
  execute(toolCallId, params, signal, onUpdate, ctx): Promise<AgentToolResult<TDetails>>;
  renderCall?: (...) => Component;         // pi-tui Component for streaming UI
  renderResult?: (...) => Component;
}
```

`execute` is sync-or-async, gets the abort signal, an `onUpdate` callback that emits `tool_execution_update` events with partial state, and the `ExtensionContext` for accessing UI primitives. Tools throw on failure; the agent loop catches and converts thrown errors into `toolResult` content with `isError: true` (see `executePreparedToolCall` at `agent-loop.ts:604-639`).

### Permission gating

There is no built-in permission UI. Permission gating is an explicit non-goal of the core (`packages/coding-agent/README.md:476`: "No permission popups. Run in a container, or build your own confirmation flow with extensions inline with your environment and security requirements"). Extensions implement gating via `pi.on("tool_call", …)` returning `{ block: true, reason }`. The extension docs example demonstrates the pattern (`packages/coding-agent/docs/extensions.md:69-74`):

```ts
pi.on("tool_call", async (event, ctx) => {
  if (event.toolName === "bash" && event.input.command?.includes("rm -rf")) {
    const ok = await ctx.ui.confirm("Dangerous!", "Allow rm -rf?");
    if (!ok) return { block: true, reason: "Blocked by user" };
  }
});
```

Several community extensions implement layered permission systems (`pi-hooks/permission`, `toolwatch`, `security`) instead of the core doing so. See "Ecosystem & Interoperability" below.

### CLI tool selection

The user has three knobs (`packages/coding-agent/README.md:548-555`):

- `--tools <list>` / `-t <list>` - allowlist specific tools across built-in, extension, and custom
- `--no-builtin-tools` / `-nbt` - disable built-ins but keep extension/custom
- `--no-tools` / `-nt` - disable all

`AgentSession` enforces the allowlist when assembling `agent.state.tools` per turn.

### MCP support

There is none in the core. `packages/coding-agent/README.md:472` is unusually direct: "No MCP. Build CLI tools with READMEs (see Skills), or build an extension that adds MCP support." A blog post link is provided as rationale: `mariozechner.at/posts/2025-11-02-what-if-you-dont-need-mcp/`. The ecosystem includes `pi-acp` (Agent Client Protocol adapter) for the inverse direction - exposing pi as an ACP server - but no first-party MCP client. Extensions are expected to fill this gap if needed.

## Skills & Extensions

pi separates "what the model can read" (Skills) from "what the host can do" (Extensions). Both flow through the same Resource Loader.

### Skills - on-demand capability packages

Skills are markdown files following the Agent Skills v1 spec (https://agentskills.io). Loader logic lives in `packages/coding-agent/src/core/skills.ts`. The minimum schema (`skills.ts:68-82`):

```ts
interface Skill {
  name: string;            // matches parent directory name; a-z0-9- only, ≤64 chars
  description: string;     // required, ≤1024 chars
  filePath: string;        // path to SKILL.md or *.md
  baseDir: string;         // dirname for {baseDir} placeholder resolution
  sourceInfo: SourceInfo;
  disableModelInvocation: boolean;
}
```

Discovery rules (`skills.ts:165-176`): if a directory contains a `SKILL.md`, that dir is the skill root and recursion stops. Otherwise, any loose `*.md` files in the root are loaded as skills, and subdirectories are recursed looking for nested `SKILL.md`s.

Default lookup roots (`skills.ts:447-453`):

- `~/.pi/agent/skills/` (user) and `.pi/skills/` (project) when `includeDefaults: true`
- Anywhere on disk via explicit `--skill <path>` flags

Skills are surfaced to the model by `formatSkillsForPrompt` (`skills.ts:340-366`), which produces XML the system prompt embeds verbatim. Critically, the model isn't given the skill body - it's given only `name`, `description`, and `<location>filePath</location>`, and instructed to call `read` if the description matches:

```
The following skills provide specialized instructions for specific tasks.
Use the read tool to load a skill's file when the task matches its description.
When a skill file references a relative path, resolve it against the skill directory
...
<available_skills>
  <skill>
    <name>brave-search</name>
    <description>Web search and content extraction via Brave Search API...</description>
    <location>/Users/.../pi-skills/brave-search/SKILL.md</location>
  </skill>
</available_skills>
```

The `{baseDir}` placeholder convention used in `pi-skills` (see `pi-skills/README.md:99-101`) is a convention enforced by the *system prompt*, not by the loader - the prompt tells the model to substitute the file's directory whenever it sees a relative path.

Skills can opt out of automatic invocation via `disable-model-invocation: true` in frontmatter (`skills.ts:69-72`); these can only be invoked explicitly via `/skill:name` commands.

### Claude-Code/Codex/Amp interop

The `SKILL.md` format is intentionally lifted from Claude Code so the same skill works in both ecosystems. `pi-skills/README.md` documents this explicitly: "compatible with Claude Code, Codex CLI, Amp, and Droid" (line 3) and provides identical-content install instructions for `~/.pi/agent/skills/pi-skills`, `~/.codex/skills/pi-skills`, `~/.config/amp/tools/pi-skills`, `~/.factory/skills/pi-skills`, and (with one wrinkle, since Claude Code only looks one directory deep) symlinked entries under `~/.claude/skills/<skill>` (`pi-skills/README.md:43-70`). pi additionally honours `~/.agents/skills/` and `.agents/skills/` paths (`packages/coding-agent/README.md:341`) so it can pick up skills laid out for a generic agent.

### Extensions - TypeScript modules that extend the host

Extensions are arbitrary TypeScript modules loaded with `jiti` at startup. They are *not* sandboxed: `packages/coding-agent/README.md:385` warns explicitly that "Pi packages run with full system access". The minimal extension is a default-exported factory:

```ts
// packages/coding-agent/docs/extensions.md:60-99
export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => ctx.ui.notify("loaded"));
  pi.on("tool_call", async (event, ctx) => { /* block dangerous bash */ });
  pi.registerTool({ name: "greet", label: "Greet", description: "...",
                    parameters: Type.Object({name: Type.String()}),
                    async execute(id, params) { return { content: [{type:"text",text:`Hello, ${params.name}!`}], details: {} }; } });
  pi.registerCommand("hello", { description: "Say hello", handler: async (args, ctx) => ctx.ui.notify("hi") });
}
```

The factory may be async; pi awaits it before startup continues, which lets extensions fetch remote model lists before calling `pi.registerProvider()` (`packages/coding-agent/README.md:357`).

The `ExtensionAPI` (`packages/coding-agent/src/core/extensions/types.ts:1084-1311`) is the entire host surface. It exposes:

- **Event subscription.** Twenty-plus overloaded `on(event, handler)` signatures covering `session_*`, `agent_*`, `turn_*`, `message_*`, `tool_*`, `model_select`, `thinking_level_select`, `user_bash`, `input`, `before_provider_request`, `after_provider_response`, `before_agent_start`, `session_before_compact`, `session_before_tree`, `session_before_fork`, etc. Handlers may return result objects to block, transform, replace, or cancel the corresponding action.
- **Registration.** `registerTool`, `registerCommand`, `registerShortcut`, `registerFlag`, `registerMessageRenderer`, `registerProvider`/`unregisterProvider`.
- **Actions.** `sendMessage`, `sendUserMessage`, `appendEntry`, `setSessionName`, `setLabel`, `exec`, `getActiveTools`/`setActiveTools`, `getCommands`.
- **Model control.** `setModel`, `getThinkingLevel`/`setThinkingLevel`.
- **Event bus.** `events: EventBus` for extension-to-extension communication.

The accompanying `ExtensionUIContext` (`types.ts:124-275`) is the host-side UI surface that extensions render against: `select`, `confirm`, `input`, `notify`, `custom` (mount an arbitrary `pi-tui` `Component` with focus, optionally as an overlay), `setWidget` (above/below editor), `setHeader`, `setFooter` (replace the powerline-style footer entirely), `setEditorComponent` (replace the input editor - the example wires a `VimEditor`), `setWorkingIndicator`, `setTitle`, `setHiddenThinkingLabel`. Almost every visible piece of the TUI can be swapped or augmented by an extension.

`ExtensionCommandContext` (`types.ts:333-364`) extends the basic context with session-control methods that are only safe inside user-initiated commands: `waitForIdle`, `newSession`, `fork`, `navigateTree`, `switchSession`, `reload`.

Extensions can also implement OAuth providers via `registerProvider({ oauth: { login, refreshToken, getApiKey } })` (`types.ts:1336-1347`), which is what `pi-synthetic` and corporate-SSO providers use.

### Hot reload

Extensions, skills, prompt templates, and context files are reloaded by `/reload`. Themes hot-reload automatically when their file changes on disk (`packages/coding-agent/README.md:377`).

### Pi Packages

A "Pi Package" is just an npm package or git repo with a `pi` key in its `package.json` declaring directories to scan:

```json
{ "keywords": ["pi-package"],
  "pi": { "extensions": ["./extensions"], "skills": ["./skills"],
          "prompts": ["./prompts"], "themes": ["./themes"] } }
```

(`packages/coding-agent/README.md:411-424`). Without a manifest, pi auto-discovers from the conventional directory names. The `pi install` / `pi remove` / `pi update` / `pi list` CLI commands manage packages, with sources of the form `npm:@scope/pkg[@version]`, `git:host/repo[@ref]`, `https://...`, or `ssh://...` (`packages/coding-agent/README.md:387-407`). `pi config` enables/disables resources from installed packages without removing them.

## Configuration, Status Line & TUI

### Configuration paths

Defined in `packages/coding-agent/src/config.ts`:

- `APP_NAME` defaults to `"pi"` (`config.ts:421`); the binary name (and config dir prefix) can be overridden by a downstream package's `piConfig.name` (`config.ts:419-422`). This is how forks redistribute under different names without code changes.
- `CONFIG_DIR_NAME = ".pi"` by default (`config.ts:423`).
- `getAgentDir()` returns `$PI_CODING_AGENT_DIR ?? ~/.pi/agent/` (`config.ts:449-455`).
- Notable subpaths: `~/.pi/agent/auth.json`, `models.json`, `settings.json`, `keybindings.json`, `prompts/`, `extensions/`, `skills/`, `themes/`, `sessions/`, `bin/`, plus per-project `.pi/<same names>`.

Settings precedence: project `.pi/settings.json` overrides global `~/.pi/agent/settings.json`. Settings cover thinking level, theme, message delivery mode, transport preference, image auto-resize, compaction thresholds, and more.

### Status line / footer

The default footer is `FooterComponent` (`packages/coding-agent/src/modes/interactive/components/footer.ts`). It renders two or three lines depending on whether any extensions have set status entries:

1. **PWD line** - `~` -collapsed cwd with `(git-branch)` and `• session-name` appended (`footer.ts:92-109`).
2. **Stats line** - `↑in ↓out Rcache_read Wcache_write $cost X%/contextWindow (auto) ... model_id • thinking_level` (`footer.ts:112-194`). Context % is color-coded: error (red) above 90 %, warning (yellow) above 70 %.
3. **Extension status line** - concatenated `ctx.ui.setStatus(key, text)` entries from extensions, sorted by key (`footer.ts:208-216`).

Token counts are formatted via `formatTokens` (`footer.ts:21-27`) with k/M suffixes. Cost is summed across every assistant entry in the session, *including* entries before the latest compaction - so cost is cumulative for the session file, not just the current context window.

The footer is itself replaceable: an extension can call `ctx.ui.setFooter(factory)` and return its own component receiving the `ReadonlyFooterDataProvider` (which exposes git branch and extension statuses - data the host computes and which would otherwise be inaccessible to an extension). This is what community extensions like `pi-powerline-footer` and `pi-sub-bar` plug into.

### Headers, editor, widgets

- `ctx.ui.setHeader(factory)` replaces the startup header.
- `ctx.ui.setWidget(key, content, {placement: "aboveEditor"|"belowEditor"})` mounts persistent widgets.
- `ctx.ui.setEditorComponent(factory)` swaps the entire input editor. The example in `extensions/types.ts:232-251` is a `VimEditor` extending `CustomEditor`; calling `super.handleInput(data)` preserves app-level keybindings (escape, ctrl+d, model switching).
- Themes are JSON files under `theme/` (built-in `dark`, `light`) with hot reload.

### Interactive editor features

From the README (`packages/coding-agent/README.md:159-167`):

- `@` triggers fuzzy file search; `Tab` completes paths
- `Shift+Enter` (or `Ctrl+Enter` on Windows Terminal) for multi-line
- `Ctrl+V` (or `Alt+V` on Windows) pastes images; drag-and-drop is supported
- `!command` runs bash and sends output to the LLM; `!!command` runs but withholds output (a "user bash" event extensions can intercept)
- Standard editor keybindings (`docs/keybindings.md`)

### Session model

Sessions are JSONL files with one entry per line, organized as an in-place tree (each entry has `id` and `parentId`). This enables `/tree` for non-destructive branch navigation, `/fork` (new file, copy active path), `/clone` (duplicate active branch), and `--fork <id>` from the CLI. Session entries include `SessionMessageEntry`, `ModelChangeEntry`, `ThinkingLevelChangeEntry`, `CompactionEntry`, `BranchSummaryEntry`, `FileEntry`, and `CustomMessageEntry` (extensions can persist arbitrary state via `pi.appendEntry(customType, data)` - see `index.ts` re-exports at `src/index.ts:194-213`).

### Compaction

Triggered manually with `/compact [prompt]` or automatically on context overflow / when approaching the limit. Compaction summarizes older messages while keeping recent ones; the full history is preserved in JSONL so `/tree` can revisit. Customizable via the `session_before_compact` extension event, which receives the full `CompactionPreparation` and can substitute a `compaction` result of its own. Implementation lives in `packages/coding-agent/src/core/compaction/` (re-exported as `compact`, `findCutPoint`, `shouldCompact`, `generateSummary`, etc., see `src/index.ts:27-49`).

## Ecosystem & Interoperability

### Provider/model abstraction (`pi-ai`)

`pi-ai` is the LLM client. Its surface (`packages/ai/README.md`):

- A small handful of *APIs* (the wire protocol): `anthropic-messages`, `google-generative-ai`, `google-vertex`, `mistral-conversations`, `openai-completions`, `openai-responses`, `openai-codex-responses`, `azure-openai-responses`, `bedrock-converse-stream` (`packages/ai/README.md:699-710`).
- Each *Provider* selects one API plus a list of tool-capable models. As of the README the providers are: OpenAI, Azure, OpenAI Codex (ChatGPT subscription via OAuth), DeepSeek, Anthropic, Google, Vertex AI, Mistral, Groq, Cerebras, Cloudflare AI Gateway, Cloudflare Workers AI, xAI, OpenRouter, Vercel AI Gateway, MiniMax, Together AI, GitHub Copilot (OAuth), Amazon Bedrock, OpenCode Zen/Go, Fireworks (Anthropic-compatible), Kimi For Coding, Xiaomi MiMo (multi-region), and "any OpenAI-compatible API" via custom models (`packages/ai/README.md:51-77`).
- Generated model metadata lives in `packages/ai/src/models.generated.ts`. `AGENTS.md:20` forbids hand-editing this file: it's regenerated from `scripts/generate-models.ts` which fetches from models.dev and provider sources.
- `getModel(provider, id)` is fully typed; provider and model IDs are auto-completed in IDEs. Cross-provider handoffs are supported: messages from one provider can be passed verbatim to another, with thinking blocks downgraded to `<thinking>`-tagged text where the destination doesn't support reasoning (`packages/ai/README.md:976-1031`).
- Built-in OAuth for Anthropic (Pro/Max), OpenAI Codex (ChatGPT Plus/Pro), GitHub Copilot, and Google Cloud Code Assist. CLI is `npx @earendil-works/pi-ai login` (`packages/ai/README.md:1200-1210`).

The unified streaming event model is the one `pi-agent-core` consumes: `start`, `text_*`, `thinking_*`, `toolcall_*`, `done`, `error` (`packages/ai/README.md:374-389`). `toolcall_delta` carries best-effort partial JSON parses so the TUI can show "Writing to: /tmp/x" before the full content arrives (`packages/ai/README.md:291-335`).

Custom providers/models are configured either statically in `~/.pi/agent/models.json` (when they speak one of the existing APIs) or dynamically via `pi.registerProvider()` in an extension (when they need custom auth, headers, or an entirely new `streamSimple` handler). See `packages/coding-agent/examples/extensions/custom-provider-*` for sample wirings.

### Extension ecosystem highlights

The `awesome-pi-agent` index categorizes 40+ community extensions; a few that document key host-side affordances:

- **ACP / MCP adapters** - `pi-acp` exposes pi as an Agent Client Protocol server. There is no MCP adapter shipped, but `pi-config` (or any extension) can add one via `pi.registerTool` over an MCP client.
- **Web/UI integrations** - `pi-canvas` (inline TUI canvases - calendar, document, flights), `pi-cost-dashboard` (web dashboard), `pi-gui`, `pi-sketch` (browser-sketch → image to model), `pi-mobile` (Android client over Tailscale), `agent-desktop`.
- **Permission / safety** - `pi-hooks/permission` (four levels), `toolwatch` (SQLite-logged approval), `nono` (Landlock/Seatbelt kernel sandbox), `safe-git`.
- **Powerline footer / status** - `pi-powerline-footer`, `pi-sub-bar`, `usage-bar`, `session-color`, `session-emoji`, `tab-status` (all swap or augment the footer via `ctx.ui.setFooter` or `setStatus`).
- **Nested context** - several extensions extend the AGENTS.md system; `memory-mode` (in `shitty-extensions`) writes back to `AGENTS.md` with AI-assisted integration.
- **Sub-agents / orchestration** - `task-tool`, `PiSwarm` (parallel PR processing via worktrees), `task-factory` (queue-first orchestrator with web UI), `ralph-wiggum` (long-running iterative loops).
- **Sandbox / remote execution** - `pi-ssh-remote` (redirect all file/cmd operations over SSH), `gondolin` (Linux micro-VM with programmable filesystem and network).
- **Skills collections** - `pi-skills` (the canonical Claude-Code-compatible set), `pi-amplike` (Jina web search), `agent-stuff` (commit, changelog, GitHub, tmux, Sentry).

Multiple Claude Code-related entries are listed under "Related Projects" - `claude-code`, `claude-code-ui`, `claude-plugins-official` (`awesome-pi-agent/README.md:148-153`) - signalling that pi positions itself as a coexisting peer, not a replacement, of Claude Code.

### Nested AGENTS.md / context injection

`loadProjectContextFiles` (`packages/coding-agent/src/core/resource-loader.ts:76-114`) implements the discovery walk:

1. Global: `~/.pi/agent/AGENTS.md` (or `AGENTS.MD` / `CLAUDE.md` / `CLAUDE.MD`, in that order - `resource-loader.ts:59`).
2. Ancestor walk: starting from the *current working directory*, climb upward to the filesystem root, collecting each ancestor's first matching file. Results are unshifted (closest-to-cwd last) so the prompt presents them in outer→inner order.
3. Current directory: included as part of the ancestor walk.

Duplicates are deduped by absolute path (`seenPaths` set), so global and project-local agree silently if symlinked.

`buildSystemPrompt` (`packages/coding-agent/src/core/system-prompt.ts:153-160`) appends every context file under a `# Project Context` heading with `## <abs-path>\n\n<content>` per file. Disable via `--no-context-files` / `-nc`. The fully-assembled system prompt (default + appended + context files + skills + date + cwd) is emitted on the `before_agent_start` event so extensions can inspect or replace it before each turn (`extensions/types.ts:623-633`, `1009-1013`).

The same loader supports `--system-prompt` and `--append-system-prompt`, and per-project `.pi/SYSTEM.md` / `.pi/APPEND_SYSTEM.md`. Skills, prompt templates, and themes follow analogous global+ancestor walks via the resource loader.

## Design Philosophy & Distinctive Choices

The editorial stance is unusually explicit in the source. Three documents lay it out: the package README, the contribution guide, and the top-level AGENTS.md.

From `packages/coding-agent/README.md:468-484`:

> Pi is aggressively extensible so it doesn't have to dictate your workflow. Features that other tools bake in can be built with extensions, skills, or installed from third-party pi packages. This keeps the core minimal while letting you shape pi to fit how you work.
>
> **No MCP.** Build CLI tools with READMEs (see Skills), or build an extension that adds MCP support.
> **No sub-agents.** There's many ways to do this. Spawn pi instances via tmux, or build your own with extensions, or install a package that does it your way.
> **No permission popups.** Run in a container, or build your own confirmation flow with extensions inline with your environment and security requirements.
> **No plan mode.** Write plans to files, or build it with extensions, or install a package.
> **No built-in to-dos.** They confuse models. Use a TODO.md file, or build your own with extensions.
> **No background bash.** Use tmux. Full observability, direct interaction.

From `CONTRIBUTING.md:65-68`:

> ## Philosophy
> pi's core is minimal. If your feature does not belong in the core, it should be an extension. PRs that bloat the core will likely be rejected.

From `CONTRIBUTING.md:6-12`:

> ## The One Rule
> **You must understand your code.** If you cannot explain what your changes do and how they interact with the rest of the system, your PR will be closed.
>
> Using AI to write code is fine. Submitting AI-generated slop without understanding it is not.

From `AGENTS.md:1-9` (the file the maintainer's own agent picks up when working on the project):

> # Development Rules
> ## Conversational Style
> - Keep answers short and concise
> - No emojis in commits, issues, PR comments, or code
> - No fluff or cheerful filler text
> - Technical prose only, be kind but direct (e.g., "Thanks @user" not "Thanks so much @user!")

The contribution gate enforces this in practice (`CONTRIBUTING.md:13-26`): "All issues and PRs from new contributors are auto-closed by default." Approvals are granular: `lgtmi` whitelists future issues, `lgtm` whitelists issues *and* grants PR rights.

Distinctive technical choices that follow from this stance:

- **Tools as code, not as MCP.** The core ships seven tools and refuses to add a generic plugin protocol. New capability surface is added by writing TypeScript that registers a tool with TypeBox-validated args, or by writing a skill that tells the model how to call your CLI.
- **One TypeBox-everywhere validation pipeline.** Tool parameters, settings schemas, model definitions, and provider configs all use TypeBox (`packages/ai/README.md:85`), giving JSON-serializable schemas, runtime validation, and TypeScript inference from the same source.
- **Provider abstraction in a separate package.** `pi-ai` is shippable on its own (`packages/ai/README.md:79-83`) and is what gives pi its broad provider coverage; the agent loop lives in another shippable package (`pi-agent-core`); the coding agent is a thin layer on top. The README claims SDK consumers can drop pi-agent-core into a browser app and use `streamProxy` to push to a backend (`packages/agent/README.md:436-449`).
- **No environment-coupled features.** No native notifications, no editor integration, no Slack hook in the core - all are extensions. The community has built every one.
- **JSONL-tree sessions.** Sessions are sharable, forkable, and replayable text files. The maintainer publishes his own work sessions on Hugging Face (`README.md:43-47`) as training data for future coding agents.
- **Lockstep versioning.** "All packages always share the same version number" (`AGENTS.md:178`). At the time of writing, every package is at 0.74.0 (`packages/coding-agent/package.json:3`).
- **Editorial naming.** "shittycodingagent.ai" appears as the docs root in `awesome-pi-agent/README.md:5` - the project's own meta-list calls itself "shitty-list" because it was tempting. The branding is deliberately the opposite of corporate.

## Key Takeaways

- **Minimal core, aggressive extensibility.** Seven built-in tools (`read`, `write`, `edit`, `bash`, `grep`, `find`, `ls`), no MCP, no sub-agents, no permission UI, no plan mode, no to-dos, no background bash. Everything else - including those refused features - is a TypeScript extension over `ExtensionAPI`, which has 20+ event types, full TUI surface replacement, and OAuth provider registration.
- **`AgentMessage` ≠ LLM `Message`.** `pi-agent-core` works with `AgentMessage` throughout, and only flattens to LLM `Message[]` at the call boundary via `convertToLlm` + `transformContext`. This is how custom messages, queued steering, and compaction layers compose cleanly with extension declaration-merged message types (`packages/agent/src/agent-loop.ts:275-308`, `packages/agent/README.md:46-53`).
- **Two-tier interruption: steering vs follow-up.** Enter queues a steering message delivered at the next turn boundary; Alt+Enter queues a follow-up message delivered only when the agent would otherwise stop. Both are first-class config in `AgentLoopConfig` (`getSteeringMessages`, `getFollowUpMessages` at `packages/agent/src/agent-loop.ts:166-260`).
- **Skills are interop, not a tool protocol.** SKILL.md is the same file format Claude Code, Codex CLI, Amp, and Droid use. pi consumes them from `~/.pi/agent/skills/`, `~/.agents/skills/`, `.pi/skills/`, and `.agents/skills/` (`packages/coding-agent/README.md:341`). The model sees only name, description, and absolute file path - it must `read` the file to invoke. `pi-skills` is the canonical community collection and explicitly markets multi-agent compatibility (`pi-skills/README.md:3`).
- **Tools have pluggable operations.** Every built-in tool delegates side effects through an `Operations` interface, so SSH transport (`pi-ssh-remote`), micro-VM sandboxes (`gondolin`, `lima`), and audit layers (`toolwatch`) can be inserted without forking pi.
- **Editorial restraint as a feature.** The README's "No X" list, the `CONTRIBUTING.md` quality bar, the auto-close-by-default issue gate, and the AGENTS.md "no emojis, no fluff" rules all encode the same posture: a small, opinionated, hand-crafted core that prefers turning users away to bloating itself. This is rare for an open-source coding agent of pi's reach (40+ ecosystem extensions, npm-distributed under `@earendil-works/*`).
