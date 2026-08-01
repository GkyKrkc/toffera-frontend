import { useState, useEffect, useRef } from "react"
import {
    MapPin, Plus, Trash2, Bell, BellOff,
    Building2, Car, Layers, Loader2, ChevronDown
} from "lucide-react"
import api from "@/lib/axios"
import { useAuth } from "@/store/AuthContext"
import { useToast } from "@/components/ui/Toast"
import { useTurkiyeLocation } from "@/hooks/useTurkiyeLocation"

const CATEGORY_OPTIONS = [
    { value: "",            label: "Tümü",       icon: Layers    },
    { value: "gayrimenkul", label: "Gayrimenkul", icon: Building2 },
    { value: "vasita",      label: "Vasıta",      icon: Car       },
]

// ── Bölge Ekleme Formu ───────────────────────────────────────
// NOT: Mahalle seçimi çoklu — özellikle emlakçılar için birden fazla
// mahalleyi tek seferde takibe eklemek işe yarıyor. Her seçili mahalle
// için ayrı bir takip kaydı oluşturuluyor (mahalle seçilmezse ilçe
// genelinde tek kayıt açılıyor).
function RegionForm({ agentType, onSave, onCancel }) {
    const loc = useTurkiyeLocation()
    const toast = useToast()
    const [categorySlug, setCategory] = useState("")
    const [saving, setSaving] = useState(false)
    const [isMahalleOpen, setIsMahalleOpen] = useState(false)
    const mahalleRef = useRef(null)

    useEffect(() => {
        function handleClickOutside(e) {
            if (mahalleRef.current && !mahalleRef.current.contains(e.target)) setIsMahalleOpen(false)
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const availableCategories = CATEGORY_OPTIONS.filter(c => {
        if (agentType === "emlakci")  return c.value !== "vasita"
        if (agentType === "galerici") return c.value !== "gayrimenkul"
        return true
    })

    const handleSave = async () => {
        if (!loc.selectedProvince) {
            toast({ message: "İl seçimi zorunludur.", type: "error" })
            return
        }
        setSaving(true)
        try {
            await onSave({
                city: loc.selectedProvince.name,
                district: loc.selectedDistrict?.name || null,
                // Mahalle seçilmediyse ilçe genelinde tek kayıt, seçildiyse her
                // mahalle için ayrı kayıt açılır — döngü üst bileşende yürütülür.
                neighborhoods: loc.selectedNeighborhoods.length > 0
                    ? loc.selectedNeighborhoods.map(n => n.name)
                    : [null],
                category_slug: categorySlug || null,
                notify_new_demand: true,
            })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="bg-gray-50 rounded-sm p-4 border border-gray-200 space-y-4">

            {/* Kategori seçimi */}
            <div>
                <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500 block mb-2">
                    Hangi Kategori
                </label>
                <div className="flex gap-2 flex-wrap">
                    {availableCategories.map(cat => {
                        const Icon = cat.icon
                        return (
                            <button key={cat.value} type="button" onClick={() => setCategory(cat.value)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded text-[11px] font-bold border transition-all ${
                                        categorySlug === cat.value
                                            ? "border-purple-500 bg-purple-50 text-purple-700"
                                            : "border-gray-200 bg-white text-gray-600 hover:border-purple-300"
                                    }`}>
                                <Icon size={12} /> {cat.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* İl / İlçe / Mahalle */}
            <div className="space-y-3">
                <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                        İl <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <select
                            value={loc.selectedProvince?.id || ""}
                            onChange={e => {
                                const p = loc.provinces.find(p => p.id === Number(e.target.value))
                                loc.setSelectedProvince(p || null)
                            }}
                            disabled={loc.loadingProv}
                            className="w-full appearance-none px-3 py-2.5 bg-white border border-gray-200 rounded text-xs font-medium text-gray-700 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors"
                        >
                            <option value="">İl seçin...</option>
                            {loc.provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {loc.selectedProvince && (
                    <div>
                        <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                            İlçe <span className="text-gray-400 font-normal normal-case">(opsiyonel)</span>
                        </label>
                        <div className="relative">
                            <select
                                value={loc.selectedDistrict?.id || ""}
                                onChange={e => {
                                    const d = loc.districts.find(d => d.id === Number(e.target.value))
                                    loc.setSelectedDistrict(d || null)
                                }}
                                disabled={loc.loadingDist}
                                className="w-full appearance-none px-3 py-2.5 bg-white border border-gray-200 rounded text-xs font-medium text-gray-700 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors"
                            >
                                <option value="">Tüm ilçeler</option>
                                {loc.districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                )}

                {loc.selectedDistrict && (
                    <div className="relative" ref={mahalleRef}>
                        <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                            Mahalle <span className="text-gray-400 font-normal normal-case">(opsiyonel, çoklu seçilebilir)</span>
                        </label>
                        <div
                            onClick={() => setIsMahalleOpen(!isMahalleOpen)}
                            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded text-xs font-medium text-gray-700 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors cursor-pointer flex items-center justify-between select-none"
                        >
              <span className="truncate pr-2">
                {loc.loadingNeigh ? "Yükleniyor..." :
                    loc.selectedNeighborhoods.length === 0 ? "Tüm mahalleler" :
                        loc.selectedNeighborhoods.length === 1 ? loc.selectedNeighborhoods[0].name :
                            `${loc.selectedNeighborhoods.length} mahalle seçili`}
              </span>
                            <ChevronDown size={13} className={`text-gray-400 flex-shrink-0 transition-transform ${isMahalleOpen ? "rotate-180" : ""}`} />
                        </div>

                        {isMahalleOpen && (
                            <div className="absolute top-[calc(100%+2px)] left-0 w-full bg-white border border-gray-200 rounded shadow-xl z-[60] max-h-48 overflow-y-auto">
                                {loc.neighborhoods.length === 0 ? (
                                    <div className="px-3 py-3 text-[11px] text-gray-400 text-center">Mahalle bulunamadı.</div>
                                ) : (
                                    <>
                                        {loc.selectedNeighborhoods.length > 0 && (
                                            <button type="button" onClick={() => loc.clearNeighborhoods()}
                                                    className="w-full text-left px-3 py-2 text-[11px] font-bold text-purple-600 hover:bg-purple-50 border-b border-gray-100 transition-colors">
                                                Seçimleri Temizle
                                            </button>
                                        )}
                                        {loc.neighborhoods.map(n => (
                                            <label key={n.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-purple-50 cursor-pointer text-[11px] text-gray-700 border-b border-gray-50 last:border-0 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    className="rounded-sm border-gray-300 w-3.5 h-3.5 cursor-pointer accent-purple-600"
                                                    checked={loc.selectedNeighborhoods.some(x => x.id === n.id)}
                                                    onChange={() => loc.toggleNeighborhood(n)}
                                                />
                                                <span className="truncate">{n.name}</span>
                                            </label>
                                        ))}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Önizleme */}
            {loc.selectedProvince && (
                <div className="flex items-start gap-2 bg-purple-50 border border-purple-100 rounded px-3 py-2.5">
                    <MapPin size={12} className="text-purple-500 flex-shrink-0 mt-0.5" />
                    <span className="text-xs font-bold text-purple-700 leading-relaxed">
            {loc.selectedNeighborhoods.length > 1
                ? `${loc.selectedDistrict?.name}, ${loc.selectedProvince?.name} içinde ${loc.selectedNeighborhoods.length} mahalle: ${loc.selectedNeighborhoods.map(n => n.name).join(", ")}`
                : [loc.selectedNeighborhoods[0]?.name, loc.selectedDistrict?.name, loc.selectedProvince?.name].filter(Boolean).join(", ")}
                        {categorySlug && ` — ${CATEGORY_OPTIONS.find(c => c.value === categorySlug)?.label}`}
          </span>
                </div>
            )}

            {/* Butonlar */}
            <div className="flex gap-2.5 pt-1">
                <button onClick={onCancel} type="button"
                        className="flex-1 py-2.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 rounded font-bold text-xs transition-all">
                    İptal
                </button>
                <button onClick={handleSave} disabled={saving || !loc.selectedProvince} type="button"
                        className="flex-1 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 disabled:opacity-60 text-white rounded font-bold text-xs flex items-center justify-center gap-2 transition-all">
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                    {saving
                        ? "Ekleniyor..."
                        : loc.selectedNeighborhoods.length > 1
                            ? `${loc.selectedNeighborhoods.length} Bölge Ekle`
                            : "Bölge Ekle"}
                </button>
            </div>
        </div>
    )
}

// ── Bölge Kartı ──────────────────────────────────────────────
function RegionCard({ region, onDelete, onToggle }) {
    const [loading, setLoading] = useState(false)
    const catOption = CATEGORY_OPTIONS.find(c => c.value === (region.category_slug || ""))
    const CatIcon = catOption?.icon || Layers

    const formatted = [region.neighborhood, region.district, region.city].filter(Boolean).join(", ")

    const handleToggle = async () => { setLoading(true); await onToggle(region.id); setLoading(false) }
    const handleDelete = async () => {
        if (!confirm(`"${formatted}" bölgesini takipten çıkarmak istiyor musunuz?`)) return
        setLoading(true)
        await onDelete(region.id)
        setLoading(false)
    }

    return (
        <div className="bg-white rounded-sm border border-gray-200 p-3.5 flex items-center gap-3">
            <div className={`w-9 h-9 rounded flex items-center justify-center flex-shrink-0 ${
                region.category_slug === "gayrimenkul" ? "bg-orange-50 text-orange-500" :
                    region.category_slug === "vasita"      ? "bg-purple-50 text-purple-600" :
                        "bg-gray-100 text-gray-500"
            }`}>
                <CatIcon size={15} />
            </div>

            <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-xs truncate">{formatted}</p>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">{catOption?.label || "Tüm Kategoriler"}</p>
            </div>

            <button onClick={handleToggle} disabled={loading}
                    className={`p-1.5 rounded transition-all ${
                        region.notify_new_demand
                            ? "bg-green-50 text-green-600 hover:bg-green-100"
                            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    }`}
                    title={region.notify_new_demand ? "Bildirimi Kapat" : "Bildirimi Aç"}>
                {region.notify_new_demand ? <Bell size={13} /> : <BellOff size={13} />}
            </button>

            <button onClick={handleDelete} disabled={loading}
                    className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                {loading ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            </button>
        </div>
    )
}

// ── Ana Bileşen ──────────────────────────────────────────────
export default function RegionManager() {
    const { user } = useAuth()
    const toast = useToast()
    const [regions, setRegions] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)

    useEffect(() => { fetchRegions() }, [])

    const fetchRegions = async () => {
        try {
            const res = await api.get("/agent/regions")
            setRegions(res.data)
        } catch {
            toast({ message: "Bölgeler yüklenemedi.", type: "error" })
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async ({ neighborhoods, ...rest }) => {
        let successCount = 0
        let failCount = 0
        const newRegions = []

        for (const neighborhood of neighborhoods) {
            try {
                const res = await api.post("/agent/regions", { ...rest, neighborhood })
                newRegions.push(res.data.data)
                successCount++
            } catch {
                failCount++
            }
        }

        if (newRegions.length > 0) setRegions(prev => [...prev, ...newRegions])
        if (successCount > 0) setShowForm(false)

        if (failCount === 0) {
            toast({ message: successCount > 1 ? `${successCount} bölge takibe eklendi.` : "Bölge takibe eklendi." })
        } else if (successCount > 0) {
            toast({ message: `${successCount} bölge eklendi, ${failCount} tanesi eklenemedi.`, type: "warning" })
        } else {
            toast({ message: "Bölgeler eklenemedi.", type: "error" })
        }
    }

    const handleDelete = async (id) => {
        try {
            await api.delete(`/agent/regions/${id}`)
            setRegions(prev => prev.filter(r => r.id !== id))
            toast({ message: "Bölge takipten çıkarıldı." })
        } catch {
            toast({ message: "Silinemedi.", type: "error" })
        }
    }

    const handleToggle = async (id) => {
        try {
            const res = await api.patch(`/agent/regions/${id}/toggle`)
            setRegions(prev => prev.map(r => r.id === id ? res.data.data : r))
        } catch {
            toast({ message: "İşlem başarısız.", type: "error" })
        }
    }

    return (
        <div className="space-y-4">
            {/* Başlık */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-gray-800 text-sm">Takip Ettiğim Bölgeler</h3>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">
                        Seçtiğiniz bölgelerde yeni ilan girildiğinde SMS bildirimi alırsınız ({regions.length}/10)
                    </p>
                </div>
                {!showForm && regions.length < 10 && (
                    <button onClick={() => setShowForm(true)}
                            className="flex items-center gap-1.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 text-white px-3 py-2 rounded font-bold text-[11px] transition-all">
                        <Plus size={13} /> Bölge Ekle
                    </button>
                )}
            </div>

            {showForm && (
                <RegionForm agentType={user?.agent_type || user?.account_type} onSave={handleSave} onCancel={() => setShowForm(false)} />
            )}

            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 size={18} className="animate-spin text-purple-500" />
                </div>
            ) : regions.length === 0 && !showForm ? (
                <div className="text-center py-10 bg-gray-50 rounded-sm border border-gray-200">
                    <div className="w-11 h-11 bg-white border border-gray-200 rounded flex items-center justify-center mx-auto mb-3">
                        <MapPin size={18} className="text-gray-300" />
                    </div>
                    <p className="text-gray-500 text-sm font-bold mb-1">Takip edilen bölge yok</p>
                    <p className="text-gray-400 text-xs font-medium">Bölge ekleyerek yeni ilanları anlık takip edin.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {regions.map(region => (
                        <RegionCard key={region.id} region={region} onDelete={handleDelete} onToggle={handleToggle} />
                    ))}
                </div>
            )}

            {regions.length > 0 && (
                <div className="flex items-start gap-2.5 px-3.5 py-3 bg-purple-50 border border-purple-100 rounded-sm">
                    <Bell size={12} className="text-purple-500 mt-0.5 flex-shrink-0" />
                    <p className="text-[10px] text-purple-700 font-semibold leading-relaxed">
                        Bildirim açık bölgelerde yeni ilan girildiğinde kayıtlı telefonunuza SMS gönderilir.
                        <span className="text-purple-500"> Bildirimi kapattığınızda SMS gelmez ama ilanı görebilirsiniz.</span>
                    </p>
                </div>
            )}
        </div>
    )
}