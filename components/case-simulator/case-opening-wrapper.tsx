"use client";

import dynamic from 'next/dynamic';

// Client component with dynamic import
const CaseOpening = dynamic(() => import('@/components/case-simulator/case-opening'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-black text-white">
      <div className="animate-pulse">
        Loading Case Opening...
      </div>
    </div>
  ),
});

export default function CaseOpeningWrapper({ caseId }: { caseId: string }) {
  return <CaseOpening caseId={caseId} />;
} 