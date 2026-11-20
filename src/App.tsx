import { Shell } from './components/Shell'
import Analytics from './pages/Analytics'
import Equivalence from './pages/Equivalence'
import History from './pages/History'
import Matching from './pages/Matching'
import Notifications from './pages/Notifications'
import Optimization from './pages/Optimization'
import Overview from './pages/Overview'
import { Profile, SettingsPage } from './pages/System'
import Studio from './pages/Studio'
import Suppliers from './pages/Suppliers'
import { StoreProvider, useStore } from './store'

function Router() {
  const { route } = useStore()
  switch (route.page) {
    case 'suppliers':
      return <Suppliers />
    case 'studio':
      return <Studio />
    case 'matching':
      return <Matching />
    case 'equivalence':
      return <Equivalence />
    case 'optimization':
      return <Optimization />
    case 'analytics':
      return <Analytics />
    case 'history':
      return <History />
    case 'notifications':
      return <Notifications />
    case 'settings':
      return <SettingsPage />
    case 'profile':
      return <Profile />
    default:
      return <Overview />
  }
}

export default function App() {
  return (
    <StoreProvider>
      <Shell>
        <Router />
      </Shell>
    </StoreProvider>
  )
}
