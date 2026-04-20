// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { getCurrentUser } from '@/lib/session'
import DashboardLayout from '@/components/DashboardLayout' // Import komponen mesin kita!
import { FeedbackProvider } from '@/components/FeedbackProvider'
import { BottomNav } from "@superapp/ui";
import { LayoutDashboard, Wallet, Sword } from "lucide-react";

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
            <DashboardLayout user={{ id: user.sub, name: user.name, email: user.email }}>
              {children}
            </DashboardLayout>
          ) : (
            children
          )}
          {user && (
            <BottomNav 
              items={[
                { label: "Hub", href: "/", icon: <LayoutDashboard className="w-full h-full" /> },
                { label: "Finance", href: "/finance", icon: <Wallet className="w-full h-full" />, isActive: true },
                { label: "Quests", href: "/quests", icon: <Sword className="w-full h-full" /> },
              ]}
            />
          )}
        </FeedbackProvider>
      </body>
    </html>
  )
}