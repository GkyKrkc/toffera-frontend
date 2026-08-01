// ─────────────────────────────────────────────────────────────
// RequireAuth.jsx
// Özel (login gerektiren) sayfalar için merkezi route koruması.
// App.jsx'te tek bir üst Route olarak sarılır:
//   <Route element={<RequireAuth />}>
//       <Route path="/dashboard" element={<DashboardPage />} />
//       ...
//   </Route>
// react-router-dom v6 <Outlet/> ile çocuk route'u render eder.
//
// AuthContext henüz "loading" aşamasındayken (localStorage'daki
// token doğrulanırken /me isteği dönene kadar) hiçbir redirect
// yapılmaz — aksi halde sayfa yenilendiğinde login olmuş bir
// kullanıcı bile bir anlığına login'e atılabilirdi. loading bitip
// isAuthenticated hâlâ false ise, geldiği sayfayı hatırlayarak
// /login'e yönlendirilir (login sonrası oraya dönebilsin diye).
// ─────────────────────────────────────────────────────────────
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/store/AuthContext"
import Header from "@/components/layout/Header"

export default function RequireAuth() {
    const { isAuthenticated, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-200 flex flex-col">
                <Header />
                <div className="flex items-center justify-center flex-1">
                    <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />
    }

    return <Outlet />
}
