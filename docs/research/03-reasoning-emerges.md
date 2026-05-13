# Tier 3 — Reasoning Emerges

## Overview

Between early 2022 and early 2025, large language models acquired a "thinking turn": a phase of inference where the model produces intermediate reasoning before committing to an answer. This tier traces the arc from prompt-level tricks (Chain-of-Thought, "Let's think step by step", self-consistency, Tree of Thoughts) through the first agentic loop pattern (ReAct), through self-critique (Reflexion), and culminates with the first generation of commercial models that bake reasoning into the architecture and into the output channel itself (OpenAI o1/o3, Claude extended thinking, Gemini thinking, DeepSeek-R1). The two durable inheritances for modern agents are the ReAct loop as the agent-loop spine and the separation of a reasoning trace from the user-facing answer as a first-class output channel.

### Timeline at a glance

- January 2022 — CoT prompting (Wei et al., arXiv 2201.11903)
- March 2022 — Self-consistency (Wang et al., arXiv 2203.11171)
- May 2022 — Zero-shot CoT / "Let's think step by step" (Kojima et al., arXiv 2205.11916)
- October 2022 — ReAct (Yao et al., arXiv 2210.03629)
- March 2023 — Reflexion (Shinn et al., arXiv 2303.11366)
- May 2023 — Tree of Thoughts (Yao et al., arXiv 2305.10601)
- September 12, 2024 — OpenAI o1-preview and o1-mini
- December 5, 2024 — OpenAI o1 (full release)
- December 19, 2024 — Gemini 2.0 Flash Thinking (experimental)
- December 20, 2024 — OpenAI o3 announcement (benchmarks)
- January 20-22, 2025 — DeepSeek-R1 weights + paper (arXiv 2501.12948)
- February 24, 2025 — Claude 3.7 Sonnet with extended thinking
- March 25, 2025 — Gemini 2.5 with thinking
- April 16, 2025 — OpenAI o3 and o4-mini (general availability)

## Chain-of-Thought Prompting (Wei 2022) and Zero-Shot CoT (Kojima 2022)

### Few-shot CoT (Wei et al. 2022)

"Chain-of-Thought Prompting Elicits Reasoning in Large Language Models" (Wei et al. 2022, arXiv 2201.11903) is the paper that named and popularized the technique. The arXiv v1 was submitted on January 28, 2022 by Jason Wei and collaborators at Google Research, and the work was published at NeurIPS 2022. The core idea is disarmingly simple: when prompting a model to solve a multi-step problem, include in the few-shot exemplars not just `(question, answer)` pairs but `(question, worked-reasoning, answer)` triples. The model, conditioned on those exemplars, learns to emit a similar reasoning trace before its own answer, and accuracy on arithmetic and commonsense benchmarks jumps sharply.

The headline result was on GSM8K, a grade-school math word-problem benchmark: PaLM 540B prompted with eight CoT exemplars achieved state-of-the-art performance, surpassing fine-tuned GPT-3 with a verifier (Wei 2022). The paper also showed gains on SVAMP, ASDiv, AQuA, MAWPS, and on commonsense reasoning (CSQA, StrategyQA) and symbolic reasoning (Last Letter Concatenation, Coin Flip).

The crucial empirical finding was scale-dependence. CoT prompting only helps once the model is large enough; for models below roughly 100B parameters in the PaLM/LaMDA/GPT-3 families, CoT prompting often *hurt* accuracy compared to direct prompting. Wei et al. called this an emergent ability. The interpretation that took hold is that small models do not produce coherent multi-step reasoning even when asked to; they produce fluent-sounding but incorrect chains and then conditioning on those wrong chains makes the final answer worse. Above the threshold, the chains become correct often enough that the marginal expected reasoning improves the answer. This finding is contested in detail (the emergence framing has been challenged by Schaeffer et al. 2023 as a metric artifact), but the qualitative pattern — bigger models benefit more — holds across follow-up work.

Why it works at scale, in plausible-mechanism terms: producing intermediate tokens gives the forward pass more compute per problem and externalizes working memory into the context window, where subsequent tokens can attend to it. Anything that requires composing two or more steps benefits because the model no longer has to perform the composition entirely in a single forward pass's residual stream. Several follow-up studies have argued that the *content* of the chain matters less than its *length* — invalid but well-formed chains still help — which supports the "extra compute per problem" interpretation. Other work has shown that swapping intermediate tokens for filler tokens does not always recover the gain, which supports the "externalized scratch" interpretation. The honest answer is probably both: CoT both unlocks per-problem compute and supplies a working-memory channel, and the gains are largest when both effects compound.

A related practical observation: CoT prompting interacts heavily with the choice of exemplars. Wei et al. used hand-written reasoning traces, but later work showed that the exemplar style (verbose vs terse, with vs without sub-conclusions, English vs equations) materially shifts accuracy. This pushed practitioners toward families of CoT prompt variants — least-to-most prompting, plan-and-solve prompting, decomposed prompting — that each constrain the reasoning shape differently. By 2023 these had largely been superseded by instruction-tuned models that produce CoT-shaped output on demand without exemplars, and by 2024-2025 by models that produce CoT-shaped output by default.

### Zero-shot CoT (Kojima et al. 2022)

Kojima et al. 2022 ("Large Language Models are Zero-Shot Reasoners", arXiv 2205.11916, submitted May 24, 2022, NeurIPS 2022) showed that the exemplars are not strictly necessary. Simply prepending the phrase "Let's think step by step" to the question, with no worked examples at all, elicits a similar reasoning trace. The reported gains on text-davinci-002 were dramatic for a zero-token prompt change: MultiArith accuracy jumped from 17.7% to 78.7%, and GSM8K from 10.4% to 40.7% (Kojima 2022). The technique also worked on PaLM 540B and improved performance on symbolic reasoning (Last Letter, Coin Flip) and logical reasoning (Date Understanding, Tracking Shuffled Objects).

