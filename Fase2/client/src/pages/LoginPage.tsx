import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Film } from 'lucide-react'
import { LoginForm } from '@/components/auth/LoginForm'
import { useAuth } from '@/context/AuthContext'

export function LoginPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true })
  }, [isAuthenticated, navigate])

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Film className="mx-auto h-8 w-8 text-primary" />
          <h1 className="mt-2 text-2xl font-bold" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
            CineMax
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Inicia sesión para continuar</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}