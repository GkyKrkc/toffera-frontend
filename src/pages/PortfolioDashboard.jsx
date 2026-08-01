import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import * as Icons from "lucide-react"
import {
    Plus, Package, ChevronRight, BarChart2, ShieldCheck,
    TrendingUp, CheckCircle2, Layers,
} from "lucide-react"
import Header from "@/components/layout/Header"
import PortfolioSidebar from "@/components/portfolio/PortfolioSidebar"
import { useAuth } from "@/store/AuthContext"
import api from "@/lib/axios"

// Kategori kartlarına döngüsel olarak atanan renk paleti — kategori sayısı
// admin panelden dinamik değiştiği için (2 sabit değil) sabit bir map yerine
// index'e göre döngü kullanıyoruz.
const PALETTE = [
    { color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-100", accent: "#7e22ce" },
    { color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-100",  accent: "#d97706" },
    { color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-100",   accent: "#1d4ed8" },
    { color: "text-emerald-700",bg: "bg-emerald-50",border: "border-emerald-100",accent: "#047857" },
    { color: "text-rose-700",   bg: "bg-rose-50",   border: "border-rose-100",   accent: "#be123c" },
]

function resolveIcon(iconName) {
    if (!iconName) return Package
    const pascal = iconName.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("")
    return Icons[pascal] || Package
}

function routeFor(cat) {
    if (cat.form_component === "vehicle")     return "/portfolio/vehicle"
    if (cat.form_component === "real_estate") return "/portfolio/realestate"
    return `/portfolio/${cat.slug}`
}

export default function PortfolioDashboard() {
    const { user, isAuthenticated, isAgent, loading: authLoading } = useAuth()
    const navigate = useNavigate()
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (authLoading) return
        if (!isAuthenticated) { navigate("/"); return }

        api.get("/my-portfolio/available-categories")
            .then(res => {
                const cats = res.data.data || []
                setCategories(cats)

                // Kullanıcının TÜM kategorileri TEK bir form_component'e
                // aitse (ör. sadece galericiyse hepsi "vehicle") bu Genel
                // Bakış ekranı gereksiz bir ara durak — direkt ilgili zengin
                // listeye (Vasıta/Gayrimenkul) yönlendiriyoruz. Kategoriler
                // karışıksa (bireysel kullanıcı: hem vasıta hem gayrimenkul)
                // ya da form_component'i olmayan jenerik kategoriler de
                // varsa, tek bir sayfaya yönlendirmek yanlış olur — bu
                // durumda Genel Bakış olduğu gibi kalır.
                const distinct = [...new Set(cats.map(c => c.form_component).filter(Boolean))]
                if (cats.length > 0 && distinct.length === 1 && cats.every(c => c.form_component === distinct[0])) {
                    const target = distinct[0] === "vehicle" ? "/portfolio/vehicle"
                        : distinct[0] === "real_estate" ? "/portfolio/realestate"
                        : null
                    if (target) { navigate(target, { replace: true }); return }
                }
            })
            .catch(() => setCategories([]))
            .finally(() => setLoading(false))
    }, [authLoading, isAuthenticated])

    // Genel özet — artık sabit 2 kategoriye değil, kullanıcının yetkili
    // olduğu TÜM kategorilere göre (dinamik sayıda) hesaplanıyor.
    const totalRecords  = categories.reduce((sum, c) => sum + (c.current || 0), 0)
    const totalCapacity = categories.filter(c => c.limit !== null).reduce((sum, c) => sum + c.limit, 0)
    const unlimitedCount = categories.filter(c => c.limit === null).length
    const fullCount      = categories.filter(c => !c.can_add).length

    return (
        <div className="min-h-screen bg-gray-100 font-sans text-gray-800 flex flex-col">
            <Header />

            <main className="max-w-[1200px] mx-auto w-full px-4 py-6 flex-1">

                {/* Başlık */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-full mb-2">
                            <ShieldCheck size={9} /> {isAgent ? (user?.company_name ? "Uzman Danışman" : "Uzman") : "Bireysel Satıcı"}
                        </span>
                        <h1 className="text-xl font-bold text-gray-800">Portföy Paneli</h1>
                        <p className="text-gray-400 text-xs font-medium mt-0.5">
                            Stoğunuzu yönetin. Gelen taleplere otomatik eşleşin.
                            {!loading && <span className="ml-2 font-bold text-purple-700">{totalRecords} kayıt</span>}
                        </p>
                    </div>

                    <Link to="/dashboard"
                          className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-500 hover:text-purple-700 border border-gray-200 hover:border-purple-200 bg-white px-3 py-2 rounded transition-all shadow-sm w-full sm:w-auto justify-center sm:justify-start">
                        <ChevronRight size={11} className="rotate-180" /> Ana Panel
                    </Link>
                </div>

                {/* Sol Sidebar + Sağ İçerik — DashboardPage.jsx ile aynı grid mimarisi */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                    {/* Sol sidebar — kategori menüsü (PortfolioSidebar, dinamik) */}
                    <PortfolioSidebar />

                    {/* Sağ içerik */}
                    <div className="md:col-span-3 space-y-6">

                        {/* Özet kutuları */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { label: "Toplam Kayıt",   value: totalRecords,                          icon: Package,    color: "text-gray-800",   iconBg: "bg-purple-50", iconColor: "text-purple-600" },
                                { label: "Kategori Sayısı",value: categories.length,                      icon: Layers,     color: "text-gray-800",   iconBg: "bg-blue-50",   iconColor: "text-blue-600"   },
                                { label: "Sınırsız Kontenjan", value: unlimitedCount,                     icon: TrendingUp, color: "text-green-700",  iconBg: "bg-green-50",  iconColor: "text-green-600"  },
                                { label: "Limiti Dolan",   value: fullCount,                              icon: CheckCircle2, color: "text-amber-700", iconBg: "bg-amber-50",  iconColor: "text-amber-600"  },
                            ].map((s, i) => {
                                const Icon = s.icon
                                return (
                                    <div key={i} className="bg-white border border-gray-200 rounded-sm shadow-sm p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className={`w-8 h-8 rounded flex items-center justify-center ${s.iconBg} ${s.iconColor}`}>
                                                <Icon size={14} />
                                            </div>
                                        </div>
                                        {loading
                                            ? <div className="h-8 w-12 bg-gray-100 rounded animate-pulse mb-1" />
                                            : <p className={`text-2xl font-bold leading-none mb-1 ${s.color}`}>{s.value}</p>}
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{s.label}</p>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Kategori kartları — dinamik, hesap grubuna göre değişir.
                            Küçük/kompakt kart tasarımı: tek satırda ikon+isim+sayaç,
                            ince bir kontenjan çubuğu ve alt kısımda iki küçük aksiyon
                            butonu. 3 sütunlu grid sayesinde az kategoride bile kartlar
                            devasa boş beyaz alan bırakmıyor. */}
                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white border border-gray-200 rounded-sm animate-pulse" />)}
                            </div>
                        ) : categories.length === 0 ? (
                            <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-10 text-center">
                                <div className="w-11 h-11 bg-gray-50 border border-gray-200 rounded flex items-center justify-center mx-auto mb-3 text-gray-300">
                                    <Package size={18} />
                                </div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kategori Bulunamadı</p>
                                <p className="text-[10px] text-gray-400 font-medium mt-1">
                                    Hesap türünüze tanımlı bir portföy kategorisi bulunmuyor.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                {categories.map((cat, i) => {
                                    const palette = PALETTE[i % PALETTE.length]
                                    const Icon    = resolveIcon(cat.icon)
                                    const route   = routeFor(cat)
                                    const pct     = cat.limit ? Math.round((cat.current / cat.limit) * 100) : 0

                                    return (
                                        <div key={cat.id}
                                             className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden hover:border-gray-300 hover:shadow transition-all flex flex-col">

                                            <div className="p-3.5 flex-1">
                                                <div className="flex items-center justify-between gap-2 mb-2.5">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${palette.bg} ${palette.color}`}>
                                                            <Icon size={15} />
                                                        </div>
                                                        <p className="text-xs font-bold text-gray-800 truncate">{cat.name}</p>
                                                    </div>
                                                    <div className="flex items-baseline gap-0.5 flex-shrink-0">
                                                        <span className={`text-base font-bold leading-none ${palette.color}`}>{cat.current}</span>
                                                        <span className="text-[9px] font-bold text-gray-400">
                                                            {cat.limit === null ? "/ ∞" : `/${cat.limit}`}
                                                        </span>
                                                    </div>
                                                </div>

                                                {cat.limit !== null && (
                                                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden mb-2">
                                                        <div className="h-1.5 rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: palette.accent }} />
                                                    </div>
                                                )}

                                                <p className={`text-[10px] font-medium ${cat.can_add ? "text-gray-400" : "text-amber-600"}`}>
                                                    {cat.can_add ? "Yeni kayıt ekleyebilirsiniz" : "Kontenjan doldu"}
                                                </p>
                                            </div>

                                            <div className="flex gap-1.5 px-3 pb-3">
                                                <Link to={route}
                                                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded transition-all bg-gray-50 hover:bg-gray-100">
                                                    <Package size={10} /> Liste
                                                </Link>
                                                <Link to={cat.can_add ? `${route}/add` : route}
                                                      aria-disabled={!cat.can_add}
                                                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[9px] font-bold uppercase tracking-wider text-white rounded transition-all ${
                                                          cat.can_add ? "hover:opacity-90" : "opacity-40 pointer-events-none"
                                                      }`}
                                                      style={{ background: palette.accent }}>
                                                    <Plus size={10} /> Ekle
                                                </Link>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Bilgi kutusu */}
                        <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-4 flex items-start gap-3">
                            <div className="w-9 h-9 bg-purple-50 border border-purple-100 rounded flex items-center justify-center text-purple-600 flex-shrink-0">
                                <BarChart2 size={16} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-800 mb-1 flex items-center gap-2">
                                    Portföy Eşleşme Sistemi Aktif
                                    <span className="flex items-center gap-1 text-[8px] font-bold text-green-700 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-full">
                                        <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" /> CANLI
                                    </span>
                                </p>
                                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                                    Stoğunuzdaki ürünlere benzer bir müşteri talebi girildiğinde sistem otomatik olarak sizi bilgilendirir.
                                    Portföyünüzü güncel tutun, daha fazla müşteriye ulaşın.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}