The paper used a two-stage prompt: first append "Let's think step by step" and sample a reasoning trace, then append the trace and a phrase like "Therefore, the answer (Arabic numerals) is" and sample the answer. This two-stage structure foreshadows the architectural separation between reasoning and answer that later "thinking" models would formalize at the API layer.

Zero-shot CoT mattered because it suggested that the latent capability was sitting unused inside any sufficiently large model — you did not need a curated set of in-domain exemplars to surface it. This was the moment when prompt-engineering folk wisdom started to converge on "ask the model to think first" as a default, and when reasoning began to feel like a property of the model rather than a property of carefully constructed prompts.

Other trigger phrases were explored ("Let's solve this step by step", "Let's think carefully", "Let's break this down"); "Let's think step by step" was simply the one that worked broadly enough across tasks to become the canonical phrase. The fact that a fixed natural-language phrase could activate a reasoning mode also foreshadowed the later split where "thinking" became its own configurable mode at the API layer — the prefix-as-switch in 2022 became `thinking: {type: "enabled"}` in 2025.

## Self-Consistency and Tree of Thoughts

### Self-consistency (Wang et al. 2022)

"Self-Consistency Improves Chain of Thought Reasoning in Language Models" (Wang et al. 2022, arXiv 2203.11171, v1 March 21, 2022, ICLR 2023) replaces greedy decoding of a single chain with sampling many chains and taking a majority vote over the final answers. The motivating intuition is that hard problems typically admit several different valid reasoning paths that all land on the same answer, while incorrect reasoning tends to disagree about the answer. Marginalizing over reasoning paths then concentrates probability on the correct answer.

The reported gains stacking on top of CoT prompting were large: +17.9% on GSM8K, +11.0% on SVAMP, +12.2% on AQuA, +6.4% on StrategyQA, +3.9% on ARC-Challenge (Wang 2022). Self-consistency requires no extra training or prompt engineering — it is purely a decoding-time technique — and it became the standard way to squeeze additional accuracy out of CoT prompting on benchmarks. Its descendants include weighted majority voting, verifier-reranked sampling, and the parallel-sample test-time-compute curves that OpenAI reported for o1.

Self-consistency also matters conceptually: it was the first widely-cited demonstration that inference-time compute (more samples, more reasoning) can substitute for training compute or parameter count on reasoning tasks. That observation underpins the entire "thinking model" thesis two years later.

A nuance to note: self-consistency assumes the model has a non-trivial probability mass on the correct answer to begin with. If the modal sample is wrong, majority voting concentrates *more* probability on the wrong answer. This is the same observation that motivates verifier-reranking schemes (use a separate model to score samples) and learned aggregation: pure unweighted voting is a strong baseline but not optimal. In practice the technique was most powerful as a cheap diagnostic and accuracy floor for CoT-style prompting; production systems that need maximum accuracy typically reach for tree search, verifier reranking, or a trained thinking model rather than naive self-consistency.

### Tree of Thoughts (Yao et al. 2023)

Tree of Thoughts (ToT) (Yao et al. 2023, arXiv 2305.10601, submitted May 17, 2023, NeurIPS 2023) generalizes the linear CoT chain into a search tree. Instead of one chain or many independent parallel chains, the model proposes several candidate next "thoughts" at each step, self-evaluates them (typically via a separate value prompt scoring each candidate), and uses classical search (BFS or DFS) with backtracking to explore the promising branches.

The paper picked tasks where linear CoT visibly struggles: Game of 24 (combine four numbers using +, −, ×, ÷ to reach 24), Creative Writing (compose a coherent passage from constraints), and 5×5 Mini Crosswords. The Game of 24 result was the most striking: standard CoT with GPT-4 achieved only 4% success, while ToT achieved 74% (Yao 2023). The improvement comes from the ability to abandon a partial reasoning path that is heading nowhere and try a different one — exactly what linear CoT cannot do because once a token is emitted it conditions everything downstream.

ToT was influential as a concept (search over reasoning states is the obvious generalization of linear chains) but in practice it is expensive — it issues many LLM calls per problem — and most production systems do not implement full tree search. What survived from ToT is the broader idea that reasoning can be structured as exploration with self-evaluation, an idea that returns in different form inside the trained thinking models, which appear to learn an implicit "try, evaluate, backtrack" pattern within a single rollout.

A taxonomy from this period that has held up:

- **Chain** (CoT): one linear reasoning trace, single rollout.
- **Multi-chain** (self-consistency): several independent linear traces, vote at the end.
- **Tree** (ToT): branch, self-evaluate, backtrack.
- **Graph** (later: Graph of Thoughts, Besta et al. 2023): allow merging of partial reasoning states.

Modern thinking models effectively learn an internalized version of the multi-chain and tree patterns: the trace from o1 or R1 frequently shows the model trying one approach, noticing a problem, abandoning it, and trying another, all within a single rollout. The classical algorithms are still occasionally useful as outer-loop scaffolds for very hard problems, but for most tasks the cost-accuracy curve has shifted toward "one expensive thinking rollout from a strong model" rather than "many cheap rollouts from a weaker model arranged in a clever search."

One way to view the progression Wei → Wang → Yao(ToT) → o1/R1: each step buys accuracy on hard problems by adding compute, but moves the compute closer to the model. CoT adds tokens to the rollout. Self-consistency adds parallel rollouts. ToT adds a structured search over rollouts with an external scoring step. Trained thinking models bake the equivalent of search-and-evaluate inside a single rollout, where the model has learned when to expand a branch, when to backtrack, and when to commit. The external scaffolds have not disappeared, but they are now stacked on top of models that already do a lot of the work internally.

## ReAct: The Agent-Loop Spine

"ReAct: Synergizing Reasoning and Acting in Language Models" (Yao et al. 2022/2023, arXiv 2210.03629) is the single most consequential paper for the modern agent loop. The arXiv v1 was submitted on October 6, 2022, and the paper was published at ICLR 2023. The authors are Shunyu Yao, Jeffrey Zhao, Dian Yu, Nan Du, Izhak Shafran, Karthik Narasimhan, and Yuan Cao (Princeton/Google Research).

