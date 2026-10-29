# 03. Доменная модель и правила

Типы, преобразование ответа Open-Meteo, таблица кодов погоды, форматы и правила, по которым собираются экраны. Всё здесь реализуется чистыми функциями и покрывается тестами ([06](06-testing.md)).

Где правило придумано при проектировании, а не взято из дизайна или требований, стоит пометка **Предложение** и ссылка на открытый вопрос из [docs/07](../07-risks-and-open-questions.md). Реализуй как написано: если владелец решит иначе, поменяется одна функция.

## Типы

### Город (`src/features/cities/types.ts`)

```ts
export interface City {
  id: string;               // "geo:<id GeoNames>" для найденных, "current-location" для местоположения
  name: string;             // «Москва»
  region?: string;          // admin1 из геокодера: «Краснодарский край»
  country?: string;         // «Россия»
  latitude: number;         // уже округлено до 0.01 для местоположения
  longitude: number;
  isCurrentLocation: boolean;
}
```

Порядок задаётся положением в массиве `saved`, отдельного поля нет. Дубли (BR-16) определяются по `id`.

### Прогноз (`src/features/weather/types.ts`)

```ts
export type Condition = 'clear' | 'partly' | 'clouds' | 'rain' | 'storm'; // небо, 5 вариантов дизайна
export type IconKind = 'sun' | 'moon' | 'partly' | 'cloud' | 'rain' | 'storm' | 'snow';
export type ThemeName = 'day' | 'night';

export interface Forecast {
  fetchedAt: number;          // мс, Date.now()
  utcOffsetSeconds: number;
  timezone: string;
  current: CurrentWeather;
  hourly: HourPoint[];        // все пришедшие часы: 3 прошлых, текущий, 24 следующих
  daily: DayPoint[];          // 10 дней, [0] — сегодня
  alerts: WeatherAlert[];     // пока всегда [] (см. «Предупреждения»)
}

export interface CurrentWeather {
  time: number;               // Unix-секунды
  temp: number;               // °C, не округлено
  feelsLike: number | null;
  humidity: number | null;    // %
  isDay: boolean;
  precipitation: number | null; // мм
  code: number;               // WMO
  windSpeed: number | null;   // м/с
  windDirection: number | null; // градусы, откуда дует
  windGusts: number | null;   // м/с
}

export interface HourPoint {
  time: number;               // начало часа, Unix-секунды
  temp: number | null;
  pop: number | null;         // вероятность осадков, %
  precipitation: number | null; // мм за час
  code: number | null;
  isDay: boolean;
  dewPoint: number | null;
}

export interface DayPoint {
  date: number;               // местная полночь, Unix-секунды
  code: number | null;
  max: number | null;
  min: number | null;
  pop: number | null;
  precipitationSum: number | null;
  sunrise: number | null;     // Unix-секунды
  sunset: number | null;
}

export interface WeatherAlert { // задел, в первой версии не заполняется
  title: string; summary: string; details?: string; endsAt?: number;
}
```

### View-модели (что получают компоненты)

Совпадают по форме с типами дизайн-системы (`index.d.ts` артефакта), чтобы перенос компонентов был прямым.

```ts
export interface HeroVM { place: string; temp: number; condition: string; high: number; low: number }
export interface HourVM { time?: string; icon: IconKind; temp: number; pop?: number; now?: boolean; a11y: string }
export interface DayVM  { day: string; icon: IconKind; low: number; high: number; pop?: number; now?: number; a11y: string }
export interface TileVM { key: TileKey; label: string; value: string; unit?: string; note: string }
export type TileKey = 'feelsLike' | 'wind' | 'humidity' | 'sunrise' | 'sunset' | 'precipitation';

export interface MainVM {
  theme: ThemeName;
  sky: Condition;
  hero: HeroVM;
  summary: string;
  hours: HourVM[];      // 25 штук
  days: DayVM[];        // 10 штук
  dayMin: number;       // общий диапазон шкалы (BR-06)
  dayMax: number;
  tiles: TileVM[];      // 4 штуки
  updatedAt: string;    // «Обновлено в 14:05», для пометки устаревших данных
}

export interface CityCardVM {
  id: string; theme: ThemeName; sky: Condition;
  name: string; sub: string; temp: string; label: string; range: string; a11y: string;
}
```

Все температуры в view-моделях уже округлены (`roundTemp`). Компоненты только форматируют их через `formatTemp`.

## Преобразование ответа (`mapForecast`)

`mapForecast(raw: RawForecast, fetchedAt: number): Forecast`:

