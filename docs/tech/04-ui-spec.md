# 04. Интерфейс: перенос дизайна на React Native

Все значения из дизайн-системы и макетов, переложенные на React Native. Этого документа достаточно, чтобы построить экраны без доступа к артефактам дизайна. Если доступ есть и значения расходятся, верь дизайн-системе (`project/tokens.json`, `project/components/bundle.css`) и поправь этот документ.

Сверяйся со скриншотами макетов: [ios-day-rain](../screenshots/ios-day-rain.png), [ios-night-clear](../screenshots/ios-night-clear.png), [ios-storm](../screenshots/ios-storm.png), [ios-cities](../screenshots/ios-cities.png), [android-day-rain](../screenshots/android-day-rain.png), [android-cities](../screenshots/android-cities.png), [guide-main](../screenshots/guide-main.png). Экран гроза содержит панель предупреждения: в первой версии её нет.

## Общие правила

- Один дизайн для iPhone и Android. Отличается только системный шрифт текста.
- Стекла нет (решение владельца 2026-10-29): макеты нарисованы с Liquid Glass, а в приложении панели — полупрозрачная заливка и кромка, без размытия и теней.
- Ширина макета 402 pt (iPhone), 412 dp (Android). Числа ниже в pt/dp, их не масштабируй: раскладка гибкая, боковые поля 16.
- CSS-единица `em` в `letterSpacing` переводится в pt: `letterSpacing = em × fontSize`.
- `lineHeight` в RN — абсолютное число: `0.9 × 120 = 108`.
- Цифры, которые меняются или стоят столбиком: `fontVariant: ['tabular-nums']`.
- Фон любого экрана — небо. Белого или серого фона нет.
- Панель на панель не кладём.

## Токены (`src/theme/tokens.ts`)

Цвета из `tokens.json`. Стеклянные токены дизайн-системы заменены четырьмя: `panel` (было `glass-frosted`), `panelEdge` (`glass-edge-frosted`), `panelStrong` (`glass-fill-strong`), `cloud` (`glass-edge`). Тени, блик и радиусы размытия не используются.

```ts
export const colors = {
  day: {
    skyTop: '#2a62a3', skyMid: '#1d4880', skyBottom: '#163c6e',
    panel: 'rgba(10,35,80,0.32)',          // заливка панелей и круглых кнопок
    panelStrong: 'rgba(255,255,255,0.20)', // нажатие, текущий час, дорожка шкалы
    panelEdge: 'rgba(255,255,255,0.18)',   // кромка 1 pt
    panelSolid: '#163c6e',    // футер и круглые кнопки: сквозь них не читается прокрученный текст
    hairline: 'rgba(255,255,255,0.16)',
    cloud: 'rgba(255,255,255,0.42)',       // цвет облаков в небе
    text: '#ffffff', textMuted: '#dfe9f7',
    sun: '#ffd36b', onSun: '#2a1d00',
    rain: '#8fd3ff', rainText: '#b0e0ff',
    cold: '#7cc4ff', warm: '#ffb057', alert: '#ffa36b', focus: '#ffffff',
  },
  night: {
    skyTop: '#152452', skyMid: '#0f1a3e', skyBottom: '#070d24',
    panel: 'rgba(4,9,24,0.40)', panelStrong: 'rgba(255,255,255,0.16)', panelEdge: 'rgba(255,255,255,0.12)',
    panelSolid: '#070d24',
    hairline: 'rgba(255,255,255,0.12)',
    cloud: 'rgba(255,255,255,0.30)',
    text: '#ffffff', textMuted: '#c3cde3',
    sun: '#ffd36b', onSun: '#2a1d00',
    rain: '#8fd3ff', rainText: '#8fd3ff',
    cold: '#7cc4ff', warm: '#ffb057', alert: '#ffa36b', focus: '#ffffff',
  },
} as const;
export type Palette = { [K in keyof typeof colors.day]: string };

export const space = { s1: 4, s2: 8, s3: 12, s4: 16, s5: 24, s6: 40 } as const;
export const radius = { chip: 14, card: 26, sheet: 42, pill: 999 } as const;
export const duration = { tap: 120, ui: 280, reveal: 640, count: 900, stagger: 45 } as const;
```

### Правила цвета

- Над `skyTop` (верх экрана) только крупный текст цвета `text`: температура, название города, состояние. `textMuted` над `skyTop` не ставить.
- На панели: основной текст `text`, вторичный `textMuted`, вероятность осадков `rainText`.
- `cold`, `warm`, `rain` — только знаки (шкала, капли), никогда не текст.
- `sun` отмечает «сейчас»: обводка точки на шкале.
- Кольцо фокуса: 2 pt `focus` со смещением 2 pt.

## Типографика (`src/theme/typography.ts`)

Шрифт цифр — Bricolage Grotesque из `@expo-google-fonts/bricolage-grotesque`. Нужны четыре начертания: `BricolageGrotesque_200ExtraLight`, `BricolageGrotesque_300Light`, `BricolageGrotesque_500Medium` и `BricolageGrotesque_600SemiBold` (слово Weather в сплэше). Вес 250 из дизайна заменяется на 300, ближайший статический. У стилей с Bricolage задавай только `fontFamily`, без `fontWeight`: на Android их сочетание со своим шрифтом даёт подмену на системный.

Текстовые стили без `fontFamily` получают системный шрифт (SF Pro / Roboto).

| Стиль | Шрифт | Размер / строка | Вес | Трекинг | Где |
| --- | --- | --- | --- | --- | --- |
| `tempHero` | Bricolage 200 | 120 / естественная (см. ниже) | — | −4.8 | температура в шапке |
| `tempLg` | Bricolage 300 | 48 / 48 | — | −0.96 | температура в карточке города |
| `tileValue` | Bricolage 300 | 44 / 48 | — | −0.88 | значение плитки |
| `place` | Bricolage 500 | 34 / 40 | — | −0.34 | название города в шапке, заголовок «Города» |
| `cityName` | Bricolage 500 | 22 / 28 | — | 0 | название в карточке |
| `headline` | система | 20 / 25 | 500 | 0 | состояние под температурой |
| `rangeHero` | система | 17 / 22 | 500 | 0 | «Макс.: 9°, мин.: 4°» |
| `body` | система | 15 / 20 | 400 | 0 | сводка, пояснения плиток |
| `numeral` | система | 17 / 22 | 500 | 0 | температуры в часах и днях |
| `label` | система | 15 / 20 | 600 | 0 | час в ленте |
| `dayName` | система | 17 / 22 | 600 | 0 | день в списке дней |
| `caption` | система | 12 / 16 | 600 | 0.72, uppercase | заголовки панелей и плиток |
| `micro` | система | 13 / 16 | 600 | 0 | вероятность в ленте, подпись карточки |
| `popDay` | система | 11 / 12 | 600 | 0 | вероятность под иконкой дня |
| `field` | система | 17 / 22 | 400 | 0 | поле поиска |
| `unit` | система | 17 / 22 | 500 | 0 | «м/с», «мм» в плитке |
| `cardBottom` | система | 15 / 20 | 500 | 0 | нижняя строка карточки |

