import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import {
    Building2, Plus, Search, ChevronRight, Edit2, Trash2,
    RefreshCw, ChevronDown, X, MapPin, Ruler, Home, Image
} from "lucide-react"
import Header from "@/components/layout/Header"
import { useAuth } from "@/store/AuthContext"
import { useToast } from "@/components/ui/Toast"
import api from "@/lib/axios"
import ImageUploadModal from "@/components/portfolio/ImageUploadModal"
import OfferStatsButton from "@/components/portfolio/OfferStatsButton"
import PortfolioAddMenu from "@/components/portfolio/PortfolioAddMenu"

const STATUS_MAP = {
    available: { label: "Satışta", cls: "bg-green-50 text-green-700 border-green-100" },
    reserved:  { label: "Rezerve", cls: "bg-amber-50 text-amber-700 border-amber-100" },
    sold:      { label: "Satıldı", cls: "bg-gray-100 text-gray-500 border-gray-200"   },
}

function PropertyRow({ item, onEdit, onDelete, onStatusChange, onImage }) {
    const [statusOpen, setStatusOpen] = useState(false)
    const status = STATUS_MAP[item.status] || STATUS_MAP.available
    const f = item.features || {}

    return (
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors group">
            <div className="relative w-10 h-10 flex-shrink-0">
                <div className="w-10 h-10 rounded bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
                    <Building2 size={16} />
                </div>
                {item.images?.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-purple-600 text-white text-[7px] font-bold rounded-full flex items-center justify-center">
            {item.images.length}
          </span>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-800 truncate group-hover:text-amber-700 transition-colors">{item.title}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                    {f.emlak_tipi  && <span className="text-[10px] text-gray-400 font-medium flex items-center gap-0.5"><Home size={9} />{f.emlak_tipi}</span>}
                    {f.oda_sayisi  && <span className="text-[10px] text-gray-400 font-medium">{f.oda_sayisi}</span>}
                    {f.metrekare   && <span className="text-[10px] text-gray-400 font-medium flex items-center gap-0.5"><Ruler size={9} />{f.metrekare}</span>}
                    {item.district && <span className="text-[10px] text-gray-400 font-medium flex items-center gap-0.5"><MapPin size={9} />{item.district}</span>}
                </div>
            </div>

            {item.moderation_status && item.moderation_status !== "approved" && (
                <span className={`text-[8px] font-bold px-2 py-1 rounded border flex-shrink-0 ${
                    item.moderation_status === "rejected" ? "bg-red-50 text-red-600 border-red-100" : "bg-amber-50 text-amber-700 border-amber-100"
                }`} title={item.moderation_status === "rejected" ? item.moderation_note : undefined}>
          {item.moderation_status === "rejected" ? "Reddedildi" : "İncelemede"}
        </span>
            )}

            <div className="text-right flex-shrink-0 hidden sm:block">
                <p className="text-sm font-bold text-gray-800 leading-none">
                    {item.price ? `${Number(item.price).toLocaleString("tr-TR")} ₺` : "—"}
                </p>
                <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Satış Fiyatı</p>
            </div>

            <div className="relative flex-shrink-0">
                <button onClick={() => setStatusOpen(v => !v)}
                        className={`flex items-center gap-1 text-[9px] font-bold px-2.5 py-1.5 rounded border transition-colors ${status.cls}`}>
                    {status.label} <ChevronDown size={10} />
                </button>
                {statusOpen && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 overflow-hidden min-w-[120px]">
                        {Object.entries(STATUS_MAP).map(([key, val]) => (
                            <button key={key} onClick={() => { onStatusChange(item.id, key); setStatusOpen(false) }}
                                    className={`w-full text-left px-3 py-2.5 text-[10px] font-bold hover:bg-gray-50 transition-colors ${item.status === key ? "text-amber-700" : "text-gray-700"}`}>
                                {val.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={e => { e.stopPropagation(); onImage(item) }}
                        className="w-7 h-7 rounded bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-colors"
                        title="Resim ekle">
                    <Image size={12} />
                </button>
                <button onClick={() => onEdit(item.id)}
                        className="w-7 h-7 rounded bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-colors">
                    <Edit2 size={12} />
                </button>
                <button onClick={() => onDelete(item.id)}
                        className="w-7 h-7 rounded bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors">
                    <Trash2 size={12} />
                </button>
                <OfferStatsButton item={item} accent="amber" />
            </div>
        </div>
    )
}

export default function RealEstateListPage() {
    const { isAuthenticated, loading: authLoading } = useAuth()
    const navigate = useNavigate()
    const toast = useToast()

    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [statusFilter, setStatus] = useState("")
    const [hasMore, setHasMore] = useState(false)
    const [page, setPage] = useState(1)
    const [imageItem, setImageItem] = useState(null)

    useEffect(() => {
        if (authLoading) return
        if (!isAuthenticated) { navigate("/"); return }
        fetchItems(true)
    }, [statusFilter, authLoading, isAuthenticated])

    const fetchItems = async (reset = false) => {
        setLoading(true)
        try {
            const res = await api.get("/agent/portfolio", {
                params: { type: "gayrimenkul", status: statusFilter || undefined, page: reset ? 1 : page }
            })
            const data = res.data.data || res.data
            reset ? setItems(data) : setItems(prev => [...prev, ...data])
            setHasMore(!!res.data.next_page_url)
            if (!reset) setPage(p => p + 1)
        } catch { toast({ message: "Veri yüklenemedi.", type: "error" }) }
        finally { setLoading(false) }
    }

    const handleDelete = async (id) => {
        if (!confirm("Bu mülkü portföyden silmek istediğinize emin misiniz?")) return
        try {
            await api.delete(`/agent/portfolio/${id}`)
            setItems(prev => prev.filter(i => i.id !== id))
            toast({ message: "Gayrimenkul silindi." })
        } catch { toast({ message: "Silme başarısız.", type: "error" }) }
    }

    const handleStatusChange = async (id, status) => {
        try {
            await api.put(`/agent/portfolio/${id}`, { status })
            setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i))
            toast({ message: "Durum güncellendi." })
        } catch { toast({ message: "Güncelleme başarısız.", type: "error" }) }
    }

    const filtered = items.filter(i =>
        !search || i.title?.toLowerCase().includes(search.toLowerCase()) ||
        i.district?.toLowerCase().includes(search.toLowerCase()) ||
        i.features?.emlak_tipi?.toLowerCase().includes(search.toLowerCase())
    )

    const counts = {
        total: items.length,
        available: items.filter(i => i.status === "available").length,
        reserved: items.filter(i => i.status === "reserved").length,
        sold: items.filter(i => i.status === "sold").length,
    }

    return (
        <div className="min-h-screen bg-gray-200 font-sans text-gray-800 flex flex-col">
            <Header />

            <main className="max-w-[1200px] mx-auto w-full px-4 py-6 flex-1">

                {/* Breadcrumb + Başlık — artık grid'in ÜSTÜNDE, tam genişlikte
                    (dashboard'daki "Merhaba, Aslıhan" üst bloğuyla aynı mimari). */}
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 mb-4">
                    <Link to="/portfolio" className="hover:text-amber-700 transition-colors">Portföy</Link>
                    <ChevronRight size={10} />
                    <span className="text-gray-700">Gayrimenkul</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-7 h-7 bg-amber-50 rounded flex items-center justify-center text-amber-700">
                                <Building2 size={14} />
                            </div>
                            <h1 className="text-xl font-bold text-gray-800">Gayrimenkul Portföyü</h1>
                        </div>
                        <p className="text-gray-400 text-xs font-medium">Satışa çıkardığınız mülkleri yönetin.</p>
                    </div>
                    <PortfolioAddMenu current="realestate" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                    {/* Sol: Özet + CTA — dashboard'daki sol taraftaki grid ile aynı
                        genişlikte (md:col-span-1). h-full + CTA kartına flex-1 ile
                        sağ taraftaki liste kartıyla aynı yüksekliğe kadar iniyor. */}
                    <div className="md:col-span-1 flex flex-col gap-4 h-full">
                        <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                            <div className="h-[3px] bg-amber-600" />
                            <div className="p-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-11 h-11 rounded bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 shadow-sm flex-shrink-0">
                                        <Building2 size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">Gayrimenkul Portföyü</p>
                                        <p className="text-[11px] text-gray-500 font-medium mt-0.5">Stok özetiniz</p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    {[
                                        { label: "Toplam",  value: counts.total },
                                        { label: "Satışta", value: counts.available },
                                        { label: "Rezerve", value: counts.reserved },
                                        { label: "Satıldı", value: counts.sold },
                                    ].map((s, i) => (
                                        <div key={i} className="flex items-center justify-between text-[11px] py-1 border-b border-gray-50 last:border-0">
                                            <span className="text-gray-500 font-bold">{s.label}</span>
                                            <span className="font-bold text-gray-800">{s.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-900 border border-gray-800 rounded-sm shadow-sm p-4 text-white flex-1 flex flex-col">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-amber-400 mb-1.5">Pazaryeri</p>
                            <h3 className="font-bold text-sm text-white leading-snug mb-1">Yeni gayrimenkul ekle</h3>
                            <p className="text-gray-400 text-[10px] font-medium leading-relaxed mb-4">
                                Stoğunuza yeni gayrimenkul ekleyin, gelen taleplere otomatik eşleşin.
                            </p>
                            <Link to="/portfolio/realestate/add"
                                  className="flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 rounded font-bold text-xs uppercase tracking-wider transition-all mt-auto">
                                <Plus size={12} /> Gayrimenkul Ekle
                            </Link>
                        </div>
                    </div>

                    {/* Sağ: geniş liste alanı (md:col-span-3) */}
                    <div className="md:col-span-3">

                        <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-gray-50">
                                <div className="relative flex-1">
                                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" placeholder="Başlık, bölge veya emlak tipi ara..."
                                           value={search} onChange={e => setSearch(e.target.value)}
                                           className="w-full pl-8 pr-8 py-2 bg-white border border-gray-200 rounded text-xs font-medium text-gray-700 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors placeholder:text-gray-400" />
                                    {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={12} /></button>}
                                </div>
                                <div className="flex items-center gap-0.5 bg-gray-100 p-0.5 rounded border border-gray-200 flex-shrink-0">
                                    {[
                                        { key: "",          label: "Tümü"    },
                                        { key: "available", label: "Satışta" },
                                        { key: "reserved",  label: "Rezerve" },
                                        { key: "sold",      label: "Satıldı" },
                                    ].map(f => (
                                        <button key={f.key} onClick={() => setStatus(f.key)}
                                                className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded transition-all ${
                                                    statusFilter === f.key ? "bg-white text-amber-700 shadow-sm" : "text-gray-400 hover:text-gray-700"
                                                }`}>
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={() => fetchItems(true)} className="w-8 h-8 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                                    <RefreshCw size={13} />
                                </button>
                            </div>

                            {loading && items.length === 0 ? (
                                <div className="p-4 space-y-2">
                                    {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />)}
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="text-center py-16 px-4">
                                    <div className="w-12 h-12 bg-amber-50 rounded flex items-center justify-center mx-auto mb-3 text-amber-300">
                                        <Building2 size={22} />
                                    </div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gayrimenkul Bulunamadı</p>
                                    <p className="text-[10px] text-gray-400 font-medium mt-1 mb-4">
                                        {search ? "Arama kriterlerinize uygun gayrimenkul yok." : "Henüz portföyünüze gayrimenkul eklemediniz."}
                                    </p>
                                    <Link to="/portfolio/realestate/add"
                                          className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all">
                                        <Plus size={12} /> İlk Gayrimenkulü Ekle
                                    </Link>
                                </div>
                            ) : (
                                <div>
                                    {filtered.map(item => (
                                        <PropertyRow key={item.id} item={item}
                                                     onEdit={id => navigate(`/portfolio/realestate/${id}/edit`)}
                                                     onDelete={handleDelete}
                                                     onStatusChange={handleStatusChange}
                                                     onImage={setImageItem} />
                                    ))}
                                    {hasMore && (
                                        <div className="p-3">
                                            <button onClick={() => fetchItems(false)}
                                                    className="w-full py-2.5 text-[10px] font-bold text-gray-500 hover:text-gray-800 border border-dashed border-gray-200 hover:border-gray-300 rounded transition-colors">
                                                Daha Fazla Yükle
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {imageItem && (
                <ImageUploadModal
                    item={imageItem}
                    onClose={() => setImageItem(null)}
                    onUpdate={imgs => setItems(prev => prev.map(i => i.id === imageItem.id ? { ...i, images: imgs } : i))}
                />
            )}
        </div>
    )
}
