import { iconFor, isPrecipitation, knownCodes, labelFor, precipKind, skyFor } from '../model/conditions';

describe('коды погоды', () => {
  it('в таблице 28 кодов', () => {
    expect(knownCodes).toHaveLength(28);
  });
  it('ясно: солнце днём, луна ночью', () => {
    expect(iconFor(0, true)).toBe('sun');
    expect(iconFor(0, false)).toBe('moon');
    expect(iconFor(1, false)).toBe('moon');
    expect(skyFor(1)).toBe('clear');
  });
  it('переменная облачность ночью — облако', () => {
    expect(iconFor(2, true)).toBe('partly');
    expect(iconFor(2, false)).toBe('cloud');
    expect(skyFor(2)).toBe('partly');
  });
  it('снег: иконка снега, небо облачное', () => {
    for (const c of [71, 73, 75, 77, 85, 86]) {
      expect(iconFor(c, true)).toBe('snow');
      expect(skyFor(c)).toBe('clouds');
      expect(precipKind(c)).toBe('snow');
    }
  });
  it('дождь и ливни', () => {
    for (const c of [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]) {
      expect(skyFor(c)).toBe('rain');
      expect(iconFor(c, false)).toBe('rain');
      expect(isPrecipitation(c)).toBe(true);
    }
    expect(labelFor(61)).toBe('Небольшой дождь');
  });
  it('гроза', () => {
    for (const c of [95, 96, 99]) {
      expect(skyFor(c)).toBe('storm');
      expect(precipKind(c)).toBe('storm');
    }
  });
  it('туман и облачно без осадков', () => {
    for (const c of [3, 45, 48]) {
      expect(skyFor(c)).toBe('clouds');
      expect(isPrecipitation(c)).toBe(false);
    }
  });
  it('неизвестный код и null', () => {
    for (const c of [42, null, undefined]) {
      expect(labelFor(c)).toBe('Нет данных');
      expect(iconFor(c, true)).toBe('cloud');
      expect(skyFor(c)).toBe('clouds');
      expect(isPrecipitation(c)).toBe(false);
    }
  });
});
