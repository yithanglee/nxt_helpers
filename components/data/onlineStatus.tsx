import React from 'react'
import { cn } from "@/lib/utils"

interface OnlineStatusContainerProps {
  isOnline?: boolean
  children: React.ReactNode
  className?: string
}

export function OnlineStatusContainer({
  isOnline = false,
  children,
  className,
}: OnlineStatusContainerProps) {
  return (
    <div className={cn("relative ", className)}>
      <div 
        className={cn(
          "absolute top-2 right-2 w-3 h-3 rounded-full",
          isOnline ? "bg-green-500" : "bg-gray-400"
        )}
        aria-hidden="true"
      />
      <span className="sr-only">{isOnline ? 'Online' : 'Offline'}</span>
      {children}
    </div>
  )
}

