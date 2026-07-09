# Отчёт оптимизации brosky_gym

## Резюме
- **Общая оценка:** 🟡 (сильная архитектурная база, но есть конкретные узкие места)
- **Топ-3 приоритетных фикса:**
  1. **Debounce API-поиска еды** — `NutritionTab.tsx:1004` делает `fetch` к Open Food Facts на КАЖДЫЙ нажатие клавиши (нет debounce). Лишний сетевой трафик, лаги ввода (INP).
  2. **Google Fonts render-blocking** — `index.html:14` грузит 2 семейства шрифтов (Outfit + Plus Jakarta Sans, 14 весов суммарно) синхронно с CDN; нет `font-display: optional` / self-hosting / preload.
  3. **Отсутствие `React.memo` на тяжёлых табах** — `NutritionTab` (1919 строк), `WorkoutTab` (1906), `ProgressTab` (1926) не мемоизированы; Recharts-обёртки внутри не мемоизированы.

---

## 1. Bundle Analysis
**Статус:** 🟢

**Наблюдения:**
- `app/vite.config.ts:60-68` — настроен `manualChunks`: `framework` (react), `charts` (recharts/d3), `vendor`. Code splitting присутствует.
- `app/src/App.tsx:5-12` — все второстепенные вкладки (`NutritionTab`, `ProgressTab`, `WorkoutTab`, `SettingsTab`, `AchievementsTab`, `ProfileTab`) загружаются через `lazy()` + `Suspense`. Отлично для LCP.
- `app/dist/assets/` — чанки разделены: `charts-laN47HLU.js`, `framework-CsmBwHzm.js`, `vendor-BbGjDjoC.js`, по одному на каждую вкладку. Chunk splitting работает.
- `app/src/utils/validation.ts:1-2` — **намеренно** отказались от Zod в основном бандле («Избегает импорта библиотеки Zod для сохранения LCP»), используется рукописный `LightSchema`. Zod подтягивается только через `lazy import('../utils/backupValidation')` в `gymStore.ts:444`. Грамотное решение.
- Зависимости (`app/package.json:15-22`) минимальны: react 19, recharts 3, zod 4, zustand 5. Нет лишнего.

**Рекомендации:**
- Цель <250KB (из persona) — проверить фактический gzip-размер `framework + index + vendor` через `vite build --report` (есть `app/dist/`, но метаданных размера нет). Recharts — самый тяжёлый кандидат; chunk уже изолирован — корректно.

---

## 2. React Performance
**Статус:** 🟡

**Наблюдения:**
- **Точечные селекторы Zustand — образцовые.** Все ~60 вызовов `useGymStore(s => s.x)` во всём проекте атомарны (см. `App.tsx:75`, `ProgressTab.tsx:145-156`, `NutritionTab.tsx:90-132`, `WorkoutTab.tsx:100-105` и др.). Ни одного `useGymStore()` без селектора — нет избыточных ре-рендеров стора. ✅
- **`React.memo` используется только в `AnatomyModel.tsx:43` (`MuscleGroup`) и `:273` (`AnatomyModel`).** Тяжёлые корневые компоненты вкладок (`NutritionTab`, `WorkoutTab`, `ProgressTab`) **не** обёрнуты в `memo`.
- **`useMemo` применяется корректно** в `ProgressTab.tsx:225,262,273,283,290,322` (chartData, performedExercises, strengthChartData, nutritionChartData, targetMetrics, barStats) и в `NutritionTab.tsx:202,206,277,358` (combinedCatalog, searchResults, totalVolumeToday, plans, target).
- **`useCallback` практически отсутствует** — только в `DatePicker.tsx:40`. В `NutritionTab.tsx`/`WorkoutTab.tsx` обработчики (`handleGramsChange`, `handleApiSearch`, `handleSelectFood`) создаются заново каждый рендер — без `memo`-детей это не критично, но при добавлении `memo` понадобится.
- `AnatomyModel.tsx:385-390` — `contextValue` обёрнут в `useMemo` с корректным массивом зависимостей (есть `eslint-disable exhaustive-deps`, но зависимости перечислены).

**Рекомендации:**
- Обернуть `NutritionTab`, `WorkoutTab`, `ProgressTab` в `React.memo` (вкладки монтируются по одной, memo дешёвый и предотвращает ре-рендер при апп-левел `setState`).
- Recharts-графики в `ProgressTab` рендерятся в `<ResponsiveContainer>` — при изменении родительского состояния перерисовываются; вынести график в отдельный memo-компонент с данными как prop.

---

## 3. Core Web Vitals
**Статус:** 🟡

