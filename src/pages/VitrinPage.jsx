// ─────────────────────────────────────────────────────────────
// VitrinPage.jsx — "Anasayfa Vitrini" buradan taşındı.
// Onaylı (moderation_status=approved) öne çıkan portföy ilanlarını
// listeler; üstteki Kategori/İl/İlçe filtresiyle daraltılabilir.
// İlk açılışta filtre yok → tüm Türkiye geneli gösterilir (HomePage'deki
// talep filtresiyle aynı mantık — bkz. PortfolioController::featured()).
// Kart tasarımı ve detay modalı, eskiden HomePage'de olan vitrin
// bileşenleriyle birebir aynı (kullanıcı bu tasarımı onaylamıştı).
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useTurkiyeLocation } from "@/hooks/useTurkiyeLocation"
import api from "@/lib/axios"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import {
    User, MessageSquare, ShoppingBag,
    Car, ChevronRight, Heart, MapPin, X, Building2,
    LayoutGrid, List, Filter, Star, Phone, ShieldCheck, ChevronLeft,
    ChevronDown, ArrowLeft,
} from 'lucide-react';

// Portföy öğesinden ekranda gösterilecek alanları türetir — gayrimenkul
// ve vasıta farklı `features` şemalarına sahip olduğu için başlık/konum/
// kategori burada normalize edilir.
function derivePortfolioDisplay(item) {
    const isGayr = item.type === "gayrimenkul"
    const f = item.features || {}
    const title = item.title || [f.marka, f.model, f.yil].filter(Boolean).join(" ") || "Portföy İlanı"
    const location = isGayr
        ? [f.ilce, f.il, item.district].filter(Boolean).join(", ") || "—"
        : (item.district || "—")
    const price = item.price ? Number(item.price).toLocaleString("tr-TR") + " TL" : "Teklif ile"
    const category = isGayr ? "Gayrimenkul" : "Vasıta"
    return { title, location, price, category, isGayr }
}

