# Modern AI Agents: Architecture, Philosophy, Core

A field report on the design of contemporary AI coding/assistant agents, based on a deep read of five distinct projects in May 2026:

| Agent | Maker | Language | One-line |
|---|---|---|---|
| [**claude-code**](agents/claude-code.md) | Anthropic | TypeScript (Ink) | The reference coding-agent CLI: layered platform, MCP-first, file-based extension everywhere. |
| [**opencode**](agents/opencode.md) | SST + community | TypeScript (Bun, Effect) | Server-first agent with a typed HTTP API; multiple clients (TUI/desktop/mobile/ACP) speak the same protocol. |
| [**pi-mono**](agents/pi-mono.md) | Mario Zechner (badlogic) | TypeScript (Node) | Hand-crafted minimal coding agent: seven tools, no MCP, no subagents, everything else as extensions. |
| [**hermes-agent**](agents/hermes-agent.md) | Nous Research | Python | Self-improving multi-surface assistant: gateway + cron + ACP + RL training, four-layer memory, curator. |
| [**openclaw**](agents/openclaw.md) | independent | TypeScript (Node) | Single-operator personal-assistant gateway: tiered Docker sandbox, multi-channel daemon, embeds pi-mono. |

See [comparison.md](comparison/comparison.md) for the full cross-cut. This document is the synthesis — what these five agents tell us, together, about where AI agent design is in 2026.

## The shape of a modern agent

If you read all five projects back-to-back, a common shape comes into focus. A modern agent is roughly:

```
       ┌──────────────────────────────────┐
       │   Surface (TUI, chat, IDE, …)    │
       └────────────────┬─────────────────┘
                        │
       ┌────────────────▼─────────────────┐
       │     Session / Turn Manager        │
       │   (history, compaction, retry)    │
       └────────────────┬─────────────────┘
                        │
       ┌────────────────▼─────────────────┐
       │       Loop (while true)           │
       │  prompt → model → tool calls →    │
       │  tool results → repeat            │
       └────┬───────────────┬──────────────┘
            │               │
   ┌────────▼───┐    ┌──────▼──────┐    ┌────────────┐
   │  Provider  │    │  Tool       │    │ Hooks /     │
   │  (AI SDK,  │    │  Registry   │    │ Permission /│
   │  custom)   │    │             │    │ Sandbox     │
   └────────────┘    └─────┬───────┘    └────────────┘
                           │
              ┌────────────┼────────────┬────────────┐
              ▼            ▼            ▼            ▼
          Built-ins      MCP        Plugins      Skills
          (read,                    (TS code,    (SKILL.md,
          edit, bash,               jiti loaded) progressive
          web, …)                                disclosure)
```

The pieces are remarkably consistent. The disagreements are about:

- Whether the loop runs in a binary or behind an HTTP server.
- Whether the model is one vendor's or any of twenty.
- Whether tools live in the agent process, in containers, or behind a sandbox runtime.
- Whether the user is approving every shell call or has accepted a sandbox in lieu.
- Whether the agent learns persistently or starts fresh every session.
- Whether subagents are first-class, refused, or merely tolerated.

## Eight design patterns that are now standard

After reading these five agents, you can describe each in terms of how it answers a fixed set of questions. The pattern catalog is becoming legible.

### 1. One loop, many policies

Same `while (true) { call model; run tools }` body, reconfigured by prompt + tool filter + permission policy to implement what looks like different runtimes: interactive vs headless, main vs subagent, coordinator vs worker, foreground vs background-consolidator, local vs remote, eval vs training.

- claude-code's `src/query.ts` (1,729 lines) is the only assistant loop. Interactive REPL, headless SDK, subagents, coordinator workers, remote sessions, dream consolidation, verification — all are configurations.
- opencode's `SessionPrompt.runLoop` runs primary `build`, `plan`, `general`, `explore`, hidden `compaction`/`title`/`summary` — same loop.
- hermes-agent's `AIAgent` runs in CLI, gateway, ACP, dashboard, cron, batch-runner, and Atropos RL — same loop.
- openclaw delegates the loop to pi-mono via `pi-embedded-runner.ts`; the multi-channel daemon wraps it.

