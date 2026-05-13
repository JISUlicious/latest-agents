# OpenClaw

## Overview

OpenClaw is a personal, multi-channel AI assistant that runs as a long-lived local **Gateway** (a WebSocket control plane) plus a fleet of optional surfaces: a CLI, a Lit-based web Control UI, a macOS menu-bar app, iOS/Android "node" apps, and a swarm of in-process plugins for messaging channels (WhatsApp, Telegram, Slack, Discord, Signal, iMessage, Matrix, Teams, Zalo, etc.). It is a pnpm TypeScript monorepo (a few thousand TS files in `src/`, 39 extensions, 52 skills) that re-uses Mario Zechner's `pi-mono` for the agent runtime and tools, but owns its own session model, gateway protocol, sandbox stack, ACP bridge, plugin SDK, and tool wiring. The editorial stance from `VISION.md` is explicit: "OpenClaw is the AI that actually does things. It runs on your devices, in your channels, with your rules." — single-operator, terminal-first, lean core, everything else as plugins/skills.

## Architecture

### Top-level process model

OpenClaw is centered on **one daemon process per host**: the **Gateway**. Everything else is a client. From `docs/concepts/architecture.md` and `README.md`:

```
WhatsApp / Telegram / Slack / Discord / Google Chat / Signal / iMessage / Matrix / Zalo / WebChat
               │
               ▼
┌───────────────────────────────┐
│            Gateway            │
│       (control plane)         │
│     ws://127.0.0.1:18789      │
└──────────────┬────────────────┘
               │
               ├─ pi-mono agent (in-process, RPC)
               ├─ CLI (openclaw …)
               ├─ WebChat / Control UI (served by gateway HTTP)
               ├─ macOS app (menu bar)
               └─ iOS / Android nodes
```

The gateway:

