// ─────────────────────────────────────────────────────────────
// OfferDetailPage.jsx
// Tek bir teklifin detayı. Rota: /market/:demandId/offers/:offerId
//   - Sol: portföy galerisi + noktalı özellik tablosu + hasar/boya +
//     ekspertiz/güvence + uzman notu
//   - Sağ: teklifi veren uzman kartı + (talep sahibine) kabul/red
//     işlemleri + (kabul sonrası) karşılıklı iletişim bilgisi paylaşımı
// Kabul/Red backend'i: POST /buyer/offers/{id}/accept|reject|review
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
    ArrowLeft, CheckCircle, XCircle, ShieldCheck,
    FileText, ChevronRight, Clock, Award, Eye,
    X, Star, MapPin, Activity, Video, Heart, History, MessageSquare,
    AlertTriangle,
} from "lucide-react"
import Header from "@/components/layout/Header"
import { useAuth } from "@/store/AuthContext"
import { useToast } from "@/components/ui/Toast.jsx"
import api from "@/lib/axios"
import OfferModal from "@/components/market/OfferModal"
import ConversationPanel from "@/components/messages/ConversationPanel.jsx"
import { startConversation } from "@/hooks/useMessages.js"

function formatPrice(val) { return val ? Number(val).toLocaleString("tr-TR") + " TL" : "—" }
function timeAgo(d) {
    if (!d) return "Az önce"
    const diff = Date.now() - new Date(d).getTime()
    const days = Math.floor(diff / 86400000)
    const hrs = Math.floor(diff / 3600000)
    const mins = Math.floor(diff / 60000)
    if (days > 0) return `${days} gün önce`
    if (hrs > 0) return `${hrs} saat önce`
    if (mins > 0) return `${mins} dk önce`
    return "Az önce"
}

const PARCA_LABELS = {
    on_tampon: "Ön Tampon", on_kaput: "Ön Kaput",
    sol_on_camurluk: "Sol Ön Çamurluk", sag_on_camurluk: "Sağ Ön Çamurluk",
    sol_on_kapi: "Sol Ön Kapı", sag_on_kapi: "Sağ Ön Kapı",
    tavan: "Tavan", sol_arka_kapi: "Sol Arka Kapı", sag_arka_kapi: "Sağ Arka Kapı",
    sol_arka_camurluk: "Sol Arka Çamurluk", sag_arka_camurluk: "Sağ Arka Çamurluk",
    bagaj: "Bagaj Kapağı", arka_tampon: "Arka Tampon", direkler: "Direkler (A/B/C)",
}

// ── Noktalı çizgili satır ─────────────────────────────────────
function DottedRow({ label, value, isRed, isPurple }) {
    if (value === undefined || value === null || value === "") return null
    return (
        <div className="flex items-end justify-between py-1.5 text-xs">
            <span className="text-gray-900 font-bold pr-2 bg-white z-10 whitespace-nowrap">{label}</span>
            <div className="flex-1 border-b border-dotted border-gray-300 mb-[3px] mx-1 z-0" />
            <span className={`pl-2 bg-white z-10 font-bold text-right ${
                isRed ? "text-red-600" : isPurple ? "text-purple-700" : "text-gray-800"
            }`}>{value}</span>
        </div>
    )
}

function getImgSrc(img) {
    if (!img) return ""
    if (typeof img === "string") return img
    return img.url || img.full_url || img.path || img.image_url || ""
}

