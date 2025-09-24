import { describe, it, expect } from 'vitest';
import { CreateSensorDataSchema, SensorDataSchema } from '@schemas/sensorData.schema';

describe('CreateSensorDataSchema', () => {
  it('accepts valid data', () => {
    expect(() =>
      CreateSensorDataSchema.parse({ temperature: 20, humidity: 50 })
    ).not.toThrow();
  });

  it('rejects temperature below -50', () => {
    expect(() =>
      CreateSensorDataSchema.parse({ temperature: -51, humidity: 50 })
    ).toThrow();
  });

  it('rejects temperature above 50', () => {
    expect(() =>
      CreateSensorDataSchema.parse({ temperature: 51, humidity: 50 })
    ).toThrow();
  });

  it('rejects humidity below 0', () => {
    expect(() =>
      CreateSensorDataSchema.parse({ temperature: 20, humidity: -1 })
    ).toThrow();
  });

  it('rejects humidity above 100', () => {
    expect(() =>
      CreateSensorDataSchema.parse({ temperature: 20, humidity: 101 })
    ).toThrow();
  });

  it('rejects missing temperature', () => {
    expect(() =>
      CreateSensorDataSchema.parse({ humidity: 50 })
    ).toThrow();
  });

  it('rejects missing humidity', () => {
    expect(() =>
      CreateSensorDataSchema.parse({ temperature: 20 })
    ).toThrow();
  });

  it('rejects non-number temperature', () => {
    expect(() =>
      CreateSensorDataSchema.parse({ temperature: "hot", humidity: 50 })
    ).toThrow();
  });

  it('rejects non-number humidity', () => {
    expect(() =>
      CreateSensorDataSchema.parse({ temperature: 20, humidity: "wet" })
    ).toThrow();
  });
});

describe('SensorDataSchema', () => {
  const valid = {
    id: 1,
    temperature: 23.5,
    humidity: 45,
    timestamp: "2023-10-01T12:34:56Z",
    device_id: "123e4567-e89b-12d3-a456-426614174000"
  };

  it('accepts valid data', () => {
    expect(() => SensorDataSchema.parse(valid)).not.toThrow();
  });

  it('rejects invalid UUID', () => {
    const bad = { ...valid, device_id: "not-a-uuid" };
    expect(() => SensorDataSchema.parse(bad)).toThrow();
  });

  it('rejects missing id', () => {
    const { id, ...rest } = valid;
    expect(() => SensorDataSchema.parse(rest)).toThrow();
  });

  it('rejects missing temperature', () => {
    const { temperature, ...rest } = valid;
    expect(() => SensorDataSchema.parse(rest)).toThrow();
  });

  it('rejects missing humidity', () => {
    const { humidity, ...rest } = valid;
    expect(() => SensorDataSchema.parse(rest)).toThrow();
  });

  it('rejects missing timestamp', () => {
    const { timestamp, ...rest } = valid;
    expect(() => SensorDataSchema.parse(rest)).toThrow();
  });

  it('rejects missing device_id', () => {
    const { device_id, ...rest } = valid;
    expect(() => SensorDataSchema.parse(rest)).toThrow();
  });

  it('rejects non-number id', () => {
    const bad = { ...valid, id: "one" };
    expect(() => SensorDataSchema.parse(bad)).toThrow();
  });

  it('rejects non-number temperature', () => {
    const bad = { ...valid, temperature: "hot" };
    expect(() => SensorDataSchema.parse(bad)).toThrow();
  });

  it('rejects non-number humidity', () => {
    const bad = { ...valid, humidity: "wet" };
    expect(() => SensorDataSchema.parse(bad)).toThrow();
  });

  it('rejects non-string timestamp', () => {
    const bad = { ...valid, timestamp: 123456 };
    expect(() => SensorDataSchema.parse(bad)).toThrow();
  });
});
