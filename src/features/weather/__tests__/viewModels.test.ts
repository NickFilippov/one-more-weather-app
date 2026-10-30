import { forecastSchema } from '../schema';
import { mapForecast } from '../model/mapForecast';
import { buildCityCardVM, buildMainVM } from '../model/viewModels';
import { forecastOf, fixtures, rawOf } from '../__fixtures__/helpers';

describe('схема', () => {
  it.each(Object.keys(fixtures) as (keyof typeof fixtures)[])('фикстура %s проходит', (name) => {
    expect(forecastSchema.safeParse(fixtures[name]).success).toBe(true);
  });
  it('без current.temperature_2m — не проходит', () => {
    const bad = structuredClone(fixtures.sochi) as unknown as { current: Record<string, unknown> };
    delete bad.current.temperature_2m;
    expect(forecastSchema.safeParse(bad).success).toBe(false);
  });
});

describe('mapForecast', () => {
  it('переносит ряды и признак дня', () => {
    const { f } = forecastOf('sochi');
    expect(f.hourly).toHaveLength(28);
    expect(f.daily).toHaveLength(10);
    expect(f.current.isDay).toBe(true);
    expect(f.utcOffsetSeconds).toBe(10800);
    expect(f.alerts).toEqual([]);
  });
  it('разная длина параллельных массивов не роняет', () => {
    const raw = rawOf('sochi', (r) => {
      r.hourly.dew_point_2m = r.hourly.dew_point_2m.slice(0, 10);
      r.daily.sunset = r.daily.sunset.slice(0, 4);
    });
    const f = mapForecast(raw, 0);
    expect(f.hourly).toHaveLength(10);
    expect(f.daily).toHaveLength(4);
  });
});

describe('buildMainVM', () => {
  const sochi = { name: 'Сочи' };

  it('собирает ленту: 25 часов, первый — «сейчас»', () => {
    const { f, now } = forecastOf('sochi');
    const vm = buildMainVM(sochi, f, now);
    expect(vm.hours).toHaveLength(25);
    expect(vm.hours[0].now).toBe(true);
    expect(vm.hours[0].time).toBeUndefined();
    expect(vm.hours[1].time).toMatch(/^\d{2}$/);
    expect(vm.hours[0].a11y.startsWith('Сейчас, ')).toBe(true);
  });

  it('страница открыта позже снимка: лента начинается со следующего часа, а не повторяет текущий', () => {
    const { f, now } = forecastOf('sochi');
    const clock = (t: number) => new Date((t + f.utcOffsetSeconds) * 1000).getUTCHours();
    const hourNow = clock(f.current.time);
    const fresh = buildMainVM(sochi, f, now);
    expect(Number(fresh.hours[1].time)).toBe((hourNow + 1) % 24);
    // прошёл час и ещё немного: «сейчас» уехал на час вперёд
    const later = buildMainVM(sochi, f, f.current.time + 3600 + 60);
    expect(Number(later.hours[1].time)).toBe((hourNow + 2) % 24);
    // прогноз приходит на 24 часа вперёд, так что через час в ленте на точку меньше
    expect(later.hours).toHaveLength(fresh.hours.length - 1);
  });

  it('собирает 10 дней, первый — «Сегодня» с точкой «сейчас»', () => {
    const { f, now } = forecastOf('sochi');
    const vm = buildMainVM(sochi, f, now);
    expect(vm.days).toHaveLength(10);
    expect(vm.days[0].day).toBe('Сегодня');
    expect(vm.days[0].now).toBe(vm.hero.temp);
    expect(vm.days[1].now).toBeUndefined();
    expect(vm.dayMin).toBe(Math.min(...vm.days.map((d) => d.low)));
    expect(vm.dayMax).toBe(Math.max(...vm.days.map((d) => d.high)));
  });

  it('текущая температура внутри диапазона дня', () => {
    for (const name of ['moscow', 'sochi', 'tromso'] as const) {
      const { f, now } = forecastOf(name);
      const { hero } = buildMainVM({ name }, f, now);
      expect(hero.high).toBeGreaterThanOrEqual(hero.temp);
      expect(hero.temp).toBeGreaterThanOrEqual(hero.low);
    }
  });

  it('вероятность осадков показывается только когда больше нуля', () => {
    const { f, now } = forecastOf('sochi', (r) => {
      r.hourly.precipitation_probability = r.hourly.precipitation_probability.map((_, i) => (i % 2 ? 0 : 40));
    });
    const vm = buildMainVM(sochi, f, now);
    for (const h of vm.hours) expect(h.pop === undefined || h.pop > 0).toBe(true);
    expect(vm.hours.some((h) => h.pop === 40)).toBe(true);
    for (const d of vm.days) expect(d.pop === undefined || d.pop > 0).toBe(true);
  });

  it('тема и небо по текущей погоде', () => {
    const day = forecastOf('sochi');
    expect(buildMainVM(sochi, day.f, day.now).theme).toBe('day');
    const night = forecastOf('sochi', (r) => {
      r.current.is_day = 0;
      r.current.weather_code = 95;
    });
    const vm = buildMainVM(sochi, night.f, night.now);
    expect(vm.theme).toBe('night');
    expect(vm.sky).toBe('storm');
    expect(vm.hours[0].icon).toBe('storm');
  });

  it('час со значением null пропускается', () => {
    const { f, now } = forecastOf('sochi', (r) => {
      r.hourly.temperature_2m[5] = null;
    });
    expect(buildMainVM(sochi, f, now).hours).toHaveLength(24);
  });

  it('пустой daily: диапазон равен текущей температуре, дней нет', () => {
    const { f, now } = forecastOf('sochi');
    const vm = buildMainVM(sochi, { ...f, daily: [] }, now);
    expect(vm.days).toEqual([]);
    expect(vm.hero.high).toBe(vm.hero.temp);
    expect(vm.hero.low).toBe(vm.hero.temp);
    expect(vm.dayMin).toBe(vm.hero.temp);
  });

  it('−0 превращается в 0, минус типографский в a11y', () => {
    const { f, now } = forecastOf('sochi', (r) => {
      r.current.temperature_2m = -0.3;
      r.hourly.temperature_2m[4] = -3.2;
    });
    const vm = buildMainVM(sochi, f, now);
    expect(vm.hero.temp).toBe(0);
    expect(Object.is(vm.hero.temp, -0)).toBe(false);
    expect(vm.hours[1].a11y).toContain('−3°');
  });

  it('местное время Тромсё (+1 ч) считается по поясу города', () => {
    const { f, now } = forecastOf('tromso');
    const vm = buildMainVM({ name: 'Тромсё' }, f, now);
    expect(f.utcOffsetSeconds).toBe(3600);
    const nowHour = new Date((f.current.time + 3600) * 1000).getUTCHours();
    const nextHour = (nowHour + 1) % 24;
    expect(vm.hours[1].time).toBe(String(nextHour).padStart(2, '0'));
  });
});

