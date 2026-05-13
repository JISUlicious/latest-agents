# Slide outline — Modern AI Agents

> **Audience:** minimal AI background. They've heard of ChatGPT; they have not heard of CoT, ReAct, MCP, ACP, or RAG.
> **Format:** Marp deck, 23 slides for a 30-40 minute talk.
> **Slide-craft rule:** one big diagram per slide; text is title + tagline + ≤ 3 short bullets. Mermaid for sequence/flow/timeline; HTML/CSS for grids and callouts. No code blocks.
> **Visual language:** the *agent loop* (model + tools + observation) is the recurring spine; use the same color/shape conventions across every slide that shows it.

---

## Section 1 — Opening (3 slides)

### Slide 1: Title

- **Layout:** centered title + subtitle.
- **Text:**
  - Title: *Modern AI Agents*
  - Subtitle: *How we got here, what they are, what they disagree about*
  - Speaker name + date.

### Slide 2: The 30-second story

- **Visual:** horizontal timeline as a single Mermaid `graph LR`.
  - Nodes: `Transformer (2017)` → `ChatGPT (2022)` → `Tools (2023)` → `Reasoning (2024)` → `Today's agents (2026)`.
  - One small icon per node.
- **Text:** title only — *"From a paper to a product category."*
- **Speaker notes:** the whole talk is unpacking this one line. 5 inflection points; ~9 years.

### Slide 3: Thesis preview

- **Visual:** a single sentence, big type, centered.
- **Text:** *"In 2026, AI agents agree more than they disagree. What remains is editorial."*
- **Speaker notes:** tell them the punchline upfront. The slides earn it.

---

## Section 2 — How we got the model (Tiers 1+2 collapsed — 2 slides)

### Slide 4: From predicting words to having a conversation

- **Visual:** before/after side-by-side.
  - Left: a box labelled *"predict the next word"* with a sample completion underneath.
  - Right: a box labelled *"follow instructions"* with a sample chat exchange (`user:` ... `assistant:`).
  - Arrow between them labelled *"+ scale, instruction tuning, RLHF"*.
- **Text:**
  - Title: *The model learned to follow instructions*
  - One callout: *2020–2022: GPT-3 → ChatGPT*
- **Source:** drafts 01, 02.
- **Speaker notes:** Don't dwell on the Transformer or scaling laws. The point is that the *interface* changed from completion to instruction.

### Slide 5: What is "a chat model"?

- **Visual:** stacked-message diagram showing the universal API shape:
  ```
  ┌─────────────────────────────┐
  │ system:  rules for the model │
  ├─────────────────────────────┤
  │ user:    what you ask        │
  ├─────────────────────────────┤
  │ assistant: what it answers   │
  └─────────────────────────────┘
  ```
- **Text:**
  - Title: *Three roles, every chat model*
  - Callout: *system / user / assistant — the universal API*
- **Source:** draft 02.
- **Speaker notes:** Every closed-API model, every open-weight model, every agent harness uses these three roles. This is the keyhole everything else passes through.

---

## Section 3 — Adding thought and action (Tiers 3+4 — 3 slides)

### Slide 6: The model learned to "think"

- **Visual:** Mermaid `graph LR` showing the prompt-trick → trained-capability progression.
  - Node A: *Worked-example reasoning prompts* (Wei, Jan 2022 — Chain-of-Thought)
  - Node B: *"Let's think step by step"* (Kojima, May 2022 — zero-shot CoT)
  - Node C: *Trained reasoning models* (o1 Sep 2024, R1 Jan 2025, Claude extended thinking Feb 2025)
- **Text:**
  - Title: *Reasoning became a separate output channel*
  - Callout: *Final answer + (optionally visible) thinking trace*
- **Source:** draft 03.
- **Speaker notes:** show that reasoning is *not* magic — it started as a prompt trick (Wei showed worked examples worked; Kojima showed even a zero-shot phrase worked), then got baked into the model via RL.

