# Slide outline — Modern AI Agents

> **Audience:** minimal AI background. Knows ChatGPT; does not know CoT, ReAct, MCP, ACP, RAG.
> **Format:** Marp deck, 23 slides, 30–40 min talk.
> **Slide-craft:** one big diagram per slide. Text = title + ≤ 1 caption + ≤ 3 short bullets. No code blocks.
> **Spine:** the *agent loop* (think → act → observe) recurs from slide 8 onward; consistent color/shape across every slide that shows it.

Writing style: `STYLE.md`.

---

## §1 — Opening (3)

### Slide 1 · Title
- Layout: centered title + subtitle.
- Text: *Modern AI Agents* / *How we got here, what they are, what they disagree about.*
- Speaker promise (1 line): by the end, you understand what makes today's agents distinct and how to choose between them.

### Slide 2 · The 30-second story
- Visual: divergence-then-convergence diamond.
  - Trunk: `Transformer (2017)`.
  - Three branches from trunk:
    - **Learned to think** — `CoT 2022 → ReAct 2022 → o1 Sep 2024 → R1 Jan 2025`.
    - **Learned to act** — `WebGPT 2021 → Toolformer Feb 2023 → function calling Jun 2023`.
    - **Learned to coordinate** — `LangChain Oct 2022 → AutoGPT Mar 2023 → MCP Nov 2024 → ACP/SKILL.md/AGENTS.md 2025`.
  - Branches converge into `Today's agents (2026)`.
- Title: *Three threads, one convergence.*
- Note: not a linear timeline — CoT (Jan 2022) preceded ChatGPT (Nov 2022). The diamond shape is honest where a chain isn't.

### Slide 3 · Thesis preview
- Visual: one sentence, big type, centered.
- Text: *Agents agree more than they disagree. What remains is editorial.*
- "Editorial" = what to refuse, what to formalize, how to draw trust boundaries, whether the agent edits itself.

---

## §2 — How we got the model (2)

### Slide 4 · Completion → Instruction
- Visual: before/after.
  - Left: *predict next word* + sample completion.
  - Right: *follow instructions* + sample chat exchange.
  - Arrow between: *+ scale, instruction tuning, RLHF*.
- Title: *The model learned to follow instructions.*
- Pivot: **GPT-3 (2020) → ChatGPT (Nov 30, 2022).** Breakthrough is *interface*, not architecture.

### Slide 5 · Three roles, one universal API
- Visual: stacked message frame — `system / user / assistant`.
- Title: *Three roles, every chat model.*
- Origin: OpenAI ChatGPT API, Mar 2023. Adopted by Anthropic, Google, Meta, Mistral, every open-weight chat template.
- Vocabulary checkpoint: after this slide, the audience knows "system prompt" and "tool message" without further explanation.

---

## §3 — Adding thought and action (3)

### Slide 6 · The model learned to "think"
- Visual: `graph LR` showing prompt-trick → trained-capability.
  - `CoT — Wei, Jan 2022` → `Zero-shot CoT — Kojima, May 2022` → `Trained reasoners: o1 Sep 2024, R1 Jan 2025, Claude extended thinking Feb 24, 2025`.
- Title: *Reasoning became a separate output channel.*
- Mechanism: more tokens = more compute per problem. Reasoning trace + final answer = two outputs, two costs.

### Slide 7 · Tool use as a protocol
- Visual: sequence diagram. Actors: `User`, `Model`, `Tool`.
  - `User → Model` (query) → `Model → Tool` (structured call) → `Tool → Model` (result) → `Model → User` (answer).
- Title: *Tool use as a protocol.*
- Pivot: **OpenAI function calling, Jun 13, 2023.** Before: prompt + pray. After: model trained to emit calls as a typed API field.
- Follow-on: Anthropic (Nov 2023 beta → May 2024 GA), Google (2024). Table stakes by late 2024.

### Slide 8 · The agent loop
- Visual: circular diagram `Think → Act → Observe → Think`. Annotated *one trip = one model call*.
- Title: *The agent loop.*
- Name: **ReAct** (Reasoning + Acting). Yao et al., Princeton/Google, Oct 2022.
- Take a screenshot: this shape appears on every slide from here.

---

## §4 — Agents become a category (2)

