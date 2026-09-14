import { useRef, useState, type ChangeEvent } from 'react'
import { UploadCloud, FileText, Image as ImageIcon, X, CheckCircle2 } from 'lucide-react'
import { validateFile, cn, sanitizeFilename, type FileValidation } from '../../lib/utils'

/**
 * Drag & drop / click file picker with client-side type + size validation.
 * The chosen File is passed up via onChange — the parent decides when and
 * where to upload (Supabase storage).
 */
export function FileUpload({
  label,
  hint,
  accept,
  maxSizeMB,
  file,
  onFile,
  onClear,
  error,
  required,
}: {
  label: string
  hint?: string
  accept: string[]
  maxSizeMB: number
  file: File | null
  onFile: (file: File | null) => void
  onClear?: () => void
  error?: string
  required?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  function handleFile(f: File | undefined) {
    if (!f) return
    const problem = validateFile(f, { accept, maxSizeMB })
    if (problem) {
      setLocalError(problem)
      return
    }
    setLocalError(null)
    onFile(f)
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    handleFile(e.target.files?.[0])
    e.target.value = ''
  }

  const shown = file ?? null
  const fileName = shown ? sanitizeFilename(shown.name) : null

  return (
    <div>
      <span className="label">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {shown ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5 text-sm text-emerald-900">
            {(shown.type === 'application/pdf' || (shown.name.split('.').pop() || '').toLowerCase() === 'pdf') ? (
              <FileText size={18} className="shrink-0 text-emerald-600" />
            ) : (
              <ImageIcon size={18} className="shrink-0 text-emerald-600" />
            )}
            <span className="truncate font-semibold">{fileName}</span>
            <span className="hidden shrink-0 text-xs text-emerald-700 sm:inline">
              ({(shown.size / 1024 / 1024).toFixed(2)} MB)
            </span>
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
          </div>
          <button
            type="button"
            onClick={() => {
              onFile(null)
              onClear?.()
            }}
            className="shrink-0 rounded-md p-1 text-emerald-700 transition-colors hover:bg-emerald-100"
            aria-label={`Remove ${label}`}
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            handleFile(e.dataTransfer.files?.[0])
          }}
          className={cn(
            'flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors',
            dragOver
              ? 'border-navy-600 bg-navy-50'
              : localError || error
                ? 'border-red-300 bg-red-50/40 hover:border-red-400'
                : 'border-slate-300 bg-slate-50 hover:border-navy-400 hover:bg-navy-50/50',
          )}
        >
          <UploadCloud size={26} className="text-navy-600" />
          <span className="text-sm font-semibold text-navy-900">Click to upload or drag & drop</span>
          <span className="text-xs text-slate-500">
            {accept.join(', ').replace(/\./g, '.').toUpperCase()} · max {maxSizeMB} MB
          </span>
        </button>
      )}
      <input ref={inputRef} type="file" accept={accept.join(',')} className="hidden" onChange={handleChange} />
      {hint && !error && !localError && !shown && <p className="help-text">{hint}</p>}
      {(localError || error) && (
        <p className="error-text" role="alert">
          {localError || error}
        </p>
      )}
    </div>
  )
}
