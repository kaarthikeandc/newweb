import Link from "next/link"
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-[#2A5D3C] text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <div className="relative h-10 w-10">
                <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="100" cy="100" r="100" fill="white" />
                  <path
                    d="M50 50 L100 50 L50 150 L100 150"
                    stroke="#2A5D3C"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M100 50 L150 150"
                    stroke="#2A5D3C"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M75 100 L125 100"
                    stroke="#2A5D3C"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="font-bold text-xl">Engineering & Construction</span>
            </div>
            <p className="text-gray-200 mb-4">
              Expert construction services for infrastructure, industrial, commercial, and residential projects.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white hover:text-[#3D8361] transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-white hover:text-[#3D8361] transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-white hover:text-[#3D8361] transition-colors">
                <Linkedin size={20} />
              </a>
              <a href="#" className="text-white hover:text-[#3D8361] transition-colors">
                <Instagram size={20} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-xl mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-200 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-200 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/projects" className="text-gray-200 hover:text-white transition-colors">
                  Projects
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="text-gray-200 hover:text-white transition-colors">
                  Gallery
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-200 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-xl mb-6">Services</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/projects#infrastructure" className="text-gray-200 hover:text-white transition-colors">
                  Infrastructure
                </Link>
              </li>
              <li>
                <Link href="/projects#industrial" className="text-gray-200 hover:text-white transition-colors">
                  Industrial
                </Link>
              </li>
              <li>
                <Link href="/projects#commercial" className="text-gray-200 hover:text-white transition-colors">
                  Commercial
                </Link>
              </li>
              <li>
                <Link href="/projects#residential" className="text-gray-200 hover:text-white transition-colors">
                  Residential
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-xl mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <MapPin size={20} className="flex-shrink-0 mt-1" />
                <span className="text-gray-200">Coimbatore, Tamil Nadu, India</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone size={20} className="flex-shrink-0" />
                <a href="tel:+919952362061" className="text-gray-200 hover:text-white transition-colors">
                  +91 99523 62061
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Mail size={20} className="flex-shrink-0" />
                <a href="mailto:Kaarthikeandc@gmail.com" className="text-gray-200 hover:text-white transition-colors">
                  Kaarthikeandc@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-600 mt-12 pt-6 text-center text-gray-300">
          <p>&copy; {new Date().getFullYear()} K Engineering & Construction. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

