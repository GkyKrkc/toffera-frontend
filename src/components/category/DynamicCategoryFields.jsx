// ─────────────────────────────────────────────────────────────
// DynamicCategoryFields.jsx
// Bir YAPRAK kategorinin admin panelinde (Filament CategoryResource →
// "Form Alanları (Dinamik)") tanımlanan form_schema'sını okuyup, alan
// tipine göre karşılık gelen input'u otomatik render eder.
//
// Hem talep oluşturma (GenericDemandPage) hem de portföy ekleme
// (PortfolioCategoryPage) tarafında AYNI şema + AYNI bu bileşen
// kullanılır — böylece ör. "Cep Telefonu" talebi ile "Cep Telefonu"
// portföy kaydı birebir aynı alanları toplar ve karşılaştırılabilir
// olur (uzmanlar taleplere kendi portföylerinden teklif veriyor).
//
// schema: [{ label, key, type, required, options }]
//   type: text | textarea | number | select | radio | checkbox | date
//   options: sadece select/radio/checkbox için — string dizisi
// values:  { [key]: value }  — checkbox alanları dizi (string[]) tutar
// onChange: (key, value) => void
// errors:  { [key]: "hata metni" }
// ─────────────────────────────────────────────────────────────
import { ChevronDown } from "lucide-react"

function FieldLabel({ label, required }) {
    return (
        <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
    )
}

function fieldInputClass(hasError) {
    return `w-full px-3 py-2.5 bg-gray-50 hover:bg-white border text-xs font-medium text-gray-700 rounded outline-none focus:bg-white transition-all placeholder:text-gray-400 ${
        hasError ? "border-red-400" : "border-gray-200 hover:border-gray-300 focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
    }`
}

function ChipGroup({ options, isSelected, onToggle }) {
    return (
        <div className="flex flex-wrap gap-1.5">
            {options.map(o => {
                const sel = isSelected(o)
                return (
                    <button key={o} type="button" onClick={() => onToggle(o)}
                            className={`px-3 py-1.5 rounded text-[10px] font-bold border transition-all ${
                                sel ? "bg-purple-700 text-white border-purple-700 shadow-sm"
                                    : "bg-gray-50 text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50"
                            }`}>
                        {o}
                    </button>
                )
            })}
        </div>
    )
}

export default function DynamicCategoryFields({ schema = [], values = {}, onChange, errors = {} }) {
    if (!schema.length) return null

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {schema.map(field => {
                const val = values[field.key]
                const err = errors[field.key]
                const options = field.options || []

                if (field.type === "textarea") {
                    return (
                        <div key={field.key} className="flex flex-col gap-1 text-left sm:col-span-2">
                            <FieldLabel label={field.label} required={field.required} />
                            <textarea rows={3} value={val || ""} onChange={e => onChange(field.key, e.target.value)}
                                      className={`${fieldInputClass(err)} resize-none`} />
                            {err && <p className="text-[10px] text-red-600 font-bold">{err}</p>}
                        </div>
                    )
                }

                if (field.type === "select") {
                    return (
                        <div key={field.key} className="flex flex-col gap-1 text-left">
                            <FieldLabel label={field.label} required={field.required} />
                            <div className="relative">
                                <select value={val || ""} onChange={e => onChange(field.key, e.target.value)}
                                        className={`appearance-none cursor-pointer ${fieldInputClass(err)}`}>
                                    <option value="">Seçin...</option>
                                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                                <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                            {err && <p className="text-[10px] text-red-600 font-bold">{err}</p>}
                        </div>
                    )
                }

                if (field.type === "radio") {
                    return (
                        <div key={field.key} className="flex flex-col gap-1.5 text-left sm:col-span-2">
                            <FieldLabel label={field.label} required={field.required} />
                            <ChipGroup options={options} isSelected={o => val === o} onToggle={o => onChange(field.key, o)} />
                            {err && <p className="text-[10px] text-red-600 font-bold">{err}</p>}
                        </div>
                    )
                }

                if (field.type === "checkbox") {
                    const arr = Array.isArray(val) ? val : []
                    return (
                        <div key={field.key} className="flex flex-col gap-1.5 text-left sm:col-span-2">
                            <FieldLabel label={field.label} required={field.required} />
                            <ChipGroup options={options} isSelected={o => arr.includes(o)}
                                       onToggle={o => onChange(field.key, arr.includes(o) ? arr.filter(x => x !== o) : [...arr, o])} />
                            {err && <p className="text-[10px] text-red-600 font-bold">{err}</p>}
                        </div>
                    )
                }

                if (field.type === "date") {
                    return (
                        <div key={field.key} className="flex flex-col gap-1 text-left">
                            <FieldLabel label={field.label} required={field.required} />
                            <input type="date" value={val || ""} onChange={e => onChange(field.key, e.target.value)}
                                   className={fieldInputClass(err)} />
                            {err && <p className="text-[10px] text-red-600 font-bold">{err}</p>}
                        </div>
                    )
                }

                if (field.type === "number") {
                    return (
                        <div key={field.key} className="flex flex-col gap-1 text-left">
                            <FieldLabel label={field.label} required={field.required} />
                            <input type="text" inputMode="numeric" value={val || ""}
                                   onChange={e => onChange(field.key, e.target.value.replace(/[^0-9]/g, ""))}
                                   className={fieldInputClass(err)} />
                            {err && <p className="text-[10px] text-red-600 font-bold">{err}</p>}
                        </div>
                    )
                }

                // "text" (varsayılan)
                return (
                    <div key={field.key} className="flex flex-col gap-1 text-left">
                        <FieldLabel label={field.label} required={field.required} />
                        <input type="text" value={val || ""} onChange={e => onChange(field.key, e.target.value)}
                               className={fieldInputClass(err)} />
                        {err && <p className="text-[10px] text-red-600 font-bold">{err}</p>}
                    </div>
                )
            })}
        </div>
    )
}
