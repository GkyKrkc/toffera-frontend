import { useEffect } from "react"
import { useToast } from "@/components/ui/Toast.jsx"
import { useAuth } from "@/store/AuthContext.jsx"
import api from "@/lib/axios.js"
import echo, { updateEchoToken } from "@/lib/echo.js"

// ─────────────────────────────────────────────────────────────
// MİMARİ: Veritabanı tek gerçek kaynaktır (single source of truth).
// WebSocket (Echo/Reverb) bir veri kaynağı DEĞİL, yalnızca "yeni bir şey
// oldu, listeni tazele" diyen bir tetikleyicidir.
//
//   Sayfa/header açılır → DB'den çeker (fetchNotifications)
//   WebSocket olayı gelir → ses + toast + push + DB'yi tazele
//
// Böylece header dropdown'ı ve /notifications sayfası AYNI listeyi
// (DB) görür; tutarsızlık imkânsızdır. Okundu/sil işlemleri de DB'ye yazar.
// ─────────────────────────────────────────────────────────────

// ── Bildirim sesi ─────────────────────────────────────────
const playSound = (type = "default") => {
    try {
        const ctx  = new (window.AudioContext || window.webkitAudioContext)()
        const osc  = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        if (type === "offer") {
            osc.frequency.setValueAtTime(520, ctx.currentTime)
            osc.frequency.setValueAtTime(780, ctx.currentTime + 0.12)
        } else if (type === "accepted") {
            osc.frequency.setValueAtTime(520, ctx.currentTime)
            osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1)
            osc.frequency.setValueAtTime(780, ctx.currentTime + 0.2)
        } else {
            osc.frequency.setValueAtTime(600, ctx.currentTime)
        }
        osc.type = "sine"
        gain.gain.setValueAtTime(0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.4)
    } catch {}
}

// ── Tarayıcı push bildirimi ───────────────────────────────
const pushNotification = (title, body, onClick) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return
    const n = new Notification(title, { body, icon: "/favicon.svg" })
    if (onClick) n.onclick = () => { window.focus(); onClick(); n.close() }
}

// ─────────────────────────────────────────────────────────────
// Global bildirim store — DB tabanlı
//   items:  DB'den gelen bildirim listesi (son N)
//   unread: okunmamış sayısı (badge)
// listener'lar header ve sayfa tarafından dinlenir.
// ─────────────────────────────────────────────────────────────
const listeners = new Set()
let state = { items: [], unread: 0, loading: false, loaded: false }

function emit() {
    const snapshot = { ...state, items: [...state.items] }
    listeners.forEach(fn => fn(snapshot))
}

export function getNotificationState() {
    return { ...state, items: [...state.items] }
}

export function subscribeNotifications(fn) {
    listeners.add(fn)
    fn(getNotificationState())        // ilk değerle hemen besle
    return () => listeners.delete(fn)
}

// ── DB'den bildirimleri çek (header dropdown için son 15) ──
export async function fetchNotifications({ silent = false } = {}) {
    if (!silent) { state = { ...state, loading: true }; emit() }
    try {
        const res = await api.get("/notifications", { params: { page: 1, per_page: 15 } })
        const items = res.data?.data || []
        const unread = res.data?.meta?.unread_count ?? items.filter(n => !n.read_at).length
        state = { items, unread, loading: false, loaded: true }
        emit()
        return state
    } catch {
        state = { ...state, loading: false, loaded: true }
        emit()
        return state
    }
}

// ── Sadece okunmamış sayısını tazele (hafif — badge için) ──
export async function refreshUnreadCount() {
    try {
        const res = await api.get("/notifications/unread-count")
        state = { ...state, unread: res.data?.unread_count ?? 0 }
        emit()
    } catch {}
}

// ── Tek bildirimi okundu işaretle (DB + lokal) ──
export async function markRead(id) {
    // iyimser güncelleme
    state = {
        ...state,
        items: state.items.map(n => n.id === id ? { ...n, read_at: n.read_at || new Date().toISOString() } : n),
        unread: Math.max(0, state.unread - 1),
    }
    emit()
    try { await api.post(`/notifications/${id}/read`) }
    catch { fetchNotifications({ silent: true }) }   // hata olursa gerçekle senkronla
}

