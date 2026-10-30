import { buildTiles } from '../model/tiles';
import { forecastOf } from '../__fixtures__/helpers';
import type { RawForecast } from '../schema';

const keys = (patch?: (r: RawForecast) => void, name: 'sochi' | 'moscow' | 'tromso' = 'sochi') => {
  const { f, now } = forecastOf(name, patch);
  return buildTiles(f, now);
};

describe('набор плиток', () => {
  it('днём: ощущается как, ветер, влажность, закат', () => {
    const tiles = keys((r) => {
      r.current.weather_code = 2;
      r.current.is_day = 1;
      r.hourly.precipitation = r.hourly.precipitation.map(() => 0);
    });
    expect(tiles.map((t) => t.key)).toEqual(['feelsLike', 'wind', 'humidity', 'sunset']);
  });

  it('ночью: восход, влажность, ощущается как, ветер', () => {
    const tiles = keys((r) => {
      r.current.weather_code = 0;
      r.current.is_day = 0;
      r.hourly.precipitation = r.hourly.precipitation.map(() => 0);
    });
    expect(tiles.map((t) => t.key)).toEqual(['sunrise', 'humidity', 'feelsLike', 'wind']);
  });

  it('в дождь и грозу: осадки, ветер, ощущается как, влажность', () => {
    for (const code of [61, 95]) {
      const tiles = keys((r) => {
        r.current.weather_code = code;
      });
      expect(tiles.map((t) => t.key)).toEqual(['precipitation', 'wind', 'feelsLike', 'humidity']);
    }
  });

  it('осадки за прошедшие 3 часа переключают набор на дождевой', () => {
    const tiles = keys((r) => {
      r.current.weather_code = 3;
      r.hourly.precipitation[1] = 1.2;
    });
    expect(tiles[0].key).toBe('precipitation');
    expect(tiles[0].value).toBe('1,2');
    expect(tiles[0].unit).toBe('мм');
  });

  it('плитка без данных пропускается, добавляется следующая', () => {
    const tiles = keys((r) => {
      r.current.weather_code = 2;
      r.hourly.precipitation = r.hourly.precipitation.map(() => 0);
      r.current.relative_humidity_2m = null;
    });
    expect(tiles).toHaveLength(4);
    expect(tiles.map((t) => t.key)).toEqual(['feelsLike', 'wind', 'sunset', 'precipitation']);
  });
});

