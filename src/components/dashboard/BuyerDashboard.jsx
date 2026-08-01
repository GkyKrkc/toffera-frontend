import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
    Plus, FileText, XCircle,
    Building2, Car, ChevronRight, MapPin, Tag, Eye
} from "lucide-react"
import api from "@/lib/axios"
import { useToast } from "@/components/ui/Toast"

const STATUS_MAP = {
    active:    { label: "Aktif",         cls: "bg-green-50 text-green-700 border-green-100"   },
    matched:   { label: "Ön Anlaşma",    cls: "bg-amber-50 text-amber-700 border-amber-100"   },
    completed: { label: "Tamamlandı",    cls: "bg-purple-50 text-purple-700 border-purple-100" },
    cancelled: { label: "İptal",         cls: "bg-red-50 text-red-600 border-red-100"          },
}

function DemandRow({ demand, onCancel, onView }) {
    const status = STATUS_MAP[demand.status] || { label: demand.status, cls: "bg-gray-50 text-gray-500 border-gray-200" }
    const isGayr = demand.category?.slug === "gayrimenkul"
    const Icon   = isGayr ? Building2 : Car
    return (
        <div onClick={() => onView(demand)}
             className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-purple-50 cursor-pointer group transition-colors">
            <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${isGayr ? "bg-orange-50 text-orange-600" : "bg-purple-50 text-purple-600"}`}>
                <Icon size={14} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-800 truncate group-hover:text-purple-700 transition-colors">{demand.title}</p>
                <div className="flex items-center gap-3 mt-0.5">
                    {demand.district && (
                        <span className="text-[10px] text-gray-400 font-medium flex items-center gap-0.5">
              <MapPin size={9} />{demand.district}
            </span>
                    )}
                    {demand.max_budget && (
                        <span className="text-[10px] text-green-700 font-bold flex items-center gap-0.5">
              <Tag size={9} />{Number(demand.max_budget).toLocaleString("tr-TR")} ₺
            </span>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2.5 flex-shrink-0">
                <div className="text-right">
                    <span className="text-sm font-bold text-purple-700 block leading-none">{demand.offers_count || 0}</span>
                    <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">teklif</span>
                </div>
                <span className={`text-[8px] font-bold px-2 py-0.5 rounded border ${status.cls}`}>{status.label}</span>
                {demand.offers_count > 0 && (
                    <button onClick={e => { e.stopPropagation(); onView(demand) }}
                            className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider px-2 py-1 rounded border border-purple-100 text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors">
                        <Eye size={10} /> Teklifi Gör
                    </button>
                )}
                {demand.status === "active" && (
                    <button onClick={e => { e.stopPropagation(); onCancel(demand.id) }}
                            className="w-6 h-6 rounded bg-red-50 border border-red-100 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors"
                            title="İptal et">
                        <XCircle size={12} />
                    </button>
                )}
                <ChevronRight size={13} className="text-gray-300 group-hover:text-purple-500 transition-colors" />
            </div>
        </div>
    )
}

export default function BuyerDashboard({ onCreateDemand }) {
    const navigate  = useNavigate()
    const toast     = useToast()
    const [demands, setDemands]     = useState([])
    const [loading, setLoading]     = useState(true)
    const [activeTab, setActiveTab] = useState("active")

    useEffect(() => { fetchDemands() }, [])

    const fetchDemands = async () => {
        try {
            const res = await api.get("/buyer/demands")
            setDemands(res.data.data || res.data)
        } catch { setDemands([]) }
        finally { setLoading(false) }
    }

    const handleCancel = async (id) => {
        if (!confirm("Bu talebi iptal etmek istediğinizden emin misiniz?")) return
        try {
            await api.post(`/buyer/demands/${id}/cancel`)
            setDemands(prev => prev.map(d => d.id === id ? { ...d, status: "cancelled" } : d))
            toast({ message: "Talep iptal edildi." })
        } catch { toast({ message: "İptal başarısız.", type: "error" }) }
    }

    const filtered = demands.filter(d => activeTab === "all" ? true : d.status === activeTab)

    const stats = {
        total:     demands.length,
        active:    demands.filter(d => d.status === "active").length,
        completed: demands.filter(d => d.status === "completed").length,
        offers:    demands.reduce((a, d) => a + (d.offers_count || 0), 0),
    }

    return (
        <div className="space-y-6">
            {/* İstatistikler */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Toplam Talep", value: stats.total,     color: "text-purple-700" },
                    { label: "Aktif Talep",  value: stats.active,    color: "text-amber-700"  },
                    { label: "Tamamlanan",   value: stats.completed, color: "text-green-700"  },
                    { label: "Gelen Teklif", value: stats.offers,    color: "text-gray-800"   },
                ].map((s, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-sm shadow-sm p-3">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">{s.label}</p>
                        <p className={`text-xl font-bold leading-none ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Talep Listesi */}
            <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2">
                        <FileText size={13} className="text-gray-500" />
                        <h3 className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">Taleplerim</h3>
                    </div>
                    <div className="flex items-center gap-0.5 bg-gray-100 p-0.5 rounded border border-gray-200">
                        {[
                            { key: "active",    label: "Aktif"      },
                            { key: "completed", label: "Tamamlanan" },
                            { key: "all",       label: "Tümü"       },
                        ].map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                    className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider rounded transition-all ${
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
                            <FileText size={18} />
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Talep Bulunamadı</p>
                        <p className="text-[10px] text-gray-400 font-medium mt-1 mb-4">
                            {activeTab === "active" ? "Henüz aktif talebiniz yok." : "Bu filtreye ait talep bulunmuyor."}
                        </p>
                        <button onClick={onCreateDemand}
                                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all">
                            <Plus size={12} /> İlk Talebi Oluştur
                        </button>
                    </div>
                ) : (
                    <div>
                        {filtered.map(demand => (
                            <DemandRow key={demand.id} demand={demand}
                                       onCancel={handleCancel}
                                       onView={d => navigate(`/market/${d.id}`)} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}