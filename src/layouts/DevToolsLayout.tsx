import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar/Navbar'
import SidebarMenu from '../components/SidebarMenu/SidebarMenu'
import { DEVTOOLS_SIDEBAR_MENU } from '../constants/devtools-sidebar-menu'

export default function DevToolsLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="h-screen overflow-hidden bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar />
      <div className="h-[calc(100vh)] pt-14">
        <SidebarMenu title="Dev Tools" menuItems={DEVTOOLS_SIDEBAR_MENU}/>
        <button
          type="button"
          aria-expanded={mobileMenuOpen}
          aria-controls="dev-tools-mobile-navigation"
          onClick={() => setMobileMenuOpen(true)}
          className="fixed left-4 top-16 z-30 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-md dark:bg-gray-800 dark:text-white lg:hidden"
        >
          Dev Tools menu
        </button>
        {mobileMenuOpen && (
          <>
            <button
              type="button"
              aria-label="Close Dev Tools menu"
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            />
            <div id="dev-tools-mobile-navigation" className="lg:hidden">
              <SidebarMenu
                title="Dev Tools"
                menuItems={DEVTOOLS_SIDEBAR_MENU}
                mobile
                onNavigate={() => setMobileMenuOpen(false)}
              />
            </div>
          </>
        )}
        <main className="h-full pt-2 min-w-0 overflow-y-auto overflow-x-hidden lg:ml-72">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
