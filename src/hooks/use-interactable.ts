import { useEffect, useRef } from "react"
import interact from "interactjs"

interface GridBounds {
  width: number | string
  height: number | string
  padding: number
}

export function useInteractable(
  id: string,
  onDragEnd: (x: number, y: number) => void,
  onResizeEnd: (width: number, height: number, x: number, y: number) => void,
  initialX: number,
  initialY: number,
  gridBounds: GridBounds
) {
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!elementRef.current) return

    const element = elementRef.current
    const parentElement = element.parentElement

    if (!parentElement) return

    const maxWidth = typeof gridBounds.width === "string" 
      ? parentElement.clientWidth - gridBounds.padding * 2
      : gridBounds.width

    const maxHeight = typeof gridBounds.height === "string"
      ? parentElement.clientHeight - gridBounds.padding * 2
      : gridBounds.height

    const interactable = interact(element)
      .draggable({
        inertia: false,
        autoScroll: true,
        modifiers: [
          interact.modifiers.snap({
            targets: [interact.snappers.grid({ x: 10, y: 10 })],
            range: 10,
            relativePoints: [{ x: 0, y: 0 }],
          }),
          interact.modifiers.restrict({
            restriction: parentElement,
            elementRect: { top: 0, left: 0, bottom: 1, right: 1 },
            endOnly: true,
          }),
        ],
        listeners: {
          move: (event) => {
            const target = event.target
            const x = (parseFloat(target.getAttribute("data-x")) || 0) + event.dx
            const y = (parseFloat(target.getAttribute("data-y")) || 0) + event.dy

            // Sınırları kontrol et
            const boundedX = Math.min(Math.max(x, 0), maxWidth - parseFloat(target.style.width))
            const boundedY = Math.min(Math.max(y, 0), maxHeight - parseFloat(target.style.height))

            target.style.transform = `translate(${boundedX}px, ${boundedY}px)`
            target.setAttribute("data-x", boundedX.toString())
            target.setAttribute("data-y", boundedY.toString())
          },
          end(event) {
            const target = event.target
            const x = parseFloat(target.getAttribute("data-x")) || 0
            const y = parseFloat(target.getAttribute("data-y")) || 0
            onDragEnd(x, y)
          },
        },
      })
      .resizable({
        edges: { left: true, right: true, bottom: true, top: true },
        modifiers: [
          interact.modifiers.restrictEdges({
            outer: parentElement,
            endOnly: true,
          }),
          interact.modifiers.restrictSize({
            min: { width: 50, height: 50 },
            max: { width: maxWidth, height: maxHeight },
          }),
          interact.modifiers.snap({
            targets: [interact.snappers.grid({ x: 10, y: 10 })],
            range: 10,
          }),
        ],
        listeners: {
          move: (event) => {
            const target = event.target
            let x = parseFloat(target.getAttribute("data-x")) || 0
            let y = parseFloat(target.getAttribute("data-y")) || 0

            // Boyut güncelleme
            target.style.width = `${event.rect.width}px`
            target.style.height = `${event.rect.height}px`

            // Pozisyon güncelleme
            x += event.deltaRect.left
            y += event.deltaRect.top

            target.style.transform = `translate(${x}px, ${y}px)`
            target.setAttribute("data-x", x.toString())
            target.setAttribute("data-y", y.toString())
          },
          end(event) {
            const target = event.target
            const x = parseFloat(target.getAttribute("data-x")) || 0
            const y = parseFloat(target.getAttribute("data-y")) || 0
            const width = parseFloat(target.style.width)
            const height = parseFloat(target.style.height)
            onResizeEnd(width, height, x, y)
          },
        },
      })

    return () => {
      interactable.unset()
    }
  }, [id, onDragEnd, onResizeEnd, gridBounds])

  return elementRef
}
