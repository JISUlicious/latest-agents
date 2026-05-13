# Tier 1 — Background: NLP → Transformer

## Overview

This tier covers the technical substrate that modern LLM-powered agents are built on: the path from pre-deep-learning NLP through word embeddings, recurrent sequence models, attention, the Transformer architecture, the three architectural families (encoder-only, decoder-only, encoder-decoder), and the early scaling laws that justified going bigger. It ends just before GPT-3, where Tier 2 picks up. Modern agents inherit two crucial primitives from this period — *autoregressive decoding over a token stream* and *attention as the universal sequence operator* — and almost every later capability (in-context learning, chain-of-thought, tool use, long-context retrieval) is a behavior that emerges on top of these substrate choices.

---

## Word vectors and distributional semantics

### From symbols to vectors

Classical NLP treated words as discrete symbols. Documents were represented as bag-of-words or TF-IDF vectors over a vocabulary, and similarity was measured between sparse, high-dimensional one-hot or count vectors. Two words with the same meaning but different spelling — *car* and *automobile* — were as far apart in this space as *car* and *banana*. The representation carried no semantic structure of its own.

The way out came from the *distributional hypothesis*, articulated by Zellig Harris in his 1954 paper "Distributional Structure" (Harris 1954) and popularized in J. R. Firth's often-quoted line "you shall know a word by the company it keeps" (Firth 1957). The claim: a word's meaning can be recovered from the distribution of contexts in which it appears. If two words occur in similar contexts, they probably mean similar things. This is the theoretical seed for everything that follows — count-based co-occurrence matrices, learned dense embeddings, contextual embeddings from BERT, and ultimately the latent representations inside today's LLMs.

Early operationalizations of the hypothesis produced *count-based* vectors: build a word-by-context matrix from a corpus, weight entries (PMI, TF-IDF), and optionally reduce dimensionality with SVD (latent semantic analysis). These vectors were dense, captured some semantic structure, but were expensive to compute and hard to update.

### word2vec (Mikolov et al. 2013)

`word2vec` (Mikolov, Chen, Corrado, Dean 2013, "Efficient Estimation of Word Representations in Vector Space") introduced two shallow neural architectures for learning dense word vectors directly from raw text at scale:

- **CBOW (Continuous Bag-of-Words):** predict a center word from its surrounding context window.
- **Skip-gram:** predict the surrounding context words from a center word.

Both are trained with a simple objective (typically negative sampling or hierarchical softmax) and produce a single static vector per word type. The result was striking: the learned vectors not only clustered semantically similar words, they also exhibited *linear analogical structure* — the famous `king − man + woman ≈ queen` arithmetic. Vectors could be trained on 1.6B words in under a day and outperformed prior methods on syntactic and semantic similarity benchmarks.

The conceptual win of word2vec was bigger than the numbers: an *embedding* — a learned, dense, low-dimensional vector — became the standard interface between raw text and downstream models. It is the same primitive every Transformer still uses at its input layer.

### GloVe (Pennington, Socher, Manning 2014)

`GloVe` ("Global Vectors for Word Representation") took a complementary view. Instead of learning from a sliding window of local contexts like skip-gram, GloVe directly factorizes a global word–word co-occurrence matrix. Its log-bilinear objective trains vectors so that the dot product of two word vectors approximates the logarithm of their co-occurrence probability. Differences between vectors then correspond to ratios of co-occurrence probabilities, which is the mechanism that gives GloVe its analogy-friendly geometry.

In practice, word2vec and GloVe vectors were near-interchangeable for downstream NLP tasks throughout 2014–2017.

### fastText (Bojanowski, Grave, Joulin, Mikolov 2017)

`fastText` ("Enriching Word Vectors with Subword Information", arXiv 2016, published 2017) extended skip-gram by representing each word as a bag of character n-grams. The vector for a word is the sum of the vectors of its character n-grams. Two payoffs:

- **Morphology:** related forms (*walk*, *walking*, *walked*) share n-grams and therefore share representational mass.
- **OOV handling:** an unseen word can still receive a vector at inference time by summing its constituent n-grams.

fastText is the closest pre-Transformer analog to the modern *subword tokenization* schemes (BPE, WordPiece, SentencePiece) that every LLM uses today. The intuition — that the unit of representation should be smaller than the orthographic word — is now standard.

### Tokenization: BPE, WordPiece, SentencePiece

