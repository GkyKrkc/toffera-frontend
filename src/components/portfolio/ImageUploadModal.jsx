import { useState, useRef, useEffect } from "react"
import {
    X, Trash2, CheckSquare, Square,
    ChevronLeft, ChevronRight, Loader2, ImagePlus
} from "lucide-react"
import api from "@/lib/axios"
import { useToast } from "@/components/ui/Toast"

/**
 * Seçilen resmi tarayıcıda işler:
 *  1) Ortadan 1:1 (kare) oranında kırpar
 *  2) Sağ alt köşeye soluk/yarı saydam bir filigran ekler
 *  3) JPEG'e (kalite 0.85) çevirip File nesnesi olarak döner
 *
 * Portföydeki tüm resimler (vasıta + gayrimenkul) bu tek fonksiyondan
 * geçtiği için filigran hem galericinin kendi galerisinde hem de
 * müşteri tarafındaki vitrin/modal görünümünde aynı şekilde görünür —
 * çünkü filigran dosyanın kendisine gömülüyor, ayrı bir katman değil.
 */
function processImageForUpload(file, { size = 1600, watermarkText = "teklifmeydani.com" } = {}) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            const img = new Image()
            img.onload = () => {
                const srcW = img.width
                const srcH = img.height
                const side = Math.min(srcW, srcH)
                const sx = (srcW - side) / 2
                const sy = (srcH - side) / 2

                const canvas = document.createElement("canvas")
                canvas.width = size
                canvas.height = size
                const ctx = canvas.getContext("2d")
                ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size)

                // Filigran — sağ alt köşe, soluk/yarı saydam, her boyuttaki
                // resimde okunaklı olsun diye hafif gölgeli.
                const fontSize = Math.round(size * 0.032)
                const padding = Math.round(size * 0.028)
                ctx.font = `700 ${fontSize}px Arial, sans-serif`
                ctx.textAlign = "right"
                ctx.textBaseline = "bottom"
                ctx.shadowColor = "rgba(0,0,0,0.45)"
                ctx.shadowBlur = 6
                ctx.globalAlpha = 0.5
                ctx.fillStyle = "#ffffff"
                ctx.fillText(watermarkText, size - padding, size - padding)
                ctx.globalAlpha = 1
                ctx.shadowBlur = 0

                canvas.toBlob(
                    (blob) => {
                        if (!blob) return reject(new Error("Görsel işlenemedi."))
                        const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg"
                        resolve(new File([blob], newName, { type: "image/jpeg" }))
                    },
                    "image/jpeg",
                    0.85
                )
            }
            img.onerror = () => reject(new Error("Görsel yüklenemedi."))
            img.src = e.target.result
        }
        reader.onerror = () => reject(new Error("Dosya okunamadı."))
        reader.readAsDataURL(file)
    })
}

/**
 * Genel amaçlı resim yükleme / galeri modalı.
 * Vasıta ve Gayrimenkul portföylerinde ortak kullanılır.
 *
 * Props:
 *  - item:     { id, images: [...] }  — düzenlenen portföy kaydı
 *  - onClose:  () => void
 *  - onUpdate: (images[]) => void     — resim listesi değiştiğinde üst bileşeni bilgilendirir
 *  - basePath: string (opsiyonel)     — varsayılan "/agent/portfolio"
 */
