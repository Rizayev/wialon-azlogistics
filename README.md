# Wialon AZLogistika — Объединённая хронология (Xronologiya-Yeni)

Веб-приложение: выгружает данные из **Wialon Local** (`go.gps.az`) по отчёту
**Xronologiya-Yeni** и показывает 3 под-отчёта (Trips / Parkings / Chronology)
**одной объединённой таблицей** — движение и стоянки в хронологическом порядке,
как в нативном UI Wialon.

## Архитектура

```
React (Vite + TS)  ──/api──►  Express (Node, TS)  ──►  go.gps.az/wialon/ajax.html
   UI / таблица                токен в .env, не уходит в браузер
                               login → sid, exec_report → merge
```

- Backend держит токен server-side (CORS на Wialon закрыт → прямые запросы из браузера невозможны).
- На каждый объект: `report/exec_report` (шаблон 16) → `get_result_subrows` Trips + Parkings → слияние по времени → итоги.

## Запуск (dev)

```bash
cp .env.example .env      # вписать WIALON_TOKEN
npm install               # ставит workspaces (server + client)
npm run dev               # server :3000, client :5173 (proxy /api → :3000)
```

Открыть http://localhost:5173 → выбрать объект(ы), период, **Применить**.

## Запуск (production / один контейнер)

```bash
npm install
npm run build             # client/dist + server/dist
WIALON_TOKEN=... npm start # Express отдаёт client/dist и /api на :3000
```

## Docker

```bash
docker build -t wialon-az .
docker run -p 3000:3000 -e WIALON_TOKEN=... wialon-az
# или
WIALON_TOKEN=... docker compose up --build
```

## Переменные окружения

| Переменная           | Назначение                         | По умолчанию           |
|----------------------|------------------------------------|------------------------|
| `WIALON_HOST`        | Хост Wialon Local                  | `https://go.gps.az`    |
| `WIALON_TOKEN`       | Токен доступа (обязателен)         | —                      |
| `WIALON_RESOURCE_ID` | ID ресурса с шаблоном              | `49131`                |
| `WIALON_TEMPLATE_ID` | ID шаблона Xronologiya-Yeni        | `16`                   |
| `PORT`               | Порт HTTP                          | `3000`                 |

## API

- `GET  /api/units` — список объектов
- `GET  /api/groups` — группы объектов
- `POST /api/report` — `{unitIds, from, to, show, minParking, minMovement}` → объединённые отчёты
- `POST /api/export` — то же + `viewMode` → файл `.xlsx`

## Функции UI

- Левая панель: объекты (поиск, группы, чекбоксы), настройки отчёта.
- Фильтр «Показывать»: Все / В движении / Парковка / Стоянки в геозонах / вне геозон.
- Мин. парковка / Мин. движение (мин).
- Переключатель вида: таблица на юнит ↔ одна общая таблица.
- Экспорт: Excel (.xlsx), PDF / Печать (через печать браузера).
- Колонки: Статус, Водитель, Старт, Конец, Длительность, Пробег, Сред. скорость, Макс. скорость, Расход топлива.
- Итоги: «Итого движение» и «Итого стоянка».

> Период трактуется в часовом поясе аккаунта (UTC+4, Баку).
