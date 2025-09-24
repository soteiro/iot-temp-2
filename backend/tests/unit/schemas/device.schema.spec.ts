import { describe, it, expect } from 'vitest';
import { CreateDeviceSchema, DeviceSchema, CreateDeviceResponseSchema, ErrorResponseSchema } from '@/schemas/devices.schema';

describe('CreateDeviceSchema', ()=>{
    it('acepta datos válidos', ()=>{
        const data = { name: 'Living Room Sensor' };
        expect(() => CreateDeviceSchema.parse(data)).not.toThrow();
    });

    it('rechaza nombre length < 2', ()=>{
        const bad = { name: 'A' };
        expect(() => CreateDeviceSchema.parse(bad)).toThrow();
    });

    it('rechaza nombre length > 50', ()=>{
        const bad = { name: 'A'.repeat(51) };
        expect(() => CreateDeviceSchema.parse(bad)).toThrow();
    });
})

describe('DeviceSchema', ()=>{
    const validSchema = {
        device_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Living Room Sensor',
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        api_key: '1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p',
        is_active: true,
        created_at: '2023-10-01T12:34:56Z',
        updated_at: '2023-10-01T12:34:56Z',
    };

    it('acepta datos validos', () =>{
        try{
            DeviceSchema.parse(validSchema);
        } catch(e){
            console.error(e);
            throw e;
        }

        expect(()=> DeviceSchema.parse(validSchema)).not.toThrow();
    });
    it('rechaza device_id inválido', () =>{
        const bad = { ...validSchema, device_id: 'invalid-uuid' };
        expect(()=> DeviceSchema.parse(bad)).toThrow();
    });
    it('rechaza user_id inválido', () =>{
        const bad = { ...validSchema, user_id: 'invalid-uuid' };
        expect(()=> DeviceSchema.parse(bad)).toThrow();
    });
    it('rechaza created_at inválido', () =>{
        const bad = { ...validSchema, created_at: 'invalid-date' };
        expect(()=> DeviceSchema.parse(bad)).toThrow();
    });
    it('rechaza updated_at inválido', () =>{
        const bad = { ...validSchema, updated_at: 'invalid-date' };
        expect(()=> DeviceSchema.parse(bad)).toThrow();
    });
    it('rechaza is_active no booleano', () =>{
        const bad = { ...validSchema, is_active: 'yes' };
        expect(()=> DeviceSchema.parse(bad)).toThrow();
    });
    it('rechaza api_key no string', () =>{
        const bad = { ...validSchema, api_key: 12345 };
        expect(()=> DeviceSchema.parse(bad)).toThrow();
    });

});

describe('CreateDeviceResponseSchema', ()=>{
    const validResponse = {
        device: {
            device_id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Living Room Sensor',
            user_id: '123e4567-e89b-12d3-a456-426614174000',
            api_key: '1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p',
            is_active: true,
            created_at: '2023-10-01T12:34:56Z',
            updated_at: '2023-10-01T12:34:56Z',
            api_secret: 'abcdef1234567890abcdef1234567890'
        }
    };

    it('acepta datos válidos', ()=>{
        expect(()=> CreateDeviceResponseSchema.parse(validResponse)).not.toThrow();
    });

    it('rechaza si falta api_secret', ()=>{
        const bad = { device: { ...validResponse.device } } as any;
        delete bad.device.api_secret;
        expect(()=> CreateDeviceResponseSchema.parse(bad)).toThrow();
    });

    it('rechaza si device_id es inválido', ()=>{
        const bad = { device: { ...validResponse.device, device_id: 'invalid-uuid' } };
        expect(()=> CreateDeviceResponseSchema.parse(bad)).toThrow();
    });
});

describe('ErrorResponseSchema', ()=>{
    it('acepta error string', () => {
        expect(() => ErrorResponseSchema.parse({ error: 'Error' })).not.toThrow();
    });
    it('rechaza si falta error', () => {
        expect(() => ErrorResponseSchema.parse({})).toThrow();
    });
    it('rechaza si error no es string', () => {
        expect(() => ErrorResponseSchema.parse({ error: 123 })).toThrow();
        expect(() => ErrorResponseSchema.parse({ error: null })).toThrow();
    });
});