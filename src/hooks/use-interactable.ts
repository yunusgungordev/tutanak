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

    const maxWidth =
      typeof gridBounds.width === "string"
        ? elementRef.current.parentElement?.clientWidth || 800
        : gridBounds.width

    const maxHeight =
      typeof gridBounds.height === "string"
        ? elementRef.current.parentElement?.clientHeight || 600
        : gridBounds.height

    const interactable = interact(elementRef.current)
      .draggable({
        inertia: false,
        modifiers: [
          interact.modifiers.snap({
            targets: [interact.snappers.grid({ x: 10, y: 10 })],
            range: 10,
            relativePoints: [{ x: 0, y: 0 }],
          }),
          interact.modifiers.restrict({
            restriction: "parent",
            elementRect: { top: 0, left: 0, bottom: 1, right: 1 },
            endOnly: true,
          }),
        ],
        listeners: {
          move: dragMoveListener,
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
            outer: "parent",
            endOnly: true,
          }),
          interact.modifiers.snap({
            targets: [interact.snappers.grid({ x: 10, y: 10 })],
            range: 10,
          }),
        ],
        listeners: {
          move: resizeMoveListener,
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

  function dragMoveListener(event: any) {
    const target = event.target
    const x = (parseFloat(target.getAttribute("data-x")) || 0) + event.dx
    const y = (parseFloat(target.getAttribute("data-y")) || 0) + event.dy

    target.style.transform = `translate(${x}px, ${y}px)`
    target.setAttribute("data-x", x.toString())
    target.setAttribute("data-y", y.toString())
  }

  function resizeMoveListener(event: any) {
    const target = event.target
    let x = parseFloat(target.getAttribute("data-x")) || 0
    let y = parseFloat(target.getAttribute("data-y")) || 0

    target.style.width = `${event.rect.width}px`
    target.style.height = `${event.rect.height}px`

    x += event.deltaRect.left
    y += event.deltaRect.top

    target.style.transform = `translate(${x}px, ${y}px)`
    target.setAttribute("data-x", x.toString())
    target.setAttribute("data-y", y.toString())
  }

  return elementRef
}
