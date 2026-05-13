# Tier 3 — Reasoning emerges (2022–2025)

> The "thinking turn." Between early 2022 and early 2025, language models acquired a separable phase of inference where they produce intermediate reasoning before committing to an answer. The arc moves from prompt-level tricks (Chain-of-Thought, "Let's think step by step", self-consistency, Tree of Thoughts) through the first true agentic-loop pattern (ReAct), through self-critique (Reflexion), and culminates with the first commercial models that bake reasoning into the architecture itself (OpenAI o1/o3, Claude extended thinking, Gemini 2.5, DeepSeek-R1). The two durable inheritances are **ReAct as the agent-loop spine** and **reasoning trace as a first-class, separable output channel**.

## Chain-of-Thought and "Let's think step by step"

**CoT prompting (Wei 2022)** is disarmingly simple: include in the few-shot exemplars not just `(question, answer)` pairs but `(question, worked-reasoning, answer)` triples. The model, conditioned on those exemplars, emits a similar reasoning trace and accuracy on arithmetic and commonsense benchmarks jumps sharply. PaLM 540B prompted with eight CoT exemplars set state-of-the-art on GSM8K. The crucial empirical finding was **scale-dependence**: below roughly 100B parameters CoT often *hurt* accuracy because the produced chains were fluent but wrong; above the threshold, the chains became correct often enough that the marginal reasoning improved the answer.

**Zero-shot CoT (Kojima 2022)** showed the exemplars are not strictly necessary. Just prepending **"Let's think step by step"** to the question elicited a similar reasoning trace. On `text-davinci-002`, MultiArith jumped from 17.7% → 78.7% and GSM8K from 10.4% → 40.7%. The technique used a two-stage prompt — sample a reasoning trace, then sample the final answer — which foreshadowed the API-level reasoning/answer split that later thinking models would formalize.

Why CoT works at scale, in plausible-mechanism terms: producing intermediate tokens **gives the forward pass more compute per problem** and **externalizes working memory into the context window** where subsequent tokens can attend to it. Anything that requires composing two or more steps benefits because the composition no longer has to fit in a single forward pass's residual stream.

## Search over reasoning: self-consistency and Tree of Thoughts

**Self-consistency (Wang 2022)** replaced greedy decoding with sampling many chains and taking a majority vote over final answers. Intuition: hard problems admit several different valid reasoning paths that converge on the same answer; incorrect reasoning disagrees. Reported gains stacked on top of CoT: +17.9% on GSM8K, +12.2% on AQuA, +6.4% on StrategyQA. Self-consistency was the first widely-cited demonstration that **inference-time compute can substitute for parameters** on reasoning tasks — an observation that underpins the entire thinking-model thesis two years later.

**Tree of Thoughts (Yao 2023)** generalized linear CoT into a search tree: propose several candidate next "thoughts" at each step, self-evaluate via a value prompt, search BFS/DFS with backtracking. On Game of 24, GPT-4 with standard CoT achieved 4%; with ToT, 74%. The improvement comes from the ability to **abandon a partial reasoning path** — exactly what linear CoT cannot do because once a token is emitted it conditions everything downstream.

ToT was influential as a concept but expensive in practice. What survived is the broader idea that reasoning can be structured as exploration with self-evaluation, an idea that returns in different form inside trained thinking models — which appear to learn an *implicit* "try, evaluate, backtrack" pattern within a single rollout.

The progression Wei → Wang → Yao → o1/R1 buys accuracy on hard problems by adding compute, but **each step moves the compute closer to the model**: CoT adds tokens to the rollout, self-consistency adds parallel rollouts, ToT adds structured external search, and trained thinking models bake search-and-evaluate inside a single rollout.

## ReAct: the agent-loop spine

**ReAct (Yao 2022/2023)** is the single most consequential paper for the modern agent loop. A ReAct trajectory interleaves three kinds of tokens:

- **Thought** — a free-text reasoning step deciding what to do next.
- **Action** — a structured call into an external environment.
- **Observation** — the environment's response, fed back into the context.

The empirical evaluation covered HotpotQA (multi-hop Wikipedia QA), FEVER (fact verification), ALFWorld (text-based household tasks; +34 absolute points over the strongest baselines), and WebShop (simulated shopping; +10 absolute points). The deeper claim is that **reasoning and acting are complementary**: CoT alone hallucinates; acting alone is brittle; interleaving them gives grounded inputs and a planning channel that can react to what those inputs say.

