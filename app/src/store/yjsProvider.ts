import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';

// 1. Создаем глобальный документ Yjs
export const ydoc = new Y.Doc();

// 2. Инициализируем хранилище Yjs в IndexedDB для оффлайн работы локального стора
export const indexeddbProvider = new IndexeddbPersistence('brosky-gym-crdt', ydoc);
