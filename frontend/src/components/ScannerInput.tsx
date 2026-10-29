import { useState } from 'react'
import { ArrowRight, Clipboard, X, Loader2 } from 'lucide-react'

interface ScannerInputProps {
  onScan: (url: string) => void
  loading: boolean
  error: string | null
}

export default function ScannerInput({ onScan, loading, error }: ScannerInputProps) {
  const [url, setUrl] = useState('')
  const [validationError, setValidationError] = useState('')

  const validate = (value: string): string => {
    if (!value.trim()) return 'Please enter or paste a web address.'
    if (value.trim().length < 4) return 'The address entered is too short.'
    if (value.trim().length > 2048) return 'The address exceeds 2,048 characters.'
    return ''
  }

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const err = validate(url)
    if (err) {
      setValidationError(err)
      return
    }
    setValidationError('')
    onScan(url.trim())
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        setUrl(text.trim())
        setValidationError('')
      }
    } catch {
      // Fallback
    }
  }

  const handleClear = () => {
    setUrl('')
    setValidationError('')
  }

  const displayError = validationError || error

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      <div className="relative flex items-center bg-[#16171d] border border-zinc-800/90 rounded-2xl shadow-sm focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-500 transition-all p-2">
        <input
          type="text"
          value={url}
          onChange={e => {
            setUrl(e.target.value)
            setValidationError('')
          }}
          onKeyDown={e => {
            if (e.key === 'Escape') handleClear()
          }}
          placeholder="Paste or type a web address (e.g. http://paypal-verify-account.com)..."
          className="w-full bg-transparent px-4 py-3.5 text-zinc-100 placeholder-zinc-500 text-sm sm:text-base focus:outline-none"
          aria-label="URL to scan"
          disabled={loading}
          autoFocus
          spellCheck={false}
        />

        <div className="flex items-center gap-2 pr-1.5">
          {url ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-2.5 text-zinc-500 hover:text-zinc-300 rounded-xl hover:bg-zinc-800/60 transition-colors"
              title="Clear address"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePaste}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800/60 hover:bg-zinc-800 rounded-xl border border-zinc-700/60 transition-colors"
              title="Paste from clipboard"
            >
              <Clipboard className="w-4 h-4" />
              <span>Paste</span>
            </button>
          )}

          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="btn-primary flex items-center gap-2 py-3 px-5 text-sm font-semibold rounded-xl"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Screening...</span>
              </>
            ) : (
              <>
                <span>Scan URL</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {displayError && (
        <div className="text-sm text-amber-300 bg-zinc-900/80 border border-zinc-700/80 rounded-xl px-4 py-2.5">
          {displayError}
        </div>
      )}
    </form>
  )
}
