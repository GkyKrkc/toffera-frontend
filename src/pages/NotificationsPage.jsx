import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/store/AuthContext"
import Header from "@/components/layout/Header"
import PanelHeader from "@/components/dashboard/PanelHeader"
import api from "@/lib/axios"
import {
    markRead as storeMarkRead,
    markAllRead as storeMarkAllRead,
    deleteNotification as storeDelete,
    refreshUnreadCount,
} from "@/hooks/useNotifications"
import {
    Bell, BellRing, Inbox, CheckCircle, XCircle, ShieldCheck, Target,
    Check, Trash2, ChevronRight, ChevronLeft, Loader2, CheckCheck,
} from "lucide-react"

const TABS = [
    { key: "all",    label: "Bildirimler",           icon: Bell     },
    { key: "unread", label: "Okunmayan Bildirimler",  icon: BellRing },
]

// Backend'in NotificationType::icon() değerleriyle birebir eşleşmeli
// (bkz. AppNotification::toDatabase()) — Header.jsx'teki dropdown'la aynı
// eşleme mantığı, sadece burada emoji değil gerçek ikon + renk kullanılıyor.
const ICONS = {
    "inbox":        { Icon: Inbox,       cls: "bg-purple-50 text-purple-600 border-purple-100" },
    "check-circle": { Icon: CheckCircle, cls: "bg-green-50 text-green-600 border-green-100"   },
    "x-circle":     { Icon: XCircle,     cls: "bg-red-50 text-red-600 border-red-100"         },
    "shield-check": { Icon: ShieldCheck, cls: "bg-blue-50 text-blue-600 border-blue-100"       },
    "target":       { Icon: Target,      cls: "bg-amber-50 text-amber-600 border-amber-100"   },
    "bell":         { Icon: Bell,        cls: "bg-gray-50 text-gray-500 border-gray-200"       },
}

function timeAgo(dateStr) {
    const d = new Date(dateStr)
    const diff = Math.floor((Date.now() - d.getTime()) / 1000)
    if (diff < 60) return "az önce"
    if (diff < 3600) return Math.floor(diff / 60) + " dk önce"
    if (diff < 86400) return Math.floor(diff / 3600) + " saat önce"
    if (diff < 604800) return Math.floor(diff / 86400) + " gün önce"
    return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "long" })
}

function NotificationRow({ n, onRead, onDelete, onOpen }) {
    const conf = ICONS[n.data?.icon] || ICONS.bell
    const { Icon } = conf
    const unread = !n.read_at

    return (
        <div onClick={() => onOpen(n)}
             className={`flex items-start gap-3 px-4 sm:px-5 py-4 border-b border-gray-100 last:border-0 cursor-pointer group transition-colors ${
                 unread ? "bg-purple-50/40 hover:bg-purple-50/70" : "hover:bg-gray-50"
             }`}>
            <div className={`w-9 h-9 rounded border flex items-center justify-center flex-shrink-0 ${conf.cls}`}>
                <Icon size={16} />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className={`text-xs font-bold truncate ${unread ? "text-gray-800" : "text-gray-600"}`}>
                        {n.data?.title || "Bildirim"}
                    </p>
                    {unread && <span className="w-1.5 h-1.5 rounded-full bg-purple-600 flex-shrink-0" />}
                </div>
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed mt-0.5 line-clamp-2">
                    {n.data?.message}
                </p>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1.5">
                    {timeAgo(n.created_at)}
                </p>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {unread && (
                    <button onClick={e => { e.stopPropagation(); onRead(n.id) }}
                            title="Okundu işaretle"
                            className="w-7 h-7 rounded bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-green-600 hover:border-green-200 transition-colors">
                        <Check size={13} />
                    </button>
                )}
                <button onClick={e => { e.stopPropagation(); onDelete(n.id) }}
                        title="Sil"
                        className="w-7 h-7 rounded bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-600 hover:border-red-200 transition-colors">
                    <Trash2 size={13} />
                </button>
            </div>

            <ChevronRight size={14} className="text-gray-300 group-hover:text-purple-500 transition-colors mt-1 flex-shrink-0" />
        </div>
    )
}