**Наблюдения (LCP):**
- `app/index.html:12-14` — два `<link rel="preconnect">` (googleapis + gstatic) ✓, но сам CSS-файл шрифтов (`css2?family=Outfit...&family=Plus Jakarta Sans...`) **render-blocking**. Запрошено ~14 весов (300–800 × 2 семейства) — избыточно.
- `app/index.html:30-101` — встроенный skeleton + inline-CSS для критического рендера. Хорошо для LCP (нет FOUC).
- Изображений в hero нет — LCP-элементом вероятно будет текст/карточка.

**Наблюдения (CLS):**
- `app/index.html:9` — `viewport-fit=cover` ✓. Skeleton с фиксированными высотами (`card-large: 260px` и т.д.) предотвращает сдвиг при гидратации.
- Шрифты: `&display=swap` в URL (`index.html:14`) — есть, но `swap` вызывает FOUT → минимальный CLS; `optional` убрал бы, но рискует невидимым шрифтом офлайн.
- Inline `font-family: "Plus Jakarta Sans"...` (`index.html:19`) с fallback на `-apple-system` — корректно.

**Наблюдения (INP):**
- `NutritionTab.tsx:1004` — `onChange` на поле поиска синхронно вызывает `setFoodName + setSearchQuery + setShowDropdown + handleApiSearch` (fetch на каждый keystroke) — реальный лаг ввода.
- `ProgressTab.tsx` — `barStats`/`chartData` пересчитываются через `useMemo`, тяжёлых синхронных операций в onClick нет.

**Рекомендации:**
- Self-host шрифты (или сократить до реально используемых весов: 400/600/800) — убрать render-blocking запрос к googleapis.
- Обернуть `handleApiSearch` в debounce (300–400мс) или `requestIdleCallback`.

---

## 4. PWA
**Статус:** 🟡

**Наблюдения:**
- `app/vite.config.ts:9` — `registerType: 'prompt'` ✓ (предотвращает `ChunkLoadError`/авто-перезагрузку, согласно `MEMORY_BROSKY_GYM.md`).
- `app/vite.config.ts:10` — `injectRegister: 'auto'` ✓.
- `app/vite.config.ts:12` — `globPatterns: ['**/*.{js,css,html,ico,png,svg}']` — precache покрывает ассеты.
- `runtimeCaching` (`vite.config.ts:14-36`) — **только** Google Fonts (stylesheets + webformats, CacheFirst, 1 year). 
  - ❌ **Нет runtime-кэша для API Open Food Facts** (`ru.openfoodfacts.org` в `NutritionTab.tsx:227`). Каждый поиск бьёт по сети даже офлайн.
  - ❌ Нет fallback `navigateFallback` для офлайн-навигации (приложение SPA — при офлайн-перезагрузке может быть ошибка, если sw не отдаёт index.html).
- Manifest (`vite.config.ts:38-60`) — корректный, `display: standalone`, `theme_color` совпадает с CSS. Иконки только SVG (`purpose: any` + `maskable`) — для iOS может не хватить PNG 192/512 (Safari игнорирует SVG-маскируемые).

**Рекомендации:**
- Добавить `runtimeCaching` правило `NetworkFirst`/`StaleWhileRevalidate` для `ru.openfoodfacts.org` (кэш на 1–7 дней).
- Добавить `navigateFallback: '/index.html'` в workbox config для offline SPA.
- Добавить PNG-иконки 192/512 для корректной установки на iOS.

---

## 5. Code Quality
**Статус:** 🟡

**Наблюдения (`: any`):**
- `app/src/utils/validation.ts:6,8,12` + `AthleteProfileSchema`/`ProgressEntrySchema`/`ExerciseSchema` (все `new LightSchema<any>(...)`) — **намеренно** (есть `/* eslint-disable @typescript-eslint/no-explicit-any */` в `:1`). Нарушает persona-запрет `any`, но обосновано оптимизацией бандла. Можно типизировать через дженерики без роста бандла.
- `app/src/components/NutritionTab.tsx:234,235,250` — `(p: any)` при парсинге ответа Open Food Facts. Файл начинается с `eslint-disable no-explicit-any`. Нужно описать `interface OpenFoodFactsProduct`.
- `app/src/components/NutritionTab.tsx:396` — `const newPreset: any = {...}` — можно типизировать как `Omit<NutritionPreset, ...>`.
- `NutritionTab.tsx:283` — `generateDietPlans(activeProfileForCalc as any, ...)` — `as any` каст скрывает рассинхронизацию типов.

