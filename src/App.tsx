import { ThemeProvider } from "@/components/theme-provider"
import DashboardPage from "@/dashboard/page"

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="min-h-screen bg-background">
        <DashboardPage />
      </div>
    </ThemeProvider>
  )
}

export default App
