import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Favorites from './pages/Favorites'
import Calendar from './pages/Calendar'
import NotificationsPage from './pages/Notifications'
import Settings from './pages/Settings'
import MatchDetails from './pages/MatchDetails'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-navy-950 safe-top">
      <Header />
      <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/match/:id" element={<MatchDetails />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
