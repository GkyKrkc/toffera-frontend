import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import {
    Plus, Search, X, RefreshCw, Edit2, Trash2, Image as ImageIcon,
    ChevronRight, Package, AlertCircle, Loader2,
} from "lucide-react"
import Header from "@/components/layout/Header"
import PanelHeader from "@/components/dashboard/PanelHeader"
import PortfolioSidebar from "@/components/portfolio/PortfolioSidebar"
import ImageUploadModal from "@/components/portfolio/ImageUploadModal"
import DynamicCategoryFields from "@/components/category/DynamicCategoryFields"
import { useToast } from "@/components/ui/Toast"
import api from "@/lib/axios"

const STATUS_LABEL = {
    available: { label: "Satışta", cls: "bg-green-100 text-green-700" },
    reserved:  { label: "Rezerve", cls: "bg-amber-100 text-amber-700" },
    sold:      { label: "Satıldı", cls: "bg-gray-100 text-gray-500" },
}

function EmptyForm(categoryId) {
    return {
        category_id: categoryId,
        title: "", description: "", price: "", district: "",
        features: {},
    }
}

export default function PortfolioCategoryPage() {
    const { categorySlug } = useParams()
    const navigate = useNavigate()
    const toast = useToast()

    const [category, setCategory] = useState(null)
    const [categoryLoading, setCategoryLoading] = useState(true)
    const [items, setItems] = useState([])
    const [itemsLoading, setItemsLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("")

    const [showForm, setShowForm] = useState(false)
    const [editingItem, setEditingItem] = useState(null)
    const [form, setForm] = useState(EmptyForm(null))
    const [saving, setSaving] = useState(false)

    const [imageItem, setImageItem] = useState(null)

    // Kategori bilgisini + limit/kullanım durumunu sidebar'ın kullandığı
    // aynı endpoint'ten çekiyoruz — tek doğru kaynak.
    useEffect(() => {
        setCategoryLoading(true)
        api.get("/my-portfolio/available-categories")
            .then(res => {
                const cat = (res.data.data || []).find(c => c.slug === categorySlug)
                setCategory(cat || null)
            })
            .catch(() => setCategory(null))
            .finally(() => setCategoryLoading(false))
    }, [categorySlug])

    const fetchItems = () => {
        if (!category) return
        setItemsLoading(true)
        api.get("/my-portfolio", { params: { category_id: category.id } })
            .then(res => setItems(res.data.data || []))
            .catch(() => setItems([]))
            .finally(() => setItemsLoading(false))
    }

    useEffect(() => { fetchItems() }, [category?.id])

    const filtered = items.filter(item => {
        if (statusFilter && item.status !== statusFilter) return false
        if (search && !item.title?.toLowerCase().includes(search.toLowerCase())) return false
        return true
    })

    const limitReached = category && category.limit !== null && category.current >= category.limit && !editingItem

    const openAddForm = () => {
        setEditingItem(null)
        setForm(EmptyForm(category?.id))
        setShowForm(true)
    }

    const openEditForm = (item) => {
        setEditingItem(item)
        setForm({
            category_id: category?.id,
            title: item.title || "",
            description: item.description || "",
            price: item.price || "",
            district: item.district || "",
            features: item.features || {},
        })
        setShowForm(true)
    }

    const closeForm = () => { setShowForm(false); setEditingItem(null) }

    const handleSave = async () => {
        if (!form.title.trim()) { toast({ message: "Başlık zorunludur.", type: "error" }); return }
        setSaving(true)
        try {
            if (editingItem) {
                await api.put(`/my-portfolio/${editingItem.id}`, form)
                toast({ message: "Güncellendi." })
            } else {
                await api.post("/portfolio", form)
                toast({ message: "Portföy kalemi eklendi." })
            }
            closeForm()
            fetchItems()
            // limit/kullanım sayacı değişmiş olabilir, kategori bilgisini tazele
            api.get("/my-portfolio/available-categories").then(res => {
                const cat = (res.data.data || []).find(c => c.slug === categorySlug)
                setCategory(cat || null)
            })
        } catch (err) {
            const msg = err.response?.data?.message ||
                Object.values(err.response?.data?.errors || {})[0]?.[0] ||
                "İşlem başarısız."
            toast({ message: msg, type: "error" })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (item) => {
        if (!confirm(`"${item.title}" silinsin mi?`)) return
        try {
            await api.delete(`/my-portfolio/${item.id}`)
            toast({ message: "Silindi." })
            fetchItems()
        } catch (err) {
            toast({ message: err.response?.data?.message || "Silinemedi.", type: "error" })
        }
    }

    const handleStatusChange = async (item, status) => {
        try {
            await api.put(`/my-portfolio/${item.id}`, { status })
            fetchItems()
        } catch (err) {
            toast({ message: err.response?.data?.message || "Durum güncellenemedi.", type: "error" })
        }
    }

    return (
        <div className="min-h-screen bg-gray-200 font-sans text-gray-800 flex flex-col">
            <Header />

            <main className="max-w-[1200px] mx-auto w-full px-4 py-6 flex-1">

                <PanelHeader />

                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 mb-4">
                    <Link to="/portfolio" className="hover:text-purple-700 transition-colors">Portföy</Link>
                    <ChevronRight size={10} />
                    <span className="text-gray-700">{category?.name || "..."}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-7 h-7 bg-purple-50 rounded flex items-center justify-center text-purple-700">
                                <Package size={14} />
                            </div>
                            <h1 className="text-xl font-bold text-gray-800">{category?.name || "Portföy"}</h1>
                        </div>
                        <p className="text-gray-400 text-xs font-medium">
                            {category
                                ? category.limit === null
                                    ? "Sınırsız portföy ekleyebilirsiniz."
                                    : `${category.current}/${category.limit} kullanıldı.`
                                : "Yükleniyor..."}
                        </p>
                    </div>
                    <button onClick={openAddForm} disabled={categoryLoading || limitReached}
                            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all shadow-sm">
                        <Plus size={13} /> {limitReached ? "Limit Doldu" : "Yeni Ekle"}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                    <PortfolioSidebar />

                    <div className="md:col-span-3 space-y-4">

                        {!categoryLoading && !category && (
                            <div className="bg-amber-50 border border-amber-200 rounded-sm p-4 flex items-start gap-2.5">
                                <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                    Bu kategoriye erişiminiz yok ya da kategori bulunamadı. Sol menüden size tanımlı bir kategori seçin.
                                </p>
                            </div>
                        )}

                        {limitReached && (
                            <div className="bg-amber-50 border border-amber-200 rounded-sm p-4 flex items-start gap-2.5">
                                <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                    Bu kategoride portföy limitinize ({category.limit}) ulaştınız. Yeni ekleyebilmek için mevcut bir kaydı silmeniz ya da üyelik planınızı yükseltmeniz gerekir.
                                </p>
                            </div>
                        )}

                        <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 bg-gray-50">
                                <div className="relative flex-1">
                                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" placeholder="Başlığa göre ara..."
                                           value={search} onChange={e => setSearch(e.target.value)}
                                           className="w-full pl-8 pr-8 py-2 bg-white border border-gray-200 rounded text-xs font-medium text-gray-700 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors placeholder:text-gray-400" />
                                    {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={12} /></button>}
                                </div>
                                <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded border border-gray-200 flex-shrink-0">
                                    {[
                                        { key: "", label: "Tümü" },
                                        { key: "available", label: "Satışta" },
                                        { key: "reserved", label: "Rezerve" },
                                        { key: "sold", label: "Satıldı" },
                                    ].map(f => (
                                        <button key={f.key} onClick={() => setStatusFilter(f.key)}
                                                className={`px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded transition-all whitespace-nowrap ${
                                                    statusFilter === f.key ? "bg-white text-purple-700 shadow-sm" : "text-gray-400 hover:text-gray-700"
                                                }`}>
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={fetchItems} className="w-8 h-8 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0">
                                    <RefreshCw size={13} />
                                </button>
                            </div>

                            {itemsLoading ? (
                                <div className="p-4 space-y-2">
                                    {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />)}
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="text-center py-16 px-4">
                                    <div className="w-12 h-12 bg-purple-50 rounded flex items-center justify-center mx-auto mb-3 text-purple-300">
                                        <Package size={22} />
                                    </div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kayıt Bulunamadı</p>
                                    <p className="text-[10px] text-gray-400 font-medium mt-1 mb-4">
                                        {search ? "Arama kriterlerinize uygun kayıt yok." : "Bu kategoride henüz portföyünüze bir şey eklemediniz."}
                                    </p>
                                    {!limitReached && (
                                        <button onClick={openAddForm}
                                                className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all">
                                            <Plus size={12} /> İlk Kaydı Ekle
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    {filtered.map(item => (
                                        <div key={item.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                            <div className="w-12 h-12 rounded bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                {item.images?.[0]?.url
                                                    ? <img src={item.images[0].url} alt="" className="w-full h-full object-cover" />
                                                    : <ImageIcon size={16} className="text-gray-300" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-gray-800 truncate">{item.title}</p>
                                                <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                                                    {item.price ? `${Number(item.price).toLocaleString("tr-TR")} TL` : "Fiyat belirtilmemiş"}
                                                    {item.district ? ` · ${item.district}` : ""}
                                                </p>
                                            </div>
                                            <select value={item.status}
                                                    onChange={e => handleStatusChange(item, e.target.value)}
                                                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border-0 outline-none cursor-pointer ${STATUS_LABEL[item.status]?.cls || "bg-gray-100 text-gray-600"}`}>
                                                {Object.entries(STATUS_LABEL).map(([val, { label }]) => (
                                                    <option key={val} value={val}>{label}</option>
                                                ))}
                                            </select>
                                            <button onClick={() => setImageItem(item)}
                                                    className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors flex-shrink-0">
                                                <ImageIcon size={13} />
                                            </button>
                                            <button onClick={() => openEditForm(item)}
                                                    className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors flex-shrink-0">
                                                <Edit2 size={13} />
                                            </button>
                                            <button onClick={() => handleDelete(item)}
                                                    className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0">
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Ekle / Düzenle Formu */}
            {showForm && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeForm}>
                    <div onClick={e => e.stopPropagation()} className={`bg-white rounded-sm shadow-2xl w-full overflow-hidden flex flex-col max-h-[90vh] ${category?.form_schema?.length > 0 ? "max-w-lg" : "max-w-md"}`}>
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                            <h3 className="text-sm font-bold text-gray-800">{editingItem ? "Düzenle" : "Yeni Ekle"} — {category?.name}</h3>
                            <button onClick={closeForm} className="text-gray-400 hover:text-gray-700"><X size={16} /></button>
                        </div>
                        <div className="p-5 space-y-3 overflow-y-auto">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Başlık *</label>
                                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                       className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Açıklama</label>
                                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 resize-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Fiyat (TL)</label>
                                    <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                                           className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">İlçe</label>
                                    <input type="text" value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))}
                                           className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400" />
                                </div>
                            </div>

                            {/* Kategoriye özel alanlar — admin panelinde (Filament
                                CategoryResource → "Form Alanları") tanımlanan form_schema.
                                Talep tarafındaki (GenericDemandPage) AYNI şema/bileşen. */}
                            {category?.form_schema?.length > 0 && (
                                <div className="pt-1">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2 pb-1.5 border-b border-gray-100">
                                        {category.name} Özellikleri
                                    </p>
                                    <DynamicCategoryFields
                                        schema={category.form_schema}
                                        values={form.features}
                                        onChange={(key, value) => setForm(f => ({ ...f, features: { ...f.features, [key]: value } }))}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="px-5 py-3.5 border-t border-gray-200 bg-gray-50 flex justify-end gap-2 flex-shrink-0">
                            <button onClick={closeForm} className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 border border-gray-200 hover:bg-gray-100 rounded transition-colors">
                                Vazgeç
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                    className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-60 rounded transition-colors flex items-center gap-1.5">
                                {saving && <Loader2 size={12} className="animate-spin" />} Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {imageItem && (
                <ImageUploadModal
                    item={imageItem}
                    basePath="/my-portfolio"
                    onClose={() => setImageItem(null)}
                    onUpdate={imgs => setItems(prev => prev.map(i => i.id === imageItem.id ? { ...i, images: imgs } : i))}
                />
            )}
        </div>
    )
}