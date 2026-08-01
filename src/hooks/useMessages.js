import { useEffect } from "react"
import { useAuth } from "@/store/AuthContext.jsx"
import api from "@/lib/axios.js"

// ─────────────────────────────────────────────────────────────
// MİMARİ: useNotifications.js ile birebir aynı prensip — veritabanı
// tek gerçek kaynaktır. WebSocket (Reverb) burada AYRI bir bağlantı
// AÇMAZ; useNotifications.js'teki tek Echo kanalı ".new.message"
// olayını yakalayıp "toffera:new-message" CustomEvent'i olarak
// window'a yayınlıyor (bkz. useNotifications.js → onNewMessage).
// Bu dosya sadece o event'i dinleyip konuşma listesini DB'den tazeler.
//
//   Header/panel açılır  → DB'den çeker (fetchConversations)
//   "toffera:new-message" gelir → DB'yi tazele
// ─────────────────────────────────────────────────────────────

const listeners = new Set()
let state = { conversations: [], unreadCount: 0, loading: false, loaded: false }

function emit() {
    const snapshot = { ...state, conversations: [...state.conversations] }
    listeners.forEach(fn => fn(snapshot))
}

export function getMessagesState() {
    return { ...state, conversations: [...state.conversations] }
}

export function subscribeMessages(fn) {
    listeners.add(fn)
    fn(getMessagesState())          // ilk değerle hemen besle
    return () => listeners.delete(fn)
}

// ── DB'den konuşma listesini çek (header dropdown + panel için) ──
export async function fetchConversations({ silent = false } = {}) {
    if (!silent) { state = { ...state, loading: true }; emit() }
    try {
        const res = await api.get("/conversations")
        const conversations = res.data?.data || []
        const unreadCount = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)
        state = { conversations, unreadCount, loading: false, loaded: true }
        emit()
        return state
    } catch {
        state = { ...state, loading: false, loaded: true }
        emit()
        return state
    }
}

// ── Sadece toplam okunmamış sayısını tazele (hafif — badge için) ──
export async function refreshUnreadMessageCount() {
    try {
        const res = await api.get("/conversations/unread-count")
        state = { ...state, unreadCount: res.data?.unread_count ?? 0 }
        emit()
    } catch {}
}

// ── Bir konuşmanın mesajlarını getir (sayfalı) ──
export async function fetchMessages(conversationId, { page = 1 } = {}) {
    const res = await api.get(`/conversations/${conversationId}/messages`, { params: { page } })
    return res.data
}

// ── Mesaj gönder (serbest metin veya hazır mesaj çipi) ──
export async function sendMessage(conversationId, body, quickMessageId = null) {
    const res = await api.post(`/conversations/${conversationId}/messages`, {
        body,
        quick_message_id: quickMessageId,
    })
    fetchConversations({ silent: true })   // konuşma listesindeki "son mesaj" satırını tazele
    return res.data
}

// ── Teklif üzerinden görüşme başlat (SADECE talep sahibi çağırabilir — backend kontrol eder) ──
export async function startConversation(offerId) {
    const res = await api.post(`/conversations/offers/${offerId}`)
    fetchConversations({ silent: true })
    return res.data
}

// ── Konuşmayı okundu işaretle (DB + iyimser lokal güncelleme) ──
export async function markConversationRead(conversationId) {
    const target = state.conversations.find(c => c.id === conversationId)
    state = {
        ...state,
        conversations: state.conversations.map(c =>
            c.id === conversationId ? { ...c, unread_count: 0 } : c
        ),
        unreadCount: Math.max(0, state.unreadCount - (target?.unread_count || 0)),
    }
    emit()
    try { await api.post(`/conversations/${conversationId}/read`) }
    catch { fetchConversations({ silent: true }) }   // hata olursa gerçekle senkronla
}

// ── WebSocket tetikleyici dinleyicisi (window CustomEvent) ──
// useNotifications.js'in Echo kanalında AYRI bağlantı açmadan yakaladığı
// ".new.message" olayı buraya "toffera:new-message" olarak düşer.
let windowListenerAttached = false
function handleIncomingMessage() {
    fetchConversations({ silent: true })
}
function ensureWindowListener() {
    if (windowListenerAttached) return
    window.addEventListener("toffera:new-message", handleIncomingMessage)
    windowListenerAttached = true
}

// ── Hook ─────────────────────────────────────────────────
// Header.jsx içinde useNotifications() ile birlikte çağrılır. Echo
// bağlantısını BAŞLATMAZ (bu iş useNotifications.js'in sorumluluğunda),
// sadece konuşma listesini DB'den çeker ve tetikleyici olayı dinler.
export function useMessages() {
    const { user, isAuthenticated } = useAuth()

    useEffect(() => { ensureWindowListener() }, [])

    useEffect(() => {
        if (isAuthenticated && user?.id) {
            fetchConversations({ silent: true })
        } else {
            state = { conversations: [], unreadCount: 0, loading: false, loaded: false }
            emit()
        }
    }, [isAuthenticated, user?.id])
}
