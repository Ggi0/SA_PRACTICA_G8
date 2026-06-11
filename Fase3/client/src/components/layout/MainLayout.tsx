
import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { Toaster } from '@/components/ui/toaster'

export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      {/* El Outlet renderiza la página actual */}
      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />

      {/* Notificaciones globales */}
      <Toaster />
    </div>
  )
}