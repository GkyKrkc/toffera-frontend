// ─────────────────────────────────────────────────────────────
// DemandDetailPage.jsx
// Tek bir talebin (demand) detay sayfası.
//   - Sol: açıklama + kategoriye özel teknik kriterler (features)
//   - Sağ: agent için "Teklif Ver" akışı / talep sahibi için gelen
//     tekliflerin listesi (sıralama + filtre)
// Teklif verme formu → OfferModal.jsx
// Tekliflerin kabul/red edilmesi ayrı bir sayfada olacak
// (/market/:demandId/offers/:offerId — OfferDetailPage, henüz kurulmadı).
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
    ArrowLeft, MapPin, Clock, CheckCircle,
    Building2, Car, Send, AlertCircle, XCircle,
    ShieldCheck, Activity, HelpCircle, Timer,
    AlertTriangle, ChevronRight, X, MessageSquare, Star,
    Calendar, Plus, Pencil, Eye,
} from "lucide-react"
import Header from "@/components/layout/Header"
import { useAuth } from "@/store/AuthContext"
import { useToast } from "@/components/ui/Toast.jsx"
import OfferModal from "@/components/market/OfferModal"
import api from "@/lib/axios"

// ── Yardımcılar ───────────────────────────────────────────────
function timeAgo(dateStr) {
    if (!dateStr) return "Yeni"
    const diff = Date.now() - new Date(dateStr).getTime()
    const days = Math.floor(diff / 86400000), hrs = Math.floor(diff / 3600000), mins = Math.floor(diff / 60000)
    if (days > 0) return `${days} gün önce`
    if (hrs > 0) return `${hrs} saat önce`
    if (mins > 0) return `${mins} dk önce`
    return "Az önce"
}
function formatPrice(val) { return val ? Number(val).toLocaleString("tr-TR") + " TL" : "—" }
function formatDateTime(dateStr) {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

// ── Geri Sayım ────────────────────────────────────────────────
function useCountdown(expiresAt) {
    const calc = () => {
        if (!expiresAt) return null
        const diff = new Date(expiresAt).getTime() - Date.now()
        if (diff <= 0) return { expired: true }
        return {
            expired: false, total: diff,
            d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000),
            m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000),
        }
    }
    const [r, setR] = useState(calc)
    useEffect(() => { if (!expiresAt) return; const t = setInterval(() => setR(calc()), 1000); return () => clearInterval(t) }, [expiresAt])
    return r
}
function CountdownBadge({ expiresAt }) {
    const r = useCountdown(expiresAt)
    if (!r) return <span className="text-[10px] font-bold text-gray-400 bg-white border border-gray-200 px-2.5 py-1.5 rounded flex items-center gap-1.5"><Clock size={10} /> Süresiz</span>
    if (r.expired) return <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded flex items-center gap-1.5"><AlertTriangle size={10} /> Süresi Doldu</span>
    const isUrgent = r.total < 3 * 3600000
    const cls = isUrgent ? "text-red-700 bg-red-50 border-red-200" : r.total < 12 * 3600000 ? "text-amber-700 bg-amber-50 border-amber-200" : "text-gray-600 bg-white border-gray-200"
    const parts = []
    if (r.d > 0) parts.push(`${r.d}g`)
    if (r.h > 0 || r.d > 0) parts.push(`${r.h}s`)
    parts.push(`${String(r.m).padStart(2, "0")}dk`)
    return <span className={`text-[10px] font-bold px-2.5 py-1.5 rounded border flex items-center gap-1.5 ${cls}`}><Timer size={10} />{parts.join(" ")}</span>
}

// ── Noktalı çizgili satır ─────────────────────────────────────
function DottedRow({ label, value, isRed, isPurple, isGreen }) {
    if (!value) return null
    return (
        <div className="flex items-end justify-between py-2 text-xs border-b border-gray-50 last:border-0">
            <span className="text-gray-500 font-semibold pr-2 bg-white z-10 whitespace-nowrap">{label}</span>
            <div className="flex-1 border-b border-dotted border-gray-200 mb-1 mx-1" />
            <span className={`pl-2 bg-white z-10 font-bold text-right ${isRed ? "text-red-600" : isPurple ? "text-purple-700" : isGreen ? "text-green-600" : "text-gray-900"}`}>
                {value}
            </span>
        </div>
    )
}

