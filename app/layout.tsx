import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | Pariksha',
    default: 'Pariksha — Exam System',
  },
  description: 'A modern, secure web-based examination system.',
  // No external fonts — system fonts only (PART 3.1)
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="font-sans antialiased bg-gray-50 text-gray-900 min-h-screen">
        {children}
      </body>
    </html>
  )
}

