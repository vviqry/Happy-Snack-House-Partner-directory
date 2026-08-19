import { useCallback, useEffect, useState } from 'react'
import PublicDirectory from './pages/PublicDirectory'
import AdminPanel from './pages/AdminPanel'
import AdminModal from './components/AdminModal'
import { isAdminSession, startAdminSession } from './services/authService'

function isDesktopPointer(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable
}

export default function App() {
  const [adminMode, setAdminMode] = useState(() => isAdminSession())
  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isCtrlX = e.ctrlKey && (e.key === 'x' || e.key === 'X')
      if (!isCtrlX) return
      if (!isDesktopPointer()) return
      if (isTypingTarget(e.target)) return
      if (adminMode) return

      e.preventDefault()
      setPinModalOpen(true)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [adminMode])

  const handleAdminSuccess = useCallback(() => {
    startAdminSession()
    setAdminMode(true)
    setPinModalOpen(false)
  }, [])

  const handleDataChanged = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  const handleLogout = useCallback(() => {
    setAdminMode(false)
    setRefreshKey((k) => k + 1)
  }, [])

  return (
    <>
      {adminMode ? (
        <AdminPanel onDataChanged={handleDataChanged} onLogout={handleLogout} />
      ) : (
        <PublicDirectory
          refreshKey={refreshKey}
          onOpenAdmin={() => setPinModalOpen(true)}
        />
      )}

      {pinModalOpen && (
        <AdminModal onSuccess={handleAdminSuccess} onClose={() => setPinModalOpen(false)} />
      )}
    </>
  )
}
