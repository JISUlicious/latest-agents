# Tier 7 — Context engineering

> By 2026, "context engineering" has displaced "prompt engineering" as the dominant frame for working with LLMs. A single well-worded prompt is no longer the binding constraint on a useful agent. What matters is the **assembly** — which documents retrieve into the window, which tools and capabilities the agent can reach for, which prior project context loads automatically, which prefixes are stable enough to cache, and which long-running state survives across sessions. This tier covers the techniques and protocols that landed between 2020 and 2026 and that every modern agent now assumes: RAG and the vector-database stack; KV-cache reuse and prompt caching with prefix-cache-stable composition; capability packages (Claude Skills and `agentskills.io`); project-context conventions (`AGENTS.md`, `CLAUDE.md`); cross-vendor protocols (MCP, ACP); and memory architectures from file-backed `MEMORY.md` through learned dream-consolidation. **Tier 8 (current agents) treats this layer as a given.**

## Retrieval-augmented generation

**Lewis 2020** is the paper that named RAG and gave the field its canonical formulation. A pre-trained seq2seq model (BART) holds *parametric* memory in its weights; a dense vector index over Wikipedia (accessed by Dense Passage Retriever) holds *non-parametric* memory that can be updated without retraining. The architecture is two-stage: retriever embeds the query and selects top-K passages; decoder conditions on the input plus passages and produces output.

The two enduring contributions are conceptual. **First**, you can update an LLM's knowledge by re-indexing a corpus rather than re-training — minutes vs weeks. **Second**, every generated answer is traceable to the specific passages that conditioned it — provenance matters in any setting where wrong-but-confident generation is a real cost.

Through 2023-2024, RAG became the de facto architecture for "give the LLM domain knowledge." Hallucination on long-tail facts remained unsolved; RAG converted some failures into "no relevant passage was retrieved," a *recoverable* failure mode. Fine-tuning was expensive and lossy for facts. Context windows were small (4K-32K tokens). The pattern survives even as context windows grow into the millions — long-context models still benefit from retrieval because attention degrades over distance.

**Chunking** is the silent failure mode. Naive fixed-size chunking (500 tokens, 50-token overlap) discards document structure. Production moved to **structure-aware chunking** — split on headings, AST boundaries for code, table boundaries — plus **small-to-big retrieval** (retrieve at the small-chunk level for precision; return the parent section for context).

**Hybrid retrieval (BM25 + dense)** is the production default. Pure dense underperforms on rare named entities and exact-match keywords; pure sparse misses paraphrases. Run both in parallel, fuse with Reciprocal Rank Fusion, pass to a reranker. **Reranking** with a cross-encoder (Cohere Rerank, BGE-reranker, RankLLM) re-scores top-50 candidates and passes top-5 to the LLM. Hybrid + rerank typically adds another ~12 points of Recall@5 and ~17 points of MRR@3 over hybrid alone.

**Vector DB landscape (2026):** Pinecone (managed serverless), Weaviate (open-source, strong hybrid), Qdrant (Rust, payload filtering), Chroma (local-first, prototyping), Milvus/Zilliz (very large scale), plus pgvector (Postgres extension), Redis Stack, Elasticsearch, LanceDB, FAISS. **Embedding models:** OpenAI `text-embedding-3` (large/small with Matryoshka truncation), Cohere embed-v3/v4 (paired with Cohere Rerank), Voyage AI (retrieval-quality leader through 2026), BGE-M3 (strongest open-weights, dense+sparse+multi-vector in one model), Nomic Embed (Apache 2.0).

## Prompt economics

**KV-cache reuse.** To generate token T, attention has to read the K and V tensors at each layer for each previous token. These are deterministic functions of inputs — cacheable. Without caching, prefill is O(N²); with caching, the per-token decoding cost drops to O(N). Every modern serving stack (vLLM, TGI, SGLang, TensorRT-LLM) caches KV state per-request.

