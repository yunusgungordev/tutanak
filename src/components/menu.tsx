"use client"

import { useCallback } from "react"
import { WindowTitlebar } from "tauri-controls"

export function Menu() {
  const closeWindow = useCallback(async () => {
    const { appWindow } = await import("@tauri-apps/plugin-window")
    appWindow.close()
  }, [])

  return (
    <div data-tauri-drag-region className="h-8 w-full select-none">
      <WindowTitlebar
        controlsOrder="platform"
        windowControlsProps={{
          platform: "windows",
          style: { 
            height: '32px'
          }
        }}
      >
        <div className="h-8 w-full flex items-center px-2 bg-background">
          <span className="text-sm font-medium">Tutanak</span>
        </div>
      </WindowTitlebar>
    </div>
  )
}
