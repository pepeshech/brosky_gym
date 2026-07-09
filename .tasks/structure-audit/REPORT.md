# Аудит структуры brosky_gym

**Методика:** каждый кандидат проверен через `search_for_text` по `app/src` (все `import ... from './BroskyIcon'` / `from '../types'` / `from '../store/gymStore'` собраны полностью) и выборочно перепроверен. В таблицы мёртвого кода включены **только** символы, у которых нет ни одного импорта-потребителя.

> Примечание по `find_usages`: символьный индекс проекта не резолвил имена (таймаут/«No symbol found»). Анализ выполнен текстовым поиском импортов, что для ESM `export/import` даёт эквивалентный результат.

---

## 1. Мёртвый код (неиспользуемые экспорты)

### 1.1. Файл-велик `BroskyIcon.tsx` — главный источник мёртвого кода

Из **101** экспортированной иконки потребляются только **46**. Остальные **55** иконок **нигде не импортируются** — они ссылаются только на `BroskyIconMap`, который сам по себе мёртв (см. ниже). Образец паттерна перепроверен на 5 представителях (`Apple`, `HeartPulse`, `Utensils`, `PieChart`, `Edit`): встречаются исключительно в определении + в `BroskyIconMap`.

| Файл | Символ | Причина удаления |
|------|--------|------------------|
| `components/BroskyIcon.tsx` | `BroskyIconMap` | Ни одного импорта во всём проекте (только собственное определение, line 1423). Map мёртв → тянет за собой неиспользуемые иконки. |
| `components/BroskyIcon.tsx` | **55 иконок** (см. список ниже) | Не импортируются ни одним потребителем; ссылаются только на мёртвый `BroskyIconMap`. |

**Список 55 мёртвых иконок:**
```
StopWatch, Flag, Battery, HeartPulse, SleepMoon, Sun, TestTube, Crosshair,
Compass, Ruler, TapeMeasure, Apple, Carrot, WeightPlate, BottleShaker, CupWater,
Utensils, Egg, Fish, Drumstick, Wheat, LeafVegan, Pill, BloodDrop, ScaleBody,
BarChart2, PieChart, Brain, Eye, Video, PlayCircle, Mic, Headphones,
MessageCircle, Users, Bell, Camera, Image, Lock, Unlock, Key, MapPin,
CreditCard, Smartphone, LogOut, Edit, Copy, Share, Maximize, Minimize,
Navigation, Map, Smile, ActivityRing, Anchor
```
> ⚠️ Внимание: `Edit`-иконка мёртва, хотя слово «edit» массово встречается в коде (`editingId`, `setEditingId`, `EditableValue` и т.п.) — это **другие** идентификаторы, не импорт иконки. Анализ это учитывает.

**Потребляемые (используемые) 46 иконок** — оставить:
```
Activity, AlertTriangle, ArrowLeft, ArrowRight, BookOpen, Calendar, Check,
CheckCircle, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ClipboardList,
Clock, Coffee, Dumbbell, Download, Droplet, FileText, Flame, Footprints,
HelpCircle, History, Info, Layers, Library, LoaderPulse, Medal, Muscle, Pencil,
Plus, RefreshCw, Search, Settings, Shield, Sparkles, Star, Target, Trash2,
TrendingDown, TrendingUp, Trophy, Upload, User, X, Zap
```

### 1.2. Прочий подтверждённый мёртвый код

| Файл | Символ | Причина удаления |
|------|--------|------------------|
| `store/staticData.ts` | `defaultWorkoutTemplates` (line 230) | Экспортирован, но **0** ссылок: не входит в re-export `gymStore`, не импортируется ни в одном компоненте. Большой массив шаблонов тренировок — мёртв. |
| `components/AnatomyModel.tsx` | `export type MuscleGroupKey` (line 5) | Используется **только внутри** `AnatomyModel.tsx`. Внешних импортов нет → `export` избыточен (убрать ключевое слово `export`, тип оставить). |
| `utils/backupValidation.ts` | `export type ValidBackupData` (line 169) | Внешних импортов нет; используется лишь как возвращаемый тип `validateBackup`. Можно сделать неэкспортируемым. |

> `validation.ts` и `backupValidation.ts` **НЕ мёртвые**: `validateData`/`AthleteProfileSchema`/`ProgressEntrySchema`/`ExerciseSchema`/`WorkoutTemplateSchema` используются в Onboarding/WorkoutTab/ProgressTab; `validateBackup` динамически импортируется в `gymStore` (lazy-чанк импорта бэкапа).

---

## 2. Дубликаты

