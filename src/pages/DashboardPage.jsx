import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useAuth } from "@/store/AuthContext"
import Header from "@/components/layout/Header"
import PanelHeader from "@/components/dashboard/PanelHeader"
import BuyerDashboard from "@/components/dashboard/BuyerDashboard"
import AgentDashboard from "@/components/dashboard/AgentDashboard"
import api from "@/lib/axios"
import {
    markRead as storeMarkRead,
    markAllRead as storeMarkAllRead,
    deleteNotification as storeDelete,
    refreshUnreadCount,
} from "@/hooks/useNotifications"
import { subscribeMessages, fetchConversations } from "@/hooks/useMessages.js"
import ConversationPanel from "@/components/messages/ConversationPanel.jsx"
import {
    CheckCircle, ShieldAlert, ShieldCheck,
    Bell, ChevronRight, TrendingUp,
    ArrowUpRight, ArrowDownRight, HelpCircle, Info, LayoutDashboard,
    Inbox, XCircle, Target, Check, Trash2, Loader2, CheckCheck, MessageSquare,
} from "lucide-react"

const TABS = [
    { key: "overview",      label: "Genel Bakış",             icon: LayoutDashboard },
    { key: "messages",      label: "Mesajlar",                icon: MessageSquare   },
    { key: "notifications", label: "Bildirimler",              icon: Bell            },
    { key: "guide",         label: "Güvenli İşlem Rehberi",    icon: HelpCircle      },
]