describe('buildCityCardVM', () => {
  const moscow = { id: 'geo:524901', name: 'Москва', latitude: 55.75, longitude: 37.62, isCurrentLocation: false };

  it('карточка по прогнозу Москвы: время города, температура, состояние, диапазон', () => {
    const { f, now } = forecastOf('moscow');
    expect(buildCityCardVM(moscow, f, now)).toEqual({
      id: 'geo:524901',
      theme: 'day',
      sky: 'clouds',
      name: 'Москва',
      sub: '10:15',
      temp: '5°',
      label: 'Облачно',
      range: 'Макс. 10° · мин. 3°',
      a11y: 'Москва, 5°, облачно',
    });
  });

  it('время берётся по поясу города и идёт вместе с now', () => {
    const { f, now } = forecastOf('tromso');
    expect(buildCityCardVM({ ...moscow, name: 'Тромсё' }, f, now).sub).toBe('8:15');
    expect(buildCityCardVM({ ...moscow, name: 'Тромсё' }, f, now + 3 * 3600 + 60).sub).toBe('11:16');
  });

  it('местоположение: «Моё местоположение · ЧЧ:ММ»', () => {
    const { f, now } = forecastOf('moscow');
    const here = { ...moscow, id: 'current-location', isCurrentLocation: true };
    expect(buildCityCardVM(here, f, now).sub).toBe('Моё местоположение · 10:15');
    expect(buildCityCardVM(here, undefined, now).sub).toBe('Моё местоположение');
  });

  it('без прогноза: прочерк, «Загрузка…» или «Нет данных», пустой диапазон', () => {
    const loading = buildCityCardVM(moscow, undefined, 0);
    expect(loading).toMatchObject({ temp: '—', label: 'Загрузка…', range: '', sub: '', theme: 'night', sky: 'clouds' });
    expect(loading.a11y).toBe('Москва, загрузка…');
    expect(buildCityCardVM(moscow, undefined, 0, true).label).toBe('Нет данных');
  });
});