| Что дублируется | Локации | Рекомендация |
|-----------------|---------|--------------|
| **ID-генераторы** `prefix + Date.now() + Math.random().toString(36)` | `ProfileTab.tsx:8` (`generateWorkoutId`), `NutritionTab.tsx:11` (`generateStepsId`), `NutritionTab.tsx:12` (`generateWaterId`), `NutritionTab.tsx:397` (inline `preset-`), `NutritionTab.tsx:580` (inline `food-`), `WorkoutTab.tsx:16` (`uid`) | Вынести в `utils/id.ts` единый `genId(prefix: string): string` (и опционально `crypto.randomUUID()` где доступен). Уберёт 6 копий и расхождение длин суффикса (`substring(2,9)` vs `(2,11)`). |
| **Тип `AthleteProfile`** | `types/index.ts:1` (полный) и `utils/formulas.ts:1` (подмножество: gender/age/weight/height/fatPercent/dailySteps?/selectedGoal) | `formulas.ts` переопределяет тип локально вместо импорта. Удалить локальный, импортировать `import type { AthleteProfile } from '../types'` (структурно совместимо — формулы используют только подмножество полей). |
| **Имена схем** `AthleteProfileSchema`, `ProgressEntrySchema`, `ExerciseSchema`, `WorkoutTemplateSchema` | `utils/validation.ts` (LightSchema) и `utils/backupValidation.ts` (Zod) — **одинаковые имена, разные реализации** | Оба файла нужны (формы vs импорт бэкапа), но коллизия имён — мина. Переименовать: `validation.ts` → `*FormSchema` (или `backupValidation.ts` → `Backup*Schema`). |
| **Двойной путь импорта** static-данных | `store/gymStore.ts:17` re-export’ит `defaultExercises/defaultMetrics/MUSCLE_COLORS/MUSCLE_GROUPS/EQUIPMENT_TYPES/calcEpley1RM`, и они же экспортируются из `store/staticData.ts` | `WorkoutTab` импортирует через `gymStore`. Решить: один источник истины — импортировать статику только из `staticData`, убрать re-export из стора (стор хранит состояние, а не каталоги). |

---

## 3. Мусорные файлы в корне

| Файл | Назначение | Действие |
|------|-----------|----------|
| `lt_err.txt`, `lt_out.txt` | Логи localtunnel (`lt_out.txt` пустой, 0 строк) | Удалить |
| `ngrok_err.txt`, `ngrok_output.txt`, `ngrok_url.txt` | Логи/вывод ngrok-сессий | Удалить |
| `pinggy_err.txt`, `pinggy_out.txt` | Логи pinggy-туннелей | Удалить |
| `layout_optimization_desktop_plan.html` (1935 строк) | Артефакт HTML-execution (mode_b) — «Bento-План оптимизации ПК-экрана» | Удалить (или переместить в `docs/artifacts/`, если нужен как референс) |
| `layout_optimization_interactive_plan.html` | Артефакт mode_b — план вёрстки | Удалить / переместить в `docs/artifacts/` |
| `plan.html` | Артефакт mode_b — план | Удалить / переместить в `docs/artifacts/` |
| `package.json` (корневой) | Содержит **только** `"localtunnel": "^2.0.2"` | Удалить вместе с корневым `package-lock.json` и `node_modules/`. Туннели запускать через `npx -y localtunnel` (что и предлагает сам `plan.md`). |
| `package-lock.json` (корневой) | Лок для localtunnel | Удалить |
| `node_modules/` (корневой) | localtunnel + ngrok + got + ~40 транзитивных пакетов | Удалить (не должен быть в репо) |
| `_GEMINI.md`, `MEMORY_BROSKY_GYM.md`, `index.md` | База знаний эпохи Gemini (см. memory `gemini-to-veai-migration`) — устарели после миграции на VeAI | Переместить в `docs/legacy/` или удалить; актуальная память — в `.veai/memory/` |
| `plan.md` | План запуска туннеля (localtunnel/pinggy) — разовый | Переместить в `docs/` или удалить |
| `log.md` | Индекс на `Logs/` | Оставить (указатель на историю), либо свернуть в `docs/` |

**Оставить (не мусор):** `.dockerignore`, `Dockerfile`, `nginx.conf`, `deploy.sh` (деплой); `.idea/`, `.veai/`, `.agents/` (конфиг/персона); `docs/`, `Logs/`, `wiki/` (документация и история).

---

## 4. Мусор в `app/`