The contribution is the prompt format and the loop. A ReAct trajectory interleaves three kinds of tokens:

- **Thought** — a free-text reasoning step where the model decides what to do next
- **Action** — a structured call into an external environment (a Wikipedia search, a click in a web shop, a navigation step in a household sim)
- **Observation** — the environment's response, fed back into the context

The model is prompted with a few worked examples of `Thought → Action → Observation → Thought → Action → Observation → … → Answer` and then asked to continue the same pattern on a new problem. The "thought" channel lets the model plan, decompose, decide which tool to call, and react to surprising observations; the "action" channel lets it gather information from outside its own weights; the "observation" channel grounds the reasoning in real-world feedback rather than internal hallucination.

The empirical evaluation covered four task families:

- **HotpotQA** — multi-hop QA with Wikipedia search/lookup actions. ReAct reduced hallucinations relative to pure CoT and produced interpretable trajectories.
- **FEVER** — fact verification via Wikipedia. Similar story.
- **ALFWorld** — text-based household task simulator. ReAct improved success rate by an absolute 34 percentage points over the strongest imitation-learning and RL baselines.
- **WebShop** — simulated online shopping environment. ReAct improved success rate by 10 absolute points over the prior best, using only one or two in-context examples (Yao 2022).

The deeper claim is that reasoning and acting are complementary. CoT alone can hallucinate facts. Acting alone (issuing tool calls without thinking about why) leads to brittle, brute-force behavior. Interleaving them gives you both grounded inputs and a planning channel that can react to what those inputs say.

Why ReAct is the spine of the modern agent loop: every subsequent agent framework (LangChain agents, AutoGPT, OpenAI function-calling agents, the Anthropic computer-use / Claude Code style, Cursor, Devin, Gemini agents, Google's Agent Builder, Microsoft's AutoGen) implements the same canonical cycle — *reason → act → observe → reason* — even when the surface syntax differs and even when "thought" is implicit (e.g., subsumed into an extended-thinking block before each tool call). The output of a single LLM call is conceptually one trip around the loop; the agent harness's job is to run the loop, route actions to tools, and feed observations back in. ReAct is the pattern, not just a paper, and tool-calling APIs are essentially structured implementations of it.

A useful way to see the lineage: when OpenAI introduced function calling in June 2023, the API change looked like a small syntactic upgrade (the model can emit a structured `function_call` field instead of plain text). It was really the ReAct pattern moved from prompt convention into the protocol. The same is true of Anthropic's `tool_use` content type, Google's function-calling, and the Model Context Protocol (MCP). Once the action channel is typed and the observation channel is typed, the whole agent harness reduces to: run a turn, route any tool calls, append the results as observation messages, run another turn, until the model stops producing tool calls. That structure is ReAct, expressed in JSON instead of in `Thought:` / `Action:` / `Observation:` tokens.

ReAct's other quiet contribution was *evaluation methodology*. By picking ALFWorld and WebShop — interactive environments with success/failure outcomes — the paper grounded reasoning evaluation in something more honest than benchmark accuracy. You cannot bluff your way through an interactive task; either the room got cleaned or it did not, either the right item was bought or it was not. That eval mindset (interactive task success, trajectory-level grading) carried forward into SWE-Bench, WebArena, OSWorld, GAIA, AgentBench, and the rest of the modern agent benchmark suite.

## Reflexion: Verbal Self-Critique

"Reflexion: Language Agents with Verbal Reinforcement Learning" (Shinn et al. 2023, arXiv 2303.11366, submitted March 20, 2023, NeurIPS 2023) wraps another loop around the ReAct loop: after an attempt at a task, the agent reads its own trajectory and the outcome, writes a natural-language self-critique ("the reason I failed was that I forgot to check whether the list was empty"), stores that critique in an episodic memory buffer, and on the next attempt at the same or similar task it conditions on the accumulated critiques. The "reinforcement learning" framing is metaphorical — no weights are updated — but the loop has the same structure as RL: try, get feedback, reflect, retry, with the reflection serving as the gradient signal in token space.

The headline numbers were on HumanEval, where Reflexion-augmented GPT-4 reached 91% pass@1, compared to 80% for vanilla GPT-4 (Shinn 2023). The framework also showed gains on AlfWorld (decision-making) and HotpotQA (reasoning). Importantly, Reflexion accommodates several flavors of feedback signal: a binary task success/failure, a unit-test pass/fail count, free-form natural-language criticism from a separate evaluator model, or scalar scores.

Reflexion's durable contribution is the pattern of *verbal* learning — using natural language as the substrate for the agent to update its strategy between attempts, instead of weight updates. This idea reappears in modern agent frameworks as scratchpads, episodic memory, post-hoc trace summarization, and "lessons learned" files that production agents carry across runs. It is also a precursor to the inner-loop self-correction that o1, R1, and Claude extended thinking learn during their RL post-training: rather than having a separate outer Reflexion loop, the model learns to do mid-rollout reflection within a single thinking trace ("wait, that's wrong, let me reconsider").

The Reflexion paper's structural decomposition is worth naming because it became a template:

- **Actor**: the agent that generates trajectories (typically a ReAct agent).
- **Evaluator**: a function (model-based, rule-based, or environment-based) that scores the trajectory.
- **Self-reflection module**: an LLM call that reads the trajectory and evaluator score and writes a short natural-language critique.
- **Memory**: a buffer of critiques (and optionally trajectories) that is prepended to the next attempt.

Production agent harnesses recognizably implement variants of this. Claude Code's plan files, Devin's notebook, Cursor's session memory, and the rules/instructions files that ship with most agent frameworks are all forms of Reflexion-style verbal memory, generalized from per-task retry to per-project accumulated context.

