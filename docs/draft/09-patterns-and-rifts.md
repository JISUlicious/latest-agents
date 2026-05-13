# Tier 9 — Patterns and rifts (THE CORE)

> What the five agents reveal, taken together. There are about a dozen patterns they share — *universals* that have become the way modern agents are built — and about a dozen places they structurally diverge — *editorial rifts*. Read these in order: the universals are the inheritance from Tiers 1-7 made concrete; the rifts are where designers' opinions still matter; the cross-references are where the genealogy gets surprising. By the end of this tier, the thesis (Tier 10) writes itself.

## Universals — patterns shared across most agents

### One loop, many policies

The single most universal pattern. Same `while (true) { call model; run tools }` body, reconfigured by **prompt + tool filter + permission policy** to implement what looks like different runtimes: interactive vs headless, main vs subagent, coordinator vs worker, foreground vs background-consolidator, local vs remote, eval vs training.

- **claude-code's `src/query.ts`** runs interactive REPL, headless SDK, subagents, coordinator workers, remote sessions, dream consolidation, and verification — all are different configurations of the same loop.
- **opencode's `SessionPrompt.runLoop`** plus `SessionProcessor` is the only loop. Built-in agents `build` / `plan` / `general` / `explore` / `compaction` / `title` / `summary` are loop configurations.
- **hermes-agent's `AIAgent`** runs in CLI, gateway, ACP, dashboard, cron, batch-runner, and Atropos RL environment — same loop, different runtime.
- **openclaw** delegates the loop itself to pi-mono via `pi-embedded-runner.ts`; the multi-channel daemon wraps it.

**pi-mono is the dissenting case** — it ships only the one coding-agent loop and explicitly does not host subagents, plans, or coordinators internally. Multi-agent behavior is delegated entirely to extensions or external tools spawned via tmux.

Multi-agent behavior is not a separate platform; **it is the same loop with different policy**.

### Methodology in prompts, not state

No "Phase" enum. No gather→act→verify state machine in code. Sequencing is encoded in three layers:

