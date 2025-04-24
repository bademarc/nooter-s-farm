"use client"

import { useEffect, useRef } from "react"
import { animate } from "framer-motion"

interface AnimatedCounterProps {
  from: number
  to: number
  duration?: number
  className?: string
}

export function AnimatedCounter({ from, to, duration = 1, className = "" }: AnimatedCounterProps) {
  const nodeRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const node = nodeRef.current
    if (!node) return

    const controls = animate(from, to, {
      duration,
      onUpdate(value) {
        node.textContent = Math.round(value).toLocaleString()
      },
      ease: "easeOut",
    })

    return () => controls.stop()
  }, [from, to, duration])

  return <span ref={nodeRef} className={className} />
}
