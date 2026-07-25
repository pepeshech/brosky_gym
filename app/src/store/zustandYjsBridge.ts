import type { StoreApi } from 'zustand';
import * as Y from 'yjs';
import { ydoc } from './yjsProvider';

/**
 * Синхронизирует Zustand store с Y.Map.
 * Эта реализация конвертирует верхнеуровневые ключи состояния Zustand в ключи Y.Map.
 * Подходит для приложений с низкой конкурентностью записи одних и тех же полей (как фитнес-трекер).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function bindZustandToYjs<T extends Record<string, any>>(
  store: StoreApi<T>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yMap: Y.Map<any>
) {
  let isOriginYjs = false;

  // 1. Подписка на Yjs -> обновление Zustand
  yMap.observeDeep((_events, transaction) => {
    if (transaction.origin === 'zustand') return;

    isOriginYjs = true;
    const stateUpdate = yMap.toJSON() as Partial<T>;
    
    // Удаляем возможные пустые/undefined ключи, чтобы не затереть методы zustand
    const cleanUpdate = Object.fromEntries(
      Object.entries(stateUpdate).filter(([, v]) => v !== undefined)
    ) as Partial<T>;

    store.setState(cleanUpdate);
    isOriginYjs = false;
  });

  // 2. Подписка на Zustand -> обновление Yjs
  store.subscribe((state, prevState) => {
    if (isOriginYjs) return;

    ydoc.transact(() => {
      for (const [key, value] of Object.entries(state)) {
        // Пропускаем функции (экшены Zustand)
        if (typeof value === 'function') continue;

        // Если значение изменилось, пишем в Yjs.
        // Yjs поддерживает установку обычных JSON объектов/массивов через .set()
        if (JSON.stringify(value) !== JSON.stringify(prevState[key as keyof T])) {
          yMap.set(key, value);
        }
      }
    }, 'zustand');
  });

  // 3. Первичная инициализация
  const isYMapEmpty = Array.from(yMap.keys()).length === 0;

  if (isYMapEmpty) {
    // Если Yjs пуст (например, первый запуск), выгружаем всё из Zustand
    ydoc.transact(() => {
      const state = store.getState();
      for (const [key, value] of Object.entries(state)) {
        if (typeof value !== 'function') {
          yMap.set(key, value);
        }
      }
    }, 'zustand-init');
  } else {
    // Если в Yjs уже есть данные (после подгрузки из IndexedDB или по сети),
    // инициализируем ими Zustand
    const stateUpdate = yMap.toJSON() as Partial<T>;
    const cleanUpdate = Object.fromEntries(
      Object.entries(stateUpdate).filter(([, v]) => v !== undefined)
    ) as Partial<T>;
    
    store.setState(cleanUpdate);
  }
}
