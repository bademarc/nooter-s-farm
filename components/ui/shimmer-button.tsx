"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface ShimmerButtonProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
}

export function ShimmerButton({ children, className, onClick, disabled = false }: ShimmerButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-10 items-center justify-center overflow-hidden rounded-md bg-gradient-to-r from-green-500 to-yellow-400 px-4 py-2 font-medium text-white shadow-md transition-all hover:from-green-600 hover:to-yellow-500 disabled:cursor-not-allowed disabled:opacity-50 dark:from-green-600 dark:to-yellow-500 dark:hover:from-green-700 dark:hover:to-yellow-600",
        className,
      )}
    >
      <div className="relative z-10">{children}</div>
      <motion.div
        className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
        style={{ translateX: "-100%" }}
        animate={{ translateX: "200%" }}
        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2, ease: "linear" }}
      />
    </motion.button>
  )
} 