1. **Prompt rules** — "Read first. Verify before reporting. Reversibility matters."
2. **Tool-set filters** — read-only subagents share a denylist that makes the methodology *structurally* enforceable (claude-code's 5-tool denylist on Explore/Plan/Verify subagents is the canonical example).
3. **One parsed contract** — typically a verdict line (claude-code's `VERDICT: PASS | FAIL | PARTIAL`).

The model is the active sequencer. The runtime exists to make its choices safe and recoverable, not to second-guess them. This is the direct descendant of Tier 6's "purpose enforced through prompts + schemas + structural tool filters."

### Compaction as control flow

Context pressure is not an error to be handled; it is a *normal phase of every turn*. All five projects fold compaction into the loop body:

- **claude-code** stages five tiers (tool-result budget → snip → microcompact → context-collapse → autocompact) before every model call, plus reactive paths for real 413s. Several stages are feature-gated dynamic requires.
- **opencode** and **openclaw** queue a hidden `compaction` agent on overflow, run a compaction turn, continue. opencode exposes `experimental.session.compacting` as a plugin override.
- **hermes-agent** enforces prefix-cache discipline as a hard architectural rule: "the ONLY time we alter context is during context compression."
- **pi-mono** offers `/compact` plus automatic on overflow, with `session_before_compact` as an extension event.

The reading: **long sessions are the default mode**. Designs that assume short turns are obsolete.

### Streaming + concurrency-safe parallel tool execution

All five stream model tokens. Three (claude-code, opencode, openclaw via pi-mono) additionally execute concurrency-safe tools while the model is still emitting tokens.

- claude-code: `StreamingToolExecutor` overlaps tool runs with the stream.
- opencode: per-turn `SessionProcessor` processes AI-SDK `tool-input-delta` / `tool-call` events live. Bad calls don't break the stream — `experimental_repairToolCall` rewrites mis-cased tool names (`Read` → `read`); genuinely-unknown calls get routed to a sink `invalid` tool whose error becomes a tool result the model self-corrects from.
- openclaw: pi-mono's `executeToolCallsParallel` with sequential safety fallback.

hermes-agent's loop is synchronous over OpenAI chat-completions; tool calls within one turn run sequentially. **The streaming + parallel pattern is universal everywhere it can be.**

### Recovery as control flow — two axes

The mature loops treat error cases as normal `continue` paths with explicit anti-spiral guards. Two complementary axes:

- **Retry the API** — claude-code's `transition` field on its loop's `State` struct records *why* the previous iteration continued; the next iteration uses that to decide whether to retry, escalate, or surface. Prompt-too-long, max-output-tokens, model fallback, interruption, stop-hook blocking — all are normal continue paths. opencode wraps the entire turn in `Effect.retry(SessionRetry.policy(...))` with `Retry-After` header awareness and exponential backoff.

- **Self-correct via tool result** — opencode's `experimental_repairToolCall` is the cleanest example. Bad tool calls become readable tool errors the model self-corrects from. The model doesn't need to retry the API — it just sees a different tool result on the next iteration. **Bad tool calls flow through the tool channel, not the exception channel.**

The two patterns *compose*: a runtime that does both has both transparent retries *and* a recoverable error surface inside the loop. **Recovery-as-control-flow is most refined in claude-code along the first axis, and in opencode along the second.**

### SKILL.md as portable artifact (progressive disclosure)

A `SKILL.md` is a Markdown file with YAML frontmatter:
```yaml
---
name: brave-search           # ≤64 chars, kebab-case
description: Web search ...  # ≤1024 chars
---
```

The model sees `name + description + path` in the system prompt index. To invoke, the model reads the file. **Progressive disclosure** keeps token cost bounded and lets a workspace declare 50 skills without inflating turn-1 context.

The format was popularized by Anthropic's Claude Skills (Oct 2025), extracted into `agentskills.io` (Dec 2025) as an open standard, and is honored by:
- **pi-skills** ships identical content for Pi / Codex / Amp / Droid / Claude Code.
- **opencode** walks `~/.claude/skills/` directly.
- **hermes-agent** explicit agentskills.io compatibility.
- **openclaw** uses the format with a ClawHub registry.
- **claude-code** is the spec's origin.

**This is the most striking interop convergence of the field.** A skill is now a portable artifact across at least seven agent CLIs in 2026.

### AGENTS.md walks

All five honor `AGENTS.md` / `CLAUDE.md` discovery starting from cwd, walking ancestors, injecting under a `# Project Context` heading. pi-mono and hermes also pick up `.cursorrules`. claude-code adds lazy attachment for nested `CLAUDE.md` when files in a subtree are first touched.

`AGENTS.md` was donated to the Linux Foundation in late 2025 as part of the Agentic AI Foundation (the same one that received MCP). The de facto contract is universal.

### ACP for IDE integration

Four of five projects ship ACP servers in-tree, all within ~12 months of Zed announcing the protocol (Aug 2025):

- **opencode** — `opencode acp` as stdio-NDJSON JSON-RPC, full SDK integration.
- **pi-mono** — community `pi-acp` extension.
- **hermes-agent** — `acp_adapter/server.py` that persists ACP sessions to the **same** `~/.hermes/state.db` as native sessions. A sibling `acp_registry/` directory ships `agent.json` + `icon.svg` for editor-side discovery (ACP has metadata conventions on top of the wire).
- **openclaw** — `openclaw acp` server *and* an `acpx` extension that lets openclaw drive Codex / Claude Code / Gemini CLI / OpenCode / Pi as nested ACP children.

This level of cross-vendor adoption with no central coordination is unusual. ACP appears to be filling a gap MCP intentionally does not address (per-turn agent control rather than per-call tool exposure). The strong form is what hermes and openclaw do — **persisting ACP sessions to the same store as native sessions, so the editor sees the same conversation the CLI does**, not a forked-context process.

### Pattern-rule permissions (where they exist at all)

When permissions exist in core, they are *patterns* over a tool-call structure:

```
Bash(git *)                  → allow
Read(*.env)                  → ask
WebFetch(domain:google.com)  → allow
```

with rules merged from policy → user → project → session, persisted per project, resolved into `allow | deny | ask`. **claude-code and opencode independently arrived at near-identical surface design.** opencode formalizes this as `Permission.Ruleset` (`{permission, pattern, action}[]`); claude-code similarly composes rules from policy/user/project/local/session sources.

This is one of three stances the field takes — the other two are *no core UI, build your own* (pi-mono) and *sandbox-first* (openclaw, where the agent runs *inside* a Docker container so permissions are about which tools that sandboxed agent has).

### Prefix-cache discipline as architecture

The Anthropic prompt cache (5-min TTL, May 2025 added 1-hour TTL, 90% discount on cache reads) creates strong economic pressure to keep the system-prompt prefix stable across turns. This shows up as:

- **claude-code's `backfillObservableInput`** mutates a *clone* of tool_use blocks so the API-bound input never changes mid-stream; subagent contexts clone `contentReplacementState` so forks make identical cache decisions.
- **claude-code's `stripSignatureBlocks`** on model fallback (signatures are model-bound, can't replay across families).
- **opencode's two-part system prompt re-flattening** after plugin transforms, preserving caching breakpoints.
- **opencode's deterministic prefix** when MCP tools are added (built-ins as a sorted contiguous prefix so the server's global cache breakpoint sits after the built-in suffix).
- **hermes-agent's prefix-cache discipline as a hard rule** — memory snapshot is *frozen* at session start; mid-session writes go to disk but never to the system prompt until next session.

