# Claude Code

## Overview

Claude Code is Anthropic's official terminal-based coding agent, shipped as the `@anthropic/claude-code` npm package and powered by a custom React/Ink TUI. The source examined here is a snapshot leaked via an npm sourcemap (March 2026) and mirrored under `/Users/jisu/data/workspace/ref/claude-code-leak/`. What stands out about claude-code, relative to "a CLI that hits the Claude API," is its scale and structure: a ~5,000-line REPL orchestrator, a ~1,700-line turn-state-machine, a unified tool contract with ~40 built-in tools, first-class MCP/plugin/skill extensibility, a multi-agent subsystem with worktree and remote isolation, file-based memory with a background "auto-dream" consolidator, and a layered permission / sandbox / hooks stack that explicitly separates *whether a call is allowed* from *what runtime capabilities a call has*. It is best read as a local agent operating system that happens to render as a terminal app.

## Architecture

### Process model and entry points

There are two entry surfaces:

- `src/entrypoints/cli.tsx` — minimal launcher. Handles `--version`, MCP/native-host modes, daemon workers, bridge mode, background sessions, and `--dump-system-prompt`. All imports are dynamic. The fast path for `--version` loads zero additional modules.
- `src/main.tsx` (4,683 lines) — real composition root. Builds the Commander program, initializes config / policy / GrowthBook, registers built-in skills and plugins, bootstraps MCP, constructs initial app state, and dispatches to either `launchRepl(...)` or `QueryEngine.ask(...)`.

The runtime spine flows:

```
entrypoints/cli.tsx
  -> main.tsx
    -> entrypoints/init.ts            (env, CA certs, proxy, graceful shutdown)
    -> bootstrap/state.ts             (process/session singleton)
    -> command/tool/plugin/skill/MCP registration
    -> launchRepl(...)                (interactive)
       or QueryEngine.submitMessage() (headless/SDK)
         -> query.ts                  (turn loop)
            -> services/api/claude.ts (streaming + retries)
            -> tools + hooks + compaction + attachments
```

`src/bootstrap/state.ts` is a process-wide singleton (cwd, project root, session id/lineage, model overrides, telemetry counters, channel/plugin flags). `src/state/AppState.tsx` is the per-conversation React-context store (messages, MCP state, permission context, task state, file history). These are deliberately separate scopes — the global bootstrap survives subagents and forks, the AppState is what gets cloned or filtered for subagents.

### Interactive UI stack

```
main.tsx -> launchRepl -> components/App.tsx
  -> state/AppState.tsx
  -> screens/REPL.tsx        (5,005 lines — the de facto controller)
```

`src/screens/REPL.tsx` is the largest interactive file in the codebase. It is named "screen" but functions as the application controller: prompt input + keybindings, message rendering, remote session hooks, IDE integration, MCP connection management, permission dialogs, background task navigation, session persistence/restoration, and proactive features. Notably, the UI does not use Redux; `AppState` exposes a custom store through React context and selector hooks (see `src/hooks/use*.ts` — ~104 hooks, most named `useMerged*`, `useTask*`, `useRemote*`, etc.).

### Two conversation runtimes

Both interactive and headless paths converge at `src/query.ts` for the actual turn loop, but headless wraps it:

- **Interactive (REPL)** calls `query()` directly from `useQueueProcessor` / `useCommandQueue` hooks.
- **Headless / SDK** uses `src/QueryEngine.ts` (1,295 lines). `QueryEngine` owns: mutable message history, transcript persistence, the read-file cache, usage accumulation, the initial `system_init` SDK event, and SDK message shaping. Each `submitMessage()` call invokes `query()` and maps streamed events into SDK message types.

This split matters: `QueryEngine` is an adapter and state owner, not the kernel. The kernel is `query.ts`.

### Tool architecture

`src/Tool.ts` defines the uniform contract every model-invoked tool must implement. The shape is large (Tool.ts:362-695) but the conceptual pieces are:

- `inputSchema` (Zod) / optional `inputJSONSchema` for MCP-style schemas
- `call(args, context, canUseTool, parentMessage, onProgress)` — execution
- `description(input, options)` / `prompt(options)` — model-facing text
- `validateInput`, `checkPermissions` — gates
- `isReadOnly`, `isDestructive`, `isConcurrencySafe` — scheduling metadata
- `isMcp`, `isLsp`, `shouldDefer`, `alwaysLoad` — registration metadata
- `interruptBehavior(): 'cancel' | 'block'` — what happens on user interrupt
- `searchHint` — keyword phrase used by `ToolSearch` for deferred-tool lookup
- `mapToolResultToToolResultBlockParam`, `renderToolUseMessage`, `renderToolResultMessage`, `renderToolUseProgressMessage` — Ink rendering hooks
- `backfillObservableInput` — mutates observable copies (transcript / hooks / SDK) without touching the API-bound input that anchors the prompt cache

`buildTool()` (Tool.ts:783) fills safe defaults (`isConcurrencySafe → false`, `isReadOnly → false`, `checkPermissions → allow`, etc.). The `Tools` type is `readonly Tool[]` rather than `Tool[]` deliberately, to make tool-set assembly grep-able.

