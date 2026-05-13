# Tier 7 — Context Engineering

## Overview

By 2026, "context engineering" has displaced "prompt engineering" as the dominant frame for working with large language models. The shift reflects a simple observation: a single well-worded prompt is no longer the binding constraint on a useful agent. What matters is the assembly — which documents are retrieved into the window, which tools and capabilities the agent can reach for, which prior project context loads automatically, which prefixes are stable enough to cache, and which long-running state survives across sessions. This tier covers the techniques and protocols that landed between 2020 and 2026 and that every modern agent now assumes: retrieval-augmented generation and the vector-database stack that grew up around it; KV-cache reuse and Anthropic-style prompt caching with the discipline of stable prefixes; capability packages (Claude Skills and the `agentskills.io` open standard); project-context conventions (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`); cross-vendor protocols (MCP, ACP); and the explosion of memory architectures from file-backed `MEMORY.md` through learned dream-consolidation. Tier 8 (agent architectures) treats this layer as a given.

## Retrieval-augmented generation

### Lewis et al. 2020 — the original RAG paper

"Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks" (Lewis et al. 2020, arXiv 2005.11401, submitted May 22, 2020, NeurIPS 2020) is the paper that named RAG and gave the field its canonical formulation. The authors — Patrick Lewis, Ethan Perez, Aleksandra Piktus, Fabio Petroni, Vladimir Karpukhin, Naman Goyal, Heinrich Küttler, Mike Lewis, Wen-tau Yih, Tim Rocktäschel, Sebastian Riedel, and Douwe Kiela — were at Facebook AI Research and University College London. The framing is parametric versus non-parametric memory: a pre-trained seq2seq model (BART) holds parametric memory in its weights, and a dense vector index over Wikipedia (accessed by a Dense Passage Retriever, DPR) holds non-parametric memory that can be updated without retraining (Lewis 2020).

The architecture is two-stage. The DPR retriever, itself a pair of BERT encoders trained on Natural Questions, embeds the input query and the top-K passages and selects the most similar K documents (the paper uses K=5 to 10). A BART seq2seq decoder then conditions on the input together with each retrieved passage and produces an output. The paper distinguishes RAG-Sequence (the same retrieved set is used to generate the entire output) from RAG-Token (the model can attend to a different retrieved document at each generated token). RAG was trained end-to-end with the retriever's scores backpropagated through the marginalization, but with the document index itself fixed.

Empirically, RAG set the state of the art on open-domain question answering benchmarks (Natural Questions, TriviaQA, WebQuestions, CuratedTrec) and produced more specific and factually accurate generation on knowledge-intensive tasks than the parametric-only BART baseline (Lewis 2020). The two enduring contributions, though, are conceptual. First, RAG demonstrated that you can update an LLM's knowledge by re-indexing a corpus rather than re-training the model — a re-index takes minutes, training takes weeks. Second, RAG made provenance possible: every generated answer is traceable to the specific passages that conditioned it, which matters in any setting where wrong-but-confident generation is a real cost.

### Why RAG became the default pattern

Through 2023–2024, RAG became the de facto architecture for "give the LLM domain knowledge" in enterprise settings. Several forces converged. Hallucination on long-tail facts and on proprietary corpora was an unsolved problem and remained unsolved (and remains unsolved); RAG converted some fraction of those failures into "no relevant passage was retrieved", which is a recoverable failure mode. Fine-tuning was expensive, slow, and lossy as a way to inject facts (style is easier to fine-tune than facts). Context windows in 2023 were small (4K–32K tokens) so you could not just stuff a knowledge base into the prompt. And the embedding-model and vector-database tooling matured rapidly through 2022–2023 so that even small teams could ship a working RAG pipeline in a weekend.

By late 2024 the pattern had standardized: chunk the corpus, embed the chunks with a strong embedding model, store the vectors plus chunk text in a vector database, retrieve top-K by cosine similarity at query time, optionally rerank, then prepend the top-K chunks (with citations) into the model's context as grounding. The pattern survives even as context windows grow into the millions — long-context models still benefit from retrieval because attention degrades over distance and because most queries don't need the whole corpus.

The chunking step deserves a note: it is the silent failure mode of most RAG pipelines. Naive fixed-size chunking (500 tokens, 50-token overlap) is the default but discards the document's structure. Production pipelines through 2024–2026 moved to structure-aware chunking: split on headings, on Markdown structure, on AST boundaries for code, on table boundaries for tabular documents. The downstream impact is large — a query that needs to span two adjacent paragraphs has zero recall if those paragraphs landed in different chunks with no overlap. LangChain's `RecursiveCharacterTextSplitter`, LlamaIndex's `SentenceSplitter` and `SemanticSplitter`, and the rise of "small-to-big" / parent-document retrieval (retrieve at the small-chunk level for precision; return the parent section for context) all chase this problem.

### Hybrid retrieval (BM25 + dense)

Pure dense retrieval has a known weakness: it underperforms on rare named entities, exact-match keywords, and code identifiers where lexical match matters more than semantic similarity. Pure sparse retrieval (BM25, the 1990s-vintage TF-IDF descendant) has the opposite weakness: it misses paraphrases and synonyms. The dominant production pattern is therefore hybrid: run BM25 and dense retrieval in parallel, fuse the two ranked lists (most commonly with Reciprocal Rank Fusion, Cormack et al. 2009), and pass the fused top-N to a reranker. Benchmarks on text-and-table corpora show hybrid + cross-encoder rerank reaching Recall@5 of about 0.82 versus 0.59 for dense alone and 0.64 for BM25 alone — an order-of-magnitude reduction in the "right answer isn't in the retrieved set" failure rate.

### Reranking

The retrieval stage is biased toward recall: you want the right passage somewhere in your top-50 even if it's at rank 47. The reranker stage is biased toward precision: it re-scores the top-N candidates with a cross-encoder that sees the query and each passage together in one forward pass, producing a fine-grained relevance score. Cross-encoders are too expensive to run over the whole corpus (quadratic in passage count) but cheap enough to run on 50 candidates. Cohere Rerank is the most widely deployed commercial reranker; open alternatives include BGE-reranker, FlashRank, and RankLLM. The standard pipeline is: hybrid retrieve top-50, rerank with a cross-encoder, pass top-5 to the LLM. Adding a Cohere-class reranker on top of hybrid retrieval typically adds another ~12 points of Recall@5 and ~17 points of MRR@3.

A note on the architectural separation: the bi-encoder used for retrieval encodes query and document *independently* so that document embeddings can be pre-computed and stored. The cross-encoder used for reranking encodes them *jointly* in a single forward pass, which is strictly more expressive (it can model query-document interactions directly) but cannot be pre-computed. This is the same tradeoff that motivates two-stage retrieval everywhere: fast and approximate first, slow and precise second.

### Vector databases

The vector-database market matured through 2022–2024. The dominant players each occupy a different position on the build-vs-buy and scale axes.

**Pinecone** is the fully-managed, serverless, "easiest first product" option. It was the earliest commercial vector DB to reach broad adoption and is still the default choice for teams that don't want to operate infrastructure. Usage-based pricing on storage + queries + compute.

**Weaviate** is open-source, self-hostable or managed, with strong support for hybrid search (BM25 + dense in one query), built-in vectorization modules (you can let Weaviate call OpenAI/Cohere/HuggingFace for you), and a GraphQL-flavored query API. Memory-heavy at very large scale.

**Qdrant** is open-source, written in Rust, optimized for high-throughput filtered queries with payload filtering and built-in quantization. Popular for self-hosted production deployments where filtering on metadata matters as much as vector similarity.

**Chroma** is the developer-first, local-first option. The default choice for prototyping RAG on a laptop. Simple Python API, embedded by default, with a hosted managed version added later.

**Milvus / Zilliz** is the "very large scale" answer. Open-source Milvus is designed for billions of vectors with GPU-accelerated search; Zilliz Cloud is the commercial managed version. Latency benchmarks at scale tend to favor Milvus/Zilliz.

The other entrants that matter in practice are pgvector (Postgres extension — "use the database you already have"), Redis Stack (vectors alongside an existing Redis), Elasticsearch/OpenSearch (vectors alongside an existing inverted index), LanceDB (file-format-native, good for analytics workloads), and FAISS (the original Facebook AI Similarity Search library — a library, not a server, and the underlying ANN implementation in many of the others).

### Embedding models

The embedding model is the unsung load-bearing component of any RAG pipeline. The leaderboard through 2024–2026 has been a moving target on the MTEB benchmark (Massive Text Embedding Benchmark, Muennighoff et al. 2022).

**OpenAI text-embedding-3** (large and small, launched January 2024) was the post-`ada` rewrite. text-embedding-3-large ships at 3,072 dimensions and supports Matryoshka truncation (you can use the first 256, 512, or 1,024 dimensions and still get sensible behavior). Pricing: roughly $0.13/M tokens for large, $0.02/M tokens for small.

**Cohere embed-v3** and **embed-v4** are tightly optimized to pair with Cohere Rerank. embed-v4 ships at 1,024 dimensions and is multilingual across 100+ languages. The Cohere stack (embed + rerank) is the default for teams who want a turnkey commercial pipeline.

**Voyage AI** (acquired by MongoDB in 2024) is the retrieval-quality leader on MTEB through 2025–2026. voyage-3-large supports 32K-token context (longest among major embedding models) and consistently tops retrieval benchmarks. Pricing roughly comparable to OpenAI large.

**BGE** (BAAI General Embedding, from Beijing Academy of Artificial Intelligence) is the strongest open-weights family. BGE-M3 supports dense, sparse, and multi-vector retrieval in a single model with multilingual coverage. The default self-hosted option for teams that don't want a third-party API in the retrieval path.

**Nomic** (nomic-embed-text v1.5 / v2) is the open, Apache-licensed alternative with variable-dimension output and strong multilingual support at lower compute cost than BGE-M3.

The practical guidance is: if you don't know which to pick, start with OpenAI text-embedding-3-large or Voyage voyage-3-large; if you need self-hosted, BGE-M3 or Nomic v2; pair commercial embedders with their matching rerankers (Cohere embed + Cohere rerank is the canonical pairing).

## Prompt economics

### KV cache reuse

To generate token T, a transformer must compute attention from T over all previous tokens. The intermediate values — specifically, the K (key) and V (value) tensors at each layer for each previous token — are deterministic functions of the input tokens and can be cached. Without KV caching, generation is O(N²) in sequence length; with KV caching, the per-token cost during decoding drops to O(N). Every modern serving stack (vLLM, TGI, SGLang, TensorRT-LLM) caches KV state for the lifetime of a single request as a matter of course.

The more interesting move is reusing KV state *across* requests. If two requests share a long prefix — typically the system prompt, tool definitions, retrieved documents, and conversation history through turn N — the K and V tensors over that prefix are byte-identical. Caching them in GPU memory (or, with offloading, in CPU RAM or SSD) and reusing them on the next request that shares the prefix collapses the prefill cost. RadixAttention (Zheng et al. 2023, SGLang) was an early influential implementation: it keeps the KV cache in GPU memory after a request finishes and indexes it by a radix tree keyed on token sequences, so that a new request can match the longest cached prefix in O(prefix length) and skip prefilling those tokens entirely. vLLM shipped automatic prefix caching shortly after.

The economics are large. For typical agent workloads, the prefix (system prompt + tools + project context + retrieved docs + history) is 10×–100× longer than the per-turn user message. If you can cache that prefix, you turn the dominant cost (prefill) into nearly-free reuse and pay full price only for the short new tail.

### Anthropic prompt caching

Anthropic shipped prompt caching as a public-beta API feature on **August 14, 2024**. The interface is explicit: the caller marks a `cache_control: { type: "ephemeral" }` breakpoint in the message structure, and the API caches the prefix up to that breakpoint. Cached prefixes can include the system prompt, tool definitions, and conversation messages. The default time-to-live is **5 minutes**, refreshed on each cache hit; an extended **1-hour TTL** was added shortly after launch (announced May 2025) for long-running agent workflows.

The pricing structure is the load-bearing part:

- Cache write (the first request that establishes a cache entry): 1.25× the standard input-token price for the 5-minute TTL, 2× for the 1-hour TTL.
- Cache read (a subsequent request within the TTL that hits the cache): 0.1× the standard input-token price — a **90% discount** on cached tokens.

The implication is that if you reuse a cached prefix more than once or twice, you come out ahead, and at typical agent reuse rates (many turns within a session, many sessions reading the same project context) the savings approach 90% on prefix tokens. Anthropic also reports up to 85% latency reduction for long prompts: in their launch example, a 100K-token book context dropped from 11.5s to 2.4s on the second request.

OpenAI, Google (Gemini), AWS Bedrock, and Vertex AI shipped equivalents through 2024–2025; OpenAI's variant is automatic rather than explicit (the API caches transparently and bills cached tokens at a discount), Google's is explicit and similar to Anthropic's. The OpenRouter aggregator normalizes across providers.

### Prefix-cache-stable composition

Prompt caching is not a feature you turn on. It is an **architectural discipline** that the entire prompt-construction pipeline has to honor. The rule is brutal: **anything that mutates upstream of a cache breakpoint invalidates the cache from that point onward**. If you inject the current timestamp into the system prompt, you get zero cache hits. If you re-order tool definitions between turns, you get zero cache hits. If you swap models mid-session, you get zero cache hits.

The discipline that emerged across Anthropic, OpenAI, and the agent-CLI ecosystem (Claude Code, Codex CLI, opencode, etc.) is what we'll call **prefix-cache-stable composition**:

1. Construct the prompt as `[static prefix] + [dynamic tail]`.
2. The static prefix contains: the system prompt, tool definitions, project context files (CLAUDE.md, AGENTS.md), skill metadata, retrieved documents, and conversation history through the last completed turn.
3. The dynamic tail contains: the current user message and anything that legitimately needs to be fresh (current time, current cursor position).
4. Never mutate the static prefix to update state. If you want to inject a reminder mid-session, append it to the next user message; do not splice it into the system prompt.
5. Order matters. Within the prefix, the most stable content goes first (system prompt, tools), then less stable (project context), then least stable (conversation history). This maximizes the length of the prefix that remains valid as you add turns.

One widely-cited deployment moved dynamic content (messaging metadata, group-chat context, inline buttons) out of the prefix and into the per-message tail, taking cache hit rates from 7% to 74% with no other changes.

Claude Code's published behavior here is illustrative: rather than editing the system prompt mid-session to "remind" the model of new constraints, Claude Code appends a `<system-reminder>` tag inside the next user message, preserving the cacheable prefix intact. This is now a near-universal pattern in the agent-CLI ecosystem.

A subtler corollary: tool-set changes are also cache-invalidating. If you add or remove MCP servers mid-session, or if your agent dynamically enables/disables tools based on context, you re-tokenize the tool-definition block in the prefix and lose the cache. The mitigation is to declare the maximum tool set up front and let the model decide which to invoke, rather than narrowing the tool set per turn. This pushes some complexity onto the model (it sees more tools than it might need) in exchange for keeping the prefix stable. Most production agent CLIs make this tradeoff.

## Capability packages — Skills

### Anthropic Claude Skills

Anthropic shipped **Agent Skills** on **October 16, 2025** with the engineering post "Equipping agents for the real world with Agent Skills" and a set of initial Anthropic-authored skills covering `docx`, `pdf`, `pptx`, `xlsx`, `algorithmic-art`, `canvas-design`, and others (Anthropic 2025). The launch was for Claude Code and the Claude API; the format was published as a portable artifact from day one.

A Skill is a directory containing a `SKILL.md` file plus optional bundled resources. The `SKILL.md` file is a Markdown document with YAML frontmatter; the frontmatter requires (at minimum) `name` and `description` fields. The body is free-form instructions. The directory can contain anything else the skill needs: scripts, reference documents, templates, asset files.

```
my-skill/
├── SKILL.md          # required: frontmatter + instructions
├── scripts/          # optional: code the skill can execute
├── references/       # optional: docs loaded on demand
└── assets/           # optional: templates, images, etc.
```

The frontmatter looks like:

```markdown
---
name: pdf
description: Use this skill whenever the user wants to do anything with PDF files...
---

# Instructions
...
```

### Progressive disclosure — the load-bearing innovation

The crucial design decision is **progressive disclosure**, the three-stage loading model that makes Skills scale:

1. **Discovery**. At startup, the agent loads only the `name` and `description` of every installed skill into its system prompt. This is roughly 50–100 tokens per skill. With this metadata, the model can decide *whether* a skill is relevant to the current task without ever loading its body.
2. **Activation**. When the model decides a skill is relevant, it invokes a `read` tool (or the harness reads on the model's behalf) that loads the full `SKILL.md` body into context. This is where the detailed instructions, tool-use patterns, and gotchas live.
3. **Execution**. From the body, the skill may reference auxiliary files (scripts, reference docs); these are read on demand only if the model decides it needs them.

Why this matters: the alternative — load everything at startup — quickly blows the context window. With 30 installed skills averaging 2,000 tokens each, eager loading costs 60K tokens of context before the user has typed anything. With progressive disclosure, the same 30 skills cost ~3K tokens of metadata, and only the one or two that are actually needed for a given task are paid for in full. This is the same pattern as lazy module loading in programming languages, transposed to context windows.

It also matches the prefix-cache-stable discipline. The static metadata block sits in the prefix and caches forever. The on-demand body loads are deterministic functions of the conversation, so they cache too once read. Adding a new skill to the library doesn't invalidate any existing cache entry because it doesn't touch the prefix of any session that wasn't going to load it anyway.

### agentskills.io — the open standard

On **December 18, 2025**, Anthropic published the Skills format as an open standard at **agentskills.io**, with the specification and a reference SDK hosted at `github.com/agentskills/agentskills`. The launch was framed as opening up an Anthropic-developed format to the broader ecosystem rather than as a multi-vendor co-design (cf. MCP, which had a similar trajectory but was open-source from day one).

To be candid about the governance: agentskills.io is Anthropic-stewarded. The repository organization is `agentskills/`, the format was designed inside Anthropic, and Anthropic is the de facto editor of the spec. That said, the format is genuinely portable — `SKILL.md` files work unchanged across implementations — and adoption has been broad. The launch carousel at agentskills.io lists Junie (JetBrains), Gemini CLI (Google), OpenCode, OpenHands, Cursor, Amp, Letta, Goose (Block), GitHub Copilot, VS Code (Microsoft), Claude Code, OpenAI Codex, Factory, pi, Databricks Genie Code, Roo Code, Kiro, Mistral Vibe, Snowflake Cortex Code, and roughly twenty more as adopters. That isn't a co-designed standard but it is a real cross-product format. The pattern is closer to "Markdown" (one author, but the format is text, so adoption is frictionless) than to "HTTP" (multi-party design from the start).

The 2026 reality is that `SKILL.md` is the **portable capability artifact**. A skill written for Claude Code runs on Codex, on Cursor, on Goose, on OpenCode. The format is the smallest possible interoperability surface — frontmatter + Markdown + a folder of optional files — and that minimalism is exactly why it spread.

### Skills versus tools versus MCP servers

A common point of confusion in 2025–2026 was: skills, tools, and MCP servers all extend an agent's capability surface — when do you use which? The pragmatic distinctions:

- A **tool** (in the MCP or API-function sense) is a single function call with structured input/output. The agent decides to invoke it, the host executes it, the result comes back as a JSON blob. Tools are good for atomic operations: "search GitHub issues with this query", "run this SQL".
- An **MCP server** is a collection of tools (plus optional resources and prompt templates) that travel together as a unit. It is the deployment artifact for a related group of tools. Good for: "everything you can do with our SaaS API", "everything you can do against a Postgres database".
- A **skill** is *procedural knowledge*: a Markdown document that tells the agent how to perform a multi-step task, optionally bundling scripts and reference materials. It is loaded into the model's context rather than being invoked as a function. Good for: "here is how to write a good Notion meeting summary", "here is the firm's PDF-redaction procedure with the scripts that do the work".

Skills frequently call tools. The pdf skill, for example, ships with Python scripts the agent shells out to (via the bash tool); it doesn't reimplement PDF parsing in Markdown. The composition is: skill = a body of instructions + the right set of tool calls. MCP is the substrate; skills are the instruction layer on top.

## Project context conventions

A separate but adjacent convention emerged: how an agent picks up project-specific instructions automatically when it's launched in a project directory.

### `.cursorrules` — the predecessor

Cursor was the first to standardize on a single-file convention. A `.cursorrules` file at the project root, plain text or Markdown, was loaded into the system prompt whenever Cursor opened the project. The file typically contained: coding standards, framework conventions, architectural rules, testing preferences, "don't do X" warnings. The flat, single-file design was simple and worked well for small-to-medium projects; it scaled poorly to monorepos and didn't compose across multiple categories of rule.

Cursor evolved past it. The modern Cursor convention is `.cursor/rules/*.mdc` — multiple rule files, each with YAML frontmatter that controls when the rule activates (always, on-glob-match, on-explicit-invocation), supporting per-language and per-directory specialization. `.cursorrules` is still supported but deprecated in favor of either `.cursor/rules/` or `AGENTS.md`.

### `CLAUDE.md` — Claude Code's name

When Claude Code shipped in early 2025, it adopted the same single-file pattern but used its own name: `CLAUDE.md`. The file lives at the repository root (or in subdirectories, with nesting), is automatically loaded into the system prompt at session start, and is the conventional home for: project-specific bash commands, test commands, code-style guidelines, repository conventions, and warnings about gotchas. The `/init` slash-command in Claude Code generates a starter `CLAUDE.md` by analyzing the project structure.

The convention is "less is more". Every token in `CLAUDE.md` consumes context window space on every turn; the guidance Anthropic publishes is to keep it short, human-readable, and focused on facts the agent would otherwise have to discover through trial and error.

### `AGENTS.md` — the convergent universal convention

By mid-2025 every major agent CLI had its own name for the same file: `CLAUDE.md`, `.cursorrules`, `.windsurfrules`, `.codexrules`, `.geminirules`, and so on. OpenAI's Codex CLI broke the impasse: it adopted **`AGENTS.md`** as a vendor-neutral name and shipped the most sophisticated discovery process, walking from the project root (typically the Git root) down to the current working directory and loading every `AGENTS.md` encountered along the path. OpenAI also accepted overrides via `AGENTS.override.md`.

The convention spread quickly. Through late 2025 and into 2026, Amp, Roo Code, Factory, Ona, Aider, Devin, Jules (Google), and others adopted `AGENTS.md` as either the primary name or an accepted alternative. The format itself is intentionally trivial: plain Markdown, no frontmatter, no schema. The discovery rule is the only thing standardized: walk from the project root toward the current working directory; closer files take precedence; load all of them.

In **late 2025**, `AGENTS.md` was donated to the **Linux Foundation** under the newly-established **Agentic AI Foundation** (the same foundation that received MCP). The site `agents.md` reports adoption across roughly 60,000 open-source projects and lists 20+ agent CLIs that honor it as of early 2026. Claude Code added `AGENTS.md` support alongside `CLAUDE.md` (each agent reads its own preferred name first, then falls back to `AGENTS.md`).

The practical state of affairs in 2026 is: a project usually has one of `AGENTS.md` or `CLAUDE.md` (or both, often with one being a symlink to the other), and any modern agent will pick up the project-specific context automatically. The walk-from-cwd discovery rule is the de facto standard.

There is a deliberate symmetry with how Git itself works. Git walks upward from `cwd` looking for `.git`; the agent walks upward from `cwd` looking for `AGENTS.md`. The convention reuses an established mental model from version control rather than inventing a new one. Where Git's discovery is for "what repository am I in?", the agent's discovery is for "what does this project want me to know?" — both rooted at the same point and using the same path-walk algorithm.

The other distinction worth noting: `AGENTS.md` is static project context that humans author for agents to read. It is not the same as `MEMORY.md`, which is dynamic state the agent writes to and re-reads across sessions. The two coexist in mature setups: `AGENTS.md` is committed to the repo, version-controlled, code-reviewed; `MEMORY.md` lives in a per-user / per-machine directory (`~/.claude/projects/<project>/memory/`) and is the agent's own scratchpad. Confusing the two leaks per-user state into the repo or, worse, drops project conventions when the user reinstalls.

## Cross-vendor protocols

Two protocols arrived in 2024–2025 that made cross-vendor composition of agents and tools genuinely practical. They occupy different layers: MCP is for connecting agents to tools and data sources; ACP is for connecting agents to editors. Both are JSON-RPC-over-stdio by default. Both explicitly cite LSP (the Language Server Protocol) as a design inspiration.

### MCP — Model Context Protocol

Anthropic announced MCP on **November 25, 2024**, open-sourcing the spec, the TypeScript and Python SDKs, and a handful of reference servers (Google Drive, Slack, GitHub, Git, Postgres, Puppeteer). The authors at Anthropic were David Soria Parra and Justin Spahr-Summers. The spec is hosted at `modelcontextprotocol.io`; the canonical reference is the JSON-RPC-2.0 schema at `github.com/modelcontextprotocol/specification`.

**Architecture**. MCP is a three-role protocol:

- A **host** is an LLM application (Claude Desktop, Cursor, Claude Code, etc.).
- A **client** is a connector inside the host that speaks MCP to one server.
- A **server** is a process that exposes tools, prompts, and resources over MCP.

A single host typically runs many clients, each talking to a different server. The host is responsible for routing tool calls from the model to the right server.

**Transports**. The original release supported stdio (the host spawns the server as a subprocess and exchanges newline-delimited JSON-RPC messages over stdin/stdout) for local servers, and HTTP with Server-Sent Events for remote servers. The June 2025 spec update introduced **streamable HTTP** as the preferred remote transport, replacing the older HTTP+SSE pattern, and added OAuth-based authorization for remote servers. The November 2025 spec is the latest stable version.

**Server features (exposed to clients)**:
- **Tools**: function-style entry points the model can invoke. Each tool has a name, JSON-schema input, and returns a JSON result. This is the workhorse primitive.
- **Resources**: read-only data the model or user can attach to context (files, database rows, search results). Resources have URIs and content types.
- **Prompts**: server-templated message sequences, addressable by name and parameterized — effectively reusable prompt templates exposed as first-class objects.

**Client features (exposed to servers)**:
- **Sampling**: a server can ask the host's LLM to perform a generation on its behalf. This enables recursive agentic behavior (server-orchestrated LLM workflows).
- **Roots**: the server can ask the host for the filesystem/URI boundaries it's allowed to operate within.
- **Elicitation**: a server can request additional information from the user mid-flow.

**Why it took off**. Three reasons. First, the timing was right: every agent vendor was independently building one-off integrations to GitHub, Slack, Postgres, and the like, and MCP shipped reference servers for the obvious set on day one. Second, the stdio-subprocess transport is dead simple — you can write an MCP server in 50 lines of Python and run it locally without any infrastructure. Third, Anthropic open-sourced everything (spec, SDKs, reference servers) under permissive licenses and committed to multi-vendor governance early.

**Adoption**. By April 2025 OpenAI had publicly adopted MCP across ChatGPT and its agent stack; Google DeepMind announced support shortly after; Microsoft integrated MCP into Semantic Kernel and Azure OpenAI; Cloudflare, Replit, and Sourcegraph all shipped MCP support through 2025. By the time Cursor, Claude Code, opencode, Goose, and the long tail of agent CLIs all spoke MCP natively, it had become the standard way to expose external capabilities to an agent. In **December 2025**, Anthropic donated MCP to the newly-formed **Agentic AI Foundation** (a Linux Foundation directed fund), co-founded by Anthropic, Block, and OpenAI. The first MCP Dev Summit drew ~1,200 attendees in April 2026.

**Critique and tradeoffs**. MCP took off fast and the security posture lagged. The most-cited complaints:

- **Authentication was an afterthought**. The original spec had no opinion on authn; stdio servers ran as full-trust subprocesses, and remote servers were on their own. A widely-discussed July 2025 scan of ~2,000 internet-exposed MCP servers found that essentially none implemented authentication. The June 2025 spec update added OAuth 2.1 for remote servers (with resource indicators to prevent token confusion), but the ecosystem is uneven.
- **Tool-poisoning and prompt-injection risk is structural**. The tool description is part of the system prompt and is therefore directly attended to by the model. A malicious MCP server can inject prompt-injection payloads via its tool descriptions, including hidden instructions only the model sees. This is not a flaw in MCP per se but it is a flaw in the trust model that the spec only mitigates with "tool descriptions from untrusted servers should be treated with caution".
- **Server quality varies wildly**. A June 2025 study of MCP servers in the wild found ~66% with code smells and ~14% with bug patterns; command-injection vulnerabilities in the reference and community servers were common in 2025.
- **The "S in MCP stands for Security" joke** circulated through 2025 as a critique of the protocol's design priorities.
- **Token-aggregation risk**. An MCP server typically holds long-lived credentials for several services (a GitHub MCP server holds your GitHub token, a Postgres MCP server holds DB credentials, etc.). Compromise of one MCP server's host yields access to all the integrated services.

The protocol's defenders argue (correctly) that MCP cannot enforce security at the protocol layer for the same reason HTTP cannot — it is a transport, and security has to live in the implementations. The 2025–2026 trajectory has been steady improvement of the spec's recommendations and the reference implementations, but the structural issues remain.

The other often-voiced critique is more about the deployment model than the spec: stdio MCP servers run as full-trust subprocesses of the host, with the user's filesystem access, network access, and environment variables. There is no sandbox by default. This is fine for code you wrote; it is dicey for arbitrary npm-published or PyPI-published MCP servers. Several projects (Cloudflare Workers MCP, Anthropic's own sandboxed-MCP work in 2026) have proposed running MCP servers in WASM or container sandboxes by default, but as of 2026 the install-and-run-with-full-privileges model is still the norm.

### ACP — Agent Client Protocol

ACP was announced by **Zed Industries** on **August 27, 2025**, originally to enable Google's Gemini CLI to plug into the Zed editor as a first-class agent. The spec is at `agentclientprotocol.com`; the canonical reference implementation is in Rust as part of the Zed codebase, with Python and TypeScript SDKs published by Zed.

**Architecture**. ACP standardizes the editor-agent interface in the same way LSP standardized the editor-language-server interface. The editor is the **client**; the agent is the **server**. The editor spawns the agent as a subprocess and they exchange JSON-RPC 2.0 messages bidirectionally over stdio (stdin/stdout, newline-delimited NDJSON). A remote/HTTP transport was work-in-progress through late 2025.

The role mapping is the obvious analogue of LSP:

| LSP | ACP |
|---|---|
| Editor | Editor |
| Language server | Coding agent |
| Document state | Project state |
| Code actions / completions | Agent turns |
| Diagnostics | Streamed agent thoughts/diffs |

**Why it matters**. Before ACP, every "agent in an IDE" integration was bespoke: Cursor wrote a custom integration with their backend, Continue.dev wrote a different one, Zed wrote a third. With ACP, an editor that speaks ACP can connect to any ACP-compliant agent; an agent that speaks ACP can be run inside any ACP-compliant editor. The promise is the LSP promise: N×M custom integrations collapse to N + M.

**Adoption**. The ACP ecosystem grew faster than expected through late 2025 and 2026. Editors/clients: Zed, Neovim, a VS Code extension (`formulahendry.acp-client`), Kiro, JetBrains Junie (in progress). Agents/servers: Claude Code, OpenAI Codex CLI, Gemini CLI, OpenCode, OpenClaw, Hermes Agent (NousResearch), Cline, OpenHands, Goose, Mistral Vibe, Augment Code, Cursor (as a server when run as the agent backend), Pi, Qwen Code, and Docker's `cagent`. The agentclientprotocol.com gallery lists 30+ agents as of 2026.

**Relationship to MCP**. The two protocols are complementary, not competing. MCP connects an agent to external tools/data. ACP connects an editor to an agent. A typical 2026 setup is: Zed (editor) speaks ACP to Claude Code (agent), and Claude Code speaks MCP to a GitHub MCP server, a Postgres MCP server, and a project-specific MCP server. Three protocols in the stack — LSP at the editor/language-server boundary, ACP at the editor/agent boundary, MCP at the agent/tool boundary — each minimal, each composable.

**Governance**. ACP is governed by Zed Industries with an open spec and an open issue tracker. There is no Linux-Foundation-style donation as of 2026, and the protocol's evolution is steered by Zed engineers in consultation with adopters. This is closer to the early MCP model (single-vendor steward, open spec) than the post-donation MCP model (multi-vendor foundation). Whether ACP follows MCP into foundation governance is an open question for 2026–2027.

**Streaming and the "agent turn" abstraction**. The piece of ACP that isn't obvious from a quick reading is its streaming model. Unlike MCP tool calls — which are request/response — an ACP "agent turn" is a long-running, streamed exchange. The editor sends a user message; the agent streams back interleaved thoughts, tool calls (which the editor may resolve and feed back), file diffs, and the final response. The editor renders this stream incrementally so the user sees the agent's progress in real time. This is what makes ACP feel like a native part of the editor rather than a chat plugin: the agent's intermediate state is first-class UI data, not opaque blackbox output.

## Memory architectures

The frontier through 2024–2026 was extending context across sessions. Standard chat APIs are stateless: you replay the conversation on every turn. That works fine within a session and breaks down across sessions. The memory architectures below try to solve "the agent should remember what it learned yesterday without your having to re-explain it." They fall into four classes.

### File-backed memory (MEMORY.md and friends)

The simplest approach: the agent writes notes to a file, and the file is loaded back into context on the next session. This is what `CLAUDE.md` and `AGENTS.md` already do for static project context; `MEMORY.md` extends the pattern to dynamic learned memory.

Claude Code's published convention is to keep a per-project memory directory at `~/.claude/projects/<project>/memory/` containing a `MEMORY.md` index file (kept under 200 lines because that's the cutoff for what loads at startup) plus topic files for detailed notes. The index is loaded into the system prompt eagerly; topic files are read on demand.

The virtues of file-backed memory are that it is human-readable, version-controllable, and trivially auditable — you can `cat MEMORY.md` and see what the agent thinks it knows. The vices are that it doesn't scale beyond a few thousand tokens, and it has no semantic retrieval — the agent has to read the whole index to find anything.

### Vector-backed memory

Vector-backed memory systems treat memory as a corpus to be RAG'd against. The agent writes interactions, summaries, and learned facts into a vector store; on each turn, semantically relevant memories are retrieved and injected into context.

**Mem0** (open-source, mem0ai, paper Mem0 et al. 2025, arXiv 2504.19413) is a memory layer built on top of any vector DB. It extracts memories passively: when you call `add()` with a conversation, an extraction pipeline decides what facts to store, deduplicates against existing memories, and indexes them. Retrieval combines semantic (vector), keyword (BM25), and entity-based signals. The published benchmark numbers report ~26% relative improvement over the OpenAI memory baseline on a long-conversation evaluation.

**Letta** (formerly **MemGPT**, Packer et al. 2023, arXiv 2310.08560) is the agent-runtime descendant of the original MemGPT paper. MemGPT's framing was "LLMs as operating systems": treat the context window as RAM, treat external storage as disk, and have the agent itself manage memory transfers via tool calls. Letta is the productized version — an agent runtime where every agent has a managed memory hierarchy (core memory always in context, recall memory pulled by search, archival memory stored externally) and the agent self-edits its memory by calling memory functions during its reasoning loop. The tradeoff vs. Mem0 is intelligence-vs-predictability: Letta agents reason about what's worth remembering, which is more adaptive but more variable; Mem0 extracts memories with a fixed pipeline, which is more predictable but less adaptive.

**Honcho** (Plastic Labs, open-source) is a memory infrastructure focused on **user modeling**. Honcho stores per-user state and exposes a **Dialectic API**: rather than retrieving raw memories, you ask Honcho a natural-language question about the user ("how does this user typically respond to detailed technical answers?") and Honcho's own LLM synthesizes the response from stored interactions. This is qualitatively different from the others — Honcho is less about "remember this fact" and more about "build a coherent model of this person over time." Hermes Agent uses Honcho as an optional fourth memory layer specifically for the user-modeling role.

### Learned memory (auto-skills, dream consolidation)

The most recent class of memory architectures collapses memory into the same artifact as capability. Instead of storing memories separately, the agent writes new **skills** when it learns something worth keeping. The artifact is the same `SKILL.md` format as the static capability packages — but the agent itself is the author.

Claude Code's **Auto Dream / AutoDream** feature (rolled out in early 2026 to Claude Code) implements a four-phase memory consolidation pass that runs automatically during idle periods (specifically, on the first session after a 24-hour gap):

1. **Orient**: read the current memory directory to understand what exists.
2. **Gather**: scan recent session transcripts and extract new information worth persisting.
3. **Evolve**: merge new information into existing topic files; resolve contradictions; promote frequently-referenced facts.
4. **Index**: regenerate `MEMORY.md` to reflect the current state — removing pointers to deleted topic files, adding pointers to new ones.

The explicit metaphor is sleep-driven memory consolidation: working memory accumulates noise during active sessions, and a background pass cleans it up. The community-maintained `dream-skill` package reproduces the feature for any Claude Code installation as `/dream`.

The **auto-skill creation** side of the same pattern: when the agent solves a complex task that took many steps and pattern-matching across files, it writes the procedure as a new skill. The next time the same task type comes up, the skill is loaded via progressive disclosure and the agent doesn't have to re-derive the procedure. Hermes Agent makes this explicit as its second memory layer: "autonomous skill creation after complex tasks, and skills that self-improve during use".

### Layered architectures (Hermes Agent's four-layer)

The most-developed memory architecture in the open-source ecosystem as of 2026 is **Hermes Agent**'s (NousResearch) four-layer design:

1. **Agent-curated memory**. The agent writes and edits MEMORY-style files with periodic nudges from the harness. File-backed, human-readable.
2. **Skill creation and improvement**. Autonomous skill authorship after complex tasks; skills evolve based on usage.
3. **Session search and cross-session recall**. SQLite FTS5 full-text search over historical session transcripts, with LLM-driven summarization for retrieval. Lets the agent answer "what did we discuss last Tuesday?"
4. **Honcho dialectic user modeling**. Optional fourth layer using Plastic Labs' Honcho for long-term user modeling — only worth its cost for daily-driver personal-assistant use, less relevant for task-specific automation.

The architecture is **cache-aware** by construction: each layer is structured so that the bulk of the loaded context sits in the prefix-cacheable region of the prompt, and only the most recently-modified shards invalidate caches. This is the explicit design constraint — extending memory cannot be allowed to balloon the per-turn token bill — and it is what distinguishes a production memory architecture from a research demo.

### Open problems in agent memory

As of 2026 the field still has several unsolved problems that no current memory system handles well:

- **Forgetting**. None of the major systems implement principled forgetting. Memory monotonically accumulates; dream consolidation can prune obviously-stale facts but is conservative by design. Long-running deployments accumulate noise.
- **Contradictions**. When a new fact contradicts an old fact, the agent has to decide which to keep. Letta's self-editing approach defers this to the model's reasoning; Mem0's pipeline uses heuristics; AutoDream's "evolve" phase uses an LLM judge. None of these are reliably correct, and the failure mode (silently keeping the wrong fact) is hard to detect.
- **Cross-user privacy**. A memory system that learns from one user must not leak that learning to another user. Most current systems are single-user by design; multi-user deployments (shared assistants, shared agent CLIs in a team) are an active research area.
- **Evaluation**. There is no consensus benchmark for "did the agent remember the right things?" — most published numbers are on synthetic long-conversation evaluations that don't capture the structure of real long-term memory.
- **Memory portability**. A `MEMORY.md` file is portable across Claude Code instances on the same project; a vector-backed Mem0 store is not portable across agent frameworks; a learned skill is portable as a SKILL.md but loses the agent's full state. There is no equivalent of "git push your memory."

These are the questions Tier 8 (agent architectures) and beyond will have to answer.

## What modern agents inherit

By 2026, every serious agent stack assumes the following as given:

- **MCP as the tool/resource bridge.** New tool integrations are built as MCP servers; new agents add MCP-client support on day one. The agent-tool boundary is no longer custom code.
- **ACP as the IDE-agent bridge.** New editors add ACP support to inherit the agent ecosystem; new agents add ACP support to inherit the editor ecosystem. The agent-editor boundary is no longer custom code either.
- **`SKILL.md` as the portable capability artifact.** A skill written for one agent runs across the others. The format's minimalism (Markdown + frontmatter + folder) is the reason.
- **`AGENTS.md` walks as the project-context convention.** Walk from project root toward cwd, load every `AGENTS.md` (or `CLAUDE.md`) found, prepend to system prompt. Universal across the major CLIs.
- **Prefix-cache-stable composition as a hard architectural rule.** Construct prompts as static prefix + dynamic tail. Never mutate the prefix to update state. Append reminders to the next user message instead. Cache the prefix; pay full price only for the tail.
- **Hybrid retrieval + reranker as the default RAG stack.** BM25 + dense → fuse with RRF → rerank with a cross-encoder → top-K into the prompt. The single-shot dense-retrieval baseline is mostly historical.
- **Progressive disclosure as the context-management discipline.** Load metadata eagerly; load bodies on demand; load referenced files only when needed. Never eager-load anything that might not be used.
- **A memory layer of some kind.** File-backed for simple agents, vector-backed for production assistants, learned-skill / dream-consolidation for the frontier. The stateless-conversation baseline is no longer competitive for any agent that runs for more than a single session.

Tier 8 — agent architectures — treats this entire layer as the substrate. The interesting design questions there are about loops, tool budgets, sub-agent orchestration, and process management; the context layer is no longer where the differentiation happens.

## Citations

Primary papers and announcements:

- Lewis, P. et al. (2020). "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks." arXiv 2005.11401. https://arxiv.org/abs/2005.11401
- Packer, C. et al. (2023). "MemGPT: Towards LLMs as Operating Systems." arXiv 2310.08560. https://arxiv.org/abs/2310.08560
- Mem0 (2025). "Mem0: Building Production-Ready AI Agents with Scalable Long-Term Memory." arXiv 2504.19413. https://arxiv.org/abs/2504.19413
- Anthropic (2024). "Prompt caching with Claude." https://platform.claude.com/docs/en/build-with-claude/prompt-caching
- Anthropic (2024). "Introducing the Model Context Protocol." https://www.anthropic.com/news/model-context-protocol
- Anthropic (2025). "Equipping agents for the real world with Agent Skills." https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- Anthropic (2025). "Donating the Model Context Protocol and establishing the Agentic AI Foundation." https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation

Specifications and standards:

- Model Context Protocol specification. https://modelcontextprotocol.io/specification/2025-11-25
- Agent Client Protocol — Introduction. https://agentclientprotocol.com/get-started/introduction
- Zed — Agent Client Protocol. https://zed.dev/acp
- Agent Skills — agentskills.io. https://agentskills.io/home
- agentskills GitHub organization. https://github.com/agentskills/agentskills
- AGENTS.md. https://agents.md/
- OpenAI Codex — AGENTS.md guide. https://developers.openai.com/codex/guides/agents-md
- Cursor — Rules documentation. https://cursor.com/docs/rules
- Claude Code best practices (CLAUDE.md). https://www.anthropic.com/engineering/claude-code-best-practices
- Anthropic — Using CLAUDE.md files. https://claude.com/blog/using-claude-md-files

Implementations and tooling:

- vLLM — Automatic Prefix Caching. https://docs.vllm.ai/en/stable/design/prefix_caching/
- BentoML — Prefix caching guide. https://bentoml.com/llm/inference-optimization/prefix-caching
- Mem0 (mem0ai). https://github.com/mem0ai/mem0
- Letta (formerly MemGPT). https://research.memgpt.ai/
- Honcho (Plastic Labs). https://github.com/plastic-labs/honcho
- Hermes Agent (NousResearch). https://github.com/nousresearch/hermes-agent
- Hermes Agent architecture docs. https://hermes-agent.nousresearch.com/docs/developer-guide/architecture
- Claude Code AutoDream / dream-skill. https://github.com/grandamenium/dream-skill

Vector databases and embeddings:

- Pinecone. https://www.pinecone.io/
- Weaviate. https://weaviate.io/
- Qdrant. https://qdrant.tech/
- Chroma. https://www.trychroma.com/
- Milvus / Zilliz. https://milvus.io/
- OpenAI text-embedding-3. https://platform.openai.com/docs/guides/embeddings
- Cohere embed and rerank. https://cohere.com/embed
- Voyage AI. https://www.voyageai.com/
- BGE (BAAI). https://huggingface.co/BAAI/bge-m3
- Nomic Embed. https://www.nomic.ai/blog/posts/nomic-embed-text-v1

MCP critique and security:

- Pillar Security — The Security Risks of MCP. https://www.pillar.security/blog/the-security-risks-of-model-context-protocol-mcp
- Red Hat — MCP security risks and controls. https://www.redhat.com/en/blog/model-context-protocol-mcp-understanding-security-risks-and-controls
- "Model Context Protocol (MCP) at First Glance: Studying the Security and Maintainability of MCP Servers." arXiv 2506.13538. https://arxiv.org/abs/2506.13538
- Wikipedia — Model Context Protocol. https://en.wikipedia.org/wiki/Model_Context_Protocol
- Auth0 — MCP June 2025 spec update (authorization). https://auth0.com/blog/mcp-specs-update-all-about-auth/

Prompt caching and prefix discipline:

- Anthropic prompt caching (Grokipedia summary). https://grokipedia.com/page/Prompt_caching_Anthropic
- "How prompt caching works — Paged Attention and Automatic Prefix Caching." https://sankalp.bearblog.dev/how-prompt-caching-works/
- ProjectDiscovery — How we cut LLM costs by 59% with prompt caching. https://projectdiscovery.io/blog/how-we-cut-llm-cost-with-prompt-caching
