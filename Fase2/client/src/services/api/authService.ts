import type { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types'
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
})

// ─── Login ────────────────────────────────────────────────────────────────────
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const { data } = await api.post('/api/auth/login', credentials)

  return {
    token: data.access_token,   // el backend usa access_token
    user: {
      id: data.user.id,
      name: data.user.nombre,   // el backend usa nombre
      email: data.user.email,
      role: data.user.rol === 'admin' ? 'ADMIN' : 'USER',
    },
  }
}

// ─── Registro ─────────────────────────────────────────────────────────────────
export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  const { data } = await api.post('/api/auth/register', {
    nombre: payload.name,
    email: payload.email,
    password: payload.password,
  })

  return {
    token: data.access_token,
    user: {
      id: data.user.id,
      name: data.user.nombre,
      email: data.user.email,
      role: data.user.rol === 'admin' ? 'ADMIN' : 'USER',
    },
  }
}

// ─── Decodificar token ────────────────────────────────────────────────────────
export function decodeToken(token: string): User | null {
  try {
    const payloadBase64 = token.split('.')[1]
    const decoded = JSON.parse(atob(payloadBase64))
    return {
      id: decoded.sub,
      name: decoded.nombre ?? decoded.name,
      email: decoded.email ?? '',
      role: decoded.rol === 'admin' ? 'ADMIN' : 'USER',
    }
  } catch {
    return null
  }
}