### Slide 9 · 2023 — agents went viral
- Visual: timeline strip.
  - `LangChain Oct 2022 · ChatGPT Nov 2022 · AutoGPT Mar 30 2023 · BabyAGI Apr 3 2023 · AutoGen Aug 2023 · CrewAI Jan 2024 · MCP Nov 25 2024`.
- Title: *The orchestration framework wave.*
- Anchor: **AutoGPT.** 30K GitHub stars in 13 days (by Apr 12, 2023). 100K weeks later. Fastest-growing OSS project on GitHub at the time.
- Reality check: most demos were cherry-picked. By autumn 2023 the discourse flipped to "trough of disillusionment."

### Slide 10 · What the wave taught us
- Visual: two columns.
  - Left: **12-Factor Agents** — *Own your prompts · Own your context · Own your control flow*.
  - Right: **Framework wars resolved** — orchestration layer small; integration layer standardized via MCP (Nov 2024).
- Title: *Less framework, more discipline.*
- Carryover: the *mental model* (agent = loop + tools + memory + objective). Frameworks themselves receded.

---

## §5 — Shaping behavior (1)

### Slide 11 · Two axes for steering models
- Visual: two-column.
  - Left **Constrain**: refusal training · output filters · sandbox · permission prompts.
  - Right **Steer**: system prompt · structured output · tool registry trimming · verdict contracts.
- Title: *Constrain & Steer.*
- Caption: *Don't ask the model nicely — remove its ability to violate the rule.*
- Editorial idea (most important in deck): purpose is enforced by tools the model has, not by prompt rules. claude-code's read-only reviewer subagent has no `Edit` tool — the rule is an *absent capability*.

---

## §6 — Modern toolkit (3)

### Slide 12 · 2024–2025 standards
- Visual: 4 horizontal cards.
  - `MCP` *tool bridge* — Anthropic · Nov 25, 2024. Adopted by OpenAI Apr 2025. Donated to AAIF Dec 9, 2025.
  - `AGENTS.md` *project context* — OpenAI Codex CLI · Aug 2025. ~60K+ projects by Dec 2025. Donated to AAIF Dec 9, 2025.
  - `ACP` *editor bridge* — Zed · Aug 27, 2025.
  - `SKILL.md` *capability artifact* — Anthropic · Oct 16, 2025. `agentskills.io` standard Dec 2025.
- Title: *Four cross-vendor standards.*
- Context: AAIF = Agentic AI Foundation, directed fund under Linux Foundation. Co-founded by Anthropic, OpenAI, Block; supported by Google, Microsoft, AWS, Cloudflare, Bloomberg.
- Caption: each minimal — text-shaped or JSON-RPC-shaped. That's what made adoption frictionless.

### Slide 13 · How they fit
- Visual: vertical stack.
  ```
  Editor (Zed, VS Code)
     ↕ ACP
  Agent (claude-code, opencode)
     ↕ MCP
  Tools/Resources (GitHub, Postgres, Slack)
  ```
- Title: *Three layers, three protocols.*
- Caption: same shape as LSP for language servers — composable plumbing. Swap any one layer, others don't notice.

### Slide 14 · SKILL.md — load on demand
- Visual: 3-stage flow + token-cost callout.
  - **Discovery** — name + description only · ~100 tokens / skill.
  - **Activation** — full SKILL.md body · when needed.
  - **Execution** — open scripts · only when referenced.
  - Math: `30 × 100 ≈ 3K tokens (startup)` vs `30 × 2K ≈ 60K tokens (eager)`.
- Title: *Skills load on demand.*
- Caption: same SKILL.md works in claude-code, Codex, Cursor, OpenCode, Pi, Goose, ~25 other tools.

---

## §7 — Today's agents (2)

### Slide 15 · Five surfaces, one shape
- Visual: 5-column grid.

  | Agent | Maker | Editorial stance |
  | --- | --- | --- |
  | `claude-code` | Anthropic | *Layered platform.* |
  | `opencode` | SST | *Typed protocol surface.* |
  | `openclaw` | Community | *Single-operator gateway.* |
  | `hermes-agent` | Nous Research | *Self-improving environment.* |
  | `pi-mono` | M. Zechner | *Core + extensions.* |

- Title: *Five surfaces, one shape.*
- Each makes a different *editorial* choice. Memorize none; remember the choices.

