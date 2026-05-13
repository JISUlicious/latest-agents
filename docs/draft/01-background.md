# Tier 1 — Background: NLP → Transformer

> The substrate. Pre-LLM NLP through the Transformer, ending just before GPT-3. By the close of this tier the agent's innermost loop already exists in skeletal form: a stream of tokens flowing into an attention-based model that emits one token at a time.

## From symbols to vectors

Classical NLP treated words as discrete symbols — bag-of-words, TF-IDF, one-hot. *Car* and *automobile* were as far apart as *car* and *banana*. The way out came from the **distributional hypothesis** (Harris 1954; Firth 1957): a word's meaning is recoverable from the company it keeps.

The hypothesis was operationalized at scale by **word2vec** (Mikolov 2013). Two shallow architectures — CBOW and Skip-gram — learned dense vectors directly from raw text, fast and well enough to produce the famous `king − man + woman ≈ queen` analogy. **GloVe** (Pennington 2014) reached comparable vectors by factorizing a global co-occurrence matrix instead. **fastText** (Bojanowski 2017) added subword n-grams, foreshadowing the **subword tokenization** (BPE, WordPiece, SentencePiece) that every modern LLM now uses.

The conceptual win was bigger than any benchmark: an *embedding* — a learned vector in some `R^d` whose geometry approximates semantic relationships — became the standard interface between text and downstream models. **ELMo** (Peters 2018) showed those vectors should be *contextual*, computed from a deep bidirectional LM rather than looked up. That insight is now the substrate of every Transformer layer.

## Sequence models: RNN → LSTM → seq2seq → attention

Embeddings give you tokens-as-vectors but say nothing about sequences. The recurrent-network thread answered that — for a while.

A vanilla RNN maintains a hidden state `h_t = f(x_t, h_{t-1})`. Backprop-through-time has two notorious failure modes: **vanishing/exploding gradients** over long horizons, and **inherently sequential computation** that defeats GPU parallelism. The **LSTM** (Hochreiter & Schmidhuber 1997) fixed the gradient problem with a gated cell state that updates by *addition* rather than repeated multiplication. The **GRU** (Cho 2014) was a leaner cousin. LSTMs were the workhorse of sequence modeling from roughly 2014 to 2017.

**Seq2seq** (Sutskever 2014) crystallized the encoder–decoder template: an encoder LSTM compresses the source into a fixed vector; a decoder LSTM, conditioned on that vector, emits the target one token at a time. The template is the conceptual ancestor of every "condition on input, generate output" model since.

The fixed-vector summary was the bottleneck. **Attention** (Bahdanau 2014/2015) replaced it with a learned soft alignment: at each output step, the decoder computes a weighted average over *all* encoder states, with weights produced by a small alignment network trained jointly with the rest. The decoder no longer had to live off a summary; it could look back. Two reasons this won: **information bandwidth** (every encoder position is reachable) and **learned alignment** (the model decides what to look at, supervised only by the downstream loss).

## The Transformer

**"Attention Is All You Need"** (Vaswani 2017) made the strong claim that you don't need recurrence at all. Stack attention layers and position-wise feed-forward networks, add positional encodings to compensate for self-attention's permutation invariance, and you get a sequence model that trains faster, parallelizes cleanly, and keeps scaling as compute grows.

The core operator is *scaled dot-product attention*:

```
Attention(Q, K, V) = softmax( Q Kᵀ / √d_k ) V
```

**Multi-head attention** runs several `(Q, K, V)` projections in parallel so different heads can specialize on different relational patterns (syntax, coreference, topical similarity, ...). The original paper used 8 heads.

Three places attention is used in the original Transformer — and the cleanest way to see why one paper spawned three families:

1. **Encoder self-attention** — bidirectional context-building over the source.
2. **Decoder masked self-attention** — causal, used for autoregressive generation.
3. **Encoder–decoder cross-attention** — the descendant of Bahdanau attention.

