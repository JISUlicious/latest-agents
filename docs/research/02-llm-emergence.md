# Tier 2 — LLM Emergence (2020–2023)

## Overview

Between 2020 and the end of 2023, language models stopped being a research
artifact you fine-tune for a task and started being a *product surface* you
talk to. The arc has three legs: (1) **scale unlocks in-context learning**
(GPT-3, Brown et al. 2020), so prompting replaces fine-tuning as the default
way to specialize a model; (2) **instruction tuning + RLHF turn the base
model into a follower of natural-language commands** (FLAN 2021; InstructGPT
2022; ChatGPT Nov 2022); and (3) **a chat-tuned product wave** — ChatGPT,
Claude, GPT-4, Gemini — plus an open-weight surge from Llama 1/2,
Mistral/Mixtral, Qwen, DeepSeek, and the Hermes community — standardizes the
"system/user/assistant" message shape that every modern agent stack now
inherits. The "instruction-following partner with a safety baseline behind a
chat API" is the artifact this tier hands forward.

## GPT-3 and in-context learning

### The paper

Brown et al., *Language Models are Few-Shot Learners*, arXiv:2005.14165,
submitted May 28, 2020 (final v4 July 22, 2020). 175B parameters, decoder-only
Transformer, autoregressive next-token training on a filtered Common Crawl mix
plus WebText2, Books1/Books2, and Wikipedia. The paper introduces three
prompting regimes that have become standard vocabulary:

- **Zero-shot**: task is described in natural language; no examples.
- **One-shot**: one demonstration appears in the prompt.
- **Few-shot**: a handful of demonstrations appear in the prompt; no gradient
  updates.

The headline finding: with enough scale, *all three regimes work* on a wide
range of NLP tasks, with few-shot in particular approaching or matching
fine-tuned baselines on many benchmarks — without ever touching the weights.
The paper calls this **in-context learning**: the model treats the prompt
itself as the specification of the task. (Brown 2020)

### Why this was a paradigm shift

Until 2020, the dominant workflow was BERT-style: pretrain once, then
fine-tune a copy per task with labeled data. GPT-3 showed that at sufficient
scale a single frozen model can do many tasks, dispatched by the natural
language prompt. Two consequences:

- **Fine-tuning lost ground at the application layer.** The marginal cost of
  a new "task" dropped from "collect labels, train, deploy a new artifact"
  to "write a prompt." Prompts became first-class engineering objects.
- **The product surface became text.** A single API endpoint can subsume
  many features. This is the seed of the chat-API abstraction.

### Emergent capabilities, and the pushback

Wei et al., *Emergent Abilities of Large Language Models* (arXiv:2206.07682,
June 2022) catalogued ~100+ capabilities that appear sharply at scale and
are absent in smaller models — multi-digit arithmetic, instruction-following,
chain-of-thought reasoning, multi-step word problems. (Wei 2022a)

Chain-of-thought prompting itself was formalized in Wei et al.,
*Chain-of-Thought Prompting Elicits Reasoning in Large Language Models*
(arXiv:2201.11903, January 2022): inserting "think step by step" style
reasoning traces into few-shot exemplars drastically improves arithmetic,
commonsense, and symbolic reasoning at 100B+ scale. The 540B PaLM hit SOTA on
GSM8K with eight CoT exemplars. (Wei 2022b)

The "emergence" framing was contested. Schaeffer et al., *Are Emergent
Abilities of Large Language Models a Mirage?* (arXiv:2304.15004, NeurIPS
2023 Outstanding Paper), argues that the sharp emergence curves are largely
artifacts of nonlinear/discontinuous metrics (e.g., exact-match): swap in a
continuous metric and the curve smooths out. The substantive claim — that
capabilities improve with scale — still holds; the discontinuity does not.
(Schaeffer 2023)

### What this tier handed forward

