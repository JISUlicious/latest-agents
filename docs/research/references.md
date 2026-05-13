# Publications — annotated bibliography

> Reference material for the modern-AI-agents story arc.
> Verified arxiv abstracts as of 2026-05-13.
> Cross-referenced by `docs/research/0N-*.md` and `docs/draft/0N-*.md`.

## How to cite

Inline form used elsewhere in this corpus: `(Author Year)`.
Each entry below has a short slug usable for cross-doc references.

Verification convention:
- "abstract:" prefix means the abstract paragraph is quoted verbatim from the source.
- Otherwise it is a tight paraphrase of the source abstract.
- `[URL unverifiable as of 2026-05-13]` marks any source that failed to resolve.

---

## Tier 1 — Foundations and Transformer

### Mikolov2013-word2vec
- **Title:** Efficient Estimation of Word Representations in Vector Space
- **Authors:** Tomas Mikolov, Kai Chen, Greg Corrado, Jeffrey Dean
- **Year:** 2013
- **Venue:** arxiv preprint (later ICLR Workshop 2013)
- **URL:** https://arxiv.org/abs/1301.3781
- **Significance for agents:** Established dense word vectors as a learnable primitive via Skip-gram and CBOW objectives — the substrate from which every later embedding, retrieval index, and transformer input layer descends.
- **Abstract:** abstract: "We propose two novel model architectures for computing continuous vector representations of words from very large data sets. The quality of these representations is measured in a word similarity task, and the results are compared to the previously best performing techniques based on different types of neural networks. We observe large improvements in accuracy at much lower computational cost, i.e. it takes less than a day to learn high quality word vectors from a 1.6 billion words data set. Furthermore, we show that these vectors provide state-of-the-art performance on our test set for measuring syntactic and semantic word similarities."

### Mikolov2013-skipgram
- **Title:** Distributed Representations of Words and Phrases and their Compositionality
- **Authors:** Tomas Mikolov, Ilya Sutskever, Kai Chen, et al.
- **Year:** 2013
- **Venue:** NeurIPS 2013
- **URL:** https://arxiv.org/abs/1310.4546
- **Significance for agents:** Companion to word2vec that introduced negative sampling and subword/phrase handling — the engineering tricks that made dense embeddings tractable at web scale.
- **Abstract:** abstract: "The recently introduced continuous Skip-gram model is an efficient method for learning high-quality distributed vector representations that capture a large number of precise syntactic and semantic word relationships. In this paper we present several extensions that improve both the quality of the vectors and the training speed. By subsampling of the frequent words we obtain significant speedup and also learn more regular word representations. We also describe a simple alternative to the hierarchical softmax called negative sampling. An inherent limitation of word representations is their indifference to word order and their inability to represent idiomatic phrases. For example, the meanings of 'Canada' and 'Air' cannot be easily combined to obtain 'Air Canada'. Motivated by this example, we present a simple method for finding phrases in text, and show that learning good vector representations for millions of phrases is possible."

### Pennington2014-glove
- **Title:** GloVe: Global Vectors for Word Representation
- **Authors:** Jeffrey Pennington, Richard Socher, Christopher D. Manning
- **Year:** 2014
- **Venue:** EMNLP 2014
- **URL:** https://aclanthology.org/D14-1162/
- **Significance for agents:** Alternative to Skip-gram built on global word-word co-occurrence statistics; the second canonical static-embedding lineage and a frequent baseline before contextual embeddings.
- **Abstract:** GloVe is an unsupervised algorithm that learns word vectors from aggregated global co-occurrence statistics. The method factorizes a weighted log-co-occurrence matrix so that the dot product of two word vectors approximates the log of their joint frequency; a weighting function suppresses noise from rare pairs while emphasizing reliable signals. The resulting embeddings exhibit the now-famous linear analogy structure (e.g., king − man + woman ≈ queen) and outperformed prior models on word similarity and named-entity recognition tasks. [Abstract paraphrased; full verbatim abstract on the EMNLP PDF was not extractable via WebFetch.]

### Hochreiter1997-lstm
- **Title:** Long Short-Term Memory
- **Authors:** Sepp Hochreiter, Jürgen Schmidhuber
- **Year:** 1997
- **Venue:** Neural Computation 9(8):1735–1780
- **URL:** https://direct.mit.edu/neco/article-abstract/9/8/1735/6109/Long-Short-Term-Memory (paywalled; PDF mirror at https://www.bioinf.jku.at/publications/older/2604.pdf — [PDF text unverifiable via WebFetch as of 2026-05-13])
- **Significance for agents:** The first architecture to reliably propagate gradients across long sequences via gated memory cells; underpinned seq2seq and attention work for two decades and is the conceptual ancestor of every "context window" we still talk about.
- **Abstract:** Introduces the LSTM unit — a recurrent cell with a constant-error-carousel memory cell guarded by multiplicative input and output gates — that resolves the vanishing/exploding gradient problem afflicting standard RNNs. The architecture learns to bridge time lags of more than 1,000 discrete steps, enables stable training via truncated gradient flow through the gates, and outperforms prior recurrent and time-delay architectures on a battery of long-dependency benchmarks. [Abstract paraphrased; canonical Neural Computation page is paywalled.]

