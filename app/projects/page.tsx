"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight, Search, Filter, ZoomIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
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

export default function ProjectsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [projects, setProjects] = useState<Project[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState(searchParams?.get("q") || "")
  const [activeTab, setActiveTab] = useState(searchParams?.get("category") || "all")
  const [isMobile, setIsMobile] = useState(false)
  const [heroImage, setHeroImage] = useState<string>("")
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [visibleCount, setVisibleCount] = useState(12)
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set())
  const [isImageLoading, setIsImageLoading] = useState(false)

  // Refs for tracking current project and image index
  const selectedProjectRef = useRef<Project | null>(null)
  const currentImageIndexRef = useRef<number>(0)

  // Update refs when state changes
  useEffect(() => {
    selectedProjectRef.current = selectedProject
    currentImageIndexRef.current = currentImageIndex
  }, [selectedProject, currentImageIndex])

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

  const getProjectImages = (project: Project) => {
    const images = []
    if (project.image) images.push(project.image)
    if (project.images) images.push(...project.images)
    return images
  }

  // Image preloading function
  const preloadImage = useCallback(
    (src: string): Promise<void> => {
      if (preloadedImages.has(src)) {
        return Promise.resolve()
      }

      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          setPreloadedImages((prev) => {
            const newSet = new Set(prev)
            newSet.add(src)
            return newSet
          })
          resolve()
        }
        img.onerror = () => {
          // Still resolve even on error to prevent blocking
          resolve()
        }
        img.src = src
      })
    },
    [preloadedImages],
  )

  // Preload all images for a project
  const preloadProjectImages = useCallback(
    (project: Project) => {
      if (!project) return

      const images = getProjectImages(project)

      // Preload current image first
      if (images[currentImageIndexRef.current]) {
        setIsImageLoading(true)
        preloadImage(images[currentImageIndexRef.current]).then(() => {
          setIsImageLoading(false)
        })
      }

      // Then preload all other images
      images.forEach((src, index) => {
        if (index !== currentImageIndexRef.current && src) {
          preloadImage(src)
        }
      })
    },
    [preloadImage],
  )

  // Preload adjacent images (next and previous)
  const preloadAdjacentImages = useCallback(() => {
    const project = selectedProjectRef.current
    if (!project) return

    const images = getProjectImages(project)
    if (images.length <= 1) return

    const nextIndex = (currentImageIndexRef.current + 1) % images.length
    const prevIndex = (currentImageIndexRef.current - 1 + images.length) % images.length

    if (images[nextIndex]) preloadImage(images[nextIndex])
    if (images[prevIndex]) preloadImage(images[prevIndex])
  }, [preloadImage])

  const filteredProjects = projects.filter(
    (project) =>
      (activeTab === "all" || project.category.toLowerCase() === activeTab.toLowerCase()) &&
      (project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.client?.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const visibleProjects = filteredProjects.slice(0, visibleCount)
  const hasMore = visibleProjects.length < filteredProjects.length

  const loadMore = () => {
    setVisibleCount((prev) => prev + 8)
  }

  const openModal = (project: Project, imageIndex = 0) => {
    setSelectedProject(project)
    setCurrentImageIndex(imageIndex)

    // Preload all images for this project
    setTimeout(() => {
      preloadProjectImages(project)
    }, 0)
  }

  const nextImage = useCallback(() => {
    if (selectedProject) {
      const images = getProjectImages(selectedProject)
      setCurrentImageIndex((prev) => {
        const newIndex = prev < images.length - 1 ? prev + 1 : 0

        // Preload adjacent images after changing
        setTimeout(() => preloadAdjacentImages(), 0)

        return newIndex
      })
    }
  }, [selectedProject, preloadAdjacentImages])

  const prevImage = useCallback(() => {
    if (selectedProject) {
      const images = getProjectImages(selectedProject)
      setCurrentImageIndex((prev) => {
        const newIndex = prev > 0 ? prev - 1 : images.length - 1

        // Preload adjacent images after changing
        setTimeout(() => preloadAdjacentImages(), 0)

        return newIndex
      })
    }
  }, [selectedProject, preloadAdjacentImages])

  // Preload images when modal is opened or image index changes
  useEffect(() => {
    if (selectedProject) {
      preloadAdjacentImages()
    }
  }, [selectedProject, currentImageIndex, preloadAdjacentImages])

  // Preload first image of each visible project
  useEffect(() => {
    if (!isLoading) {
      visibleProjects.forEach((project) => {
        const images = getProjectImages(project)
        if (images[0]) {
          preloadImage(images[0])
        }
      })
    }
  }, [visibleProjects, isLoading, preloadImage])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setVisibleCount(12) // Reset visible count when changing tabs
  }

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedProject) return

      if (e.key === "ArrowRight") {
        nextImage()
      } else if (e.key === "ArrowLeft") {
        prevImage()
      } else if (e.key === "Escape") {
        setSelectedProject(null)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [selectedProject, nextImage, prevImage])

  return (
    <div className="min-h-screen flex flex-col">
      {isLoading ? (
        <div className="flex justify-center items-center h-screen">
          <LoadingAnimation />
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
                {isMobile ? (
                  <div className="w-full flex flex-col gap-4">
                    <div className="relative w-full">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <Input
                        type="text"
                        placeholder="Search projects..."
                        className="pl-10 pr-4 py-2 w-full border rounded-md"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        aria-label="Search projects"
                      />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full md:w-auto flex justify-between items-center">
                          <span className="truncate">
                            {activeTab === "all"
                              ? "All Projects"
                              : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
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
                  </div>
                ) : (
                  <>
                    <Tabs
                      defaultValue={activeTab}
                      value={activeTab}
                      onValueChange={handleTabChange}
                      className="w-full max-w-3xl"
                    >
                      <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 w-full gap-1 h-auto">
                        <TabsTrigger value="all" className="px-2 py-1.5 h-auto text-sm whitespace-nowrap">
                          All
                        </TabsTrigger>
                        {categories.map((category) => (
                          <TabsTrigger
                            key={category}
                            value={category}
                            className="px-2 py-1.5 h-auto text-sm whitespace-nowrap overflow-hidden text-ellipsis"
                          >
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                    <div className="relative w-full md:max-w-sm">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <Input
                        type="text"
                        placeholder="Search projects..."
                        className="pl-10 pr-4 py-2 w-full border rounded-md"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        aria-label="Search projects"
                      />
                    </div>
                  </>
                )}
              </div>

              {error ? (
                <div className="text-center py-20 bg-red-50 rounded-lg border border-red-100">
                  <h3 className="text-xl font-bold mb-2 text-red-600">{error}</h3>
                  <p className="text-red-500 mb-4">There was a problem connecting to the database.</p>
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
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {visibleProjects.map((project) => {
                      const projectImages = getProjectImages(project)

                      return (
                        <div
                          key={project.id}
                          className="group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer"
                          onClick={() => openModal(project, 0)}
                          onMouseEnter={() => {
                            // Preload first image on hover
                            if (projectImages[0]) {
                              preloadImage(projectImages[0])
                            }
                          }}
                        >
                          <div className="relative h-52 sm:h-64 overflow-hidden">
                            {projectImages[0] ? (
                              <Image
                                src={projectImages[0] || "/placeholder.svg"}
                                alt={project.name || project.title || "Project"}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                priority={visibleProjects.indexOf(project) < 4} // Prioritize first 4 images
                                unoptimized={projectImages[0]?.startsWith("http")}
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                <span className="text-gray-400 text-sm">No image</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="bg-white/90 rounded-full p-2 sm:p-3">
                                <ZoomIn className="h-5 w-5 sm:h-6 sm:w-6 text-[#2A5D3C]" />
                              </div>
                            </div>
                            {projectImages.length > 1 && (
                              <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                                +{projectImages.length - 1}
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 p-3 bg-gradient-to-t from-black/70 to-transparent w-full">
                              <div className="flex items-center justify-between">
                                <span className="text-white font-medium text-sm sm:text-base line-clamp-1">
                                  {project.name || project.title}
                                </span>
                                <Badge className="bg-[#3D8361] hover:bg-[#2A5D3C] text-white border-none capitalize text-xs">
                                  {project.category}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {hasMore && (
                    <div className="flex justify-center mt-12">
                      <Button className="bg-[#2A5D3C] hover:bg-[#3D8361]" onClick={loadMore}>
                        Load More
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Image Modal */}
          {selectedProject && (
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
                  {isImageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10">
                      <div className="w-10 h-10 border-4 border-[#3D8361] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}

                  {getProjectImages(selectedProject)[currentImageIndex] ? (
                    <Image
                      src={getProjectImages(selectedProject)[currentImageIndex] || "/placeholder.svg"}
                      alt={`${selectedProject.name || selectedProject.title} - Image ${currentImageIndex + 1}`}
                      fill
                      className="object-contain"
                      priority
                      sizes="(max-width: 1024px) 100vw, 80vw"
                      unoptimized={getProjectImages(selectedProject)[currentImageIndex]?.startsWith("http")}
                      onLoadingComplete={() => setIsImageLoading(false)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400">No image available</span>
                    </div>
                  )}

                  {getProjectImages(selectedProject).length > 1 && (
                    <>
                      <button
                        className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white/80 rounded-full p-2 sm:p-3 hover:bg-white transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          prevImage()
                        }}
                        onMouseEnter={() => {
                          // Preload previous image on hover
                          const images = getProjectImages(selectedProject)
                          const prevIndex = (currentImageIndex - 1 + images.length) % images.length
                          if (images[prevIndex]) preloadImage(images[prevIndex])
                        }}
                      >
                        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      <button
                        className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white/80 rounded-full p-2 sm:p-3 hover:bg-white transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          nextImage()
                        }}
                        onMouseEnter={() => {
                          // Preload next image on hover
                          const images = getProjectImages(selectedProject)
                          const nextIndex = (currentImageIndex + 1) % images.length
                          if (images[nextIndex]) preloadImage(images[nextIndex])
                        }}
                      >
                        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails for multiple images */}
                {getProjectImages(selectedProject).length > 1 && (
                  <div className="px-3 sm:px-6 pt-2 sm:pt-4 overflow-x-auto">
                    <div className="flex gap-1 sm:gap-2 pb-2 snap-x snap-mandatory">
                      {getProjectImages(selectedProject).map((img, idx) => (
                        <div
                          key={idx}
                          className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded overflow-hidden cursor-pointer border-2 flex-shrink-0 snap-start ${
                            idx === currentImageIndex ? "border-[#2A5D3C]" : "border-transparent"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation()
                            setCurrentImageIndex(idx)
                          }}
                          onMouseEnter={() => {
                            // Preload image on thumbnail hover
                            if (img) preloadImage(img)
                          }}
                        >
                          {img ? (
                            <Image
                              src={img || "/placeholder.svg"}
                              alt={`Thumbnail ${idx + 1}`}
                              fill
                              className="object-cover"
                              unoptimized={img?.startsWith("http")}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <span className="text-gray-400 text-xs">Empty</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Project details */}
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
                      {selectedProject.client && (
                        <p>
                          <span className="font-medium">Client:</span> {selectedProject.client}
                        </p>
                      )}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                      {selectedProject.description}
                    </p>
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          <Footer />
        </>
      )}
    </div>
  )
}
