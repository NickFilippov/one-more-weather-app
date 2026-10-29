/** Дата, у которой UTC-поля равны местному времени города. Читать только getUTC*. */
export function cityClock(unixSeconds: number, utcOffsetSeconds: number): Date {
  return new Date((unixSeconds + utcOffsetSeconds) * 1000);
}

export const nowSeconds = (): number => Math.floor(Date.now() / 1000);