### Sutskever2014-seq2seq
- **Title:** Sequence to Sequence Learning with Neural Networks
- **Authors:** Ilya Sutskever, Oriol Vinyals, Quoc V. Le
- **Year:** 2014
- **Venue:** NeurIPS 2014
- **URL:** https://arxiv.org/abs/1409.3215
- **Significance for agents:** Formalized the encoder–decoder framing of generation as conditional sequence modeling — the conceptual frame that absorbed translation, summarization, dialogue, and eventually instruction following.
- **Abstract:** abstract: "Deep Neural Networks (DNNs) are powerful models that have achieved excellent performance on difficult learning tasks. Although DNNs work well whenever large labeled training sets are available, they cannot be used to map sequences to sequences. In this paper, we present a general end-to-end approach to sequence learning that makes minimal assumptions on the sequence structure. Our method uses a multilayered Long Short-Term Memory (LSTM) to map the input sequence to a vector of a fixed dimensionality, and then another deep LSTM to decode the target sequence from the vector. Our main result is that on an English to French translation task from the WMT'14 dataset, the translations produced by the LSTM achieve a BLEU score of 34.8 on the entire test set."

### Bahdanau2014-attention
- **Title:** Neural Machine Translation by Jointly Learning to Align and Translate
- **Authors:** Dzmitry Bahdanau, Kyunghyun Cho, Yoshua Bengio
- **Year:** 2014 (ICLR 2015)
- **Venue:** ICLR 2015
- **URL:** https://arxiv.org/abs/1409.0473
- **Significance for agents:** Introduced soft attention as a way to escape the encoder bottleneck — the single mechanism every subsequent transformer, retrieval system, and tool-routing controller is built on.
- **Abstract:** Identifies the fixed-length vector bottleneck of the standard encoder–decoder and proposes an attention mechanism that lets the decoder soft-search over source positions when producing each target token. The resulting alignment-aware translator matches phrase-based statistical MT on English–French and produces qualitatively interpretable alignments. [Source: arxiv abstract page; paraphrased.]

### Vaswani2017-transformer
- **Title:** Attention Is All You Need
- **Authors:** Ashish Vaswani, Noam Shazeer, Niki Parmar, et al.
- **Year:** 2017
- **Venue:** NeurIPS 2017
- **URL:** https://arxiv.org/abs/1706.03762
- **Significance for agents:** The architecture that replaced recurrence with parallelizable self-attention — and thereby made every later scaling-driven phenomenon (GPT-2/3, emergence, agents) economically possible.
- **Abstract:** abstract: "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks in an encoder-decoder configuration. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train."

### Devlin2018-bert
- **Title:** BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding
- **Authors:** Jacob Devlin, Ming-Wei Chang, Kenton Lee, Kristina Toutanova
- **Year:** 2018
- **Venue:** NAACL 2019 (arxiv preprint 2018)
- **URL:** https://arxiv.org/abs/1810.04805
- **Significance for agents:** Demonstrated that masked-language pretraining of a bidirectional transformer plus task-specific fine-tuning could state-of-the-art the entire NLP benchmark suite at once — the empirical proof of pretraining as a general-purpose pipeline.
- **Abstract:** Introduces BERT, a deep bidirectional transformer pre-trained on masked language modeling and next-sentence prediction over unlabeled text. With minimal task-specific architectural changes, a single pre-trained checkpoint fine-tunes to state-of-the-art on eleven NLP benchmarks including GLUE, MultiNLI, and SQuAD v1.1/v2.0.

### Radford2018-gpt1
- **Title:** Improving Language Understanding by Generative Pre-Training
- **Authors:** Alec Radford, Karthik Narasimhan, Tim Salimans, Ilya Sutskever
- **Year:** 2018
- **Venue:** OpenAI technical report (not formally published)
- **URL:** https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf ([PDF text unverifiable via WebFetch as of 2026-05-13]; metadata corroborated via secondary source)
- **Significance for agents:** First demonstration that a decoder-only transformer pre-trained as a left-to-right language model on unlabeled text could be fine-tuned across NLU tasks — the architectural lineage that became GPT-2/3/4.
- **Abstract:** Proposes a two-stage transfer recipe: (1) unsupervised generative pre-training of a 12-layer decoder-only transformer (~117M parameters) as a left-to-right language model on the BooksCorpus; (2) supervised discriminative fine-tuning on individual downstream tasks with minimal task-specific structure. Achieves state-of-the-art on 9 of 12 NLU benchmarks. [Abstract paraphrased; canonical PDF not directly fetched.]

