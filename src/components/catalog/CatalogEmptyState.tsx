interface CatalogEmptyStateProps {
  title: string
}

export function CatalogEmptyState({ title }: CatalogEmptyStateProps) {
  return (
    <div className="flex min-h-72 items-center justify-center border border-dashed border-neutral-300 bg-neutral-50 px-6 text-center">
      <div>
        <h2 className="text-lg font-medium text-neutral-700">{title}</h2>
        <p className="mt-2 text-sm text-neutral-500">Та бусад ангилал эсвэл брэндийг сонгоно уу.</p>
      </div>
    </div>
  )
}

