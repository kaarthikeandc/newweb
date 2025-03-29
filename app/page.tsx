"use client"

import { useEffect, useState } from "react"
import Navbar from ".././components/navbar"
import Footer from ".././components/footer"
import { Button } from "@/components/ui/button"
import { ArrowRight, Building, Building2, ChevronLeft, ChevronRight, Home, Landmark, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Dialog, DialogContent, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabaseClient"

type Project = {
  id: string
  name: string
  category: string
  description?: string
  location?: string
  client?: string
  area?: string
  year?: string
  image?: string | string[] | null
  images?: string[]
  created_at?: string
}

type ClientLogo = {
  id: string
  name: string
  image: string
}

function getProjectImages(project: Project): string[] {
  // First try to get images from the images array
  if (project.images && project.images.length > 0) {
    return project.images.map(img => 
      img?.startsWith('http') || img?.startsWith('/') 
        ? img 
        : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/projects/${img}`
    )
  }
  
  // Fallback to image field
  const imageField = project.image
  if (!imageField) return ['/placeholder.svg']
  
  if (Array.isArray(imageField)) {
    return imageField.map(img => 
      img?.startsWith('http') || img?.startsWith('/') 
        ? img 
        : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/projects/${img}`
    )
  }
  
  // Handle single image string
  return [
    imageField.startsWith('http') || imageField.startsWith('/') 
      ? imageField 
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/projects/${imageField}`
  ]
}

export default function FeaturedProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [clientLogos, setClientLogos] = useState<ClientLogo[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        
        // Fetch projects from Supabase
        const { data: projectsData, error: projectsError } = await supabase
          .from("projects")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(3)

        if (projectsError) throw projectsError

        // Process projects data
        const processedProjects = projectsData?.map(project => ({
          ...project,
          // Keep both image and images fields for compatibility
          image: project.image || null,
          images: project.images || (project.image ? 
            (Array.isArray(project.image) ? project.image : [project.image]) 
            : [])
        })) || []

        // Fetch client logos
        const { data: logosData, error: logosError } = await supabase
          .from("client_logos")
          .select("*")

        if (logosError) throw logosError

        setProjects(processedProjects)
        setClientLogos(logosData || [])
        setError(null)
      } catch (err) {
        console.error("Failed to load data:", err)
        setError("Failed to load data. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const openProjectModal = (project: Project, e: React.MouseEvent) => {
    e.preventDefault()
    setSelectedProject(project)
    setCurrentImageIndex(0)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedProject(null)
  }

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!selectedProject) return
    const images = getProjectImages(selectedProject)
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!selectedProject) return
    const images = getProjectImages(selectedProject)
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 lg:pt-32 relative">
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/contact.jpg')" }}></div>
        <div className="container mx-auto px-4 py-20 md:py-32 relative z-20 text-white">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Building Excellence, <br />
              Constructing Trust
            </h1>
            <p className="text-lg md:text-xl mb-8 text-gray-100 max-w-2xl">
              K Engineering & Construction delivers exceptional infrastructure, industrial, commercial, and residential
              projects with precision and expertise.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-[#3D8361] hover:bg-[#2A5D3C] text-white">
                <Link href="/projects">Our Projects</Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10">
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Our Services</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              We provide comprehensive construction services across various sectors, delivering quality and excellence
              in every project.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow group">
              <div className="w-16 h-16 bg-[#3D8361]/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-[#3D8361] transition-colors">
                <Landmark className="h-8 w-8 text-[#3D8361] group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Infrastructure</h3>
              <p className="text-gray-600 mb-4">
                Specialized in fabrication works, water management structures, and irrigation projects.
              </p>
              <Link
                href="/projects#infrastructure"
                className="text-[#3D8361] font-medium flex items-center hover:underline"
              >
                Learn More <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow group">
              <div className="w-16 h-16 bg-[#3D8361]/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-[#3D8361] transition-colors">
                <Building2 className="h-8 w-8 text-[#3D8361] group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Industrial</h3>
              <p className="text-gray-600 mb-4">
                Comprehensive industrial construction solutions tailored to meet specific industry requirements.
              </p>
              <Link
                href="/projects#industrial"
                className="text-[#3D8361] font-medium flex items-center hover:underline"
              >
                Learn More <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow group">
              <div className="w-16 h-16 bg-[#3D8361]/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-[#3D8361] transition-colors">
                <Building className="h-8 w-8 text-[#3D8361] group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Commercial</h3>
              <p className="text-gray-600 mb-4">
                Expert construction of retail spaces, office buildings, and commercial complexes.
              </p>
              <Link
                href="/projects#commercial"
                className="text-[#3D8361] font-medium flex items-center hover:underline"
              >
                Learn More <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow group">
              <div className="w-16 h-16 bg-[#3D8361]/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-[#3D8361] transition-colors">
                <Home className="h-8 w-8 text-[#3D8361] group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Residential</h3>
              <p className="text-gray-600 mb-4">
                Crafting beautiful, functional homes with attention to detail and quality craftsmanship.
              </p>
              <Link
                href="/projects#residential"
                className="text-[#3D8361] font-medium flex items-center hover:underline"
              >
                Learn More <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Featured Projects</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Explore some of our most notable projects that showcase our expertise and commitment to excellence.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3D8361]"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((project) => {
                const images = getProjectImages(project)
                return (
                  <div
                    key={project.id}
                    className="group overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer"
                    onClick={(e) => openProjectModal(project, e)}
                  >
                    <div className="relative h-64 overflow-hidden">
                      <Image
                        src={images[0] || "/placeholder.svg"}
                        alt={project.name}
                        fill
                        className="object-cover"
                        priority
                        unoptimized={images[0]?.startsWith("http")}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg'
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 p-4 text-white">
                        <span className="bg-[#3D8361] px-2 py-1 text-xs rounded-md">{project.category}</span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-2 text-gray-900">{project.name}</h3>
                      <p className="text-gray-600 mb-4">
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
              })}
            </div>
          )}

          <div className="text-center mt-12">
            <Button className="bg-[#2A5D3C] hover:bg-[#3D8361]">
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
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              We're proud to collaborate with these industry-leading companies who trust us with their construction
              needs.
            </p>
          </div>

          <div className="relative overflow-hidden">
            <div className="flex animate-scroll space-x-8">
              {[...clientLogos, ...clientLogos].map((logo, index) => (
                <div key={`${logo.id}-${index}`} className="w-40 h-32 flex items-center justify-center">
                  <Image 
                    src={logo.image || "/placeholder.svg"} 
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
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-[#2A5D3C] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Start Your Project?</h2>
          <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto">
            Contact us today to discuss your construction needs and how we can bring your vision to life.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-white text-[#2A5D3C] hover:bg-gray-100">
              <Link href="/contact">Contact Us</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              <Link href="/projects">View Our Work</Link>
            </Button>
          </div>
        </div>
      </section>

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
                <DialogTitle className="sr-only">
                  {selectedProject.name || "Project Details"}
                </DialogTitle>
                
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
                    src={getProjectImages(selectedProject)[currentImageIndex] || "/placeholder.svg"}
                    alt={selectedProject.name}
                    fill
                    className="object-contain"
                    unoptimized={getProjectImages(selectedProject)[currentImageIndex]?.startsWith("http")}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg'
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