### Radford2019-gpt2
- **Title:** Language Models are Unsupervised Multitask Learners
- **Authors:** Alec Radford, Jeffrey Wu, Rewon Child, et al.
- **Year:** 2019
- **Venue:** OpenAI technical report (not formally published)
- **URL:** https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf ([PDF text unverifiable via WebFetch as of 2026-05-13]; metadata corroborated via secondary source)
- **Significance for agents:** Showed that scaling a decoder-only transformer (1.5B parameters) on WebText yielded zero-shot capability on translation, QA, and summarization — the empirical hint that gave rise to the GPT-3 scaling thesis.
- **Abstract:** Trains a 1.5B-parameter decoder-only transformer (GPT-2) on WebText — 8M filtered web pages — and evaluates zero-shot on language modeling, reading comprehension, translation, summarization, and question answering. Without any task-specific fine-tuning, GPT-2 achieves state-of-the-art on 7 of 8 language modeling datasets and demonstrates non-trivial zero-shot capability on tasks the model was never explicitly trained for. [Abstract paraphrased; canonical PDF not directly fetched.]

### Raffel2019-t5
- **Title:** Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer
- **Authors:** Colin Raffel, Noam Shazeer, Adam Roberts, et al.
- **Year:** 2019 (JMLR 2020)
- **Venue:** JMLR 2020
- **URL:** https://arxiv.org/abs/1910.10683
- **Significance for agents:** Unified every NLP task as text-in/text-out — the framing that lets a single model serve heterogeneous downstream tasks and the conceptual precursor to instruction tuning.
- **Abstract:** abstract: "Transfer learning, where a model is first pre-trained on a data-rich task before being fine-tuned on a downstream task, has emerged as a powerful technique in natural language processing (NLP). The effectiveness of transfer learning has given rise to a diversity of approaches, methodology, and practice. In this paper, we explore the landscape of transfer learning techniques for NLP by introducing a unified framework that converts all text-based language problems into a text-to-text format. Our systematic study compares pre-training objectives, architectures, unlabeled data sets, transfer approaches, and other factors on dozens of language understanding tasks. By combining the insights from our exploration with scale and our new 'Colossal Clean Crawled Corpus', we achieve state-of-the-art results on many benchmarks covering summarization, question answering, text classification, and more."

### Kaplan2020-scaling
- **Title:** Scaling Laws for Neural Language Models
- **Authors:** Jared Kaplan, Sam McCandlish, Tom Henighan, et al.
- **Year:** 2020
- **Venue:** arxiv preprint
- **URL:** https://arxiv.org/abs/2001.08361
- **Significance for agents:** Empirically formalized the power-law relationship between compute, parameters, data, and loss — converting capability planning from alchemy into a budget allocation problem.
- **Abstract:** abstract: "We study empirical scaling laws for language model performance on the cross-entropy loss. The loss scales as a power-law with model size, dataset size, and the amount of compute used for training, with some trends spanning more than seven orders of magnitude. Other architectural details such as network width or depth have minimal effects within a wide range. Simple equations govern the dependence of overfitting on model/dataset size and the dependence of training speed on model size. These relationships allow us to determine the optimal allocation of a fixed compute budget. Larger models are significantly more sample-efficient, such that optimally compute-efficient training involves training very large models on a relatively modest amount of data and stopping significantly before convergence."

### Hoffmann2022-chinchilla
- **Title:** Training Compute-Optimal Large Language Models
- **Authors:** Jordan Hoffmann, Sebastian Borgeaud, Arthur Mensch, et al.
- **Year:** 2022
- **Venue:** NeurIPS 2022
- **URL:** https://arxiv.org/abs/2203.15556
- **Significance for agents:** Corrected the Kaplan scaling laws — model size and training tokens should scale roughly equally — and reset every subsequent foundation-model training recipe (Llama, Gemini, GPT-4 era).
- **Abstract:** Trains and analyzes over 400 transformer language models from 70M to 16B parameters on 5B to 500B tokens to characterize the compute-optimal frontier. Concludes that contemporary large models (Gopher, GPT-3, MT-NLG) are significantly undertrained: model size and training tokens should be scaled roughly in equal proportion. Validates the hypothesis by training Chinchilla (70B parameters on 1.4T tokens) at the same compute budget as Gopher (280B/300B). Chinchilla uniformly outperforms Gopher, GPT-3, and Jurassic-1 across benchmarks, hitting 67.5% on MMLU — a 7-point gain over Gopher.

---

## Tier 2 — LLM emergence

