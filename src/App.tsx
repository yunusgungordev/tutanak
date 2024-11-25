import DashboardPage from "@/dashboard/page"
import { TimelineProvider } from "@/contexts/timeline-context"

function App() {
  return (
    <div className="min-h-screen bg-background">
      <TimelineProvider>
        <DashboardPage />
      </TimelineProvider>
    </div>
  )
}

export default App