// ── Teklif Satır Kartı (talep sahibine görünür) ────────────────
function OfferRow({ offer, demand }) {
    const navigate = useNavigate()
    const isAccepted = offer.status === "accepted"
    const isRejected = offer.status === "rejected"
    const isSold = offer.portfolio_item?.status === "sold"
    const trust = Math.round(offer.user?.trust_score ?? offer.user?.reliability_score ?? 100)
    const trustCls = trust >= 90 ? "bg-green-50 text-green-700 border-green-200"
        : trust >= 70 ? "bg-purple-50 text-purple-700 border-purple-200"
            : "bg-amber-50 text-amber-700 border-amber-200"

    return (
        <div className={`bg-white border rounded p-2.5 shadow-sm relative overflow-hidden transition-all ${
            isSold ? "border-red-300 bg-red-50/30"
                : isAccepted ? "border-green-400 ring-1 ring-green-50"
                    : isRejected ? "border-gray-200 opacity-60 bg-gray-50/40"
                        : "border-gray-200 hover:border-gray-300 hover:shadow"
        }`}>
            <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-gray-700 text-[11px] truncate max-w-[62%]">
                    {offer.user?.company_name || offer.user?.name}
                </span>
                <span className={`text-[7px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border flex-shrink-0 flex items-center gap-0.5 ${trustCls}`}>
                    <ShieldCheck size={8} /> %{trust}
                </span>
            </div>
            <div className="mb-1.5">
                <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded ${offer.user?.agent_type ? "bg-indigo-50 text-indigo-600" : "bg-gray-100 text-gray-500"}`}>
                    {offer.user?.agent_type ? "Kurumsal Satıcı" : "Bireysel Satıcı"}
                </span>
            </div>

            {isSold && (
                <div className="flex items-center gap-1.5 bg-red-100 border border-red-200 text-red-700 rounded px-1.5 py-1 mb-1.5">
                    <AlertTriangle size={10} className="flex-shrink-0" />
                    <span className="text-[8px] font-bold uppercase tracking-wider">
                        Araç Satıldı{offer.portfolio_item?.sold_at ? ` · ${formatDateTime(offer.portfolio_item.sold_at)}` : ""}
                    </span>
                </div>
            )}

            <div className="flex items-center justify-between gap-2">
                <p className={`text-xs font-bold tracking-tight ${isAccepted ? "text-green-700" : "text-purple-900"}`}>
                    {formatPrice(offer.price)}
                </p>
                <button onClick={() => navigate(`/market/${demand.id}/offers/${offer.id}`)}
                        className="py-1 px-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 text-[8px] font-bold uppercase tracking-wider rounded flex items-center justify-center gap-1 transition-all flex-shrink-0">
                    <Eye size={9} /> Detay
                </button>
            </div>
        </div>
    )
}

// ── ANA COMPONENT ─────────────────────────────────────────────
export default function DemandDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user, isAuthenticated, isAgent } = useAuth()
    const toast = useToast()

    const [demand, setDemand] = useState(null)
    const [offers, setOffers] = useState([])
    const [myOffer, setMyOffer] = useState(null)
    const [loading, setLoading] = useState(true)
    const [showOfferModal, setShowOfferModal] = useState(false)
    const [editingMyOffer, setEditingMyOffer] = useState(false)
    const [portfolioMatch, setPortfolioMatch] = useState(null)
    const [portfolioChecking, setPortfolioChecking] = useState(false)
    const [offerSort, setOfferSort] = useState("price_asc")
    const [offerFilter, setOfferFilter] = useState("all")

    const isEmlak = demand?.category?.slug === "gayrimenkul"
    const isVasita = demand?.category?.slug === "vasita"
    const isOwner = user?.id === demand?.user_id
    const features = demand?.features || {}

    const visibleOffers = useMemo(() => {
        let list = [...offers]
        if (offerFilter !== "all") list = list.filter(o => o.status === offerFilter)
        const trustOf = o => Math.round(o.user?.trust_score ?? o.user?.reliability_score ?? 100)
        switch (offerSort) {
            case "price_asc": list.sort((a, b) => Number(a.price) - Number(b.price)); break
            case "price_desc": list.sort((a, b) => Number(b.price) - Number(a.price)); break
            case "trust_desc": list.sort((a, b) => trustOf(b) - trustOf(a)); break
            case "date_new": list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); break
            case "date_old": list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); break
            default: break
        }
        return list
    }, [offers, offerSort, offerFilter])

    // Kategori bazlı teklif YETKİSİ (capability) — artık backend'den geliyor
    // (bkz. DemandController::show → CategoryAccessService::hasOfferCapability).
    // Eskiden burada kullanıcının agent_type ENUM'una (emlakci/galerici)
    // bakılıyordu — AccountTypeGroup sistemine geçilince yeni hesaplarda bu
    // alan boş kaldığından yetkisi OLAN kullanıcılara bile "yetkiniz yok"
    // uyarısı gösteriliyordu (ör. Vasıta Uzmanı'na Vasıta talebinde). Gerçek
    // kaynak user_category_permissions olduğu için artık orayı yansıtan
    // demand.can_offer_capability alanına bakıyoruz.
    const canOffer = useMemo(() => {
        if (!isAgent || !demand || isOwner) return false
        return !!demand.can_offer_capability
    }, [isAgent, isOwner, demand])

    useEffect(() => {
        setLoading(true)
        api.get(`/demands/${id}`)
            .then(res => setDemand(res.data.data || res.data))
            .catch(() => navigate("/market"))
            .finally(() => setLoading(false))
    }, [id, navigate])

    useEffect(() => {
        if (!demand || !isOwner) return
        api.get(`/buyer/demands/${id}/offers`)
            .then(res => setOffers(res.data.data || res.data || []))
            .catch(() => setOffers([]))
    }, [demand, isOwner, id])

    useEffect(() => {
        if (!demand || !isAgent || isOwner) return
        api.get("/agent/offers")
            .then(res => {
                const list = res.data.data || res.data || []
                setMyOffer(list.find(o => o.demand_id === Number(id)) || null)
            })
            .catch(() => setMyOffer(null))
    }, [demand, isAgent, isOwner, id])

    useEffect(() => {
        if (!demand || !isAgent || isOwner || !canOffer) return
        setPortfolioChecking(true)
        const slug = demand.category?.slug
        const marka = demand.features?.marka || null
        api.get("/agent/portfolio", { params: { type: slug, status: "available" } })
            .then(res => {
                const items = res.data.data || res.data || []
                if (!items.length) { setPortfolioMatch(false); return }
                if (slug === "vasita" && marka) {
                    setPortfolioMatch(items.some(item => (item.features?.marka || "").toLowerCase().trim() === marka.toLowerCase().trim()))
                } else { setPortfolioMatch(true) }
            })
            .catch(() => setPortfolioMatch(null))
            .finally(() => setPortfolioChecking(false))
    }, [demand, isAgent, isOwner, canOffer, id])

    const handleCancelOffer = async (offerId) => {
        if (!window.confirm("Teklifinizi geri çekmek istediğinize emin misiniz?")) return
        try {
            await api.post(`/agent/offers/${offerId}/cancel`)
            toast({ message: "Teklifiniz iptal edildi." })
            setMyOffer(null)
        } catch { toast({ message: "İptal başarısız.", type: "error" }) }
    }

    if (loading) return (
        <div className="min-h-screen bg-gray-200 flex flex-col">
            <Header />
            <div className="flex flex-col items-center justify-center flex-1 gap-3">
                <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Talep Bilgileri Alınıyor...</p>
            </div>
        </div>
    )
    if (!demand) return null

    return (
        <div className="min-h-screen bg-gray-200 flex flex-col">
            <Header />
            <div className="max-w-[1200px] mx-auto w-full px-4 py-6 flex-1">

                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-gray-400 mb-6" aria-label="Breadcrumb">
                    <button onClick={() => navigate("/")} className="hover:text-purple-700 transition-colors">Ana Sayfa</button>
                    <ChevronRight size={12} className="text-gray-300" />
                    <button onClick={() => navigate("/market")} className="hover:text-purple-700 transition-colors">Pazaryeri</button>
                    <ChevronRight size={12} className="text-gray-300" />
                    <span className="text-gray-600 truncate max-w-[200px]">{demand.title}</span>
                </nav>

                {/* Üst bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <button onClick={() => navigate(-1)}
                            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-purple-700 transition-colors">
                        <ArrowLeft size={14} /> Talep Pazaryerine Dön
                    </button>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-100 px-2.5 py-1.5 rounded flex items-center gap-1">
                            {demand.category?.name} Alım Talebi
                        </span>
                        {demand.district && (
                            <span className="text-[10px] font-bold text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded shadow-sm flex items-center gap-1">
                                <MapPin size={10} className="text-purple-400" /> {demand.district}
                            </span>
                        )}
                        <CountdownBadge expiresAt={demand.expires_at} />
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded shadow-sm flex items-center gap-1.5">
                            <Send size={11} /> {demand.offers_count ?? offers.length ?? 0} Teklif
                        </span>
                        <span className="text-[10px] font-bold text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded shadow-sm flex items-center gap-1.5">
                            <Clock size={11} className="text-purple-600" /> Talep No: #{demand.id}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded shadow-sm flex items-center gap-1.5">
                            <Calendar size={11} className="text-amber-500" /> {timeAgo(demand.created_at)}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded border shadow-sm flex items-center gap-1.5 ${
                            demand.status === "completed" ? "bg-purple-50 text-purple-700 border-purple-200"
                                : demand.status === "matched" ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-green-50 text-green-700 border-green-200"
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                                demand.status === "active" ? "bg-green-500 animate-pulse"
                                    : demand.status === "matched" ? "bg-amber-500"
                                        : "bg-purple-500"
                            }`} />
                            {demand.status === "completed" ? "Tamamlandı" : demand.status === "matched" ? "Ön Anlaşma" : "Aktif Talep"}
                        </span>
                    </div>
                </div>

                {/* ── 8 + 4 ANA GRID ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

                    {/* ── SOL 8 ── */}
                    <div className="lg:col-span-8 space-y-4">

                        <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                            <div className="p-5">
                                <h1 className="text-base sm:text-lg font-bold text-gray-800 tracking-tight leading-snug mb-1">
                                    {demand.title}
                                </h1>
                                {(features.il || features.ilce || demand.district) && (
                                    <p className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 mb-3">
                                        <MapPin size={11} className="text-purple-400 flex-shrink-0" />
                                        {[features.ilce, features.il].filter(Boolean).join(", ") || demand.district}
                                        {features.mahalleler?.length > 0 && (
                                            <span className="text-gray-400 font-semibold">
                                                · {features.mahalleler.slice(0, 3).join(", ")}
                                                {features.mahalleler.length > 3 ? ` +${features.mahalleler.length - 3} mahalle` : ""}
                                            </span>
                                        )}
                                    </p>
                                )}
                                {demand.description && (
                                    <p className="text-xs text-gray-600 leading-relaxed font-medium bg-gray-50/50 border border-gray-100 rounded p-3 italic mb-3">
                                        "{demand.description}"
                                    </p>
                                )}

                                {features.kabul_edilemez?.length > 0 && (
                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                                            Kabul Edilmez Hasar / Kaporta Durumları
                                        </p>
                                        <div className="p-3 bg-red-50/40 border border-red-100 rounded flex items-start gap-2.5">
                                            <AlertTriangle className="text-red-600 mt-0.5 flex-shrink-0" size={15} />
                                            <div className="flex flex-wrap gap-1.5">
                                                {features.kabul_edilemez.map(p => (
                                                    <span key={p} className="text-[10px] font-bold px-2 py-0.5 bg-white border border-red-200 text-red-700 rounded">{p}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Gelen Teklifler — talep sahibine, MÜŞTERİ TALEBİ kartının altında,
                            küçük puntolu ve üzerinde filtre/sıralama bölümü var. */}
                        {isOwner && (
                            <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                                <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                                        <Send size={12} className="text-purple-600" /> GELEN TEKLİFLER
                                        <span className="text-gray-400 font-semibold normal-case">({offers.length})</span>
                                    </p>
                                    <select value={offerSort} onChange={e => setOfferSort(e.target.value)}
                                            className="text-[9px] font-bold text-gray-600 bg-white border border-gray-200 rounded px-2.5 py-1.5 outline-none cursor-pointer">
                                        <option value="price_asc">Fiyat: Düşükten Yükseğe</option>
                                        <option value="price_desc">Fiyat: Yüksekten Düşüğe</option>
                                        <option value="trust_desc">Firma Güvenilirliği</option>
                                        <option value="date_new">Tarih: En Yeni</option>
                                        <option value="date_old">Tarih: En Eski</option>
                                    </select>
                                </div>
                                <div className="px-5 py-3 flex items-center gap-1.5 flex-wrap border-b border-gray-50">
                                    {[
                                        { key: "all", label: "Tümü" },
                                        { key: "pending", label: "Değerlendirmede" },
                                        { key: "accepted", label: "Kabul Edilen" },
                                        { key: "rejected", label: "Elenen" },
                                        { key: "withdrawn", label: "Geri Çekilen" },
                                    ].map(f => (
                                        <button key={f.key} onClick={() => setOfferFilter(f.key)}
                                                className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded border transition-all ${
                                                    offerFilter === f.key ? "bg-purple-700 text-white border-purple-700" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700"
                                                }`}>
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="p-5">
                                    {offers.length === 0 ? (
                                        <div className="text-center py-6">
                                            <Activity className="text-gray-300 mx-auto mb-2" size={20} />
                                            <p className="text-[11px] font-bold text-gray-400">Henüz teklif iletilmemiş.</p>
                                        </div>
                                    ) : visibleOffers.length === 0 ? (
                                        <div className="text-center py-6">
                                            <Activity className="text-gray-300 mx-auto mb-2" size={20} />
                                            <p className="text-[11px] font-bold text-gray-400">Bu filtreye uyan teklif yok.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[600px] overflow-y-auto">
                                            {visibleOffers.map(offer => <OfferRow key={offer.id} offer={offer} demand={demand} />)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Verdiğiniz Teklif */}
                        {isAgent && !isOwner && myOffer && (
                            <div className={`border rounded-sm overflow-hidden shadow-sm ${
                                myOffer.status === "accepted" ? "border-green-300 bg-green-50/60"
                                    : myOffer.status === "rejected" ? "border-gray-200 bg-gray-50/60 opacity-70"
                                        : myOffer.status === "withdrawn" ? "border-orange-200 bg-orange-50/30"
                                            : "border-amber-300 bg-amber-50/20"
                            }`}>
                                <div className={`flex items-center justify-between px-3 py-1.5 border-b ${
                                    myOffer.status === "accepted" ? "border-green-100"
                                        : myOffer.status === "rejected" ? "border-gray-100"
                                            : myOffer.status === "withdrawn" ? "border-orange-100"
                                                : "border-amber-100"
                                }`}>
                                    <div className="flex items-center gap-1.5">
                                        <Send size={10} className={
                                            myOffer.status === "accepted" ? "text-green-600"
                                                : myOffer.status === "rejected" ? "text-gray-400"
                                                    : myOffer.status === "withdrawn" ? "text-orange-500"
                                                        : "text-amber-600"
                                        } />
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Verdiğiniz Teklif</span>
                                    </div>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                        myOffer.status === "accepted" ? (myOffer.sale_confirmed_at ? "bg-green-200 text-green-900 border-green-400" : "bg-green-100 text-green-700 border-green-200")
                                            : myOffer.status === "rejected" ? "bg-gray-100 text-gray-400 border-gray-200"
                                                : myOffer.status === "withdrawn" ? "bg-orange-100 text-orange-700 border-orange-200"
                                                    : "bg-amber-100 text-amber-800 border-amber-300"
                                    }`}>
                                        {myOffer.status === "accepted"
                                            ? (myOffer.sale_confirmed_at ? "Satış Tamamlandı" : "Kabul Edildi (Ön Anlaşma)")
                                            : myOffer.status === "rejected" ? "Elendi"
                                                : myOffer.status === "withdrawn" ? "Geri Çekildi"
                                                    : "Beklemede"}
                                    </span>
                                </div>
                                <div className="px-3 py-2 flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className={`text-xs font-bold tracking-tight ${myOffer.status === "accepted" ? "text-green-700" : myOffer.status === "rejected" ? "text-gray-400" : "text-gray-900"}`}>
                                            {Number(myOffer.price).toLocaleString("tr-TR")} ₺
                                        </p>
                                        <p className="text-[9px] text-gray-400 font-medium mt-0.5">{timeAgo(myOffer.created_at)}</p>
                                    </div>
                                    {(() => {
                                        const pf = myOffer.portfolio_item?.features || {}
                                        const summary = [pf.yil, pf.marka, pf.model].filter(Boolean).join(" ")
                                        return summary ? (
                                            <div className="flex items-center gap-1 bg-white border border-amber-200 px-2 py-1 rounded flex-1 min-w-0">
                                                <Car size={9} className="text-amber-500 flex-shrink-0" />
                                                <span className="text-[9px] font-bold text-gray-600 truncate">{summary}</span>
                                            </div>
                                        ) : null
                                    })()}
                                    {/* Button group */}
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        {myOffer.status === "pending" && (
                                            <button onClick={() => handleCancelOffer(myOffer.id)}
                                                    title="Teklifi Geri Çek"
                                                    className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-all">
                                                <XCircle size={12} />
                                            </button>
                                        )}
                                        {(myOffer.status === "pending" || myOffer.status === "withdrawn") && (
                                            <button onClick={() => setEditingMyOffer(true)}
                                                    title={myOffer.status === "withdrawn" ? "Teklifi Düzenle ve Yeniden Gönder" : "Teklifi Düzenle"}
                                                    className="w-6 h-6 flex items-center justify-center rounded bg-purple-600 hover:bg-purple-700 text-white transition-colors">
                                                <Pencil size={11} />
                                            </button>
                                        )}
                                        <button onClick={() => navigate(`/market/${demand.id}/offers/${myOffer.id}`)}
                                                title={myOffer.status === "accepted" ? "Müşteri iletişim bilgisini gör" : "Teklif Detayını Gör"}
                                                className="w-6 h-6 flex items-center justify-center rounded bg-white border border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-700 transition-colors">
                                            <Eye size={11} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}



                        {!isAuthenticated && (
                            <button onClick={() => navigate("/login")}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-sm shadow transition-all flex items-center justify-center gap-2">
                                <Plus size={14} /> Giriş Yap & Teklif Ver
                            </button>
                        )}

                        {demand.status === "completed" && (
                            <div className="bg-green-50 border border-green-100 rounded-sm p-3 flex items-center gap-2.5">
                                <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                                <div>
                                    <p className="font-bold text-xs text-green-800">Süreç Kapandı</p>
                                    <p className="text-[10px] text-green-700 mt-0.5">Satış onaylandı.</p>
                                </div>
                            </div>
                        )}

                        {demand.status === "matched" && (
                            <div className="bg-amber-50 border border-amber-100 rounded-sm p-3 flex items-center gap-2.5">
                                <Clock size={14} className="text-amber-600 flex-shrink-0" />
                                <div>
                                    <p className="font-bold text-xs text-amber-800">Ön Anlaşma Sağlandı</p>
                                    <p className="text-[10px] text-amber-700 mt-0.5">Bir teklif kabul edildi, satış onayı bekleniyor.</p>
                                </div>
                            </div>
                        )}

                        <div className="bg-gray-950 border border-gray-800 rounded-sm p-3.5 text-white relative overflow-hidden shadow-lg">
                            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
                            <div className="relative z-10">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-purple-400 mb-0.5">Acente Güvencesi</p>
                                <p className="font-bold text-xs text-white">Yalnızca Onaylı Acenteler</p>
                                <p className="text-gray-400 text-[10px] leading-relaxed mt-0.5">Tüm teklifler kimliği doğrulanmış yetki belgeli acenteler tarafından verilebilir.</p>
                            </div>
                        </div>

                        {isAgent && !isOwner && (
                            <div className="bg-purple-50/60 border border-purple-100 rounded-sm p-3 flex gap-2">
                                <HelpCircle size={13} className="text-purple-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-[9px] font-bold text-purple-700 uppercase tracking-wider">Nasıl Kazanırım?</h4>
                                    <p className="text-[10px] text-gray-600 font-medium leading-relaxed mt-0.5">Alıcının bütçesine uygun, dürüst portföy teklifleri tercih edilir.</p>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* ── SAĞ 4 ── */}
                    <div className="lg:col-span-4 space-y-3 lg:sticky lg:top-4">

                        {/* Doğrulanmış Alıcı — talep sahibinin maskelenmiş kimliği */}
                        <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">

                            <div className="p-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-700 border border-gray-200 flex-shrink-0">
                                        {demand.owner_masked_name?.charAt(0) || "M"}
                                    </div>
                                    <div className="min-w-0">
                                        {/* Talep sahibinin ham adı API'den hiç gelmiyor (backend'de
                                            maskeleniyor) — gizlilik için "Doğrulanmış Alıcı" ibaresinin
                                            yanında sadece maskelenmiş hâli (ör. "G**** K********")
                                            gösteriliyor. */}
                                        <p className="font-bold text-gray-900 text-xs truncate">
                                            Doğrulanmış Alıcı{demand.owner_masked_name ? ` ${demand.owner_masked_name}` : ""}
                                        </p>
                                        <p className="text-[9px] text-gray-400 font-bold">Kurumsal Alıcı / Doğrulanmış Üye</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-[9px] font-bold text-green-700 bg-green-50 border border-green-100 px-2.5 py-1.5 rounded mt-3">
                                    <ShieldCheck size={10} /> GÜVENLİ TİCARET ÜYESİ
                                </div>
                            </div>
                        </div>

                        {/* Teklif Ver */}
                        {isAgent && !isOwner && !myOffer && demand.status === "active" && (
                            <div className="space-y-2">
                                {!canOffer && (
                                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded">
                                        <AlertCircle size={13} className="text-amber-600 mt-0.5 flex-shrink-0" />
                                        <p className="text-[10px] text-amber-700 font-bold">
                                            Hesap tipiniz{demand?.category?.name ? ` "${demand.category.name}"` : " bu"} kategorisinde teklif vermeye yetkili değil.
                                        </p>
                                    </div>
                                )}
                                {canOffer && portfolioChecking && (
                                    <div className="flex items-center justify-center gap-2 py-3 rounded bg-gray-50 border border-gray-200">
                                        <div className="w-3.5 h-3.5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-[10px] font-bold text-gray-400">Portföy kontrol ediliyor...</span>
                                    </div>
                                )}
                                {canOffer && !portfolioChecking && portfolioMatch === false && (
                                    <div className="space-y-2">
                                        <div className="w-full py-3 text-xs font-bold flex items-center justify-center gap-2 rounded bg-red-50 border border-red-200 text-red-400 cursor-not-allowed">
                                            <AlertTriangle size={13} /> Teklif Veremezsiniz
                                        </div>
                                        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded">
                                            <AlertTriangle size={11} className="text-red-500 mt-0.5 flex-shrink-0" />
                                            <p className="text-[10px] text-red-700 font-bold leading-tight">
                                                Portföyünüzde {demand.features?.marka ? `${demand.features.marka} markasına ait ` : "bu kategoride "}satışta ürün bulunmuyor.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {canOffer && !portfolioChecking && portfolioMatch !== false && (
                                    <button onClick={() => setShowOfferModal(true)}
                                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                                        <Plus size={14} /> Bu Talebe Teklif Ver
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Aranan Araç/Gayrimenkul Teknik Özellikleri */}
                        {(isVasita || isEmlak) && Object.keys(features).some(k => features[k]) && (
                            <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-4">
                                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                                    {isVasita ? <Car size={13} className="text-purple-600" /> : <Building2 size={13} className="text-amber-600" />}
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                                        {isVasita ? "ARANAN ARAÇ TEKNİK ÖZELLİKLERİ" : "ARANAN GAYRIMENKUL KRİTERLERİ"}
                                    </p>
                                </div>
                                <div>
                                    <div>
                                        <DottedRow label="Aranan Marka" value={features.marka} isPurple />
                                        <DottedRow label="Model / Seri" value={features.model} />
                                        <DottedRow label="Model Yılı" value={features.yil} />
                                        <DottedRow label="Şanzıman" value={features.vites} />
                                        <DottedRow label="Yakıt Tipi" value={features.yakit} />
                                        <DottedRow label="Kilometre" value={features.km} isRed />
                                        <DottedRow label="Renk Tercihi" value={features.renk} />
                                        <DottedRow label="Emlak Tipi" value={features.emlak_tipi} />
                                        <DottedRow label="Oda Sayısı" value={features.oda_sayisi} />
                                        <DottedRow label="Metrekare" value={features.metrekare && `${features.metrekare} m²`} />
                                        <DottedRow label="Katılım Finansı" value={features.katilim_finansi ? "Uygundur" : null} isGreen />
                                        <DottedRow label="Takas Durumu" value={features.takas === "evet" ? "Takas Düşünülebilir" : features.takas === "hayir" ? "Takas Yok" : null} />
                                        <DottedRow label="Boya Toleransı" value={features.boya_durumu} />
                                        <DottedRow label="Değişen Toleransı" value={features.degisen_parca} />
                                        <DottedRow label="Tramer Durumu" value={features.tramer_bilgisi_istiyorum ? "Tramer Kaydı Görmek İstiyorum" : null} />
                                        <DottedRow label="Max Tramer" value={features.tramer_limit && `${Number(features.tramer_limit).toLocaleString("tr-TR")} TL`} isRed />
                                        <DottedRow label="Kat" value={features.kat} />
                                        <DottedRow label="Isıtma" value={features.isitma} />
                                        <DottedRow label="Yapı Yaşı" value={features.yapi_yasi} />
                                    </div>

                                    {(features.eksper_raporu_istiyorum || features.katilim_finansi) && (
                                        <div className="mt-3 space-y-2">
                                            {features.eksper_raporu_istiyorum && (
                                                <div className="flex items-start gap-2 p-2.5 border border-purple-100 bg-purple-50/30 rounded">
                                                    <ShieldCheck className="text-purple-600 mt-0.5 flex-shrink-0" size={13} />
                                                    <div>
                                                        <p className="text-[10px] font-bold text-purple-950">TSE Onaylı Ekspertiz Zorunlu</p>
                                                        <p className="text-[9px] text-purple-700 font-medium mt-0.5 leading-relaxed">
                                                            Alıcı, satım öncesinde güncel ekspertiz raporu talep etmektedir.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            {features.katilim_finansi && (
                                                <div className="flex items-start gap-2 p-2.5 border border-green-100 bg-green-50/30 rounded">
                                                    <Star className="text-green-600 mt-0.5 flex-shrink-0" size={13} />
                                                    <div>
                                                        <p className="text-[10px] font-bold text-green-950">Katılım Finansı Uyumlu</p>
                                                        <p className="text-[9px] text-green-700 font-medium mt-0.5 leading-relaxed">
                                                            Faizsiz finansman kuruluşlarıyla çalışmaya uygunluk aranıyor.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            <OfferModal open={showOfferModal}
                        onClose={() => setShowOfferModal(false)} demand={demand}
                        onSuccess={offer => {
                            setShowOfferModal(false); setMyOffer(offer)
                            setDemand(d => ({ ...d, offers_count: (d.offers_count || 0) + 1 }))
                        }} />

            <OfferModal open={editingMyOffer}
                        offer={editingMyOffer ? myOffer : null}
                        onClose={() => setEditingMyOffer(false)}
                        onSuccess={() => {
                            setEditingMyOffer(false)
                            api.get("/agent/offers")
                                .then(res => {
                                    const list = res.data.data || res.data || []
                                    setMyOffer(list.find(o => o.demand_id === Number(id)) || null)
                                })
                                .catch(() => {})
                        }} />
        </div>
    )
}