### Slide 7: The model learned to "act" — tools

- **Visual:** sequence diagram (Mermaid `sequenceDiagram`).
  - Actors: `User`, `Model`, `Tool`.
  - User → Model: *"What's the weather in SF?"*
  - Model → Harness: *call get_weather(city="SF")*
  - Harness → Tool: *execute*
  - Tool → Harness: *"62°F, foggy"*
  - Harness → Model: *tool result*
  - Model → User: *"It's 62°F and foggy in SF."*
- **Text:**
  - Title: *Tool use as a protocol*
  - Callout: *Function calling — June 2023*
- **Source:** draft 04.
- **Speaker notes:** the model emits a *structured* request; the harness runs it; the result comes back as another message. The whole modern agent stack is built on this one cycle.

### Slide 8: The agent loop — think + act + observe

- **Visual:** a circular Mermaid `graph TD` showing the ReAct cycle.
  - `Think` → `Act` → `Observe` → back to `Think`.
  - Annotated with "*one trip = one model call*".
- **Text:**
  - Title: *The agent loop*
  - Callout: *ReAct: reason interleaved with action (Yao 2022)*
- **Source:** drafts 03, 04, 05.
- **Speaker notes:** introduce this as **the spine** — it will recur on every later slide.

---

## Section 4 — Agents become a category (Tier 5 — 2 slides)

### Slide 9: 2023 — agents went viral

- **Visual:** a timeline strip (HTML/CSS or Mermaid).
  - Oct 2022: LangChain
  - Nov 2022: ChatGPT
  - Mar 30, 2023: AutoGPT (30K stars in 13 days; 100K by late April)
  - Apr 3, 2023: BabyAGI
  - Aug 2023: AutoGen, MetaGPT
  - Jan 2024: CrewAI
  - Nov 25, 2024: MCP
- **Text:**
  - Title: *The orchestration framework wave*
  - Callout: *Agents went from research diagram to product category in 6 months*
- **Source:** draft 05.
- **Speaker notes:** AutoGPT was the moment "AI agent" became a noun your CEO knows. The framework wave that followed taught the field a lot of lessons — most of them about over-abstraction.

### Slide 10: What the wave taught us

- **Visual:** two columns.
  - Left: *Lessons learned* — three bullets:
    - *Own your prompts*
    - *Own your context*
    - *Own your control flow*
  - Right: *MCP as punctuation* — small diagram showing "framework wars resolved by standardizing the integration layer, not the orchestration layer".
- **Text:**
  - Title: *Less framework, more discipline*
- **Source:** draft 05.
- **Speaker notes:** the orchestration framework as a category receded; the loop-shaped *mental model* it taught is what stuck.

---

## Section 5 — Shaping behavior (Tier 6 — 1 slide)

### Slide 11: Two axes for steering models

- **Visual:** big two-column diagram.
  - Left column header: **Constrain** (red/blocking icons)
    - refuse, content filters, sandbox, permission prompts
  - Right column header: **Steer** (blue/directing icons)
    - system prompt, structured output, tool-registry trimming, verdict contracts
  - Bottom callout: *"Don't ask the model nicely — remove its ability to violate the rule."*
- **Text:**
  - Title: *Steering and guardrailing*
- **Source:** draft 06.
- **Speaker notes:** introduce the most important *editorial* idea — that purpose is enforced structurally (the read-only subagent has no `Edit` tool, not just a prompt saying "don't edit").

---

## Section 6 — The modern toolkit (Tier 7 — 3 slides)

### Slide 12: The 2024–2025 standards

- **Visual:** layered stack (HTML/CSS columns), ordered chronologically left-to-right.
  - 4 boxes:
    - `MCP` *— tool bridge* (Anthropic, Nov 25, 2024)
    - `AGENTS.md` *— project context* (OpenAI Codex CLI, mid-2025)
    - `ACP` *— editor bridge* (Zed, Aug 27, 2025)
    - `SKILL.md` *— capability artifact* (Anthropic, Oct 16, 2025)
  - Each with a one-line tagline.
