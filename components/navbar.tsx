"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Image from "next/image"

const navLinks = [
  { name: "Home", href: "/" },
  { name: "About Us", href: "/about" },
  { name: "Projects", href: "/projects" },
  { name: "Gallery", href: "/gallery" },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeLink, setActiveLink] = useState("")

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }

    // Set active link based on current path
    const path = window.location.pathname
    setActiveLink(path)

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
        scrolled ? "bg-white shadow-md py-2" : "bg-white/90 backdrop-blur-sm py-4",
      )}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <Image src="/logo.png" alt="K Engineering Logo" width={40} height={40} />
          <div>
            <div className="text-[#2A5D3C] font-bold text-lg md:text-xl">K Engineering</div>
            <div className="text-[#3D8361] text-xs md:text-sm font-medium -mt-1">& Construction</div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "px-3 py-2 rounded-md text-gray-700 font-medium relative",
                "transition-all duration-300 ease-in-out",
                "hover:text-[#2A5D3C]",
                "after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2",
                "after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-[#2A5D3C] after:to-[#3D8361]",
                "after:transition-all after:duration-300 after:ease-in-out",
                "hover:after:w-4/5",
                activeLink === link.href &&
                  "text-[#2A5D3C] after:w-4/5 bg-gradient-to-b from-transparent to-[#3D8361]/5",
              )}
            >
              {link.name}
            </Link>
          ))}
          <Button
            className="ml-4 bg-gradient-to-r from-[#2A5D3C] to-[#3D8361] hover:shadow-md hover:shadow-[#3D8361]/20 
            transition-all duration-300 hover:scale-105"
          >
            <Link href="/contact">Contact Us</Link>
          </Button>
        </nav>

        {/* Mobile Navigation Toggle */}
        <button
          className="md:hidden text-gray-700 hover:text-[#2A5D3C] transition-transform duration-200 hover:scale-110"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg py-4 border-t border-gray-100 animate-in slide-in-from-top duration-300">
          <nav className="container mx-auto px-4 flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "block px-3 py-2 rounded-md text-gray-700 font-medium relative",
                  "transition-all duration-300 ease-in-out",
                  "hover:text-[#2A5D3C] hover:pl-5",
                  "after:absolute after:left-0 after:top-1/2 after:-translate-y-1/2",
                  "after:w-0 after:h-4/5 after:border-l-2 after:border-[#2A5D3C]",
                  "after:transition-all after:duration-300 after:ease-in-out",
                  "hover:after:h-4/5",
                  activeLink === link.href &&
                    "text-[#2A5D3C] pl-5 after:h-4/5 bg-gradient-to-r from-[#3D8361]/5 to-transparent",
                )}
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <Button
              className="mt-4 w-full bg-gradient-to-r from-[#2A5D3C] to-[#3D8361] hover:shadow-md hover:shadow-[#3D8361]/20 
              transition-all duration-300"
            >
              <Link href="/contact" onClick={() => setIsOpen(false)}>
                Contact Us
              </Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}