Why ReAct is the spine: every subsequent agent framework — LangChain, AutoGPT, OpenAI function-calling agents, Anthropic computer-use, Claude Code, Cursor, Devin, AutoGen — implements the same canonical cycle *reason → act → observe → reason*, even when the surface syntax differs. **Tool-calling APIs are essentially structured implementations of ReAct.** When OpenAI introduced function calling in June 2023, it looked like a small syntactic upgrade (`function_call` field instead of plain text); it was really ReAct moved from prompt convention into the protocol.

ReAct's quieter contribution was *evaluation methodology*. By picking interactive environments with success/failure outcomes (ALFWorld, WebShop), the paper grounded reasoning evaluation in something more honest than benchmark accuracy. That mindset carried forward into SWE-Bench, WebArena, OSWorld, GAIA, and AgentBench.

## Reflexion: verbal self-critique

**Reflexion (Shinn 2023)** wraps another loop around the ReAct loop: after an attempt, the agent reads its own trajectory and the outcome, writes a natural-language self-critique ("the reason I failed was that I forgot to check whether the list was empty"), stores it in episodic memory, and on the next attempt conditions on the accumulated critiques. "Reinforcement learning" is metaphorical — no weights are updated — but the loop structure is the same: try, get feedback, reflect, retry, with the reflection serving as a gradient signal in token space. GPT-4 with Reflexion reached 91% pass@1 on HumanEval (vs 80% vanilla).

The durable contribution is **verbal learning**: natural language as the substrate for an agent to update its strategy between attempts. The pattern reappears in modern agent frameworks as scratchpads, episodic memory, post-hoc trace summarization, and "lessons learned" files. It is also a precursor to the inner-loop self-correction that o1, R1, and Claude extended thinking learn during RL post-training — rather than a separate outer loop, the model learns mid-rollout reflection ("wait, that's wrong, let me reconsider").

## Reasoning-as-output: trained thinking models

By late 2024, the major labs had moved reasoning into post-training. Instead of asking a general-purpose model to think step-by-step, they trained models to produce extended internal reasoning and a short final answer, and exposed that split at the API layer.

**OpenAI o1 (Sep 12, 2024) and o3 (Apr 16, 2025)** — o1 was the first commercial thinking-model surface, trained with large-scale RL to produce a long internal chain of thought before answering. On AIME 2024, o1-preview solved 83% vs 13% for GPT-4o. OpenAI chose to **hide the raw CoT**: the user sees only a model-generated summary plus the answer. The stated rationale is threefold — CoT monitorability (keep unfiltered "thoughts" visible *internally* as a misbehavior-detection signal), safety, and competitive moat. Reasoning tokens are billed as `reasoning_tokens` even though the user does not see them. **o3** (Apr 2025) added agentic tool use directly *inside* the reasoning trace — web browsing, Python execution, file ops happen between thinking steps. This is **ReAct-style interleaving moved from prompt-level to model-native**: a single API call can now be a multi-step ReAct trajectory.

**Claude extended thinking (Feb 24, 2025)** — Anthropic took the opposite design call. Extended thinking shipped as a first-class API content block alongside `text` and `tool_use`. A request enables it via `{"type": "enabled", "budget_tokens": N}`; the response comes back with `thinking` blocks followed by `text` blocks. Each thinking block carries a server-issued **signature** that the client must pass back unchanged on multi-turn calls — this both preserves reasoning context across tool-use round-trips and prevents clients from forging thinking content. Anthropic initially shipped raw thinking visible to users (hedged with a faithfulness caveat); later models added `display: summarized | omitted` options. The signature mechanism solves a real engineering problem and has become the de facto pattern for any provider that exposes thinking content.

**Gemini 2.5 (Mar 25, 2025)** — Google made thinking the default for the family. The Gemini API exposes thinking through optional "include thoughts" flags, sitting between OpenAI's hidden and Anthropic's visible defaults. Gemini 2.5's contribution is the integration of thinking with very long context (1M tokens) — a thinking model can read an entire codebase or RFP and reason over it without retrieval, shifting the agent design space.

