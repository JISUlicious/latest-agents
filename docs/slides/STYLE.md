# Slide writing style

Derived from a 20-question style survey (May 2026).
Applies to all decks under `docs/slides/`.

## Sentence form

- **Default**: 명사형/개조식 — verbless noun-phrase verdicts.
- **Korean particles preserved** (의/는/을/를) where natural. Prose minus the verb, not telegraphic.
- **When a verb is unavoidable**: Korean 한다체 (~다). Avoid loanword verbs (`emerge한다`).

## Language mix

- **English**: concepts, entity names, protocol acronyms, file artifacts (`Agent loop`, `MCP`, `claude-code`, `ReAct`, `SKILL.md`).
- **Korean**: grammar, common nouns, glue.
- **Dates**: English abbreviation (`Nov 2024`). Not `2024.11`, not `2024년 11월`.
- **Slide titles**: English-first (`The canonical shape.`).
- **Eyebrows / section labels**: Korean OK.

## Voice & tone

- **단정/선언** — factual, headline-style.
- **No personal asides** — no 솔직히, no 사실은, no 우리.
- **No hedging** unless data warrants it.
- **Rhetorical questions welcome as titles** (`AI agent란? — 2026`). Not in body.

## Connectors

- **Implicit** — em-dash (—), line break.
- **Do not use**: 그러나 · 다만 · 즉.
- **Arrow (→)** for sequence / causation / transformation.
- **Middle dot (·)** for list separators.

## Length & rhythm

- **Fragments** over sentences.
- **Two-beat verdicts** common (`Statement. Verdict.`).
- **One-word punchlines welcome** (`Build.`).
- **Large numerals as visual anchors** (`12 months / 4 standards`).

## Typography

- **Color accent** for emphasized concept words. Not bold, not italic.
- **Italic, no quotes** for pull-quotes / aphorisms (`*Layered platform.*`).
- **Backtick / monospace** for protocol acronyms, file names, code (`` `MCP` `` · `` `SKILL.md` `` · `` `AGENTS.md` ``).

## Section dividers

- **Part № + label** (`Part I · How we got here.`).
- **Verdict variant** also OK (`Part I · Completion → Agent loop.`).

## Closing

- **Single-word imperative** (`Build.`).
- Aphoristic. No narration around it.

## Examples

### Do

```
Architecture, settled.
ReAct → AutoGPT (5 months)
12 months · 4 standards
같은 architecture · 다른 setup
MCP · Nov 2024
```

### Don't

```
우리는 modern agent들이 같은 architecture를 공유한다고 생각합니다.   ← personal voice, full sentence
솔직히, framework는 거의 사라졌다고 봐도 된다.                       ← editorial aside
Framework가 사라지진 않았다. 그러나 단순한 layer가 되었다.            ← explicit connector
2024년 11월에 MCP가 도입되었다.                                     ← KR date form
```
