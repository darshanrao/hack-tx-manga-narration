import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import React from 'react'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Manga Reader for Visually Impaired',
  description: 'An accessible manga reader with audio narration features',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="bg-slate-900">
      <body className={`${inter.className} bg-slate-900`}>{children}</body>
    </html>
  )
}