// ── Fotoğraf Galerisi ──────────────────────────────────────────
function PremiumGallery({ images, onZoom }) {
    const [active, setActive] = useState(0)
    const list = (images?.length ? images : []).filter(img => getImgSrc(img))

    if (!list.length) return (
        <div className="flex flex-col items-center justify-center h-52 bg-gray-100 border border-gray-200 rounded-t-sm">
            <Eye size={22} className="text-gray-300 mb-2" />
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fotoğraf Eklenmemiş</p>
        </div>
    )

    return (
        <div className="flex flex-col select-none">
            <div className="relative bg-gray-900 rounded-t-sm overflow-hidden group shadow-sm border border-gray-200" style={{ aspectRatio: "4/3" }}>
                <img src={getImgSrc(list[active])} alt="Portföy Görseli" className="w-full h-full object-cover transition-all duration-300 group-hover:scale-[1.01]" />
                {list.length > 1 && <>
                    <button type="button" onClick={e => { e.stopPropagation(); setActive(i => (i - 1 + list.length) % list.length) }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                        <ArrowLeft size={16} />
                    </button>
                    <button type="button" onClick={e => { e.stopPropagation(); setActive(i => (i + 1) % list.length) }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                        <ArrowLeft size={16} className="rotate-180" />
                    </button>
                </>}
            </div>

            <div className="grid grid-cols-2 border-x border-b border-gray-200 bg-white text-xs font-semibold text-gray-700 rounded-b-sm">
                <button type="button" onClick={() => onZoom(getImgSrc(list[active]))}
                        className="flex items-center justify-center gap-2 py-2.5 border-r border-gray-200 hover:bg-gray-50 text-purple-700 transition-all">
                    <Eye size={13} className="text-purple-600" /> Büyük Fotoğraf
                </button>
                <button type="button" disabled className="flex items-center justify-center gap-2 py-2.5 text-gray-300 cursor-not-allowed">
                    <Video size={13} /> Video
                </button>
            </div>

            {list.length > 1 && (
                <div className="grid grid-cols-5 gap-1.5 mt-2">
                    {list.slice(0, 10).map((img, i) => (
                        <button key={i} type="button" onClick={() => setActive(i)}
                                className={`aspect-[4/3] rounded overflow-hidden border-2 transition-all ${i === active ? "border-purple-600 opacity-100" : "border-gray-200 opacity-60 hover:opacity-100"}`}>
                            <img src={getImgSrc(img)} alt="" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between mt-2 px-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{active + 1}/{list.length} Fotoğraf</span>
                <div className="flex gap-1">
                    {list.slice(0, 5).map((_, i) => (
                        <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? "w-4 bg-purple-600" : "w-1.5 bg-gray-300"}`} />
                    ))}
                </div>
            </div>
        </div>
    )
}

// ── Ana sayfa ─────────────────────────────────────────────────
export default function OfferDetailPage() {
    const { demandId, offerId } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const toast = useToast()

    const [offer, setOffer] = useState(null)
    const [demand, setDemand] = useState(null)
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(null)
    const [confirm, setConfirm] = useState(null)
    const [lightboxImg, setLightboxImg] = useState(null)
    const [extraImages, setExtraImages] = useState(null)
    const [editingOffer, setEditingOffer] = useState(false)
    const [showConversation, setShowConversation] = useState(false)
    const [startingConversation, setStartingConversation] = useState(false)

    useEffect(() => {
        setLoading(true)
        const fetchOffer = () =>
            api.get(`/buyer/offers/${offerId}`)
                .catch(err => {
                    if (err.response?.status === 403) return api.get(`/agent/offers/${offerId}`)
                    throw err
                })

        fetchOffer()
            .then(oRes => {
                const o = oRes.data.data || oRes.data
                setOffer(o)
                setDemand(o.demand || null)

                const hasImages = o?.portfolio_item?.images?.length > 0
                const pId = o?.portfolio_item_id || o?.portfolio_item?.id
                if (!hasImages && pId) {
                    api.get(`/agent/portfolio/${pId}`)
                        .then(r => {
                            const item = r.data.data || r.data
                            if (item?.images?.length) setExtraImages(item.images)
                        })
                        .catch(() => {})
                }
            })
            .catch(() => setOffer(null))
            .finally(() => setLoading(false))
    }, [demandId, offerId])

    const isOwner = user?.id === demand?.user_id
    const isAgent = user?.id === offer?.user_id
    const isPending = offer?.status === "pending"
    const isReviewing = offer?.status === "reviewing"
    const isAccepted = offer?.status === "accepted"
    const isRejected = offer?.status === "rejected"
    const isWithdrawn = offer?.status === "withdrawn"
    const isSaleConfirmed = !!offer?.sale_confirmed_at
    const pf = offer?.portfolio_item?.features || {}
    const images = extraImages || offer?.portfolio_item?.images || []
    const parcaDurumlari = pf.parca_durumlari || {}
    const boyalilar = Object.entries(parcaDurumlari).filter(([, v]) => v === "boyali" || v === "lokal_boyali")
    const degisenler = Object.entries(parcaDurumlari).filter(([, v]) => v === "degisen")
    const hasarVar = boyalilar.length > 0 || degisenler.length > 0

    const handleAccept = async () => {
        setProcessing("accept")
        try {
            await api.post(`/buyer/offers/${offerId}/accept`)
            toast({ message: "Teklif kabul edildi!" })
            setOffer(o => ({ ...o, status: "accepted" })); setConfirm(null)
        } catch { toast({ message: "İşlem başarısız.", type: "error" }) }
        finally { setProcessing(null) }
    }
    const handleReject = async () => {
        setProcessing("reject")
        try {
            await api.post(`/buyer/offers/${offerId}/reject`)
            toast({ message: "Teklif elendi." })
            setOffer(o => ({ ...o, status: "rejected" })); setConfirm(null)
        } catch { toast({ message: "İşlem başarısız.", type: "error" }) }
        finally { setProcessing(null) }
    }
    const handleEvaluate = async () => {
        setProcessing("review")
        try {
            await api.post(`/buyer/offers/${offerId}/review`)
            toast({ message: "Teklif değerlendirmeye alındı." })
            setOffer(o => ({ ...o, status: "reviewing" }))
        } catch { toast({ message: "İşlem başarısız.", type: "error" }) }
        finally { setProcessing(null) }
    }
    const handleToggleFavorite = async () => {
        setProcessing("favorite")
        try {
            const res = await api.post(`/buyer/offers/${offerId}/favorite`)
            setOffer(o => ({ ...o, is_favorited: res.data.is_favorited }))
            toast({ message: res.data.message })
        } catch { toast({ message: "İşlem başarısız.", type: "error" }) }
        finally { setProcessing(null) }
    }
    // Mesajlaşma — SADECE talep sahibi görüşme başlatabilir (backend
    // ConversationController::start() da bunu ayrıca doğruluyor). Acente
    // tarafı, konuşma zaten varsa mesajlaşma panelini açabilir.
    const handleStartConversation = async () => {
        if (offer?.conversation_id) { setShowConversation(true); return }
        setStartingConversation(true)
        try {
            const res = await startConversation(offer.id)
            const conv = res?.data || res
            setOffer(o => ({ ...o, conversation_id: conv?.id }))
            setShowConversation(true)
        } catch { toast({ message: "Görüşme başlatılamadı.", type: "error" }) }
        finally { setStartingConversation(false) }
    }

    // Kabul edilmiş bir teklif, gerçek satış tamamlanana kadar KESİN
    // değildir. Acente bu aşamada vazgeçebilir (satış gerçekleşmediyse).
    const handleWithdraw = async () => {
        setProcessing("withdraw")
        try {
            await api.post(`/agent/offers/${offerId}/withdraw`)
            toast({ message: "Teklifiniz geri çekildi." })
            setOffer(o => ({ ...o, status: "withdrawn" }))
            setDemand(d => (d ? { ...d, status: "active" } : d))
        } catch (err) {
            toast({ message: err.response?.data?.message || "İşlem başarısız.", type: "error" })
        } finally { setProcessing(null) }
    }

    // Talep sahibi, gerçek satışın tamamlandığını onaylar — bu KESİN bir
    // işlemdir, bundan sonra acente artık vazgeçemez.
    const handleConfirmSale = async () => {
        setProcessing("confirm-sale")
        try {
            await api.post(`/buyer/offers/${offerId}/confirm-sale`)
            toast({ message: "Satış onaylandı." })
            setOffer(o => ({ ...o, sale_confirmed_at: new Date().toISOString(), can_confirm_sale: false }))
            setDemand(d => (d ? { ...d, status: "completed" } : d))
        } catch (err) {
            toast({ message: err.response?.data?.message || "İşlem başarısız.", type: "error" })
        } finally { setProcessing(null) }
    }

    if (loading) return (
        <div className="min-h-screen bg-gray-200 flex flex-col">
            <Header />
            <div className="flex flex-col items-center justify-center flex-1 gap-3">
                <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Yükleniyor...</p>
            </div>
        </div>
    )
    if (!loading && !offer) return (
        <div className="min-h-screen bg-gray-200 flex flex-col">
            <Header />
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-gray-400">
                <div className="w-7 h-7 border-2 border-gray-300 border-t-transparent rounded-full" />
                <button onClick={() => navigate(-1)} className="text-xs text-purple-700 font-bold hover:underline flex items-center gap-1">
                    <ArrowLeft size={11} /> Geri Dön
                </button>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-200 flex flex-col">
            <Header />
            <div className="max-w-[1200px] mx-auto w-full px-4 py-6 flex-1">

                {/* Breadcrumb — /demands/create/vehicle (DemandLayout.jsx) ile aynı stil */}
                <nav className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-gray-400 mb-6 flex-wrap" aria-label="Breadcrumb">
                    <button onClick={() => navigate("/")} className="hover:text-purple-700 transition-colors">Ana Sayfa</button>
                    <ChevronRight size={10} />
                    <button onClick={() => navigate("/market")} className="hover:text-purple-700 transition-colors">Pazaryeri</button>
                    <ChevronRight size={10} />
                    <button onClick={() => navigate(`/market/${demandId}`)} className="hover:text-purple-700 transition-colors truncate max-w-[160px]">
                        {demand?.title || `İlan #${demandId}`}
                    </button>
                    <ChevronRight size={10} />
                    <span className="text-gray-700">Teklif Detayı</span>
                </nav>

                {/* Üst bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                    <button onClick={() => navigate(`/market/${demandId}`)}
                            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-purple-700 transition-colors">
                        <ArrowLeft size={14} /> İlana Dön
                    </button>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded shadow-sm flex items-center gap-1.5">
                            <Clock size={11} className="text-purple-600" /> {timeAgo(offer.created_at)}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded shadow-sm flex items-center gap-1.5">
                            <Activity size={11} className="text-green-500" /> Teklif No: #{offer.id}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded border shadow-sm flex items-center gap-1.5 ${
                            isSaleConfirmed ? "bg-green-100 text-green-800 border-green-300"
                                : isAccepted ? "bg-green-50 text-green-700 border-green-200"
                                    : isWithdrawn ? "bg-orange-50 text-orange-600 border-orange-200"
                                        : isRejected ? "bg-gray-100 text-gray-400 border-gray-200"
                                            : isReviewing ? "bg-amber-50 text-amber-700 border-amber-200"
                                                : "bg-purple-50 text-purple-700 border-purple-100"
                        }`}>
                            {isSaleConfirmed ? <><Award size={11} />Satış Tamamlandı</>
                                : isAccepted ? <><CheckCircle size={11} />Kabul Edildi (Ön Anlaşma)</>
                                    : isWithdrawn ? <><XCircle size={11} />Geri Çekildi</>
                                        : isRejected ? <><XCircle size={11} />Elendi</>
                                            : isReviewing ? <><Eye size={11} />Değerlendiriliyor</>
                                                : <><Clock size={11} />Karar Bekliyor</>}
                        </span>
                    </div>
                </div>

                {/* ── 2'li grid: Orta (8) içerik + Sağ (4) acente/aksiyon/özet paneli. ── */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

                    {/* ── ORTA (8) ── */}
                            <div className="xl:col-span-8 space-y-4">

                                <div className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm p-5 sm:p-6">
                                    <div className="flex items-start justify-between gap-3">
                                        <h1 className="text-base sm:text-lg font-bold text-gray-800 tracking-tight leading-snug">
                                            {offer.portfolio_item?.title || [pf.marka, pf.model, pf.versiyon, pf.yil].filter(Boolean).join(" ") || demand?.title}
                                        </h1>
                                        {(isOwner && demand?.status === "active") && (
                                            <button type="button" onClick={handleToggleFavorite} disabled={processing === "favorite"}
                                                    className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all disabled:opacity-50"
                                                    aria-label={offer.is_favorited ? "Favoriden Çıkar" : "Favorilere Ekle"}>
                                                <Heart size={16} className={`text-red-600 ${offer.is_favorited ? "fill-current" : ""}`} />
                                            </button>
                                        )}
                                    </div>
                                    <p className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 mt-1 mb-4">
                                        <MapPin size={11} className="text-purple-400 flex-shrink-0" />
                                        {[pf.ilce, pf.il].filter(Boolean).join(", ") || offer.portfolio_item?.district || "Türkiye"}
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                        <div className="md:col-span-7">
                                            <PremiumGallery images={images} onZoom={src => setLightboxImg(src)} />
                                        </div>

                                        <div className="md:col-span-5 flex flex-col">
                                            <div className="space-y-0 flex-1">
                                                <DottedRow label="Teklif Fiyatı" value={formatPrice(offer.price)} isPurple />
                                                <DottedRow label="İlan No" value={offer.id ? String(1323440000 + offer.id) : ""} isRed />
                                                <DottedRow label="İlan Tarihi" value={offer.created_at ? new Date(offer.created_at).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" }) : ""} />
                                                <DottedRow label="Marka" value={pf.marka} />
                                                <DottedRow label="Seri / Model" value={pf.model} />
                                                <DottedRow label="Donanım" value={pf.versiyon} />
                                                <DottedRow label="Yıl" value={pf.yil} />
                                                <DottedRow label="Yakıt Tipi" value={pf.yakit} />
                                                <DottedRow label="Vites" value={pf.vites} />
                                                <DottedRow label="Araç Durumu" value={pf.arac_durumu || "İkinci El"} />
                                                <DottedRow label="KM" value={pf.km} />
                                                <DottedRow label="Kasa Tipi" value={pf.kasa_tipi} />
                                                <DottedRow label="Motor Gücü" value={pf.motor_gucu} />
                                                <DottedRow label="Motor Hacmi" value={pf.motor_hacmi} />
                                                <DottedRow label="Çekiş" value={pf.cekis} />
                                                <DottedRow label="Renk" value={pf.renk} />
                                                <DottedRow label="Garanti" value={pf.garanti === true ? "Evet" : pf.garanti === false ? "Hayır" : pf.garanti} />
                                                <DottedRow label="Ağır Hasar Kayıtlı" value={pf.hasar_kayitli || (hasarVar ? "Var" : "Hayır")} />
                                                <DottedRow label="Plaka / Uyruk" value={pf.plaka} />
                                                <DottedRow label="Şasi No" value={pf.sasi_no} />
                                                <DottedRow label="Kimden" value={offer.user?.agent_type === "galerici" ? "Galeriden" : "Sahibinden"} isRed />
                                                <DottedRow label="Takas" value={pf.takas === "evet" ? "Var" : "Hayır"} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Hasar & Boya */}
                                <div className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm">
                                    <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle size={15} className={hasarVar ? "text-red-600" : "text-gray-700"} />
                                            <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Hasar & Boya Durumu</h2>
                                        </div>
                                        {!hasarVar && (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-full">
                                                <CheckCircle size={10} /> HATASIZ BOYASIZ
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        {hasarVar ? (
                                            <div className="space-y-4">
                                                {boyalilar.length > 0 && (
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700 mb-2 flex items-center gap-1.5">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                                                            Boyalı veya Lokal Boyalı Parçalar ({boyalilar.length} Adet)
                                                        </p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {boyalilar.map(([k, v]) => (
                                                                <span key={k} className={`text-[10px] font-bold px-3 py-1.5 rounded border ${v === "lokal_boyali" ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-purple-50 text-purple-800 border-purple-200"}`}>
                                                                    {PARCA_LABELS[k] || k} {v === "lokal_boyali" ? "(Lokal Boya)" : "(Boya)"}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {degisenler.length > 0 && (
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-red-700 mb-2 flex items-center gap-1.5">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                                                            Değişen Parçalar ({degisenler.length} Adet)
                                                        </p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {degisenler.map(([k]) => (
                                                                <span key={k} className="text-[10px] font-bold px-3 py-1.5 rounded border bg-red-50 text-red-700 border-red-200">
                                                                    {PARCA_LABELS[k] || k} (Değişen)
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 p-4 bg-green-50/40 border border-green-100 rounded-sm">
                                                <Award className="text-green-600 flex-shrink-0" size={22} />
                                                <div>
                                                    <p className="text-xs font-bold text-green-800">Kusursuz / Hatasız Kaporta</p>
                                                    <p className="text-[10px] text-green-600 font-medium mt-0.5">Araç kaportasında boyanan ya da değişen herhangi bir parça bulunmamaktadır.</p>
                                                </div>
                                            </div>
                                        )}

                                        {pf.tramer_bilgisi_paylasiyorum && (
                                            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-sm flex items-start gap-3">
                                                <FileText className="text-purple-600 mt-0.5" size={16} />
                                                <div>
                                                    <p className="text-xs font-bold text-gray-800">Tramer Kaydı Sorgusu</p>
                                                    <p className="text-[11px] text-gray-500 mt-1">
                                                        Sorgulanan tramer hasar kaydı tutarı:{" "}
                                                        <span className="font-bold text-gray-900">
                                                            {pf.tramer_tutari ? `${Number(pf.tramer_tutari).toLocaleString("tr-TR")} TL` : "0 TL (Hasar Kaydı Yok)"}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Ekspertiz & Güvence */}
                                {(pf.eksper_raporu_mevcut || pf.katilim_finansi_uyumlu) && (
                                    <div className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm">
                                        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex items-center gap-2">
                                            <Award size={15} className="text-purple-600" />
                                            <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Ekspertiz & Güvence</h2>
                                        </div>
                                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {pf.eksper_raporu_mevcut && (
                                                <div className="flex items-start gap-3 p-4 border border-purple-100 bg-purple-50/30 rounded-sm">
                                                    <Award className="text-purple-600 mt-0.5 flex-shrink-0" size={18} />
                                                    <div>
                                                        <p className="text-xs font-bold text-purple-950">Eksper Raporu Mevcut</p>
                                                        <p className="text-[10px] text-purple-700 font-medium mt-1 leading-relaxed">
                                                            Yetkili eksper tarafından hazırlanan güncel rapor satış esnasında alıcıya teslim edilecektir.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            {pf.katilim_finansi_uyumlu && (
                                                <div className="flex items-start gap-3 p-4 border border-green-100 bg-green-50/30 rounded-sm">
                                                    <Star className="text-green-600 mt-0.5 flex-shrink-0" size={18} />
                                                    <div>
                                                        <p className="text-xs font-bold text-green-950">Katılım Finansı Uyumlu</p>
                                                        <p className="text-[10px] text-green-700 font-medium mt-1 leading-relaxed">
                                                            Bu araç katılım bankalarının faizsiz ticaret koşullarına tam uyumludur.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Uzman notu */}
                                {offer.message && (
                                    <div className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm">
                                        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex items-center gap-2">
                                            <FileText size={15} className="text-gray-700" />
                                            <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Acente & Satıcı Notu</h2>
                                        </div>
                                        <div className="p-4">
                                            <div className="text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-sm p-4 italic leading-relaxed font-medium">
                                                "{offer.message}"
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Güncelleme geçmişi — her düzenlemeden önceki eski hali
                                    offer_revisions tablosunda ayrı ayrı saklanıyor. */}
                                {offer.revisions?.length > 0 && (
                                    <div className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm">
                                        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <History size={15} className="text-gray-700" />
                                                <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Güncelleme Geçmişi</h2>
                                            </div>
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                                {offer.revisions.length} kez güncellendi
                                            </span>
                                        </div>
                                        <div className="p-4 flex flex-col gap-2">
                                            {offer.revisions.map((rev, i) => (
                                                <div key={rev.id ?? i} className="flex items-start justify-between gap-3 text-xs bg-gray-50 border border-gray-100 rounded-sm px-3.5 py-2.5">
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-gray-700">
                                                            {Number(rev.price).toLocaleString("tr-TR")} ₺
                                                        </p>
                                                        {rev.message && (
                                                            <p className="text-gray-400 italic mt-0.5 truncate">"{rev.message}"</p>
                                                        )}
                                                    </div>
                                                    <span className="text-[9px] text-gray-400 font-semibold whitespace-nowrap flex-shrink-0 mt-0.5">
                                                        {rev.created_at ? new Date(rev.created_at).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : ""}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ── SAĞ (4) ── */}
                            <div className="xl:col-span-4">
                                <div className="space-y-4 sticky top-4">

                                    {/* Acente kartı */}
                                    <div className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm">
                                        <div className="p-4 flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded bg-gradient-to-br from-gray-800 to-gray-950 flex items-center justify-center font-bold text-white text-base shadow-sm flex-shrink-0">
                                                    {offer.user?.company_name?.charAt(0) || offer.user?.name?.charAt(0) || "U"}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm leading-snug">
                                                        {offer.user?.company_name || offer.user?.name}
                                                    </p>
                                                    <span className="text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-1 uppercase tracking-wider">
                                                        <ShieldCheck size={9} /> Yetkili Acente
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center flex-shrink-0">
                                                <Award size={20} className="text-green-600" />
                                                <span className="text-xs font-extrabold text-green-600 mt-0.5">%100</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* İşlemler — sadece ilan sahibine. LeftPanel.jsx'teki ("Araç
                                        Talebi" seçim kartı) ile BİREBİR aynı stil: başlık şeridi
                                        (ikon + başlık + mor nokta alt metin) + ikon kutulu satırlar.
                                        Mesajlaşma satırı da (sahip veya konuşması olan acente için)
                                        aynı kart içine, aynı satır stiliyle eklendi. */}
                                    {(isOwner || (isAgent && offer.conversation_id)) && (
                                        <div className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm">
                                            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                                                <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">İşlemler</h2>
                                                <p className="text-[10px] font-medium text-gray-500 mt-0.5 flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />
                                                    Bu teklif için bir aksiyon seçin
                                                </p>
                                            </div>
                                            <div className="p-3 space-y-2">
                                                {isOwner && demand?.status === "active" && (
                                                <>
                                                {!confirm && (
                                                    <>
                                                        {isPending && (
                                                            <button type="button" onClick={handleEvaluate} disabled={processing === "review"}
                                                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded border bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-left disabled:opacity-50">
                                                                <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 bg-amber-50">
                                                                    <Eye size={15} className="text-amber-600" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[11px] font-bold text-gray-700">
                                                                        {processing === "review" ? "İşleniyor..." : "Değerlendiriliyor Olarak İşaretle"}
                                                                    </p>
                                                                    <p className="text-[9px] font-medium mt-0.5 text-gray-400">Teklifi incelemeye aldığınızı belirtin</p>
                                                                </div>
                                                            </button>
                                                        )}

                                                        {(isPending || isReviewing) && (
                                                            <button type="button" onClick={() => setConfirm("accept")}
                                                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded border bg-white border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all text-left">
                                                                <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 bg-green-50">
                                                                    <CheckCircle size={15} className="text-green-600" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[11px] font-bold text-gray-700">Teklifi Kabul Et</p>
                                                                    <p className="text-[9px] font-medium mt-0.5 text-gray-400">Diğer teklifler otomatik elenir</p>
                                                                </div>
                                                            </button>
                                                        )}

                                                        {(isPending || isReviewing) && (
                                                            <button type="button" onClick={() => setConfirm("reject")}
                                                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded border bg-white border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all text-left">
                                                                <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 bg-red-50">
                                                                    <XCircle size={15} className="text-red-600" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[11px] font-bold text-gray-700">Teklifi Reddet</p>
                                                                    <p className="text-[9px] font-medium mt-0.5 text-gray-400">Bu teklifi listeden çıkarın</p>
                                                                </div>
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                                {confirm === "accept" && (
                                                    <div className="space-y-2">
                                                        <div className="bg-amber-50 border border-amber-200 rounded-sm p-3">
                                                            <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">Emin misiniz?</p>
                                                            <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                                                                Bu teklifi kabul ettiğinizde diğer tüm teklifler otomatik elenecek ve acente ile iletişim bilgileriniz paylaşılacaktır.
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-1.5">
                                                            <button type="button" onClick={() => setConfirm(null)} disabled={!!processing}
                                                                    className="flex-1 py-2 text-[10px] font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-sm transition-all">
                                                                İptal
                                                            </button>
                                                            <button type="button" onClick={handleAccept} disabled={!!processing}
                                                                    className="flex-1 py-2 text-[10px] font-bold text-white bg-green-600 hover:bg-green-700 rounded-sm flex items-center justify-center gap-1.5 transition-all">
                                                                {processing === "accept" ? "İşleniyor..." : "Evet, Kabul Et"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                                {confirm === "reject" && (
                                                    <div className="space-y-2">
                                                        <div className="bg-red-50 border border-red-200 rounded-sm p-3">
                                                            <p className="text-[10px] font-bold text-red-900 uppercase tracking-wider mb-1">Emin misiniz?</p>
                                                            <p className="text-[10px] text-red-800 leading-relaxed font-medium">Bu işlem geri alınamaz.</p>
                                                        </div>
                                                        <div className="flex gap-1.5">
                                                            <button type="button" onClick={() => setConfirm(null)} disabled={!!processing}
                                                                    className="flex-1 py-2 text-[10px] font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-sm transition-all">
                                                                Vazgeç
                                                            </button>
                                                            <button type="button" onClick={handleReject} disabled={!!processing}
                                                                    className="flex-1 py-2 text-[10px] font-bold text-white bg-red-600 hover:bg-red-700 rounded-sm flex items-center justify-center gap-1.5 transition-all">
                                                                {processing === "reject" ? "İşleniyor..." : "Evet, Reddet"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                                {(isAccepted || isRejected) && (
                                                    <p className="text-[10px] text-gray-400 font-bold text-center py-1.5 bg-gray-50 border border-gray-100 rounded-sm">
                                                        {isAccepted ? "✓ Bu teklif kabul edildi." : "Bu teklif elendi."}
                                                    </p>
                                                )}
                                                </>
                                                )}

                                                {/* Mesajlaşma satırı — SADECE talep sahibi görüşme başlatabilir
                                                    (backend ConversationController::start() bunu ayrıca
                                                    doğruluyor); acente tarafı yalnızca zaten var olan bir
                                                    konuşmaya mesaj yazabilir. */}
                                                {(isOwner || (isAgent && offer.conversation_id)) && (
                                                    offer.conversation_id ? (
                                                        <button type="button" onClick={() => setShowConversation(true)}
                                                                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded border bg-purple-50 border-purple-200 hover:border-purple-300 hover:bg-purple-100 transition-all text-left">
                                                            <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 bg-purple-100">
                                                                <MessageSquare size={15} className="text-purple-700" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[11px] font-bold text-purple-800">Mesajlaşmayı Aç</p>
                                                                <p className="text-[9px] font-medium mt-0.5 text-purple-500">Uzmanla doğrudan yazışın</p>
                                                            </div>
                                                        </button>
                                                    ) : (
                                                        <button type="button" onClick={handleStartConversation} disabled={startingConversation}
                                                                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded border bg-white border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all text-left disabled:opacity-50">
                                                            <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 bg-purple-50">
                                                                <MessageSquare size={15} className="text-purple-600" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[11px] font-bold text-gray-700">
                                                                    {startingConversation ? "Başlatılıyor..." : "Görüşme Başlat"}
                                                                </p>
                                                                <p className="text-[9px] font-medium mt-0.5 text-gray-400">Uzmanla doğrudan yazışın</p>
                                                            </div>
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Satış Süreci — "kabul edildi" KESİN bir final değil, bir ön
                                        anlaşmadır. Gerçek satış tamamlanana kadar acente vazgeçebilir,
                                        talep sahibi satışı onaylayarak süreci kesinleştirir. Bu kart
                                        demand.status'tan bağımsız çalışır (kabul sonrası demand zaten
                                        'active' değil, 'matched' olur). */}
                                    {isAccepted && (
                                        <div className={`border rounded-sm overflow-hidden shadow-sm ${
                                            isSaleConfirmed ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
                                        }`}>
                                            <div className={`border-b px-4 py-3 flex items-center gap-2 ${
                                                isSaleConfirmed ? "border-green-200 bg-green-100/40" : "border-gray-200 bg-gray-50"
                                            }`}>
                                                <Award size={15} className={isSaleConfirmed ? "text-green-700" : "text-gray-700"} />
                                                <h2 className={`text-xs font-bold uppercase tracking-wide ${isSaleConfirmed ? "text-green-800" : "text-gray-800"}`}>Satış Süreci</h2>
                                            </div>
                                            <div className="p-4">
                                                {isSaleConfirmed ? (
                                                    <p className="text-xs text-green-800 font-bold text-center py-1.5 flex items-center justify-center gap-1.5">
                                                        <CheckCircle size={14} /> Satış tamamlandı, teklif kesinleşti.
                                                    </p>
                                                ) : isOwner ? (
                                                    <>
                                                        <p className="text-[10px] text-gray-400 font-medium leading-relaxed mb-3">
                                                            Bu teklif şu an bir ön anlaşma durumunda. Araç/ilan gerçekten el
                                                            değiştirdiyse satışı onaylayın — onayladıktan sonra acente artık
                                                            bu teklifinden vazgeçemez.
                                                        </p>
                                                        <button type="button" onClick={handleConfirmSale} disabled={processing === "confirm-sale"}
                                                                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98] disabled:opacity-50">
                                                            <CheckCircle size={14} /> {processing === "confirm-sale" ? "İşleniyor..." : "Satışı Onayla"}
                                                        </button>
                                                    </>
                                                ) : isAgent ? (
                                                    <>
                                                        <p className="text-[10px] text-gray-400 font-medium leading-relaxed mb-3">
                                                            Bu teklif kabul edildi ama henüz kesinleşmedi. Satış gerçekleşmediyse
                                                            (ör. alıcı vazgeçti) teklifinizden geri çekilebilirsiniz — talep tekrar
                                                            yayına girer.
                                                        </p>
                                                        <button type="button" onClick={handleWithdraw} disabled={processing === "withdraw"}
                                                                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 py-2.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98] disabled:opacity-50">
                                                            <XCircle size={14} /> {processing === "withdraw" ? "İşleniyor..." : "Tekliften Vazgeç"}
                                                        </button>
                                                    </>
                                                ) : null}
                                            </div>
                                        </div>
                                    )}

                                    {isWithdrawn && (
                                        <div className="bg-orange-50 border border-orange-200 rounded-sm p-3 flex items-center justify-between gap-2.5 flex-wrap">
                                            <div className="flex items-center gap-2.5">
                                                <XCircle size={14} className="text-orange-500 flex-shrink-0" />
                                                <p className="text-[11px] text-orange-700 font-bold">
                                                    {isAgent ? "Bu teklifinizden vazgeçtiniz." : "Acente bu teklifinden vazgeçti."}
                                                </p>
                                            </div>
                                            {isAgent && (
                                                <button type="button" onClick={() => setEditingOffer(true)}
                                                        className="text-[10px] font-bold uppercase tracking-wider bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-sm transition-colors flex-shrink-0">
                                                    Teklifi Düzenle ve Yeniden Gönder
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Koyu ipucu kartı */}
                                    <div className="relative overflow-hidden bg-gray-950 border border-gray-800 rounded-sm p-5 text-white shadow-lg">
                                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
                                        <div className="relative z-10">
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-purple-400 mb-1.5">Müşteri Güvencesi</p>
                                            <h3 className="font-bold text-sm text-white leading-snug mb-1">Güvenli ve Şeffaf Satış</h3>
                                            <p className="text-gray-400 text-[10px] font-medium leading-relaxed">
                                                Tüm ürün detayları, boyalı/değişen durumları ve kaza geçmişleri uzman acente tarafından taahhüt edilmiştir. Satış öncesi dilediğiniz ekspertiz merkezinde doğrulama yapabilirsiniz.
                                            </p>
                                        </div>
                                    </div>

                                    <button onClick={() => navigate(`/market/${demandId}`)}
                                            className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-gray-500 border border-gray-200 hover:bg-gray-50 rounded-sm transition-colors">
                                        <ArrowLeft size={12} /> İlana Geri Dön
                                    </button>
                                </div>
                            </div>

                </div>
            </div>

            {/* Lightbox */}
            {lightboxImg && (
                <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setLightboxImg(null)}>
                    <button type="button" className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"
                            onClick={() => setLightboxImg(null)}>
                        <X size={18} />
                    </button>
                    <img src={lightboxImg} alt="Büyük Görsel" className="max-w-full max-h-[90vh] object-contain rounded-sm shadow-2xl" />
                </div>
            )}

            {/* Geri çekilmiş teklifi düzenleyip yeniden gönderme — backend
                update() withdrawn teklifi 'pending'e döndürerek yeniden
                aktifleştiriyor (bkz. OfferController::update()). */}
            <OfferModal open={editingOffer}
                        offer={editingOffer ? offer : null}
                        demand={demand}
                        onClose={() => setEditingOffer(false)}
                        onSuccess={() => {
                            setEditingOffer(false)
                            api.get(`/agent/offers/${offerId}`)
                                .then(res => setOffer(res.data.data || res.data))
                                .catch(() => setOffer(o => ({ ...o, status: "pending" })))
                        }} />

            {showConversation && offer?.conversation_id && (
                <ConversationPanel
                    conversationId={offer.conversation_id}
                    conversationMeta={{
                        demand_title: demand?.title,
                        other_party: isOwner ? offer?.user : demand?.user,
                    }}
                    onClose={() => setShowConversation(false)}
                />
            )}
        </div>
    )
}