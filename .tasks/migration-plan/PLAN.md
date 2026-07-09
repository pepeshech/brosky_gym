# ПЛАН ПЕРЕРАБОТКИ Veai: импорт из C:\Users\user\.gemini\

Статус: ВЫПОЛНЯЕТСЯ. Решения пользователя получены.
- Скиллы: ВСЕ 26 (включая trading)
- Агенты: референс в .veai/rules/agents-reference/
- ui-ux-pro-max: восстановить по описанию

---

## 0. Что изучено (без исключений)

### Проект brosky_gym (`E:\code\brosky_gym`) — OKF v0.1
- `_GEMINI.md`, `index.md`, `MEMORY_BROSKY_GYM.md`, `log.md`, `plan.md` — оперативные файлы OKF (НЕ трогать)
- `.agents/soul.md`, `.agents/user.md` — Tier 1 persona/preferences
- Стек: React / TS / Tailwind v4 / Zustand / Recharts / Docker / Nginx — PWA трекер

### Глобальный источник `C:\Users\user\.gemini\config\` (68 файлов + obsidian_brain.py)
Полный UTF-8 дамп в `.tasks/gemini-import/config-full-dump.md` (16 924 строки).

КРИТИЧНЫЕ АССЕТЫ:
- `config/AGENTS.md` — System Prompt persona (Senior IT-Архитектор, 9 core_principles, 2 execution_modes)
- `config/mcp_config.json` — единственный MCP: obsidian-brain (python+FastMCP, vault E:/code/brain)
- `config/agents/` — 3 субагента: code-reviewer, security-auditor, test-engineer (полные тексты)
- `config/skills/okf-initializer/SKILL.md` — скилл инициализации OKF v0.1 + 3-tier memory
- `config/skills/` — 26 скиллов (см. секцию выбора ниже)

### Текущее `.veai/` — ПОД ПОЛНУЮ ЗАМЕНУ
- `mcp_servers.json` — 9 MCP: context7, docker-mcp, mcp-echarts, kubernetes-mcp-server, memory, mcp-mermaid, playwright, sequential-thinking, token-optimizer
- `skills/` — 7 шаблонных скиллов: prisma-patterns, query-patterns, react-patterns, redis-patterns, scientific-thinking-scholar-evaluation, seatch-first(опечатка), springboot-patterns
- `rules/` — ПУСТО

---

## ФАЗА 1. Очистка (удалить всё старое в .veai)

1.1. Удалить `.veai/mcp_servers.json` (все 9 MCP серверов)
1.2. Удалить `.veai/skills/` целиком (все 7 шаблонных скиллов — не из .gemini, нерелевантны)
1.3. `.veai/rules/` оставить (пустая, заполнится в Фазе 4)

## ФАЗА 2. Импорт MCP (единственный — obsidian-brain)

2.1. Создать новый `.veai/mcp_servers.json`:
```json
{
  "obsidian-brain": {
    "command": "python",
    "args": ["C:/Users/user/.gemini/mcp/obsidian_brain.py"],
    "env": { "OBSIDIAN_VAULT_PATH": "E:/code/brain" }
  }
}
```
Конвертация: Gemini nested `{mcpServers:{...}}` → Veai flat `{...}`.
Тулзы MCP: search_obsidian(query), write_obsidian_note(title,content,overwrite), ресурс obsidian://{title}.

## ФАЗА 3. Импорт скиллов из .gemini\config\skills

Veai-формат SKILL.md: frontmatter `name`, `description`, `used-by: [Code, General]`, `schemaVersion: v0.1`.
Gemini-формат: только `name`, `description`. → Добавить `used-by` + `schemaVersion` при импорте.

КРИТИЧНО (однозначно):
- okf-initializer → `.veai/skills/okf-initializer/SKILL.md`

РЕЛЕВАНТНЫЕ React/TS/PWA (предлагаю импортировать):
- api-and-interface-design, browser-testing-with-devtools, ci-cd-and-automation,
  code-quality-and-review, code-simplification, context-engineering,
  documentation-and-adrs, doubt-driven-development, executing-plans,
  karpathy-guidelines, performance-optimization, shipping-and-launch,
  source-driven-development

НЕ РЕЛЕВАНТНЫЕ brosky_gym (предлагаю НЕ импортировать):
- hummingbot-expertise, hummingbot-infra-manager, dex-trading-strategies,
  trading-dashboard-ux-stability (trading-домен)

HTML execution mode скиллы (mode_b_artifacts — специфичны для Gemini persona):
- html, html-visual-templates (+ html/references/* — 20 HTML примеров)

ПОВРЕЖДЁН (нужен внешний источник):
- ui-ux-pro-max — 1410 символов U+FFFD, кириллица уничтожена безвозвратно

## ФАЗА 4. Импорт правил/persona → `.veai/rules/`

4.1. `config/AGENTS.md` → `.veai/rules/agents-persona.md` (System Prompt, 9 principles, 2 modes)
4.2. Адаптировать под Veai: пути `.gemini/config/skills/` → `.veai/skills/`; OKF файлы оставить как есть (в корне проекта)
4.3. `.agents/soul.md` и `.agents/user.md` остаются в корне проекта (Tier 1) — дополнительно не дублировать

## ФАЗА 5. Агенты — особый случай

Veai runtime УЖЕ предоставляет 3 агентa с идентичными ролями:
- call_code-reviewer_agent ↔ Gemini code-reviewer
- call_security-auditor_agent ↔ Gemini security-auditor
- call_test-engineer_agent ↔ Gemini test-engineer

Эти runtime-агенты не настраиваются файлами в `.veai`. Persona-тексты из .gemini совпадают по смыслу с встроенными описаниями. → Файлы config/agents/*.md НЕ импортируются как отдельная сущность; при желании их фреймворки можно вынести в rules/ как референс.

---

## ОТКРЫТЫЕ ВОПРОСЫ (нужно решение пользователя)

Q1. Какие скиллы импортировать? (все 26 / только релевантные / только okf-initializer)
Q2. HTML execution-mode скиллы (html, html-visual-templates) — импортировать или нет?
Q3. Что делать с повреждённым ui-ux-pro-max? (пропустить / найдёшь чистую копию / восстановлю по описанию)
Q4. Файлы config/agents/*.md — оставить как референс в rules/ или пропустить (агенты уже есть в runtime)?
