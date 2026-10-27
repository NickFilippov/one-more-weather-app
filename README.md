# OneMoreWeatherApp

Погодное приложение для iPhone и Android на Expo и React Native. Небо занимает весь экран и меняется вместе с погодой и временем суток, а данные лежат поверх него на стеклянных панелях в духе Liquid Glass из iOS 26.

> Это pet-проект. Функциональность в разработке, возможны баги и изменения.

## Статус

- Дизайн готов: дизайн-система, макеты для iPhone и Android, гид по экранам.
- В коде пока стартовый шаблон Expo (`App.tsx`). Следующий шаг: перенести дизайн в приложение.
- Источник данных о погоде ещё не выбран.

## Скриншоты

Это макеты дизайна, а не снимки работающего приложения: экраны на них появятся в коде позже.

<table>
  <tr>
    <td align="center"><img src="docs/screenshots/ios-day-rain.png" width="200" alt="Главный экран, день, дождь"><br><sub>Главный экран, день</sub></td>
    <td align="center"><img src="docs/screenshots/ios-night-clear.png" width="200" alt="Главный экран, ясная ночь"><br><sub>Ясная ночь</sub></td>
    <td align="center"><img src="docs/screenshots/ios-storm.png" width="200" alt="Гроза и штормовое предупреждение"><br><sub>Гроза и предупреждение</sub></td>
    <td align="center"><img src="docs/screenshots/ios-cities.png" width="200" alt="Список городов"><br><sub>Список городов</sub></td>
  </tr>
</table>

Тот же дизайн на Android: отличается только материал стекла (матовое вместо Liquid Glass) и системный шрифт.

<table>
  <tr>
    <td align="center"><img src="docs/screenshots/android-day-rain.png" width="200" alt="Главный экран на Android"><br><sub>Главный экран</sub></td>
    <td align="center"><img src="docs/screenshots/android-cities.png" width="200" alt="Список городов на Android"><br><sub>Список городов</sub></td>
  </tr>
</table>

## Что будет в приложении

Так выглядит задуманный функционал. Пока ничего из этого в коде нет.

- [ ] Текущая температура, состояние погоды, максимум и минимум дня.
- [ ] Живое небо: дождь, облака, солнце и луна в зависимости от погоды и времени суток.
- [ ] Прогноз на ближайшие часы с шансом осадков.
- [ ] Прогноз на 10 дней со шкалой температур.
- [ ] Плитки «Ощущается как», ветер и другие показатели.
- [ ] Список городов с поиском, у каждого города своё небо и своё время.
- [ ] Переключение между городами свайпом.
- [ ] Карта осадков.
- [ ] Штормовые предупреждения.

Что где находится и по чему можно нажимать, показывает гид по экранам:

<img src="docs/screenshots/guide-main.png" width="720" alt="Гид по главному экрану: заметки о том, что где находится и что нажимается">

## Дизайн

- **Две темы.** День и ночь переключаются по восходу и закату в выбранном городе, а не по теме телефона.
- **Один дизайн для обеих платформ.** Liquid Glass есть только на iOS 26 и новее. Везде, где его нет (Android и iOS до 26), стекло матовое. Выбор делает одно условие в коде, а не проверка платформы.
- **Шрифты.** Цифры температуры набраны Bricolage Grotesque, остальной текст системный: SF Pro на iPhone, Roboto на Android.
- **Читаемость.** Контраст текста на стекле проверен для обеих тем.
- **Анимации.** Дождь и облака в небе, отсчёт температуры при открытии, каскадное появление панелей, шкала температур растёт пружинкой. При включённом «Уменьшении движения» всё сводится к простому затуханию.

Все токены, правила и компоненты описаны в дизайн-системе.

## Документация

Бизнес-документация лежит в [docs/](docs/README.md): видение продукта, пользовательские истории, функциональные и нефункциональные требования, экраны и навигация, бизнес-правила и данные, риски и открытые вопросы, глоссарий.

## Ссылки

| Что | Ссылка |
| --- | --- |
| Дизайн-система | https://claude.ai/artifact/NodGnsQuESKs2RFibsMCiX |
| Макеты экранов и гид | https://claude.ai/artifact/Hv2h29d8ZeGG6SE1KDCpW6 |

Обе страницы приватные: они открываются только у автора. Чтобы показать их другим, нужно дать доступ через меню «Поделиться» на самой странице.

Документация, на которую опирается проект:

- [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [React Native](https://reactnative.dev/docs/getting-started)

## Стек

Сейчас установлено:

- [Expo](https://expo.dev) SDK 58 и React Native 0.88
- React 19.3
- TypeScript

Для переноса дизайна планируются (пока не установлены):

- [expo-glass-effect](https://docs.expo.dev/versions/latest/sdk/glass-effect/): Liquid Glass на iOS 26+
- [expo-blur](https://docs.expo.dev/versions/latest/sdk/blur-view/): матовое стекло там, где Liquid Glass нет
- [expo-linear-gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/): градиент неба
- [react-native-reanimated](https://docs.expo.dev/versions/latest/sdk/reanimated/): анимации
- [expo-font](https://docs.expo.dev/versions/latest/sdk/font/): шрифт цифр температуры
- [expo-symbols](https://docs.expo.dev/versions/latest/sdk/symbols/): системные иконки на iPhone
- Expo Router: навигация

Модули с нативным кодом не работают в Expo Go, поэтому после их установки понадобится development build.

## Запуск

```bash
npm install
npm start
```

Дальше в терминале Expo нажми `i` для симулятора iOS, `a` для Android-эмулятора или `w` для браузера. Либо отсканируй QR-код приложением Expo Go.

Те же команды есть в `package.json`:

| Команда | Что делает |
| --- | --- |
| `npm start` | запускает сервер разработки |
| `npm run ios` | открывает приложение на iOS |
| `npm run android` | открывает приложение на Android |
| `npm run web` | открывает приложение в браузере |

## Структура

```
.
├── App.tsx              стартовый экран
├── index.ts             точка входа
├── app.json             настройки приложения Expo
├── assets/              иконки и заставка
├── CLAUDE.md            контекст проекта для Claude Code
└── docs/                документация и скриншоты макетов
```

## Лицензия

MIT, см. файл [LICENSE](LICENSE).
