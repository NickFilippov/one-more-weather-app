# 06. Тестирование

Автоматически тестируется вся логика без UI: форматтеры, коды погоды, преобразование ответа, плитки, сводка, сторы, HTTP-помощник, поиск. Экраны проверяются руками по чек-листу ниже и сверкой со скриншотами макетов.

## Настройка

Ставится в задаче [T-06](05-implementation-plan.md#t-06-тесты): `jest-expo`, `jest`, `@types/jest`, `@testing-library/react-native`, пресет `jest-expo` в `package.json`. Запуск: `npx jest` (или `npm test`).

- Тесты лежат в `__tests__/` рядом с кодом: `src/lib/__tests__/format.test.ts`, `src/features/weather/__tests__/tiles.test.ts`. Внутри `src/app/` тестов нет: каждый файл там становится маршрутом.
- Если `jest` падает на синтаксисе внутри `node_modules` (непереведённый ESM), добавь `transformIgnorePatterns` из [документации Expo](https://docs.expo.dev/develop/unit-testing.md) и допиши в список нужный пакет.
- Конфигурация Jest в `package.json`: `"preset": "jest-expo"` и `"resolver": "react-native-reanimated/jest/resolver"` (без него Reanimated не загружается). В `tsconfig.json` задано `"types": ["jest"]`: в TypeScript 6 пакеты `@types/*` сами не подключаются.
- `@testing-library/react-native` 14: `render` асинхронный, пиши `await render(...)`. Блоки появляются анимацией с нулевой прозрачностью, поэтому в тестах компонентов включено `configure({ defaultIncludeHiddenElements: true })`.
- Нативные модули (`@shopify/react-native-skia`, `expo-blur`, `expo-sqlite/kv-store`) в тестах заменяются заглушками, пример: `src/features/weather/__tests__/CityPage.test.tsx`.
- Время в тестах фиксировано: функции принимают `now`, `Date.now` подменяй через `jest.useFakeTimers().setSystemTime(...)` только в тестах сторов.

## Фикстуры

Живые ответы Open-Meteo от 2026-10-27 лежат в [samples/](samples/) и скопированы в `src/features/weather/__fixtures__/` (там же `helpers.ts` с `rawOf` и `forecastOf`; он вне `__tests__/`, иначе Jest примет его за тест):

| Файл | Что внутри | Для чего |
| --- | --- | --- |
| `forecast-moscow.json` | Москва, день, облачно (код 3) | дневной набор плиток, тема `day` |
| `forecast-sochi.json` | Сочи, день, переменная облачность, в прогнозе дожди и гроза | 10 дней с осадками, `pop` больше 0 |
| `forecast-tromso-polar.json` | Тромсё, 69.6° с. ш., другой часовой пояс (`Europe/Oslo`, +1 ч) | местное время не по Москве |
| `geocoding-soch.json` | поиск «Соч», 5 результатов из 4 стран | подписи «регион, страна» |

Для остальных случаев меняй копию фикстуры прямо в тесте, а не заводи новые файлы:

```ts
import sochi from '../__fixtures__/forecast-sochi.json';

function variant(patch: (r: RawForecast) => void): RawForecast {
  const r = structuredClone(forecastSchema.parse(sochi));
  patch(r);
  return r;
}
const rainyNow = variant((r) => { r.current.weather_code = 61; r.current.precipitation = 0.8; });
const night = variant((r) => { r.current.is_day = 0; });
const polar = variant((r) => { r.daily.sunrise = r.daily.sunrise.map(() => null); r.daily.sunset = r.daily.sunset.map(() => null); r.current.is_day = 0; });
```

Время «сейчас» в тестах на фикстурах: `const now = raw.current.time`.

## Что покрыть

| Модуль | Обязательные случаи |
| --- | --- |
| `lib/format` | все примеры из таблицы [03, Форматы](03-domain-and-rules.md#форматы-srclibformatts); `−` это U+2212, а не дефис |
| `lib/time` | `cityClock` для +3 ч и +1 ч: час и день недели совпадают с ожидаемыми; полночь не съезжает на соседний день |
| `lib/http` | 200; 400 с `reason`; 429 без повтора; 500 с одним повтором; исключение `fetch` → `offline`; таймаут → `offline` |
| `weather/api` | все фикстуры проходят схему; без `current.temperature_2m` → `invalid`; URL совпадает с [02](02-data-sources.md#запрос) |
| `weather/model/conditions` | 28 кодов из таблицы, неизвестный код, `null`; иконка ночью для 0, 1, 2 |
| `weather/model/mapForecast` | длины массивов; `is_day` → `boolean`; разные длины параллельных массивов не роняют |
| `weather/model/viewModels` | 25 часов, первый `now`; 10 дней, «Сегодня»; `high ≥ temp ≥ low`; `pop` только больше 0; `dayMin`, `dayMax`; карточка без прогноза |
| `weather/model/tiles` | три набора; каждое пояснение «Ощущается как»; «Штиль.»; полярная ночь; пропуск плитки с `null` |
| `weather/model/summary` | 4 варианта первой фразы, 3 варианта второй |
| `weather/weatherStore` | свежие не запрашиваются; `force`; один запрос на два параллельных `refresh`; ошибка не стирает данные |
| `cities/citiesStore` | добавление, дубль по `id`, дубль с местоположением, `selectPages` |
| `cities/geocodingApi`, `useCitySearch` | ответ без `results`; подпись `AIRP`; меньше 2 символов без запроса; устаревший ответ игнорируется |

Моки модулей с нативным кодом в тестах сторов:

```ts
jest.mock('expo-sqlite/kv-store', () => {
  const mem = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: async (k: string) => mem.get(k) ?? null,
      setItem: async (k: string, v: string) => { mem.set(k, v); },
      removeItem: async (k: string) => { mem.delete(k); },
    },
  };
});
```

## Ручной чек-лист перед первой версией

Проверяется на iOS 26 (Liquid Glass), iOS 18 или ниже (матовое стекло) и Android 12+; по возможности ещё на бюджетном Android.

| № | Проверка | Требование |
| --- | --- | --- |
| 1 | Экраны совпадают с [docs/screenshots/](../screenshots/): отступы, радиусы, шрифты, цвета | NFR-01 |
| 2 | На iOS 26 стекло системное, на остальных матовое с тёмной тонировкой; текст читается на всех небесах | NFR-03, NFR-10 |
| 3 | Холодный старт с сохранёнными данными до главного экрана не дольше 2 с | NFR-04 |
| 4 | Прокрутка в дождь и грозу без рывков, свайп между городами плавный | NFR-05 |
| 5 | Свёрнутое приложение не грузит процессор (Xcode Instruments / Android Profiler) | NFR-06 |
| 6 | Данные обновляются при запуске, при возврате через 30+ минут и по pull-to-refresh | FR-22, NFR-07 |
| 7 | В авиарежиме видны последние данные с временем | NFR-08 |
| 8 | Все состояния из [03](03-domain-and-rules.md#состояния-экрана) воспроизводятся и не роняют приложение | FR-18, NFR-09 |
| 9 | «Уменьшение движения»: дождь, облака, отсчёт, иконки стоят; появления только проявлением | NFR-11 |
| 10 | VoiceOver и TalkBack называют все кнопки и читают погоду словами | NFR-12 |
| 11 | Максимальный размер шрифта: смысл не теряется | NFR-13 |
| 12 | Геолокация спрашивается только по нажатию; в запросах координаты с 2 знаками | NFR-14 |
| 13 | В хранилище только города и прогнозы (посмотреть ключи `cities-v1`, `weather-v1`) | NFR-15 |
| 14 | Тема каждой карточки соответствует дню или ночи в её городе | BR-01 |
| 15 | Минус типографский, градус без пробела во всех местах | BR-03 |
