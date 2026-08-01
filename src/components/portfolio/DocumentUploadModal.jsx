import { useState, useRef } from "react"
import {
    X, Upload, Trash2, CheckSquare, Square, Loader2,
    FileText, FileImage, File, Eye, Download
} from "lucide-react"
import api from "@/lib/axios"
import { useToast } from "@/components/ui/Toast"

/**
 * Genel amaçlı döküman yükleme / listeleme modalı.
 * Ekspertiz belgeleri, tapu, sigorta vb. için kullanılır.
 *
 * Props:
 *  - item:     { id, title }           — ilgili portföy kaydı
 *  - onClose:  () => void
 *  - onUpdate: (documents[]) => void   — döküman listesi değiştiğinde bilgilendirir
 *  - basePath: string                  — varsayılan "/agent/portfolio"
 *  - initialDocuments: []              — başlangıç döküman listesi
 */

const ACCEPTED_TYPES = {
    "application/pdf":                  { ext: "PDF",  icon: FileText,  color: "text-red-500",    bg: "bg-red-50 border-red-100"       },
    "image/jpeg":                       { ext: "JPG",  icon: FileImage, color: "text-purple-500",  bg: "bg-purple-50 border-purple-100" },
    "image/jpg":                        { ext: "JPG",  icon: FileImage, color: "text-purple-500",  bg: "bg-purple-50 border-purple-100" },
    "image/png":                        { ext: "PNG",  icon: FileImage, color: "text-purple-500",  bg: "bg-purple-50 border-purple-100" },
    "image/webp":                       { ext: "WEBP", icon: FileImage, color: "text-purple-500",  bg: "bg-purple-50 border-purple-100" },
    "image/heic":                       { ext: "HEIC", icon: FileImage, color: "text-purple-500",  bg: "bg-purple-50 border-purple-100" },
    "application/msword":               { ext: "DOC",  icon: FileText,  color: "text-indigo-500",  bg: "bg-indigo-50 border-indigo-100" },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        { ext: "DOCX", icon: FileText,  color: "text-indigo-500", bg: "bg-indigo-50 border-indigo-100" },
    "application/vnd.ms-excel":         { ext: "XLS",  icon: FileText,  color: "text-green-500",  bg: "bg-green-50 border-green-100" },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        { ext: "XLSX", icon: FileText,  color: "text-green-500", bg: "bg-green-50 border-green-100" },
}

const MAX_SIZE_IMAGE = 5 * 1024 * 1024   // 5 MB
const MAX_SIZE_DOC   = 10 * 1024 * 1024  // 10 MB

const ACCEPT_ATTR = Object.keys(ACCEPTED_TYPES).join(",")