// Canlı Bölgesel Fiyat Endeksi — şimdilik simüle veri, endeks API'si
// bağlanınca sadece setIndexData kaynağı değişecek.
function LiveMarketIndexWidget() {
    const [indexData, setIndexData] = useState({
        emlak: { index: 1245.2, diff: 1.45, dir: "up" },
        vasita: { index: 942.8, diff: -0.22, dir: "down" },
        talepYogunluk: { index: 88.5, diff: 3.12, dir: "up" },
    })

    useEffect(() => {
        const interval = setInterval(() => {
            setIndexData(prev => {
                const e = (Math.random() - 0.45) * 0.8
                const v = (Math.random() - 0.52) * 0.6
                const y = (Math.random() - 0.4) * 0.5
                return {
                    emlak: { index: +(prev.emlak.index + e).toFixed(1), diff: +(prev.emlak.diff + e / 10).toFixed(2), dir: e >= 0 ? "up" : "down" },
                    vasita: { index: +(prev.vasita.index + v).toFixed(1), diff: +(prev.vasita.diff + v / 10).toFixed(2), dir: v >= 0 ? "up" : "down" },
                    talepYogunluk: { index: +(prev.talepYogunluk.index + y).toFixed(1), diff: +(prev.talepYogunluk.diff + y / 10).toFixed(2), dir: y >= 0 ? "up" : "down" },
                }
            })
        }, 3000)
        return () => clearInterval(interval)
    }, [])

    const rows = [
        { label: "Gayrimenkul Endeksi", val: `${indexData.emlak.index} TL / m²`, d: indexData.emlak },
        { label: "Oto-Fiyat Endeksi", val: `${indexData.vasita.index} Puan`, d: indexData.vasita },
        { label: "Günlük Talep İvmesi", val: `${indexData.talepYogunluk.index} Yoğunluk`, d: indexData.talepYogunluk },
    ]

    return (
        <div className="border border-gray-200 rounded-sm overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <TrendingUp size={14} className="text-purple-600" />
                    <h2 className="text-xs font-bold text-gray-800">Bölgesel Fiyat Endeksi</h2>
                </div>
                <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[9px] font-bold uppercase text-green-700">Canlı</span>
        </span>
            </div>
            <div className="p-4 space-y-3">
                {rows.map((r, i) => (
                    <div key={i} className={`flex items-center justify-between ${i < rows.length - 1 ? "border-b border-gray-100 pb-3" : ""}`}>
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{r.label}</p>
                            <p className="text-xs font-bold text-gray-800 mt-0.5">{r.val}</p>
                        </div>
                        <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded ${r.d.dir === "up" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                            {r.d.dir === "up" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            %{Math.abs(r.d.diff).toFixed(2)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ── Genel Bakış Sekmesi ──────────────────────────────────────
function OverviewTab({ isBuyer, isAgent, isAdmin, navigate, onStatsChange }) {
    return (
        <div className="space-y-6">
            {isBuyer && <BuyerDashboard onCreateDemand={() => navigate("/demands/create")} />}
            {isAgent && <AgentDashboard onGoToMarket={() => navigate("/market")} onStatsChange={onStatsChange} />}
            {isAdmin && (
                <div className="text-center py-10">
                    <ShieldAlert className="w-9 h-9 text-red-600 mx-auto mb-3" />
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Yönetim Modu Aktif</p>
                    <p className="text-[11px] text-gray-400 font-medium mt-1">İşlemleri admin paneli üzerinden yürütebilirsiniz.</p>
                </div>
            )}
            {!isBuyer && !isAgent && !isAdmin && (
                <div className="text-center py-16">
                    <p className="text-sm font-bold text-gray-600">Gösterilecek içerik bulunamadı.</p>
                </div>
            )}

            <LiveMarketIndexWidget />
        </div>
    )
}

// Backend'in NotificationType::icon() değerleriyle birebir eşleşmeli
// (bkz. AppNotification::toDatabase()).
const NOTIF_ICONS = {
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
    const conf = NOTIF_ICONS[n.data?.icon] || NOTIF_ICONS.bell
    const { Icon } = conf
    const unread = !n.read_at

    return (
        <div onClick={() => onOpen(n)}
             className={`flex items-start gap-3 px-5 py-4 border-b border-gray-100 last:border-0 cursor-pointer group transition-colors ${
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

// ── Mesajlar Sekmesi ───────────────────────────────────────────
// Header.jsx'teki mesaj dropdown'ıyla AYNI global store'u (useMessages.js)
// kullanır — DB tek gerçek kaynak, WebSocket sadece tetikleyici. Burada
// ekstra bir API çağrısı/Echo bağlantısı açılmıyor, sadece store dinleniyor.
function ConversationRow({ conv, onOpen }) {
    return (
        <div onClick={() => onOpen(conv)}
             className="flex gap-3 p-4 border-b border-gray-100 last:border-0 hover:bg-purple-50 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-indigo-700 font-bold uppercase">
                {(conv.other_party?.name || "?").charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                    <h4 className="font-bold text-gray-800 text-sm truncate pr-2">{conv.other_party?.name}</h4>
                    {conv.last_message_at && (
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                            {new Date(conv.last_message_at).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })}
                        </span>
                    )}
                </div>
                <p className="text-xs text-indigo-600 font-medium truncate">{conv.demand_title}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">{conv.last_message || "Henüz mesaj yok"}</p>
            </div>
            {conv.unread_count > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full flex-shrink-0 mt-1">
                    {conv.unread_count > 9 ? "9+" : conv.unread_count}
                </span>
            )}
        </div>
    )
}

function MessagesTab({ onOpenConversation }) {
    const [conversations, setConversations] = useState([])
    const [loading, setLoading] = useState(true)
    const [subTab, setSubTab] = useState("active")

    useEffect(() => {
        const unsub = subscribeMessages(snap => {
            setConversations(snap.conversations)
            setLoading(snap.loading)
        })
        fetchConversations()
        return unsub
    }, [])

    const activeConvos = conversations.filter(c => c.status !== "closed")
    const closedConvos = conversations.filter(c => c.status === "closed")
    const list = subTab === "active" ? activeConvos : closedConvos

    return (
        <div className="-m-5">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-0.5 bg-gray-100 p-0.5 rounded border border-gray-200">
                    {[
                        { key: "active", label: `Aktif Mesajlar${activeConvos.length ? ` (${activeConvos.length})` : ""}` },
                        { key: "closed", label: `Önceki Mesajlar${closedConvos.length ? ` (${closedConvos.length})` : ""}` },
                    ].map(t => (
                        <button key={t.key} onClick={() => setSubTab(t.key)}
                                className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded transition-all ${
                                    subTab === t.key ? "bg-white text-purple-700 shadow-sm" : "text-gray-400 hover:text-gray-700"
                                }`}>
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="p-5 space-y-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}
                </div>
            ) : list.length === 0 ? (
                <div className="text-center py-14 px-4">
                    <div className="w-12 h-12 bg-gray-50 border border-gray-200 rounded flex items-center justify-center mx-auto mb-3 text-gray-300">
                        <MessageSquare size={20} />
                    </div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {subTab === "active" ? "Aktif Mesaj Yok" : "Önceki Mesaj Yok"}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium mt-1">
                        Teklif detayından "Görüşme Başlat" ile yeni bir konuşma başlatabilirsiniz.
                    </p>
                </div>
            ) : (
                <div>
                    {list.map(conv => (
                        <ConversationRow key={conv.id} conv={conv} onOpen={onOpenConversation} />
                    ))}
                </div>
            )}
        </div>
    )
}

// ── Bildirimler Sekmesi (tam işlevli) ─────────────────────────
function NotificationsTab({ navigate, onUnreadChange }) {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [subTab, setSubTab] = useState("all")
    const [page, setPage] = useState(1)
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, unread_count: 0 })
    const [busy, setBusy] = useState(false)

    useEffect(() => { fetchPage() }, [subTab, page])

    const fetchPage = async () => {
        setLoading(true)
        try {
            const res = await api.get("/notifications", {
                params: { page, per_page: 10, unread: subTab === "unread" ? 1 : undefined },
            })
            setItems(res.data.data || [])
            const m = res.data.meta || meta
            setMeta(m)
            onUnreadChange?.(m.unread_count ?? 0)
        } catch {
            setItems([])
        } finally {
            setLoading(false)
        }
    }

    const markRead = async (id) => {
        setItems(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
        setMeta(m => {
            const next = { ...m, unread_count: Math.max(0, m.unread_count - 1) }
            onUnreadChange?.(next.unread_count)
            return next
        })
        await storeMarkRead(id)
        refreshUnreadCount()
    }

    const markAllRead = async () => {
        setBusy(true)
        setItems(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })))
        setMeta(m => ({ ...m, unread_count: 0 }))
        onUnreadChange?.(0)
        await storeMarkAllRead()
        if (subTab === "unread") fetchPage()
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

    return (
        <div className="-m-5">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-0.5 bg-gray-100 p-0.5 rounded border border-gray-200">
                    {[
                        { key: "all", label: "Tümü" },
                        { key: "unread", label: "Okunmamış" + (meta.unread_count ? ` (${meta.unread_count})` : "") },
                    ].map(t => (
                        <button key={t.key} onClick={() => { setPage(1); setSubTab(t.key) }}
                                className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded transition-all ${
                                    subTab === t.key ? "bg-white text-purple-700 shadow-sm" : "text-gray-400 hover:text-gray-700"
                                }`}>
                            {t.label}
                        </button>
                    ))}
                </div>
                {meta.unread_count > 0 && (
                    <button onClick={markAllRead} disabled={busy}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-purple-300 hover:text-purple-700 text-gray-600 rounded text-[9px] font-bold uppercase tracking-wider transition-all disabled:opacity-50">
                        {busy ? <Loader2 size={11} className="animate-spin" /> : <CheckCheck size={12} />}
                        Tümünü Okundu İşaretle
                    </button>
                )}
            </div>

            {loading ? (
                <div className="p-5 space-y-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-14 px-4">
                    <div className="w-12 h-12 bg-gray-50 border border-gray-200 rounded flex items-center justify-center mx-auto mb-3 text-gray-300">
                        <Bell size={20} />
                    </div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {subTab === "unread" ? "Okunmamış Bildirim Yok" : "Bildirim Yok"}
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

            {!loading && meta.last_page > 1 && (() => {
                const windowSize = 5
                let start = Math.max(1, meta.current_page - Math.floor(windowSize / 2))
                let end = Math.min(meta.last_page, start + windowSize - 1)
                start = Math.max(1, end - windowSize + 1)
                const pageNumbers = Array.from({ length: end - start + 1 }, (_, i) => start + i)

                return (
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-wrap justify-between items-center gap-2 text-xs text-gray-500">
                        <span className="text-[10px] font-bold text-gray-400">Toplam {meta.total} bildirim gösteriliyor.</span>
                        <div className="flex gap-1">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={meta.current_page <= 1}
                                    className="px-2 py-1 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[11px] font-bold">
                                Önceki
                            </button>
                            {start > 1 && <span className="px-1.5 py-1 text-gray-400 text-[11px]">…</span>}
                            {pageNumbers.map(p => (
                                <button key={p} onClick={() => setPage(p)}
                                        className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                                            p === meta.current_page
                                                ? "bg-purple-600 text-white"
                                                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                                        }`}>
                                    {p}
                                </button>
                            ))}
                            {end < meta.last_page && <span className="px-1.5 py-1 text-gray-400 text-[11px]">…</span>}
                            <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={meta.current_page >= meta.last_page}
                                    className="px-2 py-1 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[11px] font-bold">
                                Sonraki
                            </button>
                        </div>
                    </div>
                )
            })()}
        </div>
    )
}

