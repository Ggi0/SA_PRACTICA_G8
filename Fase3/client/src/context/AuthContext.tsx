import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { login as loginService, register as registerService } from '@/services/api/authService'
import type { User, LoginRequest, RegisterRequest } from '@/types'

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  register: (payload: RegisterRequest) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  // Inicializa desde localStorage para que la sesión sobreviva el refresh
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('auth_user')
    return stored ? (JSON.parse(stored) as User) : null
  })

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('auth_token')
  )

  const [isLoading, setIsLoading] = useState(false)

  const login = useCallback(async (credentials: LoginRequest) => {
    setIsLoading(true)
    try {
      const response = await loginService(credentials)
      setUser(response.user)
      setToken(response.token)
      localStorage.setItem('auth_token', response.token)
      localStorage.setItem('auth_user', JSON.stringify(response.user))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (payload: RegisterRequest) => {
    setIsLoading(true)
    try {
      const response = await registerService(payload)
      setUser(response.user)
      setToken(response.token)
      localStorage.setItem('auth_token', response.token)
      localStorage.setItem('auth_user', JSON.stringify(response.user))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!user && !!token, isLoading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return context
}