1. `current` переносится поле в поле, `is_day === 1` → `isDay: true`.
2. `hourly`: собрать массив объектов по индексу `i` из параллельных массивов, `is_day[i] === 1`.
3. `daily`: то же по `daily.time`, `date = time[i]`.
4. `alerts: []`.
5. Если длины параллельных массивов разные, взять минимальную. Не бросать исключение.

## Время

На устройстве нельзя полагаться на часовой пояс телефона: город может быть в другом поясе. Поэтому всё местное время считается так:

```ts
// src/lib/time.ts
/** Дата, у которой UTC-поля равны местному времени города. Читать только getUTC*. */
export function cityClock(unixSeconds: number, utcOffsetSeconds: number): Date {
  return new Date((unixSeconds + utcOffsetSeconds) * 1000);
}
export const nowSeconds = (): number => Math.floor(Date.now() / 1000);
```

- Час в ленте: `cityClock(t, off).getUTCHours()`.
- День недели: `cityClock(day.date, off).getUTCDay()`.
- Местное время в карточке города: `cityClock(nowSeconds(), off)`.
- `Intl` с `timeZone` не используй: не нужно, и меньше зависимость от движка.
- Сдвиг берётся из последнего прогноза. Переход на летнее время учтётся при следующем обновлении (не реже раза в 30 минут).

Все функции, которым нужно «сейчас», принимают `now` (Unix-секунды) параметром. Так их можно тестировать на фикстурах: в тестах `now = raw.current.time`.

## Форматы (`src/lib/format.ts`)

| Функция | Правило | Примеры |
| --- | --- | --- |
| `roundTemp(x)` | `Math.round(x)`, и `-0` превращается в `0` (BR-03, предложение: математическое округление) | `7.5 → 8`, `-0.4 → 0`, `-2.5 → -2` |
| `formatTemp(n)` | типографский минус `−` (U+2212), градус без пробела | `8 → "8°"`, `-3 → "−3°"`, `0 → "0°"` |
| `formatTempNumber(n)` | то же без градуса, для `TempHero` (градус рисуется отдельно) | `-3 → "−3"` |
| `formatClock(d)` | `H:mm`, 24 часа, часы без ведущего нуля (BR-04) | `8:52`, `14:05`, `0:30` |
| `formatHour(d)` | две цифры | `"00"`, `"07"`, `"15"` |
| `formatWeekday(d, index)` | `index === 0` → «Сегодня», иначе `['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][d.getUTCDay()]` (BR-13) | «Сегодня», «Вт» |
| `formatPercent(n)` | целое и `%` | `60%` |
| `formatMm(x)` | меньше 10 → один знак с запятой, если число не целое; иначе целое | `0.4 → "0,4"`, `2.6 → "2,6"`, `9 → "9"`, `0 → "0"`, `18.3 → "18"` |
| `formatWind(x)` | `Math.round` | `6.4 → "6"` |
| `formatRangeHero(hi, lo)` | как в шапке макета | `"Макс.: 9°, мин.: 4°"` |
| `formatRangeCard(hi, lo)` | как в карточке макета | `"Макс. 9° · мин. 4°"` |

Два формата максимума и минимума взяты из макетов как есть: единый формат не выбран (Q-13). Когда владелец решит, поменяй одну функцию.

## Коды погоды (`conditions.ts`)

