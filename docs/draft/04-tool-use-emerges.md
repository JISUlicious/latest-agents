# Tier 4 — Tool use emerges

> How "the model produces a structured request, an external system executes it, the result is fed back" moved from clever prompting to a first-class capability. Three layers: research demos that proved language models could drive an external tool environment (**WebGPT, Toolformer, ReAct**); the mid-2023 API shift to native **function calling** (OpenAI, Anthropic, Gemini); and the open-weight era where every model family ships its own wire-format dialect. Modern agents inherit a tool-call protocol, a convention of shipping schemas to the model, and a long tail of parser code.

## Research demos: the proof

**WebGPT (Nakano 2021)** was the first credible end-to-end demonstration that a language model could autonomously drive an external tool environment. OpenAI fine-tuned GPT-3 to operate a text-based web browser using a fixed action vocabulary (search, click, scroll, find-text, quote, go-back, end-and-answer). Training combined **behavior cloning** on human demonstrations with **reward modeling and PPO** from human comparisons — the same template InstructGPT later imported. Every quote was captured with its source URL, and citation was *structurally enforced*: the answer could only point at quotes the model already collected. The best WebGPT model's answers were preferred over human demonstrators 56% of the time, and over top Reddit answers 69%.

WebGPT mattered because three things from it carry forward: **action space as part of the prompt** (the command set is literally listed in context); **trajectories as training data** (demonstrations and comparisons over sequences of tool calls); and **citation as a first-class artifact** (URLs collected alongside text). It also inherited an expensive footprint: substantial human-labeled trajectory data and pairwise comparisons.

**Toolformer (Schick 2023)** routed around that bottleneck. Sixteen months after WebGPT, Meta showed a language model could *teach itself* when to call which API by exploiting its own next-token loss as the signal. The procedure: prompt the base model with a few demonstrations per API, sample candidate call sites throughout a corpus, execute the API, **keep only calls that demonstrably reduce next-token loss on the subsequent text**. The surviving annotations are merged back and the model is fine-tuned on the augmented corpus. Toolformer's 6.7B GPT-J — equipped with calculator, QA, Wikipedia, translation, and calendar tools — matched or beat GPT-3-175B on factual probes and math word problems at 25× fewer parameters, without losing language-modeling ability.

Toolformer's contribution is methodological: **which tokens should be replaced by a tool call is a learnable property of the loss landscape**, not something that requires labeled data. By the time GPT-3.5-turbo-0613 shipped in June 2023 with function calling baked in, "the model knows when to emit a tool call" was no longer a research question.

**ReAct (Yao 2022)**, covered in Tier 3 as the reasoning-loop spine, is also the proximate template for almost every prompt-engineered tool-use agent that follows. Across these (plus the embodied benchmarks ALFWorld and WebShop), the architecture is consistent: model emits text, harness parses for a known pattern, executes, splices the result back. **None of them treat the tool call as a separate API field. That changes in June 2023.**

## The shift to function calling as API

Before mid-2023, tool use with closed-model APIs meant: tell the model "you may emit `CALL: tool_name(args)`," parse plain-text output for the pattern, hope the JSON was well-formed. **ChatGPT Plugins (Mar 23, 2023)** was OpenAI's first productized attempt at giving the model real tools, but plugins were a ChatGPT UI feature — the underlying mechanism was still string-formatted in the model's reply.

**OpenAI function calling (Jun 13, 2023)** was the inflection. `gpt-3.5-turbo-0613` and `gpt-4-0613` were trained to accept a new `functions` parameter (each described by JSON-Schema parameters), return `finish_reason: "function_call"` with a structured `function_call` object, and otherwise produce normal text. The change looks small — the JSON the model would have written into its content stream now lives in a separate field — but its consequences are large: the model is **post-trained on tool-shaped data**, the schema lives in the request (introspectable), argument validation stops being mostly the application's problem, and a subsequent `function` (later `tool`) role message can return the result. In Nov 2023, OpenAI extended this with **parallel function calling**: a single assistant turn can emit multiple tool calls in a `tool_calls` array, executed concurrently, replied to with multiple `tool` messages each referencing its originating `tool_call_id`.

**Anthropic tool use** shipped as a beta with Claude 2.1 (Nov 21, 2023) and went GA across the Claude 3 family on May 30, 2024. The Anthropic wire format treats tool calls as **typed content blocks** within the assistant message rather than as a sidecar field — a `tool_use` block alongside `text`, with the matching `tool_result` block returned as a *user-role* message. Parallel calls fall out naturally: the assistant message simply contains multiple `tool_use` blocks. This block-typed design composes more cleanly with multimodal content and with Claude's later extended-thinking blocks.

The OpenAI and Anthropic designs encode the same loop in **incompatible ways** — sidecar field vs typed content block, `tool` role vs `user` role with `tool_result`, `tool_calls` array vs repeated blocks. Adapter code in every cross-provider agent harness translates between them.

**Gemini function calling** arrived during 2024 (Gemini 1.5 was the first widely-available supporting model); **Gemini 2.0 (Dec 11, 2024)** was pitched explicitly around the *agentic* axis: native tool use, built-in Google Search, code execution, and **compositional function calling** (one tool's output as another's input, dispatched in a single API call). Gemini's wire format sits closer to OpenAI's (a `functionCall` part within a `Content` object) but conceptually similar to Anthropic's: tool calls are parts of a multimodal message alongside text and inline data.

By end of 2024, function calling is table stakes. Every frontier API supports it; every agent framework has a unified abstraction over the three dialects.

## Open-weight wire-format dialects

