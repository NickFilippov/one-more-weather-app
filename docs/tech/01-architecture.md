# 01. Архитектура

Как устроено приложение: слои, модули, поток данных, навигация, структура папок. Решения здесь окончательные для первой версии: если задача в [05](05-implementation-plan.md) требует другого, сначала поменяй этот документ.

## Коротко

- Expo SDK 58, React Native 0.88, TypeScript strict, Expo Router. Только телефоны, только портрет.
- Погода и поиск городов: Open-Meteo, без ключа и без своего сервера ([02](02-data-sources.md)).
- Состояние: два стора `zustand`. Список городов и последние полученные данные сохраняются на устройстве через `expo-sqlite/kv-store`.
- Всё, что считает и форматирует, сделано чистыми функциями без React (`src/lib`, `src/features/*/model`). Их легко тестировать.
- Компоненты в `src/components` ничего не знают о сторах и API: получают готовые данные пропсами. Экраны в `src/app` связывают сторы с компонентами.

## Слои и зависимости

```mermaid
flowchart TB
  subgraph APP["src/app — экраны (Expo Router)"]
    Layout["_layout.tsx<br/>шрифты, провайдеры, Stack"]
    Main["index.tsx<br/>главный экран: pager городов"]
    Cities["cities.tsx<br/>список, поиск, добавление"]
  end

  subgraph COMP["src/components — UI без данных"]
    Atmos["Atmosphere<br/>небо, облака, дождь"]
    Glass["GlassPanel, GlassButton"]
    Blocks["TempHero, HourlyForecast,<br/>DailyForecast, Tiles, PageDots,<br/>Footer, CityCard, SearchField,<br/>StatePanel, WeatherIcon"]
  end

  subgraph FEAT["src/features — логика"]
    WStore["weather/weatherStore<br/>кэш прогнозов, обновление"]
    WModel["weather/model<br/>маппинг ответа, коды WMO,<br/>сводка, плитки, view-модели"]
    WApi["weather/api<br/>клиент Open-Meteo + zod"]
    CStore["cities/citiesStore<br/>список, порядок, местоположение"]
    CSearch["cities/useCitySearch<br/>+ geocodingApi"]
    CLoc["cities/useCurrentLocation"]
  end

  subgraph BASE["основа"]
    Lib["src/lib<br/>format, time, storage, http,<br/>useReduceMotion, useAppActive"]
    Theme["src/theme<br/>tokens, typography, motion,<br/>ThemeProvider, glassMode"]
    I18n["src/i18n/ru.ts"]
  end

  subgraph EXT["внешнее"]
    OM[("Open-Meteo Forecast")]
    GEO[("Open-Meteo Geocoding")]
    OS[("Геолокация ОС<br/>expo-location")]
    KV[("expo-sqlite/kv-store")]
  end

  Layout --> Main & Cities
  Main --> COMP
  Cities --> COMP
  Main --> WStore & CStore & WModel
  Cities --> WStore & CStore & CSearch & CLoc & WModel
  COMP --> Theme & I18n
  WStore --> WApi --> OM
  WStore --> KV
  CStore --> KV
  CSearch --> GEO
  CLoc --> OS
  WApi --> Lib
  WModel --> Lib & I18n
  CSearch --> Lib
```

### Правила зависимостей

| Модуль | Может импортировать | Не может |
| --- | --- | --- |
| `src/app/*` | всё | — |
| `src/components/*` | `src/theme`, `src/i18n`, `src/lib`, другие компоненты, типы из `features/*/types.ts` | сторы, API, `expo-location` |
| `src/features/weather/model/*` | `src/lib`, `src/i18n`, типы | React, сторы, `fetch` |
| `src/features/*/api.ts` | `src/lib/http.ts`, `zod` | React, сторы |
| `src/features/*/…Store.ts` | API, model, `src/lib/storage.ts` | компоненты |
| `src/lib/*` | только сторонние утилиты | всё из `src/` кроме `src/lib` |

Если компоненту нужны данные, которых нет в пропсах, добавь их в view-модель, а не подключай стор в компоненте.

## Модули

### Экраны