**Наблюдения (`console.*` в проде):**
- `app/src/App.tsx:67` — `console.log('SW registered:', r)` (info-лог).
- `app/src/store/gymStore.ts:112,118` — `console.log` миграции IndexedDB.
- `app/src/store/gymStore.ts:123,448` — `console.error` (приемлемо, ошибки).
- `app/src/components/NutritionTab.tsx:143` — `console.log` миграции еды.
- `app/src/components/NutritionTab.tsx:146,254` — `console.error`.
- `app/src/components/WorkoutTab.tsx:187` — `console.warn`.

**Рекомендации:**
- Удалить или обернуть в `if (import.meta.env.DEV)` info-логи: `App.tsx:67`, `gymStore.ts:112,118`, `NutritionTab.tsx:143`.
- Заменить `: any` в `NutritionTab.tsx` на интерфейсы Open Food Facts (не влияет на бандл).
- Zod-валидация: присутствует только в `backupValidation.ts` (lazy). Основные формы используют `LightSchema` — это осознанный компромисс, но persona требует Zod; задокументировать решение.

---

## 6. Images/Assets
**Статус:** 🟢

**Наблюдения:**
- `app/public/` — только `favicon.svg`, `gym-logo.svg`, `icons.svg`. Все векторные — нет растровых изображений, нет проблем с весом/оптимизацией.
- `app/src/components/AnatomyModel.tsx` — анатомический атлас целиком inline-SVG (полигоны), грузится в составе чанка `AnatomyModel-DcEmQgTu.js`.
- Lazy loading изображений не требуется (изображений нет).
- Иконки — кастомный SVG-компонент `BroskyIcon.tsx` (по persona эмодзи запрещены, выполнено ✓).

**Рекомендации:** нет — раздел в хорошем состоянии.

---

## 7. Anti-patterns
**Статус:** 🟡

**Наблюдения:**
- **Отсутствие debounce на сетевой поиск** — `NutritionTab.tsx:1004` (описано в LCP/INP). Классический антипаттерн: N запросов на слово из N букв.
- **Сортировка с `new Date()` при каждой мутации стора** — `gymStore.ts:176,199,307,349` (addProgressEntry, saveWorkoutSession, addNutritionLog): `.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())`. На больших датасетах (месяцы логов) это O(n log n) + аллокации `Date` на каждое сравнение. Не критично при текущих объёмах, но растёт с историей.
- **N+1-like обход** в `ProgressTab.tsx:234-242` и `NutritionTab.tsx:262-272` — вложенные циклы `workoutSessions → logs → sets` для подсчёта 1RM/тоннажа. Обёрнуты в `useMemo` ✓, но пересчитываются при каждом изменении `workoutSessions`. При большом числе сессий — кандидат на предагрегацию.
- **Дублирование ID-генераторов** — `generateStepsId`/`generateWaterId` (`NutritionTab.tsx:6-7`) и inline `Date.now()+Math.random()` в `NutritionTab.tsx:397` — можно вынести в общий util (style-issue, не перф).

**Рекомендации:**
- Debounce + кэширование результатов Open Food Facts.
- Для сортировок в сторе: либо предсортировать на записи (binary insert), либо кэшировать отсортированный производный массив в селекторе.

---

## План действий (приоритизированный)
1. **[Критичный]** Добавить debounce (300–400мс) на `handleApiSearch` в `NutritionTab.tsx:1004` + `runtimeCaching` для `ru.openfoodfacts.org` в `vite.config.ts`. Прямо влияет на трафик/INP/оффлайн.
2. **[Важный]** Убрать render-blocking Google Fonts: self-host или сократить до нужных весов, добавить `font-display: optional` / preload.
3. **[Важный]** Обернуть `NutritionTab`, `WorkoutTab`, `ProgressTab` в `React.memo`; вынести Recharts-графики `ProgressTab` в memo-детей.
4. **[Важный]** Добавить `navigateFallback: '/index.html'` и PNG-иконки PWA для корректной установки/оффлайна на iOS.
5. **[Опциональный]** Очистить info-`console.log` в проде (`App.tsx:67`, `gymStore.ts:112,118`, `NutritionTab.tsx:143`).
6. **[Опциональный]** Типизировать `: any` в `NutritionTab.tsx` (Open Food Facts response, `newPreset`).
7. **[Опциональный]** Оптимизировать сортировки в store (`gymStore.ts:176,199,307,349`) для больших историй.

---

### Примечания к фреймворкам аудита
- **performance-optimization/SKILL.md** — следовал MEASURE→IDENTIFY: статический анализ бандла (dist/) + кода; реальное RUM-измерение (Lighthouse/web-vitals) недоступно без запуска — рекомендую прогнать Lighthouse на `app/dist/` для верификации.
- **karpathy-guidelines/SKILL.md** — каждое наблюдение привязано к конкретному `файлу:строке`; рекомендации surgical, без спекулятивных абстракций.
