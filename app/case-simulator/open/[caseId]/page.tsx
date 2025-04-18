// This should be a server component since it uses generateStaticParams
import { Suspense } from 'react';

interface CaseOpeningPageProps {
  params: {
    caseId: string;
  };
}

// Generate static pages for these case IDs
export function generateStaticParams() {
  return [
    { caseId: '1' },
    { caseId: '2' },
    { caseId: '3' },
  ];
}

export default function CaseOpeningPage({ params }: CaseOpeningPageProps) {
  const { caseId } = params;
  
  return (
    <Suspense fallback={
      <div className="w-full h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-pulse">
          Loading Case Opening...
        </div>
      </div>
    }>
      <CaseOpeningWrapper caseId={caseId} />
    </Suspense>
  );
}

// Client component wrapper for dynamic import
"use client";

import dynamic from 'next/dynamic';

// Moving the dynamic import to a client component
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

function CaseOpeningWrapper({ caseId }: { caseId: string }) {
  return <CaseOpening caseId={caseId} />;
} 