import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { WebrtcProvider } from 'y-webrtc';

// 1. Создаем глобальный документ Yjs
export const ydoc = new Y.Doc();

// 2. Инициализируем хранилище Yjs в IndexedDB для оффлайн работы
// 'brosky-gym-crdt' - это название базы данных в IndexedDB
export const indexeddbProvider = new IndexeddbPersistence('brosky-gym-crdt', ydoc);

// 3. Создаем провайдер WebRTC (создается лениво, когда пользователь введет код комнаты)
let webrtcProvider: WebrtcProvider | null = null;

/**
 * Подключение к P2P сети через WebRTC по секретному коду комнаты.
 * @param roomCode - 12-значный секретный код для сопряжения устройств.
 */
export const connectToP2P = (roomCode: string) => {
  if (webrtcProvider) {
    webrtcProvider.destroy();
  }

  // Подключаемся к комнате с заданным ID. По умолчанию используются публичные signaling сервера,
  // что абсолютно безопасно, так как WebRTC устанавливает прямое (E2E) P2P соединение между пирами.
  webrtcProvider = new WebrtcProvider(`brosky-gym-room-${roomCode}`, ydoc, {
    signaling: [
      'wss://545474150997a0a8-178-168-176-10.serveousercontent.com',
      'wss://signaling.yjs.dev',
      'wss://y-webrtc-signaling-eu.herokuapp.com',
      'wss://y-webrtc-signaling-us.herokuapp.com'
    ]
  });

  return webrtcProvider;
};

/**
 * Отключение от P2P сети (оффлайн режим).
 */
export const disconnectFromP2P = () => {
  if (webrtcProvider) {
    webrtcProvider.destroy();
    webrtcProvider = null;
  }
};

/**
 * Получение текущего экземпляра WebrtcProvider.
 */
export const getWebrtcProvider = () => webrtcProvider;
