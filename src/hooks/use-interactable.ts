import { useEffect, useRef } from 'react'
import interact from 'interactjs'

export function useInteractable(
  itemId: string,
  onDragEnd: Function,
  onResizeEnd: Function,
  x: number,
  y: number,
  gridBounds: { width: number; height: number; padding: number }
) {
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!elementRef.current) return

    const interactable = interact(elementRef.current)
      .draggable({
        inertia: false,
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
          move: dragMoveListener,
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
        modifiers: [
          interact.modifiers.restrictEdges({
            outer: 'parent',
            endOnly: true
          }),
          interact.modifiers.snap({
            targets: [
              interact.snappers.grid({ x: 10, y: 10 })
            ],
            range: 10
          })
        ],
        listeners: {
          move: resizeMoveListener,
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
  }, [itemId, onDragEnd, onResizeEnd, gridBounds])

  function dragMoveListener(event: any) {
    const target = event.target
    const x = Math.min(
      Math.max(0, (parseFloat(target.getAttribute('data-x')) || 0) + event.dx),
      gridBounds.width - parseFloat(target.style.width)
    )
    const y = Math.min(
      Math.max(0, (parseFloat(target.getAttribute('data-y')) || 0) + event.dy),
      gridBounds.height - parseFloat(target.style.height)
    )

    target.style.transform = `translate(${x}px, ${y}px)`
    target.setAttribute('data-x', x.toString())
    target.setAttribute('data-y', y.toString())
  }

  function resizeMoveListener(event: any) {
    const target = event.target
    let x = parseFloat(target.getAttribute('data-x')) || 0
    let y = parseFloat(target.getAttribute('data-y')) || 0

    target.style.width = `${event.rect.width}px`
    target.style.height = `${event.rect.height}px`

    x += event.deltaRect.left
    y += event.deltaRect.top

    target.style.transform = `translate(${x}px, ${y}px)`
    target.setAttribute('data-x', x.toString())
    target.setAttribute('data-y', y.toString())
  }

  return elementRef
}