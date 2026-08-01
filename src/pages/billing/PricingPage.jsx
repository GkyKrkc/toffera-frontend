import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import {
    ChevronRight, CreditCard, Coins, Check, Loader2, ShieldCheck,
    Layers, Package, Zap,
} from "lucide-react"
import Header from "@/components/layout/Header"
import { useAuth } from "@/store/AuthContext"
import { useToast } from "@/components/ui/Toast"
import api from "@/lib/axios"
import PaymentMethodModal from "@/components/billing/PaymentMethodModal"

// Uzman (galericiler/danışmanlar) abonelik paketleri — kart rengi paketin
// önem sırasına göre döngüsel atanıyor (dashboard'daki PALETTE mantığıyla
// aynı yaklaşım).
const PLAN_PALETTE = [
    { accent: "#4b5563", bg: "bg-gray-50",   border: "border-gray-200",   text: "text-gray-700"   },
    { accent: "#7e22ce", bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-700" },
    { accent: "#d97706", bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-700"  },
]

function formatPrice(price) {
    return Number(price).toLocaleString("tr-TR")
}

export default function PricingPage() {
    const navigate = useNavigate()
    const toast = useToast()
    const { isAuthenticated, isAgent, loading: authLoading } = useAuth()

    const [loading, setLoading] = useState(true)
    const [buyingCode, setBuyingCode] = useState(null)
    const [subscriptionPlans, setSubscriptionPlans] = useState([])
    const [creditPacks, setCreditPacks] = useState([])
    const [currentSubscription, setCurrentSubscription] = useState(null)
    const [loadError, setLoadError] = useState(null)
    const [availableMethods, setAvailableMethods] = useState(["paytr"])
    const [methodModal, setMethodModal] = useState(null) // { type, code } | null

    useEffect(() => {
        if (authLoading) return
        if (!isAuthenticated) return

        // Havale/EFT admin panelden kapatılmışsa 'paytr' dışında hiçbir şey
        // dönmez ve satın alma akışı eskisi gibi doğrudan PayTR'a gider —
        // bu istek sessizce başarısız olsa bile (network vb.) varsayılan
        // ["paytr"] ile aynı davranış korunur.
        api.get("/payment-methods")
            .then(res => setAvailableMethods(res.data.data || ["paytr"]))
            .catch(() => {})
    }, [authLoading, isAuthenticated])

    useEffect(() => {
        if (authLoading) return
        if (!isAuthenticated) { navigate("/"); return }

        // Promise.all yerine allSettled kullanılıyor — üç istekten biri
        // (ör. tablolar henüz migrate edilmemişse /subscription 500 dönebilir)
        // patlarsa diğer ikisinin sonucu kaybolmasın, sayfa tamamen boş
        // kalmasın ve kullanıcı en azından hangi isteğin başarısız olduğunu
        // görebilsin.
        Promise.allSettled([
            api.get("/subscription/plans"),
            api.get("/credit-packs/plans"),
            api.get("/subscription"),
        ]).then(([plansRes, packsRes, subRes]) => {
            if (plansRes.status === "fulfilled") setSubscriptionPlans(plansRes.value.data.plans || [])
            if (packsRes.status === "fulfilled") setCreditPacks(packsRes.value.data.plans || [])
            if (subRes.status === "fulfilled") setCurrentSubscription(subRes.value.data.subscription || null)

            const failed = [plansRes, packsRes, subRes].find(r => r.status === "rejected")
            if (failed) {
                const msg = failed.reason?.response?.data?.message
                    || `Planlar yüklenirken bir hata oluştu (${failed.reason?.response?.status || "bağlantı hatası"}).`
                setLoadError(msg)
                toast({ message: msg, type: "error" })
            }
        }).finally(() => setLoading(false))
    }, [authLoading, isAuthenticated])

    const handleBuy = async (type, code) => {
        setBuyingCode(code)
        try {
            const endpoint = type === "subscription" ? "/subscription/checkout" : "/credit-packs/checkout"
            const res = await api.post(endpoint, { plan_code: code })
            navigate("/odeme/checkout", {
                state: {
                    iframeUrl:  res.data.iframe_url,
                    paymentId:  res.data.payment_id,
                    returnTo:   "/abonelik",
                },
            })
        } catch (err) {
            toast({ message: err?.response?.data?.message || "Ödeme başlatılamadı.", type: "error" })
        } finally {
            setBuyingCode(null)
        }
    }

    return (
        <div className="min-h-screen bg-gray-200 font-sans text-gray-800 flex flex-col">
            <Header />

            <main className="max-w-[1200px] mx-auto w-full px-4 py-6 flex-1">

                {/* Breadcrumb + başlık — tam genişlik */}
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 mb-2">
                    <Link to="/dashboard" className="hover:text-purple-700 transition-colors">Panelim</Link>
                    <ChevronRight size={10} />
                    <span className="text-gray-700">Abonelik & Kontör</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div>
                        <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-full mb-2">
                            <ShieldCheck size={9} /> Güvenli ödeme — PayTR
                        </span>
                        <h1 className="text-xl font-bold text-gray-800">Abonelik & Kontör Paketleri</h1>
                        <p className="text-gray-400 text-xs font-medium mt-0.5">
                            {isAgent
                                ? "Portföyünüzü büyütmek için aylık abonelik paketlerinden birini seçin."
                                : "Teklif verme hakkı satın almak için kontör paketlerinden birini seçin."}
                        </p>
                    </div>
                </div>

                {loadError && !loading && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-sm p-4 text-xs font-semibold text-red-700">
                        {loadError}
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-64 bg-white border border-gray-200 rounded-sm animate-pulse" />)}
                    </div>
                ) : (
                    <>
                        {/* ── UZMAN ABONELİK PAKETLERİ ── */}
                        {isAgent && (
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-3">
                                    <Layers size={14} className="text-purple-600" />
                                    <h2 className="text-sm font-bold text-gray-800">Uzman Abonelik Paketleri</h2>
                                </div>

                                {currentSubscription?.active_subscription && (
                                    <div className="mb-4 bg-white border border-purple-200 rounded-sm shadow-sm p-4 flex items-center justify-between flex-wrap gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-9 h-9 bg-purple-50 border border-purple-100 rounded flex items-center justify-center text-purple-600">
                                                <Check size={16} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-800">
                                                    Aktif Paket: {currentSubscription.active_subscription.product_name}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                                                    Bitiş: {currentSubscription.active_subscription.ends_at} · Portföy:{" "}
                                                    {currentSubscription.active_subscription.offer_quota === null
                                                        ? "Sınırsız teklif"
                                                        : `${currentSubscription.active_subscription.offers_remaining} teklif hakkı kaldı`}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {subscriptionPlans.length === 0 && !loadError && (
                                    <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-6 text-center">
                                        <p className="text-xs font-bold text-gray-500">Şu anda satın alınabilir bir abonelik paketi bulunmuyor.</p>
                                        <p className="text-[10px] text-gray-400 font-medium mt-1">
                                            (Admin panelden Ödeme & Abonelik → Ödenebilir Ürünler'de aktif paket tanımlı olduğundan emin olun.)
                                        </p>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {subscriptionPlans.map((plan, i) => {
                                        const palette = PLAN_PALETTE[i % PLAN_PALETTE.length]
                                        const isCurrent = currentSubscription?.plan_code === plan.code
                                        return (
                                            <div key={plan.code}
                                                 className={`bg-white border rounded-sm shadow-sm overflow-hidden flex flex-col ${palette.border}`}>
                                                <div className="h-[3px]" style={{ background: palette.accent }} />
                                                <div className="p-5 flex-1 flex flex-col">
                                                    <div className={`w-10 h-10 rounded flex items-center justify-center mb-3 ${palette.bg} ${palette.text}`}>
                                                        <Package size={18} />
                                                    </div>
                                                    <p className="text-sm font-bold text-gray-800">{plan.name}</p>
                                                    <div className="flex items-baseline gap-1 mt-2 mb-3">
                                                        <span className="text-2xl font-bold text-gray-800">{formatPrice(plan.price)} ₺</span>
                                                        <span className="text-[11px] text-gray-400 font-bold">/ay</span>
                                                    </div>
                                                    <ul className="space-y-2 mb-5 flex-1">
                                                        <li className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                                                            <Check size={13} className="text-green-600 flex-shrink-0" />
                                                            {plan.portfolio_limit === "Sınırsız" ? "Sınırsız portföy oluşturma" : `${plan.portfolio_limit} portföy oluşturma & yönetme`}
                                                        </li>
                                                        <li className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                                                            <Check size={13} className="text-green-600 flex-shrink-0" />
                                                            {plan.offer_quota === "Sınırsız" ? "Sınırsız teklif verme" : `Ayda ${plan.offer_quota} teklif hakkı`}
                                                        </li>
                                                        <li className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                                                            <Check size={13} className="text-green-600 flex-shrink-0" />
                                                            30 gün geçerlilik, istediğiniz zaman iptal
                                                        </li>
                                                    </ul>
                                                    <button
                                                        onClick={() => availableMethods.includes("havale_eft")
                                                            ? setMethodModal({ type: "subscription", code: plan.code })
                                                            : handleBuy("subscription", plan.code)}
                                                        disabled={buyingCode === plan.code || isCurrent}
                                                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                                                            isCurrent
                                                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                                : "text-white hover:opacity-90 shadow-sm"
                                                        }`}
                                                        style={!isCurrent ? { background: palette.accent } : undefined}
                                                    >
                                                        {buyingCode === plan.code
                                                            ? <><Loader2 size={13} className="animate-spin" /> Yönlendiriliyor...</>
                                                            : isCurrent
                                                                ? "Mevcut Paketiniz"
                                                                : <><CreditCard size={13} /> Abone Ol</>}
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ── BİREYSEL KONTÖR PAKETLERİ ── */}
                        {!isAgent && (
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-3">
                                    <Coins size={14} className="text-amber-600" />
                                    <h2 className="text-sm font-bold text-gray-800">Kontör Paketleri</h2>
                                </div>

                                {currentSubscription && (
                                    <div className="mb-4 bg-white border border-amber-200 rounded-sm shadow-sm p-4 flex items-center gap-2.5">
                                        <div className="w-9 h-9 bg-amber-50 border border-amber-100 rounded flex items-center justify-center text-amber-600">
                                            <Coins size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-800">
                                                Mevcut Bakiyeniz: {currentSubscription.credit_balance ?? 0} kontör
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                                                1 kontör = 1 teklif verme hakkı
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {creditPacks.length === 0 && !loadError && (
                                    <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-6 text-center">
                                        <p className="text-xs font-bold text-gray-500">Şu anda satın alınabilir bir kontör paketi bulunmuyor.</p>
                                        <p className="text-[10px] text-gray-400 font-medium mt-1">
                                            (Admin panelden Ödeme & Abonelik → Ödenebilir Ürünler'de aktif paket tanımlı olduğundan emin olun.)
                                        </p>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {creditPacks.map((pack, i) => {
                                        const palette = PLAN_PALETTE[i % PLAN_PALETTE.length]
                                        const perCredit = pack.price / pack.credit_amount
                                        return (
                                            <div key={pack.code}
                                                 className={`bg-white border rounded-sm shadow-sm overflow-hidden flex flex-col ${palette.border}`}>
                                                <div className="h-[3px]" style={{ background: palette.accent }} />
                                                <div className="p-5 flex-1 flex flex-col text-center">
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 mx-auto ${palette.bg} ${palette.text}`}>
                                                        <Zap size={20} />
                                                    </div>
                                                    <p className="text-2xl font-bold text-gray-800">{pack.credit_amount}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Kontör</p>
                                                    <div className="flex items-baseline justify-center gap-1 mb-1">
                                                        <span className="text-lg font-bold text-gray-800">{formatPrice(pack.price)} ₺</span>
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 font-medium mb-5">
                                                        ({formatPrice(perCredit.toFixed(2))} ₺ / kontör)
                                                    </p>
                                                    <button
                                                        onClick={() => availableMethods.includes("havale_eft")
                                                            ? setMethodModal({ type: "credit_pack", code: pack.code })
                                                            : handleBuy("credit_pack", pack.code)}
                                                        disabled={buyingCode === pack.code}
                                                        className="mt-auto w-full flex items-center justify-center gap-2 py-2.5 rounded text-xs font-bold uppercase tracking-wider text-white hover:opacity-90 transition-all shadow-sm"
                                                        style={{ background: palette.accent }}
                                                    >
                                                        {buyingCode === pack.code
                                                            ? <><Loader2 size={13} className="animate-spin" /> Yönlendiriliyor...</>
                                                            : <><CreditCard size={13} /> Satın Al</>}
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-4 flex items-start gap-3">
                            <div className="w-9 h-9 bg-purple-50 border border-purple-100 rounded flex items-center justify-center text-purple-600 flex-shrink-0">
                                <ShieldCheck size={16} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-800 mb-1">Güvenli Ödeme</p>
                                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                                    Ödemeleriniz PayTR güvenli ödeme altyapısı üzerinden, 3D Secure ile korunarak işlenir.
                                    Kart bilgileriniz bizim sunucularımızda tutulmaz.
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </main>

            {methodModal && (
                <PaymentMethodModal
                    type={methodModal.type}
                    code={methodModal.code}
                    onClose={() => setMethodModal(null)}
                    onSelectPaytr={() => {
                        const { type, code } = methodModal
                        setMethodModal(null)
                        handleBuy(type, code)
                    }}
                />
            )}
        </div>
    )
}
