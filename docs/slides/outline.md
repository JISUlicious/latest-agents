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
- **Script — worth mentioning:**
  - Brief self-intro and credential (one sentence; the talk is the credential).
  - Total duration ~35-40 minutes; questions at the end.
  - The one-sentence promise of the talk: by the end you'll understand what makes today's AI agents distinct and how to choose between them.
  - No prior AI background needed; vocabulary will be introduced as we go.

### Slide 2: The 30-second story

- **Visual:** Mermaid `graph TD` showing divergence-then-convergence (diamond shape).
  - Trunk: `Transformer (2017)` → `ChatGPT (2022)`
  - ChatGPT fans out into three parallel branches:
    - `Learned to think` — reasoning research → trained reasoning models *(CoT 2022 → ReAct 2022 → o1 2024 → R1 2025)*
    - `Learned to act` — tool use *(WebGPT 2021 → Toolformer 2023 → function calling 2023)*
    - `Learned to coordinate` — frameworks → standards *(LangChain 2022 → AutoGPT 2023 → MCP 2024 → ACP/SKILL.md/AGENTS.md 2025)*
  - The three branches converge into `Today's agents (2026)`.
- **Text:** title only — *"Three threads, one convergence."*
- **Script — worth mentioning:**
  - AI agents didn't appear from a single invention. Three threads grew in parallel.
  - Shared foundation: the Transformer architecture (2017) and the chat-model interface (ChatGPT, 2022).
  - From that foundation, three distinct capability threads developed roughly in parallel:
    - the model **learned to think** (reasoning emerged as a separate channel),
    - the model **learned to act** (tool use became a protocol),
    - the field **learned to coordinate** them (orchestration frameworks, then cross-vendor standards).
  - All three threads converge into what we call "agents" today.
  - This is the roadmap of the whole talk — each branch is a section.
- **Speaker notes:** A linear timeline would be misleading here. CoT (Jan 2022) actually preceded ChatGPT (Nov 2022). WebGPT (Dec 2021) preceded ChatGPT. The threads aren't sequential — they're parallel, and the diamond shape is honest where a chain isn't.

### Slide 3: Thesis preview

- **Visual:** a single sentence, big type, centered.
- **Text:** *"In 2026, AI agents agree more than they disagree. What remains is editorial."*
- **Script — worth mentioning:**
  - State the punchline upfront so the audience knows where the talk lands.
  - "Editorial" = the choices each project makes about *what to refuse*, *what to formalize*, *how to draw trust boundaries*, *whether the agent edits itself*.
  - The architecture is settled. The disagreements that remain are matters of taste, not capability.
  - The slides between here and slide 23 *earn* this claim.
- **Speaker notes:** Resist the urge to defend it now. The whole talk is the defense.

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
- **Script — worth mentioning:**
  - Before 2020, language models were sophisticated autocomplete — they predicted the next word in a sentence.
  - GPT-3 (2020) showed something surprising: at sufficient scale, the same machinery learned to follow instructions written in plain language.
  - Three ingredients turned a "completion engine" into a "follower of directives": **scale** (more parameters and data), **instruction tuning** (training on examples of "do what you're told"), **RLHF** (training on which answers humans prefer).
  - The breakthrough was not architectural — it was *interface*. The model didn't change shape; the way we interact with it did.
  - ChatGPT (Nov 30, 2022) is the moment this became visible to everyone.
- **Speaker notes:** Don't go deeper on Transformer internals or scaling laws. The audience doesn't need it. The point of this slide is one shift: completion → instruction.

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
- **Script — worth mentioning:**
  - Every chat-tuned model uses the same three message roles. This is the universal API.
  - **system** = the instructions you don't see (the rules, the persona, "you are a helpful assistant").
  - **user** = what the human types.
  - **assistant** = what the model replies.
  - This format started with OpenAI's ChatGPT API (Mar 2023) and was adopted by Anthropic, Google, Meta, Mistral, and every open-weight chat template. It's the cross-vendor lingua franca.
  - Everything in the rest of the talk — tool use, reasoning, agents — happens inside this three-role frame. It's the keyhole everything else passes through.
