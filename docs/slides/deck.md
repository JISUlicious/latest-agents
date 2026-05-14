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

<p class="subtitle"><span>What is AI Agent,</span><br /><span>and how it works?</span></p>

<div class="meta">
  <span><b>60 min</b></span>
  <span>·</span>
  <span>Baseline</span>
  <span>·</span>
  <span>May 2026</span>
</div>

<!--
[발표 시 짚을 포인트]
- 안녕하세요. 약 60분 동안 함께 이야기 나눕니다.
- 한 줄 약속: 끝나고 나면 오늘날의 AI agents가 왜 다른지, 그리고 그들 사이에서 어떻게 고를지 이해할 수 있게 됩니다.
- 사전 AI 배경 지식은 필요 없습니다. 용어는 진행하면서 정의합니다.
- Q&A는 마지막에.
-->

---

<div class="eyebrow">요약</div>

## <span class="title">Reasoning, Tool, Orchestration</span>

<div class="spacer"></div>

<svg viewBox="0 0 1680 660" style="width:100%;height:auto;max-height:640px;">
  <!-- Trunk -->
  <rect x="710" y="148" width="260" height="88" rx="6" class="stroke fill-paper" stroke-width="1.5" />
  <text x="840" y="184" text-anchor="middle" class="label-title">Transformer</text>
  <text x="840" y="220" text-anchor="middle" class="label-tiny">2017</text>

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
[발표 시 짚을 포인트]
- AI agents는 단일 발명품이 아니다. 세 갈래가 병렬로 자라났다.
- 공통 기반: Transformer (2017).
- 그 위에서 reasoning, tool use, orchestration이 거의 동시에 발전 — 모두 오늘의 agents로 수렴.
- 이 도식이 talk 전체의 roadmap. 각 branch가 한 section.
-->

---

<!-- _class: hero-slide -->

<div class="eyebrow h-eyebrow-block">Thesis</div>

<p class="hero-text">
현재의 modern agent는<br />
하나의 <em>구조</em>로 수렴.<br />
<span style="color:var(--muted);font-style:italic;">Similar building blocks, </br>various surface.</span>
</p>

<!--
[발표 시 짚을 포인트]
- 결론을 먼저 던진다. 청중이 어디로 가는지 알면 인지 부담이 줄어든다.
- Architecture는 settled. 모든 modern agent — claude-code, opencode, pi-mono, hermes-agent, openclaw — 가 같은 building block 위에서 만들어진다.
- 차이는 *어떤 building block을 어떻게 조합하느냐*에 있다. 그러나 그 차이가 이 talk의 메시지가 아니다.
- 메시지: 이 building block들이 어떻게 evolve해서 지금의 architecture에 도달했는가.
- 이 슬라이드와 마지막 슬라이드 사이의 모든 내용이 이 주장을 뒷받침한다.
-->

---

<div class="eyebrow">목차</div>

## <span class="title">Five parts.</span>

<p class="subtitle">LLM에서 현재의 Agent 까지.</p>

<div class="spacer"></div>

<div class="parts">
  <div class="part-cell">
    <div class="pn">Part I</div>
    <div class="pt">How we got here</div>
    <div class="ps">Completion engine에서 agent loop까지. 2017–2023.</div>
  </div>
  <div class="part-cell">
    <div class="pn">Part II</div>
    <div class="pt">Modern toolkit</div>
    <div class="ps">Steering, guardrails, 네 가지 standards.</div>
  </div>
  <div class="part-cell">
    <div class="pn">Part III</div>
    <div class="pt">Today's agents</div>
    <div class="ps">Five Modern AI Agent Tools</div>
  </div>
  <div class="part-cell">
    <div class="pn">Part IV</div>
    <div class="pt">Settled patterns</div>
    <div class="ps">Architecture의 공통점</div>
  </div>
  <div class="part-cell">
    <div class="pn">Part V</div>
    <div class="pt">Synthesis</div>
    <div class="ps">2026년의 AI Agents</div>
  </div>
</div>

<div class="spacer"></div>

<!--
[발표 시 짚을 포인트]
- 전체 흐름의 지도. 다섯 부분.
- Part I — 어떻게 여기까지 왔는지. 단 예측에서 agent loop까지.
- Part II — 그 위에 modern toolkit (steering, standards)이 어떻게 쌓였는지.
- Part III — 그 결과 오늘의 agents가 어떤 모양이 됐는지. 다섯 examples로 본다.
- Part IV — 그 다섯이 공통으로 settle한 patterns.
- Part V — 종합. 한 도식, 그리고 2026의 floor.
- 역사는 빠르게, 현재의 architecture는 천천히.
- 한 section만 기억하신다면, Part IV — settled patterns.
-->

---

<!-- _class: section-slide -->

<div class="part-no">Part I</div>

<h2 class="part-title">How we got here.</h2>

<p class="part-blurb">Completion engine에서 agent loop까지.</p>

<div class="part-rule"></div>

---

<div class="eyebrow">지시를 따르는 LLM</div>

## <span class="title">Completion → Instruction.</span>

<div class="spacer" style="flex:0.6"></div>

