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
            height: "32px",
          },
        }}
      >
        <div className="flex h-8 w-full items-center bg-background px-2">
          <span className="text-sm font-medium">Tutanak</span>
        </div>
      </WindowTitlebar>
    </div>
  )
}
