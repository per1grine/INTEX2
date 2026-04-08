import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  apiGetMlStatus,
  apiGetMlSummaries,
  apiPostMlRefresh,
  apiPostMlRetrain,
  type MlDomainSummary,
  type MlStatusResponse,
} from '../utils/api'
import { useAuth } from './auth'

type MlRefreshState = {
  status: MlStatusResponse | null
  summaries: Record<string, string>   // domain → summary text
  isRefreshing: boolean
  startRefresh: () => Promise<void>
  startRetrain: () => Promise<void>
  error: string | null
}

const MlRefreshContext = createContext<MlRefreshState | undefined>(undefined)

const POLL_INTERVAL_MS = 4000

export function MlRefreshProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const [status, setStatus] = useState<MlStatusResponse | null>(null)
  const [summaries, setSummaries] = useState<Record<string, string>>({})
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const fetchSummaries = useCallback(async () => {
    if (!token) return
    try {
      const rows = await apiGetMlSummaries(token)
      const map: Record<string, string> = {}
      rows.forEach((r: MlDomainSummary) => { map[r.domain] = r.summary })
      setSummaries(map)
    } catch {
      // silently ignore
    }
  }, [token])

  const prevStatusesRef = useRef<Record<string, string>>({})

  const fetchStatus = useCallback(async () => {
    if (!token) return
    try {
      const s = await apiGetMlStatus(token)
      setStatus(s)
      const nowRefreshing = s.isRefreshing || s.notebooks.some(n => n.status === 'running')
      setIsRefreshing(nowRefreshing)

      // If any notebook just completed since last poll, fetch summaries immediately
      // so the analysis text appears as soon as an explanatory notebook finishes.
      const prev = prevStatusesRef.current
      const anyNewlyComplete = s.notebooks.some(
        n => n.status === 'complete' && prev[n.notebook] !== 'complete'
      )
      if (anyNewlyComplete) {
        void fetchSummaries()
      }
      // Update prev
      const next: Record<string, string> = {}
      s.notebooks.forEach(n => { next[n.notebook] = n.status })
      prevStatusesRef.current = next

      if (!nowRefreshing) {
        stopPolling()
        setIsRefreshing(false)
      }
    } catch {
      // silently ignore — user may not be logged in
    }
  }, [token, stopPolling, fetchSummaries])

  const startPolling = useCallback(() => {
    stopPolling()
    pollRef.current = setInterval(() => { void fetchStatus() }, POLL_INTERVAL_MS)
  }, [fetchStatus, stopPolling])

  const startRefresh = useCallback(async () => {
    if (!token) return
    setError(null)
    try {
      await apiPostMlRefresh(token)
      setIsRefreshing(true)
      await fetchStatus()
      startPolling()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Refresh failed')
    }
  }, [token, fetchStatus, startPolling])

  const startRetrain = useCallback(async () => {
    if (!token) return
    setError(null)
    try {
      await apiPostMlRetrain(token)
      setIsRefreshing(true)
      await fetchStatus()
      startPolling()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Retrain failed')
    }
  }, [token, fetchStatus, startPolling])

  // On mount: fetch status and summaries; start polling if notebooks are already running.
  useEffect(() => {
    if (!token) return
    const init = async () => {
      if (!token) return
      try {
        const s = await apiGetMlStatus(token)
        void fetchSummaries()
        setStatus(s)
        const running = s.isRefreshing || s.notebooks.some(n => n.status === 'running')
        setIsRefreshing(running)
        if (running) startPolling()
      } catch {
        // not logged in yet — ignore
      }
    }
    void init()
    return stopPolling
  }, [token, startPolling, stopPolling, fetchSummaries])

  return (
    <MlRefreshContext.Provider value={{ status, summaries, isRefreshing, startRefresh, startRetrain, error }}>
      {children}
    </MlRefreshContext.Provider>
  )
}

export function useMlRefresh() {
  const ctx = useContext(MlRefreshContext)
  if (!ctx) throw new Error('useMlRefresh must be used within MlRefreshProvider')
  return ctx
}
