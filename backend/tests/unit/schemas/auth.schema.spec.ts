import { describe, it, expect } from "vitest";
import { 
    UserSchema,
    RegisterSchema,
    LoginSchema,
    LoginResponseSchema,
    RefreshTokenSchema,
    TokenResponseSchema,
    ErrorSchema
 } from "@/schemas/auth.schemas"; 

describe("UserSchema", () => {
    const validUser = {
        user_id: "123e4567-e89b-12d3-a456-426614174000",
        name: "Jane Doe",
        email: "jane.doe@example.com"
    }
    it("accepts valid user data", () => {
        expect(() => UserSchema.parse(validUser)).not.toThrow();
    });
    it('reject invalid UUID', () => {
        const bad = { ...validUser, user_id: "not-a-uuid" };
        expect(() => UserSchema.parse(bad)).toThrow();
    });
    it("rejects missing name", () => {
        const { name, ...rest } = validUser;
        expect(() => UserSchema.parse(rest)).toThrow();
    });
    it('rejects missing email', () => {
        const { email, ...rest } = validUser;
        expect(() => UserSchema.parse(rest)).toThrow();
    });
    it('rejects invalid email', () => {
        const bad = { ...validUser, email: "not-an-email" };
        expect(() => UserSchema.parse(bad)).toThrow();
    });
    it('rejects lenghth name < 2', () => {
        const bad = { ...validUser, name: "J" };
        expect(() => UserSchema.parse(bad)).toThrow();
    });
    it('rejects lenghth name > 100', () => {
        const bad = { ...validUser, name: "J".repeat(101) };
        expect(() => UserSchema.parse(bad)).toThrow();
    });


});

describe("RegisterSchema", () => {
    const validRegister = {
        name: "Jane Doe",
        email: "jane.doe@example.com",
        password: "password123"
    };
    it("accepts valid registration data", () => {
        expect(() => RegisterSchema.parse(validRegister)).not.toThrow();
    });
    it("rejects missing name", () => {
        const { name, ...rest } = validRegister;
        expect(() => RegisterSchema.parse(rest)).toThrow();
    });
    it("rejects missing email", () => {
        const { email, ...rest } = validRegister;
        expect(() => RegisterSchema.parse(rest)).toThrow();
    });
    it("rejects missing password", () => {
        const { password, ...rest } = validRegister;
        expect(() => RegisterSchema.parse(rest)).toThrow();
    });
    it("rejects invalid email", () => {
        const bad = { ...validRegister, email: "not-an-email" };
        expect(() => RegisterSchema.parse(bad)).toThrow();
    });
    it("rejects short password", () => {
        const bad = { ...validRegister, password: "short" };
        expect(() => RegisterSchema.parse(bad)).toThrow();
    });
    it('rejects lenghth name < 2', () => {
        const bad = { ...validRegister, name: "J" };
        expect(() => RegisterSchema.parse(bad)).toThrow();
    });
    it('rejects lenghth name > 100', () => {
        const bad = { ...validRegister, name: "J".repeat(101) };
        expect(() => RegisterSchema.parse(bad)).toThrow();
    });
});

describe("LoginSchema", () => {
    const validLogin = {
        email: "jane.doe@example.com",
        password: "password123"
    };
    it("accepts valid login data", () => {
        expect(() => LoginSchema.parse(validLogin)).not.toThrow();
    });
    it("rejects missing email", () => {
        const { email, ...rest } = validLogin;
        expect(() => LoginSchema.parse(rest)).toThrow();
    });
    it("rejects missing password", () => {
        const { password, ...rest } = validLogin;
        expect(() => LoginSchema.parse(rest)).toThrow();
    });
    it("rejects invalid email", () => {
        const bad = { ...validLogin, email: "not-an-email" };
        expect(() => LoginSchema.parse(bad)).toThrow();
    });
});

describe('loginResponseSchema', ()=>{
    const validResponse = {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
            user_id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Jane Doe',
            email: 'jane.doe@example.com'
        }
    };
    
    it('accepts valid login response data', () => {
        expect(() => LoginResponseSchema.parse(validResponse)).not.toThrow();
    });
    it('rejects missing token', () => {
        const { token, ...rest } = validResponse;
        expect(() => LoginResponseSchema.parse(rest)).toThrow();
    });
    it('rejects missing refreshToken', () => {
        const { refreshToken, ...rest } = validResponse;
        expect(() => LoginResponseSchema.parse(rest)).toThrow();
    });
    it('rejects missing user', () => {
        const { user, ...rest } = validResponse;
        expect(() => LoginResponseSchema.parse(rest)).toThrow();
    });
    it('rejects invalid user_id', () => {
        const bad = { ...validResponse, user: { ...validResponse.user, user_id: "not-a-uuid" } };
        expect(() => LoginResponseSchema.parse(bad)).toThrow();
    });
    it('rejects invalid email', () => {
        const bad = { ...validResponse, user: { ...validResponse.user, email: "not-an-email" } };
        expect(() => LoginResponseSchema.parse(bad)).toThrow();
    });
});

describe('RefreshTokenSchema', ()=>{
    const validResponse = {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
            user_id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Jane Doe',
            email: 'jane.doe@example.com'
        }
    };
    it('accepts valid refresh token data', () => {
        expect(() => RefreshTokenSchema.parse({ refreshToken: validResponse.refreshToken })).not.toThrow();
    });
    it('rejects missing refreshToken', () => {
        expect(() => RefreshTokenSchema.parse({})).toThrow();
    });
    it('rejects non-string refreshToken', () => {
        expect(() => RefreshTokenSchema.parse({ refreshToken: 12345 })).toThrow();
    });

});

describe('TokenResponseSchema', ()=>{
    const validResponse = {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
            user_id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Jane Doe',
            email: 'jane.doe@example.com'
        }
    };
    it('accepts valid token response data', () => {
        expect(() => TokenResponseSchema.parse({ token: validResponse.token })).not.toThrow();
    });
    it('rejects missing token', () => {
        expect(() => TokenResponseSchema.parse({})).toThrow();
    });
    it('rejects non-string token', () => {
        expect(() => TokenResponseSchema.parse({ token: 12345 })).toThrow();
    });
});

describe('ErrorSchema', ()=>{
    const validError = {
        error: 'Error message content'
    };
    it('accepts valid error data', () => {
        expect(() => ErrorSchema.parse(validError)).not.toThrow();
    });
    it('rejects missing error', () => {
        const { error, ...rest } = validError;
        expect(() => ErrorSchema.parse(rest)).toThrow();
    });
    it('rejects non-string error', () => {
        expect(() => ErrorSchema.parse({ error: 12345 })).toThrow();
    });
});