describe('пояснения', () => {
  const dayCalm = (patch: (r: RawForecast) => void) =>
    keys((r) => {
      r.current.weather_code = 2;
      r.hourly.precipitation = r.hourly.precipitation.map(() => 0);
      patch(r);
    });
  const tile = (tiles: ReturnType<typeof keys>, key: string) => tiles.find((t) => t.key === key)!;

  it('ощущается как: ветер, влажность, без разницы', () => {
    expect(tile(dayCalm((r) => { r.current.temperature_2m = 8; r.current.apparent_temperature = 5; r.current.wind_speed_10m = 6; }), 'feelsLike').note)
      .toBe('Из-за ветра кажется холоднее.');
    expect(tile(dayCalm((r) => { r.current.temperature_2m = 8; r.current.apparent_temperature = 5; r.current.wind_speed_10m = 1; }), 'feelsLike').note)
      .toBe('Кажется холоднее, чем на самом деле.');
    expect(tile(dayCalm((r) => { r.current.temperature_2m = 20; r.current.apparent_temperature = 23; r.current.relative_humidity_2m = 70; }), 'feelsLike').note)
      .toBe('Из-за влажности кажется теплее.');
    expect(tile(dayCalm((r) => { r.current.temperature_2m = 20; r.current.apparent_temperature = 23; r.current.relative_humidity_2m = 30; }), 'feelsLike').note)
      .toBe('Кажется теплее, чем на самом деле.');
    expect(tile(dayCalm((r) => { r.current.temperature_2m = 20; r.current.apparent_temperature = 21; }), 'feelsLike').note)
      .toBe('Примерно как на самом деле.');
  });

  it('ветер: направление, порывы, штиль', () => {
    const w = tile(dayCalm((r) => { r.current.wind_speed_10m = 6.4; r.current.wind_direction_10m = 315; r.current.wind_gusts_10m = 11; }), 'wind');
    expect(w.value).toBe('6');
    expect(w.unit).toBe('м/с');
    expect(w.note).toBe('Северо-западный, порывы до\u00A011\u00A0м/с.');
    expect(tile(dayCalm((r) => { r.current.wind_speed_10m = 3; r.current.wind_direction_10m = 0; r.current.wind_gusts_10m = 3; }), 'wind').note)
      .toBe('Северный.');
    const calm = tile(dayCalm((r) => { r.current.wind_speed_10m = 0.2; }), 'wind');
    expect(calm.value).toBe('0');
    expect(calm.note).toBe('Штиль.');
  });

  it('влажность: точка росы', () => {
    const h = tile(dayCalm((r) => { r.current.relative_humidity_2m = 86; r.hourly.dew_point_2m = r.hourly.dew_point_2m.map(() => 1.2); }), 'humidity');
    expect(h.value).toBe('86%');
    expect(h.note).toBe('Точка росы 1°.');
  });

  it('осадки: сумма за 3 часа и следующие 12', () => {
    const tiles = keys((r) => {
      r.current.weather_code = 95;
      r.hourly.precipitation = r.hourly.precipitation.map(() => 0);
      r.hourly.precipitation[0] = 6; r.hourly.precipitation[1] = 6; r.hourly.precipitation[2] = 6;
      r.hourly.precipitation[4] = 3; r.hourly.precipitation[5] = 6;
    });
    const p = tile(tiles, 'precipitation');
    expect(p.value).toBe('18');
    expect(p.note).toBe('За 3 часа. Ещё 9\u00A0мм за 12\u00A0часов.');
    const dry = tile(keys((r) => { r.current.weather_code = 95; r.hourly.precipitation = r.hourly.precipitation.map(() => 0); }), 'precipitation');
    expect(dry.note).toBe('За 3 часа. Дальше без осадков.');
  });

  it('закат и восход: ближайшие, с подписью следующего события', () => {
    const day = dayCalm(() => {});
    const sunset = tile(day, 'sunset');
    expect(sunset.value).toMatch(/^\d{1,2}:\d{2}$/);
    expect(sunset.note).toMatch(/^Восход в \d{1,2}:\d{2}\.$/);
    const night = keys((r) => { r.current.is_day = 0; r.current.weather_code = 0; r.hourly.precipitation = r.hourly.precipitation.map(() => 0); });
    expect(tile(night, 'sunrise').note).toMatch(/^Закат в \d{1,2}:\d{2}\.$/);
  });

  it('полярная ночь и день: прочерк и пояснение', () => {
    const polarNight = keys((r) => {
      r.current.is_day = 0; r.current.weather_code = 0;
      r.hourly.precipitation = r.hourly.precipitation.map(() => 0);
      r.daily.sunrise = r.daily.sunrise.map(() => null);
      r.daily.sunset = r.daily.sunset.map(() => null);
    }, 'tromso');
    expect(tile(polarNight, 'sunrise')).toMatchObject({ value: '—', note: 'Полярная ночь.' });
    const polarDay = keys((r) => {
      r.current.is_day = 1; r.current.weather_code = 0;
      r.hourly.precipitation = r.hourly.precipitation.map(() => 0);
      r.daily.sunrise = r.daily.sunrise.map(() => null);
      r.daily.sunset = r.daily.sunset.map(() => null);
    }, 'tromso');
    expect(tile(polarDay, 'sunset')).toMatchObject({ value: '—', note: 'Полярный день.' });
  });
});
