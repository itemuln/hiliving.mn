import { useCallback, useEffect, useState } from 'react'
import { CatalogApiError } from '../../api/catalogApi'

interface ResourceState<T> {
  readonly data: T | null
  readonly error: CatalogApiError | null
  readonly status: 'loading' | 'success' | 'error'
}

export function useCatalogResource<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<ResourceState<T>>({ data: null, error: null, status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setState({ data: null, error: null, status: 'loading' })

    load(controller.signal)
      .then((data) => {
        if (active) setState({ data, error: null, status: 'success' })
      })
      .catch((error: unknown) => {
        if (!active || controller.signal.aborted || (error instanceof CatalogApiError && error.kind === 'aborted')) return
        const safeError = error instanceof CatalogApiError
          ? error
          : new CatalogApiError('unavailable', { cause: error })
        setState({ data: null, error: safeError, status: 'error' })
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [attempt, load])

  const retry = useCallback(() => setAttempt((current) => current + 1), [])

  return { ...state, retry }
}
