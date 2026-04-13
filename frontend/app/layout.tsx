import type { Metadata } from "next"
import { Suspense } from "react"
import { HamburgerMenu } from "@/components/navigation/hamburger-menu"
import "./globals.css"
import "leaflet/dist/leaflet.css"

export const metadata: Metadata = {
  title: "Dashboard Giras",
  description: "Operational dashboard built with Next.js and FastAPI",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-50 text-slate-900">
        <Suspense fallback={null}>
          <HamburgerMenu />
        </Suspense>
        <div className="pt-20">{children}</div>
      </body>
    </html>
  )
}