`src/tools.ts` is the composition root. `getAllBaseTools()` enumerates built-ins; `getTools(permissionContext)` filters by mode / feature flags / deny rules; `assembleToolPool(permissionContext, mcpTools)` merges built-ins with MCP tools deterministically (built-ins as a contiguous sorted prefix so the server's global cache breakpoint sits after the built-in suffix — `tools.ts:357-367`).

### Command and skill composition

`src/commands.ts` is the command composition root. It merges:

- built-in slash commands from `src/commands/*` (~70+ commands like `/add-dir`, `/clear`, `/commit`, `/compact`, `/config`, `/init`, `/mcp`, `/memory`, `/model`, `/output-style`, `/plan`, `/plugin`, `/resume`, `/review`, `/rewind`, `/session`, `/skills`, `/share`, `/status`, `/tasks`, `/teleport`, `/theme`, …)
- bundled skills from `src/skills/bundled/` (e.g. `/simplify`, `/remember`, `/verify`, `/keybindings`, `/update-config`, `/debug`, `/skillify`, `/stuck`, `/loop`, `/dream` — registered in `src/skills/bundled/index.ts`)
- built-in plugin skills (`src/plugins/builtinPlugins.ts`)
- user/project/managed file-based skills (`src/skills/loadSkillsDir.ts`)
- plugin commands and plugin skills (`src/utils/plugins/loadPluginCommands.ts`)
- workflow commands (when `WORKFLOW_SCRIPTS` feature is on)
- dynamically activated conditional skills

Skills, in claude-code's model, are commands with extra metadata. Frontmatter fields include `description`, `whenToUse`, `allowedTools`, `hooks`, `paths`, `context: fork`, `agent`, `model`, `disableModelInvocation` (see `src/skills/loadSkillsDir.ts:parseSkillFrontmatterFields`). This means the same dispatch path serves slash commands typed by the user *and* skill invocations triggered by the model via the `Skill` tool.

## Agent Loop

The loop layers are nested:

- **Layer A — session wrapper.** `QueryEngine.submitMessage()` owns conversation-level state for headless/SDK sessions: mutable history, transcript persistence, read-file cache, usage, the initial `system_init` event, SDK message shaping.
- **Layer B — turn loop.** `query()` in `src/query.ts` is the real assistant turn state machine.
- **Layer C — tool / subagent loops.** Tools execute local actions; `AgentTool` launches subagents that themselves run another `query()`; tasks wrap those loops with persisted state.

### `query()` as an explicit state machine

The loop is `while (true)` with a single mutable `State` struct destructured at the top of each iteration (`src/query.ts:204-217`):

```typescript
type State = {
  messages: Message[]
  toolUseContext: ToolUseContext
  autoCompactTracking: AutoCompactTrackingState | undefined
  maxOutputTokensRecoveryCount: number
  hasAttemptedReactiveCompact: boolean
  maxOutputTokensOverride: number | undefined
  pendingToolUseSummary: Promise<ToolUseSummaryMessage | null> | undefined
  stopHookActive: boolean | undefined
  turnCount: number
  transition: Continue | undefined  // why the previous iteration continued
}
```

There is no phase enum, no `currentStep` field, and no methodology-aware sequencer. The `transition` field records *recovery* reasons (compact drained, reactive compact retried, fallback model triggered, max-output-tokens escalated), not methodology phases — see `analysis/05-context-action-verification-loop.md` for the deeper read on this. The methodology layer (gather → act → verify) is implemented through prompts, subagent components, and a tool denylist pattern, never as runtime control.

### Per-iteration flow

Each iteration follows this pattern (see `src/query.ts:300-1727`):

1. **Iteration context.** Snapshot or extend `queryTracking` chain id/depth; create or update `toolUseContext`; start skill-discovery prefetch.
2. **Apply tool-result budget.** `applyToolResultBudget()` (`utils/toolResultStorage.ts`) replaces oversized tool outputs with disk-persisted placeholders, recorded into `contentReplacementState`.
3. **Compaction stack** (this is sequenced before every model call, not just on overflow):
   - `snipCompactIfNeeded` — `HISTORY_SNIP` feature, prunes mid-history
   - `microcompact` — small per-tool replacements
   - `applyCollapsesIfNeeded` — collapse search/read groups into projections
   - `autocompact` — full summarization when over threshold
4. **Effective prompt assembly.** Combines system prompt + system context + user context + model + permission mode + tool set + optional `task_budget`.
5. **Stream the model.** `deps.callModel(...)` is normally `queryModelWithStreaming()` from `services/api/claude.ts`. As messages arrive the loop:
   - clones tool_use blocks before yield so `backfillObservableInput` can run without touching the API-bound input (preserves prompt cache — `query.ts:743-787`)
   - withholds recoverable errors (prompt-too-long, max-output-tokens, media size) so they can be recovered before reaching SDK consumers (`query.ts:799-822`)
   - feeds tool_use blocks into `StreamingToolExecutor` if enabled, so tools begin running while the model is still streaming
6. **Recovery branch** if `!needsFollowUp`. If the last message is a withheld prompt-too-long: try collapse-drain, then reactive compact, then surface. If max-output-tokens: escalate to 64k, then run 3 retries with a "resume directly" recovery user message, then surface. If `FallbackTriggeredError`: switch model, strip thinking signatures (`stripSignatureBlocks` — model-bound signatures don't replay across families), discard the streaming executor, retry.
7. **Stop hooks.** If no tools were called, `handleStopHooks` runs and can either prevent continuation or inject blocking errors. Token budget (`TOKEN_BUDGET` feature) can also force a continuation with a synthetic nudge message.
8. **Tool execution.** Either drain the streaming executor's remaining results or call `runTools()` (`services/tools/toolOrchestration.ts`).
9. **Post-tool attachments.** Drain queued slash/task notifications; collect prefetched memory and skill_discovery attachments; refresh MCP tools if new servers connected mid-turn.
10. **Next turn.** Push assistant + tool_result + attachments into history; increment turnCount; loop.

### Streaming vs batch tool execution

Two strategies coexist:

- **Batch** (`runTools()` in `services/tools/toolOrchestration.ts`). Partitions tool calls into runs of concurrency-safe tools, runs each run in parallel via `runToolsConcurrently()` (limited by `CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY`, default 10), runs non-safe tools serially. A non-concurrency-safe tool can return a `contextModifier` that mutates `ToolUseContext` for following tools.
- **Streaming** (`StreamingToolExecutor` in `services/tools/StreamingToolExecutor.ts`). As `tool_use` blocks arrive during streaming, queue them; start concurrency-safe ones immediately; buffer results to preserve output order; cancel siblings on errors; synthesize tool_result failures on interrupt/fallback/discard.

The streaming executor is gated by `config.gates.streamingToolExecution` and is the path that overlaps model output with tool execution — important for the "edit-while-the-model-is-still-talking" feel of the product.

### Recovery as control flow

The loop treats four classes of failure as normal control:

- **Prompt-too-long.** First try `contextCollapse.recoverFromOverflow(...)` (drains staged collapses), then `reactiveCompact.tryReactiveCompact(...)` (full summary), then surface. Loop guards (`hasAttemptedReactiveCompact`, `state.transition.reason !== 'collapse_drain_retry'`) prevent infinite spirals.
- **Max-output-tokens.** Escalate to 64k once, then run up to 3 recovery turns with a synthetic user message: *"Output token limit hit. Resume directly — no apology, no recap. Pick up mid-thought if that is where the cut happened. Break remaining work into smaller pieces."* (`query.ts:1224-1228`).
- **Model fallback.** `FallbackTriggeredError` switches `currentModel`, emits synthetic tool_result blocks for any orphan tool_uses (`yieldMissingToolResultBlocks`), discards the streaming executor, and replays.
- **Interruption.** On abort during streaming, drain the streaming executor's `getRemainingResults()` so every tool_use has a synthetic tool_result; for batch, run `yieldMissingToolResultBlocks(assistantMessages, 'Interrupted by user')`. Cleanup hooks for "computer use" / Chicago MCP fire to unhide overlays and release locks.

### Tool-use summaries

After tool execution, if `config.gates.emitToolUseSummaries` is on and we are on the main thread, the loop fires `generateToolUseSummary()` (a ~1s Haiku call) without awaiting it. The promise is plumbed through `state.pendingToolUseSummary` and resolved on the *next* iteration, hidden behind the 5-30s model stream. This is one of several places where claude-code overlaps cheap classification calls under expensive ones for latency.

### Memory and skill prefetch

The loop opens `startRelevantMemoryPrefetch()` and `startSkillDiscoveryPrefetch()` at the start of each turn. Both run while the model streams and tools execute; their results are consumed post-tool, with `consumedOnIteration` tracking preventing duplicate injection. Memory prefetch resolution can happen on any later iteration of the same turn — this means the model can see relevant memory before the turn ends, but without paying for it serially.

## Tool System

### What tools exist

The full registration is in `src/tools.ts:getAllBaseTools()`. The major families:

**Local shell and file**
- `BashTool` (18 source files under `src/tools/BashTool/`) — shell execution with sandbox decisions, classifier-driven approvals, sed-edit parsing, mode validation, read-only validation, comment label inference
- `PowerShellTool` (14 source files) — Windows equivalent
- `FileReadTool`, `FileEditTool`, `FileWriteTool`, `NotebookEditTool`
- `GlobTool`, `GrepTool` (omitted on ant-native builds that ship `bfs`/`ugrep` embedded via the same ARGV0 trick as ripgrep — `hasEmbeddedSearchTools()`)
- `LSPTool` (behind `ENABLE_LSP_TOOL` env var)

**Web / external**
- `WebFetchTool`, `WebSearchTool`
- MCP tools (merged via `assembleToolPool`)
- `ListMcpResourcesTool`, `ReadMcpResourceTool` — MCP as a *resource* surface, not just tool surface

**Orchestration**
- `AgentTool` — the primary subagent primitive (1,397 lines just for the tool)
- `SendMessageTool`, `TaskStopTool`, `TaskCreateTool`/`TaskGetTool`/`TaskListTool`/`TaskUpdateTool`/`TaskOutputTool` (Todo v2)
- `TeamCreateTool`, `TeamDeleteTool` (swarm mode)
- `TodoWriteTool` — Todo v1, when v2 not enabled
- `SkillTool` — invokes skills as forked agents
- `EnterPlanModeTool`, `ExitPlanModeV2Tool`
- `EnterWorktreeTool`, `ExitWorktreeTool` (when `isWorktreeModeEnabled()`)
- `AskUserQuestionTool` — structured user prompt
- `BriefTool` — Kairos primary communication channel

**Automation / background**
- `SleepTool` (Proactive / Kairos)
- `CronCreateTool` / `CronListTool` / `CronDeleteTool` (`AGENT_TRIGGERS`)
- `RemoteTriggerTool` (`AGENT_TRIGGERS_REMOTE`)
- `MonitorTool`, `PushNotificationTool`, `SendUserFileTool`, `SubscribePRTool` (Kairos variants)
- `ScheduleCronTool`

**Special**
- `ToolSearchTool` — deferred-tool loader
- `ConfigTool`, `TungstenTool`, `REPLTool` (ant-only)
- `SyntheticOutputTool` (coordinator / swarm-internal)

### Permission gating

`src/utils/permissions/permissions.ts` (1,486 lines) is the policy engine. It merges rules from a stack of sources — policySettings, userSettings, projectSettings, localSettings, flagSettings, CLI args, command/skill-granted rules, session-scoped approvals — and resolves to `allow | deny | ask | bypass`. For each tool call, the per-call check flow (see `services/tools/toolExecution.ts:runToolUse`):

1. **validateInput** (tool-specific Zod parse + custom validation)
2. **PreToolUse hooks** (`runPreToolUseHooks` in `services/tools/toolHooks.ts`) — can block, amend input, or auto-approve
3. **checkPermissions** (tool-specific) + general permission engine
4. **execution**
5. **PostToolUse hooks** / **PostToolUseFailure hooks**
6. Result normalization into transcript/API-safe blocks; tool result budgeting

`ToolPermissionContext` (Tool.ts:123) is the carrier:

```typescript
type ToolPermissionContext = DeepImmutable<{
  mode: PermissionMode
  additionalWorkingDirectories: Map<string, AdditionalWorkingDirectory>
  alwaysAllowRules: ToolPermissionRulesBySource
  alwaysDenyRules: ToolPermissionRulesBySource
  alwaysAskRules: ToolPermissionRulesBySource
  isBypassPermissionsModeAvailable: boolean
  isAutoModeAvailable?: boolean
  shouldAvoidPermissionPrompts?: boolean      // background agents auto-deny
  awaitAutomatedChecksBeforeDialog?: boolean  // coordinator workers
  prePlanMode?: PermissionMode                // restore on plan exit
}>
```

Modes (`src/utils/permissions/PermissionMode.ts`): `default`, `plan`, `acceptEdits`, `bypassPermissions`, `dontAsk`, plus `auto` (ant-only A/B, transcript classifier) and `bubble` (internal). Plan mode is *not* a runtime block — it is a per-iteration `plan_mode` system-reminder attachment injected by `utils/attachments.ts:881`. The permission engine itself is mode-agnostic for plan. Mutation is forbidden by the model obeying the reminder, not by the engine refusing the call.

### MCP integration

`src/services/mcp/client.ts` is 3,348 lines — comparable to the model API client. It supports stdio, SSE, streamable HTTP, WebSocket, and in-process SDK transports. Responsibilities:

- transport setup and reconnection
- OAuth flow + refresh
- tool discovery, tool invocation, result truncation/persistence
- resource listing / reading (with the dedicated tools above)
- optional MCP-skill fetching (`src/skills/mcpSkillBuilders.ts`)
- URL elicitations (`-32042` errors) — handled either through the REPL queue or `structuredIO.handleElicitation` in SDK mode

MCP tools are merged into the same `Tools` array as built-ins by `assembleToolPool` and pass through the same permission and hook stack. MCP tools are *always deferred* by default (loaded on-demand via `ToolSearch`), unless they set `_meta['anthropic/alwaysLoad']` (`tools/ToolSearchTool/prompt.ts:isDeferredTool`).

### Deferred tools and ToolSearch

`ToolSearchTool` (`src/tools/ToolSearchTool/`) is the runtime mechanism behind the `<system-reminder>` "deferred tools are available" pattern. When enabled, MCP tools (and any built-in with `shouldDefer: true`) ship to the model as names only — full schemas are fetched on demand. Query forms:

- `select:Read,Edit,Grep` — exact selection
- `notebook jupyter` — keyword search
- `+slack send` — required term + ranked rest

This is essential for keeping turn-1 token usage bounded when there are large MCP servers attached. `Agent`, `Brief`, and `SendUserFile` are explicitly never deferred (the model must see them on turn 1).

### Tool result budget and storage

`src/utils/toolResultStorage.ts` implements a per-conversation `contentReplacementState`. Tools have a `maxResultSizeChars` (defaults to a few hundred KB; `FileReadTool` sets it to `Infinity` because Read self-bounds). When the aggregate tool result budget is exceeded, outputs are persisted to disk and replaced inline with `[content replaced — see ...]`. Subagents inherit a cloned `contentReplacementState` so identical fork decisions can land in the parent's prompt cache.

## Skills, Plugins & Slash Commands

### Skills

Skills are markdown files with frontmatter. The schema understands (see `src/skills/loadSkillsDir.ts:parseSkillFrontmatterFields`):

- `description` (required)
- `whenToUse` — narrows model invocation
- `allowed-tools` — tool subset granted when the skill runs
- `hooks` — `PreToolUse` / `PostToolUse` / etc. attached only while skill is active
- `paths` — globs for conditional activation (when working files match a skill's paths, the skill is promoted into the dynamic skill set)
- `agent` — execution context name
- `context: fork` — run as a forked subagent so its tool output stays out of main context
- `model`, `effort` — overrides
- `disableModelInvocation` — user-only

Sources (in priority order — `getSkillDirCommands`): bundled → built-in plugin → managed (policy) → user → project → plugin → MCP.

MCP skills are treated as untrusted: the loader's comments explicitly note that remote MCP skills must not execute inline shell substitutions the way local file-based skills can.

Bundled skills currently shipped (from `src/skills/bundled/index.ts`):

- `/update-config`, `/keybindings`, `/verify`, `/debug`, `/simplify`, `/skillify`, `/remember`, `/lorem-ipsum`, `/batch`, `/stuck`
- `/dream` (Kairos)
- `/hunter` (REVIEW_ARTIFACT)
- `/loop` (AGENT_TRIGGERS)
- `/schedule` (AGENT_TRIGGERS_REMOTE)
- `/claude-api` (BUILDING_CLAUDE_APPS)
- Claude-in-Chrome auto-skill (shouldAutoEnableClaudeInChrome)
- `/run-skill-generator` (RUN_SKILL_GENERATOR)

### Plugins

`src/utils/plugins/pluginLoader.ts` (3,302 lines) handles discovery, marketplace lookups, versioned cache directories, manifest validation, enabled state, built-in inclusion, and session-only directories. `src/plugins/builtinPlugins.ts` is the registry for plugins that ship with the CLI and appear in `/plugin` UX (toggleable per user). Plugin IDs use `{name}@builtin` to distinguish from marketplace plugins (`{name}@{marketplace}`).

A plugin can contribute:

- commands
- skills
- agents (`src/tools/AgentTool/loadAgentsDir.ts`)
- hooks (`src/utils/hooks/registerFrontmatterHooks.ts`)
- output styles
- MCP server definitions
- LSP server definitions
- settings

Most of this is markdown + frontmatter — `loadPluginCommands.ts` shares the markdown loader with skills.

### Slash commands

`src/commands/` has ~90 entries. They fall into a few categories:

- **Local textual** (`/clear`, `/exit`, `/help`)
- **Local JSX/Ink dialogs** (`/config`, `/permissions`, `/model`, `/output-style`, `/theme`, `/plugin`, `/agents`, `/hooks`, `/install-github-app`, `/install-slack-app`, `/onboarding`, `/voice`)
- **Prompt-expanding** (`/commit`, `/review`, `/security-review`, `/init`)
- **Internal-only** (in `INTERNAL_ONLY_COMMANDS`: `/bughunter`, `/backfill-sessions`, `/issue`, `/share`, `/teleport`, `/ant-trace`, `/version`, etc.)
- **Feature-gated** (`/brief`, `/voice`, `/bridge`, `/proactive`, `/buddy`, `/ultraplan`, `/peers`, `/fork`, `/torch`, `/subscribe-pr`)

Notable composability: `/skills` lists skills; `/agents` manages agent definitions; `/rewind` rolls back file edits via `FileHistoryState`; `/teleport` migrates a session between local and remote.

### Output styles

`src/outputStyles/loadOutputStylesDir.ts` loads markdown from `.claude/output-styles/*.md` (project and user). Each style has a name, description, prompt body, and optional `keep-coding-instructions` flag. The active style appears in the system prompt as `# Output Style: {name}\n{prompt}` (`src/constants/prompts.ts:getOutputStyleSection`). Plugin-provided output styles are similar but live under `src/utils/plugins/loadPluginOutputStyles.ts`.

## Memory & Context

### CLAUDE.md and nested memory

The traditional `CLAUDE.md` lives at project root and is auto-injected at session start. Nested `CLAUDE.md` files (subdirectory or referenced via `@` imports) attach lazily: the first time the model touches a file in a subtree, that subtree's `CLAUDE.md` is attached as a `nested_memory` attachment. Dedup is tracked through `ToolUseContext.loadedNestedMemoryPaths`. `readFileState` is an LRU and evicts in busy sessions, so the dedup set is separate.

### memdir (auto-memory)

`src/memdir/` is a separate, content-addressed memory system layered on top of the project. The entrypoint is `MEMORY.md` (`memdir.ts:ENTRYPOINT_NAME`), capped at 200 lines / 25,000 bytes with byte-aware truncation. The path resolves to either:

1. `CLAUDE_COWORK_MEMORY_PATH_OVERRIDE` env var (used by Cowork)
2. `autoMemoryDirectory` from a trusted settings source (`policy`, `flag`, `local`, `user` — `project` is excluded so a hostile repo cannot redirect memory)
3. `<base>/projects/<sanitized-git-root>/memory/`

`isAutoMemPath()` is used as a write carve-out: writes inside the auto-memory directory bypass the dangerous-directory guard, but only when the path comes from a trusted source (not from `CLAUDE_COWORK_MEMORY_PATH_OVERRIDE`, where the trust is opaque).

Kairos mode keeps daily logs at `<autoMemPath>/logs/YYYY/MM/YYYY-MM-DD.md`; a nightly `/dream` skill (or the background `autoDream` service) distills logs into topic files + `MEMORY.md`.

### Context compaction stack

This is one of the more sophisticated parts of the codebase. Stages, in order on each iteration (`src/query.ts:365-468`):

1. **Tool-result budget** — replace oversized outputs with disk placeholders
2. **Snip** (`services/compact/snipCompact.ts`) — remove mid-history tokens past a threshold, leaving a marker
3. **Microcompact** (`services/compact/microCompact.ts`) — replace stale per-tool blocks with summaries; can use cache-aware deletion (`CACHED_MICROCOMPACT`) that defers boundary messages until the API reports `cache_deleted_input_tokens`
4. **Context collapse** (`services/contextCollapse/`) — project read/search groups into collapsed views; stored as a commit log so the projection replays across turns
5. **Autocompact** (`services/compact/autoCompact.ts`) — full summarization once over threshold; produces a summary message that replaces the conversation prefix

Plus two reactive paths invoked only on overflow / max tokens:

- **Collapse drain** — emit any staged collapse commits
- **Reactive compact** (`services/compact/reactiveCompact.ts`) — full summary triggered by a real 413 from the API, not a client-side estimate

The architectural reading: the loop assumes context pressure is normal. Compaction is part of the main loop body, not a separate maintenance pass.

### Session memory and extractMemories

`src/services/SessionMemory/sessionMemory.ts` extracts session-local memories (e.g. "the user is working in the foo package") and persists them. `src/services/extractMemories/extractMemories.ts` runs a turn-end fork that writes durable memories the main agent missed. The fork uses `createAutoMemCanUseTool` which restricts the writes to inside the auto-memory directory.

### autoDream

`src/services/autoDream/autoDream.ts` is the background consolidation agent. On REPL hook ticks it checks gates in order:

1. Time: `(now - lastConsolidatedAt) / hour >= minHours` (default 24)
2. Session count: number of transcripts touched since last consolidation `>= minSessions` (default 5), excluding the current session
3. Lock: `tryAcquireConsolidationLock()` is exclusive

If all pass, it `runForkedAgent` with the `/dream` prompt — a constrained subagent that reads `MEMORY.md`, gathers signals from daily logs, consolidates into durable topic files, and prunes redundancy. The fork is tracked as a `DreamTask` so the main UI can show it.

The architectural reading: memory consolidation isn't a separate background service. It's another agent workflow that happens to run under the same query loop, in a fork, with a tight tool allowlist.

## Permissions, Hooks & Verification

### Hooks

`src/utils/hooks/` handles a structured event system. Hook event types (from `src/entrypoints/sdk/coreTypes.ts:HOOK_EVENTS`):

```
PreToolUse, PostToolUse, PostToolUseFailure
Notification, UserPromptSubmit
SessionStart, SessionEnd
Stop, StopFailure
SubagentStart, SubagentStop
PreCompact, PostCompact
PermissionRequest, PermissionDenied
Setup
TeammateIdle
TaskCreated, TaskCompleted
Elicitation, ElicitationResult
ConfigChange
WorktreeCreate, WorktreeRemove
InstructionsLoaded
CwdChanged
FileChanged
```

Hooks can be registered from:

- settings.json (`hooks` field) — `hooksConfigManager.ts`
- frontmatter on a skill/agent — `registerFrontmatterHooks.ts`
- plugin manifests
- session-scoped (`sessionHooks.ts`)

Three execution backends:

- `execPromptHook.ts` — prompt the user (e.g. a confirmation hook)
- `execAgentHook.ts` — fork another agent
- `execHttpHook.ts` — HTTP webhook (with `ssrfGuard.ts` to prevent SSRF)

A hook can return `{ permissionDecision: 'allow' | 'deny', updatedInput?: ... }`. The orchestration in `services/tools/toolHooks.ts:resolveHookPermissionDecision` resolves multiple hook outputs into one decision. The hook's `if` field is a permission-rule pattern (`Bash(git *)` for "match Bash invocations where the command starts with `git`") and is compiled per hook-input pair via the tool's optional `preparePermissionMatcher()`.

The `Stop` hook deserves special mention: it runs only when the model produced no follow-up tool use. It can:

- `preventContinuation: true` → turn ends as `stop_hook_prevented`
- return blocking errors that get appended to history → loop continues with the errors visible to the model

There is explicit logic to *not* run stop hooks on API-error messages (rate limit, prompt-too-long, etc.) because hooks evaluating an error would create a death spiral: error → hook blocks → retry → error.

### Permissions

The engine in `src/utils/permissions/permissions.ts` is the integration point. Notable subsystems:

- **Classifier-driven approval** (`bashClassifier.ts`, `classifierDecision.ts`, `classifierShared.ts`, `yoloClassifier.ts`) — a small model classifier rates the safety of a bash command in auto mode. `setClassifierChecking` / `clearClassifierChecking` track in-progress classifications so the UI can show them.
- **Shell rule matching** (`shellRuleMatching.ts`) — decomposes a bash command into a structured form so rules like `Bash(git *)` or `Bash(rm:!-rf /)` can match precisely.
- **Auto-mode** (`autoModeState.ts`) — ant-only A/B that auto-allows reads and asks for writes, gated by a transcript classifier.
- **Bypass-permissions kill-switch** (`bypassPermissionsKillswitch.ts`) — admins can disable `--dangerously-skip-permissions` globally.
- **Denial tracking** (`denialTracking.ts`) — counts per-tool denials. After enough denials, falls back from auto-approval to user prompting.
- **Dangerous patterns** (`dangerousPatterns.ts`) — `rm -rf /`, etc., always require explicit confirmation.
- **Filesystem checks** (`filesystem.ts`) — write carve-outs for auto-memory dir, scratchpad dir, additional working directories.

### Sandboxing

`src/utils/sandbox/sandbox-adapter.ts` (985 lines) translates Claude Code permission/config state into `@anthropic-ai/sandbox-runtime` directives:

- filesystem restrictions
- network restrictions
- ignore/violation policy
- dependency checks
- managed-domain and managed-read-path restrictions

The adapter derives policy from claude-specific concepts: `WebFetch(domain:...)` allow/deny rules, `Read(...)` / `Edit(...)` permission patterns, managed-settings restrictions, protected settings files, and protected `.claude/skills` directories. Writes to settings.json files and to `.claude/skills` are *always* blocked — these are effectively code-execution surfaces.

`src/tools/BashTool/shouldUseSandbox.ts` decides whether a given shell call goes through the sandbox: it considers global enablement, explicit unsandboxed overrides, policy permission on unsandboxed commands, and excluded patterns.

`src/entrypoints/sandboxTypes.ts` is the single Zod schema for sandbox settings (network policies, filesystem allow/deny, managed-domain restrictions, weaker-isolation flags, excluded command lists). Both the adapter and SDK consumers import from here.

### The context → action → verification loop

(Detailed in `analysis/05-context-action-verification-loop.md`.) Methodology is *not* enforced by runtime sequencing. There is no `Phase` enum. Instead:

- **Prompt convention.** The main system prompt (`src/constants/prompts.ts`) tells the model: read first (line 230), diagnose before retrying (line 233), reversibility matters (lines 255-267), and (ant-only) verify before reporting (lines 211, 240).
- **Subagent routing.** Prompt lines 378-379 (gated on `BUILTIN_EXPLORE_PLAN_AGENTS`) say: directed search uses `Read`/`Glob`/`Grep` directly; broad exploration uses `AgentTool` with `subagent_type=Explore`. Prompt line 394 (gated on `VERIFICATION_AGENT` + `tengu_hive_evidence`) says: after non-trivial work, spawn the `verification` subagent.
- **Tool denylist.** Every read-only built-in agent shares the same five-tool denylist:
  ```
  [AGENT_TOOL_NAME, EXIT_PLAN_MODE_TOOL_NAME,
   FILE_EDIT_TOOL_NAME, FILE_WRITE_TOOL_NAME, NOTEBOOK_EDIT_TOOL_NAME]
  ```
  This is the structural enforcement: Explore / Plan / Verify cannot mutate the project regardless of what the prompt says.
- **Plan mode.** A permission mode whose enforcement is delivered as a per-iteration `plan_mode` system-reminder attachment (`utils/messages.ts:getPlanModeV2Instructions`). The engine is mode-agnostic for plan — the model obeying the reminder is what holds the line.
- **Verification verdict.** The verifier must end its output with `VERDICT: PASS`, `VERDICT: FAIL`, or `VERDICT: PARTIAL`. The caller parses this. This is the only programmatic gate on verification.

The reading: claude-code chooses to ship the methodology as a *policy layer* (prompts + tool bindings + one parsed contract) rather than as runtime state. The model is the active sequencer; the runtime exists to make its choices safe and recoverable.

## Sub-agents & Parallelism

### AgentTool

`src/tools/AgentTool/AgentTool.tsx` (1,397 lines) is the primary multi-agent primitive. Its input schema includes:

```typescript
description: string             // 3-5 word
prompt: string
subagent_type?: string          // 'general-purpose', 'Explore', 'Plan', 'verification', plugin types, ...
model?: 'sonnet' | 'opus' | 'haiku'
run_in_background?: boolean
name?: string                   // makes it addressable via SendMessage
team_name?: string              // multi-agent swarm
mode?: PermissionMode           // 'plan' to require plan approval
isolation?: 'worktree' | 'remote'
cwd?: string                    // absolute path override
```

The output is a discriminated union: `completed` (sync), `async_launched` (background — returns an `agentId` and output file), `teammate_spawned` (swarm internal), or `remote_launched` (CCR session URL).

### runAgent and createSubagentContext

`src/tools/AgentTool/runAgent.ts` builds the execution environment:

1. Resolve the agent's tool pool (`resolveAgentTools` — applies the agent definition's `tools`/`disallowedTools`/MCP requirements)
2. Connect agent-specific MCP servers (`initializeAgentMcpServers`) — additive to the parent's MCP clients, with frontmatter MCP skipped for user-controlled agents under `strictPluginOnlyCustomization`
3. Build the system prompt context (`buildEffectiveSystemPrompt`)
4. Create the subagent context (`createSubagentContext` in `utils/forkedAgent.ts`)
5. Run another `query()` loop
6. Record sidechain transcript data (`recordSidechainTranscript`)

`createSubagentContext()` is the deliberate containment layer:

- Clones `readFileState` so the parent's read cache isn't polluted
- Creates a child `AbortController` linked to the parent
- Gives the subagent isolated mutable state (its `setAppState` becomes a no-op unless explicit sharing is enabled)
- Suppresses permission prompts (`shouldAvoidPermissionPrompts: true`) for background agents
- Clones `contentReplacementState` so cache-sharing forks make identical decisions
- Freezes the parent's `renderedSystemPrompt` so the fork shares the parent's prompt cache (re-calling `getSystemPrompt()` at fork-spawn can diverge on GrowthBook cold→warm and bust the cache — see comment in `Tool.ts:294-299`)

### Built-in agents

`src/tools/AgentTool/built-in/`:

- `generalPurposeAgent.ts` — `tools: ['*']`, default
- `exploreAgent.ts` — fast read-only file/code search; haiku for external users, inherit for ants; `omitClaudeMd: true`; denylist of 5 mutating tools
- `planAgent.ts` — read-only plan-then-design; same denylist; inherits Explore's tools; required output section `### Critical Files for Implementation`
- `verificationAgent.ts` — adversarial verifier; `background: true`; `criticalSystemReminder_EXPERIMENTAL` enforcing VERDICT line; same 5-tool denylist + tmp-only writes
- `claudeCodeGuideAgent.ts` — for product onboarding
- `statuslineSetup.ts` — setup helper

The Explore agent's prompt is structurally read-only — it enumerates a "STRICTLY PROHIBITED" list (no Write, touch, Edit, rm, mv/cp, temp files, `>`/`>>`/`|` redirects, state-changing commands). The denylist makes this true regardless of what the prompt says.

### Tasks: durable agent work

`src/Task.ts` defines task types:

```
local_bash | local_agent | remote_agent | in_process_teammate
local_workflow | monitor_mcp | dream
```

Each has an id (prefix per type, then 8 chars from `[0-9a-z]`), status, description, optional toolUseId, startTime/endTime, totalPausedMs, outputFile, outputOffset, and notified flag. Tasks under `src/tasks/`:

- `LocalAgentTask` — synchronous in-process agent under the main runtime
- `RemoteAgentTask` — agent running in a CCR remote session, accessible via `getRemoteTaskSessionUrl`
- `LocalMainSessionTask` — the main session itself, surfaced for `claude ps`
- `LocalShellTask` — `BashTool` async shells
- `DreamTask` — `autoDream` consolidation
- `monitor_mcp` — long-running MCP monitors

Tasks are the bridge between transient agent execution and durable session state. The main runtime treats them as managed work items: it can kill them, list them, fetch their output, and inject task-completion notifications back into the parent's history as `<task-notification>` XML inside user-role messages.

### Coordinator mode

`src/coordinator/coordinatorMode.ts` is a single-file mode toggled by `CLAUDE_CODE_COORDINATOR_MODE`. The coordinator system prompt narrows the orchestration tools to `AgentTool`, `SendMessageTool`, `TaskStopTool`, and (optionally) PR-subscribe tools. Workers (spawned via `subagent_type: 'worker'`) receive a filtered tool pool (`ASYNC_AGENT_ALLOWED_TOOLS`, minus orchestration). Worker results arrive as user-role messages with `<task-notification>` XML. The coordinator system prompt explicitly tells the model: every message is to the user; worker results and system notifications are internal signals, not conversation partners — never thank or acknowledge them.

Architecturally: same `query.ts` loop, different prompt + tool filter. The same pattern recurs for swarm / teammate / remote modes.

### Worktree isolation

`src/tools/EnterWorktreeTool/EnterWorktreeTool.ts` creates an isolated git worktree, switches the session into it, and clears cwd-dependent caches (memory, system prompt sections). `ExitWorktreeTool` reverses it. `AgentTool` with `isolation: 'worktree'` creates a temporary worktree just for that agent, so it can edit files without colliding with the parent. The worktree path is persisted (`saveWorktreeState`) so `/resume` can re-enter it.

### Remote sessions

`src/remote/RemoteSessionManager.ts` manages remote CCR sessions: WebSocket subscriptions for streamed SDK messages, HTTP message sends, permission request/response over a side channel. Remote sessions mirror the local runtime's message and permission model rather than inventing a new protocol — they just happen to flow over the network. `src/bridge/bridgeMain.ts` (2,999 lines) is the inverse: it turns the local machine into a remotely managed environment, polling work, spawning sessions, managing worktrees, heartbeats, and reconnects.

## Design Philosophy & Distinctive Choices

A few patterns are characteristic of claude-code beyond what's typical in "AI CLI" projects:

**One loop, many policies.** `src/query.ts` is the only assistant loop. Interactive vs headless, main vs subagent, coordinator vs worker, remote vs local — all are different *configurations* of the same loop. Coordinator mode is just `CLAUDE_CODE_COORDINATOR_MODE=1` plus a different system prompt and a filtered tool pool. Verification is just a built-in agent definition with a tight denylist and a verdict-parsing contract. This is why methodology (gather → act → verify) shows up as recognizable shape without a phase enum.

**Tight integration of compaction.** Context management is inside the normal turn loop, not external. Snip → microcompact → context collapse → autocompact runs *before every model call*. Reactive compact and collapse-drain are real-413 recovery paths. The loop is built assuming long-session survivability is the default mode, not the exceptional one.

**Trust-and-verify delegation.** Read-only subagents (Explore, Plan, Verify) share a 5-tool denylist that makes mutation impossible. The verification agent's prompt is heavily adversarial — *"Your job is not to confirm the implementation works — it's to try to break it."* It must end with `VERDICT: PASS|FAIL|PARTIAL`. The caller is required (per the system prompt) to spot-check 2-3 commands from the verifier's report. The agent prompt explicitly enumerates rationalizations the model uses to skip verification ("the code looks correct based on my reading", "the implementer's tests already pass") and instructs it to recognize and reverse them.

**Defer-tools mechanism.** MCP tools and any tool with `shouldDefer: true` are sent to the model as names only; full schemas are fetched on demand via `ToolSearchTool`. This lets a session attach large MCP servers (Slack, Drive, Calendar, GitHub, ...) without blowing the turn-1 token budget. The contract is encoded in `<system-reminder>` and a structured `<functions>` block result.

**File-based extension everywhere.** Skills, agents, plugins, output styles, and workflows are all markdown + frontmatter. The same loader (`loadMarkdownFilesForSubdir`) powers them. Skill frontmatter can include `paths` for conditional activation, `hooks` for active-only hook attachment, and `context: fork` to run as a forked subagent.

**Sandboxing as a separate plane.** Permissions decide *whether*; the sandbox decides *what runtime capabilities*. The two cooperate but live in different modules. `WebFetch(domain:example.com)` permission rules become filesystem/network policy in the sandbox adapter. Writes to `.claude/skills` and `settings.json` files are *always* blocked at the sandbox layer regardless of permission rules — those are code-execution surfaces.

**Recovery is control flow, not exception handling.** The query loop's `transition` field tracks why an iteration continued. Prompt-too-long, max-output-tokens, model fallback, stop-hook blocking, token budget continuation, image errors — all are normal `continue` paths with state guards against spirals (`hasAttemptedReactiveCompact`, `state.transition?.reason !== 'collapse_drain_retry'`, `maxOutputTokensRecoveryCount < 3`).

**Streaming overlap.** `StreamingToolExecutor` runs concurrency-safe tools while the model is still emitting tokens. Tool-use summaries (`generateToolUseSummary`, a Haiku call) fire after one turn and resolve during the *next* model stream. Memory and skill prefetch start at iteration top and consume post-tool. Latency-sensitive supplementary work is hidden under the long model call.

**Background work as agent workflows.** `autoDream` consolidation, `extractMemories` turn-end forks, and `agentSummary` are all forked subagents under the same `query()` engine, not separate background services. This is part of why they can share the same prompt cache, permission model, and tool filtering as foreground work.

**Multiple trust boundaries.** Plugin-only restriction modes; managed-policy settings that supersede user settings; project-settings exclusion from sensitive overrides (so a hostile repo can't redirect memory paths); explicit "remote vs local" trust splits for MCP skills; the coordinator-workers explicit-context-only relay model. The codebase pays serious attention to *who can configure what*.

**Representative prompt quotes.**

From `getActionsSection()` (`src/constants/prompts.ts:255-267`):

> Carefully consider the reversibility and blast radius of actions. Generally you can freely take local, reversible actions like editing files or running tests. But for actions that are hard to reverse, affect shared systems beyond your local environment, or could otherwise be risky or destructive, check with the user before proceeding. … When you encounter an obstacle, do not use destructive actions as a shortcut to simply make it go away … measure twice, cut once.

From the verification agent (`src/tools/AgentTool/built-in/verificationAgent.ts:10-12`):

> You are a verification specialist. Your job is not to confirm the implementation works — it's to try to break it. … You have two documented failure patterns. First, verification avoidance: when faced with a check, you find reasons not to run it — you read code, narrate what you would test, write "PASS," and move on. Second, being seduced by the first 80% …

From the recovery prompt for max-output-tokens (`src/query.ts:1226-1227`):

> Output token limit hit. Resume directly — no apology, no recap of what you were doing. Pick up mid-thought if that is where the cut happened. Break remaining work into smaller pieces.

From the coordinator prompt (`src/coordinator/coordinatorMode.ts:126`):

> Every message you send is to the user. Worker results and system notifications are internal signals, not conversation partners — never thank or acknowledge them. Summarize new information for the user as it arrives.

## Key Takeaways

- **One conversation engine, layered configurations.** The interactive REPL, the headless SDK, subagents, coordinator workers, remote sessions, bridge mode, dream consolidation, and verification all run the same `query.ts` loop — distinguished only by prompts, tool filters, and permission contexts. Multi-agent behavior is not a separate platform; it is the same loop with different policy.
- **Methodology lives in policy, not state.** There is no `Phase` enum and no state-machine sequencer for "gather → act → verify." The shape is encoded in prompt rules, a small library of read-only subagent components (Explore / Plan / Verify), a shared 5-tool denylist that makes mutation structurally impossible for those subagents, and one parsed contract (`VERDICT: PASS|FAIL|PARTIAL`). The model is the active sequencer.
- **Context pressure is normal.** A five-stage compaction pipeline (tool-result budget → snip → microcompact → context collapse → autocompact) runs *inside* the loop before every model call, plus two reactive paths (collapse-drain, reactive compact) for real 413s. The loop assumes long-session survivability is the default mode, not the exception.
- **Recovery as control flow.** Prompt-too-long, max-output-tokens, model fallback, interruption, stop-hook blocking, and token budget continuation are all `continue` paths with explicit anti-spiral guards. The loop is a resilient state machine, not a happy-path request handler.
- **Defer-tools / declarative extension everywhere.** MCP tools are name-only until `ToolSearch` resolves their schemas. Skills, agents, plugins, output styles, and workflows are markdown + frontmatter with a shared loader. Extension is declarative and trust-aware: plugins, policies, and sandboxes form a layered permission system separate from per-call permission decisions.
- **Trust boundaries are intentional and visible.** Plugin-only restriction modes; project-settings exclusion from sensitive overrides; explicit remote/MCP trust splits; sandbox-level blocks on `.claude/skills` and settings files; subagent permission contexts that auto-deny prompts for background agents. The codebase is recognizably the design of a team that has watched users try to escape every boundary they built.
