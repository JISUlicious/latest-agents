# Tier 5 — Orchestration Frameworks

## Overview

Tier 5 covers the period (roughly late 2022 through 2024) in which "the agent loop" stopped being a research curiosity and became a first-class construct in industry software. The trajectory runs from prompt chaining as an emerging design pattern, through the late-2022 launches of `LangChain` and `LlamaIndex`, through the viral spring 2023 moment of `AutoGPT` and `BabyAGI`, and into the multi-agent frameworks that arrived later that year (`AutoGen`, `MetaGPT`) and in 2024 (`CrewAI`). By mid-2023 the shape `while (true) { call model; run tools }` was culturally legible, and by late 2024 Anthropic's `MCP` arrived as a post-framework standardization move on the integration layer. This tier is where the agent loop became something engineers reach for by default, with all the productivity and disillusionment that implies.

## Prompt chaining as a design pattern

Before the wave of frameworks, the practice came first: take the output of one LLM call and use it as the input (or part of the input) to the next. This is the simplest "compositional" move available to an LLM developer, and it preceded any of the named frameworks below.

The pattern was discovered empirically by people building with GPT-3 in 2021-2022. By the time ChatGPT shipped in November 2022, several writeups had begun codifying it. Eugene Yan's "Patterns for Building LLM-based Systems & Products" (Yan 2023) is one of the canonical mid-2023 distillations — covering evals, RAG, fine-tuning, caching, guardrails, and defensive UX, with chaining baked into the framing rather than called out as its own pattern. The "Prompt Engineering Guide" (Saravia 2023) explicitly named **prompt chaining** as one of the core techniques, distinct from few-shot, chain-of-thought, and self-consistency.

What "prompt chaining" actually means in practice:

- **Sequential composition.** Step 1's LLM output becomes (part of) step 2's prompt. Useful when a task has natural sub-steps: "extract entities → classify them → generate report."
- **Branching.** Step 1's output routes which prompt runs next. Closer to a control-flow construct than a pipeline.
- **Self-critique / refinement.** A second LLM call critiques or rewrites the first's output. The pattern that later showed up as Reflexion / self-refine in the research literature (Tier 3).

Two later writeups codify the lessons. Dex Horthy's "12-Factor Agents" (Horthy 2025), modeled on Heroku's 12-Factor App methodology, distilled what production teams had learned by 2024-2025: own your prompts, own your context window, treat tools as structured outputs, make your agent a stateless reducer, and so on. Horthy's central observation was that production AI products are "mostly just software" with LLM steps placed carefully, not autonomous agents looping over a vague objective (Horthy 2025). The "What We Learned from a Year of Building with LLMs" essay (Yan et al. 2024, O'Reilly) makes a similar argument with different vocabulary.

The throughline: chaining was the first "agent-like" pattern, but it is much weaker than a true agent loop because it has no decision point about *whether to keep going*. That step — letting the model itself decide whether the loop continues — is what `ReAct` and then `AutoGPT` added on top.

A useful way to draw the boundary: prompt chaining is a *developer-authored* control flow with LLM calls at the nodes; the agent loop is a *model-authored* control flow with deterministic code at the nodes. Most production "agentic" software in 2026 is closer to the first than the second — a tightly scoped chain with one or two genuinely agentic loops embedded in the right place, not a single autonomous loop wrapping everything. This is one of the under-appreciated lessons of the orchestration-framework era: the chain abstraction never really went away, it just stopped being the part anyone bragged about.

## First-wave frameworks: LangChain and LlamaIndex

### LangChain

`LangChain` was released by Harrison Chase on October 24, 2022, as an open-source Python package while Chase was working at the ML startup Robust Intelligence (Chase 2025). The first version was small — around 800 lines of Python, three LLM integrations, and three pre-built chains (LangChain 2025).

The initial scope (Chase, on Latent Space, Han 2023):

- **LLM Math Chain.** A chain that solved math problems via a REPL-in-the-loop.
- **Self-Ask with Search.** An agent pattern that interleaved reasoning with search calls.
- **NatBot.** A wrapper around Nat Friedman's browser-controlling agent.

Within a month of LangChain's release, ChatGPT shipped, and adoption took off. By February 2023 the project had around 5,000 GitHub stars; by April 2023 that had tripled to 18,000 (Contrary Research 2023). By the end of 2023 LangChain had roughly 70,000 stars and had closed a $10M seed from Benchmark, followed shortly by a Series A from Sequoia at a $200M+ valuation (Wikipedia 2026, "LangChain").

The framework crystallized around a set of named abstractions that became the de facto vocabulary for a year or two:

- **Chains** — predetermined sequences of prompts, models, and parsers. The original chain types included `LLMChain` (single LLM call with a template), `SequentialChain` (literally chained outputs), `RouterChain` (branching), and `MapReduceChain` (parallel followed by aggregation).
- **Prompts / Prompt Templates** — string templates with variable substitution and few-shot example selectors. A surprisingly load-bearing abstraction because it forced people to separate template text from variable interpolation.
- **Models** — wrappers for LLMs, chat models, and embeddings. The wrapper layer gave LangChain the ability to be model-neutral, which mattered as model options proliferated in 2023.
- **Indexes / Retrievers** — document loaders, splitters, vector stores, and retrievers (the RAG primitives).
- **Memory** — components for keeping conversation history across calls. Variants included buffer memory, summary memory, vector-store memory, and entity memory.
- **Agents** — LLMs deciding action sequences over a set of tools. The original agent types were `ZeroShotReactDescription`, `ConversationalReact`, and `ReactDocstore` — all built on the ReAct pattern.
- **Callbacks** — instrumentation hooks for logging and observability.
- **Tools** — typed wrappers around functions agents could call. Tools became their own ecosystem (search, calculators, code execution, browsers).

It is hard to overstate how dominant this vocabulary was in 2023. "Chain", "agent", and "retriever" became the standard nouns of LLM engineering largely because LangChain used them. Even people who criticized the framework adopted its naming.

**The criticism.** Starting in summer 2023, a backlash built. The recurring complaints (HN 2023; Designveloper 2024; OctoMind 2024):

- **Over-abstraction.** Critics argued the abstractions piled on top of each other — chains, runnables, agents, tools, callbacks — until simple tasks required substantial boilerplate. "Abstractions on top of abstractions" (OctoMind 2024).
- **Leaky abstractions.** When something went wrong, developers had to read LangChain's source to understand what prompt was actually sent. The lack of transparency made debugging an "archeological dig" (Designveloper 2024).
- **Unstable APIs.** Breaking changes were frequent across minor versions, and the framework's rapid expansion in integrations meant deprecation warnings appeared often.
- **Orchestration is the smallest part.** The top Hacker News critique was that orchestration is maybe 5% of an LLM application's work; the other 95% is prompt engineering and data wrangling, neither of which LangChain helped with (HN 2023).
- **Dependency bloat.** A `pip install langchain` pulled in a large dependency tree, much of which was unused for any given application.
- **Inflexibility at the boundaries.** Once a team's needs grew beyond the supported abstractions — spawning dynamic sub-agents, observing agent state mid-loop, controlling exactly which tools were available when — the framework actively obstructed the work (OctoMind 2024).

Chase took the criticism seriously and the response shaped the project's evolution (Han 2023). LangSmith (observability and evaluation, public beta in July 2023) addressed the debugging gap. LangChain Expression Language (LCEL, Q3 2023) gave a more declarative way to compose chains. And LangGraph (early 2024) was an explicit rewrite of the agent layer as a graph runtime, with the message that "LangChain is for RAG and document Q&A; LangGraph is for agents."

**Where it stands in 2026.** LangChain shipped a 1.0 release in October 2025 built on the LangGraph runtime; LangGraph hit 1.0 around the same time (ClickIT 2026). The current company positioning is roughly: LangChain as the "developer experience layer" for fast prototyping and integrations, LangGraph as the durable, stateful execution engine for production agents (LangChain 2026). LangGraph reportedly passed CrewAI in GitHub stars during early 2026, with the strongest pull in enterprises wanting audit trails and rollback points (Gurusup 2026). The criticism never fully went away — "just write the loop yourself" is still a popular take — but the LangChain ecosystem (LangSmith, LangGraph, LangServe) effectively re-platformed the project around the durability concerns that the original abstractions did not address.

It is worth recording the historical importance of LangChain separately from any verdict on the current product. For roughly 18 months — from late 2022 through mid-2024 — LangChain was the single biggest force shaping how engineers talked about LLM applications. If you read job listings, conference talks, or open-source projects in that window, you would find LangChain idioms even in code that didn't import it. The framework's specific abstractions can be debated, but the cultural standardization it produced is hard to overstate.

### LlamaIndex (originally GPT Index)

`GPT Index` was first committed by Jerry Liu on November 5, 2022 — eleven days after LangChain's first release (LlamaIndex 2023). The framing was different from LangChain's from day one: where LangChain centered on **chains** and general composition, GPT Index centered on **retrieval**. Liu's motivating problem was the context-window limit on GPT-3, and the question of how to feed external knowledge into an LLM at query time (LlamaIndex 2023).

The first version was literally a tree index — a structure for organizing a corpus into a hierarchy so the model could traverse it. Subsequent versions added more index types:

