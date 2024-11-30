import { TimelineProvider } from "@/contexts/timeline-context"
import DashboardPage from "@/dashboard/page"

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
