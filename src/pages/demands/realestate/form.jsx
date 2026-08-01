// ─────────────────────────────────────────────────────────────
// realestate/form.jsx
// SADECE emlak formunun gövdesi. Formu değiştirmek için yalnızca buraya dokunulur.
//   Adım 1: İşlem tipi + kategori + il/ilçe + mahalle (ÇOKLU seçim)
//   Adım 2: Yapısal özellikler (oda, m², kat, ısıtma, bina yaşı) + kabul edilemez + deprem
//   Adım 3: Bütçe + tapu/kredi + süre + min. eşleşme oranı + otomatik başlık/açıklama + yayınla
//
// Lokasyon: useTurkiyeLocation hook'u index.jsx'te çağrılır, `loc` prop'u ile gelir.
// Mahalle çoklu seçim: loc.selectedNeighborhoods (obje dizisi) + loc.toggleNeighborhood(n).
// ─────────────────────────────────────────────────────────────
import { useRef } from "react"
import {
    Building2, ChevronDown, MapPin, Upload, FileText, X, Check,
    CheckCircle, AlertCircle, AlertTriangle, Loader2,
} from "lucide-react"
import { sanitizePrice } from "@/pages/demands/_shared/demandFormUtils"
import FormShell from "@/pages/demands/_shared/FormShell"
import {
    GAYRIMENKUL_KATEGORILERI, ISLEM_TIPLERI, ODA_SAYILARI, ISITMA_TIPLERI,
    BULUNDUGU_KATLAR, BINA_YASLARI, KABUL_EDILEMEZ_KUSURLAR, TAPU_DURUMLARI,
    KREDI_UYGUNLUK, BEKLEME_OPTIONS, DURATION_PRESETS, katLabelOf,
} from "./realEstateConfig"

// ── Küçük yardımcılar ─────────────────────────────────────────
function SectionHeader({ children }) {
    return <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-3 pb-2 border-b border-gray-100">{children}</p>
}

function SelectField({ label, value, onChange, options, required, placeholder = "Seçin...", getVal = o => o, getLabel = o => o }) {
    return (
        <div className="flex flex-col gap-1 text-left">
            <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <div className="relative">
                <select value={value || ""} onChange={e => onChange(e.target.value)}
                        className="w-full appearance-none px-3 py-2.5 bg-gray-50 hover:bg-white border border-gray-200 hover:border-gray-300 focus:border-purple-400 focus:bg-white focus:ring-1 focus:ring-purple-400 text-xs font-medium text-gray-700 rounded outline-none cursor-pointer transition-all">
                    <option value="">{placeholder}</option>
                    {options.map(o => <option key={getVal(o)} value={getVal(o)}>{getLabel(o)}</option>)}
                </select>
                <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
        </div>
    )
}

function CheckboxField({ checked, onChange, label, sub, color = "purple" }) {
    const colors = {
        purple: { wrap: checked ? "bg-purple-50 border-purple-300" : "bg-white border-gray-200 hover:border-gray-300", box: checked ? "bg-purple-600 border-purple-600" : "border-gray-300", text: checked ? "text-purple-800" : "text-gray-800", sub: checked ? "text-purple-600" : "text-gray-400" },
        green: { wrap: checked ? "bg-green-50 border-green-300" : "bg-white border-gray-200 hover:border-gray-300", box: checked ? "bg-green-600 border-green-600" : "border-gray-300", text: checked ? "text-green-800" : "text-gray-800", sub: checked ? "text-green-600" : "text-gray-400" },
    }
    const c = colors[color] || colors.purple
    return (
        <label onClick={onChange} className={`flex items-start gap-2.5 p-2.5 border rounded cursor-pointer transition-all select-none ${c.wrap}`}>
            <div className={`w-4 h-4 mt-0.5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all ${c.box}`}>
                {checked && <svg viewBox="0 0 10 8" className="w-2.5 h-2 text-white fill-current"><path d="M1 4l2.5 2.5L9 1" /></svg>}
            </div>
            <div>
                <p className={`text-xs font-bold ${c.text}`}>{label}</p>
                {sub && <p className={`text-[10px] mt-0.5 ${c.sub}`}>{sub}</p>}
            </div>
        </label>
    )
}