### Brown2020-gpt3
- **Title:** Language Models are Few-Shot Learners
- **Authors:** Tom B. Brown, Benjamin Mann, Nick Ryder, et al.
- **Year:** 2020
- **Venue:** NeurIPS 2020
- **URL:** https://arxiv.org/abs/2005.14165
- **Significance for agents:** Demonstrated in-context learning at 175B parameters — the capability that made "prompting as a programming model" credible, and the seed of every agent that takes natural language as its primary interface.
- **Abstract:** Trains GPT-3, a 175B-parameter autoregressive transformer, and evaluates it without gradient updates or fine-tuning across dozens of NLP benchmarks via zero-, one-, and few-shot in-context examples. GPT-3 achieves strong performance — sometimes competitive with state-of-the-art fine-tuned systems — on translation, question answering, cloze tasks, on-the-fly reasoning, and tasks requiring domain adaptation. The paper also catalogues failure modes (e.g. arithmetic, common-sense physics) and broader societal implications including misuse risk and bias.

### Ouyang2022-instructgpt
- **Title:** Training language models to follow instructions with human feedback
- **Authors:** Long Ouyang, Jeff Wu, Xu Jiang, et al.
- **Year:** 2022
- **Venue:** NeurIPS 2022
- **URL:** https://arxiv.org/abs/2203.02155
- **Significance for agents:** Codified the SFT-then-RLHF pipeline that turns a raw LLM into a useful assistant — the alignment recipe behind ChatGPT and every general-purpose agent product that followed.
- **Abstract:** abstract: "Making language models bigger does not inherently make them better at following a user's intent... we show an avenue for aligning language models with user intent on a wide range of tasks by fine-tuning with human feedback... we call the resulting models InstructGPT. In human evaluations on our prompt distribution, outputs from the 1.3B parameter InstructGPT model are preferred to outputs from the 175B GPT-3, despite having 100x fewer parameters... fine-tuning with human feedback is a promising direction for aligning language models with human intent."

### Wei2021-flan
- **Title:** Finetuned Language Models Are Zero-Shot Learners
- **Authors:** Jason Wei, Maarten Bosma, Vincent Y. Zhao, et al.
- **Year:** 2021 (ICLR 2022)
- **Venue:** ICLR 2022
- **URL:** https://arxiv.org/abs/2109.01652
- **Significance for agents:** Introduced instruction tuning — fine-tuning across many tasks expressed as natural-language instructions — as a way to unlock zero-shot generalization without RLHF.
- **Abstract:** abstract: "This paper explores a simple method for improving the zero-shot learning abilities of language models. We show that instruction tuning -- finetuning language models on a collection of tasks described via instructions -- substantially improves zero-shot performance on unseen tasks. We take a 137B parameter pretrained language model and instruction-tune it on over 60 NLP tasks verbalized via natural language instruction templates. We evaluate this instruction-tuned model, which we call FLAN, on unseen task types. FLAN substantially improves the performance of its unmodified counterpart and surpasses zero-shot 175B GPT-3 on 20 of 25 tasks that we evaluate."

### Christiano2017-rlhf
- **Title:** Deep reinforcement learning from human preferences
- **Authors:** Paul Christiano, Jan Leike, Tom B. Brown, et al.
- **Year:** 2017
- **Venue:** NeurIPS 2017
- **URL:** https://arxiv.org/abs/1706.03741
- **Significance for agents:** The foundational paper for RLHF — preference-based reward modeling — five years before it powered InstructGPT/ChatGPT and made conversational alignment a tractable engineering problem.
- **Abstract:** abstract: "For sophisticated reinforcement learning (RL) systems to interact usefully with real-world environments, we need to communicate complex goals to these systems. In this work, we explore goals defined in terms of (non-expert) human preferences between pairs of trajectory segments. We show that this approach can effectively solve complex RL tasks without access to the reward function, including Atari games and simulated robot locomotion, while providing feedback on less than one percent of our agent's interactions with the environment."

### Rafailov2023-dpo
- **Title:** Direct Preference Optimization: Your Language Model is Secretly a Reward Model
- **Authors:** Rafael Rafailov, Archit Sharma, Eric Mitchell, et al.
- **Year:** 2023
- **Venue:** NeurIPS 2023
- **URL:** https://arxiv.org/abs/2305.18290
- **Significance for agents:** Reformulated RLHF as a single classification loss — collapsing the reward-model + PPO pipeline into a stable, efficient supervised step that became a default for post-training open models.
- **Abstract:** abstract: "While large-scale unsupervised language models (LMs) learn broad world knowledge and some reasoning skills, achieving precise control of their behavior is difficult due to the completely unsupervised nature of their training... In this paper we introduce a new parameterization of the reward model in RLHF that enables extraction of the corresponding optimal policy in closed form, allowing us to solve the standard RLHF problem with only a simple classification loss. The resulting algorithm, which we call Direct Preference Optimization (DPO), is stable, performant, and computationally lightweight, eliminating the need for sampling from the LM during fine-tuning or performing significant hyperparameter tuning."

---

## Tier 3 — Reasoning emerges

