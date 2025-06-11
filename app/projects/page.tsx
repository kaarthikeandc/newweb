"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight, Search, Filter, ZoomIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
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

// Optimized image skeleton with proper dimensions
const ImageSkeleton = ({ className, aspectRatio = "aspect-[4/3]" }: { className?: string; aspectRatio?: string }) => (
  <div className={`bg-gray-200 animate-pulse ${aspectRatio} ${className}`}>
    <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse"></div>
  </div>
)

// Optimized image component with next-gen format support
const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 75,
  sizes,
  onLoad,
  onLoadStart,
  fill = false,
  ...props
}: {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  quality?: number
  sizes?: string
  onLoad?: () => void
  onLoadStart?: () => void
  fill?: boolean
  [key: string]: any
}) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleLoad = () => {
    setImageLoaded(true)
    onLoad?.()
  }

  const handleLoadStart = () => {
    setImageLoaded(false)
    onLoadStart?.()
  }

  const handleError = () => {
    setImageError(true)
    setImageLoaded(true)
  }

  if (imageError) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <span className="text-gray-400 text-sm">Image unavailable</span>
      </div>
    )
  }

  return (
    <>
      {!imageLoaded && (
        <ImageSkeleton
          className={fill ? "absolute inset-0" : className}
          aspectRatio={fill ? "w-full h-full" : "aspect-[4/3]"}
        />
      )}
      <Image
        src={src || "/placeholder.svg"}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        className={`${className} ${imageLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
        priority={priority}
        quality={quality}
        sizes={sizes}
        onLoad={handleLoad}
        onLoadStart={handleLoadStart}
        onError={handleError}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
        {...props}
      />
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
  const [activeTab, setActiveTab] = useState(searchParams?.get("category") || "all")
  const [isMobile, setIsMobile] = useState(false)
  const [heroImage, setHeroImage] = useState<string>("")
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [visibleCount, setVisibleCount] = useState(12)
  const [showFilters, setShowFilters] = useState(false)
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set())

  // Intersection Observer for lazy loading
  const observerRef = useRef<IntersectionObserver | null>(null)
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set())

  // Refs for tracking current project and image index
  const selectedProjectRef = useRef<Project | null>(null)
  const currentImageIndexRef = useRef<number>(0)

  // Update refs when state changes
  useEffect(() => {
    selectedProjectRef.current = selectedProject
    currentImageIndexRef.current = currentImageIndex
  }, [selectedProject, currentImageIndex])

  // Initialize Intersection Observer for better lazy loading
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleElements((prev) => new Set(prev).add(entry.target.id))
          }
        })
      },
      {
        rootMargin: "50px",
        threshold: 0.1,
      },
    )

    return () => {
      observerRef.current?.disconnect()
    }
  }, [])

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
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) {
        setShowFilters(false)
      }
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

    // Add images from the images array first
    if (project.images && project.images.length > 0) {
      images.push(...project.images)
    }

    // Only add project.image if it's not already in the images array
    if (project.image && !images.includes(project.image)) {
      images.unshift(project.image) // Add to beginning if it's different
    }

    // Remove any duplicates and filter out empty strings
    return [...new Set(images)].filter((img) => img && img.trim() !== "")
  }

  // Minimal preloading - only critical adjacent images
  const preloadAdjacentImages = useCallback(() => {
    const project = selectedProjectRef.current
    if (!project) return

    const images = getProjectImages(project)
    if (images.length <= 1) return

    const nextIndex = (currentImageIndexRef.current + 1) % images.length
    const prevIndex = (currentImageIndexRef.current - 1 + images.length) % images.length

    // Only preload if not already loading
    ;[images[nextIndex], images[prevIndex]].forEach((src) => {
      if (src && !loadingImages.has(src)) {
        const link = document.createElement("link")
        link.rel = "preload"
        link.as = "image"
        link.href = src
        document.head.appendChild(link)

        // Clean up after 5 seconds
        setTimeout(() => {
          document.head.removeChild(link)
        }, 5000)
      }
    })
  }, [loadingImages])

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

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => prev + 8)
  }, [])

  const openModal = useCallback((project: Project, imageIndex = 0) => {
    setSelectedProject(project)
    setCurrentImageIndex(imageIndex)
  }, [])

  const nextImage = useCallback(() => {
    if (selectedProject) {
      const images = getProjectImages(selectedProject)
      setCurrentImageIndex((prev) => {
        const newIndex = prev < images.length - 1 ? prev + 1 : 0
        // Preload adjacent images after changing with delay
        setTimeout(() => preloadAdjacentImages(), 100)
        return newIndex
      })
    }
  }, [selectedProject, preloadAdjacentImages])

  const prevImage = useCallback(() => {
    if (selectedProject) {
      const images = getProjectImages(selectedProject)
      setCurrentImageIndex((prev) => {
        const newIndex = prev > 0 ? prev - 1 : images.length - 1
        // Preload adjacent images after changing with delay
        setTimeout(() => preloadAdjacentImages(), 100)
        return newIndex
      })
    }
  }, [selectedProject, preloadAdjacentImages])

  // Only preload adjacent images when modal is opened or image changes
  useEffect(() => {
    if (selectedProject) {
      const timer = setTimeout(() => preloadAdjacentImages(), 200)
      return () => clearTimeout(timer)
    }
  }, [selectedProject, currentImageIndex, preloadAdjacentImages])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleTabChange = useCallback(
    (tab: string) => {
      setActiveTab(tab)
      setVisibleCount(12) // Reset visible count when changing tabs
      if (isMobile) {
        setShowFilters(false) // Hide filters after selection on mobile
      }
    },
    [isMobile],
  )

  const handleImageLoadStart = useCallback((src: string) => {
    setLoadingImages((prev) => new Set(prev).add(src))
  }, [])

  const handleImageLoadComplete = useCallback((src: string) => {
    setLoadingImages((prev) => {
      const newSet = new Set(prev)
      newSet.delete(src)
      return newSet
    })
  }, [])

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

  // Handle touch swipe for image navigation
  useEffect(() => {
    if (!selectedProject) return

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
      const swipeThreshold = 50
      if (touchEndX < touchStartX - swipeThreshold) {
        // Swipe left - go to next image
        nextImage()
      } else if (touchEndX > touchStartX + swipeThreshold) {
        // Swipe right - go to previous image
        prevImage()
      }
    }

    document.addEventListener("touchstart", handleTouchStart, { passive: true })
    document.addEventListener("touchend", handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchend", handleTouchEnd)
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
            {heroImage && (
              <div className="absolute inset-0">
                <OptimizedImage
                  src={heroImage}
                  alt="Projects Hero"
                  fill
                  className="object-cover"
                  priority
                  quality={85}
                  sizes="100vw"
                />
              </div>
            )}
            {!heroImage && <div className="absolute inset-0 bg-[#2A5D3C]"></div>}
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
              {/* Mobile Search and Filter UI */}
              {isMobile && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="relative flex-1">
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
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 flex-shrink-0"
                      onClick={() => setShowFilters(!showFilters)}
                      aria-label="Toggle filters"
                    >
                      <Filter className="h-5 w-5" />
                    </Button>
                  </div>

                  {showFilters && (
                    <div className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-100 animate-in slide-in-from-top duration-300">
                      <h3 className="font-medium text-sm mb-2 text-gray-700">Filter by Category</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={activeTab === "all" ? "default" : "outline"}
                          size="sm"
                          className={activeTab === "all" ? "bg-[#2A5D3C] hover:bg-[#3D8361]" : ""}
                          onClick={() => handleTabChange("all")}
                        >
                          All Projects
                        </Button>
                        {categories.map((category) => (
                          <Button
                            key={category}
                            variant={activeTab === category.toLowerCase() ? "default" : "outline"}
                            size="sm"
                            className={activeTab === category.toLowerCase() ? "bg-[#2A5D3C] hover:bg-[#3D8361]" : ""}
                            onClick={() => handleTabChange(category.toLowerCase())}
                          >
                            {category}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Desktop Filter UI */}
              {!isMobile && (
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
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
                          value={category.toLowerCase()}
                          className="px-2 py-1.5 h-auto text-sm whitespace-nowrap overflow-hidden text-ellipsis"
                        >
                          {category}
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
                </div>
              )}

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
                      setShowFilters(false)
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {visibleProjects.map((project, index) => {
                      const projectImages = getProjectImages(project)
                      const imageSrc = projectImages[0]
                      const isAboveFold = index < 4

                      return (
                        <div
                          key={project.id}
                          id={`project-${project.id}`}
                          className="group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer"
                          onClick={() => openModal(project, 0)}
                          ref={(el) => {
                            if (el && observerRef.current && !isAboveFold) {
                              observerRef.current.observe(el)
                            }
                          }}
                        >
                          <div className="relative aspect-[4/3] overflow-hidden">
                            {imageSrc ? (
                              <OptimizedImage
                                src={imageSrc}
                                alt={project.name || project.title || "Project"}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                priority={isAboveFold}
                                quality={isAboveFold ? 85 : 75}
                                onLoad={() => handleImageLoadComplete(imageSrc)}
                                onLoadStart={() => handleImageLoadStart(imageSrc)}
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

          {/* Image Modal - Optimized */}
          {selectedProject && (
            <div
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-0 sm:p-4"
              onClick={() => setSelectedProject(null)}
            >
              <div
                className="relative w-full h-full sm:max-w-5xl sm:w-[95%] sm:max-h-[90vh] sm:h-auto bg-white sm:rounded-lg overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/80 rounded-full p-2 hover:bg-white transition-colors z-10"
                  onClick={() => setSelectedProject(null)}
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>

                <div className="relative h-[60vh] sm:h-[60vh] md:h-[70vh] bg-black">
                  {(() => {
                    const currentImageSrc = getProjectImages(selectedProject)[currentImageIndex]

                    return (
                      <>
                        {currentImageSrc ? (
                          <OptimizedImage
                            src={currentImageSrc}
                            alt={`${selectedProject.name || selectedProject.title} - Image ${currentImageIndex + 1}`}
                            fill
                            className="object-contain"
                            priority
                            quality={90}
                            sizes="100vw"
                            onLoad={() => handleImageLoadComplete(currentImageSrc)}
                            onLoadStart={() => handleImageLoadStart(currentImageSrc)}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-400">No image available</span>
                          </div>
                        )}
                      </>
                    )
                  })()}

                  {getProjectImages(selectedProject).length > 1 && (
                    <>
                      <button
                        className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white/80 rounded-full p-3 hover:bg-white transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          prevImage()
                        }}
                      >
                        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                      </button>
                      <button
                        className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white/80 rounded-full p-3 hover:bg-white transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          nextImage()
                        }}
                      >
                        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                      </button>
                    </>
                  )}

                  {/* Image counter for mobile */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full sm:hidden">
                    {currentImageIndex + 1} / {getProjectImages(selectedProject).length}
                  </div>
                </div>

                {/* Thumbnails for multiple images - optimized loading */}
                {getProjectImages(selectedProject).length > 1 && (
                  <div className="px-2 sm:px-6 pt-2 sm:pt-4 overflow-x-auto bg-white">
                    <div className="flex gap-1 sm:gap-2 pb-2 snap-x snap-mandatory">
                      {getProjectImages(selectedProject).map((img, idx) => (
                        <div
                          key={idx}
                          className={`relative w-16 h-16 sm:w-16 sm:h-16 rounded overflow-hidden cursor-pointer border-2 flex-shrink-0 snap-start ${
                            idx === currentImageIndex ? "border-[#2A5D3C]" : "border-transparent"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation()
                            setCurrentImageIndex(idx)
                          }}
                        >
                          {img ? (
                            <OptimizedImage
                              src={img}
                              alt={`Thumbnail ${idx + 1}`}
                              width={64}
                              height={64}
                              className="object-cover w-full h-full"
                              quality={60}
                              sizes="64px"
                              onLoad={() => handleImageLoadComplete(img)}
                              onLoadStart={() => handleImageLoadStart(img)}
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
                <ScrollArea className="p-4 sm:p-6 flex-grow overflow-auto">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
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
