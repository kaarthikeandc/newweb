"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
 // or from your icon library; // or from your icon library
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Loader2,
  Plus,
  Search,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,UploadIcon,
  X,
  Upload,
  ImageIcon,
  GripVertical,
  LogOut,
  ExternalLink,
  ArrowUpDown,
  Eye,
  Pencil,
} from "lucide-react"
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DndContext,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import Navbar from "@/components/navbar"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

// Project type definition
type Project = {
  id: string
  name: string
  category: string
  description?: string
  location?: string
  client?: string
  images?: string[]
  created_at?: string
}

// Client Logo type definition
type ClientLogo = {
  id: string
  name: string
  url: string
  image: string
  created_at?: string
  position?: number
}

// Hero Slide type definition
type HeroSlide = {
  id: string
  title: string
  description?: string
  image: string
  created_at?: string
}

// Page Hero type definition
type PageHero = {
  id: string
  page: "about" | "contact" | "gallery" | "project"
  title?: string
  subtitle?: string
  image?: string
  video?: string
  created_at?: string
  updated_at?: string
}

// Sortable Logo Item Props
type SortableLogoItemProps = {
  logo: ClientLogo
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}

// Notification type
type Notification = {
  type: "success" | "error" | "info"
  message: string
  visible: boolean
}

// Add a new type for SiteSettings
type SiteSettings = {
  key: string
  value: string
}

// Sortable Logo Item Component
function SortableLogoItem({ logo, isSelected, onSelect, onEdit, onDelete }: SortableLogoItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: logo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center p-3 border rounded-lg mb-2 cursor-pointer transition-all duration-200",
        isSelected ? "border-primary bg-primary/5 shadow-sm" : "hover:bg-muted/50 hover:border-muted-foreground/30",
        isDragging && "opacity-75 shadow-md",
      )}
      onClick={onSelect}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="mr-2 touch-none" {...attributes} {...listeners}>
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="h-12 w-12 mr-3 flex-shrink-0 bg-muted/30 rounded-md flex items-center justify-center overflow-hidden">
        <img
          src={logo.image || "/placeholder.svg?height=48&width=48"}
          alt={logo.name}
          className="h-full w-full object-contain p-1"
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=48&width=48"
          }}
        />
      </div>
      <div className="flex-grow">
        <div className="font-medium truncate" title={logo.name}>
          {logo.name}
        </div>
        {logo.url && (
          <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            {logo.url}
          </div>
        )}
      </div>
      <div className="flex gap-1 ml-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          className="opacity-70 hover:opacity-100 transition-opacity"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-pencil"
          >
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
          </svg>
          <span className="sr-only">Edit</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive hover:bg-destructive/10 opacity-70 hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </motion.div>
  )
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

// Save Logo Order Function
const saveLogoOrder = async (logoIds: string[]) => {
  try {
    console.log("Saving logo order:", logoIds)

    // Create an array of updates with position values
    const updates = logoIds.map((id, index) => ({
      id,
      position: index,
    }))

    // Update all logos with their new positions
    const { error } = await supabase.from("client_logos").upsert(updates, { onConflict: "id" })

    if (error) {
      console.error("Error saving logo order:", error)
      throw error
    }

    console.log("Logo order saved successfully")
    return true
  } catch (error) {
    console.error("Error saving logo order:", error)
    return false
  }
}

