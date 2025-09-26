# Альтернативные варианты деплоя

## 1. Vercel (рекомендуется)
```bash
# Установка Vercel CLI
npm i -g vercel

# Деплой
vercel --prod
```

## 2. Netlify
```bash
# Установка Netlify CLI
npm i -g netlify-cli

# Деплой
netlify deploy --prod --dir=dist
```

## 3. Firebase Hosting
```bash
# Уже настроен в проекте
firebase deploy --only hosting
```

## 4. Surge.sh
```bash
# Установка
npm i -g surge

# Деплой
surge dist your-domain.surge.sh
```

Все эти платформы поддерживают приватные репозитории и автоматический деплой.
