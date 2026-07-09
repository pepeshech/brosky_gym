# Gemini Global Config Dump — `C:\Users\user\.gemini\`

Source folder located at `C:\Users\user\.gemini\`. All files read via PowerShell `Get-Content`.
NOTE: Russian (Cyrillic) text shows encoding artifacts in some files because the terminal
output is not UTF-8 clean; English/JSON/code content is preserved exactly.

## A. Full config file tree (excluding .git / .system_generated / brain noise)

```
.gemini\
├── google_accounts.json            (auth — credentials, NOT dumped, sensitive)
├── oauth_creds.json                (auth — credentials, NOT dumped, sensitive)
├── projects.json
├── state.json
├── trustedFolders.json
├── index.md                        (OKF root index)
├── log.md                          (OKF change log)
├── settings.json                   (Gemini CLI settings)
├── antigravity-backup\mcp_config.json
├── antigravity-cli\
│   ├── mcp_config.json             (obsidian-brain MCP)
│   ├── settings.json               (CLI settings + trusted workspaces)
│   ├── builtin\keep.txt
│   ├── builtin\skills\agy-customizations\SKILL.md (+docs/*)
│   ├── builtin\skills\antigravity_guide\SKILL.md (+references/*)
│   ├── mcp\obsidian-brain\search_obsidian.json
│   ├── mcp\obsidian-brain\write_obsidian_note.json
│   └── updater\update_status.json
├── config\
│   ├── AGENTS.md                   (SYSTEM PROMPT / persona)
│   ├── config.json
│   ├── mcp_config.json             (obsidian-brain MCP — canonical)
│   ├── agents\
│   │   ├── README.md
│   │   ├── code-reviewer.md
│   │   ├── security-auditor.md
│   │   └── test-engineer.md
│   ├── projects\*.json             (7 project config json)
│   └── skills\                     (26 skill folders, each SKILL.md)
│       ├── README.md
│       ├── okf-initializer\SKILL.md
│       ├── api-and-interface-design\, browser-testing-with-devtools\,
│       ├── ci-cd-and-automation\, code-quality-and-review\, code-reviewer\,
│       ├── code-simplification\, context-engineering\, dex-trading-strategies\,
│       ├── documentation-and-adrs\, doubt-driven-development\, executing-plans\,
│       ├── html\(+references\html-effectiveness\), html-visual-templates\,
│       ├── hummingbot-expertise\(+references\), hummingbot-infra-manager\,
│       ├── karpathy-guidelines\, meta-agent-control\, performance-optimization\,
│       ├── security-auditor\, self-improvement-curator\, shipping-and-launch\,
│       ├── source-driven-development\, test-engineer\,
│       ├── trading-dashboard-ux-stability\, ui-ux-pro-max\
├── policies\
│   ├── auto-saved.toml
│   ├── index.md
│   └── user-optimized.toml
└── (antigravity-cli\brain\* — conversation history, .git repos, transcripts — NOISE, skipped)
```

## B. CRITICAL: settings.json (Gemini CLI)

```json
{
  "ide": { "hasSeenNudge": true },
  "security": {
    "auth": { "selectedType": "oauth-personal" },
    "environmentVariableRedaction": {
      "blocked": ["*SECRET*", "*API_KEY*", "*PASSWORD*", "*TOKEN*", "DATABASE_URL"]
    }
  },
  "general": { "preferredEditor": "vscode" },
  "privacy": { "usageStatisticsEnabled": false },
  "telemetry": { "enabled": true },
  "ui": { "inlineThinkingMode": "off" },
  "experimental": { "autoMemory": true },
  "tools": {
    "allowed": ["read_file","replace","write_file","run_shell_command","glob",
      "grep_search","web_fetch","invoke_agent","list_directory",
      "list_background_processes","read_background_output","google_web_search",
      "ask_user","enter_plan_mode"]
  },
  "modelConfigs": {
    "defaultModel": "gemini-1.5-flash",
    "overrides": [{
      "match": { "model": "gemini-2.0-pro-exp*" },
      "modelConfig": { "generateContentConfig": {
        "thinkingConfig": { "includeThoughts": true, "thinkingBudget": 24000 }
      }}
    }]
  }
}
```

## C. CRITICAL: config/mcp_config.json — obsidian-brain MCP (CANONICAL)

```json
{
  "mcpServers": {
    "obsidian-brain": {
      "command": "python",
      "args": ["C:/Users/user/.gemini/mcp/obsidian_brain.py"],
      "env": { "OBSIDIAN_VAULT_PATH": "E:/code/brain" }
    }
  }
}
```

Identical definition exists at `antigravity-cli/mcp_config.json` and `antigravity-backup/mcp_config.json`.
obsidian_brain.py script path: `C:\Users\user\.gemini\mcp\obsidian_brain.py` (NOT listed in filtered
tree — confirm it exists; the mcp\ folder under .gemini root may not have appeared because it has
no .md/.json/.yaml match — re-check). Vault = `E:/code/brain`.

## D. CRITICAL: antigravity-cli/settings.json (CLI permissions + trusted workspaces)

```json
{
  "allowNonWorkspaceAccess": true,
  "enableTelemetry": false,
  "gcp": { "project": "1231", "location": "global" },
  "model": "Gemini 3.5 Flash (Medium)",
  "permissions": {
    "allow": [
      "command(agy)", "command(powershell)", "command(npx)", "command(npm run)",
      "command(npm run dev)", "command(npm run preview)", "command(cmd)",
      "command(git status)", "command(Get-ChildItem *)", "command(Get-Content *)",
      "command(docker --version)", "command(Select-String *)",
      "mcp(obsidian-brain/search_obsidian)", "command(ngrok)", "mcp(obsidian-brain/*)"
    ]
  },
  "trustedWorkspaces": [
    "C:\\Users\\makso\\", "E:\\code\\", "E:\\code\\brosky_gym\\", "C:\\",
    "E:\\code\\crypto_parser\\", "C:\\Users\\user\\"
  ]
}
```

## E. obsidian-brain MCP tool schemas

search_obsidian.json:
```json
{"name":"search_obsidian",
 "description":"Search across notes in the Obsidian vault. Returns list of files with matched text.",
 "parameters":{"properties":{"query":{"title":"Query","type":"string"}},
   "required":["query"],"title":"search_obsidianArguments","type":"object"}}
```

write_obsidian_note.json:
```json
{"name":"write_obsidian_note",
 "description":"Create a new note in Obsidian (.md). Used for saving plans, reports, work results.",
 "parameters":{"properties":{
     "content":{"title":"Content","type":"string"},
     "overwrite":{"default":false,"title":"Overwrite","type":"boolean"},
     "title":{"title":"Title","type":"string"}},
   "required":["title","content"],"title":"write_obsidian_noteArguments","type":"object"}}
```

## F. CRITICAL: config/AGENTS.md — SYSTEM PROMPT / PERSONA

(Cyrillic mangled by terminal encoding, but structure 100% clear. English summary of content.)

Frontmatter: type: System Prompt, title: "System Prompt / Antigravity CLI persona",
description: senior engineer persona, UI/UX, Antigravity. tags:[system-prompt, config, persona].
timestamp: 2026-06-27T10:50:00Z.

Structure:
- <persona> = Senior IT-architect (15+ yrs FAANG, Web3 TVL >$50M) + strong UI/UX.
  Full-stack, DevOps, Web3, HTML-generation specialty. Tone: direct, reviews-oriented,
  pragmatic. No fluff, no "hello". Output structured, self-correcting.
- <core_principles>:
  1. PERSISTENT MEMORY (Tiered knowledge): read project context from /index.md,
     project status from MEMORY_PROJECTNAME.md.
  2. MANDATORY plan.md: every task starts with plan; propose plan.md (type:Plan, OKF YAML).
  3. OKF v0.1 standard: Markdown knowledge base, cross-links, YAML frontmatter
     (index.md, log.md must have YAML; in-project name MEMORY_*.md etc.).
  4. CHRONOLOGICAL logging in /log.md with ISO 8601 headers (### 2026-06-19).
  5. Self-Harness (auto-skill-creation): if >5 attempts on a problem → auto-create
     a skill in .gemini/config/skills/ (validate name+description in YAML).
  6. Maintenance: dedupe/archive stale skills via .gemini/config/skills/curator.md.
  7. SUBAGENTS: delegate via .gemini/config/agents/. Tasks vs skills.
  8. Quality & Security: TDD mandatory. Comments // GAS OPTIMIZATION, // SECURITY, // PERF.
     Validate Zod/Pydantic, no lazy any.
  9. ARCHITECTURE: Layered (UI/Logic/Data). Web3 (Viem/Wagmi), Telegram Mini Apps (LCP<1.2s).
- <execution_modes>:
  - mode_b_artifacts (when keywords "schematic","schema","mindmap","prototype","HTML"):
    generate HTML file in effective style, full self-contained <style>/<svg>, Google Fonts,
    Flexbox/Grid, animations.
  - mode_a_standard (default): Next.js App Router, React, Tailwind, TypeScript, Solidity, Python.
    Flow: research → minimal viable change (1-3 files) → diagram (Mermaid) → implementation review.

## G. CRITICAL: config/skills/okf-initializer/SKILL.md

Frontmatter:
- name: okf-project-initializer
- description: Auto-triggers when a project lacks index.md/log.md/MEMORY_*.md to initialize
  the OKF structure (soul.md, index.md, log.md, memory, plan.md, _GEMINI.md).

Body (Russian, content summary):
1. TRIGGER: if working dir lacks index.md, log.md, _GEMINI.md, MEMORY_*.md → new project →
   run initialization. (Only for real projects, not tool dirs like .gemini/.cursor.)
2. STEPS: detect project name; check for .agents dir; create files from templates
   (index.md, log.md, _GEMINI.md, MEMORY_*.md, .agents/user.md, .agents/soul.md, plan.md);
   create Logs/ folder with Logs/{YYYY-MM-DD}.md; log init to today's log.
3. TEMPLATES provided for: index.md (with okf_version:"0.1" + links to MEMORY/_GEMINI/.agents/
   log/plan), _GEMINI.md (persona workspace voice for project, auto-save rules, files map),
   log.md (pointer to Logs/), Logs/{date}.md, MEMORY_{PROJECT_NAME}.md (Tier 1 Core Project
   Memory), .agents/user.md (Tier 1 Core User Memory — ESM/TS/TDD, Persian Blue #466bf7,
   no emojis), .agents/soul.md (Lead Technical Architect persona, Russian comments +
   English vars, Layered Arch, Zod/Pydantic, TDD), plan.md (TODO steps).
4. MEMORY MAINTENANCE — 3-tier:
   - Tier 1 (Core Context): .agents/{soul,user}.md live ONLY in project root. Caps: MEMORY_*.md
     ~2200 chars, .agents/user.md ~1375 chars. Overflow → move text into docs/*.md, keep only
     links + current status.
   - Tier 2 (Session History, volatile): daily logs in Logs/ via log.md pointer. Step-level
     history auto-saved to brain/ + conversations/ JSONL/SQLite inside antigravity-cli/.
   - Tier 3 (Persistent Knowledge): reusable solutions → Skills (Markdown) in config/skills/.
     Weakness-mining results → antigravity-cli/knowledge/ with knowledge.lock.

## H. config/agents/ (3 subagent personas)

### README.md
Subagents callable via `invoke_subagent` with TypeName/Role.
- code-reviewer.md | security-auditor.md | test-engineer.md

### code-reviewer.md
name: code-reviewer. Senior code reviewer, 5 dimensions: Correctness, Readability,
Architecture, Security, Performance. Output: Critical/Important/Suggestion categories +
review template (Verdict APPROVE/REQUEST CHANGES, What's Done Well, Verification Story).
Invoke via /review (single) or /ship (parallel fan-out with security-auditor + test-engineer).
Do NOT delegate between personas — orchestration via slash commands only.

### security-auditor.md
name: security-auditor. Security engineer: Input Handling, AuthN/AuthZ, Data Protection,
Infrastructure, Third-Party. Severity: Critical/High/Medium/Low/Info. OWASP Top 10 baseline.
Invoke via /ship or /audit. No cross-persona delegation.

### test-engineer.md
name: test-engineer. QA engineer: analyze-before-write, test-at-right-level (Unit/Integration/E2E).
(Full body truncated in capture but frontmatter + framework intact.)

## I. config/skills/README.md — FULL SKILL CATALOG

System Skills: okf-project-initializer, html, html-diagram, html-plan.
Agent Personas (also as skills): code-reviewer, security-auditor, test-engineer.
Domain Skills (trading): hummingbot, hummingbot-developer, hummingbot-deploy,
  hummingbot-expertise, lp-agent, find-arbitrage-opps, find-xemm-opps, connectors-available,
  trading-dashboard-ux-stability, implementing-dex-gas-oracle, scanner-performance-optimization.
Engineering Practices: api-and-interface-design, browser-testing-with-devtools,
  ci-cd-and-automation, code-review-and-quality, code-simplification, context-engineering,
  deprecation-and-migration, documentation-and-adrs, doubt-driven-development, executing-plans,
  karpathy-guidelines, performance-optimization, receiving-code-review, shipping-and-launch,
  source-driven-development, using-agent-skills, using-superpowers, writing-skills.
Other: docling, ui-ux-pro-max.

NOTE: The Engineering Practices + Domain Skills above are ALREADY present in the current
environment as skill tools (see available `*_skill` tools). The unique/migration-critical
custom assets are: okf-initializer, AGENTS.md persona, the 3 agents, and the obsidian MCP.

## J. Root OKF state (index.md / log.md)

index.md: okf_version "0.1", "Core config: Antigravity CLI (.gemini)", links to
  /config/AGENTS.md, /log.md, /config/skills/README.md, /config/agents/README.md.
log.md: change log.
  - 2026-06-29: migrated 26 valid skills into config/skills/; 3 agents into config/agents/;
    deleted legacy .gemini/skills/ and .gemini/agents/; updated index.md.
  - 2026-06-27: removed obsolete GEMINI.md/GEMINI.md.bak; consolidated Self-Harness +
    OKF into UTF-8 config/AGENTS.md; created root index.md + log.md.
  - 2026-06-19: established OKF v0.1 in .gemini root; created index.md + log.md.

## K. NOT dumped (intentionally)
- google_accounts.json, oauth_creds.json — SENSITIVE credentials (redaction policy applies).
- projects.json, state.json, trustedFolders.json — runtime state, low migration value.
- config/projects/*.json — 7 per-project configs (can re-dump if needed).
- policies/*.toml — auto-saved/user-optimized policies (can re-dump if needed).
- antigravity-cli/brain/* — conversation transcripts, git repos (huge noise, no config value).
- The 26 SKILL.md bodies beyond okf-initializer — most already exist as skill tools here.
  Re-dumpable individually on request.
- C:\Users\user\.gemini\mcp\obsidian_brain.py — CONFIRMED EXISTS (2960 bytes). See section L.

## L. obsidian_brain.py — MCP server script (CONFIRMED EXISTS, 2960 bytes)

Path: `C:\Users\user\.gemini\mcp\obsidian_brain.py`
Stack: Python, `from mcp.server.fastmcp import FastMCP` (FastMCP).
Server name: `FastMCP("Obsidian brain")`.
Vault resolved from env `OBSIDIAN_VAULT_PATH` (default `/path/to/your/obsidian/vault`).

Resources:
- `@mcp.resource("obsidian://{title}")` get_obsidian_note(title) → reads {title}.md from vault.

Tools:
- `@mcp.tool() search_obsidian(query: str)` → rglob *.md, case-insensitive substring match,
  returns list of files with matched text + context.
- `@mcp.tool() write_obsidian_note(title, content, overwrite=False)` → writes note .md to vault
  (per write_obsidian_note.json schema; used for plan.md, reports, results).

Launch: `python C:/Users/user/.gemini/mcp/obsidian_brain.py` with env OBSIDIAN_VAULT_PATH=E:/code/brain.

## MIGRATION NOTES
1. obsidian-brain MCP is the key integration: python server + vault E:/code/brain.
2. Persona/system prompt lives in config/AGENTS.md (Cyrillic — needs UTF-8 clean re-read).
3. OKF v0.1 structure (index.md/log.md/MEMORY_*/.agents/soul+user/plan.md/Logs/) is the
   knowledge methodology to replicate.
4. 3 subagents (code-reviewer/security-auditor/test-engineer) + okf-initializer are the
   custom assets; ~20 other skills are generic & already available as skill tools.
