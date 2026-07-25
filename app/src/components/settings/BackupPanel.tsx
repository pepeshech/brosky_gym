import React, { useRef, useState } from 'react';
import { exportBackup, importBackupFile } from '../../utils/backupManager';
import { Download, Upload, FileText } from '../BroskyIcon';

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
    <div className="glass-panel rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 border border-white/60">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-gym-accent/10 text-gym-accent rounded-xl border border-gym-accent/20 flex-shrink-0 mt-0.5">
          <FileText size={22} className="text-gym-accent" />
        </div>
        <div className="space-y-0.5 min-w-0">
          <h3 className="text-base sm:text-lg font-bold font-display text-gray-900">Резервное копирование</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Сохраняйте свои данные локально, чтобы не потерять их при очистке кэша браузера.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 pt-1">
        <button
          type="button"
          onClick={handleExport}
          className="w-full py-3 px-4 bg-white/80 hover:bg-white border border-gym-border text-gray-800 hover:text-gym-accent rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 btn-interactive shadow-xs min-h-[44px]"
        >
          <Download size={18} className="flex-shrink-0" />
          <span>Скачать Backup (JSON)</span>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="w-full py-3 px-4 bg-gym-accent hover:bg-persian-blue-600 disabled:opacity-50 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none text-white rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm btn-interactive min-h-[44px]"
        >
          <Upload size={18} className="flex-shrink-0" />
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
        <div className={`p-3 rounded-xl text-xs sm:text-sm font-bold border transition-all animate-fadeIn ${
          status.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
            : 'bg-rose-50 border-rose-200 text-rose-700'
        }`}>
          {status.message}
        </div>
      )}
    </div>
  );
};
