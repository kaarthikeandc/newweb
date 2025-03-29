"use client"

import { useState, useEffect } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, ZoomIn, X, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { supabase } from "@/lib/supabaseClient"

// Project type definition
type Project = {
  id: string
  name: string
  category: string
  description?: string
  location?: string
  client?: string
  area?: string
  year?: string
  images?: string[]
  created_at?: string
}

export default function GalleryPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProject, setSelectedProject] = useState<null | Project>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [visibleCount, setVisibleCount] = useState(12)
  const [error, setError] = useState<string | null>(null)

  // Fetch projects from Supabase
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true)
        const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        if (data) {
          // Process data to ensure images is always an array
          const processedData = data.map((project) => {
            if (project.image && !project.images) {
              return {
                ...project,
                images: [project.image],
              }
            } else if (!project.images) {
              return {
                ...project,
                images: [],
              }
            }
            return project
          })

          setProjects(processedData)
        }
      } catch (error: any) {
        console.error("Error fetching projects:", error.message)
        setError("Failed to load projects. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()
  }, [])

  // Filter projects based on active tab and search query
  const filteredProjects = projects.filter((project) => {
    // Skip projects with no images
    if (!project.images || project.images.length === 0) return false

    const matchesCategory = activeTab === "all" || project.category.toLowerCase() === activeTab
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (project.location && project.location.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesCategory && matchesSearch
  })

  const visibleProjects = filteredProjects.slice(0, visibleCount)
  const hasMore = visibleProjects.length < filteredProjects.length

  const loadMore = () => {
    setVisibleCount((prev) => prev + 8)
  }

  // Handle image navigation in modal
  const nextImage = () => {
    if (selectedProject && selectedProject.images) {
      setSelectedImageIndex((prev) => (prev < selectedProject.images!.length - 1 ? prev + 1 : 0))
    }
  }

  const prevImage = () => {
    if (selectedProject && selectedProject.images) {
      setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : selectedProject.images!.length - 1))
    }
  }

  // Open modal with specific project and image index
  const openModal = (project: Project, imageIndex = 0) => {
    setSelectedProject(project)
    setSelectedImageIndex(imageIndex)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-16 lg:pt-24 relative">
        <div className="absolute inset-0 bg-black/60 z-10"></div>
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/beat.jpg')" }}></div>
        <div className="container mx-auto px-4 py-12 md:py-20 relative z-20 text-white">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6">Project Gallery</h1>
            <p className="text-base md:text-xl mb-6 md:mb-8 text-gray-100 max-w-2xl">
              Browse through our collection of completed projects across various sectors.
            </p>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 w-full gap-1 h-auto">
                <TabsTrigger value="all" className="px-2 py-1.5 h-auto text-sm">
                  All
                </TabsTrigger>
                <TabsTrigger value="infrastructure" className="px-2 py-1.5 h-auto text-sm">
                  Infrastructure
                </TabsTrigger>
                <TabsTrigger value="industrial" className="px-2 py-1.5 h-auto text-sm">
                  Industrial
                </TabsTrigger>
                <TabsTrigger value="commercial" className="px-2 py-1.5 h-auto text-sm">
                  Commercial
                </TabsTrigger>
                <TabsTrigger value="residential" className="px-2 py-1.5 h-auto text-sm">
                  Residential
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Search projects..."
                className="pl-10 pr-4 py-2 w-full border rounded-md"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
              <span>Loading projects...</span>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <h3 className="text-xl font-bold mb-2 text-red-600">{error}</h3>
              <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-20">
              <h3 className="text-xl font-bold mb-2">No projects found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("")
                  setActiveTab("all")
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {visibleProjects.map((project) => (
                <div
                  key={project.id}
                  className="group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => openModal(project, 0)}
                >
                  <div className="relative h-52 sm:h-64 overflow-hidden">
                    <Image
                      src={project.images && project.images[0] ? project.images[0] : "/placeholder.svg"}
                      alt={project.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-white/90 rounded-full p-2 sm:p-3">
                        <ZoomIn className="h-5 w-5 sm:h-6 sm:w-6 text-[#2A5D3C]" />
                      </div>
                    </div>
                    {project.images && project.images.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                        +{project.images.length - 1}
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 p-3 bg-gradient-to-t from-black/70 to-transparent w-full">
                      <span className="text-white font-medium text-sm sm:text-base">{project.name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasMore && (
            <div className="flex justify-center mt-12">
              <Button className="bg-[#2A5D3C] hover:bg-[#3D8361]" onClick={loadMore}>
                Load More
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Image Modal */}
      {selectedProject && selectedProject.images && selectedProject.images.length > 0 && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-2 sm:p-4"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="relative max-w-5xl w-full bg-white rounded-lg overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white/80 rounded-full p-1.5 sm:p-2 hover:bg-white transition-colors z-10"
              onClick={() => setSelectedProject(null)}
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            <div className="relative h-[50vh] sm:h-[60vh] md:h-[70vh]">
              <Image
                src={selectedProject.images[selectedImageIndex] || "/placeholder.svg"}
                alt={`${selectedProject.name} - Image ${selectedImageIndex + 1}`}
                fill
                className="object-contain"
              />

              {selectedProject.images.length > 1 && (
                <>
                  <button
                    className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white/80 rounded-full p-2 sm:p-3 hover:bg-white transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      prevImage()
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 sm:h-5 sm:w-5"
                    >
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </button>
                  <button
                    className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white/80 rounded-full p-2 sm:p-3 hover:bg-white transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      nextImage()
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 sm:h-5 sm:w-5"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails for multiple images - make scrollable on mobile */}
            {selectedProject.images.length > 1 && (
              <div className="px-3 sm:px-6 pt-2 sm:pt-4 overflow-x-auto">
                <div className="flex gap-1 sm:gap-2 pb-2 snap-x snap-mandatory">
                  {selectedProject.images.map((img, idx) => (
                    <div
                      key={idx}
                      className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded overflow-hidden cursor-pointer border-2 flex-shrink-0 snap-start ${
                        idx === selectedImageIndex ? "border-[#2A5D3C]" : "border-transparent"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedImageIndex(idx)
                      }}
                    >
                      <Image
                        src={img || "/placeholder.svg"}
                        alt={`Thumbnail ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

