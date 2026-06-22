import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { MainLayout } from '@/components/layout/MainLayout'
import { AdminLayout } from '@/pages/admin/AdminLayout'
import { HomePage } from '@/pages/Homepage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { MovieDetailPage } from '@/pages/MovieDetailPage'
import { SeatsPage } from '@/pages/SeatsPage'
import { CheckoutPage } from '@/pages/Checkoutpage'
import { ConfirmationPage } from '@/pages/ConfirmationPage'
import { NotFoundPage } from '@/pages/NotFoundPage'


import { ReservationsPage } from '@/pages/ReservationsPage'

// admin
import { AdminMoviesPage } from '@/pages/admin/AdminMoviesPage'
import { AdminFunctionsPage } from '@/pages/admin/AdminFunctionsPage'
import { AdminCinemasPage } from '@/pages/admin/AdminCinemasPage'
import { AdminSalasPage } from '@/pages/admin/AdminSalasPage'
import { AdminBulkMoviesPage } from '@/pages/admin/AdminBulkMoviesPage'
import { AdminBoletosPage } from '@/pages/admin/AdminBoletosPage'

import { HistorialPage } from '@/pages/HistorialPage'


// Protege rutas que requieren login
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

// Protege rutas que requieren rol ADMIN
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />
  return <>{children}</>
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Rutas principales con Navbar y Footer */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
                <Route path="/historial" element={<HistorialPage />} />

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

        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Rutas de admin con su propio layout */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<Navigate to="/admin/movies" replace />} />
        <Route path="movies" element={<AdminMoviesPage />} />
        <Route path="functions" element={<AdminFunctionsPage />} />
        <Route path="salas" element={<AdminSalasPage />} />
        <Route path="cines" element={<AdminCinemasPage />} />
        <Route path="movies/bulk" element={<AdminBulkMoviesPage />} />
        <Route path="boletos" element={<AdminBoletosPage />} />
      </Route>


<Route
  path="/reservations"
  element={
    <ProtectedRoute>
      <ReservationsPage />
    </ProtectedRoute>
  }
/>

    </Routes>
  )
}