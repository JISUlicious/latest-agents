# Story Skeleton — Modern AI Agents

> **How to read.** Bottom-up: from foundational primitives (Tier 1) to today's agent architectures (Tier 8) to synthesis (Tiers 9-10). Each of Tiers 1-7 closes with a *"→ Inherited"* line naming the component(s) modern agents carry forward. By Tier 8 every piece of the modern stack has been introduced. Evidence for Tiers 8-10 lives in the per-agent docs at [`agents/`](agents/), [`comparison/`](comparison/), and [`README.md`](README.md).

> **The ten tiers.**
> 1. Background — NLP → Transformer
> 2. LLM emergence
> 3. Reasoning emerges
> 4. Tool use emerges
> 5. Orchestration frameworks
> 6. Steering & guardrailing
> 7. Context engineering
> 8. Current market-leading agents (the five)
> 9. Patterns & rifts (the core)
> 10. Thesis, frame, takeaways

---

## Tier 1 — Background: NLP → Transformer

- Tokens, vocabularies, embeddings
  - `word2vec` (Mikolov 2013)
  - `GloVe` (Pennington 2014)
  - `fastText`
- Sequence models
  - RNN
  - LSTM (Hochreiter & Schmidhuber 1997)
  - GRU
  - seq2seq (Sutskever 2014)
  - attention (Bahdanau 2014) — soft alignment over encoder states
- The Transformer
  - "Attention Is All You Need" (Vaswani 2017)
  - self-attention, multi-head attention, positional encoding
- Three architectural families
  - encoder-only — BERT, RoBERTa, DeBERTa
  - decoder-only — GPT line
  - encoder-decoder — T5, BART
- Pre-training + fine-tuning paradigm
- Scaling laws
  - Kaplan 2020
  - Chinchilla / Hoffmann 2022

→ **Inherited:** *autoregressive decoding* (the loop that emits one token at a time); *attention as the universal sequence operator*

---

## Tier 2 — LLM emergence

- GPT-3 (Brown 2020) — in-context learning, few-shot prompting
- Instruction tuning
  - InstructGPT
  - FLAN, FLAN-T5
- Alignment training
  - RLHF (Christiano 2017 → OpenAI 2022)
  - DPO (Rafailov 2023) and successors
- Chat-tuned products
  - ChatGPT (Nov 2022)
  - Claude (Anthropic)
  - Llama (Meta)
  - Gemini (Google)
- The instruction/chat surface as a stable product abstraction

→ **Inherited:** *the model as instruction-following partner* (text in → text out + behavioral steering); *refusal/safety baseline as a precondition*

---

## Tier 3 — Reasoning emerges

- Chain-of-Thought prompting (Wei 2022)
- Zero-shot CoT — "Let's think step by step" (Kojima 2022)
- Self-consistency (Wang 2022)
- Tree of Thoughts (Yao 2023)
- *ReAct* — Reason + Act interleaved (Yao 2022/2023)
- Reflexion — verbal self-critique RL (Shinn 2023)
- Reasoning-as-output (the "thinking" turn)
  - o1, o3 (OpenAI)
  - Claude extended thinking
  - Gemini thinking
  - DeepSeek-R1 distillations

→ **Inherited:** *ReAct as the agent-loop spine* (the canonical reason→act→observe→reason cycle); *reasoning trace as a first-class output channel*, separate from the user-facing answer

---

## Tier 4 — Tool use emerges

- WebGPT (Nakano 2021) — GPT-3 fine-tuned for browser actions + citation
- *Toolformer* (Schick 2023) — self-supervised API-call insertion via in-context examples
- ALFWorld, BlenderBot — embodied / multi-modal tool environments
- Function calling shipped as API
  - OpenAI function calling (June 2023)
  - Anthropic tool use
  - Gemini function calling
- Native tool-call dialects (provider-level wire formats)
  - `<tool_call>` (Hermes / ChatML)
  - `[TOOL_CALLS]` (Mistral)
  - `llama3_json`
  - `qwen`, `qwen3_coder`
  - `deepseek_v3`
  - `kimi_k2`, `glm45/47`

→ **Inherited:** *structured tool-call protocol* — the model emits tool requests in-band as part of its output; *"the model knows about its tools"* — schemas are shipped in the prompt or system context

---

