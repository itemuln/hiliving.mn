interface ProductGridSkeletonProps {
  readonly count?: number;
  readonly className?: string;
}

export function ProductGridSkeleton({ count = 8, className = '' }: ProductGridSkeletonProps) {
  return (
    <div
      aria-label="Бүтээгдэхүүн ачаалж байна"
      role="status"
      className={`grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5 md:gap-y-12 xl:grid-cols-4 ${className}`}
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="min-w-0 animate-pulse" aria-hidden="true">
          <div className="aspect-square rounded-sm bg-neutral-100" />
          <div className="mt-3 h-3 w-full rounded bg-neutral-100" />
          <div className="mt-2 h-3 w-3/4 rounded bg-neutral-100" />
          <div className="mt-3 h-4 w-2/3 rounded bg-neutral-100" />
        </div>
      ))}
      <span className="sr-only">Бүтээгдэхүүний мэдээлэл ачаалж байна.</span>
    </div>
  );
}
