// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { getCurrentUser } from '@/lib/session'
import DashboardLayout from '@/components/DashboardLayout' // Import komponen mesin kita!
import { FeedbackProvider } from '@/components/FeedbackProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MyKanz - Wealth Management Dashboard',
  description: 'Pantau pergerakan aset dan target keuanganmu hari ini.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  return (
    <html lang="id" className={`${inter.className} light`}>
      <body>
        <FeedbackProvider>
          {/* Kalau user login, bungkus dengan DashboardLayout. Kalau nggak (misal di halaman login), biarkan kosong */}
          {user ? (
            <DashboardLayout user={user}>
              {children}
            </DashboardLayout>
          ) : (
            children
          )}
        </FeedbackProvider>
      </body>
    </html>
  )
}