## Tier 5 — Orchestration frameworks (agents become a product category)

- *Prompt chaining* as a design pattern
- First-wave frameworks
  - `LangChain` (Chase, late 2022)
  - `LlamaIndex`
- The viral agent moment
  - `AutoGPT` (March 2023)
  - `BabyAGI`
  - `AgentGPT`, `SuperAGI`
- Multi-agent frameworks
  - `AutoGen`
  - `CrewAI`
  - `MetaGPT`
- The agent-loop pattern crystallizes
  - model + tools + memory + objective
  - ReAct as the de-facto orchestration spine
  - session as a first-class abstraction (history, retries, interruption)

→ **Inherited:** *the agent loop as a first-class construct* (`while (true) { call model; run tools }`); *multi-step autonomy with a session* (durable enough to recover, branch, fork)

---

## Tier 6 — Steering and guardrailing (shaping model behavior to purpose)

*Two complementary axes: **constrain** (negative — prevent unwanted behavior) and **steer** (positive — channel behavior toward a defined purpose).*

### Constrain — safety, refusal, sandboxing
- Constitutional AI (Anthropic 2022)
- Refusal training, over-refusal calibration
- Red-teaming as a practice
- Indirect prompt-injection defenses
- Output filters
  - OpenAI moderation
  - Llama Guard
  - ShieldGemma
- Guardrail libraries
  - NeMo Guardrails
  - `Lakera`
  - `Rebuff`
  - `Guardrails AI`
- Tool-call sandboxing as a runtime constraint

### Steer — purpose, role, structured output
- System prompts as role / persona / identity pinning
- Hand-tuned prompts per provider family (one prompt is not enough across Claude/GPT/Gemini/local)
- Structured output
  - JSON-schema strict mode
  - `tool_choice: "required"`
- Structural denylists as purpose enforcement
  - read-only subagents that *cannot* mutate, regardless of what the prompt says
  - the methodology is enforced by tool-set filtering, not by trust
- Verdict contracts: model-checks-model with a parsed terminal line
  - `VERDICT: PASS | FAIL | PARTIAL`
- Per-iteration reminders that pin a mode (plan-mode style attachments)

→ **Inherited:** *permission / sandbox primitives* (the constrain axis); *purpose enforced through prompts + schemas + structural tool filters* (the steer axis — the direct precursor to *methodology in prompts, not state*)

---

## Tier 7 — Context engineering (the present-day toolkit)

- Retrieval
  - RAG (Lewis 2020)
  - vector DBs — Pinecone, Weaviate, Chroma, Qdrant
  - hybrid retrieval (BM25 + dense)
- Prompt economics
  - system-prompt design as an engineering discipline
  - KV-cache reuse
  - prompt caching (Anthropic prompt cache, 5-min TTL)
  - prefix-cache-stable composition
- Capability packages
  - *Anthropic Claude Skills* — Markdown + frontmatter + progressive disclosure
  - `agentskills.io` as the open standard
- Project context
  - `AGENTS.md` / `CLAUDE.md` / `.cursorrules` walks
  - injected under a `# Project Context` heading
- Cross-vendor protocols
  - *MCP* — Model Context Protocol (Anthropic, Nov 2024) — tool/resource server bridge
  - *ACP* — Agent Client Protocol (Zed) — editor-side agent control
- Memory architectures
  - file-backed (MEMORY.md, USER.md)
  - vector-backed (Honcho, Mem0, supermemory)
  - learned (auto-curated skills, dream consolidation)
  - layered (file + provider + session-search + curator)

→ **Inherited:** *MCP* as the tool/resource bridge; *ACP* as the IDE-agent bridge; *SKILL.md* as the portable capability artifact; *AGENTS.md walks* as project-context convention; *prefix-cache discipline* as a hard architectural rule

---

## Tier 8 — Current market-leading agents (the five)

### claude-code — Anthropic's reference layered platform
- maker: Anthropic | language: TypeScript / Ink | surface: terminal REPL
- editorial: *layered platform — MCP-first, file-based extension everywhere*
- named entities
  - `query.ts` — the one assistant loop (interactive ≈ headless ≈ subagent ≈ remote)
  - `StreamingToolExecutor` — concurrency-safe tool runs overlap model stream
  - `AgentTool` + the 5-tool denylist (read-only subagents structurally cannot mutate)
  - `memdir/` + `autoDream` — file-based memory + nightly consolidation as forked subagent
  - `sandbox-adapter.ts` — OS-level filesystem/network rules
  - MCP `client.ts` — first-class, deferred-tool mechanism via `ToolSearch`
  - hooks — 28 lifecycle events
  - verification subagent + `VERDICT: PASS|FAIL|PARTIAL`

