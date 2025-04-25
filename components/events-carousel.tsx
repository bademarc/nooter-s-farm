"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Calendar, MapPin } from "lucide-react"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { AnimatedBadge } from "./ui/animated-badge"
import { ShimmerButton } from "./ui/shimmer-button"
import { useToast } from "../hooks/use-toast"
import { Confetti } from "./ui/confetti"
import { cn } from "../lib/utils"

// Sample events data
const events = [
  {
    id: 1,
    title: "Spring Festival",
    description: "Celebrate the new season with special crops and limited-time animals!",
    date: "May 15 - May 30",
    image: "/images/guide/farm.jpg",
    type: "Seasonal",
    location: "Farm Central",
    isHot: true,
    rewards: ["Limited Edition Seeds", "Spring Nooter Skin"],
  },
  {
    id: 2,
    title: "Nooter Racing Championship",
    description: "Race your fastest Nooters against other farmers for amazing prizes!",
    date: "June 5 - June 7",
    image: "/images/guide/Nooter Racing Championship.jpg",
    type: "Competition",
    location: "Racing Track",
    isHot: true,
    rewards: ["Golden Trophy", "Racing Nooter", "500 Farm Coins"],
  },
  {
    id: 3,
    title: "Crop Exchange Week",
    description: "Trade your crops with other farmers at special exchange rates!",
    date: "June 12 - June 19",
    image: "/images/guide/Crop Exchange Week.jpg",
    type: "Community",
    location: "Market Place",
    isHot: false,
    rewards: ["Rare Seeds", "Trading Badge"],
  },
  {
    id: 4,
    title: "Mystery Seed Hunt",
    description: "Find hidden mystery seeds across the game world for rare plants!",
    date: "June 25 - July 2",
    image: "/images/guide/Mystery Seed Hunt.jpg",
    type: "Special",
    location: "Various Locations",
    isHot: true,
    rewards: ["Mystery Plant", "Explorer Badge", "200 Farm Coins"],
  },
]

export function EventsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [autoplay, setAutoplay] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)
  const [registeredEvents, setRegisteredEvents] = useState<number[]>([])
  const [direction, setDirection] = useState(0)
  const { toast } = useToast()

  const nextSlide = () => {
    setDirection(1)
    setCurrentIndex((prevIndex) => (prevIndex + 1) % events.length)
  }

  const prevSlide = () => {
    setDirection(-1)
    setCurrentIndex((prevIndex) => (prevIndex - 1 + events.length) % events.length)
  }

  useEffect(() => {
    if (!autoplay) return

    const interval = setInterval(() => {
      nextSlide()
    }, 5000)

    return () => clearInterval(interval)
  }, [autoplay, currentIndex])

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "Seasonal":
        return "bg-[#111] text-white border border-[#333]"
      case "Competition":
        return "bg-[#111] text-white border border-[#333]"
      case "Community":
        return "bg-[#111] text-white border border-[#333]"
      case "Special":
        return "bg-[#111] text-white border border-[#333]"
      default:
        return "bg-[#111] text-white border border-[#333]"
    }
  }

  const handleRegister = (eventId: number) => {
    if (!registeredEvents.includes(eventId)) {
      setRegisteredEvents([...registeredEvents, eventId])
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)

      toast({
        title: "Event Registration Successful!",
        description: `You've registered for ${events.find((e) => e.id === eventId)?.title}!`,
        variant: "default",
      })
    } else {
      setRegisteredEvents(registeredEvents.filter((id) => id !== eventId))
      toast({
        title: "Registration Cancelled",
        description: `You've unregistered from ${events.find((e) => e.id === eventId)?.title}.`,
        variant: "default",
      })
    }
  }

  return (
    <div className="noot-card bg-[#171717] border border-[#333] overflow-hidden">
      {showConfetti && <Confetti />}
      <div className="border-b border-[#333] p-4">
        <h3 className="text-lg font-semibold text-white noot-title">Upcoming Events</h3>
      </div>
      <div className="relative overflow-hidden">
        <div className="relative overflow-hidden">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction < 0 ? 100 : -100 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="relative aspect-[16/9]"
            >
              <img 
                src={events[currentIndex].image || "/placeholder.svg"} 
                alt={events[currentIndex].title}
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
                <div>
                  <Badge className="mb-2 bg-white text-black hover:bg-white/90 border-none rounded-none">
                    {events[currentIndex].type}
                  </Badge>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {events[currentIndex].title}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-white/80 mb-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{events[currentIndex].date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{events[currentIndex].location}</span>
                    </div>
                  </div>
                  <p className="text-sm text-white/70 line-clamp-2">
                    {events[currentIndex].description}
                  </p>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" className="bg-white text-black hover:bg-white/90 rounded-none">
                    Join Event
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="bg-transparent border-white text-white hover:bg-white/10 rounded-none"
                  >
                    Remind Me
                  </Button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 border-white/20 text-white hover:bg-black/70 rounded-full p-1"
            onClick={prevSlide}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 border-white/20 text-white hover:bg-black/70 rounded-full p-1"
            onClick={nextSlide}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex justify-center gap-1 p-2">
          {events.map((_, index) => (
            <button
              key={index}
              onClick={() => { 
                const newDirection = index > currentIndex ? 1 : -1
                setDirection(newDirection)
                setCurrentIndex(index)
                setAutoplay(false)
              }}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                currentIndex === index ? "bg-white scale-125" : "bg-white/30 hover:bg-white/50"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
} 