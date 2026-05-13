# Tier 4 — Tool use emerges

## Overview

Tier 3 ended with chain-of-thought and ReAct: a language model that could think out loud and, when prompted in the right way, emit an `Action: search[...]` line that some surrounding scaffolding would interpret. Tier 4 is the story of how that pattern — *the model produces a structured request, an external system executes it, the result is fed back* — moved from clever prompting to a first-class capability. The pieces fall into three layers: (1) the research demos that proved language models could drive an external tool environment (WebGPT, Toolformer, ReAct, the embodied benchmarks); (2) the API-level shift in mid-2023 when OpenAI added *function calling* as an explicit field on the request/response, then Anthropic and Google followed; (3) the open-weight era, in which every model family ships its own wire-format dialect — Hermes `<tool_call>`, Mistral `[TOOL_CALLS]`, Llama-3 `<|python_tag|>`, Kimi K2's section delimiters, GLM's `<arg_key>/<arg_value>`, Qwen's Hermes-borrowed template, DeepSeek's OpenAI-shaped JSON. Modern agent harnesses inherit a tool-call protocol, a convention of shipping schemas to the model, and a long tail of parser code, one per dialect.

---

## WebGPT — the demonstration

The first credible end-to-end demonstration that a language model could autonomously drive an external tool environment was OpenAI's *WebGPT* (Nakano et al. 2021, "WebGPT: Browser-assisted question-answering with human feedback", arxiv 2112.09332, submitted December 17 2021). The setup is straightforward: fine-tune GPT-3 to operate a text-based web browser, give it the ELI5 dataset of long-form Reddit questions, and train it to produce answers backed by citations.

### The browsing environment

WebGPT exposes the browser to the model as a fixed action vocabulary. The model, at each step, emits one command. The action set covers what a human would do — issue a search query, click a result, scroll within a page, find text on a page, capture a snippet as a quote, go back, and finally end browsing to generate an answer. Search is backed by a commercial search engine (Bing) rather than a sparse-vector index like BM25; WebGPT does not do retrieval itself, it *operates a tool that does*. The page-text rendering is HTML-stripped to fit in context.

Every quote the model captures is collected with its source URL. When the model issues the terminal `End: Answer` action, it composes an ELI5-style response that cites the captured quotes inline. Citation is structurally enforced: the answer can only point at quotes the model already collected. This was the first time an LLM-driven system produced cited answers as a property of the architecture rather than as a post-hoc retrieval step.

### Training: behavior cloning + RL from comparisons

The training pipeline has two stages, both later canonical in the InstructGPT / RLHF lineage that follows in Tier 5:

- **Behavior cloning.** Human demonstrators perform the browsing task; the model is fine-tuned on their trajectories.
- **Reward modeling + rejection sampling / RL.** Humans compare pairs of model answers and pick the better one; a reward model is trained on these comparisons; the policy is improved against the reward model, both via rejection sampling (best-of-N at inference) and PPO.

The best WebGPT model's answers were preferred by humans 56% of the time over those of the human demonstrators, and 69% of the time over the highest-voted Reddit answer (Nakano et al. 2021).

### Evaluation

WebGPT is evaluated on ELI5 (long-form questions) as the training distribution and on TriviaQA as an out-of-distribution transfer. Trustworthiness — whether captured quotes actually support the model's answer — is part of the human comparison rubric. The reward model is small (a 760M-parameter GPT-3 head); the policy at headline scale is 175B GPT-3. Note that WebGPT predates ChatGPT by roughly a year: the result demonstrated that GPT-3 was *already* capable of operating a tool environment given the right training pipeline, before instruction tuning and RLHF became a productized capability.

### Why it matters

WebGPT is the moment "LLM uses a tool autonomously to accomplish a goal" stops being aspirational. Three things from it carry forward:
- **Action space as part of the prompt.** The browser's command set is literally listed in the context; the model's output is constrained to that vocabulary. This is the lineage of every "here are your tools" system prompt today.
- **Trajectories as training data.** Demonstrations and comparisons are *over sequences of tool calls*, not single completions. This is how Anthropic, OpenAI, and the open-weight labs would later train agentic models.
- **Citation as a first-class artifact.** The harness collects URLs alongside text. Modern search-and-cite tools (Perplexity, Anthropic web search, Google AI Overviews) inherit this pattern.

