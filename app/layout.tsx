import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "react-hot-toast"
import { Inter } from "next/font/google"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Nooters Farm",
  description: "A fun farming game",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="bg-black">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={`${inter.className} bg-black text-white`} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
        
        {/* SVG filters for colorblind modes - hidden visually */}
        <div className="svg-filters" aria-hidden="true">
          <svg height="0" width="0">
            <defs>
              {/* Protanopia Filter (red-green colorblindness) */}
              <filter id="protanopia-filter">
                <feColorMatrix
                  type="matrix"
                  values="0.567, 0.433, 0, 0, 0,
                          0.558, 0.442, 0, 0, 0,
                          0, 0.242, 0.758, 0, 0,
                          0, 0, 0, 1, 0"
                />
              </filter>
              
              {/* Deuteranopia Filter (red-green colorblindness, different type) */}
              <filter id="deuteranopia-filter">
                <feColorMatrix
                  type="matrix"
                  values="0.625, 0.375, 0, 0, 0,
                          0.7, 0.3, 0, 0, 0,
                          0, 0.3, 0.7, 0, 0,
                          0, 0, 0, 1, 0"
                />
              </filter>
              
              {/* Tritanopia Filter (blue-yellow colorblindness) */}
              <filter id="tritanopia-filter">
                <feColorMatrix
                  type="matrix"
                  values="0.95, 0.05, 0, 0, 0,
                          0, 0.433, 0.567, 0, 0,
                          0, 0.475, 0.525, 0, 0,
                          0, 0, 0, 1, 0"
                />
              </filter>
            </defs>
          </svg>
        </div>
        <Toaster position="top-center" toastOptions={{
          style: {
            background: '#111',
            color: '#fff',
            border: '1px solid #333',
          }
        }} />
      </body>
    </html>
  )
}