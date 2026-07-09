import { useGymStore } from '../store/gymStore';

/**
 * Экспорт состояния приложения (Zustand -> JSON).
 * Формирует файл формата YYYY-MM-DD-brosky-gym-backup.json и инициирует скачивание.
 */
export const exportBackup = () => {
  const state = useGymStore.getState();
  
  // Извлекаем только нужные ключи состояния (без функций)
  const backupData = {
    profile: state.profile,
    progress: state.progress,
    workoutSessions: state.workoutSessions,
    nutritionLogs: state.nutritionLogs,
    trackedMetrics: state.trackedMetrics,
    workoutTemplates: state.workoutTemplates,
    personalRecords: state.personalRecords,
    prHistory: state.prHistory,
    customFoods: state.customFoods,
    nutritionPresets: state.nutritionPresets,
    dailyNutritionPresets: state.dailyNutritionPresets,
  };

  const dataStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().split('T')[0];
  const exportFileDefaultName = `${dateStr}-brosky-gym-backup.json`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', url);
  linkElement.setAttribute('download', exportFileDefaultName);
  document.body.appendChild(linkElement);
  linkElement.click();
  document.body.removeChild(linkElement);
  
  URL.revokeObjectURL(url);
};

/**
 * Импорт состояния из JSON-файла.
 * Валидация происходит внутри store (через backupValidation.ts).
 */
export const importBackupFile = async (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const jsonString = event.target?.result as string;
        if (!jsonString) {
          resolve(false);
          return;
        }
        
        const json = JSON.parse(jsonString);
        
        // importBackup вызывает validateBackup внутри себя
        const success = await useGymStore.getState().importBackup(json);
        resolve(success);
      } catch (error) {
        console.error('Error parsing or importing backup file:', error);
        resolve(false);
      }
    };
    
    reader.onerror = () => {
      console.error('FileReader error while reading backup');
      resolve(false);
    };
    
    reader.readAsText(file);
  });
};
