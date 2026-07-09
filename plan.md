---
type: Plan
title: План рефакторинга и внедрения тестирования (Ship Review)
description: Архитектурное разбиение монолита и настройка инфраструктуры TDD.
tags: [refactoring, testing, architecture, docker, brosky-gym]
timestamp: 2026-07-06T08:15:00Z
---

# Проблема и контекст
По результатам параллельного аудита агентами (`/ship`) выявлены архитектурные долги и риски безопасности:
1. Отсутствие юнит-тестирования (QA заблокировал релиз). Вычисления 1RM и жира не покрыты.
2. Файл `gymStore.ts` вырос до 380 строк, нарушая SRP.
3. Dockerfile использует Nginx от пользователя root.
4. В `App.tsx` смешаны роутинг, верстка хедера и таббара (хотя вкладки уже вынесены).

# Подход к решению
1. **Testing**: Установка `vitest` и `@testing-library/react`. Создание `vitest.config.ts`. Написание юнит-тестов для `staticData.ts`.
2. **Architecture**: Разбиение `gymStore.ts` на слайсы с использованием паттерна Zustand Slices (`createWorkoutSlice`, `createNutritionSlice`).
3. **UI Refactoring**: Выделение `Header.tsx`, `BottomNav.tsx` и `SkeletonLoader.tsx` из `App.tsx`.
4. **Security**: Добавление пользователя `nginx` в `Dockerfile`.

# Критерии приемки
- [ ] Юнит-тесты для расчетов 1RM и жира проходят успешно.
- [ ] `gymStore.ts` разделен на модули, функционал не сломан.
- [ ] Контейнер запускается от `USER nginx`.
- [ ] Хедер и Таббар вынесены в изолированные компоненты.