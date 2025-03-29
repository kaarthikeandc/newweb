"use client"

import { AdminPanel } from "@/components/admin-panel"
import Footer from "@/components/footer"

export default function AdminPage() {
  return (
    <div>
      <div className="container mx-auto py-8">
        <AdminPanel />
      </div>
      <Footer />
    </div>
  )
}