A parallel thread, mostly engineering rather than research, settled the question of *what counts as a token*. Word-level vocabularies are fragile (every misspelling is OOV), character-level is too long. The compromise is *subword tokenization*:

- **Byte Pair Encoding (BPE)** (Sennrich, Haddow, Birch 2016, originally Gage 1994 for compression) starts from characters and greedily merges the most frequent adjacent pairs until a target vocabulary size is reached. Common words become single tokens; rare words decompose into morphemes or characters.
- **WordPiece** (used by BERT) is a near-identical variant differing mainly in the merge-selection criterion (likelihood under a unigram LM rather than raw frequency).
- **SentencePiece** (Kudo & Richardson 2018) handles raw bytes directly with no whitespace pre-tokenization, making it language-agnostic.

By 2019 every Transformer-based LM used some subword scheme. This is what makes "tokens" — not words — the unit of cost and capacity in modern LLMs and why "tokens-per-parameter" became the natural unit of scaling-law accounting.

### Contextualized embeddings: ELMo and the bridge to BERT

word2vec, GloVe, and fastText all produce a *single* vector per word type — *bank* gets the same vector whether it means a financial institution or a riverbank. `ELMo` (Peters et al. 2018, "Deep contextualized word representations", NAACL 2018) broke that constraint by deriving each token's vector from the internal states of a deep bidirectional LSTM language model. The same word in different contexts now had different vectors. ELMo demonstrated that *language-model pre-training* — not just word-level co-occurrence statistics — produced dramatically better representations and motivated the broader pre-train-then-fine-tune paradigm that BERT and GPT crystallized later in 2018.

ELMo is the historical hinge between Tier 1's static embeddings and the contextual embeddings every Transformer now produces internally at every layer.

### What an embedding *is*

Across word2vec, GloVe, fastText, ELMo, and every later contextualized model, an *embedding* is a learned vector in some R^d such that geometric relationships in that space approximate semantic relationships in language. This idea — that meaning has a continuous geometry the model can manipulate with linear algebra — is the most important primitive Tier 1 contributes to everything downstream.

---

## Sequence models: RNN → LSTM → seq2seq → attention

Word embeddings give you tokens-as-vectors but say nothing about how to model a *sequence* of tokens. That problem belongs to the recurrent-network thread.

### RNNs

A recurrent neural network maintains a hidden state `h_t` that is updated at each time step as a function of the current input `x_t` and the previous hidden state `h_{t−1}`. The Elman network (1990) and Jordan network (1986) are the canonical early forms. Compared with feed-forward networks, RNNs can in principle process arbitrary-length sequences and carry information forward through time.

In practice, vanilla RNNs suffer two related problems:

- **Vanishing / exploding gradients.** Backpropagation through time multiplies Jacobians across time steps; for typical activations these gradients shrink (or blow up) exponentially in sequence length. The network cannot reliably learn dependencies more than a few dozen tokens apart.
- **Inherently sequential computation.** Because `h_t` depends on `h_{t−1}`, the forward and backward passes for a sequence of length T cannot be parallelized along the time axis. Throughput scales poorly with sequence length.

Both problems are central to the case for the Transformer four years later.

### LSTM (Hochreiter and Schmidhuber 1997)

The Long Short-Term Memory unit (Hochreiter & Schmidhuber 1997, *Neural Computation*) introduced a *gated* recurrent cell designed specifically to keep gradients from vanishing across long time horizons. An LSTM maintains, in addition to the hidden state, a separate *cell state* `c_t` that acts as a persistent memory. Three sigmoid gates control how information flows:

- **Forget gate** — what to drop from the cell state.
- **Input gate** — what new information to write into the cell state.
- **Output gate** — what part of the cell state to expose as the hidden output.

Because the cell state is updated by addition rather than repeated multiplication, gradients can flow through long sequences without exponential decay. LSTMs became the workhorse architecture for sequence modeling — language modeling, speech recognition, parsing, machine translation — through the early 2010s.

### GRU (Cho et al. 2014)

The Gated Recurrent Unit was introduced in Cho et al. 2014 ("Learning Phrase Representations using RNN Encoder–Decoder for Statistical Machine Translation"). The GRU collapses LSTM's forget and input gates into a single *update gate* and merges the cell state with the hidden state. It has fewer parameters than an LSTM and often trains faster, with broadly comparable quality on common sequence tasks. Same family of solutions, different parameterization.

