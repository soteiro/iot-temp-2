import { describe, it, expect } from 'vitest';
import { celsiusToFahrenheit } from '@/lib/math';

describe('celsiusToFahrenheit', () => {
  it('convierte 0°C a 32°F', () => {
    expect(celsiusToFahrenheit(0)).toBe(32);
  });

  it('convierte 100°C a 212°F', () => {
    expect(celsiusToFahrenheit(100)).toBe(212);
  });
});