### opencode — SST's typed protocol surface
- maker: SST + community | language: TypeScript / Bun / Effect | surface: TUI + HTTP server
- editorial: *server-first; clients are interchangeable*
- named entities
  - `SessionPrompt.runLoop` — the session-level loop
  - `SessionProcessor` — per-turn AI-SDK event consumer
  - AI SDK + `models.dev` — 23 bundled providers, live remote catalog (5-min disk + 60-min background refresh)
  - `Permission.Ruleset` — pattern-rule engine, persisted per project
  - snapshot side-git — `Global.Path.data/snapshot/...` for free `session.revert`
  - `sync/` event-sourcing layer — `SyncEvent.run(...)` with monotonic `seq`
  - `acp/` server — `opencode acp` for Zed
  - `experimental_repairToolCall` — mis-cased calls rewritten; unknown calls routed to `invalid` sink tool

### pi-mono — badlogic's refused-and-eject minimalism
- maker: Mario Zechner | language: TypeScript / Node | surface: terminal TUI
- editorial: *seven tools forever; everything else is an extension*
- named entities
  - `pi-ai` / `pi-agent-core` / `pi-coding-agent` — three-package monorepo, lockstep versioned
  - `agentLoop` — pure async-generator loop in `pi-agent-core`
  - the seven tools — `read`, `write`, `edit`, `bash`, `grep`, `find`, `ls`
  - pluggable `Operations` per tool — swap transport (SSH, sandbox) without forking
  - `ExtensionAPI` — 20+ events, full TUI surface replacement, OAuth provider registration
  - `SKILL.md` loader — Claude Code / Codex / Amp / Droid compatible
  - Pi Packages — npm/git-distributed bundles

### hermes-agent — Nous Research's self-improving training environment
- maker: Nous Research | language: Python | surface: terminal + chat platforms + IDE
- editorial: *self-improving; the agent edits its own substrate*
- named entities
  - `AIAgent` (`run_agent.py`) — the OpenAI-format core loop (≥15k LOC)
  - `gateway/run.py` — long-lived multi-platform daemon
  - `acp_adapter/` — ACP sessions persisted to shared `~/.hermes/state.db`
  - `MemoryProvider` ABC — pluggable Honcho / Mem0 / hindsight / …
  - `curator.py` — auxiliary forked agent that auto-archives stale skills
  - `batch_runner.py` + `environments/` — SFT trajectory factory + Atropos RL
  - FTS5 session search across all past conversations
  - cron scheduler — autonomous scheduled jobs with 3-min hard interrupt

### openclaw — community single-operator gateway
- maker: independent | language: TypeScript / Node | surface: chat platforms + macOS menu bar + CLI + web
- editorial: *single-operator-trusted; lean core; tiered Docker sandbox*
- named entities
  - `Gateway` — WebSocket daemon at `ws://127.0.0.1:18789`, PROTOCOL_VERSION 3
  - three `Dockerfile.sandbox*` — minimal Debian / Node+Go+Rust+Brew / Chromium+Xvfb+noVNC+CDP
  - `pi-embedded-runner.ts` + `pi-embedded-subscribe.ts` — pi-mono as the agent runtime
  - plugin SDK published as `openclaw/plugin-sdk` — 24 hook events
  - `acp/server.ts` + `extensions/acpx` — bidirectional ACP (server + client to Codex/Claude/Gemini/Pi)
  - `clawhub.ai` — skill registry
  - `mcporter` skill — MCP-as-a-skill, not as core

---

## Tier 9 — Patterns and rifts (THE CORE)

### Universals — what most agents share

- *One loop, many policies*
  - same `while (true) { call model; run tools }` body
  - reconfigured by prompt + tool filter + permission policy
  - configurations: interactive · headless · subagent · coordinator · remote · cron · batch · RL rollout