- **List Index.** A flat ordered list of nodes; queries iterate over all nodes (simple but expensive).
- **Tree Index.** A hierarchical summary tree built bottom-up; queries descend to relevant subtrees.
- **Keyword Table Index.** A keyword-to-node mapping; queries match keywords to retrieve relevant nodes.
- **Vector Store Index.** The dominant pattern by 2023: embed each chunk, store in a vector DB, retrieve by similarity. The retrieval primitive most modern RAG implementations use.

Beyond the index abstractions, LlamaIndex shipped a wide library of **data connectors** (PDF, Notion, Slack, Google Docs, web scraping, etc.), query engines, response synthesizers, and rerankers. The project was renamed to LlamaIndex in early 2023.

By November 2023 (its first birthday), LlamaIndex had ~450 open-source contributors, ~3,000 dependent projects, and 900K monthly downloads (LlamaIndex 2023). The framework became the canonical RAG starter kit and is widely used in production alongside or instead of LangChain's retrieval components.

The retrieval-first framing turned out to be the load-bearing one: LangChain's `Indexes` module was always second-class compared to its chain/agent vocabulary, while LlamaIndex stayed focused on the document-ingestion-to-query pipeline. By 2025 LlamaIndex had repositioned itself as an "agentic document processing" platform, but the core thesis — retrieval is the hard part — has held up well (LlamaIndex 2024).

The complementarity between LangChain and LlamaIndex during 2023 is worth flagging. Many production stacks used both: LlamaIndex for the document loading, splitting, indexing, and retrieval, then LangChain for the chain and agent layer that consumed retrieved context. The two projects had overlapping primitives (both shipped document loaders, both shipped vector-store wrappers) but the centers of gravity were different enough that they coexisted as much as they competed. This pattern of "narrow framework for retrieval + general framework for orchestration" continued into 2024-2025 as the dominant RAG stack.

## The viral agent moment: AutoGPT, BabyAGI

### AutoGPT

`AutoGPT` was released on March 30, 2023 by Toran Bruce Richards, founder of the game company Significant Gravitas (Wikipedia 2026, "AutoGPT"). The release was two weeks after GPT-4 became available via API, and AutoGPT was the first credibly autonomous-looking LLM application most people had seen.

The pitch: give the agent a name, a role, and an objective (with up to five sub-goals). The agent would then loop indefinitely — planning sub-tasks, browsing the web, reading and writing files on disk, calling GPT-4 to decide what to do next, and saving intermediate state to long-term memory (Wikipedia 2026, "AutoGPT"). Architecturally it was the first widely-used implementation of the pattern that crystallized later: **model + tools + memory + objective + loop.**

Adoption was instant and unprecedented. AutoGPT became the top trending repository on GitHub. The growth curve is genuinely without precedent for an open-source project. Some markers (VibeAgentMaking 2024; Wikipedia 2026, "AutoGPT"):

- **March 30, 2023** — Initial release.
- **April 12, 2023** — 30,000 GitHub stars (13 days in).
- **Late April 2023** — Crossed 100,000 stars; trending on Twitter and HN repeatedly.
- **June 2023** — Hosted demos, AutoGPT-as-a-service offerings, and "AGI is here" articles peaked.
- **October 2023** — Significant Gravitas raised $12M in venture funding.

Making AutoGPT the fastest-growing open-source project in GitHub history at the time.

**What it could actually do.** Demos showed AutoGPT doing things like:

- Researching a market segment by querying Google, opening web pages, and summarizing competitors.
- Drafting a business plan or content calendar from a high-level objective.
- Writing and debugging a Python script across multiple iterations, with the agent reading its own error output and trying again.
- Ordering pizza via a hypothetical tool (a popular demo gag that mostly did not work in practice).

Some of these demos were real and impressive; many were cherry-picked from many failed runs, which the demo videos did not show.

**What it couldn't do.** This is the part to be honest about. In practice, on real tasks beyond toy demos, AutoGPT:

- **Got stuck in loops.** With limited context window and weak memory, it would repeat failed approaches indefinitely (Wikipedia 2026, "AutoGPT").
- **Hallucinated.** Each step's output became input to the next, and errors compounded.
- **Cost a lot.** Every step was a GPT-4 call, and AutoGPT often saturated the token budget for "better reasoning." A meaningful run could cost dollars or tens of dollars (MarkTechPost 2023).
- **Was hard to supervise.** It had no good interface for a human to step in mid-loop, redirect, or branch.

The honest summary is that AutoGPT was a *demonstration* that the loop was viable, not a *product* that reliably did work. By summer 2023 the "trough of disillusionment" framing was widespread: people who had tried AutoGPT seriously came away noting how brittle and expensive autonomous loops actually were (Scholarly Kitchen 2023; FierceNetwork 2023). The eventual fix — better models, better tool APIs (function calling), better memory, better humans-in-the-loop — would arrive over the following two years.

