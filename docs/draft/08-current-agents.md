# Tier 8 — Current market-leading agents

> Where the seven inherited capabilities land. By 2026 the foundational primitives are stable (Tiers 1-7); what remains is **editorial choice** about how to compose them. Five projects make those choices distinctively enough to be worth a deep read. Per-agent evidence is in `../agents/*.md` with file:line citations.

Order: claude-code → opencode → pi-mono → hermes-agent → openclaw.

## claude-code — Anthropic's layered platform

**Maker:** Anthropic. **Language/runtime:** TypeScript on Node, Ink/React for the TUI. **Surface:** terminal REPL, headless SDK, remote CCR sessions. **Snapshot studied:** leaked via an npm sourcemap (Mar 2026).

Editorial label: **the layered platform.** No ideological refusals — MCP first-class, plugins/skills/output-styles/agents all loadable from markdown + frontmatter, a layered permission/sandbox/hooks stack, file-based extension everywhere. The work is in keeping the layers separable.

Named entities worth knowing:
- **`src/query.ts`** (~1,729 lines) — *the only assistant loop*. Interactive REPL ≈ headless SDK ≈ subagent ≈ coordinator worker ≈ remote ≈ dream consolidation ≈ verification — all are different *configurations* (system prompt + tool filter + permission context) of the same loop.
- **`StreamingToolExecutor`** — concurrency-safe tools run concurrently with the model stream; non-safe tools serialize. Tool-use summaries (a 1s Haiku call) fire after one turn and resolve during the *next* model stream, hiding latency under expensive calls.
- **`AgentTool` + the 5-tool denylist** — every read-only built-in subagent (Explore, Plan, Verify) shares a denylist `[AgentTool, ExitPlanMode, FileEdit, FileWrite, NotebookEdit]`. *Structural enforcement*: read-only subagents cannot mutate regardless of what the prompt says.
- **`memdir/` + `autoDream`** — file-based memory at `MEMORY.md` (200-line cap), daily logs, nightly `/dream` skill (also runs as the background `autoDream` service) that consolidates logs into topic files. Consolidation is itself a forked subagent under the same loop.
- **`sandbox-adapter.ts`** — translates permission/config state into `@anthropic-ai/sandbox-runtime` directives (filesystem, network, managed-domain restrictions). Writes to `.claude/skills/` and `settings.json` are *always* blocked at the sandbox layer regardless of permission rules.
- **MCP `client.ts`** (~3,348 lines, comparable to the model API client) — first-class, with the **defer-tools mechanism** (`ToolSearchTool`) that ships MCP tools as names-only and fetches schemas on demand via a `<system-reminder>` block.
- **Hooks** — 28 lifecycle events with three execution backends (prompt-user, fork-agent, HTTP webhook with SSRF guard). Hooks can be registered from settings, frontmatter, plugins, or sessions.
- **Verification subagent** — adversarial prompt ("your job is not to confirm the implementation works — it's to try to break it"), 5-tool denylist, structurally read-only, must end with `VERDICT: PASS|FAIL|PARTIAL`. The caller is required to spot-check 2-3 of its commands.