<div class="two-col" style="gap:60px;">
  <div>
    <div class="col-head"><span class="dot" style="background:var(--muted);"></span><span>이전 · 2018</span></div>
    <div class="card" style="font-family:var(--font-mono);font-size:24px;line-height:1.6;">
      <div style="color:var(--muted);font-size:24px;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:18px;">prompt</div>
      <div>오늘 날씨는</div>
      <div style="color:var(--accent-1);margin-top:14px;">→ 맑고 화창합니다. 기온은 약 18도이며…</div>
      <div style="color:var(--muted);margin-top:22px;font-size:24px;font-style:italic;font-family:var(--font-serif);">다음 단어를 예측. 계속.</div>
    </div>
  </div>
  <div>
    <div class="col-head"><span class="dot"></span><span>이후 · 2022</span></div>
    <div class="card" style="font-family:var(--font-mono);font-size:24px;line-height:1.6;">
      <div style="color:var(--muted);font-size:24px;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:18px;">prompt</div>
      <div>메일 정리해줘</div>
      <div style="color:var(--accent-1);margin-top:14px;">→ 어떤 기준으로 정리할까요?</div>
      <div style="color:var(--muted);margin-top:22px;font-size:24px;font-style:italic;font-family:var(--font-serif);">지시를 따른다. 답한다.</div>
    </div>
  </div>
</div>

<div class="spacer" style="flex:0.4"></div>

<p class="small" style="text-align:center;">
<span style="color:var(--accent-1);font-family:var(--font-label);letter-spacing:.08em;text-transform:uppercase;">+ scale&nbsp;&nbsp;·&nbsp;&nbsp;+ instruction tuning&nbsp;&nbsp;·&nbsp;&nbsp;+ RLHF</span>
</p>

<!--
[발표 시 짚을 포인트]
- 2020년 이전, language model은 정교한 autocomplete였다. 다음 단어를 예측하는 일.
- GPT-3 (2020)가 한 가지를 보여줬다 — scale이 충분하면 같은 machinery가 자연어 instruction을 따른다.
- 세 ingredient: scale, instruction tuning, RLHF.
- Breakthrough는 architecture가 아니라 *interface*. 모델의 모양은 그대로, 우리가 대화하는 방식이 바뀌었다.
- 2022.11.30 ChatGPT가 이것을 모두에게 보이게 만들었다.
-->

---

<div class="eyebrow">Chat model</div>

## <span class="title">Three roles. One universal API.</span>

<div class="spacer" style="flex:0.5"></div>

<div style="display:grid;grid-template-columns:1fr 1.2fr;gap:80px;align-items:center;">
  <svg viewBox="0 0 640 480" style="width:100%;height:auto;">
    <rect x="20" y="20" width="600" height="124" rx="8" class="stroke fill-paper" stroke-width="1.5" />
    <text x="50" y="58" class="label-accent">system</text>
    <text x="50" y="102" class="label" style="font-size:26px;">model에게 주는 규칙</text>
    <text x="50" y="132" class="label-muted">(사용자에게는 보이지 않음)</text>
    <rect x="20" y="164" width="600" height="124" rx="8" class="stroke fill-paper" stroke-width="1.5" />
    <text x="50" y="202" class="label-accent">user</text>
    <text x="50" y="246" class="label" style="font-size:26px;">사용자가 입력하는 것</text>
    <rect x="20" y="308" width="600" height="124" rx="8" class="fill-1" />
    <text x="50" y="346" class="label-accent" style="fill:var(--bg);">assistant</text>
    <text x="50" y="390" class="label" style="font-size:26px;fill:var(--bg);">model이 답하는 것</text>
  </svg>
  <div>
    <p class="lede" style="margin-bottom:32px;">Chat Completions API.</p>
    <p class="body" style="color:var(--muted);max-width:600px;">
      OpenAI가 2023년 3월 gpt-3.5-turbo와 함께 도입.
      Anthropic, Google, Meta, Mistral, 모든 open-weight chat template이 따라갔다.
      한 format, 모든 vendor.
    </p>
    <p class="body" style="margin-top:32px;color:var(--accent-3);font-family:var(--font-serif);font-style:italic;">
      이후의 모든 capability — tool, reasoning, agents — 가 이 세 role frame 안에 있다.
    </p>
  </div>
</div>

<div class="spacer"></div>

<!--
[발표 시 짚을 포인트]
- 모든 chat-tuned model — Claude, GPT, Gemini, Llama, 모든 open-weight chat template까지 — 가 같은 세 message role을 쓴다.
- system: 보이지 않는 규칙. user: 사람이 입력. assistant: model이 답한다.
- 2023.03 OpenAI에서 시작, 모든 vendor가 채택. universal API.
- 이 talk의 나머지가 모두 이 세 role frame 안에서 일어난다.
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
  <text x="1420" y="106" text-anchor="middle" class="label-accent" style="fill:var(--bg)">오늘</text>
  <text x="1420" y="156" text-anchor="middle" class="label-title" style="fill:var(--bg)">Built-in reasoning</text>
  <text x="1420" y="198" text-anchor="middle" style="fill:var(--bg);font-family:var(--font-label);font-size:24px;opacity:.85;">agent의 핵심 capability</text>
  <text x="1420" y="230" text-anchor="middle" style="fill:var(--bg);font-family:var(--font-label);font-size:24px;opacity:.65;letter-spacing:.06em;">어려운 문제를 다룬다</text>
</svg>

<div class="spacer" style="flex:0.5"></div>

<p class="body" style="color:var(--muted);max-width:1300px;font-family:var(--font-serif);font-style:italic;">
답하기 전에 모델이 단계별로 생각한다. 어려운 문제일수록 효과가 크다 — agent가 다룰 수 있는 문제의 폭이 넓어진다.
</p>

