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
    --font-serif: "Newsreader", Georgia, serif;
    --font-sans:  "Geist", "Inter", -apple-system, sans-serif;
    --font-mono:  "JetBrains Mono", ui-monospace, monospace;
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

  /* STYLE.md — color-only accent */
  .accent { color: var(--accent-1); }
  /* STYLE.md — backtick / mono for protocols & file artifacts */
  code { font-family: var(--font-mono); color: var(--accent-1); background: rgba(200,85,61,0.07); padding: 0 8px; border-radius: 3px; font-size: 0.92em; }

  .eyebrow {
    font-family: var(--font-label);
    font-size: var(--type-eyebrow);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent-1);
    margin-bottom: var(--gap-tight);
  }
  .title    { font-size: var(--type-title); font-family: var(--font-title); line-height: 1.04; max-width: 1500px; }
  .lede     { font-size: var(--type-lede); line-height: 1.3; max-width: 1500px; color: var(--fg); }
  .body     { font-size: var(--type-body); line-height: 1.45; color: var(--fg); }
  .small    { font-size: var(--type-small); color: var(--muted); line-height: 1.4; }
  .numeral  { font-family: var(--font-title); font-size: var(--type-numeral); line-height: 0.9; letter-spacing: -0.04em; color: var(--accent-1); }
  .spacer   { flex: 1; }

  section.title-slide { justify-content: center; }
  section.title-slide h1 { font-size: 140px; line-height: 0.98; letter-spacing: -0.025em; max-width: 1500px; }
  section.title-slide .meta { font-family: var(--font-label); font-size: var(--type-small); letter-spacing: 0.06em; color: var(--muted); margin-top: 64px; display: flex; gap: 28px; align-items: baseline; }
  section.title-slide .meta b { font-weight: 500; color: var(--fg); }
  section.title-slide .ribbon { width: 220px; height: 1px; background: var(--accent-1); margin-bottom: 40px; }

  section.hero-slide { justify-content: center; align-items: flex-start; }
  section.hero-slide .hero-text { font-family: var(--font-title); font-size: 96px; line-height: 1.05; letter-spacing: -0.02em; max-width: 1600px; text-wrap: balance; }
  section.hero-slide .hero-text em { color: var(--accent-1); font-style: normal; }
  .h-eyebrow-block { margin-bottom: var(--gap-title); }

  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; flex: 1; min-height: 0; }
  .col-head { font-family: var(--font-label); font-size: var(--type-eyebrow); letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin-bottom: 24px; display: flex; align-items: center; gap: 14px; }
  .col-head .dot { width: 12px; height: 12px; border-radius: 50%; background: var(--accent-1); }
  .col-head .dot.alt { background: var(--accent-3); }

  ol.steps, ul.bare { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: var(--gap-item); }
  ol.steps li { display: grid; grid-template-columns: 64px 1fr; gap: 20px; align-items: baseline; font-size: var(--type-body); line-height: 1.35; }
  ol.steps li::before { counter-increment: step; content: counter(step, decimal-leading-zero); font-family: var(--font-label); font-size: var(--type-small); color: var(--accent-1); font-variant-numeric: tabular-nums; letter-spacing: 0.06em; }
  ol.steps { counter-reset: step; }

  .card { background: var(--card); border: 1px solid var(--line-soft); border-radius: 8px; padding: 32px 36px; }

  /* Generic table */
  table.deck { width: 100%; border-collapse: collapse; font-size: 28px; }
  table.deck th, table.deck td { padding: 18px 20px; border-bottom: 1px solid var(--line-soft); text-align: left; vertical-align: baseline; }
  table.deck th { font-family: var(--font-label); font-size: 22px; letter-spacing: 0.10em; text-transform: uppercase; color: var(--muted); font-weight: 500; }
  table.deck td.k { font-family: var(--font-mono); color: var(--accent-1); font-size: 24px; }
  table.deck td.q { font-family: var(--font-serif); font-style: italic; color: var(--accent-1); }
  table.deck td.ar { color: var(--accent-1); text-align: center; width: 60px; }

  /* SVG helpers */
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
  svg .label-mono   { font-family: var(--font-mono); font-size: 24px; fill: var(--accent-1); }

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

  .layered { display: flex; flex-direction: column; gap: 14px; }
  .layer { border: 1px solid var(--line); background: var(--paper); padding: 36px 40px; border-radius: 6px; display: flex; align-items: baseline; justify-content: space-between; gap: 24px; }
  .layer .l-name { font-family: var(--font-title); font-size: 36px; }
  .layer .l-sub { font-family: var(--font-label); font-size: var(--type-small); color: var(--muted); letter-spacing: 0.06em; text-transform: uppercase; }
  .layer.accent { border-color: var(--accent-1); }
  .layer.accent .l-name { color: var(--accent-1); }
  .protocol-arrow { text-align: center; font-family: var(--font-label); font-size: 24px; letter-spacing: 0.14em; color: var(--accent-1); text-transform: uppercase; padding: 6px 0; }

  .standards-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
  .std-card { border: 1px solid var(--line); background: var(--paper); padding: 36px 32px; border-radius: 8px; display: flex; flex-direction: column; gap: 16px; }
  .std-card .s-name { font-family: var(--font-title); font-size: 56px; line-height: 1; color: var(--accent-1); }
  .std-card .s-tag { font-family: var(--font-label); font-size: 24px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
  .std-card .s-date { font-family: var(--font-label); font-size: 24px; letter-spacing: 0.06em; color: var(--muted); }

  .checklist { display: grid; grid-template-columns: 1fr 1fr; gap: 24px 56px; }
  .check-item { display: grid; grid-template-columns: 36px 1fr; align-items: baseline; gap: 18px; font-size: 28px; line-height: 1.3; padding-bottom: 22px; border-bottom: 1px solid var(--line-soft); }
  .check-item .ck { color: var(--accent-1); font-family: var(--font-label); font-size: 24px; }
---

<!-- _class: title-slide -->

<div class="ribbon"></div>

# <span>Modern</span> <span class="accent" style="font-style:italic;">AI Agents</span>

<div class="meta">
  <span><b>30–40 min</b></span>
  <span>·</span>
  <span>May 2026</span>
</div>

---

<div class="eyebrow">30-second story</div>

## <span class="title">Three threads, one convergence.</span>

<div class="spacer"></div>

<svg viewBox="0 0 1680 660" style="width:100%;height:auto;max-height:640px;">
  <rect x="710" y="148" width="260" height="88" rx="6" class="stroke fill-paper" stroke-width="1.5" />
  <text x="840" y="184" text-anchor="middle" class="label-title">Transformer</text>
  <text x="840" y="220" text-anchor="middle" class="label-tiny">2017</text>

  <path d="M 840 236 C 840 270, 280 270, 280 300" class="stroke-1" stroke-width="1.5" fill="none" />
  <path d="M 840 236 L 840 300" class="stroke-1" stroke-width="1.5" />
  <path d="M 840 236 C 840 270, 1400 270, 1400 300" class="stroke-1" stroke-width="1.5" fill="none" />

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

  <text x="1400" y="312" text-anchor="middle" class="label-accent">Learned to Coordinate</text>
  <rect x="1200" y="332" width="400" height="200" rx="6" class="stroke fill-paper" stroke-width="1" />
  <text x="1400" y="372" text-anchor="middle" class="label-title">Orchestration</text>
  <text x="1400" y="408" text-anchor="middle" class="label-muted">LangChain · Oct 2022</text>
  <text x="1400" y="436" text-anchor="middle" class="label-muted">AutoGPT · Mar 2023</text>
  <text x="1400" y="464" text-anchor="middle" class="label-muted">AGENTS.md · Aug 2025</text>
  <text x="1400" y="492" text-anchor="middle" class="label-muted">SKILL.md · Oct 2025</text>

  <path d="M 280 532 C 280 580, 840 580, 840 596" class="stroke-1" stroke-width="1.5" fill="none" />
  <path d="M 840 532 L 840 596" class="stroke-1" stroke-width="1.5" />
  <path d="M 1400 532 C 1400 580, 840 580, 840 596" class="stroke-1" stroke-width="1.5" fill="none" />
  <rect x="640" y="596" width="400" height="56" rx="6" class="fill-1" />
  <text x="840" y="630" text-anchor="middle" class="label-title" fill="var(--bg)" style="font-size:26px">Today's Agents · 2026</text>
</svg>

---

<!-- _class: hero-slide -->

<div class="eyebrow h-eyebrow-block">Thesis</div>

<p class="hero-text">
Agents <em>agree</em> more than they disagree.<br />
<span style="color:var(--muted);font-size:0.6em;">What remains is <em>editorial</em>.</span>
</p>

---

<div class="eyebrow">Predict → Follow</div>

## <span class="title">The model learned to follow instructions.</span>

<div class="spacer" style="flex:0.6"></div>

<div class="two-col" style="gap:60px;">
  <div>
    <div class="col-head"><span class="dot" style="background:var(--muted);"></span><span>Before · 2018</span></div>
    <div class="card" style="font-family:var(--font-mono);font-size:24px;line-height:1.6;">
      <div style="color:var(--muted);font-size:24px;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:18px;">prompt</div>
      <div>The weather today is</div>
      <div style="color:var(--accent-1);margin-top:14px;">→ clear and sunny…</div>
    </div>
  </div>
  <div>
    <div class="col-head"><span class="dot"></span><span>After · 2022</span></div>
    <div class="card" style="font-family:var(--font-mono);font-size:24px;line-height:1.6;">
      <div style="color:var(--muted);font-size:24px;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:18px;">prompt</div>
      <div>Organize my email.</div>
      <div style="color:var(--accent-1);margin-top:14px;">→ By what criteria?</div>
    </div>
  </div>
</div>

<div class="spacer" style="flex:0.4"></div>

<p class="small" style="text-align:center;">
<span style="color:var(--accent-1);font-family:var(--font-label);letter-spacing:.08em;text-transform:uppercase;">scale&nbsp;·&nbsp;instruction tuning&nbsp;·&nbsp;RLHF</span>
</p>

---

<div class="eyebrow">Chat model</div>

## <span class="title">Three roles, every chat model.</span>

<div class="spacer" style="flex:0.5"></div>

<div style="display:grid;grid-template-columns:1fr 1.2fr;gap:80px;align-items:center;">
  <svg viewBox="0 0 640 480" style="width:100%;height:auto;">
    <rect x="20" y="20" width="600" height="124" rx="8" class="stroke fill-paper" stroke-width="1.5" />
    <text x="50" y="58" class="label-accent">system</text>
    <text x="50" y="102" class="label" style="font-size:26px;">rules</text>
    <rect x="20" y="164" width="600" height="124" rx="8" class="stroke fill-paper" stroke-width="1.5" />
    <text x="50" y="202" class="label-accent">user</text>
    <text x="50" y="246" class="label" style="font-size:26px;">input</text>
    <rect x="20" y="308" width="600" height="124" rx="8" class="fill-1" />
    <text x="50" y="346" class="label-accent" style="fill:var(--bg);">assistant</text>
    <text x="50" y="390" class="label" style="font-size:26px;fill:var(--bg);">reply</text>
  </svg>
  <div>
    <p class="lede" style="margin-bottom:32px;"><code>Chat Completions API</code></p>
    <p class="small" style="color:var(--accent-1);font-family:var(--font-label);letter-spacing:.08em;text-transform:uppercase;">
      OpenAI · <code>gpt-3.5-turbo</code> · Mar 2023
    </p>
  </div>
</div>

<div class="spacer"></div>

---

<div class="eyebrow">Learned to Think</div>

## <span class="title">Reasoning became a separate output channel.</span>

<div class="spacer" style="flex:0.5"></div>

<svg viewBox="0 0 1680 360" style="width:100%;height:auto;">
  <rect x="40"   y="60" width="440" height="200" rx="6" class="stroke fill-paper" stroke-width="1.5" />
  <text x="260" y="106" text-anchor="middle" class="label-accent">Stage 1 · prompt trick</text>
  <text x="260" y="156" text-anchor="middle" class="label-title">Chain of Thought</text>
  <text x="260" y="198" text-anchor="middle" class="label-muted" style="font-family:var(--font-serif);font-style:italic;font-size:26px;">step by step</text>
  <text x="260" y="230" text-anchor="middle" class="label-tiny">Wei · Kojima · 2022</text>
  <line x1="500" y1="160" x2="600" y2="160" class="stroke-1" stroke-width="1.5" />
  <path d="M 590 154 L 600 160 L 590 166" class="stroke-1" stroke-width="1.5" fill="none" />
  <rect x="620" y="60" width="440" height="200" rx="6" class="stroke fill-paper" stroke-width="1.5" />
  <text x="840" y="106" text-anchor="middle" class="label-accent">Stage 2 · trained</text>
  <text x="840" y="156" text-anchor="middle" class="label-title">Trained reasoners</text>
  <text x="840" y="198" text-anchor="middle" class="label-muted">o1 · R1 · extended thinking</text>
  <text x="840" y="230" text-anchor="middle" class="label-tiny">Sep 2024 → Feb 2025</text>
  <line x1="1080" y1="160" x2="1180" y2="160" class="stroke-1" stroke-width="1.5" />
  <path d="M 1170 154 L 1180 160 L 1170 166" class="stroke-1" stroke-width="1.5" fill="none" />
  <rect x="1200" y="60" width="440" height="200" rx="6" class="fill-1" />
  <text x="1420" y="106" text-anchor="middle" class="label-accent" style="fill:var(--bg)">Today</text>
  <text x="1420" y="156" text-anchor="middle" class="label-title" style="fill:var(--bg)">Reasoning + Answer</text>
  <text x="1420" y="198" text-anchor="middle" style="fill:var(--bg);font-family:var(--font-label);font-size:24px;opacity:.85;">2 output channels</text>
</svg>

---

<div class="eyebrow">Learned to Act</div>

## <span class="title">Tool use as a protocol.</span>

<div class="spacer" style="flex:0.3"></div>

<svg viewBox="0 0 1680 520" style="width:100%;height:auto;max-height:540px;">
  <g class="stroke-line" stroke-width="1" stroke-dasharray="3 6">
    <line x1="240"  y1="80" x2="240"  y2="500" />
    <line x1="840"  y1="80" x2="840"  y2="500" />
    <line x1="1440" y1="80" x2="1440" y2="500" />
  </g>
  <rect x="140"  y="36" width="200" height="56" rx="4" class="fill-paper stroke" stroke-width="1.5" />
  <text x="240"  y="72" text-anchor="middle" class="label-title" style="font-size:26px">User</text>
  <rect x="740"  y="36" width="200" height="56" rx="4" class="fill-1" />
  <text x="840"  y="72" text-anchor="middle" class="label-title" style="font-size:26px;fill:var(--bg)">Model</text>
  <rect x="1340" y="36" width="200" height="56" rx="4" class="fill-paper stroke-3" stroke-width="2" />
  <text x="1440" y="72" text-anchor="middle" class="label-title" style="font-size:26px;fill:var(--accent-3)">Tool</text>
  <line x1="240" y1="140" x2="836" y2="140" class="stroke" stroke-width="1.5" />
  <path d="M 830 134 L 840 140 L 830 146" class="stroke" stroke-width="1.5" fill="none" />
  <text x="540" y="128" text-anchor="middle" class="label-tiny">query</text>
  <line x1="840" y1="220" x2="1436" y2="220" class="stroke-1" stroke-width="2" />
  <path d="M 1430 214 L 1440 220 L 1430 226" class="stroke-1" stroke-width="2" fill="none" />
  <text x="1140" y="208" text-anchor="middle" class="label-mono">get_weather(city: "SF")</text>
  <text x="1140" y="244" text-anchor="middle" class="label-tiny">structured call</text>
  <line x1="1440" y1="320" x2="844" y2="320" class="stroke-3" stroke-width="2" />
  <path d="M 850 314 L 840 320 L 850 326" class="stroke-3" stroke-width="2" fill="none" />
  <text x="1140" y="308" text-anchor="middle" class="label-mono" style="fill:var(--accent-3);">{ temp: 62, conditions: "foggy" }</text>
  <line x1="840" y1="420" x2="244" y2="420" class="stroke" stroke-width="1.5" />
  <path d="M 250 414 L 240 420 L 250 426" class="stroke" stroke-width="1.5" fill="none" />
  <text x="540" y="408" text-anchor="middle" class="label-tiny">answer</text>
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
<span style="color:var(--accent-1);font-family:var(--font-label);letter-spacing:.08em;text-transform:uppercase;">function calling · OpenAI · Jun 13, 2023</span>
</p>

---

<div class="eyebrow">Think · Act · Observe</div>

## <span class="title">The agent loop.</span>

<div class="spacer" style="flex:0.3"></div>

<div style="display:grid;grid-template-columns:1.1fr 1fr;gap:80px;align-items:center;">
  <svg viewBox="0 0 720 540" style="width:100%;height:auto;">
    <circle cx="360" cy="270" r="200" class="stroke-line" stroke-width="1.5" fill="none" />
    <circle cx="360" cy="70" r="74" class="fill-1" />
    <text x="360" y="64" text-anchor="middle" style="fill:var(--bg);font-family:var(--font-title);font-size:30px;">Think</text>
    <text x="360" y="92" text-anchor="middle" style="fill:var(--bg);font-family:var(--font-label);font-size:24px;letter-spacing:.06em;text-transform:uppercase;opacity:.8;">model</text>
    <circle cx="533" cy="370" r="74" class="fill-3" />
    <text x="533" y="364" text-anchor="middle" style="fill:var(--bg);font-family:var(--font-title);font-size:30px;">Act</text>
    <text x="533" y="392" text-anchor="middle" style="fill:var(--bg);font-family:var(--font-label);font-size:24px;letter-spacing:.06em;text-transform:uppercase;opacity:.8;">tool call</text>
    <circle cx="187" cy="370" r="74" class="fill-2" />
    <text x="187" y="364" text-anchor="middle" style="fill:var(--fg);font-family:var(--font-title);font-size:30px;">Observe</text>
    <text x="187" y="392" text-anchor="middle" style="fill:var(--fg);font-family:var(--font-label);font-size:24px;letter-spacing:.06em;text-transform:uppercase;opacity:.75;">result</text>
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
    <p class="lede" style="margin-bottom:32px;">One trip = one model call.</p>
    <p class="small" style="color:var(--accent-1);font-family:var(--font-label);letter-spacing:.08em;text-transform:uppercase;">
      <code>ReAct</code> · Yao et al. · Oct 2022
    </p>
  </div>
</div>

<div class="spacer"></div>

---

<div class="eyebrow">Learned to Coordinate</div>

## <span class="title">The orchestration framework wave.</span>

<div class="spacer" style="flex:0.4"></div>

<div class="timeline">
  <div class="pt above"><span class="lbl">LangChain</span><span class="date">Oct 2022</span></div>
  <div class="pt below"><span class="lbl">ChatGPT</span><span class="date">Nov 2022</span></div>
  <div class="pt above major"><span class="lbl">AutoGPT</span><span class="date">Mar 2023</span></div>
  <div class="pt below"><span class="lbl">BabyAGI</span><span class="date">Apr 2023</span></div>
  <div class="pt above"><span class="lbl">AutoGen</span><span class="date">Aug 2023</span></div>
  <div class="pt below"><span class="lbl">CrewAI</span><span class="date">Jan 2024</span></div>
  <div class="pt above major"><span class="lbl">MCP</span><span class="date">Nov 2024</span></div>
</div>

<div class="spacer" style="flex:0.4"></div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:80px;margin-top:32px;">
  <div>
    <div class="numeral" style="font-size:120px;">5 months</div>
    <p class="small"><code>ReAct</code> → AutoGPT</p>
  </div>
  <div style="align-self:end;">
    <div class="numeral" style="font-size:120px;">30K</div>
    <p class="small">AutoGPT stars in 13 days · 100K in weeks</p>
  </div>
</div>

---

<div class="eyebrow">After the wave</div>

## <span class="title">Less framework, more discipline.</span>

<div class="spacer" style="flex:0.4"></div>

<div class="two-col">
  <div>
    <div class="col-head"><span class="dot"></span><span>12-Factor Agents</span></div>
    <ol class="steps" style="margin-top:18px;">
      <li><span><b style="font-family:var(--font-title);font-size:40px;">Own your prompts.</b></span></li>
      <li><span><b style="font-family:var(--font-title);font-size:40px;">Own your context.</b></span></li>
      <li><span><b style="font-family:var(--font-title);font-size:40px;">Own your control flow.</b></span></li>
    </ol>
  </div>
  <div style="align-self:center;">
    <p class="lede" style="line-height:1.25;">
      <span class="accent">orchestration</span> small<br />
      <span class="accent">integration</span> standardized
    </p>
    <p class="small" style="margin-top:36px;color:var(--accent-1);font-family:var(--font-label);letter-spacing:.08em;text-transform:uppercase;">
      <code>MCP</code> · Nov 2024
    </p>
  </div>
</div>

<div class="spacer"></div>

---

<div class="eyebrow">Steering & Guardrailing</div>

## <span class="title">Constrain & Steer.</span>

<div class="spacer" style="flex:0.4"></div>

<div class="two-col">
  <div>
    <div class="col-head" style="color:var(--accent-1);">
      <span class="dot"></span><span>Constrain</span>
    </div>
    <ul class="bare" style="margin-top:18px;font-size:28px;line-height:1.5;">
      <li style="border-bottom:1px solid var(--line-soft);padding:18px 0;">Refusal training</li>
      <li style="border-bottom:1px solid var(--line-soft);padding:18px 0;">Output filters</li>
      <li style="border-bottom:1px solid var(--line-soft);padding:18px 0;">Sandbox</li>
      <li style="padding:18px 0;">Permission prompts</li>
    </ul>
  </div>
  <div>
    <div class="col-head" style="color:var(--accent-3);">
      <span class="dot" style="background:var(--accent-3);"></span><span>Steer</span>
    </div>
    <ul class="bare" style="margin-top:18px;font-size:28px;line-height:1.5;">
      <li style="border-bottom:1px solid var(--line-soft);padding:18px 0;">System prompt</li>
      <li style="border-bottom:1px solid var(--line-soft);padding:18px 0;">Structured output</li>
      <li style="border-bottom:1px solid var(--line-soft);padding:18px 0;">Tool registry trimming</li>
      <li style="padding:18px 0;">Verdict contracts</li>
    </ul>
  </div>
</div>

<div class="spacer" style="flex:0.5"></div>

<p class="lede" style="text-align:center;color:var(--accent-1);max-width:1400px;margin:0 auto;">
Don't ask politely — remove the capability.
</p>

---

<div class="eyebrow">12 months</div>

## <span class="title">Four cross-vendor standards.</span>

<div class="spacer" style="flex:0.4"></div>

<div class="standards-row">
  <div class="std-card">
    <div class="s-tag">Tool bridge</div>
    <div class="s-name">MCP</div>
    <div class="s-date">Anthropic · Nov 2024</div>
  </div>
  <div class="std-card">
    <div class="s-tag">Project context</div>
    <div class="s-name">AGENTS.md</div>
    <div class="s-date">OpenAI Codex · Aug 2025</div>
  </div>
  <div class="std-card">
    <div class="s-tag">Editor bridge</div>
    <div class="s-name">ACP</div>
    <div class="s-date">Zed · Aug 2025</div>
  </div>
  <div class="std-card">
    <div class="s-tag">Capability artifact</div>
    <div class="s-name">SKILL.md</div>
    <div class="s-date">Anthropic · Oct 2025</div>
  </div>
</div>

<div class="spacer" style="flex:0.4"></div>

<p class="small" style="color:var(--muted);text-align:center;">
<code>MCP</code> · <code>AGENTS.md</code> → Agentic AI Foundation (Linux Foundation), Dec 9, 2025
</p>

---

<div class="eyebrow">How they fit</div>

## <span class="title">Three layers, three protocols.</span>

<div class="spacer" style="flex:0.3"></div>

<div class="layered" style="max-width:1100px;margin:0 auto;width:100%;">
  <div class="layer">
    <div class="l-name">Editor</div>
    <div class="l-sub">Zed · VS Code</div>
  </div>
  <div class="protocol-arrow">↕&nbsp;&nbsp;ACP</div>
  <div class="layer accent">
    <div class="l-name">Agent</div>
    <div class="l-sub">claude-code · opencode</div>
  </div>
  <div class="protocol-arrow">↕&nbsp;&nbsp;MCP</div>
  <div class="layer">
    <div class="l-name">Tools & Resources</div>
    <div class="l-sub">GitHub · Postgres · Slack</div>
  </div>
</div>

<div class="spacer"></div>

---

<div class="eyebrow">Capability artifact</div>

## <span class="title"><code>SKILL.md</code> — load on demand.</span>

<div class="spacer" style="flex:0.3"></div>

<svg viewBox="0 0 1680 320" style="width:100%;height:auto;">
  <rect x="40" y="60" width="400" height="200" rx="6" class="stroke fill-paper" stroke-width="1.5" />
  <text x="240" y="100" text-anchor="middle" class="label-accent">Stage 1</text>
  <text x="240" y="148" text-anchor="middle" class="label-title">Discovery</text>
  <text x="240" y="184" text-anchor="middle" class="label" style="font-size:24px;fill:var(--muted)">name + description</text>
  <text x="240" y="220" text-anchor="middle" class="label-tiny">~100 tokens</text>
  <line x1="460" y1="160" x2="580" y2="160" class="stroke-1" stroke-width="1.5" />
  <path d="M 570 154 L 580 160 L 570 166" class="stroke-1" stroke-width="1.5" fill="none" />
  <rect x="600" y="60" width="400" height="200" rx="6" class="stroke fill-paper" stroke-width="1.5" />
  <text x="800" y="100" text-anchor="middle" class="label-accent">Stage 2</text>
  <text x="800" y="148" text-anchor="middle" class="label-title">Activation</text>
  <text x="800" y="184" text-anchor="middle" class="label" style="font-size:24px;fill:var(--muted)">full body</text>
  <line x1="1020" y1="160" x2="1140" y2="160" class="stroke-1" stroke-width="1.5" />
  <path d="M 1130 154 L 1140 160 L 1130 166" class="stroke-1" stroke-width="1.5" fill="none" />
  <rect x="1160" y="60" width="400" height="200" rx="6" class="fill-1" />
  <text x="1360" y="100" text-anchor="middle" class="label-accent" style="fill:var(--bg)">Stage 3</text>
  <text x="1360" y="148" text-anchor="middle" class="label-title" style="fill:var(--bg)">Execution</text>
  <text x="1360" y="184" text-anchor="middle" style="fill:var(--bg);font-family:var(--font-label);font-size:24px;opacity:.85;">scripts</text>
</svg>

<div class="spacer" style="flex:0.3"></div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:80px;margin-top:24px;align-items:center;">
  <div>
    <div style="font-family:var(--font-mono);font-size:40px;line-height:1.4;color:var(--fg);">
      30 × 100<br /><span style="color:var(--accent-3);">≈ 3K tokens (startup)</span>
    </div>
  </div>
  <div>
    <div style="font-family:var(--font-mono);font-size:40px;line-height:1.4;color:var(--muted);text-decoration:line-through;text-decoration-color:var(--accent-1);">
      30 × 2K<br /><span>≈ 60K tokens (eager)</span>
    </div>
  </div>
</div>

---

<div class="eyebrow">Examples</div>

## <span class="title">Five surfaces, one shape.</span>

<div class="spacer" style="flex:0.3"></div>

<table class="deck" style="font-size:30px;">
  <thead>
    <tr><th>Agent</th><th>Maker</th><th>Editorial stance</th></tr>
  </thead>
  <tbody>
    <tr>
      <td class="k">claude-code</td>
      <td>Anthropic</td>
      <td class="q">Layered platform.</td>
    </tr>
    <tr>
      <td class="k">opencode</td>
      <td>SST</td>
      <td class="q">Typed protocol surface.</td>
    </tr>
    <tr>
      <td class="k">openclaw</td>
      <td>Community</td>
      <td class="q">Single-operator gateway.</td>
    </tr>
    <tr>
      <td class="k">hermes-agent</td>
      <td>Nous Research</td>
      <td class="q">Self-improving environment.</td>
    </tr>
    <tr>
      <td class="k">pi-mono</td>
      <td>M. Zechner</td>
      <td class="q">Core + extensions.</td>
    </tr>
  </tbody>
</table>

<div class="spacer"></div>

---

<div class="eyebrow">Ecosystem composes</div>

## <span class="title">Family tree.</span>

<div class="spacer" style="flex:0.2"></div>

<svg viewBox="0 0 1680 580" style="width:100%;height:auto;">
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
  <text x="860" y="492" text-anchor="middle" class="label-title">5 nested</text>
  <text x="860" y="528" text-anchor="middle" class="label-tiny">Codex · Gemini CLI · …</text>
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
  <text x="540"  y="80"  text-anchor="middle" class="label-tiny" style="fill:var(--accent-1);">SKILL.md</text>
  <text x="540"  y="396" text-anchor="middle" class="label-tiny" style="fill:var(--accent-1);">embeds</text>
  <text x="1150" y="278" text-anchor="middle" class="label-tiny" style="fill:var(--accent-1);">evolved</text>
  <text x="880"  y="396" class="label-tiny" style="fill:var(--accent-1);">ACP</text>
</svg>

<div class="spacer" style="flex:0.3"></div>

<p class="small" style="text-align:center;color:var(--accent-3);">
Standardization, followed by evolution.
</p>

---

<div class="eyebrow">Universal pattern</div>

## <span class="title">One loop. <span class="accent">Many policies.</span></span>

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
  <text x="60"   y="124" class="label-title" style="font-size:26px;">Interactive</text>
  <rect x="40"   y="436" width="430" height="124" rx="6" class="fill-paper stroke" stroke-width="1" />
  <text x="60"   y="474" class="label-accent">prompt B</text>
  <text x="60"   y="504" class="label" style="font-size:24px;fill:var(--muted);font-style:italic;font-family:var(--font-serif);">read-only</text>
  <text x="60"   y="540" class="label-title" style="font-size:26px;">Explore</text>
  <rect x="1210" y="20"  width="430" height="124" rx="6" class="fill-paper stroke" stroke-width="1" />
  <text x="1230" y="58"  class="label-accent">prompt C</text>
  <text x="1230" y="88"  class="label" style="font-size:24px;fill:var(--muted);font-style:italic;font-family:var(--font-serif);">denylist mutators</text>
  <text x="1230" y="124" class="label-title" style="font-size:26px;">Verify</text>
  <rect x="1210" y="436" width="430" height="124" rx="6" class="fill-paper stroke" stroke-width="1" />
  <text x="1230" y="474" class="label-accent">prompt D</text>
  <text x="1230" y="504" class="label" style="font-size:24px;fill:var(--muted);font-style:italic;font-family:var(--font-serif);">no user</text>
  <text x="1230" y="540" class="label-title" style="font-size:26px;">Compact</text>
</svg>

---

<div class="eyebrow">Universals</div>

## <span class="title">Six shared building blocks.</span>

<div class="spacer" style="flex:0.3"></div>

<div class="checklist">
  <div class="check-item"><span class="ck">✓</span><span>One loop, many policies</span></div>
  <div class="check-item"><span class="ck">✓</span><span>Methodology in prompts, not state</span></div>
  <div class="check-item"><span class="ck">✓</span><span>Compaction as control flow</span></div>
  <div class="check-item"><span class="ck">✓</span><span>Streaming + parallel tool execution</span></div>
  <div class="check-item"><span class="ck">✓</span><span><code>SKILL.md</code> + <code>AGENTS.md</code> as artifacts</span></div>
  <div class="check-item"><span class="ck">✓</span><span><code>ACP</code> for editors, <code>MCP</code> for tools</span></div>
</div>

<div class="spacer"></div>

---

<div class="eyebrow">Configurable axes</div>

## <span class="title">Six knobs on the shared base.</span>

<div class="spacer" style="flex:0.2"></div>

<table class="deck" style="font-size:28px;">
  <tbody>
    <tr><td style="text-align:right;">Server-first</td><td class="ar">vs</td><td>Binary-first</td></tr>
    <tr><td style="text-align:right;"><code>MCP</code> built-in</td><td class="ar">vs</td><td><code>MCP</code> via bridge</td></tr>
    <tr><td style="text-align:right;">Sandbox in core</td><td class="ar">vs</td><td>Sandbox in deployment</td></tr>
    <tr><td style="text-align:right;">Curated memory</td><td class="ar">vs</td><td>Stateless session</td></tr>
    <tr><td style="text-align:right;">Subagents first-class</td><td class="ar">vs</td><td>Single agent</td></tr>
    <tr><td style="text-align:right;">Multi-tenant</td><td class="ar">vs</td><td>Single-operator</td></tr>
  </tbody>
</table>

<div class="spacer"></div>

---

<div class="eyebrow">Canonical shape · 2026</div>

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

<div class="spacer"></div>

---

<div class="eyebrow">Pick a pattern</div>

## <span class="title">Same shape, different setup.</span>

<div class="spacer" style="flex:0.3"></div>

<table class="deck" style="font-size:28px;">
  <thead>
    <tr><th style="text-align:left;">Problem class</th><th></th><th>Pattern</th></tr>
  </thead>
  <tbody>
    <tr><td>Solo, hand-buildable</td><td class="ar">→</td><td class="k">pi-mono</td></tr>
    <tr><td>Coding agent as platform</td><td class="ar">→</td><td class="k">claude-code</td></tr>
    <tr><td>Everywhere — terminal · web · IDE · mobile</td><td class="ar">→</td><td class="k">opencode</td></tr>
    <tr><td>Chat-platform assistant, single-operator</td><td class="ar">→</td><td class="k">openclaw</td></tr>
    <tr><td>Self-improving + training environment</td><td class="ar">→</td><td class="k">hermes-agent</td></tr>
  </tbody>
</table>

<div class="spacer"></div>

<p class="small" style="color:var(--muted);text-align:center;">
Not "which agent is best." Which problem class.
</p>

---

<div class="eyebrow">2026 floor</div>

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
    <span><code>SKILL.md</code> loader</span>
  </div>
  <div style="display:grid;grid-template-columns:60px 1fr;align-items:baseline;gap:18px;padding-bottom:14px;border-bottom:1px solid var(--line-soft);">
    <span style="color:var(--accent-1);font-family:var(--font-label);font-variant-numeric:tabular-nums;font-size:24px;">04</span>
    <span><code>AGENTS.md</code> walk</span>
  </div>
  <div style="display:grid;grid-template-columns:60px 1fr;align-items:baseline;gap:18px;padding-bottom:14px;border-bottom:1px solid var(--line-soft);">
    <span style="color:var(--accent-1);font-family:var(--font-label);font-variant-numeric:tabular-nums;font-size:24px;">05</span>
    <span>Compaction stage</span>
  </div>
  <div style="display:grid;grid-template-columns:60px 1fr;align-items:baseline;gap:18px;padding-bottom:14px;border-bottom:1px solid var(--line-soft);">
    <span style="color:var(--accent-1);font-family:var(--font-label);font-variant-numeric:tabular-nums;font-size:24px;">06</span>
    <span>Permissions <span class="accent">/</span> sandbox</span>
  </div>
  <div style="display:grid;grid-template-columns:60px 1fr;align-items:baseline;gap:18px;padding-bottom:14px;border-bottom:1px solid var(--line-soft);">
    <span style="color:var(--accent-1);font-family:var(--font-label);font-variant-numeric:tabular-nums;font-size:24px;">07</span>
    <span><code>MCP</code> <span class="accent">/</span> explicit refusal</span>
  </div>
  <div style="display:grid;grid-template-columns:60px 1fr;align-items:baseline;gap:18px;padding-bottom:14px;border-bottom:1px solid var(--line-soft);">
    <span style="color:var(--accent-1);font-family:var(--font-label);font-variant-numeric:tabular-nums;font-size:24px;">08</span>
    <span><code>ACP</code> server</span>
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

<div class="spacer"></div>

<p class="small" style="color:var(--muted);text-align:center;">
Floor — not ceiling.
</p>

---

<!-- _class: hero-slide -->

<p class="hero-text" style="text-align:center;width:100%;">
<em>Build.</em>
</p>

---

<!-- _class: title-slide -->

<div class="ribbon" style="margin:0 auto 40px;"></div>

# <span style="text-align:center;display:block;">Thanks.</span>

<p class="small" style="text-align:center;margin:0 auto;color:var(--muted);">Q&amp;A</p>