### Slide 16 · Family tree
- Visual: graph with 5 agent nodes + cross-references.
  - `pi-mono` →embedded by→ `openclaw`.
  - `openclaw` →evolved into→ `hermes-agent` (`hermes claw migrate` ships).
  - `claude-code` SKILL.md →adopted by→ `opencode` (reads `~/.claude/skills/`).
  - `openclaw` →drives via ACP→ `Codex / Claude Code / Gemini CLI / OpenCode / Pi`.
- Title: *Family tree.*
- Caption: standardization, followed by evolution. Not a competition table.

---

## §8 — Patterns & rifts (3) — THE CORE

### Slide 17 · One loop, many policies
- Visual: agent loop in center; 4 spokes outward showing reconfigurations.
  - prompt A + all tools → *Interactive coding*.
  - prompt B + read-only tools → *Subagent: explore*.
  - prompt C + denylist mutators → *Subagent: verify*.
  - prompt D + no user → *Memory consolidation*.
- Title: *One loop. Many policies.*
- Caption: multi-agent isn't a separate platform — it's the same loop reconfigured.

### Slide 18 · Universals
- Visual: 2-column checklist (6 items).
  - ✓ One loop, many policies.
  - ✓ Methodology in prompts, not state.
  - ✓ Compaction as control flow.
  - ✓ Streaming + parallel tool execution.
  - ✓ `SKILL.md` + `AGENTS.md` as cross-vendor artifacts.
  - ✓ `ACP` for editors, `MCP` for tools.
- Title: *Six shared building blocks.*
- Caption: where designers no longer differ.

### Slide 19 · Rifts (configurable axes)
- Visual: 2-column comparison (6 axes).

  | left | vs | right |
  | --- | --- | --- |
  | Server-first | vs | Binary-first |
  | `MCP` built-in | vs | `MCP` via bridge |
  | Sandbox in core | vs | Sandbox in deployment |
  | Curated memory | vs | Stateless session |
  | Subagents first-class | vs | Single agent |
  | Multi-tenant | vs | Single-operator |

- Title: *Six knobs on the shared base.*
- Caption: not right-or-wrong. Each agent picks a side; the choice predicts most of its other decisions.

---

## §9 — Synthesis (4)

### Slide 20 · The canonical shape
- Visual: 5-layer block.
  - `Surface → Session → Loop → Provider · Tools · Permissions → Extensions`.
- Title: *The canonical shape — 2026.*
- One-line definition: streaming chat loop over a provider abstraction, with tools, permissions, and extensions — configurable into many runtimes by changing prompt + tool filter + permission policy.

### Slide 21 · Pick a pattern
- Visual: 5-branch decision list.

  | Problem class | → | Pattern |
  | --- | --- | --- |
  | Solo, hand-buildable | → | `pi-mono` |
  | Coding agent as platform | → | `claude-code` |
  | Everywhere — terminal · web · IDE · mobile | → | `opencode` |
  | Chat-platform assistant, single-operator | → | `openclaw` |
  | Self-improving + training environment | → | `hermes-agent` |

- Title: *Same shape, different setup.*
- Caption: the right question isn't "which agent is best" — it's "which problem class am I in".

### Slide 22 · Ten table stakes
- Visual: 10-item numbered grid.
  - 01 Streaming model + tool loop · 02 Schema-validated tool registry · 03 `SKILL.md` loader · 04 `AGENTS.md` walk · 05 Compaction stage · 06 Permissions / sandbox · 07 `MCP` / explicit refusal · 08 `ACP` server · 09 Durable session store · 10 Subagent affordance.
- Title: *Ten table stakes.*
- Caption: the floor — not the ceiling. Each item exists in at least one of the five agents; most exist in all.

### Slide 23 · Closing
- Visual: single word, big type, centered.
- Text: *Build.*

---

## Recurring spine

The agent-loop diagram (slide 8) appears as an inset on slides 17, 20, 21. Same shape, same colors.

## Color convention

`accent-1` (terracotta) = model · `accent-3` (forest) = tools · `paper` = surfaces · neutral = harness.

## Out of scope

Transformer internals · scaling laws (Kaplan, Chinchilla) · RLHF/DPO mechanics · per-paper authors · per-agent code paths (lives in `docs/agents/`) · bibliography (pointer at end).
