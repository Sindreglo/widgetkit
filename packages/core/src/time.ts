export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function timeToPercent(date: Date, startHour: number, endHour: number): number {
  const totalMinutes = (endHour - startHour) * 60;
  const elapsed = (date.getHours() - startHour) * 60 + date.getMinutes();
  return clamp((elapsed / totalMinutes) * 100, 0, 100);
}

export function percentToTime(
  percent: number,
  startHour: number,
  endHour: number,
  baseDate: Date,
): Date {
  const totalMinutes = (endHour - startHour) * 60;
  const elapsed = (clamp(percent, 0, 100) / 100) * totalMinutes;
  const result = new Date(baseDate);
  result.setHours(startHour, 0, 0, 0);
  result.setMinutes(result.getMinutes() + Math.round(elapsed));
  return result;
}

export function snapToInterval(date: Date, minutes: number): Date {
  if (minutes <= 0) return new Date(date);
  const result = new Date(date);
  const totalMinutes = result.getHours() * 60 + result.getMinutes();
  const snapped = Math.min(Math.round(totalMinutes / minutes) * minutes, 1439);
  result.setHours(Math.floor(snapped / 60), snapped % 60, 0, 0);
  return result;
}
