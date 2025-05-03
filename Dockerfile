# Dockerfile для фронтенда

# Stage 1: Сборка фронтенда
FROM node:20-alpine as build

WORKDIR /app

# Копируем файлы package.json и yarn.lock
COPY package.json yarn.lock ./

# Устанавливаем зависимости
RUN yarn install --frozen-lockfile

# Копируем исходный код
COPY public/ public/
COPY src/ src/
COPY tailwind.config.js ./

# Собираем проект
RUN yarn build

# Stage 2: Nginx для раздачи статических файлов
FROM nginx:alpine

# Копируем собранные файлы из стадии сборки
COPY --from=build /app/build /usr/share/nginx/html

# Копируем пользовательскую конфигурацию Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 