"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Import the Case Simulator component with SSR disabled
const CaseSimulator = dynamic(() => import('@/components/case-simulator'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-black text-white">
      <div className="animate-pulse">
        Loading Case Simulator...
      </div>
    </div>
  ),
});

export default function CaseSimulatorPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-pulse">
          Loading Case Simulator...
        </div>
      </div>
    }>
      <CaseSimulator />
    </Suspense>
  );
} 