- Owns **all** provider connections (one Baileys WhatsApp session per host, one Telegram grammY runner, one Slack Bolt app, ...).
- Exposes a **typed JSON-over-WebSocket API** for both control-plane clients and "nodes" (role `node`).
- Serves the Control UI and the Canvas/A2UI host over HTTP under `/__openclaw__/canvas/` and `/__openclaw__/a2ui/` on the same port (default `18789`).
- Runs the embedded pi-mono agent runtime in-process and persists session JSONL transcripts under `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.

The README is explicit: *"The Gateway is just the control plane — the product is the assistant."*

### Repo layout

| Path | Role |
| --- | --- |
| `src/` | Core TypeScript: agent runtime wiring, gateway server, channels, ACP, tools, plugin loader, CLI, web, canvas-host, infra |
| `src/gateway/` | WS server, request handlers (`server-methods/*`), protocol schemas, client |
| `src/agents/` | pi-mono integration, tool wiring, sandbox, sessions, providers, auth profiles (the largest subtree by far — hundreds of files including colocated tests) |
| `src/acp/` | Agent Client Protocol bridge (stdio NDJSON → Gateway WS) |
| `src/plugins/` | Plugin discovery, loader (jiti), manifest registry, hooks, runtime, HTTP routes |
| `src/plugin-sdk/` | Public re-exports for plugin authors; `.d.ts` is generated via `tsconfig.plugin-sdk.dts.json` and published as `openclaw/plugin-sdk` |
| `src/canvas-host/` | Live agent-driven HTML/CSS/JS canvas + A2UI bundle |
| `src/channels/`, `src/discord/`, `src/slack/`, `src/telegram/`, `src/whatsapp/`, `src/signal/`, `src/imessage/`, `src/line/`, `src/web/` | Built-in channel implementations |
| `src/node-host/`, `src/pairing/`, `src/daemon/` | Device pairing, node mode, launchd/systemd installation |
| `extensions/*` | 39 workspace packages, each shipping an `openclaw.plugin.json` + `index.ts` (extension-channels like `msteams`, `matrix`, `zalo`, `bluebubbles`; non-channel plugins like `acpx`, `memory-core`, `memory-lancedb`, `voice-call`, `diagnostics-otel`, etc.). MCP integration is via the `mcporter` skill, not a core extension. |
| `skills/` | 52 bundled skills (`*/SKILL.md` + scripts), e.g. `coding-agent`, `clawhub`, `gemini`, `notion`, `peekaboo`, `skill-creator`, `tmux` |
| `packages/clawdbot/`, `packages/moltbot/` | Legacy bot bundles kept inside the workspace |
| `apps/macos/`, `apps/ios/`, `apps/android/`, `apps/shared/` | Native companion apps (SwiftUI, Compose). `OpenClawKit` is shared Swift |
| `ui/` | Vite + Lit web Control UI (`openclaw-control-ui`), independent `vitest.config.ts` |
| `vendor/` | Pinned local copies of external code |
| `test/` | Cross-cutting e2e and integration tests; per-source `*.test.ts` are colocated |
| `Dockerfile`, `Dockerfile.sandbox*`, `docker-compose.yml`, `fly.toml`, `render.yaml`, `setup-podman.sh` | Deployment matrix (see Hosting section) |

### Entry points and language choice

- The shipped binary is the Node wrapper `openclaw.mjs` (`bin: { openclaw: "openclaw.mjs" }` in `package.json`). It tries `./dist/entry.js` then `./dist/entry.mjs`, after installing a process-warning filter (`dist/warning-filter.js`).
- `src/entry.ts` is the actual entry: it normalizes argv (Windows quirks), applies CLI profiles, optionally **respawns itself** with `--disable-warning=ExperimentalWarning` so Node experimental warnings stay quiet (`src/entry.ts:69` `ensureExperimentalWarningSuppressed`), then dynamic-imports `./cli/run-main.js` to construct the Commander program.
- Runtime baseline is **Node ≥22.12** (see `engines` in `package.json`). The README notes Bun is optional for running TypeScript directly, but Node remains the production runtime.
- `VISION.md` justifies the TypeScript choice: "OpenClaw is primarily an orchestration system: prompts, tools, protocols, and integrations. TypeScript was chosen to keep OpenClaw hackable by default."

### Why so many directories?

- `apps/` are platform-native clients (Swift + Kotlin) — the gateway protocol is the contract; Swift models are codegen'd from JSON Schema via `pnpm protocol:gen:swift`.
- `packages/clawdbot` and `packages/moltbot` are legacy/parallel bot bundles preserved by the rename history (VISION.md: "Warelay -> Clawdbot -> Moltbot -> OpenClaw"); they remain pnpm workspace packages but are not the product surface.
- `extensions/*` are pluggable, each its own workspace package with its own `package.json`, plugin manifest, and `openclaw/plugin-sdk` peer dep.
- `skills/*` are agent-facing prompt-and-scripts bundles (Markdown + optional binaries). They are not loaded as code by the gateway — they are read by the agent as instructions plus shell tools.
- `ui/` is a separate pnpm workspace package (`openclaw-control-ui`), Lit-based, served by the gateway HTTP server.

## ACP: Agent Client Protocol

OpenClaw treats ACP (Zed's Agent Client Protocol via `@agentclientprotocol/sdk` 0.14.1) as a **bridge surface, not a primary protocol**. The canonical doc is `docs.acp.md` at the repo root; the implementation lives in `src/acp/` and the CLI command is `openclaw acp`.

### What ACP is here

ACP is a stdio NDJSON RPC used by IDEs (Zed primarily) to drive an agent. OpenClaw's `acp` command spawns a process that:

1. Opens stdin/stdout NDJSON streams via `ndJsonStream(...)` from the SDK (`src/acp/server.ts:117`).
2. Connects to a running OpenClaw Gateway over WebSocket using the configured `gateway.remote.*` credentials or `--url`/`--token` flags (`src/acp/server.ts:58-88`).
3. Maps ACP sessions to Gateway session keys.
4. Translates ACP `prompt` → gateway `chat.send`; ACP `cancel` → gateway `chat.abort`; ACP `listSessions` → gateway `sessions.list`.

### Key files

- `docs.acp.md` — operator-facing manual (only top-level doc named like a sibling file)
- `src/acp/server.ts` — process bootstrap, gateway connect, signal handling, stdio NDJSON setup
- `src/acp/translator.ts` — `AcpGatewayAgent` class implementing the SDK `Agent` interface (`initialize`, `newSession`, `loadSession`, `prompt`, `cancel`, `unstable_listSessions`, `setSessionMode`, `authenticate`)
- `src/acp/session.ts`, `src/acp/session-mapper.ts` — session store + key resolution from `_meta`/CLI flags
- `src/acp/event-mapper.ts` — converts gateway stream events into ACP `tool_call`/`agent_message_chunk` updates
- `src/acp/policy.ts`, `src/acp/secret-file.ts` — auth + secret file resolution
- `src/acp/runtime/` — a second, related concept: the `AcpRuntime` abstraction for embedding *other* ACP harnesses (Codex, Claude Code, Gemini CLI, Pi) inside OpenClaw via the `acpx` extension

### Capabilities advertised

From `src/acp/translator.ts:122-143`:

```ts
return {
  protocolVersion: PROTOCOL_VERSION,
  agentCapabilities: {
    loadSession: true,
    promptCapabilities: { image: true, audio: false, embeddedContext: true },
    mcpCapabilities: { http: false, sse: false },   // MCP intentionally not in-band
    sessionCapabilities: { list: {} },
  },
  agentInfo: ACP_AGENT_INFO,
  authMethods: [],
};
```

OpenClaw declines to be an MCP host *over ACP*; if you want MCP servers, you use `mcporter` (see VISION.md and the Tool System section).

### Session mapping

Per `docs.acp.md`:

- Default key is `acp:<uuid>` per new ACP session (isolated).
- A CLI flag (`--session agent:design:main`) or per-call `_meta.sessionKey`, `_meta.sessionLabel`, `_meta.resetSession`, `_meta.requireExisting` lets the IDE pin to an existing gateway session.
- `agent:<agentId>:<sessionId>` is the canonical scheme (e.g. `agent:main:main`, `agent:qa:bug-123`).
- One agent can host many ACP sessions; one ACP session maps to exactly one Gateway session key.

### Framing

- Transport: stdio with newline-delimited JSON (NDJSON).
- Logs go to **stderr only**; stdout is reserved for ACP frames (`src/acp/translator.ts:81`).
- Prompt size hard cap: **2 MB** (`MAX_PROMPT_BYTES`, `src/acp/translator.ts:44`), enforced block-by-block in `extractTextFromPrompt` and re-checked after cwd prefixing — CVE-style defense-in-depth (GHSA-cxpw-2g23-2vgw reference in the source).
- Rate limit on session creation: 120 newSession/loadSession per 10s window (`src/acp/translator.ts:61-92`).
- Streaming: gateway `chat:delta` events are converted into ACP `agent_message_chunk` updates with diff-only text (only the new tail is sent — `handleDeltaEvent` tracks `sentTextLength`).
- Terminal mapping: gateway `final` → `end_turn`, `aborted` → `cancelled`, `error` → `refusal`.

### Stop reasons mapped

```
complete -> stop
aborted  -> cancel
error    -> error
```

(`docs.acp.md` "Prompt Translation")

### Two ACP roles

There is also a second, less-obvious ACP integration: OpenClaw can **drive** other ACP harnesses (Codex, Claude Code, Gemini CLI, OpenCode, Pi) as nested sessions via the `extensions/acpx` plugin and the `AcpRuntimeBackend` registry (`src/acp/runtime/registry.ts`, exported through the plugin SDK at `src/plugin-sdk/index.ts:87-94`). The `extensions/acpx` package bundles an `acp-router` skill (`extensions/acpx/skills/acp-router/`) that teaches the agent when to route work into a nested ACP harness rather than the local agent loop. So OpenClaw is both an ACP **agent** (server) and an ACP **client** (via acpx) — symmetric.

## Sandbox Model

This is the single most distinctive piece of OpenClaw's architecture. Three Dockerfiles plus a podman setup script implement a tiered, opt-in sandbox runtime that wraps the agent's `exec`/`process`/`read`/`write`/`edit` tools inside Docker containers. The gateway stays on the host; only the tool execution moves.

### The three Dockerfiles

#### `Dockerfile.sandbox` (the base)

```dockerfile
FROM debian:bookworm-slim@sha256:98f4b71d...
RUN apt-get install -y bash ca-certificates curl git jq python3 ripgrep
RUN useradd --create-home --shell /bin/bash sandbox
USER sandbox
WORKDIR /home/sandbox
CMD ["sleep", "infinity"]
```

20 lines. Pinned digest. Non-root `sandbox` user. Bare-minimum interpreter set (bash, python3, jq, git, ripgrep, curl). No Node by default — the doc explicitly calls this out: *"the default image does not include Node"* (`docs/gateway/sandboxing.md:127`). The container is started with `sleep infinity` and used via `docker exec` (see `src/agents/bash-tools.shared.ts:49 buildDockerExecArgs`). Default image tag in OpenClaw's config: `openclaw-sandbox:bookworm-slim` (`src/agents/sandbox/constants.ts:7`).

#### `Dockerfile.sandbox-common` (the heavy variant)

```dockerfile
ARG BASE_IMAGE=openclaw-sandbox:bookworm-slim
FROM ${BASE_IMAGE}
USER root
ARG PACKAGES="curl wget jq coreutils grep nodejs npm python3 git ca-certificates \
              golang-go rustc cargo unzip pkg-config libasound2-dev build-essential file"
ARG INSTALL_PNPM=1
ARG INSTALL_BUN=1
ARG INSTALL_BREW=1
...
USER ${FINAL_USER}
```

This layers Node, npm, pnpm, Bun, Go, Rust, Homebrew (Linuxbrew at `/home/linuxbrew/.linuxbrew`), `build-essential`, `libasound2-dev` onto the base. It's for users who want a full-fat dev environment but still want the sandbox isolation. Default tag: `openclaw-sandbox-common:bookworm-slim` (`src/agents/sandbox/constants.ts:40`).

#### `Dockerfile.sandbox-browser` (the browser variant)

```dockerfile
FROM debian:bookworm-slim@sha256:98f4b71d...
RUN apt-get install -y bash chromium fonts-liberation fonts-noto-color-emoji \
  novnc socat websockify x11vnc xvfb ...
COPY scripts/sandbox-browser-entrypoint.sh /usr/local/bin/openclaw-sandbox-browser
EXPOSE 9222 5900 6080
CMD ["openclaw-sandbox-browser"]
```

This image bundles Chromium + Xvfb + x11vnc + noVNC + websockify + socat and runs `scripts/sandbox-browser-entrypoint.sh`, which:

1. Starts an X11 virtual framebuffer (`Xvfb :1`).
2. Launches Chromium with CDP on `127.0.0.1:CDP+1`.
3. Uses `socat` to forward `0.0.0.0:CDP` → `127.0.0.1:CDP+1`, optionally restricted with `range=` (CIDR allowlist via `OPENCLAW_BROWSER_CDP_SOURCE_RANGE`).
4. If headless is off, starts `x11vnc` on `:5900` and `websockify` (noVNC) on `:6080` for live observation. A random 8-char VNC password is generated unless one is provided.

Default tag: `openclaw-sandbox-browser:bookworm-slim` (`src/agents/sandbox/constants.ts:39`). The sandbox browser is started lazily when the `browser` tool needs CDP, and the gateway emits a short-lived **noVNC observer URL** so the operator can watch the agent drive the browser in real time.

### Config surface

`agents.defaults.sandbox` (or `agents.list[].sandbox`) is the main config block. The resolved shape lives in `src/agents/sandbox/types.ts`:

```ts
export type SandboxConfig = {
  mode: "off" | "non-main" | "all";
  scope: "session" | "agent" | "shared";
  workspaceAccess: "none" | "ro" | "rw";
  workspaceRoot: string;
  docker: SandboxDockerConfig;
  browser: SandboxBrowserConfig;
  tools: SandboxToolPolicy;
  prune: SandboxPruneConfig;
};
```

- **`mode`** — when to sandbox. `non-main` is the recommended default for shared chats: the `main` session (1:1 you-and-bot) runs on the host, but every group/channel/peer session moves into Docker.
- **`scope`** — granularity. `session` = one container per session (cleanest), `agent` = shared across all sessions of an agent, `shared` = single container for everything.
- **`workspaceAccess`** — `none` (pristine `~/.openclaw/sandboxes/<scope>` workspace; default), `ro` (mounts host workspace read-only at `/agent`), `rw` (mounts read/write at `/workspace`).

### Default tool policy

From `src/agents/sandbox/constants.ts:13-37`:

```ts
DEFAULT_TOOL_ALLOW = [
  "exec", "process", "read", "write", "edit", "apply_patch", "image",
  "sessions_list", "sessions_history", "sessions_send", "sessions_spawn",
  "subagents", "session_status",
];
DEFAULT_TOOL_DENY = [
  "browser", "canvas", "nodes", "cron", "gateway", ...CHANNEL_IDS,
];
```

The implicit contract: inside the sandbox, the agent can write code and shell out, talk to other agents (subagents/sessions_*), and load images. It **cannot** drive the host browser, the canvas, the nodes, cron, the gateway itself, or any messaging channel.

### Container lifecycle and security hardening

`src/agents/sandbox/docker.ts:259-368 buildSandboxCreateArgs` builds the `docker create` command line. The defaults are aggressively locked down:

- `--read-only` if `readOnlyRoot: true`.
- `--tmpfs` for required writable paths.
- `--network none` by default (egress disabled); `network: "host"` is **blocked**; `network: "container:<id>"` is blocked unless `dangerouslyAllowContainerNamespaceJoin: true` (`docs/gateway/sandboxing.md:138-145`).
- `--cap-drop` per config.
- `--security-opt no-new-privileges` (unconditional).
- Optional `--security-opt seccomp=...` and `apparmor=...`.
- `--pids-limit`, `--memory`, `--memory-swap`, `--cpus`, `--ulimit` enforced from config.
- Custom bind mounts validated by `validateSandboxSecurity` (`src/agents/sandbox/validate-sandbox-security.ts`) — blocks `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev`, parent mounts.
- Env vars sanitized through `sanitizeEnvVars` (`src/agents/sandbox/sanitize-env-vars.ts`) — sensitive vars dropped, suspicious vars warned.
- Container is labeled (`openclaw.sandbox=1`, `openclaw.sessionKey=...`, `openclaw.configHash=...`, `openclaw.createdAtMs=...`) so the gateway can match, prune, and detect config drift via the hash (`src/agents/sandbox/config-hash.ts`). If config changes for a hot container, the gateway prints a recreate hint instead of forcing a restart mid-session.
- Pruning: `prune.idleHours` (default 24), `prune.maxAgeDays` (default 7). `openclaw sandbox` CLI has `list`/`recreate`/`rm` subcommands (`src/commands/sandbox.ts`, `src/cli/sandbox-cli.ts`).

The `--cdp-source-range` flag on the browser variant adds a CIDR allowlist at the **container edge** so other containers can't talk to the agent's Chromium. noVNC viewer access is password-gated by default (epoch `2026-02-21-novnc-auth-default` in `constants.ts:41`).

### Workspace bridging

When `workspaceAccess: "none"`, the agent's read tool is sandbox-rooted (`createSandboxedReadTool` in `src/agents/pi-tools.ts:334`); when `"rw"`, both `read` and `write`/`edit`/`apply_patch` mount the host workspace at `/workspace` (`SANDBOX_AGENT_WORKSPACE_MOUNT = "/agent"` for `ro` mode, declared in `src/agents/sandbox/constants.ts:50`). A `SandboxFsBridge` (`src/agents/sandbox/fs-bridge.ts`) is the abstraction the file tools use so the host-mode and sandbox-mode tools share the same surface.

Skills are mirrored into the sandbox when `workspaceAccess: "none"` so the agent can still read SKILL.md files (per `docs/gateway/sandboxing.md:67-69`).

### Podman support

`setup-podman.sh` (251 lines, in the repo root) is a one-shot installer that:

1. Creates a non-login `openclaw` user with a home dir.
2. Enables `loginctl linger` so rootless Podman can run without an interactive login.
3. Verifies `subuid`/`subgid` entries.
4. Builds the OpenClaw image with `podman build`, then **saves and loads** it into the `openclaw` user's rootless Podman store via `podman save -o` + `podman load -i` (using `sudo -u openclaw env HOME=...`).
5. Drops a launch script at `~openclaw/run-openclaw-podman.sh`.
6. Optionally installs a **systemd Quadlet** unit (`~openclaw/.config/containers/systemd/openclaw.container`) so the gateway runs as a user service: `sudo systemctl --machine openclaw@ --user start openclaw.service`.

The matching env file `openclaw.podman.env` and `scripts/podman/openclaw.container.in` template ship in-repo. Notable: `setup-podman.sh:54` explicitly avoids root writes into `$OPENCLAW_HOME` to side-step "symlink/hardlink/TOCTOU footguns."

The combined picture: docker is the recommended local sandbox; podman is the recommended rootless production runtime for the gateway itself.

## Agent Loop

The agent loop is described in `docs/concepts/agent-loop.md` and implemented across `src/agents/`. It is a **single, serialized run per session** that emits lifecycle and stream events as the model thinks, calls tools, and replies.

### Entry points

- Gateway RPC: `agent` (start a run, returns `{runId, acceptedAt}` immediately) + `agent.wait` (poll for `runId` completion).
- CLI: `openclaw agent --message ...`.
- Channel inbound: messaging providers (`auto-reply/dispatch.ts`) wake the loop on incoming messages.
- ACP: `chat.send` → same path.

### Flow (from `docs/concepts/agent-loop.md`)

1. `agent` RPC validates params, resolves session (sessionKey/sessionId), persists session metadata, returns `{runId, acceptedAt}` immediately.
2. `agentCommand` resolves model + thinking/verbose defaults, loads a **skills snapshot**, calls `runEmbeddedPiAgent`, emits lifecycle end/error if pi-mono didn't.
3. `runEmbeddedPiAgent` (in `src/agents/pi-embedded-runner.ts` and `src/agents/pi-embedded-runner/`):
   - Serializes runs through a per-session lane and an optional global lane.
   - Resolves the model + the auth profile (auth profiles in `src/agents/auth-profiles/` — multi-profile rotation with cooldown, fallback to API-key when OAuth fails, etc.).
   - Builds the pi session and subscribes to its events.
   - Streams assistant/tool deltas back to the gateway.
   - Enforces a timeout (`agents.defaults.timeoutSeconds`, default 600s) — aborts the run on overflow.
4. `subscribeEmbeddedPiSession` (in `src/agents/pi-embedded-subscribe.ts`) bridges pi-mono events to OpenClaw `agent` stream events:
   - tool events → `stream: "tool"`
   - assistant deltas → `stream: "assistant"`
   - lifecycle → `stream: "lifecycle"` with `phase: start | end | error`
5. `agent.wait` reads the lifecycle terminal event.

### Streams emitted on the gateway WS

- `lifecycle` — start/end/error per run id
- `assistant` — incremental text/reasoning deltas
- `tool` — `phase: start | result` with `name`, `args`, `result`, `isError`, `toolCallId` (see `src/acp/translator.ts:331-393 handleAgentEvent` for the consumer side)
- `chat` — buffered delta + final, also written to disk
- `compaction` — when auto-compaction fires

### Queue modes

`docs/concepts/queue.md` defines several modes that interact with the loop. The headline ones:

- **steer**: new inbound messages are injected mid-run, cancelling pending tool calls after the next tool boundary so the queued message becomes the next user turn (falls back to `followup` when not streaming).
- **followup**: enqueue for the next agent turn after the current run ends.
- **collect** (default): coalesce all queued messages into a single followup turn.
- **steer-backlog**, **interrupt** (legacy), and **queue** (alias for `steer`) round out the set.

This is one of the more aggressive design choices: most agents either reject new input during a run or buffer it; OpenClaw's `steer` actively cancels pending tool calls to let the user redirect.

### Hooks during a run

Plugin hooks fire at well-defined points (`src/plugins/types.ts:299-323`, full list in the Tool System section). Notable ones:

- `before_model_resolve` (pre-session) — can override provider/model deterministically before any history is loaded.
- `before_prompt_build` (post-session-load) — can inject `prependContext`/`systemPrompt`.
- `before_tool_call` / `after_tool_call` — intercept params and results.
- `tool_result_persist` — synchronously transform tool results before writing to the JSONL transcript.
- `before_compaction` / `after_compaction` — observe or annotate compaction.

### Compaction and retry

Auto-compaction emits its own stream and can trigger a transparent retry. On retry, in-memory buffers and tool summaries are reset to avoid duplicate output (see `src/agents/compaction.ts`).

### Tool execution path

The wired tools come from `src/agents/pi-tools.ts:createOpenClawCodingTools(...)`. The function pulls pi-mono's `codingTools` (read/write/edit/bash/process), substitutes sandboxed equivalents when a `SandboxContext` is present, wraps each tool with:

- `wrapToolWithBeforeToolCallHook` (loop detection + plugin hook)
- `wrapToolWithAbortSignal` (so the AbortController on the run propagates into long-running tools)

then adds the OpenClaw-specific tools (`createOpenClawTools` — see Tool System below) and applies the layered tool policy pipeline (`applyToolPolicyPipeline`).

## Tool System

### Two source sets

1. **pi-mono `codingTools`** (`@mariozechner/pi-coding-agent`) — `read`, `write`, `edit`, `bash` (renamed to `exec` in OpenClaw), and `apply_patch`. OpenClaw substitutes its own implementations when sandboxed (`createSandboxedReadTool`, `createSandboxedWriteTool`, `createSandboxedEditTool`).
2. **OpenClaw-specific** (`src/agents/openclaw-tools.ts`) — built in-tree:
   - `browser` (Playwright/CDP; can target host browser or sandbox browser based on `sandbox.browser.allowHostControl`)
   - `canvas` (push/reset/eval/snapshot the live HTML canvas)
   - `cron` (manage cron jobs through the gateway)
   - `gateway` (raw gateway RPC)
   - `image`
   - `message` (send messages on whichever channel routed the inbound)
   - `nodes` (invoke `system.run`, `camera.snap`, `screen.record`, `location.get` on a paired node)
   - `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn` (agent-to-agent coordination)
   - `subagents` (introspect spawned subagent state)
   - `session_status`
   - `tts`
   - `web_search`, `web_fetch` (gated by Brave/Perplexity/Grok/Gemini/Kimi provider config)
   - `agents_list`

### Registration

Tools are not globally registered — they are **constructed per-run** based on the resolved policy stack (`src/agents/pi-tools.ts:182+`, with `resolveEffectiveToolPolicy` invoked around line 252):

1. Resolve effective tool policy (`resolveEffectiveToolPolicy`) — merges global, per-agent, per-provider, per-profile, group, sandbox, and subagent layers.
2. Filter pi-mono base tools by the policy.
3. Insert sandboxed-or-host variants of file tools.
4. Build `execTool` and `processTool` with the resolved sandbox config (passing `containerName`, `workspaceDir`, `containerWorkdir`, `env` if sandboxed).
5. Append channel-declared tools via `listChannelAgentTools` (e.g. each channel can expose `discord_*` actions).
6. Build the OpenClaw-specific tools.
7. Apply message-provider policy (e.g. voice calls deny `tts`).
8. Apply owner-only policy (`applyOwnerOnlyToolPolicy`).
9. Run the tool-policy pipeline.
10. Normalize schemas per provider (Gemini strips constraint keywords, Anthropic keeps them, OpenAI rejects root-level unions — see `cleanToolSchemaForGemini`, `normalizeToolParameters`).
11. Wrap with `before_tool_call` hook and abort-signal wrapping.

This is one of the longer per-turn paths in the codebase (`createOpenClawCodingTools` spans lines 182-544 of `src/agents/pi-tools.ts`) and is the canonical place to see "how OpenClaw composes a tool set."

### MCP

VISION.md is unambiguous: *"OpenClaw supports MCP through `mcporter` ... For now, we prefer this bridge model over building first-class MCP runtime into core."* Source: `https://github.com/steipete/mcporter`. The benefits cited:

- Add/change MCP servers without restarting the gateway.
- Keep core tool/context surface lean.
- Reduce MCP churn impact on core stability and security.

The ACP translator advertises `mcpCapabilities: { http: false, sse: false }` explicitly (`src/acp/translator.ts:132-135`) — IDEs cannot inject MCP servers into the OpenClaw agent over ACP.

### Bash tool and host/sandbox routing

`src/agents/bash-tools.exec.ts` is one of the heaviest tool implementations. It supports:

- **Host execution** (default for `main` session): runs through Node child_process with a Bash-process registry (`bash-process-registry.ts`) tracking PIDs.
- **Sandbox execution**: `buildDockerExecArgs` (`src/agents/bash-tools.shared.ts:49`) wraps the command in `docker exec -i [-t] -w <workdir> -e KEY=val ... <container> sh -lc 'export PATH=...; <command>'`. The login shell quirk is handled: `/etc/profile` resets PATH; OpenClaw passes the custom path as `OPENCLAW_PREPEND_PATH=...` and prepends it after profile sourcing.
- **Background mode**: long commands return a session id; the `process` tool can `poll`, `log`, `write`, `submit`, `send-keys`, `paste`, `kill`. This is the foundation for the `coding-agent` skill (which spawns Codex/Claude/OpenCode/Pi under background-PTY).
- **PTY**: `@lydell/node-pty` for interactive subprocesses. The `coding-agent` skill insists `pty:true` for nested coding agents.
- **Approval flow**: `bash-tools.exec-approval-request.ts` integrates a per-session approval queue (gateway emits `exec.approval` events; the operator can approve from the Control UI or `/elevated` chat command).
- **Safe-bin profiles**: `resolveExecSafeBinRuntimePolicy` lets operators allowlist specific binaries with hardened profiles (e.g. `node`, `python3`).

### Tool policy resolution layers

Order matters in `applyToolPolicyPipeline`:

1. Profile policy (`tools.profile`)
2. Provider-specific profile policy
3. Global policy (`tools.allow`/`tools.deny`)
4. Global provider policy
5. Per-agent policy (`agents.list[].tools`)
6. Per-agent provider policy
7. Group policy (`channels.*.groups.*.tools`)
8. Sandbox policy (the implicit allow/deny inside a sandbox)
9. Subagent policy (depth-aware)

Inside a sandbox, the **default deny list** wins over the **policy allow list** for `browser/canvas/nodes/cron/gateway/<channels>` unless explicitly allowed — sandboxes cannot grant capabilities they don't have.

## Extensions, Skills & Plugin SDK

OpenClaw distinguishes three plug-in surfaces, and the distinction is editorial as much as technical.

### Extensions (in-process plugins)

- Live in `extensions/<name>/` as pnpm workspace packages.
- Each ships an `openclaw.plugin.json` manifest, an `index.ts` (or compiled `dist/index.js`), and a `package.json` that lists `openclaw/plugin-sdk` as a peer dep.
- Loaded **in-process** at gateway start via `src/plugins/loader.ts` (jiti-based, so TypeScript extensions can be developed without prebuild).
- Discovery (`src/plugins/discovery.ts`) checks three origins (`bundled`, `global`, `workspace`) with permissions audits: `path_world_writable` and `path_suspicious_ownership` (mismatch with current uid) block load.

39 extensions ship in-tree, including:

- Channel plugins: `bluebubbles`, `msteams`, `matrix`, `discord`, `slack`, `signal`, `zalo`, `zalouser`, `tlon`, `nostr`, `mattermost`, `feishu`, `googlechat`, `irc`, `line`, `lobster`, `twitch`, `whatsapp`, `imessage`, `telegram`, `phone-control`, `talk-voice`, `voice-call`, `synology-chat`, `nextcloud-talk`
- Capability plugins: `memory-core`, `memory-lancedb`, `diagnostics-otel`, `device-pair`, `thread-ownership`, `open-prose`, `llm-task`
- Authentication shims: `google-gemini-cli-auth`, `qwen-portal-auth`, `minimax-portal-auth`, `copilot-proxy`
- ACP harness embedding: `acpx` (mentioned earlier — runs Codex/Claude Code/Gemini CLI/Pi as nested ACP children)
- Shared utilities: `shared`, `test-utils` (not user-facing plugins; reused by other extensions)

#### Plugin API surface

From `src/plugins/types.ts:245-284 OpenClawPluginApi`:

```ts
export type OpenClawPluginApi = {
  id, name, version, description, source,
  config: OpenClawConfig,
  pluginConfig?: Record<string, unknown>,
  runtime: PluginRuntime,
  logger: PluginLogger,
  registerTool, registerHook, registerHttpHandler, registerHttpRoute,
  registerChannel, registerGatewayMethod, registerCli, registerService,
  registerProvider, registerCommand,
  resolvePath,
  on<K extends PluginHookName>(hookName, handler, opts?),
};
```

A plugin can register:

- **Tools** (`AnyAgentTool` factories that receive the per-call context; see `voice_call` example above)
- **Hooks** (`InternalHookHandler` on any of the 24 hook events listed in `PluginHookName`)
- **HTTP routes** on the gateway HTTP server (e.g. `/__plugin__/voicecall/webhook`)
- **Channels** (full `ChannelPlugin` — most messaging integrations are extensions, not core)
- **Gateway methods** (RPC methods callable over the WS protocol — e.g. `voicecall.initiate`)
- **CLI subcommands** (extending the Commander program; e.g. `openclaw voicecall ...`)
- **Services** (background tasks with `start`/`stop` lifecycle)
- **Providers** (model providers — see `src/plugins/providers.ts` for the discovery/registration path)
- **Plugin commands** (`/tts ...` style slash commands that bypass the LLM agent and run synchronously)

#### Hook events

Full list from `src/plugins/types.ts:299-323`:

```
before_model_resolve, before_prompt_build, before_agent_start,
llm_input, llm_output, agent_end,
before_compaction, after_compaction,
before_reset,
message_received, message_sending, message_sent,
before_tool_call, after_tool_call, tool_result_persist,
before_message_write,
session_start, session_end,
subagent_spawning, subagent_delivery_target, subagent_spawned, subagent_ended,
gateway_start, gateway_stop
```

This is one of the broadest plugin hook surfaces in any open-source agent — most agents stop at `before_tool_call`/`after_tool_call` and message hooks; OpenClaw also exposes the compaction lifecycle, the subagent lifecycle, and the explicit pre-/post-session phases.

#### Plugin manifest example

`extensions/memory-core/openclaw.plugin.json`:

```json
{ "id": "memory-core", "kind": "memory",
  "configSchema": { "type": "object", "additionalProperties": false, "properties": {} } }
```

`extensions/memory-core/index.ts`:

```ts
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
const memoryCorePlugin = {
  id: "memory-core", name: "Memory (Core)", kind: "memory",
  configSchema: emptyPluginConfigSchema(),
  register(api: OpenClawPluginApi) {
    api.registerTool((ctx) => [
      api.runtime.tools.createMemorySearchTool({...}),
      api.runtime.tools.createMemoryGetTool({...}),
    ], { names: ["memory_search", "memory_get"] });
    api.registerCli(({ program }) => api.runtime.tools.registerMemoryCli(program),
      { commands: ["memory"] });
  },
};
```

Note `kind: "memory"`: per VISION.md, memory is a **slot plugin** — only one memory plugin can be active at a time. The slot logic lives in `src/plugins/slots.ts`.

#### Plugin SDK

The public surface is `src/plugin-sdk/index.ts` (~600 lines of re-exports), generated as `.d.ts` via `tsconfig.plugin-sdk.dts.json`:

```json
{ "extends": "./tsconfig.json",
  "compilerOptions": {
    "declaration": true, "emitDeclarationOnly": true,
    "outDir": "dist/plugin-sdk", "rootDir": "src", ... },
  "include": ["src/plugin-sdk/index.ts", "src/plugin-sdk/account-id.ts", "src/types/**/*.d.ts"] }
