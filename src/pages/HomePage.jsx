import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useTurkiyeLocation } from "@/hooks/useTurkiyeLocation"
import { useAuth } from "@/store/AuthContext"
import api from "@/lib/axios"
import echo from "@/lib/echo"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import {
    Search,
    Car, Wrench,
    ChevronRight, MapPin, Building2, Laptop,
    Filter, ShieldCheck, Clock, MessageSquare,
    Tag, ChevronDown, Lock,
    Home, Briefcase, ShoppingBag, Smartphone, Cpu,
} from 'lucide-react';

// Kategori ikonları Filament admin panelinde serbest metin olarak
// (kebab-case lucide-react ikon adı, örn. "building-2") giriliyor.
// Bütün lucide-react kütüphanesini import etmemek için (bundle boyutu),
// bilinen/olası kategori ikonları burada elle eşleniyor — eşleşme
// bulunamazsa ikon basitçe gösterilmez.
const CATEGORY_ICON_MAP = {
    "building-2": Building2,
    "car": Car,
    "laptop": Laptop,
    "home": Home,
    "briefcase": Briefcase,
    "shopping-bag": ShoppingBag,
    "smartphone": Smartphone,
    "cpu": Cpu,
    "tag": Tag,
    "wrench": Wrench,
};

// "Almak İstiyorum" / "Satmak İstiyorum" altında açılan yatay kategori şeridi.
// amac: "buy" → talep (demand) oluşturma sayfalarına götürür.
// amac: "sell" → portföy ekleme sayfalarına götürür (giriş yoksa register'a).
const ACTION_CATEGORIES = [
    { id: "gayrimenkul", name: "Gayrimenkul", icon: Building2, buyPath: "/demands/create/realestate", sellPath: "/portfolio/realestate/add" },
    { id: "vasita", name: "Vasıta", icon: Car, buyPath: "/demands/create/vehicle", sellPath: "/portfolio/vehicle/add" },
    { id: "elektronik", name: "Elektronik", icon: Laptop, comingSoon: true },
];

// ════════════════════════════════════════════════════════════════
// GEÇİCİ TEST VERİSİ — canlı izleme animasyonlarını (giriş/kum tanesi
// çıkışı) gerçek backend/Reverb trafiği olmadan görsel doğrulamak için.
// Onaylandıktan sonra bu diziyi ve HomePage() içindeki "GEÇİCİ TEST
// BLOĞU" başlıklı useEffect'i TAMAMEN SİL — gerçek veri zaten yukarıdaki
// Reverb dinleyicisinden (handlePublished/handleStatusChanged) geliyor.
// ════════════════════════════════════════════════════════════════
const hoursFromNow = (h) => new Date(Date.now() + h * 3600 * 1000).toISOString();
const DEMO_FAKE_DEMANDS = [
    { id: 900001, title: "İstanbul Kadıköy'de 2+1 kiralık daire arıyorum", district: null, features: { il: "İstanbul", ilce: "Kadıköy" }, max_budget: "25000", expires_at: hoursFromNow(18), category: { id: 1, name: "Gayrimenkul", slug: "gayrimenkul", icon: "building-2" }, offers_count: 0 },
    { id: 900002, title: "2020 model dizel otomatik SUV arıyorum", district: null, features: { il: "Ankara", ilce: "Çankaya" }, max_budget: "1200000", expires_at: hoursFromNow(48), category: { id: 2, name: "Vasıta", slug: "vasita", icon: "car" }, offers_count: 0 },
    { id: 900003, title: "Bursa Nilüfer'de satılık villa arıyorum", district: null, features: { il: "Bursa", ilce: "Nilüfer" }, max_budget: "8000000", expires_at: hoursFromNow(72), category: { id: 1, name: "Gayrimenkul", slug: "gayrimenkul", icon: "building-2" }, offers_count: 0 },
    { id: 900004, title: "İkinci el elektrikli otomobil arıyorum", district: null, features: { il: "İzmir", ilce: "Bornova" }, max_budget: "900000", expires_at: hoursFromNow(24), category: { id: 2, name: "Vasıta", slug: "vasita", icon: "car" }, offers_count: 0 },
    { id: 900005, title: "Antalya Konyaaltı'nda yazlık kiralık ev arıyorum", district: null, features: { il: "Antalya", ilce: "Konyaaltı" }, max_budget: "40000", expires_at: hoursFromNow(12), category: { id: 1, name: "Gayrimenkul", slug: "gayrimenkul", icon: "building-2" }, offers_count: 0 },
    { id: 900006, title: "Manuel vites ekonomik hatchback arıyorum", district: null, features: { il: "Kocaeli", ilce: "İzmit" }, max_budget: "650000", expires_at: hoursFromNow(48), category: { id: 2, name: "Vasıta", slug: "vasita", icon: "car" }, offers_count: 0 },
    { id: 900007, title: "Ankara Çankaya'da ofis olarak kullanılacak dükkan arıyorum", district: null, features: { il: "Ankara", ilce: "Çankaya" }, max_budget: "30000", expires_at: hoursFromNow(24), category: { id: 1, name: "Gayrimenkul", slug: "gayrimenkul", icon: "building-2" }, offers_count: 0 },
    { id: 900008, title: "Kamyonet / pick-up ikinci el arıyorum", district: null, features: { il: "Gaziantep", ilce: "Şahinbey" }, max_budget: "1500000", expires_at: hoursFromNow(96), category: { id: 2, name: "Vasıta", slug: "vasita", icon: "car" }, offers_count: 0 },
    { id: 900009, title: "Trabzon'da deniz manzaralı satılık daire arıyorum", district: null, features: { il: "Trabzon", ilce: "Ortahisar" }, max_budget: "5500000", expires_at: hoursFromNow(120), category: { id: 1, name: "Gayrimenkul", slug: "gayrimenkul", icon: "building-2" }, offers_count: 0 },
    { id: 900010, title: "Motosiklet 125cc ikinci el arıyorum", district: null, features: { il: "Eskişehir", ilce: "Tepebaşı" }, max_budget: "120000", expires_at: hoursFromNow(6), category: { id: 2, name: "Vasıta", slug: "vasita", icon: "car" }, offers_count: 0 },
];

