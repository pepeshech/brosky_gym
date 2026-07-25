import { describe, it, expect } from 'vitest';
import { calculateMonthlyStats, generateMonthlyReportCSV } from '../utils/reportExporter';
import type { WorkoutSession, ProgressEntry, NutritionLogEntry } from '../types';

describe('reportExporter engine', () => {
  const sampleSessions: WorkoutSession[] = [
    {
      id: 's1',
      date: '2026-07-10',
      templateId: 't1',
      templateName: 'Силовая Грудь-Трицепс',
      logs: {
        'bench-press': {
          exerciseId: 'bench-press',
          isCompleted: true,
          sets: [
            { setIndex: 0, weight: 100, reps: 5, isCompleted: true },
            { setIndex: 1, weight: 100, reps: 5, isCompleted: true },
          ],
        },
      },
    },
    {
      id: 's2',
      date: '2026-06-15', // Прошлый месяц (должен отфильтроваться)
      templateId: 't1',
      templateName: 'Спина-Бицепс',
      logs: {},
    },
  ];

  const sampleProgress: ProgressEntry[] = [
    { date: '2026-07-01', weight: 80.0, fatPercent: 15.0 },
    { date: '2026-07-30', weight: 81.5, fatPercent: 14.8 },
  ];

  const sampleNutrition: NutritionLogEntry[] = [
    {
      date: '2026-07-10',
      calories: 680,
      protein: 74,
      fat: 13,
      carbs: 60,
      items: [
        { id: '1', name: 'Овсянка', grams: 100, calories: 350, protein: 12, fat: 6, carbs: 60 },
        { id: '2', name: 'Курица', grams: 200, calories: 330, protein: 62, fat: 7, carbs: 0 },
      ],
    },
  ];

  it('correctly filters and calculates monthly summary statistics for July 2026', () => {
    const stats = calculateMonthlyStats(2026, 6, sampleSessions, sampleProgress, sampleNutrition);

    expect(stats.year).toBe(2026);
    expect(stats.month).toBe(6);
    expect(stats.monthName).toBe('Июль');
    expect(stats.totalWorkouts).toBe(1);
    expect(stats.totalVolumeKg).toBe(1000); // 100*5 + 100*5 = 1000
    expect(stats.totalSetsCompleted).toBe(2);
    expect(stats.avgDailyCalories).toBe(680); // 350 + 330
    expect(stats.weightStartKg).toBe(80.0);
    expect(stats.weightEndKg).toBe(81.5);
    expect(stats.weightChangeKg).toBe(1.5);
  });

  it('generates a clean CSV report string', () => {
    const stats = calculateMonthlyStats(2026, 6, sampleSessions, sampleProgress, sampleNutrition);
    const csv = generateMonthlyReportCSV(stats);

    expect(csv).toContain('"Сводный отчет Brosky Gym за период');
    expect(csv).toContain('"Общий тоннаж (кг)";"1000"');
    expect(csv).toContain('"2026-07-10";"Силовая Грудь-Трицепс"');
    expect(csv).toContain('"2026-07-01";"80"');
  });
});
