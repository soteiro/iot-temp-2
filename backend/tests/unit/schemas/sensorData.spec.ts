import { describe, it, expect } from 'vitest';
import { CreateSensorDataSchema } from '@/schemas/sensorData.schema';

describe('CreateSensorDataSchema', () => {
  it('acepta datos válidos', () => {
    const data = { temperature: 23.5, humidity: 45 };
    expect(() => CreateSensorDataSchema.parse(data)).not.toThrow();
  });

  it('rechaza temperatura fuera de rango', () => {
    const bad = { temperature: 100, humidity: 45 };
    expect(() => CreateSensorDataSchema.parse(bad)).toThrow();
  });

  it('rechaza humedad fuera de rango', () => {
    const bad = { temperature: 20, humidity: 200 };
    expect(() => CreateSensorDataSchema.parse(bad)).toThrow();
  });
});