### Seq2seq (Sutskever, Vinyals, Le 2014)

The Sutskever–Vinyals–Le paper ("Sequence to Sequence Learning with Neural Networks", NeurIPS 2014) made the framework that defined the next several years of NLP explicit:

- An **encoder** RNN (a multi-layer LSTM in the original paper) reads the source sequence one token at a time and compresses it into a single fixed-dimensional vector — its final hidden state.
- A **decoder** RNN, conditioned on that vector, generates the target sequence one token at a time, autoregressively.

On WMT'14 English–French translation, this model achieved 34.8 BLEU end-to-end and 36.5 BLEU when used to rerank phrase-based SMT outputs, beating the phrase-based baseline. A famous engineering trick — reversing the source sentence — improved results materially, creating shorter dependencies between the start of the source and start of the target.

Seq2seq is the conceptual ancestor of the encoder-decoder Transformer and the broader template of *condition on input, generate output token by token*.

### Attention (Bahdanau, Cho, Bengio 2014/2015)

Seq2seq's "encode everything into a single fixed vector" approach has an obvious problem: as source sentences get longer, that vector becomes an information bottleneck. Bahdanau, Cho, and Bengio identified this directly: "the use of a fixed-length vector is a bottleneck in improving the performance of this basic encoder–decoder architecture" (Bahdanau et al. 2014, "Neural Machine Translation by Jointly Learning to Align and Translate", ICLR 2015).

Their fix — what we now call *attention* — has the decoder at each output step compute a weighted average over *all* encoder hidden states. The weights are computed by a small alignment network that scores each encoder state against the current decoder state. The decoder no longer has to live off a single vector summary; it can *look back* into the source sequence and softly align to whichever positions are relevant for the current output token.

Two reasons attention beat the fixed-vector bottleneck:

1. **Information bandwidth.** The decoder has access to the full encoder sequence at every step, not a summary.
2. **Soft alignment is learned.** The alignment weights are differentiable, so the model learns *what* to attend to from the translation objective itself, without explicit supervision.

This is the same operator that, three years later, the Transformer would generalize and stack until it was the entire model.

---

## The Transformer

Vaswani et al. 2017 ("Attention Is All You Need", NeurIPS 2017) made a strong and at the time controversial claim: you don't need recurrence or convolution at all. You can build a sequence model out of stacked attention layers plus position-wise feed-forward networks. The architecture they proposed is now the substrate of essentially every frontier model.

### Self-attention

In Bahdanau-style attention, queries come from the decoder and keys/values come from the encoder. *Self-attention* generalizes this: queries, keys, and values all come from the same sequence. Every token attends to every other token in its sequence and produces a new representation that is a weighted mixture of the values, with weights determined by query–key similarity.

The core operator is *scaled dot-product attention*:

```
Attention(Q, K, V) = softmax( Q K^T / sqrt(d_k) ) V
```

where `Q`, `K`, `V` are matrices of queries, keys, and values, and `d_k` is the key dimension. The `sqrt(d_k)` scaling keeps the softmax inputs in a numerically reasonable range and stabilizes gradients.

### Multi-head attention

A single attention head is forced to mix all the "kinds of relevance" — syntactic agreement, coreference, topical similarity — into one set of weights. *Multi-head attention* learns several independent sets of `(Q, K, V)` projections in parallel, runs scaled dot-product attention in each, concatenates the results, and projects them back down. Each head can specialize on a different relational pattern. The original paper used 8 heads.

### Positional encoding

Self-attention is permutation-invariant: it has no built-in notion of token order. To restore positional information, the Transformer adds a *positional encoding* to each input embedding before the first layer. The original paper used fixed sinusoidal encodings (different frequencies of sine and cosine for different dimensions), chosen so that relative positions can in principle be recovered as linear functions of the encodings. Many later variants use learned positional embeddings or relative-position schemes (e.g. RoPE, ALiBi); the principle is the same.

### Three flavors of attention in the original Transformer

It is worth being precise about how attention is used in three different places in the original 2017 model, because the same mechanism does three different jobs:

