"use client"

import { useState, useEffect } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

interface VolumeControlProps {
  className?: string
}

export function VolumeControl({ className = '' }: VolumeControlProps) {
  const [isMuted, setIsMuted] = useState(false)
  
  // Load the mute state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMute = localStorage.getItem('case-sim-muted')
      setIsMuted(savedMute === 'true')
    }
  }, [])
  
  // Toggle mute state
  const toggleMute = () => {
    const newMuteState = !isMuted
    setIsMuted(newMuteState)
    
    // Save mute state to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('case-sim-muted', newMuteState.toString())
      
      // Create a custom event to notify other components
      const event = new CustomEvent('case-sim-mute-change', { detail: { isMuted: newMuteState } })
      window.dispatchEvent(event)
    }
  }
  
  return (
    <button
      onClick={toggleMute}
      className={`flex items-center justify-center p-2 rounded-full hover:bg-black/30 transition-all ${className}`}
      title={isMuted ? "Unmute sounds" : "Mute sounds"}
    >
      {isMuted ? (
        <VolumeX className="w-5 h-5 text-gray-400" />
      ) : (
        <Volume2 className="w-5 h-5 text-white" />
      )}
    </button>
  )
} 