Reflexion also clarified a tension that later thinking models would inherit: how do you weight self-evaluation when the model is the thing being evaluated? If the actor and the evaluator share weights, the evaluator can be wrong in the same direction as the actor — confidently mistaken about its own mistakes. Reflexion handled this by allowing external feedback (test results, environment outcomes), which is the same move that o1 and R1 made at training time when they preferred RL rewards from verifiable signals (test pass/fail, numerical correctness) over learned reward models.

## Reasoning-as-Output: o1, Claude Extended Thinking, Gemini Thinking, DeepSeek-R1

The previous techniques are prompt-level. By late 2024 the major labs had moved reasoning into post-training: instead of asking a general-purpose model to think step-by-step, they explicitly trained models to produce extended internal reasoning and then a short final answer, and exposed that split at the API layer.

### OpenAI o1 (September 2024) and o3 (December 2024 / April 2025)

OpenAI's o1 series was the first commercial "thinking model" surface. o1-preview and o1-mini shipped on September 12, 2024, with the full o1 released on December 5, 2024 alongside ChatGPT Pro (OpenAI 2024). The OpenAI blog post "Learning to Reason with LLMs" describes the model as trained with large-scale reinforcement learning to produce a long internal chain of thought before answering, with the headline empirical claim that performance scales smoothly with both training-time RL compute and inference-time thinking compute — i.e., a model given more tokens to think in does measurably better.

Reported benchmarks (OpenAI 2024):

- AIME 2024 (American Invitational Mathematics Examination): o1-preview solved 83% (12.5/15) of problems vs 13% (1.8/15) for GPT-4o
- Codeforces: 89th percentile (competitive programming Elo)
- GPQA Diamond (graduate-level science): PhD-level on physics, chemistry, biology subsections

Crucially, OpenAI chose to *hide* the raw chain of thought. The user, and the API caller, sees only a model-generated summary of the reasoning plus the final answer. OpenAI's stated rationale (in "Learning to Reason with LLMs" and subsequent posts) is threefold: (1) authentic CoT monitorability — they want the model's "thoughts" not to be trained on user-facing safety constraints, so that the unaligned-looking thoughts remain visible to them internally as a misbehavior-detection signal; (2) safety — exposing unfiltered reasoning could leak harmful intermediate content; (3) competitive moat — the raw chains are training-data-quality reasoning traces that competitors would distill from. OpenAI's Acceptable Use Policy explicitly forbids attempts to extract the raw reasoning, and the API charges for hidden reasoning tokens as "reasoning_tokens" line items even though the user does not see them.

The training story OpenAI gave for o1 is sparse on specifics but consistent in shape with what DeepSeek later described in detail for R1: a large-scale reinforcement learning stage where the model is rewarded for producing reasoning traces that lead to correct answers on verifiable problems (math, code, multi-step QA). The model learns to allocate more thinking tokens to harder problems, and to deploy patterns like backtracking, self-checking, restating the problem, and switching strategies when stuck. OpenAI showed two scaling curves: one of accuracy vs RL training compute (sub-log-linear improvement, the conventional pre-training-style curve) and one of accuracy vs inference-time thinking compute (also smooth and substantial), arguing that thinking compute is a real second axis of capability scaling that the field had previously under-exploited.

o3 and o4-mini were announced on December 20, 2024 and released on April 16, 2025 (OpenAI 2025). o3 added agentic tool use directly from inside the reasoning trace — web browsing, Python execution, file operations, image generation, and image-input "thinking with images." Reported gains over o1 included roughly 3× the accuracy on ARC-AGI and ~20% fewer major errors on expert-rated real-world tasks (OpenAI 2025). The architectural significance of o3 is that the thinking trace is no longer a closed monologue; tool calls happen *inside* it, which is ReAct-style interleaving moved from prompt-level to model-native.

This is the most consequential design move in Tier 3, and it deserves emphasis. In the pre-o3 design (o1 and prior thinking models), a single API call produced: think privately, then answer. To use tools you needed an outer loop: think + answer → tool call → think + answer → tool call → … In o3 and the contemporary Claude 4.x and Gemini 2.5 designs, a single API call can produce: think, call tool, observe result inside the same thinking trace, think more, call another tool, observe, think more, answer. The agent harness still exists but it is now responsible for far fewer round trips — a long task that might have taken twenty API calls in 2023 might take one in 2025. This compresses the outer loop and pushes more agency into the model itself, which has follow-on consequences for cost (a single long call), latency (less round-trip overhead), and observability (the harness sees a single trajectory rather than dozens of fragments).

### Claude extended thinking (Anthropic, February 2025)

Anthropic introduced extended thinking with Claude 3.7 Sonnet on February 24, 2025 ("Claude 3.7 Sonnet and Claude Code", Anthropic 2025). The framing was distinctive: rather than ship a separate reasoning model, Anthropic argued that "reasoning should be an integrated capability of frontier models rather than a separate model entirely." Claude 3.7 Sonnet is a single model that operates either in standard mode (regular generation) or in extended thinking mode (a thinking block before the final answer), toggleable per request.

The API exposes thinking as a first-class content block alongside `text` and `tool_use`. A request enables it via a `thinking` object on the Messages API (`{"type": "enabled", "budget_tokens": N}`), and the response comes back with one or more `{"type": "thinking", "thinking": "…", "signature": "…"}` blocks followed by `{"type": "text", "text": "…"}` blocks (Anthropic Claude docs). Key API properties:

- **budget_tokens** caps how many tokens Claude can spend thinking before it must produce a final answer; must be less than `max_tokens`. Claude does not have to use the full budget.
- **signature** is a server-issued cryptographic tag attached to each thinking block. On multi-turn calls (and on the second leg of a tool-use round-trip), the client must pass the thinking blocks back unchanged with their signatures intact; the server decrypts them to reconstruct the prompt. This both preserves reasoning context across turns and prevents clients from forging or tampering with thinking content.
- **display field** (later addition): `summarized` returns model-generated summaries of thinking (default on Claude 4 models), `omitted` returns empty thinking strings while preserving the signature (default on Opus 4.7 and Mythos Preview), trading off latency for visibility.
- Anthropic initially shipped raw extended thinking visible to users — the "visible extended thinking" announcement explicitly said "we've decided to make its thought process visible in raw form" (Anthropic, "Claude's extended thinking" 2025) — taking the opposite design call from OpenAI. The company hedged this with a caveat about *faithfulness*: there is no guarantee that the visible thinking trace is the model's actual underlying reasoning process, only that it is the text-channel reasoning it produces.

