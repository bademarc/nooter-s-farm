"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  Trophy, 
  Package, 
  FileText, 
  ArrowRight, 
  Sparkles,
  ArrowLeft,
  Leaf
} from "lucide-react"

export default function FarmCasesPage() {
  const [hoverState, setHoverState] = useState<string | null>(null)

  return (
    <div className="container mx-auto py-8 px-4 noot-theme min-h-screen bg-black">
      <div className="mb-6">
        <Link href="/">
          <button className="noot-button border-2 border-yellow-500 bg-black hover:bg-yellow-500 hover:text-black font-bold py-2 px-4">
            <ArrowLeft className="h-4 w-4 mr-1 inline" />
            Back to Main Page
          </button>
        </Link>
      </div>
      
      <div className="text-center mb-8">
        <h1 className="font-bold text-3xl md:text-4xl text-gradient-gold mb-2 noot-title">Nooters Farm Case System</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Explore our collection of virtual cases, battle with others, and manage your contracts in this exclusive farming extension
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {/* Noot Case Card */}
        <Link 
          href="/farm-cases/noot-case"
          className="noot-card group overflow-hidden border-2 hover:border-yellow-500"
          onMouseEnter={() => setHoverState('noot')}
          onMouseLeave={() => setHoverState(null)}
        >
          <div className="p-6 flex flex-col items-center text-center h-full">
            <div className="mb-4 w-16 h-16 bg-black rounded-full flex items-center justify-center border-2 border-yellow-500">
              <Leaf className="w-8 h-8 text-yellow-500" />
            </div>
            <h2 className="noot-title text-xl mb-2">Noot Case</h2>
            <p className="text-white/70 mb-4 flex-grow">
              Open special farm-themed cases to collect rare items for your farm
            </p>
            <div className="flex items-center justify-center mt-2 border border-yellow-500 bg-black py-2 px-4 group-hover:bg-yellow-500 group-hover:text-black transition-all">
              <span className="text-sm font-bold flex items-center">
                OPEN NOOT CASES <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </Link>
        
        {/* Case Battle Card */}
        <Link 
          href="/farm-cases/case-battle"
          className="noot-card group overflow-hidden border-2 hover:border-yellow-500"
          onMouseEnter={() => setHoverState('battle')}
          onMouseLeave={() => setHoverState(null)}
        >
          <div className="p-6 flex flex-col items-center text-center h-full">
            <div className="mb-4 w-16 h-16 bg-black rounded-full flex items-center justify-center border-2 border-yellow-500">
              <Trophy className="w-8 h-8 text-yellow-500" />
            </div>
            <h2 className="noot-title text-xl mb-2">Case Battles</h2>
            <p className="text-white/70 mb-4 flex-grow">
              Challenge other farmers to case opening battles and win exclusive rewards
            </p>
            <div className="flex items-center justify-center mt-2 border border-yellow-500 bg-black py-2 px-4 group-hover:bg-yellow-500 group-hover:text-black transition-all">
              <span className="text-sm font-bold flex items-center">
                START BATTLE <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </Link>

        {/* Case Simulator Card */}
        <Link 
          href="/farm-cases/case-simulator"
          className="noot-card group overflow-hidden border-2 hover:border-yellow-500"
          onMouseEnter={() => setHoverState('simulator')}
          onMouseLeave={() => setHoverState(null)}
        >
          <div className="p-6 flex flex-col items-center text-center h-full">
            <div className="mb-4 w-16 h-16 bg-black rounded-full flex items-center justify-center border-2 border-yellow-500">
              <Package className="w-8 h-8 text-yellow-500" />
            </div>
            <h2 className="noot-title text-xl mb-2">Case Simulator</h2>
            <p className="text-white/70 mb-4 flex-grow">
              Open virtual farm cases to collect rare items and expand your collection
            </p>
            <div className="flex items-center justify-center mt-2 border border-yellow-500 bg-black py-2 px-4 group-hover:bg-yellow-500 group-hover:text-black transition-all">
              <span className="text-sm font-bold flex items-center">
                OPEN CASES <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </Link>

        {/* Contract Simulator Card */}
        <Link 
          href="/farm-cases/contract-simulator"
          className="noot-card group overflow-hidden border-2 hover:border-yellow-500"
          onMouseEnter={() => setHoverState('contract')}
          onMouseLeave={() => setHoverState(null)}
        >
          <div className="p-6 flex flex-col items-center text-center h-full">
            <div className="mb-4 w-16 h-16 bg-black rounded-full flex items-center justify-center border-2 border-yellow-500">
              <FileText className="w-8 h-8 text-yellow-500" />
            </div>
            <h2 className="noot-title text-xl mb-2">Contract Simulator</h2>
            <p className="text-white/70 mb-4 flex-grow">
              Create and manage virtual contracts for your farming items and track your collection
            </p>
            <div className="flex items-center justify-center mt-2 border border-yellow-500 bg-black py-2 px-4 group-hover:bg-yellow-500 group-hover:text-black transition-all">
              <span className="text-sm font-bold flex items-center">
                MANAGE CONTRACTS <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </Link>
      </div>

      <div className="mt-12 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-black border-2 border-yellow-500">
          <Sparkles className="w-5 h-5 mr-2 text-yellow-500 animate-pulse" />
          <span className="text-sm font-bold">All activities in the Case System earn you bonus XP for your farm!</span>
        </div>
      </div>
    </div>
  )
} 