// ─────────────────────────────────────────────────────────────
// MarketPage.jsx
// Talep Pazaryeri: tüm onaylı talepleri (demand) filtreleyip listeler.
//   - Sol: sıralama / konum / bütçe filtreleri (FilterSidebar)
//   - Sağ: grid veya liste görünümünde talep kartları + sayfalama
// Kart tıklanınca /market/:id (DemandDetailPage — henüz kurulmadı).
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
    Search, X, Building2, Car,
    RefreshCw, ChevronDown, MapPin, Tag, Timer,
    AlertTriangle, ChevronRight, ChevronLeft,
    Eye, Filter, LayoutGrid, LayoutList,
} from "lucide-react"
import Header from "@/components/layout/Header"
import { useAuth } from "@/store/AuthContext"
import { useTurkiyeLocation } from "@/hooks/useTurkiyeLocation"
import api from "@/lib/axios"

const SORT_OPTIONS = [
    { value: "latest", label: "En Yeni" },
    { value: "oldest", label: "En Eski" },
    { value: "most_offers", label: "En Fazla Teklif" },
    { value: "budget_desc", label: "Bütçe: Yüksek → Düşük" },
    { value: "budget_asc", label: "Bütçe: Düşük → Yüksek" },
]
const PER_PAGE = 12

// ── Geri Sayım ────────────────────────────────────────────────
function useCountdown(expiresAt) {
    const calc = () => {
        if (!expiresAt) return null
        const diff = new Date(expiresAt).getTime() - Date.now()
        if (diff <= 0) return { expired: true, total: 0 }
        return {
            expired: false, total: diff,
            d: Math.floor(diff / 86400000),
            h: Math.floor((diff % 86400000) / 3600000),
            m: Math.floor((diff % 3600000) / 60000),
            s: Math.floor((diff % 60000) / 1000),
        }
    }
    const [r, setR] = useState(calc)
    useEffect(() => {
        if (!expiresAt) return
        const t = setInterval(() => setR(calc()), 1000)
        return () => clearInterval(t)
    }, [expiresAt])
    return r
}

function TimerBadge({ expiresAt }) {
    const r = useCountdown(expiresAt)
    if (!r) return <span className="text-[9px] font-bold text-gray-400 flex items-center gap-0.5"><Timer size={9} />Süresiz</span>
    if (r.expired) return <span className="text-[9px] font-bold text-red-500 flex items-center gap-0.5"><AlertTriangle size={9} />Doldu</span>
    const isUrgent = r.total < 3 * 3600000
    const parts = []
    if (r.d > 0) parts.push(`${r.d}g`)
    if (r.h > 0) parts.push(`${r.h}s`)
    parts.push(`${String(r.m).padStart(2, "0")}d`)
    if (r.d === 0) parts.push(`${String(r.s).padStart(2, "0")}sn`)
    return (
        <span className={`text-[9px] font-bold flex items-center gap-0.5 ${isUrgent ? "text-red-500 animate-pulse" : "text-gray-400"}`}>
        <Timer size={9} />{parts.join(" ")}
      </span>
    )
}