The shape: a 5,000-line REPL controller, ~100 slash-commands, ~40 built-in tools, a layered extension stack (commands → skills → plugins → MCP) all loaded from markdown + frontmatter. Three sleeper concerns are visible in the source: **prefix-cache discipline as architecture** (`backfillObservableInput` mutates clones; subagent contexts clone `contentReplacementState`); **recovery as control flow** (the `transition` field on the loop's State records *why* the previous iteration continued, with explicit anti-spiral guards for prompt-too-long, max-output-tokens, model fallback); and **trust boundaries everywhere** (plugin-only restriction modes, project-settings exclusion from sensitive overrides, MCP skills flagged untrusted relative to local file skills).

## opencode — SST's typed protocol surface

**Maker:** SST + community. **Language/runtime:** TypeScript on Bun, Effect framework. **Surface:** SolidJS + OpenTUI terminal UI, HTTP server, Electron desktop, ACP bridge, web/mobile clients.

Editorial label: **server-first; clients are interchangeable.** Every UI starts an in-process HTTP server and talks to it via the generated SDK. `opencode serve` and `opencode attach <url>` are the same code path. The OpenAPI spec at `/doc` drives a generated TypeScript SDK that every client uses. Hand-tuned prompts per provider family (eight provider-flavored system prompts under `session/prompt/`).

Named entities:
- **`SessionPrompt.runLoop`** (`session/prompt.ts`) — session-level loop deciding when to compact, summarize, fork to subagents, stop.
- **`SessionProcessor`** (`session/processor.ts`) — per-turn AI-SDK stream consumer. Projects events into a typed `MessageV2.Part` graph; supports doom-loop detection (3 identical tool calls in a row → ask for a `doom_loop` permission).
- **AI SDK + `models.dev`** — 23 bundled providers lazy-loaded on demand (`packages/opencode/src/provider/provider.ts`); the catalog is read **live** from `https://models.dev` with a 5-min disk-mtime check on every read plus a 60-min background refresh fiber. New models appear without code changes.
- **`Permission.Ruleset`** — pattern-rule engine (`{permission, pattern, action: allow|deny|ask}[]`), evaluated with wildcards, merged from agent defaults + user config + session ruleset, **persisted per project**. `doom_loop` / `question` / `external_directory` / `plan_*` / `repo_clone` are first-class permission keys.
- **Snapshot side-git** at `Global.Path.data/snapshot/<projectID>/<hash(worktree)>` — independent of the user's worktree, so `session.revert(messageID)` works for non-git projects too.
- **`sync/` event-sourcing layer** — every state-mutating event is recorded in a dedicated `event` table with monotonic `seq`. Projectors update the database; events are re-published through the bus for back-compat. Foundation for "shareable sessions" via debounced bus-subscriber push to `console.opencode.ai` or `opncd.ai`.
- **`acp/` server** — `opencode acp` is a stdio-NDJSON JSON-RPC ACP server, built on `@agentclientprotocol/sdk` for Zed integration.
- **`experimental_repairToolCall`** — case-mismatched tool names rewritten (`Read` → `read`); unknown calls routed to a sink `invalid` tool whose error becomes a tool result the model self-corrects from. **Bad tool calls flow through the tool channel, not the exception channel.**

The shape: every UI is a client; the server is the product. Effect-flavored Service/Layer composition everywhere; AGENTS.md codifies conventions. Reads `~/.claude/skills/` directly (provider-agnosticism extended to artifacts). The `task` tool spawns subagents (`build` / `plan` / `general` / `explore` / `scout` experimental + user-defined in `opencode.json`). Plugin contract (`@opencode-ai/plugin`) registers tools, auth providers, workspace adapters, and ~20 hooks. ACP-as-of-2026 in both directions for many setups (the IDE drives opencode; opencode drives MCP servers).

## pi-mono — badlogic's refused-and-eject minimalism

**Maker:** Mario Zechner (badlogic). **Language/runtime:** TypeScript on Node (Bun optional for compiled binary). **Surface:** terminal TUI (default), print/json/RPC modes for non-interactive.

Editorial label: **seven tools forever; everything else is an extension.** From `packages/coding-agent/README.md:468-484`:

> *"No MCP. No sub-agents. No permission popups. No plan mode. No to-dos. No background bash."*

Every feature everyone else ships in core is *refused* and shipped as a community extension instead. The contribution gate auto-closes new contributors' PRs by default; `lgtmi`/`lgtm` whitelisting is required. AGENTS.md: "No emojis in commits, issues, PR comments, or code."

Named entities:
- **`pi-ai` / `pi-agent-core` / `pi-coding-agent`** — three-package monorepo, lockstep versioned (every package always shares the same version number). The agent loop is itself a library someone else can consume — *and openclaw does*.
- **`agentLoop`** (`packages/agent/src/agent-loop.ts`) — pure async-generator-style loop. Inner loop drains tool calls; outer `while(true)` rearms on follow-up messages. **Two-tier interruption**: steering (Enter, polled at every turn boundary) vs follow-up (Alt+Enter, only when the loop would otherwise exit).
- **The seven tools** — `read`, `write`, `edit`, `bash` (default-on); `grep`, `find`, `ls` (read-only extras). Default-on set is the four coding tools.
- **Pluggable `Operations`** — every built-in tool delegates side effects through an `Operations` interface (e.g. `BashOperations` is `{ exec(cmd, cwd, opts) }`). SSH transport (`pi-ssh-remote`), micro-VM sandboxes (`gondolin`, `lima`), and audit layers (`toolwatch`) can be inserted without forking pi.
- **`ExtensionAPI`** — TypeScript factory loaded with `jiti`. 20+ event types covering session/agent/turn/message/tool lifecycle; full TUI surface replacement (footer, header, editor, widgets); OAuth provider registration. Pi Packages are npm/git-distributed bundles with extensions, skills, prompts, and themes.
- **`SKILL.md` loader** (`packages/coding-agent/src/core/skills.ts`) — Agent Skills v1 format, walks `~/.pi/agent/skills/`, `.pi/skills/`, `~/.agents/skills/`, `.agents/skills/`. The model sees only `name`, `description`, and `<location>` — it must `read` the file to invoke. Compatible with Claude Code, Codex CLI, Amp, Droid via the same file format.
- **JSONL session tree** — sessions are JSONL files with one entry per line, organized as an in-place tree (each entry has `id` and `parentId`). Enables `/tree` for branch navigation, `/fork` for new files, `/clone` for duplicates.
- **`pi-ai`** provider matrix — ~25 providers across 9 wire APIs (Anthropic, Google, Mistral, OpenAI completions, OpenAI responses, Codex responses, Azure, Bedrock, Google Vertex), hand-implemented. Built-in OAuth for Anthropic Pro/Max, OpenAI Codex, GitHub Copilot, Gemini CLI.

The shape: a hand-crafted minimal core. Multi-agent behavior delegated entirely to extensions or external tools spawned via tmux. The session JSONL tree is shareable, forkable, replayable. The maintainer publishes his own work sessions on Hugging Face as training data.

## hermes-agent — Nous Research's self-improving training environment

**Maker:** Nous Research. **Language/runtime:** Python. **Surface:** classic CLI, Ink TUI (Node child process with a Python `tui_gateway/server.py` bridging), `hermes gateway` daemon (Telegram/Discord/Slack/WhatsApp/Signal/Matrix/email/...), `hermes acp` editor server, `hermes dashboard` web UI, cron-scheduled autonomous sessions.

Editorial label: **self-improving; the agent edits its own substrate.** The agent edits its own skills, memory, and cron jobs. The same loop is also an RL training environment for the model that will run it.

Named entities:
- **`AIAgent` (`run_agent.py`, ~15.7k LOC)** — the OpenAI-format core loop. Vanilla `while (api_call_count < max_iterations and budget_remaining > 0)` plus interrupt check. Default `max_iterations=90`. Six runtimes (CLI, TUI, gateway, ACP, dashboard, cron) all share this same `AIAgent` against `~/.hermes/state.db`.
- **`gateway/run.py`** — long-lived async process connecting to ~20 messaging platforms. LRU agent cache (max 128, 1h idle TTL). Cross-platform session continuity. Voice-memo STT before the agent sees the message. The api_server adapter is an *OpenAI-compatible HTTP server* — Hermes can pretend to be a chat-completions provider.
- **`acp_adapter/`** — ACP sessions are persisted to the **shared `~/.hermes/state.db`**, so what the editor sees is the same agent the operator sees. A sibling `acp_registry/` directory ships `agent.json` + `icon.svg` for editor-side discovery (ACP has metadata conventions on top of the wire).
- **`MemoryProvider` ABC** — plugins implementing `initialize / system_prompt_block / prefetch / sync_turn / on_pre_compress / on_delegation / shutdown`. Shipping providers: honcho, mem0, supermemory, byterover, hindsight, holographic, openviking, retaindb. Bounded file-backed memory at `MEMORY.md` (2200 char cap) and `USER.md` (1375 char cap) — *frozen snapshot* at session start; mid-session writes go to disk but not to the prefix (prefix-cache discipline as architecture).
- **`curator.py`** — auxiliary forked agent that auto-archives stale skills. Inactivity-triggered (24h gap default), uses a *different* model (auxiliary client), never auto-deletes (only archives, reversible), never touches bundled/hub skills (only *agent-created*).
- **`batch_runner.py` + `environments/`** — SFT trajectory factory + Atropos RL environments. **The same agent runtime that you type at is also the one being rolled out for RL training of the model it will be running.** The agent is its own training distribution.
- **FTS5 session search** — SQLite full-text search over all past sessions; auxiliary model summarizes top matches.
- **Cron scheduler** — autonomous scheduled jobs with 3-min hard interrupt, per-job skills/model/`context_from` chaining. Cron sessions pass `skip_memory=True` so cron output doesn't pollute the user model.

The shape: multi-process, multi-surface, but one source of truth — `~/.hermes/state.db`. Ships its own client-side tool-call parsers for hermes / mistral / llama3_json / qwen / deepseek / kimi / glm dialects. The Teknium-signed rule in `AGENTS.md`: *plugins MUST NOT modify core files; if a plugin needs a capability the framework doesn't expose, expand the generic plugin surface — never hardcode plugin-specific logic into core.* Migrates from `~/.openclaw` via `hermes claw migrate` — Hermes evolved from OpenClaw.

## openclaw — community single-operator gateway

**Maker:** independent project. **Language/runtime:** TypeScript on Node ≥22.12. **Surface:** WebSocket Gateway daemon (`ws://127.0.0.1:18789`), Lit-based web Control UI, macOS menu-bar app, iOS/Android node apps, in-process channel plugins (WhatsApp/Telegram/Slack/Discord/Signal/iMessage/Matrix/Teams/Zalo/...).

Editorial label: **single-operator-trusted; lean core; tiered Docker sandbox.** From VISION.md: "the AI that actually does things... on your devices, in your channels, with your rules" — single-operator, terminal-first, ClawHub for skills, mcporter for MCP, no agent-hierarchy frameworks in core.

Named entities:
- **The Gateway** (`src/gateway/server.ts`) — WS daemon at `ws://127.0.0.1:18789`, PROTOCOL_VERSION 3, TypeBox-defined schemas (~150 message types) → JSON Schema → Swift codegen via `protocol:gen:swift`. AJV validation on every inbound frame.
- **Three `Dockerfile.sandbox*`** — `Dockerfile.sandbox` (minimal Debian + bash/python3/jq/git/ripgrep, ~20 lines, pinned digest, non-root user); `Dockerfile.sandbox-common` (adds Node/Bun/Go/Rust/Brew/build-essential); `Dockerfile.sandbox-browser` (Chromium + Xvfb + x11vnc + noVNC + websockify + socat with CIDR-allowlist forwarding). Sandbox modes: `off`/`non-main`/`all`; scopes: `session`/`agent`/`shared`; workspaceAccess: `none`/`ro`/`rw`. Containers are labeled and **config-hashed** so the gateway can detect drift.
- **`pi-embedded-runner.ts` + `pi-embedded-subscribe.ts`** — **pi-mono as the agent runtime.** OpenClaw imports `@mariozechner/pi-agent-core` + `@mariozechner/pi-coding-agent` + `@mariozechner/pi-ai` and adds session lanes, sandbox wiring, gateway stream multiplexing, multi-channel routing on top.
- **Plugin SDK** published as `openclaw/plugin-sdk` (~600 lines of curated re-exports, codegen'd `.d.ts` via `tsconfig.plugin-sdk.dts.json`). **24 hook events** including `subagent_*`, `before_compaction`, `tool_result_persist`, `before_message_write` — one of the broadest plugin surfaces of any open-source agent. Memory is a single-slot plugin.
- **`acp/server.ts` + `extensions/acpx`** — *bidirectional* ACP. `openclaw acp` serves ACP for IDEs (stdio NDJSON; advertises `mcpCapabilities: {http: false, sse: false}` — MCP intentionally not in-band). `extensions/acpx` lets OpenClaw drive Codex / Claude Code / Gemini CLI / OpenCode / Pi as **nested ACP children**.
- **`clawhub.ai`** — skill registry. From VISION.md: "We still ship some bundled skills for baseline UX. New skills should be published to ClawHub first... not added to core by default."
- **`mcporter` skill** — MCP support is implemented as a *skill*, not an extension. From VISION.md: "we prefer this bridge model over building first-class MCP runtime into core." The skill abstraction is rich enough to host a whole MCP bridge.
- **Podman + Quadlet** (`setup-podman.sh`) — rootless production runtime via systemd Quadlet units; recommended deployment posture.

The shape: one daemon, many clients. Multi-channel by default — the gateway runs WhatsApp + Slack + Telegram + Discord + Signal + iMessage + Teams + Matrix + Zalo all at once. SECURITY.md is explicit that OpenClaw does *not* model one gateway as a multi-tenant boundary; the recommended deployment is one user per host, one gateway per user. Same binary runs locally (`npm install -g openclaw`), via Docker Compose, via Podman+Quadlet, on Fly.io, on Render, in the macOS menu bar.

## Three families

The five agents do not occupy a continuum; they cluster:

- **Family A — coding agents (claude-code, opencode, pi-mono).** Single-purpose: drive a developer's terminal. Tight feedback loops, file editing, shell automation. Stay close to cwd. Sessions ephemeral by default. Multi-agent collaboration is internal (subagents for explore/plan/verify), not human-to-human.

- **Family B — personal-assistant platforms (hermes-agent, openclaw).** Multi-surface. The same agent core runs as a daemon reachable from Telegram, Discord, Slack, WhatsApp, iMessage, Signal, Matrix, email, web, mobile, terminal. Sessions are durable. The agent has channels into the user's life, not just their editor. **These two share an unusual amount of DNA** — hermes ships `hermes claw migrate` to import `~/.openclaw`.

- **Family C — reusable substrate (pi-mono).** Sits in both families. Itself a coding agent (Family A), but also the agent runtime openclaw embeds (Family B). The only one of the five that explicitly ships its agent loop as a library someone else's product can consume.

Tier 9 picks up the cross-cut: what patterns these five agents share, where they structurally diverge, and what the rifts reveal about the field.