<!--
[발표 시 짚을 포인트]
- Reasoning의 핵심은 *implementation의 분리*가 아니다 — agent가 새 capability를 갖게 된 것이다.
- Stage 1: prompt trick. Wei (Jan 2022), Kojima (May 2022) — prompt에 reasoning example을 넣으면 model이 그 style을 imitate. "Let's think step by step"만 붙여도 zero-shot.
- Stage 2: training. 2024.09 OpenAI o1, 2025.01 DeepSeek R1, 2025.02 Claude extended thinking — 명시적으로 학습된 reasoner.
- 오늘날: reasoning이 agent의 *내장 capability*. 답하기 전에 생각하는 model이 어려운 문제를 더 잘 다룬다 — 그게 agent가 다룰 수 있는 task의 폭을 넓혔다.
- 구현 detail (trace와 answer의 분리)은 부차적. 핵심은 reasoning이 emergent capability로 자리잡았다는 것.
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
  <text x="240"  y="72" text-anchor="middle" class="label-title" style="font-size:26px">사용자</text>
  <rect x="740"  y="36" width="200" height="56" rx="4" class="fill-1" />
  <text x="840"  y="72" text-anchor="middle" class="label-title" style="font-size:26px;fill:var(--bg)">Model</text>
  <rect x="1340" y="36" width="200" height="56" rx="4" class="fill-paper stroke-3" stroke-width="2" />
  <text x="1440" y="72" text-anchor="middle" class="label-title" style="font-size:26px;fill:var(--accent-3)">Tool</text>
  <!-- Step 1 -->
  <line x1="240" y1="140" x2="836" y2="140" class="stroke" stroke-width="1.5" />
  <path d="M 830 134 L 840 140 L 830 146" class="stroke" stroke-width="1.5" fill="none" />
  <text x="540" y="128" text-anchor="middle" class="label" style="font-style:italic;font-family:var(--font-serif);font-size:26px">"SF 날씨 어때?"</text>
  <!-- Step 2 -->
  <line x1="840" y1="220" x2="1436" y2="220" class="stroke-1" stroke-width="2" />
  <path d="M 1430 214 L 1440 220 L 1430 226" class="stroke-1" stroke-width="2" fill="none" />
  <text x="1140" y="208" text-anchor="middle" class="label" style="font-family:var(--font-mono);font-size:24px;fill:var(--accent-1)">get_weather(city: "SF")</text>
  <text x="1140" y="244" text-anchor="middle" class="label-tiny">structured tool call · free text 아님</text>
  <!-- Step 3 -->
  <line x1="1440" y1="320" x2="844" y2="320" class="stroke-3" stroke-width="2" />
  <path d="M 850 314 L 840 320 L 850 326" class="stroke-3" stroke-width="2" fill="none" />
  <text x="1140" y="308" text-anchor="middle" class="label" style="font-family:var(--font-mono);font-size:24px;fill:var(--accent-3)">{ temp: 62, conditions: "foggy" }</text>
  <!-- Step 4 -->
  <line x1="840" y1="420" x2="244" y2="420" class="stroke" stroke-width="1.5" />
  <path d="M 250 414 L 240 420 L 250 426" class="stroke" stroke-width="1.5" fill="none" />
  <text x="540" y="408" text-anchor="middle" class="label" style="font-style:italic;font-family:var(--font-serif);font-size:26px">"SF는 62°F에 안개가 있어요."</text>
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
<span style="color:var(--accent-1);font-family:var(--font-label);letter-spacing:.08em;text-transform:uppercase;">function calling 도입 · OpenAI · 2023.06.13 — 구조적 tool call의 시작</span>
</p>

<!--
[발표 시 짚을 포인트]
- 사용자가 질문 → model이 *structured* tool call을 emit (free text가 아니라 JSON 형태 request) → agent loop이 tool을 실행 → 결과를 model로 돌려줌 → model이 final answer.
- 결정적 날짜: 2023.06.13 — OpenAI가 function calling을 ship한 날. 구조적 tool call의 시작.
- 그 전에는 "JSON 형식으로 출력" 부탁하고 기도. 그 후에는 model이 별도 API field로 학습된 채로 emit.
- Anthropic 따라옴 (2023.11 beta → 2024.05 GA), Google 합류 2024년. 2024 말 table stakes.
- tool이 작동하면 model은 거의 무엇이든 쓸 수 있다.
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
    <p class="lede" style="margin-bottom:32px;">한 바퀴 = 한 번의 model call.</p>
    <p class="body" style="color:var(--muted);max-width:600px;margin-bottom:28px;">
      Model이 생각한다. Agent loop이 tool을 실행한다. 결과가 돌아온다. Model이 다시 생각한다. 끝날 때까지 반복.
    </p>
    <p class="body" style="font-family:var(--font-serif);font-style:italic;color:var(--accent-3);">
      모든 modern agent의 기반. Surface는 달라도 loop은 같다.
    </p>
    <p class="small" style="margin-top:36px;color:var(--accent-1);font-family:var(--font-label);letter-spacing:.08em;text-transform:uppercase;">
      ReAct &mdash; Yao et al. &mdash; Oct 2022
    </p>
  </div>
</div>

<div class="spacer"></div>

<!--
[발표 시 짚을 포인트]
- 앞 두 슬라이드의 think와 act를 합친다. Model이 생각, 행동, 관찰, 다시 생각. Task 끝까지 반복.
- 이름: ReAct (Reasoning + Acting). 2022.10 Yao et al., Princeton/Google.
- 한 바퀴 = model call 한 번. Agent loop이 model을 호출하고, tool을 실행하고, 결과를 다시 model로 돌려준다. Model이 멈출 시점을 결정.
- 모든 modern agent의 기반. Surface는 달라도 loop은 같다.
- 이후 모든 슬라이드에 이 모양이 나온다.
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
    <div class="numeral" style="font-size:120px;">5개월</div>
    <p class="small">ReAct paper (2022.10) → AutoGPT (2023.03) &mdash; 연구에서 product category까지.</p>
  </div>
  <div style="align-self:end;">
    <p class="body" style="color:var(--muted);font-family:var(--font-serif);font-style:italic;">
      대부분의 demo는 cherry-picked였지만, "agent loop"이라는 <em>개념</em>이 industry에 자리잡은 순간.
    </p>
  </div>
