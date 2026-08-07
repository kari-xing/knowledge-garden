import { client, unwrap } from './client';
import type { AuthResult, LoginPayload, RegisterPayload } from '../types';

export async function login(payload: LoginPayload): Promise<AuthResult> {
  return unwrap<AuthResult>(client.post('/auth/login', payload));
}

export async function register(payload: RegisterPayload): Promise<AuthResult> {
  return unwrap<AuthResult>(client.post('/auth/register', payload));
}
