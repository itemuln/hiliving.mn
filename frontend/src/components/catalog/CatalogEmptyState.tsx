interface CatalogEmptyStateProps {
  readonly title: string
  readonly description?: string
  readonly compact?: boolean
}

export function CatalogEmptyState({
  title,
  description = 'Та бусад ангилал эсвэл брэндийг сонгоно уу.',
  compact = false,
}: CatalogEmptyStateProps) {
  return (
    <div className={`flex items-center justify-center border border-dashed border-neutral-300 bg-neutral-50 px-6 text-center ${compact ? 'min-h-40' : 'min-h-72'}`}>
      <div>
        <h2 className="text-lg font-medium text-neutral-700">{title}</h2>
        <p className="mt-2 text-sm text-neutral-500">{description}</p>
      </div>
    </div>
  )
}
