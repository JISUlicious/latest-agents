# Tier 5 — Orchestration frameworks (late 2022 – 2024)

> The period when "the agent loop" stopped being a research curiosity and became a first-class construct in industry software. The arc runs from prompt chaining as an emerging design pattern, through the late-2022 launches of **LangChain** and **LlamaIndex**, the viral spring 2023 **AutoGPT / BabyAGI** moment, the multi-agent frameworks that followed (**AutoGen**, **MetaGPT**, **CrewAI**), the durability turn (**LangGraph**), and ending with **MCP** as the post-orchestration-framework standardization move. By 2026 the orchestration framework as such has receded; what mattered was not the frameworks themselves but the loop-shaped pattern they collectively taught the industry to recognize.

## Prompt chaining as a design pattern

Before the wave of frameworks, the practice came first: take the output of one LLM call and use it as the input (or part of the input) to the next. The pattern was discovered empirically by people building with GPT-3 in 2021-2022 and codified in 2023 in writeups like Eugene Yan's "Patterns for Building LLM-based Systems & Products" and the Prompt Engineering Guide.

In practice "prompt chaining" meant **sequential composition** (step 1's output → step 2's prompt), **branching** (step 1's output routes which prompt runs next), and **self-critique** (a second LLM call critiques the first). Later distillations like Dex Horthy's *12-Factor Agents* (2025) crystallized the production lesson: most production AI is "mostly just software with LLM steps placed carefully," not autonomous agents looping over a vague objective.

A useful way to draw the boundary: prompt chaining is a **developer-authored** control flow with LLM calls at the nodes; the agent loop is a **model-authored** control flow with deterministic code at the nodes. Most production "agentic" software in 2026 is closer to the first than the second — a tightly scoped chain with one or two genuinely agentic loops embedded in the right place, not a single autonomous loop wrapping everything. The chain abstraction never really went away; it just stopped being the part anyone bragged about.

## First-wave frameworks: LangChain and LlamaIndex

**LangChain (Harrison Chase, Oct 24, 2022)** was released as an open-source Python package — initially around 800 lines, three LLM integrations, three pre-built chains. ChatGPT shipped one month later, and adoption took off. By April 2023, 18K GitHub stars; by end of 2023, ~70K stars, with a Benchmark seed and a Sequoia Series A at $200M+ valuation.

The framework crystallized around named abstractions that became the de facto vocabulary: **Chains** (sequences of prompts/models/parsers), **Prompts / Prompt Templates**, **Models** (model-neutral wrappers), **Indexes / Retrievers** (RAG primitives), **Memory** (buffer / summary / vector / entity), **Agents** (LLMs deciding action sequences over tools, built on ReAct), **Callbacks** (observability hooks), **Tools**. It is hard to overstate how dominant this vocabulary was in 2023 — "chain," "agent," and "retriever" became the standard nouns of LLM engineering largely because LangChain used them. Even critics adopted the naming.

**The criticism** built starting summer 2023 and crystallized in the "Why we no longer use LangChain" wave of 2024. Recurring complaints:
- **Over-abstraction.** Chains, runnables, agents, tools, callbacks piled on top of each other; simple tasks required substantial boilerplate.
- **Leaky abstractions.** Debugging required reading LangChain source to learn what prompt was actually sent.
- **Unstable APIs.** Breaking changes across minor versions.
- **Orchestration is the smallest part.** The top HN critique: orchestration is maybe 5% of an LLM application's work; the other 95% is prompt engineering and data wrangling, neither of which LangChain helped with.

Chase took the criticism seriously and re-platformed the project around durability: **LangSmith** (observability, July 2023), **LCEL** (declarative composition, Q3 2023), and **LangGraph** (early 2024) — an explicit rewrite of the agent layer as a graph runtime with the message "LangChain is for RAG and document Q&A; LangGraph is for agents." LangChain shipped a 1.0 release in October 2025 built on the LangGraph runtime.

**LlamaIndex (Jerry Liu, originally GPT Index, Nov 5, 2022)** had a different framing from day one: where LangChain centered on chains and general composition, LlamaIndex centered on **retrieval**. Liu's motivating problem was how to feed external knowledge into an LLM at query time. The first version was literally a tree index; subsequent versions added List, Tree, Keyword Table, and (most importantly) **Vector Store** indexes plus a wide library of data connectors.

The retrieval-first framing turned out to be the load-bearing one: LangChain's `Indexes` module was always second-class compared to its chain/agent vocabulary, while LlamaIndex stayed focused on the document-ingestion-to-query pipeline. By 2025 LlamaIndex had repositioned as an "agentic document processing" platform, but the core thesis — *retrieval is the hard part* — has held up well. Many production stacks used both: LlamaIndex for ingestion/retrieval, LangChain for the chain/agent layer consuming retrieved context.

## The viral agent moment: AutoGPT, BabyAGI

**AutoGPT (Toran Bruce Richards / Significant Gravitas, Mar 30, 2023)** was the first credibly autonomous-looking LLM application most people had seen — two weeks after GPT-4 became available via API. The pitch: give the agent a name, a role, and an objective with sub-goals; the agent loops indefinitely, planning sub-tasks, browsing, reading and writing files, calling GPT-4 to decide what to do next. **Architecturally it was the first widely-used implementation of the pattern that crystallized later: model + tools + memory + objective + loop.**

The adoption curve was unprecedented: 30K GitHub stars in 13 days, 100K by late April, "AGI is here" articles peaking in June. Fastest-growing open-source project in GitHub history at the time. Significant Gravitas raised $12M in October 2023.

**What it could actually do** included researching market segments, drafting business plans, and writing/debugging Python with the agent reading its own error output. **What it couldn't do** is the honest part: AutoGPT got stuck in loops (limited context, weak memory), hallucinated (each step's output became input to the next, errors compounded), cost real money per run, and was hard to supervise. By summer 2023 the **trough of disillusionment** framing was widespread — people who tried AutoGPT seriously came away noting how brittle and expensive autonomous loops actually were.