```

It is published as a subpath export of the `openclaw` package:

```json
"exports": {
  ".": "./dist/index.js",
  "./plugin-sdk": { "types": "./dist/plugin-sdk/index.d.ts", "default": "./dist/plugin-sdk/index.js" },
  "./plugin-sdk/account-id": { "types": "...", "default": "..." },
  "./cli-entry": "./openclaw.mjs"
}
```

The SDK re-exports every type, schema, utility, and helper a plugin needs: channel adapter types, config schemas (zod and TypeBox), webhook helpers, SSRF guard, file-lock primitives, account helpers, all hook types, ACP runtime registry helpers, plus narrowly-scoped channel utilities for each integration. Plugins do not import deep paths into `src/` — they import only `openclaw/plugin-sdk`, and at runtime the package is resolved via `jiti` alias when running TS extensions directly. AGENTS.md explicitly calls out: *"plugin runtime deps must live in `dependencies`; put `openclaw` in `devDependencies` or `peerDependencies` instead (runtime resolves `openclaw/plugin-sdk` via jiti alias)."*

#### Plugin loading and trust

Per SECURITY.md (Plugin Trust Boundary section):

- Plugins/extensions are loaded **in-process** with the Gateway and treated as trusted code.
- A plugin can execute with the same OS privileges as the gateway process.
- `plugins.allow` can pin explicit trusted plugin ids.
- Runtime helpers (`runtime.system.runCommandWithTimeout`) are **convenience APIs, not a sandbox boundary** — the plugin model assumes operator-installed plugins are trusted.

### Skills (prompt-and-scripts bundles)

Skills are **not loaded as code** by the gateway. They are read by the agent. Each skill is a directory:

- `skills/<name>/SKILL.md` — YAML frontmatter (name, description, `metadata.openclaw.requires.bins`/`anyBins`, install hints) + Markdown body that instructs the agent how to use the skill.
- Optional sibling files: `scripts/`, `license.txt`, fixtures, etc.

Three locations are checked, workspace wins on name conflict (`docs/concepts/agent.md:58`):

1. Bundled (`skills/` in the install) — 52 in-tree.
2. Managed/local (`~/.openclaw/skills/`).
3. Workspace (`<workspace>/skills/`).

Skills are gated by config (`skills` block) and by **bin presence** — e.g. `coding-agent/SKILL.md` has `"requires": { "anyBins": ["claude", "codex", "opencode", "pi"] }`, so the skill only loads if at least one of those CLIs is on `PATH`.

Per-skill examples:

- `coding-agent` — orchestrates Codex/Claude Code/OpenCode/Pi under background+PTY. **The single most aggressive skill in the tree** (~284 lines of operator notes including "NEVER start Codex in ~/.openclaw/").
- `clawhub` — search/install/update/publish skills from `clawhub.ai` (OpenClaw's registry).
- `skill-creator` — meta-skill for designing new skills.
- `peekaboo` — macOS screenshot tooling.
- `notion`, `obsidian`, `bear-notes`, `things-mac`, `apple-notes`, `apple-reminders` — productivity integrations.
- `nano-banana-pro`, `openai-image-gen`, `openai-whisper`, `sherpa-onnx-tts` — media generation.

VISION.md is clear about the editorial line: *"We still ship some bundled skills for baseline UX. New skills should be published to ClawHub first ... not added to core by default. Core skill additions should be rare and require a strong product or security reason."*

### Extensions vs skills

| | Extensions | Skills |
| --- | --- | --- |
| **Form** | TypeScript code, `index.ts` + manifest | Markdown + optional binaries |
| **Trust** | Trusted plugin (in-process) | Untrusted (agent reads it as instructions) |
| **Loading** | jiti-loaded at gateway start | Read by the agent as system prompt fragments |
| **Registration** | `register(api)` — registers tools/hooks/CLI/HTTP | None — discovered by skills snapshot |
| **Gating** | `plugins.allow`, manifest origin checks | `requires.bins`, `skills.disabled`, etc. |
| **Distribution** | npm + workspace-local | ClawHub (`clawhub.ai`) + workspace-local |
| **Lifecycle** | `register`, `activate`, `service.start/stop` | None — static prompt content |

## Gateway, Deployment & Hosting

### What "the gateway" is

`src/gateway/server.ts` runs a WebSocket server (default `ws://127.0.0.1:18789`) with:

- Protocol version 3 (`src/gateway/protocol/schema/protocol-schemas.ts:277`).
- TypeBox-defined schemas (~150 message types) → JSON Schema → Swift codegen via `pnpm protocol:gen` + `pnpm protocol:gen:swift`.
- AJV validation on every inbound frame.
- Frame discriminator: `{type: "req"}` / `{type: "res"}` / `{type: "event"}` (`src/gateway/protocol/schema/frames.ts:125-155`).
- Device pairing: every client (operator + node) signs a `connect.challenge` nonce. Local connects can be auto-approved; non-local require explicit approval (`docs/concepts/architecture.md:94-107`).
- Auth modes: optional `gateway.auth.token` shared-secret, optional `gateway.auth.password` for browser/Funnel scenarios, plus per-device tokens issued on first pair.
- Server-methods registry (`src/gateway/server-methods/*`) covers ~40 RPC methods: `agent`, `agent.wait`, `chat.send`, `chat.abort`, `chat.history`, `chat.inject`, `sessions.list`, `sessions.patch`, `sessions.history`, `cron.add/run/list/...`, `nodes.list/describe/invoke`, `config.get/set/patch/apply`, `secrets.*`, `channels.status/logout`, `talk.config`, `voicewake.*`, `web.*`, `tts.*`, `models.*`, and so on.