### Wei2022-cot
- **Title:** Chain-of-Thought Prompting Elicits Reasoning in Large Language Models
- **Authors:** Jason Wei, Xuezhi Wang, Dale Schuurmans, et al.
- **Year:** 2022
- **Venue:** NeurIPS 2022
- **URL:** https://arxiv.org/abs/2201.11903
- **Significance for agents:** Showed that exposing intermediate reasoning steps in few-shot demonstrations dramatically improves performance at scale — the conceptual cornerstone of every prompt-engineered reasoning agent.
- **Abstract:** abstract: "We explore how generating a chain of thought -- a series of intermediate reasoning steps -- significantly improves the ability of large language models to perform complex reasoning. In particular, we show how such reasoning abilities emerge naturally in sufficiently large language models via a simple method called chain of thought prompting, where a few chain of thought demonstrations are provided as exemplars in prompting. Experiments on three large language models show that chain of thought prompting improves performance on a range of arithmetic, commonsense, and symbolic reasoning tasks."

### Kojima2022-zeroshot-cot
- **Title:** Large Language Models are Zero-Shot Reasoners
- **Authors:** Takeshi Kojima, Shixiang Shane Gu, Machel Reid, Yutaka Matsuo, Yusuke Iwasawa
- **Year:** 2022
- **Venue:** NeurIPS 2022
- **URL:** https://arxiv.org/abs/2205.11916
- **Significance for agents:** Demonstrated that "Let's think step by step" elicits chain-of-thought behavior without any exemplars — turning CoT from a few-shot technique into a one-line prompt prefix.
- **Abstract:** Shows that simply prepending "Let's think step by step" to a prompt elicits chain-of-thought reasoning from large pre-trained language models without any in-context examples. On InstructGPT and PaLM, this zero-shot CoT lifts MultiArith accuracy from 17.7% to 78.7% and GSM8K from 10.4% to 40.7%, demonstrating substantial latent zero-shot reasoning capacity in pretrained models that can be triggered by a single prompt phrase.

### Wang2022-self-consistency
- **Title:** Self-Consistency Improves Chain of Thought Reasoning in Language Models
- **Authors:** Xuezhi Wang, Jason Wei, Dale Schuurmans, et al.
- **Year:** 2022 (ICLR 2023)
- **Venue:** ICLR 2023
- **URL:** https://arxiv.org/abs/2203.11171
- **Significance for agents:** Replaces greedy decoding with sample-and-marginalize over reasoning paths — an early, very general inference-time scaling technique that became standard practice for math/reasoning evals.
- **Abstract:** abstract: "Chain-of-thought prompting combined with pre-trained large language models has achieved encouraging results on complex reasoning tasks. In this paper, we propose a new decoding strategy, self-consistency, to replace the naive greedy decoding used in chain-of-thought prompting. It first samples a diverse set of reasoning paths instead of only taking the greedy one, and then selects the most consistent answer by marginalizing out the sampled reasoning paths. Self-consistency leverages the intuition that a complex reasoning problem typically admits multiple different ways of thinking leading to its unique correct answer."

### Yao2023-tot
- **Title:** Tree of Thoughts: Deliberate Problem Solving with Large Language Models
- **Authors:** Shunyu Yao, Dian Yu, Jeffrey Zhao, et al.
- **Year:** 2023
- **Venue:** NeurIPS 2023
- **URL:** https://arxiv.org/abs/2305.10601
- **Significance for agents:** Generalizes CoT into an explicit search tree with self-evaluation and backtracking — the conceptual bridge from linear reasoning to tree-search-style agent planning.
- **Abstract:** abstract: "Language models are increasingly being deployed for general problem solving across a wide range of tasks, but are still confined to token-level, left-to-right decision-making processes during inference... To surmount these challenges, we introduce a new framework for language model inference, Tree of Thoughts (ToT), which generalizes over the popular Chain of Thought approach to prompting language models, and enables exploration over coherent units of text (thoughts) that serve as intermediate steps toward problem solving. ToT allows LMs to perform deliberate decision making by considering multiple different reasoning paths and self-evaluating choices... For instance, in Game of 24, while GPT-4 with chain-of-thought prompting only solved 4% of tasks, our method achieved a success rate of 74%."

### Yao2022-react
- **Title:** ReAct: Synergizing Reasoning and Acting in Language Models
- **Authors:** Shunyu Yao, Jeffrey Zhao, Dian Yu, et al.
- **Year:** 2022 (ICLR 2023)
- **Venue:** ICLR 2023
- **URL:** https://arxiv.org/abs/2210.03629
- **Significance for agents:** The canonical interleaved "thought / action / observation" loop — the template that almost every production tool-using agent (LangChain, AutoGPT, Anthropic tool use) instantiates.
- **Abstract:** abstract: "While large language models (LLMs) have demonstrated impressive capabilities across tasks in language understanding and interactive decision making, their abilities for reasoning (e.g. chain-of-thought prompting) and acting (e.g. action plan generation) have primarily been studied as separate topics. In this paper, we explore the use of LLMs to generate both reasoning traces and task-specific actions in an interleaved manner, allowing for greater synergy between the two: reasoning traces help the model induce, track, and update action plans as well as handle exceptions, while actions allow it to interface with external sources, such as knowledge bases or environments, to gather additional information."