- **Speaker notes:** This is the vocabulary checkpoint for the rest of the deck. After this slide you can use "system prompt" and "tool message" without explanation. Before this slide, you can't.

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
- **Script — worth mentioning:**
  - "Reasoning" in AI sounds magical but the story is mundane and short — two stages.
  - **Stage 1 — prompt trick.** Wei et al. (Jan 2022) showed that if you put worked-out reasoning examples in your prompt, the model imitated the style and got better at math and logic. Kojima et al. (May 2022) showed even simpler: just say "Let's think step by step" and it works zero-shot.
  - **Stage 2 — trained capability.** Sep 2024, OpenAI shipped o1: a model trained via reinforcement learning to produce long internal reasoning before answering. Jan 2025: DeepSeek-R1, open-weights, matched o1. Feb 2025: Claude added "extended thinking" mode.
  - Why it matters: reasoning is now a **separate output channel**. Modern models produce a private "thinking" trace + a final answer. Two distinct things, two different costs, two different audiences (the developer can read the trace; the end user sees the answer).
  - The mechanism: more tokens = more compute per problem. Producing intermediate "thoughts" gives the forward pass room to work — and externalizes working memory into the context window.
- **Speaker notes:** The point is *demystification*. Reasoning isn't a new kind of intelligence; it's the same model spending more compute on harder problems.

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
- **Script — worth mentioning:**
  - Walk through the sequence step by step: the user asks a question, the model emits a *structured* tool call (not free text — a JSON-shaped request), the harness runs it, the result comes back, the model produces the final answer.
  - The pivotal date: **June 13, 2023** — OpenAI shipped *function calling*. Before that, you'd put "please output JSON in this format" in your prompt and pray. After that, the model is *trained* to emit tool calls as a separate API field.
  - Anthropic followed (Nov 2023 beta → May 2024 GA); Google followed in 2024. By the end of 2024, function calling was table stakes.
  - Once tools work, the model can use anything: shells, browsers, file editors, databases, APIs.
  - This single cycle — model emits call → harness executes → result returns — is the building block of *every* modern agent.
- **Speaker notes:** Don't call it "the agent loop" yet — that comes one slide later. This slide is one trip; the next slide makes it cyclical.

### Slide 8: The agent loop — think + act + observe

- **Visual:** a circular Mermaid `graph TD` showing the ReAct cycle.
  - `Think` → `Act` → `Observe` → back to `Think`.
  - Annotated with "*one trip = one model call*".
- **Text:**
  - Title: *The agent loop*
  - Callout: *ReAct: reason interleaved with action (Yao 2022)*
- **Source:** drafts 03, 04, 05.
- **Script — worth mentioning:**
  - Now compose slide 6 (think) and slide 7 (act). The model thinks, acts, observes the result, then thinks again. Repeat until the task is done.
  - This loop has a name: **ReAct** — short for "Reasoning + Acting." From a 2022 Princeton/Google paper (Yao et al.).
  - One trip around the loop = one model call. The harness runs the loop; the model decides when to stop.
  - This is **the spine** of every modern AI agent — Claude Code, Cursor, ChatGPT with tools, AutoGPT, every framework. The surface differs; the loop is the same.
  - From here, every slide either *implements* this loop (slides 9-14), *characterizes* this loop (slides 17-19), or *configures* this loop (slides 20-22).
- **Speaker notes:** Point at this diagram and tell the audience: "Take a screenshot. This shape will appear in every slide from here on." It earns its weight.

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
- **Script — worth mentioning:**
  - The agent loop went from research diagram to product category in about five-to-six months — ReAct paper (Oct 2022) → AutoGPT (Mar 2023).
  - **LangChain** (Harrison Chase, Oct 24, 2022) was the first widely-used orchestration framework — released a month before ChatGPT, exploded in adoption afterward.
  - **AutoGPT** (Toran Bruce Richards, Mar 30, 2023) was the inflection: an "autonomous" agent with a goal, memory, browsing, file editing. 30K GitHub stars in 13 days, 100K by late April — fastest-growing open-source project in GitHub history at the time.
  - This is the moment "AI agent" became a noun your CEO recognized.
  - Then **BabyAGI** (Apr 3, 2023), **AutoGen** (Microsoft, Aug 2023), **MetaGPT** (Aug 2023), **CrewAI** (Jan 2024) — multi-agent frameworks layered on top.
  - Be candid: most AutoGPT demos were cherry-picked. The runs got stuck in loops, hallucinated, cost real money. By autumn 2023 the discourse had flipped to "trough of disillusionment."