- Prompts are the API.
- Behaviors are *demonstrated*, not labeled.
- Scaling laws are the planning tool: more compute and more data are
  expected to keep paying off until proven otherwise.

## Instruction tuning (InstructGPT, FLAN)

### The gap GPT-3 exposed

Base GPT-3 is trained to *continue text*. Continuation is not the same as
answering a question, following a directive, or refusing a harmful request.
Users wanted "do what I tell you" behavior; the base model was happy to roll
into a plausible-sounding continuation that ignored or even contradicted the
instruction. Instruction tuning is the supervised step that closes this gap.

### FLAN (Wei et al., 2021)

Wei et al., *Finetuned Language Models Are Zero-Shot Learners*,
arXiv:2109.01652 (v1 Sept 3, 2021). Method: take 60+ existing NLP datasets,
**re-write each as natural-language instructions** ("Classify the sentiment
of the following movie review: ..."), and fine-tune a 137B LaMDA-style model
on the union. Result: FLAN's zero-shot performance beats few-shot GPT-3 175B
on 20 of 25 evaluated tasks (ANLI, RTE, BoolQ, ARC, OpenbookQA, StoryCloze).
(Wei 2021)

Three ingredients identified in ablations: **number of finetuning tasks,
model scale, and use of natural-language instructions** (vs. raw input/output
pairs).

### Scaling instruction tuning — FLAN-PaLM / Flan-T5 (Chung et al., 2022)

Chung et al., *Scaling Instruction-Finetuned Language Models*,
arXiv:2210.11416 (Oct 20, 2022). Tunes instruction-following along three
axes: (1) number of tasks (1,836 in this round), (2) model size (up to
PaLM 540B), and (3) **inclusion of chain-of-thought reasoning traces** in
the tuning mix. Flan-PaLM 540B beats PaLM 540B by ~9.4% on average and hits
75.2% on 5-shot MMLU; Flan-T5 (11B) is competitive with un-tuned PaLM 62B on
some tasks despite being ~5× smaller. The takeaway: instruction tuning is a
**general-purpose capability multiplier**, not a per-task trick. (Chung 2022)

### InstructGPT (Ouyang et al., 2022)

Ouyang et al., *Training Language Models to Follow Instructions with Human
Feedback*, arXiv:2203.02155 (March 4, 2022). The defining recipe combining
supervised instruction tuning *and* RLHF. Three stages:

1. **SFT**: human contractors write demonstrations of "good" responses to
   prompts collected from the OpenAI API; the base model is supervised on
   these.
2. **Reward model training**: humans rank multiple model completions per
   prompt; a separate model is trained to predict the ranking (a reward
   model).
3. **RL fine-tuning (PPO)**: the SFT model is fine-tuned with Proximal
   Policy Optimization (Schulman 2017) against the reward model, with a
   KL penalty back to the SFT model to prevent reward hacking.

The headline result: human labelers prefer the 1.3B InstructGPT outputs to
the 175B GPT-3 outputs — a **>100× parameter-efficient gain in human
preference** — at the cost of small regressions on academic NLP benchmarks
(the "alignment tax"). Truthfulness improves; toxicity drops. (Ouyang 2022)

This paper is the practical blueprint everyone else copies. The OpenAI API
model `text-davinci-003` (released Nov 28, 2022) was, per OpenAI's later
documentation, the first publicly shipped model trained with the full
RLHF/PPO pipeline; earlier `text-davinci-001/002` used the supervised
component only.

### "Complete this text" → "do what I tell you"

The substantive shift is from a language model that *predicts* to one that
*responds*. After instruction tuning, the same model can answer questions,
follow multi-step directives, refuse, summarize, translate, and reformat —
all dispatched by natural language alone. Instruction-tuned weights are now
table stakes; nobody ships a chat product on a base model.

## Alignment training (RLHF, DPO, and successors)

### Origin: Christiano et al. (2017)

Christiano, Leike, Brown, Martic, Legg, Amodei, *Deep Reinforcement Learning
from Human Preferences*, arXiv:1706.03741 (June 12, 2017). Original setting
was Atari and MuJoCo locomotion, not language. The core insight: you don't
need to *specify* a reward function — you can *learn* one from pairwise human
preferences over trajectory segments, then optimize with standard RL. The
paper shows non-trivial behaviors learned from ~1 hour of human feedback,
covering less than 1% of agent interactions. (Christiano 2017)

This is the template InstructGPT later imports wholesale into language.

### RLHF for language: the standard recipe

By 2022 the language-model version is a stable three-stage pipeline:

1. **SFT** on instruction demonstrations.
2. **Reward model** trained on pairwise human preference labels over model
   completions.
3. **PPO** (Schulman et al. 2017, arXiv:1707.06347) against that reward
   model with a KL penalty back to the SFT policy.

The PPO step adds a "critic" (a value estimator), making this a relatively
heavy training setup: four models in memory (policy, reference, reward,
critic), reward-hacking risk, hyperparameter sensitivity.

Anthropic's *Training a Helpful and Harmless Assistant with Reinforcement
Learning from Human Feedback* (Bai et al., arXiv:2204.05862, April 12, 2022)
is the parallel public RLHF recipe from outside OpenAI, with the HH-RLHF
preference dataset released openly on GitHub/HuggingFace — a key piece of
public infrastructure for the open-source RLHF wave that followed.
(Bai 2022a)

### Constitutional AI / RLAIF (Anthropic, 2022)

Bai et al., *Constitutional AI: Harmlessness from AI Feedback*,
arXiv:2212.08073 (Dec 15, 2022). Replaces the human harmlessness labels in
RLHF with **AI-generated critiques and revisions** guided by a written
"constitution" — a short list of principles ("the response should not be
discriminatory," etc.). Two stages:

- **SL-CAI**: the model critiques and revises its own outputs against the
  constitution; the revised outputs become SFT data.
- **RL-CAI / RLAIF**: a preference model trained on AI-generated comparisons
  drives RL.

The substantive bet: scaling supervision is the long-run bottleneck, and
*using a model to evaluate a model* is the only way to keep up. This is the
training methodology Anthropic positioned Claude on. (Bai 2022b)

### DPO — getting rid of the RL step (Rafailov et al., 2023)

Rafailov, Sharma, Mitchell, Ermon, Manning, Finn, *Direct Preference
Optimization: Your Language Model is Secretly a Reward Model*,
arXiv:2305.18290 (May 29, 2023). DPO derives a closed-form mapping between
the optimal RLHF policy and the preference data, so you can train directly
on pairs `(prompt, chosen, rejected)` with a **simple classification loss**
— no separate reward model, no PPO, no sampling during fine-tuning, no
critic. Matches or beats PPO-based RLHF on standard preference benchmarks
while being dramatically simpler to implement. (Rafailov 2023)

DPO was adopted very quickly across the open-source ecosystem because it
fits on a single GPU and uses standard supervised-training infrastructure.
By late 2023 most open-weight chat models published preference-tuned
variants via DPO.

### Successors: IPO, KTO

- **IPO** (Identity Preference Optimization). Azar et al., *A General
  Theoretical Paradigm to Understand Learning from Human Preferences*,
  arXiv:2310.12036 (Oct 18, 2023). Introduces a generic ΨPO family that
  contains both RLHF and DPO as special cases; setting Ψ = Identity yields
  IPO, a squared-error loss on implicit-reward differences. Motivation:
  DPO can overfit on deterministic / nearly-deterministic preferences via
  the Bradley-Terry assumption; IPO regularizes that away. Useful when
  preference labels are noisy or near-deterministic. (Azar 2023)
- **KTO** (Kahneman-Tversky Optimization). Ethayarajh, Xu, Muennighoff,
  Jurafsky, Kiela, *KTO: Model Alignment as Prospect Theoretic
  Optimization*, arXiv:2402.01306 (Feb 2, 2024). Frames alignment via
  prospect theory; learns from **binary "good/bad" labels on single
  responses** rather than pairwise preferences. Practically attractive
  because per-example feedback is much cheaper to collect than pairs.
  Matches or beats DPO at 1B–30B scale. (Ethayarajh 2024)

### Why RLHF replaced supervised fine-tuning for alignment

- **SFT teaches the model what good answers *look like*.** RLHF teaches it
  what to prefer when multiple plausible answers exist, including the meta-
  preference to refuse, to ask for clarification, to hedge.
- **SFT can't naturally encode "don't do X."** A negative example is just
  another label to imitate; the model has no signal that one direction is
  worse. RLHF/DPO's pairwise structure gives the model a *direction* of
  improvement.
- **SFT data scales poorly past a point.** RLHF/DPO can keep improving by
  cheap comparisons even when high-quality demonstrations have plateaued.

### What this tier handed forward

- A reusable **alignment pipeline**: SFT → preference data → RLHF/DPO/...
  — applied to *every* shipped chat model since.
- A working notion of **refusal as a first-class behavior**, trained in.
- A research community whose default question is "where does the preference
  signal come from?" not "what's the loss?"

## The chat-tuned product wave

### ChatGPT (November 30, 2022) — the inflection point

OpenAI published *Introducing ChatGPT* on November 30, 2022. Built on
GPT-3.5 (the InstructGPT lineage, RLHF + PPO), wrapped in a conversational
UI at `chat.openai.com`. The pitch: "interacts in a conversational way...
answer followup questions, admit its mistakes, challenge incorrect premises,
and reject inappropriate requests." Free research preview; over 1M users in
the first five days; fastest-growing consumer product in history at the
time. (OpenAI 2022)

ChatGPT's importance is not really technical — `text-davinci-003`, released
Nov 28, 2022, used the same RLHF training recipe — it is **product**:

- A chat UI that hid the prompt and exposed turn-by-turn dialogue.
- A latent system message, role-tagged conversation history, and an
  assistant persona that the user could ignore but always existed.
- Default safety behavior that *shipped*, rather than appearing as a
  caveat in a model card.

It is the moment LLMs became consumer infrastructure.

### GPT-3.5-Turbo API (March 1, 2023) and ChatML

On March 1, 2023 OpenAI shipped the `gpt-3.5-turbo` Chat Completions API,
~10× cheaper than `text-davinci-003`, and documented the **ChatML**
message-list format with `system`, `user`, `assistant` roles. The chat
surface — previously hidden behind a web UI — became the canonical
programmatic interface. ChatML's role triplet has since become the de facto
universal shape for talking to LLMs, copied by Anthropic, Google, Meta,
Mistral, and effectively every open-weight model's "chat template." (OpenAI
2023a)

### GPT-4 (March 14, 2023)

OpenAI, *GPT-4 Technical Report*, arXiv:2303.08774, released March 14, 2023.
Multimodal (text + image input, text output), large jump in reasoning,
exam-passing benchmarks. The technical report does not disclose parameter
count, training data, or training compute — a notable break from GPT-2/3
disclosure norms. RLHF-aligned; same chat API shape as 3.5-Turbo, with a
larger context window (8K and 32K variants at launch). (OpenAI 2023b)

### Claude 1 (March 14, 2023) and Claude 2 (July 11, 2023)

Anthropic's Claude launched on **March 14, 2023** (the same day GPT-4
released — accidental or otherwise, the same news cycle), in two tiers:
Claude and Claude Instant. Positioning: trained with Constitutional AI;
emphasized **steerability**, **conversational quality**, and a **lower
harmful-output rate** rather than raw benchmark wins. API-only initially.
(Anthropic 2023a)