// ── Hepsini okundu işaretle (DB + lokal) ──
export async function markAllRead() {
    state = {
        ...state,
        items: state.items.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })),
        unread: 0,
    }
    emit()
    try { await api.post("/notifications/read-all") }
    catch { fetchNotifications({ silent: true }) }
}

// ── Bildirimi sil (DB + lokal) ──
export async function deleteNotification(id) {
    const removed = state.items.find(n => n.id === id)
    state = {
        ...state,
        items: state.items.filter(n => n.id !== id),
        unread: removed && !removed.read_at ? Math.max(0, state.unread - 1) : state.unread,
    }
    emit()
    try { await api.delete(`/notifications/${id}`) }
    catch { fetchNotifications({ silent: true }) }
}

// ── Ses ayarı ─────────────────────────────────────────────
export function getSoundEnabled() {
    return localStorage.getItem("toffera_sound") !== "false"
}
export function setSoundEnabled(val) {
    localStorage.setItem("toffera_sound", String(val))
}

// ─────────────────────────────────────────────────────────────
// Singleton Echo yöneticisi — WebSocket sadece TETİKLEYİCİ.
// Olay gelince: ses + toast + push + DB'yi tazele.
// Hafızaya bildirim EKLEMEZ; kaynak DB.
// ─────────────────────────────────────────────────────────────
let activeUserId  = null
let toastCallback = null

// Ortak: canlı olay geldiğinde ses/toast/push ver, sonra DB'yi tazele
function onLiveEvent({ sound, toastMsg, toastType, pushTitle, pushBody, eventName, detail }) {
    if (toastMsg) toastCallback?.({ message: toastMsg, type: toastType || "info", duration: 6000 })
    if (getSoundEnabled()) playSound(sound || "default")
    if (pushTitle) pushNotification(pushTitle, pushBody)
    // DB'ye yeni satır yazıldı (backend Notification gönderdi) — listeyi tazele
    fetchNotifications({ silent: true })
    if (eventName) window.dispatchEvent(new CustomEvent(eventName, { detail }))
}

function onNewOffer(data) {
    const msg = `${data.agent_name} — ${Number(data.price).toLocaleString("tr-TR")} ₺ teklif verdi`
    onLiveEvent({
        sound: "offer", toastMsg: `💼 ${msg}`, toastType: "info",
        pushTitle: "Yeni Teklif", pushBody: msg,
        eventName: "toffera:new-offer", detail: data,
    })
}

function onOfferAccepted(data) {
    const msg = `Teklifiniz kabul edildi — ${data.demand_title}`
    onLiveEvent({
        sound: "accepted", toastMsg: `✅ ${msg}`, toastType: "success",
        pushTitle: "Teklif Kabul Edildi!", pushBody: msg,
        eventName: "toffera:offer-accepted", detail: data,
    })
}

function onNewDemand(data) {
    const msg = `${data.district} — yeni ${data.category} talebi`
    onLiveEvent({
        sound: "default", toastMsg: `🔔 ${msg}`, toastType: "info",
        pushTitle: "Yeni Talep", pushBody: msg,
        eventName: "toffera:new-demand", detail: data,
    })
}

// Mesajlaşma — backend App\Events\NewMessage (broadcastAs "new.message").
// useMessages.js bu "toffera:new-message" CustomEvent'ini dinleyip konuşma
// listesini tazeler; burada AYRI bir Echo bağlantısı açılmaz.
function onNewMessage(data) {
    console.log("%c[Toffera] Yeni mesaj olayı alındı (private-user kanalı):", "color:#7e22ce;font-weight:bold", data)
    const msg = `${data.sender_name}: ${data.body}`
    onLiveEvent({
        sound: "default", toastMsg: `💬 ${msg}`, toastType: "info",
        pushTitle: "Yeni Mesaj", pushBody: msg,
        eventName: "toffera:new-message", detail: data,
    })
}

// ── Genel bildirim yakalayıcı ─────────────────────────────
// Özel adlandırılmış Event'lerin (NewOffer, OfferAccepted vb. — yukarıdaki
// üç fonksiyon) AKSİNE, bu Laravel'in standart Notification broadcast
// mekanizmasını (Echo'nun channel.notification() metodu) dinler. Yeni
// eklenen her bildirim tipi (AppNotification üzerinden giden — agent
// onayı, ilan onayı, teklif moderasyonu vb.) özel bir Event yazmadan
// otomatik olarak buraya düşer, sayı sınırı yok. Zaten özel dinleyicisi
// olan (yeni teklif/kabul) tipler için nadiren çift toast görülebilir —
// gerçek 'type' değerleriyle karşılaşınca EXCLUDED_TYPES'a eklenip
// susturulabilir.
const EXCLUDED_TYPES = [] // örn: ['offer_received', 'offer_accepted']

