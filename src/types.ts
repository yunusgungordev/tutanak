export interface TimelineNote {
  id: string
  title: string
  content: string
  date: string
  priority: "low" | "medium" | "high"
  status: "pending" | "completed" | "overdue"
  dueDate?: string
  reminder?: boolean
  lastNotified?: string
  isImportant?: boolean
  isNotified?: boolean
  category?: string
  tags?: string
  created_at: string
  updated_at: string
} 