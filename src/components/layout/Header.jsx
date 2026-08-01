import { useState, useRef, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import {
  Search, PlusCircle, MessageSquare, Bell, Menu, X, Circle,
  LayoutDashboard, LogOut, User, ChevronDown, Settings,
  Building2, Car, Layers, Shield, Volume2, VolumeX, CheckCheck, Clock, Briefcase,
  Package, Lock, CreditCard, Landmark,
} from "lucide-react"
import { useAuth } from "@/store/AuthContext"
import {
  useNotifications, subscribeNotifications, markRead, markAllRead,
  fetchNotifications, getSoundEnabled, setSoundEnabled,
} from "@/hooks/useNotifications.js"
import { useMessages, subscribeMessages, fetchConversations } from "@/hooks/useMessages.js"
import ConversationPanel from "@/components/messages/ConversationPanel.jsx"

/**
 * Paylaşılan site header'ı — SMS/Şifre login öncesi ve sonrası tüm sayfalarda
 * (HomePage, AccountPage, ileride MarketPage vb.) kullanılacak.
 *
 * Props:
 * - showCategoryMenuToggle: sol üstte kategori sidebar'ını açıp kapatan
 *   hamburger butonunu gösterir. Sadece bu sidebar'a sahip sayfalarda
 *   (şu an: HomePage) true geçilmeli.
 * - isMobileMenuOpen / onMobileMenuToggle: yukarıdaki hamburger'ın state'i,
 *   sidebar'a sahip olan sayfa tarafından kontrol edilir.
 * - onLogoClick: logoya tıklanınca ekstra bir davranış gerekiyorsa
 *   (örn. HomePage'de açık olan ilan modalını kapatmak) buradan verilir.
 */
export default function Header({
                                 showCategoryMenuToggle = false,
                                 isMobileMenuOpen = false,
                                 onMobileMenuToggle = () => {},
                                 onLogoClick,
                               }) {
  const navigate = useNavigate()
  const { user, isAuthenticated, isAgent, isAdmin, logout } = useAuth()

  // Echo/Reverb dinleyicilerini başlatır — uygulama genelinde tek yer burası
  // olmalı, çünkü Header her sayfada render oluyor (bkz. useNotifications.js).
  useNotifications()
  // Konuşma listesini DB'den çeker; Echo bağlantısını AYRI açmaz, yukarıdaki
  // useNotifications()'ın yakaladığı ".new.message" olayını dinler (bkz.
  // useMessages.js).
  useMessages()

  const [isMessagesOpen, setIsMessagesOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [notifs, setNotifs] = useState([])
  const [unread, setUnread] = useState(0)
  const [soundEnabled, setSoundState] = useState(getSoundEnabled)
  const [conversations, setConversations] = useState([])
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [activeConversation, setActiveConversation] = useState(null)

  const dropdownRef = useRef(null)
  const accountRef = useRef(null)

  // Global bildirim store'unu dinle (bkz. useNotifications.js — DB kaynaklı,
  // WebSocket sadece tazeleme tetikleyicisi).
  useEffect(() => {
    const unsub = subscribeNotifications(snap => {
      setNotifs(snap.items)
      setUnread(snap.unread)
    })
    return unsub
  }, [])

  // Global mesajlaşma store'unu dinle (bkz. useMessages.js).
  useEffect(() => {
    const unsub = subscribeMessages(snap => {
      setConversations(snap.conversations)
      setUnreadMessages(snap.unreadCount)
    })
    return unsub
  }, [])

  const handleOpenNotifications = () => {
    setIsNotificationsOpen(v => !v)
    setIsMessagesOpen(false)
    if (!isNotificationsOpen) fetchNotifications()   // açılınca DB'den taze listeyi çek
  }

  const handleOpenMessages = () => {
    setIsMessagesOpen(v => !v)
    setIsNotificationsOpen(false)
    if (!isMessagesOpen) fetchConversations()   // açılınca DB'den taze listeyi çek
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMessagesOpen(false)
        setIsNotificationsOpen(false)
      }
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setIsAccountOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const avatarInitials = user?.name
      ?.split(" ")
      .map(n => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()

  // Rol etiketi — RegisterPage'deki ACCOUNT_TYPES (buyer/emlakci/galerici/her_ikisi)
  // ile birebir aynı mantık; backend user objesinde agent_type ya da
  // account_type olarak dönebiliyor, ikisini de destekliyoruz.
  //
  // DİKKAT: agent_type artık sadece 3 klasik grup için doluyor (bkz.
  // RegisterController::legacyAgentType() — geriye dönük köprü). Yeni,
  // dinamik hesap grupları (Oto Galeri, Plaza, Rent A Car vb.) bu ENUM'a
  // sığmadığı için agent_type null kalıyor — bunlar için account_type_group
  // ilişkisindeki gerçek grup adını gösteriyoruz, aksi halde isAgent=true
  // olan biri yanlışlıkla "Müşteri" etiketiyle görünüyordu.
  const getRoleInfo = () => {
    if (isAdmin) return { label: "Yönetici", icon: Shield }
    if (isAgent) {
      const t = user?.agent_type || user?.account_type
      if (t === "emlakci")   return { label: "Emlak Uzmanı",   icon: Building2 }
      if (t === "galerici")  return { label: "Vasıta Uzmanı",  icon: Car }
      if (t === "her_ikisi") return { label: "Emlak & Vasıta", icon: Layers }
      if (user?.account_type_group?.name) {
        return { label: user.account_type_group.name, icon: Briefcase }
      }
      return { label: "Uzman", icon: Briefcase }
    }
    return { label: "Müşteri", icon: User }
  }
  const roleInfo = getRoleInfo()

  const handleLogout = async () => {
    await logout()
    setIsAccountOpen(false)
    navigate("/")
  }

  // Anasayfadaki "yapım aşaması" erişim kodu ekranını (bkz. HomePage.jsx,
  // GATE_CODE) yeniden kilitler — sessionStorage bayrağını temizleyip
  // anasayfaya sert bir yönlendirme yapıyoruz ki gate her zaman en baştan
  // (React state'i sıfırlanmış şekilde) çalışsın.
  const handleCloseSite = () => {
    sessionStorage.removeItem("toffera_site_unlocked")
    setIsAccountOpen(false)
    window.location.href = "/"
  }

  // Logo tıklaması her zaman anasayfaya götürür (<Link to="/">'in varsayılan
  // davranışı). onLogoClick sadece ek bir yan etki (ör. açık bir modalı
  // kapatmak) için çağrılır — artık navigasyonu ASLA engellemiyor.
  const handleLogoClick = () => {
    onLogoClick?.()
  }

  return (
      <header className="bg-gradient-to-r from-indigo-800 via-purple-700 to-fuchsia-600 border-b border-purple-900 sticky top-0 z-50 shadow-md">
        {/* Logo titreme animasyonu — sadece burada kullanılıyor */}
        <style>{`
        @keyframes logoPulseShake {
          0% { transform: scale(1) rotate(0deg); opacity: 1; }
          5% { transform: scale(1.03) rotate(-2deg); opacity: 0.9; }
          10% { transform: scale(1.03) rotate(2deg); opacity: 0.9; }
          15% { transform: scale(1.03) rotate(-2deg); opacity: 0.9; }
          20% { transform: scale(1) rotate(0deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .logo-anim {
          display: inline-block;
          animation: logoPulseShake 3s infinite ease-in-out;
        }
      `}</style>

        <div className="max-w-[1200px] mx-auto px-4">
          <div className="flex items-center h-16">

            {/* Logo & Mobil Menü */}
            <div className="flex items-center gap-4 md:w-64 flex-shrink-0">
              {showCategoryMenuToggle && (
                  <button
                      className="md:hidden p-1 text-white hover:bg-white/20 rounded-full transition-colors"
                      onClick={onMobileMenuToggle}
                  >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                  </button>
              )}
              <Link to="/" onClick={handleLogoClick} className="flex flex-col items-start leading-none cursor-pointer">
                <span className="text-2xl font-extrabold tracking-tight text-white logo-anim">Teklif Meydanı</span>
                <span className="text-[10px] font-medium text-purple-200 tracking-widest uppercase">Güvenli Alışveriş</span>
              </Link>
            </div>

            {/* Arama Çubuğu (Masaüstü) — logo kutusu (md:w-64) sidebar genişliğiyle,
                ml-6 de sidebar ile içerik arasındaki gap-6 ile aynı — arama böylece
                HomePage'deki "Anasayfa Vitrini" başlığıyla dikey hizada başlıyor. */}
            <div className="hidden md:flex flex-1 ml-6 mr-6 relative group">
              <input
                  type="text"
                  placeholder="Kelime, ilan no veya mağaza adı ile ara"
                  className="w-full pl-4 pr-12 py-2.5 rounded shadow-inner outline-none text-sm border border-transparent focus:border-purple-400 focus:ring-2 focus:ring-purple-400 transition-all bg-white"
              />
              <button className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-purple-600 bg-gray-100 border-l rounded-r flex items-center justify-center transition-colors">
                <Search size={18} />
              </button>
            </div>

            {/* Kullanıcı Menüsü ve Butonlar */}
            <div className="flex items-center gap-4 ml-auto">
              {/* Siteyi Kapat — giriş durumundan bağımsız, her zaman görünür.
                  Yapım aşaması erişim kodu ekranını (bkz. HomePage.jsx) yeniden
                  kilitler; ziyaretçi de, giriş yapmış kullanıcı da erişebilsin. */}
              <button
                  onClick={handleCloseSite}
                  title="Siteyi kapat (erişim kodu ekranını yeniden göster)"
                  className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-colors"
              >
                <Lock size={18} />
              </button>

              {!isAuthenticated && (
                  <div className="hidden lg:flex items-center gap-4 text-sm font-medium text-white">
                    <Link to="/login" className="hover:text-purple-200 transition-colors">Giriş Yap</Link>
                    <span className="text-purple-400">|</span>
                    <Link to="/register" className="hover:text-purple-200 transition-colors">Üye Ol</Link>
                  </div>
              )}

              {isAuthenticated && (
                  <div className="flex items-center gap-3 text-white" ref={dropdownRef}>

                    {/* Mesajlar */}
                    <div className="relative">
                      <button
                          onClick={handleOpenMessages}
                          className={`p-1.5 rounded-full transition-colors relative ${isMessagesOpen ? "bg-white/20" : "hover:bg-white/20"}`}
                      >
                        <MessageSquare size={20} />
                        {unreadMessages > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-purple-800 shadow-sm">
                              {unreadMessages > 9 ? "9+" : unreadMessages}
                            </span>
                        )}
                      </button>

                      {isMessagesOpen && (
                          <div className="absolute top-12 right-0 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[60] animate-in slide-in-from-top-2 duration-200">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                              <span className="font-bold text-gray-800 text-sm">
                                Mesajlar {unreadMessages > 0 ? `(${unreadMessages} Yeni)` : ""}
                              </span>
                            </div>
                            <div className="max-h-[350px] overflow-y-auto">
                              {conversations.length === 0 ? (
                                  <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mb-3 text-gray-300">
                                      <MessageSquare size={20} />
                                    </div>
                                    <p className="text-xs font-bold text-gray-400">Henüz konuşma yok</p>
                                    <p className="text-[10px] text-gray-300 mt-0.5">Teklif detayından "Görüşme Başlat" ile başlayabilirsiniz</p>
                                  </div>
                              ) : conversations.map(conv => (
                                  <div
                                      key={conv.id}
                                      onClick={() => { setActiveConversation(conv); setIsMessagesOpen(false) }}
                                      className="p-4 border-b border-gray-50 hover:bg-purple-50 transition-colors cursor-pointer flex gap-3"
                                  >
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
                                    {conv.unread_count > 0 && <Circle size={8} className="fill-purple-600 text-purple-600 mt-2" />}
                                  </div>
                              ))}
                            </div>
                            {conversations.length > 0 && (
                                <div className="p-3 text-center bg-gray-50 border-t border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer"
                                     onClick={() => { navigate("/dashboard?tab=messages"); setIsMessagesOpen(false) }}>
                                  <span className="text-sm font-semibold text-purple-700">Tüm Mesajları Gör</span>
                                </div>
                            )}
                          </div>
                      )}
                    </div>

                    {/* Bildirimler */}
                    <div className="relative">
                      <button
                          onClick={handleOpenNotifications}
                          className={`p-1.5 rounded-full transition-colors relative ${isNotificationsOpen ? "bg-white/20" : "hover:bg-white/20"}`}
                      >
                        {unread > 0 && <span className="absolute inset-1.5 rounded-full bg-purple-300 opacity-75 animate-ping z-0"></span>}
                        <Bell size={20} className="relative z-10" />
                        {unread > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-purple-800 shadow-sm z-20">
                          {unread > 9 ? "9+" : unread}
                        </span>
                        )}
                      </button>

                      {isNotificationsOpen && (
                          <div className="absolute top-12 -right-10 sm:right-0 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[60] animate-in slide-in-from-top-2 duration-200">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-800 text-sm">Bildirimler</span>
                                {unread > 0 && (
                                    <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{unread}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => { const n = !soundEnabled; setSoundState(n); setSoundEnabled(n) }}
                                    title={soundEnabled ? "Bildirim sesini kapat" : "Bildirim sesini aç"}
                                    className={`p-1.5 rounded-lg transition-colors ${soundEnabled ? "text-purple-600 bg-purple-50" : "text-gray-400 hover:bg-gray-100"}`}
                                >
                                  {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                                </button>
                                {notifs.length > 0 && (
                                    <button onClick={markAllRead} className="text-[10px] font-bold text-gray-400 hover:text-purple-700 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-purple-50 transition-colors">
                                      <CheckCheck size={11} /> Tümünü oku
                                    </button>
                                )}
                              </div>
                            </div>
                            <div className="max-h-[350px] overflow-y-auto">
                              {notifs.length === 0 ? (
                                  <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mb-3 text-gray-300">
                                      <Bell size={20} />
                                    </div>
                                    <p className="text-xs font-bold text-gray-400">Bildirim yok</p>
                                    <p className="text-[10px] text-gray-300 mt-0.5">Yeni teklif ve onaylar burada görünür</p>
                                  </div>
                              ) : notifs.slice(0, 10).map(notif => {
                                const isUnread = !notif.read_at
                                const title = notif.data?.title || "Bildirim"
                                return (
                                    <div key={notif.id}
                                         onClick={() => { if (isUnread) markRead(notif.id); if (notif.data?.url) navigate(notif.data.url); setIsNotificationsOpen(false) }}
                                         className={`flex items-center gap-3 p-4 border-b border-gray-50 hover:bg-purple-50 transition-colors cursor-pointer ${isUnread ? "bg-purple-50/40" : ""}`}>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-800 leading-snug truncate">{title}</p>
                                        {notif.data?.message && (
                                            <p className="text-xs text-gray-500 truncate mt-0.5">{notif.data.message}</p>
                                        )}
                                        <span className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                          <Clock size={9} />
                                          {new Date(notif.created_at).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                      </div>
                                      {isUnread && <Circle size={8} className="fill-purple-600 text-purple-600 mt-1 flex-shrink-0" />}
                                    </div>
                                )
                              })}
                            </div>
                            <div className="p-3 text-center bg-gray-50 border-t border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => { navigate("/dashboard?tab=notifications"); setIsNotificationsOpen(false) }}>
                              <span className="text-sm font-semibold text-purple-700">Tüm Bildirimleri Gör</span>
                            </div>
                          </div>
                      )}
                    </div>

                    {/* Hesap Avatarı & Dropdown */}
                    <div className="relative ml-1" ref={accountRef}>
                      <button
                          onClick={() => setIsAccountOpen(!isAccountOpen)}
                          className={`flex items-center gap-2 border border-white/20 py-1.5 px-3 rounded-full transition-all ${isAccountOpen ? "bg-white/20" : "bg-white/10 hover:bg-white/20"}`}
                      >
                        <div className="w-6 h-6 rounded-full bg-white text-purple-700 flex items-center justify-center font-bold text-[11px] uppercase shadow-sm">
                          {avatarInitials || <User size={13} />}
                        </div>
                        <span className="text-sm font-semibold hidden md:block whitespace-nowrap">
                      {avatarInitials} - {roleInfo.label}
                    </span>
                        <ChevronDown size={14} className={`hidden sm:block transition-transform duration-200 ${isAccountOpen ? "rotate-180" : ""}`} />
                      </button>

                      {isAccountOpen && (
                          <div className="absolute top-12 right-0 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[60] animate-in slide-in-from-top-2 duration-200 text-gray-800">
                            <div className="p-4 border-b border-gray-100 bg-gray-50">
                              <p className="font-bold text-sm truncate">{user?.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5 truncate">{user?.email || user?.phone}</p>
                              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-100 px-2 py-1 rounded-full mt-2">
                                <roleInfo.icon size={11} /> {roleInfo.label}
                              </div>
                            </div>
                            <div className="py-2">
                              <Link
                                  to="/dashboard"
                                  onClick={() => setIsAccountOpen(false)}
                                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 hover:text-purple-700 transition-colors flex items-center gap-3"
                              >
                                <LayoutDashboard size={16} className="text-gray-400" /> Panelim
                              </Link>
                              <Link
                                  to="/portfolio"
                                  onClick={() => setIsAccountOpen(false)}
                                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 hover:text-purple-700 transition-colors flex items-center gap-3"
                              >
                                <Package size={16} className="text-gray-400" /> Portföyüm
                              </Link>
                              <Link
                                  to="/abonelik"
                                  onClick={() => setIsAccountOpen(false)}
                                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 hover:text-purple-700 transition-colors flex items-center gap-3"
                              >
                                <CreditCard size={16} className="text-gray-400" /> Abonelik & Kontör
                              </Link>
                              <Link
                                  to="/account"
                                  onClick={() => setIsAccountOpen(false)}
                                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 hover:text-purple-700 transition-colors flex items-center gap-3"
                              >
                                <User size={16} className="text-gray-400" /> Profilim
                              </Link>
                              <Link
                                  to="/account?tab=dealer"
                                  onClick={() => setIsAccountOpen(false)}
                                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 hover:text-purple-700 transition-colors flex items-center gap-3"
                              >
                                <Landmark size={16} className="text-gray-400" /> Bayilik Başvurusu
                              </Link>
                              <Link
                                  to="/settings"
                                  onClick={() => setIsAccountOpen(false)}
                                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 hover:text-purple-700 transition-colors flex items-center gap-3"
                              >
                                <Settings size={16} className="text-gray-400" /> Ayarlar
                              </Link>
                            </div>
                            <div className="border-t border-gray-100 py-1.5 px-1.5">
                              <button
                                  onClick={handleCloseSite}
                                  title="Yapım aşaması erişim kodu ekranını yeniden göster"
                                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                              >
                                <Lock size={15} /> Siteyi Kapat
                              </button>
                              <button
                                  onClick={handleLogout}
                                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <LogOut size={15} /> Çıkış Yap
                              </button>
                            </div>
                          </div>
                      )}
                    </div>

                  </div>
              )}

              {!isAuthenticated && (
                  <button onClick={() => navigate("/register")} className="hidden sm:flex items-center gap-2 bg-white hover:bg-gray-100 text-purple-700 px-5 py-2 rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                    <PlusCircle size={18} />
                    <span>Ücretsiz İlan Ver</span>
                  </button>
              )}
            </div>
          </div>

          {/* Mobil Arama */}
          <div className="md:hidden pb-3">
            <div className="relative">
              <input
                  type="text"
                  placeholder="Arama yapın..."
                  className="w-full pl-3 pr-10 py-2 rounded-lg outline-none text-sm focus:ring-2 focus:ring-purple-400"
              />
              <Search className="absolute right-3 top-2 text-gray-400" size={18} />
            </div>
          </div>
        </div>

        {activeConversation && (
            <ConversationPanel
                conversationId={activeConversation.id}
                conversationMeta={activeConversation}
                onClose={() => setActiveConversation(null)}
            />
        )}
      </header>
  )
}