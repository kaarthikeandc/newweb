"use client"

import { useState, useEffect } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Award, Clock, Loader2 } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import LoadingAnimation from "@/components/loading-animation"

type Leader = {
  initials: string;
  name: string;
  role: string;
  qualification: string;
  experience: string;
};

export default function AboutPage() {
  const [heroImage, setHeroImage] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchHeroImage = async () => {
      try {
        setIsLoading(true)

        // Fetch hero image from site_settings table
        const { data, error } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "about_hero_image")
          .single()

        if (error) {
          console.error("Error fetching hero image:", error)
        } else if (data) {
          setHeroImage(data.value)
        }
      } catch (error) {
        console.error("Failed to fetch hero image:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHeroImage()
  }, [])

  const leadershipTeam: Leader[] = [
    {
      initials: "KN",
      name: "Kaarthik Natarajan",
      role: "Founder",
      qualification: "B.E (Civil), PGP ACM (Construction management from NICMAR - Pune)",
      experience: "11+ Years",
    },
    {
      initials: "SV",
      name: "Singaravelan",
     
      qualification: "B.E (Civil)",
      experience: "30+ Years in Civil Construction",
    },
    {
      initials: "KM",
      name: "Krishnamoorthi",
      
      qualification: "B.E (Mechanical)",
      experience: "35+ years in Fabrication and Erection of Steel Structures",
    },
       {
      initials: "KK",
      name: "Kumaran Kandhasamy",
      
      qualification: "Diploma in Mechanical Engineering",
      experience: "10 years in Civil Construction",
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {isLoading ? (
        <div className="flex justify-center items-center h-screen">
          <LoadingAnimation />
        </div>
      ) : (
        <>
          <Navbar />

          {/* Hero Section */}
          <section className="pt-24 lg:pt-32 relative">
            <div className="absolute inset-0 bg-black/50 z-10"></div>
            {isLoading ? (
              <div className="absolute inset-0 bg-[#2A5D3C]/80 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            ) : (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: heroImage ? `url('${heroImage}')` : "none",
                  backgroundColor: heroImage ? "transparent" : "#2A5D3C",
                }}
              ></div>
            )}
            <div className="container mx-auto px-4 py-20 relative z-20 text-white">
              <div className="max-w-3xl">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">About Us</h1>
                <p className="text-lg md:text-xl mb-8 text-gray-100 max-w-2xl">
                  K Engineering & Construction is a premier construction company with expertise in infrastructure,
                  industrial, commercial, and residential projects.
                </p>
              </div>
            </div>
          </section>

          {/* Leadership Team */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Our Leadership Team</h2>
           
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {leadershipTeam.map((leader, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl overflow-hidden group border border-gray-100 hover:border-[#3D8361]/30 transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    <div className="bg-gradient-to-r from-[#3D8361]/10 to-[#3D8361]/5 p-1">
                      <div className="bg-white p-6 rounded-t-lg">
                        <div className="flex items-center justify-between mb-6">
                          <div className="w-12 h-12 bg-[#3D8361] rounded-full flex items-center justify-center text-white font-bold text-xl">
                            {leader.initials}
                          </div>
                          <div className="w-20 h-1 bg-[#3D8361]"></div>
                        </div>
                        <h3 className="text-2xl font-bold mb-1 text-gray-900">{leader.name}</h3>
                        <p className="text-[#3D8361] font-medium mb-4 inline-block px-3 py-1 bg-[#3D8361]/10 rounded-full text-sm">
                          {leader.role}
                        </p>
                      </div>
                    </div>
                    <div className="p-6 pt-2">
                      <div className="mb-6 space-y-3">
                        <div className="flex items-start">
                          <Award className="h-5 w-5 text-[#3D8361] mt-0.5 flex-shrink-0" />
                          <div className="ml-3">
                            <p className="text-gray-700 font-medium">Qualification</p>
                            <p className="text-gray-600">{leader.qualification}</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <Clock className="h-5 w-5 text-[#3D8361] mt-0.5 flex-shrink-0" />
                          <div className="ml-3">
                            <p className="text-gray-700 font-medium">Experience</p>
                            <p className="text-gray-600">{leader.experience}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <Footer />
        </>
      )}
    </div>
  )
}
