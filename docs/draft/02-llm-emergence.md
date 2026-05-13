# Tier 2 — LLM emergence (2020–2023)

> Between 2020 and the end of 2023, the language model stopped being a research artifact you fine-tune and started being a *product surface* you talk to. Three legs: scale unlocked in-context learning; instruction tuning + RLHF turned the base model into a follower of natural-language commands; a chat-tuned product wave standardized the message-role API. The artifact this tier hands forward is "instruction-following partner with a safety baseline behind a chat API."

## GPT-3 and in-context learning

**Brown 2020** (`Language Models are Few-Shot Learners`, 175B parameters, decoder-only Transformer, May 2020) introduced three prompting regimes — zero-shot, one-shot, few-shot — and showed that at sufficient scale all three work on a wide range of tasks without ever touching the weights. The paper called this **in-context learning**: the model treats the prompt itself as the specification of the task.

The consequence was a workflow shift. Until 2020, the dominant pattern was BERT-style: pretrain once, fine-tune a copy per task. After GPT-3, the marginal cost of a new "task" dropped from "collect labels, train, deploy" to "write a prompt." Prompts became first-class engineering objects, and the product surface became *text*.

**Wei 2022a** (`Emergent Abilities of Large Language Models`) catalogued ~100+ capabilities that appeared sharply at scale and were absent in smaller models — multi-digit arithmetic, instruction-following, multi-step word problems. **Schaeffer 2023** (NeurIPS 2023 Outstanding Paper) pushed back: the sharp "emergence" curves are largely artifacts of nonlinear metrics like exact-match; with continuous metrics, the curves smooth. The substantive claim — capabilities improve with scale — survived; the discontinuity did not.

## Instruction tuning closes the "continuation vs response" gap

Base GPT-3 was trained to *continue text*. Continuation is not the same as answering, following a directive, or refusing. Users wanted "do what I tell you" behavior; the base model was happy to roll into a plausible-sounding continuation that ignored or even contradicted the instruction. Instruction tuning is the supervised step that closes this gap.

**FLAN** (Wei 2021) re-wrote 60+ existing NLP datasets as natural-language instructions ("Classify the sentiment of the following review: ...") and fine-tuned a 137B model on the union. The zero-shot result beat few-shot GPT-3 on 20 of 25 evaluated tasks. The ablations identified three ingredients: number of finetuning tasks, model scale, and the use of *natural-language instructions* rather than raw input/output pairs. **Chung 2022** (FLAN-PaLM / Flan-T5) scaled this to 1,836 tasks and added chain-of-thought reasoning traces to the tuning mix, confirming instruction tuning as a general-purpose capability multiplier, not a per-task trick.

**InstructGPT** (Ouyang 2022) became the defining recipe by combining instruction-tuning with RLHF in three stages:
1. **SFT** on human-written demonstrations of "good" responses to API prompts.
2. **Reward-model training** on human rankings of multiple completions per prompt.
3. **RL fine-tuning** (PPO, Schulman 2017) against the reward model, with a KL penalty back to the SFT policy to prevent reward hacking.

The headline result: human labelers preferred the 1.3B InstructGPT outputs to the 175B GPT-3 outputs — a >100× parameter-efficient gain in human preference — at the cost of small regressions on academic benchmarks (the "alignment tax"). `text-davinci-003`, released Nov 28, 2022, was the first publicly shipped model trained with the full RLHF pipeline.

## Alignment training: RLHF → CAI → DPO → IPO/KTO

The template that became RLHF actually predates language models. **Christiano 2017** (`Deep Reinforcement Learning from Human Preferences`) showed on Atari and MuJoCo that you don't need to *specify* a reward function — you can *learn* one from pairwise human preferences and optimize with standard RL. InstructGPT imported the template wholesale into language.

By 2022 the language-model recipe was a stable three-stage pipeline (SFT → reward model → PPO) and a parallel open recipe existed in Anthropic's HH-RLHF (Bai 2022a), whose preference dataset was released openly and became key public infrastructure for the open-source RLHF wave.

**Constitutional AI** (Bai 2022b) replaced human harmlessness labels with AI-generated critiques and revisions guided by a written constitution. The bet: scaling supervision is the long-run bottleneck, and using a model to evaluate a model is the only way to keep up. This is the methodology Anthropic positioned Claude on.

**DPO** (Rafailov 2023) derived a closed-form mapping between the optimal RLHF policy and the preference data, training directly on `(prompt, chosen, rejected)` triples with a *simple classification loss* — no separate reward model, no PPO, no sampling, no critic. It matched or beat PPO-based RLHF on standard benchmarks while being dramatically simpler. The open-source ecosystem adopted DPO almost immediately because it fits on a single GPU and uses standard supervised training infrastructure. **IPO** (Azar 2023) and **KTO** (Ethayarajh 2024) followed: IPO regularizes DPO's overfitting on near-deterministic preferences; KTO learns from binary good/bad single-response labels rather than pairs (cheaper to collect).

Why RLHF replaced SFT for alignment: SFT teaches the model what good answers *look like*; RLHF teaches it what to *prefer* when multiple plausible answers exist — including the meta-preference to refuse, to hedge, to ask for clarification. SFT can't naturally encode "don't do X" (a negative example is just another label to imitate); pairwise structure gives the model a *direction*.

## The chat-tuned product wave

**ChatGPT (Nov 30, 2022)** is the inflection point. Technically it was just `text-davinci-003` plus a conversational UI; the importance was product:
- A chat UI that hid the prompt and exposed turn-by-turn dialogue.
- A latent system message, role-tagged conversation history, an assistant persona.
- Default safety behavior that *shipped* rather than appearing as a model-card caveat.

