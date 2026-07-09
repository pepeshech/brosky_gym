---
type: Project Memory
title: Memory Project: Brosky Gym
description: Файл памяти проекта Brosky Gym, содержащий статус разработки и стек.
tags: [memory, gym, fitness]
timestamp: 2026-07-03T18:20:00Z
ai-first: true
confidence: high
sources: []
---

<!--
# Memory Project: Brosky Gym

## Для будущего Gemini
> [!IMPORTANT]
> Это основной файл памяти проекта Brosky Gym. Хранит текущий статус, стек технологий, дизайн-токены БЖУ и цели разработки. Читайте его при любой сессии работы с кодовой базой приложения.
> **Kage Framework Alert**: Следите за свежестью (timestamp). Устаревшие данные должны быть перепроверены!

---

## Текущий статус (Current Status)
*   **Стек**: React, TypeScript, Tailwind CSS v4, Zustand, Recharts, Docker, Nginx.
*   **Статус**: Приложение успешно перенесено с Google-таблицы в PWA. Все интерактивные компоненты (дневники питания и тренировок, анатомический атлас мышц, настройки, графики прогресса) реализованы.
*   **Выполненные улучшения (2026-07-03)**:
    *   **Адаптивная нижняя навигация (Bottom Tab Bar)**: Полностью переписана архитектура мобильной навигации в [App.tsx](file:///E:/code/brosky_gym/app/src/App.tsx). Вместо хардкода `size={22}` — система CSS-переменных (`--nav-icon-size`, `--nav-label-size`, `--nav-label-display`) через класс `.bottom-nav-bar` в [index.css](file:///E:/code/brosky_gym/app/src/index.css). Три уровня адаптации: `<360px` (icon-only, подписи скрыты), `360–479px` (компакт: иконка 20px + подпись 9px), `480–767px` (полный: иконка 22px + подпись 11px). Добавлен анимированный индикатор активного таба (полоска `::before` с `@keyframes navIndicator`), `drop-shadow` на активной иконке, `backdrop-blur` фон бара.
    *   **Адаптация блока Вода/Шаги в ProfileTab**: В [ProfileTab.tsx](file:///E:/code/brosky_gym/app/src/components/ProfileTab.tsx) изменён контейнер строки «Вода / Цель шагов» с `flex gap-6` на `flex flex-col sm:flex-row sm:gap-6 gap-2` — на мобиле каждый элемент на отдельной строке, на `sm+` — горизонтально.
    *   **Выравнивание значений в SettingsTab**: В [SettingsTab.tsx](file:///E:/code/brosky_gym/app/src/components/SettingsTab.tsx) все строки в блоках BMR и NEAT переведены с `flex justify-between` на `grid` (`gridTemplateColumns: '1fr auto'`) с `whitespace-nowrap` на значениях — строгое выравнивание колонки цифр по правому краю на любой ширине экрана.
*   **Выполненные улучшения (2026-07-02)**:
    *   **Оптимизация мобильной раскладки профиля**: Изменен порядок DOM-узлов в [ProfileTab.tsx](file:///E:/code/brosky_gym/app/src/components/ProfileTab.tsx) для мобильных устройств (Профиль -> Атлас -> План питания -> Календарь) с сохранением исходного десктопного макета через `lg:order-` классы.
    *   **Фиксация светлой темы и устранение багов темного режима**: Удалены все некорректные `dark:` классы из [NutritionTab.tsx](file:///E:/code/brosky_gym/app/src/components/NutritionTab.tsx), [ProfileTab.tsx](file:///E:/code/brosky_gym/app/src/components/ProfileTab.tsx) и [WorkoutTab.tsx](file:///E:/code/brosky_gym/app/src/components/WorkoutTab.tsx). Зафиксирована светлая цветовая схема (`color-scheme: light`) в [index.html](file:///E:/code/brosky_gym/app/index.html) и [index.css](file:///E:/code/brosky_gym/app/src/index.css) для предотвращения принудительного затемнения (Force Dark Mode) карточек мобильными браузерами.
    *   **PWA Offline First**: Режим обновлений PWA переведен на `prompt` для предотвращения ошибок `ChunkLoadError` и авто-перезагрузок. Реализован хук `useRegisterSW` и Toast-баннер с уведомлением об обновлении в [App.tsx](file:///E:/code/brosky_gym/app/src/App.tsx).
    *   **Аналитика и экспорт данных**: Внедрена подвкладка «Анализ корреляций» в [ProgressTab.tsx](file:///E:/code/brosky_gym/app/src/components/ProgressTab.tsx) с двухкоординатными графиками Recharts (вес vs калории, сила vs объем). Реализован экспорт в CSV (замеры, тренировки, питание) с UTF-8 BOM и разделителем `;` для MS Excel.
    *   **Жировой калькулятор флота США**: В панель добавления замера и в форму регистрации (онбординга) интегрирован расчет процента жира по обхватам (шея, талия, бедра). Результаты расчета автоматически сохраняются в обмеры тела (IndexedDB) и обновляют параметры AthleteProfile в Zustand-сторе.
*   **Выполненные улучшения (2026-06-30)**:
    *   **IndexedDB & Zustand Migration**: Все данные (включая кастомные продукты «Моя еда») мигрированы из `localStorage` в асинхронное IndexedDB-хранилище (`idbStorage` поверх Zustand `persist`).
    *   **Zod & Validation**: Реализована валидация бэкапов через Zod в [backupValidation.ts](file:///E:/code/brosky_gym/app/src/utils/backupValidation.ts) с ленивой подгрузкой.
    *   **Anatomy Heatmap**: Интегрирована интерактивная тепловая карта мышечной нагрузки за 7 дней.
    *   **Nutrition Presets**: Внедрена система посуточных шаблонов КБЖУ (авто-расчет, системные и кастомные пресеты) с формульным конструктором, тонкими слайдерами и выводом окон через React Portal.
    *   **Очистка корня проекта**: Корень очищен от вспомогательных HTML-файлов и JSON-файлов (перенесены в `docs/artifacts/` и `docs/data_sources/`).
    *   **Bento UI & Layout Plan**: Разработаны интерактивные макеты Bento-оптимизации интерфейса питания и слияния пресетов КБЖУ с целями атлета для мобильных [layout_optimization_interactive_plan.html](file:///E:/code/brosky_gym/layout_optimization_interactive_plan.html) и для ПК [layout_optimization_desktop_plan.html](file:///E:/code/brosky_gym/layout_optimization_desktop_plan.html).
    *   **Bento Layout Integration**: Внедрена двухколоночная Bento Grid структура во вкладку питания [NutritionTab.tsx](file:///E:/code/brosky_gym/app/src/components/NutritionTab.tsx). В левую широкую колонку перенесены: оригинальная 3D Flip карточка баланса калорий, оригинальные блоки Воды и Шагов, оригинальный логгер добавления пищи и хронологический список продуктов. В правую колонку перенесен Bento-сайдбар шаблонов КБЖУ. Все дизайны блоков сохранены 1 в 1 с оригиналом.
    *   **Emoji Cleanup**: Полностью очищен исходный код от стандартных эмодзи (🎯, 💡, ⚠️, 🔢, 🏆) с заменой на векторные кастомные иконки из [BroskyIcon.tsx](file:///E:/code/brosky_gym/app/src/components/BroskyIcon.tsx).
    *   **Anatomy Filter in Exercises**: Во вкладку Упражнений [WorkoutTab.tsx](file:///E:/code/brosky_gym/app/src/components/WorkoutTab.tsx) внедрен разворачиваемый интерактивный атлас [AnatomyModel.tsx](file:///E:/code/brosky_gym/app/src/components/AnatomyModel.tsx) для визуальной фильтрации упражнений по клику на целевые мышцы.
    *   **Clean Code & Lints**: Исправлены все ошибки линтинга (`npm run lint`).
*   **Локальные серверы**: dev-сервер запущен на `http://localhost:5173/`, docker-контейнер на `http://localhost:8080/`.
*   **История**: Подробный перечень этапов разработки и аудитов сохранен в концепте [[docs/development_history]].

---

## Дизайн-система и цветовые стандарты (Design System)

### 1. Макронутриенты (БЖУ)
*   **Белки (Protein)**: Orange (`#f97316`, класс `text-orange-500` / `bg-orange-500` / `stroke-orange-500`).
*   **Жиры (Fat)**: Yellow (`#eab308`, класс `text-yellow-500` / `bg-yellow-500` / `stroke-yellow-500`).
*   **Углеводы (Carbs)**: Cyan (`#06b6d4`, класс `text-cyan-500` / `bg-cyan-500` / `stroke-cyan-500`).

### 2. Спортивные цели питания
*   **Рекомпозиция (recomp)**: Purple (`#a855f7`, класс `text-purple-600` / `bg-purple-500`).
*   **Поддержание (maintenance)**: Persian Blue (`#466bf7`, класс `text-gym-accent` / `bg-gym-accent`).
*   **Набор массы (bulk)**: Emerald (`#10b981`, класс `text-emerald-600` / `bg-emerald-500`).
*   **Сушка (cut)**: Rose (`#f43f5e`, класс `text-rose-600` / `bg-rose-500`).

### 3. Цвета ключевых элементов
*   **Огонек (Калории / Flame)**: Rose (`#f43f5e`, класс `text-rose-500`).
*   **Шаги (Footprints)**: Emerald (`#10b981`, класс `text-emerald-500`).
*   **Иконки**: Кастомные Dual Tone SVGs из компонента [BroskyIcon.tsx](app/src/components/BroskyIcon.tsx) (эмодзи запрещены).

---

## Следующие шаги (Next Steps)
1.  **Мобильное тестирование PWA**: Полевое тестирование тач-событий, адаптивности и оффлайн-кэша через запущенный локально ngrok на реальных смартфонах (iOS/Android).
2.  **VPS-Деплой (Отложено)**: Подготовка Docker/Nginx/HTTPS-инфраструктуры для продакшена (временно заморожено, проект работает локально).
3.  *Примечание*: Стратегический отказ от геймификации (RPG Profile / Hero Journey) и редизайна (Apple Fitness). Фокус сохраняется на утилитарном, стабильном и быстром текущем интерфейсе.
-->