export default function NotificationsPage() {
    const { isAuthenticated, loading: authLoading } = useAuth()
    const navigate = useNavigate()

    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState("all")
    const [page, setPage] = useState(1)
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, unread_count: 0 })
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        if (!authLoading && !isAuthenticated) navigate("/")
    }, [authLoading, isAuthenticated])

    useEffect(() => { fetchPage() }, [tab, page])

    const fetchPage = async () => {
        setLoading(true)
        try {
            const res = await api.get("/notifications", {
                params: { page, per_page: 20, unread: tab === "unread" ? 1 : undefined },
            })
            setItems(res.data.data || [])
            setMeta(res.data.meta || meta)
        } catch {
            setItems([])
        } finally {
            setLoading(false)
        }
    }

    const markRead = async (id) => {
        setItems(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
        setMeta(m => ({ ...m, unread_count: Math.max(0, m.unread_count - 1) }))
        await storeMarkRead(id)
        refreshUnreadCount()
    }

    const markAllRead = async () => {
        setBusy(true)
        setItems(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })))
        setMeta(m => ({ ...m, unread_count: 0 }))
        await storeMarkAllRead()
        if (tab === "unread") fetchPage()
        setBusy(false)
    }

    const removeNotification = async (id) => {
        setItems(prev => prev.filter(n => n.id !== id))
        setMeta(m => ({ ...m, total: Math.max(0, m.total - 1) }))
        await storeDelete(id)
        refreshUnreadCount()
    }

    const openNotification = (n) => {
        if (!n.read_at) markRead(n.id)
        if (n.data?.url) navigate(n.data.url)
    }

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-200 flex flex-col">
                <Header />
                <div className="flex items-center justify-center flex-1">
                    <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        )
    }
    if (!isAuthenticated) return null

    return (
        <div className="min-h-screen bg-gray-200 font-sans text-gray-800 flex flex-col">
            <Header />

            <main className="max-w-[1200px] mx-auto w-full px-4 py-6 flex-1">

                <PanelHeader />

                <nav className="flex items-center gap-2 text-[10px] font-bold text-gray-400 mb-4">
                    <Link to="/dashboard" className="hover:text-purple-700 transition-colors">Panelim</Link>
                    <ChevronRight size={12} className="text-gray-300" />
                    <span className="text-gray-600">Bildirimler</span>
                </nav>

                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Bildirimler</h1>
                        <p className="text-gray-400 text-xs font-medium mt-1">
                            Yeni teklif, talep eşleşmesi ve durum güncellemelerinin tamamı burada.
                        </p>
                    </div>

                    {meta.unread_count > 0 && (
                        <button onClick={markAllRead} disabled={busy}
                                className="self-start flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 hover:border-purple-300 hover:text-purple-700 text-gray-600 rounded text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50">
                            {busy ? <Loader2 size={12} className="animate-spin" /> : <CheckCheck size={13} />}
                            Tümünü Okundu İşaretle
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                    {/* Sol sidebar — Bildirimler / Okunmayan Bildirimler */}
                    <div className="md:col-span-1">
                        <div className="bg-white rounded-sm border border-gray-200 shadow-sm overflow-hidden">
                            {TABS.map(t => {
                                const Icon = t.icon
                                return (
                                    <button key={t.key}
                                            onClick={() => { setPage(1); setTab(t.key) }}
                                            className={`w-full flex items-center justify-between gap-2.5 px-4 py-3 text-left border-b border-gray-100 last:border-0 transition-all ${
                                                tab === t.key ? "bg-purple-50 text-purple-700" : "text-gray-600 hover:bg-gray-50"
                                            }`}>
                                        <span className="flex items-center gap-2.5">
                                            <Icon size={14} className={tab === t.key ? "text-purple-600" : "text-gray-400"} />
                                            <span className="text-xs font-bold">{t.label}</span>
                                        </span>
                                        {t.key === "unread" && meta.unread_count > 0 && (
                                            <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full flex-shrink-0">
                                                {meta.unread_count > 99 ? "99+" : meta.unread_count}
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Sağ içerik */}
                    <div className="md:col-span-3">
                        <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                            {loading ? (
                                <div className="p-4 space-y-2">
                                    {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}
                                </div>
                            ) : items.length === 0 ? (
                                <div className="text-center py-16 px-4">
                                    <div className="w-14 h-14 bg-gray-50 border border-gray-200 rounded flex items-center justify-center mx-auto mb-4 text-gray-300">
                                        <Bell size={24} />
                                    </div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        {tab === "unread" ? "Okunmamış Bildirim Yok" : "Bildirim Yok"}
                                    </p>
                                    <p className="text-[10px] text-gray-400 font-medium mt-1">
                                        Yeni teklif, eşleşme ve durum güncellemeleri burada görünecek.
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    {items.map(n => (
                                        <NotificationRow key={n.id} n={n}
                                                         onRead={markRead}
                                                         onDelete={removeNotification}
                                                         onOpen={openNotification} />
                                    ))}
                                </div>
                            )}

                            {!loading && meta.last_page > 1 && (
                                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
                                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={meta.current_page <= 1}
                                            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-purple-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                        <ChevronLeft size={13} /> Önceki
                                    </button>
                                    <span className="text-[10px] font-bold text-gray-400">
                                        Sayfa {meta.current_page} / {meta.last_page}
                                    </span>
                                    <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={meta.current_page >= meta.last_page}
                                            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-purple-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                        Sonraki <ChevronRight size={13} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}