# Интерактивное Портфолио с Чатом

Современное портфолио разработчика с интегрированным чатом и Telegram-уведомлениями.

## 🚀 Особенности

### Для администратора:
- ✅ Управление проектами через файловую систему (без базы данных)
- ✅ Получение уведомлений о новых сообщениях в Telegram
- ✅ Ответы на сообщения через Telegram
- ✅ Простое добавление/обновление контента проектов

### Для посетителей:
- ✅ Просмотр портфолио и проектов
- ✅ Детальный просмотр проектов с кастомным HTML/CSS
- ✅ Чат с администратором в реальном времени
- ✅ Сохранение истории чата в браузере
- ✅ Адаптивный дизайн для всех устройств

## 🛠 Технологии

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, Socket.io
- **Интеграция**: Telegram Bot API
- **Хранение**: localStorage (клиент), файловая система (проекты)

## 📦 Установка

1. **Клонируйте репозиторий:**
```bash
git clone <repository-url>
cd interactive-portfolio
```

2. **Установите зависимости:**
```bash
npm install
```

3. **Настройте Telegram Bot:**
   - Создайте бота у [@BotFather](https://t.me/BotFather)
   - Получите токен бота
   - Узнайте свой Chat ID у [@userinfobot](https://t.me/userinfobot)

4. **Создайте файл .env:**
```bash
cp .env.example .env
```

5. **Заполните .env файл:**
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
PORT=3001
```

## 🚀 Запуск

### Режим разработки (с чатом):
```bash
npm run dev:full
```
Это запустит:
- Frontend на http://localhost:5173
- WebSocket сервер на http://localhost:3001

### Только frontend:
```bash
npm run dev
```

### Только сервер чата:
```bash
npm run server
```

## 📁 Управление проектами

### Структура проектов:
```
public/projects/
├── projects.json          # Основной файл с данными проектов
├── project-name/
│   ├── content.html      # HTML контент проекта
│   ├── styles.css        # CSS стили проекта
│   └── images/           # Изображения проекта
└── ...
```

### Добавление нового проекта:

1. **Обновите `public/projects/projects.json`:**
```json
{
  "projects": [
    {
      "id": "my-new-project",
      "title": "Мой новый проект",
      "description": "Описание проекта",
      "image": "/projects/my-new-project/preview.jpg",
      "technologies": ["React", "Node.js"],
      "category": "Web App",
      "demoUrl": "https://demo.example.com",
      "githubUrl": "https://github.com/user/repo",
      "featured": true,
      "content": "/projects/my-new-project/content.html",
      "styles": "/projects/my-new-project/styles.css"
    }
  ]
}
```

2. **Создайте папку проекта:**
```bash
mkdir public/projects/my-new-project
```

3. **Добавьте контент (`content.html`):**
```html
<div class="project-content">
  <h2>Мой новый проект</h2>
  <div class="project-gallery">
    <img src="/projects/my-new-project/screenshot1.jpg" alt="Скриншот 1" />
  </div>
  <div class="project-details">
    <h3>Описание:</h3>
    <p>Подробное описание проекта...</p>
  </div>
</div>
```

4. **Добавьте стили (`styles.css`):**
```css
.project-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.project-content h2 {
  color: #6366f1;
  font-size: 2.5rem;
  margin-bottom: 2rem;
}
```

## 💬 Использование чата

### Для посетителей:
1. Нажмите кнопку "Открыть чат" в секции контактов
2. Введите сообщение и отправьте
3. История сохраняется в браузере автоматически

### Для администратора:
1. Получайте уведомления в Telegram
2. Отвечайте в формате: `@user_id ваш ответ`
3. Пример: `@user_abc123 Спасибо за ваше сообщение!`

## 🔧 Конфигурация

### Настройка CSP (Content Security Policy):
В `index.html` обновите CSP для вашего домена:
```html
connect-src 'self' https://your-domain.com ws://localhost:3001;
```

### Настройка для продакшена:
1. Обновите URL WebSocket сервера в `Chat.tsx`
2. Настройте CORS в `server.js`
3. Используйте HTTPS для WebSocket (WSS)

## 📱 Деплой

### Frontend (статический):
```bash
npm run build
```
Загрузите содержимое папки `dist/` на любой статический хостинг.

### Backend (сервер чата):
Разверните `server.js` на любом Node.js хостинге (Heroku, DigitalOcean, VPS).

## 🔒 Безопасность

- Сообщения не сохраняются на сервере
- Используется только временный буфер для передачи
- Telegram токены хранятся в переменных окружения
- CSP защищает от XSS атак

## 🐛 Устранение неполадок

### Чат не подключается:
1. Проверьте, запущен ли сервер на порту 3001
2. Убедитесь, что WebSocket URL корректный
3. Проверьте консоль браузера на ошибки

### Telegram не работает:
1. Проверьте правильность токена бота
2. Убедитесь, что Chat ID корректный
3. Проверьте логи сервера

### Проекты не загружаются:
1. Проверьте формат `projects.json`
2. Убедитесь, что пути к файлам корректные
3. Проверьте права доступа к файлам

## 📄 Лицензия

MIT License - используйте свободно для личных и коммерческих проектов.

## 🤝 Поддержка

Если у вас есть вопросы или предложения, создайте issue в репозитории или свяжитесь через чат на сайте!