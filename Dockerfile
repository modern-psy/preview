# ============================================================
# Образ превью на Astro для Timeweb App Platform (тип приложения — Dockerfile).
# 🔴 Служебный файл. Менять, только если понимаешь, что делаешь.
#
# Два шага:
#   1. Сборка: Node 24 ставит зависимости и собирает сайт (npm run build → dist/),
#      заодно превращает список переадресаций в правила сервера.
#   2. Запуск: только готовая папка dist и сервер Caddy (конфиг — Caddyfile рядом).
#      Node в работающем образе не нужен: сайт статический.
#
# Основа — Debian, не Alpine: на Alpine Timeweb не пропускал проверку состояния
# (подробности — история apps/timetable-cms в asp-deploy).
# ============================================================

# ---------- 1. Сборка ----------
FROM node:24 AS build
WORKDIR /opt/app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build && node scripts/caddy-redirects.mjs > /opt/app/redirects.caddy

# ---------- 2. Сервер ----------
# Берём готовый сервер Caddy из официального образа и кладём в Debian
FROM caddy:2 AS caddy

FROM debian:bookworm-slim
COPY --from=caddy /usr/bin/caddy /usr/bin/caddy
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /opt/app/redirects.caddy /etc/caddy/redirects.caddy
COPY --from=build /opt/app/dist /srv

# Порт, который слушает сервер. В панели Timeweb указать его же.
EXPOSE 8080
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
