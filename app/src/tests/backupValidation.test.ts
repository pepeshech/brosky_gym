import { describe, it, expect } from 'vitest';
import { validateBackup } from '../utils/backupValidation';

describe('Backup Validation (Zod)', () => {
  it('validates a valid backup data structure', () => {
    const validBackup = {
      profile: {
        gender: 'male',
        age: 28,
        weight: 78,
        height: 180,
        fatPercent: 14,
        selectedGoal: 'recomp',
        username: 'BroskyUser',
        isOnboarded: true,
      },
      progress: [
        {
          date: '2026-07-20',
          weight: 78,
          fatPercent: 14,
        },
      ],
      workoutSessions: [],
    };

    const parsed = validateBackup(validBackup);
    expect(parsed.profile.username).toBe('BroskyUser');
    expect(parsed.progress.length).toBe(1);
  });

  it('throws an error for corrupt or incomplete backup data', () => {
    const corruptBackup = {
      profile: {
        gender: 'invalid_gender',
      },
      progress: 'not_an_array',
    };

    expect(() => validateBackup(corruptBackup)).toThrow();
  });
});
