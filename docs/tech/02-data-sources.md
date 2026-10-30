# 02. Источники данных

Откуда приложение берёт погоду, города, местоположение и (позже) карту осадков. Запросы и ответы проверены вживую 2026-10-27, примеры ответов лежат в [samples/](samples/).

## Сводка

| Что | Источник | Ключ | Цена | Статус |
| --- | --- | --- | --- | --- |
| Текущая погода, 24 часа, 10 дней, восход и закат | [Open-Meteo Forecast API](https://open-meteo.com/en/docs) | не нужен | бесплатно для некоммерческого использования | первая версия |
| Поиск городов и аэропортов | [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) | не нужен | то же | первая версия |
| Текущее местоположение | `expo-location` (геолокация ОС) | не нужен | — | первая версия |
| Название места по координатам | `Location.reverseGeocodeAsync` (геокодер ОС) | не нужен | — | первая версия |
| Карта осадков | [RainViewer Weather Maps API](https://www.rainviewer.com/api/weather-maps-api.html) + подложка карты | не нужен | бесплатно для личного использования | этап 8 |
| Штормовые предупреждения | не выбран | — | — | отложено владельцем |
| Картинки | не нужны | — | — | — |

Своего сервера и прокси нет: ключей нет, прятать нечего (NFR-16 выполняется сам собой).

**Картинки.** Небо, облака, дождь, свечение и иконки погоды рисуются кодом ([04](04-ui-spec.md)). Фотографий городов в дизайне нет. Единственный внешний ресурс оформления — шрифт Bricolage Grotesque из пакета `@expo-google-fonts/bricolage-grotesque` (лицензия SIL OFL, встраивать в приложение можно).

## Open-Meteo Forecast

### Условия использования

- Бесплатный тариф только для некоммерческих приложений: без подписок и рекламы. Пет-проект и портфолио подходят (Q-01).
- Лимиты бесплатного тарифа: меньше 10 000 запросов в сутки, 5 000 в час, 600 в минуту, около 300 000 в месяц. Лимит считается по IP, то есть по каждому телефону отдельно.
- Данные под лицензией **CC BY 4.0**: нужна видимая подпись источника. В дизайне для неё места нет. Решение: строка `Данные: Open-Meteo.com` стилем `micro`, цвет `text-muted`, по центру в конце прокрутки главного экрана, нажатие открывает `https://open-meteo.com/` (`Linking.openURL`). Записано допущением A-08 в [docs/07](../07-risks-and-open-questions.md).
- Если приложение когда-нибудь станет коммерческим, нужна подписка: другой хост с префиксом `customer-` и параметр `apikey`. Тогда ключ уйдёт на прокси.

### Запрос

Один запрос на город даёт всё для главного экрана и карточки:

```
GET https://api.open-meteo.com/v1/forecast
  ?latitude=55.75
  &longitude=37.62
  &current=temperature_2m,apparent_temperature,relative_humidity_2m,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m
  &hourly=temperature_2m,precipitation_probability,precipitation,weather_code,is_day,dew_point_2m
  &daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunrise,sunset
  &timezone=auto
  &forecast_days=10
  &past_hours=3
  &forecast_hours=25
  &wind_speed_unit=ms
  &timeformat=unixtime
```

| Параметр | Зачем |
| --- | --- |
| `timezone=auto` | дни и восход считаются по местному времени города; в ответе приходят `timezone` и `utc_offset_seconds` |
| `forecast_days=10` | 10 дней для `DailyForecast` |
| `past_hours=3` | 3 прошедших часа для плитки «Осадки» («за 3 часа») |
| `forecast_hours=25` | текущий час и 24 следующих. **Без него вместе с `past_hours` почасовой ряд приходит на 16 дней** (387 точек вместо 28): проверено |
| `wind_speed_unit=ms` | ветер сразу в м/с (BR-14) |
| `timeformat=unixtime` | все моменты времени — секунды Unix (UTC). Локальное время получаем сдвигом на `utc_offset_seconds` ([03](03-domain-and-rules.md#время)) |

Координаты передавай с двумя знаками после запятой (`lat.toFixed(2)`): точность около километра, этого хватает для погоды, и запрос не раскрывает точное место (NFR-14).

Код (`src/features/weather/api.ts`):

```ts
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

const FORECAST_PARAMS = {
  current: 'temperature_2m,apparent_temperature,relative_humidity_2m,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m',
  hourly: 'temperature_2m,precipitation_probability,precipitation,weather_code,is_day,dew_point_2m',
  daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunrise,sunset',
  timezone: 'auto',
  forecast_days: '10',
  past_hours: '3',
  forecast_hours: '25',
  wind_speed_unit: 'ms',
  timeformat: 'unixtime',
} as const;

export function forecastUrl(lat: number, lon: number): string {
  const q = new URLSearchParams({ latitude: lat.toFixed(2), longitude: lon.toFixed(2), ...FORECAST_PARAMS });
  return `${FORECAST_URL}?${q.toString()}`;
}
```

`URLSearchParams` кодирует запятые как `%2C`, Open-Meteo это принимает.

### Ответ

Пример целиком: [samples/forecast-sochi.json](samples/forecast-sochi.json) (2.8 КБ). Структура:

```jsonc
{
  "latitude": 43.628204, "longitude": 39.69933, // узел сетки модели, не запрошенная точка
  "utc_offset_seconds": 10800,          // сдвиг местного времени от UTC, секунды
  "timezone": "Europe/Moscow",
  "timezone_abbreviation": "GMT+3",
  "elevation": 45.0,
  "current_units": { "...": "..." },
  "current": {
    "time": 1793085300,                 // начало 15-минутного интервала, Unix-секунды
    "interval": 900,
    "temperature_2m": 21.4,             // °C
    "apparent_temperature": 22.3,       // °C
    "relative_humidity_2m": 61,         // %
    "is_day": 1,                        // 1 день, 0 ночь
    "precipitation": 0.0,               // мм
    "weather_code": 2,                  // код WMO, см. 03
    "wind_speed_10m": 0.54,             // м/с
    "wind_direction_10m": 202,          // градусы, откуда дует
    "wind_gusts_10m": 3.0               // м/с
  },
  "hourly": {                           // параллельные массивы одной длины (28)
    "time": [1793073600, 1793077200, ...],   // [0..2] — прошлые 3 часа, [3] — текущий час
    "temperature_2m": [14.9, 15.5, ...],
    "precipitation_probability": [0, 0, ...], // %, может быть null
    "precipitation": [0.0, 0.0, ...],         // мм за час
    "weather_code": [3, 3, ...],
    "is_day": [1, 1, ...],
    "dew_point_2m": [7.4, 8.8, ...]
  },
  "daily": {                            // параллельные массивы длины 10
    "time": [1793048400, ...],          // местная полночь дня, Unix-секунды
    "weather_code": [3, 3, 61, ...],
    "temperature_2m_max": [22.6, ...],
    "temperature_2m_min": [14.9, ...],
    "precipitation_probability_max": [0, 5, 30, ...],
    "precipitation_sum": [0.0, 0.0, 2.6, ...],
    "sunrise": [1793073010, ...],       // Unix-секунды; в полярную ночь или день может не быть
    "sunset": [1793110761, ...]
  }
}
```

Что проверено на живых ответах:

- `hourly.time[3]` равен началу текущего часа, а `current.time` лежит внутри этого часа. Но не полагайся на индекс 3: ищи последний `hourly.time[i] <= current.time` ([03](03-domain-and-rules.md#лента-часов)).
- `daily.time[0]` — сегодняшняя местная полночь: `daily.time[0] + utc_offset_seconds` делится на 86 400 без остатка.
- Любое числовое поле в массивах может прийти `null`, если модель не даёт значения. Схема zod допускает `null` везде, где это не ломает экран.

### Ошибки

| Случай | Что приходит | Как классифицировать |
| --- | --- | --- |
| Нет сети, DNS, таймаут | `fetch` бросает исключение или срабатывает `AbortController` (10 с) | `{ kind: 'offline' }` |
| Неверные параметры | HTTP 400, тело `{"error": true, "reason": "Latitude must be in range of -90 to 90°. Given: 999.0."}` | `{ kind: 'server', status, reason }` |
| Лимит | HTTP 429 | `{ kind: 'rate-limit' }` |
| Сервер | HTTP 5xx | `{ kind: 'server', status }` |
| Не та форма | 200, но zod не прошёл | `{ kind: 'invalid', issues }` |

```ts
export type WeatherError =
  | { kind: 'offline' }
  | { kind: 'rate-limit' }
  | { kind: 'server'; status: number; reason?: string }
  | { kind: 'invalid'; issues: string };
```

Общий помощник `src/lib/http.ts`: `getJson(url, { timeoutMs: 10_000 })` возвращает `{ ok: true, data } | { ok: false, error }` и никогда не бросает. Повторы: один повтор через 2 с только для `offline` и 5xx. 429 не повторяй.

### Схема zod (`src/features/weather/schema.ts`)

```ts
import { z } from 'zod';

const num = z.number();
const numOrNull = z.number().nullable();
const series = z.array(numOrNull);

export const forecastSchema = z.object({
  utc_offset_seconds: num,
  timezone: z.string(),
  current: z.object({
    time: num,
    temperature_2m: num,
    apparent_temperature: numOrNull,
    relative_humidity_2m: numOrNull,
    is_day: num,
    precipitation: numOrNull,
    weather_code: num,
    wind_speed_10m: numOrNull,
    wind_direction_10m: numOrNull,
    wind_gusts_10m: numOrNull,
  }),
  hourly: z.object({
    time: z.array(num),
    temperature_2m: series,
    precipitation_probability: series,
    precipitation: series,
    weather_code: series,
    is_day: series,
    dew_point_2m: series,
  }),
  daily: z.object({
    time: z.array(num),
    weather_code: series,
    temperature_2m_max: series,
    temperature_2m_min: series,
    precipitation_probability_max: series,
    precipitation_sum: series,
    sunrise: series,
    sunset: series,
  }),
});

export type RawForecast = z.infer<typeof forecastSchema>;
```

Обязательны только текущая температура, код и время. Без них экрану нечего показать, и ответ считается `invalid`. Остальное при `null` превращается в прочерк или скрытую плитку ([03](03-domain-and-rules.md#пустые-значения)).

### Лимиты

Расход на одного пользователя: запуск плюс возвраты в приложение не чаще раза в 30 минут на город. При 10 городах и активном дне это порядка 10 × 30 = 300 запросов в сутки, далеко от лимита 10 000. Карточки в списке городов используют тот же кэш и отдельных запросов не делают.

## Open-Meteo Geocoding

### Запрос

```
GET https://geocoding-api.open-meteo.com/v1/search?name=Сочи&count=10&language=ru&format=json
```

- `name` кодируется через `encodeURIComponent`. Одна буква не ищет ничего, две ищут точное совпадение, с трёх работает поиск по началу слова. Поэтому поиск запускается от **2 символов** после `trim()`, с задержкой ввода **300 мс**.
- `language=ru` даёт русские названия городов, регионов и стран там, где они есть.
- Аэропорты ищутся по коду IATA: `SVO` → «Шереметьево», `feature_code: "AIRP"`. По русскому названию аэропорта приходит одноимённый посёлок (`PPL`). Это ограничение источника, плейсхолдер «Найти город или аэропорт» остаётся (риск R-11 в [docs/07](../07-risks-and-open-questions.md)).
- Обратного геокодирования (координаты → название) в Open-Meteo нет. Для текущего местоположения название даёт `reverseGeocodeAsync` ОС.

### Ответ

Пример: [samples/geocoding-soch.json](samples/geocoding-soch.json).

```jsonc
{
  "results": [
    {
      "id": 491422,                     // ID GeoNames, стабильный → City.id = "geo:491422"
      "name": "Сочи",
      "latitude": 43.59699, "longitude": 39.72477,
      "elevation": 28.0,
      "feature_code": "PPLA2",
      "country_code": "RU",
      "country": "Россия",
      "admin1": "Краснодарский край",   // регион
      "admin2": "Sochi City",           // бывает не переведён: не показывай
      "timezone": "Europe/Moscow",
      "population": 327608
    }
  ],
  "generationtime_ms": 0.6
}
```

- Ничего не найдено: поля `results` **нет вовсе** (`{"generationtime_ms": 0.07}`). Схема: `results: z.array(...).optional()`, отсутствие → пустой список.
- Пустые поля в ответ не попадают: `admin1`, `country`, `population` могут отсутствовать.
- Подпись результата: `[admin1, country].filter(Boolean).join(', ')` (Q-08). Для `AIRP` впереди добавь «Аэропорт · ».

```ts
export const geocodingSchema = z.object({
  results: z.array(z.object({
    id: z.number(),
    name: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    feature_code: z.string().optional(),
    country_code: z.string().optional(),
    country: z.string().optional(),
    admin1: z.string().optional(),
    timezone: z.string().optional(),
  })).optional(),
});
```

## Местоположение (`expo-location`)

Документация SDK 58: https://docs.expo.dev/versions/v58.0.0/sdk/location.md. Используй стабильный API `expo-location`, не бету `expo-location/next`.

```ts
import * as Location from 'expo-location';

const { status } = await Location.requestForegroundPermissionsAsync(); // только по нажатию кнопки
if (status !== 'granted') { setLocationPermission('denied'); return; }

const pos =
  (await Location.getLastKnownPositionAsync({ maxAge: 30 * 60 * 1000 })) ??
  (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low })); // ~1 км

const lat = Math.round(pos.coords.latitude * 100) / 100;
const lon = Math.round(pos.coords.longitude * 100) / 100;

let name = 'Моё местоположение';
try {
  const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
  name = place?.city ?? place?.subregion ?? place?.region ?? name;
} catch { /* геокодер ОС недоступен или упёрся в лимит: остаётся запасное название */ }
```

- `Accuracy.Low` (около 1 км) хватает для погоды и бережёт батарею (NFR-14). На iOS пользователь может разрешить только приблизительное местоположение, это тоже подходит.
- Фоновое местоположение не нужно: `isIosBackgroundLocationEnabled` и `isAndroidBackgroundLocationEnabled` не включай.
- `reverseGeocodeAsync` ограничен по частоте: вызывай его только когда координаты изменились больше чем на 0.05° с прошлого раза.
- Текст запроса разрешения для iOS задаётся в плагине `expo-location` в `app.json` ([05](05-implementation-plan.md#t-04-appjson)). Там же выключены ключи, которые плагин иначе добавляет сам с английским текстом: `locationAlwaysAndWhenInUsePermission`, `locationAlwaysPermission`, `locationFullAccuracyPermission`, `motionUsagePermission` (`false`). `isIosReducedAccuracyByDefault: true`: в системном запросе по умолчанию предлагается приблизительное местоположение.
- На Android `blockedPermissions` не используется (проверено 2026-10-30). С одним `ACCESS_COARSE_LOCATION` приложению доступны только сетевые источники; на эмуляторе их нет (`adb emu geo fix` подставляет координаты только в GPS), и определение не завершалось. Манифест просит оба разрешения, а диалог Android 12+ даёт выбрать «Приблизительное»: точность всё равно `Accuracy.Low` и округление до 0.01°. Сначала `Accuracy.Low` (8 секунд), без результата один раз `Accuracy.High` (GPS, 20 секунд), потом ошибка «Не удалось определить местоположение». Для проверки на эмуляторе в диалоге выбирай «Точное».
- Код: `src/features/cities/useCurrentLocation.ts`. `requestAndLocate()` — по кнопке, `refreshLocation()` — при запуске и возврате в приложение: сверяет доступ с ОС, ничего не спрашивая. Доступ дали в настройках — местоположение появляется; забрали — страница местоположения убирается. После «Разрешить один раз» iOS при следующем запуске отвечает `undetermined`: страница убирается, кнопка «Определить местоположение» возвращается.
- Если координаты сменились, пока шёл запрос погоды по старым, `weatherStore.refresh` повторяет запрос после него: иначе новое место получило бы погоду старого.

## Карта осадков (этап 8)

Дизайна экрана нет (Q-11), в первую версию не входит. Решение на будущее, чтобы не искать заново:

- **Слой осадков:** RainViewer. Метаданные `GET https://api.rainviewer.com/public/weather-maps.json`, в ответе `host` и `radar.past[]` с `time` и `path`. Тайл: `{host}{path}/256/{z}/{x}/{y}/2/1_0.png` (размер 256, цветовая схема 2, сглаживание 1, снег 0).
- **Ограничения с 1 января 2026:** только прошлые 2 часа с шагом 10 минут, прогноза (nowcast) нет. Максимальный zoom 7: выше приходит заглушка с кодом 200. Осталась одна цветовая схема (Universal Blue). Ключ не нужен, использование личное и учебное. Источник: [RainViewer API Transition](https://www.rainviewer.com/api/transition-faq.html).
- **Как показать:** `react-native-webview` со страницей на Leaflet (подключение с `unpkg.com` с точной версией), подложка — тёмные тайлы CARTO или OpenStreetMap с подписью источника. Перед реализацией прочитай условия использования выбранной подложки.
- **Почему не `expo-maps`:** в SDK 58 у него нет тайловых оверлеев, а на Android нужен ключ Google Maps.

## Штормовые предупреждения (отложено)

Владелец решил не делать предупреждения в первой версии. Что выяснилось, чтобы потом не искать заново:

- Open-Meteo предупреждений не даёт.
- Бесплатного источника без ключа и с покрытием России не нашлось.
- Ближайший вариант: OpenWeather One Call 3.0, 1 000 запросов в сутки бесплатно, поле `alerts[]` (`sender_name`, `event`, `start`, `end`, `description`, `tags`) от национальных служб. Тексты по умолчанию на английском, ключ нельзя класть в приложение, значит нужен свой прокси.
- Чтобы подключить позже без переделки, в доменной модели уже есть место ([03](03-domain-and-rules.md#предупреждения-задел)).
