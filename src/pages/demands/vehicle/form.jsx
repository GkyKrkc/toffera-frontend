// ─────────────────────────────────────────────────────────────
// vehicle/form.jsx
// SADECE araç formunun gövdesi. Formu değiştirmek istediğinizde
// yalnızca bu dosyaya dokunulur. State index.jsx'ten props ile gelir.
//   Adım 1: Kategori + Marka/Model/Yıl/Donanım + teknik tercihler
//   Adım 2: Boya & değişen + tramer/eksper + takas + finansman
//   Adım 3: Bütçe + süre + otomatik başlık/açıklama + yayınla
// ─────────────────────────────────────────────────────────────
import { useRef } from "react"
import {
    Car, ChevronDown, Upload, FileText, X, CheckCircle,
    AlertTriangle, AlertCircle, Loader2, RefreshCw,
} from "lucide-react"
import CAR_DATA from "@/data/carData"
import { sanitizePrice } from "@/pages/demands/_shared/demandFormUtils"
import FormShell from "@/pages/demands/_shared/FormShell"
import {
    ARAC_KATEGORILERI, BOYA_OPTIONS, DEGISEN_OPTIONS, KABUL_EDILEMEZ,
    DURATION_PRESETS, YILLAR, KM_OPTIONS, YAKIT_OPTIONS, VITES_OPTIONS,
    RENK_OPTIONS, BEKLEME_OPTIONS, katLabelOf,
} from "./vehicleConfig"

// ── Küçük yardımcılar ─────────────────────────────────────────
function SectionHeader({ children }) {
    return <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-3 pb-2 border-b border-gray-100">{children}</p>
}

