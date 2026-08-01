// ─────────────────────────────────────────────────────────────
// OfferModal.jsx
// Agent'ın bir talebe teklif vermesi / mevcut teklifini düzenlemesi.
//   `offer` verilirse: düzenleme modu (PUT /agent/offers/{offer.id})
//   `offer` verilmezse: yeni teklif modu (POST /agent/demands/{id}/offers)
// Portföy eşleştirme: GET /agent/demands/{id}/matching-portfolio
// (backend match_percent ile benzerlik sıralı döner — bkz. PortfolioMatcher).
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react"
import { X, Send, TrendingUp, Package, Car, Building2, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/Toast.jsx"
import { useAuth } from "@/store/AuthContext.jsx"
import api from "@/lib/axios.js"

const STATUS_MAP = {
    available: { label: "Satışta", cls: "bg-green-50 text-green-700 border-green-100" },
    reserved:  { label: "Rezerve", cls: "bg-amber-50 text-amber-700 border-amber-100" },
    sold:      { label: "Satıldı", cls: "bg-gray-100 text-gray-500 border-gray-200" },
}

// ── Benzerlik rengi (yüzde backend'den gelir: match_percent) ──────
function similarityColor(pct) {
    if (pct >= 85) return { text: "text-green-700", bg: "bg-green-50 border-green-200", bar: "bg-green-500" }
    if (pct >= 65) return { text: "text-purple-700", bg: "bg-purple-50 border-purple-200", bar: "bg-purple-500" }
    if (pct >= 40) return { text: "text-amber-700", bg: "bg-amber-50 border-amber-200", bar: "bg-amber-400" }
    return { text: "text-gray-500", bg: "bg-gray-50 border-gray-200", bar: "bg-gray-300" }
}

// ── Portföy ilan satırı ──────────────────────────────────────────
function PortfolioItemRow({ item, checked, onToggle }) {
    const status = STATUS_MAP[item.status] || STATUS_MAP.available
    const Icon = item.type === "vasita" ? Car : Building2
    const img = item.cover_url || item.cover || item.images?.[0]?.url
    const similarity = item.match_percent ?? 0
    const col = similarityColor(similarity)

    return (
        <button type="button" onClick={() => onToggle(item)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded border text-left transition-all ${
                    checked ? "border-purple-400 bg-purple-50/60 shadow-sm" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                checked ? "border-purple-600 bg-purple-600" : "border-gray-300 bg-white"
            }`}>
                {checked && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>

            {img ? (
                <img src={img} alt={item.title} className="w-10 h-10 rounded object-cover flex-shrink-0 border border-gray-100" />
            ) : (
                <div className="w-10 h-10 rounded bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300 flex-shrink-0">
                    <Icon size={16} />
                </div>
            )}

            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">{item.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[11px] text-gray-400">
                        {item.price ? `${Number(item.price).toLocaleString("tr-TR")} ₺` : "Fiyat yok"}
                    </p>
                    <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${col.bar}`} style={{ width: `${similarity}%` }} />
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${col.bg} ${col.text}`}>%{similarity} eşleşme</span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${status.cls}`}>{status.label}</span>
            </div>
        </button>
    )
}

