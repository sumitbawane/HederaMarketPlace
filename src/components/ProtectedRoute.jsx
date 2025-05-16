import { Navigate } from 'react-router-dom'
import { useUserRole } from '../hooks/useUserRole'

export function ProtectedRoute({ requireRole, children }) {
  const { isSeller,isAdmin, isOwner, loading } = useUserRole()

  if (loading) return <p className="text-center mt-8">Loading…</p>

  if (
    (requireRole === 'admin'  && !isAdmin)  ||
    (requireRole === 'owner'  && !isOwner)  ||
    (requireRole === 'seller' && !isSeller)
  ) {
    return <Navigate to="/" replace />
  }

  return children
}