### The "gateway" in test config naming

The repo's vitest config split (`vitest.gateway.config.ts`, `vitest.live.config.ts`, `vitest.e2e.config.ts`, `vitest.extensions.config.ts`, `vitest.unit.config.ts`) reflects an explicit split:

- **`vitest.gateway.config.ts`** — `include: ["src/gateway/**/*.test.ts"]`. Used by the `test:sectriage` script as a focused gate for the gateway WS server (the largest single concern).
- **`vitest.live.config.ts`** — `include: ["src/**/*.live.test.ts"]`, `maxWorkers: 1`. **"Live" means real API keys / real network**. Run with `LIVE=1 pnpm test:live` (provider live) or `CLAWDBOT_LIVE_TEST=1 pnpm test:live` (OpenClaw-only). These hit real Anthropic/OpenAI/Gemini/Bedrock/etc. with real credentials; they exist to catch silent vendor regressions that mocks can't see.
- **`vitest.e2e.config.ts`** — `include: ["test/**/*.e2e.test.ts"]`, `pool: "vmForks"`. Cross-cutting end-to-end harness (one example: `test/gateway.multi.e2e.test.ts` spins up multiple gateways).
- **`vitest.extensions.config.ts`** — `include: ["extensions/**/*.test.ts"]`. Per-extension tests run via the same vitest plumbing.
- **`vitest.unit.config.ts`** — default unit tests, V8 coverage with 70% lines/branches/functions/statements thresholds (per AGENTS.md).