- **Speaker notes:** AutoGPT's contribution was *cultural*, not technical — it showed the *shape* of an agent to a global audience. The reliability problems took two more years (and better models, better tools, MCP) to fix.

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
- **Script — worth mentioning:**
  - The orchestration frameworks (LangChain, AutoGen, CrewAI, MetaGPT) had a noisy 2023, and by 2024 the dominant feedback was: *frameworks were over-abstracted; the orchestration layer is the smallest part of the problem*.
  - Production wisdom that emerged (the "12-Factor Agents" school):
    - **Own your prompts** — don't hide them behind framework abstractions you can't read.
    - **Own your context** — you decide what goes in the model's window each turn.
    - **Own your control flow** — write the loop yourself; the loop is small.
  - The framework wars resolved by everyone agreeing the *orchestration* layer is small, and the *integration* layer is huge. That's what MCP standardized in Nov 2024 — how agents connect to tools, not how you build them.
  - What stuck from the framework era: the **mental model** (agent = loop + tools + memory + objective). The frameworks themselves receded.
- **Speaker notes:** This is the right moment to tell the audience "you don't need to learn LangChain to understand agents." The patterns transcend the libraries.

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
- **Script — worth mentioning:**
  - How do you keep a powerful generalist model on task — and away from trouble? Two complementary axes.
  - **Constrain** (negative axis) — prevent unwanted behavior. Refusal training, output filters, sandboxes, permission prompts before risky actions.
  - **Steer** (positive axis) — channel behavior toward a defined purpose. System prompts (the agent's job description), structured output (force a JSON schema), tool denylists (remove dangerous tools entirely), verdict contracts ("end with PASS or FAIL").
  - The most interesting design move of the last year: **enforce structurally, don't ask politely**. A read-only reviewer subagent in Claude Code doesn't have an `Edit` tool. The rule isn't a sentence in the prompt — it's a missing capability. The model literally cannot violate it.
  - "Constrain" and "steer" together: sandbox protects the *outside world* from the model; structural denylists protect the *task* from the model going off-script.
- **Speaker notes:** This is the most important *editorial* idea in the deck. If listeners take one new mental model home, make it this one — purpose is enforced by what tools the model has, not by what the prompt says.

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
- **Script — worth mentioning:**
  - Four cross-vendor standards landed in 12 months — unusual for any software field, almost unprecedented for AI.
  - **MCP** (Model Context Protocol, Anthropic, Nov 25, 2024): the protocol an agent uses to talk to *tools and data sources*. Open-sourced from day one. OpenAI adopted it in Apr 2025; donated to Linux Foundation Dec 2025.
  - **AGENTS.md** (mid-2025, OpenAI Codex CLI): a plain Markdown file that tells the agent about your project. Walks from the project root the same way Git does. Donated to Linux Foundation late 2025; ~60K open-source projects use it by early 2026.
  - **ACP** (Agent Client Protocol, Zed, Aug 27, 2025): how an *editor* talks to an *agent*. Same role as LSP for language servers — connect any editor to any agent.
  - **SKILL.md** (Anthropic Claude Skills, Oct 16, 2025; `agentskills.io` standard Dec 18, 2025): portable capability bundles. Markdown + YAML frontmatter + optional scripts.
  - Each is minimal — text-shaped or JSON-RPC-shaped — which is what made adoption frictionless.
- **Speaker notes:** Emphasize the *scale* of adoption. Four standards, every major vendor (Anthropic, OpenAI, Google, Microsoft, Meta, dozens of CLIs and editors), one year. That doesn't happen by accident — the field was *ready* for it.

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
- **Script — worth mentioning:**
  - Three protocols, three layers, three jobs. Each minimal, each composable.
  - **Editor ↔ Agent: ACP.** When you open Zed and the AI sidebar talks to Claude Code or another agent, that's ACP.
  - **Agent ↔ Tools: MCP.** When the agent searches GitHub or queries a database, that's MCP.
  - A typical 2026 setup: Zed (the editor) speaks ACP to Claude Code (the agent); Claude Code speaks MCP to a GitHub server, a Postgres server, a Slack server.
  - The vendor of any one layer can be swapped without touching the others. Same shape as LSP for language servers — composable plumbing.
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
- **Script — worth mentioning:**
  - A skill is a folder. Inside the folder is `SKILL.md` — Markdown with a two-line YAML header (name + description) and free-form instructions. Maybe a `scripts/` directory next to it.
  - The key innovation is **progressive disclosure** — three stages:
    - **Discovery**: at startup, the agent sees only the name and description of each installed skill (~100 tokens each).
    - **Activation**: when the model decides a skill is relevant, it reads the full body.
    - **Execution**: only if the body references scripts or templates does the agent open those.
  - The math: 30 skills × 100 tokens at startup ≈ 3K tokens. Eager-loading the same 30 skills would cost ~60K tokens *before the user has typed anything*. Progressive disclosure is what makes shipping dozens of skills viable.
  - Same SKILL.md file works in Claude Code, Codex CLI, Cursor, OpenCode, Pi, Goose, and ~25 other tools. Because it's just Markdown.
  - This is the deepest interop story in the field — a portable *capability* artifact, not just a portable model.
- **Speaker notes:** Reinforce: minimalism is what made it portable. Markdown is the most boring format imaginable; that's exactly why it spread.

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
- **Script — worth mentioning:**
  - These are the five agents the rest of the talk is grounded in. We'll keep coming back to them.
  - **claude-code** (Anthropic): the reference implementation. Everything is markdown + frontmatter. MCP-first. ~40 built-in tools, layered permissions, hooks for everything.
  - **opencode** (SST): server-first. The agent lives behind a typed HTTP API; the terminal UI is just *a* client. Pulls model catalog live from `models.dev`.
  - **pi-mono** (Mario Zechner): seven tools. *No* MCP, *no* subagents, *no* permission popups. Everything else is an extension. Refuses on principle.
  - **hermes-agent** (Nous Research): self-improving. The agent edits its own memory and creates its own skills. Also a training environment for the next model.
  - **openclaw** (community): one operator, three Docker sandbox tiers, runs as a multi-channel daemon. Embeds *pi-mono* as its agent runtime.
  - The audience doesn't need to memorize five projects. The point is *each makes a different editorial choice* — and those choices are the next slide.
- **Speaker notes:** Land these as *examples*, not as canonical names. The choices these projects represent matter more than the projects themselves.

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
- **Script — worth mentioning:**
  - The ecosystem is not five isolated projects. They share code, share formats, and depend on each other.
  - **openclaw** doesn't reinvent the agent loop — it imports pi-mono as a library and adds session lanes, sandboxing, and multi-channel routing on top.
  - **hermes-agent** ships a literal command `hermes claw migrate` that imports your `~/.openclaw` directory — hermes grew out of openclaw.
  - **opencode** reads `~/.claude/skills/` directly. Provider-agnosticism extended to *artifacts*, not just models.
  - **pi-skills** (a community skill collection) ships *identical* SKILL.md files with install instructions for five different agents: Pi, Codex, Amp, Droid, Claude Code.
  - **openclaw** uses ACP both ways: it serves ACP for IDEs *and* drives Codex / Claude Code / Gemini CLI / OpenCode / Pi as nested children via its `acpx` extension.
  - Each cross-reference is evidence that **the standards are real and the ecosystem composes**. A "family tree," not a "competition table."
- **Speaker notes:** This is the slide that earns the universals slide that follows. If you tell people standards exist *and* show real interop, the abstraction becomes credible.

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
- **Script — worth mentioning:**
  - This is **the most universal pattern in the field** — across all five agents we studied.
  - Same `while (true) { call model; run tools }` loop. Different policies on top: different prompts, different tool filters, different permission contexts.
  - In claude-code's source, *one file* (`query.ts`) handles: interactive REPL, headless SDK calls, every kind of subagent, remote sessions, and background memory consolidation. All configurations of the same loop.
  - Concrete examples: a "verify" subagent is the same loop with a denylist that removes mutating tools, a prompt that says "try to break the implementation," and a contract that says "end with VERDICT: PASS or FAIL." An "explore" subagent is the same loop with read-only tools.
  - The slogan: **multi-agent behavior is not a separate platform — it's the same loop reconfigured.**
- **Speaker notes:** Say this out loud and slowly. "Subagents are not separate engines." It's the kind of insight that changes how someone designs their next agent.

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
- **Script — worth mentioning:**
  - These six patterns show up in *every* one of the five agents. They're no longer interesting — meaning, they're no longer where designers differ.
  - **One loop, many policies** — the slide-17 finding.
  - **Methodology in prompts, not state** — no rigid "phase 1 / phase 2" state machine in code. The model is the active sequencer; the runtime exists to make its choices safe.
  - **Compaction as control flow** — managing the context window isn't a special feature, it's part of every turn. (E.g., claude-code runs five compaction stages before every model call.)
  - **Streaming + parallel tool execution** — tools run concurrently with model token output; multiple tools dispatch in one turn.
  - **SKILL.md and AGENTS.md** — cross-vendor file conventions for capabilities and project context.
  - **ACP for editors, MCP for tools** — the two cross-vendor protocols.
  - The "uninteresting" framing is positive: stable foundations are what let designers focus on the interesting differences (next slide).
- **Speaker notes:** This list is curated for legibility. There are more universals (recovery as control flow, prefix-cache discipline, pattern-rule permissions, etc.) — mention only if asked.

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
- **Script — worth mentioning:**
  - These are the six places where the five agents structurally disagree.
  - **Server-first vs binary-first.** Does the agent run as a daemon (opencode, hermes, openclaw) or a single binary (claude-code, pi-mono)? Predicts whether multi-surface (mobile, IDE, chat) is nearly free.
  - **MCP load-bearing vs refused.** Three of the five build MCP into core; two refuse it explicitly (pi-mono, openclaw). Refusal isn't ignorance — it's a position.
  - **Sandbox in core vs sandbox is your problem.** Openclaw ships three Docker sandbox tiers; pi-mono explicitly leaves that to the user.
  - **Memory layered + curator vs none.** Hermes-agent has a four-layer memory architecture with a curator that auto-archives stale skills. Pi-mono has no learned memory at all. Claude-code is in between.
  - **Subagents first-class vs refused.** Claude-code ships ~6 built-in subagent types; pi-mono refuses subagents entirely.
  - **Multi-tenant vs one-operator.** Openclaw is explicitly designed for *one user, one host*. Most others implicitly multi-tenant.
  - These choices aren't right-or-wrong — they're *editorial*. Each agent picks a side; the choice predicts most of its other decisions.
- **Speaker notes:** Be careful not to imply hierarchy. "Refusal" sounds negative; pi-mono refusing MCP is a deliberate, defensible choice for its design goals. Same with openclaw refusing agent hierarchies.

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
- **Script — worth mentioning:**
  - One diagram of every modern AI agent, drawn once.
  - **Surface** — the thing the human sees (terminal, IDE, chat app, mobile, web).
  - **Session** — the durable conversation state, including history and compaction.
  - **Loop** — the recurring spine from slide 8.
  - **Provider / Tools / Permissions** — the model API, the tool registry, the rules about what the agent can do.
  - **Extensions** — MCP servers, skills, plugins, agent-specific config.
  - All five agents we studied fit this shape. They differ in *how each layer is built*, not in *whether the layer exists*.
  - One-line stipulative definition: *"a streaming chat loop over a provider abstraction, with tools, permissions, and extensions — configurable into many runtimes by changing prompt + tool filter + permission policy."*
- **Speaker notes:** Refer back to the loop from slide 8 — it's the same loop, embedded in a fuller stack now.

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
- **Script — worth mentioning:**
  - There is no "best" agent. There are five patterns for five problem classes.
  - **One engineer, hand-buildable** → pi-mono pattern. Seven tools, no MCP, refuse-and-eject. Simple, opinionated, ships fast.
  - **Coding agent as a platform** → claude-code pattern. Layered platform, MCP-first, everything is markdown + frontmatter. Built for ecosystem.
  - **Coding agent that runs everywhere** → opencode pattern. Server-first, typed HTTP API, multiple clients (terminal, web, mobile, IDE).
  - **Personal assistant on chat platforms** → openclaw pattern. Single-operator gateway, multi-channel daemon, Docker-tiered sandbox.
  - **Self-improving + training environment** → hermes-agent pattern. Curator that auto-archives skills, batch-runner for trajectory generation, the agent is its own training distribution.
  - The right question isn't "which agent is best." It's **"which problem class am I in"** — and the answer picks the pattern.
- **Speaker notes:** This is where the deck cashes the thesis. The rifts from slide 19 *correlate with problem class*; that's why the disagreements are editorial, not architectural.

### Slide 22: The 10-item table-stakes

- **Visual:** 10-item checklist, compact grid.
  - 1 streaming loop · 2 tool registry · 3 SKILL.md loader · 4 AGENTS.md walk · 5 compaction · 6 permissions OR sandbox · 7 MCP (or explicit refusal) · 8 ACP server · 9 durable session · 10 subagent affordance.
- **Text:**
  - Title: *What you need to build one in 2026*
- **Source:** draft 10.
- **Script — worth mentioning:**
  - If you're building an agent from scratch in 2026, this is the floor.
  - Each item is **a present-day expectation**, not an aspirational feature.
  - The 10 items, briefly: (1) a streaming model+tool loop, (2) a tool registry with schema validation, (3) a SKILL.md loader, (4) an AGENTS.md walk from cwd, (5) a compaction stage, (6) permissions OR sandbox, (7) MCP support or an explicit refusal, (8) an ACP server, (9) a durable session store, (10) a subagent affordance.
  - You don't need to invent any of this. All ten items exist in *at least one* of the five projects we looked at — most exist in *every* one.
  - The interesting work in 2026 isn't reinventing these; it's **picking which patterns matter for your problem class** — and refusing the rest.
- **Speaker notes:** Pause briefly here. This slide is the talk's practical takeaway — if anyone in the audience is going home to build, this is the checklist.

### Slide 23: Closing

- **Visual:** single sentence, big type, centered.
- **Text:**
  - *Agents agree more than they disagree.*
  - *The rifts that remain are editorial — what to refuse, what to formalize, how to draw trust boundaries.*
  - *Pick yours.*
- **Script — worth mentioning:**
  - Restate the thesis one last time: agents agree more than they disagree.
  - The architecture is settled. The rifts that remain — what to refuse, what to formalize, how to draw trust boundaries, whether the agent edits itself — are matters of taste, not capability.
  - The cost of getting the editorial choice wrong is much smaller in 2026 than it would have been in 2022, because the substrate underneath is far more stable.
  - Brief acknowledgement of the docs corpus (per-agent docs, comparison, research, references) and where to find it.
  - Thanks; open for questions.
- **Speaker notes:** Don't introduce new material here. The job of this slide is to compress the thesis into one breath the audience can carry out the door.

---

## Diagram inventory (Marp/Mermaid checklist)

For implementation later, the diagrams to author:

1. **Diamond (divergence→convergence)** (slide 2) — Mermaid `graph TD` with one trunk, three branches, one convergence node.
2. **Before/after side-by-side** (slide 4) — HTML two-column.
3. **Stacked message frame** (slide 5) — ASCII art or HTML.
4. **Reasoning lineage** (slide 6) — Mermaid `graph LR`.
5. **Tool-call sequence** (slide 7) — Mermaid `sequenceDiagram`.
6. **Circular ReAct loop** (slide 8) — Mermaid `graph TD` with feedback edge.
7. **Timeline strip** (slide 9) — Mermaid `graph LR` or pure HTML horizontal flex showing the orchestration-framework wave dates.
8. **Two-column lessons** (slide 10) — HTML.
9. **Two-axis steering** (slide 11) — HTML two-column with iconography.
10. **Four-standard stack** (slide 12) — HTML horizontal cards.
11. **LSP/ACP/MCP layered stack** (slide 13) — HTML vertical layers.
12. **Progressive-disclosure flow** (slide 14) — Mermaid `graph LR` plus token-cost callout.
13. **Five-agent grid** (slide 15) — HTML 5-column.
14. **Family-tree graph** (slide 16) — Mermaid `graph TD`.
15. **One-loop-many-policies hub** (slide 17) — Mermaid `graph LR` with center node + 4 outbound edges.
16. **Universals checklist** (slide 18) — HTML.
17. **Rifts comparison** (slide 19) — HTML 2-column.
18. **Canonical shape block** (slide 20) — Mermaid `graph TD`.
19. **Problem-class decision tree** (slide 21) — Mermaid `graph TD`.
20. **10-item checklist** (slide 22) — HTML grid.

20 diagrams across 23 slides — one per non-text slide. Three slides are text-only: 1 (title), 3 (thesis preview), 23 (closing).

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