- **Text:**
  - Title: *Standards arrived — across vendors*
- **Source:** draft 07.
- **Speaker notes:** four cross-vendor standards in 12 months. Each minimal, composable. MCP and AGENTS.md were donated to the Linux Foundation's Agentic AI Foundation in late 2025; SKILL.md is stewarded by Anthropic via `agentskills.io`; ACP is stewarded by Zed.

### Slide 13: How they fit together

- **Visual:** stack diagram showing the three protocols in their layers.
  ```
  ┌───────────────────────────────┐
  │  Editor (Zed, VS Code, …)     │
  │            ↕ ACP              │
  │  Agent (Claude Code, opencode)│
  │            ↕ MCP              │
  │  Tools / Resources (servers)  │
  └───────────────────────────────┘
  ```
- **Text:**
  - Title: *Three protocols, three boundaries*
  - Callout: *LSP for languages, ACP for editor↔agent, MCP for agent↔tools*
- **Source:** draft 07.
- **Speaker notes:** if the audience knows LSP (the IDE↔language-server protocol that powers code intelligence in VS Code/Vim/etc.), use the analogy directly: "ACP is to agents what LSP is to language servers." If they don't, just describe both surfaces: "the editor speaks one protocol to the agent for the conversation; the agent speaks another protocol to its tools."

### Slide 14: Skills as a portable artifact

- **Visual:** Mermaid flowchart showing progressive disclosure.
  - Stage 1: *Discovery* — agent sees only `name + description`
  - Stage 2: *Activation* — agent reads `SKILL.md` body
  - Stage 3: *Execution* — body references scripts / templates
  - Annotate cost: *"30 skills × ~100 tokens ≈ 3K tokens at startup"* vs *"30 skills × ~2,000 tokens ≈ 60K tokens (eager load)"*.
- **Text:**
  - Title: *Skills load on demand*
  - Callout: *Same file works across Claude Code / Codex / Cursor / OpenCode / Pi / Goose*
- **Source:** draft 07.
- **Speaker notes:** the skill file is plain Markdown with a small YAML header — and that minimalism is what made it portable. The cost-of-eager-loading number is from Anthropic's published numbers, scaled.

---

## Section 7 — Today's agents (Tier 8 — 2 slides)

### Slide 15: Five agents at a glance

- **Visual:** 5-column grid (HTML/CSS), one card per agent.
  - Each card: name (big), maker, primary surface (icon: terminal / chat / IDE), editorial one-liner.
  - Examples:
    - **claude-code** | Anthropic | terminal | *the layered platform*
    - **opencode** | SST | terminal + web + IDE | *the typed protocol surface*
    - **pi-mono** | badlogic | terminal | *refuse-and-eject minimalism*
    - **hermes-agent** | Nous Research | multi-channel | *self-improving training environment*
    - **openclaw** | community | multi-channel | *single-operator gateway*
- **Text:**
  - Title: *Five projects, five editorial choices*
- **Source:** draft 08.

### Slide 16: How they relate

- **Visual:** Mermaid graph showing surprising cross-references (use directional arrows so temporal/dependency flow is unambiguous).
  - `pi-mono` —embedded by→ `openclaw` (openclaw imports `@mariozechner/pi-agent-core` + `@mariozechner/pi-coding-agent` + `@mariozechner/pi-ai`)
  - `openclaw` —evolved into→ `hermes-agent` (hermes ships `hermes claw migrate` to import `~/.openclaw`)
  - `claude-code` SKILL.md format —adopted by→ `opencode` (walks `~/.claude/skills/` directly)
  - `pi-skills` —ships identical files for→ 5 agents (Pi / Codex / Amp / Droid / Claude Code)
  - `openclaw` —drives via ACP→ `Codex / Claude Code / Gemini CLI / OpenCode / Pi` (bidirectional: openclaw is also an ACP *server* for IDEs)