</div>

<!--
[발표 시 짚을 포인트]
- ReAct paper (2022.10) → AutoGPT (2023.03)까지 약 5개월. 연구에서 product category가 되기까지의 속도.
- LangChain 2022.10, ChatGPT 2022.11, AutoGPT 2023.03.30, BabyAGI 2023.04, AutoGen 2023.08, CrewAI 2024.01 — orchestration framework들의 폭발적 등장.
- 이때 "AI agent"라는 단어가 일반인에게도 익숙해졌다.
- 솔직히, 대부분 demo는 cherry-picked. 실제 run은 loop에 갇히고 hallucinate. 2023 가을, 분위기 disillusionment로 뒤집힘.
- 그러나 *개념*은 남았다 — "agent loop"이라는 building block이 분야의 공용 어휘가 되었다.
-->

---

<div class="eyebrow">Wave 이후</div>

## <span class="title">Framework 위에 discipline 정착.</span>

<div class="spacer" style="flex:0.4"></div>

<div class="two-col">
  <div>
    <div class="col-head"><span class="dot"></span><span>남은 것</span></div>
    <ol class="steps" style="margin-top:18px;">
      <li><span><b style="font-family:var(--font-title);font-size:40px;">Own your prompts.</b><br /><span style="color:var(--muted);font-size:24px;"><em>prompt</em>: model에게 매 호출 보내는 지시. abstraction 뒤에 숨기지 말고 직접 작성하라.</span></span></li>
      <li><span><b style="font-family:var(--font-title);font-size:40px;">Own your context.</b><br /><span style="color:var(--muted);font-size:24px;"><em>context</em>: model이 매 turn 보는 모든 것 (history + 문서 + tool 결과). 무엇이 들어갈지 직접 결정하라.</span></span></li>
      <li><span><b style="font-family:var(--font-title);font-size:40px;">Own your control flow.</b><br /><span style="color:var(--muted);font-size:24px;"><em>control flow</em>: loop 그 자체 — 언제 model을 부르고, 언제 멈출지. framework에 맡기지 말고 직접 써라.</span></span></li>
    </ol>
  </div>
  <div style="align-self:center;">
    <div class="col-head"><span class="dot alt"></span><span>방법론의 수렴</span></div>
    <p class="lede" style="margin-top:18px;font-family:var(--font-serif);font-style:italic;line-height:1.25;">
      모두가 <span style="color:var(--accent-1);">orchestration</span> layer는 작고 단순하게,
      <span style="color:var(--accent-1);">integration</span> layer는 더 정교하고 확장성있게.
    </p>
    <p class="body" style="margin-top:36px;color:var(--muted);">
      MCP가 2024년 11월에 integration layer의 사실상 표준이 됨.
    </p>
  </div>
</div>

<div class="spacer"></div>

<!--
[발표 시 짚을 포인트]
- 2024년이 되자 consensus: framework들이 over-abstracted, orchestration layer가 사실 문제의 가장 작은 부분.
- 12-Factor Agents 학파의 wisdom:
  - Own your prompts (abstraction 뒤에 숨기지 말 것)
  - Own your context (window 직접 결정)
  - Own your control flow (loop 직접 쓰기)
- Framework wars는 orchestration layer가 작고 integration layer가 크다는 데 모두 동의하면서 끝났다.
- MCP가 2024.11에 integration layer를 standardize.
- Framework era에서 남은 것은 mental model.
-->

---

<!-- _class: section-slide -->

<div class="part-no">Part II</div>

<h2 class="part-title">Modern toolkit.</h2>

<p class="part-blurb">Steering, guardrails, 그리고 12개월 안에 도착한 네 가지 standards.</p>

<div class="part-rule"></div>

---

<div class="eyebrow">Steering &amp; guardrailing</div>

## <span class="title">Two axes — Constrain &amp; Steer.</span>

<div class="spacer" style="flex:0.4"></div>

<div class="two-col">
  <div>
    <div class="col-head" style="color:var(--accent-1);">
      <span class="dot"></span><span>Constrain &mdash; 행동 제약 사항</span>
    </div>
    <ul class="bare" style="margin-top:18px;font-size:28px;line-height:1.5;">
      <li style="border-bottom:1px solid var(--line-soft);padding:18px 0;">Refusal training</li>
      <li style="border-bottom:1px solid var(--line-soft);padding:18px 0;">Output filters</li>
      <li style="border-bottom:1px solid var(--line-soft);padding:18px 0;">Sandbox &mdash;host와의 격리</li>
      <li style="padding:18px 0;">위험한 action 전의 permission prompt</li>
    </ul>
  </div>
  <div>
    <div class="col-head" style="color:var(--accent-3);">
      <span class="dot" style="background:var(--accent-3);"></span><span>Steer &mdash; 행동 방식 유도</span>
    </div>
    <ul class="bare" style="margin-top:18px;font-size:28px;line-height:1.5;">
      <li style="border-bottom:1px solid var(--line-soft);padding:18px 0;">System prompt &mdash; job description</li>
      <li style="border-bottom:1px solid var(--line-soft);padding:18px 0;">Structured output &mdash; schema 강제</li>
      <li style="border-bottom:1px solid var(--line-soft);padding:18px 0;">Tool registry trimming</li>
      <li style="padding:18px 0;">Verdict contracts &mdash; "PASS or FAIL 명시"</li>
    </ul>
  </div>
</div>

<div class="spacer" style="flex:0.5"></div>

