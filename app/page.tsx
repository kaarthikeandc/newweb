"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Building, Building2, ChevronLeft, ChevronRight, Home, Landmark, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { supabase } from "@/lib/supabaseClient"
import { Skeleton } from "@/components/ui/skeleton"

// Types
type Project = {
  id: string
  name: string
  category: string
  description?: string | null
  location?: string | null
  client?: string | null
  area?: string | null
  year?: string | null
  image?: string | string[] | null
  images?: string[] | null
  created_at?: string
}

type ClientLogo = {
  id: string
  name: string
  image: string
}

type HeroSlide = {
  id: number | string
  image: string
  title: string
  description: string
  cta_text?: string | null
  cta_link?: string | null
}

// Constants
const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 1,
    image: "/contact.jpg",
    title: "Building Excellence, Constructing Trust",
    description: "K Engineering & Construction delivers exceptional infrastructure, industrial, commercial, and residential projects with precision and expertise.",
  }
]

const SERVICES = [
  {
    title: "Infrastructure",
    description: "Specialised in irrigation management Structures and MS Structures for Solar power plants.",
    icon: Landmark,
    link: "/projects#infrastructure"
  },
  {
    title: "Industrial",
    description: "Specialised in large span Industrial Roofing Structure for multiple Applications.",
    icon: Building2,
    link: "/projects#industrial"
  },
  {
    title: "Commercial",
    description: "Experts in Building large scale commercial complexes.",
    icon: Building,
    link: "/projects#commercial"
  },
  {
    title: "Residential",
    description: "Building homes with attention to detail and quality craftmanship.",
    icon: Home,
    link: "/projects#residential"
  }
]

