import type { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types'
import { MOCK_USERS } from '@/services/mock/mockData'

// Simula delay de red para que la UI se sienta realista
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// ─── Login ────────────────────────────────────────────────────────────────────
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  await delay(600)

  const user = MOCK_USERS.find((u) => u.email === credentials.email)
  if (!user || credentials.password.length < 4) {
    throw new Error('Credenciales inválidas')
  }

  // JWT simulado — solo para desarrollo, la validación real es en el backend
  const fakePayload = btoa(JSON.stringify({ sub: user.id, name: user.name, role: user.role }))
  const fakeToken = `header.${fakePayload}.signature`

  return { token: fakeToken, user }
}

// ─── Registro ─────────────────────────────────────────────────────────────────
export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  await delay(800)

  const exists = MOCK_USERS.find((u) => u.email === payload.email)
  if (exists) throw new Error('El correo ya está registrado')

  const newUser: User = {
    id: `u${Date.now()}`,
    name: payload.name,
    email: payload.email,
    role: 'USER',
  }

  const fakePayload = btoa(JSON.stringify({ sub: newUser.id, name: newUser.name, role: newUser.role }))
  const fakeToken = `header.${fakePayload}.signature`

  return { token: fakeToken, user: newUser }
}

// ─── Decodificar token (solo para UI, la verificación real es en el backend) ──
export function decodeToken(token: string): User | null {
  try {
    const payloadBase64 = token.split('.')[1]
    const decoded = JSON.parse(atob(payloadBase64))
    return {
      id: decoded.sub,
      name: decoded.name,
      email: decoded.email ?? '',
      role: decoded.role,
    }
  } catch {
    return null
  }
}