The more interesting move is reusing KV state **across** requests. If two requests share a long prefix (system prompt + tools + project context + retrieved docs + history), the K/V tensors over that prefix are byte-identical. **RadixAttention** (SGLang, 2023) keeps the cache in GPU memory after a request finishes and indexes it by a radix tree keyed on token sequences; a new request matches the longest cached prefix and skips prefilling those tokens. vLLM shipped automatic prefix caching shortly after. The economics are large — for typical agent workloads, the prefix is 10×-100× longer than the per-turn user message.

**Anthropic prompt caching** (Aug 14, 2024) made the API contract explicit. Mark `cache_control: { type: "ephemeral" }` breakpoints in the message structure; the API caches the prefix up to that point. Default TTL is **5 minutes**, refreshed on hit; a **1-hour TTL** was added (May 2025) for long-running workflows. Pricing structure is load-bearing:

- **Cache write** (first request that establishes the entry): 1.25× standard input price (5-min) or 2× (1-hour).
- **Cache read** (subsequent within TTL): **0.1× standard** — a 90% discount on cached tokens.

Anthropic's launch example: a 100K-token book context dropped from 11.5s to 2.4s on the second request. OpenAI, Google, AWS Bedrock, and Vertex shipped equivalents through 2024-2025 (OpenAI's variant is automatic; Google's explicit).

**Prefix-cache-stable composition** is not a feature you turn on — it is an **architectural discipline** the entire prompt-construction pipeline must honor. Anything that mutates upstream of a cache breakpoint invalidates the cache from that point onward. The rules that emerged across Anthropic, OpenAI, and the agent-CLI ecosystem:

1. Construct the prompt as `[static prefix] + [dynamic tail]`.
2. Static prefix: system prompt, tool definitions, project context (CLAUDE.md/AGENTS.md), skill metadata, retrieved documents, conversation history through the last completed turn.
3. Dynamic tail: current user message; anything that needs to be fresh (timestamp).
4. **Never mutate the static prefix to update state.** Append reminders to the next user message instead.
5. Within the prefix, most-stable content first (system prompt, tools), then less stable (project context), then least stable (conversation history). Maximizes the cached prefix length as you add turns.

One widely-cited deployment moved dynamic content (messaging metadata, group-chat context) out of the prefix into the per-message tail, taking cache hit rates from **7% to 74%** with no other changes. Claude Code's `<system-reminder>` pattern (append to next user message instead of splicing into system prompt) is the canonical instance.

Tool-set changes are also cache-invalidating. Most production agent CLIs declare the maximum tool set up front and let the model decide which to invoke, rather than narrowing per turn.

## Skills — capability packages

**Anthropic Agent Skills** (Oct 16, 2025) shipped with Claude Code and the Claude API. A Skill is a directory containing `SKILL.md` plus optional bundled resources:

```
my-skill/
├── SKILL.md          # required: YAML frontmatter + Markdown instructions
├── scripts/          # optional: code the skill can execute
├── references/       # optional: docs loaded on demand
└── assets/           # optional: templates
```

The frontmatter requires `name` and `description`; the body is free-form instructions. The crucial design decision is **progressive disclosure** — the three-stage loading model that makes Skills scale:

1. **Discovery.** At startup, the agent loads only `name` and `description` of every installed skill into the system prompt (~50-100 tokens per skill). The model decides *whether* a skill is relevant without loading its body.
2. **Activation.** When the model decides a skill is relevant, the harness reads `SKILL.md`'s body into context. Detailed instructions, tool-use patterns, gotchas live here.
3. **Execution.** From the body, auxiliary files (scripts, references) load on demand.

Why this matters: the alternative — load everything at startup — blows the context window. With 30 installed skills averaging 2,000 tokens each, eager loading costs 60K tokens before the user has typed anything. Progressive disclosure costs ~3K tokens of metadata; only the relevant one or two are paid for in full. **The same pattern as lazy module loading in programming languages, transposed to context windows.**

It also matches prefix-cache-stable discipline. The static metadata block sits in the prefix and caches forever. On-demand body loads are deterministic, so they cache too once read. Adding a new skill doesn't invalidate any existing cache entry.

