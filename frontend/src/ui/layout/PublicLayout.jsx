import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { PublicNavbar } from '../navigation/PublicNavbar.jsx'

export function PublicLayout() {
  const location = useLocation()

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (location.hash) {
        const target = document.getElementById(location.hash.slice(1))
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }

      window.scrollTo(0, 0)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [location.pathname, location.hash])

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1440px] flex-col">
        <PublicNavbar />
        <main className="flex-1 pt-5 sm:pt-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