Subsequent Claude models (Opus 4, Sonnet 4, Opus 4.5, Sonnet 4.5, Opus 4.6, Sonnet 4.6, Opus 4.7) extended this with "adaptive thinking" (the model decides how long to think rather than being given a fixed budget), and with longer thinking budgets and context-editing primitives for clearing stale thinking blocks from long agent traces.

The signature mechanism deserves a separate note because it solves a real engineering problem. Without it, a stateless API has no way to authenticate that the thinking block in the conversation history actually came from the model — a malicious client could craft fake thinking blocks that bias subsequent responses. The signature lets the server verify, on each turn, that the thinking it is re-incorporating into the prompt is one it produced. For tool-using agents this matters because the protocol typically is: model produces thinking + tool_use; client executes the tool; client sends back the thinking + tool_use + tool_result on the next turn. If the thinking blocks were not signed, the server would either have to re-derive them (defeating the purpose) or trust the client (opening an attack surface). The signature is the simplest fix and has become the de facto pattern for any provider that wants to expose thinking content.

### Gemini thinking models (Google, December 2024 / March 2025)

Google's first thinking model was Gemini 2.0 Flash Thinking, released as an experimental model on December 19, 2024 (Google DeepMind blog). It paired the speed of Flash with a CoT-style internal reasoning step. Performance was iteratively improved through early 2025.

Gemini 2.5 (Google, March 25, 2025) made thinking the default for the family. Google's framing: "Gemini 2.5 models are thinking models, capable of reasoning through their thoughts before responding" (Google DeepMind 2025). Reported benchmarks at launch included #1 on LMArena, 18.8% on Humanity's Last Exam without tool use, and 63.8% on SWE-Bench Verified. The 1M-token context window combines with extended thinking to allow very long deliberative passes over large inputs.

The Gemini API exposes thinking through the standard generation interface with optional "include thoughts" parameters; thoughts come back as parts of the response that can be displayed or omitted client-side. Google's design sits between OpenAI's (hidden) and Anthropic's (visible) defaults.

Google's contribution to the agent story is also the integration of thinking with very long context. Gemini 2.5's 1M-token context (with 2M announced) means a thinking model can read an entire codebase, RFP, or research paper corpus and reason over it without retrieval. That shifts the agent design space — many tasks that previously required a retrieval step plus a smaller model can be replaced by a single long-context thinking call. Whether that is the right architectural choice is workload-dependent (latency, cost, and recall vs precision tradeoffs all change), but it is a real option that the 2024-era models did not provide.

### DeepSeek-R1 (DeepSeek, January 2025)

DeepSeek-R1 (DeepSeek-AI, arXiv 2501.12948, January 22, 2025) was the first open-weight model to match o1-tier reasoning performance, and it shipped under an MIT license with full weights, a technical report, and six distilled checkpoints. It was eventually published as a Nature paper (volume 645, pp. 633-638, 2025).

The R1 recipe has two notable contributions. First, **R1-Zero** showed that a base model could be trained to do extended reasoning via pure reinforcement learning with verifiable rewards (correct answer / passing test cases) — no supervised fine-tuning on human reasoning traces at all (DeepSeek 2025). The model emergently developed self-reflection patterns (writing "wait, let me reconsider" mid-trace), verification (checking its own arithmetic), and dynamic strategy adaptation. R1-Zero suffered from readability and language-mixing problems, which motivated the second contribution. Second, **R1 proper** added a small cold-start SFT stage on curated reasoning traces, followed by RL, followed by SFT-on-RL-outputs, followed by a final RL pass — a multi-stage pipeline that retained R1-Zero's reasoning emergence while producing clean outputs. R1 reported performance comparable to o1 on math, code, and reasoning benchmarks.

Third, and most consequentially for the open ecosystem, DeepSeek **distilled R1's reasoning behavior into smaller dense models** — Qwen2.5 and Llama 3 variants at 1.5B, 7B, 8B, 14B, 32B, and 70B parameters — by training those smaller models on outputs sampled from R1. The distilled models out-performed RL-from-scratch baselines at the same size, which has the implication that, given access to a strong reasoning teacher, you can imbue much smaller models with comparable reasoning patterns at much lower training cost. This collapsed the gap between closed and open reasoning models almost overnight; the distilled 32B was competitive with much larger closed models on math benchmarks. The downstream effect across early-to-mid 2025 was a wave of open thinking models trained on R1-style distillation.

DeepSeek's specific RL methodology is worth noting because it was unusually simple: Group Relative Policy Optimization (GRPO), an actor-only variant of PPO that compares groups of sampled rollouts to estimate advantages, eliminating the separate value-model that PPO usually requires. The reward signals were rule-based — exact-match correctness for math, test-pass-rate for code — with no learned reward model in the main RL stage. The simplicity is part of what made the recipe reproducible: there are fewer moving parts to get wrong than in a full RLHF pipeline, and the rewards are computable cheaply and reliably from automatic checkers rather than from human feedback.

R1 also broke OpenAI's hidden-CoT moat: with weights available and MIT-licensed, anyone could read the raw reasoning traces, train on them, and build derivatives, which materially changed how "reasoning compute" gets priced in the market.

The R1 release had a second, more pedagogical effect: by writing down the recipe (RL with verifiable rewards on math/code, cold-start SFT for readability, multi-stage refinement, distillation to smaller models), DeepSeek made it concrete that the o1 result was reproducible and that the reasoning post-training pipeline was less mysterious than it appeared. Within months of R1, multiple labs released open reasoning models with similar pipelines (Qwen QwQ, Mistral reasoning variants, Llama distillation projects). The previously-tacit knowledge of "how to train a thinking model" became roughly common knowledge.

