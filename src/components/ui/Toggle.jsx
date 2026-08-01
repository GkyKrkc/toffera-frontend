// Küçük, yeniden kullanılabilir açma/kapama anahtarı.
// AddressManager'daki "varsayılan adres" anahtarıyla aynı görsel dilde.
export default function Toggle({ checked, onChange, disabled = false }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => !disabled && onChange(!checked)}
            className={`w-9 h-5 rounded-full transition-all relative flex-shrink-0 ${
                disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
            } ${checked ? "bg-purple-600" : "bg-gray-200"}`}
        >
            <span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all shadow-sm ${checked ? "left-[19px]" : "left-[3px]"}`} />
        </button>
    )
}