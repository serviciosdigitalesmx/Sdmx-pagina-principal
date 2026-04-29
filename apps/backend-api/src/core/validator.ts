export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

const isObject = (value: unknown): value is object => typeof value === 'object' && value !== null;
const isEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const getField = (value: object, key: string): unknown => (value as Record<string, unknown>)[key];

export const validators = {
  login(payload: unknown): { email: string; password: string } {
    if (!isObject(payload)) throw new ValidationError('Payload inválido');
    const email = String(getField(payload, 'email') ?? '');
    const password = String(getField(payload, 'password') ?? '');
    if (!isEmail(email) || password.length < 8) throw new ValidationError('email o password inválidos');
    return { email, password };
  },

  forgot(payload: unknown): { email: string } {
    if (!isObject(payload)) throw new ValidationError('Payload inválido');
    const email = String(getField(payload, 'email') ?? '');
    if (!isEmail(email)) throw new ValidationError('email inválido');
    return { email };
  }
};
