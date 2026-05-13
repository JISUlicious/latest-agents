# Cross-Agent Comparison

This document contrasts the five agent systems documented in `../agents/`:

- **claude-code** — Anthropic's official terminal coding agent (TS/Ink, leaked snapshot)
- **opencode** — sst/opencode (TS/Bun, HTTP/SSE server + multiple clients)
- **pi-mono** — badlogic's hand-crafted minimal coding agent (TS/Node, 7 tools, "no X" manifesto)
- **hermes-agent** — NousResearch's self-improving multi-surface agent (Python, gateway + cron + RL)
- **openclaw** — single-operator personal assistant gateway (TS/Node, embeds pi-mono, multi-channel, tiered Docker sandbox)

Read each agent's own doc first for full evidence and citations. This file is the cross-cut.

## Snapshot

| Axis | claude-code | opencode | pi-mono | hermes-agent | openclaw |
|---|---|---|---|---|---|
| **Maker** | Anthropic | SST + community | Mario Zechner (badlogic) | Nous Research | community / single project |
| **Language** | TypeScript | TypeScript | TypeScript | Python | TypeScript |
| **Runtime** | Node (Ink/React) | Bun (Effect) | Node | CPython | Node (≥22.12) |
| **Process model** | single binary, REPL or headless | server + multiple clients (TUI, run, desktop, ACP, mobile) | single binary, 4 run modes | multi-process (CLI/TUI/gateway/ACP/dashboard/cron), one SQLite | one daemon ("Gateway") + many clients (CLI, web UI, macOS app, iOS/Android nodes) |
| **Primary surface** | terminal REPL | terminal TUI (also web/desktop/mobile) | terminal TUI | terminal + chat platforms (Telegram/Discord/...) | chat platforms + macOS menu bar + CLI |
| **Provider story** | Anthropic-first, fallback model | Vercel AI SDK + live `models.dev` catalog (23 bundled providers) | own `pi-ai` (~25 providers, 9 wire APIs) | OpenAI-format + ~20 providers as plugins | inherits pi-mono's `pi-ai` |
| **Tool count (built-in)** | ~40 (Bash, Read, Edit, Write, Glob, Grep, Task, MCP, …) | ~17 (shell, read, edit, write, glob, grep, task, fetch, search, …) | **7** (read/write/edit/bash + grep/find/ls) | 25+ (memory, session_search, terminal, delegate, kanban, …) | pi-mono's 7 + ~13 OpenClaw tools (browser, canvas, nodes, sessions_*, …) |
| **MCP** | first-class, deferred, in-tree | first-class, stdio + HTTP + SSE + OAuth | refused; build extension if needed | first-class (Stdio/HTTP/SSE) | refused in core; use `mcporter` bridge |
| **ACP** | not in tree | yes — `opencode acp` (Zed) | extension (`pi-acp`) | yes — `acp_adapter/server.py` | yes (server) + yes (client via `acpx`, embeds Codex/Claude/Gemini/Pi) |
| **Sub-agents** | first-class (`Task` tool, 6+ built-in subagent types) | first-class (`task` tool, built-in `general`/`explore`/`plan`/`compaction`/…) | **refused** | yes (`delegate_task`, leaf/orchestrator roles, capped depth) | yes (`sessions_spawn`, but VISION refuses agent-hierarchy frameworks) |
| **Sandbox** | OS-level via `@anthropic-ai/sandbox-runtime` adapter (FS/network rules) | none in core; experimental "containers" workspace adapter | none in core; community `gondolin`, `nono`, `pi-ssh-remote` | seven terminal backends (local/Docker/SSH/Singularity/Modal/Daytona/Vercel Sandbox) | tiered Docker: `sandbox` / `sandbox-common` / `sandbox-browser` + Podman/Quadlet |
| **Permissions** | rules + classifier + plan-mode reminder + hooks | pattern-rule engine, persisted per project, `Permission.ask/reply` over SSE | **none in core**; extensions add their own | per-tool approval callback + ACP `request_permission` | per-session approval + `/elevated` break-glass + sandbox-level deny |
| **Memory** | nested CLAUDE.md + `memdir/` auto-memory + nightly `/dream` consolidator | summaries per session, snapshot side-git for revert; sessions are durable | AGENTS.md walk + JSONL session tree; no learned memory in core | **4 layers**: MEMORY.md/USER.md frozen snapshot + provider plugin + FTS5 session search + auto-archive curator | inherited memory plugins (`memory-core`, `memory-lancedb`); single-slot |
| **Skills format** | Markdown + frontmatter (own conventions, but compatible with the open standard) | SKILL.md, walks `~/.claude/skills/`, `.agents/skills/`, project | SKILL.md (Agent Skills v1), walks `~/.pi/`, `~/.agents/` | SKILL.md (Anthropic-inspired + agentskills.io compatible), bundled + optional | inherited from pi (SKILL.md), plus a ClawHub registry |
| **Extension model** | plugins (file + frontmatter), output styles, hooks, plus MCP | plugins package + custom tools + custom agents + skills + MCP | TypeScript factory with rich `ExtensionAPI` + Pi Packages (npm/git) | three plugin systems: general / memory / model-provider | 39 in-tree extensions + plugin SDK published as `openclaw/plugin-sdk` |
| **Deployment** | local + remote ("CCR") sessions over WS | local + `serve` + `attach` over HTTP, plus mDNS, Electron | local only (binary) | local + Docker + Modal + Daytona + Vercel Sandbox + serverless | local + Docker + Podman + Fly.io + Render + macOS menu bar |
| **Distinctive feature** | one-loop-many-policies; defer-tools; auto-dream consolidation | event-sourced sessions + shareable links + provider-agnostic via AI SDK | "no X" minimalism + pluggable per-tool operations + Bun-compiled binary | self-improving (curator, batch-runner trains the next model), prefix-cache discipline as architecture | three-tier Docker sandbox + ACP-symmetric + multi-channel daemon |