- **Text:**
  - Title: *The family tree*
  - Callout: *Standards are real. The ecosystem composes.*
- **Source:** draft 08, draft 09 cross-references. pi-skills count is 5 per `pi-skills/README.md`.

---

## Section 8 — Patterns and rifts (Tier 9 — 3 slides; THE CORE)

### Slide 17: One loop, many policies

- **Visual:** central diagram with the agent loop in the middle, and *four arrows out* labeled with different *configurations*:
  - prompt + tool filter A → "interactive coding"
  - prompt + tool filter B → "subagent: explore"
  - prompt + tool filter C → "subagent: verify"
  - prompt + tool filter D → "background memory consolidation"
- **Text:**
  - Title: *The same loop, reconfigured*
  - Callout: *Multi-agent is not a separate platform — it's the same loop with different policy*
- **Source:** draft 09.
- **Speaker notes:** this is the single most universal pattern in the field. State it loud.

### Slide 18: What all five agree on

- **Visual:** two-column checklist (HTML/CSS).
  - Header: *Universals*
  - 6 short rows, each with a check ✓ and a label:
    - *One loop, many policies*
    - *Methodology in prompts, not state*
    - *Compaction as control flow*
    - *Streaming + parallel tool execution*
    - *SKILL.md + AGENTS.md as cross-vendor artifacts*
    - *ACP for editors, MCP for tools*
