import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { useNotes } from "@/contexts/notes-context"
import { invoke } from "@tauri-apps/api/tauri"
import { toast } from "@/components/ui/use-toast"

export function AddNoteDialog() {
  const { addNote } = useNotes()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("low")
  const [date, setDate] = useState<Date>(new Date())
  const [time, setTime] = useState("")
  const [reminder, setReminder] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    if (!title || !content || !priority || !date) {
      setError("Lütfen tüm alanları doldurun");
      return;
    }
    
    try {
      const noteData = {
        id: null,
        title,
        content,
        priority,
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        time: time || "00:00",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Gönderilen veri:', noteData); // Debug için

      await invoke('save_note', { note: noteData })
        .then(() => {
          // Form alanlarını temizle
          setTitle('');
          setContent('');
          setPriority('low');
          setDate(new Date());
          setTime('');
          setError('');
          
          // Dialog'u kapat
          setOpen(false);
          
          toast({
            title: "Not başarıyla kaydedildi",
            variant: "default",
          });
        })
        .catch((err) => {
          console.error('Not kaydetme hatası:', err);
          throw err;
        });
      
    } catch (error) {
      console.error('Not kaydetme hatası:', error);
      setError('Not kaydedilirken bir hata oluştu');
      toast({
        title: "Not kaydedilirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">Not Ekle</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni Not</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && (
            <div className="text-sm text-red-500 font-medium">
              {error}
            </div>
          )}
          <Input 
            placeholder="Başlık" 
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <Textarea 
            placeholder="Not içeriği" 
            value={content}
            onChange={e => setContent(e.target.value)}
          />
          <Select 
            value={priority} 
            onValueChange={(value: "low" | "medium" | "high") => setPriority(value)}
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
          <div className="flex flex-col gap-2 items-center">
            <label>Tarih ve Saat</label>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(selectedDate: Date | undefined) => selectedDate && setDate(selectedDate)}
              locale={tr}
            />
            <Input 
              type="time" 
              className="mt-2"
              value={time}
              onChange={e => setTime(e.target.value)}
            />
          </div>
          <Button 
            className="w-full" 
            onClick={handleSubmit}
            disabled={!title || !content || !priority || !date}
          >
            Kaydet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 