1. **Encoder self-attention.** In each encoder layer, queries, keys, and values all come from the previous encoder layer's output. Every source position attends to every other source position. No masking. This is what builds the contextual representation of the input sequence.
2. **Decoder masked self-attention.** In each decoder layer, queries, keys, and values come from the previous decoder layer, but a causal mask zeros out attention to future positions. This preserves autoregressive ordering during training (where the entire target sequence is fed in parallel) and at inference (where it is generated step by step).
3. **Encoder–decoder cross-attention.** Each decoder layer also has a cross-attention sublayer where queries come from the decoder (current output state) and keys/values come from the *encoder's* output. This is the descendant of Bahdanau-style attention — the mechanism by which the decoder looks back into the source while generating.

Decoder-only models (the GPT line) keep only mechanism #2. Encoder-only models (BERT) keep only #1. Encoder-decoder models (T5, BART) keep all three. This decomposition is the cleanest way to see why the same paper spawned three distinct architectural families.

### Encoder–decoder, parallelism

The original Transformer kept the seq2seq encoder–decoder split: a stack of 6 encoder layers and 6 decoder layers in the base configuration. Each encoder layer is `self-attention → feed-forward`, each decoder layer is `masked self-attention → cross-attention over encoder outputs → feed-forward`. Layer normalization and residual connections wrap each sublayer. The decoder's self-attention is causally masked so a position can only attend to earlier positions, preserving the autoregressive property for generation.

The architectural payoff of dropping recurrence: every position can be computed in parallel within a layer, because there is no `h_t = f(h_{t−1})` chain. Training maps cleanly onto GPU and TPU matmul kernels. The same model that took weeks to train as an LSTM trained in hours as a Transformer, and — crucially — *kept scaling* as you threw more compute at it. On WMT'14 the original Transformer reached 28.4 BLEU on English–German and 41.8 BLEU on English–French, state of the art at the time, at a fraction of the prior training cost.

That parallelism property is what made the scaling story of 2018–2022 possible at all.

### Caveats on the original paper's claims

A few footnotes that matter when reading the original paper today:

- **Computational complexity.** Self-attention is `O(n^2 · d)` in sequence length `n` and hidden size `d`, vs. RNNs at `O(n · d^2)`. For typical NLP sequences (`n < d`) self-attention is *faster*; for very long sequences (`n >> d`) the quadratic term dominates and motivates the whole subsequent literature on efficient attention (Longformer, BigBird, Performer, FlashAttention, etc.).
- **Positional encodings are an open design space.** The sinusoidal scheme in the paper was a defensible default, not a settled answer. Learned absolute positions (BERT, GPT-2), relative position biases (T5, ALiBi), and rotary embeddings (RoPE, used in Llama and most current open-weight models) all replaced it in subsequent work without changing the rest of the architecture.
- **The original model was a translation model, not a language model.** Vaswani et al.'s experiments were on machine translation. The decoder-only language-modeling variant that defines the modern LLM era came a year later with GPT-1.

---

## Architectural families: encoder-only / decoder-only / encoder-decoder

Once the Transformer existed, the field quickly split it into three flavors, each suited to a different class of tasks.

### Encoder-only — BERT and descendants

`BERT` (Devlin, Chang, Lee, Toutanova 2018, "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding") keeps only the encoder stack and trains it with two self-supervised objectives:

- **Masked Language Modeling (MLM).** Roughly 15% of input tokens are replaced (80% with `[MASK]`, 10% with a random token, 10% unchanged); the model predicts the originals. Because the encoder is fully bidirectional, predictions can use both left and right context — something an autoregressive decoder cannot do.
- **Next Sentence Prediction (NSP).** Given two segments, predict whether segment B actually follows segment A in the source corpus. Later work (RoBERTa) showed NSP contributes little and is often dropped.

The published variants were BERT-Base (12 layers, 768 hidden, 12 attention heads, ~110M parameters) and BERT-Large (24 layers, 1024 hidden, 16 attention heads, ~340M parameters), pre-trained on BookCorpus + English Wikipedia. BERT set new state-of-the-art on 11 NLP tasks including GLUE (80.5%) and SQuAD.

The encoder-only family then evolved through:

- **RoBERTa** (Liu et al. 2019) — same architecture, *substantially* better training: more data, longer schedules, larger batches, no NSP, dynamic masking. Showed BERT was undertrained, not architecturally limited.
- **DeBERTa** (He, Liu, Gao, Chen 2020) — *disentangled attention*: each token is represented by separate content and position vectors, and attention is computed over content–content, content–position, and position–content interactions independently. Surpassed human performance on SuperGLUE.