**Claude 2** released July 11, 2023, with longer context (100K tokens), an
open beta web UI at `claude.ai`, and improved coding/reasoning. This is
where Claude becomes available to the general public, not just enterprise
partners. (Anthropic 2023b)

### Llama (Meta, February 24, 2023) and Llama 2 (July 18, 2023)

Touvron et al., *LLaMA: Open and Efficient Foundation Language Models*,
arXiv:2302.13971, announced **Feb 24, 2023** (paper Feb 27). Sizes: 7B,
13B, 33B, 65B. Trained on 1.0–1.4T tokens of public data, no proprietary
mixes. Originally released for research use; weights leaked within a week,
and Meta de facto accepted the leak as the distribution channel. This
sparked the **open-weight chat fine-tune Cambrian explosion**: Alpaca,
Vicuna, Koala, GPT4All, WizardLM, dozens more in spring 2023, all built by
SFT-ing Llama on GPT-4-distilled instruction data. (Touvron 2023a)

**Llama 2** (July 18, 2023), announced jointly with Microsoft. Sizes 7B,
13B, 70B. Trained on 2T tokens. Crucially, Llama 2 shipped with a
permissive **community license that explicitly allowed commercial use**
(with a >700M-MAU carve-out), plus chat-tuned variants (`Llama-2-*-Chat`)
trained with full RLHF including Meta's own Helpfulness and Safety reward
models, plus "Ghost Attention" for system-prompt persistence. This is the
release that made open-weight chat models a serious foundation for shipped
products. (Touvron 2023b)

