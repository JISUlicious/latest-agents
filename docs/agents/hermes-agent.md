# Hermes Agent

## Overview

Hermes Agent (NousResearch/hermes-agent) is Nous Research's self-improving, open-source AI agent — a Python application that runs as either an interactive terminal (`hermes`) or a persistent multi-platform messaging daemon (`hermes gateway`) and is meant to outlive any single laptop or session. The README pitches it bluntly: *"The self-improving AI agent built by Nous Research. It's the only agent with a built-in learning loop — it creates skills from experience, improves them during use, nudges itself to persist knowledge, searches its own past conversations, and builds a deepening model of who you are across sessions. Run it on a $5 VPS, a GPU cluster, or serverless infrastructure that costs nearly nothing when idle."* The codebase is large (the development guide notes "~17k tests across ~900 files as of May 2026"), heavily plugin-oriented, and provider-agnostic by design — it speaks OpenAI-compatible chat completions to any backend, including OpenRouter, Nous Portal, Anthropic, NVIDIA NIM, Hugging Face, Ollama, vLLM, llama.cpp, and LM Studio. Its distinguishing trait, relative to most other agents, is that the runtime *and* the persistence layer (skills, memory, sessions, cron jobs) are themselves edited by the agent during normal use — Hermes treats "growing" as a first-class system concern, not a UX flourish.

## Architecture

### Top-level layout

The development guide `AGENTS.md` provides the canonical map (lines 22-63). The load-bearing entry points are top-level Python files, with subsystems in directories (LOC counts verified with `wc -l`):

```
hermes-agent/
├── run_agent.py          # AIAgent class — core conversation loop (~15.7k LOC)
├── model_tools.py        # Tool orchestration, discover_builtin_tools()
├── toolsets.py           # Toolset definitions, _HERMES_CORE_TOOLS list
├── cli.py                # HermesCLI — interactive CLI orchestrator (~13.5k LOC)
├── hermes_state.py       # SessionDB — SQLite session store (FTS5 search)
├── batch_runner.py       # Parallel batch processing
├── agent/                # Provider adapters, memory, caching, compression
├── hermes_cli/           # CLI subcommands, setup wizard, plugins loader
├── tools/                # Tool implementations — auto-discovered
├── gateway/              # Messaging gateway — run.py + session.py + platforms/
├── plugins/              # Plugin system (memory, model-providers, kanban, ...)
├── skills/               # Built-in skills bundled with the repo
├── optional-skills/      # Heavier/niche skills, not active by default
├── ui-tui/               # Ink (React) terminal UI
├── tui_gateway/          # Python JSON-RPC backend for the TUI
├── acp_adapter/          # ACP server (VS Code / Zed / JetBrains integration)
├── cron/                 # Scheduler — jobs.py, scheduler.py
├── environments/         # RL training environments (Atropos)
└── tests/                # Pytest suite
```

### Process model — there are several Hermeses

Hermes is not a single process. Depending on how it's invoked it runs as one of (at least) six runtimes, all sharing the same `AIAgent` core:

1. **`hermes` (classic CLI)** — `cli.py` → `HermesCLI`. `prompt_toolkit` for input, `rich` for output, a Kawaii spinner from `agent/display.py`, slash commands dispatched from a central registry in `hermes_cli/commands.py`.
2. **`hermes --tui`** — a Node.js Ink (React) UI that runs as a child process, with a Python `tui_gateway/server.py` exchanging newline-delimited JSON-RPC over stdio. Quoting `AGENTS.md` lines 210-211: *"TypeScript owns the screen. Python owns sessions, tools, model calls, and slash command logic."*
3. **`hermes gateway`** — `gateway/run.py`'s `GatewayRunner`. A long-lived async process that connects to messaging platforms (Telegram, Discord, Slack, WhatsApp, Signal, Matrix, Email, SMS, DingTalk, WeChat, etc. — `AGENTS.md` line 40 lists the platforms) and routes inbound messages to per-session `AIAgent` instances. Maintains an LRU cache of agents bounded at 128 with a 1h idle TTL (`gateway/run.py:61-62`).
4. **`hermes acp`** — `acp_adapter/server.py`. ACP (Agent Client Protocol) stdio server for editor integrations.
5. **`hermes dashboard`** — `hermes_cli/web_server.py` serves a localhost web UI that *embeds the real Ink TUI* over a PTY (xterm.js + WebSocket `/api/pty`). The dashboard does NOT reimplement chat in React — see `AGENTS.md` lines 250-260.
6. **Cron sessions** — `cron/scheduler.py` runs inside the gateway by default and spawns isolated `AIAgent` invocations against a job's schedule.

The cohesion point across all of these is `run_agent.py::AIAgent` and `~/.hermes/state.db`, the SQLite session store (`hermes_state.py`).

### File dependency chain

`AGENTS.md` lines 70-80 documents the canonical import order, which is the easiest way to read the codebase:

```
tools/registry.py  (no deps — imported by all tool files)
       ↑
tools/*.py  (each calls registry.register() at import time)
       ↑
model_tools.py  (imports tools/registry + triggers tool discovery)
       ↑
run_agent.py, cli.py, batch_runner.py, environments/
```

Tool files self-register at import. `model_tools.py::discover_builtin_tools()` imports them all; everything downstream consumes the populated registry.

### Configuration and profile model

User state lives in `$HERMES_HOME`, defaulting to `~/.hermes/`. Critical paths (`CONTRIBUTING.md` lines 189-201):

| Path | Purpose |
|------|---------|
| `~/.hermes/config.yaml` | Non-secret settings |
| `~/.hermes/.env` | API keys and secrets only |
| `~/.hermes/auth.json` | OAuth credentials |
| `~/.hermes/skills/` | All active skills |
| `~/.hermes/memories/` | MEMORY.md, USER.md |
| `~/.hermes/state.db` | SQLite session database |
| `~/.hermes/sessions/` | JSON session logs |
| `~/.hermes/cron/` | Scheduled job data |

