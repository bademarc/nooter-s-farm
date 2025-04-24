"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface AnimatedProgressProps {
  value: number
  max?: number
  className?: string
  barClassName?: string
  showLabel?: boolean
  labelClassName?: string
}

export function AnimatedProgress({
  value,
  max = 100,
  className,
  barClassName,
  showLabel = false,
  labelClassName,
}: AnimatedProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className="space-y-1">
      <div className={cn("h-2 w-full overflow-hidden rounded-full bg-secondary", className)}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full bg-primary", barClassName)}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between text-xs">
          <span className={cn("text-muted-foreground", labelClassName)}>
            {value} / {max}
          </span>
          <span className={cn("font-medium", labelClassName)}>{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  )
} 