// Project Card Component
function ProjectCard({
  project,
  onEdit,
  onDelete,
}: {
  project: Project
  onEdit: (project: Project) => void
  onDelete: () => void
}) {
  return (
    <motion.div
      className="bg-white dark:bg-card rounded-xl shadow-sm border overflow-hidden transition-all hover:shadow-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <div className="aspect-video relative overflow-hidden bg-muted">
        {project.images && project.images.length > 0 ? (
          <img
            src={project.images[0] || "/placeholder.svg"}
            alt={project.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
        {project.images && project.images.length > 1 && (
          <Badge variant="secondary" className="absolute bottom-2 right-2 bg-black/60 text-white">
            +{project.images.length - 1} more
          </Badge>
        )}
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg line-clamp-1">{project.name}</h3>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            {project.category}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground mb-3 space-y-1">
          {project.location && (
            <div className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-map-pin"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{project.location}</span>
            </div>
          )}
        </div>
        <div className="flex justify-between items-center pt-2 border-t">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-primary">
                <Eye className="h-4 w-4 mr-1" />
                Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{project.name}</DialogTitle>
                <DialogDescription>View detailed information about this project.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {project.images && project.images.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Main image (larger) */}
                    <div className="md:col-span-2 aspect-video w-full overflow-hidden rounded-lg">
                      <img
                        src={project.images[0] || "/placeholder.svg"}
                        alt={`${project.name} - Main view`}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* Additional images */}
                    {project.images.slice(1).map((img, idx) => (
                      <div key={idx} className="aspect-video w-full overflow-hidden rounded-lg">
                        <img
                          src={img || "/placeholder.svg"}
                          alt={`${project.name} - View ${idx + 2}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="aspect-video w-full rounded-lg bg-muted flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Category</h3>
                    <p>{project.category}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
                    <p>{project.location || "Not specified"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Client</h3>
                    <p>{project.client || "Not specified"}</p>
                  </div>
                </div>
                {project.description && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                    <p className="mt-1">{project.description}</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(project)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-pencil"
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Main Admin Panel Component
const AdminPanel = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("projects")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortField, setSortField] = useState<"name" | "category" | "created_at">("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [newProject, setNewProject] = useState({
    name: "",
    category: "",
    description: "",
    location: "",
    client: "",
    images: [] as string[],
  })
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null)
  const [notification, setNotification] = useState<Notification | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const logoFileInputRef = useRef<HTMLInputElement>(null)
  const slideFileInputRef = useRef<HTMLInputElement>(null)
  const heroFileInputRef = useRef<HTMLInputElement>(null)

  // Client logos state
  const [clientLogos, setClientLogos] = useState<ClientLogo[]>([])
  const [newLogo, setNewLogo] = useState({
    name: "",
    url: "",
    image: "",
  })
  const [logoToEdit, setLogoToEdit] = useState<ClientLogo | null>(null)
  const [logoToDelete, setLogoToDelete] = useState<ClientLogo | null>(null)
  const [selectedLogo, setSelectedLogo] = useState<ClientLogo | null>(null)
  const [logoOrder, setLogoOrder] = useState<string[]>([])
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  // Hero slides state
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [newSlide, setNewSlide] = useState({
    title: "",
    description: "",
    image: "",
  })
  const [isUploadingSlide, setIsUploadingSlide] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)
  const [slideIdToDelete, setSlideIdToDelete] = useState<string | null>(null)

  // Page heroes state
  const [pageHeroes, setPageHeroes] = useState<PageHero[]>([])
  const [selectedPageHero, setSelectedPageHero] = useState<string>("about")
  const [heroToEdit, setHeroToEdit] = useState<PageHero | null>(null)
  const [isUploadingHero, setIsUploadingHero] = useState(false)

  // Site settings state
  const [siteSettings, setSiteSettings] = useState<SiteSettings[]>([])
  const [isLoadingSiteSettings, setIsLoadingSiteSettings] = useState(false)

  const router = useRouter()

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Authentication Check
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.replace("/dashboard/login")
        return
      }

      setUser(session.user)
      setIsLoading(false)
    }

    checkSession()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/dashboard/login")
      } else {
        setUser(session.user)
        setIsLoading(false)
      }
    })

    return () => authListener.subscription.unsubscribe()
  }, [router])

  // Fetch Projects
  const fetchProjects = async () => {
    if (!user) return

    try {
      setIsRefreshing(true)
      console.log("Fetching projects...")

      const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching projects:", error)
        throw error
      }

      console.log("Projects fetched successfully:", data)

      if (data) {
        // Convert legacy data (single image) to new format (images array)
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
        setFilteredProjects(processedData)
      }
    } catch (error: any) {
      console.error("Project fetch error details:", error)
      showNotification("error", `There was a problem loading the projects: ${error.message}`)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Fetch Logos
  const fetchLogos = async () => {
    if (!user) return

    try {
      setIsRefreshing(true)
      console.log("Fetching client logos...")

      const { data, error } = await supabase.from("client_logos").select("*").order("position", { ascending: true })

      if (error) {
        console.error("Error fetching logos:", error)
        throw error
      }

      console.log("Logos fetched successfully:", data)

      if (data) {
        setClientLogos(data)
        // Update logo order when logos are loaded
        setLogoOrder(data.map((logo) => logo.id))
      }
    } catch (error: any) {
      console.error("Logo fetch error details:", error)
      showNotification("error", `There was a problem loading the client logos: ${error.message}`)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Fetch Page Heroes
  const fetchPageHeroes = async () => {
    if (!user) return

    try {
      setIsRefreshing(true)
      console.log("Fetching page heroes...")

      const { data, error } = await supabase.from("page_heroes").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching page heroes:", error)
        throw error
      }

      console.log("Page heroes fetched successfully:", data)

      if (data) {
        setPageHeroes(data)

        // Initialize heroToEdit with the selected page's hero if it exists
        const selectedHero = data.find((hero) => hero.page === selectedPageHero)
        if (selectedHero) {
          setHeroToEdit(selectedHero)
        } else {
          setHeroToEdit({
            id: "",
            page: selectedPageHero as "about" | "contact" | "gallery" | "project",
            title: "",
            subtitle: "",
            image: "",
            video: "",
          })
        }
      }
    } catch (error: any) {
      console.error("Page hero fetch error details:", error)
      showNotification("error", `There was a problem loading the page heroes: ${error.message}`)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Fetch Hero Slides
  const fetchSlides = async () => {
    if (!user) return

    try {
      setIsRefreshing(true)
      const { data, error } = await supabase.from("hero_slides").select("*").order("created_at", { ascending: false })

      if (error) throw error

      if (data) {
        setSlides(data)
      }
    } catch (error: any) {
      showNotification("error", `There was a problem loading the hero slides: ${error.message}`)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Handle Logo Drag End
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setClientLogos((logos) => {
        const oldIndex = logos.findIndex((logo) => logo.id === active.id)
        const newIndex = logos.findIndex((logo) => logo.id === over.id)

        return arrayMove(logos, oldIndex, newIndex)
      })

      setLogoOrder((order) => {
        const oldIndex = order.indexOf(active.id as string)
        const newIndex = order.indexOf(over.id as string)

        const newOrder = arrayMove(order, oldIndex, newIndex)

        // Save the new order to the database
        saveLogoOrder(newOrder).then((success) => {
          if (success) {
            showNotification("success", "Logo order updated successfully")
          } else {
            showNotification("error", "Failed to update logo order")
          }
        })

        return newOrder
      })
    }
  }

  // Initial data fetching
  useEffect(() => {
    if (user) {
      fetchProjects()
      fetchLogos()
      fetchPageHeroes()
      fetchSlides()
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchSiteSettings()
    }
  }, [user])

  // Set logo order when logos are loaded
  useEffect(() => {
    if (clientLogos.length > 0 && logoOrder.length === 0) {
      setLogoOrder(clientLogos.map((logo) => logo.id))
    }
  }, [clientLogos, logoOrder.length])

  // Add this useEffect to update heroToEdit when selectedPageHero changes
  useEffect(() => {
    if (pageHeroes.length > 0) {
      const selectedHero = pageHeroes.find((hero) => hero.page === selectedPageHero)
      if (selectedHero) {
        setHeroToEdit(selectedHero)
      } else {
        setHeroToEdit({
          id: "",
          page: selectedPageHero as "about" | "contact" | "gallery" | "project",
          title: "",
          subtitle: "",
          image: "",
          video: "",
        })
      }
    }
  }, [selectedPageHero, pageHeroes])

  // Filter projects based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProjects(sortProjects(projects, sortField, sortDirection))
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = projects.filter(
        (project) =>
          project.name.toLowerCase().includes(query) ||
          project.category.toLowerCase().includes(query) ||
          (project.location && project.location.toLowerCase().includes(query)) ||
          (project.client && project.client.toLowerCase().includes(query)) ||
          (project.description && project.description.toLowerCase().includes(query)),
      )
      setFilteredProjects(sortProjects(filtered, sortField, sortDirection))
    }
  }, [searchQuery, projects, sortField, sortDirection])

  // Sort projects
  const sortProjects = (projectsToSort: Project[], field: string, direction: "asc" | "desc") => {
    return [...projectsToSort].sort((a, b) => {
      let valueA = a[field as keyof Project] || ""
      let valueB = b[field as keyof Project] || ""

      if (field === "created_at") {
        valueA = a.created_at || ""
        valueB = b.created_at || ""
      }

      if (direction === "asc") {
        return valueA > valueB ? 1 : -1
      } else {
        return valueA < valueB ? 1 : -1
      }
    })
  }

  // Toggle sort direction
  const toggleSort = (field: "name" | "category" | "created_at") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Show notification
  const showNotification = (type: "success" | "error" | "info", message: string) => {
    setNotification({
      type,
      message,
      visible: true,
    })

    // Auto-hide notification after 3 seconds
    setTimeout(() => setNotification(null), 3000)
  }

  // Handle Logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace("/dashboard/login")
  }

  // Handle Image Upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    
    const files = event.target.files
    if (!files || files.length === 0) return

    try {
      setIsUploading(true)
      const uploadedUrls: string[] = []

      // Process each file
      for (let i = 0; i < files.length; i++) {
        let file = files[i]

        // Check if file is HEIC format and convert if needed
        if (file.name.toLowerCase().endsWith(".heic") || file.type === "image/heic") {
          try {
            // Use dynamic import with client-side check
            if (typeof window !== "undefined") {
              const heic2anyModule = await import("heic2any")
              const convertedBlob = (await heic2anyModule.default({
                blob: file,
                toType: "image/jpeg",
                quality: 0.8,
              })) as Blob

              // Create a new file from the converted blob
              file = new File([convertedBlob], file.name.replace(/\.heic$/i, ".jpg"), {
                type: "image/jpeg",
                lastModified: new Date().getTime(),
              })

              console.log("HEIC image converted successfully")
            } else {
              // Skip HEIC files during server-side rendering
              console.log("Skipping HEIC conversion during server-side rendering")
              continue
            }
          } catch (conversionError) {
            console.error("HEIC conversion error:", conversionError)
            showNotification("error", `Failed to convert HEIC image: ${file.name}`)
            continue // Skip this file and move to the next one
          }
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          setEditingSlide((prev) => (prev ? { ...prev, image: e.target.result } : null));
        };
        reader.readAsDataURL(file);
        // Create a unique file name
        const fileExt = file.name.split(".").pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
        const filePath = `project-images/${fileName}`

        // Upload the file to Supabase Storage
        const { error: uploadError } = await supabase.storage.from("projects").upload(filePath, file)

        if (uploadError) {
          throw uploadError
        }

        // Get the public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("projects").getPublicUrl(filePath)

        uploadedUrls.push(publicUrl)
      }

      // Update the project images array
      if (projectToEdit) {
        setProjectToEdit({
          ...projectToEdit,
          images: [...(projectToEdit.images || []), ...uploadedUrls],
        })
      } else {
        setNewProject({
          ...newProject,
          images: [...newProject.images, ...uploadedUrls],
        })
      }

      showNotification(
        "success",
        `${uploadedUrls.length} image${uploadedUrls.length > 1 ? "s" : ""} uploaded successfully!`,
      )
    } catch (error: any) {
      showNotification("error", `Upload failed: ${error.message}`)
      console.error("Upload error details:", error)
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // Handle Logo Upload
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    try {
      setIsUploadingLogo(true)
      let file = files[0] // Only use the first file for logos

      // Check if file is HEIC format and convert if needed
      if (file.name.toLowerCase().endsWith(".heic") || file.type === "image/heic") {
        try {
          // Use dynamic import with client-side check
          if (typeof window !== "undefined") {
            const heic2anyModule = await import("heic2any")
            const convertedBlob = (await heic2anyModule.default({
              blob: file,
              toType: "image/jpeg",
              quality: 0.8,
            })) as Blob

            // Create a new file from the converted blob
            file = new File([convertedBlob], file.name.replace(/\.heic$/i, ".jpg"), {
              type: "image/jpeg",
              lastModified: new Date().getTime(),
            })

            console.log("HEIC logo image converted successfully")
          } else {
            // Skip HEIC files during server-side rendering
            console.log("Skipping HEIC conversion during server-side rendering")
            return
          }
        } catch (conversionError) {
          console.error("HEIC conversion error:", conversionError)
          showNotification("error", `Failed to convert HEIC image: ${file.name}`)
          return
        }
      }

      // Create a unique file name
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `client-logos/${fileName}`

      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage.from("projects").upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("projects").getPublicUrl(filePath)

      // Update the logo image URL
      if (logoToEdit) {
        setLogoToEdit({
          ...logoToEdit,
          image: publicUrl,
        })
      } else {
        setNewLogo({
          ...newLogo,

          image: publicUrl,
        })
      }

      showNotification("success", "Logo uploaded successfully!")
    } catch (error: any) {
      showNotification("error", `Logo upload failed: ${error.message}`)
    } finally {
      setIsUploadingLogo(false)
      // Reset file input
      if (logoFileInputRef.current) {
        logoFileInputRef.current.value = ""
      }
    }
  }

  // Handle Slide Upload
  const handleSlideUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    try {
      setIsUploadingSlide(true)
      let file = files[0] // Only use the first file for slides

      // Check if file is HEIC format and convert if needed
      if (file.name.toLowerCase().endsWith(".heic") || file.type === "image/heic") {
        try {
          // Use dynamic import with client-side check
          if (typeof window !== "undefined") {
            const heic2anyModule = await import("heic2any")
            const convertedBlob = (await heic2anyModule.default({
              blob: file,
              toType: "image/jpeg",
              quality: 0.8,
            })) as Blob

            // Create a new file from the converted blob
            file = new File([convertedBlob], file.name.replace(/\.heic$/i, ".jpg"), {
              type: "image/jpeg",
              lastModified: new Date().getTime(),
            })

            console.log("HEIC slide image converted successfully")
          } else {
            // Skip HEIC files during server-side rendering
            console.log("Skipping HEIC conversion during server-side rendering")
            return
          }
        } catch (conversionError) {
          console.error("HEIC conversion error:", conversionError)
          showNotification("error", `Failed to convert HEIC image: ${file.name}`)
          return
        }
      }

      // Create a unique file name
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `slide-images/${fileName}`

      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage.from("projects").upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("projects").getPublicUrl(filePath)

      // Update the slide image URL
      setNewSlide({
        ...newSlide,
        image: publicUrl,
      })

      showNotification("success", "Slide image uploaded successfully!")
    } catch (error: any) {
      showNotification("error", `Slide image upload failed: ${error.message}`)
    } finally {
      setIsUploadingSlide(false)
      // Reset file input
      if (slideFileInputRef.current) {
        slideFileInputRef.current.value = ""
      }
    }
  }

  // Handle Hero Image Upload
  const handleHeroImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    try {
      setIsUploadingHero(true)
      const file = files[0]

      // Create a unique file name
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `hero-images/${fileName}`

      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage.from("projects").upload(filePath, file)

      if (uploadError) throw uploadError

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("projects").getPublicUrl(filePath)

      // Update the hero image URL
      setHeroToEdit((prev) =>
        prev
          ? { ...prev, image: publicUrl }
          : {
              id: "",
              page: selectedPageHero as "about" | "contact" | "gallery" | "project",
              image: publicUrl,
            },
      )

      showNotification("success", "Hero image uploaded successfully!")
    } catch (error: any) {
      showNotification("error", `Hero image upload failed: ${error.message}`)
    } finally {
      setIsUploadingHero(false)
      if (heroFileInputRef.current) {
        heroFileInputRef.current.value = ""
      }
    }
  }

  // Trigger logo file input click
  const triggerLogoFileInput = () => {
    logoFileInputRef.current?.click()
  }

  // Trigger slide file input click
  const triggerSlideFileInput = () => {
    slideFileInputRef.current?.click()
  }

  // Trigger hero file input click
  const triggerHeroFileInput = () => {
    heroFileInputRef.current?.click()
  }

  // Remove image from array
  const removeImage = (index: number, isEditMode: boolean) => {
    if (isEditMode && projectToEdit) {
      const updatedImages = [...(projectToEdit.images || [])]
      updatedImages.splice(index, 1)
      setProjectToEdit({ ...projectToEdit, images: updatedImages })
    } else {
      const updatedImages = [...newProject.images]
      updatedImages.splice(index, 1)
      setNewProject({ ...newProject, images: updatedImages })
    }
  }

  // Add image URL directly
  const addImageUrl = (url: string, isEditMode: boolean) => {
    if (!url.trim()) return

    if (isEditMode && projectToEdit) {
      setProjectToEdit({
        ...projectToEdit,
        images: [...(projectToEdit.images || []), url],
      })
    } else {
      setNewProject({
        ...newProject,
        images: [...newProject.images, url],
      })
    }
  }

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // Add Project
  const handleAddProject = async () => {
    if (!newProject.name || !newProject.category) {
      showNotification("error", "Please provide both name and category for the project.")
      return
    }

    try {
      setIsSubmitting(true)
      console.log("Adding new project:", newProject)

      const { data, error } = await supabase
        .from("projects")
        .insert([
          {
            name: newProject.name,
            category: newProject.category,
            description: newProject.description,
            location: newProject.location,
            client: newProject.client,
            images: newProject.images,
          },
        ])
        .select()

      if (error) {
        console.error("Error adding project:", error)
        throw error
      }

      console.log("Project added successfully:", data)

      setNewProject({
        name: "",
        category: "",
        description: "",
        location: "",
        client: "",
        images: [],
      })

      showNotification("success", `${newProject.name} has been successfully added.`)
      fetchProjects()
    } catch (error: any) {
      console.error("Add project error details:", error)
      showNotification("error", `There was a problem adding the project: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add Logo
  const handleAddLogo = async () => {
    if (!newLogo.name || !newLogo.image) {
      showNotification("error", "Please provide both name and image for the client logo.")
      return
    }

    try {
      setIsSubmitting(true)

      const { data, error } = await supabase
        .from("client_logos")
        .insert([
          {
            name: newLogo.name,
            url: newLogo.url,
            image: newLogo.image,
            position: clientLogos.length, // Add at the end
          },
        ])
        .select()

      if (error) throw error

      setNewLogo({
        name: "",
        url: "",
        image: "",
      })

      showNotification("success", `${newLogo.name} logo has been successfully added.`)
      fetchLogos()
    } catch (error: any) {
      showNotification("error", `There was a problem adding the logo: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add Slide
  const handleAddSlide = async () => {
    if (!newSlide.title || !newSlide.image) {
      showNotification("error", "Please provide both title and image for the hero slide.")
      return
    }

    try {
      setIsSubmitting(true)

      const { data, error } = await supabase
        .from("hero_slides")
        .insert([
          {
            title: newSlide.title,
            description: newSlide.description,
            image: newSlide.image,
          },
        ])
        .select()

      if (error) throw error

      setNewSlide({
        title: "",
        description: "",
        image: "",
      })

      showNotification("success", `${newSlide.title} slide has been successfully added.`)
      fetchSlides()
    } catch (error: any) {
      showNotification("error", `There was a problem adding the slide: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete Project
  const handleDeleteProject = async (id: string) => {
    try {
      console.log("Deleting project with ID:", id)
      const { error } = await supabase.from("projects").delete().eq("id", id)

      if (error) throw error

      showNotification("success", "The project has been successfully removed.")
      setProjectToDelete(null)
      fetchProjects()
    } catch (error: any) {
      console.error("Delete error:", error)
      showNotification("error", `There was a problem deleting the project: ${error.message}`)
    }
  }

  // Edit Project
  const handleEditProject = async () => {
    if (!projectToEdit) return

    try {
      setIsSubmitting(true)

      const { error } = await supabase
        .from("projects")
        .update({
          name: projectToEdit.name,
          category: projectToEdit.category,
          description: projectToEdit.description,
          location: projectToEdit.location,
          images: projectToEdit.images,
        })
        .eq("id", projectToEdit.id)

      if (error) throw error

      showNotification("success", `${projectToEdit.name} has been successfully updated.`)
      fetchProjects()
      setProjectToEdit(null)
    } catch (error: any) {
      showNotification("error", `There was a problem updating the project: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Edit Logo
  const handleEditLogo = async () => {
    if (!logoToEdit) return

    try {
      setIsSubmitting(true)

      const { error } = await supabase
        .from("client_logos")
        .update({
          name: logoToEdit.name,
          url: logoToEdit.url,
          image: logoToEdit.image,
        })
        .eq("id", logoToEdit.id)

      if (error) throw error

      showNotification("success", `${logoToEdit.name} logo has been successfully updated.`)
      fetchLogos()
      setLogoToEdit(null)
    } catch (error: any) {
      showNotification("error", `There was a problem updating the logo: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete Logo
  const handleDeleteLogo = async (id: string) => {
    try {
      setIsSubmitting(true)
      console.log("Deleting logo with ID:", id)
      const { error } = await supabase.from("client_logos").delete().eq("id", id)

      if (error) throw error

      // Update the local state to remove the deleted logo
      setClientLogos((prevLogos) => prevLogos.filter((logo) => logo.id !== id))
      setLogoOrder((prevOrder) => prevOrder.filter((logoId) => logoId !== id))

      showNotification("success", "The client logo has been successfully removed.")
    } catch (error: any) {
      console.error("Logo deletion error:", error)
      showNotification("error", `There was a problem deleting the logo: ${error.message}`)
    } finally {
      setIsSubmitting(false)
      setLogoToDelete(null)
    }
  }

  // Handle edit slide click
  const handleEditClick = (slide: HeroSlide) => {
    setEditingSlide(slide)
    setIsEditDialogOpen(true)
  }

  // Handle delete slide click
  const handleDeleteClick = (slideId: string) => {
    setSlideIdToDelete(slideId)
    setIsDeleteDialogOpen(true)
  }

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editingSlide) return

    try {
      setIsSubmitting(true)

      const { error } = await supabase
        .from("hero_slides")
        .update({
          title: editingSlide.title,
          description: editingSlide.description,
          image: editingSlide.image,
        })
        .eq("id", editingSlide.id)

      if (error) throw error

      showNotification("success", "Slide updated successfully!")
      fetchSlides()
      setIsEditDialogOpen(false)
      setEditingSlide(null)
    } catch (error: any) {
      showNotification("error", `Failed to update slide: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!slideIdToDelete) return

    try {
      setIsSubmitting(true)

      const { error } = await supabase.from("hero_slides").delete().eq("id", slideIdToDelete)

      if (error) throw error

      showNotification("success", "Slide deleted successfully!")
      fetchSlides()
      setIsDeleteDialogOpen(false)
      setSlideIdToDelete(null)
    } catch (error: any) {
      showNotification("error", `Failed to delete slide: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Save Page Hero
  const handleSavePageHero = async () => {
    if (!heroToEdit) return

    try {
      setIsSubmitting(true)

      // Ensure selectedPageHero is properly formatted
      const formattedPageHero = Array.isArray(selectedPageHero) ? selectedPageHero : [selectedPageHero]

      // Check if a hero exists for this page by querying the database
      const { data: existingHeroes, error: fetchError } = await supabase
        .from("page_heroes")
        .select("*")
        .eq("page", formattedPageHero) // Ensure correct array format

      if (fetchError) throw fetchError

      const existingHero = existingHeroes?.length ? existingHeroes[0] : null
      let result

      if (existingHero) {
        // Update existing record
        result = await supabase
          .from("page_heroes")
          .update({
            title: heroToEdit.title,
            subtitle: heroToEdit.subtitle,
            image: heroToEdit.image,
            video: heroToEdit.video,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingHero.id)
      } else {
        // Insert new record
        result = await supabase.from("page_heroes").insert({
          page: formattedPageHero, // Ensure correct format
          title: heroToEdit.title,
          subtitle: heroToEdit.subtitle,
          image: heroToEdit.image,
          video: heroToEdit.video,
          created_at: new Date().toISOString(),
        })
      }

      if (result.error) throw result.error

      showNotification("success", "Page hero updated successfully!")
      fetchPageHeroes()
      setHeroToEdit(null)
    } catch (error: any) {
      console.error("Save Page Hero Error:", error)
      showNotification("error", `Failed to save page hero: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Fetch Site Settings
  const fetchSiteSettings = async () => {
    if (!user) return

    try {
      setIsLoadingSiteSettings(true)
      console.log("Fetching site settings...")

      const { data, error } = await supabase.from("site_settings").select("*")

      if (error) {
        console.error("Error fetching site settings:", error)
        throw error
      }

      console.log("Site settings fetched successfully:", data)

      if (data) {
        setSiteSettings(data)
      }
    } catch (error: any) {
      console.error("Site settings fetch error details:", error)
      showNotification("error", `There was a problem loading the site settings: ${error.message}`)
    } finally {
      setIsLoadingSiteSettings(false)
    }
  }

  // Update Site Setting
  const updateSiteSetting = async (key: string, value: string) => {
    try {
      setIsSubmitting(true)
      console.log(`Updating site setting for key "${key}" with value:`, value)

      // Check if the setting already exists
      const { data: existingSettings, error: fetchError } = await supabase
        .from("site_settings")
        .select("*")
        .eq("key", key)

      if (fetchError) {
        console.error("Error fetching existing site settings:", fetchError)
        throw fetchError
      }

      if (existingSettings && existingSettings.length > 0) {
        // Update existing setting
        const { error: updateError } = await supabase.from("site_settings").update({ value }).eq("key", key)

        if (updateError) {
          console.error("Error updating site setting:", updateError)
          throw updateError
        }

        console.log(`Site setting "${key}" updated successfully.`)
        showNotification("success", `Setting "${key}" updated successfully!`)
      } else {
        // Insert new setting
        const { error: insertError } = await supabase.from("site_settings").insert([{ key, value }])

        if (insertError) {
          console.error("Error inserting site setting:", insertError)
          throw insertError
        }

        console.log(`Site setting "${key}" inserted successfully.`)
        showNotification("success", `Setting "${key}" inserted successfully!`)
      }

      // Refresh site settings
      fetchSiteSettings()
    } catch (error: any) {
      console.error("Update site setting error details:", error)
      showNotification("error", `There was a problem updating the setting: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loader while loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <h3 className="text-xl font-medium">Loading admin panel...</h3>
          <p className="text-muted-foreground">Please wait while we prepare your dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navbar />

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            className={cn(
              "fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg border",
              notification.type === "success" && "bg-green-50 text-green-800 border-green-200",
              notification.type === "error" && "bg-red-50 text-red-800 border-red-200",
              notification.type === "info" && "bg-blue-50 text-blue-800 border-blue-200",
            )}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : notification.type === "error" ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-info"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            )}
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 rounded-full p-1 hover:bg-black/5 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">.</h1>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Yesp Web Studio</h1>
            <p className="text-muted-foreground mt-1">Manage your projects and client logos</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-user"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>{user?.email}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1.5">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Log Out</span>
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Card className="shadow-md border-muted/40">
          <CardHeader className="border-b bg-muted/20">
            <Tabs defaultValue="projects" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <TabsList>
                  <TabsTrigger value="projects" className="gap-1.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-layout-grid"
                    >
                      <rect width="7" height="7" x="3" y="3" rx="1" />
                      <rect width="7" height="7" x="14" y="3" rx="1" />
                      <rect width="7" height="7" x="14" y="14" rx="1" />
                      <rect width="7" height="7" x="3" y="14" rx="1" />
                    </svg>
                    Projects
                  </TabsTrigger>
                  <TabsTrigger value="logos" className="gap-1.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-briefcase"
                    >
                      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                    Client Logos
                  </TabsTrigger>
                  <TabsTrigger value="slides" className="gap-1.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-image"
                    >
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    Hero Slides
                  </TabsTrigger>
                  <TabsTrigger value="site-settings" className="gap-1.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-settings"
                    >
                      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    Site Settings
                  </TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={
                      activeTab === "projects"
                        ? fetchProjects
                        : activeTab === "logos"
                          ? fetchLogos
                          : activeTab === "site-settings"
                            ? fetchSiteSettings
                            : fetchSlides
                    }
                    disabled={isRefreshing || isLoadingSiteSettings}
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing || isLoadingSiteSettings ? "animate-spin" : ""}`} />
                    <span className="sr-only">Refresh</span>
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="gap-1.5">
                        <Plus className="h-4 w-4" />
                        Add {activeTab === "projects" ? "Project" : activeTab === "logos" ? "Logo" : "Slide"}
                      </Button>
                    </DialogTrigger>
                    {activeTab === "projects" ? (
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Add New Project</DialogTitle>
                          <DialogDescription>Fill in the details to create a new project.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="name">Project Name*</Label>
                              <Input
                                id="name"
                                value={newProject.name}
                                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                placeholder="Enter project name"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="category">Category*</Label>
                              <Select
                                defaultValue={newProject.category}
                                onValueChange={(value) => setNewProject({ ...newProject, category: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Commercial">Commercial</SelectItem>
                                  <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                                  <SelectItem value="Residential">Residential</SelectItem>
                                  <SelectItem value="Industrial">Industrial</SelectItem>
                                  <SelectItem value="Institutional">Institutional</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              className="min-h-[80px]"
                              value={newProject.description}
                              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                              placeholder="Brief description of the project"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="location">Location</Label>
                              <Input
                                id="location"
                                value={newProject.location}
                                onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
                                placeholder="e.g. Salem, Tamil Nadu"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="client">Client</Label>
                              <Input
                                id="client"
                                value={newProject.client}
                                onChange={(e) => setNewProject({ ...newProject, client: e.target.value })}
                                placeholder="e.g. Thambi Modern Spinning Mills Ltd."
                              />
                            </div>
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="images">Project Images</Label>
                            <div className="flex flex-col gap-3">
                              <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*,.heic,.HEIC"
                                onChange={handleImageUpload}
                                multiple
                              />

                              <div
                                onClick={triggerFileInput}
                                className={cn(
                                  "border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all",
                                  isUploading
                                    ? "bg-muted/50 border-muted"
                                    : "hover:bg-muted/50 hover:border-primary/50 hover:scale-[0.99]",
                                )}
                              >
                                {isUploading ? (
                                  <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                                ) : (
                                  <Upload className="h-10 w-10 text-muted-foreground" />
                                )}
                                <p className="text-sm font-medium">
                                  {isUploading ? "Uploading..." : "Click to upload images"}
                                </p>
                                <p className="text-xs text-muted-foreground">SVG, PNG, JPG or GIF (max. 5MB each)</p>
                              </div>

                              {/* Display uploaded images */}
                              {newProject.images.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                                  {newProject.images.map((imageUrl, index) => (
                                    <div key={index} className="relative group">
                                      <div className="aspect-square rounded-md overflow-hidden border">
                                        <img
                                          src={imageUrl || "/placeholder.svg"}
                                          alt={`Project image ${index + 1}`}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          removeImage(index, false)
                                        }}
                                        className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 hover:bg-black/90 transition-colors"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="flex items-center mt-4">
                                <div className="h-px flex-1 bg-muted"></div>
                                <span className="px-2 text-xs text-muted-foreground">or add image URL</span>
                                <div className="h-px flex-1 bg-muted"></div>
                              </div>

                              {/* Add image URL directly */}
                              <div className="flex gap-2 mt-2">
                                <Input
                                  id="imageUrl"
                                  placeholder="Enter image URL directly"
                                  className="flex-1"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault()
                                      addImageUrl((e.target as HTMLInputElement).value, false)
                                      ;(e.target as HTMLInputElement).value = ""
                                    }
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={(e) => {
                                    const input = e.currentTarget.previousSibling as HTMLInputElement
                                    addImageUrl(input.value, false)
                                    input.value = ""
                                  }}
                                >
                                  Add URL
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button onClick={handleAddProject} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Project
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    ) : activeTab === "logos" ? (
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add Client Logo</DialogTitle>
                          <DialogDescription>Add a new client logo to display on your website.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="logo-name">Client Name*</Label>
                            <Input
                              id="logo-name"
                              value={newLogo.name}
                              onChange={(e) => setNewLogo({ ...newLogo, name: e.target.value })}
                              placeholder="Enter client name"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="logo-url">Website URL (optional)</Label>
                            <Input
                              id="logo-url"
                              value={newLogo.url}
                              onChange={(e) => setNewLogo({ ...newLogo, url: e.target.value })}
                              placeholder="https://example.com"
                            />
                          </div>

                          {/* Logo Upload Section */}
                          <div className="grid gap-2">
                            <Label htmlFor="logo-image">Logo Image</Label>
                            <div className="flex flex-col gap-3">
                              <input
                                type="file"
                                ref={logoFileInputRef}
                                className="hidden"
                                accept="image/*,.heic,.HEIC"
                                onChange={handleLogoUpload}
                              />

                              <div
                                onClick={triggerLogoFileInput}
                                className={cn(
                                  "border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all",
                                  isUploadingLogo
                                    ? "bg-muted/50 border-muted"
                                    : "hover:bg-muted/50 hover:border-primary/50 hover:scale-[0.99]",
                                )}
                              >
                                {isUploadingLogo ? (
                                  <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                                ) : (
                                  <Upload className="h-10 w-10 text-muted-foreground" />
                                )}
                                <p className="text-sm font-medium">
                                  {isUploadingLogo ? "Uploading..." : "Click to upload logo"}
                                </p>
                                <p className="text-xs text-muted-foreground">SVG, PNG, JPG or GIF (max. 2MB)</p>
                              </div>

                              <div className="flex items-center mt-4">
                                <div className="h-px flex-1 bg-muted"></div>
                                <span className="px-2 text-xs text-muted-foreground">or add image URL</span>
                                <div className="h-px flex-1 bg-muted"></div>
                              </div>

                              {/* Add image URL directly */}
                              <div className="flex gap-2 mt-2">
                                <Input
                                  id="logoImageUrl"
                                  placeholder="Enter logo image URL"
                                  className="flex-1"
                                  value={newLogo.image}
                                  onChange={(e) => setNewLogo({ ...newLogo, image: e.target.value })}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="mt-2">
                            {newLogo.image && (
                              <div className="border rounded-md p-4 flex justify-center bg-muted/20">
                                <img
                                  src={newLogo.image || "/placeholder.svg"}
                                  alt="Logo preview"
                                  className="h-20 object-contain"
                                  onError={(e) => {
                                    ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=80&width=120"
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button onClick={handleAddLogo} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Logo
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    ) : (
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add Hero Slide</DialogTitle>
                          <DialogDescription>Add a new hero slide to display on your website.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="slide-title">Title*</Label>
                            <Input
                              id="slide-title"
                              value={newSlide.title}
                              onChange={(e) => setNewSlide({ ...newSlide, title: e.target.value })}
                              placeholder="Enter slide title"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="slide-description">Description</Label>
                            <Textarea
                              id="slide-description"
                              value={newSlide.description}
                              onChange={(e) => setNewSlide({ ...newSlide, description: e.target.value })}
                              placeholder="Enter slide description"
                            />
                          </div>

                          {/* Slide Image Upload Section */}
                          <div className="grid gap-2">
                            <Label htmlFor="slide-image">Slide Image*</Label>
                            <div className="flex flex-col gap-3">
                              <input
                                type="file"
                                ref={slideFileInputRef}
                                className="hidden"
                                accept="image/*,.heic,.HEIC"
                                onChange={handleSlideUpload}
                              />

                              <div
                                onClick={triggerSlideFileInput}
                                className={cn(
                                  "border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all",
                                  isUploadingSlide
                                    ? "bg-muted/50 border-muted"
                                    : "hover:bg-muted/50 hover:border-primary/50 hover:scale-[0.99]",
                                )}
                              >
                                {isUploadingSlide ? (
                                  <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                                ) : (
                                  <Upload className="h-10 w-10 text-muted-foreground" />
                                )}
                                <p className="text-sm font-medium">
                                  {isUploadingSlide ? "Uploading..." : "Click to upload slide image"}
                                </p>
                                <p className="text-xs text-muted-foreground">SVG, PNG, JPG or GIF (max. 2MB)</p>
                              </div>

                              <div className="flex items-center mt-4">
                                <div className="h-px flex-1 bg-muted"></div>
                                <span className="px-2 text-xs text-muted-foreground">or add image URL</span>
                                <div className="h-px flex-1 bg-muted"></div>
                              </div>

                              {/* Add image URL directly */}
                              <div className="flex gap-2 mt-2">
                                <Input
                                  id="slideImageUrl"
                                  placeholder="Enter slide image URL"
                                  className="flex-1"
                                  value={newSlide.image}
                                  onChange={(e) => setNewSlide({ ...newSlide, image: e.target.value })}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="mt-2">
                            {newSlide.image && (
                              <div className="border rounded-md p-4 flex justify-center bg-muted/20">
                                <img
                                  src={newSlide.image || "/placeholder.svg"}
                                  alt="Slide preview"
                                  className="h-20 object-contain"
                                  onError={(e) => {
                                    ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=80&width=120"
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button onClick={handleAddSlide} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Slide
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    )}
                  </Dialog>
                </div>
              </div>
            </Tabs>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="projects" className="mt-0">
                {/* Search and View Controls */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search projects..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 mr-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn("px-2", sortField === "name" && "bg-muted")}
                        onClick={() => toggleSort("name")}
                      >
                        Name
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn("px-2", sortField === "category" && "bg-muted")}
                        onClick={() => toggleSort("category")}
                      >
                        Category
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn("px-2", sortField === "created_at" && "bg-muted")}
                        onClick={() => toggleSort("created_at")}
                      >
                        Date
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Projects Display */}
                {filteredProjects.length === 0 ? (
                  <div className="text-center py-12 border rounded-lg bg-muted/20">
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">No projects found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery ? "Try adjusting your search query." : "Get started by adding your first project."}
                    </p>
                    {searchQuery && (
                      <Button variant="outline" className="mt-4" onClick={() => setSearchQuery("")}>
                        Clear search
                      </Button>
                    )}
                  </div>
                ) : viewMode === "list" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                      {filteredProjects.map((project) => (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          onEdit={(project) => setProjectToEdit({ ...project })}
                          onDelete={() => setProjectToDelete(project)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="border-b p-3 text-left">Project</th>
                            <th className="border-b p-3 text-left">Category</th>
                            <th className="border-b p-3 text-left">Location</th>
                            <th className="border-b p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <AnimatePresence>
                            {filteredProjects.map((project) => (
                              <motion.tr
                                key={project.id}
                                className="hover:bg-muted/30 transition-colors"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                              >
                                <td className="border-b p-3">
                                  <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 overflow-hidden rounded-md bg-muted flex items-center justify-center">
                                      {project.images && project.images.length > 0 ? (
                                        <img
                                          src={project.images[0] || "/placeholder.svg"}
                                          alt={project.name}
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                      )}
                                    </div>
                                    <div className="font-medium">{project.name}</div>
                                    {project.images && project.images.length > 1 && (
                                      <span className="text-xs bg-muted px-2 py-1 rounded-full">
                                        +{project.images.length - 1} more
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="border-b p-3">
                                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                    {project.category}
                                  </Badge>
                                </td>
                                <td className="border-b p-3">{project.location || "-"}</td>
                                <td className="border-b p-3 text-right">
                                  <div className="flex justify-end gap-2">
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button variant="outline" size="sm">
                                          Details
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                          <DialogTitle>{project.name}</DialogTitle>
                                          <DialogDescription>
                                            View detailed information about this project.
                                          </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                          {project.images && project.images.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              {/* Main image (larger) */}
                                              <div className="md:col-span-2 aspect-video w-full overflow-hidden rounded-lg">
                                                <img
                                                  src={project.images[0] || "/placeholder.svg"}
                                                  alt={`${project.name} - Main view`}
                                                  className="h-full w-full object-cover"
                                                />
                                              </div>

                                              {/* Additional images */}
                                              {project.images.slice(1).map((img, idx) => (
                                                <div
                                                  key={idx}
                                                  className="aspect-video w-full overflow-hidden rounded-lg"
                                                >
                                                  <img
                                                    src={img || "/placeholder.svg"}
                                                    alt={`${project.name} - View ${idx + 2}`}
                                                    className="h-full w-full object-cover"
                                                  />
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <div className="aspect-video w-full rounded-lg bg-muted flex items-center justify-center">
                                              <ImageIcon className="h-12 w-12 text-muted-foreground" />
                                            </div>
                                          )}
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <h3 className="text-sm font-medium text-muted-foreground">Category</h3>
                                              <p>{project.category}</p>
                                            </div>
                                            <div>
                                              <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
                                              <p>{project.location || "Not specified"}</p>
                                            </div>
                                            <div>
                                              <h3 className="text-sm font-medium text-muted-foreground">Client</h3>
                                              <p>{project.client || "Not specified"}</p>
                                            </div>
                                          </div>
                                          {project.description && (
                                            <div>
                                              <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                                              <p className="mt-1">{project.description}</p>
                                            </div>
                                          )}
                                        </div>
                                      </DialogContent>
                                    </Dialog>

                                    {/* Edit button */}
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setProjectToEdit({ ...project })}
                                        >
                                          Edit
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                          <DialogTitle>Edit Project</DialogTitle>
                                          <DialogDescription>Update the project information.</DialogDescription>
                                        </DialogHeader>
                                        {projectToEdit && (
                                          <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-2 gap-4">
                                              <div className="grid gap-2">
                                                <Label htmlFor="edit-name">Project Name*</Label>
                                                <Input
                                                  id="edit-name"
                                                  value={projectToEdit.name}
                                                  onChange={(e) =>
                                                    setProjectToEdit({ ...projectToEdit, name: e.target.value })
                                                  }
                                                  placeholder="Enter project name"
                                                />
                                              </div>
                                              <div className="grid gap-2">
                                                <Label htmlFor="edit-category">Category*</Label>
                                                <Select
                                                  defaultValue={projectToEdit.category}
                                                  onValueChange={(value) =>
                                                    setProjectToEdit({ ...projectToEdit, category: value })
                                                  }
                                                >
                                                  <SelectTrigger>
                                                    <SelectValue placeholder="Select category" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="Commercial">Commercial</SelectItem>
                                                    <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                                                    <SelectItem value="Residential">Residential</SelectItem>
                                                    <SelectItem value="Industrial">Industrial</SelectItem>
                                                    <SelectItem value="Institutional">Institutional</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                            </div>

                                            <div className="grid gap-2">
                                              <Label htmlFor="edit-description">Description</Label>
                                              <Textarea
                                                id="edit-description"
                                                className="min-h-[80px]"
                                                value={projectToEdit.description || ""}
                                                onChange={(e) =>
                                                  setProjectToEdit({ ...projectToEdit, description: e.target.value })
                                                }
                                                placeholder="Brief description of the project"
                                              />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                              <div className="grid gap-2">
                                                <Label htmlFor="edit-location">Location</Label>
                                                <Input
                                                  id="edit-location"
                                                  value={projectToEdit.location || ""}
                                                  onChange={(e) =>
                                                    setProjectToEdit({ ...projectToEdit, location: e.target.value })
                                                  }
                                                  placeholder="e.g. Salem, Tamil Nadu"
                                                />
                                              </div>
                                              <div className="grid gap-2">
                                                <Label htmlFor="edit-client">Client</Label>
                                                <Input
                                                  id="edit-client"
                                                  value={projectToEdit.client || ""}
                                                  onChange={(e) =>
                                                    setProjectToEdit({ ...projectToEdit, client: e.target.value })
                                                  }
                                                  placeholder="e.g. Thambi Modern Spinning Mills Ltd."
                                                />
                                              </div>
                                            </div>

                                            <div className="grid gap-2">
                                              <Label htmlFor="edit-images">Project Images</Label>
                                              <div className="flex flex-col gap-3">
                                                <input
                                                  type="file"
                                                  ref={fileInputRef}
                                                  className="hidden"
                                                  accept="image/*,.heic,.HEIC"
                                                  onChange={handleImageUpload}
                                                  multiple
                                                />

                                                <div
                                                  onClick={triggerFileInput}
                                                  className={cn(
                                                    "border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all",
                                                    isUploading
                                                      ? "bg-muted/50 border-muted"
                                                      : "hover:bg-muted/50 hover:border-primary/50 hover:scale-[0.99]",
                                                  )}
                                                >
                                                  {isUploading ? (
                                                    <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                                                  ) : (
                                                    <Upload className="h-10 w-10 text-muted-foreground" />
                                                  )}
                                                  <p className="text-sm font-medium">
                                                    {isUploading ? "Uploading..." : "Click to upload more images"}
                                                  </p>
                                                  <p className="text-xs text-muted-foreground">
                                                    SVG, PNG, JPG or GIF (max. 5MB each)
                                                  </p>
                                                </div>

                                                {/* Display uploaded images */}
                                                {projectToEdit.images && projectToEdit.images.length > 0 && (
                                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                                                    {projectToEdit.images.map((imageUrl, index) => (
                                                      <div key={index} className="relative group">
                                                        <div className="aspect-square rounded-md overflow-hidden border">
                                                          <img
                                                            src={imageUrl || "/placeholder.svg"}
                                                            alt={`Project image ${index + 1}`}
                                                            className="w-full h-full object-cover"
                                                          />
                                                        </div>
                                                        <button
                                                          type="button"
                                                          onClick={(e) => {
                                                            e.stopPropagation()
                                                            removeImage(index, true)
                                                          }}
                                                          className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 hover:bg-black/90 transition-colors"
                                                        >
                                                          <X className="h-4 w-4" />
                                                        </button>
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}

                                                <div className="flex items-center mt-4">
                                                  <div className="h-px flex-1 bg-muted"></div>
                                                  <span className="px-2 text-xs text-muted-foreground">
                                                    or add image URL
                                                  </span>
                                                  <div className="h-px flex-1 bg-muted"></div>
                                                </div>

                                                {/* Add image URL directly */}
                                                <div className="flex gap-2 mt-2">
                                                  <Input
                                                    id="edit-imageUrl"
                                                    placeholder="Enter image URL directly"
                                                    className="flex-1"
                                                    onKeyDown={(e) => {
                                                      if (e.key === "Enter") {
                                                        e.preventDefault()
                                                        addImageUrl((e.target as HTMLInputElement).value, true)
                                                        ;(e.target as HTMLInputElement).value = ""
                                                      }
                                                    }}
                                                  />
                                                  <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={(e) => {
                                                      const input = e.currentTarget.previousSibling as HTMLInputElement
                                                      addImageUrl(input.value, true)
                                                      input.value = ""
                                                    }}
                                                  >
                                                    Add URL
                                                  </Button>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                        <DialogFooter>
                                          <DialogClose asChild>
                                            <Button variant="outline">Cancel</Button>
                                          </DialogClose>
                                          <Button onClick={handleEditProject} disabled={isSubmitting}>
                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Save Changes
                                          </Button>
                                        </DialogFooter>
                                      </DialogContent>
                                    </Dialog>

                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setProjectToDelete(project)
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                          <span className="sr-only">Delete</span>
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This will permanently delete {project.name}. This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            onClick={() => {
                                              if (projectToDelete) {
                                                handleDeleteProject(projectToDelete.id)
                                              }
                                            }}
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </td>
                              </motion.tr>
                            ))}
                          </AnimatePresence>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="text-sm text-muted-foreground mt-4">
                  Showing {filteredProjects.length} of {projects.length} projects
                </div>
              </TabsContent>

              <TabsContent value="logos" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Logo List */}
                  <div className="lg:col-span-1 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium">Client Logos</h3>
                      <Button variant="outline" size="sm" onClick={fetchLogos} disabled={isRefreshing}>
                        <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
                        Refresh
                      </Button>
                    </div>

                    {clientLogos.length === 0 ? (
                      <div className="text-center py-8 border rounded-lg bg-muted/20">
                        <div className="mx-auto w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-briefcase text-muted-foreground"
                          >
                            <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                          </svg>
                        </div>
                        <h3 className="text-base font-medium mb-1">No client logos added yet</h3>
                        <p className="text-sm text-muted-foreground">Add your first client logo to get started.</p>
                      </div>
                    ) : (
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={logoOrder} strategy={verticalListSortingStrategy}>
                          <ScrollArea className="h-[calc(100vh-300px)] pr-4 -mr-4">
                            <div className="space-y-1">
                              <AnimatePresence>
                                {clientLogos.map((logo) => (
                                  <SortableLogoItem
                                    key={logo.id}
                                    logo={logo}
                                    isSelected={selectedLogo?.id === logo.id}
                                    onSelect={() => setSelectedLogo(logo)}
                                    onEdit={() => setLogoToEdit({ ...logo })}
                                    onDelete={() => {
                                      setLogoToDelete(logo)
                                      setSelectedLogo(logo)
                                    }}
                                  />
                                ))}
                              </AnimatePresence>
                            </div>
                          </ScrollArea>
                        </SortableContext>
                      </DndContext>
                    )}
                  </div>

                  {/* Logo Preview */}
                  <div className="lg:col-span-2">
                    <div className="border rounded-lg h-full flex flex-col">
                      <div className="p-4 border-b bg-muted/20">
                        <h3 className="font-medium">Logo Preview</h3>
                      </div>
                      {selectedLogo ? (
                        <div className="flex-1 p-6 flex flex-col">
                          <div className="flex-1 flex items-center justify-center bg-muted/10 rounded-lg p-8 mb-4">
                            <img
                              src={selectedLogo.image || "/placeholder.svg?height=200&width=300"}
                              alt={selectedLogo.name}
                              className="max-h-48 max-w-full object-contain"
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=200&width=300"
                              }}
                            />
                          </div>
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">Client Name</h4>
                              <p className="text-lg">{selectedLogo.name}</p>
                            </div>
                            {selectedLogo.url && (
                              <div>
                                <h4 className="text-sm font-medium text-muted-foreground">Website URL</h4>
                                <p className="text-primary flex items-center gap-1">
                                  <ExternalLink className="h-4 w-4" />
                                  <a
                                    href={selectedLogo.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline"
                                  >
                                    {selectedLogo.url}
                                  </a>
                                </p>
                              </div>
                            )}
                            <div className="pt-4 flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" onClick={() => setLogoToEdit({ ...selectedLogo })}>
                                    Edit Logo
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Edit Client Logo</DialogTitle>
                                    <DialogDescription>Update the client logo information.</DialogDescription>
                                  </DialogHeader>
                                  {logoToEdit && (
                                    <div className="grid gap-4 py-4">
                                      <div className="grid gap-2">
                                        <Label htmlFor="edit-logo-name">Client Name*</Label>
                                        <Input
                                          id="edit-logo-name"
                                          value={logoToEdit.name}
                                          onChange={(e) => setLogoToEdit({ ...logoToEdit, name: e.target.value })}
                                          placeholder="Enter client name"
                                        />
                                      </div>
                                      <div className="grid gap-2">
                                        <Label htmlFor="edit-logo-url">Website URL (optional)</Label>
                                        <Input
                                          id="edit-logo-url"
                                          value={logoToEdit.url || ""}
                                          onChange={(e) => setLogoToEdit({ ...logoToEdit, url: e.target.value })}
                                          placeholder="https://example.com"
                                        />
                                      </div>

                                      {/* Logo Upload Section for Edit */}
                                      <div className="grid gap-2">
                                        <Label htmlFor="edit-logo-image">Logo Image</Label>
                                        <div className="flex flex-col gap-3">
                                          <input
                                            type="file"
                                            ref={logoFileInputRef}
                                            className="hidden"
                                            accept="image/*,.heic,.HEIC"
                                            onChange={handleLogoUpload}
                                          />

                                          <div
                                            onClick={triggerLogoFileInput}
                                            className={cn(
                                              "border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all",
                                              isUploadingLogo
                                                ? "bg-muted/50 border-muted"
                                                : "hover:bg-muted/50 hover:border-primary/50 hover:scale-[0.99]",
                                            )}
                                          >
                                            {isUploadingLogo ? (
                                              <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                                            ) : (
                                              <Upload className="h-10 w-10 text-muted-foreground" />
                                            )}
                                            <p className="text-sm font-medium">
                                              {isUploadingLogo ? "Uploading..." : "Click to upload new logo"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              SVG, PNG, JPG or GIF (max. 2MB)
                                            </p>
                                          </div>

                                          <div className="flex items-center mt-4">
                                            <div className="h-px flex-1 bg-muted"></div>
                                            <span className="px-2 text-xs text-muted-foreground">
                                              or edit image URL
                                            </span>
                                            <div className="h-px flex-1 bg-muted"></div>
                                          </div>

                                          {/* Add image URL directly */}
                                          <div className="flex gap-2 mt-2">
                                            <Input
                                              id="edit-logoImageUrl"
                                              placeholder="Enter logo image URL"
                                              className="flex-1"
                                              value={logoToEdit.image}
                                              onChange={(e) => setLogoToEdit({ ...logoToEdit, image: e.target.value })}
                                            />
                                          </div>
                                        </div>
                                      </div>

                                      <div className="mt-2">
                                        {logoToEdit.image && (
                                          <div className="border rounded-md p-4 flex justify-center bg-muted/20">
                                            <img
                                              src={logoToEdit.image || "/placeholder.svg"}
                                              alt="Logo preview"
                                              className="h-20 object-contain"
                                              onError={(e) => {
                                                ;(e.target as HTMLImageElement).src =
                                                  "/placeholder.svg?height=80&width=120"
                                              }}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  <DialogFooter>
                                    <DialogClose asChild>
                                      <Button variant="outline">Cancel</Button>
                                    </DialogClose>
                                    <Button onClick={handleEditLogo} disabled={isSubmitting}>
                                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                      Save Changes
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                                  >
                                    Delete Logo
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete the {selectedLogo.name} logo. This action cannot be
                                      undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      onClick={() => {
                                        if (selectedLogo) {
                                          handleDeleteLogo(selectedLogo.id)
                                          setSelectedLogo(null)
                                        }
                                      }}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center p-6 text-center">
                          <div className="max-w-xs">
                            <div className="mx-auto w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
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
                                className="lucide lucide-hand-metal text-muted-foreground"
                              >
                                <path d="M18 12.5V10a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v1.4" />
                                <path d="M14 11V9a2 2 0 1 0-4 0v2" />
                                <path d="M10 10.5V5a2 2 0 1 0-4 0v9" />
                                <path
                                  d="m7 15-1.76-1.76a2 2 0 0 0-2.83 2.82l3.6 3.6C7.5 21.14 9.2 22 12
 22h2a8 8 0 0 0 8-8V7a2 2 0 1 0-4 0v5"
                                />
                              </svg>
                            </div>
                            <h3 className="text-lg font-medium mb-2">Select a logo to preview</h3>
                            <p className="text-muted-foreground text-sm">
                              Click on a logo from the list to view details and manage it.
                            </p>
                            {clientLogos.length > 0 && (
                              <p className="text-muted-foreground text-sm mt-2">
                                <span className="font-medium">Pro tip:</span> You can drag and drop logos to reorder
                                them.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="slides" className="mt-0">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Hero Slides</h2>
                    <Button variant="outline" size="sm" onClick={fetchSlides} disabled={isRefreshing}>
                      <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                  </div>

                  {/* Slides Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {slides.length === 0 ? (
                      <div className="md:col-span-3 text-center py-12 border rounded-lg bg-muted/20">
                        <div className="mx-auto w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium mb-1">No hero slides found</h3>
                        <p className="text-muted-foreground">Get started by adding your first hero slide.</p>
                      </div>
                    ) : (
                      <>
                        {slides.map((slide) => (
                          <motion.div
                            key={slide.id}
                            className="bg-white dark:bg-card rounded-xl shadow-sm border overflow-hidden transition-all hover:shadow-md"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            whileHover={{ y: -4 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="aspect-video relative overflow-hidden bg-muted">
                              {slide.image ? (
                                <img
                                  src={slide.image || "/placeholder.svg"}
                                  alt={slide.title}
                                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                  onError={(e) => {
                                    ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=200&width=400"
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                                </div>
                              )}
                            </div>
                            <div className="p-4">
                              <h3 className="font-semibold text-lg line-clamp-1">{slide.title}</h3>
                              {slide.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{slide.description}</p>
                              )}
                              <div className="flex justify-end items-center pt-2 mt-2 border-t">
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => handleEditClick(slide)}>
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteClick(slide.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                {/* Edit Slide Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Edit Slide</DialogTitle>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      {/* Title and Description fields remain the same */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="title" className="text-right">
          Title
        </Label>
        <Input
          id="title"
          value={editingSlide?.title || ""}
          onChange={(e) =>
            setEditingSlide((prev) => (prev ? { ...prev, title: e.target.value } : null))
          }
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="description" className="text-right">
          Description
        </Label>
        <Textarea
          id="description"
          value={editingSlide?.description || ""}
          onChange={(e) =>
            setEditingSlide((prev) => (prev ? { ...prev, description: e.target.value } : null))
          }
          className="col-span-3"
        />
      </div>

      {/* Enhanced Drag and Drop Image Uploader */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="image" className="text-right">
          Image
        </Label>
        <div className="col-span-3">
          <div 
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-gray-50 transition-colors ${isUploading ? 'opacity-70 pointer-events-none' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add("border-primary", "bg-gray-50");
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove("border-primary", "bg-gray-50");
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove("border-primary", "bg-gray-50");
              if (isUploading) return;
              
              const files = e.dataTransfer.files;
              if (files.length > 0) {
                // Create a synthetic event to reuse your handleImageUpload
                const syntheticEvent = {
                  target: {
                    files: files
                  }
                } as React.ChangeEvent<HTMLInputElement>;
                handleImageUpload(syntheticEvent);
              }
            }}
            onClick={() => !isUploading && document.getElementById("file-upload")?.click()}
          >
            <input
              id="file-upload"
              type="file"
              accept="image/*,.heic"
              className="hidden"
              onChange={handleImageUpload}
              disabled={isUploading}
              multiple={false} // Set to true if you want multiple files
            />
            
            {isUploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 mb-2 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Uploading image...</p>
              </div>
            ) : editingSlide?.image ? (
              <>
                <img 
                  src={editingSlide.image} 
                  alt="Preview" 
                  className="max-h-40 mb-2 rounded-md object-cover"
                />
                <p className="text-sm text-muted-foreground">Click or drag to replace</p>
              </>
            ) : (
              <>
                <UploadIcon className="h-8 w-8 mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-primary">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">Supports: JPG, PNG, GIF, HEIC</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Optional URL fallback */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="image-url" className="text-right">
          Or Image URL
        </Label>
        <Input
          id="image-url"
          value={editingSlide?.image || ""}
          onChange={(e) =>
            setEditingSlide((prev) => (prev ? { ...prev, image: e.target.value } : null))
          }
          className="col-span-3"
          placeholder="Paste image URL here"
        />
      </div>
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleSaveEdit} disabled={isUploading}>
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save changes"
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the slide.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleConfirmDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TabsContent>

              <TabsContent value="site-settings" className="mt-0">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Hero Images</h2>
                    <Button variant="outline" size="sm" onClick={fetchSiteSettings} disabled={isLoadingSiteSettings}>
                      <RefreshCw className={`h-4 w-4 mr-1 ${isLoadingSiteSettings ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                     
                      "about_hero_image",
                      "projects_hero_image",
                      "gallery_hero_image",
                      "contact_hero_image",
                    ].map((key) => {
                      const setting = siteSettings.find((s) => s.key === key)
                      const pageName = key.replace("_hero_image", "").replace("_", " ")

                      return (
                        <Card key={key} className="overflow-hidden">
                          <CardHeader className="p-4 bg-muted/20">
                            <h3 className="font-medium capitalize">{pageName} Page Hero</h3>
                          </CardHeader>
                          <CardContent className="p-4 space-y-4">
                            <div className="aspect-video w-full overflow-hidden rounded-lg border bg-muted/20">
                              {setting?.value ? (
                                <img
                                  src={setting.value || "/placeholder.svg"}
                                  alt={`${pageName} hero`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=200&width=400"
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="text-center">
                                    <ImageIcon className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                                    <p className="text-muted-foreground text-sm">No hero image set</p>
                                  </div>
                                </div>
                              )}
                            </div>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" className="w-full">
                                  <Upload className="h-4 w-4 mr-2" />
                                  Update Hero Image
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Update {pageName} Hero Image</DialogTitle>
                                  <DialogDescription>
                                    Upload a new hero image or provide an image URL.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid gap-2">
                                    <Label>Current Image</Label>
                                    <div className="aspect-video w-full overflow-hidden rounded-lg border bg-muted/20">
                                      {setting?.value ? (
                                        <img
                                          src={setting.value || "/placeholder.svg"}
                                          alt={`${pageName} hero`}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            ;(e.target as HTMLImageElement).src =
                                              "/placeholder.svg?height=200&width=400"
                                          }}
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="grid gap-2">
                                    <Label htmlFor={`${key}-url`}>Image URL</Label>
                                    <Input
                                      id={`${key}-url`}
                                      placeholder="Enter image URL"
                                      defaultValue={setting?.value || ""}
                                    />
                                  </div>

                                  <div className="flex items-center">
                                    <div className="h-px flex-1 bg-muted"></div>
                                    <span className="px-2 text-xs text-muted-foreground">or</span>
                                    <div className="h-px flex-1 bg-muted"></div>
                                  </div>

                                  <div className="grid gap-2">
                                    <Label>Upload Image</Label>
                                    <div
                                      onClick={() => heroFileInputRef.current?.click()}
                                      className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-muted/50 hover:border-primary/50"
                                    >
                                      <Upload className="h-8 w-8 text-muted-foreground" />
                                      <p className="text-sm font-medium">Click to upload</p>
                                      <p className="text-xs text-muted-foreground">SVG, PNG, JPG or GIF (max. 5MB)</p>
                                    </div>
                                    <input
                                      type="file"
                                      ref={heroFileInputRef}
                                      className="hidden"
                                      accept="image/*,.heic,.HEIC"
                                      onChange={async (e) => {
                                        const files = e.target.files
                                        if (!files || files.length === 0) return

                                        try {
                                          setIsUploadingHero(true)
                                          const file = files[0]

                                          // Create a unique file name
                                          const fileExt = file.name.split(".").pop()
                                          const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
                                          const filePath = `hero-images/${fileName}`

                                          // Upload the file to Supabase Storage
                                          const { error: uploadError } = await supabase.storage
                                            .from("projects")
                                            .upload(filePath, file)

                                          if (uploadError) throw uploadError

                                          // Get the public URL
                                          const {
                                            data: { publicUrl },
                                          } = supabase.storage.from("projects").getPublicUrl(filePath)

                                          // Update the input field with the new URL
                                          const input = document.getElementById(`${key}-url`) as HTMLInputElement
                                          if (input) input.value = publicUrl

                                          showNotification("success", "Image uploaded successfully!")
                                        } catch (error: any) {
                                          showNotification("error", `Upload failed: ${error.message}`)
                                        } finally {
                                          setIsUploadingHero(false)
                                          if (heroFileInputRef.current) {
                                            heroFileInputRef.current.value = ""
                                          }
                                        }
                                      }}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                  </DialogClose>
                                  <Button
                                    onClick={() => {
                                      const input = document.getElementById(`${key}-url`) as HTMLInputElement
                                      if (input) {
                                        updateSiteSetting(key, input.value)
                                      }
                                    }}
                                    disabled={isSubmitting}
                                  >
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="border-t bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-2 px-6 py-4">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Yesp Web Studio. All rights reserved.
            </div>
            <div className="flex items-center gap-2"></div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export { AdminPanel }