### Shinn2023-reflexion
- **Title:** Reflexion: Language Agents with Verbal Reinforcement Learning
- **Authors:** Noah Shinn, Federico Cassano, Edward Berman, et al.
- **Year:** 2023
- **Venue:** NeurIPS 2023
- **URL:** https://arxiv.org/abs/2303.11366
- **Significance for agents:** Showed that a language agent can self-improve across trials by storing verbal self-critiques in episodic memory — no weight updates, just text. The conceptual basis for many "self-correcting" agent loops.
- **Abstract:** Introduces Reflexion, which reinforces language agents by verbal reflection rather than weight updates. After each trial the agent generates a textual self-critique and appends it to an episodic memory buffer that conditions the next attempt. The framework handles diverse feedback signals (scalar, free-form, environment) and yields large gains on sequential decision-making (AlfWorld), reasoning (HotpotQA), and code generation — reaching 91% pass@1 on HumanEval versus GPT-4's 80% baseline.

---

## Tier 4 — Tool use

### Nakano2021-webgpt
- **Title:** WebGPT: Browser-assisted question-answering with human feedback
- **Authors:** Reiichiro Nakano, Jacob Hilton, Suchir Balaji, et al.
- **Year:** 2021
- **Venue:** arxiv preprint
- **URL:** https://arxiv.org/abs/2112.09332
- **Significance for agents:** First high-profile demonstration of fine-tuning a GPT-style LLM to operate a web browser via text actions with citation grounding — a direct ancestor of every "search-augmented" or "computer-use" agent.
- **Abstract:** abstract: "We fine-tune GPT-3 to answer long-form questions using a text-based web-browsing environment, which allows the model to search and navigate the web. By setting up the task so that it can be performed by humans, we are able to train models on the task using imitation learning, and then optimize answer quality with human feedback. To make human evaluation of factual accuracy easier, models must collect references while browsing in support of their answers. We train and evaluate our models on ELI5, a dataset of questions asked by Reddit users. Our best model is obtained by fine-tuning GPT-3 using behavior cloning, and then performing rejection sampling against a reward model trained to predict human preferences. This model's answers are preferred by humans 56% of the time to those of our human demonstrators, and 69% of the time to the highest-voted answer from Reddit."

### Schick2023-toolformer
- **Title:** Toolformer: Language Models Can Teach Themselves to Use Tools
- **Authors:** Timo Schick, Jane Dwivedi-Yu, Roberto Dessì, et al.
- **Year:** 2023
- **Venue:** NeurIPS 2023
- **URL:** https://arxiv.org/abs/2302.04761
- **Significance for agents:** Showed that an LM can self-supervise its own tool-use training data — generating, executing, and filtering API calls — making tool integration a pretraining-style problem rather than a per-tool prompt engineering one.
- **Abstract:** abstract: "Language models (LMs) exhibit remarkable abilities to solve new tasks from just a few examples or textual instructions, especially at scale. They also, paradoxically, struggle with basic functionality, such as arithmetic or factual lookup, where much simpler and smaller models excel. In this paper, we show that LMs can teach themselves to use external tools via simple APIs and achieve the best of both worlds. We introduce Toolformer, a model trained to decide which APIs to call, when to call them, what arguments to pass, and how to best incorporate the results into future token prediction. This is done in a self-supervised way, requiring nothing more than a handful of demonstrations for each API."

---

## Tier 5 — Orchestration

### Hong2023-metagpt
- **Title:** MetaGPT: Meta Programming for A Multi-Agent Collaborative Framework
- **Authors:** Sirui Hong, Mingchen Zhuge, Jiaqi Chen, et al.
- **Year:** 2023
- **Venue:** ICLR 2024 (arxiv preprint 2023)
- **URL:** https://arxiv.org/abs/2308.00352
- **Significance for agents:** Encoded standardized human workflows (SOPs) as role assignments in a multi-agent pipeline — an influential template for structured, role-specialized agent collaboration on engineering tasks.
- **Abstract:** abstract: "Remarkable progress has been made on automated problem solving through societies of agents based on large language models (LLMs). Existing LLM-based multi-agent systems can already solve simple dialogue tasks. Solutions to more complex tasks, however, are complicated through logic inconsistencies due to cascading hallucinations caused by naively chaining LLMs. Here we introduce MetaGPT, an innovative meta-programming framework incorporating efficient human workflows into LLM-based multi-agent collaborations. MetaGPT encodes Standardized Operating Procedures (SOPs) into prompt sequences for more streamlined workflows, thus allowing agents with human-like domain expertise to verify intermediate results and reduce errors."