// Helper functions
const getProjectImages = (project: Project): string[] => {
  const baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/projects/`
  
  // First try to get images from the images array
  if (project.images?.length) {
    return project.images.map(img => 
      img?.startsWith("http") || img?.startsWith("/") ? img : `${baseUrl}${img}`
    )
  }

  // Fallback to image field
  const imageField = project.image
  if (!imageField) return ["/placeholder.svg"]

  if (Array.isArray(imageField)) {
    return imageField.map(img => 
      img?.startsWith("http") || img?.startsWith("/") ? img : `${baseUrl}${img}`
    )
  }

  // Handle single image string
  return [
    imageField.startsWith("http") || imageField.startsWith("/") 
      ? imageField 
      : `${baseUrl}${imageField}`
  ]
}

export default function HomePage() {
  // State
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [clientLogos, setClientLogos] = useState<ClientLogo[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(DEFAULT_HERO_SLIDES)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isSlidesLoading, setIsSlidesLoading] = useState(false)

  // Memoized slide count
  const totalSlides = heroSlides.length

  // Data fetching
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Fetch all data in parallel
      const [
        { data: projectsData, error: projectsError },
        { data: logosData, error: logosError },
      ] = await Promise.all([
        supabase
          .from("projects")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(3),
        supabase.from("client_logos").select("*")
      ])

      if (projectsError) throw projectsError
      if (logosError) throw logosError

      setProjects(projectsData || [])
      setClientLogos(logosData || [])
    } catch (err) {
      console.error("Failed to load data:", err)
      setError("Failed to load data. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchSlides = useCallback(async () => {
    try {
      setIsSlidesLoading(true)
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      if (data?.length) setHeroSlides(data)
    } catch (err) {
      console.error("Error fetching slides:", err)
      // Fallback to default slides
    } finally {
      setIsSlidesLoading(false)
    }
  }, [])

  // Effects
  useEffect(() => {
    fetchData()
    fetchSlides()
  }, [fetchData, fetchSlides])

  useEffect(() => {
    if (totalSlides <= 1) return
    
    const slideInterval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % totalSlides)
    }, 5000)

    return () => clearInterval(slideInterval)
  }, [totalSlides])

  // Handlers
  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % totalSlides)
  }, [totalSlides])

  const prevSlide = useCallback(() => {
    setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides)
  }, [totalSlides])

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index)
  }, [])

  const openProjectModal = useCallback((project: Project, e: React.MouseEvent) => {
    e.preventDefault()
    setSelectedProject(project)
    setCurrentImageIndex(0)
    setIsModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedProject(null)
  }, [])

  const nextImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!selectedProject) return
    const images = getProjectImages(selectedProject)
    setCurrentImageIndex(prev => (prev + 1) % images.length)
  }, [selectedProject])

  const prevImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!selectedProject) return
    const images = getProjectImages(selectedProject)
    setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length)
  }, [selectedProject])

  // Render functions
  const renderServiceCard = (service: typeof SERVICES[0]) => (
    <div key={service.title} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow group">
      <div className="w-16 h-16 bg-[#3D8361]/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-[#3D8361] transition-colors">
        <service.icon className="h-8 w-8 text-[#3D8361] group-hover:text-white transition-colors" />
      </div>
      <h3 className="text-xl font-bold mb-3 text-gray-900">{service.title}</h3>
      <p className="text-gray-600 mb-4">{service.description}</p>
      <Link href={service.link} className="text-[#3D8361] font-medium flex items-center hover:underline">
        Learn More <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </div>
  )

  const renderProjectCard = (project: Project) => {
    const images = getProjectImages(project)
    return (
      <div
        key={project.id}
        className="group overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer"
        onClick={(e) => openProjectModal(project, e)}
      >
        <div className="relative h-64 overflow-hidden">
          <Image
            src={images[0]}
            alt={project.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority
            unoptimized={images[0]?.startsWith("http")}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.svg"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-4 text-white">
            <span className="bg-[#3D8361] px-2 py-1 text-xs rounded-md">{project.category}</span>
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-xl font-bold mb-2 text-gray-900">{project.name}</h3>
          <p className="text-gray-600 mb-4 line-clamp-2">
            {project.description ||
              `${project.area || ""} ${project.client ? `for ${project.client}` : ""} ${project.location ? `in ${project.location}` : ""}`}
          </p>
          <button
            className="text-[#3D8361] font-medium flex items-center hover:underline bg-transparent border-none p-0 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              openProjectModal(project, e)
            }}
          >
            View Project <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section Slider */}
      <section className="pt-24 lg:pt-32 relative h-[600px] overflow-hidden">
        {/* Slides container with transition */}
        <div
          className="absolute inset-0 transition-transform duration-700 ease-in-out flex"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {heroSlides.map((slide) => (
            <div key={slide.id} className="min-w-full h-full relative">
              <div className="absolute inset-0">
                <Image
                  src={slide.image}
                  alt=""
                  fill
                  className="object-cover"
                  priority
                  unoptimized={slide.image?.startsWith("http")}
                />
              </div>
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="container relative mx-auto px-4 py-20 md:py-32 z-20 text-white h-full flex items-center">
                <div className="max-w-3xl">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">{slide.title}</h1>
                  <p className="text-lg md:text-xl mb-8 text-gray-100 max-w-2xl">{slide.description}</p>
                 
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation arrows */}
        {totalSlides > 1 && (
          <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between z-30 px-4 md:px-10 pointer-events-none">
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/30 text-white hover:bg-black/50 rounded-full h-12 w-12 pointer-events-auto"
              onClick={prevSlide}
            >
              <ChevronLeft className="h-6 w-6" />
              <span className="sr-only">Previous slide</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/30 text-white hover:bg-black/50 rounded-full h-12 w-12 pointer-events-auto"
              onClick={nextSlide}
            >
              <ChevronRight className="h-6 w-6" />
              <span className="sr-only">Next slide</span>
            </Button>
          </div>
        )}

        {/* Slide indicators */}
        {totalSlides > 1 && (
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-30 pointer-events-none">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all pointer-events-auto ${
                  index === currentSlide ? "bg-white w-8" : "bg-white/50"
                }`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Services Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Our Services</h2>
          
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {SERVICES.map(renderServiceCard)}
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Featured Projects</h2>
           
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="overflow-hidden rounded-lg shadow-md">
                  <Skeleton className="h-64 w-full" />
                  <div className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map(renderProjectCard)}
            </div>
          )}

          <div className="text-center mt-12">
            <Button asChild className="bg-[#2A5D3C] hover:bg-[#3D8361]">
              <Link href="/projects">View All Projects</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Our Clients Section */}
      <section className="py-16 md:py-24 bg-gray-50 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Our Clients</h2>
          
          </div>

          {clientLogos.length > 0 ? (
            <div className="relative overflow-hidden">
              <div className="flex animate-scroll space-x-8">
                {[...clientLogos, ...clientLogos].map((logo, index) => (
                  <div key={`${logo.id}-${index}`} className="w-40 h-32 flex items-center justify-center flex-shrink-0">
                    <Image
                      src={logo.image}
                      alt={logo.name}
                      width={150}
                      height={100}
                      className="max-h-20 w-auto object-contain"
                      unoptimized={logo.image?.startsWith("http")}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex justify-center gap-8 flex-wrap">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="w-40 h-32" />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}


      <Footer />

      {/* Project Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogPortal>
          <DialogOverlay className="bg-black/80" onClick={closeModal} />
          <DialogContent
            className="max-w-4xl p-0 border-none bg-transparent max-h-[90vh] overflow-hidden"
            onInteractOutside={closeModal}
            onEscapeKeyDown={closeModal}
          >
            {selectedProject && (
              <div className="relative">
                <DialogTitle className="sr-only">{selectedProject.name || "Project Details"}</DialogTitle>

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-50 bg-black/50 text-white hover:bg-black/70 rounded-full"
                  onClick={closeModal}
                >
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </Button>

                <div className="relative h-[70vh] w-full">
                  <Image
                    src={getProjectImages(selectedProject)[currentImageIndex]}
                    alt={selectedProject.name}
                    fill
                    className="object-contain"
                    unoptimized={getProjectImages(selectedProject)[currentImageIndex]?.startsWith("http")}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg"
                    }}
                  />
                </div>

                {getProjectImages(selectedProject).length > 1 && (
                  <>
                    <div className="absolute inset-y-0 flex items-center justify-between w-full px-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="bg-black/50 text-white hover:bg-black/70 rounded-full"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="h-8 w-8" />
                        <span className="sr-only">Previous image</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="bg-black/50 text-white hover:bg-black/70 rounded-full"
                        onClick={nextImage}
                      >
                        <ChevronRight className="h-8 w-8" />
                        <span className="sr-only">Next image</span>
                      </Button>
                    </div>

                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                      {getProjectImages(selectedProject).map((_, index) => (
                        <button
                          key={index}
                          className={`w-2 h-2 rounded-full ${index === currentImageIndex ? "bg-white" : "bg-white/50"}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            setCurrentImageIndex(index)
                          }}
                          aria-label={`Go to image ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </DialogPortal>
      </Dialog>

      <style jsx>{`
        @keyframes scroll { 
          0% { transform: translateX(0); } 
          100% { transform: translateX(-50%); } 
        }
        .animate-scroll { 
          display: flex; 
          animation: scroll 20s linear infinite; 
          width: max-content; 
        }
      `}</style>
    </div>
  )
}