The cultural impact, though, was enormous. AutoGPT is the moment "AI agents" went from a research-paper phrase to a noun a non-technical executive recognized.

It is also worth being honest about what the AutoGPT moment did to the field over the following 6-12 months. The hype cycle ran ahead of the actual capability, and a lot of money and effort was spent on autonomous-agent demos that did not pan out. By autumn 2023 the discourse had largely flipped — articles about "the AI agent winter" and "the trough of disillusionment" became common (Scholarly Kitchen 2023). The real progress between AutoGPT in March 2023 and reliable production agents in 2025-2026 came from a combination of model improvements (Claude 3.5/4, GPT-4 Turbo, function calling), better tooling APIs (MCP, structured outputs), and the slow accumulation of engineering practice (12-Factor Agents, owning your context window). None of those existed when AutoGPT shipped; AutoGPT's job was to show the shape of the thing, not to be the thing itself.

### BabyAGI

Yohei Nakajima published `BabyAGI` on April 3, 2023, four days after AutoGPT's release. The genesis is notable: Nakajima reportedly wrote the entire system — code, blog post, and accompanying paper — in roughly 3 hours across two days, using around 50 prompts to ChatGPT (Nakajima 2023).

The original BabyAGI was a clean expression of a task-driven loop with three roles (Nakajima 2023; IBM "What is BabyAGI"):

- **Execution agent.** Pops a task from a queue and runs it (an LLM call, optionally with tools).
- **Task creation agent.** Reads the result of the executed task plus the objective, and generates new tasks.
- **Prioritization agent.** Reorders the task list.

Memory was kept in Pinecone — embeddings of task results — and retrieved by similarity at execution time. This was probably the cleanest, smallest, most readable implementation of an autonomous-agent loop available in April 2023; it fit in a few hundred lines.

BabyAGI's design influence was outsized relative to its actual production usage. Where AutoGPT was the messy demo-grade Python codebase that went viral, BabyAGI was the reference implementation people read to understand the pattern.

The repository got tens of thousands of stars and inspired a wave of forks and ports. Nakajima later pivoted the project away from the original task-loop design toward a "self-building agent" framework (the `functionz` system, 2024+), but the original April 2023 BabyAGI is the historically important version.

### AgentGPT, SuperAGI, and the wave

Several other autonomous-agent projects launched in April-July 2023, most in the wake of AutoGPT and BabyAGI:

- **AgentGPT** (Reworkd, April 2023). A browser-based UI for spinning up AutoGPT-style agents without writing code. Geared toward experimentation and accessible to non-developers; lowered the bar for trying autonomous agents but did not solve any of the reliability problems.
- **SuperAGI** (TransformerOptimus, mid-2023). A "developer-first" framework with a UI, tool management, and iteration limits. More features than AutoGPT — including parallel agent execution and a marketplace concept for tools — but less viral.
- **GPT-Engineer** (Anton Osika, June 2023). Focused on the specific task of generating a full codebase from a natural-language spec. A precursor to the "vibe coding" wave that came later and arguably more influential, in the long run, than the general-purpose agent projects.
- **Smol-developer / Smol-AI** (Swyx, mid-2023). A deliberately tiny take on the same problem; emphasized that you could implement most of the AutoGPT design in a few hundred lines.

None of these matched AutoGPT's cultural impact. Collectively they made it clear that "autonomous agent" was a category, not a single product, and that the bar for entering the category was extremely low (a few hundred lines of Python around a model API).

### A note on Significant Gravitas

The fact that AutoGPT — the project that most aggressively defined "AI agent" for a global audience — came from a small video-game studio rather than a research lab or a frontier AI company is worth recording. The post-AutoGPT period saw the major labs (OpenAI, Anthropic, Google, Microsoft) all build their own agent abstractions, and the lab-grade versions are now generally more capable. But the agenda was set by an outsider with a goal and a feedback loop, not by a research roadmap. Several other inflection points in the 2023-2024 agent wave (BabyAGI, MCP-style integration thinking, the Devin demo) have a similar character: a small team or individual shipped something concrete, and the labs reacted.

## The agent loop crystallizes

By mid-2023 the shape was clear enough that you could describe it on a napkin:

```
agent = LLM + memory + tools + objective
while not done:
    thought, action = LLM(context, objective)
    observation = run_tool(action)
    context.append(thought, action, observation)
```

