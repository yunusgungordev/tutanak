import { FileText } from "lucide-react"

import { Card } from "@/components/ui/card"

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
    type: "tutanak",
  },
  {
    id: "tutanak-2",
    title: "Hasar Tespit Tutanağı",
    description: "Demirbaş hasarları için",
    type: "tutanak",
  },
]

export function Templates() {
  return (
    <div className="container mx-auto p-4">
      <h2 className="mb-4 text-2xl font-bold">Şablonlar</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {defaultTemplates.map((template) => (
          <Card
            key={template.id}
            className="cursor-pointer p-4 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <FileText className="mt-1 h-5 w-5 text-muted-foreground" />
              <div>
                <h4 className="font-medium">{template.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {template.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