### Gemini (Google, December 6, 2023)

Pichai and Hassabis announced Gemini 1.0 on December 6, 2023 at a virtual
press conference. Three sizes at launch: **Ultra** (frontier), **Pro**
(default), **Nano** (on-device). Pro and Nano shipped immediately —
integrated into Bard and the Pixel 8 Pro respectively; Ultra was held until
"Bard Advanced" in early 2024. Natively multimodal training claim (vs.
multimodal-by-fine-tuning). Gemini was Google's flagship competitive
response to GPT-4 / ChatGPT, ~9 months after GPT-4's launch. (Google 2023)

### Mistral 7B (September 27, 2023) and Mixtral 8x7B (December 11, 2023)

Mistral AI's *Mistral 7B* dropped September 27, 2023 (paper arXiv:2310.06825,
Oct 10, 2023). Apache 2.0 license — fully permissive, no Llama-style carve-
outs. 7.3B parameters; uses grouped-query attention (GQA) and sliding-window
attention (SWA). Beat Llama 2 13B on every benchmark in the report, and beat
Llama 1 34B on reasoning/math/code. (Mistral 2023a)

**Mixtral 8x7B** released December 11, 2023 — first widely-deployed open
sparse Mixture-of-Experts model: 8 experts of ~7B each, 2 routed per token,
~13B active params with ~47B total. Matched or beat Llama 2 70B at a
fraction of the inference cost. The release made MoE inference a
mainstream open-weight pattern. (Mistral 2023b)