The intellectual lineage of this pattern (covered in detail in Tier 3) runs ReAct (Yao et al. 2022) → Toolformer (Schick et al. 2023) → OpenAI function calling (June 2023) → AutoGPT / BabyAGI. What changed in mid-2023 is that the loop went from being a research diagram in a paper to being a thing engineers built and shipped. Lilian Weng's "LLM Powered Autonomous Agents" (Weng 2023, June) is the canonical retrospective: it lays out planning, memory, and tool use as the three pillars, and treats the loop as the obvious connective tissue.

Three observations about the period:

1. **The agent loop became a first-class construct.** Not a research diagram, not a vague gesture — a concrete pattern that you could find in dozens of open-source repos by July 2023. The naming converged: "agent loop", "tool loop", "ReAct loop", "thought-action-observation" loop all referred to roughly the same thing.

2. **The session became durable.** Once you have a loop, you have state that persists across turns and can be branched, forked, replayed, or shared. This was already implicit in AutoGPT's `auto_gpt_workspace/` directory and BabyAGI's Pinecone embeddings, but later frameworks (LangGraph, AutoGen, the agent-platform startups) made it explicit. A "session" or "thread" became the natural unit of multi-step agent work.

3. **The pipeline became visible.** By summer 2023 you could draw the path from research to product: ReAct paper (Oct 2022) → AutoGPT demo (Mar 2023) → AutoGen/LangGraph (late 2023) → enterprise agent product (2024). The fact that this pipeline existed and ran on a timescale of months, not years, changed how investors and incumbents understood the space.

A subtler shift around the same time: the **prompt** stopped being the unit of work. For the first 18 months of the post-ChatGPT era, "prompt engineering" was the dominant skill name; by mid-to-late 2023 you increasingly heard "agent engineering" and "context engineering" instead. The unit of work moved up a level — from "what do I put in this single LLM call" to "what's the loop, what's in the context window across the loop, and where does state live between iterations." This vocabulary shift is one of the better markers of the agent loop's mainstreaming.

## Multi-agent frameworks: AutoGen, CrewAI, MetaGPT

After the single-agent wave, the next move was inevitable: if one agent in a loop can do things, multiple agents talking to each other should do more. This framing dominated the second half of 2023 and most of 2024.

### AutoGen (Microsoft, August 2023)

`AutoGen` was published as a Microsoft Research paper on arXiv on August 16, 2023 (Wu et al. 2023, arXiv:2308.08155), accompanied by an open-source release. The framework's central abstraction is the **ConversableAgent** — an agent that can send and receive messages, optionally backed by an LLM, a human, a tool, or some combination.

Key constructs:

- **ConversableAgent.** The base class; subclassed into `AssistantAgent` (LLM-backed) and `UserProxyAgent` (human or tool-executor backed).
- **GroupChat / GroupChatManager.** A manager agent orchestrates a multi-party conversation among several `ConversableAgent`s. The manager decides whose turn it is, when the conversation ends, and how messages are routed.
- **Two-agent chat.** The simplest pattern: an assistant and a user-proxy that automatically replies on the user's behalf (e.g., by running code).

AutoGen's pitch was that you could express most multi-agent workflows as conversations between role-specialized agents — which was a much more flexible model than AutoGPT-style monoliths. The paper reported 3-10x reductions in manual interactions for tasks like supply-chain optimization (Microsoft 2023).

The project was renamed AG2 (under the ag2ai organization) in late 2024 after a fork over governance disagreements, but the original Microsoft AutoGen continues at `microsoft/autogen`. By 2026 the framework had around 42,000 GitHub stars and was particularly popular in Microsoft-aligned shops (Pooya 2026).

### CrewAI (Joao Moura, late 2023 / January 2024)

`CrewAI` was finished by Joao Moura in October 2023, quietly open-sourced in November, and officially launched in January 2024 (Insight Partners 2024). The framing is more anthropomorphic than AutoGen's: you define **Agents** with roles ("Researcher", "Writer", "Reviewer"), give each agent a **goal** and a **backstory**, define **Tasks** with expected outputs, and group them into a **Crew** that executes either sequentially or hierarchically.

The opinionation paid off in adoption speed. Within six months CrewAI had 150 enterprise customers; by October 2024 it raised $18M (Insight Partners 2024). By late 2025 CrewAI claimed roughly 60% of the Fortune 500 as users and reported 1.4B agentic executions (Insight Partners 2024). The role-based model resonated with non-engineers who could map agents directly to job titles.

CrewAI is the framework most loved by people who want to *talk* about agents and most criticized by people who want to *debug* them. The role-and-goal abstraction is great for sketching workflows, less great when the underlying LLM gets confused about whose turn it is.

### MetaGPT (Hong et al., August 2023)