## Three families

The five agents do not occupy a continuum; they cluster.

### Family A — Coding agents

**claude-code, opencode, pi-mono.** Single-purpose: drive a developer's terminal. Optimize for tight feedback loops, file editing, shell automation. Stay close to the cwd. Sessions are ephemeral by default. Multi-agent collaboration is internal (subagents for explore/plan/verify), not human-to-human.

The three diverge on extensibility philosophy:

- **claude-code** — extensibility as a layered platform. ~40 built-in tools, MCP for external, plugins/skills/output-styles/agents all loaded from markdown with frontmatter, declarative configuration, defer-tools for scale. The CLI is a local agent OS.
- **opencode** — extensibility as a protocol surface. The server is the product; CLIs, GUIs, and IDE adapters are clients of one typed HTTP API. Provider, skill, plugin, agent, and MCP all coexist; the unifying abstraction is the SDK.
- **pi-mono** — extensibility as ejection. Core stays seven tools forever. Every "feature" everyone else ships is *refused* in core and shipped as a community extension instead.

### Family B — Personal-assistant platforms

**hermes-agent, openclaw.** Multi-surface. The same agent core runs as a daemon and is reachable from Telegram, Discord, Slack, WhatsApp, iMessage, Signal, Matrix, email, web, mobile, terminal. Sessions are durable, multi-tenant-per-user. The agent has channels into the user's life, not just their editor.

These two share an unusual amount of DNA — hermes ships `hermes claw migrate` to import `~/.openclaw`, and the README treats OpenClaw as the precursor. They diverge sharply on philosophy:

- **openclaw** — single-operator-trusted, lean core, no learned memory, ClawHub-for-skills, mcporter-for-MCP, no agent hierarchies. The gateway is plumbing. The product is the assistant. Embeds pi-mono as its agent runtime.
- **hermes-agent** — self-improving by design. The agent edits its own skills, memory, cron jobs. Memory has four layers including a curator that archives stale skills via a forked auxiliary agent. The same loop is also an RL training environment for the model that will run it.

### Family C — Reusable substrate

**pi-mono.** Notable because it sits in both families. It is itself a coding agent (Family A) but it's *also* the agent runtime openclaw embeds (Family B). The `pi-ai`/`pi-agent-core`/`pi-coding-agent` split is the only one of the five projects that explicitly ships its agent loop as a library someone else's product can consume.

Both openclaw (consuming pi-mono directly) and pi-mono's own ecosystem (40+ extensions) treat pi as a substrate to build *on*, not just *use*.

## Architectural patterns

### One loop, many policies

This pattern appears in **claude-code**, **opencode**, **hermes-agent**, and **openclaw** — all four use a single message-tool-result loop reconfigured by prompt + tool filter + permission policy to implement multi-agent behaviors.