// Talep (demand) öğesinden ekranda gösterilecek alanları türetir.
// Portföyden farklı olarak demand'ların fotoğrafı ve sabit fiyatı yok —
// buyer'ın belirttiği maksimum bütçe ve konum gösterilir.
function deriveDemandDisplay(d) {
    const isGayr = d.category?.slug === "gayrimenkul"
    const f = d.features || {}
    const title = d.title || "Talep"
    const location = [f.ilce, f.il].filter(Boolean).join(", ") || d.district || "Tüm Türkiye"
    const category = d.category?.name || (isGayr ? "Gayrimenkul" : "Vasıta")
    return { title, location, category, isGayr }
}

// Talep süresine (expires_at) göre canlı geri sayım — gün/saat/dakika/
// saniye olarak her saniye güncellenir. Süre yoksa/dolmuşsa uygun mesaj.
function DemandCountdown({ expiresAt }) {
    const [now, setNow] = useState(() => Date.now())

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(id)
    }, [])

    if (!expiresAt) {
        return <span className="text-[9px] text-gray-300 font-medium">Süresiz</span>
    }

    const diff = Math.max(0, new Date(expiresAt).getTime() - now)
    if (diff <= 0) {
        return <span className="text-[9px] text-gray-400 font-medium">Süresi doldu</span>
    }

    const totalSeconds = Math.floor(diff / 1000)
    const days = Math.floor(totalSeconds / 86400)
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    const pad = (n) => String(n).padStart(2, "0")

    return (
        <span className="text-[10px] font-semibold text-orange-600 flex items-center gap-1 tabular-nums whitespace-nowrap">
            <Clock size={10} className="text-orange-400 flex-shrink-0" />
            {days > 0 && `${days}g `}{pad(hours)}:{pad(minutes)}:{pad(seconds)}
        </span>
    )
}