`tabular-nums` у: `tempHero`, `tempLg`, `tileValue`, `numeral`, `rangeHero`, `micro`, `popDay`, `cardBottom`.

`lineHeight` меньше размера шрифта (0.9× из дизайна) в iOS обрезает верх глифа и сдвигает его. Поэтому у `tempHero` высота строки естественная, а плотность строк из макета дают отрицательные отступы блока температуры (`marginTop: -8`, `marginBottom: -20`), подобранные на симуляторе iOS 27.

Масштаб шрифта системы (NFR-13) поддерживается. Чтобы раскладка не разваливалась, у `tempHero`, `tempLg`, `tileValue` задай `maxFontSizeMultiplier={1.2}`, у остальных `1.6`.

Тени текста над небом: `place` — `textShadowColor: 'rgba(0,0,0,0.12)'`, `textShadowRadius: 12`, `textShadowOffset: {width: 0, height: 1}`; `tempHero` — `rgba(0,0,0,0.14)`, радиус 24, смещение `{0, 2}`.

## Движение (`src/theme/motion.ts`)

```ts
import { Easing } from 'react-native-reanimated';
export const ease = {
  out: Easing.bezier(0.32, 0.72, 0, 1),     // ease-glass дизайн-системы: появления и сдвиги
  spring: Easing.bezier(0.34, 1.56, 0.64, 1), // отпускание кнопки, рост шкалы
  drift: Easing.bezier(0.45, 0, 0.55, 1),   // облака, свечение
};
```

