import React, { useRef, useState } from 'react';
import { exportBackup, importBackupFile } from '../../utils/backupManager';

const SaveIcon = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} className="brosky-icon">
    <path fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" points="17 21 17 13 7 13 7 21" />
    <polyline fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" points="7 3 7 8 15 8" />
  </svg>
);

const DownloadIcon = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} className="brosky-icon">
    <path fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" points="7 10 12 15 17 10" />
    <line fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const UploadIcon = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} className="brosky-icon">
    <path fill="currentColor" fillOpacity={0.15} stroke="none" className="dt-fill" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" points="17 8 12 3 7 8" />
    <line fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="dt-stroke" x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

export const BackupPanel: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | '' }>({ message: '', type: '' });
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = () => {
    try {
      exportBackup();
      setStatus({ message: 'Бэкап успешно выгружен', type: 'success' });
      setTimeout(() => setStatus({ message: '', type: '' }), 3000);
    } catch {
      setStatus({ message: 'Ошибка при выгрузке', type: 'error' });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setStatus({ message: 'Импорт данных...', type: '' });

    const success = await importBackupFile(file);
    if (success) {
      setStatus({ message: 'Данные успешно восстановлены!', type: 'success' });
    } else {
      setStatus({ message: 'Ошибка импорта. Файл поврежден или несовместим.', type: 'error' });
    }
    
    setIsImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    setTimeout(() => setStatus({ message: '', type: '' }), 5000);
  };

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700/50 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
          <SaveIcon size={24} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Резервное копирование</h3>
          <p className="text-sm text-slate-400">Сохраняйте свои данные локально, чтобы не потерять их при очистке кэша браузера.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleExport}
          className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          <DownloadIcon size={20} />
          <span>Скачать Backup (JSON)</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          <UploadIcon size={20} />
          <span>{isImporting ? 'Загрузка...' : 'Восстановить из файла'}</span>
        </button>
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {status.message && (
        <div className={`p-3 rounded-lg text-sm font-medium ${status.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
          {status.message}
        </div>
      )}
    </div>
  );
};