AutoGPT was **a demonstration that the loop was viable, not a product that reliably did work**. The cultural impact, though, was enormous. It is the moment "AI agents" went from a research-paper phrase to a noun a non-technical executive recognized. The real progress between AutoGPT in March 2023 and reliable production agents in 2025-2026 came from a combination of model improvements, better tool APIs (function calling, MCP), and the slow accumulation of engineering practice — none of which existed when AutoGPT shipped. AutoGPT's job was to show the shape of the thing, not to be the thing itself.

**BabyAGI (Yohei Nakajima, Apr 3, 2023)** was published four days later. Nakajima reportedly wrote the entire system in about 3 hours across two days using ~50 prompts to ChatGPT. The original was a clean task-driven loop with three roles — **Execution agent** (runs the next task), **Task creation agent** (generates new tasks from the result), **Prioritization agent** (reorders the queue) — plus Pinecone embeddings as memory. A few hundred lines. BabyAGI's design influence was outsized relative to its actual production usage: it was the *reference implementation* people read to understand the pattern.

Several other autonomous-agent projects launched in April-July 2023 in the wake of AutoGPT/BabyAGI — **AgentGPT** (browser UI), **SuperAGI** (developer-first), **GPT-Engineer** (Anton Osika, Jun 2023, codebase-from-spec — arguably more influential in the long run than the general-purpose projects), **Smol-AI**. Collectively they made it clear that "autonomous agent" was a category, not a single product, and that the bar for entering was extremely low.

## The agent loop crystallizes

By mid-2023 the shape was clear enough to describe on a napkin:

```
agent = LLM + memory + tools + objective
while not done:
    thought, action = LLM(context, objective)
    observation = run_tool(action)
    context.append(thought, action, observation)
```

The lineage: ReAct (Yao 2022) → Toolformer (Schick 2023) → OpenAI function calling (Jun 2023) → AutoGPT / BabyAGI. What changed in mid-2023 is that the loop went from being a research diagram to being a thing engineers built and shipped. Lilian Weng's *LLM Powered Autonomous Agents* (Jun 2023) is the canonical retrospective: planning, memory, and tool use as the three pillars; the loop as connective tissue.

Three observations about the period:
1. **The agent loop became a first-class construct.** A concrete pattern in dozens of open-source repos by July 2023.
2. **The session became durable.** Once you have a loop, you have state that persists across turns and can be branched, forked, replayed, shared.
3. **The pipeline became visible.** Research → demo → framework → enterprise product, on a timescale of months not years.

A subtler shift around the same time: **the prompt stopped being the unit of work**. For the first 18 months of the post-ChatGPT era, "prompt engineering" was the dominant skill name; by mid-to-late 2023 you increasingly heard "agent engineering" and "context engineering" instead. The unit of work moved up a level — from "what do I put in this single LLM call" to "what's the loop, what's in the context window across the loop, and where does state live between iterations."

## Multi-agent frameworks: AutoGen, CrewAI, MetaGPT

If one agent in a loop can do things, multiple agents talking to each other should do more. This framing dominated the second half of 2023 and most of 2024.

**AutoGen (Microsoft, Aug 16, 2023)** — `ConversableAgent` base class, subclassed into `AssistantAgent` (LLM-backed) and `UserProxyAgent` (human or tool-executor). `GroupChat`/`GroupChatManager` orchestrates multi-party conversations. The pitch: most multi-agent workflows can be expressed as conversations between role-specialized agents.

