import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { MainLayout } from '@/components/layout/MainLayout'
import { HomePage } from '@/pages/Homepage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { MovieDetailPage } from '@/pages/MovieDetailPage'
import { SeatsPage } from '@/pages/SeatsPage'
import { CheckoutPage } from '@/pages/Checkoutpage'
import { ConfirmationPage } from '@/pages/ConfirmationPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

// Wrapper que protege rutas — redirige a /login si no está autenticado
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Rutas públicas */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Rutas protegidas */}
        <Route path="/movies/:movieId" element={
          <ProtectedRoute><MovieDetailPage /></ProtectedRoute>
        } />
        <Route path="/showtimes/:showtimeId/seats" element={
          <ProtectedRoute><SeatsPage /></ProtectedRoute>
        } />
        <Route path="/checkout" element={
          <ProtectedRoute><CheckoutPage /></ProtectedRoute>
        } />
        <Route path="/confirmation" element={
          <ProtectedRoute><ConfirmationPage /></ProtectedRoute>
        } />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}