This is the single most universal pattern. Multi-agent behavior is not a separate platform; it is the same loop with different policy. (pi-mono dissents — it ships only the one loop and refuses to host subagents internally.)

### 2. Methodology in prompts, not state

No "Phase" enum. No gather→act→verify state machine in code. Sequencing is encoded in three layers:

- **Prompt rules** — *"Read first. Verify before reporting. Reversibility matters. Measure twice, cut once."*
- **Tool-set filters** — read-only subagents share a shared denylist (claude-code: 5 mutating tools) that makes the methodology *structurally* enforceable.
- **One parsed contract** — typically a verdict line (claude-code: `VERDICT: PASS|FAIL|PARTIAL`).

The model is the active sequencer. The runtime is what makes its choices safe and recoverable.

### 3. Compaction as control flow

Context pressure is not an error to be handled — it is a normal phase of every turn. All five projects fold compaction into the loop body:

- claude-code stages five tiers (`tool-result budget → snip → microcompact → context-collapse → autocompact`) before every model call.
- opencode and openclaw queue a `compaction` agent on overflow, run a hidden compaction turn, and continue.
- hermes-agent enforces prefix-cache discipline as an architectural rule: *"the ONLY time we alter context is during context compression."*
- pi-mono offers `/compact` plus auto-compaction, with `session_before_compact` for extensions.

The underlying reading: long sessions are the default mode. Designs that assume short turns are obsolete.

### 4. SKILL.md as the portable capability artifact

A skill is a directory with `SKILL.md`:

```yaml
---
name: brave-search           # ≤64 chars, kebab-case
description: Web search ...  # ≤1024 chars
---

# Body — instructions, scripts, examples
```

The model sees `name + description + path` in the system prompt index. To invoke, the model reads the file. This **progressive disclosure** keeps token cost bounded and lets a workspace declare 50 skills without inflating turn-1 context.

The format was popularized by Anthropic's Claude Skills, was extracted into [agentskills.io](https://agentskills.io) as an open standard, and is now honored by:

- pi-skills (Pi/Codex/Amp/Droid/Claude Code — same `SKILL.md`, different install paths)
- opencode (walks `~/.claude/skills/` and project `.claude/skills/` directly)
- hermes-agent (explicit agentskills.io compatibility)
- openclaw (with the ClawHub registry on top)
- claude-code itself

**This is the most striking interop convergence of the field.** A skill is now a portable artifact across at least seven agent CLIs in May 2026.

### 5. AGENTS.md walks

Every one of the five honors a `AGENTS.md` / `CLAUDE.md` walk from cwd to root, injecting each ancestor file under a `# Project Context` heading. pi-mono and hermes also pick up `.cursorrules`. claude-code adds lazy attachment when files in a subtree are first touched. The de-facto contract is universal.

### 6. ACP for IDE integration

