// This should be a server component since it uses generateStaticParams
import { Suspense } from 'react';
import CaseOpeningWrapper from '@/components/case-simulator/case-opening-wrapper';

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