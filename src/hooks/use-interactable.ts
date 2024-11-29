import { useEffect, useRef } from 'react'
import interact from 'interactjs'

export function useInteractable(
  itemId: string, 
  onDragEnd: Function, 
  onResizeEnd: Function,
  initialX: number,
  initialY: number
) {
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!elementRef.current) return

    const interactable = interact(elementRef.current)
      .draggable({
        inertia: false,
        autoScroll: true,
        modifiers: [
          interact.modifiers.snap({
            targets: [
              interact.snappers.grid({ x: 10, y: 10 })
            ],
            range: 10,
            relativePoints: [{ x: 0, y: 0 }]
          }),
          interact.modifiers.restrict({
            restriction: 'parent',
            elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
          })
        ],
        listeners: {
          move(event) {
            const target = event.target
            const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx
            const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy

            target.style.transform = `translate(${x}px, ${y}px)`
            target.setAttribute('data-x', x.toString())
            target.setAttribute('data-y', y.toString())
          },
          end(event) {
            const target = event.target
            const x = parseFloat(target.getAttribute('data-x')) || 0
            const y = parseFloat(target.getAttribute('data-y')) || 0
            onDragEnd(x, y)
          }
        }
      })
      .resizable({
        edges: { left: true, right: true, bottom: true, top: true },
        margin: 5,
        modifiers: [
          interact.modifiers.snap({
            targets: [
              interact.snappers.grid({ x: 10, y: 10 })
            ],
            range: 10
          }),
          interact.modifiers.restrictEdges({
            outer: 'parent'
          })
        ],
        listeners: {
          move(event) {
            const target = event.target
            let x = parseFloat(target.getAttribute('data-x')) || 0
            let y = parseFloat(target.getAttribute('data-y')) || 0
            let width = event.rect.width
            let height = event.rect.height

            if (event.edges.left) {
              x += event.deltaRect.left
            }
            if (event.edges.top) {
              y += event.deltaRect.top
            }

            target.style.width = `${width}px`
            target.style.height = `${height}px`
            target.style.transform = `translate(${x}px, ${y}px)`

            target.setAttribute('data-x', x.toString())
            target.setAttribute('data-y', y.toString())
          },
          end(event) {
            const target = event.target
            const x = parseFloat(target.getAttribute('data-x')) || 0
            const y = parseFloat(target.getAttribute('data-y')) || 0
            const width = parseFloat(target.style.width)
            const height = parseFloat(target.style.height)
            
            onResizeEnd(width, height, x, y)
          }
        }
      })

    return () => {
      interactable.unset()
    }
  }, [itemId, onDragEnd, onResizeEnd])

  return elementRef
}