The [Agent Client Protocol](https://agentclientprotocol.com/) (originally Zed's spec) has been adopted by four of the five projects in roughly a year:

- opencode: `opencode acp` as a stdio-NDJSON JSON-RPC server, full SDK integration.
- pi-mono: community `pi-acp` extension.
- hermes-agent: `acp_adapter/server.py` that persists ACP sessions to the same `~/.hermes/state.db` as native sessions.
- openclaw: `openclaw acp` server *and* an `acpx` extension that lets openclaw drive Codex / Claude Code / Gemini CLI / OpenCode / Pi as nested ACP children.

This level of cross-vendor adoption with no central coordination is unusual. ACP appears to be filling a gap MCP intentionally does not address (per-turn agent control rather than per-call tool exposure).

### 7. Streaming + concurrency-safe parallel tool execution

Tokens stream live. Concurrency-safe tools execute while the model is still talking. Tool-use summaries (cheap Haiku calls) overlap under expensive turns. Memory and skill prefetch start at iteration-top and consume post-tool. The latency budget is hidden inside the model's emit time.

- claude-code's `StreamingToolExecutor` runs concurrency-safe tools concurrently with the model stream; non-safe tools serialize. Tool-use summaries fire after one turn and resolve during the next.
- opencode's `SessionProcessor` consumes AI-SDK stream events one at a time and dispatches tools live; `experimental_repairToolCall` reroutes mis-cased calls.
- pi-mono and openclaw inherit pi-mono's parallel-with-sequential-fallback executor.

This is universal. Sequential tool batches that wait for the full turn to finish before running anything are legacy design.

### 8. Pattern-rule permission systems

When permissions exist at all, they are *patterns* over a tool-call structure:

```
Bash(git *)          → allow
Read(*.env)          → ask
WebFetch(domain:google.com) → allow
```

with rules merged from policy → user → project → session, persisted per project, and resolved into `allow | deny | ask`. claude-code and opencode independently arrived at near-identical surface design.

pi-mono refuses to ship permission UI in core. openclaw defers permissions to the sandbox layer. hermes-agent uses per-tool approval callbacks bridged from ACP.

## Six points of disagreement

These are the lines where the five agents structurally diverge.

### Server-first vs binary-first

| Stance | Agents | Trade-off |
|---|---|---|
| Server-first | opencode, hermes-agent, openclaw | Mobile + IDE + web + chat clients are nearly free. Single source of truth for sessions. Authentication is now a problem to solve. |
| Binary-first | claude-code, pi-mono | Simple, fast, no daemon to monitor. Multi-surface requires either re-implementing the binary (bad) or bridging through a remote service (claude-code's CCR). |

The split predicts everything downstream — multi-channel messaging, hosting story, the existence of a "Control UI," whether subagents can outlive the foreground process.

### MCP: load-bearing vs deliberately refused

Three agents put MCP in core:
- claude-code (`src/services/mcp/client.ts` is 3,348 lines — comparable to its model API client).
- opencode (`packages/opencode/src/mcp/index.ts` with stdio/HTTP/SSE/OAuth).
- hermes-agent (MCP servers configured per session, advertised as a skill category).

Two agents refuse MCP in core:
- pi-mono: *"No MCP. Build CLI tools with READMEs (see Skills), or build an extension that adds MCP support."*
- openclaw: *"We prefer this bridge model over building first-class MCP runtime into core"* — recommends [`mcporter`](https://github.com/steipete/mcporter) as the integration.

The refusers' shared logic: MCP servers can be added/changed without restarting; core stays lean; MCP churn doesn't break core. The accepters' logic: MCP is the de-facto extension format; building it in lets you do classifier-driven access control and deferred-loading.

### Sandbox: who runs the bash?

A spectrum:

```
none in core               OS rules         pluggable transport      tiered Docker      multi-backend
   pi (core)            claude-code         pi (extensions)             openclaw           hermes-agent
                                                                                          (local/Docker/
                                                                                           SSH/Modal/
                                                                                           Daytona/...)
```

opencode does not currently have a first-class sandbox; the experimental workspace adapter can target remote sandboxes via the `containers` package. claude-code applies sandbox runtime rules at the bash-call layer when enabled. openclaw is the most committed: three Dockerfiles (minimal Debian / Node+Go+Rust+Brew / Chromium+Xvfb+noVNC), per-session containers, config-hashed for drift detection, podman + Quadlet for rootless production. hermes-agent abstracts the *terminal* itself: same agent code, different physical place where the bash runs.

### Memory: what does "growing" mean?

| Stance | Agents | What persists |
|---|---|---|
| No learned memory in core | pi-mono, openclaw | AGENTS.md (read-only), JSONL session tree. Memory is a slot plugin. |
| File-based + consolidator | claude-code | MEMORY.md (200 lines cap), daily logs, nightly `/dream` skill that consolidates into topic files. |
| Four-layer + curator | hermes-agent | MEMORY.md/USER.md (2200/1375 char cap, frozen snapshot) + provider plugin (Honcho/Mem0/…) + FTS5 session search + auto-archive curator using auxiliary agent. |
| Durable sessions, no learned memory | opencode | Sessions are event-sourced and snapshot-versioned. Revert, fork, share by replay. But no MEMORY.md. |

**hermes-agent is alone among the five in letting the agent edit its own substrate.** The curator can `pin`/`archive`/`consolidate`/`patch` agent-created skills (and only agent-created skills — bundled and hub skills are off-limits). claude-code edits memory but not skills. Everyone else edits neither.

### Subagents: first-class, available, or refused?

```
        REFUSED               AVAILABLE              FIRST-CLASS
        pi (core)             openclaw               claude-code
                              (VISION rejects        (Task tool, 6+ subagent
                              agent-hierarchy        types, worktree/remote
                              frameworks but         isolation, denylist for
                              ships sessions_spawn)  read-only agents)

                              hermes-agent           opencode
                              (delegate_task,        (task tool, built-in
                              role: leaf|orch,       general/plan/explore/
                              depth-bounded)         scout, user-defined
                                                     subagents in opencode.json)
```

claude-code's verification subagent is the most explicit implementation of the "trust-and-verify" pattern: a structurally read-only subagent with an adversarial prompt that must end with `VERDICT: PASS|FAIL|PARTIAL`, plus a system-prompt requirement that the caller spot-check 2-3 of its commands.

### Editorial stance

The five projects sit on a spectrum from explicit minimalism to explicit maximalism:

- **pi-mono** is most explicit about minimalism. *"No MCP. No sub-agents. No permission popups. No plan mode. No to-dos. No background bash."* The contribution gate auto-closes new contributors' PRs by default; `lgtmi`/`lgtm` whitelisting is required. AGENTS.md: *"No emojis in commits, issues, PR comments, or code. No fluff or cheerful filler text."*
- **openclaw** is explicit about lean core. VISION.md "What We Will Not Merge (For Now)" enumerates seven categories of refusal including agent-hierarchy frameworks and first-class MCP runtime in core. The ClawHub registry is the sanctioned offload.
- **claude-code** layers a platform without ideological refusals. The platform is large (~5,000-line REPL, ~1,700-line turn state machine, ~40 tools, plugins/skills/output-styles/agents/MCP all loadable from markdown). The work is in keeping the layers separable.
- **hermes-agent** is most explicit about policy. The Teknium-signed-and-dated rule in AGENTS.md: *"plugins MUST NOT modify core files. If a plugin needs a capability the framework doesn't expose, expand the generic plugin surface — never hardcode plugin-specific logic into core."* Three separate plugin discovery systems (general, memory, model-provider) reflect the policy.
- **opencode** has no manifesto but has a strong protocol commitment — typed HTTP API, generated SDK, OpenAPI doc, Effect Service/Layer conventions documented in AGENTS.md. The discipline is structural rather than editorial.

These stances are not interchangeable. Pi could not become claude-code without ceasing to be pi.

## Three sleeper concerns

Things that surface across these projects without being treated as headline features:

### Prefix cache as architecture

The Anthropic prompt cache (5-minute TTL) creates strong economic pressure to keep the system-prompt prefix stable across turns. This shows up as:

- claude-code's `backfillObservableInput` mutates a *clone* of tool_use blocks so the API-bound input never changes mid-stream; subagent contexts clone `contentReplacementState` so forks make identical cache decisions.
- claude-code's `stripSignatureBlocks` on model fallback (signatures are model-bound, can't replay across families).
- opencode's two-part system prompt re-flattening after plugin transforms, preserving caching breakpoints.
- opencode's deterministic prefix when MCP tools are added (built-ins as a sorted contiguous prefix so the server's global cache breakpoint sits after the built-in suffix).
- hermes-agent's prefix-cache discipline as a hard rule: memory snapshot is *frozen* at session start; mid-session writes go to disk but never to the system prompt until next session.

Prefix-cache-stable design is now load-bearing for cost control. Designs that recompute the system prompt every turn are obsolete.

### "Recovery as control flow"

The mature loops treat the error cases — prompt-too-long, max-output-tokens, model fallback, interruption, stop-hook blocking — as normal `continue` paths with explicit anti-spiral guards. claude-code's `transition` field on its loop's `State` struct records *why* the previous iteration continued; the next iteration uses that to decide whether to retry, escalate, or surface. opencode wraps the entire turn in `Effect.retry(SessionRetry.policy(...))` with `Retry-After` header awareness and exponential backoff.

Designs that surface 413s as exceptions to the user are obsolete. Compaction-on-413 + retry is the bar.

### "One operator" as a security frame

openclaw is most explicit: *"OpenClaw does **not** model one gateway as a multi-tenant boundary. The recommended deployment is one user per host, one gateway per user, one or more agents per gateway."* This collapses an entire class of "shared agent" complexity. There is no per-session ACL; the gateway/sandbox/exec-approval layers are *operator guardrails*, not authorization between people.

hermes-agent has a comparable stance — sessions are visible to the operator across surfaces. opencode's basic-auth password is per-server, not per-user. claude-code's auto-memory excludes project-settings from path overrides so a hostile repo can't redirect memory — but it does not pretend to be multi-tenant.

This is editorial. Agent platforms that try to be multi-tenant are taking on a real cost; the single-operator framing is recognized in the wild as the simpler default.

## What you can build today

If you're starting from scratch in mid-2026, the table stakes are roughly:

1. **A streaming chat loop over a provider abstraction.** The Vercel AI SDK (`@ai-sdk/*`) is the path of least resistance; alternatively a hand-rolled wire-API layer like pi-ai for ~25 providers across 9 APIs.
2. **A tool registry with TypeBox/Zod-validated arguments and a streaming executor** for concurrency-safe parallel tool calls.
3. **Markdown skill loader** that honors `SKILL.md` + frontmatter and walks at least `~/.claude/skills/` and `.agents/skills/` for community-skill compatibility.
4. **AGENTS.md walk from cwd to root**, injected under a `# Project Context` heading.
5. **A compaction stage that runs before every model call**, with at least: tool-result budgeting + summary-on-overflow + a way for the model to recover from a real 413.
6. **A permission system that's pattern-rule-based** if you go that route (claude-code, opencode), or a sandbox/container story if you go the other way (openclaw, hermes).
7. **MCP support** unless you're explicitly refusing it (pi, openclaw-core).
8. **An ACP server** for IDE integration — this is the new table-stake for editor users.
9. **A session store** that's durable (event-sourced is a plus, JSONL trees are fine) so users can fork/rewind/replay/share.
10. **Subagent capability** via a `task` tool — even if you only ship one type (`general`), the affordance matters.

If you're building a chat-platform assistant rather than a coding agent, add:

- A daemon process that owns provider connections.
- A typed protocol (TypeBox or Effect Schema, codegen'd to client SDKs).
- A tiered sandbox or multi-backend terminal abstraction.
- A persistence-survives-restart session store.
- Multi-channel routing.
- A skills registry beyond your own repo.

You do not need to invent any of this; all of it is in one or more of the five projects above. The interesting work in 2026 is figuring out *which* of these patterns matter for *your* problem class, and refusing the rest.

## Reading order

For the presentation, this is a reasonable read-through order:

1. **claude-code** — most layered platform; read to see the full kit.
2. **opencode** — most refined protocol surface; read to see the server-first split.
3. **pi-mono** — most explicit minimalism; read to see what's optional.
4. **hermes-agent** — most ambitious memory and training-data story; read to see where the field is going.
5. **openclaw** — most committed to sandbox + multi-channel; read to see the personal-assistant frame.
6. **comparison.md** — the cross-cut.
7. **this file** — the synthesis.

## Files in this repository

```
docs/
├── README.md                    ← this file (synthesis)
├── agents/
│   ├── claude-code.md           ← 604 lines, evidence + citations
│   ├── opencode.md              ← 665 lines
│   ├── pi-mono.md               ← 463 lines
│   ├── hermes-agent.md          ← 597 lines
│   └── openclaw.md              ← 713 lines
└── comparison/
    └── comparison.md            ← cross-cut, ~400 lines
```

Each per-agent doc is the primary source; this README and `comparison.md` are the cross-cut. When something here seems off, read the per-agent doc — the per-agent docs have file-path-and-line citations and verbatim quotes from the source.
