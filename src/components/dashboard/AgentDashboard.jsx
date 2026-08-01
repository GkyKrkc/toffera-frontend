import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
    Send, Eye, Clock, ChevronRight, ShieldCheck
} from "lucide-react"
import { useAuth } from "@/store/AuthContext"
import api from "@/lib/axios"

const OFFER_STATUS = {
    pending:   { label: "Beklemede",         cls: "bg-amber-50 text-amber-700 border-amber-100" },
    reviewing: { label: "Değerlendiriliyor", cls: "bg-blue-50 text-blue-700 border-blue-100"    },
    accepted:  { label: "Kabul Edildi",      cls: "bg-green-50 text-green-700 border-green-100" },
    rejected:  { label: "Elendi",            cls: "bg-red-50 text-red-600 border-red-100"       },
    cancelled: { label: "İptal",             cls: "bg-gray-50 text-gray-500 border-gray-200"    },
    withdrawn: { label: "Geri Çekildi",      cls: "bg-orange-50 text-orange-600 border-orange-200" },
}

function OfferRow({ offer, onClick }) {
    const status = offer.status === "accepted" && offer.sale_confirmed_at
        ? { label: "Satış Tamamlandı", cls: "bg-green-100 text-green-800 border-green-300" }
        : (OFFER_STATUS[offer.status] || { label: offer.status, cls: "bg-gray-50 text-gray-500 border-gray-200" })
    const isWon  = offer.accepted_offer?.is_mine
    const isDone = offer.demand?.status === "completed"

    // Admin onayı bitmeden normal durum rozeti anlamsız — müşteri bu teklifi
    // henüz hiç görmüyor. Onun yerine moderasyon durumunu göster.
    const moderationBadge = offer.moderation_status === "pending"
        ? { label: "İncelemede", cls: "bg-gray-50 text-gray-500 border-gray-200" }
        : offer.moderation_status === "rejected"
            ? { label: "Onaylanmadı", cls: "bg-red-50 text-red-600 border-red-100" }
            : null

    return (
        <div onClick={onClick}
             className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-purple-50 cursor-pointer group transition-colors ${isWon ? "bg-green-50/40" : ""}`}>
            <div className="w-8 h-8 rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 font-bold text-xs flex-shrink-0">
                {offer.demand?.title?.charAt(0) || "T"}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-800 truncate group-hover:text-purple-700 transition-colors leading-none">
                    {offer.demand?.title || "Talep"}
                </p>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{offer.demand?.category?.name}</p>
            </div>
            <div className="flex items-center gap-2.5 flex-shrink-0">
                <div className="text-right">
          <span className={`text-sm font-bold block leading-none ${isWon ? "text-green-700" : "text-gray-800"}`}>
            {Number(offer.price).toLocaleString("tr-TR")} ₺
          </span>
                    <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">Teklifiniz</span>
                </div>
                {isDone && offer.accepted_offer && !isWon && (
                    <div className="text-right border-l border-gray-200 pl-2.5">
            <span className="text-sm font-bold block leading-none text-green-700">
              {Number(offer.accepted_offer.price).toLocaleString("tr-TR")} ₺
            </span>
                        <span className="text-[8px] text-green-600 font-bold uppercase tracking-wider">Kabul Edilen</span>
                    </div>
                )}
                <span className={`text-[8px] font-bold px-2 py-0.5 rounded border ${moderationBadge ? moderationBadge.cls : status.cls}`}
                      title={offer.moderation_status === "rejected" ? offer.moderation_note : undefined}>
          {moderationBadge ? moderationBadge.label : status.label}
        </span>
                <ChevronRight size={13} className="text-gray-300 group-hover:text-purple-500 transition-colors" />
            </div>
        </div>
    )
}

export default function AgentDashboard({ onGoToMarket, onStatsChange }) {
    const { user }  = useAuth()
    const navigate  = useNavigate()
    const [offers, setOffers]       = useState([])
    const [loading, setLoading]     = useState(true)
    const [activeTab, setActiveTab] = useState("pending")

    useEffect(() => { fetchOffers() }, [])

    const fetchOffers = async () => {
        try {
            const res = await api.get("/agent/offers")
            setOffers(res.data.data || res.data)
        } catch { setOffers([]) }
        finally { setLoading(false) }
    }

    const filtered = offers.filter(o => activeTab === "all" ? true : o.status === activeTab)

    const stats = {
        total:    offers.length,
        pending:  offers.filter(o => o.status === "pending").length,
        accepted: offers.filter(o => o.status === "accepted").length,
        rejected: offers.filter(o => o.status === "rejected").length,
    }

    // Üst paneldeki badge'lerin ihtiyaç duyduğu özet veriyi yukarı bildir.
    useEffect(() => {
        onStatsChange?.({
            total: stats.total,
            accepted: stats.accepted,
            activeSubscription: user?.active_subscription,
            creditBalance: user?.credit_balance,
        })
    }, [offers, user])

    const offerTabs = [
        { key: "pending",  label: `Beklemede (${stats.pending})` },
        { key: "accepted", label: `Kabul (${stats.accepted})`    },
        { key: "all",      label: `Tümü (${stats.total})`        },
        { key: "rejected", label: `Red (${stats.rejected})`      },
    ]

    // Onay bekliyor
    if (user?.status === "pending") {
        return (
            <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-10 text-center max-w-md mx-auto">
                <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded flex items-center justify-center mx-auto mb-4 text-amber-500">
                    <Clock size={22} />
                </div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-purple-700 mb-2">Başvuru Durumu</p>
                <h2 className="text-base font-bold text-gray-800 mb-2">Başvurunuz İnceleniyor</h2>
                <p className="text-gray-500 text-xs leading-relaxed mb-4 font-medium">
                    Belgeleriniz admin tarafından inceleniyor. Onay süreci genellikle 1–2 iş günü sürer. Sonuç bildirilecektir.
                </p>
                <div className="bg-amber-50 border border-amber-100 rounded-sm p-3 flex items-center gap-2.5">
                    <ShieldCheck size={13} className="text-amber-500 flex-shrink-0" />
                    <p className="text-[10px] text-amber-700 font-bold text-left leading-relaxed">
                        Onay sonrası pazaryerindeki taleplere teklif verebileceksiniz.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Tekliflerim */}
            <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2">
                        <Send size={13} className="text-gray-500" />
                        <h3 className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">Tekliflerim</h3>
                    </div>
                    <div className="flex items-center gap-0.5 bg-gray-100 p-0.5 rounded border border-gray-200 flex-wrap">
                        {offerTabs.map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                    className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider rounded transition-all whitespace-nowrap ${
                                        activeTab === tab.key ? "bg-white text-purple-700 shadow-sm" : "text-gray-400 hover:text-gray-700"
                                    }`}>{tab.label}</button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="p-4 space-y-2">
                        {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <div className="w-11 h-11 bg-gray-50 border border-gray-200 rounded flex items-center justify-center mx-auto mb-3 text-gray-300">
                            <Send size={18} />
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Teklif Bulunamadı</p>
                        <p className="text-[10px] text-gray-400 font-medium mt-1 mb-4">
                            {activeTab === "pending" ? "Bekleyen teklifiniz yok." : "Bu filtreye ait teklif bulunmuyor."}
                        </p>
                        <button onClick={onGoToMarket}
                                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all">
                            <Eye size={12} /> Pazaryerini Gör
                        </button>
                    </div>
                ) : (
                    <div>
                        {filtered.map(offer => (
                            <OfferRow key={offer.id} offer={offer}
                                      onClick={() => navigate(`/market/${offer.demand_id}`)} />
                        ))}
                    </div>
                )}
            </div>

            {/* TODO: OfferModal (teklif düzenleme) eski projeden portlanınca buraya
          "Düzenle" butonu + modal entegrasyonu geri eklenecek. */}
        </div>
    )
}