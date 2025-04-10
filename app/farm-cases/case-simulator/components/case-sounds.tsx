"use client"

import { useEffect, useRef, useState } from 'react'

interface CaseSoundsProps {
  isScrolling: boolean
  isOpening: boolean
  showResult: boolean
  itemRarity?: string | null
}

export function CaseSounds({ 
  isScrolling, 
  isOpening, 
  showResult, 
  itemRarity 
}: CaseSoundsProps) {
  const scrollSoundRef = useRef<HTMLAudioElement | null>(null)
  const resultSoundRef = useRef<HTMLAudioElement | null>(null)
  const legendaryRef = useRef<HTMLAudioElement | null>(null)
  const epicRef = useRef<HTMLAudioElement | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  
  // Load initial mute state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMute = localStorage.getItem('case-sim-muted')
      setIsMuted(savedMute === 'true')
    }
  }, [])
  
  // Listen for mute change events
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleMuteChange = (event: Event) => {
        const customEvent = event as CustomEvent
        setIsMuted(customEvent.detail.isMuted)
      }
      
      window.addEventListener('case-sim-mute-change', handleMuteChange)
      
      return () => {
        window.removeEventListener('case-sim-mute-change', handleMuteChange)
      }
    }
  }, [])
  
  // Initialize audio elements
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Basic scroll/spin sound effect
      scrollSoundRef.current = new Audio('/assets/sounds/case-scroll.mp3')
      scrollSoundRef.current.volume = 0.3
      scrollSoundRef.current.loop = true
      
      // Basic end result sound
      resultSoundRef.current = new Audio('/assets/sounds/case-stop.mp3')
      resultSoundRef.current.volume = 0.5
      
      // Special sounds for rare items
      legendaryRef.current = new Audio('/assets/sounds/legendary.mp3')
      legendaryRef.current.volume = 0.7
      
      epicRef.current = new Audio('/assets/sounds/epic.mp3')
      epicRef.current.volume = 0.6
    }
    
    return () => {
      // Cleanup audio when component unmounts
      if (scrollSoundRef.current) {
        scrollSoundRef.current.pause()
        scrollSoundRef.current = null
      }
      
      if (resultSoundRef.current) {
        resultSoundRef.current.pause()
        resultSoundRef.current = null
      }
      
      if (legendaryRef.current) {
        legendaryRef.current.pause()
        legendaryRef.current = null
      }
      
      if (epicRef.current) {
        epicRef.current.pause()
        epicRef.current = null
      }
    }
  }, [])
  
  // Control scroll sound
  useEffect(() => {
    if (!scrollSoundRef.current) return
    
    if (isScrolling && !isMuted) {
      try {
        scrollSoundRef.current.currentTime = 0
        scrollSoundRef.current.play().catch(err => console.log('Error playing scroll sound:', err))
      } catch (err) {
        console.log('Error with scroll sound:', err)
      }
    } else {
      scrollSoundRef.current.pause()
    }
  }, [isScrolling, isMuted])
  
  // Play result sounds
  useEffect(() => {
    if (!isOpening || isScrolling || !showResult || isMuted) return
    
    // Play result sound first
    if (resultSoundRef.current) {
      try {
        resultSoundRef.current.currentTime = 0
        resultSoundRef.current.play().catch(err => console.log('Error playing result sound:', err))
      } catch (err) {
        console.log('Error with result sound:', err)
      }
    }
    
    // Then play special sound based on rarity
    setTimeout(() => {
      if (itemRarity === 'Legendary' && legendaryRef.current) {
        try {
          legendaryRef.current.currentTime = 0
          legendaryRef.current.play().catch(err => console.log('Error playing legendary sound:', err))
        } catch (err) {
          console.log('Error with legendary sound:', err)
        }
      } else if (itemRarity === 'Epic' && epicRef.current) {
        try {
          epicRef.current.currentTime = 0
          epicRef.current.play().catch(err => console.log('Error playing epic sound:', err))
        } catch (err) {
          console.log('Error with epic sound:', err)
        }
      }
    }, 500)
    
  }, [isOpening, isScrolling, showResult, itemRarity, isMuted])
  
  // This component doesn't render anything
  return null
} 