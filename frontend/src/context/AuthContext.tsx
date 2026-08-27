import React, { createContext, useContext, useState, useEffect } from 'react'
import { STORAGE_KEY_EMAIL } from '../api/client'

interface AuthContextType {
  userEmail: string | null
  login: (email: string) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_EMAIL) || null
  })

  useEffect(() => {
    if (userEmail) {
      localStorage.setItem(STORAGE_KEY_EMAIL, userEmail)
    } else {
      localStorage.removeItem(STORAGE_KEY_EMAIL)
    }
  }, [userEmail])

  const login = (email: string) => {
    const trimmed = email.trim().toLowerCase()
    setUserEmail(trimmed)
  }

  const logout = () => {
    setUserEmail(null)
  }

  return (
    <AuthContext.Provider
      value={{
        userEmail,
        login,
        logout,
        isAuthenticated: !!userEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
