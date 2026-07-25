import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distAssetsDir = path.join(__dirname, '..', 'dist', 'assets');

// Находим файл backupValidation в скомпилированном dist/assets
const files = fs.readdirSync(distAssetsDir);
const backupValFile = files.find(f => f.startsWith('backupValidation-') && f.endsWith('.js'));

if (!backupValFile) {
  console.error('Error: Could not find backupValidation asset in dist/assets');
  process.exit(1);
}

const backupValPath = path.join(distAssetsDir, backupValFile);
const backupValUrl = `file://${backupValPath.replace(/\\/g, '/')}`;

// Динамически импортируем скомпилированную функцию
const { validateBackup } = await import(backupValUrl);

// Валидные тестовые данные бэкапа с customFoods
const testBackup = {
  profile: {
    gender: 'female',
    age: 28,
    weight: 60,
    height: 168,
    fatPercent: 22,
    selectedGoal: 'maintenance',
    username: 'JuliaBrosky',
    isOnboarded: true
  },
  progress: [],
  workoutSessions: [],
  customFoods: [
    {
      name: 'Овсянка на воде с медом',
      calories: 250,
      protein: 6.5,
      fat: 3.2,
      carbs: 48,
      baseWeight: 100
    }
  ]
};

console.log('--- Testing backup validation with customFoods ---');
try {
  const result = validateBackup(testBackup);
  console.log('✓ Backup with customFoods parsed successfully!');
  console.log('First custom food name:', result.customFoods[0].name);
  console.log('First custom food calories:', result.customFoods[0].calories);
} catch (err) {
  console.error('✗ Failed validation:', err);
  process.exit(1);
}

// Тестируем невалидный кастомный продукт
const invalidBackup = {
  ...testBackup,
  customFoods: [
    {
      name: 'Невалидное блюдо',
      calories: -10, // Должно быть неотрицательным
      protein: 5,
      fat: 'five-grams', // Должно быть числом
      carbs: 20,
      baseWeight: 0 // Должно быть положительным
    }
  ]
};

console.log('\n--- Testing backup validation with INVALID customFoods ---');
try {
  validateBackup(invalidBackup);
  console.error('✗ Error: Invalid customFood passed validation!');
  process.exit(1);
} catch (err) {
  console.log('✓ Invalid customFood was successfully rejected! Errors:');
  console.log(err.message);
}

console.log('\nAll custom foods validation tests passed successfully!');