export default function VitrinPage() {
    const navigate = useNavigate();
    const loc = useTurkiyeLocation();
    const [viewMode, setViewMode] = useState('grid');
    const [selectedItem, setSelectedItem] = useState(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const [portfolioItems, setPortfolioItems] = useState([]);
    const [portfolioLoading, setPortfolioLoading] = useState(true);
    const [selectedType, setSelectedType] = useState("");

    const fetchPortfolio = (params = {}) => {
        setPortfolioLoading(true);
        api.get("/portfolio/featured", { params: { limit: 24, ...params } })
            .then(r => setPortfolioItems(r.data || []))
            .catch(() => setPortfolioItems([]))
            .finally(() => setPortfolioLoading(false));
    };

    // İlk açılış: filtre yok → tüm Türkiye geneli.
    useEffect(() => {
        fetchPortfolio();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFilterClick = () => {
        const params = {};
        if (selectedType) params.type = selectedType;
        if (loc.selectedProvince?.name) params.il = loc.selectedProvince.name;
        if (loc.selectedDistrict?.name) params.ilce = loc.selectedDistrict.name;
        fetchPortfolio(params);
    };

    return (
        <div className="min-h-screen bg-gray-200 font-sans text-gray-800 flex flex-col">
            <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

            <Header onLogoClick={() => setSelectedItem(null)} />

            <div className="flex flex-col flex-1 w-full">
                <main className="max-w-[1200px] mx-auto w-full px-4 py-6 flex-1">

                    <button
                        onClick={() => navigate("/")}
                        className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-purple-700 transition-colors mb-4"
                    >
                        <ArrowLeft size={14} /> Taleplere Dön
                    </button>

                    {/* FİLTRE & ARAMA */}
                    <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-3 mb-6">
                        <div className="flex flex-col lg:flex-row gap-3 items-end justify-between">
                            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div className="flex flex-col">
                                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Kategori</label>
                                    <select
                                        value={selectedType}
                                        onChange={e => setSelectedType(e.target.value)}
                                        className="w-full p-1.5 border border-gray-200 rounded text-[11px] outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 bg-gray-50 hover:bg-white transition-colors cursor-pointer text-gray-700 h-[28px]">
                                        <option value="">Tüm Kategoriler</option>
                                        <option value="gayrimenkul">Gayrimenkul</option>
                                        <option value="vasita">Vasıta</option>
                                    </select>
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">İl</label>
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
                                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">İlçe</label>
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
                            </div>

                            <div className="flex w-full lg:w-auto items-center justify-between lg:justify-end gap-2 mt-2 lg:mt-0">
                                <button
                                    onClick={handleFilterClick}
                                    className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-1.5 rounded text-[11px] font-bold transition-all shadow-sm"
                                >
                                    <Filter size={14} /> Filtrele
                                </button>

                                <div className="flex items-center border border-gray-200 rounded bg-gray-50 overflow-hidden h-[28px] flex-shrink-0 shadow-sm">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`px-2 py-1 transition-all flex items-center justify-center ${viewMode === 'grid' ? 'bg-purple-100 text-purple-700 shadow-inner' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        <LayoutGrid size={14} />
                                    </button>
                                    <div className="w-px h-full bg-gray-200"></div>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`px-2 py-1 transition-all flex items-center justify-center ${viewMode === 'list' ? 'bg-purple-100 text-purple-700 shadow-inner' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        <List size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* VİTRİN */}
                    <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-gray-200">
                        <h1 className="text-base font-bold text-gray-800 flex items-center gap-2">
                            Vitrin
                            <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-semibold">Öne Çıkanlar</span>
                        </h1>
                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                            <MapPin size={11} className="text-purple-400" />
                            {loc.selectedProvince ? `${loc.selectedDistrict?.name ? loc.selectedDistrict.name + ", " : ""}${loc.selectedProvince.name}` : "Tüm Türkiye"}
                        </span>
                    </div>

                    <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" : "flex flex-col gap-3"}>
                        {portfolioLoading ? (
                            [...Array(12)].map((_, i) => (
                                <div key={i} className={`bg-white border border-gray-200 rounded-sm overflow-hidden animate-pulse ${viewMode === 'grid' ? 'h-40' : 'h-24'}`} />
                            ))
                        ) : portfolioItems.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center bg-white border border-gray-200 rounded-sm">
                                <ShoppingBag size={28} className="text-gray-200 mb-3" />
                                <p className="text-sm font-bold text-gray-400">Bu filtrelere uyan ilan yok</p>
                                <p className="text-xs text-gray-300 mt-1">Farklı bir il/ilçe ya da kategori deneyin</p>
                            </div>
                        ) : portfolioItems.map((item) => {
                            const { title, location, price, category } = derivePortfolioDisplay(item)
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => {
                                        setSelectedItem(item);
                                        setActiveImageIndex(0);
                                        // Liste endpoint'i (/portfolio/featured) yalnızca cover_url döndürüyor.
                                        // Modal'da diğer fotoğrafların gözükmesi için ilanın tam detayını
                                        // ayrıca çekip selectedItem'ı güncelliyoruz.
                                        api.get(`/portfolio/${item.id}`)
                                            .then(r => setSelectedItem(prev => (prev && prev.id === item.id ? { ...prev, ...r.data } : prev)))
                                            .catch(err => console.error("Portföy detay isteği başarısız:", err.response?.status, err.response?.data || err.message));
                                    }}
                                    className={`bg-white border border-gray-200 hover:border-purple-400 hover:shadow-lg transition-all rounded-sm overflow-hidden flex group cursor-pointer relative ${viewMode === 'grid' ? 'flex-col' : 'flex-col sm:flex-row'}`}
                                >
                                    <button
                                        onClick={(e) => e.stopPropagation()}
                                        className="absolute top-1.5 right-1.5 p-1 bg-white/70 hover:bg-white rounded-full z-10 text-gray-400 hover:text-red-500 transition-colors shadow-sm"
                                    >
                                        <Heart size={13} />
                                    </button>

                                    <div className={`bg-gray-100 relative overflow-hidden flex-shrink-0 ${viewMode === 'grid' ? 'w-full h-24' : 'w-full sm:w-56 h-40 sm:h-32'}`}>
                                        {item.cover_url ? (
                                            <img src={item.cover_url} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                {category === "Gayrimenkul" ? <Building2 size={20} className="text-gray-300" /> : <Car size={20} className="text-gray-300" />}
                                            </div>
                                        )}
                                    </div>

                                    <div className={`p-2 flex flex-1 ${viewMode === 'grid' ? 'flex-col' : 'flex-col sm:flex-row sm:items-center'}`}>
                                        <div className={`${viewMode === 'grid' ? '' : 'flex-1 pr-4'}`}>
                                            <h3 className={`text-[10.5px] text-gray-700 font-medium leading-snug mb-1 group-hover:text-purple-700 transition-colors ${viewMode === 'grid' ? 'line-clamp-2' : 'line-clamp-2 sm:text-[15px] sm:font-semibold'}`}>
                                                {title}
                                            </h3>
                                        </div>

                                        <div className={`${viewMode === 'grid' ? 'mt-auto' : 'sm:text-right mt-2 sm:mt-0 flex flex-row sm:flex-col justify-between items-center sm:items-end'}`}>
                                            <p className={`text-purple-700 font-bold ${viewMode === 'grid' ? 'text-[12px] mb-0.5' : 'text-lg sm:mb-2'}`}>{price}</p>
                                            <div className={`flex items-center text-gray-500 gap-1 border-gray-100 ${viewMode === 'grid' ? 'text-[9px] mt-0.5 border-t pt-1.5' : 'text-xs'}`}>
                                                <MapPin size={9} className="text-purple-400 flex-shrink-0" />
                                                <span className="truncate">{location}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </main>
            </div>

            {/* İLAN DETAY MODAL */}
            {selectedItem && (() => {
                const { title, location, price, category } = derivePortfolioDisplay(selectedItem)
                const gallery = selectedItem.images?.length
                    ? selectedItem.images
                    : (selectedItem.cover_url ? [{ id: "cover", url: selectedItem.cover_url }] : [])
                const activeImg = gallery[activeImageIndex]?.url || gallery[0]?.url
                const goToPrevImage = () => setActiveImageIndex(prev => (prev === 0 ? gallery.length - 1 : prev - 1))
                const goToNextImage = () => setActiveImageIndex(prev => (prev === gallery.length - 1 ? 0 : prev + 1))

                return (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedItem(null)}></div>
                        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row z-10">
                            <button onClick={() => setSelectedItem(null)} className="absolute top-3 right-3 z-20 bg-black/50 text-white hover:bg-red-500 rounded-full p-1.5 transition-colors"><X size={20} /></button>

                            {/* Sol: Fotoğraf Galerisi */}
                            <div className="w-full md:w-[55%] bg-gray-100 flex flex-col h-64 md:h-[520px] border-r border-gray-200">
                                <div className="relative flex-1 min-h-0 bg-black group/slider">
                                    {activeImg ? (
                                        <img src={activeImg} alt={title} className="w-full h-full object-contain transition-all duration-300" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-900">
                                            {category === "Gayrimenkul" ? <Building2 size={40} className="text-gray-600" /> : <Car size={40} className="text-gray-600" />}
                                        </div>
                                    )}
                                    <button className="absolute top-3 left-3 z-20 bg-white/80 hover:bg-white text-gray-500 hover:text-red-500 rounded-full p-2 shadow-md transition-colors">
                                        <Heart size={16} />
                                    </button>
                                    {gallery.length > 1 && (
                                        <>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); goToPrevImage(); }}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white p-1.5 rounded-full text-black opacity-0 group-hover/slider:opacity-100 transition-all shadow-md"><ChevronLeft size={20}/></button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); goToNextImage(); }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white p-1.5 rounded-full text-black opacity-0 group-hover/slider:opacity-100 transition-all shadow-md"><ChevronRight size={20}/></button>
                                        </>
                                    )}
                                </div>
                                {gallery.length > 1 && (
                                    <div className="flex-shrink-0 flex gap-2 p-2 overflow-x-auto hide-scrollbar bg-gray-200 border-t border-gray-300">
                                        {gallery.slice(0, 8).map((img, i) => (
                                            <img
                                                key={img.id ?? i}
                                                onClick={() => setActiveImageIndex(i)}
                                                src={img.url}
                                                className={`flex-shrink-0 w-12 h-12 object-cover rounded-lg cursor-pointer border-2 transition-all duration-200 ${activeImageIndex === i ? 'border-purple-600 scale-105' : 'border-transparent hover:border-gray-400 opacity-70 hover:opacity-100'}`}
                                                alt={`thumbnail-${i}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Sağ: İlan Detayları */}
                            <div className="w-full md:w-[45%] flex flex-col bg-white md:h-[520px] overflow-hidden">
                                <div className="p-4 flex-1 flex flex-col min-h-0">
                                    <div className="flex justify-between items-start mb-1.5">
                                        <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider">{category}</span>
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-800 leading-tight mb-1.5">{title}</h2>
                                    <div className="flex items-center justify-between text-gray-500 text-[11px] mb-2 pb-2 border-b border-gray-100">
                                        <span className="flex items-center gap-1"><MapPin size={11} className="text-purple-500"/>{location}</span>
                                        <span className="text-gray-400">İlan No: <strong className="text-gray-600">{100000000 + selectedItem.id}</strong></span>
                                    </div>

                                    <p className="text-2xl font-extrabold text-purple-700 mb-1.5">{price}</p>

                                    {/* İstatistikler */}
                                    <div className="flex gap-3 text-[10px] text-gray-500 mb-2 bg-purple-50/50 p-1.5 rounded-lg border border-purple-100">
                                        <div className="flex items-center gap-1"><Heart size={11} className="text-red-400"/> <strong className="text-gray-700">124</strong> favori</div>
                                        <div className="flex items-center gap-1"><User size={11} className="text-blue-400"/> <strong className="text-gray-700">38</strong> kişi inceliyor</div>
                                    </div>

                                    <div className="space-y-1.5 text-[11px] mb-2 text-gray-600">
                                        <div className="flex justify-between border-b border-gray-50 pb-1"><span className="text-gray-400">Durum</span><span className="font-semibold text-green-600">İkinci El</span></div>
                                        <div className="flex justify-between border-b border-gray-50 pb-1"><span className="text-gray-400">Kimden</span><span className="font-semibold text-gray-800">Mülk Sahibi</span></div>
                                        <div className="flex justify-between border-b border-gray-50 pb-1"><span className="text-gray-400">İlan Tarihi</span><span className="font-semibold text-gray-800">Bugün</span></div>
                                    </div>

                                    {/* Teklif / İndirim Talebi */}
                                    <div className="mb-2">
                                        <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">Hızlı İndirim Talep Et</h4>
                                        <div className="flex gap-1.5">
                                            <button className="flex-1 bg-white border border-gray-200 hover:border-purple-400 hover:bg-purple-50 hover:text-purple-700 text-gray-700 py-1 rounded-lg text-[11px] font-semibold transition-all">%10 İndirim</button>
                                            <button className="flex-1 bg-white border border-gray-200 hover:border-purple-400 hover:bg-purple-50 hover:text-purple-700 text-gray-700 py-1 rounded-lg text-[11px] font-semibold transition-all">%20 İndirim</button>
                                            <button className="flex-1 bg-white border border-purple-200 hover:bg-purple-600 hover:text-white text-purple-700 py-1 rounded-lg text-[11px] font-semibold transition-all">Özel Teklif</button>
                                        </div>
                                    </div>

                                    {/* Satıcı Profili */}
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 mt-auto">
                                        <div className="flex items-center gap-2.5 mb-2">
                                            <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xs shadow-inner flex-shrink-0">
                                                {(selectedItem.agent_name || "TM").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800 text-xs">{selectedItem.agent_name || "Onaylı Satıcı"}</h4>
                                                <p className="text-[9px] text-green-600 flex items-center gap-1 mt-0.5"><ShieldCheck size={11} /> Kurumsal Üye • Onaylı İlan</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1.5">
                                            <button className="flex-1 bg-white border border-purple-200 hover:border-purple-600 text-purple-700 py-1.5 rounded-lg font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors shadow-sm"><MessageSquare size={12}/> Mesaj At</button>
                                            <button className="flex-1 bg-indigo-50 border border-indigo-200 hover:border-indigo-600 text-indigo-700 py-1.5 rounded-lg font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors shadow-sm"><Phone size={12}/> Telefon</button>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-3 border-t border-gray-100 bg-gray-50 shrink-0">
                                    <button onClick={() => navigate("/market")} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-[0_5px_15px_rgba(99,102,241,0.3)] hover:shadow-[0_8px_20px_rgba(99,102,241,0.4)] transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                                        <Star size={16} className="fill-current"/> Pazaryerinde Görüntüle
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })()}

            <Footer />
        </div>
    );
}