`MetaGPT` (Hong et al. 2023, arXiv:2308.00352, first submitted August 1, 2023) is the most research-y of the three. The paper, eventually published at ICLR 2024, frames multi-agent collaboration around **Standardized Operating Procedures (SOPs)** drawn from human workflows — specifically, the workflow of a software company.

The MetaGPT agents are role-specialized:

- **Product Manager.** Receives the user request; produces a structured requirements document.
- **Architect.** Reads the requirements; produces a high-level design and API spec.
- **Project Manager.** Reads the design; produces a task breakdown.
- **Engineer.** Reads a task; produces code.
- **QA Engineer.** Reads the code; produces test results and bug reports.

The SOP defines the structured artifacts each role produces (requirements doc, design doc, task list, code, test reports) and the order in which they're passed. The argument is that imposing this assembly-line structure dramatically reduces cascading hallucinations, because each agent is required to produce a *structured* intermediate output that the next agent can verify against.

On code-generation benchmarks the paper reported new state-of-the-art results — 85.9% / 87.7% Pass@1 (Hong et al. 2023). The framework was open-sourced at `geekan/MetaGPT` and accumulated tens of thousands of stars. MetaGPT is the framework that took the "agents-as-software-team" metaphor most literally; it predates and arguably inspired some of the SWE-agent literature that came later.

### How they relate

The three frameworks occupy a triangle. AutoGen is the most general (anything that can be expressed as a conversation), CrewAI is the most prescriptive about *team structure* (role + goal + crew), and MetaGPT is the most prescriptive about *workflow structure* (SOPs with typed artifacts). All three share the same underlying observation: a single agent in a loop hits an effective complexity ceiling, and dividing work across role-specialized agents pushes that ceiling up — at the cost of more LLM calls, more coordination, and more places for things to go wrong.

A quick comparison of the headline design choices:

| Framework | Core abstraction | Coordination | Default workflow | Sweet spot |
|---|---|---|---|---|
| AutoGen | ConversableAgent + GroupChat | Free-form conversation, manager-routed | Two-agent assistant/user-proxy | Research, code-execution loops |
| CrewAI | Agent + Task + Crew | Sequential or hierarchical task assignment | Role-and-goal team | Business workflows, content pipelines |
| MetaGPT | Role + SOP + structured artifact | Pipeline of typed handoffs | Software dev assembly line | Code generation, structured output tasks |
| LangGraph | Node + Edge + State | Graph traversal with checkpoints | Whatever you build | Production agents with durability needs |

The empirical track record is mixed. Multi-agent setups consistently win on the demo videos and the carefully chosen benchmarks. In production, the recurring observation through 2024-2025 was that *a single capable agent with good tools usually beats a complicated multi-agent setup* — the multi-agent overhead is real, and the underlying model is the bottleneck more than the orchestration is. By 2026 the dominant view in production engineering circles (e.g., the "12-Factor Agents" school) had swung back toward "fewer, simpler agents; more deterministic glue" (Horthy 2025).

An honest take: a meaningful fraction of multi-agent framework adoption was driven by the *legibility* of the metaphor — "five AI agents working as a team" maps cleanly to org charts and slides — rather than by measurable improvements over single-agent baselines. This is not a criticism of the frameworks per se; legibility is a real benefit when humans need to understand and trust what an agent does. But the field has had to be honest that you sometimes pay for that legibility with extra latency, extra cost, and extra failure surfaces.

## What modern agents inherit

What Tier 5 contributes to the agent design of 2026 is not a particular framework — none of LangChain, AutoGPT, AutoGen, CrewAI, or MetaGPT is the unambiguous winner — but a set of patterns and ideas that became universal.

**The agent loop as a first-class construct.** `while (true) { call model; run tools }` is now the canonical shape, with the model deciding when to stop. Every major LLM provider's "agent" SDK (OpenAI Agents SDK, Anthropic Agent SDK, Google Vertex AI, Microsoft Semantic Kernel) implements the same basic shape. The loop is no longer the interesting part — what varies is the durability of the session around it, the quality of the tools, and the supervision of the human.

The convergence is striking. By 2026 a developer who wrote an agent against Anthropic's SDK can read the OpenAI Agents SDK or the Google Agent Builder code and understand it immediately. There are differences (tool-call schemas, streaming semantics, session storage), but the *shape* is shared. That shared shape was not legible in any single source before 2023; it emerged from the cumulative pressure of LangChain's `AgentExecutor`, AutoGPT's `run_loop`, BabyAGI's three-agent dance, and LangGraph's graph traversal.

**Multi-step autonomy with a session.** Every credible agent framework now treats the *session* (or thread, or conversation, or graph state) as a durable, inspectable, branchable object. You can recover from crashes, fork a conversation, replay it, share it. The fact that this is table stakes in 2026 is a direct inheritance from the AutoGPT-era discovery that agents that lose state are useless agents.