| Что | Как | Длительность, кривая | При «Уменьшении движения» |
| --- | --- | --- | --- |
| Появление панели (`Reveal`) | opacity 0→1, translateY 12→0, scale 0.985→1 | `reveal` 640, `out`, задержка по каскаду | только opacity за `ui` 280 |
| Каскад | задержки: hero 0/60/120/160, лента 120, дни 200, плитки 280 и 330; внутри ленты и списка дней `i × 45` + базовая задержка (120 у часов, 200 у дней) | | без задержек |
| Отсчёт температуры | от 0 до значения, `p` по времени, значение `round(target × (1 − (1 − p)^4))` | `count` 900 | сразу значение |
| Рост полоски дня | scaleX 0→1 от левого края, opacity 0.4→1 | `reveal` 640, `spring`, задержка `i × 45 + 320` | только opacity |
| Точка «сейчас» | scale 0→1 | `ui` 280, `spring`, задержка 700 | без анимации |
| Нажатие кнопки (`PressableScale`) | scale → 0.97; у `RoundButton` фон → `panelStrong` | `tap` 120 вниз, `ui` 280 `spring` обратно | без scale, остаётся смена фона |
| Нажатие карточки города | scale → 0.98, сверху слой `panelStrong` | так же | без scale |
| Облака | translateX от −8% до +10% ширины облака, туда и обратно | 52, 64, 58 с; `drift` | стоят |
| Свечение | scale 1→1.12, туда и обратно | 9 с, `drift` | стоит |
| Дождь | частицы, см. `Atmosphere` | непрерывно | один неподвижный кадр |
| Иконки | одно движение на иконку, см. `WeatherIcon` | | стоят |
| Сплэш при запуске | см. [Сплэш «Восход»](#сплэш-восход) | около 2.5 с | кадр с названием стоит 900 мс и гаснет за `ui` |

`src/lib/useReduceMotion.tsx` (`ReduceMotionProvider` в `_layout`): начальное значение из `AccessibilityInfo.isReduceMotionEnabled()`, подписка на событие `'reduceMotionChanged'`. Все анимации читают его.

`src/lib/useAppActive.ts`: `AppState.currentState === 'active'` с подпиской на `'change'`. Фоновые анимации (небо, иконки) идут только при `active && isVisiblePage && !reduceMotion` (NFR-06).

## Тема (`src/theme/ThemeProvider.tsx`)

```ts
interface ThemeValue { name: ThemeName; c: Palette }
export function ThemeProvider(props: { theme: ThemeName; children: React.ReactNode }): JSX.Element;
export function useTheme(): ThemeValue;
```

- `ThemeProvider` стоит у каждой страницы города, у каждой карточки города и у экрана городов.
- Экран городов в макете ночной: `ThemeProvider theme="night"`, фон — градиент `skyTop` → `skyBottom` на 60% высоты. Карточки внутри получают свою тему.

## Компоненты

Для каждого: пропсы, раскладка, поведение. Пропсы повторяют `index.d.ts` дизайн-системы, лишнее (`className`, `href`, `as`) убрано.

### Atmosphere

```ts
interface AtmosphereProps { condition: Condition; active: boolean; children?: React.ReactNode; style?: ViewStyle }
```

Корневой слой страницы, во всю высоту. Тему берёт из `useTheme()`.

```
<View style={[{ flex: 1, overflow: 'hidden' }, style]}>
  <LinearGradient colors={[skyTop, skyMid, skyBottom]} locations={[0, 0.38, 1]} style={absoluteFill} />
  <SkyCanvas …/>                     // Canvas Skia: свечение, облака, дождь
  {children}
</View>
```

Что рисуется при каком `condition`:

| condition | Свечение | Облака | Дождь |
| --- | --- | --- | --- |
| clear | да | нет | нет |
| partly | да | 2 первых | нет |
| clouds | нет | 3 | нет |
| rain | нет | 3 | интенсивность 1 |
| storm | нет | 3 | интенсивность 1.6 |

**Свечение.** Круг диаметром 70% ширины, центр на верхнем крае экрана, правый край выступает за экран на 15% ширины: `cx = W × 1.15 − 0.35W = 0.8W`, `cy = 0`, `r = 0.35W`. Радиальный градиент: от цвета свечения в центре до прозрачного на 62% радиуса, размытие 8. Цвет и непрозрачность: день `sun`, 0.4; ночь `textMuted`, 0.16. Дышит: scale 1→1.12, 9 с, `drift`, туда и обратно.

**Облака.** Эллипсы с радиальным градиентом от `cloud` в центре к прозрачному на краю, размытие 18. Позиции в долях экрана (`left, top, width, height`), длительность цикла дрейфа:

| № | left | top | width | height | цикл |
| --- | --- | --- | --- | --- | --- |
| 1 | −0.20 | 0.06 | 0.80 | 0.22 | 52 с |
| 2 | 0.40 | 0.18 | 0.90 | 0.26 | 64 с |
| 3 | −0.10 | 0.44 | 0.70 | 0.20 | 58 с |

Сдвиг каждого облака по X от −8% до +10% его ширины, `drift`, туда и обратно; облако `i` стартует со сдвигом фазы `i × 11 с`.

**Дождь.** Порт `RainCanvas` из дизайн-системы:

- Число капель: `round(W × H / 2600 × intensity)` (около 135 на iPhone, 216 в грозу).
- Каждая капля при создании: `z = random()`, `x = random() × (W + 60)`, `y = random() × H`, длина `8 + z × 14`, скорость `7 + z × 9` pt за кадр 60 Гц, непрозрачность `0.18 + z × 0.45`, толщина 1.4 при непрозрачности больше 0.45, иначе 1.
- Капля падает с наклоном: за кадр `y += v`, `x −= v × 0.18`; рисуется линией от `(x, y)` до `(x − len × 0.18, y + len)`, цвет `rain`, круглые концы.
- Ушла за низ — появляется сверху (`y = −20`, новый `x`).

Реализация без пересоздания объектов: массив капель создаётся один раз (`useMemo` по `W, H, intensity`), позиция считается от времени: `t = elapsedMs / 16.67`; `y = ((y0 + v × t) mod (H + 40)) − 20`, `x = ((x0 − v × 0.18 × t) mod (W + 60) + (W + 60)) mod (W + 60)`. Время даёт `useFrameCallback` из Reanimated (`frameCallback.setActive(active && !reduceMotion)`), картинка собирается в `useDerivedValue` через `Skia.PictureRecorder` или `createPicture` и рисуется `<Picture picture={…} />`. Сверь эти API с документацией Skia той версии, которую поставит `npx expo install`.

**Контекст не проходит в Canvas.** Skia рисует детей `<Canvas>` своим рендерером, поэтому `useTheme()` внутри `Glow`, `Clouds`, `Rain` бросает ошибку. Цвета берёт `SkyCanvas` (он снаружи Canvas) и передаёт пропсами.

### Panel

```ts
interface PanelProps {
  radius?: number;          // по умолчанию radius.card (26); пилюля — radius.pill
  label?: string;           // если задана, панель читается диктором как один элемент
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}
```

`View` со скруглением, заливкой `panel`, кромкой 1 pt `panelEdge` и `overflow: 'hidden'`. Без размытия, теней и анимации. Появление — снаружи: `<Reveal delay={…}><Panel>…</Panel></Reveal>`.

Внутренний отступ панели одинаковый: 12 сверху до заголовка, 16 по бокам и снизу. Его задают дочерние блоки, не сама панель.

### PanelHeader

Заголовок панели: `caption`, цвет `textMuted`, отступы `paddingTop 12, paddingHorizontal 16`. Текст обычным регистром («Прогноз на 10 дней»), прописные даёт стиль.

### RoundButton

```ts
interface RoundButtonProps { label: string; icon: UiIconName; size?: 56 | 44; onPress?: () => void }
```

- Круг `size × size` (56 в футере, 44 в шапке): `PressableScale`, внутри `View` с заливкой `panelSolid` (при нажатии `panelStrong`) и кромкой `panelEdge`.
- Иконка по центру, размер `round(size × 0.43)`: 24 в кнопке 56, 19 в кнопке 44. Цвет `text`.
- `accessibilityLabel = label` обязателен (NFR-12). Область нажатия не меньше 44 (NFR-13): у кнопки 44 это выполняется, `hitSlop` не нужен.

### PageDots

```ts
interface PageDotsProps { count: number; current: number; location: boolean; label: string }
```

- Ряд по центру, промежуток 8. Точка 8×8, круг. Первая позиция при `location` — стрелка 10×10 (SVG ниже).
- Активная: `text`, непрозрачность 1. Остальные: `textMuted`, 0.5.
- `accessibilityRole="image"` (или `"text"`), `accessibilityLabel={label}`: «Москва, город 1 из 6».
- Больше 10 городов: показывай не больше 10 точек, окно вокруг текущей. **Предложение** (Q-15).

### Footer

- `Reveal` с `position: 'absolute'`, `left: 16`, `right: 16`, `bottom: Math.max(insets.bottom, 28)`, ряд `space-between`, `alignItems: 'center'`, `pointerEvents="box-none"`: футер появляется одним блоком.
- Слева `RoundButton` «Карта осадков» (иконка `map`). До этапа 8 кнопка не рисуется, на её месте пустой `View` 56×56, чтобы пилюля осталась по центру. **Предложение.**
- По центру пилюля: `Panel radius={radius.pill}` с заливкой `panelSolid`, высота 56, `paddingHorizontal: 24`, внутри `PageDots`.
- Справа `RoundButton` «Список городов» (иконка `list`) → `router.push('/cities')`.
- Нижний отступ прокрутки страницы: `footerBottom + 56 + 40`, чтобы последняя панель уезжала из-под футера.

### TempHero

```ts
interface TempHeroProps extends HeroVM { animate: boolean }
```

- Колонка по центру, `paddingTop 24`, `paddingBottom 16`. Ставится прямо на небо, без панели.
- Строки: `place`; температура `tempHero` с отступами 4 сверху и снизу; `headline`; `rangeHero` с отступом 4 сверху.
- Температура: число `formatTempNumber(значение)` по центру, знак `°` абсолютно справа от числа (`position: 'absolute', left: '100%', top: 0`): градус не сдвигает цифры от центра.
- Отсчёт от 0 (`useCountUp(target, 900)`, порт из дизайн-системы на `requestAnimationFrame`), при `animate === false` или reduce motion — сразу значение. `accessibilityLabel` у температуры — итоговое значение `formatTemp(temp)`, не бегущее.
- Строки появляются каскадом: 0, 60, 120, 160 мс.
- Под сплэшем температура не проявляется, а вылетает из точки восхода (центр экрана): через 250 мс после начала появления, translateY от точки восхода до места, scale 0.2 → 1.07 за 665 мс (`cubic-bezier(.3,.6,.35,1)`), затем 1.07 → 1 за 285 мс (`cubic-bezier(.34,1.2,.64,1)`). Отсчёт от 0 идёт на лету. Подробности в [Сплэш](#сплэш-восход).

### HourlyForecast

```ts
interface HourlyForecastProps { hours: HourVM[]; summary?: string; delay?: number }
```

- `Reveal` + `Panel`, `label` «Почасовой прогноз».
- Сверху сводка, если есть: `body`, `marginTop 12`, `marginHorizontal 16`, `paddingBottom 12`, нижняя линия 1 pt `hairline`. Без сводки — `PanelHeader` «Почасовой прогноз».
- Лента: горизонтальный `ScrollView`, `showsHorizontalScrollIndicator={false}`, отступы `paddingVertical 12`, `paddingHorizontal 8`.
- Ширина пункта: `max(64, (ширинаПанели − 16) / 5)`, ширину панели бери из `onLayout`. Пять пунктов ровно заполняют ленту. `snapToInterval={ширинаПункта}`, `decelerationRate="fast"`.
- Пункт: колонка по центру, промежуток 4, `paddingVertical 8`. Сверху вниз: время (`label`; у первого «Сейчас»), иконка 28 в коробке высотой 30, вероятность (`micro`, `rainText`, высота строки 16 всегда, пустая если нет), температура (`numeral`).
- Пункт «Сейчас»: фон `panelStrong`, рамка 1 pt `panelEdge`, радиус `26 − 8 = 18`.
- Каскад: пункт `i` появляется с задержкой `i × 45 + 120`.
- У пункта `accessible` и `accessibilityLabel = hour.a11y`, дочерние элементы диктору не видны.

### DailyForecast

```ts
interface DailyForecastProps { days: DayVM[]; min: number; max: number; delay?: number }
```

- `Reveal` + `Panel`, `PanelHeader` «Прогноз на 10 дней». Список: `paddingTop 4`, `paddingHorizontal 16`, `paddingBottom 8`.
- Строка: ряд, `minHeight 48`, `alignItems: 'center'`, промежуток 8, линия сверху 1 pt `hairline` у всех, кроме первой. Колонки фиксированной ширины: день 76, иконка 34, минимум 40, шкала — остаток (`flex: 1`), максимум 40.
- День: `dayName`. Иконка 26, под ней вероятность (`popDay`, `rainText`), обе по центру колонки. Минимум: `numeral`, `textMuted`, по правому краю. Максимум: `numeral`, `text`, по правому краю.
- Шкала (`TempBar`): дорожка высотой 5, радиус пилюли, фон `panelStrong`. Полоска: `left = (low − min) / span`, `width = max(0.06, (high − low) / span)` в долях ширины дорожки, `span = max(1, max − min)`.
- Градиент полоски общий на всю неделю (BR-06): полоска — `View` с `overflow: 'hidden'`, внутри `LinearGradient` горизонтально `cold → warm` шириной во всю дорожку, сдвинутый влево на `left × ширинаДорожки`. Ширину дорожки бери из `onLayout`.
- Точка «сейчас» (если `now` задан): круг 9×9, заливка `text`, обводка 2 pt `sun`, центр на `(now − min) / span` ширины дорожки, по вертикали по центру.
- Каскад строк `i × 45 + 200`, рост полоски `i × 45 + 320`, точка через 700 мс.
- `accessibilityLabel` строки = `day.a11y`.

### Tiles

```ts
interface TilesProps { tiles: TileVM[]; delay?: number }
```

- Сетка в 2 колонки, промежуток 16: ряды по две плитки, каждая `flex: 1`. Плитки в ряду одной высоты (`alignItems: 'stretch'`).
- Плитка — `Reveal` + `Panel` (задержки 280 и 330, следующий ряд +100). Внутри: `minHeight 168`, отступы `12 / 16 / 16` (верх, бока, низ), колонка с промежутком 8.
- Сверху вниз: подпись (`caption`, `textMuted`), значение (`tileValue`) с единицей справа (`unit`, `marginLeft 4`) в одной строке по базовой линии, пояснение (`body`) прижато к низу (`marginTop: 'auto'`). Пояснения в ряду стоят на одной нижней линии.
- `accessibilityLabel` плитки: `«{label}, {value} {unit}. {note}»`.

### CityCard

```ts
interface CityCardProps extends CityCardVM { onPress: () => void; delay?: number }
```

- Высота 116, радиус 26, `overflow: 'hidden'`, тень `lift`. Внутри свой `ThemeProvider theme={vm.theme}` и `Atmosphere condition={vm.sky} active={false}` (в карточках небо не анимируется: 6+ холстов с дождём тяжело для бюджетных Android, NFR-05. **Предложение.**).
- Поверх всего рамка 1 pt `hairline` внутрь (отдельный `View` с `StyleSheet.absoluteFill`, `pointerEvents="none"`).
- Тело: отступы 12 / 16, колонка `space-between`.
  - Верхний ряд, `space-between`, промежуток 12: слева колонка «название» (`cityName`) и подпись (`micro`, `textMuted`), справа температура (`tempLg`).
  - Нижний ряд, `space-between`, по базовой линии, `cardBottom`: состояние (одна строка, многоточие) и диапазон (не переносится).
- Нажатие: scale 0.98 и слой `panelStrong` поверх на время нажатия. `accessibilityRole="button"`, `accessibilityLabel = a11y`.
- Каскад карточек: задержка `80 + i × 45`.

### SearchField

- `Panel radius={radius.pill}`, высота 52, без анимации появления.
- Ряд: `paddingHorizontal 24`, промежуток 12. Иконка поиска 20, `textMuted`. `TextInput` на остаток: стиль `field`, цвет `text`, `placeholderTextColor={c.textMuted}`, `placeholder` «Найти город или аэропорт», `returnKeyType="search"`, `autoCorrect={false}`, `clearButtonMode="while-editing"`, `accessibilityLabel` «Поиск города».
- `keyboardAppearance="dark"`.

### Результаты поиска

Дизайна нет (S-03, Q-08). **Предложение:** одна `Panel` (в `Reveal`) под полем поиска со списком строк. Строка: `minHeight 56`, отступы 12 / 16, линия `hairline` между строками. Название (`label`, 15/20 600) и под ним подпись «регион, страна» (`micro`, `textMuted`). Справа для уже добавленного — «Уже в списке» (`micro`, `textMuted`). Нажатие на новый: `addCity`, обновить погоду, очистить поле, закрыть клавиатуру; новая карточка появляется в конце списка.

### StatePanel

```ts
interface StatePanelProps { title?: string; text: string; actions?: { label: string; onPress: () => void }[]; busy?: boolean }
```

`Reveal` + `Panel`, отступы 16, промежуток 12. Заголовок `headline`, текст `body`, `textMuted` не использовать (панель может стоять высоко над `skyTop`) — текст цвета `text`. Кнопки — пилюли `PressableScale` с фоном `panelStrong` высотой 44 и подписью `label` по центру (не панели: панель на панель не кладём), в столбик с промежутком 8. `busy` — `ActivityIndicator` цвета `text` вместо кнопок. Ставится по центру экрана на небе страницы.

### Reveal и PressableScale

- `Reveal` (`src/components/Reveal.tsx`): `Animated.View` из Reanimated, анимация появления из таблицы движения, запускается при монтировании. Под сплэшем ждёт фазы `reveal` и сдвигается на `ENTRANCE_SHIFT` (см. [Сплэш](#сплэш-восход)); так же устроены `TempBar` и полёт температуры в `TempHero`.
- `PressableScale` (`src/components/PressableScale.tsx`): `Pressable` + `Animated.View`, сжатие из таблицы движения; при «Уменьшении движения» не сжимается. Дети — функция от `pressed`.

## WeatherIcon

```ts
interface WeatherIconProps { kind: IconKind; size?: number; label?: string; animate: boolean }
```

`react-native-svg`, `viewBox="0 0 32 32"`, размер по умолчанию 28. Подписи для диктора по умолчанию: sun «Ясно», moon «Ясно, ночь», cloud «Облачно», partly «Переменная облачность», rain «Дождь», storm «Гроза», snow «Снег». В ленте и строке дня подпись не нужна: её читает родитель (`a11y`), поэтому там `accessible={false}`.

Общий элемент «облако», параметр `y`:

```xml
<G>  <!-- fill = text -->
  <Rect x="5" y="{y+6}" width="22" height="9" rx="4.5" />
  <Circle cx="11.5" cy="{y+7.5}" r="5" />
  <Circle cx="18.5" cy="{y+5}" r="7" />
</G>
```

Лучи: 8 линий через 45° от центра `(cx, cy)`, от радиуса `r1` до `r2`: `x = cx + cos(a) × r`, `y = cy + sin(a) × r`. Обводка `sun`, толщина 2, круглые концы.

| kind | Состав |
| --- | --- |
| sun | `Circle cx=16 cy=16 r=6` заливка `sun`; лучи `(16, 16, 9.5, 12.5)` |
| moon | `Path d="M19.5 5.5a10.5 10.5 0 1 0 7 17.6A8.6 8.6 0 0 1 19.5 5.5z"` заливка `textMuted` |
| cloud | облако `y=8` |
| partly | `Circle cx=11 cy=11 r=5` заливка `sun`; лучи `(11, 11, 7.5, 9.8)`; облако `y=8` со сдвигом `translate(3 5)` |
| rain | облако `y=3`; три линии `(10,23)→(9,27)`, `(16,23)→(15,27)`, `(22,23)→(21,27)`, обводка `rain`, толщина 2, круглые концы |
| storm | облако `y=3`; молния `Path d="M17 19l-5 7h4l-1.5 5L20 23.5h-4l1.5-4.5z"` заливка `sun` |
| snow | облако `y=3`; три круга r=1.5 в `(10,25)`, `(16,26)`, `(22,25)` заливка `text` |

Облако заливается `text`.

Анимации (только при `animate && !reduceMotion`). У иконки одно движение и один цикл `useLoopValue`:

| kind | Что движется | Движение |
| --- | --- | --- |
| sun | лучи | поворот 360° за 24 с, линейно |
| cloud, partly | облако | сдвиг по X от −0.6 до +0.8 (единицы viewBox), 6 с, `drift`, туда и обратно; у `partly` солнце стоит |
| rain | три капли вместе | translateY −2 → 4, opacity 1 → 0, 1.1 с, линейно, бесконечно |
| snow | три снежинки вместе | так же, 2.4 с |
| storm | молния | opacity 1; на 64–68% цикла 0.25; цикл 3.2 с |
| moon | — | стоит |

Неподвижная часть и движущаяся — два `<Svg>` того же размера и `viewBox`, наложенные абсолютно в коробке `size × size`; анимируется обёртка `Animated.View` стилем (`transform`, `opacity`). Смещения в единицах viewBox умножай на `size / 32`. Так не нужны анимированные пропсы SVG.

## Значки интерфейса

SVG 24×24, обводка `currentColor` → `text`, без заливки, если не сказано иное. Это те же значки, что в макетах, одинаковые на iPhone и Android (дизайн разрешает SF Symbols на iPhone, но один набор проще и не расходится).

| Имя | Где | Разметка |
| --- | --- | --- |
| `map` | футер, слева | `stroke-width 1.8`, круглые концы и стыки: `Path d="M3 6.5l5.5-2.5 7 2.5 5.5-2.5v13.5l-5.5 2.5-7-2.5L3 20z"`, `Path d="M8.5 4v13.5M15.5 6.5V20"` |
| `list` | футер, справа | `stroke-width 1.8`, круглые концы: `Path d="M9 6h11M9 12h11M9 18h11"`; круги r=1.2 в `(4.5,6)`, `(4.5,12)`, `(4.5,18)` с заливкой и без обводки |
| `back` | шапка городов | `stroke-width 2`, круглые концы и стыки: `Path d="M15 5l-7 7 7 7"` |
| `more` | шапка городов | только заливка: круги r=1.9 в `(5,12)`, `(12,12)`, `(19,12)` |
| `search` | поле поиска | `stroke-width 2`, круглые концы: `Circle cx=11 cy=11 r=6.5`, `Path d="M16 16l4.5 4.5"` |
| стрелка местоположения | `PageDots` | `viewBox 0 0 12 12`, заливка: `Path d="M11 1L1 5.2l4.2 1.6L6.8 11z"` |

## Экраны

### Иконка приложения «Восход»

Макет: доска «Иконка · восход». Рисует `node scripts/app-icons.mjs` (координаты 1024, горизонт на y 600): небо `skyTop` → `skyMid` (38%) → `skyBottom` ночи; свет вдоль горизонта — эллипс 880 × 300 цвета `sun` до 0.38; над горизонтом ореол r 330 цвета `sun` до 0.6 и диск r 150 `#f4f7ff`; горизонт 704 × 14, к краям тает. Линия толще, чем в сплэше: иначе на 40–58 pt её не видно.

| Файл | Что |
| --- | --- |
| `icon.png` | iOS обычная (`ios.icon.light`), она же общая `icon` |
| `icon-dark.png` | iOS тёмная: без неба, прозрачный фон |
| `icon-tinted.png` | iOS тонированная: белым на прозрачном, оттенок задаёт система |
| `android-icon-foreground.png` | адаптивная, передний слой: рисунок без неба, уменьшен до 2/3 (безопасная зона масок) |
| `android-icon-background.png` | адаптивная, фон: небо; `backgroundColor` `#070d24` |
| `android-icon-monochrome.png` | Android 13+, тематические иконки: диск и горизонт 20, сплошные |

### Сплэш «Восход»

Макет: доски «iPhone · сплэш» и «Android · сплэш» в [макетах](https://claude.ai/artifact/Hv2h29d8ZeGG6SE1KDCpW6). Играет один раз при холодном запуске, при возврате в приложение не повторяется.

**Нативная заставка** (`app.json`, плагин `expo-splash-screen`): фон `#070d24` (`skyBottom` ночи), картинка `assets/splash-icon.png`, `imageWidth: 160`. Картинку рисует `node scripts/splash-icon.mjs`: линия горизонта 120×2 (градиент прозрачный → белый 0.9 → прозрачный) и половинка солнца диаметром 28 цвета `#f4f7ff` со свечением `0 0 18px rgba(244,247,255,.45)`, всё на высоте центра экрана. Android 12+ показывает картинку в круге 192 dp, нарисованное помещается в радиус 60.

**Слой** `SplashOverlay` (`src/features/splash/SplashOverlay.tsx`) лежит в `_layout` поверх `Stack` и рисуется первым и один, не дожидаясь шрифтов: его первый кадр повторяет нативную заставку, поэтому после `onLayout` он прячет её (`SplashScreen.hide()` в следующем кадре) без видимого шва и сразу начинает восход. Название рисуется, когда загружен шрифт. `Stack` с главным экраном монтируется в паузе `hold` (`onMountMain`), а готовность (`mainReady`) — это `onLayout` обёртки `Stack` плюс два кадра. Часы сплэша покадровые (`useFrameCallback`, шаг не больше 34 мс): если поток отрисовки завис, анимация встаёт и продолжает с того же места, а не перескакивает вперёд. Фазы `reveal` и `done` переключаются по этим же часам, а не по таймерам: иначе после подвисания слой снимался посреди ухода сцены. Нативный сплэш снимается без растворения (`SplashScreen.setOptions({ duration: 0 })`): на Android он по умолчанию растворяется 400 мс поверх начавшегося восхода, и были видны два солнца. На Android часы ещё 12 кадров стоят на кадре заставки, пока впервые рисуется холст Skia: иначе кадры восхода считались, но не выводились, и солнце выпрыгивало. Сценарий в `src/features/splash/timeline.ts`, время в мс от смены заставки: Сценарий в `src/features/splash/timeline.ts`, время в мс от смены заставки:

| Время | Что происходит | Кривая |
| --- | --- | --- |
| 0–650 | солнце поднимается на 34 над горизонтом, вокруг него ореол (цвет `sun` днём, `textMuted` ночи ночью, по теме первой страницы); горизонт растягивается по X до 3.6; вдоль горизонта проступает свет (эллипс 600×220, до 0.42) | `glass` |
| 200, 320, 440, 580 | снизу всплывают One, More, Weather, App (подъём 22, проявление, 640 мс). Weather — 780 мс с пружинкой, наклон −6° и scale 0.9 → 1 | `out`, Weather `spring` |
| 1250 | пауза `hold`: кадр собран и неподвижен. Монтируется главный экран, часы стоят, пока он не нарисуется (не дольше 3 с), дальше время идёт от 1250 | |
| 1350 | фаза `reveal`: главный экран начинает появляться | |
| 1400–2400 | тьма отступает от точки восхода к краям: радиальная маска на Skia с мягким краем 160 | `cubic-bezier(.5,0,.6,1)` |
| 1500–2200 | камера поднимает взгляд: горизонт и свет уходят вниз на 300–320 и тают, название уходит вниз на 48 за 450 мс, солнце гаснет за 300 мс | `cubic-bezier(.55,0,.75,.3)` |
| 1400–2400 | солнце летит в правый верхний угол и становится свечением неба (центр 0.8w на верхнем крае, r 0.35w), в конце гаснет: у ясного неба там своё свечение `Glow` | `out` |
| 2450 | фаза `done`, слой снят | |

Название: Bricolage Grotesque 30/36, трекинг −0.3, в одну строку по центру, низ строки на `max(insets.bottom, 28) + 84` от низа экрана. One, More, App — 300, цвет `text`. Weather — 600, цвет `sun`, свечение `rgba(255,211,107,.45)` радиус 22. Цвет `sun` разрешён для текста ([токены](#правила-цвета)).

**Ворота появления** (`src/lib/entrance.ts`): фаза `cover` → `reveal` → `done`. `_layout` ставит `cover` на уровне модуля, слой переключает дальше. Всё, что смонтировано под сплэшем, ждёт `reveal`, а потом появляется с обычными задержками плюс `ENTRANCE_SHIFT = 760`: сначала прилетает температура, потом город, панели и футер. Решение «под сплэшем или нет» принимается при монтировании: экраны, открытые позже, появляются как обычно.

**«Уменьшение движения»**: слой спрашивает систему сам, не дожидаясь ответа: восход начинается сразу, а если ответ «включено» (ждём не дольше 300 мс), кадр возвращается к нативной заставке, стоит 900 мс с названием и гаснет за `ui`, экран появляется затуханием.

**Неподвижная пауза при запуске.** До первого кадра слоя виден нативный сплэш, и он неподвижен: это время запуска процесса и React Native до выполнения JS. Замер 2026-10-29, release на симуляторе iPhone 18 Pro: около 1.7 с неподвижного кадра, из них JS от старта движка до кадра слоя — 73 мс. В debug-сборке добавляется загрузка бандла с Metro. Анимировать нативный сплэш можно только нативным кодом (iOS — `UIView` сплэша из `expo-splash-screen`, Android 12+ — анимированная векторная иконка); владелец решил нативный код не добавлять.

**Почему главный экран монтируется в паузе.** Монтаж экрана города занимает поток отрисовки: замер 2026-10-29 (release, по кадрам записи) — около 1.2 с на симуляторе iPhone 18 Pro, около 1 с на эмуляторе Pixel 3a API 34 с пустым списком и около 2.6 с с городом. При монтаже во время восхода анимация замирала на полуслове (а с часами `withTiming` перескакивала вперёд), поэтому он перенесён в момент, когда кадр собран и ничего не движется. Дальше ускорять — это стоимость монтажа главного экрана на Android (T-72).


### Главный (`src/app/index.tsx` + `CityPage`)

```
View flex 1, фон skyBottom активной темы
├── PagerView flex 1, initialPage 0, onPageSelected → setCurrent(i)
│   └── для каждого города: CityPage key=city.id active={i === current && appActive}
│       └── ThemeProvider(theme) → Atmosphere(sky, active)
│           └── ScrollView
│                 contentContainerStyle: paddingTop insets.top, paddingHorizontal 16,
│                                        paddingBottom footerBottom + 96, gap 16
│                 refreshControl: RefreshControl tintColor text → refresh(city, {force: true})
│               ├── [строка «Нет связи. Данные на 14:05»]   (если ошибка и есть старые данные)
│               ├── TempHero
│               ├── HourlyForecast summary=vm.summary delay 120
│               ├── DailyForecast delay 200
│               ├── Tiles delay 280
│               └── Text «Данные: Open-Meteo.com» (micro, textMuted, по центру) → Linking.openURL
└── Footer (тема активной страницы)
```

Шапка при прокрутке сжимается в одну строку «Москва | 8° Дождь» (README компонента `TempHero`). Это этап 7, не первая версия ([05](05-implementation-plan.md#t-73-свёрнутая-шапка)).

### Список городов (`src/app/cities.tsx`)

```
ThemeProvider night → View flex 1, LinearGradient skyTop → skyBottom (locations [0, 0.6])
└── ScrollView keyboardShouldPersistTaps="handled"
      contentContainerStyle: paddingTop insets.top, paddingHorizontal 16, paddingBottom insets.bottom + 24, gap 16
    ├── Ряд space-between: RoundButton 44 «Назад» (back) → router.back();
    │                      RoundButton 44 «Изменить список» (more) — до этапа 8 скрыта, на её месте пустой View 44
    ├── Text «Города» (place)
    ├── SearchField
    ├── поле пустое: CityCard для каждого города (местоположение первым)
    └── поле не пустое: результаты поиска / «Ничего не нашлось»
```

Кнопки и поле поиска на этом экране лежат прямо на градиенте, без `Atmosphere`.

## Данные макетов (для этапов 2–3)

Перенеси в `src/mocks/mainScreens.ts` и `src/mocks/citiesList.ts`. Это view-модели, а не ответы API.

```ts
// Москва, день, дождь (Main.dc.html)
export const moscowRain: MainVM = {
  theme: 'day', sky: 'rain',
  hero: { place: 'Москва', temp: 8, condition: 'Небольшой дождь', high: 9, low: 4 },
  summary: 'Дождь закончится около 17:00. Ночью без осадков, до 4°.',
  hours: hoursWithA11y([
    { now: true, icon: 'rain', pop: 60, temp: 8 }, { time: '15', icon: 'rain', pop: 70, temp: 8 },
    { time: '16', icon: 'rain', pop: 55, temp: 8 }, { time: '17', icon: 'cloud', pop: 30, temp: 7 },
    { time: '18', icon: 'cloud', temp: 6 }, { time: '19', icon: 'cloud', temp: 6 },
    { time: '20', icon: 'moon', temp: 5 }, { time: '21', icon: 'moon', temp: 5 },
    { time: '22', icon: 'moon', temp: 4 }, { time: '23', icon: 'moon', temp: 4 },
  ]),
  days: daysWithA11y([
    { day: 'Сегодня', icon: 'rain', pop: 70, low: 4, high: 9, now: 8 }, { day: 'Вт', icon: 'cloud', low: 3, high: 8 },
    { day: 'Ср', icon: 'rain', pop: 40, low: 2, high: 7 }, { day: 'Чт', icon: 'partly', low: 1, high: 6 },
    { day: 'Пт', icon: 'sun', low: -1, high: 5 }, { day: 'Сб', icon: 'snow', pop: 30, low: -3, high: 2 },
    { day: 'Вс', icon: 'cloud', low: -2, high: 3 }, { day: 'Пн', icon: 'partly', low: -1, high: 4 },
    { day: 'Вт', icon: 'cloud', low: 0, high: 5 }, { day: 'Ср', icon: 'rain', pop: 50, low: 2, high: 6 },
  ]),
  dayMin: -3, dayMax: 9,
  tiles: [
    { key: 'feelsLike', label: 'Ощущается как', value: '5°', note: 'Из-за ветра кажется холоднее.' },
    { key: 'wind', label: 'Ветер', value: '6', unit: 'м/с', note: 'Северо-западный, порывы до 11 м/с.' },
  ],
  updatedAt: '14:05',
};

// Санкт-Петербург, ночь, ясно (Night.dc.html)
export const spbNight: MainVM = {
  theme: 'night', sky: 'clear',
  hero: { place: 'Санкт-Петербург', temp: 3, condition: 'Ясно', high: 7, low: -1 },
  summary: 'Ясно до утра. К 6:00 похолодает до −1°, возможен гололёд.',
  hours: hoursWithA11y([
    { now: true, icon: 'moon', temp: 3 }, { time: '23', icon: 'moon', temp: 2 },
    { time: '00', icon: 'moon', temp: 2 }, { time: '01', icon: 'moon', temp: 1 },
    { time: '02', icon: 'moon', temp: 1 }, { time: '03', icon: 'moon', temp: 0 },
    { time: '04', icon: 'moon', temp: 0 }, { time: '05', icon: 'moon', temp: -1 },
    { time: '06', icon: 'moon', temp: -1 }, { time: '07', icon: 'cloud', temp: -1 },
  ]),
  days: daysWithA11y([
    { day: 'Сегодня', icon: 'partly', low: -1, high: 7, now: 3 }, { day: 'Вт', icon: 'sun', low: -2, high: 6 },
    { day: 'Ср', icon: 'cloud', low: 0, high: 5 }, { day: 'Чт', icon: 'rain', pop: 60, low: 2, high: 6 },
    { day: 'Пт', icon: 'rain', pop: 80, low: 3, high: 7 }, { day: 'Сб', icon: 'storm', pop: 70, low: 2, high: 5 },
    { day: 'Вс', icon: 'cloud', low: 0, high: 4 }, { day: 'Пн', icon: 'snow', pop: 40, low: -3, high: 1 },
    { day: 'Вт', icon: 'partly', low: -4, high: 0 }, { day: 'Ср', icon: 'sun', low: -5, high: -1 },
  ]),
  dayMin: -5, dayMax: 7,
  tiles: [
    { key: 'sunrise', label: 'Восход', value: '8:52', note: 'Закат в 16:29.' },
    { key: 'humidity', label: 'Влажность', value: '86%', note: 'Точка росы 1°.' },
  ],
  updatedAt: '22:05',
};

// Сочи, ночь, гроза (Storm.dc.html), без панели предупреждения
export const sochiStorm: MainVM = {
  theme: 'night', sky: 'storm',
  hero: { place: 'Сочи', temp: 14, condition: 'Гроза', high: 17, low: 11 },
  summary: 'Гроза стихнет к часу ночи, дождь продлится до утра.',
  hours: hoursWithA11y([
    { now: true, icon: 'storm', pop: 90, temp: 14 }, { time: '23', icon: 'storm', pop: 85, temp: 14 },
    { time: '00', icon: 'storm', pop: 75, temp: 13 }, { time: '01', icon: 'rain', pop: 70, temp: 13 },
    { time: '02', icon: 'rain', pop: 60, temp: 12 }, { time: '03', icon: 'rain', pop: 45, temp: 12 },
    { time: '04', icon: 'cloud', pop: 30, temp: 12 }, { time: '05', icon: 'cloud', temp: 11 },
    { time: '06', icon: 'cloud', temp: 11 }, { time: '07', icon: 'partly', temp: 12 },
  ]),
  days: daysWithA11y([
    { day: 'Сегодня', icon: 'storm', pop: 90, low: 11, high: 17, now: 14 }, { day: 'Вт', icon: 'rain', pop: 60, low: 11, high: 16 },
    { day: 'Ср', icon: 'partly', low: 10, high: 17 }, { day: 'Чт', icon: 'sun', low: 9, high: 18 },
    { day: 'Пт', icon: 'sun', low: 10, high: 19 }, { day: 'Сб', icon: 'partly', low: 11, high: 18 },
    { day: 'Вс', icon: 'rain', pop: 50, low: 12, high: 17 }, { day: 'Пн', icon: 'cloud', low: 11, high: 16 },
    { day: 'Вт', icon: 'sun', low: 9, high: 17 }, { day: 'Ср', icon: 'sun', low: 10, high: 18 },
  ]),
  dayMin: 9, dayMax: 19,
  tiles: [
    { key: 'precipitation', label: 'Осадки', value: '18', unit: 'мм', note: 'За 3 часа. Ещё 9 мм до утра.' },
    { key: 'wind', label: 'Ветер', value: '9', unit: 'м/с', note: 'С моря, порывы до 17 м/с.' },
  ],
  updatedAt: '22:05',
};
```

`hoursWithA11y(items: Omit<HourVM, 'a11y'>[]): HourVM[]` и `daysWithA11y(items: Omit<DayVM, 'a11y'>[]): DayVM[]` — маленькие помощники в том же файле, которые дописывают поле `a11y` по правилам из [03](03-domain-and-rules.md#лента-часов). Массив передаётся прямо в типизированный параметр, поэтому TypeScript не расширяет `'rain'` до `string`. В макетах по 10 часов и по 2 плитки; настоящие данные дадут 25 часов и 4 плитки.

```ts
// Cities.dc.html: тема экрана night, у карточек своя
export const citiesList: CityCardVM[] = withCardA11y([
  { id: 'msk', name: 'Москва', sub: 'Моё местоположение · 14:05', theme: 'day', sky: 'rain', label: 'Небольшой дождь', temp: '8°', range: 'Макс. 9° · мин. 4°' },
  { id: 'spb', name: 'Санкт-Петербург', sub: '14:05', theme: 'day', sky: 'clouds', label: 'Облачно', temp: '6°', range: 'Макс. 7° · мин. 2°' },
  { id: 'sochi', name: 'Сочи', sub: '14:05', theme: 'day', sky: 'storm', label: 'Гроза', temp: '15°', range: 'Макс. 17° · мин. 11°' },
  { id: 'kzn', name: 'Казань', sub: '14:05', theme: 'day', sky: 'clear', label: 'Ясно', temp: '5°', range: 'Макс. 6° · мин. −1°' },
  { id: 'nsk', name: 'Новосибирск', sub: '18:05', theme: 'night', sky: 'clear', label: 'Ясно', temp: '−2°', range: 'Макс. 1° · мин. −6°' },
  { id: 'vvo', name: 'Владивосток', sub: '21:05', theme: 'night', sky: 'partly', label: 'Малооблачно', temp: '4°', range: 'Макс. 8° · мин. 1°' },
]);

function withCardA11y(items: Omit<CityCardVM, 'a11y'>[]): CityCardVM[] {
  return items.map((c) => ({ ...c, a11y: `${c.name}, ${c.temp}, ${c.label.toLowerCase()}` }));
}
```

PageDots в макетах: 6 городов, у Москвы `current 0`, у Петербурга `1`, у Сочи `2`, первая позиция — стрелка местоположения.

## Результаты спайка

Спайк стекла (T-12) потерял смысл: стекло убрано 2026-10-29. Замеры производительности — в статусе T-72 в [05](05-implementation-plan.md).