Over 1M users in five days. Fastest-growing consumer product in history at the time. LLMs became consumer infrastructure.

**GPT-3.5-Turbo (Mar 1, 2023)** shipped the Chat Completions API and documented **ChatML** with `system` / `user` / `assistant` roles. The chat surface, previously hidden behind a web UI, became the canonical *programmatic* interface. ChatML's role triplet is now the de facto universal shape for talking to LLMs, copied by Anthropic, Google, Meta, Mistral, and effectively every open-weight chat template.

**GPT-4 (Mar 14, 2023)** — multimodal input, big reasoning jump, exam-passing benchmarks. Notably, the technical report disclosed neither parameter count nor training data — a break from GPT-2/3 norms.

**Claude 1 (Mar 14, 2023)** launched the same day as GPT-4, trained with Constitutional AI, positioned on steerability and lower harmful-output rate rather than raw benchmarks. **Claude 2 (Jul 11, 2023)** added a 100K-token context window and a public web UI at `claude.ai`.

**Llama 1 (Feb 24, 2023)** — research-license release; weights leaked within a week, and Meta de facto accepted the leak as the distribution channel. This sparked the **open-weight chat fine-tune Cambrian explosion** (Alpaca, Vicuna, Koala, WizardLM, dozens more in spring 2023) — almost all built by SFT-ing Llama on GPT-4-distilled instruction data. **Llama 2 (Jul 18, 2023)** added a commercial-friendly license (with a >700M-MAU carve-out) and RLHF-tuned chat variants — the first really shippable open foundation.

**Mistral 7B (Sep 27, 2023)** dropped under Apache 2.0 — fully permissive, no Llama-style carve-outs — using grouped-query and sliding-window attention, beating Llama 2 13B on every reported benchmark. **Mixtral 8x7B (Dec 11, 2023)** was the first widely-deployed open sparse Mixture-of-Experts model: 8 experts × 7B, 2 routed per token, ~13B active params with ~47B total. Matched Llama 2 70B at a fraction of inference cost.

**Gemini 1.0 (Dec 6, 2023)** — Google's flagship competitive response to GPT-4, in three sizes (Ultra / Pro / Nano), natively multimodal at training time.

## Open-weight model proliferation

For the first time, the "chat model with sane defaults behind an API" was available without a frontier-lab API key. Beyond the Llama-Mistral axis:

- **Qwen** (Alibaba, Qwen-7B + Qwen-7B-Chat, Aug 3, 2023) — multilingual (esp. Chinese-English) open-weight family that scaled to MoEs and 100B+ models through 2024-2025.
- **DeepSeek** (DeepSeek Coder Nov 2023; DeepSeek-LLM Nov 29, 2023) — 7B and 67B, English+Chinese, benchmarks competitive with Llama 2. Sets the stage for DeepSeek-V2 (MoE) and the R1 reasoning model wave in 2024-2025.
- **Nous Research / Hermes** — community group whose Nous-Hermes-13B (Llama 1) and Nous-Hermes-Llama2-13B (mid-2023) established the "open foundation + community SFT/DPO on a curated mix" pattern. Hermes 2 Pro added function-calling/JSON modes; later iterations (Hermes 3/4 on Llama 3.x) push into agent-adjacent capabilities.

The pattern persisted: **Llama 3 (Apr 2024, 15T tokens)** closed the gap to GPT-4-class at the 70B tier; **Llama 3.1 405B (Jul 2024)** became the first open-weight model competitive with frontier closed models; **Llama 4 (Apr 2025)** went native-MoE and multimodal. The *template* — open-weight foundation, chat-tuned variant, permissive license, ChatML-style chat template — was set during 2023 and just kept compounding.

## The instruction surface as product abstraction

Three layers stabilized during 2022-2023 and are still the layers every chat model exposes:

1. **A base model** trained on next-token prediction.
2. **An instruction/chat-tuned variant** trained via SFT + RLHF/DPO and pinned to a chat template with **`system`, `user`, `assistant`** message roles (sometimes `tool` / `function`).
3. **A safety/refusal policy** baked in via the alignment step and exposed as automatic refusals on certain inputs.

That is the artifact a developer talks to in 2026. It is the *only* shape that ships across closed and open ecosystems alike.

## → Inherited by modern agents

Four things every agentic system above this tier assumes without re-deriving:

- **An instruction-following partner.** The model takes text in, returns text out, and the text it returns is *responsive to the directive*. Every "thought," "plan," and "tool call" in Tiers 3-7 is a directive addressed to an instruction-tuned model.
- **A behavioral steering surface — the `system` slot.** Deployers pin agent identity, tool-use rules, and refusal posture separately from per-turn user input. This is what makes "personas" and "agent identities" cheap to express.
- **A refusal/safety baseline as a precondition for shipping.** Before ChatGPT, building a public-facing text-generating product meant building your own toxicity filter. After RLHF (and CAI), refusal is *in the model*. This is what made shipping text-generating products tractable for non-AI-lab companies — the user base that agent frameworks target.
- **A universal chat API shape.** OpenAI's ChatML role triplet is now the schema every major provider serves and every open-weight chat template renders into. Agents serialize their internal state into and out of this list as the cross-vendor interchange format. The portability of the agent layer above sits on this convergence.

Tier 3 (reasoning) and Tier 4 (tool use) are only legible *given* an instruction-following chat-API model. Tier 2 is the precondition.
