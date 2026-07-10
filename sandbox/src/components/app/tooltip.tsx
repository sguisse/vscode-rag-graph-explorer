"use client"

import React, { useState, useEffect, useRef } from 'react'
import { cn } from "@/lib/utils"

interface GlobalTooltipProps {
  delay?: number
}

export function GlobalTooltip({ delay = 1500 }: GlobalTooltipProps) {
  const [content, setContent] = useState('')
  const [visible, setVisible] = useState(false)

  const [coords, setCoords] = useState<{
    tooltipLeft: number
    tooltipTop: number
    arrowTop: number
    side: 'left' | 'right'
  }>({
    tooltipLeft: 0,
    tooltipTop: 0,
    arrowTop: 0,
    side: 'right'
  })

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const activeTargetRef = useRef<Element | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // High-frequency tracker keeping the real-time mouse positions hot
  const latestMouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const updatePosition = (clientX: number, clientY: number) => {
      if (!tooltipRef.current) return

      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      const tooltipWidth = tooltipRef.current.offsetWidth || 240
      const tooltipHeight = tooltipRef.current.offsetHeight || 60
      const arrowSizeOffset = 12

      // 1. Horizontal Boundary Check
      let side: 'left' | 'right' = 'right'
      let tooltipLeft = clientX + arrowSizeOffset

      if (tooltipLeft + tooltipWidth > viewportWidth) {
        side = 'left'
        tooltipLeft = clientX - tooltipWidth - arrowSizeOffset
      }
      if (tooltipLeft < 4) tooltipLeft = 4

      // 2. Vertical Boundary Check
      let tooltipTop = clientY - tooltipHeight / 2
      tooltipTop = Math.max(6, Math.min(tooltipTop, viewportHeight - tooltipHeight - 6))

      // 3. Precise dynamic Arrow placement relative to current cursor height
      const arrowRelativeY = clientY - tooltipTop
      const safetyPadding = 10
      const arrowTop = Math.max(safetyPadding, Math.min(arrowRelativeY, tooltipHeight - safetyPadding))

      setCoords({ tooltipLeft, tooltipTop, arrowTop, side })
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Continuously log coordinates globally independent of render updates
      latestMouseRef.current = { x: e.clientX, y: e.clientY }

      const target = (e.target as Element).closest('[data-tooltip]')

      if (target) {
        const text = target.getAttribute('data-tooltip') || ''

        if (activeTargetRef.current !== target) {
          activeTargetRef.current = target

          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          setVisible(false)

          timeoutRef.current = setTimeout(() => {
            if (activeTargetRef.current) {
              setContent(text)
              setVisible(true)

              // Read directly from the mutable pointer coordinate cache right as it fires
              updatePosition(latestMouseRef.current.x, latestMouseRef.current.y)
            }
          }, delay)
        } else if (visible) {
          if (text !== content) setContent(text)
          updatePosition(e.clientX, e.clientY)
        }
      } else {
        if (activeTargetRef.current) {
          activeTargetRef.current = null
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          setVisible(false)
        }
      }
    }

    document.body.addEventListener('mousemove', handleMouseMove)
    return () => {
      document.body.removeEventListener('mousemove', handleMouseMove)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [delay, visible, content])

  return (
    <div
      ref={tooltipRef}
      className={cn(
        "inline-flex z-50 fixed items-center shadow-xl px-3 py-1.5 rounded-md max-w-xs text-xs break-words leading-normal pointer-events-none select-none",
        "bg-slate-900/95 text-slate-100 border border-slate-800/60 backdrop-blur-sm font-sans font-medium",
        "dark:bg-slate-950/95 dark:border-slate-800",
        visible ? "opacity-100 visible scale-100 transition-opacity duration-100" : "opacity-0 invisible scale-95 transition-all duration-100"
      )}
      style={{
        left: `${coords.tooltipLeft}px`,
        top: `${coords.tooltipTop}px`,
      }}
    >
      <span
        className="block z-10 relative"
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {/* Dynamic Vector Arrow locking onto pointer coordinates */}
      <div
        className={cn(
          "z-0 absolute bg-slate-900 dark:bg-slate-950 border border-transparent size-2",
          coords.side === 'right'
            ? "-left-1 border-l-slate-800/60 border-b-slate-800/60 dark:border-l-slate-800 dark:border-b-slate-800"
            : "-right-1 border-r-slate-800/60 border-t-slate-800/60 dark:border-r-slate-800 dark:border-t-slate-800"
        )}
        style={{
          top: `${coords.arrowTop}px`,
          transform: 'translateY(-50%) rotate(45deg)',
        }}
      />
    </div>
  )
}