**MetaGPT (Hong 2023, Aug 2023)** is the most research-y of the three. Frames multi-agent collaboration around **Standardized Operating Procedures** drawn from software-company workflows: Product Manager → Architect → Project Manager → Engineer → QA, each producing a *structured* intermediate artifact (requirements doc, design doc, task list, code, test reports) that the next agent verifies against. The argument: imposing the assembly-line structure with typed handoffs reduces cascading hallucinations.

**CrewAI (Joao Moura, Jan 2024)** is the most anthropomorphic of the three: define Agents with roles ("Researcher", "Writer", "Reviewer"), goals, and backstories; group them into a Crew that executes sequentially or hierarchically. Adoption was fast — 150 enterprise customers within six months, $18M raised in October 2024. The role-and-goal abstraction resonated with non-engineers who could map agents directly to job titles.

The three frameworks occupy a triangle: **AutoGen** is the most general (anything that can be expressed as a conversation), **CrewAI** is the most prescriptive about *team structure*, and **MetaGPT** is the most prescriptive about *workflow structure*. All three share the same underlying observation: a single agent in a loop hits an effective complexity ceiling, and dividing work across role-specialized agents pushes that ceiling up — at the cost of more LLM calls, more coordination, and more places for things to go wrong.

The empirical track record is mixed. **Multi-agent setups consistently win on the demo videos and the carefully chosen benchmarks. In production, the recurring observation through 2024-2025 was that a single capable agent with good tools usually beats a complicated multi-agent setup** — the orchestration overhead is real, and the underlying model is the bottleneck more than the orchestration is. A meaningful fraction of multi-agent framework adoption was driven by the *legibility* of the metaphor ("five AI agents working as a team" maps cleanly to org charts) rather than measurable improvements over single-agent baselines. By 2026 the dominant view in production engineering had swung back toward "fewer, simpler agents; more deterministic glue."

## The post-orchestration-framework move: MCP

Anthropic's **Model Context Protocol** (Nov 25, 2024) is the punctuation mark at the end of the orchestration-framework era. Rather than standardize *how you build agents*, MCP standardizes *how agents connect to tools and data*. MCP was adopted by OpenAI in March 2025 and donated to the Linux Foundation in December 2025.

This is the right level of standardization in hindsight — the orchestration framework wars resolved by everyone admitting the orchestration layer is small and the integration layer is huge. MCP is covered in detail in Tier 7; its place in Tier 5 is to mark where the field moved on.

## → Inherited by modern agents

What Tier 5 contributes to 2026 agent design is not a particular framework — none of LangChain / AutoGPT / AutoGen / CrewAI / MetaGPT is the unambiguous winner — but a set of patterns that became universal:

- **The agent loop as a first-class construct.** `while (true) { call model; run tools }` is now the canonical shape, with the model deciding when to stop. Every major LLM provider's "agent" SDK implements this shape. A developer who wrote an agent against Anthropic's SDK can read OpenAI's Agents SDK or Google's Agent Builder code and understand it immediately. That shared shape was not legible in any single source before 2023.

- **Multi-step autonomy with a session.** Every credible agent framework now treats the *session* (thread, conversation, graph state) as a durable, inspectable, branchable object. LangGraph's checkpointer abstraction is the cleanest articulation: at every node boundary, state can be snapshotted, the loop can resume, a developer can fork or replay from any past checkpoint. The agent-engineering equivalent of Git history applied to an execution trace. A direct inheritance from the AutoGPT-era discovery that agents that lose state are useless agents.

- **A common vocabulary.** *Chain, agent, tool, retriever, memory, conversation, role, task, crew* are mostly stable now. LangChain in particular gets disproportionate credit for fixing the early vocabulary, even from people who don't use it.

- **A skepticism about over-abstraction.** The 2023-2024 LangChain backlash left a lasting cultural mark. The current production wisdom — articulated by 12-Factor Agents, by the "Why we no longer use LangChain" writeups, by Anthropic's own engineering blogs — is to *own your prompts, own your context, own your control flow*. Frameworks are useful for prototyping and for the integration surface; they are not load-bearing in serious deployments. **The framework should be exit-cheap.**

- **Standardization on the integration surface, not the orchestration surface.** MCP is the post-framework move: agree on the tool/resource protocol, let everyone write their own loop. This is where Tier 7 picks up.

The final inheritance is harder to name but worth ending on: **the agent loop became culturally legible**. By 2026 a non-technical product manager can be expected to know, at least roughly, what "an agent" is — a thing with an objective, in a loop, calling tools, with some memory. That shared mental model didn't exist in 2022. AutoGPT created it, the framework wave made it concrete, and the standardization wave (Tier 7) is what makes it durable.
