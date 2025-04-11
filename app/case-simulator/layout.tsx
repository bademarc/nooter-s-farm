"use client";

import { useEffect } from 'react';
import Script from 'next/script';

export default function CaseSimulatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This useEffect will help with navigation in static export
  useEffect(() => {
    // Check if we're on a page that should exist but isn't loading properly
    const path = window.location.pathname;
    if (path.includes('/case-simulator') && document.title.includes('404')) {
      // Redirect to the main case simulator page
      window.location.href = '/case-simulator';
    }
  }, []);

  return (
    <>
      {/* Script to help with client-side navigation in static export */}
      <Script id="case-simulator-navigation-fix" strategy="afterInteractive">
        {`
          // Handle navigation for case simulator pages
          document.addEventListener('click', function(e) {
            // Check if the click was on a link to a case-simulator page
            const target = e.target.closest('a');
            if (target && target.href && target.href.includes('/case-simulator')) {
              const path = new URL(target.href).pathname;
              
              // Check if it's a dynamic route
              if (path.includes('/case-simulator/open/')) {
                e.preventDefault();
                const caseId = path.split('/').pop();
                window.location.href = '/case-simulator/open/' + caseId;
              }
            }
          });
        `}
      </Script>
      {children}
    </>
  );
} 