## Open-weight model proliferation

The 2023 open-weight wave was a structural break: for the first time, the
"chat model with sane defaults behind an API" was a thing that didn't
require a frontier-lab API key.

- **Llama 1** (Feb 2023) — research-license, leaked, fine-tuned to death by
  the community.
- **Llama 2** (July 2023) — commercial-friendly license, chat-tuned
  variants, the first really shippable open foundation.
- **Mistral 7B** (Sept 2023, Apache 2.0) and **Mixtral 8x7B** (Dec 2023) —
  the first time a small European startup's open model competed credibly
  with Meta-scale releases. Apache licensing removed all licensing-tax
  concerns for downstream products. (Mistral 2023a, 2023b)
- **Qwen** (Alibaba Tongyi Lab) — Qwen-7B and Qwen-7B-Chat released
  **August 3, 2023** on ModelScope and Hugging Face; the start of a
  long-running multilingual (esp. Chinese-English) open-weight family that
  scaled to MoEs and 100B+ models in 2024–2025. (Alibaba 2023)
- **DeepSeek** — DeepSeek Coder released November 2, 2023; DeepSeek-LLM
  (7B, 67B, Base + Chat) released November 29, 2023; trained on 2T tokens
  of English + Chinese deduplicated Common Crawl; benchmarks competitive
  with Llama 2. Sets the stage for DeepSeek-V2 (MoE) and the R1 reasoning
  model wave in 2024-2025. (DeepSeek 2023)