Profiles allow multiple isolated instances. `hermes_cli/main.py::_apply_profile_override()` sets `HERMES_HOME` *before any module imports*, so all `get_hermes_home()` calls (from `hermes_constants`) automatically scope to the active profile. Profile-safety is enforced as a coding rule (`AGENTS.md` lines 790-830): never use `Path.home() / ".hermes"` in code, always `get_hermes_home()`.

## ACP: Agent Client Protocol

Hermes' `acp_adapter/` implements **ACP (Agent Client Protocol)** — the standard developed for editor integrations with agent CLIs (Zed, VS Code, JetBrains). This is *not* a Hermes-specific protocol: `acp_adapter/server.py` imports the `acp` library directly:

```python
import acp
from acp.schema import (
    AgentCapabilities, AgentMessageChunk, AuthenticateResponse,
    AvailableCommand, AvailableCommandsUpdate, ClientCapabilities,
    InitializeResponse, NewSessionResponse, PromptCapabilities,
    PromptResponse, SessionCapabilities, ...
)
```

(`acp_adapter/server.py:17-58`, abridged — the actual import list is longer.)

`acp_adapter/__init__.py` describes it as: *"ACP (Agent Communication Protocol) adapter for hermes-agent."* The adapter advertises capabilities (`server.py`), handles ACP RPC methods (`new_session`, `load_session`, `resume_session`, `prompt`, `request_permission`, `set_session_model`, `list_sessions`, `fork_session`, …), and bridges them to `AIAgent`. The shipped tree also includes a small sibling `acp_registry/` directory containing only `agent.json` + `icon.svg` (ACP agent-registry metadata, not Python code).

### How the adapter maps ACP to AIAgent

Three concerns are bridged:

1. **Sessions** — `acp_adapter/session.py::SessionManager` maps ACP session IDs to long-running `AIAgent` instances, and *persists them to the shared `~/.hermes/state.db`*. From the module docstring (`session.py:1-8`):

   > *"Sessions are persisted to the shared SessionDB (`~/.hermes/state.db`) so they survive process restarts and appear in `session_search`. When the editor reconnects after idle/restart, the `load_session` / `resume_session` calls find the persisted session in the database and restore the full conversation history."*

   This is a deliberate design choice: ACP sessions and CLI sessions share the same store, which means `session_search` finds editor conversations too.

2. **Events** — `acp_adapter/events.py` produces ACP `session_update` notifications from `AIAgent` callbacks. `AIAgent` runs in a worker thread (a `ThreadPoolExecutor` in `server.py:85` with 4 workers); ACP's asyncio loop lives on the main thread. The events module bridges them via `asyncio.run_coroutine_threadsafe()`. Each agent callback type — tool start, tool progress, message chunk, reasoning — becomes the corresponding ACP `SessionUpdate` variant.

3. **Permissions** — `acp_adapter/permissions.py::make_approval_callback()` translates ACP's `request_permission` RPC (with `PermissionOption` kinds `allow_once`/`allow_always`/`reject_once`/`reject_always`) into the string-returning approval callback that Hermes' terminal tool expects. From `permissions.py:18-23`:

   ```python
   _KIND_TO_HERMES = {
       "allow_once":    "once",
       "allow_always":  "always",
       "reject_once":   "deny",
       "reject_always": "deny",
   }
   ```

The adapter also handles editor-specific quirks: `acp_adapter/server.py::_path_from_file_uri()` rewrites `file:///C:/...` URIs into `/mnt/c/...` so a Zed instance launched in WSL2 can read workspace files. `acp_adapter/session.py::_translate_acp_cwd()` does the same for working directories.

### Cross-reference to OpenClaw

The Nous research stack is "claw-aware" — OpenClaw is the precursor agent that Hermes was forked or evolved from. The README documents `hermes claw migrate` (lines 126-151) which imports an `~/.openclaw` directory: SOUL.md persona, MEMORY.md/USER.md entries, skills, command allowlist, messaging settings, API keys, TTS assets. Hermes is positioned as the successor with full backward compatibility. The community WeChat bridge HermesClaw exists to run both on the same WeChat account.

## Agent Loop

### Shape of the loop

The `AIAgent` class in `run_agent.py` (~15.7k LOC; the development guide describes it more loosely as "~12k LOC") runs a fully synchronous, OpenAI-format chat-completions loop with a budget and an interrupt check. `AGENTS.md` lines 121-137 shows the canonical sketch:

```python
while (api_call_count < self.max_iterations and self.iteration_budget.remaining > 0) \
        or self._budget_grace_call:
    if self._interrupt_requested: break
    response = client.chat.completions.create(model=model, messages=messages, tools=tool_schemas)
    if response.tool_calls:
        for tool_call in response.tool_calls:
            result = handle_function_call(tool_call.name, tool_call.args, task_id)
            messages.append(tool_result_message(result))
        api_call_count += 1
    else:
        return response.content
```

Default `max_iterations = 90` (`AGENTS.md` line 98), shared between parent and subagents.

Messages follow vanilla OpenAI format: `{"role": "system/user/assistant/tool", ...}`. **Native reasoning content is stored on the assistant message as `assistant_msg["reasoning"]`** (AGENTS.md line 140), and the trajectory tooling (`batch_runner.py::_extract_reasoning_stats`, lines 208-240) also recognizes a `<REASONING_SCRATCHPAD>` XML tag inline in content — Hermes accepts both shapes interchangeably.

### Tool-calling format: native, but open-weights-aware