Dropping recurrence is what made GPU/TPU-era scaling possible: there is no `h_t = f(h_{t-1})` chain along the time axis, so every position in a layer can be computed in parallel. Attention is `O(n²·d)` in sequence length, which motivates the entire later efficient-attention literature (Longformer, FlashAttention, RoPE, ALiBi, etc.) — engineering refinements, not architectural replacements.

## Three families

Once the Transformer existed, the field quickly split it into three flavors:

- **Encoder-only — BERT** (Devlin 2018). Bidirectional self-attention, trained with masked-LM. The right fit for *consuming* text: classification, sequence labeling, span extraction, and — crucially for the agent story — producing **embeddings** for retrieval. The dense-retrieval renaissance that powers RAG (BGE, E5, GTE, the OpenAI/Cohere/Voyage embedding APIs) is downstream of BERT-style encoders. Refinements: **RoBERTa** (Liu 2019) showed BERT was undertrained; **DeBERTa** (He 2020) added disentangled content/position attention.

- **Decoder-only — the GPT line** (Radford 2018 / GPT-2 2019). Causal self-attention only, trained on next-token prediction. **Why this won the LLM race:** generative tasks are the general case (classification fits inside generation, not vice versa); scaling is clean (one objective, raw text); in-context learning emerges at scale (the prompt becomes the programming surface — Tier 2); and one training stage is enough.

- **Encoder–decoder — T5 and BART** (Raffel 2019; Lewis 2019). Cast every task as text-in, text-out (T5) or denoise a corrupted document back to its original (BART). Still strong for *conditional generation* — translation, summarization, code-from-spec — but largely overshadowed in mindshare as decoder-only models scaled.

Cutting across all three, a *paradigm* crystallized: **pre-train an expensive frontier backbone on a self-supervised objective, then adapt it cheaply per task**. In 2018-2020 "adapt" meant fine-tuning; from 2020 onward (Tier 2) it increasingly meant *prompting*. Every production agent today is a thin behavioral layer (system prompt, tools, scaffolding) wrapped around a backbone someone else paid to train.

## Scaling laws

Two empirical results justified going much bigger.

**Kaplan 2020** ran an OpenAI scaling study across more than seven orders of magnitude and found that cross-entropy loss is a clean power-law in parameters `N`, dataset size `D`, and compute `C` — architecture details barely matter compared to scale. The Kaplan prescription for a fixed compute budget was to spend most of the marginal compute on parameters; this shaped the GPT-3 / Gopher / Jurassic-1 era of "very large model, modest training tokens."

**Chinchilla** (Hoffmann 2022) re-ran the study with more careful methodology and reached a different conclusion: parameters and tokens should scale roughly equally — the compute-optimal ratio is about **20 tokens per parameter**. Most previously-trained large models were therefore *under-trained*. A 70B-parameter Chinchilla trained on ~1.4T tokens beat the 280B Gopher with the same compute budget. The 20-tokens-per-parameter rule is now the back-of-envelope default, though deployment-aware training (where inference cost matters) often pushes ratios much higher — Llama 3 is deliberately overtrained for cheaper serving.

## → Inherited by modern agents

Five primitives crystallize in this tier and persist unchanged into every contemporary agent:

- **Tokens and embeddings.** Text enters the model as subword tokens; each token is mapped to a learned vector. Tool calls, system prompts, retrieved documents, function outputs — they are all just more tokens.
- **Attention as the universal sequence operator.** Self-attention is how modern models mix information across positions, layers, modalities, and (via cross-attention) across separately encoded streams.
- **Autoregressive decoding.** Decoder-only Transformers generate one token at a time, conditioned on everything written so far. The same forward pass that predicts the next word predicts the next tool call, the next reasoning step, the next stop token. *This is the innermost substrate of the agent loop.*
- **Pre-train then adapt.** Expensive frontier pre-train + cheap per-application adaptation is the economic logic that makes agent-building viable.
- **The scaling-laws mindset.** Loss-as-power-law and compute-optimal training shape how labs allocate budget. They are why agent designers treat "wait for the next model" as a legitimate design move.

Tier 2 is what happens when an organization actually executes Kaplan-style scaling and discovers what emerges past 100B parameters.
