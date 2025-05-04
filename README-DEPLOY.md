# Инструкция по развертыванию MentorAI

Это руководство описывает процесс настройки и развертывания приложения MentorAI с использованием Docker и GitHub Actions для CI/CD.

## Предварительные требования

- Docker и Docker Compose на сервере
- Аккаунт GitHub для настройки CI/CD
- Доменное имя (опционально)

## Настройка переменных окружения

### 1. GitHub Secrets

Настройте следующие секреты в вашем репозитории GitHub:

- `DOCKERHUB_USERNAME`: имя пользователя Docker Hub
- `DOCKERHUB_TOKEN`: токен доступа Docker Hub
- `SSH_HOST`: IP-адрес вашего сервера
- `SSH_USERNAME`: имя пользователя SSH
- `SSH_PRIVATE_KEY`: приватный SSH-ключ для доступа к серверу
- `REACT_APP_API_URL`: URL вашего API (например, https://api.yourdomain.com)
- `DB_USER`: имя пользователя базы данных PostgreSQL
- `DB_PASSWORD`: пароль от базы данных
- `DB_NAME`: имя базы данных
- `JWT_SECRET`: секретный ключ для JWT-аутентификации
- `RAW_DOCKER_COMPOSE_URL`: URL для скачивания docker-compose.yml (можно использовать raw.githubusercontent.com)

### 2. Файл .env на сервере

Создайте файл `.env` в директории с docker-compose.yml:

```bash
DB_USER=your_db_user
DB_PASSWORD=your_strong_password
DB_NAME=mentorapp
JWT_SECRET=your_strong_jwt_secret
```

## Настройка CORS в бэкенде

Перед деплоем убедитесь, что в файле `server-go/main.go` настроен CORS для вашего домена:

```go
// Заменить этот блок в main.go
router.Use(cors.New(cors.Config{
    AllowOrigins:     []string{"https://yourdomain.com", "http://localhost:3000"},
    AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
    AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
    ExposeHeaders:    []string{"Content-Length"},
    AllowCredentials: true,
}))
```

## Локальное тестирование с Docker

Для локального запуска и тестирования перед деплоем:

1. Создайте файл `.env` с переменными окружения
2. Выполните команду:

```bash
docker-compose up --build
```

## Развертывание с использованием CI/CD

При настроенном CI/CD каждый пуш в ветку `main` или `master` автоматически:

1. Запускает тесты фронтенда и бэкенда
2. Собирает Docker образы 
3. Отправляет образы в Docker Hub
4. Деплоит приложение на ваш сервер

## Ручное развертывание

Если нужно развернуть приложение вручную:

1. Клонируйте репозиторий на сервер
2. Создайте файл `.env` с нужными переменными окружения
3. Выполните:

```bash
docker-compose up -d
```

## Обновление приложения

Для обновления при ручном развертывании:

```bash
git pull
docker-compose down
docker-compose up -d --build
```

## Доступ к приложению

После успешного развертывания:

- Фронтенд будет доступен по адресу: `http://your-server-ip` или `https://yourdomain.com`
- API будет доступно по адресу: `http://your-server-ip:5001` или `https://api.yourdomain.com`

## Мониторинг и логи

Для просмотра логов:

```bash
# Все контейнеры
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f postgres
```

## Резервное копирование базы данных

Для создания резервной копии базы данных:

```bash
docker-compose exec postgres pg_dump -U $DB_USER $DB_NAME > backup_$(date +%Y%m%d%H%M%S).sql
```

## Особенности настройки для производственной среды

- Добавьте SSL/TLS сертификаты для HTTPS
- Настройте автоматические бэкапы данных
- Рассмотрите использование managed-баз данных вместо контейнеризованных для продакшена
- Настройте мониторинг и оповещения 