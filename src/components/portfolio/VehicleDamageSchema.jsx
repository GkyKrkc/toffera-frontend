import { useMemo } from "react"

const PARCALAR = [
    { key: "on_tampon",         label: "Ön Tampon"          },
    { key: "on_kaput",          label: "Ön Kaput"           },
    { key: "sol_on_camurluk",   label: "Sol Ön Çamurluk"    },
    { key: "sag_on_camurluk",   label: "Sağ Ön Çamurluk"    },
    { key: "sol_on_kapi",       label: "Sol Ön Kapı"        },
    { key: "sag_on_kapi",       label: "Sağ Ön Kapı"        },
    { key: "tavan",             label: "Tavan"              },
    { key: "sol_arka_kapi",     label: "Sol Arka Kapı"      },
    { key: "sag_arka_kapi",     label: "Sağ Arka Kapı"      },
    { key: "sol_arka_camurluk", label: "Sol Arka Çamurluk"  },
    { key: "sag_arka_camurluk", label: "Sağ Arka Çamurluk"  },
    { key: "bagaj",             label: "Bagaj Kapağı"       },
    { key: "arka_tampon",       label: "Arka Tampon"        },
    { key: "direkler",          label: "Direkler (A/B/C)"   },
]

const DURUMLAR = [
    { value: "orijinal",     label: "Orj.",  color: "text-gray-500",   bg: "bg-gray-100",   dot: "bg-gray-400"   },
    { value: "lokal_boyali", label: "Lokal", color: "text-amber-700",  bg: "bg-amber-50",   dot: "bg-amber-400"  },
    { value: "boyali",       label: "Boya",  color: "text-purple-700", bg: "bg-purple-50",  dot: "bg-purple-600" },
    { value: "degisen",      label: "Değ.",  color: "text-red-700",    bg: "bg-red-50",     dot: "bg-red-600"    },
]

export default function VehicleDamageSchema({ value = {}, onChange }) {
    // "Boyalı" (tam boya) ve "Lokal" (lokal boya) FARKLI durumlardır — ayrı
    // sayaçlarda tutulup ayrı gösterilmeli, tek bir "boyalı" rakamı altında
    // birleştirilmemeli.
    const { boyaliSayisi, lokalSayisi, degisenSayisi } = useMemo(() => {
        let b = 0, l = 0, d = 0
        Object.values(value).forEach(v => {
            if (v === "boyali") b++
            if (v === "lokal_boyali") l++
            if (v === "degisen") d++
        })
        return { boyaliSayisi: b, lokalSayisi: l, degisenSayisi: d }
    }, [value])

    const set = (key, durum) => {
        const next = { ...value }
        if (durum === "orijinal") delete next[key]
        else next[key] = durum
        onChange(next)
    }

    return (
        <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3 pb-2 border-b border-gray-100">
                HASAR & BOYA DURUMU
            </p>

            {/* Başlık satırı */}
            <div className="grid gap-0 mb-1" style={{ gridTemplateColumns: "1fr repeat(4, 52px)" }}>
                <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400 pl-2 pb-1">Parça</div>
                {DURUMLAR.map(d => (
                    <div key={d.value} className="flex flex-col items-center gap-1 pb-1">
                        <div className={`w-2.5 h-2.5 rounded-full ${d.dot}`} />
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${d.color}`}>{d.label}</span>
                    </div>
                ))}
            </div>

            {/* Parça satırları */}
            <div className="flex flex-col gap-0.5">
                {PARCALAR.map((p, i) => {
                    const current = value[p.key] || "orijinal"
                    const aktifDurum = DURUMLAR.find(d => d.value === current)
                    return (
                        <div key={p.key}
                             className={`grid items-center rounded py-1.5 transition-colors ${
                                 current !== "orijinal" ? aktifDurum.bg : i % 2 === 0 ? "bg-gray-50" : "bg-white"
                             }`}
                             style={{ gridTemplateColumns: "1fr repeat(4, 52px)" }}>
              <span className={`text-[11px] font-bold pl-2 leading-tight ${
                  current !== "orijinal" ? aktifDurum.color : "text-gray-700"
              }`}>
                {p.label}
              </span>
                            {DURUMLAR.map(d => {
                                const sel = current === d.value
                                return (
                                    <div key={d.value} className="flex justify-center">
                                        <button
                                            type="button"
                                            onClick={() => set(p.key, d.value)}
                                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                                sel ? `${d.dot} border-transparent` : "bg-white border-gray-200 hover:border-gray-300"
                                            }`}
                                        >
                                            {sel && <div className="w-2 h-2 rounded-full bg-white" />}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    )
                })}
            </div>

            {/* Özet sayaçlar — Boya, Lokal ve Değişen birbirinden farklı
                durumlar olduğu için ayrı ayrı ve numaralı gösteriliyor. */}
            {(boyaliSayisi > 0 || lokalSayisi > 0 || degisenSayisi > 0) && (
                <div className="mt-3 flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                    {boyaliSayisi > 0 && (
                        <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded">
                            <div className="w-2 h-2 rounded-full bg-purple-600" />
                            <span className="text-[11px] font-bold text-purple-800">1. Boya: {boyaliSayisi} parça</span>
                        </div>
                    )}
                    {lokalSayisi > 0 && (
                        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded">
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                            <span className="text-[11px] font-bold text-amber-800">2. Lokal Boya: {lokalSayisi} parça</span>
                        </div>
                    )}
                    {degisenSayisi > 0 && (
                        <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 px-3 py-1.5 rounded">
                            <div className="w-2 h-2 rounded-full bg-red-600" />
                            <span className="text-[11px] font-bold text-red-800">3. Değişen: {degisenSayisi} parça</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}