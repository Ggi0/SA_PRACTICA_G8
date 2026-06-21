import axios from 'axios'
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

const api = axios.create({ baseURL: API_BASE })

// Mapeo backend → frontend
function mapBackendUser(u: {
  id: string
  nombre: string
  email: string
  rol: string
}): User {
  return {
    id: u.id,
    name: u.nombre,
    email: u.email,
    role: u.rol === 'admin' ? 'ADMIN' : 'USER',
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const { data } = await api.post<{
    access_token: string
    user: { id: string; nombre: string; email: string; rol: string }
  }>('/api/auth/login', credentials)

  return {
    token: data.access_token,
    user: mapBackendUser(data.user),
  }
}

// ─── Registro ─────────────────────────────────────────────────────────────────
export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  // El backend espera "nombre", el frontend usa "name"
  const { data } = await api.post<{
    access_token: string
    user: { id: string; nombre: string; email: string; rol: string }
  }>('/api/auth/register', {
    nombre: payload.name,
    email: payload.email,
    password: payload.password,
  })

  return {
    token: data.access_token,
    user: mapBackendUser(data.user),
  }
}

// ─── Decodificar token ────────────────────────────────────────────────────────
export function decodeToken(token: string): User | null {
  try {
    const payloadBase64 = token.split('.')[1]
    const decoded = JSON.parse(atob(payloadBase64))
    return {
      id: decoded.sub,
      name: decoded.nombre ?? decoded.name ?? '',
      email: decoded.email ?? '',
      role: decoded.rol === 'admin' ? 'ADMIN' : 'USER',
    }
  } catch {
    return null
  }
}
