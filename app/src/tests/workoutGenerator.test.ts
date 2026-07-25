import { describe, it, expect } from 'vitest';
import { generateSmartWorkoutTemplate } from '../utils/workoutGenerator';

describe('Smart Workout Generator AI Engine', () => {
  it('generates a valid hypertrophy template for Chest and Triceps', async () => {
    const res = await generateSmartWorkoutTemplate({
      goal: 'hypertrophy',
      targetMuscles: ['Грудь', 'Трицепс'],
      equipment: ['Штанга', 'Гантели', 'Блок'],
      durationMinutes: 45,
      experienceLevel: 'intermediate',
    });

    expect(res.template.id).toContain('ai-template');
    expect(res.template.exercises.length).toBeGreaterThanOrEqual(3);
    expect(res.totalSets).toBeGreaterThan(0);
    expect(res.adviceText).toContain('Совет тренера');
  });

  it('assigns strength reps and rest intervals for strength goal', async () => {
    const res = await generateSmartWorkoutTemplate({
      goal: 'strength',
      targetMuscles: ['Квадрицепс', 'Поясница'],
      equipment: ['Штанга'],
      durationMinutes: 60,
      experienceLevel: 'advanced',
    });

    const firstExercise = res.template.exercises[0];
    expect(firstExercise.reps).toBe('4-6');
    expect(firstExercise.restSec).toBe(180);
    expect(firstExercise.sets).toBe(5);
  });

  it('adjusts duration and exercise count for express 30 min session', async () => {
    const res = await generateSmartWorkoutTemplate({
      goal: 'quick',
      targetMuscles: ['Бицепс'],
      equipment: ['Гантели'],
      durationMinutes: 30,
      experienceLevel: 'beginner',
    });

    expect(res.template.exercises.length).toBeLessThanOrEqual(3);
    expect(res.template.exercises[0].restSec).toBe(60);
  });
});
