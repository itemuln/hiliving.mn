interface CatalogErrorStateProps {
  readonly onRetry: () => void
  readonly compact?: boolean
}

export function CatalogErrorState({ onRetry, compact = false }: CatalogErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex items-center justify-center border border-brand-100 bg-brand-50 px-6 text-center ${compact ? 'min-h-40' : 'min-h-72'}`}
    >
      <div>
        <h2 className="text-base font-medium text-neutral-700">Мэдээлэл ачаалж чадсангүй</h2>
        <p className="mt-2 text-sm text-neutral-500">Түр хүлээгээд дахин оролдоно уу.</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded bg-brand-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
        >
          Дахин оролдох
        </button>
      </div>
    </div>
  )
}
