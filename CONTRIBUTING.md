# Руководство по внесению вклада в Brosky Gym 🏋️‍♂️

Спасибо за проявленный интерес к проекту **Brosky Gym Tracker Pro**! Мы рады любым улучшениям, баг-фиксам и идеям.

---

## 🛠️ Как запустить проект локально

### Требования
- **Node.js**: версия 18 или новее
- **npm**: встроен с Node.js

### Пошаговая инструкция

1. **Склонируйте репозиторий**:
   ```bash
   git clone https://github.com/pepeshech/brosky_gym.git
   cd brosky_gym
   ```

2. **Установите зависимости**:
   ```bash
   cd app
   npm install
   ```

3. **Запустите сервер разработки**:
   ```bash
   npm run dev
   ```
   Откройте `http://localhost:5173/` в вашем браузере.

---

## 🧪 Проверка кода перед коммитом

Перед созданием Pull Request убедитесь, что все тесты и проверки типов проходят без ошибок:

```bash
# Проверка типов TypeScript
npm run typecheck

# Запуск юнит-тестов (Vitest)
npm test

# Проверка линтером (ESLint)
npm run lint
```

---

## 📝 Соглашение о названиях коммитов (Conventional Commits)

Пожалуйста, используйте понятные префиксы для названий ваших коммитов:

- `feat:` — Новая функция (например: `feat: add new BMR formula option`)
- `fix:` — Исправление ошибки (например: `fix: DOMS calculation boundary check`)
- `docs:` — Обновление документации (`docs: update README with API details`)
- `style:` — Изменения форматирования, отступов или стилей CSS
- `refactor:` — Рефакторинг кода без изменения логики
- `test:` — Добавление или обновление тестов

---

## 📤 Создание Pull Request (PR)

1. Создайте новую ветку для вашей фичи или фикса:
   ```bash
   git checkout -b feat/my-awesome-feature
   ```
2. Зафиксируйте свои изменения и сделайте push:
   ```bash
   git add .
   git commit -m "feat: description of changes"
   git push origin feat/my-awesome-feature
   ```
3. Откройте **Pull Request** на GitHub, выбрав наш специальный шаблон PR.

---

## 💬 Связь и Вопросы

Если у вас есть вопросы или идеи по развитию проекта:
- Создайте **[Issue](https://github.com/pepeshech/brosky_gym/issues)** на GitHub
- Напишите автору в Telegram: **[@pepeshetf](https://t.me/pepeshetf)**