| Файл/папка | Назначение | Действие |
|------|-----------|----------|
| `app/src/store/matches_full.json` | Большой JSON-дамп, **0** ссылок в `app/src` (не импортируется, не в `public/`) | Удалить (мёртвый файл) |
| `app/src/assets/` | Пустая директория | Удалить |
| `app/test-custom-foods-backup.js` | Node-скрипт проверки скомпилированного чанка `backupValidation` в `dist/`. **0** ссылок** ни в одном `package.json` script — orphan | Переместить в `app/scripts/` и прописать в `app/package.json` `scripts.test:backup`, либо удалить |
| `app/dist/` | Сборка (регенерируется Vite) | Не коммитить (убедиться, что в `.gitignore`) |

---

## 5. Предложения по реорганизации

### 5.1. Текущая структура
`components/`, `store/`, `utils/`, `types/` — плоская группировка «по типу». Для текущего масштаба (12 компонентов) это **приемлемо**, но несколько файлов перешагнули порог читаемости:
- `BroskyIcon.tsx` — **1525 строк** (после чистки ≈ 500)
- `WorkoutTab.tsx` — **1906 строк**
- `ProgressTab.tsx` — **1926 строк**
- `NutritionTab.tsx` — **1919 строк**
Эти «боги-компоненты» — больший приоритет, чем перестановка папок.

### 5.2. Фичевые папки — рекомендация
Ввести группировку по фичам **только если** начнётся распил крупных табов; сейчас достаточно подсветить владение:
```
components/
  shared/        AnatomyModel, DatePicker, BroskyIcon, DialogProvider, Onboarding
  workout/       WorkoutTab (+ будущие подобъекты)
  nutrition/     NutritionTab
  progress/      ProgressTab
  profile/       ProfileTab, ReportsModal
  achievements/  AchievementsTab, AchievementsPanel
```
Если табы остаются монолитами — оставить плоско, но **переименовать/объединить** `AchievementsTab`/`AchievementsPanel` (Tab — тонкая обёртка вокруг Panel; рассмотреть слияние).

### 5.3. Источник истины для иконок
После удаления `BroskyIconMap` переименовать файл в `components/icons.tsx` (это не «Brosky»-специфичный компонент, а библиотека SVG-иконок) — имя точнее отражает содержимое.

### 5.4. Утилиты
- Завести `utils/id.ts` (см. §2) — убрать 6 копий ID-генерации.
- `staticData.ts` назвать `store/catalogs.ts` или вынести в `data/` — сейчас «стор» смешан с неизменяемыми справочниками.

### 5.5. Корень
Свести весь корневой «немусор» в стандартные места: `docs/` (включая `legacy/` для Gemini-файлов), убрать локальные туннельные `package.json`/`node_modules`. Корень должен содержать только деплой (`Dockerfile`, `nginx.conf`, `deploy.sh`, `.dockerignore`) и единый `README`.

---

## Итоговый список на удаление

**Исходники (`app/src/`):**
1. `store/matches_full.json` — мёртвый файл (0 ссылок).
2. `components/BroskyIcon.tsx` → `BroskyIconMap` + 55 неиспользуемых иконок (см. §1.1).
3. `store/staticData.ts` → `defaultWorkoutTemplates` (0 ссылок).
4. `components/AnatomyModel.tsx` → убрать `export` у `MuscleGroupKey`.
5. `utils/backupValidation.ts` → убрать `export` у `ValidBackupData`.
6. `utils/formulas.ts` → удалить дубль `AthleteProfile`, импортировать из `../types`.

**Артефакты и мусор:**
7. Корневые логи туннелей: `lt_err.txt`, `lt_out.txt`, `ngrok_err.txt`, `ngrok_output.txt`, `ngrok_url.txt`, `pinggy_err.txt`, `pinggy_out.txt`.
8. Корневые HTML-артефакты mode_b: `layout_optimization_desktop_plan.html`, `layout_optimization_interactive_plan.html`, `plan.html`.
9. Корневой туннельный пакет: `package.json`, `package-lock.json`, `node_modules/` (только localtunnel/ngrok).
10. `app/src/assets/` (пустая папка).
11. `app/test-custom-foods-backup.js` — переместить в `app/scripts/` + завести npm-script, либо удалить.

**Рефакторинг (не удаление, но обязательно):**
12. Вынести единый `genId(prefix)` в `utils/id.ts`; убрать 6 копий (`ProfileTab`, `NutritionTab` ×3, `WorkoutTab`).
13. Устранить коллизию имён схем `validation.ts` ↔ `backupValidation.ts`.
14. Убрать re-export справочников из `gymStore.ts` (импорт только из `staticData`).
