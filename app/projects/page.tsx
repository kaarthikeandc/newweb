"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, X, ChevronLeft, ChevronRight, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { supabase } from "@/lib/supabaseClient"
import LoadingAnimation from "@/components/loading-animation"
interface Project {
  id: string
  name?: string
  title?: string
  description?: string
  location?: string
  client?: string
  category: string
  image?: string
  images?: string[]
  created_at?: string
}
function ProjectsFilter({
  categories,
  activeTab,
  isMobile = false,
  onTabChange,
}: {
  categories: string[]
  activeTab: string
  isMobile?: boolean
  onTabChange?: (tab: string) => void
}) {
  const handleTabChange = (tab: string) => {
    onTabChange?.(tab)
  }

  if (isMobile) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full md:w-auto flex justify-between items-center">
            <span className="truncate">
              {activeTab === "all" ? "All Projects" : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </span>
            <Filter className="h-4 w-4 ml-2 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px] max-h-[300px] overflow-y-auto">
          <DropdownMenuItem onSelect={() => handleTabChange("all")}>All Projects</DropdownMenuItem>
          {categories.map((category) => (
            <DropdownMenuItem key={category} onSelect={() => handleTabChange(category)}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Tabs defaultValue={activeTab} value={activeTab} onValueChange={handleTabChange} className="w-full max-w-3xl">
      <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 w-full gap-1 h-auto">
        <TabsTrigger value="all" className="px-2 py-1.5 h-auto text-sm whitespace-nowrap">
          All
        </TabsTrigger>
        {categories.map((category) => (
          <TabsTrigger
            key={category}
            value={category}
            id={category}
            className="px-2 py-1.5 h-auto text-sm whitespace-nowrap overflow-hidden text-ellipsis"
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

function ProjectsSearch({ initialQuery, onSearch }: { initialQuery: string; onSearch: (query: string) => void }) {
  const [searchQuery, setSearchQuery] = useState(initialQuery)

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    onSearch(query)
  }

  const clearSearch = () => {
    setSearchQuery("")
    onSearch("")
  }

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
      <Input
        type="text"
        placeholder="Search projects..."
        className="pl-10 pr-10 py-2 w-full border rounded-md"
        value={searchQuery}
        onChange={handleSearch}
        aria-label="Search projects"
      />
      {searchQuery && (
        <button
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          onClick={clearSearch}
          aria-label="Clear search"
        >
          <X size={18} />
        </button>
      )}
    </div>
  )
}

function ProjectsList({ projects, searchQuery }: { projects: Project[]; searchQuery: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const filteredProjects = projects.filter(
    (project) =>
      project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getProjectImages = (project: Project) => {
    const images = []
    if (project.image) images.push(project.image)
    if (project.images) images.push(...project.images)
    return images
  }

  const openProjectModal = (project: Project, e: React.MouseEvent) => {
    e.preventDefault()
    setSelectedProject(project)
    setCurrentImageIndex(0)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedProject(null)
    setCurrentImageIndex(0)
  }

  const nextImage = useCallback(() => {
    if (selectedProject) {
      const images = getProjectImages(selectedProject)
      setCurrentImageIndex((prev) => (prev + 1) % images.length)
    }
  }, [selectedProject])

  const previousImage = useCallback(() => {
    if (selectedProject) {
      const images = getProjectImages(selectedProject)
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
    }
  }, [selectedProject])

  useEffect(() => {
    let touchStartX = 0
    let touchEndX = 0

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX
    }

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX
      handleSwipe()
    }

    const handleSwipe = () => {
      if (touchEndX < touchStartX - 50) {
        // Swipe left
        nextImage()
      }
      if (touchEndX > touchStartX + 50) {
        // Swipe right
        previousImage()
      }
    }

    if (isModalOpen && selectedProject) {
      document.addEventListener("touchstart", handleTouchStart, false)
      document.addEventListener("touchend", handleTouchEnd, false)
    }

    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isModalOpen, selectedProject, nextImage, previousImage])

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        {filteredProjects.map((project) => {
          const projectImages = getProjectImages(project)

          return (
            <div
              key={project.id}
              className="group overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200 hover:-translate-y-1"
              onClick={(e) => openProjectModal(project, e)}
            >
              <div className="relative h-48 sm:h-52 md:h-64 overflow-hidden">
                {projectImages[0] ? (
                  <Image
                    src={projectImages[0] || "/placeholder.svg"}
                    alt={project.name || project.title || "Project"}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    priority
                    unoptimized={projectImages[0]?.startsWith("http")}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">No image</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-4 text-white">
                  <Badge className="bg-[#3D8361] hover:bg-[#2A5D3C] text-white border-none capitalize text-xs sm:text-sm">
                    {project.category}
                  </Badge>
                </div>
              </div>
              <div className="p-3 sm:p-4 md:p-6">
                <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 text-gray-900 group-hover:text-[#3D8361] transition-colors line-clamp-2">
                  {project.name || project.title}
                </h3>
                <div className="text-xs sm:text-sm text-gray-500 mb-2">
                  <p className="truncate">{project.location}</p>
           
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                <button
                  className="text-[#3D8361] font-medium flex items-center text-sm hover:underline bg-transparent border-none p-0 cursor-pointer group-hover:translate-x-1 transition-transform"
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
          <DialogOverlay className="bg-black/80 backdrop-blur-sm" onClick={closeModal} />
          <DialogContent
            className="max-w-5xl w-[95%] p-0 border-none bg-white dark:bg-gray-900 max-h-[90vh] overflow-hidden rounded-lg shadow-xl"
            onInteractOutside={closeModal}
            onEscapeKeyDown={closeModal}
          >
            {selectedProject && (
              <div className="flex flex-col h-full">
                <div className="relative w-full h-[40vh] sm:h-[50vh] md:h-[70vh] bg-black">
                  <div className="absolute top-4 right-4 z-20">
                    <button
                      onClick={closeModal}
                      className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                      aria-label="Close modal"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  {getProjectImages(selectedProject)[currentImageIndex] && (
                    <Image
                      src={getProjectImages(selectedProject)[currentImageIndex] || "/placeholder.svg"}
                      alt={selectedProject.name || selectedProject.title || "Project"}
                      fill
                      className="object-contain"
                      priority
                      unoptimized={getProjectImages(selectedProject)[currentImageIndex]?.startsWith("http")}
                    />
                  )}
                  {getProjectImages(selectedProject).length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          previousImage()
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          nextImage()
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                        aria-label="Next image"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    </>
                  )}
                  {getProjectImages(selectedProject).length > 1 && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                      {getProjectImages(selectedProject).map((_, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation()
                            setCurrentImageIndex(index)
                          }}
                          className={`w-2 h-2 rounded-full ${index === currentImageIndex ? "bg-white" : "bg-white/50"}`}
                          aria-label={`Go to image ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <ScrollArea className="p-4 sm:p-6 max-h-[30vh]">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedProject.name || selectedProject.title}
                      </h2>
                      <Badge className="bg-[#3D8361] hover:bg-[#2A5D3C] text-white border-none capitalize">
                        {selectedProject.category}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                      {selectedProject.location && (
                        <p>
                          <span className="font-medium">Location:</span> {selectedProject.location}
                        </p>
                      )}
                    
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                      {selectedProject.description}
                    </p>
                  </div>
                </ScrollArea>
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
  const [activeTabState, setActiveTabState] = useState(searchParams?.get("category") || "all")
  const activeTab = activeTabState
  const [isMobile, setIsMobile] = useState(false)
  const [heroImage, setHeroImage] = useState<string>("")

  useEffect(() => {
    const fetchHeroImage = async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "projects_hero_image")
          .single()

        if (data && !error) {
          setHeroImage(data.value)
        }
      } catch (error) {
        console.error("Error fetching hero image:", error)
      }
    }

    fetchHeroImage()
  }, [])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

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
            }

            return {
              ...project,
              image: images[0] || "", // Keep first image in image field for backward compatibility
              images, // Store all images in images array
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
      {isLoading ? (
        <div className="flex justify-center items-center h-screen">
          <LoadingAnimation /> {/* ✅ Using LoadingAnimation component */}
        </div>
      ) : (
        <>
          <Navbar />

          <section className="pt-16 lg:pt-24 relative">
            <div className="absolute inset-0 bg-black/60 z-10"></div>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: heroImage ? `url('${heroImage}')` : "none",
                backgroundColor: heroImage ? "transparent" : "#2A5D3C",
              }}
            ></div>
            <div className="container mx-auto px-4 py-8 md:py-20 relative z-20 text-white">
              <div className="max-w-3xl">
                <h1 className="text-2xl md:text-5xl font-bold mb-2 md:mb-6">Our Projects</h1>
                <p className="text-sm md:text-xl mb-4 md:mb-8 text-gray-100 max-w-2xl">
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
                ) : isMobile ? (
                  <div className="w-full flex flex-col gap-4">
                    <ProjectsSearch initialQuery={searchQuery} onSearch={handleSearch} />
                    <ProjectsFilter
                      categories={categories}
                      activeTab={activeTab}
                      isMobile={true}
                      onTabChange={setActiveTabState}
                    />
                  </div>
                ) : (
                  <>
                    <ProjectsFilter categories={categories} activeTab={activeTab} onTabChange={setActiveTabState} />
                    <ProjectsSearch initialQuery={searchQuery} onSearch={handleSearch} />
                  </>
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
                <div className="text-center py-20 bg-red-50 rounded-lg border border-red-100">
                  <h3 className="text-xl font-bold mb-2 text-red-600">{error}</h3>
                  <p className="text-red-500 mb-4">There was a problem connecting to the database.</p>
                  <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
                    Try Again
                  </Button>
                </div>
              ) : (
                <>
                  <ProjectsList projects={filteredByCategory} searchQuery={searchQuery} />

                  {filteredByCategory.length > 0 && (
                    <div className="mt-12 text-center">
                      <p className="text-gray-500 mb-2">
                        Showing {filteredByCategory.length} {filteredByCategory.length === 1 ? "project" : "projects"}
                        {activeTab !== "all" ? ` in ${activeTab}` : ""}
                        {searchQuery ? ` matching "${searchQuery}"` : ""}
                      </p>

                      {(activeTab !== "all" || searchQuery) && (
                        <Button variant="outline" asChild className="mt-2">
                          <Link href="/projects">Clear All Filters</Link>
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          <Footer />
        </>
      )}
    </div>
  )
}

