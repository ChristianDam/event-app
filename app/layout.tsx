import { Inter } from 'next/font/google'
import './globals.css'
import { ConvexClientProvider } from './ConvexClientProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Convex Auth Showcase',
  description: 'Event management platform with Convex authentication',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  )
}