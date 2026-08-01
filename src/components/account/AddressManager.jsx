import { useState, useEffect } from "react"
import {
    MapPin, Plus, Trash2, CheckCircle, Edit2,
    Home, Briefcase, Star, Loader2
} from "lucide-react"
import api from "@/lib/axios"
import { useToast } from "@/components/ui/Toast"
import { useTurkiyeLocation } from "@/hooks/useTurkiyeLocation"
import LocationSelect from "@/components/ui/LocationSelect"

const ADDRESS_TITLE_PRESETS = ["Ev", "İş", "Anne Evi", "Yazlık", "Diğer"]

const TITLE_ICONS = {
    "Ev": Home,
    "İş": Briefcase,
    "Anne Evi": Star,
}

function AddressIcon({ title }) {
    const Icon = TITLE_ICONS[title] || MapPin
    return <Icon size={14} />
}

// ── Adres Formu ──────────────────────────────────────────────
function AddressForm({ initial, onSave, onCancel }) {
    const loc = useTurkiyeLocation()
    const toast = useToast()

    const [title, setTitle] = useState(initial?.title || "Ev")
    const [customTitle, setCustom] = useState(
        initial?.title && !ADDRESS_TITLE_PRESETS.includes(initial.title) ? initial.title : ""
    )
    const [fullAddress, setFullAddr] = useState(initial?.full_address || "")
    const [isDefault, setIsDefault] = useState(initial?.is_default || false)
    const [saving, setSaving] = useState(false)

    // Mevcut adresi loc state'ine yükle (provinces yüklendikten sonra)
    useEffect(() => {
        if (!initial || !loc.provinces.length) return
        const prov = loc.provinces.find(p => p.name === initial.city)
        if (prov) loc.setSelectedProvince(prov)
    }, [loc.provinces])

    useEffect(() => {
        if (!initial?.district || !loc.districts.length) return
        const dist = loc.districts.find(d => d.name === initial.district)
        if (dist) loc.setSelectedDistrict(dist)
    }, [loc.districts])

    useEffect(() => {
        if (!initial?.neighborhood || !loc.neighborhoods.length) return
        const neigh = loc.neighborhoods.find(n => n.name === initial.neighborhood)
        if (neigh) loc.setSelectedNeighborhood(neigh)
    }, [loc.neighborhoods])

    const finalTitle = title === "Diğer" ? customTitle : title

    const handleSave = async () => {
        if (!finalTitle.trim()) { toast({ message: "Adres başlığı zorunlu.", type: "error" }); return }
        if (!loc.selectedProvince) { toast({ message: "İl seçimi zorunlu.", type: "error" }); return }
        if (!loc.selectedDistrict) { toast({ message: "İlçe seçimi zorunlu.", type: "error" }); return }

        setSaving(true)
        try {
            await onSave({
                title: finalTitle.trim(),
                city: loc.selectedProvince?.name || "",
                district: loc.selectedDistrict?.name || "",
                neighborhood: loc.selectedNeighborhood?.name || null,
                full_address: fullAddress.trim() || null,
                is_default: isDefault,
            })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="bg-gray-50 rounded-sm p-4 border border-gray-200 space-y-4">

            {/* Başlık seçimi */}
            <div>
                <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500 block mb-2">
                    Adres Başlığı <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-2.5">
                    {ADDRESS_TITLE_PRESETS.map(t => (
                        <button key={t} type="button" onClick={() => setTitle(t)}
                                className={`px-3 py-1.5 rounded text-[11px] font-bold border transition-all ${
                                    title === t
                                        ? "bg-purple-600 text-white border-purple-600"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-purple-300"
                                }`}>
                            {t}
                        </button>
                    ))}
                </div>
                {title === "Diğer" && (
                    <input
                        type="text"
                        placeholder="Adres başlığı girin..."
                        value={customTitle}
                        onChange={e => setCustom(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded text-xs font-medium text-gray-700 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 placeholder:text-gray-400 transition-colors"
                    />
                )}
            </div>

            {/* Konum seçimi */}
            <LocationSelect {...loc} showNeighborhood={true} />

            {/* Açık adres */}
            <div>
                <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500 block mb-2">
                    Açık Adres <span className="text-gray-400 font-normal normal-case">(opsiyonel)</span>
                </label>
                <textarea
                    value={fullAddress}
                    onChange={e => setFullAddr(e.target.value)}
                    placeholder="Sokak, bina no, daire no..."
                    rows={2}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded text-xs font-medium text-gray-700 resize-none outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 placeholder:text-gray-400 transition-colors"
                />
            </div>

            {/* Varsayılan toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer group">
                <div onClick={() => setIsDefault(v => !v)}
                     className={`w-9 h-5 rounded-full transition-all relative flex-shrink-0 ${isDefault ? "bg-purple-600" : "bg-gray-200"}`}>
                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all shadow-sm ${isDefault ? "left-[19px]" : "left-[3px]"}`} />
                </div>
                <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 transition-colors">
          Varsayılan adres olarak ayarla
        </span>
            </label>

            {/* Butonlar */}
            <div className="flex gap-2.5 pt-1">
                <button onClick={onCancel} type="button"
                        className="flex-1 py-2.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 rounded font-bold text-xs transition-all">
                    İptal
                </button>
                <button onClick={handleSave} disabled={saving} type="button"
                        className="flex-1 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 disabled:opacity-60 text-white rounded font-bold text-xs flex items-center justify-center gap-2 transition-all">
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                    {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
            </div>
        </div>
    )
}

// ── Adres Kartı ──────────────────────────────────────────────
function AddressCard({ address, onEdit, onDelete, onSetDefault }) {
    const [deleting, setDeleting] = useState(false)

    const handleDelete = async () => {
        if (!confirm(`"${address.title}" adresini silmek istediğinizden emin misiniz?`)) return
        setDeleting(true)
        await onDelete(address.id)
        setDeleting(false)
    }

    const formatted = [address.neighborhood, address.district, address.city].filter(Boolean).join(", ")

    return (
        <div className={`bg-white rounded-sm p-4 border transition-all ${
            address.is_default ? "border-purple-200 shadow-sm" : "border-gray-200 hover:border-gray-300"
        }`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded flex items-center justify-center flex-shrink-0 ${
                        address.is_default ? "bg-purple-50 text-purple-600" : "bg-gray-50 text-gray-500"
                    }`}>
                        <AddressIcon title={address.title} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-gray-800 text-sm">{address.title}</h4>
                            {address.is_default && (
                                <span className="text-[9px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-full">
                  Varsayılan
                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">{formatted}</p>
                        {address.full_address && (
                            <p className="text-[10px] text-gray-400 font-medium mt-1 leading-relaxed">{address.full_address}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                    {!address.is_default && (
                        <button onClick={() => onSetDefault(address.id)}
                                className="p-1.5 rounded text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                                title="Varsayılan yap">
                            <Star size={13} />
                        </button>
                    )}
                    <button onClick={() => onEdit(address)}
                            className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                        <Edit2 size={13} />
                    </button>
                    <button onClick={handleDelete} disabled={deleting}
                            className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
                        {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Ana Bileşen ──────────────────────────────────────────────
export default function AddressManager() {
    const toast = useToast()
    const [addresses, setAddresses] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editing, setEditing] = useState(null) // null = yeni, obj = düzenleme

    useEffect(() => { fetchAddresses() }, [])

    const fetchAddresses = async () => {
        try {
            const res = await api.get("/user/addresses")
            setAddresses(res.data)
        } catch {
            toast({ message: "Adresler yüklenemedi.", type: "error" })
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async (data) => {
        try {
            if (editing?.id) {
                const res = await api.put(`/user/addresses/${editing.id}`, data)
                setAddresses(prev => prev.map(a => a.id === editing.id ? res.data.data : a))
                if (data.is_default) setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === editing.id })))
                toast({ message: "Adres güncellendi." })
            } else {
                const res = await api.post("/user/addresses", data)
                const newAddr = res.data.data
                setAddresses(prev => {
                    const updated = data.is_default ? prev.map(a => ({ ...a, is_default: false })) : prev
                    return [...updated, newAddr]
                })
                toast({ message: "Adres eklendi." })
            }
            setShowForm(false)
            setEditing(null)
        } catch (err) {
            const msg = err.response?.data?.message || "İşlem başarısız."
            toast({ message: msg, type: "error" })
            throw err
        }
    }

    const handleDelete = async (id) => {
        try {
            await api.delete(`/user/addresses/${id}`)
            setAddresses(prev => prev.filter(a => a.id !== id))
            toast({ message: "Adres silindi." })
        } catch {
            toast({ message: "Silinemedi.", type: "error" })
        }
    }

    const handleSetDefault = async (id) => {
        try {
            await api.patch(`/user/addresses/${id}/set-default`)
            setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === id })))
            toast({ message: "Varsayılan adres güncellendi." })
        } catch {
            toast({ message: "İşlem başarısız.", type: "error" })
        }
    }

    const handleEdit = (address) => { setEditing(address); setShowForm(true) }
    const handleCancel = () => { setShowForm(false); setEditing(null) }

    return (
        <div className="space-y-4">
            {/* Başlık */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-gray-800 text-sm">Adreslerim</h3>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">
                        İlanlarınızda kullanılacak adresler ({addresses.length}/5)
                    </p>
                </div>
                {!showForm && addresses.length < 5 && (
                    <button onClick={() => { setEditing(null); setShowForm(true) }}
                            className="flex items-center gap-1.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 text-white px-3 py-2 rounded font-bold text-[11px] transition-all">
                        <Plus size={13} /> Adres Ekle
                    </button>
                )}
            </div>

            {showForm && (
                <AddressForm initial={editing} onSave={handleSave} onCancel={handleCancel} />
            )}

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 size={18} className="animate-spin text-purple-500" />
                </div>
            ) : addresses.length === 0 && !showForm ? (
                <div className="text-center py-10 bg-gray-50 rounded-sm border border-gray-200">
                    <div className="w-11 h-11 bg-white border border-gray-200 rounded flex items-center justify-center mx-auto mb-3">
                        <MapPin size={18} className="text-gray-300" />
                    </div>
                    <p className="text-gray-500 text-sm font-bold mb-1">Henüz adres eklenmedi</p>
                    <p className="text-gray-400 text-xs font-medium">İlanlarınızda kullanmak için adres ekleyin.</p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {addresses.map(address => (
                        <AddressCard
                            key={address.id}
                            address={address}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onSetDefault={handleSetDefault}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}