import { Navigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '../../hooks/redux'

export default function AdminRoute() {
  const { user } = useAppSelector(s => s.auth)
  if (user?.role !== 'admin') return <Navigate to="/" replace />
  return <Outlet />
}
