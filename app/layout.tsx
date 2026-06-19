import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { UserProvider } from '@/context/user-context'
import { ModeProvider } from '@/context/mode-context'
import { FiltersProvider } from '@/context/filters-context'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'ParkSight AI - Parking Violation Intelligence',
  description: 'Advanced parking violation analytics and enforcement dashboard',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0F1419',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-slate-950 text-slate-100">
        <UserProvider>
          <ModeProvider>
            <FiltersProvider>
              {children}
            </FiltersProvider>
          </ModeProvider>
        </UserProvider>
      </body>
    </html>
  )
}