// ── Güvenli İşlem Rehberi Sekmesi ────────────────────────────
function GuideTab() {
    return (
        <div className="space-y-4 text-[11px] text-gray-600 text-left">
            <div className="flex items-center gap-2 mb-1">
                <HelpCircle size={14} className="text-purple-600" />
                <h3 className="text-xs font-bold text-gray-800">Güvenli İşlem Rehberi</h3>
            </div>
            <div className="space-y-1">
                <p className="font-bold text-gray-800">Ruhsatlı Uzman Garantisi</p>
                <p className="leading-relaxed">Tüm gayrimenkul ve vasıta uzmanlarımız mesleki liyakat ve ruhsat kontrolünden geçirilir.</p>
            </div>
            <div className="space-y-1">
                <p className="font-bold text-gray-800">KVKK Gizlilik Kalkanı</p>
                <p className="leading-relaxed">İletişim bilgileriniz asla satıcılarla paylaşılmaz; sadece kabul ettiğiniz teklif sahibiyle görüşürsünüz.</p>
            </div>
            <div className="space-y-1">
                <p className="font-bold text-gray-800">Sıfır Ek Komisyon</p>
                <p className="leading-relaxed">Taraflar arasında gerçekleşen satışlardan ek platform hizmet bedeli alınmaz.</p>
            </div>
        </div>
    )
}

