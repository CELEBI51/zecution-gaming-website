import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('login') // 'login' | 'register'

  useEffect(() => {
    let isMounted = true

    async function checkUser() {
      try {
        const token = typeof localStorage !== 'undefined' ? localStorage.getItem('zecution_user_token') : null
        if (!token) {
          if (isMounted) {
            setUser(null)
            setLoading(false)
          }
          return
        }

        const userData = await api.getMeUser()
        if (isMounted) {
          setUser(userData)
        }
      } catch {
        if (isMounted) {
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    checkUser()

    return () => {
      isMounted = false
    }
  }, [])

  const login = async (emailOrUsername, password) => {
    const data = await api.loginUser({ emailOrUsername, password })
    if (data?.user) {
      setUser(data.user)
      setIsModalOpen(false)
    }
    return data
  }

  const register = async (username, email, password) => {
    const data = await api.registerUser({ username, email, password })
    if (data?.user) {
      setUser(data.user)
      setIsModalOpen(false)
    }
    return data
  }

  const logout = async () => {
    try {
      await api.logoutUser()
    } finally {
      setUser(null)
    }
  }

  const openAuthModal = (mode = 'login') => {
    setModalMode(mode)
    setIsModalOpen(true)
  }

  const closeAuthModal = () => {
    setIsModalOpen(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isModalOpen,
        modalMode,
        setModalMode,
        login,
        register,
        logout,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth, AuthProvider içerisinde kullanılmalıdır.')
  }
  return context
}
