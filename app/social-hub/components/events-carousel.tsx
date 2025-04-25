"use client"

import { useState } from "react"
import { Calendar, Star, Clock } from "lucide-react"
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
  const [showConfetti, setShowConfetti] = useState(false)
  const [registeredEvents, setRegisteredEvents] = useState<number[]>([])
  const { toast } = useToast()

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

        <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden">
              <div 
                className="h-24 relative" 
                style={{ backgroundColor: event.backgroundColor }}
              >
                {event.image && (
                  <img 
                    src={event.image}
                    alt={event.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      console.error(`Failed to load image: ${event.image}`);
                      // Image error - the background color will show instead
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end p-2">
                  <div className="flex items-center gap-2">
                    <Badge className={`${getBadgeColor(event.type)}`}>{event.type}</Badge>
                    {event.isHot && <AnimatedBadge variant="hot">HOT!</AnimatedBadge>}
                  </div>
                </div>
              </div>
              <div className="p-3">
                <h3 className="text-lg font-bold">{event.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{event.description}</p>

                <div className="flex items-center gap-1 text-muted-foreground mb-2">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs">{event.date}</span>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {event.rewards.slice(0, 2).map((reward, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 px-2 py-0.5 text-[10px] font-medium"
                    >
                      <Star className="h-2 w-2" />
                      {reward}
                    </span>
                  ))}
                  {event.rewards.length > 2 && (
                    <span className="text-[10px] text-muted-foreground">+{event.rewards.length - 2} more</span>
                  )}
                </div>

                <ShimmerButton
                  className={`w-full ${registeredEvents.includes(event.id) ? "bg-green-600" : ""}`}
                  onClick={() => handleRegister(event.id)}
                >
                  {registeredEvents.includes(event.id) ? "Registered!" : "Register Now"}
                </ShimmerButton>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Card>
  )
}