Docker-backed live tests exist too: `pnpm test:docker:live-models`, `pnpm test:docker:live-gateway`, `pnpm test:docker:onboard`, `pnpm test:docker:plugins`, etc. — these build the OpenClaw container, run a live gateway, exercise the full path, and tear down.

### Deployment matrix

OpenClaw is explicitly designed to run **both locally and as a hosted service**, with the same `Dockerfile`:

| Target | Files | Notes |
| --- | --- | --- |
| Local Mac/Linux (preferred) | `npm install -g openclaw` + `openclaw onboard --install-daemon` | launchd (macOS) or systemd user service. Gateway runs at `127.0.0.1:18789`. |
| macOS app | `apps/macos/Package.swift` (SwiftUI menu bar) | Wraps gateway lifecycle in a menu bar app; voice wake + push-to-talk overlay. |
| Local Docker / Podman | `Dockerfile` + `docker-compose.yml` + `setup-podman.sh` | The Dockerfile builds the gateway + Control UI; compose mounts `~/.openclaw` and exposes `18789` and bridge `18790`. |
| Fly.io | `fly.toml` | `app = "openclaw"`, `shared-cpu-2x` / `2048mb`, persistent `openclaw_data` mount at `/data`, `min_machines_running = 1` (because of persistent WS connections), HTTPS forced, `auto_stop_machines = false`. |
| Render.com | `render.yaml` | `runtime: docker`, `plan: starter`, 1 GB disk at `/data`, `OPENCLAW_GATEWAY_TOKEN` auto-generated. |
| Synology / NAS | `Dockerfile` | Sets `OPENCLAW_PREFER_PNPM=1` so pnpm is preferred over Bun (Bun fails on some ARM Synology builds). |
| Tailscale Serve/Funnel | `gateway.tailscale.mode = serve | funnel` | Gateway stays on loopback; Tailscale provides external TLS (Serve = tailnet-only, Funnel = public + password required). |
| SSH tunnel | `ssh -N -L 18789:127.0.0.1:18789 user@host` | Recommended remote-access pattern for private hosts. |
| Fly.io "private" variant | `fly.private.toml` | Sibling config for private-only Fly deploys (companion repo serves the public DNS/installer). |
| Multi-arch builds | `Dockerfile` honors `OPENCLAW_DOCKER_APT_PACKAGES` and `OPENCLAW_INSTALL_BROWSER` build args | Optional Chromium + Playwright bundle adds ~300 MB but removes the 60-90 s first-run install. |

