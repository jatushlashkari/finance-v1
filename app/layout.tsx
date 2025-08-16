import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from './contexts/AuthContext'
import './lib/initCronSync' // Initialize integrated cron sync

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Finance Dashboard v1',
  description: 'Modern React dashboard for financial transaction management with MongoDB integration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