LangGraph's explicit "checkpointer" abstraction (early 2024) is the cleanest articulation of this idea: at every node boundary, the graph's state can be snapshotted to durable storage, the loop can resume from that state, and a developer can fork or replay from any past checkpoint. This is the agent-engineering equivalent of Git history applied to an execution trace, and once you have it you stop tolerating agents that don't.

**A common vocabulary.** Words like *chain*, *agent*, *tool*, *retriever*, *memory*, *conversation*, *role*, *task*, and *crew* are mostly stable now. Different frameworks may give them slightly different precise meanings, but engineers can talk across them. LangChain in particular gets disproportionate credit for fixing the early vocabulary, even from people who don't use it.

**A skepticism about over-abstraction.** The 2023 LangChain backlash and the 2024 "we no longer use LangChain" essays left a lasting cultural mark. The current production wisdom — articulated by 12-Factor Agents, by the OctoMind writeup, by Anthropic's own engineering blogs — is to *own your prompts, own your context, own your control flow*. Frameworks are useful for prototyping and for the integration surface; they are not load-bearing in serious deployments. This is in some ways a return to "just write the loop yourself" — but the loop being written is now far more sophisticated than what AutoGPT did in March 2023.

A useful way to phrase the lesson: the framework should be *exit-cheap*. If a developer has to ship "the framework's view of an agent" rather than "their view of the world," eventually the framework wins arguments it should not be winning. The pattern of building on a framework until requirements outgrow it, then dropping it and writing the loop directly, is now common enough that it does not even count as a story worth telling.

**Standardization on the integration surface, not the orchestration surface.** Anthropic's Model Context Protocol (MCP), announced November 25, 2024 (Anthropic 2024), is the post-orchestration-framework move: rather than standardize *how you build agents*, standardize *how agents connect to tools and data*. MCP was adopted by OpenAI in March 2025 and donated to the Linux Foundation in December 2025 (Wikipedia 2026, "Model Context Protocol"). This is the right level of standardization in hindsight — the orchestration framework wars resolved by everyone admitting the orchestration layer is small and the integration layer is huge. MCP is covered in more detail in Tier 7; its place in Tier 5 is as the punctuation mark at the end of the orchestration-framework era.

The final inheritance is harder to name but worth ending on: the **agent loop became culturally legible**. By 2026 a non-technical product manager or executive can be expected to know, at least roughly, what "an agent" is — a thing with an objective, in a loop, calling tools, with some memory. That shared mental model didn't exist in 2022. AutoGPT created it, the framework wave made it concrete, and the standardization wave is what's making it durable. Whether or not any specific framework from Tier 5 survives, that mental model is the load-bearing thing they all contributed to.

### One-paragraph summary

Late 2022 introduced the first orchestration vocabulary (LangChain, LlamaIndex). Spring 2023 made the agent loop viral via AutoGPT and BabyAGI. The remainder of 2023 saw the loop formalized in research and code, and the multi-agent abstractions arrived (AutoGen, MetaGPT). 2024 brought the production-grade frameworks (LangGraph, CrewAI) and the first standardization move (MCP). By 2026 the orchestration framework as such has receded — what mattered was not the frameworks themselves but the loop-shaped pattern they collectively taught the industry to recognize.

## Citations