export default function DashboardPage() {
    const { user, isAuthenticated, isAgent, isBuyer, isAdmin, loading } = useAuth()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview")
    const [unreadCount, setUnreadCount] = useState(0)
    const [messagesUnread, setMessagesUnread] = useState(0)
    const [activeConversation, setActiveConversation] = useState(null)

    // Sidebar'daki "Bildirimler" rozeti, sekme hangisi olursa olsun (Genel
    // Bakış'ta bile) doğru sayıyı göstersin diye bağımsız çekiliyor — Header
    // banner'ındaki agentStats ile aynı mantık (bkz. PanelHeader.jsx).
    useEffect(() => {
        api.get("/notifications/unread-count")
            .then(res => setUnreadCount(res.data?.unread_count ?? 0))
            .catch(() => {})
    }, [])

    // Sidebar'daki "Mesajlar" rozeti — Header.jsx'teki ile AYNI global store
    // (useMessages.js), ekstra bir istek atmıyor.
    useEffect(() => {
        const unsub = subscribeMessages(snap => setMessagesUnread(snap.unreadCount))
        return unsub
    }, [])

    useEffect(() => {
        if (!loading && !isAuthenticated) navigate("/")
    }, [loading, isAuthenticated])

    if (loading) {
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

                {/* Sol Sidebar + Sağ İçerik */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                    {/* Sol sidebar — tab menü */}
                    <div className="md:col-span-1">
                        <div className="bg-white rounded-sm border border-gray-200 shadow-sm overflow-hidden">
                            {TABS.map(tab => {
                                const Icon = tab.icon
                                return (
                                    <button key={tab.key}
                                            onClick={() => setActiveTab(tab.key)}
                                            className={`w-full flex items-center justify-between gap-2.5 px-4 py-3 text-left border-b border-gray-100 last:border-0 transition-all ${
                                                activeTab === tab.key ? "bg-purple-50 text-purple-700" : "text-gray-600 hover:bg-gray-50"
                                            }`}>
                                        <span className="flex items-center gap-2.5">
                                            <Icon size={14} className={activeTab === tab.key ? "text-purple-600" : "text-gray-400"} />
                                            <span className="text-xs font-bold">{tab.label}</span>
                                        </span>
                                        {tab.key === "notifications" && unreadCount > 0 && (
                                            <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full flex-shrink-0">
                                                {unreadCount > 99 ? "99+" : unreadCount}
                                            </span>
                                        )}
                                        {tab.key === "messages" && messagesUnread > 0 && (
                                            <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full flex-shrink-0">
                                                {messagesUnread > 99 ? "99+" : messagesUnread}
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Mobilde gizli, masaüstünde özet kart */}
                        <div className="mt-4 bg-gray-900 border border-gray-800 rounded-sm shadow-sm p-4 hidden md:block">
                            <div className="flex items-center gap-2 mb-2">
                                <Info size={12} className="text-amber-400" />
                                <span className="text-[9px] font-bold uppercase tracking-wide text-white">Bilgi</span>
                            </div>
                            <p className="text-[10px] text-gray-300 leading-relaxed">
                                Panel sekmelerinden hesap durumunuzu, bildirim akışını ve güvenli işlem rehberini takip edebilirsiniz.
                            </p>
                        </div>
                    </div>

                    {/* Sağ içerik */}
                    <div className="md:col-span-3">
                        <div className="bg-white rounded-sm border border-gray-200 shadow-sm p-5">
                            {activeTab === "overview" && (
                                <OverviewTab isBuyer={isBuyer} isAgent={isAgent} isAdmin={isAdmin} navigate={navigate} />
                            )}
                            {activeTab === "messages" && <MessagesTab onOpenConversation={setActiveConversation} />}
                            {activeTab === "notifications" && <NotificationsTab navigate={navigate} onUnreadChange={setUnreadCount} />}
                            {activeTab === "guide" && <GuideTab />}
                        </div>
                    </div>
                </div>
            </main>

            {activeConversation && (
                <ConversationPanel
                    conversationId={activeConversation.id}
                    conversationMeta={activeConversation}
                    onClose={() => setActiveConversation(null)}
                />
            )}
        </div>
    )
}