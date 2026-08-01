import { createContext, useContext, useState, useEffect } from "react"
import api from "@/lib/axios"

const AuthContext = createContext(null)

// Roller obje array veya string array olabilir
function extractRoles(user) {
  if (!user?.roles) return []
  return user.roles.map(r => (typeof r === "string" ? r : r.name))
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token     = localStorage.getItem("token")
    const savedUser = localStorage.getItem("user")

    if (!token) {
      setLoading(false)
      return
    }

    api.defaults.headers.common["Authorization"] = `Bearer ${token}`
    // NOT: Echo/WebSocket token güncellemesi, bildirim sistemini kurduğumuzda
    // buraya eklenecek (bkz. eski projedeki updateEchoToken).

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {}
    }

    api.get("/me")
      .then(res => {
        setUser(res.data.user)
        localStorage.setItem("user", JSON.stringify(res.data.user))
      })
      .catch(err => {
        // Sadece 401 (geçersiz token) ise oturumu kapat.
        // 502, 503, network hatalarında localStorage'daki user kalsın.
        if (err.response?.status === 401) {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          delete api.defaults.headers.common["Authorization"]
          setUser(null)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const login = (token, userData) => {
    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(userData))
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`
    setUser(userData)
  }

  const logout = async () => {
    try { await api.post("/logout") } catch {}
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    delete api.defaults.headers.common["Authorization"]
    setUser(null)
  }

  // Yasal metin tekrar-onayı gibi durumlarda (bkz. LegalReconsentGate.jsx)
  // sunucudaki güncel kullanıcı verisini (özellikle pending_consents) tazeler.
  const refreshUser = async () => {
    try {
      const res = await api.get("/me")
      setUser(res.data.user)
      localStorage.setItem("user", JSON.stringify(res.data.user))
      return res.data.user
    } catch {
      return null
    }
  }

  const roles           = extractRoles(user)
  const isAuthenticated = !!user
  const isAgent         = roles.includes("agent")
  const isBuyer         = roles.includes("buyer")
  const isAdmin         = roles.includes("admin")
  const isPending       = user?.status === "pending"

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout, refreshUser,
      isAuthenticated, isAgent, isBuyer, isAdmin, isPending,
      roles,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