**`agentskills.io` as an open standard** (Dec 18, 2025) made `SKILL.md` portable. The governance is candid: Anthropic-stewarded (the `agentskills/` GitHub org is Anthropic's, the spec is editorially controlled by them). But the format is genuinely portable, and adoption has been broad — the launch carousel lists Junie (JetBrains), Gemini CLI, OpenCode, OpenHands, Cursor, Amp, Letta, Goose (Block), GitHub Copilot, VS Code, Claude Code, OpenAI Codex, Pi, Mistral Vibe, Snowflake, and roughly 30 more. The pattern is closer to **Markdown** (one author, but the format is text, so adoption is frictionless) than to **HTTP** (multi-party design from the start). `SKILL.md` is the **portable capability artifact** of 2026.

**Skills vs tools vs MCP servers** is a common point of confusion:
- A **tool** is a single function call (atomic operation: "search GitHub issues with this query").
- An **MCP server** is a collection of tools that travel together as a deployment artifact ("everything you can do with our SaaS API").
- A **skill** is *procedural knowledge* — a Markdown document telling the agent how to perform a multi-step task, optionally bundling scripts. Loaded into context rather than invoked as a function.

Skills frequently call tools. The `pdf` skill ships with Python scripts the agent shells out to; it doesn't reimplement PDF parsing in Markdown. **MCP is the substrate; skills are the instruction layer on top.**

## Project-context conventions

**`.cursorrules`** was the first single-file convention. Plain text or Markdown at project root; loaded into the system prompt when Cursor opened the project. Worked well for small projects, scaled poorly to monorepos. Cursor evolved past it into `.cursor/rules/*.mdc` (multiple files with frontmatter controlling activation).

**`CLAUDE.md`** is Claude Code's name for the same idea. Lives at repository root (or nested), auto-loaded at session start. Conventional home for: project-specific bash commands, test commands, code-style guidelines, repository conventions, gotcha warnings. The `/init` slash-command generates a starter `CLAUDE.md` by analyzing the project.

**`AGENTS.md`** is the convergent universal convention. OpenAI's Codex CLI broke the every-vendor-has-its-own-name impasse by adopting **`AGENTS.md`** as a vendor-neutral name and shipping a sophisticated discovery process: walk from the project root toward the current working directory and load every `AGENTS.md` encountered along the path, with `AGENTS.override.md` for overrides.

The convention spread quickly. Through late 2025 and into 2026, Amp, Roo Code, Factory, Aider, Devin, Jules, and others adopted it. The format is intentionally trivial — plain Markdown, no frontmatter, no schema. The **discovery rule** (walk from project root toward cwd; closer files take precedence; load all of them) is the only thing standardized. In late 2025, `AGENTS.md` was donated to the **Linux Foundation** under the **Agentic AI Foundation** (the same foundation that received MCP). The `agents.md` site reports adoption across ~60,000 open-source projects by early 2026.

There is a deliberate symmetry with Git: Git walks upward from `cwd` looking for `.git`; the agent walks upward looking for `AGENTS.md`. The convention reuses an established mental model rather than inventing one. `AGENTS.md` is static project context that humans author for agents to read — distinct from `MEMORY.md`, which is dynamic state the agent writes and re-reads across sessions.

## MCP — Model Context Protocol

Anthropic announced MCP on **Nov 25, 2024**, open-sourcing the spec, SDKs (TypeScript and Python), and reference servers for Drive, Slack, GitHub, Git, Postgres, Puppeteer. The architecture is **three-role**:

- **Host** — an LLM application (Claude Desktop, Cursor, Claude Code).
- **Client** — a connector inside the host that speaks MCP to one server.
- **Server** — a process that exposes tools, prompts, and resources over MCP.

A host typically runs many clients, each talking to a different server. **Transports:** stdio (host spawns the server as a subprocess; newline-delimited JSON-RPC over stdin/stdout) for local; HTTP with Server-Sent Events for remote, replaced by **streamable HTTP** in the June 2025 spec update, which also added OAuth-based authorization for remote servers.

**Server features:** *tools* (function-style entry points; JSON-schema input, JSON result), *resources* (read-only data with URIs and content types), *prompts* (server-templated message sequences — reusable prompt templates as first-class objects). **Client features:** *sampling* (a server can ask the host's LLM to perform a generation; enables recursive agentic workflows), *roots* (filesystem/URI boundaries), *elicitation* (a server can request additional information from the user mid-flow).

**Why it took off.** Timing — every agent vendor was independently building one-off integrations and MCP shipped reference servers for the obvious set on day one. The stdio-subprocess transport is dead simple — 50-line MCP servers in Python. Anthropic open-sourced everything under permissive licenses and committed to multi-vendor governance early. By April 2025 OpenAI had publicly adopted MCP across ChatGPT; Google DeepMind, Microsoft (Semantic Kernel, Azure OpenAI), Cloudflare, Replit, and Sourcegraph all shipped support through 2025. In **December 2025**, Anthropic donated MCP to the **Agentic AI Foundation** (co-founded with Block and OpenAI).

**Critique and tradeoffs:**
- **Authentication was an afterthought.** A July 2025 scan of ~2,000 internet-exposed MCP servers found essentially none implemented authentication. The June 2025 spec update added OAuth 2.1; the ecosystem is uneven.
- **Tool-poisoning and prompt-injection is structural.** Tool descriptions are part of the system prompt and directly attended to by the model. A malicious MCP server can inject prompt-injection payloads via its tool descriptions, including hidden instructions only the model sees.
- **Token-aggregation risk.** An MCP server typically holds long-lived credentials; compromise of one server's host yields access to all integrated services.
- **The "S in MCP stands for Security" joke** circulated through 2025 as a design-priorities critique.
- **stdio servers run as full-trust subprocesses.** No sandbox by default. Several projects propose running MCP servers in WASM or containers; as of 2026, install-and-run-with-full-privileges is still the norm.

## ACP — Agent Client Protocol

Zed Industries announced ACP on **Aug 27, 2025**, originally to enable Google's Gemini CLI to plug into Zed as a first-class agent. ACP standardizes the **editor-agent interface** the same way LSP standardizes editor/language-server. The editor is the **client**; the agent is the **server**. Editor spawns agent as a subprocess; JSON-RPC 2.0 over stdio (newline-delimited NDJSON).

The role mapping is the obvious analogue of LSP:

| LSP | ACP |
|---|---|
| Editor | Editor |
| Language server | Coding agent |
| Document state | Project state |
| Code actions / completions | Agent turns |
| Diagnostics | Streamed thoughts / diffs |

**Why it matters.** Before ACP, every "agent in an IDE" integration was bespoke. With ACP, an editor that speaks ACP can connect to any compliant agent; an agent can run inside any compliant editor. The LSP promise — N×M custom integrations collapse to N + M.

**Adoption** grew faster than expected. Editors: Zed, Neovim, a VS Code extension, Kiro, Junie (in progress). Agents: Claude Code, Codex CLI, Gemini CLI, OpenCode, OpenClaw, Hermes Agent, Cline, OpenHands, Goose, Mistral Vibe, Cursor (as a server backend), Pi, Qwen Code, Docker's cagent. 30+ agents listed on `agentclientprotocol.com` by 2026.

**Streaming as a first-class concept.** Unlike MCP tool calls (request/response), an ACP "agent turn" is a long-running, streamed exchange — editor sends a user message; agent streams back interleaved thoughts, tool calls, file diffs, final response. The editor renders this incrementally, which is what makes ACP feel like a native part of the editor rather than a chat plugin.

**Governance.** ACP is governed by Zed Industries with an open spec; not yet donated to the Linux Foundation (open question for 2026-2027).

**MCP and ACP are complementary, not competing.** A typical 2026 setup: Zed (editor) speaks ACP to Claude Code (agent); Claude Code speaks MCP to a GitHub MCP server, a Postgres MCP server, a project-specific MCP server. Three protocols in the stack — LSP at the editor/language-server boundary, ACP at the editor/agent boundary, MCP at the agent/tool boundary — each minimal, each composable.

## Memory architectures

Standard chat APIs are stateless: you replay the conversation on every turn. That works within a session and breaks down across them. The memory architectures fall into four classes.

**File-backed memory** is the simplest. The agent writes notes to a file; the file loads back on the next session. Claude Code's convention: a per-project memory directory at `~/.claude/projects/<project>/memory/` containing a `MEMORY.md` index (kept under 200 lines because that's the cutoff for what loads at startup) plus topic files for detail. The index loads eagerly; topic files are read on demand. **Virtues:** human-readable, version-controllable, auditable. **Vices:** doesn't scale beyond a few thousand tokens; no semantic retrieval.

**Vector-backed memory** treats memory as a corpus to be RAG'd against. **Mem0** (open-source, 2025 paper) extracts memories passively: when you call `add()` with a conversation, an extraction pipeline decides what facts to store, deduplicates against existing memories, and indexes them; retrieval combines semantic, keyword, and entity-based signals. **Letta** (formerly **MemGPT**, Packer 2023) is the agent-runtime descendant of MemGPT's "LLMs as operating systems" framing — context window as RAM, external storage as disk, the agent itself manages memory transfers via tool calls. **Honcho** (Plastic Labs) focuses on **user modeling** via a Dialectic API: rather than retrieving raw memories, you ask Honcho a natural-language question about the user and Honcho's LLM synthesizes the response from stored interactions. Hermes Agent uses Honcho as an optional fourth memory layer.

**Learned memory** collapses memory into the same artifact as capability. Instead of storing memories separately, the agent writes new **skills** when it learns something. The artifact is the same `SKILL.md` format as static capability packages — but the agent itself is the author. Claude Code's **AutoDream** (early 2026) implements a four-phase consolidation pass during idle periods: **Orient** (read current memory), **Gather** (scan recent transcripts for new info), **Evolve** (merge into topic files, resolve contradictions), **Index** (regenerate `MEMORY.md`). The explicit metaphor is sleep-driven memory consolidation.

**Layered architectures** combine multiple classes. **Hermes Agent**'s four-layer design is the most-developed: (1) agent-curated `MEMORY.md`/`USER.md` (frozen snapshot at session start; mid-session writes go to disk but not to the prefix); (2) skill creation and improvement; (3) FTS5 session search with LLM summarization for cross-session recall; (4) optional Honcho dialectic user modeling. The architecture is **cache-aware by construction** — each layer is structured so the bulk of loaded context sits in the prefix-cacheable region.

**Open problems** (2026): principled **forgetting** (memory monotonically accumulates); **contradiction handling** (which fact to keep when a new one contradicts an old); **cross-user privacy**; **evaluation** (no consensus benchmark for "did the agent remember the right things?"); **memory portability** (a SKILL.md is portable; a Mem0 store is not; no equivalent of "git push your memory").

## → Inherited by modern agents

By 2026, every serious agent stack assumes the following as given:

- **MCP as the tool/resource bridge.** New tool integrations are built as MCP servers; new agents add MCP-client support on day one. The agent-tool boundary is no longer custom code.
- **ACP as the IDE-agent bridge.** New editors add ACP support; new agents add ACP server support. The agent-editor boundary is no longer custom code either.
- **`SKILL.md` as the portable capability artifact.** A skill written for one agent runs across the others. The minimalism (Markdown + frontmatter + folder) is the reason.
- **`AGENTS.md` walks as the project-context convention.** Walk from project root toward cwd, load every `AGENTS.md` (or `CLAUDE.md`) found, prepend to system prompt. Universal across the major CLIs.
- **Prefix-cache-stable composition as a hard architectural rule.** Construct prompts as static prefix + dynamic tail; never mutate the prefix to update state; append reminders to the next user message; cache the prefix; pay full price only for the tail.
- **Hybrid retrieval + reranker as the default RAG stack.** BM25 + dense → fuse with RRF → rerank with a cross-encoder → top-K into the prompt. The single-shot dense-retrieval baseline is mostly historical.
- **Progressive disclosure as the context-management discipline.** Load metadata eagerly; load bodies on demand; load referenced files only when needed.
- **A memory layer of some kind.** File-backed for simple agents, vector-backed for production assistants, learned-skill / dream-consolidation for the frontier. The stateless-conversation baseline is no longer competitive for any agent that runs longer than a single session.

Tier 8 — current agents — treats this entire layer as the substrate. The interesting design questions there are about loops, tool budgets, sub-agent orchestration, sandbox architecture, and process management; **the context layer is no longer where the differentiation happens**.
