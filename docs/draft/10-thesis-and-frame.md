# Tier 10 — Thesis, frame, takeaways

> The closing zoom-out. By 2026 the foundational primitives are stable; the disagreements that remain are *editorial*. This tier states the thesis, gives the canonical shape, defines what an AI agent in 2026 actually *is*, offers a lens for choosing a pattern, and lists what's now table stakes for builders.

## Thesis

**The field's foundational primitives are now stable.**

Tiers 1-7 record the work that got us here:
- **Tier 1** stabilized the substrate — tokens, embeddings, attention, autoregressive decoding, the pre-train/adapt split.
- **Tier 2** gave us the instruction-following partner with a refusal baseline behind a chat-API.
- **Tier 3** added reasoning as a first-class separable output channel and ReAct as the agent-loop spine.
- **Tier 4** standardized structured tool-call protocols across vendors and dialects.
- **Tier 5** crystallized the agent loop as a first-class construct and burned through the orchestration-framework hype cycle.
- **Tier 6** taught the field that purpose can be enforced *structurally* — denylists in registries, verdict contracts, per-iteration reminders — not just by asking the model nicely.
- **Tier 7** delivered MCP, ACP, `SKILL.md`, `AGENTS.md`, prefix-cache discipline, and progressive disclosure as the present-day toolkit.

By the time Tier 8 lands, every piece of the modern stack has been introduced. **The five agents documented agree on much more than they disagree about** — every one runs a streaming chat loop over a provider abstraction, with a tool registry, a permission or sandbox layer, an extension surface honoring `SKILL.md` and `AGENTS.md`, and a durable session that survives turns.

The disagreements that remain in 2026 are *editorial*, not architectural:
- **What to refuse** (pi-mono refuses MCP, sub-agents, permission popups; openclaw refuses agent-hierarchy frameworks; claude-code refuses nothing).
- **What to formalize** (opencode formalizes the integration via a typed HTTP API + generated SDK; hermes formalizes the plugin discipline via signed-and-dated rules).
- **How to draw trust boundaries** (openclaw is one-operator; hermes is multi-surface single-operator; claude-code has layered policy/user/project/session permissions).
- **Whether the agent is allowed to modify itself** (hermes alone permits self-skill-creation via the curator; claude-code edits memory but not skills; the others edit neither).

The framework wars resolved by everyone admitting the orchestration layer is small and the integration layer is huge.

## The canonical shape of a modern agent

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

The pieces are remarkably consistent. Streaming flows bidirectionally; recovery is control flow; compaction lives inside the loop; prefix caching is load-bearing for cost; methodology lives in policy, not state.

## "AI agent in 2026" — one-line stipulative definition

> An AI agent is **a streaming chat loop over a provider abstraction**, with **a tool registry**, **a permission/sandbox layer**, **an extension surface** honoring SKILL.md and AGENTS.md, and **a durable session** — *configurable into many runtimes by changing prompt + tool filter + permission policy*.

That last clause — configurable into many runtimes — is what the universal pattern *one loop, many policies* unlocks. The same engine that powers interactive coding, headless SDK calls, background memory consolidation, IDE integration via ACP, and RL training rollouts is configurable across all of them by changing the three policy levers.

## "Which problem class are you in?" — the lens

If the design goal is:

- **A coding agent for one engineer, hand-buildable, no MCP** → **pi-mono's pattern**. Seven tools, JSONL-tree sessions, AGENTS.md walk, TypeBox schemas, extensions for everything else. Refuse-and-eject is the editorial stance.

- **A coding agent that's a platform** → **claude-code's pattern**. Markdown + frontmatter for everything, MCP-first, defer-tools for scale, layered permission/sandbox/hooks stack. The CLI is a local agent OS.

- **A coding agent that runs everywhere** → **opencode's pattern**. Server-first, typed HTTP API, generated SDK, ACP for IDEs, AI SDK + models.dev for provider matrix, event-sourced sessions for shareability. The server is the product; the clients are interchangeable.

- **A personal assistant on chat platforms** → **openclaw's pattern**. Single-operator daemon, multi-channel, tiered Docker sandbox, ClawHub for skills, mcporter for MCP-as-skill, embed pi-mono for the agent core. Trust frame is one-user-one-host.

- **A self-improving agent that's also a training environment** → **hermes-agent's pattern**. Python, gateway + cron + ACP + dashboard sharing one SQLite, four-layer memory with curator, batch-runner + Atropos for trajectory generation, plugin policy regime that forbids core modification.

The choice between these is not "which is best." It is **what problem class are you in**. The five agents agree on much more than they disagree about; the editorial choices are what suit a given problem class.

## Builder table-stakes — what you need in 2026

If you're starting from scratch, the floor is roughly:

1. **A streaming chat loop over a provider abstraction.** The Vercel AI SDK (`@ai-sdk/*`) is the path of least resistance; alternatively a hand-rolled wire-API layer like pi-ai for ~25 providers across 9 APIs.

2. **A tool registry with TypeBox/Zod-validated arguments and a streaming executor** for concurrency-safe parallel tool calls. Tools are a design surface; treat their schemas as carefully as the system prompt.

3. **Markdown skill loader** that honors `SKILL.md` + frontmatter and walks at least `~/.claude/skills/` and `.agents/skills/` for community-skill compatibility.

4. **AGENTS.md walk from cwd to root**, injecting each ancestor file under a `# Project Context` heading.

5. **A compaction stage that runs before every model call**, with at least: tool-result budgeting + summary-on-overflow + a way for the model to recover from a real 413.

6. **A permission system that's pattern-rule-based** (claude-code, opencode) *or* a sandbox/container story (openclaw, hermes-agent). Pick one explicitly; not picking is also a choice, and a worse one.

7. **MCP support** unless you're explicitly refusing it (pi, openclaw-core). Refusal is legitimate; ignorance is not.

8. **An ACP server** for IDE integration — table stake for editor users. The strong form is what hermes-agent and openclaw do: persist ACP sessions to the *same* store as native sessions, so the editor sees the same conversation the CLI does.

9. **A durable session store** that lets users fork, rewind, replay, share. Event-sourced is a plus; JSONL trees are fine.

10. **Subagent capability via a `task` tool** — even if you only ship one type (`general`), the affordance matters. Methodology in prompts + tool denylists structurally enforced is the canonical pattern.

If you're building a chat-platform assistant rather than a coding agent, add:
- A daemon process that owns provider connections.
- A typed protocol (TypeBox or Effect Schema), codegen'd to client SDKs.
- A tiered sandbox or multi-backend terminal abstraction.
- A persistence-survives-restart session store.
- Multi-channel routing.
- A skills registry beyond your own repo.

You do not need to invent any of this. All of it is in one or more of the five projects above. **The interesting work in 2026 is figuring out which of these patterns matter for your problem class, and refusing the rest.**

## The closing observation

The agents agree more than they disagree. The architectural primitives are stable. The disagreements that remain — what to refuse, what to formalize, how to draw trust boundaries, whether the agent is allowed to modify itself — are *editorial*, in the literal sense: they are choices about voice, posture, and which audience to address.

That is what the bottom-up arc through these ten tiers shows: a field that has stopped arguing about its substrate and started arguing about its style. The next decade's questions are no longer "can we build agents?" — they are "what kind of agent should this be?" The answer for any given project depends on **which problem class you are in**, and the cost of getting that answer wrong is much smaller in 2026 than it would have been in 2022, because the substrate underneath is far more stable.

The next phase — the Marp deck — converts this story into slide-shaped form. The skeleton is solid; the substance is concrete; what remains is presentation.