Hermes uses the **provider-native** tool calling path in normal operation — it sends `tools=[...]` and reads structured `response.tool_calls` from the response. But it ships with a full set of text-side parsers for the case where the provider returns raw tokens (e.g. running an open model against vLLM's `/generate`). `environments/tool_call_parsers/` (cataloged in `environments/README.md` lines 116-126) is a library of `extract_tool_calls()` reimplementations:

- `hermes` — the **Hermes / ChatML `<tool_call>` XML format** (Nous's own preferred format for Hermes-family models)
- `mistral` — `[TOOL_CALLS]`
- `llama3_json`, `qwen`, `qwen3_coder`, `deepseek_v3`, `deepseek_v3_1`, `kimi_k2`, `longcat`, `glm45`, `glm47`

This is unusual: the agent expects to be portable across very different open-weight tool-call dialects, and ships the parsers as part of the agent rather than depending on the inference server for normalization. The default for RL/batch use is `tool_call_parser = "hermes"` (`environments/README.md` line 323), reflecting Nous's home turf.

### Prompt assembly

The system prompt is assembled by `agent/prompt_builder.py`. The major blocks (from imports in `run_agent.py:145-163`):

- `DEFAULT_AGENT_IDENTITY` — the persona text
- `PLATFORM_HINTS` — adapter-specific instructions (CLI vs Telegram vs cron …)
- `MEMORY_GUIDANCE`, `SESSION_SEARCH_GUIDANCE`, `SKILLS_GUIDANCE`, `KANBAN_GUIDANCE` — meta-instructions about how to use those subsystems
- `HERMES_AGENT_HELP_GUIDANCE` — self-help (the agent can answer "how do I do X in Hermes")
- `build_skills_system_prompt()` — the skills *index* (metadata, not content)
- `build_context_files_prompt()` — workspace AGENTS.md / CLAUDE.md / .cursorrules
- `build_environment_hints()` — OS, cwd, time
- `load_soul_md()` — user-authored persona override
- Provider-specific blocks: `TOOL_USE_ENFORCEMENT_GUIDANCE`, `GOOGLE_MODEL_OPERATIONAL_GUIDANCE`, `OPENAI_MODEL_EXECUTION_GUIDANCE`

`prompt_builder.py` also scans every context-file source for prompt-injection patterns (`_CONTEXT_THREAT_PATTERNS`, lines 36-47): "ignore previous instructions," hidden HTML divs, exfiltration `curl` patterns, invisible Unicode. A flagged file gets replaced with a `[BLOCKED: …]` placeholder rather than silently included.

### Prefix-cache discipline

An invariant of the system, called out under "Important Policies" in `AGENTS.md` lines 750-760:

> *"Hermes-Agent ensures caching remains valid throughout a conversation. **Do NOT implement changes that would:** Alter past context mid-conversation; Change toolsets mid-conversation; Reload memories or rebuild system prompts mid-conversation. Cache-breaking forces dramatically higher costs. The ONLY time we alter context is during context compression."*

This rule shapes a lot of design — e.g. the memory tool keeps a *frozen* snapshot of memories in the system prompt and only refreshes it on the next session start, even though tool calls update the underlying files immediately. Slash commands that mutate prompt-state default to "deferred invalidation" with an opt-in `--now` flag (`AGENTS.md` lines 757-760).

### Context compression

`agent/context_compressor.py` (the `ContextCompressor` class is imported into `run_agent.py:160`) auto-summarizes older turns when token usage approaches the model's context window. Compression rotates the session_id and triggers `MemoryProvider.on_pre_compress()` so external memory providers get a last chance to extract durable insight from the messages about to be discarded (`agent/memory_provider.py:202-212`).

## Memory: "Grows With You"

This is Hermes' tentpole feature, and the codebase is built around it. The architecture is *layered*: a built-in file-backed store, a pluggable external-provider abstraction, and a long-term FTS5 session search. Plus a background curator that maintains agent-created skills.

### Layer 1 — Built-in file-backed memory (`tools/memory_tool.py`)

Two files in `~/.hermes/memories/`:

- **`MEMORY.md`** — the agent's own notes about its environment, project conventions, learned quirks
- **`USER.md`** — what the agent knows about *you*: preferences, communication style, workflow habits

From the module docstring (`memory_tool.py:1-23`):

> *"Provides bounded, file-backed memory that persists across sessions. … Both are injected into the system prompt as a frozen snapshot at session start. Mid-session writes update files on disk immediately (durable) but do NOT change the system prompt — this preserves the prefix cache for the entire session. The snapshot refreshes on the next session start. Entry delimiter: § (section sign). Entries can be multiline. Character limits (not tokens) because char counts are model-independent."*

Defaults (`memory_tool.py:118`): `memory_char_limit=2200`, `user_char_limit=1375`. The cap is deliberately tight — memory is meant to be *curated*, not accumulating. The model uses a single `memory` tool with an `action` parameter: `add`, `replace`, `remove`, `read`. `replace`/`remove` match by **short unique substring** (no IDs), which is friendlier to LLM-authored edits.

Every write goes through a security scan (`_scan_memory_content`, lines 92-104) that rejects content matching injection patterns (`ignore previous instructions`, `you are now`, `system prompt override`), exfiltration patterns (`curl ... $API_KEY`, `cat .env`), persistence patterns (`authorized_keys`, `~/.ssh`), and invisible Unicode. Because memory entries get injected into the system prompt, the agent treats them as a potential prompt-injection vector and pre-emptively sanitizes them.

Cross-process safety: writes hold an exclusive lock on a sibling `.lock` file (`_file_lock`, lines 144-179) — `fcntl.flock` on POSIX, `msvcrt.locking` on Windows — then re-read the file under lock to incorporate writes from other Hermes instances before mutating.

### Layer 2 — Pluggable memory providers (`agent/memory_provider.py`, `plugins/memory/<name>/`)

On top of the built-in store, Hermes can run *one* external memory provider per session. `AGENTS.md` line 496 enumerates the shipping providers: **honcho, mem0, supermemory, byterover, hindsight, holographic, openviking, retaindb**. The README specifically calls out Honcho ("Honcho dialectic user modeling") and links to the Plastic Labs project.

Each provider implements the `MemoryProvider` ABC (`agent/memory_provider.py:42`). The lifecycle (from the module docstring lines 15-30) is rich enough to be worth quoting in full:

```
Lifecycle (called by MemoryManager, wired in run_agent.py):
  initialize()           — connect, create resources, warm up
  system_prompt_block()  — static text for the system prompt
  prefetch(query)        — background recall before each turn
  sync_turn(user, asst)  — async write after each turn
  get_tool_schemas()     — tool schemas to expose to the model
  handle_tool_call()     — dispatch a tool call
  shutdown()             — clean exit

Optional hooks (override to opt in):
  on_turn_start(turn, message, **kwargs)
  on_session_end(messages)               — end-of-session extraction
  on_session_switch(new_session_id, **kwargs)
  on_pre_compress(messages) -> str       — extract before compression
  on_memory_write(action, target, content, metadata=None)
  on_delegation(task, result, **kwargs)
```

Notable hooks:

- `prefetch(query)` is *background*: the implementation kicks off retrieval after each turn (`queue_prefetch`) and returns the cached result synchronously on the next turn. The system prompt stays cache-stable; the retrieved context is injected separately.
- `on_pre_compress(messages)` lets the provider extract insight from messages about to be discarded — so compression doesn't destroy memory-relevant content.
- `on_delegation(task, result)` lets the parent agent's memory observe what subagents did, even though the subagents themselves run with `skip_memory=True`.

`agent/memory_manager.py` is the orchestrator; it enforces the one-provider rule, wires the hooks, and handles `sanitize_context` (imported from `run_agent.py:141`) which scrubs sensitive content from messages before they're handed to a provider.

Providers ship as plugins (`plugins/memory/<name>/`) with their own CLI subcommands. `hermes_cli/main.py` documents Honcho's surface (`hermes honcho setup/status/sessions/peer/mode/tokens/identity/migrate`, lines 21-43) — this is unusually deep integration for what is, technically, a third-party service.

### Layer 3 — Session search (`tools/session_search_tool.py`, `hermes_state.py`)

Every Hermes conversation, on every platform, is persisted to `~/.hermes/state.db`, a SQLite database with an FTS5 virtual table over message contents (`hermes_state.py:1-15`). The `session_search` tool exposed to the agent (`tools/session_search_tool.py:1-18`) searches across all past sessions:

```
1. FTS5 search finds matching messages ranked by relevance
2. Groups by session, takes the top N unique sessions (default 3)
3. Loads each session's conversation, truncates to ~100k chars centered on matches
4. Sends to the configured auxiliary model with a focused summarization prompt
5. Returns per-session summaries with metadata
```

A cheap auxiliary model (configured under `auxiliary.session_search` in `config.yaml`) does the summarization, so the main agent sees compressed recall, not raw transcripts. The README calls this *"FTS5 session search with LLM summarization for cross-session recall."*

`hermes_state.py:42-58` documents an unusual fallback: if WAL mode fails because the database is on NFS/SMB/WSL1, it falls back to `journal_mode=DELETE` rather than crashing — concurrency drops but the feature works. This kind of "degrade, never fail" approach is consistent across the codebase.

### Layer 4 — The curator (`agent/curator.py`, `agent/curator_backup.py`)

The curator is a *background skill-maintenance system* that auto-archives stale skills and (optionally) consolidates them. `AGENTS.md` lines 639-668 documents it; the module docstring (`curator.py:1-20`) summarizes:

> *"The curator is an auxiliary-model task that periodically reviews agent-created skills and maintains the collection. It runs inactivity-triggered (no cron daemon): when the agent is idle and the last curator run was longer than `interval_hours` ago, `maybe_run_curator()` spawns a forked AIAgent to do the review. … Strict invariants: Only touches agent-created skills … Never auto-deletes — only archives. Archive is recoverable. Pinned skills bypass all auto-transitions. Uses the auxiliary client; never touches the main session's prompt cache."*

The curator is what makes "the agent grows with you" not just a tagline. The model creates skills during use (the `/skill new` flow or autonomous skill creation after complex tasks). Telemetry sidecar `tools/skill_usage.py` writes `~/.hermes/skills/.usage.json` — per-skill `use_count`, `view_count`, `patch_count`, `last_activity_at`, `state` (active/stale/archived), `pinned`. The curator periodically:

- Auto-transitions states (active → stale at 30 days idle, → archived at 90 days)
- Spawns a forked `AIAgent` running a *different* model (the auxiliary client) which can `pin`, `archive`, `consolidate`, or `patch` agent-created skills via `skill_manage`
- Backs up the whole skills directory as a tar.gz before destructive runs (`curator_backup.py`)

Two invariants matter for slide-worthiness:

1. **Only agent-created skills are touched** (`AGENTS.md` line 653) — bundled skills and hub-installed skills are off-limits.
2. **Never deletes** — `archive` is the most destructive action, and archives are restorable.

### Layer 5 — Other memory-adjacent surfaces

- **SOUL.md** — user-authored persona that overrides DEFAULT_AGENT_IDENTITY (`prompt_builder.py::load_soul_md`). Migrated automatically from OpenClaw.
- **Workspace AGENTS.md / CLAUDE.md / .cursorrules** — picked up by `_find_git_root` and `build_context_files_prompt`, scanned for injection, injected into the system prompt.
- **Honcho dialectic user modeling** — the README and `hermes honcho` CLI suite suggest deep integration with [Plastic Labs Honcho](https://github.com/plastic-labs/honcho), which maintains a *dialectic* model of the user (peer-vs-peer reasoning between an AI peer and a user peer) on top of vanilla recall.

## Tool & Skill System

### Tools (`tools/registry.py` + `tools/*.py`)

Each tool file calls `registry.register(...)` at module top level. `model_tools.py::discover_builtin_tools()` walks the `tools/` directory, imports every `.py` file, and the registry collects schemas and handlers as a side effect. From `CONTRIBUTING.md` lines 244-303, registration looks like:

```python
from tools.registry import registry

def my_tool(param1: str, param2: int = 10, **kwargs) -> str:
    return json.dumps(do_work(param1, param2))

MY_TOOL_SCHEMA = {"type": "function", "function": {...}}

registry.register(
    name="my_tool",
    toolset="my_toolset",
    schema=MY_TOOL_SCHEMA,
    handler=lambda args, **kw: my_tool(**args, **kw),
    check_fn=_check_requirements,
)
```

Auto-discovery means there is **no central import list** to maintain; just adding a file makes the tool discoverable. The tool name must still appear in a toolset list in `toolsets.py` (`_HERMES_CORE_TOOLS` or a named bundle) for an agent to actually be offered it (`AGENTS.md` lines 296-300).

### Toolsets

`toolsets.py` defines a single `TOOLSETS` dict. Each platform picks a per-platform toolset (e.g. Telegram → `hermes-telegram`, Discord → `hermes-discord`), most of which inherit `_HERMES_CORE_TOOLS`. There's also a generic `messaging` toolset for cross-platform send. The current toolset keys (`AGENTS.md` lines 592-596):

> *"browser, clarify, code_execution, cronjob, debugging, delegation, discord, discord_admin, feishu_doc, feishu_drive, file, homeassistant, image_gen, kanban, memory, messaging, moa, rl, safe, search, session_search, skills, spotify, terminal, todo, tts, video, vision, web, yuanbao."*

Per-platform enable/disable is exposed via the `hermes tools` curses UI or `tools.<platform>.enabled/disabled` lists in `config.yaml`.

### Skills

Skills are *procedural memory* — Markdown documents the agent can load on demand. Two directories:

- **`skills/`** — bundled, loadable by default. Organized by category (`skills/github/`, `skills/mlops/`, …).
- **`optional-skills/`** — heavier/niche skills shipped but **not active by default**. Categories include `autonomous-ai-agents`, `blockchain`, `communication`, `creative`, `devops`, `email`, `health`, `mcp`, `migration`, `mlops`, `productivity`, `research`, `security`, `web-development`. Installed via `hermes skills install official/<category>/<skill>` (`AGENTS.md` lines 560-570).

`tools/skills_tool.py` (the docstring at lines 1-67) explicitly cites Anthropic's Claude Skills as inspiration:

> *"Inspired by Anthropic's Claude Skills system with progressive disclosure architecture: Metadata (name ≤64 chars, description ≤1024 chars) - shown in skills_list; Full Instructions - loaded via skill_view when needed; Linked Files (references, templates) - loaded on demand."*

And the format is **agentskills.io compatible** — the README explicitly states: *"Compatible with the [agentskills.io](https://agentskills.io) open standard."* This makes Hermes skills portable to/from any other agent supporting the standard.

A `SKILL.md` is a Markdown file with YAML frontmatter. From `tools/skills_tool.py:28-46`:

```yaml
---
name: skill-name              # Required, ≤64 chars
description: Brief description # Required, ≤1024 chars
version: 1.0.0
license: MIT
platforms: [macos]            # Optional OS-gating
prerequisites:
  env_vars: [API_KEY]
  commands: [curl, jq]
metadata:
  hermes:
    tags: [fine-tuning, llm]
    related_skills: [peft, lora]
---
```

`CONTRIBUTING.md` lines 393-401 documents additional Hermes-specific keys under `metadata.hermes` for conditional visibility:

```yaml
metadata:
  hermes:
    fallback_for_toolsets: [web]      # Show ONLY when these toolsets are unavailable
    requires_toolsets: [terminal]     # Show ONLY when these toolsets are available
```

The `fallback_for_*` / `requires_*` conditions (`CONTRIBUTING.md` lines 393-401) let skills present themselves *conditionally* — e.g. a DuckDuckGo search skill that only appears when Firecrawl (the paid `web` toolset) is unavailable. Filtering happens in `agent/prompt_builder.py::build_skills_system_prompt()` via `_skill_should_show()`.

Skills can also declare `required_environment_variables` (the new format) which triggers a CLI-only secure prompt when the skill is loaded — secrets are stored in `~/.hermes/.env`, never injected into the conversation.

### MCP integration

Hermes supports MCP servers as a first-class extension surface — documented in the README's docs table (line 116) and surfaced in tools like `acp_adapter/server.py` which imports `McpServerHttp`, `McpServerSse`, `McpServerStdio` from the ACP schema. The README also lists `optional-skills/mcp/` as one of the optional-skill categories. MCP servers are configured per-session and merged into the available toolsets.

### Plugins (`hermes_cli/plugins.py` + `plugins/<name>/`)

Three plugin surfaces (`AGENTS.md` lines 466-540):

1. **General plugins** — register lifecycle hooks (`pre_tool_call`, `post_tool_call`, `pre_llm_call`, `post_llm_call`, `on_session_start`, `on_session_end`), new tools via `ctx.register_tool(...)`, and CLI subcommands via `ctx.register_cli_command(...)`. Discovered from `~/.hermes/plugins/`, `./.hermes/plugins/`, and pip entry points.
2. **Memory-provider plugins** — `plugins/memory/<name>/` (covered above).
3. **Model-provider plugins** — `plugins/model-providers/<name>/`. Every inference backend (openrouter, anthropic, gmi, deepseek, nvidia, …) is a plugin, registered lazily via `providers.register_provider(ProviderProfile(...))`. The scan order is: bundled → user → legacy `providers/<name>.py`. **User plugins override bundled ones** — last-writer-wins, by design, so third parties can swap built-in profiles without patching the repo (`AGENTS.md` lines 529-533).

A non-trivial rule from `AGENTS.md` lines 509-514:

> *"**Rule (Teknium, May 2026):** plugins MUST NOT modify core files (`run_agent.py`, `cli.py`, `gateway/run.py`, `hermes_cli/main.py`, etc.). If a plugin needs a capability the framework doesn't expose, expand the generic plugin surface (new hook, new ctx method) — never hardcode plugin-specific logic into core."*

This is signed by a person (Teknium, one of Nous's founders) and dated, which signals it's a load-bearing policy decision, not a guideline.

### Delegation (`tools/delegate_tool.py`)

`delegate_task` spawns a subagent in an isolated context with its own terminal session. Synchronous — parent blocks on child. Two shapes (`AGENTS.md` lines 614-617):

- **Single:** `delegate_task(goal=..., context=..., toolsets=[...])`.
- **Batch (parallel):** `delegate_task(tasks=[...])` — each gets its own subagent running concurrently. Concurrency capped by `delegation.max_concurrent_children` (default 3).

Two roles (lines 618-625):

- `role="leaf"` (default) — focused worker. Cannot call `delegate_task`, `clarify`, `memory`, `send_message`, `execute_code`.
- `role="orchestrator"` — can spawn further workers. Bounded by `delegation.max_spawn_depth` (default 2).

The synchronicity rule (line 632-634):

> *"delegate_task is **not** durable. For long-running work that must outlive the current turn, use `cronjob` or `terminal(background=True, notify_on_complete=True)` instead."*

## Model Coupling & Local-First Inference

Despite being made by the people who train the Hermes series of open-weight LLMs, **Hermes Agent is provider-agnostic by design**. Every inference backend is a plugin (`plugins/model-providers/<name>/`), and switching is a single command: `hermes model`.

The README (line 17) is explicit about the supported set:

> *"Use any model you want — Nous Portal, OpenRouter (200+ models), NVIDIA NIM (Nemotron), Xiaomi MiMo, z.ai/GLM, Kimi/Moonshot, MiniMax, Hugging Face, OpenAI, or your own endpoint. Switch with `hermes model` — no code changes, no lock-in."*

`cli-config.yaml.example` lines 14-46 enumerates the first-class providers:

| Provider key | Requires |
|---|---|
| `auto` | auto-detect from credentials |
| `openrouter` | OPENROUTER_API_KEY or OPENAI_API_KEY |
| `nous` | `hermes login` (Nous Portal OAuth) |
| `nous-api` | NOUS_API_KEY |
| `anthropic` | ANTHROPIC_API_KEY |
| `openai-codex` | `hermes auth` |
| `copilot` | GITHUB_TOKEN |
| `gemini`, `zai`, `kimi-coding`, `minimax`, `minimax-cn`, `huggingface`, `nvidia`, `xiaomi`, `arcee`, `ollama-cloud`, `kilocode`, `ai-gateway` | per-provider key |
| `lmstudio` | optional LM_API_KEY, defaults to `http://127.0.0.1:1234/v1` |
| `custom` | any OpenAI-compatible endpoint; aliases `ollama`, `vllm`, `llamacpp` |

The presence of `lmstudio` as a *first-class* provider, plus aliases for `ollama`, `vllm`, and `llamacpp`, signals genuine local-first intent — most agents that nominally support local models treat them as a footnote. Hermes also detects local endpoints in `agent/model_metadata.py::is_local_endpoint()` and queries `query_ollama_num_ctx()` to figure out the actual context length the local server was started with.

The auxiliary client (`agent/auxiliary_client.py`) is a *separate* model configuration for side tasks — vision, embedding, title generation, session_search, curator. Each can pin its own provider/model/`base_url`/`max_tokens`/`reasoning_effort`. Default routing is "auto" — same as the main client — but you can run, say, the main turn against Anthropic Opus and the session_search summarizer against a cheap local Hermes 3.

API mode is configurable per-provider (`api_mode: "chat_completions" | "codex_responses" | ...`, `AGENTS.md` line 95). The OpenAI Responses API and Anthropic native API are also supported, so it's not strictly "OpenAI chat completions or bust."

## Datagen & Batch Runner

`batch_runner.py` is what makes Hermes also a *training-data factory*. The header (lines 1-21):

> *"Batch Agent Runner — Parallel batch processing capabilities for running the agent across multiple prompts from a dataset. It includes: Dataset loading and batching, Parallel batch processing with multiprocessing, Checkpointing for fault tolerance and resumption, Trajectory saving in the proper format (from/value pairs), Tool usage statistics aggregation across all batches."*

Usage:

```
python batch_runner.py --dataset_file=data.jsonl --batch_size=10 --run_name=my_run
python batch_runner.py --dataset_file=data.jsonl --batch_size=10 --run_name=my_run --resume
python batch_runner.py --dataset_file=data.jsonl --batch_size=10 --run_name=my_run --distribution=image_gen
```

What it produces is a corpus of *agent trajectories* — full `(prompt, tool_call_sequence, response, reasoning)` records — suitable for SFT (supervised fine-tuning) of tool-calling models. `batch_runner.py:60-65`:

```python
# All possible tools - auto-derived from the master mapping in model_tools.py.
# Used for consistent schema in Arrow/Parquet (HuggingFace datasets)
ALL_POSSIBLE_TOOLS = set(TOOL_TO_TOOLSET_MAP.keys())
```

Output schema is normalized so HuggingFace `datasets` can load the JSONL without schema mismatches — every trajectory has a complete `tool_stats` dict with zero counts for unused tools. Both native-reasoning models (which return `assistant_msg["reasoning"]`) and `<REASONING_SCRATCHPAD>` XML-style reasoning are recognized when computing trajectory metrics (`_extract_reasoning_stats`, lines 208-240).

The README puts the workflow in plain terms (line 26): *"Research-ready: Batch trajectory generation, Atropos RL environments, trajectory compression for training the next generation of tool-calling models."*

### Toolset distributions

`toolset_distributions` (imported at `batch_runner.py:50`) defines named **probabilistic toolset bundles** — `list_distributions()`, `sample_toolsets_from_distribution()`, `validate_distribution()`. A run can be configured to sample, per batch, a varying subset of tools, producing trajectories that exercise different agent shapes — useful for training a model not to require a fixed tool inventory.

### RL environments — Atropos integration (`environments/`)

`environments/` is a separate concern from the SFT pipeline: it wraps the Hermes agent loop into Atropos `BaseEnv` subclasses so it can be a *training environment* for RL.

Diagram from `environments/README.md:5-31`:

```
                    Atropos Framework
                ┌───────────────────────┐
                │       BaseEnv          │  (atroposlib)
                │  - Server management   │
                │  - Worker scheduling   │
                │  - Wandb logging       │
                └───────────┬───────────┘
                            │ inherits
                ┌───────────┴───────────┐
                │  HermesAgentBaseEnv    │
                │  - Terminal backend    │
                │  - Tool resolution     │
                │  - Agent loop          │
                │  - ToolContext          │
                └───────────┬───────────┘
                            │ inherits
          ┌─────────────────┼─────────────────┐
          │                 │                  │
 TerminalTestEnv     HermesSweEnv    TerminalBench2EvalEnv
```

`HermesAgentLoop` (`environments/agent_loop.py`) is described as *"the reusable multi-turn agent engine. It runs the same pattern as hermes-agent's `run_agent.py`."* This is the same loop, repackaged for offline rollouts.

`ToolContext` (`environments/tool_context.py`) is the clever bit: the reward function gets a handle to the *same* terminal/browser/file sandbox the model used during the rollout. So `compute_reward(item, result, ctx)` can run `ctx.terminal("pytest -v")` and grade the model on whether its claimed solution actually passes — the verifier executes in the model's own sandbox state.

Two operating phases:

- **Phase 1 (OpenAI server)** — `server.chat_completion()` with `tools=...`; native tool-call parsing. Used for eval and SFT trajectory generation.
- **Phase 2 (vLLM ManagedServer)** — `/generate` with raw tokens, logprobs, and masks. Client-side tool-call parsers (the `environments/tool_call_parsers/` set) reconstruct structured `tool_calls`. Used for full RL training (GRPO/PPO).

Three shipping environments: `TerminalTestEnv` (stack validation), `HermesSweEnv` (SWE-bench style), `TerminalBench2EvalEnv` (89 tasks from Terminal-Bench 2.0 with Modal sandboxes), plus `tblite/` (100 calibrated proxy tasks) and `yc_bench/` (long-horizon strategic benchmark).

The chain is unusually tight: the same agent runtime that you type at in the CLI is also the one being rolled out for RL training of the model it will be running. This is a deliberate Nous Research design — the agent is its own training distribution.

## Cron / Scheduled Autonomy

`cron/jobs.py` is the job store, `cron/scheduler.py` is the tick loop. Both Markdown-driven and tool-driven: users via `hermes cron <verb>` or `/cron`, agents via the `cronjob` tool.

`AGENTS.md` lines 670-703 documents the system. Schedule formats:

- Duration: `"30m"`, `"2h"`, `"1d"`
- "every" phrase: `"every 2h"`, `"every monday 9am"`
- 5-field cron expression: `"0 9 * * *"`
- ISO timestamp (one-shot): `"2026-06-01T09:00:00Z"`

Per-job fields are unusually rich:

- `skills` — a job can pre-load specific skills (e.g. nightly "research-arxiv" job loads only the arxiv skill)
- `model` / `provider` overrides — cheap model for the routine work
- `script` — a pre-run data-collection script whose stdout is injected into the prompt (`no_agent=True` turns the script into the entire job)
- `context_from` — chain job A's last output into job B's prompt
- `workdir` — run in a specific directory with that directory's AGENTS.md/CLAUDE.md loaded
- Multi-platform delivery — results are pushed to Telegram/Discord/Slack/email

Hardening invariants (`AGENTS.md` lines 691-700):

- **3-minute hard interrupt** on cron sessions — runaway agent loops can't monopolize the scheduler
- Catchup window: half the job's period, clamped to 120s-2h
- Grace window: 120s for one-shot jobs whose fire time was missed
- File lock at `~/.hermes/cron/.tick.lock` prevents duplicate ticks across processes
- Cron sessions pass `skip_memory=True` by default — *"memory providers intentionally do not run during cron"* (line 698)

The last invariant is interesting: scheduled jobs don't feed the user-model — they're not "you," they're an automation. This keeps the agent's user model from being polluted by system-prompted background activity.

Cron also has its own **prompt-injection scanner** for assembled prompts (`cron/scheduler.py:45-56`), specifically because cron jobs auto-approve and a malicious skill could otherwise carry a payload that reaches an unattended agent.

The README pitches this as: *"Scheduled automations: Built-in cron scheduler with delivery to any platform. Daily reports, nightly backups, weekly audits — all in natural language, running unattended."*

## Gateway

`gateway/run.py::GatewayRunner` is a single long-lived process that connects to many messaging platforms simultaneously. The list (`AGENTS.md` line 40):

> *"telegram, discord, slack, whatsapp, homeassistant, signal, matrix, mattermost, email, sms, dingtalk, wecom, weixin, feishu, qqbot, bluebubbles, yuanbao, webhook, api_server, …"*

Each platform is an adapter under `gateway/platforms/`. The gateway maintains an LRU agent cache (max 128, 1h idle TTL — `gateway/run.py:61-62`) so per-session state survives between user messages without holding everything resident.

What makes the gateway non-trivial:

1. **Cross-platform session continuity** — the same user can DM the bot on Telegram, follow up on Discord, then check status from email; sessions are keyed in a way that supports this if `terminal.cwd` is shared and the credentials are linked. The README calls this *"cross-platform conversation continuity."*
2. **Voice memo transcription** — voice notes received via messaging are STT'd before the agent sees them (`stt` config section).
3. **Background-process watchers** — when an agent runs `terminal(background=True, notify_on_complete=True)` from a messaging session, the gateway runs a watcher that detects completion and triggers a new agent turn delivered to the same channel (`AGENTS.md` lines 762-772). Verbosity controlled by `display.background_process_notifications` (`all` / `result` / `error` / `off`).
4. **Cron is in the gateway by default** — `cron/scheduler.py` is invoked from a background thread in the gateway (`_start_cron_ticker` in `gateway/run.py`, default 60s interval). The kanban dispatcher is also in the gateway by default (`kanban.dispatch_in_gateway: true`, `AGENTS.md` line 727). Running the gateway gives you autonomous-Hermes for free.
5. **Two-guard architecture** — `AGENTS.md` lines 855-865 documents that messages pass through both `gateway/platforms/base.py::_pending_messages` queue *and* `gateway/run.py`'s control-command interception. Approval and `/stop` commands must bypass both guards to reach a running agent — getting this wrong has been a recurring bug class.

The `api_server` adapter is an *OpenAI-compatible HTTP server* exposed by the gateway — Hermes can pretend to be a chat-completions provider for other tools, with the agent looping behind it.

There's no `gateway/` that does inference routing per se — model routing is in `plugins/model-providers/`. The gateway routes *messages*, not tokens.

## Design Philosophy & Distinctive Choices

A few clarifying quotes from the source material:

**From the README (line 15):**

> *"It's the only agent with a built-in learning loop — it creates skills from experience, improves them during use, nudges itself to persist knowledge, searches its own past conversations, and builds a deepening model of who you are across sessions."*

**On hardware sovereignty (README line 25):**

> *"Runs anywhere, not just your laptop — Seven terminal backends — local, Docker, SSH, Singularity, Modal, Daytona, and Vercel Sandbox. Daytona and Modal offer serverless persistence — your agent's environment hibernates when idle and wakes on demand, costing nearly nothing between sessions. Run it on a $5 VPS or a GPU cluster."*

**On training reflexivity (README line 26):**

> *"Research-ready: Batch trajectory generation, Atropos RL environments, trajectory compression for training the next generation of tool-calling models."*

**On model lock-in (README line 17):**

> *"Switch with `hermes model` — no code changes, no lock-in."*

**On the plugin policy (`AGENTS.md` line 510, attributed and dated):**

> *"**Rule (Teknium, May 2026):** plugins MUST NOT modify core files (`run_agent.py`, `cli.py`, `gateway/run.py`, `hermes_cli/main.py`, etc.). If a plugin needs a capability the framework doesn't expose, expand the generic plugin surface (new hook, new ctx method) — never hardcode plugin-specific logic into core."*

**On test discipline (`AGENTS.md` lines 941-989) — relevant because it reveals how the team thinks about long-running maintenance:**

> *"A test is a **change-detector** if it fails whenever data that is **expected to change** gets updated — model catalogs, config version numbers, enumeration counts, hardcoded lists of provider models. These tests add no behavioral coverage; they just guarantee that routine source updates break CI. … The rule: if the test reads like a snapshot of current data, delete it. If it reads like a contract about how two pieces of data must relate, keep it."*

### Distinctive editorial stances

- **Open-weight first, but happy to use proprietary models.** Despite Nous training open-weight Hermes models, the agent treats Anthropic Opus, OpenAI, and Google Gemini as fully first-class. The bet is *agent infrastructure as a commons*, not "ours-or-nothing."
- **The agent edits its own substrate.** Skills are CRUDable by the agent. Memory is CRUDable by the agent. Cron jobs are CRUDable by the agent. The system isn't just a tool runtime; it's a workspace the model mutates.
- **Curator-mediated growth, not unbounded accumulation.** Memory has a 2,200-character cap. Skills get archived when stale. The curator only touches *agent-created* artifacts and never deletes. Growth is bounded, audited, and reversible.
- **Prefix-cache discipline as a hard rule.** "ONLY time we alter context is during compression" — this is a cost-control philosophy embedded in the architecture, not an optimization tacked on.
- **Multi-process, multi-surface, but one source of truth.** CLI, TUI, gateway, ACP, dashboard, cron — all run different processes but converge on `~/.hermes/state.db` and `~/.hermes/skills/`. Sessions are portable across surfaces by virtue of being persisted centrally.
- **Defense in depth on prompt injection.** Memory content is scanned (`tools/memory_tool.py:_scan_memory_content`), context files are scanned (`agent/prompt_builder.py:_scan_context_content`), and cron prompts are *re-scanned after assembly* (`cron/scheduler.py:CronPromptInjectionBlocked`) because skill content can change between create-time and run-time. The model can write injection-flavored content into its own memory; the runtime refuses to load it.
- **Migration as a first-class verb.** `hermes claw migrate` is a documented command, with `--dry-run`, `--preset user-data`, `--overwrite` flags. Hermes treats "you used to use a different thing" as a supported state, not a footnote.
- **Cross-platform Windows commitment.** `CONTRIBUTING.md` lines 530-700 is an extremely long, specific, gotcha-laden Windows-compatibility guide ("Never call `os.kill(pid, 0)` for liveness checks…"). The depth of these notes suggests Hermes is genuinely run on Windows in production, not just compiled there.

## Key Takeaways

1. **Hermes is a multi-surface agent operating system, not a CLI.** CLI, TUI (Ink), messaging gateway (Telegram/Discord/Slack/WhatsApp/Signal/Email/…), ACP editor server, web dashboard, and cron scheduler all run the same `AIAgent` core against a shared SQLite session store. The agent follows the user across surfaces.

2. **"Grows with you" is a four-layer memory architecture, not a tagline.** (a) Bounded file-backed memory (`MEMORY.md` + `USER.md`, ~3.5KB total, frozen-snapshot pattern), (b) pluggable external providers (Honcho, Mem0, Hindsight, …) with a rich lifecycle including `on_pre_compress` and `on_delegation` hooks, (c) FTS5 session search with auxiliary-model summarization for cross-session recall, and (d) a background curator that auto-archives stale *agent-created* skills using an auxiliary forked agent — never deletes, only archives, never touches bundled skills.

3. **Provider-agnostic by ideology, open-weight-friendly by infrastructure.** Built by an open-weights lab but ships with first-class adapters for ~20 providers including LM Studio, Ollama, vLLM, and llama.cpp. The agent also ships *its own client-side tool-call parsers* for ~12 model dialects (`environments/tool_call_parsers/`) so it can run against bare-metal vLLM `/generate` endpoints, not just OpenAI-compatible servers.

4. **The agent is also a training-data factory.** `batch_runner.py` runs the same `AIAgent` loop in parallel against a JSONL dataset to produce normalized SFT trajectories. `environments/` wraps it as Atropos RL `BaseEnv` subclasses with `ToolContext` letting reward functions execute in the model's own sandbox. The runtime is its own training distribution.

5. **The plugin discipline is unusually strict and policy-bound.** General plugins, memory plugins, and model-provider plugins are *separate discovery systems*. Signed-and-dated rules (Teknium, May 2026) forbid plugins from modifying core files; the response to "the plugin needs more" is "expand the plugin surface, don't special-case the core." This is the kind of policy you only impose if you've already been bitten by it.

6. **Prefix-cache discipline drives architecture, not just performance.** Memory is a *frozen snapshot* injected at session start; mid-session writes go to disk immediately but don't update the system prompt. Slash commands that mutate state default to deferred invalidation with opt-in `--now`. Compression is the only sanctioned mid-conversation context mutation. Cost control is built into the system, not added on.