### Wu2023-autogen
- **Title:** AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation
- **Authors:** Qingyun Wu, Gagan Bansal, Jieyu Zhang, et al.
- **Year:** 2023
- **Venue:** arxiv preprint (later COLM 2024)
- **URL:** https://arxiv.org/abs/2308.08155
- **Significance for agents:** Provided the most widely adopted open-source framework for programmable multi-agent conversation — making "two agents talking to each other under a controller" a default building block.
- **Abstract:** abstract: "AutoGen is an open-source framework that allows developers to build LLM applications via multiple agents that can converse with each other to accomplish tasks. AutoGen agents are customizable, conversable, and can operate in various modes that employ combinations of LLMs, human inputs, and tools. Using AutoGen, developers can also flexibly define agent interaction behaviors. Both natural language and computer code can be used to program flexible conversation patterns for different applications. AutoGen serves as a generic infrastructure to build diverse applications of various complexities and LLM capacities."

---

## Tier 6 — Guardrailing

### Bai2022-constitutional-ai
- **Title:** Constitutional AI: Harmlessness from AI Feedback
- **Authors:** Yuntao Bai, Saurav Kadavath, Sandipan Kundu, et al.
- **Year:** 2022
- **Venue:** arxiv preprint
- **URL:** https://arxiv.org/abs/2212.08073
- **Significance for agents:** Introduced RLAIF (RL from AI Feedback) anchored on a written constitution — the alignment lineage behind Claude and a template for scaling oversight as agent autonomy grows.
- **Abstract:** abstract: "As AI systems become more capable, we would like to enlist their help to supervise other AIs. We experiment with methods for training a harmless AI assistant through self-improvement, without any human labels identifying harmful outputs. The only human oversight is provided through a list of rules or principles, and so we refer to the method as 'Constitutional AI'. The process involves both a supervised learning and a reinforcement learning phase. In the supervised phase we sample from an initial model, then generate self-critiques and revisions, and then finetune the original model on revised responses. In the RL phase, we sample from the finetuned model, use a model to evaluate which of the two samples is better, and then train a preference model from this dataset of AI preferences."

### Ganguli2022-red-teaming
- **Title:** Red Teaming Language Models to Reduce Harms: Methods, Scaling Behaviors, and Lessons Learned
- **Authors:** Deep Ganguli, Liane Lovitt, Jackson Kernion, et al.
- **Year:** 2022
- **Venue:** arxiv preprint
- **URL:** https://arxiv.org/abs/2209.07858
- **Significance for agents:** The first systematic, scaled red-teaming study with public dataset release — established empirical methodology and the now-standard assumption that adversarial probing is part of the deployment lifecycle.
- **Abstract:** abstract: "We describe our early efforts to red team language models in order to simultaneously discover, measure, and attempt to reduce their potentially harmful outputs. We make three main contributions. First, we investigate scaling behaviors for red teaming across 3 model sizes (2.7B, 13B, and 52B parameters) and 4 model types: a plain language model (LM); an LM prompted to be helpful, honest, and harmless; an LM with rejection sampling; and a model trained to be helpful and harmless using reinforcement learning from human feedback (RLHF). We find that the RLHF models are increasingly difficult to red team as they scale, and we find a flat trend with scale for the other model types. Second, we release our dataset of 38,961 red team attacks for others to analyze and learn from."

### Greshake2023-indirect-injection
- **Title:** Not what you've signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection
- **Authors:** Kai Greshake, Sahar Abdelnabi, Shailesh Mishra, et al.
- **Year:** 2023
- **Venue:** AISec '23 (arxiv preprint)
- **URL:** https://arxiv.org/abs/2302.12173
- **Significance for agents:** Named and demonstrated indirect prompt injection — the canonical attack vector against any agent that ingests external content (retrieved docs, web pages, emails) as part of its context.
- **Abstract:** abstract: "Large Language Models (LLMs) are increasingly being integrated into various applications. The functionalities of recent LLMs can be flexibly modulated via natural language prompts. This renders them susceptible to targeted adversarial prompting, e.g., Prompt Injection (PI) attacks enable attackers to override original instructions and employed controls. So far, it was assumed that the user is directly prompting the LLM. But, what if it is not the user prompting? We argue that LLM-Integrated Applications blur the line between data and instructions. We reveal new attack vectors, using Indirect Prompt Injection, that enable adversaries to remotely (without a direct interface) exploit LLM-integrated applications by strategically injecting prompts into data likely to be retrieved."

---

## Tier 7 — Context engineering

### Lewis2020-rag
- **Title:** Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks
- **Authors:** Patrick Lewis, Ethan Perez, Aleksandra Piktus, et al.
- **Year:** 2020
- **Venue:** NeurIPS 2020
- **URL:** https://arxiv.org/abs/2005.11401
- **Significance for agents:** Named and formalized retrieval-augmented generation — combining parametric model memory with a non-parametric document index, the foundational pattern of every "knowledge-grounded" agent.
- **Abstract:** abstract: "Large pre-trained language models have been shown to store factual knowledge in their parameters, and achieve state-of-the-art results when fine-tuned on downstream NLP tasks. However, their ability to access and precisely manipulate knowledge is still limited, and hence on knowledge-intensive tasks, their performance lags behind task-specific architectures... We explore a general-purpose fine-tuning recipe for retrieval-augmented generation (RAG) -- models which combine pre-trained parametric and non-parametric memory for language generation. We introduce RAG models where the parametric memory is a pre-trained seq2seq model and the non-parametric memory is a dense vector index of Wikipedia, accessed with a pre-trained neural retriever."

