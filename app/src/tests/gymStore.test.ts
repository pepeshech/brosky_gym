import { describe, it, expect, beforeEach } from 'vitest';
import { useGymStore, defaultExercises } from '../store/gymStore';
import type { Exercise } from '../types';

describe('gymStore persistence & partialize behavior', () => {
  beforeEach(() => {
    useGymStore.getState().resetAllData();
  });

  it('initializes with default 253 exercises', () => {
    const exercises = useGymStore.getState().exercises;
    expect(exercises.length).toBeGreaterThanOrEqual(250);
    expect(exercises[0].id).toBe('bench-press-barbell');
  });

  it('allows adding and managing custom exercises', () => {
    const customEx: Exercise = {
      id: 'custom-exercise-1',
      name: 'Кастомное упражнение',
      muscleGroup: 'Грудь',
      equipment: 'Гантели',
      repScheme: '3x10',
      technique: 'Тестовая техника',
      color: '#e65c5c',
      isCustom: true,
    };

    useGymStore.getState().addExercise(customEx);

    const exercises = useGymStore.getState().exercises;
    expect(exercises.some((e) => e.id === 'custom-exercise-1')).toBe(true);

    useGymStore.getState().deleteExercise('custom-exercise-1');
    const updatedExercises = useGymStore.getState().exercises;
    expect(updatedExercises.some((e) => e.id === 'custom-exercise-1')).toBe(false);
  });

  it('preserves defaultExercises integrity after reset', () => {
    useGymStore.getState().resetAllData();
    const exercises = useGymStore.getState().exercises;
    expect(exercises.length).toBe(defaultExercises.length);
  });
});
