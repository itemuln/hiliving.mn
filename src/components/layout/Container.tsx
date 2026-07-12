import type { PropsWithChildren } from 'react'

interface ContainerProps extends PropsWithChildren {
  className?: string
}

export function Container({ children, className = '' }: ContainerProps) {
  return <div className={`mx-auto w-full max-w-[1340px] px-4 sm:px-6 lg:px-10 ${className}`}>{children}</div>
}