`docker-compose.yml` runs two services from the same image: `openclaw-gateway` (binds `18789` + `18790`) and `openclaw-cli` (stdin/tty for interactive `openclaw …`). Both share `OPENCLAW_CONFIG_DIR` and `OPENCLAW_WORKSPACE_DIR` host mounts.

The Dockerfile follows the "non-root by default" pattern: `USER node` for runtime (uid 1000), with optional Playwright/Chromium install behind `OPENCLAW_INSTALL_BROWSER`. SECURITY.md recommends `docker run --read-only --cap-drop=ALL`.

### Hosted vs personal: same code, same protocol

The same `gateway` binary serves both modes. The Fly.io deployment runs `node dist/index.js gateway --allow-unconfigured --port 3000 --bind lan` — the same command an operator runs locally, just with `--bind lan` (default loopback). `--allow-unconfigured` is the magic flag that lets the gateway boot before channels are wired up, so the onboarding wizard can drive setup over the Control UI.

## Design Philosophy & Distinctive Choices

VISION.md is short and pointed. The key positions:

### "The AI that actually does things"

The opening line of VISION.md. OpenClaw is positioned **against** chat-only assistants and **for** something that drives a real computer, on real devices, in real channels. The product is the assistant — the gateway is plumbing.

### One operator, one trust boundary

