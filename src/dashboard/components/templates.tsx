import { Card } from "@/components/ui/card"
import { FileText } from "lucide-react"

interface Template {
  id: string
  title: string
  description: string
  type: "tutanak" | "form"
}

const defaultTemplates: Template[] = [
  {
    id: "tutanak-1",
    title: "Devir Teslim Tutanağı",
    description: "Standart devir teslim işlemleri için",
    type: "tutanak"
  },
  {
    id: "tutanak-2",
    title: "Hasar Tespit Tutanağı",
    description: "Demirbaş hasarları için",
    type: "tutanak"
  }
]

export function Templates() {
  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Şablonlar</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {defaultTemplates.map(template => (
          <Card
            key={template.id}
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 mt-1 text-muted-foreground" />
              <div>
                <h4 className="font-medium">{template.title}</h4>
                <p className="text-sm text-muted-foreground">{template.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
} 