Prefix-cache-stable design is now load-bearing for cost control. Designs that recompute the system prompt every turn are obsolete.

### Subagent = same loop with different policy

Three distinct patterns:
- **First-class tool, library of types** — claude-code's `AgentTool` with `subagent_type` (general-purpose / Explore / Plan / verification / claude-code-guide / statuslineSetup + plugin types) and full isolation primitives (worktree, remote CCR session).
- **First-class tool, agents in config** — opencode's `task` tool with `subagent_type: <name>` resolves agents from `agent/agent.ts` + `opencode.json` user definitions.
- **First-class tool, role-bounded** — hermes-agent's `delegate_task` with `role: leaf | orchestrator` and `max_spawn_depth`. Leaf cannot recurse; orchestrator can but is bounded.
- **Explicitly refused** — pi-mono.
- **Available but discouraged** — openclaw has `sessions_spawn` but VISION.md says "agent-hierarchy frameworks" are not first-class.

claude-code's verification subagent is the most explicit gather→act→verify enforcement: structurally read-only (5-tool denylist), with an adversarial prompt that must end with `VERDICT: PASS | FAIL | PARTIAL`. The caller is required to spot-check 2-3 of its commands.

## Editorial rifts — where the five disagree

### Server-first vs binary-first

| Stance | Agents | Trade-off |
|---|---|---|
| Server-first | opencode, hermes-agent, openclaw | Mobile + IDE + web + chat clients nearly free. Single source of truth. Authentication is now a problem to solve. |
| Binary-first | claude-code, pi-mono | Simple, fast, no daemon to monitor. Multi-surface requires either re-implementing the binary (bad) or bridging through a remote service (claude-code's CCR sessions). |

The split predicts everything downstream — multi-channel messaging, hosting story, the existence of a "Control UI," whether subagents can outlive the foreground process.

### MCP: load-bearing vs deliberately refused

**Three agents put MCP in core:**
- claude-code (`src/services/mcp/client.ts` is ~3,348 lines, comparable to its model API client).
- opencode (`packages/opencode/src/mcp/index.ts` with stdio + HTTP + SSE + OAuth).
- hermes-agent (MCP servers configured per session).

**Two agents refuse MCP in core:**
- pi-mono: "No MCP. Build CLI tools with READMEs (see Skills), or build an extension that adds MCP support."
- openclaw: "We prefer this bridge model over building first-class MCP runtime into core" — recommends `mcporter` as the integration, *shipped as a skill, not an extension*.

The refusers' shared logic: MCP servers can be added/changed without restarting; core stays lean; MCP churn doesn't break core. The accepters' logic: MCP is the de-facto extension format; building it in lets you do classifier-driven access control and deferred-loading.

### Sandbox spectrum

```
none in core               OS rules         pluggable transport      tiered Docker      multi-backend
   pi (core)            claude-code         pi (extensions)             openclaw           hermes-agent
                                                                                          (local/Docker/
                                                                                           SSH/Modal/
                                                                                           Daytona/...)
```

opencode currently has no first-class sandbox (the experimental "workspace adapter" can target remote sandboxes via the `containers` package). claude-code applies `@anthropic-ai/sandbox-runtime` rules at the bash-call layer when enabled. **openclaw is the most committed**: three Dockerfiles (minimal Debian / Node+Go+Rust+Brew / Chromium+Xvfb+noVNC), per-session containers, config-hashed for drift detection, podman + Quadlet for rootless production. **hermes-agent abstracts the *terminal* itself**: same agent code, different physical place where the bash runs.

### Memory model

| Stance | Agents | What persists |
|---|---|---|
| No learned memory in core | pi-mono, openclaw | AGENTS.md (read-only), JSONL session tree. Memory is a slot plugin. |
| File-based + consolidator | claude-code | MEMORY.md (200 lines cap), daily logs at `~/.../logs/YYYY/MM/`, nightly `/dream` skill that consolidates logs into topic files. Consolidation is itself a forked subagent under the same loop. |
| Four-layer + curator | hermes-agent | MEMORY.md/USER.md (2200/1375 char cap, frozen snapshot) + provider plugin (Honcho/Mem0/…) + FTS5 session search + auto-archive curator using an auxiliary forked agent. |
| Durable sessions, no learned memory | opencode | Sessions are event-sourced and snapshot-versioned. Revert, fork, share by replay. But no MEMORY.md. |

**hermes-agent is alone among the five in letting the agent edit its own substrate.** The curator can `pin` / `archive` / `consolidate` / `patch` agent-created skills (only agent-created — bundled and hub skills are off-limits, archives are reversible). claude-code edits memory but not skills. Everyone else edits neither.

### Provider strategy

- **Live remote catalog** — opencode ingests the model catalog *live from `models.dev`* with a 5-min disk-mtime check and a 60-min background refresh fiber. New models appear without code changes. Unique among the five.
- **Hand-curated registry** — pi-ai (~25 providers across 9 wire APIs), claude-code (Anthropic-native).
- **Per-provider plugins** — hermes-agent (every inference backend is a plugin under `plugins/model-providers/`).

### Trust frame: one-operator vs multi-tenant

**openclaw is most explicit:** "OpenClaw does *not* model one gateway as a multi-tenant boundary. The recommended deployment is one user per host, one gateway per user, one or more agents per gateway." Session IDs are routing controls, not authorization boundaries. This collapses an entire class of "shared agent" complexity.

**hermes-agent** has a comparable stance — sessions are visible to the operator across surfaces. **opencode**'s basic-auth password is per-server, not per-user. **claude-code**'s auto-memory excludes project-settings from path overrides (so a hostile repo can't redirect memory) — but it does not pretend to be multi-tenant.

This is editorial. Agent platforms that try to be multi-tenant are taking on a real cost; the single-operator framing is recognized in the wild as the simpler default.

### Self-modification, agent-as-training-data

| Self-edits | What |
|---|---|
| Nothing | pi-mono, openclaw |
| Memory only | claude-code (`/dream` consolidator, `extractMemories` turn-end fork) |
| Memory + skills | hermes-agent (curator writes/archives/consolidates/patches agent-created skills) |

Only **hermes-agent** ships the agent's own runtime as a training environment. `batch_runner.py` produces normalized SFT trajectories; `environments/` wraps the same loop into Atropos RL `BaseEnv` subclasses with `ToolContext` letting reward functions execute in the model's own sandbox. **The runtime is its own training distribution.** This is a structural commitment to using the agent's own output to improve the next model.

### Editorial stance

The five projects sit on a spectrum from explicit minimalism to explicit maximalism:

- **pi-mono — minimalism.** "No MCP. No sub-agents. No permission popups. No plan mode. No to-dos. No background bash." Contribution gate auto-closes new contributors' PRs.
- **openclaw — lean core.** VISION.md "What We Will Not Merge (For Now)" enumerates seven categories of refusal including agent-hierarchy frameworks and first-class MCP runtime. ClawHub is the sanctioned offload.
- **claude-code — layered platform.** No ideological refusals. ~5,000-line REPL, ~1,700-line turn state machine, ~40 tools, plugins/skills/output-styles/agents/MCP all loadable from markdown. The work is in keeping the layers separable.
- **hermes-agent — policy regime.** The Teknium-signed-and-dated rule in AGENTS.md forbids plugins from modifying core files. Three separate plugin discovery systems (general, memory, model-provider).
- **opencode — protocol discipline.** No manifesto but a strong commitment to typed HTTP API, generated SDK, OpenAPI doc, Effect Service/Layer conventions documented in AGENTS.md. **Discipline is structural rather than editorial.**

These stances are not interchangeable. Pi could not become claude-code without ceasing to be pi.

## Surprising cross-references

- **openclaw embeds pi-mono as its agent runtime.** `src/agents/pi-embedded-runner.ts` is the seam; openclaw imports `@mariozechner/pi-agent-core` + `@mariozechner/pi-coding-agent` + `@mariozechner/pi-ai` and adds session lanes, tool wiring, sandbox, gateway protocol on top. *The most direct dependency between any two of the five.*

- **hermes evolved from openclaw.** `hermes claw migrate` imports `~/.openclaw` (SOUL.md, MEMORY.md/USER.md, skills, command allowlist, channel settings). The README treats OpenClaw as the precursor. This is a *fork in editorial direction* — openclaw stayed lean; hermes layered on self-improvement, RL data generation, and an extensive plugin policy regime.

- **opencode reads `.claude/skills/` directly.** Skill discovery walks `~/.claude/skills/` and project `.claude/skills/` so Claude-Code users' existing skills work unchanged. **Provider-agnosticism extended to artifacts, not just models.**

- **pi-skills targets five agents.** badlogic's repo ships identical content with install instructions for `~/.pi/agent/skills/pi-skills`, `~/.codex/skills/pi-skills`, `~/.config/amp/tools/pi-skills`, `~/.factory/skills/pi-skills`, and (with symlinks) `~/.claude/skills/<skill>`. The `SKILL.md` is the unifying artifact.

- **openclaw uses ACP twice.** `openclaw acp` is a stdio-NDJSON ACP server for IDEs. `extensions/acpx` is an ACP *client* registry that lets openclaw embed Codex / Claude Code / Gemini CLI / OpenCode / Pi as nested ACP children. So openclaw can be driven by Zed, *and* openclaw can drive other coding agents.

- **`mcporter` is a skill, not an extension.** This is small but illustrative: openclaw's "no MCP in core" stance works because the skill abstraction is rich enough to host a whole MCP bridge. The trust boundary stays where openclaw wants it (skills are untrusted instructions the agent reads; extensions are trusted in-process code).

- **claude-code's compaction modules are feature-gated dynamic requires.** The five-stage pipeline is documented in `query.ts` but `snipCompact` / `contextCollapse` / `reactiveCompact` are dynamic requires; the *files* aren't shipped in this external snapshot, only the call sites. The mature implementation is visible in the wiring; the modules sit behind flags.

- **`acp_registry/` exists in the hermes tree.** Contains `agent.json` + `icon.svg`. ACP has metadata conventions on top of the protocol wire — the spec is bigger than the JSON-RPC schema suggests.

## Families that emerge

The five agents do not occupy a continuum; they cluster:

- **Family A — coding agents** (claude-code, opencode, pi-mono). Single-purpose: drive a developer's terminal. Tight feedback loops; sessions ephemeral by default. Multi-agent collaboration is *internal* (subagents for explore/plan/verify), not human-to-human.
- **Family B — personal-assistant platforms** (hermes-agent, openclaw). Multi-surface. Same agent core runs as a daemon reachable from Telegram, Discord, Slack, WhatsApp, iMessage, Signal, Matrix, email, web, mobile, terminal. Sessions durable. **These two share an unusual amount of DNA.**
- **Family C — reusable substrate** (pi-mono). Sits in both families. Itself a coding agent (Family A), *also* the agent runtime openclaw embeds (Family B). The only one of the five that explicitly ships its agent loop as a library someone else's product can consume.

The Family A / B split predicts most of the other rifts: server-first vs binary-first; whether sessions persist across channels; whether memory has user-modeling depth; whether MCP is core or bridged.

Tier 10 closes with the synthesis these patterns and rifts imply.
