export function CatalogNavigationSkeleton() {
  return (
    <div aria-label="Каталогийн цэс ачаалж байна" role="status" className="animate-pulse space-y-2">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} aria-hidden="true" className="h-11 bg-neutral-100" />
      ))}
      <span className="sr-only">Каталогийн цэс ачаалж байна.</span>
    </div>
  )
}