<p class="lede" style="text-align:center;font-family:var(--font-serif);font-style:italic;color:var(--accent-1);max-width:1400px;margin:0 auto;">
Prompt에 의존한 요청 대신 &mdash; 위험한 작업 기능 자체를 제한.
</p>

<!--
[발표 시 짚을 포인트]
- 강력한 generalist model을 task에 집중시키고 trouble에서 멀어지게 — 두 가지 보완적 축.
- Constrain (negative): refusal training, output filter, sandbox, permission prompt.
- Steer (positive): system prompt (job description), structured output (schema), tool denylist (위험한 tool 제거), verdict contract (PASS or FAIL).
- 지난 1년 가장 흥미로운 design move: 구조적으로 enforce, 정중하게 부탁하지 않는다.
- Claude Code의 read-only reviewer subagent에는 Edit tool이 *없다*. Rule이 prompt가 아니라 *없는 capability*. Model이 literally 위반할 수 없다.
- 한 가지 mental model만 가져간다면, 이것을 가져가라.
-->

---

<div class="eyebrow">12개월</div>

## <span class="title">Four cross-vendor standards.</span>

<div class="spacer" style="flex:0.4"></div>

<div class="standards-row">
  <div class="std-card">
    <div class="s-tag">Tool bridge</div>
    <div class="s-name">MCP</div>
    <div class="s-date">Anthropic · 2024.11.25</div>
    <div class="s-tagline">Agent가 tool, 환경과 대화하는 방법.</div>
  </div>
  <div class="std-card">
    <div class="s-tag">Project context</div>
    <div class="s-name">AGENTS.md</div>
    <div class="s-date">OpenAI Codex CLI · 2025년 중반</div>
    <div class="s-tagline">Project root에 있는 plain Markdown 파일.</div>
  </div>
  <div class="std-card">
    <div class="s-tag">Editor bridge</div>
    <div class="s-name">ACP</div>
    <div class="s-date">Zed · 2025.08.27</div>
    <div class="s-tagline">Editor가 agent와 대화하는 방법.</div>
  </div>
  <div class="std-card">
    <div class="s-tag">Capability artifact</div>
    <div class="s-name">SKILL.md</div>
    <div class="s-date">Anthropic · 2025.10.16</div>
    <div class="s-tagline">Capability bundle &mdash; 같은 파일, 여러 agent.</div>
  </div>
</div>

<div class="spacer" style="flex:0.4"></div>

<p class="body" style="color:var(--muted);font-family:var(--font-serif);font-style:italic;text-align:center;">
각각 minimal &mdash; text-shaped 혹은 JSON-RPC-shaped의 표준 구조로 마찰없는 통합
</p>

<!--
[발표 시 짚을 포인트]
- 12개월에 cross-vendor standard 4개. 어떤 software 분야에서도 드물고, AI에서는 전례가 거의 없다.
- MCP (Anthropic 2024.11.25): agent ↔ tool/data. OpenAI가 2025.04 채택, 2025.12 Linux Foundation에 donate.
- AGENTS.md (mid-2025, OpenAI Codex CLI): plain Markdown, Git처럼 root에서 walk. 2025년 말 Linux Foundation donate, 60K open-source project 사용.
- ACP (Zed 2025.08.27): editor ↔ agent. LSP가 language server에 한 역할.
- SKILL.md (Anthropic 2025.10.16): portable capability bundle, Markdown + YAML.
- 각각 minimal. 그게 adoption을 마찰 없게 했다.
-->

---

<div class="eyebrow">어떻게 맞물리는가</div>

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
      각 layer가 minimal. 각 layer가 swappable.
    </p>
    <p class="body" style="color:var(--muted);">
      Layer 사이는 표준 protocol — agent가 어떤 model을 쓰든, 어떤 tool을 부르든, 다른 layer는 영향받지 않는다.
    </p>
    <p class="body" style="margin-top:36px;color:var(--accent-3);font-family:var(--font-serif);font-style:italic;">
      Editor를 swap, agent를 swap, tool server를 swap &mdash; 다른 layer에서는 알아채지 못한다.
    </p>
  </div>
</div>

<div class="spacer"></div>

<!--
[발표 시 짚을 포인트]
- 세 protocol, 세 layer, 세 job.
- Editor ↔ Agent: ACP. Agent ↔ Tools: MCP.
- 2026년 전형적인 setup: Zed가 Claude Code에 ACP로, Claude Code가 GitHub/Postgres/Slack server에 MCP로 말한다.
- 각 layer의 vendor는 다른 layer를 건드리지 않고 swap 가능. Editor만 바꿔도, agent만 바꿔도, tool server만 바꿔도 — 나머지는 그대로 동작한다.
- (LSP를 아는 청중이라면: editor↔language server를 잇는 LSP와 같은 모양.)
-->

---

<div class="eyebrow">Capability artifacts</div>

## <span class="title">SKILL.md — load on demand.</span>

<div class="spacer" style="flex:0.3"></div>

