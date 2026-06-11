import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'

export function RegisterForm() {
  const navigate = useNavigate()
  const { register, isLoading } = useAuth()

  const [fields, setFields] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  const validate = (): string | null => {
    if (fields.name.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres'
    if (!fields.email.includes('@')) return 'Ingresa un correo válido'
    if (fields.password.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
    if (fields.password !== fields.confirm) return 'Las contraseñas no coinciden'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    try {
      await register({ name: fields.name, email: fields.email, password: fields.password })
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nombre completo</Label>
        <Input id="name" name="name" placeholder="Ana García" value={fields.name} onChange={handleChange} disabled={isLoading} required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input id="email" name="email" type="email" placeholder="tu@email.com" value={fields.email} onChange={handleChange} disabled={isLoading} required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <div className="relative">
          <Input
            id="password" name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Mínimo 8 caracteres"
            value={fields.password} onChange={handleChange}
            disabled={isLoading} required
          />
          <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirm">Confirmar contraseña</Label>
        <Input id="confirm" name="confirm" type={showPassword ? 'text' : 'password'} placeholder="Repite tu contraseña" value={fields.confirm} onChange={handleChange} disabled={isLoading} required />
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Crear cuenta
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="text-primary hover:underline">Inicia sesión</Link>
      </p>
    </form>
  )
}