WebGPT also has an unflattering inheritance: it requires substantial human-labeled trajectory data and human comparisons. Toolformer's contribution is a route around that bottleneck.

---

## Toolformer — self-supervised tool use

Sixteen months later, Meta AI released *Toolformer* (Schick et al. 2023, "Toolformer: Language Models Can Teach Themselves to Use Tools", arxiv 2302.04761, submitted February 9 2023). Where WebGPT relied on expensive human demonstrations of a single environment (a browser), Toolformer asked whether a language model could *teach itself* when to call which API by exploiting its own next-token loss as a signal.

### The setup

Toolformer fine-tunes a 6.7B-parameter GPT-J on a corpus annotated with inline API calls of the form:

```
Out of 1400 participants, 400 (or [Calculator(400 / 1400) → 0.29] 29%) passed the test.
```

The annotation is *self-generated*. The procedure has three steps (Schick et al. 2023):

1. **Sample.** For each API and each piece of training text, prompt the base model with a handful of demonstrations of how to use that API, and let it sample candidate call sites and arguments throughout the corpus.
2. **Execute.** Run the API at each candidate site to get the response token sequence.
3. **Filter.** Keep a candidate call only if it *reduces the model's loss on subsequent tokens* — i.e., having the API result in context makes the rest of the sentence easier to predict. Concretely, compare the weighted next-token loss with and without the call's `→ response` prefix; retain only calls where the result demonstrably helps.

The surviving annotations are merged back into the corpus and the model is fine-tuned on the augmented text. Inference is decoder-as-usual until the model emits the call-start token, at which point execution pauses, the API is run, and the response is spliced into the stream.

### The APIs

Toolformer covers five tools, intentionally chosen as complementary to language modeling:
- **Calculator** (arithmetic).
- **Question-answering system** (a Atlas-style retrieval-augmented QA model).
- **Wikipedia search** (BM25 over Wikipedia).
- **Machine translation** (NLLB).
- **Calendar** (current date / day-of-week lookup).

On downstream tasks (LAMA factual probes, math word problems, multilingual QA, temporal reasoning) Toolformer matches or beats GPT-3-175B at 25× fewer parameters, without losing its core language-modeling ability (Schick et al. 2023).

### Limitations and successors

Toolformer's tool surface is narrow — each API is a single function with structured arguments — and the model does not learn to *chain* tool calls. Each call is conditional only on prior text, not on prior tool outputs. Follow-ups like *Gorilla* (Patil et al. 2023, fine-tuning Llama on real API documentation) and *ToolLLM / ToolBench* (Qin et al. 2023, an instruction-tuning dataset over 16k+ real APIs) generalized the methodology to large API surfaces and to multi-step tool composition, but Toolformer remains the canonical proof that the next-token loss is sufficient supervision for tool-use timing.

### Why it matters

Toolformer's contribution is methodological rather than capability-defining: it shows that *which tokens should be replaced by a tool call* is a learnable property of the loss landscape, not something that requires labeled data. The wider takeaway — that tool use can be elicited through training rather than only through prompting — preconditions everything Anthropic and OpenAI later do when they explicitly post-train models on tool-use trajectories. By the time GPT-3.5-turbo-0613 ships in June 2023 with function calling baked in, "the model knows when to emit a tool call" is no longer a research question; it's a training procedure.

---

## Other research-era tool demos

Two threads are adjacent enough to mention here, though they belong primarily to Tier 3:

- **ReAct** (Yao et al. 2022, "ReAct: Synergizing Reasoning and Acting in Language Models", arxiv 2210.03629, October 6 2022) interleaves natural-language `Thought:` and structured `Action:` lines, with `Observation:` lines returned by the harness. Applied to HotpotQA / Fever with a Wikipedia API (search, lookup, finish) and to ALFWorld / WebShop with their respective action vocabularies, ReAct beat both chain-of-thought-only and act-only baselines, with reported success-rate improvements of 34 absolute points on ALFWorld and 10 on WebShop (Yao et al. 2022). ReAct is the proximate template for almost every prompt-engineered tool-use agent that follows.
- **ALFWorld** (Shridhar et al. 2020/2021, arxiv 2010.03768) and **WebShop** (Yao et al. 2022) provided the benchmarks. ALFWorld parallels the embodied ALFRED household environment with a TextWorld symbolic surface so that language models can act as policies. WebShop simulates 12,087-product e-commerce search with natural-language goals. Both became standard agentic evaluation environments for the 2023–2024 wave of tool-using models.
- **BlenderBot 3** (Meta AI 2022, 175B parameters on OPT) deserves a footnote: it integrated Internet search and long-term memory as inline tools, with the search and memory calls treated as token-level operations. BlenderBot 3 was the largest publicly available chatbot at release on August 5 2022 and exhibited the same pattern — model emits a structured request, external system executes, result is appended — but the tool surface was hard-coded by Meta rather than developer-defined.

Across all of these, the architecture is consistent: the model emits text, the harness parses for a known pattern (`Action:`, `Search(...)`, `<API> ... </API>`), executes, splices the result back. None of them treat the tool call as a *separate API field*. That changes in June 2023.

---

## The shift to function calling as API

Before mid-2023, "tool use" with the closed-model APIs meant: tell the model in the system prompt "you may emit `CALL: tool_name(args)` to invoke a tool," parse the assistant's plain-text output for that pattern, hope it formatted the JSON correctly, retry if not. ChatGPT Plugins (March 23 2023) was OpenAI's first productized attempt to give the model real tools — an OpenAPI-spec-based ecosystem with first-party browser, code interpreter, and retrieval plugins plus third-party plugins from Expedia, Wolfram, Zapier, Slack, et al. (OpenAI 2023a). But plugins were a ChatGPT UI feature, not a developer-API capability — the underlying mechanism was still string-formatted in the model's reply.

### OpenAI function calling — June 13 2023

The transition came with OpenAI's June 13 2023 announcement, "Function calling and other API updates" (OpenAI 2023b). Two new model snapshots, `gpt-3.5-turbo-0613` and `gpt-4-0613`, were trained to:

- accept a new `functions` parameter on the chat-completions request, each function described by name, description, and JSON-Schema parameters;
- return, when appropriate, a response with `finish_reason: "function_call"` and a `function_call` object containing a `name` and a JSON-serialized `arguments` string;
- otherwise produce normal text.

The same announcement reduced GPT-3.5-turbo pricing by 25% and introduced the 16K-context `gpt-3.5-turbo-16k` (OpenAI 2023b).

The change looks small — the JSON the model would have written into its content stream now lives in a separate field — but its consequences are large:
- The model is *post-trained* on tool-shaped data. It is not coaxed into emitting JSON; it knows what a tool call is.
- The schema lives in the request, so the developer can introspect what the model thinks the tool takes.
- Argument validation and JSON repair stop being the application's problem (mostly).
- A subsequent assistant turn can be replied to with a `function` (later `tool`) role message containing the result, and the model is trained to consume that role.

In November 2023, OpenAI extended this with **parallel function calling** on `gpt-4-1106-preview` (GPT-4 Turbo) and `gpt-3.5-turbo-1106`: a single assistant turn can emit multiple tool calls at once, returned in a `tool_calls` array (the field is renamed from singular `function_call` to plural `tool_calls`). The harness executes them — typically concurrently — and replies with multiple `tool` messages, each referencing its originating `tool_call_id` (OpenAI 2023c). "Open the window and turn off the A/C" is the canonical example: previously two round-trips, now one.

### Anthropic tool use — Claude 2.1 beta (Nov 2023) → Claude 3 GA (May 2024)

Anthropic shipped **tool use as a beta** alongside Claude 2.1 on November 21 2023 (Anthropic 2023). Claude 2.1's bigger headline features were the 200K-token context window, system prompts, and a halving of hallucination rate, but the same release introduced developer-defined tools that Claude could call to run a calculator, hit private APIs, search databases, or look up records.

Tool use went **generally available across the entire Claude 3 family** (Opus, Sonnet, Haiku) on May 30 2024, available on the Anthropic Messages API, Amazon Bedrock, and Google Cloud Vertex AI (Anthropic 2024). The Anthropic wire format treats tool calls as typed content blocks within the assistant message rather than as a sidecar field:

```json
{
  "role": "assistant",
  "content": [
    {"type": "text", "text": "Let me check the weather."},
    {"type": "tool_use",
     "id": "toolu_01A09q90qw90lq917835lq9",
     "name": "get_weather",
     "input": {"location": "San Francisco"}}
  ]
}
```

The matching tool result is a `user`-role message with a `tool_result` content block carrying the same `id`:

```json
{
  "role": "user",
  "content": [
    {"type": "tool_result",
     "tool_use_id": "toolu_01A09q90qw90lq917835lq9",
     "content": "62 degrees and foggy"}
  ]
}
```

The stop reason on a tool-call turn is `stop_reason: "tool_use"`. Parallel calls fall out naturally: the assistant message simply contains multiple `tool_use` blocks. This block-typed design is a meaningful contrast with OpenAI's sidecar field; it generalizes more cleanly to multimodal content (images, documents, server-executed code) where the assistant turn is intrinsically a list of typed parts.

### Comparing the two designs

The OpenAI and Anthropic wire formats look superficially similar — both are "the assistant produces a structured tool request, the developer runs it, the result is fed back" — but they encode the same loop in incompatible ways:

| Aspect | OpenAI | Anthropic |
| --- | --- | --- |
| Where tool calls live | `tool_calls` field on the message | `tool_use` content blocks within `content` |
| Tool result role | `tool` | `user` (with `tool_result` block) |
| ID field | `tool_call_id` | `tool_use_id` |
| Stop reason for tool turn | `finish_reason: "tool_calls"` | `stop_reason: "tool_use"` |
| Mixed text + tool call | text in `content` plus `tool_calls` field | both as parts of the `content` array |
| Multiple parallel calls | array under `tool_calls` | multiple `tool_use` blocks |

The OpenAI shape is older (June 2023) and pre-dates broad LLM multimodality; the Anthropic shape (late 2023, generalized 2024) treats every assistant turn as an ordered list of typed parts, which composes more naturally with images, server-tool outputs, and Claude's later "extended thinking" blocks. Adapter code in every cross-provider agent harness translates between the two.

### Gemini function calling — 2024

Google added function calling to the Gemini API during 2024, with the Gemini 1.5 generation as the first widely available models supporting it. The Gemini 2.0 release on December 11 2024 ("Gemini 2.0 Flash Experimental") was pitched explicitly around the *agentic* axis: native tool use including a built-in Google Search tool, code execution, third-party function calling, and "compositional function calling" (one tool's output as another's input) shipped in a single API call (Google 2024). Gemini's function-calling shape on the wire is closer to OpenAI's — a `functionCall` part within a `Content` object, with a name and JSON args — but conceptually similar to Anthropic's typed parts: tool calls are parts of a multimodal message, alongside text and inline data.

By the end of 2024, function calling is table stakes. Every frontier API supports it; every agent framework (LangChain, LlamaIndex, the Anthropic and OpenAI SDKs, Vercel AI SDK) has a unified abstraction over the three dialects.

---

## Native tool-call dialects across open-weight models

The closed labs converged on three roughly OpenAPI-shaped APIs. The open-weight models did not. Because an open-weight model is just a tokenizer plus weights, "what a tool call looks like" is whatever the model was trained to emit, and "how the harness recognizes it" is regex over the decoded text. Every major lab picked a different surface, sometimes deliberately, sometimes because they trained on a partner's data. The harness ships a parser per dialect.

### Hermes / ChatML — `<tool_call>` (Nous Research)

Hermes 2 Pro (Nous Research, 2024) and its descendants use a ChatML-based prompt with three special tokens added: `<tools>`, `<tool_call>`, `<tool_response>` and their closers. Schemas are dumped into the system prompt inside a `<tools>` block; tool calls come back wrapped in `<tool_call>`:

```
<tool_call>
{"name": "get_stock_fundamentals", "arguments": {"symbol": "TSLA"}}
</tool_call><|im_end|>
```

The `<tool_call>` tokens are single tokens, which means tool boundaries are stable under streaming and reliable to detect token-by-token (Nous Research 2024). Tool results come back with a `tool` role:

