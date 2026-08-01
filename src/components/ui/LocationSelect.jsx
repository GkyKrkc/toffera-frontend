import { MapPin, ChevronDown, Loader2 } from "lucide-react"

function SelectBox({ label, value, onChange, options, loading, disabled, placeholder, required }) {
    return (
        <div className="flex flex-col gap-1">
            {label && (
                <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="relative">
                <select
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    disabled={disabled || loading}
                    className="w-full appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded text-[11px] font-medium bg-gray-50 hover:bg-white outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-gray-700"
                >
                    <option value="">{loading ? "Yükleniyor..." : placeholder}</option>
                    {options.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    {loading
                        ? <Loader2 size={13} className="text-gray-400 animate-spin" />
                        : <ChevronDown size={13} className="text-gray-400" />}
                </div>
            </div>
        </div>
    )
}

export default function LocationSelect({
                                           provinces, districts, neighborhoods,
                                           selectedProvince, selectedDistrict, selectedNeighborhood,
                                           setSelectedProvince, setSelectedDistrict, setSelectedNeighborhood,
                                           loadingProv, loadingDist, loadingNeigh,
                                           showNeighborhood = true,
                                           required = false,
                                       }) {
    const handleProvince = (id) => setSelectedProvince(provinces.find(p => String(p.id) === id) || null)
    const handleDistrict = (id) => setSelectedDistrict(districts.find(d => String(d.id) === id) || null)
    const handleNeighborhood = (id) => setSelectedNeighborhood(neighborhoods.find(n => String(n.id) === id) || null)

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
                <MapPin size={12} className="text-purple-500" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Konum</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                <SelectBox
                    label="İl" value={selectedProvince?.id || ""} onChange={handleProvince}
                    options={provinces} loading={loadingProv} placeholder="İl seçin" required={required}
                />
                <SelectBox
                    label="İlçe" value={selectedDistrict?.id || ""} onChange={handleDistrict}
                    options={districts} loading={loadingDist} disabled={!selectedProvince}
                    placeholder={selectedProvince ? "İlçe seçin" : "Önce il seçin"}
                />
                {showNeighborhood && (
                    <SelectBox
                        label="Mahalle" value={selectedNeighborhood?.id || ""} onChange={handleNeighborhood}
                        options={neighborhoods} loading={loadingNeigh} disabled={!selectedDistrict}
                        placeholder={selectedDistrict ? "Mahalle seçin" : "Önce ilçe seçin"}
                    />
                )}
            </div>
        </div>
    )
}