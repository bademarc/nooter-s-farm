"use client";

import { ReactNode } from "react";

interface AccessibleLayoutProps {
  children: ReactNode;
}

export function AccessibleLayout({ children }: AccessibleLayoutProps) {
  return (
    <>
      {/* SVG Filters for Colorblind Modes - Hidden but used by CSS */}
      <div className="svg-filters" aria-hidden="true">
        <svg>
          <defs>
            {/* Protanopia Filter */}
            <filter id="protanopia-filter">
              <feColorMatrix
                type="matrix"
                values="0.567, 0.433, 0,     0, 0
                        0.558, 0.442, 0,     0, 0
                        0,     0.242, 0.758, 0, 0
                        0,     0,     0,     1, 0"
              />
            </filter>
            
            {/* Deuteranopia Filter */}
            <filter id="deuteranopia-filter">
              <feColorMatrix
                type="matrix"
                values="0.625, 0.375, 0,   0, 0
                        0.7,   0.3,   0,   0, 0
                        0,     0.3,   0.7, 0, 0
                        0,     0,     0,   1, 0"
              />
            </filter>
            
            {/* Tritanopia Filter */}
            <filter id="tritanopia-filter">
              <feColorMatrix
                type="matrix"
                values="0.95, 0.05,  0,     0, 0
                        0,    0.433, 0.567, 0, 0
                        0,    0.475, 0.525, 0, 0
                        0,    0,     0,     1, 0"
              />
            </filter>
          </defs>
        </svg>
      </div>
      
      {children}
    </>
  );
} 