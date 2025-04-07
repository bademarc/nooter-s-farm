"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Import the actual Home component with SSR disabled entirely
const HomePage = dynamic(() => import('@/components/home-page'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-black text-white">
      <div className="animate-pulse">
        Loading Nooter's Farm...
      </div>
    </div>
  ),
});

export default function Page() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-pulse">
          Loading Nooter's Farm...
        </div>
      </div>
    }>
      <HomePage />
    </Suspense>
  );
}