function DocumentUpload({ file, onChange }) {
    const ref = useRef(null)
    return (
        <div className="mt-2">
            {!file ? (
                <button type="button" onClick={() => ref.current?.click()}
                        className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-200 hover:border-purple-300 hover:bg-purple-50/30 rounded py-4 transition-all group">
                    <Upload size={15} className="text-gray-300 group-hover:text-purple-400" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-purple-600">Tapu / Belge Yükle</span>
                    <span className="text-[9px] text-gray-300 font-medium">PDF · JPG · PNG · max 10MB</span>
                </button>
            ) : (
                <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded">
                    <FileText size={16} className="text-green-700 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-green-900 truncate">{file.name}</p>
                        <p className="text-[9px] text-green-600 font-medium">{(file.size / 1024).toFixed(0)} KB · Yüklendi</p>
                    </div>
                    <button type="button" onClick={() => { onChange(null); if (ref.current) ref.current.value = "" }} className="w-6 h-6 flex items-center justify-center rounded hover:bg-green-200 text-green-600 transition-colors"><X size={12} /></button>
                </div>
            )}
            <input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f && f.size <= 10 * 1024 * 1024) onChange(f) }} />
        </div>
    )
}

// ── Form gövdesi ──────────────────────────────────────────────
export default function RealEstateForm(props) {
    const {
        condition, kategori, setKategori, islemTipi, setIslemTipi,
        loc,                       // useTurkiyeLocation() nesnesi
        features, setFeature,
        maxBudget, setMaxBudget,
        title, setTitle, desc, setDesc,
        duration, setDurationHours,
        matchPercent, setMatchPercent,
        uploadFile, setUploadFile,
        errors, currentStep, onPrev, onNext,
        submitting, onSubmit,
    } = props

    const katLabel = katLabelOf(kategori)
    const seciliMahalleler = loc.selectedNeighborhoods || []

    return (
        <FormShell
            icon={Building2}
            title="Yeni Gayrimenkul Talebi"
            subtitle="Talebiniz uzman acente ve brokerların portföyleriyle eşleştirilir"
            badge={{
                label: condition === "sifir" ? "Projeden · 1. El" : "Hazır Mülk · 2. El",
                cls: condition === "sifir" ? "bg-green-50 text-green-800 border-green-200" : "bg-gray-50 text-gray-700 border-gray-200",
            }}
            steps={[
                { step: 1, title: "Konum & Mülk Tipi" },
                { step: 2, title: "Yapısal Özellikler" },
                { step: 3, title: "Finansman & Yayın" },
            ]}
            currentStep={currentStep}
            onPrev={onPrev}
            onNext={onNext}
            resetKey={`${condition}-${kategori}`}
        >
            {/* ── ADIM 1 ── */}
            {currentStep === 1 && (
                <div className="space-y-4">
                    <div>
                        <SectionHeader>GAYRİMENKUL SINIFI & TALEBİN TÜRÜ</SectionHeader>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <SelectField label="Talep Türü" required value={islemTipi} onChange={setIslemTipi}
                                         options={ISLEM_TIPLERI} getVal={o => o.value} getLabel={o => o.label} placeholder="İşlem tipi" />
                            <SelectField label="Gayrimenkul Grubu" required value={kategori} onChange={setKategori}
                                         options={GAYRIMENKUL_KATEGORILERI} getVal={o => o.value} getLabel={o => o.label} placeholder="Kategori" />
                            <SelectField label="Bekleme / Teslim" value={features.bekleme_suresi} onChange={v => setFeature("bekleme_suresi", v)}
                                         options={BEKLEME_OPTIONS} />
                        </div>
                    </div>

                    {/* Lokasyon kaskadı */}
                    <div>
                        <SectionHeader>LOKASYON SEÇİMİ</SectionHeader>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* İl */}
                            <div className="flex flex-col gap-1 text-left">
                                <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">İl <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <select value={loc.selectedProvince?.id || ""}
                                            onChange={e => { const p = loc.provinces.find(p => p.id === Number(e.target.value)); loc.setSelectedProvince(p || null) }}
                                            className={`w-full appearance-none px-3 py-2.5 bg-gray-50 border text-xs font-medium text-gray-700 rounded outline-none cursor-pointer transition-all focus:bg-white focus:ring-1 focus:ring-purple-400 ${errors.location ? "border-red-400" : "border-gray-200 hover:border-gray-300 focus:border-purple-400"}`}>
                                        <option value="">{loc.loadingProv ? "Yükleniyor..." : "İl Seçin"}</option>
                                        {loc.provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                            {/* İlçe */}
                            <div className="flex flex-col gap-1 text-left">
                                <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">İlçe <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <select value={loc.selectedDistrict?.id || ""} disabled={!loc.selectedProvince}
                                            onChange={e => { const d = loc.districts.find(d => d.id === Number(e.target.value)); loc.setSelectedDistrict(d || null) }}
                                            className="w-full appearance-none px-3 py-2.5 bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-purple-400 focus:bg-white focus:ring-1 focus:ring-purple-400 text-xs font-medium text-gray-700 rounded outline-none cursor-pointer disabled:opacity-40 transition-all">
                                        <option value="">{loc.loadingDist ? "Yükleniyor..." : loc.selectedProvince ? "İlçe Seçin" : "Önce İl"}</option>
                                        {loc.districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                    <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Mahalle — ÇOKLU seçim */}
                        <div className="mt-3 flex flex-col gap-1 text-left">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                                Mahalleler <span className="text-gray-300 font-normal normal-case">(birden fazla seçebilirsiniz)</span>
                            </label>

                            {!loc.selectedDistrict ? (
                                <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded text-[11px] font-medium text-gray-400">
                                    Önce ilçe seçin
                                </div>
                            ) : loc.loadingNeigh ? (
                                <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded text-[11px] font-medium text-gray-400 flex items-center gap-2">
                                    <Loader2 size={12} className="animate-spin" /> Mahalleler yükleniyor...
                                </div>
                            ) : (
                                <>
                                    {/* Seçili çipler */}
                                    {seciliMahalleler.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {seciliMahalleler.map(n => (
                                                <span key={n.id} className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-600 text-white px-2.5 py-1 rounded">
                                                    {n.name}
                                                    <button type="button" onClick={() => loc.toggleNeighborhood(n)} className="hover:text-purple-200"><X size={10} /></button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {/* Seçilebilir liste */}
                                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded bg-white divide-y divide-gray-100">
                                        {(loc.neighborhoods || []).length === 0 && (
                                            <p className="px-3 py-2.5 text-[11px] font-medium text-gray-400">Bu ilçe için mahalle bulunamadı.</p>
                                        )}
                                        {(loc.neighborhoods || []).map(n => {
                                            const sel = seciliMahalleler.some(x => x.id === n.id)
                                            return (
                                                <button key={n.id} type="button" onClick={() => loc.toggleNeighborhood(n)}
                                                        className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${sel ? "bg-purple-50" : "hover:bg-gray-50"}`}>
                                                    <span className={`w-3.5 h-3.5 flex-shrink-0 rounded border flex items-center justify-center ${sel ? "bg-purple-600 border-purple-600" : "border-gray-300"}`}>
                                                        {sel && <Check size={9} className="text-white stroke-[3]" />}
                                                    </span>
                                                    <span className={`text-[11px] font-medium ${sel ? "text-purple-800" : "text-gray-700"}`}>{n.name}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </>
                            )}
                        </div>

                        {errors.location && <p className="text-[10px] text-red-600 font-bold mt-1.5">{errors.location}</p>}
                        {loc.selectedProvince && (
                            <p className="text-[10px] text-purple-700 font-bold mt-2 flex items-center gap-1.5">
                                <MapPin size={10} />
                                {[seciliMahalleler.length ? `${seciliMahalleler.length} mahalle` : null, loc.selectedDistrict?.name, loc.selectedProvince?.name].filter(Boolean).join(", ")}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* ── ADIM 2 ── */}
            {currentStep === 2 && (
                <div className="space-y-4">
                    <div>
                        <SectionHeader>YAPISAL ÖZELLİKLER</SectionHeader>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {kategori !== "arsa" && (
                                <SelectField label="Oda Sayısı" value={features.oda_sayisi} onChange={v => setFeature("oda_sayisi", v)} options={ODA_SAYILARI} />
                            )}
                            <div className="flex flex-col gap-1 text-left">
                                <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Metrekare (m²)</label>
                                <div className="relative">
                                    <input type="text" inputMode="numeric" value={features.metrekare ? Number(features.metrekare).toLocaleString("tr-TR") : ""} onChange={e => setFeature("metrekare", sanitizePrice(e.target.value))} placeholder="ör. 120" className="w-full px-3 py-2.5 pr-10 bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-purple-400 focus:bg-white text-xs font-medium text-gray-700 rounded outline-none transition-all placeholder:text-gray-400" />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">m²</span>
                                </div>
                            </div>
                            {kategori !== "arsa" && (
                                <>
                                    <SelectField label="Bina Yaşı" value={features.bina_yasi} onChange={v => setFeature("bina_yasi", v)} options={BINA_YASLARI} />
                                    <SelectField label="Bulunduğu Kat" value={features.bulundugu_kat} onChange={v => setFeature("bulundugu_kat", v)} options={BULUNDUGU_KATLAR} />
                                    <SelectField label="Isıtma" value={features.isitma} onChange={v => setFeature("isitma", v)} options={ISITMA_TIPLERI} />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Kabul edilemez kusurlar */}
                    <div className="bg-gray-50 border border-gray-200 rounded p-3">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-red-600 mb-2">Kabul Edilemez Kriterler</p>
                        <div className="flex flex-wrap gap-1.5">
                            {KABUL_EDILEMEZ_KUSURLAR.map(opt => {
                                const sel = (features.kabul_edilemez || []).includes(opt)
                                return <button key={opt} type="button" onClick={() => { const curr = features.kabul_edilemez || []; setFeature("kabul_edilemez", sel ? curr.filter(v => v !== opt) : [...curr, opt]) }} className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-all ${sel ? "bg-red-600 text-white border-red-600" : "bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:bg-red-50"}`}>{opt}</button>
                            })}
                        </div>
                    </div>

                    {/* Deprem yönetmeliği */}
                    <div className="bg-gray-50 border border-gray-200 rounded p-3">
                        <SectionHeader>GÜVENLİK & YÖNETMELİK</SectionHeader>
                        <CheckboxField
                            checked={!!features.deprem_yonetmeligi}
                            onChange={() => setFeature("deprem_yonetmeligi", !features.deprem_yonetmeligi)}
                            label="Yalnızca 2018 Deprem Yönetmeliğine Uygun Binalar"
                            sub="Statik raporu doğrulanmış, zemin etüdü yapılmış yeni nesil yapılar"
                            color="green" />
                    </div>
                </div>
            )}

            {/* ── ADIM 3 ── */}
            {currentStep === 3 && (
                <div className="space-y-4">
                    {/* Bütçe */}
                    <div>
                        <SectionHeader>BÜTÇE LİMİTLERİ</SectionHeader>
                        <div className="flex flex-col gap-1 text-left max-w-xs">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                                {islemTipi === "satilik" ? "Maksimum Satın Alma Bütçesi" : "Maksimum Aylık Kira Bütçesi"} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input type="text" inputMode="numeric" value={maxBudget ? Number(maxBudget).toLocaleString("tr-TR") : ""} onChange={e => setMaxBudget(sanitizePrice(e.target.value))} placeholder={islemTipi === "satilik" ? "ör. 4.500.000" : "ör. 25.000"} className={`w-full px-3 py-2.5 pr-8 bg-gray-50 border text-xs font-medium text-gray-700 rounded outline-none focus:bg-white transition-all placeholder:text-gray-400 ${errors.maxBudget ? "border-red-400" : "border-gray-200 hover:border-gray-300 focus:border-purple-400"}`} />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₺</span>
                            </div>
                            {maxBudget && Number(maxBudget) > 0 && <p className="text-[10px] text-purple-700 font-bold">{Number(maxBudget).toLocaleString("tr-TR")} ₺ ve altı teklifler</p>}
                            {errors.maxBudget && <p className="text-[10px] text-red-600 font-bold">{errors.maxBudget}</p>}
                        </div>
                    </div>

                    {/* Tapu & Kredi — sadece satılık */}
                    {islemTipi === "satilik" && (
                        <div className="bg-gray-50 border border-gray-200 rounded p-3 space-y-3">
                            <SectionHeader>TAPU & KREDİ BİLGİSİ</SectionHeader>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <SelectField label="Aranan Tapu Durumu" value={features.tapu_durumu} onChange={v => setFeature("tapu_durumu", v)} options={TAPU_DURUMLARI} />
                                <SelectField label="Kredi Uygunluğu" value={features.kredi_uygunluk} onChange={v => setFeature("kredi_uygunluk", v)} options={KREDI_UYGUNLUK} />
                            </div>
                            <div className="border-t border-gray-200 pt-3">
                                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1">Tapu / Ekspertiz Belgesi <span className="text-gray-400 font-normal normal-case">(opsiyonel)</span></p>
                                <DocumentUpload file={uploadFile} onChange={setUploadFile} />
                            </div>
                        </div>
                    )}

                    {/* Yayım Süresi */}
                    <div>
                        <SectionHeader>TALEBİN AKTİF KALACAĞI SÜRE</SectionHeader>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {DURATION_PRESETS.map(({ label, hrs }) => {
                                const sel = duration.duration_hours === hrs
                                return <button key={hrs} type="button" onClick={() => setDurationHours(hrs)} className={`py-1.5 rounded text-[10px] font-bold border transition-all ${sel ? "bg-purple-700 text-white border-purple-700 shadow-sm" : "bg-gray-50 text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50"}`}>{label}</button>
                            })}
                        </div>
                        {duration.expires_at && duration.duration_hours > 0 && (
                            <div className="mt-2.5 bg-purple-50 border border-purple-100 rounded px-3 py-2 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                                <span className="text-[10px] font-bold text-purple-800">{new Date(duration.expires_at).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })} tarihine kadar yayında kalacak</span>
                            </div>
                        )}
                    </div>

                    {/* Minimum Eşleşme Oranı */}
                    <div>
                        <SectionHeader>MİNİMUM EŞLEŞME ORANI</SectionHeader>
                        <div className="flex gap-2">
                            {[
                                { label: "Farketmez", value: null },
                                { label: "%60+", value: 60 },
                                { label: "%80+", value: 80 },
                                { label: "%100", value: 100 },
                            ].map(({ label, value }) => {
                                const sel = matchPercent === value
                                return (
                                    <button key={label} type="button" onClick={() => setMatchPercent(value)}
                                            className={`flex-1 py-1.5 rounded text-[10px] font-bold border transition-all ${sel ? "bg-purple-700 text-white border-purple-700 shadow-sm" : "bg-gray-50 text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50"}`}>
                                        {label}
                                    </button>
                                )
                            })}
                        </div>
                        <div className="mt-2.5 bg-purple-50 border border-purple-100 rounded px-3 py-2 flex items-start gap-2">
                            <AlertCircle size={11} className="text-purple-600 mt-0.5 flex-shrink-0" />
                            <span className="text-[10px] font-bold text-purple-800 leading-relaxed">
                {matchPercent === null
                    ? "Kriterlerinize kısmen uyan tekliflere de açıksınız."
                    : `Sadece ilanınızla en az %${matchPercent} uyuşan tekliflere izin verilecek.`}
              </span>
                        </div>
                    </div>

                    {/* Başlık & Açıklama */}
                    <div>
                        <SectionHeader>TALEP BAŞLIĞI & DETAYLI AÇIKLAMA</SectionHeader>
                        <div className="flex items-center gap-2 mb-1.5">
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                                   placeholder="Lokasyon seçince otomatik oluşur..."
                                   className={`flex-1 px-2.5 py-2 bg-gray-50 border text-[11px] font-medium text-gray-700 rounded outline-none focus:bg-white transition-all placeholder:text-gray-400 ${errors.title ? "border-red-400" : "border-gray-200 hover:border-gray-300 focus:border-purple-400"}`} />
                        </div>
                        {errors.title && <p className="text-[10px] text-red-600 font-bold mb-1.5">{errors.title}</p>}
                        <p className="text-[9px] font-bold text-gray-400 mb-1.5">Açıklama seçimlerinize göre otomatik oluşturulur — dilerseniz düzenleyebilirsiniz.</p>
                        <textarea
                            value={desc} onChange={e => setDesc(e.target.value)}
                            rows={5}
                            placeholder="Konum, oda, m² ve diğer özellikleri seçtikçe detaylı açıklama burada otomatik oluşur..."
                            className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-purple-400 focus:bg-white text-[11px] font-medium text-gray-700 rounded outline-none resize-none transition-all placeholder:text-gray-400 leading-relaxed" />
                    </div>

                    {/* Yayınla */}
                    <div className="pt-4 border-t border-gray-100">
                        <button type="button" onClick={onSubmit} disabled={submitting}
                                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white py-3.5 rounded text-xs font-bold uppercase tracking-wider transition-all shadow-sm">
                            {submitting
                                ? <><Loader2 size={15} className="animate-spin" /> Gayrimenkul Talebi Gönderiliyor...</>
                                : <><CheckCircle size={15} /> Talebi Onaylı Gayrimenkul Profesyonellerine Gönder</>
                            }
                        </button>
                        <div className="flex items-start gap-2.5 mt-3.5 bg-purple-50/50 border border-purple-100 rounded p-3">
                            <AlertCircle size={14} className="text-purple-600 mt-0.5 flex-shrink-0" />
                            <p className="text-[10px] text-purple-800 font-semibold leading-relaxed">
                                Talep yayınlandığında, kriterlerinize birebir uyan onaylı emlak ofisleri, lisanslı brokerlar ve ilgili inşaat firmalarına anlık SMS, mobil push ve e-posta bildirimi gönderilir.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </FormShell>
    )
}