// ── Ana Modal ────────────────────────────────────────────────────
export default function OfferModal({ open, onClose, demand, offer, onSuccess }) {
    const { user } = useAuth()
    const toast = useToast()
    const isEdit = !!offer

    const [form, setForm] = useState({ price: "", message: "" })
    const [priceEdited, setPriceEdited] = useState(false)
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)

    const [portfolioItems, setPortfolioItems] = useState([])
    const [portfolioLoading, setPortfolioLoading] = useState(false)
    const [selectedIds, setSelectedIds] = useState([])

    const [resolvedDemand, setResolvedDemand] = useState(null)
    const [demandLoading, setDemandLoading] = useState(false)

    useEffect(() => {
        if (!open) return
        if (isEdit) {
            setDemandLoading(true)
            api.get(`/demands/${offer.demand_id}`)
                .then(res => setResolvedDemand(res.data.data || res.data))
                .catch(() => setResolvedDemand(offer.demand || demand || null))
                .finally(() => setDemandLoading(false))
        } else {
            setResolvedDemand(demand || null)
        }
    }, [open, isEdit, offer, demand])

    useEffect(() => {
        if (!open) return
        if (isEdit) {
            setForm({ price: String(offer.price ?? ""), message: offer.message || "" })
            setPriceEdited(true)
            setSelectedIds(offer.portfolio_item_id ? [offer.portfolio_item_id] : [])
        } else {
            setForm({ price: "", message: "" })
            setPriceEdited(false)
            setSelectedIds([])
        }
        setErrors({})
    }, [open, isEdit, offer])

    useEffect(() => {
        if (!open || !resolvedDemand?.id) return
        setPortfolioLoading(true)
        api.get(`/agent/demands/${resolvedDemand.id}/matching-portfolio`)
            .then(res => setPortfolioItems(res.data.data || res.data || []))
            .catch(() => setPortfolioItems([]))
            .finally(() => setPortfolioLoading(false))
    }, [open, resolvedDemand?.id])

    const toggleItem = (item) => {
        const alreadySelected = selectedIds[0] === item.id
        if (alreadySelected) {
            setSelectedIds([])
            setForm(f => ({ ...f, price: "", message: "" }))
            setPriceEdited(false)
        } else {
            setSelectedIds([item.id])
            const garanti = item.features?.garanti_cumlesi || ""
            const desc = [item.description, garanti].filter(Boolean).join("\n\n")
            setForm(f => ({ ...f, price: String(item.price || ""), message: desc }))
            setPriceEdited(false)
        }
    }

    const handleClose = () => {
        setForm({ price: "", message: "" })
        setErrors({})
        setSelectedIds([])
        setPriceEdited(false)
        onClose()
    }

    const submit = async () => {
        setErrors({}); setLoading(true)
        const payload = { ...form, portfolio_item_id: selectedIds[0] || null }
        try {
            if (isEdit) {
                await api.put(`/agent/offers/${offer.id}`, payload)
                toast({ message: "Teklifiniz güncellendi!" })
            } else {
                await api.post(`/agent/demands/${resolvedDemand.id}/offers`, payload)
                toast({ message: "Teklifiniz başarıyla gönderildi!" })
            }
            onSuccess?.()
            handleClose()
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors)
            } else if (err.response?.data?.code === "OFFER_NOT_ALLOWED") {
                toast({ message: err.response.data.message || "Bu kategoride teklif verme hakkınız yok. Abonelik satın alın veya kontör yükleyin.", type: "error" })
            } else if (err.response?.data?.code === "OFFER_NOT_PENDING") {
                toast({ message: err.response.data.message || "Bu teklif artık güncellenemez.", type: "error" })
                onSuccess?.()
                handleClose()
            } else if (err.response?.data?.code === "OFFER_UPDATE_COOLDOWN") {
                // Spam/hız sınırı: bir teklif en az 10 dakikada bir güncellenebilir.
                toast({ message: err.response.data.message || "Bu teklifi çok sık güncelliyorsunuz, biraz sonra tekrar deneyin.", type: "error" })
            } else {
                toast({ message: err.response?.data?.message || (isEdit ? "Teklif güncellenemedi." : "Teklif gönderilemedi."), type: "error" })
            }
        } finally {
            setLoading(false)
        }
    }

    if (!open) return null

    const remainingOffers = user?.remaining_offers === undefined
        ? "?"
        : user.remaining_offers === Number.MAX_SAFE_INTEGER ? "∞" : user.remaining_offers

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
                    <h2 className="text-lg font-bold text-gray-900">{isEdit ? "Teklifi Düzenle" : "Teklif Ver"}</h2>
                    <button onClick={handleClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {demandLoading || !resolvedDemand ? (
                    <div className="py-10 text-center text-sm text-gray-400">Yükleniyor...</div>
                ) : (
                    <div className="px-6 py-6 overflow-y-auto flex flex-col gap-4">

                        {/* Talep özeti */}
                        <div className="bg-gray-50 rounded p-4">
                            <p className="text-xs text-gray-400 mb-1">Talep</p>
                            <h3 className="font-medium text-gray-900 text-sm leading-snug">{resolvedDemand.title}</h3>
                            {resolvedDemand.district && <p className="text-xs text-gray-400 mt-1">{resolvedDemand.district}</p>}
                            {resolvedDemand.max_budget && (
                                <p className="text-xs text-purple-700 font-medium mt-1">
                                    Bütçe: {Number(resolvedDemand.max_budget).toLocaleString("tr-TR")} ₺
                                </p>
                            )}
                        </div>

                        {/* Portföy seçimi */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                    <Package size={14} className="text-gray-400" />
                                    Portföyünüzden Eşleştirin
                                    <span className="text-gray-400 font-normal text-xs">(opsiyonel)</span>
                                </label>
                                {selectedIds.length > 0 && (
                                    <button type="button"
                                            onClick={() => { setSelectedIds([]); setForm(f => ({ ...f, price: "", message: "" })); setPriceEdited(false) }}
                                            className="text-[10px] font-bold text-red-500 hover:text-red-700 transition-colors">
                                        Seçimi Kaldır
                                    </button>
                                )}
                            </div>

                            {portfolioLoading ? (
                                <div className="flex flex-col gap-2">
                                    {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />)}
                                </div>
                            ) : portfolioItems.length === 0 ? (
                                <div className="text-center py-4 px-3 bg-gray-50 border border-gray-100 rounded">
                                    <p className="text-xs text-gray-400">Bu talebe uygun (marka/model eşleşen), satışta olan portföy kaydınız bulunmuyor.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1.5">
                                    {portfolioItems.map(item => (
                                        <PortfolioItemRow key={item.id} item={item}
                                                          checked={selectedIds.includes(item.id)}
                                                          onToggle={toggleItem} />
                                    ))}
                                </div>
                            )}
                            <p className="text-[10px] text-gray-400">İlanlar talebe benzerlik oranına göre sıralanmıştır.</p>
                        </div>

                        {/* Fiyat */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                                <span>Teklif Fiyatı (₺) <span className="text-gray-400 font-normal text-xs">(opsiyonel)</span></span>
                                <span className="text-[10px] text-gray-400 font-normal">
                                    {priceEdited ? "Elle düzenlendi" : selectedIds.length > 0 ? "Portföy fiyatından alındı" : ""}
                                </span>
                            </label>
                            <div className="relative">
                                <TrendingUp size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="number" min="0"
                                    placeholder="Portföyden otomatik dolar veya manuel girin"
                                    value={form.price}
                                    onChange={e => { setForm(f => ({ ...f, price: e.target.value })); setPriceEdited(true) }}
                                    className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 placeholder:text-gray-400 placeholder:font-normal" />
                            </div>
                            {errors.price?.[0] && <p className="text-xs text-red-500">{errors.price[0]}</p>}
                        </div>

                        {/* Mesaj */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700">
                                Mesajınız <span className="text-gray-400 font-normal">(opsiyonel)</span>
                            </label>
                            <textarea
                                value={form.message}
                                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                                placeholder="Araç açıklaması portföyden otomatik dolar..."
                                rows={4}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm resize-none outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 placeholder:text-gray-400" />
                            {errors.message && <p className="text-xs text-red-500">{errors.message[0]}</p>}
                        </div>

                        {!isEdit && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-100 rounded">
                                <Send size={13} className="text-purple-500 flex-shrink-0" />
                                <p className="text-xs text-purple-700">
                                    Bu ay kalan teklif hakkınız: <span className="font-bold">{remainingOffers}</span>
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button onClick={handleClose} className="flex-1 py-2.5 rounded text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors">
                                İptal
                            </button>
                            <button onClick={submit} disabled={loading}
                                    className="flex-1 py-2.5 rounded text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                                {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                {isEdit ? "Teklifi Güncelle" : "Teklifi Gönder"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}