- **Nous Research / Hermes** — community group fine-tuning open foundations
  for general-purpose use and roleplay. The original *Nous-Hermes-13B*
  (Llama 1) and *Nous-Hermes-Llama2-13B* (mid–late 2023) established the
  pattern of "open foundation + community SFT/DPO on a curated mix" that
  many downstream open-weight chat models inherited. Later iterations
  (Hermes 2 Mistral DPO, Hermes 2 Pro with function-calling/JSON modes,
  Hermes 3 / 4 on Llama 3.x in 2024–2025) push this further into
  agent-adjacent capabilities. (Nous 2023+)

### Llama 3 / 4 (later, for completeness)

- **Llama 3** released **April 18, 2024**. Sizes 8B, 70B. Trained on 15T
  tokens (~7.5× Llama 2). Tokenizer rebuilt to 128K vocab. Closed the gap
  to GPT-4-class on many benchmarks at the 70B tier.
- **Llama 3.1** released **July 23, 2024**, adding the **405B** variant —
  the first open-weight model competitive with frontier closed models.
- **Llama 4** (Scout, Maverick, Behemoth) released **April 5, 2025**.
  Native MoE; multimodal (text + image); 12 languages. Scout: 17B active /
  109B total, claimed 10M-token context; Maverick is the larger sibling;
  Behemoth was still in training at announcement.

These later releases are technically post-Tier-2 but matter because the
*pattern* — open-weight foundation, chat-tuned variant, permissive license,
ChatML-style chat template — was set during 2023 and just kept compounding.

### The instruction surface as product abstraction

Three layers stabilized during 2022–2023, and they are still the layers
every chat model exposes:

1. **A base model** trained on next-token prediction.
2. **An instruction/chat-tuned variant** trained via SFT + RLHF/DPO and
   pinned to a chat template that uses **`system`, `user`, `assistant`**
   message roles (sometimes `tool` / `function`).
3. **A safety/refusal policy** baked in via the alignment step and exposed
   as automatic refusals on certain inputs.

That is the artifact a developer talks to in 2026. It is the *only* shape
that ships, across closed and open ecosystems alike.

## What modern agents inherit

The agentic systems built on top of Tier 3+ tooling assume four things from
Tier 2 without needing to re-derive them:

1. **An instruction-following partner.** The model takes text in, returns
   text out, and the text it returns is *responsive to the directive*, not
   merely a likely continuation. Agents would not be tractable without
   this — every "thought," "plan," and "tool call" is a directive
   addressed to an instruction-tuned model.
2. **A behavioral steering surface (system prompts).** The
   system/user/assistant role split lets the deployer pin agent identity,
   tool-use rules, and refusal posture in the `system` slot, separate from
   per-turn user input. Without this split, every prompt would have to
   re-state the agent's constitution. This is what makes "personas" and
   "agent identities" cheap to express.
3. **A refusal/safety baseline as a precondition for shipping.** Before
   ChatGPT, building a public-facing text-generating product meant
   building your own toxicity/harm filter. After RLHF (and especially
   Constitutional AI), refusal is part of the model. This made shipping
   text-generating products *tractable for non-AI-lab companies* — which
   is the user base agent frameworks target.