```
<|im_start|>tool
<tool_response>22.0</tool_response><|im_end|>
```

The Hermes format has become the de-facto open standard. Qwen3's tokenizer config ships a Hermes-shaped chat template by default; vLLM and SGLang both ship a `hermes` tool parser out of the box.

### Mistral — `[TOOL_CALLS]`

Mistral models (Mistral 7B Instruct v0.3, Mistral Nemo, Mistral Small/Large/Medium) use a bracketed control-token format. Schemas are wrapped in `[AVAILABLE_TOOLS]...[/AVAILABLE_TOOLS]`; a tool call is announced by the `[TOOL_CALLS]` control token followed by a JSON array:

```
[TOOL_CALLS][{"name": "calculator", "arguments": {"operation": "2+2"}, "id": "VvvODy9mT"}]
```

Tool results are sent back inside `[TOOL_RESULTS]...[/TOOL_RESULTS]`, keyed by `call_id`. The IDs are constrained to 9 characters in the canonical tokenizer (Mistral Docs). Mistral's format does not map cleanly to the OpenAI `tool_calls` array — the wrapper is a single JSON list emitted after a control token, not a separately-typed message.

### Llama 3 — `<|python_tag|>` and `llama3_json`

Meta's Llama 3.1 introduced tool use as a first-class capability with a custom prompt format. The chat template uses:
- `<|python_tag|>` to announce that what follows is a tool call;
- `<|eom_id|>` ("end of message") when the model expects to receive a tool output before continuing;
- `<|eot_id|>` ("end of turn") when the response is complete;
- an `ipython` role for tool results in built-in-tool mode.

Llama 3.1 supports several modes: built-in tools (e.g., `brave_search`, `wolfram_alpha`) emit `<|python_tag|>tool.call(...)`; JSON-based custom tools emit `<|python_tag|>{"type": "function", "name": "...", "parameters": {...}}<|eom_id|>` (the `llama3_json` parser in vLLM matches this). Llama 3.2 added a different surface — a *pythonic* format where the model emits a Python-list-of-calls expression like `[get_weather(city="SF"), get_time(tz="PT")]` — handled by a separate `pythonic` parser (Meta 2024).

### Qwen — Hermes-style `<tool_call>`

Qwen 2.5 and Qwen 3 do not invent a new format; their tokenizer-config chat template defaults to the Hermes `<tool_call>` shape (Qwen Docs). On vLLM, Qwen 3 is served with `--tool-call-parser hermes`. Qwen 3 Coder uses a slightly different XML-shaped template (`<tool_call>...<function=...><parameter=...>`), parsed by `qwen3_xml`. Qwen-Agent allows the dispatch format to be overridden with a `fncall_prompt_type` knob (default "nous").

### DeepSeek — OpenAI-shaped JSON

DeepSeek V3 and DeepSeek R1 expose function calling through their API in an OpenAI-compatible shape: assistant messages carry a `tool_calls` array of `{id, type: "function", function: {name, arguments}}`, results come back with a `tool` role. Under the hood the model uses a structured chat template; the vLLM parsers are `deepseek_v3` and `deepseek_v31`. Behavior with tool calling was historically uneven (the open-weight V3 originally shipped without tool-trained weights and inference frameworks had to add support after the fact), but by V3.1 the format was first-class (DeepSeek 2025).

### Kimi K2 — section-delimited

Moonshot AI's Kimi K2 (July 2025, 1T-parameter MoE with 32B active) ships its own delimiter scheme:

```
<|tool_calls_section_begin|>
<|tool_call_begin|>functions.get_weather:0<|tool_call_argument_begin|>{"city":"SF"}<|tool_call_end|>
<|tool_call_begin|>functions.get_time:1<|tool_call_argument_begin|>{"tz":"PT"}<|tool_call_end|>
<|tool_calls_section_end|>
```

The tool ID has the structural form `functions.{name}:{idx}`, with `idx` a globally incrementing counter; this is load-bearing — the K2 chat template *requires* IDs in this exact shape, and OpenAI-compatible servers have to rewrite IDs to match (Moonshot 2025). vLLM ships a `kimi_k2` parser.

### GLM-4.5 / 4.6 / 4.7 — XML-keyed args

