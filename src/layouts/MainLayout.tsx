import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar/Navbar'

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar />
      <main className='pt-10'>
        <Outlet />
      </main>
    </div>
  )
}
