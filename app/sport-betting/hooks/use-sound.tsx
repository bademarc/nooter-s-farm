"use client"

import { useEffect, useRef } from "react"

export default function useSound() {
  const winSoundRef = useRef<HTMLAudioElement | null>(null)
  const betSoundRef = useRef<HTMLAudioElement | null>(null)
  const buttonSoundRef = useRef<HTMLAudioElement | null>(null)
  const spinSoundRef = useRef<HTMLAudioElement | null>(null)
  const loseSoundRef = useRef<HTMLAudioElement | null>(null)
  const levelUpSoundRef = useRef<HTMLAudioElement | null>(null)
  const achievementSoundRef = useRef<HTMLAudioElement | null>(null)
  const wheelSoundRef = useRef<HTMLAudioElement | null>(null)
  const timerSoundRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Create audio elements
      winSoundRef.current = new Audio("/placeholder.svg") // Replace with actual sound files
      betSoundRef.current = new Audio("/placeholder.svg")
      buttonSoundRef.current = new Audio("/placeholder.svg")
      spinSoundRef.current = new Audio("/placeholder.svg")
      loseSoundRef.current = new Audio("/placeholder.svg")
      levelUpSoundRef.current = new Audio("/placeholder.svg")
      achievementSoundRef.current = new Audio("/placeholder.svg")
      wheelSoundRef.current = new Audio("/placeholder.svg")
      timerSoundRef.current = new Audio("/placeholder.svg")

      // Set volume
      if (winSoundRef.current) winSoundRef.current.volume = 0.5
      if (betSoundRef.current) betSoundRef.current.volume = 0.3
      if (buttonSoundRef.current) buttonSoundRef.current.volume = 0.2
      if (spinSoundRef.current) spinSoundRef.current.volume = 0.4
      if (loseSoundRef.current) loseSoundRef.current.volume = 0.3
      if (levelUpSoundRef.current) levelUpSoundRef.current.volume = 0.5
      if (achievementSoundRef.current) achievementSoundRef.current.volume = 0.4
      if (wheelSoundRef.current) wheelSoundRef.current.volume = 0.4
      if (timerSoundRef.current) timerSoundRef.current.volume = 0.3
    }

    return () => {
      // Cleanup
      if (winSoundRef.current) winSoundRef.current = null
      if (betSoundRef.current) betSoundRef.current = null
      if (buttonSoundRef.current) buttonSoundRef.current = null
      if (spinSoundRef.current) spinSoundRef.current = null
      if (loseSoundRef.current) loseSoundRef.current = null
      if (levelUpSoundRef.current) levelUpSoundRef.current = null
      if (achievementSoundRef.current) achievementSoundRef.current = null
      if (wheelSoundRef.current) wheelSoundRef.current = null
      if (timerSoundRef.current) timerSoundRef.current = null
    }
  }, [])

  const playWinSound = () => {
    try {
      if (winSoundRef.current) {
        winSoundRef.current.currentTime = 0
        winSoundRef.current.play()
      }
    } catch (error) {
      console.error("Error playing win sound:", error)
    }
  }

  const playBetSound = () => {
    try {
      if (betSoundRef.current) {
        betSoundRef.current.currentTime = 0
        betSoundRef.current.play()
      }
    } catch (error) {
      console.error("Error playing bet sound:", error)
    }
  }

  const playButtonSound = () => {
    try {
      if (buttonSoundRef.current) {
        buttonSoundRef.current.currentTime = 0
        buttonSoundRef.current.play()
      }
    } catch (error) {
      console.error("Error playing button sound:", error)
    }
  }

  const playSpinSound = () => {
    try {
      if (spinSoundRef.current) {
        spinSoundRef.current.currentTime = 0
        spinSoundRef.current.play()
      }
    } catch (error) {
      console.error("Error playing spin sound:", error)
    }
  }

  const playLoseSound = () => {
    try {
      if (loseSoundRef.current) {
        loseSoundRef.current.currentTime = 0
        loseSoundRef.current.play()
      }
    } catch (error) {
      console.error("Error playing lose sound:", error)
    }
  }

  const playLevelUpSound = () => {
    try {
      if (levelUpSoundRef.current) {
        levelUpSoundRef.current.currentTime = 0
        levelUpSoundRef.current.play()
      }
    } catch (error) {
      console.error("Error playing level up sound:", error)
    }
  }

  const playAchievementSound = () => {
    try {
      if (achievementSoundRef.current) {
        achievementSoundRef.current.currentTime = 0
        achievementSoundRef.current.play()
      }
    } catch (error) {
      console.error("Error playing achievement sound:", error)
    }
  }

  const playWheelSound = () => {
    try {
      if (wheelSoundRef.current) {
        wheelSoundRef.current.currentTime = 0
        wheelSoundRef.current.play()
      }
    } catch (error) {
      console.error("Error playing wheel sound:", error)
    }
  }

  const playTimerSound = () => {
    try {
      if (timerSoundRef.current) {
        timerSoundRef.current.currentTime = 0
        timerSoundRef.current.play()
      }
    } catch (error) {
      console.error("Error playing timer sound:", error)
    }
  }

  return {
    playWinSound,
    playBetSound,
    playButtonSound,
    playSpinSound,
    playLoseSound,
    playLevelUpSound,
    playAchievementSound,
    playWheelSound,
    playTimerSound,
  }
}