- *Methodology in prompts, not state*
  - no Phase enum; no gather→act→verify state machine
  - encoded via prompt rules + tool-set filters + one parsed contract (`VERDICT`)
- *Compaction as control flow*
  - context pressure is a normal phase, not an error
  - five tiers in claude-code (some feature-gated); hidden `compaction` agent in opencode/openclaw; `on_pre_compress` in hermes; `session_before_compact` in pi
- Streaming + concurrency-safe parallel tool execution
- Recovery as control flow — two axes
  - retry-the-API (`Effect.retry`, `transition` state, `Retry-After` aware)
  - self-correct-via-tool-result (`experimental_repairToolCall` — bad calls become readable tool errors)
- `SKILL.md` as portable artifact (progressive disclosure)
- `AGENTS.md` walks from cwd to root
- ACP for IDE integration — four of five
- Pattern-rule permissions (where they exist)
- Prefix-cache discipline as architecture
- Subagent = same loop with different policy

### Editorial rifts — what the five disagree about

- Server-first vs binary-first
- MCP load-bearing (claude-code, opencode, hermes) vs deliberately refused (pi, openclaw-core)
- Sandbox spectrum
  - none → OS-rules → pluggable transport → tiered Docker → multi-backend
- Memory model
  - none → file-based → file + consolidator → multi-layer + curator
- Subagents
  - first-class → role-bounded → available-but-discouraged → refused
- Provider strategy
  - live remote catalog (opencode) vs hand-curated registry (pi-ai, claude-code) vs per-provider plugins (hermes)
- Trust frame
  - one-operator (openclaw, hermes) vs implicit single-tenant (others)
- Self-modification
  - none / memory-only / memory + skills (hermes alone)
- Agent-as-training-data
  - none vs explicit pipeline (hermes alone)
- Editorial stance
  - minimalism (pi) / lean-core (openclaw) / layered-platform (claude-code) / policy-regime (hermes) / protocol-discipline (opencode)

### Families that emerge

- A — coding agents: claude-code, opencode, pi-mono
- B — personal-assistant platforms: hermes-agent, openclaw
- C — reusable substrate: pi-mono (in both)

### Surprising cross-references

- openclaw embeds pi-mono as its agent runtime
- hermes evolved from openclaw (`hermes claw migrate`)
- opencode reads `~/.claude/skills/` directly
- pi-skills targets five agents with the same `SKILL.md`
- openclaw is bidirectional on ACP (server + `acpx` client)
- `mcporter` is shipped as a skill, not an extension
- `acp_registry/` in hermes (`agent.json` + `icon.svg`) — ACP has metadata conventions on top of the wire

---

## Tier 10 — Thesis, frame, takeaways

### Thesis
- The field's foundational primitives are now stable (Tiers 1-7)
- The disagreements that remain in 2026 are *editorial*, not architectural
- The five agents agree on much more than they disagree about

### The canonical shape of a modern agent
- surface → session → loop → provider / tools / permissions → extensions
- streaming bidirectional; recovery as control flow; compaction inside the loop

### "AI agent in 2026" — one-line stipulative definition
- a streaming chat loop over a provider abstraction, with a tool registry, a permission/sandbox layer, an extension surface, and a durable session — configurable into many runtimes by changing prompt + tool filter + permission policy

### "Which problem class are you in" — the lens
- one engineer, hand-buildable, no MCP → pi-mono pattern
- coding agent as platform → claude-code pattern
- coding agent that runs everywhere → opencode pattern
- personal assistant on chat platforms → openclaw pattern
- self-improving agent + training environment → hermes-agent pattern

### Builder table-stakes (from `README.md` "What you can build today")
- streaming chat loop over a provider abstraction (AI SDK or hand-rolled)
- tool registry with TypeBox/Zod-validated args + streaming executor
- Markdown skill loader (`SKILL.md` + frontmatter)
- `AGENTS.md` walk from cwd to root
- compaction stage before every model call
- permission system (pattern-rule) *or* sandbox/container story
- MCP support (unless deliberately refused)
- ACP server (table stake for IDE users)
- durable session store (event-sourced is a plus, JSONL is fine)
- subagent via a `task` tool (even with one type)

### Closing
- *Agents agree more than they disagree. The disagreements that remain are editorial — what to refuse, what to formalize, how to draw trust boundaries, and whether the agent is allowed to modify itself.*
