"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Calendar, Star, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AnimatedBadge } from "@/components/ui/animated-badge"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { useToast } from "@/hooks/use-toast"
import { Confetti } from "@/components/ui/confetti"

// Sample events data
const events = [
  {
    id: 1,
    title: "Spring Festival",
    description: "Celebrate the new season with special crops and limited-time animals!",
    date: "May 15 - May 30",
    image: "/images/guide/farm.jpg",
    backgroundColor: "#4CAF50",
    type: "Seasonal",
    isHot: true,
    rewards: ["Limited Edition Seeds", "Spring Nooter Skin"],
  },
  {
    id: 2,
    title: "Nooter Racing Championship",
    description: "Race your fastest Nooters against other farmers for amazing prizes!",
    date: "June 5 - June 7",
    image: "/images/guide/Nooter Racing Championship.jpg",
    backgroundColor: "#F44336",
    type: "Competition",
    isHot: true,
    rewards: ["Golden Trophy", "Racing Nooter", "500 Farm Coins"],
  },
  {
    id: 3,
    title: "Crop Exchange Week",
    description: "Trade your crops with other farmers at special exchange rates!",
    date: "June 12 - June 19",
    image: "/images/guide/Crop Exchange Week.jpg",
    backgroundColor: "#2196F3",
    type: "Community",
    isHot: false,
    rewards: ["Rare Seeds", "Trading Badge"],
  },
  {
    id: 4,
    title: "Mystery Seed Hunt",
    description: "Find hidden mystery seeds across the game world for rare plants!",
    date: "June 25 - July 2",
    image: "/images/guide/Mystery Seed Hunt.jpg",
    backgroundColor: "#9C27B0",
    type: "Special",
    isHot: true,
    rewards: ["Mystery Plant", "Explorer Badge", "200 Farm Coins"],
  },
]

export default function EventsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [autoplay, setAutoplay] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)
  const [registeredEvents, setRegisteredEvents] = useState<number[]>([])
  const { toast } = useToast()

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % events.length)
  }

  const prevSlide = () => {
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
        return "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-100"
      case "Competition":
        return "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-100"
      case "Community":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100"
      case "Special":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100"
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
    <Card className="overflow-hidden">
      {showConfetti && <Confetti />}
      <div className="relative">
        <div className="flex items-center p-3 bg-gradient-to-r from-green-500 to-yellow-400 dark:from-green-700 dark:to-yellow-600">
          <Calendar className="h-5 w-5 text-white mr-2" />
          <h2 className="text-lg font-bold text-white">Upcoming Events</h2>
        </div>

        <div
          className="relative h-[300px] overflow-hidden"
          onMouseEnter={() => setAutoplay(false)}
          onMouseLeave={() => setAutoplay(true)}
        >
          <div 
            className="absolute inset-0" 
            style={{ backgroundColor: events[currentIndex].backgroundColor }}
          >
            <img
              src={events[currentIndex].image}
              alt={events[currentIndex].title}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error(`Failed to load image: ${events[currentIndex].image}`);
                // Just hide the image if it fails to load, showing the background color
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`${getBadgeColor(events[currentIndex].type)}`}>{events[currentIndex].type}</Badge>
                {events[currentIndex].isHot && <AnimatedBadge variant="hot">HOT!</AnimatedBadge>}
              </div>
              <h3 className="text-2xl font-bold text-white">
                {events[currentIndex].title}
              </h3>
              <p className="text-sm text-white/90 mb-3">
                {events[currentIndex].description}
              </p>

              <div className="flex flex-col gap-2 mb-3">
                <div className="flex items-center gap-1 text-white/90">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{events[currentIndex].date}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {events[currentIndex].rewards.map((reward, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-full bg-yellow-400/90 px-2 py-0.5 text-xs font-medium text-black"
                    >
                      <Star className="h-3 w-3" />
                      {reward}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-white/90 bg-black/30 px-2 py-1 rounded-full">
                  {currentIndex + 1}/{events.length}
                </span>
                <ShimmerButton
                  className={registeredEvents.includes(events[currentIndex].id) ? "bg-green-600" : ""}
                  onClick={() => handleRegister(events[currentIndex].id)}
                >
                  {registeredEvents.includes(events[currentIndex].id) ? "Registered!" : "Register Now"}
                </ShimmerButton>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white hover:bg-black/50 rounded-full h-8 w-8 z-10"
            onClick={prevSlide}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white hover:bg-black/50 rounded-full h-8 w-8 z-10"
            onClick={nextSlide}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