## The Output-Channel Split

A subtle but important design pattern crystallized in this generation: **reasoning trace and final answer are two separate output channels**. The user-facing answer is what gets shown by default; the trace is auxiliary, optionally visible, often summarized, and sometimes encrypted.

The implementations differ by provider:

- **OpenAI o1/o3**: Hidden raw CoT; user sees only a model-generated summary plus the answer. Reasoning tokens are billed as `reasoning_tokens`. Raw extraction is forbidden by ToS.
- **Anthropic Claude (3.7+)**: Initially visible raw thinking blocks; later configurable via `display: summarized | omitted`. Each thinking block carries a server-issued `signature` that must be passed back on multi-turn calls. Visible-by-default reflected a deliberate transparency stance, hedged with a faithfulness caveat.
- **Google Gemini 2.5**: Configurable per-request — clients can opt to include or omit thought parts.
- **DeepSeek-R1**: Open weights; the model itself emits `<think>…</think>` tags around the reasoning, and the consumer chooses whether to display them.

What unifies these is the API-level recognition that a single LLM response now contains two structurally different kinds of content with different downstream uses. Reasoning content is (a) probably more verbose than the user wants to see, (b) potentially less safety-filtered, (c) potentially proprietary, and (d) load-bearing for multi-turn context. Final answers are short, polished, displayed to users, and stable across retries. This split shows up in every modern provider's API and is now a property agents must explicitly handle: an agent's harness has to know which content blocks to display, which to log, which to feed back into the next turn, and which to discard.

For tool-using agents specifically, the split has a practical consequence. When an agent makes a tool call, the model's reasoning about *why* it is calling the tool, *what arguments* to use, and *what to do with the result* must persist across the call. That is exactly what Claude's signed thinking blocks (passed back across the tool-result round-trip) and OpenAI's reasoning-token persistence are designed to solve. The signature mechanism in particular is a quiet but important piece of plumbing: it lets the model re-enter its own reasoning state across a tool boundary without the client having to re-explain everything.

A subtle but important point: the split is asymmetric across providers, and that asymmetry leaks into agent code. Code written against OpenAI's API treats reasoning as an opaque billing line item plus a summary string; code written against Anthropic's API treats it as a content block with a signature that must be threaded through tool-use loops; code written against Gemini treats it as optional response parts. A cross-provider agent framework therefore needs an abstraction layer that maps each provider's thinking representation onto a common internal "reasoning content" type, and an explicit policy for what to surface, store, and re-send. The major frameworks (LangChain, LlamaIndex, AutoGen, the Vercel AI SDK, the Anthropic-and-OpenAI-native agent SDKs) have all converged on similar abstractions, but the details still differ enough to matter for production agents.

## What Modern Agents Inherit

Two patterns from Tier 3 are now load-bearing for essentially every production agent.

**1. ReAct as the agent-loop spine.** The *reason → act → observe → reason* cycle is the canonical shape of an agent's main loop. It is implemented at multiple levels:

- *Prompt level*: AutoGPT-era and LangChain agents literally prompt the model with ReAct-formatted exemplars and parse `Thought:` / `Action:` / `Observation:` tokens out of the output.
- *API level*: structured tool-calling APIs (OpenAI function calling, Anthropic tool_use, Google function calling) are formalized ReAct — the "action" channel is now a typed JSON tool call rather than a free-text token; observations come back as `tool_result` messages; reasoning persists as natural-language assistant content or as thinking blocks.
- *Model level*: in o3 and Claude 4.x and Gemini 2.5, tool calls happen *inside* the thinking trace, so a single LLM rollout can be a multi-step ReAct trajectory without the harness having to re-prompt between steps. The model issues a thought, calls a tool, sees the result, reasons further, calls another tool, and so on — all within one "response."

The implication is that everything in Tier 4 (tool use) and Tier 5 (long-horizon execution) sits on top of a ReAct shape, even when the surface UI hides it. When Claude Code or Cursor or Devin makes a code edit, runs tests, reads the failure, and patches the bug, that is a ReAct loop with code-execution as the action channel and test output as the observation channel.

**2. Reasoning trace as a first-class, separable output channel.** Modern agent code treats "the thing the model said it was thinking" and "the thing the model wants the user to see" as different content types with different lifecycles. Practical consequences for agent design:

- **Persistence**: thinking blocks must be carried across tool calls (via signatures, reasoning-token IDs, or framework-level scratchpads) so that the model re-enters its prior reasoning state.
- **Cost**: thinking tokens are billed (often heavily) but invisible to the user, which changes prompt-engineering economics — you optimize for terse answers and let the thinking budget absorb the deliberation.
- **Visibility**: agent harnesses must decide what reasoning to surface in UI (full, summarized, or hidden), what to log for debugging, and what to clear from context when traces get too long. Anthropic's `clear_thinking_20251015` context-editing primitive exists precisely for this.
- **Trust**: visible reasoning offers interpretability but, per Anthropic's faithfulness caveat and OpenAI's CoT-monitorability stance, the visible trace is not a guaranteed mirror of internal computation. Designers cannot rely on the trace as a ground-truth audit log, but they can use it as a useful heuristic signal.

Together these two patterns produce the recognizable shape of a modern agent: a loop that runs the model, lets it think privately, lets it act on the world through tools, feeds back what it sees, and repeats — until the agent decides it is done. Every later tier builds on that scaffold.

A few secondary inheritances worth naming:

- **Inference-time compute as a tunable lever.** Self-consistency, ToT, and o1/R1 all rely on the observation that more thinking tokens (or more parallel samples) buy more accuracy. Modern agents expose this as a knob: a reasoning effort parameter, a thinking budget, or a max sample count.
- **Self-critique inside the rollout.** Reflexion's outer loop has been internalized: trained thinking models emit mid-trace self-corrections ("wait, that's wrong"), which is a learned analog of Reflexion. Agent frameworks still implement outer-loop self-critique on top of this for harder tasks.
- **Search over reasoning.** Tree of Thoughts lives on in beam search, best-of-N, and verifier-reranked decoding for high-stakes reasoning workloads. It is rarely the default but it is a standard tool in the agent designer's kit when accuracy matters more than latency.
- **Verbal scratchpads.** The instinct from Reflexion that natural language is a fine medium for an agent to talk to its future self has hardened into the production pattern of writing plans, todo lists, and notes into context as the agent works. Claude Code's plan files and the now-standard practice of asking the model to "first write a plan, then execute it" both descend from this.
- **Verifiable-reward post-training.** R1 made explicit what o1 implied: that math and code, with their automatic correctness signals, are the cheapest substrate for training reasoning, and that the reasoning patterns learned there transfer to harder, less verifiable domains. This shaped the post-training playbook for every subsequent thinking model.

### How the patterns compose in a contemporary agent

Stacked together, the inheritances combine like this. The agent harness runs an outer loop. Each iteration sends a request to a thinking model with tools registered. The model produces a thinking block — internally it is doing something between linear CoT, internalized search, and internalized self-critique — and then issues one or more tool calls inside that same trace. The harness routes the tool calls, gets results, and either returns them within the same call (modern model-native style) or starts a new iteration with the results appended (classic ReAct outer-loop style). Across iterations, the harness may also write or update a plan file, log lessons learned, and clear stale thinking blocks from the context. The model's thinking is signed or summarized depending on provider; the user sees a polished answer; the developer sees the trajectory in their logs.

Every component of that sketch is from Tier 3. The thinking block is CoT/zero-shot-CoT made model-native. The internalized branching is ToT made model-native. The internalized self-critique is Reflexion made model-native. The tool calls inside the thinking block are ReAct made model-native. The outer harness is the original ReAct loop, now demoted to scaffolding around a model that does most of the work internally. The plan file is verbal-memory Reflexion. The signed thinking blocks are the output-channel split made API-native. Tier 4 (tool use) and Tier 5 (long-horizon execution) extend this scaffolding outward; Tier 3 is the work that made each component possible.

### A common thread through the tier

If there is a single through-line in Tier 3, it is the progressive *internalization* of techniques that started as external scaffolding. CoT prompting was an external trick; instruction tuning made it close to default behavior; thinking models made it the trained default. Self-consistency was an external decoding scheme; thinking models internalized something similar via in-trace self-checking. Tree of Thoughts was an external search loop; thinking models internalized branch-and-revise within a single rollout. Reflexion was an external retry loop; thinking models internalized mid-rollout self-correction. ReAct was an external prompt convention; tool-calling APIs and agent-native models internalized it into the model-API contract.

The pattern that has not been internalized is the *outer* agent loop itself. Even o3 and Claude 4.x, which can issue many tool calls inside one rollout, still bottom out in a harness that decides when the agent is done, what tools it has, how to handle errors, and what to display to the user. That outer loop is Tier 4 and Tier 5 material; Tier 3 ends at the point where the model itself is now a reasoning-and-acting unit, not just a next-token predictor.

### What did not survive

It is worth being honest about which Tier 3 ideas did *not* hold up as well in production:

- **Naive few-shot CoT exemplars.** Instruction-tuned models produce CoT-style reasoning on their own, and bespoke exemplar engineering is now mostly obsolete. The phrase "chain of thought" still appears in prompts, but the few-shot worked-example format from Wei 2022 is rare in production code.
- **Outer-loop self-consistency.** Sampling many independent rollouts and voting is expensive, and trained thinking models internalize a better version of the same idea. Self-consistency survives mostly as a research baseline and as a fallback for models without trained reasoning.
- **Full Tree of Thoughts.** Almost no production system implements ToT in its full form. The cost of issuing many speculative LLM calls per problem is hard to justify when a single thinking-model rollout often does better.
- **Visible-by-default raw reasoning.** Anthropic shipped visible thinking in February 2025 but has since added `display: summarized` and `display: omitted` options, with Opus 4.7 defaulting to omitted. The market revealed a preference for summaries: users want to know the model thought, but not always to read 8000 tokens of it. The compromise that has emerged across providers is "summary by default, raw on request."
- **Exposed raw reasoning as a competitive feature.** Initial bets that visible thinking would be a major user-facing differentiator gave way to the practical reality that raw thinking is verbose, sometimes confusing, and sometimes misleading. The thinking-as-debugging-tool case (for developers) is stronger than the thinking-as-product-feature case (for end users).
- **Reflexion as an architectural framework.** The verbal-self-critique pattern survived; the specific Actor/Evaluator/Reflection/Memory structure mostly did not. Modern frameworks implement Reflexion-like behavior more diffusely — scattered across system prompts, plan files, post-hoc summaries, and rule files — rather than as a labeled four-module architecture.

### Faithfulness and interpretability caveats

A persistent open question hovers over the entire tier: is the visible reasoning trace what the model is actually doing? Anthropic explicitly flagged the *faithfulness* problem in the visible-extended-thinking announcement, and subsequent interpretability work has shown that thinking traces can omit relevant influences, include post-hoc rationalizations, and disagree with what mechanistic analysis suggests is happening under the hood. The implication for agent designers is that thinking traces are useful but not reliable: useful as user-facing explanations, useful as debugging aids, useful as content to log and audit; not reliable as ground-truth descriptions of why the model produced the answer it did.

OpenAI's CoT-monitorability research takes the opposite framing but reaches a related conclusion: they keep raw CoT hidden specifically because they want it to remain a candid (if not fully faithful) signal about what the model is doing internally — a signal they can read to detect misbehavior. If user-facing thinking were optimized for user approval, OpenAI argues, it would lose its diagnostic value. This is the strongest argument for hiding raw CoT, and it explains the persistent across-provider design tension: optimizing thinking traces for user experience and optimizing them for safety monitoring may be partially incompatible goals.

