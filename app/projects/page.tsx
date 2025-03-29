"use client"

import { useState, useEffect, useCallback, useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, X, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from "@/components/ui/dialog"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { supabase } from "@/lib/supabaseClient"

interface Project {
  id: string
  name?: string
  title?: string
  category: string
  client: string
  location: string
  description: string
  image: string | string[]
  images?: string[]
  created_at?: string
}

function getProjectImages(project: Project): string[] {
  // First try to get images from the images array
  if (project.images && project.images.length > 0) {
    return project.images.map(img => 
      img.startsWith('http') || img.startsWith('/') 
        ? img 
        : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/projects/${img}`
    )
  }
  
  // Fallback to image field
  const imageField = project.image
  if (Array.isArray(imageField)) {
    return imageField.map(img => 
      img.startsWith('http') || img.startsWith('/') 
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

function ProjectsFilter({ categories, activeTab }: { categories: string[]; activeTab: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const hash = window.location.hash.replace("#", "")
    if (hash && categories.includes(hash) && activeTab !== hash) {
      const params = new URLSearchParams(searchParams.toString())
      params.set("category", hash)
      router.push(`${pathname}?${params.toString()}`)
    }
  }, [categories, activeTab, pathname, router, searchParams])

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === "all") {
        params.delete(name)
      } else {
        params.set(name, value)
      }
      return params.toString()
    },
    [searchParams],
  )

  const handleTabChange = (value: string) => {
    const queryString = createQueryString("category", value)
    router.push(`${pathname}${queryString ? `?${queryString}` : ""}`)

    if (value !== "all") {
      window.history.replaceState(null, "", `#${value}`)
    } else {
      window.history.replaceState(null, "", pathname)
    }
  }

  return (
    <Tabs defaultValue={activeTab} value={activeTab} onValueChange={handleTabChange} className="w-full max-w-3xl">
      <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 w-full gap-1 h-auto">
        <TabsTrigger value="all" className="px-2 py-1.5 h-auto text-sm">
          All
        </TabsTrigger>
        {categories.map((category) => (
          <TabsTrigger key={category} value={category} id={category} className="px-2 py-1.5 h-auto text-sm">
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

function ProjectsSearch({ initialQuery, onSearch }: { initialQuery: string; onSearch: (query: string) => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [isPending, startTransition] = useTransition()

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(name, value)
      } else {
        params.delete(name)
      }
      return params.toString()
    },
    [searchParams],
  )

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    onSearch(value)

    startTransition(() => {
      const queryString = createQueryString("q", value)
      router.push(`${pathname}${queryString ? `?${queryString}` : ""}`)
    })
  }

  return (
    <div className="relative w-full md:max-w-sm">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
      <Input
        type="text"
        placeholder="Search projects..."
        className="pl-10 pr-4 py-2 w-full border rounded-md"
        value={searchQuery}
        onChange={handleSearch}
        aria-label="Search projects"
      />
      {isPending && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="h-4 w-4 border-t-2 border-r-2 border-[#2A5D3C] rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  )
}

function ProjectsList({ projects, searchQuery }: { projects: Project[]; searchQuery: string }) {
  const [filteredProjects, setFilteredProjects] = useState<Project[]>(projects)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (!searchQuery) {
      setFilteredProjects(projects)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = projects.filter((project) => {
      return (
        (project.name && project.name.toLowerCase().includes(query)) ||
        (project.title && project.title.toLowerCase().includes(query)) ||
        (project.description && project.description.toLowerCase().includes(query)) ||
        (project.client && project.client.toLowerCase().includes(query)) ||
        (project.location && project.location.toLowerCase().includes(query)) ||
        (project.category && project.category.toLowerCase().includes(query))
      )
    })

    setFilteredProjects(filtered)
  }, [projects, searchQuery])

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

  if (filteredProjects.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-lg">
        <h3 className="text-xl font-bold mb-2">No projects found</h3>
        <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
        <Button variant="outline" asChild>
          <Link href="/projects">Clear Filters</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {filteredProjects.map((project) => {
          const projectImages = getProjectImages(project)

          return (
            <div
              key={project.id}
              className="group overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer"
              onClick={(e) => openProjectModal(project, e)}
            >
              <div className="relative h-52 sm:h-64 overflow-hidden">
                <Image
                  src={projectImages[0] || "/placeholder.svg"}
                  alt={project.name || project.title || "Project"}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority
                  unoptimized={projectImages[0]?.startsWith("http")}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-4 text-white">
                  <span className="bg-[#3D8361] px-2 py-1 text-xs rounded-md capitalize">{project.category}</span>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">{project.name || project.title}</h3>
                <div className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                  <p>{project.location}</p>
                  <p>Client: {project.client}</p>
                </div>
                <p className="text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2">{project.description}</p>
                <button
                  className="text-[#3D8361] font-medium flex items-center text-sm hover:underline bg-transparent border-none p-0 cursor-pointer"
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-50 bg-black/50 text-white hover:bg-black/70 rounded-full"
                  onClick={closeModal}
                >
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </Button>

                <div className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] w-full">
                  <Image
                    src={getProjectImages(selectedProject)[currentImageIndex] || "/placeholder.svg"}
                    alt={selectedProject.name || selectedProject.title || "Project image"}
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
                    <div className="absolute inset-y-0 flex items-center justify-between w-full px-2 sm:px-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="bg-black/50 text-white hover:bg-black/70 rounded-full h-8 w-8 sm:h-10 sm:w-10"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                        <span className="sr-only">Previous image</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="bg-black/50 text-white hover:bg-black/70 rounded-full h-8 w-8 sm:h-10 sm:w-10"
                        onClick={nextImage}
                      >
                        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
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
    </>
  )
}

export default function ProjectsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [projects, setProjects] = useState<Project[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState(searchParams?.get("q") || "")
  const activeTab = searchParams?.get("category") || "all"

  useEffect(() => {
    async function fetchProjects() {
      try {
        setIsLoading(true)
        const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        if (data) {
          const processedData = data.map((project) => {
            // Normalize image data
            let images: string[] = []
            
            if (project.images && project.images.length > 0) {
              images = project.images
            } else if (project.image) {
              images = Array.isArray(project.image) ? project.image : [project.image]
            } else {
              images = ["/placeholder.svg"]
            }

            return {
              ...project,
              image: images[0], // Keep first image in image field for backward compatibility
              images // Store all images in images array
            }
          })

          setProjects(processedData)

          // Extract unique categories
          const uniqueCategories = Array.from(new Set(processedData.map((project) => project.category)))
          setCategories(uniqueCategories)
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

  const filteredByCategory =
    activeTab === "all" ? projects : projects.filter((project) => project.category === activeTab)

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="pt-16 lg:pt-24 relative">
        <div className="absolute inset-0 bg-black/60 z-10"></div>
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/black.jpg')" }}></div>
        <div className="container mx-auto px-4 py-12 md:py-20 relative z-20 text-white">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6">Our Projects</h1>
            <p className="text-base md:text-xl mb-6 md:mb-8 text-gray-100 max-w-2xl">
              Explore our diverse portfolio of infrastructure, industrial, commercial, and residential projects.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            {isLoading ? (
              <div className="w-full max-w-3xl h-10 bg-muted animate-pulse rounded-md"></div>
            ) : (
              <ProjectsFilter categories={categories} activeTab={activeTab} />
            )}

            {isLoading ? (
              <div className="w-full md:max-w-sm h-10 bg-muted animate-pulse rounded-md"></div>
            ) : (
              <ProjectsSearch initialQuery={searchQuery} onSearch={handleSearch} />
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-lg shadow-md overflow-hidden">
                  <div className="h-64 bg-muted animate-pulse"></div>
                  <div className="p-6 space-y-4">
                    <div className="h-6 bg-muted animate-pulse rounded"></div>
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                    <div className="h-16 bg-muted animate-pulse rounded"></div>
                    <div className="h-4 bg-muted animate-pulse rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <h3 className="text-xl font-bold mb-2 text-red-600">{error}</h3>
              <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : (
            <ProjectsList projects={filteredByCategory} searchQuery={searchQuery} />
          )}
        </div>
      </section>

      <section className="py-12 md:py-20 bg-[#2A5D3C] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6">Have a Project in Mind?</h2>
          <p className="text-base md:text-xl text-gray-200 mb-6 md:mb-8 max-w-3xl mx-auto">
            Contact our team today to discuss your construction needs and how we can bring your vision to life.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-white text-[#2A5D3C] hover:bg-gray-100">
              <Link href="/get-a-quote">Get a Quote</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}