function SelectField({ label, value, onChange, options, required, placeholder = "Seçin..." }) {
    return (
        <div className="flex flex-col gap-1 text-left">
            <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <div className="relative">
                <select value={value || ""} onChange={e => onChange(e.target.value)}
                        className="w-full appearance-none px-3 py-2.5 bg-gray-50 hover:bg-white border border-gray-200 hover:border-gray-300 focus:border-purple-400 focus:bg-white focus:ring-1 focus:ring-purple-400 text-xs font-medium text-gray-700 rounded outline-none cursor-pointer transition-all">
                    <option value="">{placeholder}</option>
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
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

function ExpertiseUpload({ file, onChange }) {
    const ref = useRef(null)
    return (
        <div className="mt-2">
            {!file ? (
                <button type="button" onClick={() => ref.current?.click()}
                        className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-200 hover:border-purple-300 hover:bg-purple-50/30 rounded py-4 transition-all group">
                    <Upload size={15} className="text-gray-300 group-hover:text-purple-400" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-purple-600">Ekspertiz Raporu Yükle</span>
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
export default function VehicleForm(props) {
    const {
        condition, kategori, setKategori,
        selBrand, setSelBrand, selModel, setSelModel, selVersion, setSelVersion,
        takasBrand, setTakasBrand, takasModel, setTakasModel, takasVersion, setTakasVersion,
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
    const boya_tipi = features.boya_degisen_tipi || "boyasiz_degisensiz"

    const carModels = CAR_DATA.find(b => b.marka === selBrand)?.modeller || []
    const carVersions = carModels.find(m => m.ad === selModel)?.versiyonlar || []
    const takasCarModels = CAR_DATA.find(b => b.marka === takasBrand)?.modeller || []
    const takasCarVersions = takasCarModels.find(m => m.ad === takasModel)?.versiyonlar || []

    return (
        <FormShell
            icon={Car}
            title={`${condition === "sifir" ? "Sıfır Araç" : "2. El Araç"} Talebi`}
            subtitle={condition === "sifir" ? "Talebiniz kayıtlı plaza ve yetkili bayilere iletilecek" : "Talebiniz galeri ve vasıta danışmanlarına iletilecek"}
            badge={{
                label: condition === "sifir" ? "Plaza & Bayi" : "Vasıta Danışmanı",
                cls: condition === "sifir" ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-gray-50 text-gray-700 border-gray-200",
            }}
            steps={[
                { step: 1, title: "Model & Donanım" },
                { step: 2, title: "Kozmetik & Geçmiş" },
                { step: 3, title: "Bütçe & Yayın" },
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
                        <SectionHeader>MARKA & MODEL SEÇİMİ</SectionHeader>

                        <div className="flex flex-col gap-1 text-left mb-3">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Araç Kategorisi <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <select value={kategori} onChange={e => { setKategori(e.target.value); setSelBrand(""); setSelModel(""); setSelVersion("") }}
                                        className="w-full appearance-none px-3 py-2.5 bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-purple-400 focus:bg-white focus:ring-1 focus:ring-purple-400 text-xs font-medium text-gray-700 rounded outline-none cursor-pointer transition-all">
                                    {ARAC_KATEGORILERI.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
                                </select>
                                <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <div className="flex flex-col gap-1 text-left">
                                <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Marka <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <select value={selBrand} onChange={e => { setSelBrand(e.target.value); setSelModel(""); setSelVersion("") }}
                                            className={`w-full appearance-none px-3 py-2.5 bg-gray-50 border text-xs font-medium text-gray-700 rounded outline-none cursor-pointer transition-all focus:bg-white focus:ring-1 focus:ring-purple-400 ${errors.brand ? "border-red-400" : "border-gray-200 hover:border-gray-300 focus:border-purple-400"}`}>
                                        <option value="">Marka Seçin</option>
                                        {CAR_DATA.map(b => <option key={b.marka} value={b.marka}>{b.marka}</option>)}
                                    </select>
                                    <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                                {errors.brand && <p className="text-[10px] text-red-600 font-bold">{errors.brand}</p>}
                            </div>
                            <div className="flex flex-col gap-1 text-left">
                                <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Model</label>
                                <div className="relative">
                                    <select value={selModel} disabled={!selBrand} onChange={e => { setSelModel(e.target.value); setSelVersion("") }}
                                            className="w-full appearance-none px-3 py-2.5 bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-purple-400 focus:bg-white focus:ring-1 focus:ring-purple-400 text-xs font-medium text-gray-700 rounded outline-none cursor-pointer disabled:opacity-40 transition-all">
                                        <option value="">{selBrand ? "Model Seçin" : "Önce Marka"}</option>
                                        {carModels.map(m => <option key={m.ad} value={m.ad}>{m.ad} ({m.tip})</option>)}
                                    </select>
                                    <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 text-left">
                                <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Model Yılı</label>
                                <div className="relative">
                                    <select value={features.yil || ""} onChange={e => setFeature("yil", e.target.value)}
                                            className="w-full appearance-none px-3 py-2.5 bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-purple-400 focus:bg-white focus:ring-1 focus:ring-purple-400 text-xs font-medium text-gray-700 rounded outline-none cursor-pointer transition-all">
                                        <option value="">Yıl Seçin</option>
                                        {YILLAR.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                    <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 text-left">
                                <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Donanım / Motor</label>
                                <div className="relative">
                                    <select value={selVersion} disabled={!selModel} onChange={e => { const v = carVersions.find(x => x.ad === e.target.value); setSelVersion(e.target.value); setFeature("yakit", v?.yakit || ""); setFeature("vites", v?.vites || "") }}
                                            className="w-full appearance-none px-3 py-2.5 bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-purple-400 focus:bg-white focus:ring-1 focus:ring-purple-400 text-xs font-medium text-gray-700 rounded outline-none cursor-pointer disabled:opacity-40 transition-all">
                                        <option value="">{selModel ? "Donanım Seçin" : "Önce Model"}</option>
                                        {carVersions.map(v => <option key={v.ad} value={v.ad}>{v.ad} — {v.yakit}, {v.vites}</option>)}
                                    </select>
                                    <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                        {selVersion && (features.yakit || features.vites) && (
                            <div className="flex gap-2">
                                {features.yakit && <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded"><span className="text-[9px] font-bold text-purple-500 uppercase tracking-wider">Yakıt</span><span className="text-xs font-bold text-purple-800">{features.yakit}</span></div>}
                                {features.vites && <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded"><span className="text-[9px] font-bold text-purple-500 uppercase tracking-wider">Vites</span><span className="text-xs font-bold text-purple-800">{features.vites}</span></div>}
                            </div>
                        )}
                    </div>

                    <div>
                        <SectionHeader>FABRİKA TEKNİK TERCİHLERİ</SectionHeader>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {condition === "ikinci_el" && <SelectField label="Maksimum KM" value={features.km} onChange={v => setFeature("km", v)} options={KM_OPTIONS} />}
                            <SelectField label="Yakıt Tipi" value={features.yakit} onChange={v => setFeature("yakit", v)} options={YAKIT_OPTIONS} />
                            <SelectField label="Vites" value={features.vites} onChange={v => setFeature("vites", v)} options={VITES_OPTIONS} />
                            <SelectField label="Renk" value={features.renk} onChange={v => setFeature("renk", v)} options={RENK_OPTIONS} />
                            {condition === "sifir" && <SelectField label="Bekleme Süresi" value={features.bekleme_suresi} onChange={v => setFeature("bekleme_suresi", v)} options={BEKLEME_OPTIONS} />}
                        </div>
                    </div>
                </div>
            )}

            {/* ── ADIM 2 ── */}
            {currentStep === 2 && (
                <div className="space-y-4">
                    {condition === "ikinci_el" && (
                        <div className="bg-gray-50 border border-gray-200 rounded p-3 space-y-3">
                            <SectionHeader>BOYA & DEĞİŞEN KABUL DURUMU</SectionHeader>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { value: "boyasiz_degisensiz", label: "Boyasız & Değişensiz", cls: "bg-gray-700 text-white border-gray-700" },
                                    { value: "boya_degisen_olabilir", label: "Boya / Değişen Olabilir", cls: "bg-amber-500 text-white border-amber-500" },
                                    { value: "agir_hasarli", label: "Ağır Hasarlı Olabilir", cls: "bg-red-600 text-white border-red-600" },
                                ].map(opt => {
                                    const sel = boya_tipi === opt.value
                                    return (
                                        <button key={opt.value} type="button"
                                                onClick={() => { setFeature("boya_degisen_tipi", opt.value); setFeature("boya_durumu", ""); setFeature("degisen_parca", ""); setFeature("kabul_edilemez", []) }}
                                                className={`py-1.5 px-2 text-center border rounded text-[10px] font-bold transition-all leading-tight ${sel ? opt.cls : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"}`}>
                                            {opt.label}
                                        </button>
                                    )
                                })}
                            </div>
                            {boya_tipi === "boya_degisen_olabilir" && (
                                <div className="space-y-3 pt-1">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Boya Durumu (Kabul Edilebilir)</label>
                                        <div className="flex gap-2">{BOYA_OPTIONS.map(opt => { const sel = features.boya_durumu === opt; return <button key={opt} type="button" onClick={() => setFeature("boya_durumu", sel ? "" : opt)} className={`flex-1 py-1 rounded text-[10px] font-bold border transition-all ${sel ? "bg-purple-700 text-white border-purple-700" : "bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:bg-purple-50"}`}>{opt}</button> })}</div>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Değişen Parça (Kabul Edilebilir)</label>
                                        <div className="flex gap-2">{DEGISEN_OPTIONS.map(opt => { const sel = features.degisen_parca === opt; return <button key={opt} type="button" onClick={() => setFeature("degisen_parca", sel ? "" : opt)} className={`flex-1 py-1 rounded text-[10px] font-bold border transition-all ${sel ? "bg-purple-700 text-white border-purple-700" : "bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:bg-purple-50"}`}>{opt}</button> })}</div>
                                    </div>
                                    <div className="border-t border-gray-200 pt-3">
                                        <p className="text-[9px] font-bold uppercase tracking-wider text-red-600 mb-2">Kabul Edilemez Durumlar</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {KABUL_EDILEMEZ.map(opt => { const sel = (features.kabul_edilemez || []).includes(opt); return <button key={opt} type="button" onClick={() => { const curr = features.kabul_edilemez || []; setFeature("kabul_edilemez", sel ? curr.filter(v => v !== opt) : [...curr, opt]) }} className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${sel ? "bg-red-600 text-white border-red-600" : "bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:bg-red-50"}`}>{opt}</button> })}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {boya_tipi === "agir_hasarli" && (
                                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded p-3">
                                    <AlertTriangle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-red-700 font-semibold leading-relaxed">Ağır hasarlı araç talebi yayınlanacak. Ekspertiz raporu eklemeniz önerilir.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {condition === "ikinci_el" && (
                        <div className="bg-gray-50 border border-gray-200 rounded p-3">
                            <SectionHeader>TAKAS TERCİHİ</SectionHeader>
                            <div className="flex gap-2 mb-3">
                                {[{ value: "hayir", label: "Takas İstemiyorum" }, { value: "evet", label: "Takas Düşünürüm" }].map(opt => {
                                    const sel = (features.takas || "hayir") === opt.value
                                    return <button key={opt.value} type="button" onClick={() => { setFeature("takas", opt.value); if (opt.value === "hayir") { setTakasBrand(""); setTakasModel(""); setTakasVersion(""); ["takas_marka", "takas_model", "takas_versiyon", "takas_km", "takas_hasar", "takas_fiyat"].forEach(k => setFeature(k, "")) } }} className={`flex-1 py-1.5 text-center border rounded text-[10px] font-bold transition-all ${sel ? (opt.value === "hayir" ? "bg-gray-700 text-white border-gray-700" : "bg-amber-500 text-white border-amber-500") : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"}`}>{opt.label}</button>
                                })}
                            </div>
                            {features.takas === "evet" && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1"><label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Marka</label><div className="relative"><select value={takasBrand} onChange={e => { setTakasBrand(e.target.value); setTakasModel(""); setTakasVersion(""); setFeature("takas_marka", e.target.value); setFeature("takas_model", ""); setFeature("takas_versiyon", "") }} className="w-full appearance-none px-2.5 py-2 bg-white border border-gray-200 hover:border-gray-300 focus:border-purple-400 text-[11px] font-medium text-gray-700 rounded outline-none cursor-pointer transition-all"><option value="">Marka Seçin</option>{CAR_DATA.map(b => <option key={b.marka} value={b.marka}>{b.marka}</option>)}</select><ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" /></div></div>
                                    <div className="flex flex-col gap-1"><label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Model</label><div className="relative"><select value={takasModel} disabled={!takasBrand} onChange={e => { setTakasModel(e.target.value); setTakasVersion(""); setFeature("takas_model", e.target.value); setFeature("takas_versiyon", "") }} className="w-full appearance-none px-2.5 py-2 bg-white border border-gray-200 hover:border-gray-300 focus:border-purple-400 text-[11px] font-medium text-gray-700 rounded outline-none cursor-pointer disabled:opacity-40 transition-all"><option value="">{takasBrand ? "Model Seçin" : "Önce Marka"}</option>{takasCarModels.map(m => <option key={m.ad} value={m.ad}>{m.ad}</option>)}</select><ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" /></div></div>
                                    <div className="col-span-2 flex flex-col gap-1"><label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Donanım <span className="text-gray-400 font-normal normal-case">(opsiyonel)</span></label><div className="relative"><select value={takasVersion} disabled={!takasModel} onChange={e => { setTakasVersion(e.target.value); setFeature("takas_versiyon", e.target.value) }} className="w-full appearance-none px-2.5 py-2 bg-white border border-gray-200 hover:border-gray-300 focus:border-purple-400 text-[11px] font-medium text-gray-700 rounded outline-none cursor-pointer disabled:opacity-40 transition-all"><option value="">{takasModel ? "Donanım Seçin" : "Önce Model"}</option>{takasCarVersions.map(v => <option key={v.ad} value={v.ad}>{v.ad} — {v.yakit}, {v.vites}</option>)}</select><ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" /></div></div>
                                    <div className="flex flex-col gap-1"><label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Kilometre</label><div className="relative"><input type="text" inputMode="numeric" value={features.takas_km ? Number(features.takas_km).toLocaleString("tr-TR") : ""} onChange={e => setFeature("takas_km", sanitizePrice(e.target.value))} placeholder="ör. 85.000" className="w-full px-2.5 py-2 pr-10 bg-white border border-gray-200 hover:border-gray-300 focus:border-purple-400 text-[11px] font-medium text-gray-700 rounded outline-none transition-all placeholder:text-gray-400" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">km</span></div></div>
                                    <div className="flex flex-col gap-1"><label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Hasar</label><div className="relative"><select value={features.takas_hasar || ""} onChange={e => setFeature("takas_hasar", e.target.value)} className="w-full appearance-none px-2.5 py-2 bg-white border border-gray-200 hover:border-gray-300 focus:border-purple-400 text-[11px] font-medium text-gray-700 rounded outline-none cursor-pointer transition-all"><option value="">Seçin...</option><option>Hasarsız</option><option>Az Hasarlı</option><option>Hasarlı</option><option>Ağır Hasarlı</option></select><ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" /></div></div>
                                    <div className="col-span-2 flex flex-col gap-1"><label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Takas Fiyatı <span className="text-gray-400 font-normal normal-case">(opsiyonel)</span></label><div className="relative"><input type="text" inputMode="numeric" value={features.takas_fiyat ? Number(features.takas_fiyat).toLocaleString("tr-TR") : ""} onChange={e => setFeature("takas_fiyat", sanitizePrice(e.target.value))} placeholder="ör. 850.000" className="w-full px-2.5 py-2 pr-8 bg-white border border-gray-200 hover:border-gray-300 focus:border-purple-400 text-[11px] font-medium text-gray-700 rounded outline-none transition-all placeholder:text-gray-400" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₺</span></div></div>
                                    <div className="col-span-2 border-t border-gray-200 pt-3">
                                        <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1">Takas Aracı Ekspertiz <span className="text-gray-400 font-normal normal-case">(opsiyonel)</span></p>
                                        <ExpertiseUpload file={uploadFile} onChange={setUploadFile} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {condition === "ikinci_el" && (
                        <div className="bg-gray-50 border border-gray-200 rounded p-3 space-y-3">
                            <SectionHeader>EKSPER & ARAÇ GEÇMİŞİ</SectionHeader>
                            <div className="space-y-2.5">
                                <CheckboxField
                                    checked={!!features.tramer_bilgisi_istiyorum}
                                    onChange={() => { setFeature("tramer_bilgisi_istiyorum", !features.tramer_bilgisi_istiyorum); if (features.tramer_bilgisi_istiyorum) setFeature("tramer_limit", "") }}
                                    label="Tramer bilgisini görmek istiyorum"
                                    sub="Aracın kaza geçmişi ve tramer kaydı paylaşılsın" />
                                {features.tramer_bilgisi_istiyorum && (
                                    <div className="ml-7 flex flex-col gap-1">
                                        <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Maks. Tramer Tutarı <span className="ml-1 text-gray-400 font-normal normal-case">(boş bırakılırsa sınırsız)</span></label>
                                        <div className="relative"><input type="text" inputMode="numeric" value={features.tramer_limit ? Number(features.tramer_limit).toLocaleString("tr-TR") : ""} onChange={e => setFeature("tramer_limit", sanitizePrice(e.target.value))} placeholder="ör. 25.000" className="w-full px-2.5 py-2 pr-8 bg-white border border-purple-200 focus:border-purple-400 text-[11px] font-medium text-gray-700 rounded outline-none transition-all placeholder:text-gray-400" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₺</span></div>
                                    </div>
                                )}
                                <CheckboxField
                                    checked={!!features.eksper_raporu_istiyorum}
                                    onChange={() => setFeature("eksper_raporu_istiyorum", !features.eksper_raporu_istiyorum)}
                                    label="Detaylı eksper raporu talep ediyorum"
                                    sub="Yetkili eksper tarafından hazırlanan teknik rapor" />
                            </div>
                        </div>
                    )}

                    <div className="bg-gray-50 border border-gray-200 rounded p-3">
                        <SectionHeader>FİNANSMAN TERCİHİ</SectionHeader>
                        <CheckboxField
                            checked={!!features.katilim_finansi}
                            onChange={() => setFeature("katilim_finansi", !features.katilim_finansi)}
                            label="Katılım finansına uygun satıcılarla eşleştir"
                            sub="Faizsiz finansman seçeneği sunan yetkili satıcılar"
                            color="green" />
                    </div>
                </div>
            )}

            {/* ── ADIM 3 ── */}
            {currentStep === 3 && (
                <div className="space-y-4">
                    <div>
                        <SectionHeader>BÜTÇE LİMİTLERİ</SectionHeader>
                        <div className="flex flex-col gap-1 text-left max-w-xs">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Maksimum Bütçe <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input type="text" inputMode="numeric" value={maxBudget ? Number(maxBudget).toLocaleString("tr-TR") : ""} onChange={e => setMaxBudget(sanitizePrice(e.target.value))} placeholder="ör. 1.500.000" className={`w-full px-3 py-2.5 pr-8 bg-gray-50 border text-xs font-medium text-gray-700 rounded outline-none focus:bg-white transition-all placeholder:text-gray-400 ${errors.maxBudget ? "border-red-400" : "border-gray-200 hover:border-gray-300 focus:border-purple-400"}`} />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₺</span>
                            </div>
                            {maxBudget && Number(maxBudget) > 0 && <p className="text-[10px] text-purple-700 font-bold">{Number(maxBudget).toLocaleString("tr-TR")} ₺</p>}
                            {errors.maxBudget && <p className="text-[10px] text-red-600 font-bold">{errors.maxBudget}</p>}
                        </div>
                    </div>

                    <div>
                        <SectionHeader>İLAN AKTİF KALMA SÜRESİ</SectionHeader>
                        <div className="flex gap-2">
                            {DURATION_PRESETS.map(({ label, hrs }) => {
                                const sel = duration.duration_hours === hrs
                                return <button key={hrs} type="button" onClick={() => setDurationHours(hrs)} className={`flex-1 py-1.5 rounded text-[10px] font-bold border transition-all ${sel ? "bg-purple-700 text-white border-purple-700 shadow-sm" : "bg-gray-50 text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50"}`}>{label}</button>
                            })}
                        </div>
                        {duration.expires_at && duration.duration_hours > 0 && (
                            <div className="mt-2.5 bg-purple-50 border border-purple-100 rounded px-3 py-2 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                                <span className="text-[10px] font-bold text-purple-800">{new Date(duration.expires_at).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })} tarihine kadar yayında kalacak</span>
                            </div>
                        )}
                    </div>

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

                    <div>
                        <SectionHeader>TALEP BAŞLIĞI & DETAYLI AÇIKLAMA</SectionHeader>
                        <div className="flex items-center gap-2 mb-1.5">
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                                   placeholder={selBrand ? [condition === "sifir" ? "Sıfır" : "2. El", katLabel, selBrand, selModel, selVersion].filter(Boolean).join(" ") + " arıyorum" : "Marka seçince otomatik oluşur..."}
                                   className={`flex-1 px-2.5 py-2 bg-gray-50 border text-[11px] font-medium text-gray-700 rounded outline-none focus:bg-white transition-all placeholder:text-gray-400 ${errors.title ? "border-red-400" : "border-gray-200 hover:border-gray-300 focus:border-purple-400"}`} />
                            {selBrand && (
                                <button type="button"
                                        onClick={() => setTitle([condition === "sifir" ? "Sıfır" : "2. El", katLabel, selBrand, selModel, selVersion].filter(Boolean).join(" ") + " arıyorum")}
                                        className="flex-shrink-0 flex items-center gap-1 px-2.5 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded text-[10px] font-bold transition-colors whitespace-nowrap">
                                    <RefreshCw size={10} /> Yenile
                                </button>
                            )}
                        </div>
                        {errors.title && <p className="text-[10px] text-red-600 font-bold mb-1.5">{errors.title}</p>}
                        <p className="text-[9px] font-bold text-gray-400 mb-1.5">Açıklama seçimlerinize göre otomatik oluşturulur — dilerseniz düzenleyebilirsiniz.</p>
                        <textarea
                            value={desc} onChange={e => setDesc(e.target.value)}
                            rows={5}
                            placeholder="Marka, model ve diğer özellikleri seçtikçe detaylı açıklama burada otomatik oluşur..."
                            className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-purple-400 focus:bg-white text-[11px] font-medium text-gray-700 rounded outline-none resize-none transition-all placeholder:text-gray-400 leading-relaxed" />
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <button type="button" onClick={onSubmit} disabled={submitting}
                                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white py-3.5 rounded text-xs font-bold uppercase tracking-wider transition-all shadow-sm">
                            {submitting
                                ? <><Loader2 size={15} className="animate-spin" /> Araç Talebi Gönderiliyor...</>
                                : <><CheckCircle size={15} /> Talebi Onaylı Vasıta Uzmanlarına Gönder</>}
                        </button>
                        <div className="flex items-start gap-2.5 mt-3.5 bg-purple-50/50 border border-purple-100 rounded p-3">
                            <AlertCircle size={14} className="text-purple-600 mt-0.5 flex-shrink-0" />
                            <p className="text-[10px] text-purple-800 font-semibold leading-relaxed">
                                Talep yayınlandığında, kriterlerinize birebir uyan onaylı galeri, plaza ve vasıta danışmanlarına anlık SMS, mobil push ve e-posta bildirimi gönderilerek teklif sunmaları sağlanır.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </FormShell>
    )
}