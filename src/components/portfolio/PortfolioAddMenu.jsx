// ─────────────────────────────────────────────────────────────
// PortfolioAddMenu.jsx
// Vasıta/Gayrimenkul liste sayfalarının sağ üstündeki "ekle" alanı.
//
// Neden gerekli: bireysel müşteriler kendi araç ve evleri için 1'er adet
// portföy girme hakkına sahip (bkz. subscription/limit sistemi) — yani
// AYNI kullanıcı hem /portfolio/vehicle hem /portfolio/realestate
// erişimine sahip olabiliyor. Ama "Portföyüm" menüsü (PortfolioRedirect)
// vasıta kategorisini önceliklendirip doğrudan /portfolio/vehicle'a
// yönlendiriyor — bu durumda kullanıcının gayrimenkul tarafına
// gidebileceği HİÇBİR link ekranda görünmüyordu (ve tersi).
//
// Bu component "diğer" kategoriye kullanıcının gerçekten erişimi varsa
// (GET /my-portfolio/available-categories) onu da ikincil bir buton
// olarak gösterir; tek kategorili kullanıcılarda (çoğu kurumsal hesap)
// hiçbir şey değişmez, sadece kendi "ekle" butonu görünür.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Car, Building2, Plus } from "lucide-react"
import api from "@/lib/axios"

const CATEGORY_META = {
    vehicle: {
        label: "Araç Ekle", path: "/portfolio/vehicle/add", Icon: Car,
        primaryCls: "bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 text-white",
    },
    realestate: {
        label: "Gayrimenkul Ekle", path: "/portfolio/realestate/add", Icon: Building2,
        primaryCls: "bg-amber-600 hover:bg-amber-500 text-white",
    },
}

export default function PortfolioAddMenu({ current }) {
    const [hasVehicle, setHasVehicle] = useState(false)
    const [hasRealEstate, setHasRealEstate] = useState(false)

    useEffect(() => {
        api.get("/my-portfolio/available-categories")
            .then(res => {
                const cats = res.data.data || []
                setHasVehicle(cats.some(c => c.form_component === "vehicle"))
                setHasRealEstate(cats.some(c => c.form_component === "real_estate"))
            })
            .catch(() => {})
    }, [])

    const other = current === "vehicle"
        ? (hasRealEstate ? "realestate" : null)
        : (hasVehicle ? "vehicle" : null)

    const primary = CATEGORY_META[current]
    const secondary = other ? CATEGORY_META[other] : null
    const SecondaryIcon = secondary?.Icon

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {secondary && (
                <Link to={secondary.path}
                      className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 px-4 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all">
                    <SecondaryIcon size={13} /> {secondary.label}
                </Link>
            )}
            <Link to={primary.path}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${primary.primaryCls}`}>
                <Plus size={13} /> {primary.label}
            </Link>
        </div>
    )
}