function formatBytes(bytes) {
    if (!bytes) return ""
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileMeta(mimeType) {
    return ACCEPTED_TYPES[mimeType] || { ext: "DOSYA", icon: File, color: "text-gray-500", bg: "bg-gray-50 border-gray-200" }
}

function isImage(mimeType) {
    return mimeType?.startsWith("image/")
}

function DocumentRow({ doc, checked, onToggle, onDelete, onPreview, deleting }) {
    const meta = getFileMeta(doc.mime_type || doc.type)
    const Icon = meta.icon

    return (
        <div className={`flex items-center gap-3 px-3 py-2.5 rounded border transition-all group ${
            checked ? "border-purple-400 bg-purple-50/50" : "border-gray-200 hover:border-gray-300"
        }`}>
            <button type="button" onClick={() => onToggle(doc.id)}
                    className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                        checked ? "bg-purple-600 border-purple-600" : "bg-white border-gray-300 hover:border-gray-400"
                    }`}>
                {checked && <CheckSquare size={12} className="text-white" />}
            </button>

            <div className={`w-9 h-9 rounded border flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                <Icon size={16} className={meta.color} />
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-800 truncate">{doc.name || doc.file_name || "Belge"}</p>
                <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${meta.bg} ${meta.color}`}>
            {meta.ext}
          </span>
                    {doc.size && <span className="text-[10px] text-gray-400">{formatBytes(doc.size)}</span>}
                    {doc.created_at && (
                        <span className="text-[10px] text-gray-400">
              {new Date(doc.created_at).toLocaleDateString("tr-TR")}
            </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {(isImage(doc.mime_type || doc.type) || (doc.mime_type || doc.type) === "application/pdf") && (
                    <button onClick={() => onPreview(doc)}
                            className="w-7 h-7 rounded bg-gray-100 hover:bg-purple-100 text-gray-500 hover:text-purple-600 flex items-center justify-center transition-colors">
                        <Eye size={13} />
                    </button>
                )}
                <a href={doc.url || doc.path} target="_blank" rel="noopener noreferrer"
                   className="w-7 h-7 rounded bg-gray-100 hover:bg-purple-100 text-gray-500 hover:text-purple-600 flex items-center justify-center transition-colors"
                   onClick={e => e.stopPropagation()}>
                    <Download size={13} />
                </a>
                <button onClick={() => onDelete(doc.id)} disabled={deleting}
                        className="w-7 h-7 rounded bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 flex items-center justify-center transition-colors disabled:opacity-40">
                    <Trash2 size={13} />
                </button>
            </div>
        </div>
    )
}

export default function DocumentUploadModal({ item, onClose, onUpdate, basePath = "/agent/portfolio", initialDocuments = [] }) {
    const toast = useToast()
    const fileInputRef = useRef(null)

    const [documents, setDocuments] = useState(initialDocuments)
    const [uploading, setUploading] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [selectedIds, setSelectedIds] = useState([])
    const [previewDoc, setPreviewDoc] = useState(null)
    const [dragOver, setDragOver] = useState(false)

    const updateDocuments = (next) => {
        setDocuments(next)
        onUpdate?.(next)
    }

    const validateFile = (file) => {
        if (!ACCEPTED_TYPES[file.type]) {
            toast({ message: `${file.name}: Desteklenmeyen dosya türü.`, type: "error" })
            return false
        }
        const limit = isImage(file.type) ? MAX_SIZE_IMAGE : MAX_SIZE_DOC
        if (file.size > limit) {
            const limitLabel = isImage(file.type) ? "5 MB" : "10 MB"
            toast({ message: `${file.name}: Dosya boyutu ${limitLabel} limitini aşıyor.`, type: "error" })
            return false
        }
        return true
    }

    const uploadFiles = async (files) => {
        const valid = Array.from(files).filter(validateFile)
        if (valid.length === 0) return
        setUploading(true)
        try {
            const formData = new FormData()
            valid.forEach(file => formData.append("documents[]", file))
            const res = await api.post(`${basePath}/${item.id}/documents`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            })
            const added = res.data.documents || res.data.data || res.data
            updateDocuments([...documents, ...(Array.isArray(added) ? added : [added])])
            toast({ message: `${valid.length} belge yüklendi.` })
        } catch {
            toast({ message: "Yükleme başarısız.", type: "error" })
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    const handleFileChange = (e) => uploadFiles(e.target.files)

    const handleDrop = (e) => {
        e.preventDefault()
        setDragOver(false)
        uploadFiles(e.dataTransfer.files)
    }

    const handleDeleteSingle = async (docId) => {
        if (!confirm("Bu belgeyi silmek istediğinize emin misiniz?")) return
        setDeleting(true)
        try {
            await api.delete(`${basePath}/${item.id}/documents/${docId}`)
            updateDocuments(documents.filter(d => d.id !== docId))
            setSelectedIds(prev => prev.filter(x => x !== docId))
            toast({ message: "Belge silindi." })
        } catch {
            toast({ message: "Belge silinemedi.", type: "error" })
        } finally { setDeleting(false) }
    }

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return
        if (!confirm(`${selectedIds.length} belgeyi silmek istediğinize emin misiniz?`)) return
        setDeleting(true)
        try {
            await api.post(`${basePath}/${item.id}/documents/bulk-delete`, { ids: selectedIds })
            updateDocuments(documents.filter(d => !selectedIds.includes(d.id)))
            setSelectedIds([])
            toast({ message: "Seçili belgeler silindi." })
        } catch {
            toast({ message: "Belgeler silinemedi.", type: "error" })
        } finally { setDeleting(false) }
    }

    const toggleSelect = (id) =>
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

    const toggleSelectAll = () =>
        setSelectedIds(prev => prev.length === documents.length ? [] : documents.map(d => d.id))

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
             onClick={onClose}>
            <div onClick={e => e.stopPropagation()}
                 className="bg-white rounded-sm shadow-2xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col">

                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                    <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-purple-700 mb-0.5">Eksper Dökümanları</p>
                        <h3 className="text-sm font-bold text-gray-800">{item?.title || "Belge Yönetimi"}</h3>
                    </div>
                    <button onClick={onClose}
                            className="w-8 h-8 rounded flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">

                    <div onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                         onDragLeave={() => setDragOver(false)}
                         onDrop={handleDrop}
                         onClick={() => !uploading && fileInputRef.current?.click()}
                         className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-sm py-6 cursor-pointer transition-all ${
                             dragOver ? "border-purple-400 bg-purple-50" : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/30"
                         }`}>
                        <input ref={fileInputRef} type="file" accept={ACCEPT_ATTR}
                               multiple onChange={handleFileChange} className="hidden" disabled={uploading} />
                        {uploading ? (
                            <Loader2 size={22} className="text-purple-600 animate-spin" />
                        ) : (
                            <Upload size={22} className={dragOver ? "text-purple-500" : "text-gray-400"} />
                        )}
                        <p className="text-xs font-bold text-gray-600">
                            {uploading ? "Yükleniyor..." : dragOver ? "Bırakın..." : "Dosya yüklemek için tıklayın veya sürükleyin"}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap justify-center">
                            {["PDF", "JPG", "PNG", "WEBP", "DOC", "DOCX", "XLS"].map(t => (
                                <span key={t} className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{t}</span>
                            ))}
                        </div>
                        <p className="text-[10px] text-gray-400">Görsel max 5 MB · PDF/Belge max 10 MB</p>
                    </div>

                    {documents.length > 0 && (
                        <div className="flex items-center justify-between">
                            <button onClick={toggleSelectAll}
                                    className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 hover:text-gray-700 transition-colors">
                                {selectedIds.length === documents.length
                                    ? <CheckSquare size={13} className="text-purple-600" />
                                    : <Square size={13} />}
                                Tümünü Seç ({documents.length})
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

                    {documents.length === 0 ? (
                        <div className="text-center py-10">
                            <div className="w-12 h-12 bg-gray-50 border border-gray-200 rounded flex items-center justify-center mx-auto mb-3">
                                <FileText size={20} className="text-gray-300" />
                            </div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Henüz belge yok</p>
                            <p className="text-[11px] text-gray-400 mt-1">Ekspertiz raporları, tapu, sigorta belgelerini yükleyin.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {documents.map(doc => (
                                <DocumentRow key={doc.id} doc={doc}
                                             checked={selectedIds.includes(doc.id)}
                                             onToggle={toggleSelect}
                                             onDelete={handleDeleteSingle}
                                             onPreview={setPreviewDoc}
                                             deleting={deleting} />
                            ))}
                        </div>
                    )}
                </div>

                <div className="px-5 py-3.5 border-t border-gray-200 bg-gray-50 flex justify-end flex-shrink-0">
                    <button onClick={onClose}
                            className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 border border-gray-200 hover:bg-gray-100 rounded transition-colors">
                        Kapat
                    </button>
                </div>
            </div>

            {previewDoc && (
                <div className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-4"
                     onClick={() => setPreviewDoc(null)}>
                    <button onClick={() => setPreviewDoc(null)}
                            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
                        <X size={20} />
                    </button>

                    <div onClick={e => e.stopPropagation()} className="w-full max-w-3xl max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-white text-xs font-bold truncate">{previewDoc.name || previewDoc.file_name}</p>
                            <a href={previewDoc.url || previewDoc.path} target="_blank" rel="noopener noreferrer"
                               className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold px-3 py-1.5 rounded transition-colors ml-4 flex-shrink-0">
                                <Download size={12} /> İndir
                            </a>
                        </div>

                        {isImage(previewDoc.mime_type || previewDoc.type) ? (
                            <img src={previewDoc.url || previewDoc.path} alt={previewDoc.name} className="max-h-[78vh] object-contain rounded" />
                        ) : (
                            <iframe src={previewDoc.url || previewDoc.path} title={previewDoc.name} className="w-full h-[78vh] rounded bg-white" />
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}