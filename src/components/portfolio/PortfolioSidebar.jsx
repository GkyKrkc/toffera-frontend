import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import * as Icons from "lucide-react"
import { LayoutDashboard, Package } from "lucide-react"
import api from "@/lib/axios"

// Portföy sayfalarının (Genel Bakış / kategori bazlı alt sayfalar) hepsinde
// kullanılan ortak sol menü — Panelim'deki sidebar ile aynı görsel dil.
//
// ESKİ TASARIM agent_type (emlakci/galerici/her_ikisi) sabit ENUM'una
// bakıyordu — yeni, dinamik hesap grupları (Oto Galeri, Plaza, Rent A Car,
// Bireysel Talep...) bu ENUM'a hiç sığmadığı için o kullanıcılar menüde
// hiçbir kategori göremiyordu. Artık menü, kullanıcının account_type_group
// ilişkisine bağlı kategorilerden GET /portfolio/available-categories ile
// dinamik kuruluyor — hem bireysel müşteri hem uzman için aynı kod çalışır,
// yeni bir iş kolu eklendiğinde (admin panelinden) kod değişmeden görünür.
export default function PortfolioSidebar() {
    const location = useLocation()
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get("/my-portfolio/available-categories")
            .then(res => setCategories(res.data.data || []))
            .catch(() => setCategories([]))
            .finally(() => setLoading(false))
    }, [])

    // form_component: kategorinin backend'de tanımlı sabit React formu var
    // mı belirtir ("vehicle" → VehicleListPage/VehicleFormPage, "real_estate"
    // → RealEstateListPage/RealEstateFormPage). Yoksa (null) jenerik
    // PortfolioCategoryPage'e (/portfolio/:slug) düşer. Bu sayede bireysel
    // bir kullanıcı da "2.El Araç" kategorisine tıkladığında hasar şeması
    // gibi zengin formu görür, jenerik başlık/açıklama formuna düşmez.
    const routeFor = (cat) => {
        if (cat.form_component === "vehicle")     return "/portfolio/vehicle"
        if (cat.form_component === "real_estate") return "/portfolio/realestate"
        return `/portfolio/${cat.slug}`
    }

    // Aynı form_component'e sahip birden fazla yaprak kategori (ör. galerici
    // için "Otomobil" + "Arazi, SUV & Pick-up") menüde AYRI satırlar olarak
    // görünmesin — hepsi zaten aynı zengin forma/listeye gidiyor, tek bir
    // "Vasıta" / "Gayrimenkul" satırında birleştiriyoruz (sayaçlar toplanır).
    // form_component'i olmayan (jenerik) kategoriler eskisi gibi tek tek listelenir.
    const FORM_COMPONENT_LABELS = { vehicle: "Vasıta", real_estate: "Gayrimenkul" }

    const buildSidebarItems = (cats) => {
        const groups = new Map()
        const standalone = []

        cats.forEach(cat => {
            if (!cat.form_component) {
                standalone.push({
                    key: `cat-${cat.id}`,
                    to: `/portfolio/${cat.slug}`,
                    label: cat.name,
                    icon: cat.icon,
                    current: cat.current,
                    limit: cat.limit,
                })
                return
            }

            if (!groups.has(cat.form_component)) {
                groups.set(cat.form_component, {
                    key: `group-${cat.form_component}`,
                    to: routeFor(cat),
                    label: FORM_COMPONENT_LABELS[cat.form_component] || cat.name,
                    icon: cat.icon,
                    current: 0,
                    limit: 0,
                    unlimited: false,
                })
            }

            const g = groups.get(cat.form_component)
            g.current += cat.current
            if (cat.limit === null) g.unlimited = true
            else g.limit += cat.limit
        })

        return [...groups.values(), ...standalone].map(it => ({
            ...it,
            limit: it.unlimited ? null : it.limit,
        }))
    }

    // Category.icon alanı lucide-react ikon adı olarak tutuluyor (ör. "car",
    // "building-2") — burada gerçek bileşene çeviriyoruz, bulunamazsa
    // jenerik bir kutu ikonuna düşüyoruz.
    const resolveIcon = (iconName) => {
        if (!iconName) return Package
        const pascal = iconName
            .split("-")
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join("")
        return Icons[pascal] || Package
    }

    return (
        <div className="md:col-span-1">
            <div className="bg-white rounded-sm border border-gray-200 shadow-sm overflow-hidden">
                <Link to="/portfolio"
                      className={`w-full flex items-center gap-2.5 px-4 py-3 text-left border-b border-gray-100 transition-all ${
                          location.pathname === "/portfolio" ? "bg-purple-50 text-purple-700" : "text-gray-600 hover:bg-gray-50"
                      }`}>
                    <LayoutDashboard size={14} className={location.pathname === "/portfolio" ? "text-purple-600" : "text-gray-400"} />
                    <span className="text-xs font-bold">Genel Bakış</span>
                </Link>

                {loading ? (
                    <div className="p-4 space-y-2">
                        {[1, 2].map(i => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}
                    </div>
                ) : categories.length === 0 ? (
                    <p className="px-4 py-4 text-[11px] text-gray-400 leading-relaxed">
                        Hesap türünüze tanımlı bir portföy kategorisi bulunamadı.
                    </p>
                ) : (
                    buildSidebarItems(categories).map(item => {
                        const Icon = resolveIcon(item.icon)
                        const active = location.pathname.startsWith(item.to)
                        return (
                            <Link key={item.key} to={item.to}
                                  className={`w-full flex items-center justify-between gap-2.5 px-4 py-3 text-left border-b border-gray-100 last:border-0 transition-all ${
                                      active ? "bg-purple-50 text-purple-700" : "text-gray-600 hover:bg-gray-50"
                                  }`}>
                                <span className="flex items-center gap-2.5 min-w-0">
                                    <Icon size={14} className={active ? "text-purple-600" : "text-gray-400"} />
                                    <span className="text-xs font-bold truncate">{item.label}</span>
                                </span>
                                <span className="text-[9px] font-bold text-gray-400 flex-shrink-0">
                                    {item.limit === null ? "∞" : `${item.current}/${item.limit}`}
                                </span>
                            </Link>
                        )
                    })
                )}
            </div>
        </div>
    )
}