4. **A universal chat API shape.** OpenAI's ChatML message list (`system`,
   `user`, `assistant`, plus later `tool`/`function`) is now the schema
   every major provider serves, every open-weight chat template renders
   into, and every agent framework targets. Agents serialize their
   internal state into and out of this list as the cross-vendor
   interchange format. The fact that LangChain, the OpenAI Assistants API,
   Anthropic's Messages API, Llama's chat template, and the Hugging Face
   `apply_chat_template` machinery all converge on the same triplet is
   what makes the agent layer above them portable.

The follow-on tier (tool use, function calling, JSON mode, structured
outputs) only makes sense *given* an instruction-following chat-API model.
Tier 2 is the precondition.

## Citations

### Papers

- Brown, T. B., Mann, B., Ryder, N., Subbiah, M., Kaplan, J., Dhariwal, P.,
  et al. (2020). *Language Models are Few-Shot Learners.* arXiv:2005.14165.
  https://arxiv.org/abs/2005.14165
- Christiano, P., Leike, J., Brown, T., Martic, M., Legg, S., Amodei, D.
  (2017). *Deep Reinforcement Learning from Human Preferences.*
  arXiv:1706.03741. https://arxiv.org/abs/1706.03741
- Schulman, J., Wolski, F., Dhariwal, P., Radford, A., Klimov, O. (2017).
  *Proximal Policy Optimization Algorithms.* arXiv:1707.06347.
  https://arxiv.org/abs/1707.06347
- Wei, J., Bosma, M., Zhao, V. Y., Guu, K., Yu, A. W., Lester, B., Du, N.,
  Dai, A. M., Le, Q. V. (2021). *Finetuned Language Models Are Zero-Shot
  Learners.* arXiv:2109.01652. https://arxiv.org/abs/2109.01652
- Wei, J., Wang, X., Schuurmans, D., Bosma, M., Ichter, B., Xia, F., Chi,
  E., Le, Q., Zhou, D. (2022). *Chain-of-Thought Prompting Elicits
  Reasoning in Large Language Models.* arXiv:2201.11903.
  https://arxiv.org/abs/2201.11903
- Wei, J., Tay, Y., Bommasani, R., Raffel, C., Zoph, B., Borgeaud, S.,
  et al. (2022). *Emergent Abilities of Large Language Models.*
  arXiv:2206.07682. https://arxiv.org/abs/2206.07682
- Ouyang, L., Wu, J., Jiang, X., Almeida, D., Wainwright, C., Mishkin, P.,
  et al. (2022). *Training Language Models to Follow Instructions with
  Human Feedback.* arXiv:2203.02155. https://arxiv.org/abs/2203.02155
- Bai, Y., Jones, A., Ndousse, K., Askell, A., et al. (2022). *Training a
  Helpful and Harmless Assistant with Reinforcement Learning from Human
  Feedback.* arXiv:2204.05862. https://arxiv.org/abs/2204.05862
- Bai, Y., Kadavath, S., Kundu, S., Askell, A., et al. (2022).
  *Constitutional AI: Harmlessness from AI Feedback.* arXiv:2212.08073.
  https://arxiv.org/abs/2212.08073
- Chung, H. W., Hou, L., Longpre, S., Zoph, B., Tay, Y., Fedus, W., et al.
  (2022). *Scaling Instruction-Finetuned Language Models.*
  arXiv:2210.11416. https://arxiv.org/abs/2210.11416
- Touvron, H., Lavril, T., Izacard, G., Martinet, X., Lachaux, M.-A.,
  Lacroix, T., et al. (2023). *LLaMA: Open and Efficient Foundation
  Language Models.* arXiv:2302.13971. https://arxiv.org/abs/2302.13971
- OpenAI (2023). *GPT-4 Technical Report.* arXiv:2303.08774.
  https://arxiv.org/abs/2303.08774
- Schaeffer, R., Miranda, B., Koyejo, S. (2023). *Are Emergent Abilities of
  Large Language Models a Mirage?* arXiv:2304.15004.
  https://arxiv.org/abs/2304.15004