<svg viewBox="0 0 1680 320" style="width:100%;height:auto;">
  <rect x="40" y="60" width="400" height="200" rx="6" class="stroke fill-paper" stroke-width="1.5" />
  <text x="240" y="100" text-anchor="middle" class="label-accent">Stage 1</text>
  <text x="240" y="148" text-anchor="middle" class="label-title">Discovery</text>
  <text x="240" y="184" text-anchor="middle" class="label" style="font-size:24px;fill:var(--muted)">name + description만</text>
  <text x="240" y="220" text-anchor="middle" class="label-tiny">~100 tokens / skill</text>
  <line x1="460" y1="160" x2="580" y2="160" class="stroke-1" stroke-width="1.5" />
  <path d="M 570 154 L 580 160 L 570 166" class="stroke-1" stroke-width="1.5" fill="none" />
  <rect x="600" y="60" width="400" height="200" rx="6" class="stroke fill-paper" stroke-width="1.5" />
  <text x="800" y="100" text-anchor="middle" class="label-accent">Stage 2</text>
  <text x="800" y="148" text-anchor="middle" class="label-title">Activation</text>
  <text x="800" y="184" text-anchor="middle" class="label" style="font-size:24px;fill:var(--muted)">full SKILL.md body 읽기</text>
  <text x="800" y="220" text-anchor="middle" class="label-tiny">필요할 때</text>
  <line x1="1020" y1="160" x2="1140" y2="160" class="stroke-1" stroke-width="1.5" />
  <path d="M 1130 154 L 1140 160 L 1130 166" class="stroke-1" stroke-width="1.5" fill="none" />
  <rect x="1160" y="60" width="400" height="200" rx="6" class="fill-1" />
  <text x="1360" y="100" text-anchor="middle" class="label-accent" style="fill:var(--bg)">Stage 3</text>
  <text x="1360" y="148" text-anchor="middle" class="label-title" style="fill:var(--bg)">Execution</text>
  <text x="1360" y="184" text-anchor="middle" style="fill:var(--bg);font-family:var(--font-label);font-size:24px;opacity:.85;">scripts &amp; templates 열기</text>
  <text x="1360" y="220" text-anchor="middle" style="fill:var(--bg);font-family:var(--font-label);font-size:24px;opacity:.7;letter-spacing:.06em;">참조될 때만</text>
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
[발표 시 짚을 포인트]
- Skill은 폴더. 안에 SKILL.md (Markdown + 두 줄 YAML header: name + description).
- 핵심 혁신: progressive disclosure. 세 단계.
  - Discovery: startup에 name+description만. ~100 token씩.
  - Activation: model이 relevant하다고 판단하면 full body 읽기.
  - Execution: body가 script reference하면 그때만 열기.
- 계산: 30 skills × 100 tokens = 3K. eager load면 60K — 사용자가 입력하기도 전에. 그래서 이 format이 퍼졌다.
- 같은 SKILL.md가 Claude Code, Codex, Cursor, OpenCode, Pi, Goose, ~25개 다른 tool에서 작동.
-->

---

<!-- _class: section-slide -->

<div class="part-no">Part III</div>

<h2 class="part-title">Today's agents.</h2>

<p class="part-blurb">같은 building blocks 위에 build된 다섯 examples.</p>

<div class="part-rule"></div>

---

<div class="eyebrow">Examples</div>

## <span class="title">Five surfaces, one shape.</span>

<div class="spacer" style="flex:0.3"></div>

<div style="display:grid;grid-template-columns:repeat(5, 1fr);gap:32px;">
  <div class="agent-card">
    <div class="a-maker">Anthropic</div>
    <div class="a-name">claude-code</div>
    <div class="small" style="color:var(--muted);">Terminal. ~40개 built-in tool. MCP-first. 단계별로 hook.</div>
    <div class="a-quote">"Layered platform."</div>
  </div>
  <div class="agent-card">
    <div class="a-maker">SST</div>
    <div class="a-name">opencode</div>
    <div class="small" style="color:var(--muted);">Server-first. Typed HTTP API. Terminal은 하나의 client.</div>
    <div class="a-quote">"Typed protocol surface."</div>
  </div>
  <div class="agent-card">
    <div class="a-maker">Community</div>
    <div class="a-name">openclaw</div>
    <div class="small" style="color:var(--muted);">한 operator. 3단계 Docker sandbox. Multi-channel daemon.</div>
    <div class="a-quote">"Single-operator gateway."</div>
  </div>
  <div class="agent-card">
    <div class="a-maker">Nous Research</div>
    <div class="a-name">hermes-agent</div>
    <div class="small" style="color:var(--muted);">Self-improving. 자기 memory를 편집. 자기 skill 생성.</div>
    <div class="a-quote">"Self-improving environment."</div>
  </div>
  <div class="agent-card">
    <div class="a-maker">M. Zechner</div>
    <div class="a-name">pi-mono</div>
    <div class="small" style="color:var(--muted);">7개 tool의 minimal core. Extension으로 자라난다 — 간단하지만 확장 가능.</div>
    <div class="a-quote">"Core + extensions."</div>
  </div>
</div>

<div class="spacer"></div>

<p class="body" style="text-align:center;color:var(--muted);font-family:var(--font-serif);font-style:italic;">
모든 agent가 같은 building blocks을 공유.
</p>

<!--
[발표 시 짚을 포인트]
- 이 다섯은 talk의 예시일 뿐이다. 모두 같은 architecture 위에 build됐다.
- claude-code (Anthropic): terminal, MCP-first, 모든 hook을 노출하는 layered platform.
- opencode (SST): server-first, typed HTTP API, terminal은 client 중 하나.
- openclaw: single-operator + 3단계 sandbox + multi-channel daemon.
- hermes-agent (Nous Research): self-improving. 자기 memory와 skill을 편집.
- pi-mono (Mario Zechner): tool 7개로 시작한 minimal core, extension layer로 자라난다. 간단하지만 확장 가능한 구조.
- 다섯이 서로 다른 surface로 보이지만, *밑의 building blocks*는 같다. 그 점을 다음 슬라이드부터 보여준다.
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
  <text x="860" y="492" text-anchor="middle" class="label-title">5개 nested agents</text>
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
Standardization에 뒤이은 Evolution
</p>