export default function ImageUploadModal({ item, onClose, onUpdate, basePath = "/agent/portfolio" }) {
    const toast = useToast()
    const fileInputRef = useRef(null)

    const [images, setImages] = useState(item?.images || [])
    const [uploading, setUploading] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [selectedIds, setSelectedIds] = useState([])
    const [lightboxIndex, setLightboxIndex] = useState(null)
    const [fetchingImages, setFetchingImages] = useState(false)

    // Modal açılınca API'den güncel resimleri çek
    useEffect(() => {
        if (!item?.id) return
        setFetchingImages(true)
        api.get(`${basePath}/${item.id}`)
            .then(res => {
                const data = res.data.data || res.data
                setImages(data.images || [])
            })
            .catch(() => setImages(item?.images || []))
            .finally(() => setFetchingImages(false))
    }, [item?.id])

    const getImageUrl = (img) => img?.url || img?.path || img?.full_url || img

    const updateImages = (next) => {
        setImages(next)
        onUpdate?.(next)
    }

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return
        setUploading(true)
        try {
            // Yüklemeden önce her resmi 1:1 kırp + filigran ekle
            const processedFiles = await Promise.all(files.map(file => processImageForUpload(file)))

            const formData = new FormData()
            processedFiles.forEach(file => formData.append("images[]", file))

            const res = await api.post(`${basePath}/${item.id}/images`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            })
            const newImages = res.data.images || []
            updateImages([...images, ...newImages])
            toast({ message: "Fotoğraflar yüklendi." })
        } catch {
            toast({ message: "Yükleme başarısız.", type: "error" })
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    const handleDeleteSingle = async (imgId) => {
        if (!confirm("Bu fotoğrafı silmek istediğinize emin misiniz?")) return
        setDeleting(true)
        try {
            await api.delete(`${basePath}/${item.id}/images/${imgId}`)
            const next = images.filter(img => img.id !== imgId)
            updateImages(next)
            setSelectedIds(prev => prev.filter(x => x !== imgId))
            setLightboxIndex(null)
            toast({ message: "Fotoğraf silindi." })
        } catch {
            toast({ message: "Fotoğraf silinemedi.", type: "error" })
        } finally { setDeleting(false) }
    }

    const toggleSelect = (id) =>
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

    const toggleSelectAll = () =>
        setSelectedIds(prev => prev.length === images.length ? [] : images.map(img => img.id))

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return
        if (!confirm(`${selectedIds.length} fotoğrafı silmek istediğinize emin misiniz?`)) return
        setDeleting(true)
        try {
            await api.post(`${basePath}/${item.id}/images/bulk-delete`, { ids: selectedIds })
            const next = images.filter(img => !selectedIds.includes(img.id))
            updateImages(next)
            setSelectedIds([])
            toast({ message: "Seçili fotoğraflar silindi." })
        } catch {
            toast({ message: "Fotoğraflar silinemedi.", type: "error" })
        } finally { setDeleting(false) }
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
             onClick={onClose}>
            <div onClick={e => e.stopPropagation()}
                 className="bg-white rounded-sm shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                    <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-purple-700 mb-0.5">Fotoğraf Galerisi</p>
                        <h3 className="text-sm font-bold text-gray-800">{item?.title || "İlan Fotoğrafları"}</h3>
                    </div>
                    <button onClick={onClose}
                            className="w-8 h-8 rounded flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* İçerik */}
                <div className="flex-1 overflow-y-auto p-5">

                    {/* Yükleme alanı */}
                    <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-purple-300 hover:bg-purple-50/30 rounded-sm py-6 cursor-pointer transition-all mb-4">
                        <input ref={fileInputRef} type="file" accept="image/*" multiple
                               onChange={handleFileChange} className="hidden" disabled={uploading} />
                        {uploading ? (
                            <Loader2 size={20} className="text-purple-600 animate-spin" />
                        ) : (
                            <ImagePlus size={20} className="text-gray-400" />
                        )}
                        <p className="text-xs font-bold text-gray-600">
                            {uploading ? "Yükleniyor..." : "Fotoğraf eklemek için tıklayın"}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium">PNG, JPG — birden fazla seçebilirsiniz, kare (1:1) kırpılır</p>
                    </label>

                    {images.length > 0 && (
                        <div className="flex items-center justify-between mb-3">
                            <button onClick={toggleSelectAll}
                                    className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 hover:text-gray-700 transition-colors">
                                {selectedIds.length === images.length
                                    ? <CheckSquare size={13} className="text-purple-600" />
                                    : <Square size={13} />}
                                Tümünü Seç ({images.length})
                            </button>
                            {selectedIds.length > 0 && (
                                <button onClick={handleDeleteSelected} disabled={deleting}
                                        className="flex items-center gap-1.5 text-[10px] font-bold text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors">
                                    {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                    Seçilenleri Sil ({selectedIds.length})
                                </button>
                            )}
                        </div>
                    )}

                    {fetchingImages ? (
                        <div className="grid grid-cols-3 gap-2">
                            {[1, 2, 3].map(i => <div key={i} className="aspect-square rounded bg-gray-100 animate-pulse" />)}
                        </div>
                    ) : images.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Henüz fotoğraf yok</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-2">
                            {images.map((img, i) => {
                                const checked = selectedIds.includes(img.id)
                                return (
                                    <div key={img.id || i}
                                         className={`relative aspect-square rounded overflow-hidden border bg-gray-50 group transition-all ${
                                             checked ? "border-purple-500 ring-2 ring-purple-200" : "border-gray-200 hover:border-gray-300"
                                         }`}>
                                        <img src={getImageUrl(img)} alt={`Fotoğraf ${i + 1}`}
                                             onClick={() => setLightboxIndex(i)}
                                             className="w-full h-full object-cover cursor-pointer" />

                                        <button onClick={e => { e.stopPropagation(); toggleSelect(img.id) }}
                                                className={`absolute top-1.5 left-1.5 w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                                                    checked ? "bg-purple-600 border-purple-600" : "bg-white/80 border-gray-300 hover:bg-white"
                                                }`}>
                                            {checked && <CheckSquare size={12} className="text-white" />}
                                        </button>

                                        <button onClick={e => { e.stopPropagation(); handleDeleteSingle(img.id) }}
                                                className="absolute top-1.5 right-1.5 w-6 h-6 rounded bg-black/50 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3.5 border-t border-gray-200 bg-gray-50 flex justify-end flex-shrink-0">
                    <button onClick={onClose}
                            className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 border border-gray-200 hover:bg-gray-100 rounded transition-colors">
                        Kapat
                    </button>
                </div>
            </div>

            {/* Lightbox */}
            {lightboxIndex !== null && images[lightboxIndex] && (
                <div className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-4"
                     onClick={() => setLightboxIndex(null)}>
                    <button onClick={() => setLightboxIndex(null)}
                            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
                        <X size={20} />
                    </button>

                    {images.length > 1 && (
                        <>
                            <button onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i - 1 + images.length) % images.length) }}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
                                <ChevronLeft size={20} />
                            </button>
                            <button onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i + 1) % images.length) }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </>
                    )}

                    <img src={getImageUrl(images[lightboxIndex])}
                         alt={`Fotoğraf ${lightboxIndex + 1}`}
                         onClick={e => e.stopPropagation()}
                         className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" />

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                        <span className="text-white/70 text-xs font-bold">{lightboxIndex + 1} / {images.length}</span>
                        <button onClick={e => { e.stopPropagation(); handleDeleteSingle(images[lightboxIndex].id) }}
                                disabled={deleting}
                                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors">
                            {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Sil
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}