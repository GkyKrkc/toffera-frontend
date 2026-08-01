import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Package } from "lucide-react"
import Header from "@/components/layout/Header"
import { useAuth } from "@/store/AuthContext"
import api from "@/lib/axios"

// PortfolioDashboard.jsx'in (Genel Bakış — özet kutuları + kategori kartları)
// yerine geçti. Kullanıcı "buna gerek yok, kaldıralım" dedi: /portfolio'ya
// gelen kimse artık ayrı bir özet ekranı GÖRMÜYOR, doğrudan kendi
// kategorisinin zengin listesine (Vasıta/Gayrimenkul) yönlendiriliyor.
//
// Öncelik: vasıta kategorisi varsa /portfolio/vehicle, yoksa gayrimenkul
// kategorisi varsa /portfolio/realestate, o da yoksa ilk (form_component'i
// olmayan) jenerik kategorinin sayfası. Hiç kategori yoksa (ya da API
// hata verirse) sahte bir route'a gitmek yerine burada kısa bir bilgi
// mesajı gösterilir.
export default function PortfolioRedirect() {
    const { isAuthenticated, loading: authLoading } = useAuth()
    const navigate = useNavigate()
    const [noCategories, setNoCategories] = useState(false)

    useEffect(() => {
        if (authLoading) return
        if (!isAuthenticated) { navigate("/"); return }

        api.get("/my-portfolio/available-categories")
            .then(res => {
                const cats = res.data.data || []
                const hasVehicle = cats.some(c => c.form_component === "vehicle")
                const hasRealEstate = cats.some(c => c.form_component === "real_estate")
                const firstGeneric = cats.find(c => !c.form_component)

                if (hasVehicle) navigate("/portfolio/vehicle", { replace: true })
                else if (hasRealEstate) navigate("/portfolio/realestate", { replace: true })
                else if (firstGeneric) navigate(`/portfolio/${firstGeneric.slug}`, { replace: true })
                else setNoCategories(true)
            })
            .catch(() => setNoCategories(true))
    }, [authLoading, isAuthenticated])

    return (
        <div className="min-h-screen bg-gray-200 flex flex-col">
            <Header />
            <div className="flex items-center justify-center flex-1">
                {noCategories ? (
                    <div className="text-center max-w-sm px-4">
                        <div className="w-12 h-12 bg-white border border-gray-200 rounded flex items-center justify-center mx-auto mb-3 text-gray-300 shadow-sm">
                            <Package size={22} />
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kategori Bulunamadı</p>
                        <p className="text-[11px] text-gray-400 font-medium mt-1">
                            Hesap türünüze tanımlı bir portföy kategorisi bulunmuyor. Yönetici ile iletişime geçin.
                        </p>
                    </div>
                ) : (
                    <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                )}
            </div>
        </div>
    )
}