| Файл | Что делает |
| --- | --- |
| `src/app/_layout.tsx` | Держит сплэш, пока грузятся шрифты. Оборачивает приложение в `SafeAreaProvider`. Ставит `<StatusBar style="light" />`. Объявляет `Stack` с `headerShown: false` и `contentStyle` цвета `sky-bottom`. Запускает `useWeatherAutoRefresh()`. |
| `src/app/index.tsx` | Главный экран. Берёт список страниц из `citiesStore` (местоположение + сохранённые), рисует `PagerView`, в каждой странице `CityPage`. Футер лежит поверх pager и не листается. Пустой список даёт стартовое состояние ([03](03-domain-and-rules.md#состояния-экрана)). |
| `src/app/cities.tsx` | Список городов: шапка (назад, правка), заголовок, поле поиска. Пустое поле показывает карточки городов, непустое показывает результаты поиска. Нажатие на карточку делает город активным и возвращает назад. |
| `src/app/map.tsx` | Этап 8, карта осадков. До этого кнопка карты скрыта или неактивна ([05](05-implementation-plan.md#этап-8-после-первой-версии)). |

`CityPage` (`src/features/weather/CityPage.tsx`) — экранный блок одного города: `ThemeProvider` с темой города, `Atmosphere`, `ScrollView` с `RefreshControl`, внутри `TempHero`, `HourlyForecast`, `DailyForecast`, `Tiles`, подпись источника. Он связывает `weatherStore` с компонентами, поэтому живёт в `features`, а не в `components`.

### Сторы

`citiesStore` (сохраняется):

```ts
interface CitiesState {
  currentLocation: City | null; // город по геолокации, всегда первая страница
  saved: City[];                // добавленные пользователем, в порядке списка
  locationPermission: 'unknown' | 'granted' | 'denied';
  addCity(city: City): 'added' | 'duplicate';
  removeCity(id: string): void;            // этап 8
  moveCity(id: string, dir: -1 | 1): void; // этап 8
  setCurrentLocation(city: City | null): void;
  setLocationPermission(p: CitiesState['locationPermission']): void;
}
// Производное значение, а не поле стора:
const selectPages = (s: CitiesState): City[] =>
  s.currentLocation ? [s.currentLocation, ...s.saved] : s.saved;
```

`weatherStore` (сохраняются только `entries`):

```ts
interface WeatherState {
  entries: Record<string, Forecast>;               // ключ — City.id; Forecast.fetchedAt = Date.now() при получении
  status: Record<string, 'idle' | 'loading' | 'error'>;
  error: Record<string, WeatherError | undefined>;
  refresh(city: City, opts?: { force?: boolean }): Promise<void>;
  refreshAll(cities: City[], opts?: { force?: boolean }): Promise<void>;
}
```

`uiStore` (не сохраняется): `activeCityId: string | null`, `setActiveCityId(id)`. Через него экран городов говорит главному, какую страницу открыть.

### Логика погоды (`src/features/weather/model`)

Чистые функции, у каждой свой тест ([06](06-testing.md)):

| Файл | Функция | Что делает |
| --- | --- | --- |
| `mapForecast.ts` | `mapForecast(raw, fetchedAt): Forecast` | ответ API → доменная модель |
| `conditions.ts` | `skyFor(code)`, `iconFor(code, isDay)`, `labelFor(code)`, `isPrecipitation(code)` | таблица кодов WMO |
| `summary.ts` | `buildSummary(forecast, now): string` | фраза над лентой часов |
| `tiles.ts` | `buildTiles(forecast, now): TileVM[]` | 4 плитки и их пояснения |
| `viewModels.ts` | `buildMainVM(city, forecast, now)`, `buildCityCardVM(city, forecast, now)` | всё, что нужно экрану, в готовом виде |

## Поток данных

### Обновление погоды

```mermaid
sequenceDiagram
  autonumber
  participant OS as ОС (AppState)
  participant Hook as useWeatherAutoRefresh
  participant Store as weatherStore
  participant API as weather/api
  participant OM as Open-Meteo
  participant KV as kv-store

  Note over Store,KV: при запуске persist читает entries из kv-store,<br/>экран сразу показывает сохранённые данные
  Hook->>Store: refreshAll(pages)
  loop для каждого города
    Store->>Store: свежее 30 минут и нет force? пропустить
    Store->>API: fetchForecast(lat, lon)
    API->>OM: GET /v1/forecast
    alt ответ 200 и zod прошёл
      OM-->>API: JSON
      API-->>Store: RawForecast
      Store->>Store: mapForecast → entries[id], status idle
      Store->>KV: persist
    else сеть, HTTP-ошибка, неверный ответ
      API-->>Store: WeatherError
      Store->>Store: status error, старые entries остаются
    end
  end
  OS->>Hook: AppState → active
  Hook->>Store: refreshAll(pages) (пропустит свежие)
  Note over Hook,Store: pull-to-refresh вызывает refresh(city) с force
```

Правила:

- Свежесть: `Date.now() - forecast.fetchedAt < 30 * 60 * 1000` (NFR-07). Свежие данные не перезапрашиваются, кроме `force`.
- Повторный вызов `refresh` для города, который уже грузится, возвращает тот же промис (держи `Map<cityId, Promise>` вне стора).
- Ошибка не стирает старые данные. Экран показывает их с пометкой времени (NFR-08).
- Запросы для нескольких городов идут параллельно, но не больше 4 одновременно. При 20 городах это укладывается в лимиты Open-Meteo ([02](02-data-sources.md#лимиты)).
- Новый город (после добавления или определения местоположения) обновляется сразу, с `force: true`.

### Текущее местоположение

```mermaid
flowchart LR
  A["Запуск"] --> B{"locationPermission"}
  B -- granted --> C["getLastKnownPositionAsync<br/>maxAge 30 мин"]
  C -- нет --> D["getCurrentPositionAsync<br/>Accuracy.Low"]
  C -- есть --> E["округлить до 0.01"]
  D --> E
  E --> F["reverseGeocodeAsync → название"]
  F --> G["setCurrentLocation(City)"]
  G --> H["refresh(city, force)"]
  B -- unknown --> I["ничего не спрашивать сам:<br/>ждать нажатия «Определить местоположение»"]
  B -- denied --> J["работать без местоположения"]
```

Разрешение запрашивается только по действию пользователя: кнопка в стартовом состоянии главного экрана или пункт в списке городов (NFR-14).

## Навигация

```mermaid
flowchart LR
  Main["/ (index.tsx)<br/>PagerView городов"] -- "кнопка списка<br/>router.push('/cities')" --> Cities["/cities"]
  Cities -- "Назад, жест<br/>router.back()" --> Main
  Cities -- "карточка города<br/>setActiveCityId + router.back()" --> Main
  Cities -- "результат поиска<br/>addCity, очистить поле" --> Cities
  Main -- "свайп" --> Main
  Main -. "этап 8: кнопка карты<br/>router.push('/map')" .-> Map["/map"]
```

- `Stack` без заголовков: шапки рисуют сами экраны (круглые стеклянные кнопки).
- Главный экран при изменении `activeCityId` вызывает `pagerRef.current?.setPage(index)`, а `onPageSelected` записывает индекс в локальное состояние для `PageDots`.
- Системный жест «назад» работает на обеих платформах. В `app.json` стоит `predictiveBackGestureEnabled: false`, не трогай это.

## Дерево главного экрана

```mermaid
flowchart TB
  Screen["index.tsx"] --> Pager["PagerView"]
  Screen --> Footer["Footer (absolute, над pager)"]
  Pager --> Page1["CityPage город 1"]
  Pager --> PageN["CityPage город N"]
  Page1 --> TP["ThemeProvider theme=day|night"]
  TP --> Atm["Atmosphere condition, active"]
  Atm --> Target["BlurTargetView: градиент + Skia-холст"]
  Atm --> Scroll["ScrollView + RefreshControl"]
  Scroll --> Hero["TempHero"]
  Scroll --> Hourly["HourlyForecast (GlassPanel)"]
  Scroll --> Daily["DailyForecast (GlassPanel)"]
  Scroll --> Tiles["Tiles: 4 × GlassPanel"]
  Scroll --> Attr["Подпись «Данные: Open-Meteo.com»"]
  Footer --> BMap["GlassButton «Карта осадков»"]
  Footer --> Pill["GlassPanel thick, пилюля → PageDots"]
  Footer --> BList["GlassButton «Список городов»"]
```

- У каждой страницы своё небо и своя тема: при свайпе небо уезжает вместе с городом.
- `active` у `Atmosphere` истинно только у видимой страницы и только когда приложение активно (`useAppActive`). Остальные страницы рисуют неподвижный кадр (NFR-06).
- Футер берёт тему активной страницы.
- `ScrollView` — сосед `BlurTargetView`, а не потомок. На Android только так `BlurView` в панелях размывает небо ([04](04-ui-spec.md#glasspanel)).

## Структура папок

```
src/
  app/
    _layout.tsx
    index.tsx
    cities.tsx
  components/
    atmosphere/      Atmosphere.tsx, SkyEffects.tsx (+ .web.tsx), SkyCanvas.tsx, Glow.tsx, Clouds.tsx, Rain.tsx, BlurTargetContext.ts
    glass/           GlassPanel.tsx, GlassButton.tsx, PressableScale.tsx, useReveal.ts
    Pager.tsx  Pager.web.tsx          страницы городов: PagerView; в вебе ScrollView (только превью)
    icons/           WeatherIcon.tsx, UiIcon.tsx (назад, ещё, карта, список, поиск)
    TempHero.tsx  HourlyForecast.tsx  DailyForecast.tsx  TempBar.tsx  Tiles.tsx
    PageDots.tsx  Footer.tsx  CityCard.tsx  SearchField.tsx  StatePanel.tsx
    PanelHeader.tsx  Reveal.tsx
  features/
    weather/
      api.ts  schema.ts  types.ts  weatherStore.ts  useWeatherAutoRefresh.ts  CityPage.tsx
      model/  mapForecast.ts  conditions.ts  summary.ts  tiles.ts  viewModels.ts
      __tests__/  __fixtures__/
    cities/
      types.ts  citiesStore.ts  uiStore.ts  geocodingApi.ts  useCitySearch.ts  useCurrentLocation.ts
      __tests__/
  lib/
    format.ts  time.ts  http.ts  storage.ts  useReduceMotion.ts  useAppActive.ts  useDebouncedValue.ts
    __tests__/
  theme/
    tokens.ts  typography.ts  motion.ts  ThemeProvider.tsx  glassMode.ts  fonts.ts
  i18n/
    ru.ts
  mocks/
    mainScreens.ts  citiesList.ts   (данные макетов для этапов 2–3)
```

Алиас `@/*` → `./src/*` в `tsconfig.json`. Импорты пиши через него: `import { tokens } from '@/theme/tokens'`.

## Зависимости

Ставятся только `npx expo install` (они же в [05](05-implementation-plan.md#этап-0-основа)).

| Пакет | Зачем |
| --- | --- |
| `expo-router`, `react-native-safe-area-context`, `react-native-screens`, `expo-linking`, `expo-constants`, `expo-status-bar` | навигация, safe area |
| `expo-dev-client` | development build |
| `react-native-reanimated`, `react-native-worklets` | все анимации |
| `expo-glass-effect` | Liquid Glass на iOS 26+ |
| `expo-blur` | матовое стекло без Liquid Glass |
| `expo-linear-gradient` | градиент неба, шкала температур |
| `@shopify/react-native-skia` | свечение, облака, дождь |
| `react-native-svg` | иконки погоды и интерфейса |
| `expo-font`, `@expo-google-fonts/bricolage-grotesque`, `expo-splash-screen` | шрифт цифр |
| `react-native-pager-view` | свайп между городами |
| `expo-sqlite` | `expo-sqlite/kv-store` для `persist` |
| `zustand` | сторы |
| `zod` | проверка ответов API |
| `expo-location` | текущее местоположение |
| `jest-expo`, `jest`, `@types/jest`, `@testing-library/react-native` (dev) | тесты |
| `react-native-webview` | только этап 8, карта осадков |

`expo-symbols` не нужен: значки интерфейса рисуются теми же SVG, что в макетах, одинаково на обеих платформах ([04](04-ui-spec.md#значки-интерфейса)). `react-native-web` остаётся в `package.json`, но веб не поддерживается: Skia на вебе требует отдельной настройки, а дизайн только для телефонов.