- Rafailov, R., Sharma, A., Mitchell, E., Ermon, S., Manning, C. D., Finn,
  C. (2023). *Direct Preference Optimization: Your Language Model is
  Secretly a Reward Model.* arXiv:2305.18290.
  https://arxiv.org/abs/2305.18290
- Touvron, H., Martin, L., Stone, K., et al. (2023). *Llama 2: Open
  Foundation and Fine-Tuned Chat Models.* arXiv:2307.09288.
  https://arxiv.org/abs/2307.09288
- Jiang, A. Q., Sablayrolles, A., Mensch, A., Bamford, C., Chaplot, D. S.,
  et al. (2023). *Mistral 7B.* arXiv:2310.06825.
  https://arxiv.org/abs/2310.06825
- Azar, M. G., Rowland, M., Piot, B., Guo, D., Calandriello, D., Valko, M.,
  Munos, R. (2023). *A General Theoretical Paradigm to Understand Learning
  from Human Preferences.* arXiv:2310.12036.
  https://arxiv.org/abs/2310.12036
- Ethayarajh, K., Xu, W., Muennighoff, N., Jurafsky, D., Kiela, D. (2024).
  *KTO: Model Alignment as Prospect Theoretic Optimization.*
  arXiv:2402.01306. https://arxiv.org/abs/2402.01306

### Product launch / blog posts

- OpenAI (Nov 30, 2022). *Introducing ChatGPT.*
  https://openai.com/index/chatgpt/
- OpenAI (Mar 1, 2023). ChatGPT API and gpt-3.5-turbo release. Coverage:
  https://techcrunch.com/2023/03/01/openai-launches-an-api-for-chatgpt-plus-dedicated-capacity-for-enterprise-customers/
- OpenAI (Mar 14, 2023). *GPT-4* release.
  https://openai.com/index/gpt-4-research/
- Anthropic (Mar 14, 2023). *Introducing Claude.*
  https://www.anthropic.com/news/introducing-claude
- Anthropic (Jul 11, 2023). *Claude 2.*
  https://www.anthropic.com/news/claude-2
- Meta (Feb 24, 2023). LLaMA announcement.
  https://ai.meta.com/blog/large-language-model-llama-meta-ai/
- Meta + Microsoft (Jul 18, 2023). *Llama 2.*
  https://about.fb.com/news/2023/07/llama-2/
- Mistral AI (Sep 27, 2023). *Mistral 7B.*
  https://mistral.ai/news/announcing-mistral-7b
- Mistral AI (Dec 11, 2023). *Mixtral of Experts (8x7B).*
  https://mistral.ai/news/mixtral-of-experts
- Google (Dec 6, 2023). *Introducing Gemini.*
  https://blog.google/technology/ai/google-gemini-ai/
- Alibaba / Qwen Team (Aug 3, 2023). Qwen-7B / Qwen-7B-Chat release.
  https://qwenlm.github.io/
- DeepSeek (Nov 2023). DeepSeek Coder and DeepSeek-LLM releases.
  https://www.deepseek.com/
- Nous Research. Hermes model family overview.
  https://nousresearch.com/
- Meta (Apr 18, 2024). *Llama 3* release.
  https://ai.meta.com/blog/meta-llama-3/
- Meta (Jul 23, 2024). *Llama 3.1 (incl. 405B).*
  https://ai.meta.com/blog/meta-llama-3-1/
- Meta (Apr 5, 2025). *The Llama 4 herd.*
  https://ai.meta.com/blog/llama-4-multimodal-intelligence/

### Reference material

- OpenAI Chat Completions / ChatML documentation (March 2023; current
  Chat Completions docs at developers.openai.com).
  https://platform.openai.com/docs/guides/text-generation
- HuggingFace `Anthropic/hh-rlhf` preference dataset.
  https://huggingface.co/datasets/Anthropic/hh-rlhf