### Karpukhin2020-dpr
- **Title:** Dense Passage Retrieval for Open-Domain Question Answering
- **Authors:** Vladimir Karpukhin, Barlas Oğuz, Sewon Min, et al.
- **Year:** 2020
- **Venue:** EMNLP 2020
- **URL:** https://arxiv.org/abs/2004.04906
- **Significance for agents:** Demonstrated that a simple dual-encoder learned from a small QA dataset beats BM25 by 9–19% — the retrieval backbone that turned dense vector search from a research toy into a production primitive.
- **Abstract:** abstract: "Open-domain question answering relies on efficient passage retrieval to select candidate contexts, where traditional sparse vector space models, such as TF-IDF or BM25, are the de facto method. In this work, we show that retrieval can be practically implemented using dense representations alone, where embeddings are learned from a small number of questions and passages by a simple dual-encoder framework. When evaluated on a wide range of open-domain QA datasets, our dense retriever outperforms a strong Lucene-BM25 system largely by 9%-19% absolute in terms of top-20 passage retrieval accuracy, and helps our end-to-end QA system establish new state-of-the-art on multiple open-domain QA benchmarks."

### Borgeaud2021-retro
- **Title:** Improving language models by retrieving from trillions of tokens
- **Authors:** Sebastian Borgeaud, Arthur Mensch, Jordan Hoffmann, et al.
- **Year:** 2021 (ICML 2022)
- **Venue:** ICML 2022
- **URL:** https://arxiv.org/abs/2112.04426
- **Significance for agents:** Pushed retrieval from a fine-tuning add-on into the pretraining loop, letting a 7.5B model match 175B GPT-3 on the Pile — the architectural argument for treating context as a first-class scaling axis.
- **Abstract:** abstract: "We enhance auto-regressive language models by conditioning on document chunks retrieved from a large corpus, based on local similarity with preceding tokens. With a 2 trillion token database, our Retrieval-Enhanced Transformer (RETRO) obtains comparable performance to GPT-3 and Jurassic-1 on the Pile, despite using 25x fewer parameters. After fine-tuning, RETRO performance translates to downstream knowledge-intensive tasks such as question answering. RETRO combines a frozen Bert retriever, a differentiable encoder and a chunked cross-attention mechanism to predict tokens based on an order of magnitude more data than what is typically consumed during training."

---

## Index by slug

| Slug | Tier | Year |
|---|---|---|
| Mikolov2013-word2vec | 1 | 2013 |
| Mikolov2013-skipgram | 1 | 2013 |
| Pennington2014-glove | 1 | 2014 |
| Hochreiter1997-lstm | 1 | 1997 |
| Sutskever2014-seq2seq | 1 | 2014 |
| Bahdanau2014-attention | 1 | 2014 |
| Vaswani2017-transformer | 1 | 2017 |
| Devlin2018-bert | 1 | 2018 |
| Radford2018-gpt1 | 1 | 2018 |
| Radford2019-gpt2 | 1 | 2019 |
| Raffel2019-t5 | 1 | 2019 |
| Kaplan2020-scaling | 1 | 2020 |
| Hoffmann2022-chinchilla | 1 | 2022 |
| Brown2020-gpt3 | 2 | 2020 |
| Ouyang2022-instructgpt | 2 | 2022 |
| Wei2021-flan | 2 | 2021 |
| Christiano2017-rlhf | 2 | 2017 |
| Rafailov2023-dpo | 2 | 2023 |
| Wei2022-cot | 3 | 2022 |
| Kojima2022-zeroshot-cot | 3 | 2022 |
| Wang2022-self-consistency | 3 | 2022 |
| Yao2023-tot | 3 | 2023 |
| Yao2022-react | 3 | 2022 |
| Shinn2023-reflexion | 3 | 2023 |
| Nakano2021-webgpt | 4 | 2021 |
| Schick2023-toolformer | 4 | 2023 |
| Hong2023-metagpt | 5 | 2023 |
| Wu2023-autogen | 5 | 2023 |
| Bai2022-constitutional-ai | 6 | 2022 |
| Ganguli2022-red-teaming | 6 | 2022 |
| Greshake2023-indirect-injection | 6 | 2023 |
| Lewis2020-rag | 7 | 2020 |
| Karpukhin2020-dpr | 7 | 2020 |
| Borgeaud2021-retro | 7 | 2021 |

Total: 34 entries across 7 tiers.