Zhipu AI's GLM-4.5 (July 28 2025), 4.6, and 4.7 use an XML-shaped format with per-argument tags:

```
<tool_call>get_weather
<arg_key>city</arg_key><arg_value>San Francisco</arg_value>
<arg_key>unit</arg_key><arg_value>celsius</arg_value>
</tool_call>
```

Reasoning content is wrapped in a separate `<think>...</think>` block. GLM-4.6 specifically emphasized improved tool-use consistency and tool-integrated reasoning (Zhipu 2025). vLLM ships `glm45` and `glm47` parsers.

### Other dialects

The vLLM tool-parser registry (as of mid-2026) covers, beyond the above: `granite` (IBM Granite 3/4), `internlm` (InternLM 2.5), `jamba` (AI21 Jamba 1.5), `xlam` (Salesforce / Qwen-xLAM), `openai` (the OpenAI open-weight `gpt-oss` 20B/120B release), `cohere_command3` (Command A Reasoning), `functiongemma` (Google's tool-specialized Gemma). Each is a small Python module that knows how to spot tool-call boundaries in the decoded token stream, extract names and arguments, and emit something resembling the OpenAI `tool_calls` schema for the rest of the stack to consume.

### Why the dialect proliferation

There are three reasons every lab ended up with its own format:
1. **The tool call is in-band with the token stream.** The model emits whatever sequence of tokens it was trained on. If you change the surface, you have to retrain; if you train your own model, you pick a surface that fits your tokenizer's special tokens.
2. **Special-token economies are tokenizer-specific.** Adding `<tool_call>` as a single token costs vocab slots; Llama's `<|python_tag|>` and Mistral's `[TOOL_CALLS]` were chosen partly so the tokenizer doesn't fragment them across pieces.
3. **Parallel calls and ID handling diverged.** OpenAI uses an array. Mistral uses a JSON list after one control token. Anthropic uses repeated typed blocks. Kimi uses a section wrapper. Each is the locally simplest way to emit multiple calls given the rest of the format.

The cost: harness authors maintain a parser table indexed by model family. The benefit: open-weight models are not gated on a single closed-API spec.

---

## Parallel tool calls and structured output

### Parallel tool calls

By late 2023 it was clear that one-tool-call-per-turn was too constraining: many user requests dispatch obviously parallelizable subtasks. The wire-format adjustments came quickly:

- **OpenAI (Nov 6 2023).** GPT-4 Turbo and `gpt-3.5-turbo-1106` introduced parallel function calling; the response shape moved from singular `function_call` to a `tool_calls` array, with each call carrying an `id` (OpenAI 2023c). Harnesses execute calls concurrently (typical patterns: `Promise.all`, `asyncio.gather`) and reply with a corresponding `tool` message per call, each tagged with the matching `tool_call_id`.
- **Anthropic.** Parallel calls were native from the tool-use beta: the assistant turn simply contains multiple `tool_use` blocks. The Messages API does not need a separate field. Anthropic's "advanced tool use" documentation later (Nov 2025) emphasizes pushing further toward harness-orchestrated execution — invoking tools from a code-execution environment so intermediate results never re-enter the model's context window (Anthropic 2025).
- **Gemini.** A `Content` part list can hold multiple `functionCall` parts; "compositional function calling" extends this to chained calls within a single API turn.

The harness-side pattern that emerged: keep a map from `tool_call_id` (or Anthropic's `tool_use_id`, or Kimi's `functions.foo:idx`) to a future/promise, fire them all, gather, and produce a single follow-up message with results in the order the model expects.

### Structured outputs / strict mode

The other late-2024 development split the "structured output" use case off from tool calling. **OpenAI Structured Outputs** launched on August 6 2024 on `gpt-4o-2024-08-06` and `gpt-4o-mini` (OpenAI 2024). Two mechanisms shipped:

- `"strict": true` on a function definition, guaranteeing the emitted arguments validate against the provided JSON Schema.
- A new `response_format: {"type": "json_schema", ...}` for the case where the developer just wants structured JSON, not a tool call.

The implementation is constrained decoding: OpenAI compiles the user's JSON Schema into a context-free grammar and masks the sampler's logits to keep the output on-grammar. Failure rate against a strict-mode schema drops effectively to zero, with two trade-offs noted: first compilation of an unseen schema is slower, and over-constrained outputs occasionally loop because the model is forced to keep producing valid-but-redundant tokens (Sanders 2024, summarized in Willison 2024).

The conceptual point: a tool call *is* a structured output (it's a JSON object validating a schema), but the inverse isn't true — sometimes you want JSON without the tool-execution loop. Structured outputs as a distinct API endpoint reflects that decomposition. Anthropic, Google, and the open-weight inference servers (vLLM, llama.cpp, SGLang via outlines / xgrammar) followed with their own constrained-decoding modes during 2024–2025.

---

## What modern agents inherit

Tier 4 leaves three things on the table that every modern agent harness builds on top of:

- **A structured tool-call protocol.** The model emits tool requests *in-band, as part of its output stream*, but in a shape the harness can reliably parse — either as a sidecar field (OpenAI, Gemini), as a typed content block (Anthropic), or as in-stream delimiters (every open-weight dialect). The agent loop is "decode → if tool call, execute, splice result, decode again" and that loop is the heart of every harness from LangChain to Claude Code to Cursor.

- **The model knows about its tools.** Schemas are not hand-written into prose like in pre-2023 prompting; they ship as a first-class request field that the model's post-training has taught it to interpret. As a corollary, *tool descriptions become a design surface*. Names, descriptions, and parameter docstrings are now load-bearing prompt content; an agent harness shipping fifty tools must curate their schemas as carefully as it curates the system prompt.

- **Wire-format pluralism.** Because the open-weight ecosystem fragmented into one dialect per lab — Hermes `<tool_call>`, Mistral `[TOOL_CALLS]`, Llama `<|python_tag|>`, Kimi K2 section delimiters, GLM `<arg_key>/<arg_value>`, plus a long tail — any agent harness that aspires to run on multiple backends ships a parser per family. vLLM's tool-call-parser registry is the working specification of this pluralism. The closed APIs (OpenAI, Anthropic, Gemini) hide it behind their SDKs; on open weights, the harness eats it.

Plus two adjacent inheritances that Tier 5 picks up:
- **Parallel-by-default tool execution.** A turn produces a list of calls, the harness runs them concurrently, the next assistant turn sees a list of results. Sequential one-at-a-time tool use is now the exception.
- **The structured-output / tool-call duality.** The boundary between "I want JSON" and "I want you to call a function" is conventional, not architectural. Strict modes and constrained decoding live on both sides of the line.

Tier 5 picks up at the point where instruction-tuning meets agentic post-training: models that aren't merely *able* to use tools when prompted but have been trained on long trajectories where tool use is the dominant behavior.

---

## Citations

### Papers

- Nakano, R., Hilton, J., Balaji, S., Wu, J., Ouyang, L., et al. (2021). *WebGPT: Browser-assisted question-answering with human feedback.* arXiv:2112.09332. https://arxiv.org/abs/2112.09332
- Schick, T., Dwivedi-Yu, J., Dessì, R., Raileanu, R., Lomeli, M., Zettlemoyer, L., Cancedda, N., Scialom, T. (2023). *Toolformer: Language Models Can Teach Themselves to Use Tools.* arXiv:2302.04761. https://arxiv.org/abs/2302.04761
- Yao, S., Zhao, J., Yu, D., Du, N., Shafran, I., Narasimhan, K., Cao, Y. (2022). *ReAct: Synergizing Reasoning and Acting in Language Models.* arXiv:2210.03629. https://arxiv.org/abs/2210.03629
- Shridhar, M., Yuan, X., Côté, M.-A., Bisk, Y., Trischler, A., Hausknecht, M. (2020). *ALFWorld: Aligning Text and Embodied Environments for Interactive Learning.* arXiv:2010.03768. https://arxiv.org/abs/2010.03768
- Yao, S., Chen, H., Yang, J., Narasimhan, K. (2022). *WebShop: Towards Scalable Real-World Web Interaction with Grounded Language Agents.* NeurIPS 2022. https://webshop-pnlp.github.io/

### OpenAI

- OpenAI (2023a). *ChatGPT plugins.* March 23 2023. https://openai.com/index/chatgpt-plugins/
- OpenAI (2023b). *Function calling and other API updates.* June 13 2023. https://openai.com/index/function-calling-and-other-api-updates/
- OpenAI (2023c). *New models and developer products announced at DevDay.* November 6 2023 (parallel function calling, JSON mode). https://openai.com/index/new-models-and-developer-products-announced-at-devday/
- OpenAI (2024). *Introducing Structured Outputs in the API.* August 6 2024. https://openai.com/index/introducing-structured-outputs-in-the-api/
- OpenAI. *Function calling guide.* https://developers.openai.com/api/docs/guides/function-calling
- OpenAI. *Structured outputs guide.* https://developers.openai.com/api/docs/guides/structured-outputs

### Anthropic

- Anthropic (2023). *Introducing Claude 2.1.* November 21 2023. https://www.anthropic.com/news/claude-2-1
- Anthropic (2024). *Tool use (function calling) is now generally available.* May 30 2024. https://claude.com/blog/tool-use-ga
- Anthropic (2024). *Introducing the next generation of Claude (Claude 3 family).* March 4 2024. https://www.anthropic.com/news/claude-3-family
- Anthropic (2025). *Introducing advanced tool use on the Claude Developer Platform.* November 24 2025. https://www.anthropic.com/engineering/advanced-tool-use
- Anthropic. *Tool use overview.* https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview

### Google / Gemini

- Google (2024). *Introducing Gemini 2.0: our new AI model for the agentic era.* December 11 2024. https://blog.google/technology/google-deepmind/google-gemini-ai-update-december-2024/
- Google. *Function calling with the Gemini API.* https://ai.google.dev/gemini-api/docs/function-calling
- Google. *Gemini API release notes.* https://ai.google.dev/gemini-api/docs/changelog

### Meta / BlenderBot

- Meta AI (2022). *BlenderBot 3: An AI Chatbot That Improves Through Conversation.* August 5 2022. https://about.fb.com/news/2022/08/blenderbot-ai-chatbot-improves-through-conversation/

### Open-weight tool dialects

- Nous Research. *Hermes 2 Pro Llama-3 8B.* https://huggingface.co/NousResearch/Hermes-2-Pro-Llama-3-8B
- Nous Research. *Hermes-Function-Calling repository.* https://github.com/NousResearch/Hermes-Function-Calling
- Mistral. *Tokenization deep-dive: tool calling.* https://docs.mistral.ai/cookbooks/concept-deep-dive-tokenization-tool_calling/
- Mistral. *Function calling.* https://docs.mistral.ai/capabilities/function_calling
- Meta. *Llama 3.3 prompt format (tool calling).* https://github.com/meta-llama/llama-models/blob/main/models/llama3_3/prompt_format.md
- Meta. *Llama 3.2 text prompt format.* https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/text_prompt_format.md
- Qwen. *Function calling docs.* https://qwen.readthedocs.io/en/latest/framework/function_call.html
- DeepSeek. *Tool calls / function calling API docs.* https://api-docs.deepseek.com/guides/function_calling
- Moonshot AI. *Kimi K2 tool call guidance.* https://huggingface.co/moonshotai/Kimi-K2-Instruct/blob/main/docs/tool_call_guidance.md
- Zhipu AI / Z.ai. *GLM-4.6 tool calling / TIR guide.* https://github.com/zai-org/GLM-4.5/blob/main/resources/glm_4.6_tir_guide.md
- vLLM. *Tool calling parsers reference.* https://docs.vllm.ai/en/latest/features/tool_calling/

### Other

- Willison, S. (2024). *OpenAI: Introducing Structured Outputs in the API.* August 6 2024. https://simonwillison.net/2024/Aug/6/openai-structured-outputs/
- InfoQ (2023). *OpenAI Announces Function Calling.* June 15 2023 (coverage of June 13 announcement). https://www.infoq.com/news/2023/06/openai-api-function-chatgpt/
- HPCwire (2025). *China's Moonshot AI Releases Trillion-Parameter Model Kimi K2.* July 16 2025. https://www.hpcwire.com/2025/07/16/chinas-moonshot-ai-releases-trillion-parameter-model-kimi-k2/