**Use cases.** Encoder-only models are the right fit when the task is to *consume* text rather than *generate* it: classification, sequence labeling, natural language inference, span extraction, and — critically for the agent story — producing *embeddings* for retrieval. The dense-retrieval renaissance that powers modern RAG (BGE, E5, GTE, Cohere/OpenAI/Voyage embedding APIs) is downstream of BERT-style encoders.

### Decoder-only — the GPT line

`GPT` (Radford, Narasimhan, Salimans, Sutskever 2018, "Improving Language Understanding by Generative Pre-Training") kept only the decoder stack. The objective is the simplest possible: predict the next token given all previous tokens, trained by maximum likelihood on raw text. The model is causal — each position can only attend to earlier positions — so generation is just iterated sampling. GPT-1 was a 12-layer Transformer decoder (~117M parameters) and showed that *one* pre-trained backbone, fine-tuned per task with a tiny task-specific head, could beat specialized architectures on 9 of 12 benchmarks.

`GPT-2` (Radford, Wu, Child, Luan, Amodei, Sutskever 2019, "Language Models are Unsupervised Multitask Learners") scaled the same recipe to 1.5B parameters on WebText (~40 GB of Reddit-curated documents). The headline result was that a sufficiently large language model implicitly learns to perform many NLP tasks zero-shot — translation, summarization, QA — purely by next-token prediction. This is the first time the field saw the modern pattern of *tasks as text*: instead of fine-tuning a classifier, you prompt a generator. (OpenAI famously staged GPT-2's release.)

**Why decoder-only won the LLM race.** Several converging factors:

- **Generative tasks are the general case.** Classification can be cast as generation ("the sentiment is positive"); the reverse is not true. A decoder-only LM trained on next-token prediction is task-agnostic by construction.
- **Scaling behaves well.** Decoder-only LMs scale cleanly with compute, parameters, and data (see scaling laws below). They use a single objective on raw text and need no curated supervision.
- **In-context learning.** Once the model is big enough (GPT-3 in 2020 — Tier 2), the *prompt itself* becomes a programming surface. Encoder-only models, which only score or embed, never developed an equivalent capability.
- **One training stage is enough.** No paired masked / unmasked objectives, no NSP, no span corruption — just maximize likelihood of the next token.

The decoder-only architecture is the direct ancestor of every chat model and every agent backbone in production today.

### Encoder-decoder — T5 and BART

`T5` (Raffel et al. 2019, "Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer") kept the full encoder-decoder Transformer and made one radical move: cast *every* NLP task as text-in, text-out. Classification: input the document with a task prefix ("cola sentence: ..."), output the label as a word ("acceptable"). Translation, summarization, QA — same template. The pre-training task was *span corruption*: random spans of the input are replaced with sentinel tokens, and the decoder is trained to emit the missing spans. T5 was trained on the **C4** corpus (Colossal Clean Crawled Corpus), a ~750 GB filter of Common Crawl that T5 introduced and that many later models reused.

`BART` (Lewis et al. 2019, "BART: Denoising Sequence-to-Sequence Pre-training for Natural Language Generation, Translation, and Comprehension") is also a full encoder-decoder Transformer with a denoising objective, but its noising functions are more aggressive: token masking, token deletion, *text infilling* (span replaced with a single mask, length unknown to the model), sentence permutation, document rotation. The encoder reads the corrupted text bidirectionally (BERT-like) and the decoder reconstructs the original autoregressively (GPT-like) — explicitly framed as combining the bidirectional encoder of BERT with the left-to-right decoder of GPT. BART was particularly strong on generation tasks like summarization.

**Use cases.** Encoder-decoder models remain the natural fit for *conditional generation* — translation, summarization, code-from-spec — where the input is a finished artifact you want to consume bidirectionally and the output is a new artifact you produce token by token. They were dominant in 2019–2020 but were largely overshadowed in mindshare by the decoder-only line as scale increased; T5-family models are still actively used (e.g. as embedding bases and for specialized generation work).

### The pre-train / fine-tune paradigm

A pattern crystallized across all three families during 2018–2019 that is arguably as important as any single architectural choice:

1. **Pre-train** a Transformer on a self-supervised objective (next-token prediction, masked LM, span corruption) over a very large general-purpose text corpus. This is expensive — millions of dollars of compute even at 2019 prices.
2. **Adapt** the pre-trained model to specific downstream tasks. In the 2018–2020 era, "adapt" meant fine-tuning all parameters on a small labeled task dataset, often with a tiny task-specific head bolted on. Hundreds of papers showed this pre-train-then-fine-tune recipe beat training task-specific architectures from scratch, often by large margins, on tasks ranging from sentiment classification to NER to question answering.

This separation is what made NLP a scalable engineering discipline. One organization could spend the compute to produce a pre-trained backbone; the rest of the field could adapt it cheaply. The economic logic is identical to what later happened with foundation-model APIs: a small number of frontier pre-trains support a long tail of downstream applications.

Two later refinements of "adapt" matter for the agent story:

- **In-context learning (Tier 2).** With GPT-3 scale, "adapt" stopped requiring gradient updates at all. The pre-trained model could be steered by examples placed in the prompt. Fine-tuning didn't die, but it became one option among several.
- **Parameter-efficient fine-tuning.** LoRA (Hu et al. 2021) and adapters showed that you could specialize a frozen pre-trained model by training tiny low-rank deltas, making per-task adaptation cheap enough to do at the application layer.

Modern agent stacks live entirely inside this paradigm: every production agent is a thin behavioral layer (system prompt, tools, scaffolding) wrapped around a pre-trained backbone someone else paid to train.

---

## Scaling laws

By 2019 it was clear that bigger Transformers worked better. The harder questions were *how much* better and *what should you spend marginal compute on* — more parameters, more data, or longer training. Two papers defined the answers.

### Kaplan et al. 2020

Kaplan, McCandlish, Henighan, Brown, Chess, Child, Gray, Radford, Wu, Amodei ("Scaling Laws for Neural Language Models", arXiv January 2020) ran a large empirical study at OpenAI varying model size, dataset size, and training compute across more than seven orders of magnitude. Key findings:

- **Loss follows smooth power laws.** Cross-entropy loss is a predictable power-law function of model parameters `N`, dataset size `D`, and compute `C`, with each factor producing a clean log–log straight line over many orders of magnitude when the other factors are not the bottleneck.
- **Architecture details mostly don't matter.** Within reasonable ranges, depth/width trade-offs, attention-head counts, and similar architectural choices change loss far less than scale does.
- **Large models are more sample-efficient.** Per training token, bigger models reach a given loss level faster.
- **Compute-optimal: prefer larger models, train them less than to convergence.** The Kaplan paper's prescription for fixed compute budget was to spend most of the marginal compute on *parameters* and somewhat less on tokens.

This last conclusion shaped the era of GPT-3, Gopher, Megatron-Turing NLG, and Jurassic-1 — all very large (175B+ parameters) trained on relatively modest token counts. It was also wrong, as the next paper would show.

### Chinchilla / Hoffmann et al. 2022

Hoffmann et al. 2022 ("Training Compute-Optimal Large Language Models", aka the Chinchilla paper, DeepMind) re-ran the scaling study with a more careful methodology — over 400 models from 70M to 16B parameters trained on 5B to 500B tokens — and reached a different conclusion:

- **Parameters and tokens should scale roughly equally.** For each doubling of model size, the number of training tokens should also double. Both grow as roughly `C^0.5` with compute.
- **The compute-optimal tokens-per-parameter ratio is about 20.** A 70B-parameter model trained compute-optimally needs roughly 1.4T tokens of data.
- **Most existing large models were undertrained.** Gopher (280B), GPT-3 (175B), Jurassic-1 (178B), Megatron-Turing NLG (530B) had been built under Kaplan-style assumptions and were trained on too little data relative to their parameter counts.

To verify, the team trained *Chinchilla* — 70B parameters, ~1.4T tokens, same compute budget as Gopher. Chinchilla uniformly and significantly outperformed Gopher, GPT-3, Jurassic-1, and Megatron-Turing NLG on downstream evaluations despite having a fraction of their parameters.

**Implications and caveats.**

- The 20-tokens-per-parameter rule is now the standard back-of-envelope for "is this model adequately trained?"
- Chinchilla scaling is *compute-optimal at training time*. Inference cost scales with parameters, so deployment-aware training (where serving costs matter) often pushes ratios *much* higher than 20 — modern open-weight models like Llama 3 are trained on far more than 20 tokens/parameter, deliberately overtrained for cheaper inference.
- Subsequent replication work (Epoch AI 2024) found Hoffmann et al.'s headline coefficients are roughly correct but with wider uncertainty bands than originally reported. The qualitative picture — *more data than Kaplan suggested* — has held up.

The Kaplan → Chinchilla shift is the empirical backbone of the "just make it bigger" era. Tier 2 is what happened when an organization (OpenAI) actually executed on Kaplan-style scaling and discovered emergent abilities at the 100B+ parameter mark.

---

## What modern agents inherit

By the time GPT-3 lands (Tier 2), the Tier 1 substrate has crystallized into a small set of primitives that every later capability sits on top of:

- **Tokens and embeddings.** Text enters the model as a sequence of subword tokens; each token is mapped to a learned vector. This is the bottom of every modern stack, unchanged in principle from word2vec → BERT → GPT to today's frontier models. Tool calls, system prompts, retrieved documents, function outputs — they are all just more tokens.
- **Attention as the universal sequence operator.** Self-attention is how modern models mix information across positions, layers, modalities, and (with cross-attention) across separately encoded streams. The same primitive supports in-context learning, long-context retrieval, multi-modal fusion, and tool-result integration. Variants (sparse attention, grouped-query attention, RoPE, sliding-window, FlashAttention) are engineering refinements, not architectural replacements.
- **Autoregressive decoding.** Decoder-only Transformers generate one token at a time, conditioned on everything written so far. This loop is the *agent loop*'s innermost substrate: the same forward pass that predicts the next word also predicts the next tool call, the next reasoning step, the next stop token. Every behavior in Tiers 3–7 (chain-of-thought, ReAct, tool use, structured output) is a pattern *inside* an autoregressive decode.
- **Pre-train then adapt.** Self-supervised pre-training on raw text, followed by lighter-weight adaptation (fine-tuning, instruction tuning, RLHF, in-context prompting). The split between an expensive frontier pre-train and cheap per-application adaptation is what makes agent-building economically viable.
- **The scaling-laws mindset.** Loss-as-power-law and compute-optimal training shape how frontier labs allocate budget across parameters, tokens, and training time. They are why the field expects bigger, better-trained models on a roughly predictable schedule, and why agent designers treat "wait for the next model" as a legitimate option in the design space.
- **Parallelism over recurrence.** Dropping RNN-style sequential state was what made GPU-era scaling possible. Modern agents inherit this indirectly: the reason a 200K-context model is feasible at all is that attention is matmul-shaped.

These five inheritances — embeddings, attention, autoregressive decoding, the pre-train/adapt split, and the scaling-laws mindset — are the foundation. Tier 2 is the moment the field discovers what happens when you push this substrate past 100B parameters and let users talk to it.

---

## Citations

- Harris, Z. (1954). "Distributional Structure." *Word*, 10(2–3). https://www.tandfonline.com/doi/abs/10.1080/00437956.1954.11659520
- Firth, J. R. (1957). "A Synopsis of Linguistic Theory, 1930–1955." In *Studies in Linguistic Analysis*. (Source of "you shall know a word by the company it keeps".)
- Hochreiter, S., & Schmidhuber, J. (1997). "Long Short-Term Memory." *Neural Computation*, 9(8), 1735–1780. https://www.bioinf.jku.at/publications/older/2604.pdf
- Mikolov, T., Chen, K., Corrado, G., Dean, J. (2013). "Efficient Estimation of Word Representations in Vector Space." arXiv:1301.3781. https://arxiv.org/abs/1301.3781
- Pennington, J., Socher, R., Manning, C. D. (2014). "GloVe: Global Vectors for Word Representation." *EMNLP 2014*. https://nlp.stanford.edu/projects/glove/
- Cho, K., van Merriënboer, B., Gulcehre, C., Bahdanau, D., Bougares, F., Schwenk, H., Bengio, Y. (2014). "Learning Phrase Representations using RNN Encoder–Decoder for Statistical Machine Translation." arXiv:1406.1078. https://arxiv.org/abs/1406.1078
- Sutskever, I., Vinyals, O., Le, Q. V. (2014). "Sequence to Sequence Learning with Neural Networks." *NeurIPS 2014*. arXiv:1409.3215. https://arxiv.org/abs/1409.3215
- Bahdanau, D., Cho, K., Bengio, Y. (2014/2015). "Neural Machine Translation by Jointly Learning to Align and Translate." *ICLR 2015*. arXiv:1409.0473. https://arxiv.org/abs/1409.0473
- Bojanowski, P., Grave, E., Joulin, A., Mikolov, T. (2016/2017). "Enriching Word Vectors with Subword Information." arXiv:1607.04606. https://arxiv.org/abs/1607.04606
- Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., Kaiser, L., Polosukhin, I. (2017). "Attention Is All You Need." *NeurIPS 2017*. arXiv:1706.03762. https://arxiv.org/abs/1706.03762
- Radford, A., Narasimhan, K., Salimans, T., Sutskever, I. (2018). "Improving Language Understanding by Generative Pre-Training." OpenAI technical report. https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf
- Devlin, J., Chang, M.-W., Lee, K., Toutanova, K. (2018). "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding." arXiv:1810.04805. https://arxiv.org/abs/1810.04805
- Radford, A., Wu, J., Child, R., Luan, D., Amodei, D., Sutskever, I. (2019). "Language Models are Unsupervised Multitask Learners." (GPT-2.) OpenAI technical report. https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf
- Liu, Y., Ott, M., Goyal, N., Du, J., Joshi, M., Chen, D., Levy, O., Lewis, M., Zettlemoyer, L., Stoyanov, V. (2019). "RoBERTa: A Robustly Optimized BERT Pretraining Approach." arXiv:1907.11692. https://arxiv.org/abs/1907.11692
- Lewis, M., Liu, Y., Goyal, N., Ghazvininejad, M., Mohamed, A., Levy, O., Stoyanov, V., Zettlemoyer, L. (2019). "BART: Denoising Sequence-to-Sequence Pre-training for Natural Language Generation, Translation, and Comprehension." arXiv:1910.13461. https://arxiv.org/abs/1910.13461
- Raffel, C., Shazeer, N., Roberts, A., Lee, K., Narang, S., Matena, M., Zhou, Y., Li, W., Liu, P. J. (2019). "Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer." (T5.) arXiv:1910.10683. https://arxiv.org/abs/1910.10683
- Kaplan, J., McCandlish, S., Henighan, T., Brown, T. B., Chess, B., Child, R., Gray, S., Radford, A., Wu, J., Amodei, D. (2020). "Scaling Laws for Neural Language Models." arXiv:2001.08361. https://arxiv.org/abs/2001.08361
- He, P., Liu, X., Gao, J., Chen, W. (2020). "DeBERTa: Decoding-enhanced BERT with Disentangled Attention." arXiv:2006.03654. https://arxiv.org/abs/2006.03654
- Hoffmann, J., Borgeaud, S., Mensch, A., Buchatskaya, E., Cai, T., Rutherford, E., et al. (2022). "Training Compute-Optimal Large Language Models." (Chinchilla.) arXiv:2203.15556. https://arxiv.org/abs/2203.15556
- Wikipedia: "Long short-term memory." https://en.wikipedia.org/wiki/Long_short-term_memory
- Wikipedia: "Recurrent neural network." https://en.wikipedia.org/wiki/Recurrent_neural_network
- Wikipedia: "Transformer (deep learning architecture)." https://en.wikipedia.org/wiki/Transformer_(deep_learning_architecture)
- Wikipedia: "BERT (language model)." https://en.wikipedia.org/wiki/BERT_(language_model)
- Wikipedia: "GPT-2." https://en.wikipedia.org/wiki/GPT-2
- Besiroglu, T., Erdil, E., Barnett, M., You, J. (2024). "Chinchilla Scaling: A replication attempt." Epoch AI. arXiv:2404.10102. https://arxiv.org/abs/2404.10102
- Sennrich, R., Haddow, B., Birch, A. (2016). "Neural Machine Translation of Rare Words with Subword Units." (BPE.) arXiv:1508.07909. https://arxiv.org/abs/1508.07909
- Kudo, T., Richardson, J. (2018). "SentencePiece: A simple and language independent subword tokenizer and detokenizer for Neural Text Processing." arXiv:1808.06226. https://arxiv.org/abs/1808.06226
- Peters, M. E., Neumann, M., Iyyer, M., Gardner, M., Clark, C., Lee, K., Zettlemoyer, L. (2018). "Deep contextualized word representations." (ELMo.) NAACL 2018. arXiv:1802.05365. https://arxiv.org/abs/1802.05365