Neither stance fully resolves the agent-design question. In practice, modern agent harnesses tend to treat thinking traces as advisory: log them, sometimes display them, never trust them as the source of truth about agent behavior. The source of truth is the trajectory — the sequence of actions taken and observations received — which is auditable in a way that the thoughts about those actions are not.

### Scaling laws for reasoning

A final point that links Tier 3 to the broader scaling story: o1 introduced into mainstream discussion a *second* scaling axis besides pre-training compute. The conventional picture from 2020-2023 was that capability scales with parameters and pre-training tokens (the Kaplan and Chinchilla curves). o1's "Learning to Reason with LLMs" post added two new curves — accuracy vs RL post-training compute and accuracy vs inference-time thinking compute — and showed both were smooth and substantial. DeepSeek-R1 reproduced the qualitative shape in an open setting. The implication is that "spend more compute at inference time" is now a real product knob alongside "use a larger model," and modern agent design has to budget across both axes.

This shows up in practice as the reasoning-effort parameter (OpenAI), the thinking budget (Anthropic), the include-thoughts flag (Google), and the open-source equivalent of "let the model write a longer `<think>` block before answering." For an agent designer, the question is no longer "which model do I use" but "which model at what thinking budget for which sub-task" — a routing problem that did not exist in the GPT-4 era because there was no thinking budget to vary. Tier 5 (long-horizon agents) will return to this question when it discusses cost and latency budgets across multi-hour task trajectories.

## Citations

Primary papers:

- Wei, J., Wang, X., Schuurmans, D., Bosma, M., Ichter, B., Xia, F., Chi, E., Le, Q., Zhou, D. (2022). "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models." NeurIPS 2022. arXiv:2201.11903. https://arxiv.org/abs/2201.11903
- Kojima, T., Gu, S. S., Reid, M., Matsuo, Y., Iwasawa, Y. (2022). "Large Language Models are Zero-Shot Reasoners." NeurIPS 2022. arXiv:2205.11916. https://arxiv.org/abs/2205.11916
- Wang, X., Wei, J., Schuurmans, D., Le, Q., Chi, E., Narang, S., Chowdhery, A., Zhou, D. (2022). "Self-Consistency Improves Chain of Thought Reasoning in Language Models." ICLR 2023. arXiv:2203.11171. https://arxiv.org/abs/2203.11171
- Yao, S., Yu, D., Zhao, J., Shafran, I., Griffiths, T. L., Cao, Y., Narasimhan, K. (2023). "Tree of Thoughts: Deliberate Problem Solving with Large Language Models." NeurIPS 2023. arXiv:2305.10601. https://arxiv.org/abs/2305.10601
- Yao, S., Zhao, J., Yu, D., Du, N., Shafran, I., Narasimhan, K., Cao, Y. (2022/2023). "ReAct: Synergizing Reasoning and Acting in Language Models." ICLR 2023. arXiv:2210.03629. https://arxiv.org/abs/2210.03629
- Shinn, N., Cassano, F., Berman, E., Gopinath, A., Narasimhan, K., Yao, S. (2023). "Reflexion: Language Agents with Verbal Reinforcement Learning." NeurIPS 2023. arXiv:2303.11366. https://arxiv.org/abs/2303.11366
- DeepSeek-AI (2025). "DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning." Nature 645, 633-638 (2025). arXiv:2501.12948. https://arxiv.org/abs/2501.12948

Provider announcements and documentation:

- OpenAI (September 12, 2024). "Learning to Reason with LLMs." https://openai.com/index/learning-to-reason-with-llms/
- OpenAI (September 12, 2024). "Introducing OpenAI o1-preview." https://openai.com/index/introducing-openai-o1-preview/
- OpenAI (April 16, 2025). "Introducing OpenAI o3 and o4-mini." https://openai.com/index/introducing-o3-and-o4-mini/
- OpenAI. "Detecting misbehavior in frontier reasoning models" (CoT monitoring stance). https://openai.com/index/chain-of-thought-monitoring/
- Anthropic (February 24, 2025). "Claude 3.7 Sonnet and Claude Code." https://www.anthropic.com/news/claude-3-7-sonnet
- Anthropic (February 24, 2025). "Claude's extended thinking." https://www.anthropic.com/news/visible-extended-thinking
- Anthropic. "Building with extended thinking" (API reference). https://docs.claude.com/en/docs/build-with-claude/extended-thinking
- Google DeepMind (December 19, 2024). "Gemini 2.0 Flash Thinking experimental." (Referenced in February 5, 2025 update post.) https://blog.google/technology/google-deepmind/gemini-model-updates-february-2025/
- Google DeepMind (March 25, 2025). "Gemini 2.5: Our newest Gemini model with thinking." https://blog.google/technology/google-deepmind/gemini-model-thinking-updates-march-2025/
- DeepSeek (January 20, 2025). "DeepSeek-R1 Release." https://api-docs.deepseek.com/news/news250120
- DeepSeek-R1 on Hugging Face. https://huggingface.co/deepseek-ai/DeepSeek-R1

Secondary references:

- Wikipedia, "OpenAI o1." https://en.wikipedia.org/wiki/OpenAI_o1
- Wikipedia, "OpenAI o3." https://en.wikipedia.org/wiki/OpenAI_o3
- Schaeffer, R., Miranda, B., Koyejo, S. (2023). "Are Emergent Abilities of Large Language Models a Mirage?" NeurIPS 2023. (Contesting the emergent-abilities framing used by CoT.) arXiv:2304.15004.
- Besta, M., Blach, N., et al. (2023). "Graph of Thoughts: Solving Elaborate Problems with Large Language Models." arXiv:2308.09687. (Graph generalization of ToT.)
- Simon Willison (February 25, 2025). "Claude 3.7 Sonnet, extended thinking and long output, llm-anthropic 0.14." https://simonwillison.net/2025/Feb/25/llm-anthropic-014/
- OpenAI Help Center, "Model Release Notes." https://help.openai.com/en/articles/9624314-model-release-notes