<!--
[발표 시 짚을 포인트]
- 다섯 project는 isolated되어 있지 않다. 서로 code/format을 공유, 의존.
- openclaw → pi-mono를 library로 import (reinvent 안 함).
- hermes-agent → openclaw에서 자라남. `hermes claw migrate` command로 ~/.openclaw import.
- opencode → Claude Code의 skills directory를 직접 읽음.
- pi-skills → 5개 agent용 install instruction과 함께 동일 SKILL.md 파일 ship.
- openclaw → ACP 양방향. IDE를 위한 ACP server이자, Codex/Claude Code/Gemini CLI/OpenCode/Pi를 nested child로 drive.
- Family tree, competition table 아니다. Standards가 진짜라는 증거.
-->

---

<!-- _class: section-slide -->

<div class="part-no">Part IV</div>

<h2 class="part-title">Settled patterns.</h2>

<p class="part-blurb">다섯 agents가 공유하는 architecture.</p>

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
Multi-agent는 별도 platform이 아니라 같은 loop을 다르게 configure한 것.
</p>

<!--
[발표 시 짚을 포인트]
- 분야에서 가장 universal한 pattern.
- 같은 loop (call model, run tools, repeat)이 prompt + tool filter + permission context를 바꾸면 완전히 다른 behavior로 reconfigure.
- Claude Code의 source에서 파일 하나가 interactive REPL, subagent, remote session, background memory consolidation을 다 처리.
- "verify" subagent: mutating tool 제거한 loop + "이것을 깨뜨려라" prompt.
- "explore" subagent: read-only tool만 있는 loop.
- Multi-agent behavior는 별도 platform이 아니라 같은 loop을 reconfigure한 것이다.
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
Agent들이 공통으로 갖고있는 여섯가지 구조적 특징.
</p>

<!--
[발표 시 짚을 포인트]
- 이 여섯 pattern이 다섯 examples *모두*에 나타난다 — 즉, modern agent의 architecture가 settled됐다.
- One loop, many policies — 같은 loop을 prompt + tool filter + permission으로 reconfigure.
- Methodology in prompts, not state — code에 rigid state machine이 없다.
- Compaction as control flow — context window 관리가 매 turn의 일부.
- Streaming + parallel tool execution — tool이 model token output과 동시에.
- SKILL.md + AGENTS.md as cross-vendor 파일 format.
- ACP for editors, MCP for tools.
- 이 슬라이드의 의미: 분야가 합의한 *공유 architecture* — 이것이 talk의 thesis다.
-->

---

<div class="eyebrow">Configurable axes &mdash; 같은 architecture, 다른 setup</div>

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
각 Agent가 용도와 목적에 따라 다른 지향점을 가짐
</p>

<!--
[발표 시 짚을 포인트]
- 여섯 axis는 product가 다른 게 아니라 *같은 architecture를 어떻게 configure했는가*의 차이.
- Server-first vs binary-first — process model의 선택.
- MCP built-in vs via bridge — tool integration layer의 위치.
- Sandbox in core vs in deployment — sandboxing을 어디에 둘지.
- Curated memory vs stateless session — memory layer 활성화 여부.
- Subagents first-class vs single agent — concurrency 선택.
- Multi-tenant vs single-operator — operational model.
- 이 슬라이드의 메시지는 *차이 자체*가 아니라 *같은 architecture가 이렇게 다양하게 setup될 수 있다*는 점.
- 어느 setup이든 base building blocks는 동일하다. 그게 architecture가 settled됐다는 또 다른 증거.
-->

---

<!-- _class: section-slide -->

<div class="part-no">Part V</div>

<h2 class="part-title">Synthesis.</h2>

<p class="part-blurb">같은 <em>구조</em>로 수렴된 modern agent의 canonical shape.</p>

<div class="part-rule"></div>

---

<div class="eyebrow">2026 AI agent란</div>

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
다섯 layer로 구성된 같은 architecture, 다른 setup.
</p>

<!--
[발표 시 짚을 포인트]
- 모든 modern AI agent의 한 도식, 한 번 그렸다.
- Surface — 사람이 보는 것. Session — durable한 conversation state. Loop — 앞서 그린 spine.
- Provider · Tools · Permissions — model API, tool registry, 규칙들. Extensions — MCP server, skill, plugin.
- 다섯 agent 모두 이 모양에 fit. 다른 것은 각 layer가 *어떻게 build되었는가*이지, *layer가 있는지 여부*가 아니다.
- 한 문장: streaming chat loop over a provider abstraction — with tools, permissions, extensions — configurable into many runtimes by changing prompt + tool filter + permission policy.
-->

---

<div class="eyebrow">Same shape, different setup</div>

## <span class="title">Pick the setup that fits.</span>

<div class="spacer" style="flex:0.3"></div>

<div class="branches">
  <div class="branch">
    <div class="q"><b>개인 작업</b>, hand-buildable</div>
    <div class="ar">→</div>
    <div class="a">pi-mono pattern</div>
  </div>
  <div class="branch">
    <div class="q"><b>Platform</b>으로서의 coding agent</div>
    <div class="ar">→</div>
    <div class="a">claude-code pattern</div>
  </div>
  <div class="branch">
    <div class="q">Coding agent <b>everywhere<b> &mdash; terminal, web, IDE, mobile</div>
    <div class="ar">→</div>
    <div class="a">opencode pattern</div>
  </div>
  <div class="branch">
    <div class="q"><b>Chat platform</b>에서의 personal assistant, single-operator</div>
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
같은 architecture, 다른 setup. 문제가 setup을 결정 &mdash; setup이 surface를 선택.
</p>

