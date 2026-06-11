import { Link, Outlet, useLocation } from 'react-router-dom'
import { Film, Calendar, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Películas', href: '/admin/movies', icon: Film },
  { label: 'Funciones', href: '/admin/functions', icon: Calendar },
]

export function AdminLayout() {
  const location = useLocation()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-border" style={{ backgroundColor: '#1B1717' }}>
        <div className="p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-6">
            Panel Admin
          </p>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'text-white'
                      : 'text-white/50 hover:text-white/80'
                  )}
                  style={isActive ? { backgroundColor: '#810100' } : {}}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Volver al sitio */}
        <div className="absolute bottom-6 px-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al sitio
          </Link>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  )
}