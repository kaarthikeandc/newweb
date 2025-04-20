import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import LoadingAnimation from "@/components/loading-animation"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "K Engineering & Construction",
  description: "Expert construction services for infrastructure, industrial, commercial, and residential projects",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="style-src 'self' 'unsafe-inline'; img-src 'self' data: https://zwyhkqugtactltbiftio.supabase.co;"
        />
      </head>
      <body className={inter.className}>
        <NextThemesProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <LoadingAnimation />
          {children}
        </NextThemesProvider>
      </body>
    </html>
  )
}