<!--
[발표 시 짚을 포인트]
- 옳은 질문은 "어떤 agent가 best인가"가 아니라 "어떤 setup이 내 문제에 맞는가".
- 다섯 examples는 다섯 가지 setup. 모두 같은 base architecture 위에서.
- 혼자 코딩, hand-buildable → pi-mono setup.
- Ecosystem-ready platform → claude-code setup.
- Multi-surface (terminal, web, IDE, mobile) → opencode setup.
- Chat platform personal assistant → openclaw setup.
- Self-improving training environment → hermes-agent setup.
- Setup은 다르지만 *밑의 architecture는 같다*. 문제가 setup을 결정한다.
-->

---

<div class="eyebrow">2026의 floor</div>

## <span class="title">Ten table stakes.</span>

<div class="spacer" style="flex:0.3"></div>

<div style="display:grid;grid-template-columns:repeat(2, 1fr);column-gap:80px;row-gap:18px;font-size:28px;">
  <div style="display:grid;grid-template-columns:60px 1fr;align-items:baseline;gap:18px;padding-bottom:14px;border-bottom:1px solid var(--line-soft);">
    <span style="color:var(--accent-1);font-family:var(--font-label);font-variant-numeric:tabular-nums;font-size:24px;">01</span>
    <span>Streaming model + tool loop</span>
  </div>
  <div style="display:grid;grid-template-columns:60px 1fr;align-items:baseline;gap:18px;padding-bottom:14px;border-bottom:1px solid var(--line-soft);">
    <span style="color:var(--accent-1);font-family:var(--font-label);font-variant-numeric:tabular-nums;font-size:24px;">02</span>
    <span>Schema validation 있는 tool registry</span>
  </div>
  <div style="display:grid;grid-template-columns:60px 1fr;align-items:baseline;gap:18px;padding-bottom:14px;border-bottom:1px solid var(--line-soft);">
    <span style="color:var(--accent-1);font-family:var(--font-label);font-variant-numeric:tabular-nums;font-size:24px;">03</span>
    <span>SKILL.md loader</span>
  </div>
  <div style="display:grid;grid-template-columns:60px 1fr;align-items:baseline;gap:18px;padding-bottom:14px;border-bottom:1px solid var(--line-soft);">
    <span style="color:var(--accent-1);font-family:var(--font-label);font-variant-numeric:tabular-nums;font-size:24px;">04</span>
    <span>cwd에서 AGENTS.md walk</span>
  </div>
  <div style="display:grid;grid-template-columns:60px 1fr;align-items:baseline;gap:18px;padding-bottom:14px;border-bottom:1px solid var(--line-soft);">
    <span style="color:var(--accent-1);font-family:var(--font-label);font-variant-numeric:tabular-nums;font-size:24px;">05</span>
    <span>매 turn compaction stage</span>
  </div>
  <div style="display:grid;grid-template-columns:60px 1fr;align-items:baseline;gap:18px;padding-bottom:14px;border-bottom:1px solid var(--line-soft);">
    <span style="color:var(--accent-1);font-family:var(--font-label);font-variant-numeric:tabular-nums;font-size:24px;">06</span>
    <span>Permissions <em style="color:var(--muted);">또는</em> sandbox</span>
  </div>
  <div style="display:grid;grid-template-columns:60px 1fr;align-items:baseline;gap:18px;padding-bottom:14px;border-bottom:1px solid var(--line-soft);">
    <span style="color:var(--accent-1);font-family:var(--font-label);font-variant-numeric:tabular-nums;font-size:24px;">07</span>
    <span>MCP support <em style="color:var(--muted);">또는</em> 명시적 refusal</span>
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
새로운 구조를 만들기보다는 settled architecture를 활용 &mdash; 그 위에서 필요한기능을 build.
</p>

<!--
[발표 시 짚을 포인트]
- 2026에 agent 만든다면, 이것이 floor (ceiling 아니라).
- 각 항목이 aspirational feature가 아니라 현재의 expectation.
- 10가지: streaming model+tool loop, schema validation tool registry, SKILL.md loader, AGENTS.md walk, compaction stage, permissions or sandbox, MCP support or 명시적 refusal, ACP server, durable session store, subagent affordance.
- 어느 것도 invent할 필요 없다 — 다섯 examples 중 최소 하나에 다 있고, 대부분은 모두에 있다.
- 2026의 흥미로운 일: settled architecture 위에서 너의 setup을 build하는 것.
-->

---

<!-- _class: hero-slide -->

<div class="eyebrow h-eyebrow-block">Closing</div>

<p class="hero-text">
Architecture has <em>settled</em>.<br />
<span style="color:var(--muted);font-style:italic;font-size:0.7em;">Shared, common building blocks ―</span><br />
<span style="color:var(--muted);font-style:italic;font-size:0.7em;">Customized surface</span>
</p>

<p style="font-family:var(--font-title);font-size:80px;margin-top:60px;color:var(--accent-1);">
Build on it.
</p>

<!--
[발표 시 짚을 포인트]
- 핵심 thesis 재확인: modern AI agent의 architecture가 settled됐다.
- 같은 building blocks — agent loop, three roles, tool calling, MCP, ACP, SKILL.md, AGENTS.md, compaction, permissions — 가 다섯 examples 모두에 공통으로 있다.
- 2026의 흥미로운 작업은 그 building blocks을 reinvent하는 것이 아니라, 그 위에서 너의 setup을 build하는 것.
- Substrate가 안정됐기 때문에 build cost가 2022년보다 훨씬 낮다.
- Build on it.
-->

---

<!-- _class: title-slide -->

<div class="ribbon" style="margin:0 auto 40px;"></div>

# <span style="text-align:center;display:block;">Thanks.</span>

<p class="subtitle" style="text-align:center;margin:0 auto;">Q&A</p>

<!--
[발표 시 짚을 포인트]
- 감사합니다. 질문, 반론, 거부 — 모두 환영합니다.
- Docs corpus: per-agent docs · comparison · research · references.
-->