Источник кодов: таблица WMO в [документации Open-Meteo](https://open-meteo.com/en/docs) (раздел «WMO Weather interpretation codes»).

| Код | Текст (`labelFor`) | Небо (`skyFor`) | Иконка днём | Иконка ночью | Осадки (`isPrecipitation`) | Род осадков |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | Ясно | clear | sun | moon | нет | |
| 1 | Малооблачно | clear | sun | moon | нет | |
| 2 | Переменная облачность | partly | partly | cloud | нет | |
| 3 | Облачно | clouds | cloud | cloud | нет | |
| 45 | Туман | clouds | cloud | cloud | нет | |
| 48 | Туман с изморозью | clouds | cloud | cloud | нет | |
| 51 | Слабая морось | rain | rain | rain | да | дождь |
| 53 | Морось | rain | rain | rain | да | дождь |
| 55 | Сильная морось | rain | rain | rain | да | дождь |
| 56 | Слабая ледяная морось | rain | rain | rain | да | дождь |
| 57 | Ледяная морось | rain | rain | rain | да | дождь |
| 61 | Небольшой дождь | rain | rain | rain | да | дождь |
| 63 | Дождь | rain | rain | rain | да | дождь |
| 65 | Сильный дождь | rain | rain | rain | да | дождь |
| 66 | Небольшой ледяной дождь | rain | rain | rain | да | дождь |
| 67 | Ледяной дождь | rain | rain | rain | да | дождь |
| 71 | Небольшой снег | clouds | snow | snow | да | снег |
| 73 | Снег | clouds | snow | snow | да | снег |
| 75 | Сильный снег | clouds | snow | snow | да | снег |
| 77 | Снежная крупа | clouds | snow | snow | да | снег |
| 80 | Небольшой ливень | rain | rain | rain | да | дождь |
| 81 | Ливень | rain | rain | rain | да | дождь |
| 82 | Сильный ливень | rain | rain | rain | да | дождь |
| 85 | Небольшой снегопад | clouds | snow | snow | да | снег |
| 86 | Сильный снегопад | clouds | snow | snow | да | снег |
| 95 | Гроза | storm | storm | storm | да | гроза |
| 96 | Гроза с градом | storm | storm | storm | да | гроза |
| 99 | Сильная гроза с градом | storm | storm | storm | да | гроза |
| другой или `null` | «Нет данных» | clouds | cloud | cloud | нет | |

Пояснения:

- Снег рисуется небом `clouds`, потому что неба для снега в дизайне нет (Q-12). Иконка снега есть.
- Код 2 ночью даёт облако: глиф `partly` нарисован с солнцем, луны с облаком в наборе нет. **Предложение.**
- Дневные иконки в прогнозе на 10 дней: `iconFor(day.code, true)`.

```ts
export type PrecipKind = 'rain' | 'snow' | 'storm';
export function precipKind(code: number | null): PrecipKind | null; // по колонке «Род осадков»
```

## Тема и небо

- **Тема:** `forecast.current.isDay ? 'day' : 'night'` (BR-01). Open-Meteo считает `is_day` по положению солнца в точке, поэтому полярный день и ночь получаются сами (закрывает Q-06). Системная тема телефона не участвует.
- **Небо:** `skyFor(forecast.current.code)`.
- Для карточки в списке городов правило то же, по прогнозу этого города.
- Пока прогноза ещё нет (город только добавлен), тема `night`, небо `clouds`.

## Шапка (`HeroVM`)

- `place` = `city.name`.
- `temp` = `roundTemp(current.temp)`.
- `condition` = `labelFor(current.code)`.
- `high` = `max(roundTemp(daily[0].max), temp)`, `low` = `min(roundTemp(daily[0].min), temp)`. Текущая температура не должна выходить за диапазон дня, иначе точка «сейчас» вылезет за полоску.

## Лента часов

1. `i0` = последний индекс, где `hourly[i].time <= current.time`. Если такого нет, `i0 = 0`.
2. Взять `hourly[i0 … i0 + 24]` (25 точек), пропуская точки без `temp`.
3. Первая точка: `{ now: true, icon: iconFor(current.code, current.isDay), temp: roundTemp(current.temp), pop }`, где `pop` из `hourly[i0]`. Подпись «Сейчас» рисует компонент.
4. Остальные: `time = formatHour(cityClock(h.time, off))`, `icon = iconFor(h.code, h.isDay)`, `temp = roundTemp(h.temp)`.
5. `pop` передаётся только если он больше 0 (BR-05): `h.pop && h.pop > 0 ? Math.round(h.pop) : undefined`.
6. `a11y`: «Сейчас, 8°, дождь, вероятность осадков 60%» или «15 часов, 8°, дождь». Слово состояния — `labelFor` с маленькой буквы.

## Прогноз на 10 дней

1. Для каждого `daily[i]` с непустыми `min` и `max`: `day = formatWeekday(cityClock(d.date, off), i)`, `icon = iconFor(d.code, true)`, `low = roundTemp(d.min)`, `high = roundTemp(d.max)`.
2. У сегодняшнего дня `low` и `high` берутся из `HeroVM`, а `now = hero.temp` (точка на шкале, BR-06).
3. `pop` только если больше 0.
4. `dayMin = min(low)`, `dayMax = max(high)` по всем дням. Шкала общая для всех строк.
5. `a11y`: «Сегодня, от 4° до 9°, дождь, вероятность осадков 70%».

## Плитки (`buildTiles`)

**Предложение** (Q-07). В макетах в каждом экране по две плитки, набор разный. Правило: всегда 4 плитки (2 ряда), набор зависит от условий.

| Условие (проверяется сверху вниз) | Плитки по порядку |
| --- | --- |
| небо `rain` или `storm`, либо осадки за прошлые 3 часа ≥ 0.1 мм | Осадки, Ветер, Ощущается как, Влажность |
| тема `night` | Восход, Влажность, Ощущается как, Ветер |
| иначе | Ощущается как, Ветер, Влажность, Закат |

Первые две плитки каждого набора совпадают с макетами: гроза (Осадки, Ветер), ночь (Восход, Влажность), день (Ощущается как, Ветер). Если для плитки нет данных (`null`), она пропускается и в конец добавляется следующая из списка `feelsLike, wind, humidity, sunset, precipitation`, которой ещё нет. Если плиток набралось нечётное число, последняя занимает свою половину ряда, вторая половина пустая.

Тексты пояснений (BR-10: факт, без советов). `t` — текущая температура, все числа уже округлены.

**Ощущается как** — значение `formatTemp(feelsLike)`. Пояснение по `d = feelsLike − t`:

| Условие | Пояснение |
| --- | --- |
| `d ≤ −2` и ветер ≥ 3 м/с | Из-за ветра кажется холоднее. |
| `d ≤ −2` | Кажется холоднее, чем на самом деле. |
| `d ≥ 2` и влажность ≥ 60% | Из-за влажности кажется теплее. |
| `d ≥ 2` | Кажется теплее, чем на самом деле. |
| иначе | Примерно как на самом деле. |

**Ветер** — значение `formatWind(windSpeed)`, единица `м/с`. Пояснение: `«{Направление}, порывы до {gusts} м/с.»`. Если скорость меньше 0.5 м/с: значение `0`, пояснение «Штиль.». Если порывов нет: только `«{Направление}.»`.
Направление по градусам «откуда дует»: `['Северный','Северо-восточный','Восточный','Юго-восточный','Южный','Юго-западный','Западный','Северо-западный'][Math.floor(((deg % 360) + 22.5) / 45) % 8]`. Пример: 315 → «Северо-западный».

**Влажность** — значение `formatPercent(humidity)`, без отдельной единицы. Пояснение `«Точка росы {formatTemp(dewPoint)}.»`, точка росы из `hourly[i0]`. Нет точки росы — пояснение пустое.

**Восход** (ночью) — значение: ближайший будущий восход (`daily[0].sunrise`, если он ещё впереди, иначе `daily[1].sunrise`), `formatClock`. Пояснение: `«Закат в {ближайший закат после этого восхода}.»`. Пример из макета: «8:52», «Закат в 16:29.».

**Закат** (днём) — значение: `daily[0].sunset`, если он впереди, иначе `daily[1].sunset`. Пояснение: `«Восход в {следующий восход после этого заката}.»`.
Если восхода или заката нет (полярная ночь или день), значение `—`, пояснение «Полярная ночь.» при `isDay === false` или «Полярный день.».

**Осадки** — значение: сумма `precipitation` за 3 часа до `i0` (индексы `i0−3 … i0−1`), `formatMm`, единица `мм`. Пояснение: сумма за 12 часов после `i0` (`next12`):
- `next12 ≥ 0.1` → `«За 3 часа. Ещё {formatMm(next12)} мм за 12 часов.»`
- иначе → «За 3 часа. Дальше без осадков.»

## Сводка над лентой (`buildSummary`)

**Предложение** (BR-15, Q-14). Одна-две фразы, обе из шаблонов. Работает по тем же 25 точкам, что и лента. Род осадков (`precipKind`): дождь, снег или гроза.

Первая фраза:

| Сейчас осадки? | Что дальше в 24 часах | Фраза |
| --- | --- | --- |
| да, род R | первый час `k` без осадков | «{R} закончится около {HH}:00.» |
| да | до конца ленты не кончаются | «{R} в ближайшие сутки не прекратится.» |
| нет | первый час `k` с осадками, род R | «Около {HH}:00 начнётся {r}.» |
| нет | осадков нет | «Без осадков в ближайшие сутки.» |

`R` с большой буквы («Дождь», «Снег», «Гроза»), `r` с маленькой. `HH` — `formatHour` часа `k`. Час с осадками: `isPrecipitation(code)` или `precipitation ≥ 0.1`.

Вторая фраза — температура ночью. Ночные часы — точки ленты с местным часом 0–6:
- если сейчас день и ночные часы есть → «Ночью до {formatTemp(min)}.»
- если сейчас ночь → «К утру до {formatTemp(min)}.», минимум по оставшимся часам до 7:00
- если ночных часов нет → второй фразы нет.

Примеры: «Дождь закончится около 17:00. Ночью до 4°.», «Без осадков в ближайшие сутки. К утру до −1°.».

## Карточка города (`CityCardVM`)

- `sub`: у местоположения `«Моё местоположение · {formatClock(местное время)}»`, у остальных только время (FR-20). Время считается от момента открытия экрана городов и сдвига города, раз в минуту не обновляется.
- `temp` = `formatTemp(hero.temp)`, `label` = `hero.condition`, `range` = `formatRangeCard(hero.high, hero.low)`.
- `a11y`: `«{name}, {temp}, {label с маленькой буквы}»`, как в макете.
- Прогноза нет: `temp` = `—`, `label` = «Загрузка…» или «Нет данных», `range` пустой.

## Состояния экрана

Дизайна состояний нет (FR-18, Q-04). Все они рисуются одним компонентом `StatePanel` ([04](04-ui-spec.md#statepanel)): панель с заголовком, одной фразой и до двух кнопок.

| Состояние | Где | Заголовок | Текст | Кнопки |
| --- | --- | --- | --- | --- |
| Нет городов, местоположение не спрашивали | главный | Погода рядом | Можно определить местоположение или выбрать город. | «Определить местоположение», «Выбрать город» |
| Нет городов, местоположение запрещено | главный | Нет городов | Добавьте город в списке. | «Выбрать город» |
| Первая загрузка города | главный, страница города | — | индикатор `ActivityIndicator` цвета `text` по центру, небо `clouds` | — |
| Ошибка, данных нет | страница города | Не удалось загрузить погоду | `offline`: «Нет подключения к интернету.» Иначе: «Сервис погоды не ответил.» | «Повторить» |
| Ошибка, есть старые данные | страница города | — | строка `micro` под шапкой: «Нет связи. Данные на {formatClock(fetchedAt)}». Если данные не сегодняшние: «Данные от {д.мм}» | — |
| Ничего не найдено | экран городов | — | строка body: «Ничего не нашлось. Попробуйте другое название или код аэропорта.» | — |
| Ошибка поиска | экран городов | — | «Поиск недоступен. Проверьте подключение.» | — |
| Город уже в списке | экран городов, результат поиска | — | у результата подпись «Уже в списке», нажатие открывает этот город | — |

## Пустые значения

- `null` в часе или дне: точка пропускается.
- `null` у текущих показателей: плитка пропускается ([плитки](#плитки-buildtiles)).
- Нет `daily[0]`: `high` и `low` = `temp`.
- Неизвестный код: текст «Нет данных», иконка облака.

## Предупреждения (задел)

В первой версии не делаются (решение владельца). Чтобы подключить потом без переделки:

```ts
// src/features/weather/alerts.ts
export interface AlertsProvider {
  fetchAlerts(city: City): Promise<WeatherAlert[]>;
}
export const noAlerts: AlertsProvider = { fetchAlerts: async () => [] };
```

`Forecast.alerts` всегда `[]`, `MainVM` поле для предупреждения не содержит, панель предупреждения не рисуется.

## Тексты интерфейса (`src/i18n/ru.ts`)

Все строки, которые видит пользователь, лежат в одном объекте (NFR-17). Шаблоны с параметрами — функции.

```ts
export const ru = {
  now: 'Сейчас',
  today: 'Сегодня',
  weekdays: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
  panels: { hourly: 'Почасовой прогноз', daily: 'Прогноз на 10 дней' },
  tiles: { feelsLike: 'Ощущается как', wind: 'Ветер', humidity: 'Влажность', sunrise: 'Восход', sunset: 'Закат', precipitation: 'Осадки' },
  units: { ms: 'м/с', mm: 'мм' },
  a11y: {
    back: 'Назад', editList: 'Изменить список', map: 'Карта осадков', cityList: 'Список городов',
    search: 'Поиск города', pageDots: (name: string, i: number, n: number) => `${name}, город ${i} из ${n}`,
  },
  cities: { title: 'Города', searchPlaceholder: 'Найти город или аэропорт', myLocation: 'Моё местоположение', alreadyAdded: 'Уже в списке', airport: 'Аэропорт' },
  attribution: 'Данные: Open-Meteo.com',
  // … состояния, пояснения плиток и шаблоны сводки из таблиц выше
} as const;
```

Заголовки панелей в коде пишутся обычным регистром, прописными их делает стиль `caption` (`textTransform: 'uppercase'`). Так экранный диктор читает их нормально.
