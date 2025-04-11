"use client";

import { useEffect } from 'react';
import Link from 'next/link';

export default function NotFound() {
  useEffect(() => {
    // Check if we're trying to access the case simulator
    const path = window.location.pathname;
    if (path.includes('/case-simulator')) {
      // If it's a case simulator page, redirect to the main simulator page
      window.location.href = '/case-simulator';
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <h1 className="text-5xl font-bold mb-6">404</h1>
      <h2 className="text-2xl mb-8">This page could not be found.</h2>
      
      <div className="space-y-4">
        <div>
          <Link 
            href="/" 
            className="px-4 py-2 bg-white text-black hover:bg-white/80 transition"
          >
            Return to Home
          </Link>
        </div>
        
        <div>
          <Link 
            href="/case-simulator" 
            className="px-4 py-2 border border-white text-white hover:bg-white/10 transition"
          >
            Go to Case Simulator
          </Link>
        </div>
      </div>
    </div>
  );
} 