SECURITY.md "Operator Trust Model" is unusually explicit: OpenClaw does **not** model one gateway as a multi-tenant boundary. The recommended deployment is one user per host, one gateway per user, one or more agents per gateway. The gateway/node/exec-approval layers are operator guardrails, **not** authorization between people. This is the inverse of how cloud agent platforms typically frame their security model — and it shapes everything downstream:

- `sessions.list` and `chat.history` are full visibility for the operator (no per-session ACLs).
- Workspace memory files (`MEMORY.md`, `memory/*.md`) are trusted local state — if you can edit them, you've already crossed the boundary.
- Plugins are trusted code (in-process); installing one grants gateway-host privileges.

### Lean core, fat ecosystem

VISION.md "What We Will Not Merge (For Now)" lists, near-verbatim:

- New core skills when they can live on ClawHub.
- Full-doc translation sets for all docs (deferred; AI-generated translations planned later).
- Commercial service integrations that do not clearly fit the model-provider category.
- Wrapper channels around already supported channels without a clear capability or security gap.
- First-class MCP runtime in core when `mcporter` already provides the integration path.
- **Agent-hierarchy frameworks** (manager-of-managers / nested planner trees) as a default architecture.
- Heavy orchestration layers that duplicate existing agent and tool infrastructure.

That last bullet about "no agent-hierarchy frameworks" is the most opinionated line. OpenClaw has subagents (`sessions_spawn`) and inter-agent messaging (`sessions_send`), but the editorial position is that nested planner trees are not a first-class abstraction; they should fall out of the existing session model when needed.

### Personal, terminal-first, with security pragmatism

VISION.md "Setup": *"OpenClaw is currently terminal-first by design. This keeps setup explicit: users see docs, auth, permissions, and security posture up front. ... We do not want convenience wrappers that hide critical security decisions from users."*

VISION.md frames it: "Security in OpenClaw is a deliberate tradeoff: strong defaults without killing capability." Examples:

- **Sandbox mode defaults to `off`** for the main session — the personal-assistant use case is "you and your computer, fully trusted." `non-main` sandbox kicks in for shared/group contexts.
- **DM pairing**: unknown senders on Telegram/WhatsApp/Slack/Discord/iMessage receive a short pairing code and the bot does not process their message. The operator must run `openclaw pairing approve <channel> <code>` to allowlist them. Default `dmPolicy = "pairing"` rather than `"open"`.
- **`/elevated`** is a per-session toggle (persisted via `sessions.patch`) to allow host-side exec when the sandbox is in effect — explicit break-glass.
- Sandbox config has a small set of **`dangerouslyAllow*`** keys (`dangerouslyAllowReservedContainerTargets`, `dangerouslyAllowExternalBindSources`, `dangerouslyAllowContainerNamespaceJoin`) that explicitly weaken defaults; these are *not* security vulnerabilities by SECURITY.md's stance — they're documented break-glass tradeoffs.

### Why TypeScript

VISION.md: *"OpenClaw is primarily an orchestration system: prompts, tools, protocols, and integrations. TypeScript was chosen to keep OpenClaw hackable by default. It is widely known, fast to iterate in, and easy to read, modify, and extend."*

The choice has ramifications: pi-mono is consumed via `@mariozechner/pi-agent-core` + `@mariozechner/pi-coding-agent` + `@mariozechner/pi-ai`; agent loop and tool surfaces are shared with that upstream rather than reinvented; the gateway protocol uses TypeBox (`@sinclair/typebox`) so JSON Schema + Swift codegen is trivial.

### Positioning vs claude-code / opencode

OpenClaw is distinct from the in-terminal coding agents on several axes:

- It's **not primarily** a coding agent — it's a **personal assistant** that happens to have a strong coding-agent integration via the `coding-agent` skill (which orchestrates Codex/Claude Code/OpenCode/Pi as nested processes).
- It's **session-state-on-disk** with persistent JSONL transcripts under `~/.openclaw/agents/<agentId>/sessions/`, not ephemeral REPL state.
- It's **multi-channel by default** — the gateway runs WhatsApp + Slack + Telegram + Discord + Signal + iMessage + Teams + Matrix + Zalo all at once.
- It's **one daemon, many clients** — macOS menu bar, iOS/Android nodes, WebChat, CLI, ACP all share the same gateway state.
- It's **opinionated about MCP** — bridging through `mcporter` rather than building MCP into core.
- It's **bilingual in ACP** — both an ACP server (for IDEs) and an ACP client (for nested coding agents through `acpx`).

The `README.md` is unusually long for an "agent platform" because it's also the operator's manual for half a dozen messaging integrations. The product surface is bigger than the agent loop.

## Key Takeaways

- **Single-operator gateway, not multi-tenant** — SECURITY.md and VISION.md both say so out loud. One gateway, one trusted user, one or more agents. Session ids are routing controls, not authorization boundaries. This collapses an entire class of "shared agent" complexity.
- **Three Dockerfiles + podman + Quadlet = a serious tiered sandbox** — `Dockerfile.sandbox` (minimal Debian), `Dockerfile.sandbox-common` (Node/Bun/Go/Rust/Brew), `Dockerfile.sandbox-browser` (Chromium + Xvfb + noVNC + CDP forwarding with CIDR allowlist). Containers are labeled and config-hashed; the gateway detects drift and warns. Podman support with rootless user + systemd Quadlet is the recommended production posture.
- **ACP is a bridge, not the primary surface** — OpenClaw's protocol is its own WebSocket JSON RPC (PROTOCOL_VERSION = 3, TypeBox schemas, codegen'd Swift models). The ACP server is a stdio-NDJSON adapter that proxies into the gateway; the gateway is the authoritative state. OpenClaw is also an ACP client via `acpx`, embedding Codex/Claude/Gemini CLI/Pi as nested ACP harnesses.
- **Plugin surface is unusually broad** — 24 hook events including `subagent_*`, `before_compaction`, `tool_result_persist`, `before_message_write`; `OpenClawPluginApi` registers tools, hooks, HTTP routes, gateway methods, CLI subcommands, services, providers, channels, and slash commands. Memory is a single-slot plugin. The plugin SDK ships as `openclaw/plugin-sdk` with codegen'd `.d.ts` and ~600 lines of curated re-exports.
- **Skills vs extensions is editorial as well as technical** — extensions are trusted in-process code (TS, jiti-loaded); skills are SKILL.md + optional binaries that the agent reads as instructions. VISION.md sets a deliberately high bar for adding either to core (ClawHub for skills, `plugins.allow` for extensions).
- **Same binary runs locally and hosted** — `fly.toml`, `render.yaml`, `docker-compose.yml`, `setup-podman.sh`, the macOS app, and the `npm install -g openclaw` path all run the same gateway. The deployment story is genuinely both-and: terminal-first for setup, hostable for production. "Live" vitest configs hit real model APIs; docker-backed e2e exists for onboarding, plugins, doctor migrations, and gateway network behavior.