**DeepSeek-R1 (Jan 20-22, 2025)** — the first open-weight model to match o1-tier reasoning, MIT-licensed, with full weights and a technical report. Two notable contributions. **R1-Zero** showed that a base model could be trained to do extended reasoning via pure RL with verifiable rewards (math correctness, test pass/fail) — no SFT on human reasoning traces at all. The model emergently developed self-reflection patterns, verification, and dynamic strategy adaptation. **R1 proper** added a small cold-start SFT stage for readability followed by RL → SFT → RL. Third and most consequentially, DeepSeek **distilled R1's reasoning behavior into smaller dense models** (1.5B–70B Qwen2.5 and Llama variants). The distilled 32B was competitive with much larger closed models on math, which collapsed the gap between closed and open reasoning models almost overnight.

R1 also broke OpenAI's hidden-CoT moat: with weights available, anyone could read the raw traces, train on them, and build derivatives. Its **GRPO** training recipe — actor-only PPO, rule-based rewards, no learned reward model — made the reasoning post-training pipeline less mysterious than it appeared. Within months, multiple labs released open reasoning models with similar pipelines.

## The output-channel split

A subtle but important design pattern crystallized: **reasoning trace and final answer are two separate output channels**. The answer is what gets shown by default; the trace is auxiliary, optionally visible, often summarized, and sometimes signed.

- **OpenAI o1/o3** — hidden raw CoT; user sees a model-generated summary. Reasoning tokens billed but not displayed.
- **Anthropic Claude** — content blocks with signatures; `display` configurable.
- **Google Gemini** — configurable per request via "include thoughts" flags.
- **DeepSeek-R1** — open `<think>…</think>` tags; consumer chooses what to render.

The split has a practical consequence for tool-using agents: when the model makes a tool call, the *reasoning about why it is calling the tool* must persist across the call. Anthropic's signed thinking blocks and OpenAI's reasoning-token persistence both solve this. The split is asymmetric across providers, and that asymmetry leaks into agent code — a cross-provider framework needs an abstraction layer mapping each provider's thinking representation onto a common internal "reasoning content" type.

A persistent open question hovers over the entire tier: **is the visible reasoning trace what the model is actually doing?** Anthropic explicitly flagged the *faithfulness* problem; OpenAI's CoT-monitorability stance is built on the related observation that user-facing reasoning may not equal mechanistic reasoning. The implication for agent designers is to treat traces as advisory: log them, sometimes display them, but never trust them as the source of truth about agent behavior. The source of truth is the trajectory — actions taken, observations received — which is auditable in a way the thoughts about them are not.

## → Inherited by modern agents

Two patterns from Tier 3 are now load-bearing for every production agent:

- **ReAct as the agent-loop spine.** The *reason → act → observe → reason* cycle is the canonical shape of an agent's main loop. It is implemented at three levels: prompt-level (AutoGPT-era frameworks parsing `Thought:`/`Action:` tokens), API-level (function calling, `tool_use`, MCP), and model-level (o3, Claude 4.x, Gemini 2.5 where tool calls happen inside a single thinking trace). Every tier above this one sits on a ReAct shape, even when the surface UI hides it.
- **Reasoning trace as a first-class, separable output channel.** Modern agent code treats "the thing the model said it was thinking" and "the thing the user should see" as different content types with different lifecycles. Practical consequences: thinking blocks must persist across tool calls (signatures, reasoning-token IDs, framework scratchpads); thinking tokens are billed but invisible; harnesses must decide what to surface, log, or clear; designers cannot rely on visible reasoning as a ground-truth audit log, but it is a useful heuristic.

Secondary inheritances: **inference-time compute as a tunable lever** (reasoning effort, thinking budget, sample count), **internalized self-critique** (mid-rollout "wait, that's wrong" replacing outer-loop Reflexion), **search over reasoning** (best-of-N, verifier reranking — kept in the toolkit for high-stakes accuracy), **verbal scratchpads** (plan files, todo lists, lessons learned), and **verifiable-reward post-training** (math/code as the cheapest substrate for training reasoning patterns that transfer).

The through-line of Tier 3 is the **progressive internalization** of techniques that started as external scaffolding. CoT was an external trick; thinking models made it the trained default. Self-consistency was external decoding; thinking models internalized in-trace self-checking. ToT was external search; models internalized branch-and-revise. Reflexion was an external retry loop; models internalized mid-rollout self-correction. ReAct was an external prompt convention; tool-calling APIs and agent-native models internalized it into the protocol. The model has become a reasoning-and-acting unit, not just a next-token predictor. **What has not been internalized is the *outer* agent loop itself** — that is Tier 4 and 5 material.
