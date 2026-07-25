import { describe, it, expect } from 'vitest';
import {
  validateData,
  AthleteProfileSchema,
  ProgressEntrySchema,
  ExerciseSchema,
  WorkoutTemplateSchema
} from '../utils/validation';

describe('Light Validation Schemas', () => {
  describe('AthleteProfileSchema', () => {
    it('validates correct athlete profile data', () => {
      const validProfile = {
        gender: 'male',
        age: 25,
        weight: 75,
        height: 175,
        fatPercent: 15,
        username: 'Alex'
      };
      const result = validateData(AthleteProfileSchema, validProfile);
      expect(result.success).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('rejects profile with missing or invalid gender', () => {
      const invalidProfile = {
        gender: 'other',
        age: 25,
        weight: 75,
        height: 175,
        fatPercent: 15,
        username: 'Alex'
      };
      const result = validateData(AthleteProfileSchema, invalidProfile);
      expect(result.success).toBe(false);
      expect(result.errors.global).toBe('Укажите пол');
    });

    it('rejects profile with invalid age or weight', () => {
      const invalidAge = {
        gender: 'female',
        age: -5,
        weight: 60,
        height: 165,
        fatPercent: 20,
        username: 'Anna'
      };
      const result = validateData(AthleteProfileSchema, invalidAge);
      expect(result.success).toBe(false);
      expect(result.errors.global).toBe('Укажите корректный возраст (1-120)');
    });
  });

  describe('ProgressEntrySchema', () => {
    it('validates correct progress entry', () => {
      const entry = {
        date: '2026-07-23',
        weight: 80.5,
        fatPercent: 14.5,
        waist: 82
      };
      const result = validateData(ProgressEntrySchema, entry);
      expect(result.success).toBe(true);
    });

    it('rejects progress entry with invalid date format', () => {
      const entry = {
        date: '23-07-2026',
        weight: 80.5
      };
      const result = validateData(ProgressEntrySchema, entry);
      expect(result.success).toBe(false);
      expect(result.errors.global).toBe('Неверный формат даты');
    });
  });

  describe('ExerciseSchema', () => {
    it('validates valid custom exercise', () => {
      const exercise = {
        name: 'Жим лежа на наклонной скамье',
        muscleGroup: 'Грудные',
        equipment: 'Штанга'
      };
      const result = validateData(ExerciseSchema, exercise);
      expect(result.success).toBe(true);
    });

    it('rejects exercise without name', () => {
      const exercise = {
        name: '',
        muscleGroup: 'Грудные',
        equipment: 'Штанга'
      };
      const result = validateData(ExerciseSchema, exercise);
      expect(result.success).toBe(false);
      expect(result.errors.global).toBe('Укажите название упражнения');
    });
  });

  describe('WorkoutTemplateSchema', () => {
    it('validates valid workout template', () => {
      const template = {
        name: 'День Груди и Трицепса',
        exercises: [{ exerciseId: 'ex1', sets: 4, reps: 10, restSec: 90, order: 1 }]
      };
      const result = validateData(WorkoutTemplateSchema, template);
      expect(result.success).toBe(true);
    });

    it('rejects template without exercises', () => {
      const template = {
        name: 'Пустой шаблон',
        exercises: []
      };
      const result = validateData(WorkoutTemplateSchema, template);
      expect(result.success).toBe(false);
      expect(result.errors.global).toBe('Добавьте хотя бы одно упражнение в шаблон');
    });
  });
});
