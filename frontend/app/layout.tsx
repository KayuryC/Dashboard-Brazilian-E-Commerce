import type { Metadata } from "next"
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
      <body>{children}</body>
    </html>
  )
}
