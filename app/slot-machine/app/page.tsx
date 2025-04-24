import EnhancedSlotMachine from "@/app/slot-machine/components/enhanced-slot-machine"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-indigo-950 via-purple-900 to-indigo-950 overflow-hidden">
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <div className="stars-container">
          <div className="stars"></div>
          <div className="stars2"></div>
          <div className="stars3"></div>
        </div>

        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30 pointer-events-none">
          <div className="floating-coin coin-1"></div>
          <div className="floating-coin coin-2"></div>
          <div className="floating-coin coin-3"></div>
          <div className="floating-coin coin-4"></div>
          <div className="floating-coin coin-5"></div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 mb-8 text-center drop-shadow-glow animate-pulse-slow">
          MEGA FORTUNE
        </h1>
        <EnhancedSlotMachine />
      </div>
    </main>
  )
}