- Anthropic. 2024. "Introducing the Model Context Protocol." November 25, 2024. https://www.anthropic.com/news/model-context-protocol
- Chase, Harrison. 2025. "Reflections on Three Years of Building LangChain." LangChain Blog. https://www.langchain.com/blog/three-years-langchain
- ClickIT. 2026. "LangChain 1.0 vs LangGraph 1.0: Which One to Use in 2026." https://www.clickittech.com/ai/langchain-1-0-vs-langgraph-1-0/
- Contrary Research. 2023. "Report: LangChain Business Breakdown & Founding Story." https://research.contrary.com/company/langchain
- Designveloper. 2024. "Why Developers Say LangChain Is 'Bad': An Honest Look at LangChain." https://www.designveloper.com/blog/is-langchain-bad/
- FierceNetwork. 2023. "GenAI sinks into the 'trough of disillusionment'." https://www.fierce-network.com/cloud/generative-ai-hype-dying
- Gurusup. 2026. "Best Multi-Agent Frameworks in 2026: LangGraph, CrewAI ..." https://gurusup.com/blog/best-multi-agent-frameworks-2026
- Han, Swyx (interviewer) / Chase, Harrison. 2023. "The Point of LangChain — with Harrison Chase of LangChain." Latent Space. https://www.latent.space/p/langchain
- Hacker News. 2023. "I believe the abstractions in Langchain are inherently flawed." https://news.ycombinator.com/item?id=36648272
- Hong, Sirui et al. 2023. "MetaGPT: Meta Programming for A Multi-Agent Collaborative Framework." arXiv:2308.00352. https://arxiv.org/abs/2308.00352
- Horthy, Dex. 2025. "12-Factor Agents — Patterns of Reliable LLM Applications." HumanLayer. https://github.com/humanlayer/12-factor-agents
- IBM. 2024. "What is BabyAGI?" https://www.ibm.com/think/topics/babyagi
- Insight Partners. 2024. "CrewAI Launches Multi-Agentic Platform to Deliver on the Promise of Generative AI for Enterprise." https://www.insightpartners.com/ideas/crewai-launches-multi-agentic-platform-to-deliver-on-the-promise-of-generative-ai-for-enterprise/
- LangChain. 2025. "Reflections on Three Years of Building LangChain." https://www.langchain.com/blog/three-years-langchain
- LangChain. 2026. "State of AI Agents." https://www.langchain.com/state-of-agent-engineering
- LlamaIndex. 2023. "LlamaIndex Turns 1: Big Milestones And Growth." https://www.llamaindex.ai/blog/llamaindex-turns-1-f69dcdd45fe3
- LlamaIndex. 2024. "LlamaIndex is more than a RAG Framework. It is Agentic Document Processing." https://www.llamaindex.ai/blog/llamaindex-is-more-than-a-rag-framework
- MarkTechPost. 2023. "Breaking Down AutoGPT: What It Is, Its Features, Limitations." https://www.marktechpost.com/2023/07/11/breaking-down-autogpt-what-it-is-its-features-limitations-artificial-general-intelligence-agi-and-impact-of-autonomous-agents-on-generative-ai/
- Microsoft Research. 2023. "AutoGen: Enabling next-generation large language model applications." https://www.microsoft.com/en-us/research/blog/autogen-enabling-next-generation-large-language-model-applications/
- Nakajima, Yohei. 2023. "Birth of BabyAGI." https://yoheinakajima.com/birth-of-babyagi/
- Nakajima, Yohei. 2023. "babyagi (GitHub repository)." https://github.com/yoheinakajima/babyagi
- OctoMind / OctoClaw. 2024. "Why we no longer use LangChain for building our AI agents." https://octoclaw.ai/blog/why-we-no-longer-use-langchain-for-building-our-ai-agents
- Pooya. 2026. "CrewAI vs LangGraph vs AutoGen 2026: Benchmarks, Pricing, and the Right Choice." https://pooya.blog/blog/crewai-vs-langgraph-autogen-comparison-2026/
- Saravia, Elvis. 2023. "Prompt Chaining." Prompt Engineering Guide. https://www.promptingguide.ai/techniques/prompt_chaining
- Scholarly Kitchen. 2023. "GPT, Large Language Models, and the Trough of Disillusionment." https://scholarlykitchen.sspnet.org/2023/10/04/gpt-large-language-models-and-rough-of-disillusionment/
- Significant Gravitas. 2023. "AutoGPT (GitHub repository)." https://github.com/Significant-Gravitas/AutoGPT
- VibeAgentMaking. 2024. "AutoGPT Got 100K Stars and Then What?" https://vibeagentmaking.com/blog/autogpt-got-100k-stars-and-then-what/
- Weng, Lilian. 2023. "LLM Powered Autonomous Agents." Lil'Log, June 23, 2023. https://lilianweng.github.io/posts/2023-06-23-agent/
- Wikipedia. 2026. "AutoGPT." https://en.wikipedia.org/wiki/AutoGPT
- Wikipedia. 2026. "LangChain." https://en.wikipedia.org/wiki/LangChain
- Wikipedia. 2026. "CrewAI." https://en.wikipedia.org/wiki/CrewAI
- Wikipedia. 2026. "Model Context Protocol." https://en.wikipedia.org/wiki/Model_Context_Protocol
- Wu, Qingyun et al. 2023. "AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation." arXiv:2308.08155. https://arxiv.org/abs/2308.08155
- Yan, Eugene. 2023. "Patterns for Building LLM-based Systems & Products." https://eugeneyan.com/writing/llm-patterns/
- Yan, Eugene et al. 2024. "What We Learned from a Year of Building with LLMs (Part I)." O'Reilly Radar. https://www.oreilly.com/radar/what-we-learned-from-a-year-of-building-with-llms-part-i/
- Yao, Shunyu et al. 2022. "ReAct: Synergizing Reasoning and Acting in Language Models." (Foundational reference, covered in detail in Tier 3.)