- **Text:**
  - Title: *Universals (what's no longer interesting)*
- **Source:** draft 09.
- **Speaker notes:** the *uninteresting* part of the field is now stable.

### Slide 19: Where they still disagree (the editorial rifts)

- **Visual:** 2-column comparison, each row is a rift with the two extremes.
  - Server-first vs binary-first
  - MCP load-bearing vs deliberately refused
  - Sandbox in core vs sandbox is your problem
  - Memory layered + curator vs no learned memory
  - Subagents first-class vs refused
  - Multi-tenant vs one-operator
- **Text:**
  - Title: *Rifts (where the editorial choices are)*
- **Source:** draft 09.
- **Speaker notes:** these are *editorial*, not architectural. Each agent picks a side, and the choice predicts most of the rest.

---

## Section 9 — Synthesis (Tier 10 — 3 slides)

### Slide 20: The canonical shape

- **Visual:** the big block diagram (already in `docs/README.md`):
  ```
  Surface → Session → Loop → Provider / Tools / Permissions → Extensions
  ```
  - With small icons under each layer for examples.
- **Text:**
  - Title: *What an AI agent is, in 2026*
  - Callout: *A streaming chat loop over a provider abstraction, with tools, permissions, and extensions — configurable into many runtimes.*
- **Source:** draft 10.

### Slide 21: Which problem class are you in?

- **Visual:** decision-tree flowchart (Mermaid).
  - Start: *Building an agent?*
  - "Coding agent for one engineer" → pi-mono pattern
  - "Coding agent as a platform" → claude-code pattern
  - "Coding agent that runs everywhere" → opencode pattern
  - "Personal assistant on chat platforms" → openclaw pattern
  - "Self-improving + training environment" → hermes-agent pattern
- **Text:**
  - Title: *Pick a pattern that fits your problem*
- **Source:** draft 10.
- **Speaker notes:** there is no "best" agent; there are five patterns for five problem classes.

### Slide 22: The 10-item table-stakes

- **Visual:** 10-item checklist, compact grid.
  - 1 streaming loop · 2 tool registry · 3 SKILL.md loader · 4 AGENTS.md walk · 5 compaction · 6 permissions OR sandbox · 7 MCP (or explicit refusal) · 8 ACP server · 9 durable session · 10 subagent affordance.
- **Text:**
  - Title: *What you need to build one in 2026*
- **Source:** draft 10.

### Slide 23: Closing

- **Visual:** single sentence, big type, centered.
- **Text:**
  - *Agents agree more than they disagree.*
  - *The rifts that remain are editorial — what to refuse, what to formalize, how to draw trust boundaries.*
  - *Pick yours.*
- **Speaker notes:** thank the audience; point at the docs corpus URL.

---

## Diagram inventory (Marp/Mermaid checklist)

For implementation later, the diagrams to author:

1. **Timeline strip** (slides 2, 9) — Mermaid `graph LR` or pure HTML horizontal flex.
2. **Before/after side-by-side** (slide 4) — HTML two-column.
3. **Stacked message frame** (slide 5) — ASCII art or HTML.
4. **Reasoning lineage** (slide 6) — Mermaid `graph LR`.
5. **Tool-call sequence** (slide 7) — Mermaid `sequenceDiagram`.
6. **Circular ReAct loop** (slide 8) — Mermaid `graph TD` with feedback edge.
7. **Two-column lessons** (slide 10) — HTML.
8. **Two-axis steering** (slide 11) — HTML two-column with iconography.
9. **Four-standard stack** (slide 12) — HTML horizontal cards.
10. **LSP/ACP/MCP layered stack** (slide 13) — HTML vertical layers.
11. **Progressive-disclosure flow** (slide 14) — Mermaid `graph LR` plus token-cost callout.
12. **Five-agent grid** (slide 15) — HTML 5-column.
13. **Family-tree graph** (slide 16) — Mermaid `graph TD`.
14. **One-loop-many-policies hub** (slide 17) — Mermaid `graph LR` with center node + 4 outbound edges.
15. **Universals checklist** (slide 18) — HTML.
16. **Rifts comparison** (slide 19) — HTML 2-column.
17. **Canonical shape block** (slide 20) — Mermaid `graph TD`.
18. **Problem-class decision tree** (slide 21) — Mermaid `graph TD`.
19. **10-item checklist** (slide 22) — HTML grid.

19 diagram *types* across 23 slides (the timeline strip is reused on slides 2 and 9, so 20 diagram instances). Three slides are text-only: 1 (title), 3 (thesis preview), 23 (closing). The remaining 20 slides each carry one diagram.

## Notes on style

- **No code blocks.** Every code-shaped concept (function calling, ChatML, ReAct trajectories) gets a *diagram* of the data flow, not a literal code excerpt.
- **No jargon without first showing the shape.** "ReAct" appears in slide 8 only after the loop is drawn. "MCP" / "ACP" appear in slide 12 only after the standards are framed visually. "SKILL.md" gets its own slide (14).
- **Recurring spine.** The agent-loop diagram from slide 8 should be referenced (small inset) on slides 17, 20, 21.
- **Color convention** (suggestion): blue = the model; green = tools; orange = the harness/loop; gray = surfaces (terminal, chat, IDE). Pick once, use everywhere.
- **Audience checkpoints.** After slide 5 ("chat model"), the audience has the shared vocabulary needed for the rest. Before that, lean on analogies; after, gradually layer the real terminology.

## What's deliberately *not* in the deck

- Word2vec, LSTM, Transformer internals, BERT vs GPT — none of it. (Tier 1 detail.)
- Scaling laws, Chinchilla, Kaplan — none. (Tier 1 detail.)
- RLHF / DPO mechanics — abstracted to "alignment training" in one line. (Tier 2 detail.)
- Specific paper authors or arxiv numbers — references only; audience doesn't need them.
- Specific code paths in the five agents (`query.ts`, `runLoop`, etc.) — these live in the per-agent docs, not on slides.
- The full ten editorial rifts — keep to 6 on slide 19 for legibility.
- Bibliography — the deck ends with a pointer to the docs corpus URL, not a citation list.

## Speaker-flow suggestion

- **Total budget:** 30-40 minutes.
- **Pacing:** ~90 seconds per slide.
- **Energy curve:** slow open (slides 1-3) → step through history (4-10) → crisp present (11-16) → fast core (17-19) → land (20-23).
- **Questions:** save for the end; the bottom-up arc only lands if you don't break the chain mid-way.
