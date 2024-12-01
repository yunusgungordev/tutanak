import { useState, useEffect } from "react"
import { useNotes } from "@/contexts/notes-context"
import { invoke } from "@tauri-apps/api/tauri"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { analyzeContent, trainAIModel } from "@/lib/ai-helper"

interface ContentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  category: string[];
  keywords: string[];
  importance: number;
  suggestedTags: string[];
}

export function AddNoteDialog() {
  const { addNote, getSuggestions } = useNotes()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [date, setDate] = useState<Date>(new Date())
  const [time, setTime] = useState("")
  const [reminder, setReminder] = useState<boolean>(false)
  const [error, setError] = useState("")
  const [suggestions, setSuggestions] = useState<string>("")
  const [suggestedTags, setSuggestedTags] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [category, setCategory] = useState<string>("")
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null)
  const [userSetPriority, setUserSetPriority] = useState(false)

  useEffect(() => {
    const getSuggestion = async () => {
      if (content.length > 10) {
        const suggestion = await getSuggestions(content)
        setSuggestions(suggestion)
      } else {
        setSuggestions("")
      }
    }
    getSuggestion()
  }, [content])

  useEffect(() => {
    const analyzeNoteContent = async () => {
      if (content.length > 10) {
        const contentAnalysis = await analyzeContent(content);
        setAnalysis(contentAnalysis);
        setSuggestedTags(contentAnalysis.suggestedTags);
        setCategory(contentAnalysis.category[0] || "");
        
        // Otomatik öncelik belirleme
        if (!userSetPriority) {
          setPriority(
            contentAnalysis.importance > 0.7 ? "high" :
            contentAnalysis.importance > 0.4 ? "medium" : "low"
          );
        }
      }
    };
    analyzeNoteContent();
  }, [content]);

  const handleSubmit = async () => {
    try {
      if (!title?.trim()) {
        setError("Başlık alanı zorunludur")
        return
      }

      if (!content?.trim()) {
        setError("İçerik alanı zorunludur")
        return
      }

      const currentDate = new Date();
      const dueDate = time
        ? new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            parseInt(time.split(":")[0]),
            parseInt(time.split(":")[1])
          )
        : new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59)

      const note = {
        title: title.trim(),
        content: content.trim(),
        priority: priority || "medium",
        created_at: currentDate.toISOString(),
        updated_at: currentDate.toISOString(),
        date: date.toISOString(),
        time: format(date, 'HH:mm'),
        dueDate: dueDate.toISOString(),
        reminder: reminder,
        lastNotified: undefined,
        category: category || "",
        tags: selectedTags.join(",") || "",
        isImportant: false,
        isNotified: false,
        status: "pending"
      } as const;

      await addNote(note)

      // Modeli eğit
      await trainAIModel(content, {
        category: [category],
        tags: selectedTags
      });

      // Form alanlarını temizle
      setTitle("")
      setContent("")
      setPriority("low")
      setDate(new Date())
      setTime("")
      setError("")

      setOpen(false)

      toast({
        title: "Not başarıyla kaydedildi",
        variant: "default",
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Not kaydedilirken bir hata oluştu"
      setError(errorMessage)
      toast({
        title: errorMessage,
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          Not Ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Yeni Not</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && (
            <div className="text-sm font-medium text-red-500">{error}</div>
          )}
          <Input
            placeholder="Başlık"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder="Not içeriği"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <Select
            value={priority}
            onValueChange={(value: "low" | "medium" | "high") => {
              setPriority(value)
              setUserSetPriority(true)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Öncelik" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Düşük Öncelik</SelectItem>
              <SelectItem value="medium">Orta Öncelik</SelectItem>
              <SelectItem value="high">Yüksek Öncelik</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex flex-col items-center gap-2">
            <label>Tarih ve Saat</label>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(selectedDate: Date | undefined) =>
                selectedDate && setDate(selectedDate)
              }
              locale={tr}
            />
            <Input
              type="time"
              className="mt-2"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
          {analysis && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Kategori:</span>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {analysis.category.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {suggestedTags?.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedTags(prev => 
                        prev.includes(tag) 
                          ? prev.filter(t => t !== tag)
                          : [...prev, tag]
                      );
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!title || !content || !date}
          >
            Kaydet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
