Write-Host "Сборка и запуск Docker-контейнеров для приложения Mentor" -ForegroundColor Green

# Остановка контейнеров, если они уже запущены
Write-Host "Остановка существующих контейнеров..." -ForegroundColor Yellow
docker-compose down

# Сборка образов
Write-Host "Сборка Docker-образов..." -ForegroundColor Yellow
docker-compose build

# Запуск контейнеров
Write-Host "Запуск контейнеров..." -ForegroundColor Yellow
docker-compose up -d

Write-Host "`nПриложение запущено. Доступно по адресу:" -ForegroundColor Green
Write-Host "- Фронтенд: http://localhost" -ForegroundColor Cyan
Write-Host "- Бэкенд API: http://localhost:5000" -ForegroundColor Cyan

Write-Host "`nДля просмотра логов используйте:" -ForegroundColor Green
Write-Host "docker-compose logs -f" -ForegroundColor Cyan

Write-Host "`nДля остановки приложения используйте:" -ForegroundColor Green
Write-Host "docker-compose down" -ForegroundColor Cyan 