- claude-code's `src/query.ts` runs interactive, headless, subagent, coordinator, remote, dream consolidation, and verification turns. Same kernel; different `system_prompt`, `toolPool`, `permissionContext`.
- opencode's `SessionPrompt.runLoop` (`packages/opencode/src/session/prompt.ts`) plus `SessionProcessor` are the only loop. Built-in agents `build`/`plan`/`general`/`explore`/`compaction`/`title`/`summary` are all loop configurations.
- hermes-agent's `AIAgent` (`run_agent.py`) runs in CLI, gateway, ACP, dashboard, cron, batch-runner, and Atropos RL environment — same loop, different runtime.
- openclaw delegates the loop itself to pi-mono (`pi-embedded-runner.ts`); openclaw provides session lanes, tool wiring, sandbox, and stream multiplexing around it.

pi-mono is the dissenting case: it ships only the single coding-agent loop, and explicitly does not host subagents, plans, or coordinators internally. Multi-agent behavior is delegated entirely to extensions or to external tools spawned via `tmux`.

### Methodology lives in prompts, not state

Across all five agents, there is no Phase enum, no explicit gather→act→verify state machine. Sequencing is encoded in:

1. Prompts that tell the model to gather before acting and verify before reporting.
2. Tool-set filters that make certain phases structurally inert (e.g. claude-code's 5-tool denylist on Explore/Plan/Verify subagents).
3. One or two parsed contracts (claude-code's `VERDICT: PASS|FAIL|PARTIAL`, hermes's `<REASONING_SCRATCHPAD>`).

This is consistent across the field. The runtime exists to make the model's choices safe and recoverable, not to second-guess them.

### Streaming + parallel tool execution

All five stream model tokens. Three (claude-code, opencode, openclaw) additionally execute concurrency-safe tools while the model is still emitting tokens:

- claude-code: `StreamingToolExecutor` (`services/tools/StreamingToolExecutor.ts`) overlaps tool runs with stream.
- opencode: per-turn `SessionProcessor` processes `tool-input-delta`/`tool-call` AI-SDK events live.
- openclaw: pi-mono's `executeToolCallsParallel` with sequential safety fallback.

pi-mono natively supports parallel tool execution; openclaw inherits it. hermes-agent's loop is synchronous over OpenAI chat-completions; tool calls within one assistant turn run sequentially in the handler thread.

### Context compaction as normal control flow

Every one of the five treats context pressure as a routine event, not an error.

- claude-code stages five tiers (tool-result budget → snip → microcompact → context-collapse → autocompact) *before every model call*, plus reactive paths for real 413s.
- opencode runs a hidden `compaction` agent on overflow with `experimental.session.compacting` plugin override.
- hermes-agent has `agent/context_compressor.py` with `on_pre_compress` hooks for memory providers; **prefix-cache discipline is a hard rule** ("the ONLY time we alter context is during context compression").
- openclaw inherits pi-mono compaction and adds plugin hooks `before_compaction`/`after_compaction`.
- pi-mono has manual `/compact` plus automatic on overflow, with `session_before_compact` extension event.

Compaction-as-control-flow is one of the few near-universal design patterns across all five.

### Skills as procedural memory

Four of the five (all except claude-code, which treats them differently) converged on Anthropic's [Claude Skills](https://www.anthropic.com/news/claude-skills) format:

- A directory named for the skill, containing `SKILL.md`.
- YAML frontmatter with `name` (≤64 chars), `description` (≤1024 chars), and optional metadata.
- Markdown body of instructions, optionally linking other files.
- Progressive disclosure: the model sees name + description in the index; the full body loads on demand via a tool call.

The format is being treated as the de-facto open standard (see [agentskills.io](https://agentskills.io)):

- pi-skills explicitly ships identical content for Pi, Claude Code, Codex CLI, Amp, and Droid.
- opencode walks `~/.claude/skills/` directly.
- hermes ships skills following the Anthropic format and pitches them as agentskills.io-compatible.
- openclaw uses the same format and runs a registry (`clawhub.ai`) for distribution.
- claude-code uses a slightly different convention internally but is the spec's origin.

This is one of the more striking findings of the comparison: the agent skill is rapidly becoming a portable, cross-vendor artifact.

### AGENTS.md walks

All five honor `AGENTS.md`/`CLAUDE.md` discovery starting from cwd, walking ancestors, injecting under a `# Project Context` heading. pi-mono and hermes also pick up `.cursorrules`. claude-code adds lazy attachment for nested `CLAUDE.md` when files in a subtree are first touched.

### Permission models: three stances

- **Pattern-rule, persisted, ask-flow** — claude-code and opencode both expose `allow | deny | ask`, with `always`/`once` resolution, persisted per project. opencode formalizes this as `Permission.Ruleset` (`{permission, pattern, action}[]`); claude-code similarly composes rules from policy/user/project/local/session sources. Both expose patterns over a tool-call structure (`Bash(git *)`, `Read(*.env)`).
- **No core UI, build your own** — pi-mono refuses to ship permission popups. Extensions implement gating by returning `{block: true, reason}` from `tool_call` event handlers.
- **Sandbox-first** — openclaw's primary stance is that the agent runs *inside* a Docker container; permissions are then about which tools that sandboxed agent has, not approval prompts per call. `/elevated` is the explicit break-glass.

hermes-agent splits the difference: per-tool approval callbacks (`make_approval_callback`) bridged from ACP `request_permission`, but the broader model is "memory and skills get content-scanned, not gated."

### Provider abstraction: two paths

- **Wrap an existing matrix** — opencode delegates to `@ai-sdk/*` (23 bundled adapters lazy-loaded on demand); openclaw delegates to pi-ai through its pi-mono embedding (~25 providers across 9 wire APIs). One wrapper, broad provider coverage.
- **Build your own** — claude-code (Anthropic-native streaming), hermes-agent (OpenAI-format with native parsers), pi-ai (9 wire APIs hand-implemented).

opencode goes further: it ingests the model catalog **live from `https://models.dev`** with a 60-minute refresh, so new models appear without code changes. This is unique among the five.

### Server-as-default vs binary-as-default

- **Server-as-default**: opencode (always a server, even when bundled into the TUI), hermes-agent (the gateway is the canonical deployment), openclaw (the Gateway is the spine).
- **Binary-as-default**: claude-code, pi-mono.

The server-as-default trio gets multi-surface (mobile + desktop + IDE + chat) almost for free. The binary-as-default pair stays simple. claude-code partially escapes this trade-off via its remote CCR sessions and bridge mode, which add a server-like layer on top of the binary.

### ACP — the IDE bridge nobody is calling MCP

All four non-claude-code agents implement ACP (the Agent Client Protocol used by Zed and others). This is a striking convergence — within ~12 months, four independent agent projects shipped ACP servers without much coordination. In two cases (hermes-agent, openclaw) ACP sessions persist to the same store as native sessions, so what the IDE sees is the *same agent* the operator sees, not a forked-context process.

openclaw uniquely speaks ACP in both directions: it serves ACP for IDEs and *consumes* ACP via its `acpx` extension to run Codex / Claude Code / Gemini CLI / OpenCode / Pi as nested ACP children.

### Sandbox spectrum

| Level | Example | Description |
|---|---|---|
| **None** | pi-mono core | Tool runs in the agent's process. Sandbox is the user's problem. |
| **OS rules** | claude-code | `@anthropic-ai/sandbox-runtime` adapter applies filesystem/network/domain rules to bash + web operations. |
| **Pluggable transport** | pi-mono via extensions | `BashOperations`/`ReadOperations`/… can be swapped for SSH, gondolin micro-VM, Landlock/Seatbelt. |
| **Tiered Docker** | openclaw | Three Dockerfiles (`sandbox`, `sandbox-common`, `sandbox-browser`), per-session containers, hashes to detect drift, podman + Quadlet for rootless production. |
| **Multi-backend** | hermes-agent | Seven terminal backends: local, Docker, SSH, Singularity, Modal, Daytona, Vercel Sandbox. Modal/Daytona enable serverless persistence. |

opencode currently has no first-class sandbox — its experimental "workspace adapter" can target remote sandboxes via the `containers` package, but core development happens on the host.

### Subagents and multi-agent

Three distinct patterns:

- **First-class tool, library of types** — claude-code's `AgentTool` with `subagent_type` (general-purpose / Explore / Plan / verification / claude-code-guide / statuslineSetup + plugin types) and full isolation primitives (worktree, remote CCR session). Each type is a markdown file with frontmatter.
- **First-class tool, agents in config** — opencode's `task` tool with `subagent_type: <name>` resolves agents from `agent/agent.ts` + `opencode.json` user definitions. Built-in `general`/`plan`/`explore`/`scout` (experimental) + user-defined.
- **First-class tool, role-bounded** — hermes-agent's `delegate_task` with `role: leaf | orchestrator` and `max_spawn_depth`. Leaf cannot recurse; orchestrator can but is bounded.
- **Explicitly refused** — pi-mono.
- **Available but discouraged** — openclaw has `sessions_spawn` but VISION.md says "agent-hierarchy frameworks" are not first-class.

claude-code's verification subagent is the most explicit gather→act→verify enforcement: a structurally read-only subagent (5-tool denylist) with an adversarial prompt that must end its output with `VERDICT: PASS|FAIL|PARTIAL`. The caller is required to spot-check 2-3 of its commands.

### Memory: a quiet rift

- **No learned memory in core** — pi-mono, openclaw. Both rely on AGENTS.md, session JSONL, and (for openclaw) a `kind: "memory"` slot plugin that can be implemented by an extension. The host doesn't decide what gets remembered.
- **File-based memory with consolidation** — claude-code's `memdir/` with `MEMORY.md` cap, daily logs at `~/.../logs/YYYY/MM/`, and the `/dream` skill (also runnable as the background `autoDream` service) that consolidates logs into topic files. Consolidation is itself a forked subagent under the same loop.
- **Multi-layer plus curator** — hermes-agent: bounded file memory + provider plugin (Honcho/Mem0/…) + FTS5 session search + auto-archive curator using an auxiliary forked agent.

hermes-agent is the only one where the agent edits its own skills (curator can `pin`/`archive`/`consolidate`/`patch` agent-created skills). claude-code edits memory but not skills. The others don't auto-edit either.

### Auto-recovery as control flow

claude-code's loop is the most explicit about treating prompt-too-long, max-output-tokens, model fallback, and stop-hook continuation as `continue` paths with anti-spiral guards. opencode does this with retry policies (`SessionRetry.policy` with `Retry-After` header support, exponential backoff). hermes-agent and openclaw inherit pi-mono's loop, which is simpler — aborts and provider errors bubble up as a final assistant message with `stopReason: "aborted" | "error"` and the higher layer decides whether to retry. Recovery-as-control-flow is most refined in claude-code.

### Trust boundaries

Three of the five (claude-code, openclaw, hermes-agent) treat prompt injection as a real defensive concern with multi-layer mitigations:

- **claude-code**: project-settings exclusion from auto-memory path overrides (so a hostile repo can't redirect memory); writes to `.claude/skills/` always blocked at the sandbox layer regardless of permission rules; MCP skills are flagged as untrusted relative to local file skills.
- **openclaw**: sandbox by default for non-main sessions; container security hardening (`--read-only`, `no-new-privileges`, seccomp, apparmor); CIDR allowlist on the browser sandbox's CDP forwarder; plugin discovery rejects world-writable or suspicious-uid paths; container labels with config-hash to detect drift.
- **hermes-agent**: memory content scan, context-file injection scan, cron prompt re-scanned after assembly because skill content can change between create-time and run-time.

pi-mono and opencode have fewer first-class defenses, deferring to the user's container / OS sandbox.

## Notable cross-references

- **openclaw embeds pi-mono.** `src/agents/pi-embedded-runner.ts` is the seam; openclaw imports `@mariozechner/pi-agent-core` + `@mariozechner/pi-coding-agent` + `@mariozechner/pi-ai` and adds its own tool wiring, sandbox, session lanes, and gateway protocol on top. This is the most direct dependency between any two of the five.
- **hermes evolved from openclaw.** `hermes claw migrate` imports `~/.openclaw` (SOUL.md, MEMORY.md/USER.md, skills, command allowlist, channel settings). The README treats OpenClaw as the precursor. This is a *fork in editorial direction* — openclaw stayed lean, hermes layered on self-improvement, RL data generation, and an extensive plugin policy regime.
- **opencode reads `.claude/skills/` directly.** opencode's skill discovery walks `~/.claude/skills/` and project `.claude/skills/` so Claude-Code users' existing skills work unchanged. This is provider-agnosticism extended to artifacts, not just models.
- **pi-skills targets five agents.** badlogic's pi-skills repo ships identical content with install instructions for `~/.pi/agent/skills/pi-skills`, `~/.codex/skills/pi-skills`, `~/.config/amp/tools/pi-skills`, `~/.factory/skills/pi-skills`, and (with symlink workarounds) `~/.claude/skills/<skill>`. The `SKILL.md` is the unifying artifact.
- **openclaw uses ACP twice.** `openclaw acp` is a stdio-NDJSON ACP server for IDEs. `extensions/acpx` is an ACP *client* registry that lets openclaw embed Codex / Claude Code / Gemini CLI / OpenCode / Pi as nested ACP harnesses. So openclaw can be driven by Zed, and openclaw can drive other coding agents.
- **All non-claude agents speak ACP.** opencode (`packages/opencode/src/acp/`), pi (community `pi-acp` extension), hermes (`acp_adapter/server.py`), openclaw (`src/acp/server.ts`). Each maps ACP sessions to its own session store.

## Where the field is converging

- **`SKILL.md` as the portable capability artifact.** Markdown + frontmatter + progressive disclosure (name + description visible, body loaded on demand). All five honor this; four are explicitly interop-compatible.
- **`AGENTS.md`/`CLAUDE.md` walk from cwd to root.** Universal among the five.
- **Tool-call dialect = OpenAI's** (the four non-claude-code agents all use OpenAI-style `tools=[]` + `tool_calls` arrays). claude-code uses Anthropic Messages format internally but converts at the wire.
- **ACP for IDE integration.** Four of five have ACP servers in-tree. Within ~12 months from a standing start, ACP has become the default IDE-agent protocol.
- **Streaming + concurrency-safe parallel tool execution.** All five stream tokens; three execute tools while the model is still talking.
- **Compaction as normal control flow.** All five run compaction inside the loop rather than as a separate maintenance pass.
- **Subagent = same loop with different policy.** Universal pattern even where the surface looks different.
- **MCP is the default extension point** (except pi-mono and openclaw-core, both of which refuse it deliberately).
- **One loop, many runtimes.** CLI ≈ headless SDK ≈ subagent ≈ background consolidator ≈ ACP session ≈ cron job ≈ training rollout. The "agent" is a loop configuration, not a separate runtime per surface.

## Where the field is diverging

- **Server-first vs binary-first.** opencode/hermes/openclaw bet on a daemon; claude-code and pi-mono ship a binary. This split shapes everything downstream — multi-surface support, multi-channel messaging, mobile clients, hosting story.
- **Provider strategy.** Live remote catalog (opencode) vs hand-curated registry (pi-ai, claude-code) vs plugin-per-provider (hermes-agent).
- **Sandbox philosophy.** Multi-backend including serverless (hermes), tiered Docker (openclaw), OS-rules adapter (claude-code), pluggable transport (pi), none in core (opencode).
- **Memory model.** Four layers with curator (hermes) vs file-based with dream consolidator (claude-code) vs JSONL session tree only (pi/openclaw) vs no learned memory in core but durable sessions (opencode).
- **Editorial stance on extensibility.** Refuse-and-eject (pi) vs layered platform (claude-code) vs typed protocol surface (opencode) vs lean-core-fat-ecosystem (openclaw) vs plugin-policy-regime with signed rules (hermes).
- **Permissions.** Pattern-rule engine (opencode, claude-code) vs no-popups-build-your-own (pi) vs sandbox-first (openclaw) vs per-tool callback (hermes).
- **Single-tenant vs multi-channel.** openclaw and hermes route a single operator's conversations across many channels; the others are single-surface.
- **Agent-as-training-data.** Only hermes-agent ships the agent's own runtime as a training environment (`batch_runner.py` + `environments/`). This is a structural commitment to using the agent's own output to improve the next model.
- **Self-modification.** Only hermes-agent has the agent edit its own skills (via curator). claude-code edits its own memory. The other three do neither.

## Lens: where would I start a new agent?

If the design goal is:

- **A coding agent for one engineer, hand-buildable, no MCP** → pi-mono's pattern. Seven tools, JSONL-tree sessions, AGENTS.md walk, TypeBox schemas, extensions for everything else.
- **A coding agent that's a platform** → claude-code's pattern. Markdown + frontmatter for everything, MCP-first, defer-tools for scale, layered permission/sandbox/hooks stack.
- **A coding agent that runs everywhere** → opencode's pattern. Server-first, typed HTTP API, generated SDK, ACP for IDEs, AI SDK + models.dev for provider matrix.
- **A personal assistant on chat platforms** → openclaw's pattern. Single daemon, multi-channel, tiered Docker sandbox, mcporter for MCP, ClawHub for skills, embed pi-mono for the agent core.
- **A self-improving agent that's also a training environment** → hermes-agent's pattern. Python, gateway + cron + ACP + dashboard sharing one SQLite, four-layer memory with curator, batch-runner + Atropos for trajectory generation, plugin policy regime that forbids core modification.

The choice between these is not "which is best" — it is "what problem class are you in." The five agents agree on much more than they disagree about. The disagreements that remain are *editorial*: what to refuse, what to formalize, how to draw trust boundaries, and whether the agent is allowed to modify itself.
