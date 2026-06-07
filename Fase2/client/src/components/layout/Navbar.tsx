import { Link, useNavigate } from 'react-router-dom'
import { Film, LogOut, User, ChevronDown, Settings } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown_menu'

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border backdrop-blur"
      style={{ backgroundColor: '#1B1717' }}>
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">

        {/* Marca */}
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white">
          <Film className="h-5 w-5" style={{ color: '#810100' }} />
          <span style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>CineMax</span>
        </Link>

        {/* Acciones */}
        <nav className="flex items-center gap-3">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-3 text-white hover:bg-white/10 hover:text-white">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: '#810100' }}>
                    <User className="h-4 w-4" />
                  </div>
                  <span className="hidden font-medium md:inline">{user?.name}</span>
                  {user?.role === 'ADMIN' && (
                    <Badge variant="secondary" className="hidden text-xs md:inline-flex">
                      Admin
                    </Badge>
                  )}
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                  {user?.role === 'ADMIN' && (
                    <DropdownMenuItem
                      onClick={() => navigate('/admin')}
                      className="cursor-pointer"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Panel Admin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar sesión
                  </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild className="text-white hover:bg-white/10 hover:text-white">
                <Link to="/login">Iniciar sesión</Link>
              </Button>
              <Button asChild style={{ backgroundColor: '#810100' }} className="hover:opacity-90">
                <Link to="/register">Registrarse</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}