import { useContext } from 'react'
import { AuthContext } from './AuthContext'

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}

export function useOptionalAuth() {
  return useContext(AuthContext)
}
