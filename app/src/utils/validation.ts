/* eslint-disable @typescript-eslint/no-explicit-any */
// Легковесный рукописный валидатор типов для форм Brosky Gym.
// Избегает импорта библиотеки Zod в основном бандле для сохранения высокого LCP.

class LightSchema<T> {
  validateFn: (data: any) => string | null;

  constructor(validateFn: (data: any) => string | null) {
    this.validateFn = validateFn;
  }

  safeParse(data: any) {
    const errorMsg = this.validateFn(data);
    if (!errorMsg) {
      return { success: true, data: data as T, error: null };
    } else {
      return {
        success: false,
        data: null,
        error: {
          issues: [{ path: ['field'], message: errorMsg }]
        }
      };
    }
  }
}

// 1. Схема профиля атлета (используется при онбординге)
export const AthleteProfileSchema = new LightSchema<any>((data) => {
  if (!data) return 'Данные профиля отсутствуют';
  if (data.gender !== 'male' && data.gender !== 'female') return 'Укажите пол';
  
  const age = Number(data.age);
  if (isNaN(age) || age < 1 || age > 120) return 'Укажите корректный возраст (1-120)';
  
  const weight = Number(data.weight);
  if (isNaN(weight) || weight <= 0) return 'Укажите корректный вес';
  
  const height = Number(data.height);
  if (isNaN(height) || height <= 0) return 'Укажите корректный рост';
  
  const fat = Number(data.fatPercent);
  if (isNaN(fat) || fat < 0 || fat > 100) return 'Укажите корректный процент жира (0-100)';
  
  if (!data.username || typeof data.username !== 'string' || data.username.trim() === '') {
    return 'Укажите имя пользователя';
  }
  return null;
});

// 2. Схема записи прогресса (веса и замеров)
export const ProgressEntrySchema = new LightSchema<any>((data) => {
  if (!data) return 'Данные замера отсутствуют';
  if (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) return 'Неверный формат даты';
  
  if (data.weight !== undefined && data.weight !== '') {
    const weight = Number(data.weight);
    if (isNaN(weight) || weight <= 0) return 'Вес должен быть положительным числом';
  }
  
  if (data.fatPercent !== undefined && data.fatPercent !== '') {
    const fat = Number(data.fatPercent);
    if (isNaN(fat) || fat < 0 || fat > 100) return 'Процент жира должен быть от 0 до 100';
  }
  
  const metrics = ['chest', 'waist', 'hips', 'thigh', 'biceps'];
  for (const metric of metrics) {
    if (data[metric] !== undefined && data[metric] !== '') {
      const val = Number(data[metric]);
      if (isNaN(val) || val <= 0) {
        return 'Замеры обхватов должны быть положительными числами';
      }
    }
  }
  return null;
});

// 3. Схема упражнения (при добавлении/редактировании в WorkoutTab)
export const ExerciseSchema = new LightSchema<any>((data) => {
  if (!data) return 'Данные упражнения отсутствуют';
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    return 'Укажите название упражнения';
  }
  if (!data.muscleGroup || typeof data.muscleGroup !== 'string' || data.muscleGroup.trim() === '') {
    return 'Укажите целевую мышечную группу';
  }
  if (!data.equipment || typeof data.equipment !== 'string' || data.equipment.trim() === '') {
    return 'Укажите оборудование';
  }
  return null;
});

// 4. Схема шаблона тренировки (в WorkoutTab)
export const WorkoutTemplateSchema = new LightSchema<any>((data) => {
  if (!data) return 'Данные шаблона отсутствуют';
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    return 'Укажите название шаблона';
  }
  if (!Array.isArray(data.exercises) || data.exercises.length === 0) {
    return 'Добавьте хотя бы одно упражнение в шаблон';
  }
  return null;
});

/**
 * Валидирует данные формы на основе переданной схемы.
 */
export function validateData<T>(schema: LightSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors: Record<string, string>;
} {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data as T, errors: {} };
  } else {
    const errorMsg = result.error?.issues?.[0]?.message || 'Ошибка валидации';
    const errors: Record<string, string> = {
      global: errorMsg
    };
    return { success: false, errors };
  }
}
