import { useEffect, useRef, useState } from "react"
import { X, Send, MapPin, Loader2, Lock } from "lucide-react"
import { useAuth } from "@/store/AuthContext.jsx"
import api from "@/lib/axios.js"
import { fetchMessages, sendMessage, markConversationRead } from "@/hooks/useMessages.js"

/**
 * Tek bir konuşmanın mesaj akışını gösteren slide-over panel.
 * Header.jsx'teki "Mesajlar" dropdown'ından bir konuşmaya tıklanınca açılır.
 *
 * Props:
 * - conversationId: açılacak konuşmanın id'si
 * - conversationMeta: liste satırından gelen özet bilgi ({demand_title, other_party, ...})
 *   — panel ilk açılırken başlık boş kalmasın diye kullanılır, mesajlar geldikten sonra
 *   gerçek veriyle önemi kalmaz.
 * - onClose: panel kapatılınca çağrılır
 */
export default function ConversationPanel({ conversationId, conversationMeta, onClose }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [quickMessages, setQuickMessages] = useState([])
  const [body, setBody] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [conversationStatus, setConversationStatus] = useState(conversationMeta?.status || "active")
  const bottomRef = useRef(null)
  const isClosed = conversationStatus === "closed"

  useEffect(() => {
    if (!conversationId) return
    let cancelled = false

    setLoading(true)
    Promise.all([
      fetchMessages(conversationId),
      api.get("/quick-messages").catch(() => ({ data: { data: [] } })),
    ]).then(([msgRes, qmRes]) => {
      if (cancelled) return
      setMessages(msgRes?.data || [])
      setQuickMessages(qmRes?.data?.data || qmRes?.data || [])
      if (msgRes?.conversation?.status) setConversationStatus(msgRes.conversation.status)
      setLoading(false)
    }).catch(() => {
      if (!cancelled) setLoading(false)
    })

    markConversationRead(conversationId)

    return () => { cancelled = true }
  }, [conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Panel açıkken karşı taraftan canlı mesaj gelirse akışı tazele (bkz.
  // useNotifications.js → onNewMessage → "toffera:new-message" CustomEvent).
  useEffect(() => {
    if (!conversationId) return
    const handler = (e) => {
      if (String(e.detail?.conversation_id) !== String(conversationId)) return
      fetchMessages(conversationId).then(res => setMessages(res?.data || []))
      markConversationRead(conversationId)
    }
    window.addEventListener("toffera:new-message", handler)
    return () => window.removeEventListener("toffera:new-message", handler)
  }, [conversationId])

  const handleSend = async (text, quickMessageId = null) => {
    const trimmed = (text ?? body).trim()
    if (!trimmed || sending || isClosed) return
    setSending(true)
    // iyimser güncelleme — gerçek id/created_at gelene kadar geçici bir satır göster
    const optimistic = {
      id: `tmp-${Date.now()}`,
      sender_id: user?.id,
      sender: { id: user?.id, name: user?.name },
      body: trimmed,
      created_at: new Date().toISOString(),
      _optimistic: true,
    }
    setMessages(prev => [...prev, optimistic])
    setBody("")
    try {
      const res = await sendMessage(conversationId, trimmed, quickMessageId)
      const real = res?.data
      setMessages(prev => prev.map(m => (m.id === optimistic.id ? (real || m) : m)))
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
    } finally {
      setSending(false)
    }
  }

  if (!conversationId) return null

  const otherName = conversationMeta?.other_party?.name || "Karşı Taraf"

  return (
      <div className="fixed inset-0 z-[70] flex justify-end">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className="relative w-full sm:w-[420px] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">

          {/* Başlık */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-gray-800 text-sm truncate">{otherName}</h3>
                {isClosed && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 border border-gray-200 rounded-full px-1.5 py-0.5 flex-shrink-0">
                      Kapandı
                    </span>
                )}
              </div>
              {conversationMeta?.demand_title && (
                  <p className="flex items-center gap-1 text-[11px] text-gray-500 truncate mt-0.5">
                    <MapPin size={10} className="text-purple-400 flex-shrink-0" />
                    {conversationMeta.demand_title}
                  </p>
              )}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 flex-shrink-0">
              <X size={18} />
            </button>
          </div>

          {/* Mesaj akışı */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/50">
            {loading ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <Loader2 size={20} className="animate-spin" />
                </div>
            ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center text-xs text-gray-400 px-6">
                  Henüz mesaj yok. Aşağıdan bir hazır mesaj seçebilir veya kendi mesajınızı yazabilirsiniz.
                </div>
            ) : messages.map(msg => {
              const mine = msg.sender_id === user?.id
              return (
                  <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                        mine ? "bg-purple-600 text-white rounded-br-sm" : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm"
                    } ${msg._optimistic ? "opacity-60" : ""}`}>
                      <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                      <span className={`block text-[10px] mt-1 ${mine ? "text-purple-200" : "text-gray-400"}`}>
                    {new Date(msg.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                    </div>
                  </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Konuşma kapandıysa (teklif reddedildi / satış onaylandı / kabulden
              vazgeçilmedi) — yazı kutusu yerine bilgilendirme şeridi. */}
          {isClosed ? (
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center gap-2.5">
                <Lock size={14} className="text-gray-400 flex-shrink-0" />
                <p className="text-xs text-gray-500 font-medium">
                  Bu görüşme kapandı, artık mesaj gönderilemez.
                </p>
              </div>
          ) : (
              <>
                {/* Hazır mesaj çipleri */}
                {quickMessages.length > 0 && (
                    <div className="px-3 pt-2 pb-1 border-t border-gray-100 bg-white flex gap-1.5 overflow-x-auto">
                      {quickMessages.map(qm => (
                          <button
                              key={qm.id}
                              onClick={() => handleSend(qm.body, qm.id)}
                              disabled={sending}
                              className="flex-shrink-0 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-100 rounded-full px-3 py-1.5 transition-colors disabled:opacity-50"
                          >
                            {qm.label}
                          </button>
                      ))}
                    </div>
                )}

                {/* Yazı girişi */}
                <div className="p-3 border-t border-gray-100 bg-white flex items-end gap-2">
                  <textarea
                      value={body}
                      onChange={e => setBody(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                      placeholder="Mesajınızı yazın..."
                      rows={1}
                      className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 max-h-24"
                  />
                  <button
                      onClick={() => handleSend()}
                      disabled={sending || !body.trim()}
                      className="p-2.5 rounded-full bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white transition-colors flex-shrink-0"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </>
          )}
        </div>
      </div>
  )
}