The closed labs converged on three roughly OpenAPI-shaped APIs. The open-weight models did not. Because an open-weight model is just a tokenizer plus weights, "what a tool call looks like" is whatever the model was trained to emit, and "how the harness recognizes it" is regex over the decoded text. Every major lab picked a different surface. The harness ships a parser per dialect.

| Family | Wire format | Notes |
|---|---|---|
| **Hermes / ChatML** (Nous) | `<tool_call>{...JSON...}</tool_call>` with `<tools>` block in system | Single-token `<tool_call>` boundaries stable under streaming. The de facto open standard — Qwen 3 defaults to it. |
| **Mistral** | `[TOOL_CALLS][{...JSON list...}]` control-token | Bracketed format; result wrapped in `[TOOL_RESULTS]...[/TOOL_RESULTS]`, IDs constrained to 9 chars. |
| **Llama 3** | `<\|python_tag\|>{...}<\|eom_id\|>` (`llama3_json`); built-in tools via `tool.call(...)` | Llama 3.2 added a *pythonic* mode emitting `[get_weather(city="SF"), get_time(tz="PT")]`. |
| **Qwen 2.5 / 3** | Hermes-shaped by default; Qwen 3 Coder uses `qwen3_xml` (`<function=...><parameter=...>`) | `--tool-call-parser hermes` on vLLM. |
| **DeepSeek V3 / R1** | OpenAI-shaped JSON `{id, type:"function", function:{name, arguments}}` | Behavior was historically uneven; V3.1 made it first-class. |
| **Kimi K2** (Moonshot, Jul 2025) | `<\|tool_calls_section_begin\|>` ... `<\|tool_calls_section_end\|>` | IDs are structurally `functions.{name}:{idx}` — load-bearing; OpenAI-compatible servers must rewrite IDs. |
| **GLM-4.5 / 4.6 / 4.7** (Zhipu) | `<tool_call>name\n<arg_key>k</arg_key><arg_value>v</arg_value>...</tool_call>` | Reasoning content in separate `<think>...</think>` block. |
| Long tail | `granite`, `internlm`, `jamba`, `xlam`, `openai` (`gpt-oss`), `cohere_command3`, `functiongemma` | Each a small parser module in vLLM. |

Three reasons every lab ended up with its own format: **the tool call is in-band with the token stream** (different surface ⇒ retrain); **special-token economies are tokenizer-specific** (single-token boundaries matter for streaming); **parallel calls and ID handling diverged** locally. The cost is parser-table maintenance per family; the benefit is open-weight models are not gated on a single closed-API spec.

## Parallel tool calls and structured output

By late 2023, one-tool-per-turn was too constraining. **Parallel function calling** arrived on OpenAI (Nov 6, 2023, GPT-4 Turbo + 3.5-turbo-1106), was native to Anthropic from the tool-use beta, and is supported by Gemini via multi-part Content. The harness-side pattern is the same everywhere: map `tool_call_id` (or `tool_use_id`, or Kimi's `functions.foo:idx`) to a future, fire them all concurrently, gather, produce a single follow-up with results in the order the model expects.

**OpenAI Structured Outputs (Aug 6, 2024)** split the "structured output" use case off from tool calling proper. Two mechanisms: `"strict": true` on a function definition (guaranteed schema-valid arguments), and `response_format: {"type": "json_schema", ...}` for the case where the developer just wants structured JSON, not a tool call. The implementation is **constrained decoding**: the user's JSON Schema is compiled into a context-free grammar and the sampler's logits are masked to keep the output on-grammar. Failure rate against a strict schema drops effectively to zero, with two trade-offs noted — first compilation of an unseen schema is slower, and over-constrained outputs can loop because the model is forced to keep producing valid-but-redundant tokens.

The conceptual point: **a tool call *is* a structured output** (it's a JSON object validating a schema), but the inverse isn't true — sometimes you want JSON without the tool-execution loop. Structured outputs as a distinct API endpoint reflects that decomposition. Anthropic, Google, and the open-weight inference servers (vLLM, llama.cpp, SGLang via outlines/xgrammar) followed with their own constrained-decoding modes during 2024-2025.

## → Inherited by modern agents

Three things every modern agent harness builds on top of:

- **A structured tool-call protocol.** The model emits tool requests *in-band, as part of its output stream*, but in a shape the harness can reliably parse — either as a sidecar field (OpenAI, Gemini), a typed content block (Anthropic), or in-stream delimiters (every open-weight dialect). The agent loop "decode → if tool call, execute, splice result, decode again" is the heart of every harness from LangChain to Claude Code to Cursor.

- **The model knows about its tools.** Schemas are not hand-written into prose like in pre-2023 prompting; they ship as a first-class request field that post-training has taught the model to interpret. As a corollary, **tool descriptions become a design surface** — names, descriptions, and parameter docstrings are now load-bearing prompt content. An agent harness shipping fifty tools must curate their schemas as carefully as it curates the system prompt. (Claude Code and opencode both spend significant complexity here — see the per-agent docs for `Tool.ts` and the registry.)

- **Wire-format pluralism.** Because the open-weight ecosystem fragmented into one dialect per lab, any agent harness that aspires to run on multiple backends ships a parser per family. vLLM's tool-call-parser registry is the working specification of this pluralism. The closed APIs hide it behind their SDKs; on open weights, the harness eats it.

Plus two adjacent inheritances that Tier 5 picks up: **parallel-by-default tool execution** (a turn produces a list of calls, the harness runs them concurrently, the next turn sees a list of results) and **the structured-output / tool-call duality** (the boundary is conventional, not architectural; strict modes and constrained decoding live on both sides).

Tier 5 picks up where Tier 4 ends — at the point where instruction-tuning meets *agentic* post-training, and where the harness around the model loop becomes a product category in its own right.
