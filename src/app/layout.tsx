import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ProfeMeet | Control Remoto y Videoclases',
  description: 'Sistema de control remoto para enseñanza a distancia.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="nm-flat-gray-100 min-h-screen text-[#444746] selection:bg-blue-100">{children}</body>
    </html>
  )
}