// --- YARDIMCI BİLEŞEN: Katlanabilir (Accordion) Kategori Menüsü ---
// `cat` backend'deki /api/categories'ten geliyor (bkz. DemandController::
// categories()) — alt kategoriler `children` alanında, ikon ise
// CATEGORY_ICON_MAP ile eşleşen bir kebab-case string (`cat.icon`).
const CategoryItem = ({ cat, level = 0 }) => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const children = cat.children || [];
    const hasChildren = children.length > 0;
    const Icon = CATEGORY_ICON_MAP[cat.icon] || null;

    // YAPRAK kategoriye tıklanınca: kategorinin admin panelinde seçilen
    // "Kullanılacak Form"a (form_component) göre doğru talep oluşturma
    // sayfasına götürür. Boşsa (jenerik) form_schema'ya göre dinamik alan
    // render eden GenericDemandPage'e ("/demands/create/:categorySlug")
    // düşer — bkz. App.jsx.
    const handleClick = () => {
        if (hasChildren) { setIsOpen(!isOpen); return; }
        if (cat.form_component === "vehicle") { navigate("/demands/create/vehicle"); return; }
        if (cat.form_component === "real_estate") { navigate("/demands/create/realestate"); return; }
        navigate(`/demands/create/${cat.slug}`);
    };

    return (
        <li className={`${level === 0 ? 'border-b border-gray-100' : 'border-b border-dotted border-gray-300'}`}>
            <div
                onClick={handleClick}
                style={{ paddingLeft: `${level * 16 + 12}px`, paddingRight: '12px' }}
                className="group flex flex-col justify-center py-2.5 hover:bg-purple-50 transition-colors cursor-pointer"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        {Icon && <Icon size={level === 0 ? 16 : 14} className={`${level === 0 ? 'text-purple-500' : 'text-gray-400'} group-hover:text-purple-700 transition-colors`} />}
                        <span className={`font-medium text-gray-700 group-hover:text-purple-800 ${level === 0 ? 'text-[13px]' : 'text-[12px]'}`}>{cat.name}</span>
                    </div>
                    {hasChildren && <ChevronRight size={14} className={`text-gray-400 group-hover:text-purple-500 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />}
                </div>
            </div>

            {hasChildren && isOpen && (
                <ul className="bg-gray-100 flex flex-col">
                    {children.map(subCat => (
                        <CategoryItem key={subCat.id} cat={subCat} level={level + 1} />
                    ))}
                </ul>
            )}
        </li>
    );
};

export default function HomePage() {
    const navigate = useNavigate();
    const loc = useTurkiyeLocation();
    const { isAuthenticated } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Sol menüdeki "Almak İstiyorum" kategori ağacı — veritabanından
    // (ana + alt kategoriler, 4 seviyeye kadar). Backend zaten yalnızca
    // is_active kategorileri döndürüyor — bkz. DemandController::categories().
    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);

    useEffect(() => {
        api.get("/categories")
            .then(r => setCategories(r.data || []))
            .catch(() => setCategories([]))
            .finally(() => setCategoriesLoading(false));
    }, []);

    // ── YAPIM AŞAMASI GİRİŞ EKRANI ──────────────────────────────────────
    // Site henüz yayına hazır olmadığı için anasayfa, SMS OTP ekranına
    // benzer bir erişim kodu girişiyle korunuyor. Kod bir kere doğru
    // girilince sessionStorage'a yazılıyor, aynı sekme/oturumda tekrar
    // sorulmuyor. Sabit kod — gerçek bir OTP/SMS akışı değil.
    const GATE_CODE = "456123";
    const [siteUnlocked, setSiteUnlocked] = useState(
        () => sessionStorage.getItem("toffera_site_unlocked") === "1"
    );
    const [gateOtp, setGateOtp] = useState(["", "", "", "", "", ""]);
    const [gateError, setGateError] = useState(false);

    const checkGateCode = (code) => {
        if (code === GATE_CODE) {
            sessionStorage.setItem("toffera_site_unlocked", "1");
            setSiteUnlocked(true);
        } else {
            setGateError(true);
            setTimeout(() => {
                setGateOtp(["", "", "", "", "", ""]);
                document.getElementById("gate-otp-0")?.focus();
            }, 400);
        }
    };

    const handleGateOtpChange = (i, val) => {
        if (!/^\d?$/.test(val)) return;
        const next = [...gateOtp]; next[i] = val; setGateOtp(next);
        setGateError(false);
        if (val && i < 5) document.getElementById(`gate-otp-${i + 1}`)?.focus();
        if (val && i === 5) {
            const code = next.join("");
            if (code.length === 6) checkGateCode(code);
        }
    };

    const handleGateOtpKeyDown = (i, e) => {
        if (e.key === "Backspace" && !gateOtp[i] && i > 0)
            document.getElementById(`gate-otp-${i - 1}`)?.focus();
    };

    // Anasayfa artık SADECE talepleri listeliyor (vitrin/portföy vitrini
    // /vitrin sayfasına taşındı). Backend zaten yalnızca onaylı
    // (moderation_status=approved) talepleri döndürüyor — bkz.
    // DemandController::index(). Üstteki Kategori/İl/İlçe/Mahalle filtresi
    // buraya bağlı; ilk açılışta filtre boş → tüm Türkiye geneli listelenir.
    const [demands, setDemands] = useState([]);
    const [demandsLoading, setDemandsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState("");

    const fetchDemands = (params = {}) => {
        setDemandsLoading(true);
        api.get("/demands", { params: { per_page: 20, ...params } })
            .then(r => setDemands(r.data.data || r.data || []))
            .catch(() => setDemands([]))
            .finally(() => setDemandsLoading(false));
    };

    // İlk açılış: hiçbir filtre yok → tüm Türkiye geneli.
    useEffect(() => {
        fetchDemands();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFilterClick = () => {
        const params = {};
        if (selectedCategory) params.category = selectedCategory;
        if (loc.selectedProvince?.name) params.il = loc.selectedProvince.name;
        if (loc.selectedDistrict?.name) params.ilce = loc.selectedDistrict.name;
        if (loc.selectedNeighborhoods?.length) params.mahalle = loc.selectedNeighborhoods.map(n => n.name);
        fetchDemands(params);
    };

    // ── CANLI İZLEME (Reverb/Echo) ──────────────────────────────────
    // Talep kabul/iptal edildiğinde satırın "kum tanesi gibi dağılması"
    // için: satır DOM referansları (id -> li elemanı) ve listeyi saran
    // konteynerin referansı. Parçacıklar konteynere absolute eklenip Web
    // Animations API ile savrulup kayboluyor, animasyon bitince kendini
    // temizliyor — React state'ine hiç girmiyor.
    const rowRefs = useRef({});
    const listRef = useRef(null);

    const spawnDustParticles = (rowEl) => {
        const container = listRef.current;
        if (!container || !rowEl) return;
        const rect = rowEl.getBoundingClientRect();
        const crect = container.getBoundingClientRect();
        const count = 24;
        for (let i = 0; i < count; i++) {
            const p = document.createElement("span");
            p.style.position = "absolute";
            p.style.width = "3px";
            p.style.height = "3px";
            p.style.borderRadius = "50%";
            p.style.background = "#9ca3af";
            p.style.pointerEvents = "none";
            p.style.zIndex = "5";
            const x = rect.left - crect.left + Math.random() * rect.width;
            const y = rect.top - crect.top + Math.random() * rect.height;
            p.style.left = `${x}px`;
            p.style.top = `${y}px`;
            container.appendChild(p);
            const dx = (Math.random() - 0.5) * 90;
            const dy = (Math.random() - 0.5) * 70 - 20;
            const anim = p.animate(
                [
                    { transform: "translate(0,0)", opacity: 1 },
                    { transform: `translate(${dx}px,${dy}px)`, opacity: 0 },
                ],
                { duration: 550 + Math.random() * 250, easing: "ease-out" }
            );
            anim.onfinish = () => p.remove();
        }
    };

    // Aktif filtreleri, WebSocket olayı geldiği anda okuyabilmek için ref'te
    // tutuyoruz — aksi halde tek seferlik effect'in closure'ı bayatlar.
    const selectedCategoryRef = useRef(selectedCategory);
    useEffect(() => { selectedCategoryRef.current = selectedCategory; }, [selectedCategory]);
    const provinceRef = useRef(loc.selectedProvince);
    useEffect(() => { provinceRef.current = loc.selectedProvince; }, [loc.selectedProvince]);
    const districtRef = useRef(loc.selectedDistrict);
    useEffect(() => { districtRef.current = loc.selectedDistrict; }, [loc.selectedDistrict]);

    // Herkese açık 'demands' kanalı — giriş yapılmış olsun ya da olmasın
    // (bkz. backend routes/channels.php: bu kanal public, auth gerekmiyor).
    // 3 olay: yeni talep onaylandı / durumu değişti (kabul/iptal) / bir
    // talebe onaylı teklif geldi. Sadece görsel state güncelliyor, veri
    // kaynağı yine DB — WebSocket burada da salt tetikleyici.
    // handlePublished/handleStatusChanged/handleOfferCount component
    // seviyesinde tanımlı — hem gerçek Reverb event'leri hem de aşağıdaki
    // GEÇİCİ TEST BLOĞU aynı fonksiyonları çağırıyor, animasyon mantığı
    // tek yerde kalsın diye.
    const handlePublished = useCallback((data) => {
        const catOk   = !selectedCategoryRef.current || data.category?.slug === selectedCategoryRef.current;
        const ilOk    = !provinceRef.current || data.features?.il === provinceRef.current.name;
        const ilceOk  = !districtRef.current || data.features?.ilce === districtRef.current.name;
        if (!catOk || !ilOk || !ilceOk) return;

        setDemands(prev => {
            if (prev.some(d => d.id === data.id)) return prev;
            return [{ ...data, _justAdded: true }, ...prev];
        });
        setTimeout(() => {
            setDemands(prev => prev.map(d => d.id === data.id ? { ...d, _justAdded: false } : d));
        }, 1200);
    }, []);

    const handleStatusChanged = useCallback((data) => {
        if (data.status === "active") return; // hâlâ aktifse listede kalmalı
        spawnDustParticles(rowRefs.current[data.id]);
        setDemands(prev => prev.map(d => d.id === data.id ? { ...d, _removing: true } : d));
        setTimeout(() => {
            setDemands(prev => prev.filter(d => d.id !== data.id));
            delete rowRefs.current[data.id];
        }, 550);
    }, []);

    const handleOfferCount = useCallback((data) => {
        setDemands(prev => prev.map(d => d.id === data.id ? { ...d, offers_count: data.offers_count, _bump: true } : d));
        setTimeout(() => {
            setDemands(prev => prev.map(d => d.id === data.id ? { ...d, _bump: false } : d));
        }, 700);
    }, []);

    useEffect(() => {
        const channel = echo.channel("demands");

        channel.listen(".demand.published", handlePublished);
        channel.listen(".demand.status.changed", handleStatusChanged);
        channel.listen(".demand.offer.count.changed", handleOfferCount);

        return () => {
            channel.stopListening(".demand.published", handlePublished);
            channel.stopListening(".demand.status.changed", handleStatusChanged);
            channel.stopListening(".demand.offer.count.changed", handleOfferCount);
        };
    }, [handlePublished, handleStatusChanged, handleOfferCount]);

    // ════════════════════════════════════════════════════════════════
    // GEÇİCİ TEST BLOĞU — animasyonları gerçek backend/Reverb trafiği
    // olmadan görsel doğrulamak için DEMO_FAKE_DEMANDS'ı sahte "yeni
    // talep" / "kabul edildi" event'i gibi enjekte eder. 10 talep ~9sn
    // arayla girer (~1.5 dakikaya yayılı), ilk 6 tanesi girişten ~14sn
    // sonra kum tanesi animasyonuyla kaldırılır (kabul edilmiş gibi).
    // ONAYLANDIKTAN SONRA BU useEffect'İ VE DEMO_FAKE_DEMANDS DİZİSİNİ
    // TAMAMEN SİL — gerçek veri zaten yukarıdaki Reverb dinleyicisinden
    // geliyor.
    // ════════════════════════════════════════════════════════════════
    useEffect(() => {
        const timers = [];
        DEMO_FAKE_DEMANDS.forEach((fake, i) => {
            const arriveAt = (i + 1) * 9000;
            timers.push(setTimeout(() => handlePublished(fake), arriveAt));

            if (i < 6) {
                const removeAt = arriveAt + 14000;
                timers.push(setTimeout(() => handleStatusChanged({ id: fake.id, status: "accepted" }), removeAt));
            }
        });
        return () => timers.forEach(clearTimeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // "Almak İstiyorum" / "Satmak İstiyorum" altında açılan kategori şeridi:
    // null | "buy" | "sell"
    const [actionMenu, setActionMenu] = useState(null);
    const actionMenuRef = useRef(null);

    useEffect(() => {
        function handleClickOutsideAction(event) {
            if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
                setActionMenu(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutsideAction);
        return () => document.removeEventListener("mousedown", handleClickOutsideAction);
    }, []);

    const handleActionCategoryClick = (cat) => {
        if (cat.comingSoon) return;
        if (actionMenu === "buy") {
            navigate(cat.buyPath);
        } else if (actionMenu === "sell") {
            navigate(isAuthenticated ? cat.sellPath : "/register");
        }
        setActionMenu(null);
    };

    // Animasyon State'i
    const [progressState, setProgressState] = useState(false);

    // --- Filtre State'leri (İl/İlçe artık useTurkiyeLocation'dan geliyor; Mahalle çoklu seçim panel state'i) ---
    const [isMahalleOpen, setIsMahalleOpen] = useState(false);
    const mahalleRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (mahalleRef.current && !mahalleRef.current.contains(event.target)) {
                setIsMahalleOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const initialTimer = setTimeout(() => setProgressState(true), 100);
        const interval = setInterval(() => {
            setProgressState(false);
            setTimeout(() => setProgressState(true), 100);
        }, 5000);
        return () => { clearTimeout(initialTimer); clearInterval(interval); };
    }, []);

    // Site henüz yapım aşamasında — erişim kodu doğrulanmadan asıl
    // anasayfa içeriği hiç render edilmiyor.
    if (!siteUnlocked) {
        return (
            <div className="min-h-screen bg-gray-200 font-sans text-gray-800 flex items-center justify-center p-4">
                <div className={`w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-xl p-8 flex flex-col items-center text-center transition-transform ${gateError ? 'animate-shake' : ''}`}>
                    <style>{`
                        @keyframes gateShake { 10%, 90% { transform: translateX(-1px); } 20%, 80% { transform: translateX(2px); } 30%, 50%, 70% { transform: translateX(-4px); } 40%, 60% { transform: translateX(4px); } }
                        .animate-shake { animation: gateShake 0.4s; }
                    `}</style>

                    <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                        <Wrench size={26} className="text-purple-600" />
                    </div>

                    <h1 className="text-lg font-bold text-gray-800 mb-1">Site yapım aşamasında</h1>
                    <p className="text-sm text-gray-500 mb-6">
                        Teklif Meydanı şu anda hazırlanıyor. Devam etmek için erişim kodunu girin.
                    </p>

                    <div className="flex gap-2 justify-center mb-4">
                        {gateOtp.map((digit, i) => (
                            <input key={i} id={`gate-otp-${i}`}
                                   type="text" inputMode="numeric" maxLength={1} value={digit}
                                   onChange={e => handleGateOtpChange(i, e.target.value)}
                                   onKeyDown={e => handleGateOtpKeyDown(i, e)}
                                   autoFocus={i === 0}
                                   className={`w-11 h-12 text-center text-xl font-extrabold text-gray-800 bg-white border-2 rounded-xl focus:ring-4 outline-none transition-all ${
                                       gateError
                                           ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                                           : 'border-gray-200 focus:border-purple-500 focus:ring-purple-500/20'
                                   }`}
                            />
                        ))}
                    </div>

                    {gateError && (
                        <p className="text-xs text-red-500 mb-4 flex items-center gap-1">
                            <Lock size={11} /> Kod hatalı, tekrar deneyin.
                        </p>
                    )}

                    <button
                        onClick={() => checkGateCode(gateOtp.join(""))}
                        disabled={gateOtp.some(d => !d)}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-purple-500/30 transform hover:-translate-y-0.5"
                    >
                        Giriş Yap
                    </button>

                    <p className="text-[10px] text-gray-300 mt-6 flex items-center gap-1">
                        <ShieldCheck size={11} /> Teklif Meydanı © {new Date().getFullYear()}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-200 font-sans text-gray-800 flex flex-col">

            {/* Özel Animasyonlar için Style Bloğu */}
            <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        @keyframes demandSlideIn {
          0%   { opacity: 0; transform: translateY(-10px); background-color: rgba(79,70,229,0.08); }
          60%  { opacity: 1; transform: translateY(0); }
          100% { opacity: 1; transform: translateY(0); background-color: transparent; }
        }
        .animate-demand-in { animation: demandSlideIn 1.1s ease-out; }

        @keyframes demandBump {
          0%   { transform: scale(1); }
          35%  { transform: scale(1.3); color: #4f46e5; }
          100% { transform: scale(1); }
        }
        .animate-demand-bump { animation: demandBump 0.6s ease-out; }
      `}</style>

            <Header
                showCategoryMenuToggle
                isMobileMenuOpen={isMobileMenuOpen}
                onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />

            {/* ANA İÇERİK - HOME VİEW */}
            <div className="flex flex-col flex-1 w-full">

                <main className="max-w-[1200px] mx-auto w-full px-4 py-6 flex flex-col md:flex-row gap-6 flex-1">

                    {/* SOL MENÜ */}
                    <aside className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block w-full md:w-64 flex-shrink-0 bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden h-max`}>
                        <div className="bg-gray-100 p-3 border-b border-gray-200">
                            <h2 className="font-bold text-gray-700 text-sm">Almak İstiyorum</h2>
                        </div>
                        <ul className="flex flex-col">
                            {categoriesLoading ? (
                                [...Array(3)].map((_, i) => (
                                    <li key={i} className="h-10 bg-gray-50 animate-pulse border-b border-gray-100" />
                                ))
                            ) : categories.length === 0 ? (
                                <li className="p-3 text-[11px] text-gray-400 text-center">Kategori bulunamadı</li>
                            ) : categories.map((cat) => (
                                <CategoryItem key={cat.id} cat={cat} />
                            ))}
                        </ul>
                    </aside>

                    {/* SAĞ İÇERİK */}
                    <section className="flex-1 w-full overflow-hidden">

                        {/* ÜST İSTATİSTİKLER VE HIZLI AKSİYONLAR */}
                        <div ref={actionMenuRef}>
                            <div className="mb-6 flex flex-wrap lg:flex-nowrap items-center justify-between gap-4 w-full">

                                {/* Sol Taraf: Dairesel İstatistikler */}
                                <div className="flex flex-wrap items-center justify-start gap-4 lg:gap-6">
                                    {/* Stat 1: Aktif İlan */}
                                    <div className="flex items-center gap-2">
                                        <div className="relative w-10 h-10">
                                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                <path className="text-gray-100 stroke-current" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                <path className="text-indigo-500 stroke-current transition-all duration-[1500ms] ease-out" strokeWidth="3" strokeDasharray={progressState ? "85, 100" : "0, 100"} fill="none" strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center font-bold text-[10px] text-indigo-700">1.2M</div>
                                        </div>
                                        <div className="text-[10px] font-bold text-gray-500 uppercase leading-[1.1]">Aktif<br/>İlan</div>
                                    </div>

                                    {/* Stat 2: Uzman Sayısı */}
                                    <div className="flex items-center gap-2">
                                        <div className="relative w-10 h-10">
                                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                <path className="text-gray-100 stroke-current" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                <path className="text-purple-500 stroke-current transition-all duration-[1500ms] ease-out" strokeWidth="3" strokeDasharray={progressState ? "65, 100" : "0, 100"} fill="none" strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center font-bold text-[10px] text-purple-700">4.5K</div>
                                        </div>
                                        <div className="text-[10px] font-bold text-gray-500 uppercase leading-[1.1]">Kayıtlı<br/>Uzman</div>
                                    </div>

                                    {/* Stat 3: Çözüm Süresi */}
                                    <div className="flex items-center gap-2">
                                        <div className="relative w-10 h-10">
                                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                <path className="text-gray-100 stroke-current" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                <path className="text-green-500 stroke-current transition-all duration-[1500ms] ease-out" strokeWidth="3" strokeDasharray={progressState ? "90, 100" : "0, 100"} fill="none" strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center font-bold text-[10px] text-green-700">24s</div>
                                        </div>
                                        <div className="text-[10px] font-bold text-gray-500 uppercase leading-[1.1]">Çözüm<br/>Süresi</div>
                                    </div>

                                    {/* Stat 4: Başarı Yüzdesi */}
                                    <div className="flex items-center gap-2">
                                        <div className="relative w-10 h-10">
                                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                <path className="text-gray-100 stroke-current" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                <path className="text-orange-500 stroke-current transition-all duration-[1500ms] ease-out" strokeWidth="3" strokeDasharray={progressState ? "98, 100" : "0, 100"} fill="none" strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center font-bold text-[10px] text-orange-700">%98</div>
                                        </div>
                                        <div className="text-[10px] font-bold text-gray-500 uppercase leading-[1.1]">Memnuniyet<br/>Oranı</div>
                                    </div>
                                </div>

                                {/* Sağ Taraf: Aksiyon Butonları */}
                                <div className="flex items-center gap-2 shrink-0 ml-auto mt-2 lg:mt-0">
                                    <button
                                        onClick={() => setActionMenu(m => m === "buy" ? null : "buy")}
                                        className={`bg-gradient-to-br from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 text-white shadow-sm hover:shadow transition-all rounded px-4 py-2 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 ${actionMenu === "buy" ? "ring-2 ring-indigo-300 ring-offset-1" : ""}`}
                                    >
                                        <Search size={16} className="text-indigo-100" />
                                        <span className="text-sm font-bold">Almak İstiyorum</span>
                                        <ChevronDown size={14} className={`text-indigo-100 transition-transform duration-200 ${actionMenu === "buy" ? "rotate-180" : ""}`} />
                                    </button>

                                    <button
                                        onClick={() => setActionMenu(m => m === "sell" ? null : "sell")}
                                        className={`bg-gradient-to-br from-purple-500 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-700 text-white shadow-sm hover:shadow transition-all rounded px-4 py-2 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 ${actionMenu === "sell" ? "ring-2 ring-fuchsia-300 ring-offset-1" : ""}`}
                                    >
                                        <Tag size={16} className="text-purple-100" />
                                        <span className="text-sm font-bold">Satmak İstiyorum</span>
                                        <ChevronDown size={14} className={`text-purple-100 transition-transform duration-200 ${actionMenu === "sell" ? "rotate-180" : ""}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Kategori Şeridi — Almak/Satmak butonlarından açılır, yatay scroll */}
                            <div
                                className={`overflow-hidden transition-all duration-300 ease-out ${actionMenu ? "max-h-32 opacity-100 mb-6" : "max-h-0 opacity-0 mb-0"}`}
                            >
                                <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-3">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                                        {actionMenu === "buy" ? "Hangi kategoride talep oluşturmak istersiniz?" : "Hangi kategoride ilan / portföy eklemek istersiniz?"}
                                    </p>
                                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                        {ACTION_CATEGORIES.map(cat => {
                                            const Icon = cat.icon
                                            return (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => handleActionCategoryClick(cat)}
                                                    disabled={cat.comingSoon}
                                                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded border transition-all whitespace-nowrap ${
                                                        cat.comingSoon
                                                            ? "bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed"
                                                            : actionMenu === "buy"
                                                                ? "bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100 hover:border-indigo-300"
                                                                : "bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100 hover:border-purple-300"
                                                    }`}
                                                >
                                                    <Icon size={16} className={cat.comingSoon ? "text-gray-300" : actionMenu === "buy" ? "text-indigo-600" : "text-purple-600"} />
                                                    <span className="text-xs font-bold">{cat.name}</span>
                                                    {cat.comingSoon && (
                                                        <span className="flex items-center gap-1 text-[9px] font-bold uppercase bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">
                                <Lock size={9} /> Yakında
                              </span>
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FİLTRE & ARAMA (Küçültülmüş Kompakt Tasarım) */}
                        <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-3 mb-[5px]">
                            <div className="flex flex-col lg:flex-row gap-3 items-end justify-between">

                                <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                    <div className="flex flex-col">
                                        <select
                                            value={selectedCategory}
                                            onChange={e => setSelectedCategory(e.target.value)}
                                            className="w-full p-1.5 border border-gray-200 rounded text-[11px] outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 bg-gray-50 hover:bg-white transition-colors cursor-pointer text-gray-700 h-[28px]">
                                            <option value="">Tüm Kategoriler</option>
                                            <option value="gayrimenkul">Gayrimenkul</option>
                                            <option value="vasita">Vasıta</option>
                                            <option value="elektronik">Elektronik</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col">
                                        <select
                                            value={loc.selectedProvince?.id || ""}
                                            onChange={e => {
                                                const p = loc.provinces.find(p => p.id === Number(e.target.value));
                                                loc.setSelectedProvince(p || null);
                                            }}
                                            className="w-full p-1.5 border border-gray-200 rounded text-[11px] outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 bg-gray-50 hover:bg-white transition-colors cursor-pointer text-gray-700 h-[28px]">
                                            <option value="">{loc.loadingProv ? "Yükleniyor..." : "Tüm İller"}</option>
                                            {loc.provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex flex-col">
                                        <select
                                            value={loc.selectedDistrict?.id || ""}
                                            disabled={!loc.selectedProvince}
                                            onChange={e => {
                                                const d = loc.districts.find(d => d.id === Number(e.target.value));
                                                loc.setSelectedDistrict(d || null);
                                            }}
                                            className="w-full p-1.5 border border-gray-200 rounded text-[11px] outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 bg-gray-50 hover:bg-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 h-[28px]">
                                            <option value="">{loc.loadingDist ? "Yükleniyor..." : "Tüm İlçeler"}</option>
                                            {loc.districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>

                                    {/* MAHALLE — çoklu seçim, gerçek API verisiyle */}
                                    <div className="flex flex-col relative" ref={mahalleRef}>
                                        <div
                                            onClick={() => loc.selectedDistrict && setIsMahalleOpen(!isMahalleOpen)}
                                            className={`w-full px-2 py-1.5 border border-gray-200 rounded text-[11px] outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 bg-gray-50 hover:bg-white transition-colors text-gray-700 flex justify-between items-center h-[28px] select-none ${
                                                loc.selectedDistrict ? "cursor-pointer" : "cursor-not-allowed opacity-40"
                                            }`}
                                        >
                      <span className="truncate pr-2 font-medium">
                        {loc.loadingNeigh ? "Yükleniyor..." :
                            loc.selectedNeighborhoods.length === 0 ? "Tüm Mahalleler" :
                                loc.selectedNeighborhoods.length === 1 ? loc.selectedNeighborhoods[0].name :
                                    `${loc.selectedNeighborhoods.length} Mahalle Seçili`}
                      </span>
                                            <ChevronDown size={12} className={`text-gray-400 transition-transform ${isMahalleOpen ? 'rotate-180' : ''}`} />
                                        </div>

                                        {isMahalleOpen && loc.selectedDistrict && (
                                            <div className="absolute top-[calc(100%+2px)] left-0 w-full bg-white border border-gray-200 rounded-sm shadow-xl z-[60] max-h-48 overflow-y-auto">
                                                {loc.neighborhoods.length === 0 ? (
                                                    <div className="px-2.5 py-3 text-[11px] text-gray-400 text-center">Mahalle bulunamadı.</div>
                                                ) : loc.neighborhoods.map(n => (
                                                    <label key={n.id} className="flex items-center gap-2.5 px-2.5 py-2 hover:bg-purple-50 cursor-pointer text-[11px] text-gray-700 border-b border-gray-50 last:border-0 transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            className="rounded-sm border-gray-300 w-3.5 h-3.5 cursor-pointer accent-purple-600"
                                                            checked={loc.selectedNeighborhoods.some(x => x.id === n.id)}
                                                            onChange={() => loc.toggleNeighborhood(n)}
                                                        />
                                                        <span className="truncate">{n.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex w-full lg:w-auto items-center justify-between lg:justify-end gap-2 mt-2 lg:mt-0">
                                    <button
                                        onClick={handleFilterClick}
                                        className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-1.5 rounded text-[11px] font-bold transition-all shadow-sm"
                                    >
                                        <Filter size={14} /> Filtrele
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* TALEPLER */}
                        <ul ref={listRef} className="flex flex-col relative">
                            {demandsLoading ? (
                                [...Array(6)].map((_, i) => (
                                    <li key={i} className="bg-white border border-gray-200 rounded-sm shadow-sm mb-[5px] h-16 animate-pulse" />
                                ))
                            ) : demands.length === 0 ? (
                                <li className="bg-white border border-gray-200 rounded-sm p-10 text-center">
                                    <p className="text-sm font-bold text-gray-400">Bu filtrelere uyan talep bulunamadı</p>
                                    <p className="text-xs text-gray-300 mt-1">Farklı bir il/ilçe ya da kategori deneyin</p>
                                </li>
                            ) : demands.map((d) => {
                                const { title, location, category, isGayr } = deriveDemandDisplay(d)
                                return (
                                    <li
                                        key={d.id}
                                        ref={el => { if (el) rowRefs.current[d.id] = el; else delete rowRefs.current[d.id]; }}
                                        onClick={() => navigate(`/market/${d.id}`)}
                                        className={`bg-white border border-gray-200 rounded-sm shadow-sm mb-[5px] flex items-center p-2 hover:bg-purple-50 transition-all duration-500 ease-in-out overflow-hidden group cursor-pointer gap-3 ${
                                            d._removing ? "opacity-0 max-h-0 !mb-0 !p-0 !border-0" : "max-h-[60px]"
                                        } ${d._justAdded ? "animate-demand-in" : ""}`}
                                    >
                                        {/* Kategori ikonu (talebin fotoğrafı yok) */}
                                        <div className="w-12 h-9 bg-gray-100 rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                                            {isGayr ? <Building2 size={14} className="text-gray-300" /> : <Car size={14} className="text-gray-300" />}
                                        </div>
                                        {/* Başlık, hemen altında lokasyon */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-[11.5px] font-medium text-gray-700 group-hover:text-purple-700 truncate">{title}</h3>
                                            <span className="text-gray-400 text-[9px] flex items-center mt-0.5"><MapPin size={9} className="mr-0.5 flex-shrink-0"/><span className="truncate">{location}</span></span>
                                        </div>
                                        {/* Kategori rozeti */}
                                        <div className="hidden sm:block flex-shrink-0"><span className="bg-gray-100 px-2 py-1 rounded text-[9px] text-gray-400 font-normal">{category}</span></div>
                                        {/* Canlı teklif sayısı */}
                                        <div className={`flex-shrink-0 flex items-center gap-1 text-[9px] text-gray-400 font-medium ${d._bump ? "animate-demand-bump" : ""}`}>
                                            <MessageSquare size={10} className="text-gray-300" /> {d.offers_count ?? 0}
                                        </div>
                                        {/* Geri sayım */}
                                        <div className="flex-shrink-0">
                                            <DemandCountdown expiresAt={d.expires_at} />
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    </section>
                </main>
            </div>

            {/* FOOTER */}
            <Footer />
        </div>
    );
}
