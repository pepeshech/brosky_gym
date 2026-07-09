import React, { useState, useEffect } from 'react';
import { connectToP2P, disconnectFromP2P } from '../../store/yjsProvider';

export const DevicePairing: React.FC = () => {
  const [roomCode, setRoomCode] = useState(() => localStorage.getItem('gym-p2p-room') || '');
  const [inputCode, setInputCode] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [peersCount, setPeersCount] = useState(0);
  const [error, setError] = useState('');

  // Подключаемся автоматически, если код был сохранен ранее
  useEffect(() => {
    if (roomCode) {
      handleConnect(roomCode);
    }
    return () => {
      // Очистка слушателей при размонтировании
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleConnect(code: string) {
    if (code.length < 6) {
      setError('Код слишком короткий. Используйте минимум 6 символов.');
      return;
    }
    
    setError('');
    const provider = connectToP2P(code);
    
    // Сохраняем код в localStorage для автоматического подключения
    localStorage.setItem('gym-p2p-room', code);
    setRoomCode(code);
    setIsConnected(true);

    // Слушаем изменение количества пиров (других устройств)
    provider.on('peers', (data: { webrtcPeers: unknown[] }) => {
      setPeersCount(data.webrtcPeers.length);
    });
  };

  const handleDisconnect = () => {
    disconnectFromP2P();
    localStorage.removeItem('gym-p2p-room');
    setRoomCode('');
    setInputCode('');
    setIsConnected(false);
    setPeersCount(0);
  };

  const generateRandomCode = () => {
    // Простой генератор 12-значного кода
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
      if (i === 3 || i === 7) code += '-';
    }
    setInputCode(code);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-6 bg-slate-900 border border-slate-800 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="relative z-10">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-white font-display">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
            <path d="m8 8-4 4 4 4"/><path d="m16 8 4 4-4 4"/><path d="m10 20 4-16"/>
          </svg>
          P2P Синхронизация
        </h3>

        <p className="text-xs text-slate-400 leading-relaxed mt-2 mb-6">
          Бесшовная децентрализованная синхронизация данных (WebRTC) между устройствами без сторонних серверов. 
          Данные передаются только при одновременном онлайне устройств по безопасному каналу.
        </p>

        {isConnected ? (
          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 flex flex-col items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Ваш код сопряжения (Комната):</span>
              <span className="text-2xl font-mono font-bold tracking-widest text-white bg-slate-950 px-4 py-2 rounded-lg border border-slate-800">
                {roomCode}
              </span>
              <p className="text-[10px] text-slate-500 text-center mt-2 max-w-[250px]">
                Введите этот код на другом устройстве, чтобы объединить их в единую сеть.
              </p>
            </div>

            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="relative flex h-3 w-3">
                  {peersCount > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${peersCount > 0 ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                </span>
                <span className={peersCount > 0 ? 'text-emerald-400' : 'text-amber-400'}>
                  {peersCount > 0 ? `Подключено пиров: ${peersCount}` : 'Ожидание устройств...'}
                </span>
              </div>

              <button 
                onClick={handleDisconnect}
                className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg"
              >
                Отключиться
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300 ml-1">Код сопряжения</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="Напр. ABCD-1234-WXYZ"
                  className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 uppercase placeholder:text-slate-600"
                />
                <button 
                  onClick={generateRandomCode}
                  title="Сгенерировать новый код"
                  className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/>
                  </svg>
                </button>
              </div>
              {error && <p className="text-xs text-rose-400 ml-1">{error}</p>}
            </div>

            <button 
              onClick={() => handleConnect(inputCode)}
              disabled={!inputCode}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
            >
              Подключиться
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
