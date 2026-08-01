import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
    Clock, ShieldAlert, ExternalLink, Send, CheckCircle, Award, Package,
} from "lucide-react"
import { useAuth } from "@/store/AuthContext"
import api from "@/lib/axios"

// Paylaşılan panel banner'ı — /dashboard, /account, /settings sayfalarının
// hepsinde AYNI bileşen kullanılır ki hangi sayfada olursan ol banner'ın
// içeriği ve yüksekliği birebir aynı kalsın. Sadece rolüne göre (agent/buyer/
// admin) içerik farklılaşır, sayfaya göre değil.
//
// Kullanım: her üç sayfanın da <Header /> altına, sidebar+içerik grid'inden
// önce tek satırla eklenmesi yeterli: <PanelHeader />
export default function PanelHeader() {
    const { user, isAgent, isBuyer, isAdmin } = useAuth()
    const [agentStats, setAgentStats] = useState(null)

    // Rozet satırı (Teklif/Kabul/Kontör) — hangi sayfada açılırsa açılsın
    // sayfa yüklenir yüklenmez çekilir, böylece banner yüksekliği hiçbir
    // sayfada kısalıp uzamaz.
    useEffect(() => {
        if (!isAgent) return
        api.get("/agent/offers")
            .then(res => {
                const offers = res.data.data || res.data || []
                setAgentStats({
                    total: offers.length,
                    accepted: offers.filter(o => o.status === "accepted").length,
                    activeSubscription: user?.active_subscription,
                    creditBalance: user?.credit_balance,
                })
            })
            .catch(() => {})
    }, [isAgent, user?.id])

    return (
        <>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <p className="text-[9px] font-bold text-purple-700 uppercase tracking-wider mb-1">
                        {isAgent ? "Uzman Danışman Paneli" : isBuyer ? "Müşteri Kontrol Paneli" : "Yönetim Merkezi"}
                    </p>
                    <h1 className="text-xl font-bold text-gray-800">Merhaba, {user?.name?.split(" ")[0]}</h1>
                    <p className="text-gray-400 text-xs font-medium mt-1">
                        {isAgent ? "Teklifleriniz, güncel portföyünüz ve gelen talep akışını yönetin." :
                            isBuyer ? "Oluşturduğunuz talepleri ve gelen akredite teklifleri takip edin." :
                                "TOFFERA sistem kontrol ve operasyon yönetim merkezi."}
                    </p>

                    {isAgent && agentStats && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-3">
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded border bg-purple-50 text-purple-700 border-purple-100">
                                <Send size={10} /> {agentStats.total} Teklif
                            </span>
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded border bg-green-50 text-green-700 border-green-100">
                                <CheckCircle size={10} /> {agentStats.accepted} Kabul
                            </span>
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded border bg-amber-50 text-amber-700 border-amber-100">
                                <Award size={10} />
                                {agentStats.activeSubscription
                                    ? (agentStats.activeSubscription.offer_quota == null
                                        ? "Sınırsız Kota"
                                        : `${agentStats.activeSubscription.offers_remaining}/${agentStats.activeSubscription.offer_quota} Kota`)
                                    : `${agentStats.creditBalance ?? 0} Kontör`}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {user?.status === "pending" && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded text-[9px] text-amber-800 font-bold uppercase tracking-wider">
                            <Clock size={11} className="text-amber-500" /> Onay Bekleniyor
                        </div>
                    )}
                    {user?.status === "active" && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded text-[9px] text-green-800 font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Doğrulanmış Hesap
                        </div>
                    )}
                    {isAgent && (
                        <Link to="/portfolio"
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-[9px] font-bold uppercase tracking-wider transition-all shadow-sm">
                            <Package size={11} /> Aktif Stok Portföyüm
                        </Link>
                    )}
                </div>
            </div>

            {isAdmin && (
                <div className="mb-6 bg-gray-900 p-5 text-white border border-gray-800 rounded-sm shadow-sm">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="space-y-2 text-left">
                            <div className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider">
                                <ShieldAlert size={11} /> Sistem Yöneticisi
                            </div>
                            <h2 className="text-base font-bold text-white">Yönetim ve Filament Konsolu</h2>
                            <p className="text-gray-400 text-xs font-medium max-w-lg">
                                Kullanıcı onayları, acente başvuruları ve sistem ayarları için Filament kontrol merkezine geçiş yapın.
                            </p>
                        </div>
                        <a href="/admin" target="_blank" rel="noopener noreferrer"
                           className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-red-50 text-red-700 font-bold text-xs uppercase tracking-wider rounded transition-all shadow-sm w-full md:w-auto justify-center">
                            <ExternalLink size={13} /> Admin Panele Git
                        </a>
                    </div>
                </div>
            )}
        </>
    )
}