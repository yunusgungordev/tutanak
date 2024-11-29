import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ListTodo, Plus, Check, Trash } from "lucide-react"
import { nanoid } from "nanoid"
import { useState } from "react"
import { LayoutConfig } from "@/types/tab"
import { ComponentProperties } from "@/types/component"

interface TaskMenuProps {
  item: LayoutConfig
  onUpdate: (tasks: ComponentProperties['tasks']) => void
}

export function TaskMenu({ item, onUpdate }: TaskMenuProps) {
  const [newTask, setNewTask] = useState("")
  const tasks = item.properties.tasks || []

  const handleAddTask = () => {
    if (!newTask.trim()) return
    
    const newTasks = [
      ...tasks,
      {
        id: nanoid(),
        text: newTask,
        completed: false,
        createdAt: new Date().toISOString()
      }
    ]
    
    onUpdate(newTasks)
    setNewTask("")
  }

  const toggleTask = (taskId: string) => {
    const newTasks = tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    )
    onUpdate(newTasks)
  }

  const deleteTask = (taskId: string) => {
    const newTasks = tasks.filter(task => task.id !== taskId)
    onUpdate(newTasks)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="absolute top-1 right-1 h-6 w-6 p-0">
          <ListTodo className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="font-medium">Görevler</div>
          <div className="flex gap-2">
            <Input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Yeni görev..."
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            />
            <Button onClick={handleAddTask} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-2 p-2 border rounded-md">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => toggleTask(task.id)}
                >
                  <Check className={`h-4 w-4 ${task.completed ? "text-primary" : "text-muted-foreground"}`} />
                </Button>
                <span className={`flex-1 ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                  {task.text}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => deleteTask(task.id)}
                >
                  <Trash className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