function onGenericNotification(notification) {
    console.log("%c[Toffera] Genel bildirim alındı:", "color:#7e22ce;font-weight:bold", notification)
    if (EXCLUDED_TYPES.includes(notification?.type)) {
        fetchNotifications({ silent: true }) // toast yok, sadece listeyi tazele
        return
    }
    onLiveEvent({
        sound: "default",
        toastMsg: notification?.title ? `🔔 ${notification.title}` : null,
        toastType: "info",
        pushTitle: notification?.title,
        pushBody: notification?.message,
    })
}

function startEchoListeners(user) {
    if (!user?.id) return
    if (activeUserId === user.id) return // zaten başlatılmış

    const token = localStorage.getItem("token")
    if (token) updateEchoToken(token)

    console.log("%c[Toffera] Echo dinleyicileri başlatılıyor — user.%s", "color:#7e22ce;font-weight:bold", user.id)

    // Bağlantı durumu teşhisi — bunlar konsolda görünmüyorsa Echo hiç
    // kurulamamış demektir (env değişkenleri / echo.js kontrolü gerekir).
    try {
        echo.connector.pusher.connection.bind("state_change", (states) => {
            console.log(`%c[Toffera] Reverb bağlantı durumu: ${states.previous} → ${states.current}`, "color:#7e22ce;font-weight:bold")
        })
        echo.connector.pusher.connection.bind("error", (err) => {
            console.error("[Toffera] Reverb bağlantı hatası:", err)
        })
    } catch (e) {
        console.error("[Toffera] Echo/Pusher connector'a erişilemedi:", e)
    }

    // Notification izni
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission()
    }

    // Private kanal — bu kullanıcıya gelen bildirimler
    const channel = echo.private(`user.${user.id}`)
    channel.subscribed(() => {
        console.log(`%c[Toffera] private-user.${user.id} kanalına abone olundu ✔`, "color:#16a34a;font-weight:bold")
    })
    channel.error((err) => {
        console.error(`[Toffera] private-user.${user.id} kanal aboneliği HATA verdi:`, err)
    })
    channel.listen(".new.offer",      onNewOffer)
    channel.listen(".offer.accepted", onOfferAccepted)
    // NewDemand event'i agent'ın KENDİ özel kanalına yayınlanıyor
    // (bkz. backend NewDemand::broadcastOn()).
    channel.listen(".new.demand", onNewDemand)
    // Mesajlaşma — bkz. backend App\Events\NewMessage.
    channel.listen(".new.message", onNewMessage)
    // Laravel'in standart Notification broadcast mekanizması — TÜM yeni
    // bildirim tiplerini (AppNotification) tek yerden yakalar, özel event
    // adı tanımlamaya gerek kalmaz. Bkz. backend User::receivesBroadcastNotificationsOn()
    channel.notification(onGenericNotification)

    // Herkese açık talep kanalı
    echo.channel("demands").listen(".demand.status.changed", (data) => {
        window.dispatchEvent(new CustomEvent("toffera:demand-status-changed", { detail: data }))
    })

    activeUserId = user.id

    // Giriş anında geçmişi bir kez çek
    fetchNotifications({ silent: true })
}

function stopEchoListeners() {
    if (!activeUserId) return
    try {
        echo.leave(`user.${activeUserId}`)
        echo.leave("demands")
    } catch {}
    activeUserId = null
    state = { items: [], unread: 0, loading: false, loaded: false }
    emit()
}

// ── Hook ─────────────────────────────────────────────────
// Uygulama genelinde YALNIZCA BİR YERDE çağrılmalı (bkz. Header.jsx) —
// paylaşılan header her sayfada render olduğu için Echo dinleyicilerini
// başlatmak/durdurmak için doğru yer burasıdır.
export function useNotifications() {
    const { user, isAuthenticated } = useAuth()
    const toast = useToast()

    useEffect(() => { toastCallback = toast }, [toast])

    useEffect(() => {
        if (isAuthenticated && user?.id) startEchoListeners(user)
        else stopEchoListeners()
    }, [isAuthenticated, user?.id])
}