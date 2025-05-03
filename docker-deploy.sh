#!/bin/bash

echo "Сборка и запуск Docker-контейнеров для приложения Mentor"

# Остановка контейнеров, если они уже запущены
echo "Остановка существующих контейнеров..."
docker-compose down

# Сборка образов
echo "Сборка Docker-образов..."
docker-compose build

# Запуск контейнеров
echo "Запуск контейнеров..."
docker-compose up -d

echo "Приложение запущено. Доступно по адресу:"
echo "- Фронтенд: http://localhost"
echo "- Бэкенд API: http://localhost:5000"

echo "Для просмотра логов используйте:"
echo "docker-compose logs -f"

echo "Для остановки приложения используйте:"
echo "docker-compose down" 