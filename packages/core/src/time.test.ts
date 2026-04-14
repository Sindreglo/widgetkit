import { describe, it, expect } from 'vitest';
import { clamp, timeToPercent, percentToTime, snapToInterval } from './time';

const base = new Date(2024, 3, 13); // April 13

describe('clamp', () => {
  it('clamps below min', () => expect(clamp(-5, 0, 100)).toBe(0));
  it('clamps above max', () => expect(clamp(150, 0, 100)).toBe(100));
  it('passes through in-range value', () => expect(clamp(50, 0, 100)).toBe(50));
});

describe('timeToPercent', () => {
  it('returns 0 at startHour', () => {
    const d = new Date(base); d.setHours(8, 0, 0, 0);
    expect(timeToPercent(d, 8, 18)).toBe(0);
  });
  it('returns 100 at endHour', () => {
    const d = new Date(base); d.setHours(18, 0, 0, 0);
    expect(timeToPercent(d, 8, 18)).toBe(100);
  });
  it('returns 50 at midpoint', () => {
    const d = new Date(base); d.setHours(13, 0, 0, 0);
    expect(timeToPercent(d, 8, 18)).toBe(50);
  });
  it('clamps below 0', () => {
    const d = new Date(base); d.setHours(6, 0, 0, 0);
    expect(timeToPercent(d, 8, 18)).toBe(0);
  });
  it('clamps above 100', () => {
    const d = new Date(base); d.setHours(20, 0, 0, 0);
    expect(timeToPercent(d, 8, 18)).toBe(100);
  });
});

describe('percentToTime', () => {
  it('returns startHour at 0%', () => {
    const result = percentToTime(0, 8, 18, base);
    expect(result.getHours()).toBe(8);
    expect(result.getMinutes()).toBe(0);
  });
  it('returns endHour at 100%', () => {
    const result = percentToTime(100, 8, 18, base);
    expect(result.getHours()).toBe(18);
    expect(result.getMinutes()).toBe(0);
  });
  it('round-trips with timeToPercent', () => {
    const d = new Date(base); d.setHours(10, 30, 0, 0);
    const pct = timeToPercent(d, 8, 18);
    const back = percentToTime(pct, 8, 18, base);
    expect(back.getHours()).toBe(10);
    expect(back.getMinutes()).toBe(30);
  });
});

describe('snapToInterval', () => {
  it('snaps to nearest 15 min', () => {
    const d = new Date(base); d.setHours(9, 7, 0, 0);
    const snapped = snapToInterval(d, 15);
    expect(snapped.getMinutes()).toBe(0);
  });
  it('snaps up when past midpoint', () => {
    const d = new Date(base); d.setHours(9, 8, 0, 0);
    const snapped = snapToInterval(d, 15);
    expect(snapped.getMinutes()).toBe(15);
  });
  it('returns unchanged if interval <= 0', () => {
    const d = new Date(base); d.setHours(9, 7, 0, 0);
    const snapped = snapToInterval(d, 0);
    expect(snapped.getMinutes()).toBe(7);
  });
  it('returns unchanged at exact interval boundary', () => {
    const d = new Date(base); d.setHours(9, 15, 0, 0);
    const snapped = snapToInterval(d, 15);
    expect(snapped.getHours()).toBe(9);
    expect(snapped.getMinutes()).toBe(15);
  });
  it('crosses hour boundary correctly', () => {
    const d = new Date(base); d.setHours(9, 53, 0, 0); // rounds up to 10:00
    const snapped = snapToInterval(d, 15);
    expect(snapped.getHours()).toBe(10);
    expect(snapped.getMinutes()).toBe(0);
  });
});
