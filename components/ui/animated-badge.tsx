"use client"

import type React from "react"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface AnimatedBadgeProps {
  children: React.ReactNode
  className?: string
  variant?: "default" | "hot" | "new" | "premium"
}

export function AnimatedBadge({ children, className, variant = "default" }: AnimatedBadgeProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case "hot":
        return "bg-gradient-to-r from-orange-500 to-red-500 text-white"
      case "new":
        return "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
      case "premium":
        return "bg-gradient-to-r from-yellow-300 to-yellow-600 text-black"
      default:
        return "bg-primary/10 text-primary"
    }
  }

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        getVariantClasses(),
        className,
      )}
    >
      <motion.span
        animate={variant !== "default" ? { scale: [1, 1.1, 1] } : {}}
        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2, repeatType: "loop" }}
      >
        {children}
      </motion.span>
    </motion.span>
  )
} 