// ── Talep Kartı (grid) ──────────────────────────────────────────
function DemandCard({ demand }) {
    const navigate = useNavigate()
    const isGayr = demand.category?.slug === "gayrimenkul"
    return (
        <div onClick={() => navigate(`/market/${demand.id}`)}
             className="bg-white border border-gray-200 rounded-sm hover:border-purple-300 hover:shadow-md transition-all group overflow-hidden cursor-pointer">
            <div className={`h-[3px] ${isGayr ? "bg-amber-400" : "bg-blue-500"}`} />
            <div className="p-4">
                <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isGayr ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-blue-50 text-blue-600 border border-blue-100"}`}>
                        {isGayr ? <Building2 size={15} /> : <Car size={15} />}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                    isGayr ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-blue-50 text-blue-700 border-blue-100"}`}>
                  {demand.category?.name}
                </span>
                            <TimerBadge expiresAt={demand.expires_at} />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 leading-snug group-hover:text-purple-700 transition-colors line-clamp-2 mb-2">
                            {demand.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            {demand.district && (
                                <span className="flex items-center gap-1 text-[10px] text-gray-500 font-semibold">
                      <MapPin size={10} className="text-gray-400" />{demand.district}
                    </span>
                            )}
                            {(demand.min_budget || demand.max_budget) && (
                                <span className="flex items-center gap-1 text-[10px] text-green-700 font-bold">
                      <Tag size={10} className="text-green-600" />
                                    {demand.min_budget ? `${Number(demand.min_budget).toLocaleString("tr-TR")} ₺` : ""}
                                    {demand.min_budget && demand.max_budget ? " – " : ""}
                                    {demand.max_budget ? `${Number(demand.max_budget).toLocaleString("tr-TR")} ₺` : ""}
                    </span>
                            )}
                        </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-purple-700 leading-none">{demand.offers_count || 0}</p>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">teklif</p>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${demand.status === "active" ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${demand.status === "active" ? "text-green-700" : "text-gray-400"}`}>
                {demand.status === "active" ? "Aktif" : demand.status === "matched" ? "Ön Anlaşma" : demand.status === "completed" ? "Tamamlandı" : demand.status}
              </span>
                    </div>
                    <button className="flex items-center gap-1.5 bg-purple-600 group-hover:bg-purple-700 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors">
                        <Eye size={11} /> Detay Gör
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Talep Liste Satırı (list) ────────────────────────────────
function DemandListRow({ demand }) {
    const navigate = useNavigate()
    const isGayr = demand.category?.slug === "gayrimenkul"
    return (
        <div onClick={() => navigate(`/market/${demand.id}`)}
             className="bg-white border border-gray-200 rounded-sm hover:border-purple-300 hover:shadow-md transition-all group overflow-hidden flex items-center gap-3 px-4 py-3 cursor-pointer">
            <div className={`w-9 h-9 rounded flex items-center justify-center flex-shrink-0 ${
                isGayr ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-blue-50 text-blue-600 border border-blue-100"}`}>
                {isGayr ? <Building2 size={15} /> : <Car size={15} />}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                isGayr ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-blue-50 text-blue-700 border-blue-100"}`}>
              {demand.category?.name}
            </span>
                    <TimerBadge expiresAt={demand.expires_at} />
                </div>
                <p className="text-sm font-bold text-gray-900 group-hover:text-purple-700 transition-colors truncate">
                    {demand.title}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 mt-0.5">
                    {demand.district && (
                        <span className="flex items-center gap-0.5 text-[10px] text-gray-500 font-semibold">
                  <MapPin size={9} />{demand.district}
                </span>
                    )}
                    {demand.max_budget && (
                        <span className="flex items-center gap-0.5 text-[10px] text-green-700 font-bold">
                  <Tag size={9} />{Number(demand.max_budget).toLocaleString("tr-TR")} ₺
                </span>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right hidden sm:block">
                    <p className="text-base font-bold text-purple-700 leading-none">{demand.offers_count || 0}</p>
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">teklif</p>
                </div>
                <span className={`hidden sm:flex items-center gap-1 text-[9px] font-bold ${demand.status === "active" ? "text-green-700" : "text-gray-400"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${demand.status === "active" ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
                    {demand.status === "active" ? "Aktif" : "Kapandı"}
          </span>
                <button className="flex items-center gap-1.5 bg-purple-600 group-hover:bg-purple-700 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors">
                    <Eye size={11} /> Detay
                </button>
            </div>
        </div>
    )
}

// ── Filtre Sol Kolon ────────────────────────────────────────────
function FilterSidebar({ filters, setFilter, loc, clearFilters, hasActiveFilters, onRefresh }) {
    return (
        <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-sm p-4 shadow-sm">
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-3">SIRALAMA</p>
                <div className="relative">
                    <select value={filters.sort} onChange={e => setFilter("sort")(e.target.value)}
                            className="w-full appearance-none px-3 py-2.5 bg-gray-50 border border-gray-200 rounded text-xs font-medium text-gray-700 outline-none focus:border-purple-400 cursor-pointer transition-all">
                        {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-sm p-4 shadow-sm">
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-3">KONUM</p>
                <div className="space-y-2">
                    <div className="relative">
                        <select value={loc.selectedProvince?.id || ""}
                                onChange={e => { const p = loc.provinces.find(p => p.id === Number(e.target.value)); loc.setSelectedProvince(p || null) }}
                                className="w-full appearance-none px-3 py-2.5 bg-gray-50 border border-gray-200 rounded text-xs font-medium text-gray-700 outline-none focus:border-purple-400 cursor-pointer">
                            <option value="">Tüm İller</option>
                            {loc.provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="relative">
                        <select value={loc.selectedDistrict?.id || ""} disabled={!loc.selectedProvince}
                                onChange={e => { const d = loc.districts.find(d => d.id === Number(e.target.value)); loc.setSelectedDistrict(d || null) }}
                                className="w-full appearance-none px-3 py-2.5 bg-gray-50 border border-gray-200 rounded text-xs font-medium text-gray-700 outline-none focus:border-purple-400 cursor-pointer disabled:opacity-40">
                            <option value="">Tüm İlçeler</option>
                            {loc.districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-sm p-4 shadow-sm">
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-3">BÜTÇE (₺)</p>
                <div className="space-y-2">
                    <input type="number" placeholder="Min bütçe" value={filters.min_budget}
                           onChange={e => setFilter("min_budget")(e.target.value)}
                           className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded text-xs font-medium text-gray-700 outline-none focus:border-purple-400 transition-all placeholder:text-gray-400" />
                    <input type="number" placeholder="Max bütçe" value={filters.max_budget}
                           onChange={e => setFilter("max_budget")(e.target.value)}
                           className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded text-xs font-medium text-gray-700 outline-none focus:border-purple-400 transition-all placeholder:text-gray-400" />
                </div>
            </div>

            <div className="flex gap-2">
                <button onClick={onRefresh}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-600 border border-gray-200 hover:border-gray-300 bg-white rounded transition-all hover:bg-gray-50">
                    <RefreshCw size={11} /> Yenile
                </button>
                {hasActiveFilters && (
                    <button onClick={clearFilters}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 rounded transition-all">
                        <X size={11} /> Temizle
                    </button>
                )}
            </div>
        </div>
    )
}

// ── ANA SAYFA ─────────────────────────────────────────────────
export default function MarketPage() {
    const { isAgent } = useAuth()
    const loc = useTurkiyeLocation()

    const [demands, setDemands] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [lastPage, setLastPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [viewMode, setViewMode] = useState("grid")

    const [filters, setFilters] = useState({
        search: "", category: "", sort: "latest", min_budget: "", max_budget: "",
    })
    const setFilter = k => v => { setFilters(f => ({ ...f, [k]: v })); setPage(1) }

    const locationFilter = [loc.selectedDistrict?.name, loc.selectedProvince?.name].filter(Boolean).join(", ")

    const fetchDemands = useCallback(async (p = page) => {
        setLoading(true)
        try {
            const params = {
                page: p,
                per_page: PER_PAGE,
                ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== "")),
                ...(locationFilter ? { district: locationFilter } : {}),
            }
            const res = await api.get("/demands", { params })
            setDemands(res.data.data || res.data || [])
            setLastPage(res.data.last_page || 1)
            setTotal(res.data.total || (res.data.data || res.data || []).length)
        } catch { setDemands([]) }
        finally { setLoading(false) }
    }, [filters, locationFilter, page])

    useEffect(() => { setPage(1) }, [filters, locationFilter])
    useEffect(() => { fetchDemands(page) }, [page, filters, locationFilter])

    const clearFilters = () => {
        setFilters({ search: "", category: "", sort: "latest", min_budget: "", max_budget: "" })
        loc.reset?.()
        setPage(1)
    }

    const hasActiveFilters = !!(filters.search || filters.category || filters.min_budget || filters.max_budget || locationFilter)

    return (
        <div className="min-h-screen bg-gray-200 flex flex-col">
            <Header />
            <div className="max-w-[1200px] mx-auto w-full px-4 py-8 flex-1">

                {/* Başlık + Kontroller */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Talep Pazaryeri</h1>
                        <p className="text-gray-400 text-xs font-medium mt-0.5">
                            {isAgent ? "Müşteri taleplerini inceleyin ve teklifinizi iletin." : "Aktif talepleri keşfedin."}
                            {total > 0 && !loading && <span className="ml-2 font-bold text-purple-700">{total} talep</span>}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded px-3.5 py-2 shadow-sm focus-within:border-purple-400 transition-colors w-full sm:w-auto sm:min-w-[240px]">
                            <Search size={13} className="text-gray-400" />
                            <input type="text" placeholder="Mahalle, bölge veya anahtar kelime..."
                                   value={filters.search}
                                   onChange={e => setFilter("search")(e.target.value)}
                                   className="text-xs font-medium text-gray-800 bg-transparent outline-none placeholder:text-gray-400 w-full" />
                            {filters.search && (
                                <button onClick={() => setFilter("search")("")} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                                    <X size={12} />
                                </button>
                            )}
                        </div>

                        <div className="bg-gray-100 p-1 rounded flex items-center gap-1 border border-gray-200 w-full sm:w-auto">
                            {["Tümü", "Gayrimenkul", "Vasıta"].map(tab => {
                                const slugMap = { "Tümü": "", "Gayrimenkul": "gayrimenkul", "Vasıta": "vasita" }
                                const active = filters.category === slugMap[tab]
                                return (
                                    <button key={tab} onClick={() => setFilter("category")(slugMap[tab])}
                                            className={`flex-1 sm:flex-none px-4 py-1.5 rounded text-xs font-bold transition-all ${active ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>
                                        {tab}
                                    </button>
                                )
                            })}
                        </div>

                        <div className="bg-gray-100 p-1 rounded flex items-center gap-1 border border-gray-200 hidden sm:flex">
                            <button onClick={() => setViewMode("list")}
                                    className={`p-1.5 rounded transition-all ${viewMode === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                                <LayoutList size={13} />
                            </button>
                            <button onClick={() => setViewMode("grid")}
                                    className={`p-1.5 rounded transition-all ${viewMode === "grid" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                                <LayoutGrid size={13} />
                            </button>
                        </div>

                        <button onClick={() => setSidebarOpen(v => !v)}
                                className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
                            <Filter size={13} />
                            {hasActiveFilters && <span className="w-1.5 h-1.5 bg-purple-600 rounded-full" />}
                        </button>
                    </div>
                </div>

                {/* İki Kolon Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                    <div className={`lg:col-span-3 ${sidebarOpen ? "block" : "hidden lg:block"}`}>
                        <FilterSidebar
                            filters={filters} setFilter={setFilter} loc={loc}
                            clearFilters={clearFilters} hasActiveFilters={hasActiveFilters}
                            onRefresh={() => fetchDemands(page)} />
                    </div>

                    <div className="lg:col-span-9">
                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="h-52 bg-white border border-gray-200 rounded-sm animate-pulse" />
                                ))}
                            </div>
                        ) : demands.length === 0 ? (
                            <div className="bg-white border border-gray-200 rounded-sm p-16 text-center shadow-sm">
                                <div className="w-14 h-14 bg-gray-50 border border-gray-200 rounded flex items-center justify-center mx-auto mb-4 text-gray-300">
                                    <Filter size={22} />
                                </div>
                                <p className="text-sm font-bold text-gray-600">Talep Bulunamadı</p>
                                <p className="text-xs text-gray-400 font-medium mt-1 mb-4">
                                    Filtrelerinizi değiştirerek tekrar deneyin.
                                </p>
                                {hasActiveFilters && (
                                    <button onClick={clearFilters}
                                            className="text-xs font-bold text-purple-600 hover:text-purple-800 border border-purple-200 hover:bg-purple-50 px-4 py-2 rounded transition-all">
                                        Filtreleri Temizle
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                {viewMode === "grid" ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                                        {demands.map(demand => <DemandCard key={demand.id} demand={demand} />)}
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3 mb-6">
                                        {demands.map(demand => <DemandListRow key={demand.id} demand={demand} />)}
                                    </div>
                                )}

                                {lastPage > 1 && (
                                    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-sm px-5 py-3.5 shadow-sm">
                                        <p className="text-[10px] font-bold text-gray-500">
                                            Sayfa <span className="font-bold text-gray-800">{page}</span> / {lastPage}
                                            <span className="ml-2 text-gray-400">({total} talep)</span>
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold text-gray-600 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-30 transition-all">
                                                <ChevronLeft size={12} /> Önceki
                                            </button>
                                            <div className="hidden sm:flex items-center gap-1">
                                                {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
                                                    let p
                                                    if (lastPage <= 5) p = i + 1
                                                    else if (page <= 3) p = i + 1
                                                    else if (page >= lastPage - 2) p = lastPage - 4 + i
                                                    else p = page - 2 + i
                                                    return (
                                                        <button key={p} onClick={() => setPage(p)}
                                                                className={`w-8 h-8 text-[11px] font-bold rounded transition-all ${page === p ? "bg-purple-700 text-white shadow-sm" : "text-gray-500 hover:bg-gray-100 border border-gray-200"}`}>
                                                            {p}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                            <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={page === lastPage}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold text-gray-600 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-30 transition-all">
                                                Sonraki <ChevronRight size={12} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}