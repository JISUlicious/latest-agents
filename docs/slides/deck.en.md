---
marp: true
theme: default
size: 1920x1080
paginate: false
header: ''
footer: ''
style: |
  @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300..700;1,6..72,300..700&family=Geist:wght@300..700&family=Noto+Serif+KR:wght@300..700&family=Noto+Sans+KR:wght@300..700&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --type-display: 128px;
    --type-numeral: 220px;
    --type-title: 68px;
    --type-subtitle: 44px;
    --type-lede: 38px;
    --type-body: 30px;
    --type-small: 24px;
    --type-eyebrow: 24px;
    --pad-x: 120px;
    --pad-y: 96px;
    --gap-title: 56px;
    --gap-item: 28px;
    --gap-tight: 16px;
    --font-serif: "Newsreader", "Noto Serif KR", Georgia, serif;
    --font-sans:  "Geist", "Noto Sans KR", "Inter", -apple-system, sans-serif;
    --font-mono:  "JetBrains Mono", "Noto Sans KR", ui-monospace, monospace;
    --font-title: var(--font-serif);
    --font-body:  var(--font-sans);
    --font-label: var(--font-sans);
    --bg:       #f6f1e8;
    --fg:       #1a1a1a;
    --muted:    #767064;
    --paper:    #fbf7ef;
    --accent-1: #c8553d;
    --accent-2: #e8a87c;
    --accent-3: #3d5a4c;
    --line:     rgba(26,26,26,0.16);
    --line-soft:rgba(26,26,26,0.08);
    --card:     rgba(255,255,255,0.45);
    --scale: 1;
  }

  section {
    background: var(--bg);
    color: var(--fg);
    font-family: var(--font-body);
    padding: var(--pad-y) var(--pad-x);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    justify-content: flex-start;
  }
  h1, h2, h3 { font-family: var(--font-title); font-weight: 400; letter-spacing: -0.01em; line-height: 1.05; margin: 0; text-wrap: balance; }
  p { margin: 0; line-height: 1.45; text-wrap: pretty; }

  /* eyebrow + title + subtitle + lede + body + small + numeral */
  .eyebrow {
    font-family: var(--font-label);
    font-size: var(--type-eyebrow);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent-1);
    margin-bottom: var(--gap-tight);
  }
  .title    { font-size: var(--type-title); font-family: var(--font-title); line-height: 1.04; max-width: 1500px; }
  .subtitle { font-size: var(--type-subtitle); font-family: var(--font-title); font-style: italic; color: var(--muted); line-height: 1.15; margin-top: var(--gap-item); max-width: 1400px; }
  .lede     { font-size: var(--type-lede); line-height: 1.3; max-width: 1500px; color: var(--fg); }
  .body     { font-size: var(--type-body); line-height: 1.45; color: var(--fg); }
  .small    { font-size: var(--type-small); color: var(--muted); line-height: 1.4; }
  .numeral  { font-family: var(--font-title); font-size: var(--type-numeral); line-height: 0.9; letter-spacing: -0.04em; color: var(--accent-1); }
  .spacer   { flex: 1; }
  .annotation { /* placeholder so :root[data-density="minimal"] can target */ }

  /* Slide variants */
  section.section-slide { justify-content: center; }
  section.section-slide .part-no    { font-family: var(--font-label); font-size: var(--type-eyebrow); letter-spacing: 0.22em; text-transform: uppercase; color: var(--accent-1); margin-bottom: 36px; }
  section.section-slide .part-title { font-family: var(--font-title); font-size: 120px; line-height: 1; letter-spacing: -0.02em; max-width: 1400px; }
  section.section-slide .part-blurb { font-family: var(--font-title); font-style: italic; font-size: var(--type-subtitle); color: var(--muted); margin-top: 40px; max-width: 1200px; }
  section.section-slide .part-rule  { width: 220px; height: 1px; background: var(--accent-1); margin-top: 56px; }

  section.title-slide { justify-content: center; }
  section.title-slide h1 { font-size: 140px; line-height: 0.98; letter-spacing: -0.025em; max-width: 1500px; }
  section.title-slide .meta { font-family: var(--font-label); font-size: var(--type-small); letter-spacing: 0.06em; color: var(--muted); margin-top: 64px; display: flex; gap: 28px; align-items: baseline; }
  section.title-slide .meta b { font-weight: 500; color: var(--fg); }
  section.title-slide .ribbon { width: 220px; height: 1px; background: var(--accent-1); margin-bottom: 40px; }

  section.hero-slide { justify-content: center; align-items: flex-start; }
  section.hero-slide .hero-text { font-family: var(--font-title); font-size: 96px; line-height: 1.05; letter-spacing: -0.02em; max-width: 1600px; text-wrap: balance; }
  section.hero-slide .hero-text em { color: var(--accent-1); font-style: italic; }
  .h-eyebrow-block { margin-bottom: var(--gap-title); }

  /* Layouts */
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; flex: 1; min-height: 0; }
  .col-head { font-family: var(--font-label); font-size: var(--type-eyebrow); letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin-bottom: 24px; display: flex; align-items: center; gap: 14px; }
  .col-head .dot { width: 12px; height: 12px; border-radius: 50%; background: var(--accent-1); }
  .col-head .dot.alt { background: var(--accent-3); }

  ol.steps, ul.bare { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: var(--gap-item); }
  ol.steps li { display: grid; grid-template-columns: 64px 1fr; gap: 20px; align-items: baseline; font-size: var(--type-body); line-height: 1.35; }
  ol.steps li::before { counter-increment: step; content: counter(step, decimal-leading-zero); font-family: var(--font-label); font-size: var(--type-small); color: var(--accent-1); font-variant-numeric: tabular-nums; letter-spacing: 0.06em; }
  ol.steps { counter-reset: step; }

  .card { background: var(--card); border: 1px solid var(--line-soft); border-radius: 8px; padding: 32px 36px; }

  /* SVG diagram helpers */
  svg .stroke       { stroke: var(--fg); fill: none; }
  svg .stroke-line  { stroke: var(--line); fill: none; }
  svg .stroke-1     { stroke: var(--accent-1); fill: none; }
  svg .stroke-3     { stroke: var(--accent-3); fill: none; }
  svg .fill-1       { fill: var(--accent-1); }
  svg .fill-2       { fill: var(--accent-2); }
  svg .fill-3       { fill: var(--accent-3); }
  svg .fill-paper   { fill: var(--paper); }
  svg .fill-muted   { fill: var(--muted); }
  svg .label        { font-family: var(--font-label); font-size: 26px; fill: var(--fg); }
  svg .label-muted  { font-family: var(--font-label); font-size: 24px; fill: var(--muted); }
  svg .label-title  { font-family: var(--font-title); font-size: 30px; fill: var(--fg); }
  svg .label-accent { font-family: var(--font-label); font-size: 24px; fill: var(--accent-1); letter-spacing: 0.10em; text-transform: uppercase; }
  svg .label-tiny   { font-family: var(--font-label); font-size: 24px; fill: var(--muted); letter-spacing: 0.06em; }

  /* Roadmap parts */
  .parts { display: grid; grid-template-columns: repeat(5, 1fr); gap: 28px; }
  .part-cell { border-top: 2px solid var(--accent-1); padding-top: 24px; display: flex; flex-direction: column; gap: 12px; }
  .part-cell .pn { font-family: var(--font-label); font-size: 24px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--accent-1); }
  .part-cell .pt { font-family: var(--font-title); font-size: 34px; line-height: 1.1; }
  .part-cell .ps { font-family: var(--font-label); font-size: 24px; color: var(--muted); line-height: 1.4; }

  /* Timeline */
  .timeline { display: flex; align-items: flex-end; gap: 0; position: relative; padding-top: 100px; padding-bottom: 60px; }
  .timeline::before { content: ""; position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: var(--line); }
  .timeline .pt { flex: 1; text-align: center; position: relative; font-family: var(--font-label); font-size: 24px; line-height: 1.25; }
  .timeline .pt::before { content: ""; position: absolute; left: 50%; top: 50%; width: 16px; height: 16px; background: var(--accent-1); border-radius: 50%; transform: translate(-50%, -50%); border: 4px solid var(--bg); box-shadow: 0 0 0 1px var(--accent-1); }
  .timeline .pt .date { position: absolute; left: 50%; transform: translateX(-50%); font-family: var(--font-label); font-size: 24px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); white-space: nowrap; }
  .timeline .pt .lbl { position: absolute; left: 50%; transform: translateX(-50%); font-family: var(--font-title); font-size: 26px; white-space: nowrap; color: var(--fg); }
  .timeline .pt.above .date { top: calc(50% + 18px); }
  .timeline .pt.above .lbl  { bottom: calc(50% + 26px); }
  .timeline .pt.below .date { bottom: calc(50% + 18px); }
  .timeline .pt.below .lbl  { top: calc(50% + 26px); }
  .timeline .pt.major::before { width: 22px; height: 22px; box-shadow: 0 0 0 1px var(--accent-1); }

  /* Decision tree branches */
  .branches { display: flex; flex-direction: column; gap: 18px; }
  .branch { display: grid; grid-template-columns: 1.2fr 60px 1fr; gap: 24px; align-items: center; padding: 18px 0; border-bottom: 1px solid var(--line-soft); }
  .branch .q { font-family: var(--font-serif); font-style: italic; font-size: 26px; color: var(--fg); line-height: 1.25; }
  .branch .ar { text-align: center; color: var(--accent-1); font-family: var(--font-label); font-size: 24px; }
  .branch .a { font-family: var(--font-label); font-size: 24px; color: var(--accent-1); line-height: 1.2; }

  /* Layered protocol stack */
  .layered { display: flex; flex-direction: column; gap: 14px; }
  .layer { border: 1px solid var(--line); background: var(--paper); padding: 36px 40px; border-radius: 6px; display: flex; align-items: baseline; justify-content: space-between; gap: 24px; }
  .layer .l-name { font-family: var(--font-title); font-size: 36px; }
  .layer .l-sub { font-family: var(--font-label); font-size: var(--type-small); color: var(--muted); letter-spacing: 0.06em; text-transform: uppercase; }
  .layer.accent { border-color: var(--accent-1); }
  .layer.accent .l-name { color: var(--accent-1); }
  .protocol-arrow { text-align: center; font-family: var(--font-label); font-size: 24px; letter-spacing: 0.14em; color: var(--accent-1); text-transform: uppercase; padding: 6px 0; }

  /* 4 standards row */
  .standards-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
  .std-card { border: 1px solid var(--line); background: var(--paper); padding: 36px 32px; border-radius: 8px; display: flex; flex-direction: column; gap: 16px; }
  .std-card .s-name { font-family: var(--font-title); font-size: 56px; line-height: 1; color: var(--accent-1); }
  .std-card .s-tag { font-family: var(--font-label); font-size: 24px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
  .std-card .s-tagline { font-family: var(--font-serif); font-style: italic; font-size: 26px; line-height: 1.25; color: var(--fg); margin-top: auto; }
  .std-card .s-date { font-family: var(--font-label); font-size: 24px; letter-spacing: 0.06em; color: var(--muted); }

  /* Agent cards */
  .agent-card { border-top: 1px solid var(--line); padding-top: 22px; display: flex; flex-direction: column; gap: 12px; }
  .agent-card .a-name { font-family: var(--font-title); font-size: 40px; line-height: 1; }
  .agent-card .a-maker { font-family: var(--font-label); font-size: 24px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
  .agent-card .a-quote { font-family: var(--font-serif); font-style: italic; font-size: 24px; color: var(--accent-1); line-height: 1.25; margin-top: 6px; }

  /* Rifts grid */
  .rifts { display: grid; grid-template-columns: 1fr 80px 1fr; row-gap: 24px; column-gap: 28px; align-items: center; font-size: 26px; }
  .rifts .l { text-align: right; color: var(--fg); }
  .rifts .r { text-align: left; color: var(--fg); }
  .rifts .mid { font-family: var(--font-label); font-size: 24px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); text-align: center; }
  .rifts .row-line { grid-column: 1 / -1; height: 1px; background: var(--line-soft); }

  /* Universals checklist */
  .checklist { display: grid; grid-template-columns: 1fr 1fr; gap: 24px 56px; }
  .check-item { display: grid; grid-template-columns: 36px 1fr; align-items: baseline; gap: 18px; font-size: 28px; line-height: 1.3; padding-bottom: 22px; border-bottom: 1px solid var(--line-soft); }
  .check-item .ck { color: var(--accent-1); font-family: var(--font-label); font-size: 24px; }
---

<!-- _class: title-slide -->

<div class="ribbon"></div>

# <span>Modern</span> <span style="color:var(--accent-1);font-style:italic;">AI Agents</span>

<p class="subtitle"><span>What is an AI Agent,</span><br /><span>and how does it work?</span></p>

<div class="meta">
  <span><b>60 min</b></span>
  <span>·</span>
  <span>Baseline</span>
  <span>·</span>
  <span>May 2026</span>
</div>

<!--
[speaker notes]
- Welcome. We have about 60 minutes together.
- One-line promise: by the end, you'll understand why today's AI agents differ and how to pick among them.
- No prior AI background required — terms are defined as we go.
- Q&A at the end.
-->

---

<div class="eyebrow">30-second summary</div>

## <span class="title">Reasoning, Tool, Orchestration</span>

<div class="spacer"></div>

<svg viewBox="0 0 1680 660" style="width:100%;height:auto;max-height:640px;">
  <!-- Trunk -->
  <rect x="710" y="20" width="260" height="88" rx="6" class="stroke fill-paper" stroke-width="1.5" />
  <text x="840" y="56" text-anchor="middle" class="label-title">Transformer</text>
  <text x="840" y="92" text-anchor="middle" class="label-tiny">2017</text>
  <line x1="840" y1="108" x2="840" y2="148" class="stroke" stroke-width="1.5" />
  <rect x="710" y="148" width="260" height="88" rx="6" class="stroke fill-paper" stroke-width="1.5" />
  <text x="840" y="184" text-anchor="middle" class="label-title">ChatGPT</text>
  <text x="840" y="220" text-anchor="middle" class="label-tiny">NOV 2022</text>

  <!-- Three diverging lines -->
  <path d="M 840 236 C 840 270, 280 270, 280 300" class="stroke-1" stroke-width="1.5" fill="none" />
  <path d="M 840 236 L 840 300" class="stroke-1" stroke-width="1.5" />
  <path d="M 840 236 C 840 270, 1400 270, 1400 300" class="stroke-1" stroke-width="1.5" fill="none" />

  <!-- Three branches -->
  <text x="280" y="312" text-anchor="middle" class="label-accent">Learned to Think</text>
  <rect x="80" y="332" width="400" height="200" rx="6" class="stroke fill-paper" stroke-width="1" />
  <text x="280" y="372" text-anchor="middle" class="label-title">Reasoning</text>
  <text x="280" y="408" text-anchor="middle" class="label-muted">CoT · Jan 2022</text>
  <text x="280" y="436" text-anchor="middle" class="label-muted">ReAct · Oct 2022</text>
  <text x="280" y="464" text-anchor="middle" class="label-muted">o1 · Sep 2024</text>
  <text x="280" y="492" text-anchor="middle" class="label-muted">R1 · Jan 2025</text>

  <text x="840" y="312" text-anchor="middle" class="label-accent">Learned to Act</text>
  <rect x="640" y="332" width="400" height="200" rx="6" class="stroke fill-paper" stroke-width="1" />
  <text x="840" y="372" text-anchor="middle" class="label-title">Tool use</text>
  <text x="840" y="408" text-anchor="middle" class="label-muted">WebGPT · Dec 2021</text>
  <text x="840" y="436" text-anchor="middle" class="label-muted">Toolformer · Feb 2023</text>
  <text x="840" y="464" text-anchor="middle" class="label-muted">Function calling · Jun 2023</text>
  <text x="840" y="492" text-anchor="middle" class="label-muted">MCP · Nov 2024</text>

  <text x="1400" y="312" text-anchor="middle" class="label-accent">Learned to Collaborate</text>
  <rect x="1200" y="332" width="400" height="200" rx="6" class="stroke fill-paper" stroke-width="1" />
  <text x="1400" y="372" text-anchor="middle" class="label-title">Orchestration</text>
  <text x="1400" y="408" text-anchor="middle" class="label-muted">LangChain · Oct 2022</text>
  <text x="1400" y="436" text-anchor="middle" class="label-muted">AutoGPT · Mar 2023</text>
  <text x="1400" y="464" text-anchor="middle" class="label-muted">AGENTS.md · 2025</text>
  <text x="1400" y="492" text-anchor="middle" class="label-muted">SKILL.md · 2025</text>

  <!-- Converge -->
  <path d="M 280 532 C 280 580, 840 580, 840 596" class="stroke-1" stroke-width="1.5" fill="none" />
  <path d="M 840 532 L 840 596" class="stroke-1" stroke-width="1.5" />
  <path d="M 1400 532 C 1400 580, 840 580, 840 596" class="stroke-1" stroke-width="1.5" fill="none" />
  <rect x="640" y="596" width="400" height="56" rx="6" class="fill-1" />
  <text x="840" y="630" text-anchor="middle" class="label-title" fill="var(--bg)" style="font-size:26px">Leading-Edge Agents · 2026</text>
</svg>

<!--
[speaker notes]
- AI agents aren't a single invention — three threads grew in parallel.
- A common base: the Transformer (2017) and the chat-model interface (ChatGPT, 2022).
- On top of that, reasoning, tool use, and orchestration developed nearly in parallel — all converging on today's agents.
- This diagram is the roadmap for the whole talk; each branch is one section.
- We don't draw a linear timeline because CoT (Jan 2022) predates ChatGPT (Nov 2022).
-->

---

<!-- _class: hero-slide -->

<div class="eyebrow h-eyebrow-block">Thesis</div>

<p class="hero-text">
Modern agents have<br />
converged on the same <em>structure</em>.<br />
<span style="color:var(--muted);font-style:italic;">Similar building blocks, <br />various surface.</span>
</p>

<!--
[speaker notes]
- Lead with the conclusion. Knowing where we're going lowers cognitive load.
- Architecture has settled: every modern agent — claude-code, opencode, pi-mono, hermes-agent, openclaw — is built from the same building blocks.
- The differences are in *how* the blocks are composed, but those differences aren't the message of this talk.
- The message: how those building blocks evolved and arrived at today's architecture.
- Everything between this slide and the closing supports that claim.
-->

---

<div class="eyebrow">Roadmap</div>

## <span class="title">Five parts.</span>

<p class="subtitle">From LLMs to today's agents.</p>

<div class="spacer"></div>

<div class="parts">
  <div class="part-cell">
    <div class="pn">Part I</div>
    <div class="pt">How we got here</div>
    <div class="ps">From completion engine to agent loop. 2017–2023.</div>
  </div>
  <div class="part-cell">
    <div class="pn">Part II</div>
    <div class="pt">Modern toolkit</div>
    <div class="ps">Steering, guardrails, four standards.</div>
  </div>
  <div class="part-cell">
    <div class="pn">Part III</div>
    <div class="pt">Today's agents</div>
    <div class="ps">Five modern AI agent tools.</div>
  </div>
  <div class="part-cell">
    <div class="pn">Part IV</div>
    <div class="pt">Settled patterns</div>
    <div class="ps">The architecture's common ground.</div>
  </div>
  <div class="part-cell">
    <div class="pn">Part V</div>
    <div class="pt">Synthesis</div>
    <div class="ps">AI Agents in 2026.</div>
  </div>
</div>

<div class="spacer"></div>

<!--
[speaker notes]
- The map for the whole talk. Five parts.
- Part I — how we got here, from word prediction to agent loop.
- Part II — the modern toolkit on top: steering and standards.
- Part III — what today's agents look like, through five examples.
- Part IV — the patterns those five have settled on.
- Part V — synthesis: one diagram and the 2026 floor.
- History fast, current architecture slow.
- If you remember one section, remember Part IV — settled patterns.
-->

---

<!-- _class: section-slide -->

<div class="part-no">Part I</div>

<h2 class="part-title">How we got here.</h2>

<p class="part-blurb">From completion engine to agent loop.</p>

<div class="part-rule"></div>

---

<div class="eyebrow">Instruction-following LLM</div>

## <span class="title">Completion → Instruction.</span>

<div class="spacer" style="flex:0.6"></div>

<div class="two-col" style="gap:60px;">
  <div>
    <div class="col-head"><span class="dot" style="background:var(--muted);"></span><span>Before · 2018</span></div>
    <div class="card" style="font-family:var(--font-mono);font-size:24px;line-height:1.6;">
      <div style="color:var(--muted);font-size:24px;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:18px;">prompt</div>
      <div>The weather today is</div>
      <div style="color:var(--accent-1);margin-top:14px;">→ clear and sunny. Temperature is around 18°C…</div>
      <div style="color:var(--muted);margin-top:22px;font-size:24px;font-style:italic;font-family:var(--font-serif);">Predicts the next word. Keeps going.</div>
    </div>
  </div>
  <div>
    <div class="col-head"><span class="dot"></span><span>After · 2022</span></div>
    <div class="card" style="font-family:var(--font-mono);font-size:24px;line-height:1.6;">
      <div style="color:var(--muted);font-size:24px;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:18px;">prompt</div>
      <div>Organize my email.</div>
      <div style="color:var(--accent-1);margin-top:14px;">→ How would you like it organized?</div>
      <div style="color:var(--muted);margin-top:22px;font-size:24px;font-style:italic;font-family:var(--font-serif);">Follows instructions. Responds.</div>
    </div>
  </div>
</div>

<div class="spacer" style="flex:0.4"></div>

<p class="small" style="text-align:center;">
<span style="color:var(--accent-1);font-family:var(--font-label);letter-spacing:.08em;text-transform:uppercase;">+ scale&nbsp;&nbsp;·&nbsp;&nbsp;+ instruction tuning&nbsp;&nbsp;·&nbsp;&nbsp;+ RLHF</span>
</p>

<!--
[speaker notes]
- Before 2020, language models were sophisticated autocomplete — predicting the next token.
- GPT-3 (2020) showed something — given enough scale, the same machinery learns to follow natural-language instructions.
- Three ingredients: scale, instruction tuning, RLHF.
- The breakthrough wasn't architecture, it was *interface*. The model shape stayed; the way we talk to it changed.
- On Nov 30, 2022, ChatGPT made this visible to everyone.
-->

---

<div class="eyebrow">Chat model</div>

## <span class="title">Three roles. One universal API.</span>

<div class="spacer" style="flex:0.5"></div>

<div style="display:grid;grid-template-columns:1fr 1.2fr;gap:80px;align-items:center;">
  <svg viewBox="0 0 640 480" style="width:100%;height:auto;">
    <rect x="20" y="20" width="600" height="124" rx="8" class="stroke fill-paper" stroke-width="1.5" />
    <text x="50" y="58" class="label-accent">system</text>
    <text x="50" y="102" class="label" style="font-size:26px;">rules given to the model</text>
    <text x="50" y="132" class="label-muted">(invisible to the user)</text>
    <rect x="20" y="164" width="600" height="124" rx="8" class="stroke fill-paper" stroke-width="1.5" />
    <text x="50" y="202" class="label-accent">user</text>
    <text x="50" y="246" class="label" style="font-size:26px;">what the user types</text>
    <rect x="20" y="308" width="600" height="124" rx="8" class="fill-1" />
    <text x="50" y="346" class="label-accent" style="fill:var(--bg);">assistant</text>
    <text x="50" y="390" class="label" style="font-size:26px;fill:var(--bg);">what the model replies</text>
  </svg>
  <div>
    <p class="lede" style="margin-bottom:32px;">Chat Completions API.</p>
    <p class="body" style="color:var(--muted);max-width:600px;">
      Introduced by OpenAI in March 2023 with gpt-3.5-turbo.
      Anthropic, Google, Meta, Mistral, and every open-weight chat template followed.
      One format, every vendor.
    </p>
    <p class="body" style="margin-top:32px;color:var(--accent-3);font-family:var(--font-serif);font-style:italic;">
      Every capability that follows — tool use, reasoning, agents — lives inside this three-role frame.
    </p>
  </div>
</div>

<div class="spacer"></div>

<!--
[speaker notes]
- Every chat-tuned model — Claude, GPT, Gemini, Llama, every open-weight chat template — uses the same three message roles.
- system: invisible rules. user: what the human types. assistant: what the model replies.
- Originated with OpenAI's chat API in March 2023; every vendor adopted it. A universal API.
- The rest of the talk lives inside this three-role frame.
-->

---

<div class="eyebrow">Learned to Think</div>

## <span class="title">Reasoning emerged as a capability.</span>

<div class="spacer" style="flex:0.5"></div>

<svg viewBox="0 0 1680 360" style="width:100%;height:auto;">
  <rect x="40"   y="60" width="440" height="200" rx="6" class="stroke fill-paper" stroke-width="1.5" />
  <text x="260" y="106" text-anchor="middle" class="label-accent">Stage 1 · prompt trick</text>
  <text x="260" y="156" text-anchor="middle" class="label-title">Chain of Thought</text>
  <text x="260" y="198" text-anchor="middle" class="label-muted" style="font-family:var(--font-serif);font-style:italic;font-size:26px;">"Let's think step by step."</text>
  <text x="260" y="230" text-anchor="middle" class="label-tiny">Wei Jan · Kojima May · 2022</text>
  <line x1="500" y1="160" x2="600" y2="160" class="stroke-1" stroke-width="1.5" />
  <path d="M 590 154 L 600 160 L 590 166" class="stroke-1" stroke-width="1.5" fill="none" />
  <rect x="620" y="60" width="440" height="200" rx="6" class="stroke fill-paper" stroke-width="1.5" />
  <text x="840" y="106" text-anchor="middle" class="label-accent">Stage 2 · trained capability</text>
  <text x="840" y="156" text-anchor="middle" class="label-title">Trained reasoners</text>
  <text x="840" y="198" text-anchor="middle" class="label-muted">o1 · R1 · Claude extended thinking</text>
  <text x="840" y="230" text-anchor="middle" class="label-tiny">2024.09 — 2025.02</text>
  <line x1="1080" y1="160" x2="1180" y2="160" class="stroke-1" stroke-width="1.5" />
  <path d="M 1170 154 L 1180 160 L 1170 166" class="stroke-1" stroke-width="1.5" fill="none" />
  <rect x="1200" y="60" width="440" height="200" rx="6" class="fill-1" />
  <text x="1420" y="106" text-anchor="middle" class="label-accent" style="fill:var(--bg)">Today</text>
  <text x="1420" y="156" text-anchor="middle" class="label-title" style="fill:var(--bg)">Built-in reasoning</text>
  <text x="1420" y="198" text-anchor="middle" style="fill:var(--bg);font-family:var(--font-label);font-size:24px;opacity:.85;">core capability of agents</text>
  <text x="1420" y="230" text-anchor="middle" style="fill:var(--bg);font-family:var(--font-label);font-size:24px;opacity:.65;letter-spacing:.06em;">handles harder problems</text>
</svg>

<div class="spacer" style="flex:0.5"></div>

<p class="body" style="color:var(--muted);max-width:1300px;font-family:var(--font-serif);font-style:italic;">
The model thinks step-by-step before answering. The harder the problem, the bigger the gain — broadening the range of tasks an agent can handle.
</p>

<!--
[speaker notes]
- The crux of "reasoning" isn't an implementation split — it's a new capability for the agent.
- Stage 1: prompt trick. Wei (Jan 2022), Kojima (May 2022) showed example reasoning in the prompt makes the model imitate the style. Just "let's think step by step" worked zero-shot.
- Stage 2: training. 2024.09 OpenAI o1, 2025.01 DeepSeek R1, 2025.02 Claude extended thinking — explicitly trained reasoners.
- Today: reasoning is the agent's built-in capability. A model that thinks before answering handles harder problems — broadening what an agent can take on.
- The implementation detail (separating the trace from the answer) is secondary. The point is that reasoning became an emergent capability.
-->

---

<div class="eyebrow">Learned to Act</div>

## <span class="title">Tool use as a protocol.</span>

<div class="spacer" style="flex:0.3"></div>

<svg viewBox="0 0 1680 520" style="width:100%;height:auto;max-height:540px;">
  <!-- Lifelines -->
  <g class="stroke-line" stroke-width="1" stroke-dasharray="3 6">
    <line x1="240"  y1="80" x2="240"  y2="500" />
    <line x1="840"  y1="80" x2="840"  y2="500" />
    <line x1="1440" y1="80" x2="1440" y2="500" />
  </g>
  <!-- Lane heads -->
  <rect x="140"  y="36" width="200" height="56" rx="4" class="fill-paper stroke" stroke-width="1.5" />
  <text x="240"  y="72" text-anchor="middle" class="label-title" style="font-size:26px">User</text>
  <rect x="740"  y="36" width="200" height="56" rx="4" class="fill-1" />
  <text x="840"  y="72" text-anchor="middle" class="label-title" style="font-size:26px;fill:var(--bg)">Model</text>
  <rect x="1340" y="36" width="200" height="56" rx="4" class="fill-paper stroke-3" stroke-width="2" />
  <text x="1440" y="72" text-anchor="middle" class="label-title" style="font-size:26px;fill:var(--accent-3)">Tool</text>
  <!-- Step 1 -->
  <line x1="240" y1="140" x2="836" y2="140" class="stroke" stroke-width="1.5" />
  <path d="M 830 134 L 840 140 L 830 146" class="stroke" stroke-width="1.5" fill="none" />
  <text x="540" y="128" text-anchor="middle" class="label" style="font-style:italic;font-family:var(--font-serif);font-size:26px">"What's the weather in SF?"</text>
  <!-- Step 2 -->
  <line x1="840" y1="220" x2="1436" y2="220" class="stroke-1" stroke-width="2" />
  <path d="M 1430 214 L 1440 220 L 1430 226" class="stroke-1" stroke-width="2" fill="none" />
  <text x="1140" y="208" text-anchor="middle" class="label" style="font-family:var(--font-mono);font-size:24px;fill:var(--accent-1)">get_weather(city: "SF")</text>
  <text x="1140" y="244" text-anchor="middle" class="label-tiny">structured tool call · not free text</text>
  <!-- Step 3 -->
  <line x1="1440" y1="320" x2="844" y2="320" class="stroke-3" stroke-width="2" />
  <path d="M 850 314 L 840 320 L 850 326" class="stroke-3" stroke-width="2" fill="none" />
  <text x="1140" y="308" text-anchor="middle" class="label" style="font-family:var(--font-mono);font-size:24px;fill:var(--accent-3)">{ temp: 62, conditions: "foggy" }</text>
  <!-- Step 4 -->
  <line x1="840" y1="420" x2="244" y2="420" class="stroke" stroke-width="1.5" />
  <path d="M 250 414 L 240 420 L 250 426" class="stroke" stroke-width="1.5" fill="none" />
  <text x="540" y="408" text-anchor="middle" class="label" style="font-style:italic;font-family:var(--font-serif);font-size:26px">"It's 62°F and foggy in SF."</text>
  <!-- Step numbers -->
  <circle cx="60" cy="140" r="22" class="fill-1" />
  <text x="60" y="146" text-anchor="middle" style="fill:var(--bg);font-family:var(--font-label);font-size:24px;font-weight:600;">1</text>
  <circle cx="60" cy="220" r="22" class="fill-1" />
  <text x="60" y="226" text-anchor="middle" style="fill:var(--bg);font-family:var(--font-label);font-size:24px;font-weight:600;">2</text>
  <circle cx="60" cy="320" r="22" class="fill-1" />
  <text x="60" y="326" text-anchor="middle" style="fill:var(--bg);font-family:var(--font-label);font-size:24px;font-weight:600;">3</text>
  <circle cx="60" cy="420" r="22" class="fill-1" />
  <text x="60" y="426" text-anchor="middle" style="fill:var(--bg);font-family:var(--font-label);font-size:24px;font-weight:600;">4</text>
</svg>

<div class="spacer"></div>

<p class="small" style="text-align:center;">
<span style="color:var(--accent-1);font-family:var(--font-label);letter-spacing:.08em;text-transform:uppercase;">function calling introduced · OpenAI · 2023.06.13 — the start of structured tool calls</span>
</p>

<!--
[speaker notes]
- User asks → model emits a *structured* tool call (JSON-shaped request, not free text) → agent loop runs the tool → result returns to the model → model produces the final answer.
- The pivotal date: 2023.06.13 — OpenAI shipped function calling. The start of structured tool calls.
- Before: ask "output JSON" and pray. After: the model emits the call in a dedicated API field, trained for it.
- Anthropic followed (beta Nov 2023 → GA May 2024); Google in 2024. By late 2024 it was table stakes.
- When tools work, the model can do almost anything.
-->

---

<div class="eyebrow">Think + Act + Observe</div>

## <span class="title">Agent loop.</span>

<div class="spacer" style="flex:0.3"></div>

<div style="display:grid;grid-template-columns:1.1fr 1fr;gap:80px;align-items:center;">
  <svg viewBox="0 0 720 540" style="width:100%;height:auto;">
    <circle cx="360" cy="270" r="200" class="stroke-line" stroke-width="1.5" fill="none" />
    <!-- Think (top) -->
    <circle cx="360" cy="70" r="74" class="fill-1" />
    <text x="360" y="64" text-anchor="middle" style="fill:var(--bg);font-family:var(--font-title);font-size:30px;">Think</text>
    <text x="360" y="92" text-anchor="middle" style="fill:var(--bg);font-family:var(--font-label);font-size:24px;letter-spacing:.06em;text-transform:uppercase;opacity:.8;">model</text>
    <!-- Act (bottom-right) -->
    <circle cx="533" cy="370" r="74" class="fill-3" />
    <text x="533" y="364" text-anchor="middle" style="fill:var(--bg);font-family:var(--font-title);font-size:30px;">Act</text>
    <text x="533" y="392" text-anchor="middle" style="fill:var(--bg);font-family:var(--font-label);font-size:24px;letter-spacing:.06em;text-transform:uppercase;opacity:.8;">tool call</text>
    <!-- Observe (bottom-left) -->
    <circle cx="187" cy="370" r="74" class="fill-2" />
    <text x="187" y="364" text-anchor="middle" style="fill:var(--fg);font-family:var(--font-title);font-size:30px;">Observe</text>
    <text x="187" y="392" text-anchor="middle" style="fill:var(--fg);font-family:var(--font-label);font-size:24px;letter-spacing:.06em;text-transform:uppercase;opacity:.75;">result</text>
    <!-- Ring arrows -->
    <g class="stroke" stroke-width="2" fill="none">
      <path d="M 432 110 A 200 200 0 0 1 503 304" />
      <path d="M 497 296 L 503 304 L 510 296" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 458 408 A 200 200 0 0 1 262 408" />
      <path d="M 270 414 L 262 408 L 272 400" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 217 304 A 200 200 0 0 1 288 110" />
      <path d="M 286 118 L 288 110 L 296 116" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </svg>
  <div>
    <p class="lede" style="margin-bottom:32px;">One revolution = one model call.</p>
    <p class="body" style="color:var(--muted);max-width:600px;margin-bottom:28px;">
      The model thinks. The agent loop runs tools. The result returns. The model thinks again. Repeats until done.
    </p>
    <p class="body" style="font-family:var(--font-serif);font-style:italic;color:var(--accent-3);">
      The foundation of every modern agent. Surfaces differ, the loop stays the same.
    </p>
    <p class="small" style="margin-top:36px;color:var(--accent-1);font-family:var(--font-label);letter-spacing:.08em;text-transform:uppercase;">
      ReAct &mdash; Yao et al. &mdash; Oct 2022
    </p>
  </div>
</div>

<div class="spacer"></div>

<!--
[speaker notes]
- Combine the previous two slides — think and act. Model thinks, acts, observes, thinks again. Repeats until done.
- Name: ReAct (Reasoning + Acting). 2022.10 Yao et al., Princeton/Google.
- One revolution = one model call. The agent loop calls the model, runs tools, and returns results. The model decides when to stop.
- Foundation of every modern agent. Surfaces differ; the loop stays the same.
- This shape appears on every slide that follows.
-->

---

<div class="eyebrow">Learned to Collaborate</div>

## <span class="title">2023 &mdash; the orchestration wave.</span>

<div class="spacer" style="flex:0.4"></div>

<div class="timeline">
  <div class="pt above"><span class="lbl">LangChain</span><span class="date">2022.10</span></div>
  <div class="pt below"><span class="lbl">ChatGPT</span><span class="date">2022.11</span></div>
  <div class="pt above major"><span class="lbl">AutoGPT</span><span class="date">2023.03</span></div>
  <div class="pt below"><span class="lbl">BabyAGI</span><span class="date">2023.04</span></div>
  <div class="pt above"><span class="lbl">AutoGen</span><span class="date">2023.08</span></div>
  <div class="pt below"><span class="lbl">CrewAI</span><span class="date">2024.01</span></div>
  <div class="pt above major"><span class="lbl">MCP</span><span class="date">2024.11</span></div>
</div>

<div class="spacer" style="flex:0.4"></div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:80px;margin-top:32px;">
  <div>
    <div class="numeral" style="font-size:120px;">5 months</div>
    <p class="small">ReAct paper (2022.10) → AutoGPT (2023.03) &mdash; from research to product category.</p>
  </div>
  <div style="align-self:end;">
    <p class="body" style="color:var(--muted);font-family:var(--font-serif);font-style:italic;">
      Most demos were cherry-picked, but the <em>concept</em> of an "agent loop" took root in industry.
    </p>
  </div>
</div>

<!--
[speaker notes]
- ReAct paper (Oct 2022) → AutoGPT (Mar 2023) — about five months. From research to product category in that span.
- LangChain 2022.10, ChatGPT 2022.11, AutoGPT 2023.03.30, BabyAGI 2023.04, AutoGen 2023.08, CrewAI 2024.01 — an explosion of orchestration frameworks.
- This is when "AI agent" entered everyday vocabulary.
- Honestly, most demos were cherry-picked. Real runs got stuck in loops and hallucinated. By fall 2023 the mood turned to disillusionment.
- But the *concept* survived — "agent loop" became the field's shared vocabulary.
-->

---

<div class="eyebrow">After the wave</div>

## <span class="title">Discipline settles on top of frameworks.</span>

<div class="spacer" style="flex:0.4"></div>

<div class="two-col">
  <div>
    <div class="col-head"><span class="dot"></span><span>What remained</span></div>
    <ol class="steps" style="margin-top:18px;">
      <li><span><b style="font-family:var(--font-title);font-size:40px;">Own your prompts.</b><br /><span style="color:var(--muted);font-size:24px;"><em>prompt</em>: the instructions sent to the model on every call. Don't hide them behind abstractions — write them yourself.</span></span></li>
      <li><span><b style="font-family:var(--font-title);font-size:40px;">Own your context.</b><br /><span style="color:var(--muted);font-size:24px;"><em>context</em>: everything the model sees each turn (history + documents + tool results). Decide what goes in.</span></span></li>
      <li><span><b style="font-family:var(--font-title);font-size:40px;">Own your control flow.</b><br /><span style="color:var(--muted);font-size:24px;"><em>control flow</em>: the loop itself — when to call the model, when to stop. Don't outsource it; write it.</span></span></li>
    </ol>
  </div>
  <div style="align-self:center;">
    <div class="col-head"><span class="dot alt"></span><span>Where method converged</span></div>
    <p class="lede" style="margin-top:18px;font-family:var(--font-serif);font-style:italic;line-height:1.25;">
      Everyone agrees: the <span style="color:var(--accent-1);">orchestration</span> layer stays small and simple;
      the <span style="color:var(--accent-1);">integration</span> layer becomes richer and extensible.
    </p>
    <p class="body" style="margin-top:36px;color:var(--muted);">
      MCP became the de-facto standard for the integration layer in November 2024.
    </p>
  </div>
</div>

<div class="spacer"></div>

<!--
[speaker notes]
- By 2024 the consensus: frameworks were over-abstracted, and the orchestration layer was actually the smallest part of the problem.
- The wisdom that grew is the 12-Factor Agents school.
  - Own your prompts (don't hide them behind abstractions).
  - Own your context (decide what enters the window each turn).
  - Own your control flow (write the loop yourself).
- The framework wars ended when everyone agreed: the orchestration layer should be small while the integration layer should be richer.
- MCP standardized the integration layer in November 2024.
- What remained from the framework era is a shared mental model.
-->

---

<!-- _class: section-slide -->

<div class="part-no">Part II</div>

<h2 class="part-title">Modern toolkit.</h2>

<p class="part-blurb">Steering, guardrails, and four standards that arrived in twelve months.</p>

<div class="part-rule"></div>

---

<div class="eyebrow">Steering &amp; guardrailing</div>

## <span class="title">Two axes &mdash; Constrain &amp; Steer.</span>

<div class="spacer" style="flex:0.4"></div>

<div class="two-col">
  <div>
    <div class="col-head" style="color:var(--accent-1);">
      <span class="dot"></span><span>Constrain &mdash; what the agent cannot do</span>
    </div>
    <ul class="bare" style="margin-top:18px;font-size:28px;line-height:1.5;">
      <li style="border-bottom:1px solid var(--line-soft);padding:18px 0;">Refusal training</li>
      <li style="border-bottom:1px solid var(--line-soft);padding:18px 0;">Output filters</li>
      <li style="border-bottom:1px solid var(--line-soft);padding:18px 0;">Sandbox &mdash; isolation from the host</li>
      <li style="padding:18px 0;">Permission prompt before risky actions</li>
    </ul>
  </div>
  <div>
    <div class="col-head" style="color:var(--accent-3);">
      <span class="dot" style="background:var(--accent-3);"></span><span>Steer &mdash; how the agent should act</span>
    </div>
    <ul class="bare" style="margin-top:18px;font-size:28px;line-height:1.5;">
      <li style="border-bottom:1px solid var(--line-soft);padding:18px 0;">System prompt &mdash; job description</li>
      <li style="border-bottom:1px solid var(--line-soft);padding:18px 0;">Structured output &mdash; schema enforcement</li>
      <li style="border-bottom:1px solid var(--line-soft);padding:18px 0;">Tool registry trimming</li>
      <li style="padding:18px 0;">Verdict contracts &mdash; "declare PASS or FAIL"</li>
    </ul>
  </div>
</div>

<div class="spacer" style="flex:0.5"></div>

<p class="lede" style="text-align:center;font-family:var(--font-serif);font-style:italic;color:var(--accent-1);max-width:1400px;margin:0 auto;">
Don't ask politely via prompt &mdash; restrict the capability itself.
</p>

<!--
[speaker notes]
- Keep a strong generalist model focused and out of trouble — two complementary axes.
- Constrain (negative): refusal training, output filters, sandbox, permission prompts.
- Steer (positive): system prompt (job description), structured output (schema), tool denylist (remove dangerous tools), verdict contract (PASS or FAIL).
- The most interesting design move of the past year: enforce structurally; don't ask politely.
- Claude Code's read-only reviewer subagent has *no* Edit tool. The rule isn't a prompt sentence — it's an *absent capability*. The model literally cannot violate it.
- If you take away one mental model, take this one.
-->

---

<div class="eyebrow">Twelve months</div>

## <span class="title">Four cross-vendor standards.</span>

<div class="spacer" style="flex:0.4"></div>

<div class="standards-row">
  <div class="std-card">
    <div class="s-tag">Tool bridge</div>
    <div class="s-name">MCP</div>
    <div class="s-date">Anthropic · 2024.11.25</div>
    <div class="s-tagline">How agents talk to tools and environments.</div>
  </div>
  <div class="std-card">
    <div class="s-tag">Project context</div>
    <div class="s-name">AGENTS.md</div>
    <div class="s-date">OpenAI Codex CLI · mid-2025</div>
    <div class="s-tagline">Plain Markdown at the project root.</div>
  </div>
  <div class="std-card">
    <div class="s-tag">Editor bridge</div>
    <div class="s-name">ACP</div>
    <div class="s-date">Zed · 2025.08.27</div>
    <div class="s-tagline">How editors talk to agents.</div>
  </div>
  <div class="std-card">
    <div class="s-tag">Capability artifact</div>
    <div class="s-name">SKILL.md</div>
    <div class="s-date">Anthropic · 2025.10.16</div>
    <div class="s-tagline">Capability bundle &mdash; same file, many agents.</div>
  </div>
</div>

<div class="spacer" style="flex:0.4"></div>

<p class="body" style="color:var(--muted);font-family:var(--font-serif);font-style:italic;text-align:center;">
Each minimal &mdash; text-shaped or JSON-RPC-shaped &mdash; making integration frictionless.
</p>

<!--
[speaker notes]
- Four cross-vendor standards in twelve months — rare in software, almost unprecedented in AI.
- MCP (Anthropic 2024.11.25): agent ↔ tool/data. OpenAI adopted Apr 2025; donated to Linux Foundation Dec 2025.
- AGENTS.md (mid-2025, OpenAI Codex CLI): plain Markdown, walked like Git from the root. Donated to LF late 2025; used by ~60K open-source projects.
- ACP (Zed 2025.08.27): editor ↔ agent. Same role LSP plays for language servers.
- SKILL.md (Anthropic 2025.10.16): portable capability bundle, Markdown + YAML.
- Each minimal. That's what made adoption frictionless.
-->

---

<div class="eyebrow">How they fit together</div>

## <span class="title">Three protocols, three boundaries.</span>

<div class="spacer" style="flex:0.3"></div>

<div style="display:grid;grid-template-columns:1.3fr 1fr;gap:80px;align-items:center;">
  <div class="layered">
    <div class="layer">
      <div class="l-name">Editor</div>
      <div class="l-sub">Zed · VS Code · &hellip;</div>
    </div>
    <div class="protocol-arrow">↕&nbsp;&nbsp;ACP</div>
    <div class="layer accent">
      <div class="l-name">Agent</div>
      <div class="l-sub">Claude Code · OpenCode · &hellip;</div>
    </div>
    <div class="protocol-arrow">↕&nbsp;&nbsp;MCP</div>
    <div class="layer">
      <div class="l-name">Tools &amp; resources</div>
      <div class="l-sub">GitHub · Postgres · Slack &hellip;</div>
    </div>
  </div>
  <div>
    <p class="lede" style="margin-bottom:32px;font-family:var(--font-serif);font-style:italic;">
      Each layer minimal. Each layer swappable.
    </p>
    <p class="body" style="color:var(--muted);">
      Between layers, a standard protocol &mdash; whichever model the agent uses, whichever tool it calls, the other layer is unaffected.
    </p>
    <p class="body" style="margin-top:36px;color:var(--accent-3);font-family:var(--font-serif);font-style:italic;">
      Swap the editor, swap the agent, swap the tool server &mdash; the other layers don't notice.
    </p>
  </div>
</div>

<div class="spacer"></div>

<!--
[speaker notes]
- Three protocols, three layers, three jobs.
- Editor ↔ Agent: ACP. Agent ↔ Tools: MCP.
- A typical 2026 setup: Zed speaks ACP to Claude Code; Claude Code speaks MCP to GitHub/Postgres/Slack servers.
- Each layer's vendor can be swapped without touching the others. Swap the editor, swap the agent, swap the tool server — the rest keeps working.
- (For audiences who know LSP: same shape as LSP between editor and language server.)
-->

---

<div class="eyebrow">Capability artifacts</div>

## <span class="title">SKILL.md &mdash; load on demand.</span>

<div class="spacer" style="flex:0.3"></div>

<svg viewBox="0 0 1680 320" style="width:100%;height:auto;">
  <rect x="40" y="60" width="400" height="200" rx="6" class="stroke fill-paper" stroke-width="1.5" />
  <text x="240" y="100" text-anchor="middle" class="label-accent">Stage 1</text>
  <text x="240" y="148" text-anchor="middle" class="label-title">Discovery</text>
  <text x="240" y="184" text-anchor="middle" class="label" style="font-size:24px;fill:var(--muted)">name + description only</text>
  <text x="240" y="220" text-anchor="middle" class="label-tiny">~100 tokens / skill</text>
  <line x1="460" y1="160" x2="580" y2="160" class="stroke-1" stroke-width="1.5" />
  <path d="M 570 154 L 580 160 L 570 166" class="stroke-1" stroke-width="1.5" fill="none" />
  <rect x="600" y="60" width="400" height="200" rx="6" class="stroke fill-paper" stroke-width="1.5" />
  <text x="800" y="100" text-anchor="middle" class="label-accent">Stage 2</text>
  <text x="800" y="148" text-anchor="middle" class="label-title">Activation</text>
  <text x="800" y="184" text-anchor="middle" class="label" style="font-size:24px;fill:var(--muted)">read full SKILL.md body</text>
  <text x="800" y="220" text-anchor="middle" class="label-tiny">when needed</text>
  <line x1="1020" y1="160" x2="1140" y2="160" class="stroke-1" stroke-width="1.5" />
  <path d="M 1130 154 L 1140 160 L 1130 166" class="stroke-1" stroke-width="1.5" fill="none" />
  <rect x="1160" y="60" width="400" height="200" rx="6" class="fill-1" />
  <text x="1360" y="100" text-anchor="middle" class="label-accent" style="fill:var(--bg)">Stage 3</text>
  <text x="1360" y="148" text-anchor="middle" class="label-title" style="fill:var(--bg)">Execution</text>
  <text x="1360" y="184" text-anchor="middle" style="fill:var(--bg);font-family:var(--font-label);font-size:24px;opacity:.85;">open scripts &amp; templates</text>
  <text x="1360" y="220" text-anchor="middle" style="fill:var(--bg);font-family:var(--font-label);font-size:24px;opacity:.7;letter-spacing:.06em;">only when referenced</text>
</svg>

<div class="spacer" style="flex:0.3"></div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:80px;margin-top:24px;align-items:center;">
  <div>
    <div style="font-family:var(--font-mono);font-size:40px;line-height:1.4;color:var(--fg);">
      30&nbsp;skills × 100&nbsp;tokens<br /><span style="color:var(--accent-3);">≈ 3K tokens (startup)</span>
    </div>
  </div>
  <div>
    <div style="font-family:var(--font-mono);font-size:40px;line-height:1.4;color:var(--muted);text-decoration:line-through;text-decoration-color:var(--accent-1);">
      30&nbsp;skills × 2K&nbsp;tokens<br /><span>≈ 60K tokens (eager load)</span>
    </div>
  </div>
</div>

<!--
[speaker notes]
- A skill is just a folder. Inside is a SKILL.md (Markdown + a two-line YAML header: name + description).
- Core innovation: progressive disclosure. Three stages.
  - Discovery: at startup, only name + description per skill. ~100 tokens each.
  - Activation: when the model judges relevance, read the full body.
  - Execution: only when the body references a script does the agent open it.
- Math: 30 skills × 100 tokens = 3K. Eager load would be 60K — before the user types a character. That's why the format spread.
- The same SKILL.md works in Claude Code, Codex, Cursor, OpenCode, Pi, Goose, and ~25 other tools.
-->

---

<!-- _class: section-slide -->

<div class="part-no">Part III</div>

<h2 class="part-title">Today's agents.</h2>

<p class="part-blurb">Five examples built on the same building blocks.</p>

<div class="part-rule"></div>

---

<div class="eyebrow">Examples</div>

## <span class="title">Five surfaces, one shape.</span>

<div class="spacer" style="flex:0.3"></div>

<div style="display:grid;grid-template-columns:repeat(5, 1fr);gap:32px;">
  <div class="agent-card">
    <div class="a-maker">Anthropic</div>
    <div class="a-name">claude-code</div>
    <div class="small" style="color:var(--muted);">Terminal. ~40 built-in tools. MCP-first. Hooks at every step.</div>
    <div class="a-quote">"Layered platform."</div>
  </div>
  <div class="agent-card">
    <div class="a-maker">SST</div>
    <div class="a-name">opencode</div>
    <div class="small" style="color:var(--muted);">Server-first. Typed HTTP API. The terminal is just one client.</div>
    <div class="a-quote">"Typed protocol surface."</div>
  </div>
  <div class="agent-card">
    <div class="a-maker">Community</div>
    <div class="a-name">openclaw</div>
    <div class="small" style="color:var(--muted);">Single operator. Three-tier Docker sandbox. Multi-channel daemon.</div>
    <div class="a-quote">"Single-operator gateway."</div>
  </div>
  <div class="agent-card">
    <div class="a-maker">Nous Research</div>
    <div class="a-name">hermes-agent</div>
    <div class="small" style="color:var(--muted);">Self-improving. Edits its own memory. Generates its own skills.</div>
    <div class="a-quote">"Self-improving environment."</div>
  </div>
  <div class="agent-card">
    <div class="a-maker">M. Zechner</div>
    <div class="a-name">pi-mono</div>
    <div class="small" style="color:var(--muted);">Minimal core of 7 tools. Grows via extensions &mdash; simple but extensible.</div>
    <div class="a-quote">"Core + extensions."</div>
  </div>
</div>

<div class="spacer"></div>

<p class="body" style="text-align:center;color:var(--muted);font-family:var(--font-serif);font-style:italic;">
Every agent shares the same building blocks.
</p>

<!--
[speaker notes]
- These five are the talk's examples — all built on the same architecture.
- claude-code (Anthropic): terminal, MCP-first, a layered platform that exposes every hook.
- opencode (SST): server-first, typed HTTP API, the terminal is just one client.
- openclaw: single-operator + three-tier sandbox + multi-channel daemon.
- hermes-agent (Nous Research): self-improving. Edits its own memory and skills.
- pi-mono (Mario Zechner): minimal core of 7 tools, growing through an extension layer. Simple but extensible.
- Five different surfaces, but the *underlying building blocks* are the same. Starting next slide.
-->

---

<div class="eyebrow">Ecosystem composes</div>

## <span class="title">Family tree.</span>

<div class="spacer" style="flex:0.2"></div>

<svg viewBox="0 0 1680 580" style="width:100%;height:auto;">
  <!-- Nodes -->
  <rect x="60"  y="40" width="320" height="104" rx="8" class="stroke fill-paper" stroke-width="1.5" />
  <text x="220" y="96"  text-anchor="middle" class="label-title">claude-code</text>
  <text x="220" y="132" text-anchor="middle" class="label-tiny">Anthropic</text>
  <rect x="700" y="40" width="320" height="104" rx="8" class="stroke fill-paper" stroke-width="1.5" />
  <text x="860" y="96"  text-anchor="middle" class="label-title">opencode</text>
  <text x="860" y="132" text-anchor="middle" class="label-tiny">SST</text>
  <rect x="700" y="238" width="320" height="104" rx="8" class="fill-3" />
  <text x="860" y="294" text-anchor="middle" class="label-title" style="fill:var(--bg)">openclaw</text>
  <text x="860" y="330" text-anchor="middle" class="label-tiny" style="fill:var(--bg);opacity:.75;">community</text>
  <rect x="1280" y="238" width="320" height="104" rx="8" class="stroke-1 fill-paper" stroke-width="2" />
  <text x="1440" y="294" text-anchor="middle" class="label-title">hermes-agent</text>
  <text x="1440" y="330" text-anchor="middle" class="label-tiny">Nous Research</text>
  <rect x="60"  y="436" width="320" height="104" rx="8" class="fill-1" />
  <text x="220" y="492" text-anchor="middle" class="label-title" style="fill:var(--bg)">pi-mono</text>
  <text x="220" y="528" text-anchor="middle" class="label-tiny" style="fill:var(--bg);opacity:.75;">M. Zechner</text>
  <rect x="700" y="436" width="320" height="104" rx="8" class="stroke fill-paper" stroke-width="1.5" />
  <text x="860" y="492" text-anchor="middle" class="label-title">5 nested agents</text>
  <text x="860" y="528" text-anchor="middle" class="label-tiny">Codex · Gemini CLI · …</text>
  <!-- Edges -->
  <g class="stroke-1" stroke-width="1.5" fill="none">
    <line x1="380" y1="92" x2="700" y2="92" />
    <path d="M 692 87 L 700 92 L 692 97" stroke-linecap="round"/>
    <path d="M 380 488 C 540 488, 580 290, 700 290" />
    <path d="M 692 285 L 700 290 L 692 295" stroke-linecap="round"/>
    <line x1="1020" y1="290" x2="1280" y2="290" />
    <path d="M 1272 285 L 1280 290 L 1272 295" stroke-linecap="round"/>
    <line x1="860" y1="342" x2="860" y2="436" />
    <path d="M 855 428 L 860 436 L 865 428" stroke-linecap="round"/>
  </g>
  <!-- Edge labels -->
  <text x="540"  y="80"  text-anchor="middle" class="label-tiny" style="fill:var(--accent-1);">SKILL.md adopted by</text>
  <text x="540"  y="396" text-anchor="middle" class="label-tiny" style="fill:var(--accent-1);">embedded by</text>
  <text x="1150" y="278" text-anchor="middle" class="label-tiny" style="fill:var(--accent-1);">evolved into</text>
  <text x="880"  y="396" class="label-tiny" style="fill:var(--accent-1);">drives via ACP</text>
</svg>

<div class="spacer" style="flex:0.3"></div>

<p class="body" style="text-align:center;color:var(--accent-3);font-family:var(--font-serif);font-style:italic;">
Standardization, followed by evolution.
</p>

<!--
[speaker notes]
- The five projects aren't isolated — they share code and formats and depend on each other.
- openclaw → imports pi-mono as a library (doesn't reinvent the agent loop).
- hermes-agent → grew out of openclaw. Ships a `hermes claw migrate` command that imports ~/.openclaw.
- opencode → reads Claude Code's skills directory directly.
- pi-skills → ships the same SKILL.md with install instructions for 5 agents.
- openclaw → bidirectional ACP: an ACP server for IDEs, and an ACP client driving Codex/Claude Code/Gemini CLI/OpenCode/Pi as nested children.
- A family tree, not a competition table. Evidence that the standards are real.
-->

---

<!-- _class: section-slide -->

<div class="part-no">Part IV</div>

<h2 class="part-title">Settled patterns.</h2>

<p class="part-blurb">The architecture the five agents share.</p>

<div class="part-rule"></div>

---

<div class="eyebrow">The universal pattern</div>

## <span class="title">One loop. Many policies.</span>

<div class="spacer" style="flex:0.2"></div>

<svg viewBox="0 0 1680 580" style="width:100%;height:auto;">
  <circle cx="840" cy="290" r="180" class="stroke" stroke-width="2" fill="var(--paper)" />
  <text x="840" y="270" text-anchor="middle" class="label-title" style="font-size:34px;">while&nbsp;true:</text>
  <text x="840" y="312" text-anchor="middle" class="label-title" style="font-size:24px;fill:var(--muted)">call model</text>
  <text x="840" y="346" text-anchor="middle" class="label-title" style="font-size:24px;fill:var(--muted)">run tools</text>
  <g class="stroke-1" stroke-width="1.5" fill="none">
    <line x1="668" y1="200" x2="280" y2="80"  />
    <line x1="668" y1="380" x2="280" y2="500" />
    <line x1="1012" y1="200" x2="1400" y2="80" />
    <line x1="1012" y1="380" x2="1400" y2="500"/>
  </g>
  <rect x="40"   y="20"  width="430" height="124" rx="6" class="fill-paper stroke" stroke-width="1" />
  <text x="60"   y="58"  class="label-accent">prompt A</text>
  <text x="60"   y="88"  class="label" style="font-size:24px;fill:var(--muted);font-style:italic;font-family:var(--font-serif);">all tools</text>
  <text x="60"   y="124" class="label-title" style="font-size:26px;">Interactive coding</text>
  <rect x="40"   y="436" width="430" height="124" rx="6" class="fill-paper stroke" stroke-width="1" />
  <text x="60"   y="474" class="label-accent">prompt B</text>
  <text x="60"   y="504" class="label" style="font-size:24px;fill:var(--muted);font-style:italic;font-family:var(--font-serif);">read-only tools</text>
  <text x="60"   y="540" class="label-title" style="font-size:26px;">Subagent: explore</text>
  <rect x="1210" y="20"  width="430" height="124" rx="6" class="fill-paper stroke" stroke-width="1" />
  <text x="1230" y="58"  class="label-accent">prompt C</text>
  <text x="1230" y="88"  class="label" style="font-size:24px;fill:var(--muted);font-style:italic;font-family:var(--font-serif);">denylist mutators</text>
  <text x="1230" y="124" class="label-title" style="font-size:26px;">Subagent: verify</text>
  <rect x="1210" y="436" width="430" height="124" rx="6" class="fill-paper stroke" stroke-width="1" />
  <text x="1230" y="474" class="label-accent">prompt D</text>
  <text x="1230" y="504" class="label" style="font-size:24px;fill:var(--muted);font-style:italic;font-family:var(--font-serif);">background · no user</text>
  <text x="1230" y="540" class="label-title" style="font-size:26px;">Memory consolidation</text>
</svg>

<div class="spacer" style="flex:0.3"></div>

<p class="lede" style="text-align:center;font-family:var(--font-serif);font-style:italic;color:var(--accent-3);">
Multi-agent isn't a separate platform &mdash; it's the same loop, configured differently.
</p>

<!--
[speaker notes]
- The most universal pattern in the field.
- The same loop (call model, run tools, repeat) reconfigures into completely different behaviors when prompt + tool filter + permission context change.
- In Claude Code's source, one file handles interactive REPL, subagents, remote sessions, and background memory consolidation.
- "verify" subagent: the loop with mutating tools removed + a "break this" prompt.
- "explore" subagent: the loop with read-only tools only.
- Multi-agent behavior is not a separate platform — it's the same loop reconfigured.
-->

---

<div class="eyebrow">Universals</div>

## <span class="title">Six shared building blocks.</span>

<div class="spacer" style="flex:0.3"></div>

<div class="checklist">
  <div class="check-item"><span class="ck">✓</span><span>One loop, many policies</span></div>
  <div class="check-item"><span class="ck">✓</span><span>Methodology in prompts, not state</span></div>
  <div class="check-item"><span class="ck">✓</span><span>Compaction as control flow</span></div>
  <div class="check-item"><span class="ck">✓</span><span>Streaming + parallel tool execution</span></div>
  <div class="check-item"><span class="ck">✓</span><span>SKILL.md + AGENTS.md as artifacts</span></div>
  <div class="check-item"><span class="ck">✓</span><span>ACP for editors, MCP for tools</span></div>
</div>

<div class="spacer" style="flex:0.4"></div>

<p class="body" style="color:var(--muted);font-family:var(--font-serif);font-style:italic;max-width:1300px;">
Six structural traits all five agents have in common.
</p>

<!--
[speaker notes]
- These six patterns appear in *all five* examples — that is, modern agent architecture has settled.
- One loop, many policies — same loop reconfigured by prompt + tool filter + permission.
- Methodology in prompts, not state — no rigid state machine in the code.
- Compaction as control flow — context-window management is part of every turn.
- Streaming + parallel tool execution — tools run alongside model token output.
- SKILL.md + AGENTS.md as cross-vendor file formats.
- ACP for editors, MCP for tools.
- The shared architecture the field agreed on — this is the talk's thesis.
-->

---

<div class="eyebrow">Configurable axes &mdash; same architecture, different setup</div>

## <span class="title">Six knobs on the shared base.</span>

<div class="spacer" style="flex:0.2"></div>

<div class="rifts">
  <div class="l">Server-first</div>     <div class="mid">vs</div> <div class="r">Binary-first</div>
  <div class="row-line"></div>
  <div class="l">MCP built-in</div> <div class="mid">vs</div> <div class="r">MCP via bridge</div>
  <div class="row-line"></div>
  <div class="l">Sandbox in core</div>  <div class="mid">vs</div> <div class="r">Sandbox in deployment</div>
  <div class="row-line"></div>
  <div class="l">Curated memory layer</div> <div class="mid">vs</div> <div class="r">Stateless session</div>
  <div class="row-line"></div>
  <div class="l">Subagents first-class</div> <div class="mid">vs</div> <div class="r">Single agent</div>
  <div class="row-line"></div>
  <div class="l">Multi-tenant</div>     <div class="mid">vs</div> <div class="r">Single-operator</div>
</div>

<div class="spacer" style="flex:0.4"></div>

<p class="body" style="color:var(--muted);font-family:var(--font-serif);font-style:italic;text-align:center;">
Each agent picks a direction by purpose and use case.
</p>

<!--
[speaker notes]
- The six axes aren't differences in *product* — they're differences in *how the same architecture was configured*.
- Server-first vs binary-first — process model.
- MCP built-in vs via bridge — where the tool integration layer lives.
- Sandbox in core vs in deployment — where sandboxing sits.
- Curated memory vs stateless session — whether the memory layer is active.
- Subagents first-class vs single agent — concurrency choice.
- Multi-tenant vs single-operator — operational model.
- The message isn't the *differences themselves* — it's that *the same architecture supports this much variety*.
- Whatever the setup, the base building blocks are the same. More evidence the architecture is settled.
-->

---

<!-- _class: section-slide -->

<div class="part-no">Part V</div>

<h2 class="part-title">Synthesis.</h2>

<p class="part-blurb">The canonical shape of modern agents &mdash; converged on the same <em>structure</em>.</p>

<div class="part-rule"></div>

---

<div class="eyebrow">What an AI agent is in 2026</div>

## <span class="title">The canonical shape.</span>

<div class="spacer" style="flex:0.3"></div>

<svg viewBox="0 0 1680 320" style="width:100%;height:auto;">
  <rect x="20"   y="60" width="300" height="200" rx="6" class="stroke fill-paper" stroke-width="1.5" />
  <text x="170"  y="100" text-anchor="middle" class="label-accent">Layer 1</text>
  <text x="170"  y="148" text-anchor="middle" class="label-title">Surface</text>
  <text x="170"  y="186" text-anchor="middle" class="label" style="font-size:24px;fill:var(--muted);">terminal · IDE · chat</text>
  <rect x="350"  y="60" width="300" height="200" rx="6" class="stroke fill-paper" stroke-width="1.5" />
  <text x="500"  y="100" text-anchor="middle" class="label-accent">Layer 2</text>
  <text x="500"  y="148" text-anchor="middle" class="label-title">Session</text>
  <text x="500"  y="186" text-anchor="middle" class="label" style="font-size:24px;fill:var(--muted);">history · compaction</text>
  <rect x="680"  y="60" width="300" height="200" rx="6" class="fill-1" />
  <text x="830"  y="100" text-anchor="middle" class="label-accent" style="fill:var(--bg)">Layer 3</text>
  <text x="830"  y="148" text-anchor="middle" class="label-title" style="fill:var(--bg)">Loop</text>
  <text x="830"  y="186" text-anchor="middle" style="font-size:24px;fill:var(--bg);font-family:var(--font-label);opacity:.85;">think · act · observe</text>
  <rect x="1010" y="60" width="300" height="200" rx="6" class="stroke fill-paper" stroke-width="1.5" />
  <text x="1160" y="100" text-anchor="middle" class="label-accent">Layer 4</text>
  <text x="1160" y="148" text-anchor="middle" class="label-title" style="font-size:24px;">Provider · Tools</text>
  <text x="1160" y="182" text-anchor="middle" class="label-title" style="font-size:24px;">· Permissions</text>
  <text x="1160" y="216" text-anchor="middle" class="label" style="font-size:24px;fill:var(--muted);">policy</text>
  <rect x="1340" y="60" width="300" height="200" rx="6" class="stroke fill-paper" stroke-width="1.5" />
  <text x="1490" y="100" text-anchor="middle" class="label-accent">Layer 5</text>
  <text x="1490" y="148" text-anchor="middle" class="label-title">Extensions</text>
  <text x="1490" y="186" text-anchor="middle" class="label" style="font-size:24px;fill:var(--muted);">MCP · skills · plugins</text>
  <g class="stroke-1" stroke-width="1.5" fill="none">
    <line x1="320" y1="160" x2="350" y2="160" /><path d="M 342 154 L 350 160 L 342 166" stroke-linecap="round"/>
    <line x1="650" y1="160" x2="680" y2="160" /><path d="M 672 154 L 680 160 L 672 166" stroke-linecap="round"/>
    <line x1="980" y1="160" x2="1010" y2="160" /><path d="M 1002 154 L 1010 160 L 1002 166" stroke-linecap="round"/>
    <line x1="1310" y1="160" x2="1340" y2="160" /><path d="M 1332 154 L 1340 160 L 1332 166" stroke-linecap="round"/>
  </g>
</svg>

<div class="spacer" style="flex:0.4"></div>

<p class="lede" style="font-family:var(--font-serif);font-style:italic;color:var(--accent-3);max-width:1500px;line-height:1.25;text-align:center;">
Five layers, one architecture, different setups.
</p>

<!--
[speaker notes]
- One diagram for every modern AI agent, drawn once.
- Surface — what the human sees. Session — durable conversation state. Loop — the spine we drew earlier.
- Provider · Tools · Permissions — the model API, tool registry, rules. Extensions — MCP servers, skills, plugins.
- All five agents fit this shape. What differs is *how each layer is built*, not *whether a layer exists*.
- One sentence: a streaming chat loop over a provider abstraction — with tools, permissions, and extensions — configurable into many runtimes by changing prompt + tool filter + permission policy.
-->

---

<div class="eyebrow">Same shape, different setup</div>

## <span class="title">Pick the setup that fits.</span>

<div class="spacer" style="flex:0.3"></div>

<div class="branches">
  <div class="branch">
    <div class="q"><b>Solo work</b>, hand-buildable</div>
    <div class="ar">→</div>
    <div class="a">pi-mono pattern</div>
  </div>
  <div class="branch">
    <div class="q">Coding agent as a <b>platform</b></div>
    <div class="ar">→</div>
    <div class="a">claude-code pattern</div>
  </div>
  <div class="branch">
    <div class="q">Coding agent <b>everywhere</b> &mdash; terminal, web, IDE, mobile</div>
    <div class="ar">→</div>
    <div class="a">opencode pattern</div>
  </div>
  <div class="branch">
    <div class="q"><b>Chat-platform</b> personal assistant, single-operator</div>
    <div class="ar">→</div>
    <div class="a">openclaw pattern</div>
  </div>
  <div class="branch">
    <div class="q"><b>Self-improving</b> agent + training environment</div>
    <div class="ar">→</div>
    <div class="a">hermes-agent pattern</div>
  </div>
</div>

<div class="spacer" style="flex:0.3"></div>

<p class="body" style="color:var(--muted);font-family:var(--font-serif);font-style:italic;text-align:center;">
Same architecture, different setup. Problem determines setup &mdash; setup chooses surface.
</p>

<!--
[speaker notes]
- The right question isn't "which agent is best" but "which setup fits my problem".
- Five examples = five setups, all on the same base architecture.
- Solo coding, hand-buildable → pi-mono setup.
- Ecosystem-ready platform → claude-code setup.
- Multi-surface (terminal, web, IDE, mobile) → opencode setup.
- Chat-platform personal assistant → openclaw setup.
- Self-improving training environment → hermes-agent setup.
- The setup differs, but *the underlying architecture is the same*. The problem determines the setup.
-->

---

<div class="eyebrow">The 2026 floor</div>

## <span class="title">Ten table stakes.</span>

<div class="spacer" style="flex:0.3"></div>

<div style="display:grid;grid-template-columns:repeat(2, 1fr);column-gap:80px;row-gap:18px;font-size:28px;">
  <div style="display:grid;grid-template-columns:60px 1fr;align-items:baseline;gap:18px;padding-bottom:14px;border-bottom:1px solid var(--line-soft);">
    <span style="color:var(--accent-1);font-family:var(--font-label);font-variant-numeric:tabular-nums;font-size:24px;">01</span>
    <span>Streaming model + tool loop</span>
  </div>
  <div style="display:grid;grid-template-columns:60px 1fr;align-items:baseline;gap:18px;padding-bottom:14px;border-bottom:1px solid var(--line-soft);">
    <span style="color:var(--accent-1);font-family:var(--font-label);font-variant-numeric:tabular-nums;font-size:24px;">02</span>
    <span>Schema-validated tool registry</span>
  </div>
  <div style="display:grid;grid-template-columns:60px 1fr;align-items:baseline;gap:18px;padding-bottom:14px;border-bottom:1px solid var(--line-soft);">
    <span style="color:var(--accent-1);font-family:var(--font-label);font-variant-numeric:tabular-nums;font-size:24px;">03</span>
    <span>SKILL.md loader</span>
  </div>
  <div style="display:grid;grid-template-columns:60px 1fr;align-items:baseline;gap:18px;padding-bottom:14px;border-bottom:1px solid var(--line-soft);">
    <span style="color:var(--accent-1);font-family:var(--font-label);font-variant-numeric:tabular-nums;font-size:24px;">04</span>
    <span>AGENTS.md walk from cwd</span>
  </div>
  <div style="display:grid;grid-template-columns:60px 1fr;align-items:baseline;gap:18px;padding-bottom:14px;border-bottom:1px solid var(--line-soft);">
    <span style="color:var(--accent-1);font-family:var(--font-label);font-variant-numeric:tabular-nums;font-size:24px;">05</span>
    <span>Per-turn compaction stage</span>
  </div>
  <div style="display:grid;grid-template-columns:60px 1fr;align-items:baseline;gap:18px;padding-bottom:14px;border-bottom:1px solid var(--line-soft);">
    <span style="color:var(--accent-1);font-family:var(--font-label);font-variant-numeric:tabular-nums;font-size:24px;">06</span>
    <span>Permissions <em style="color:var(--muted);">or</em> sandbox</span>
  </div>
  <div style="display:grid;grid-template-columns:60px 1fr;align-items:baseline;gap:18px;padding-bottom:14px;border-bottom:1px solid var(--line-soft);">
    <span style="color:var(--accent-1);font-family:var(--font-label);font-variant-numeric:tabular-nums;font-size:24px;">07</span>
    <span>MCP support <em style="color:var(--muted);">or</em> explicit refusal</span>
  </div>
  <div style="display:grid;grid-template-columns:60px 1fr;align-items:baseline;gap:18px;padding-bottom:14px;border-bottom:1px solid var(--line-soft);">
    <span style="color:var(--accent-1);font-family:var(--font-label);font-variant-numeric:tabular-nums;font-size:24px;">08</span>
    <span>ACP server</span>
  </div>
  <div style="display:grid;grid-template-columns:60px 1fr;align-items:baseline;gap:18px;padding-bottom:14px;border-bottom:1px solid var(--line-soft);">
    <span style="color:var(--accent-1);font-family:var(--font-label);font-variant-numeric:tabular-nums;font-size:24px;">09</span>
    <span>Durable session store</span>
  </div>
  <div style="display:grid;grid-template-columns:60px 1fr;align-items:baseline;gap:18px;padding-bottom:14px;border-bottom:1px solid var(--line-soft);">
    <span style="color:var(--accent-1);font-family:var(--font-label);font-variant-numeric:tabular-nums;font-size:24px;">10</span>
    <span>Subagent affordance</span>
  </div>
</div>

<div class="spacer" style="flex:0.3"></div>

<p class="body" style="color:var(--muted);font-family:var(--font-serif);font-style:italic;text-align:center;">
Don't reinvent &mdash; use the settled architecture; build what you need on top.
</p>

<!--
[speaker notes]
- If you're building an agent in 2026, this is the floor — not the ceiling.
- Each item isn't an aspirational feature, it's the current expectation.
- Ten: streaming model+tool loop, schema-validated tool registry, SKILL.md loader, AGENTS.md walk, compaction stage, permissions or sandbox, MCP support or explicit refusal, ACP server, durable session store, subagent affordance.
- Nothing needs to be invented — each item is present in at least one of the five examples; most are present in all.
- The interesting work in 2026: building your setup on top of the settled architecture.
-->

---

<!-- _class: hero-slide -->

<div class="eyebrow h-eyebrow-block">Closing</div>

<p class="hero-text">
Architecture has <em>settled</em>.<br />
<span style="color:var(--muted);font-style:italic;font-size:0.7em;">Shared, common building blocks ―</span><br />
<span style="color:var(--muted);font-style:italic;font-size:0.7em;">Customized surface.</span>
</p>

<p style="font-family:var(--font-title);font-size:80px;margin-top:60px;color:var(--accent-1);">
Build on it.
</p>

<!--
[speaker notes]
- Restating the thesis: modern AI agent architecture has settled.
- The same building blocks — agent loop, three roles, tool calling, MCP, ACP, SKILL.md, AGENTS.md, compaction, permissions — are common to all five examples.
- The interesting work in 2026 isn't reinventing the building blocks; it's building your setup on top of them.
- Because the substrate has stabilized, the build cost is much lower than in 2022.
- Build on it.
-->

---

<!-- _class: title-slide -->

<div class="ribbon" style="margin:0 auto 40px;"></div>

# <span style="text-align:center;display:block;">Thanks.</span>

<p class="subtitle" style="text-align:center;margin:0 auto;">Q&A</p>

<!--
[speaker notes]
- Thanks. Questions, objections, refusals — all welcome.
- Docs corpus: per-agent docs · comparison · research · references.
-->
