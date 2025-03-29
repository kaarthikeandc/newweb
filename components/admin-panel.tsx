"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import Navbar from "@/components/navbar"
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
import {
  Loader2,
  Plus,
  Search,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  Upload,
  ImageIcon,
  GripVertical,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { arrayMove, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

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
  images?: string[] // Changed from image to images array
  created_at?: string
}

// Add a new type definition for ClientLogo after the Project type definition
type ClientLogo = {
  id: string
  name: string
  url: string
  image: string
  created_at?: string
  position?: number
}

// Add this type definition after the ClientLogo type
type SortableLogoItemProps = {
  logo: ClientLogo
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}

// Add this component before the AdminPanel component
function SortableLogoItem({ logo, isSelected, onSelect, onEdit, onDelete }: SortableLogoItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: logo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center p-3 border rounded-md mb-2 cursor-pointer ${
        isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
      }`}
      onClick={onSelect}
    >
      <div className="mr-2 touch-none" {...attributes} {...listeners}>
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="h-10 w-10 mr-3 flex-shrink-0">
        <img
          src={logo.image || "/placeholder.svg?height=40&width=40"}
          alt={logo.name}
          className="h-full w-full object-contain"
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=40&width=40"
          }}
        />
      </div>
      <div className="flex-grow">
        <div className="font-medium truncate" title={logo.name}>
          {logo.name}
        </div>
        {logo.url && <div className="text-xs text-muted-foreground truncate">{logo.url}</div>}
      </div>
      <div className="flex gap-1 ml-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
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
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </div>
  )
}

// Add this function after the SortableLogoItem component
const saveLogoOrder = async (logoIds: string[]) => {
  try {
    // Create an array of updates with position values
    const updates = logoIds.map((id, index) => ({
      id,
      position: index,
    }))

    // Update all logos with their new positions
    const { error } = await supabase.from("client_logos").upsert(updates, { onConflict: "id" })

    if (error) throw error

    return true
  } catch (error) {
    console.error("Error saving logo order:", error)
    return false
  }
}

export function AdminPanel() {
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [newProject, setNewProject] = useState({
    name: "",
    category: "",
    description: "",
    location: "",
    client: "",
    area: "",
    year: "",
    images: [] as string[], // Changed from image to images array
  })
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null)
  const [notification, setNotification] = useState<{
    type: "success" | "error"
    message: string
    visible: boolean
  } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const logoFileInputRef = useRef<HTMLInputElement>(null)

  // Add state for client logos after the projects state
  const [clientLogos, setClientLogos] = useState<ClientLogo[]>([])
  const [newLogo, setNewLogo] = useState({
    name: "",
    url: "",
    image: "",
  })
  const [logoToEdit, setLogoToEdit] = useState<ClientLogo | null>(null)
  const [logoToDelete, setLogoToDelete] = useState<ClientLogo | null>(null)

  // Add these state variables inside the AdminPanel component after the existing state variables
  const [selectedLogo, setSelectedLogo] = useState<ClientLogo | null>(null)
  const [logoOrder, setLogoOrder] = useState<string[]>([])
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  const router = useRouter()

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
      const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false })

      if (error) throw error

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
      setNotification({
        type: "error",
        message: `There was a problem loading the projects: ${error.message}`,
        visible: true,
      })

      // Auto-hide notification after 3 seconds
      setTimeout(() => setNotification(null), 3000)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Add fetchLogos function after the fetchProjects function
  const fetchLogos = async () => {
    if (!user) return

    try {
      setIsRefreshing(true)
      const { data, error } = await supabase.from("client_logos").select("*").order("position", { ascending: true })

      if (error) throw error

      if (data) {
        setClientLogos(data)
      }
    } catch (error: any) {
      setNotification({
        type: "error",
        message: `There was a problem loading the client logos: ${error.message}`,
        visible: true,
      })

      // Auto-hide notification after 3 seconds
      setTimeout(() => setNotification(null), 3000)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Add this function inside the AdminPanel component after the fetchLogos function
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

        return arrayMove(order, oldIndex, newIndex)
      })
    }
  }

  useEffect(() => {
    if (user) {
      fetchProjects()
    }
  }, [user])

  // Add useEffect to fetch logos after the useEffect for fetching projects
  useEffect(() => {
    if (user) {
      fetchLogos()
    }
  }, [user])

  // Add this useEffect after the existing useEffect for fetching logos
  useEffect(() => {
    if (clientLogos.length > 0 && logoOrder.length === 0) {
      setLogoOrder(clientLogos.map((logo) => logo.id))
    }
  }, [clientLogos, logoOrder.length])

  // Filter projects based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProjects(projects)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = projects.filter(
        (project) =>
          project.name.toLowerCase().includes(query) ||
          project.category.toLowerCase().includes(query) ||
          (project.location && project.location.toLowerCase().includes(query)),
      )
      setFilteredProjects(filtered)
    }
  }, [searchQuery, projects])

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
        const file = files[i]

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

      setNotification({
        type: "success",
        message: `${uploadedUrls.length} image${uploadedUrls.length > 1 ? "s" : ""} uploaded successfully!`,
        visible: true,
      })

      // Auto-hide notification after 3 seconds
      setTimeout(() => setNotification(null), 3000)
    } catch (error: any) {
      setNotification({
        type: "error",
        message: `Upload failed: ${error.message}`,
        visible: true,
      })

      // Auto-hide notification after 3 seconds
      setTimeout(() => setNotification(null), 3000)
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
      const file = files[0] // Only use the first file for logos

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

      setNotification({
        type: "success",
        message: "Logo uploaded successfully!",
        visible: true,
      })

      // Auto-hide notification after 3 seconds
      setTimeout(() => setNotification(null), 3000)
    } catch (error: any) {
      setNotification({
        type: "error",
        message: `Logo upload failed: ${error.message}`,
        visible: true,
      })

      // Auto-hide notification after 3 seconds
      setTimeout(() => setNotification(null), 3000)
    } finally {
      setIsUploadingLogo(false)
      // Reset file input
      if (logoFileInputRef.current) {
        logoFileInputRef.current.value = ""
      }
    }
  }

  // Trigger logo file input click
  const triggerLogoFileInput = () => {
    logoFileInputRef.current?.click()
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
      setNotification({
        type: "error",
        message: "Please provide both name and category for the project.",
        visible: true,
      })

      // Auto-hide notification after 3 seconds
      setTimeout(() => setNotification(null), 3000)
      return
    }

    try {
      setIsSubmitting(true)

      const { data, error } = await supabase
        .from("projects")
        .insert([
          {
            name: newProject.name,
            category: newProject.category,
            description: newProject.description,
            location: newProject.location,
            client: newProject.client,
            area: newProject.area,
            year: newProject.year,
            images: newProject.images,
          },
        ])
        .select()

      if (error) throw error

      setNewProject({
        name: "",
        category: "",
        description: "",
        location: "",
        client: "",
        area: "",
        year: "",
        images: [],
      })

      setNotification({
        type: "success",
        message: `${newProject.name} has been successfully added.`,
        visible: true,
      })

      // Auto-hide notification after 3 seconds
      setTimeout(() => setNotification(null), 3000)
      fetchProjects()
    } catch (error: any) {
      setNotification({
        type: "error",
        message: `There was a problem adding the project: ${error.message}`,
        visible: true,
      })

      // Auto-hide notification after 3 seconds
      setTimeout(() => setNotification(null), 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add handleAddLogo function after the handleAddProject function
  const handleAddLogo = async () => {
    if (!newLogo.name || !newLogo.image) {
      setNotification({
        type: "error",
        message: "Please provide both name and image for the client logo.",
        visible: true,
      })

      // Auto-hide notification after 3 seconds
      setTimeout(() => setNotification(null), 3000)
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
          },
        ])
        .select()

      if (error) throw error

      setNewLogo({
        name: "",
        url: "",
        image: "",
      })

      setNotification({
        type: "success",
        message: `${newLogo.name} logo has been successfully added.`,
        visible: true,
      })

      // Auto-hide notification after 3 seconds
      setTimeout(() => setNotification(null), 3000)
      fetchLogos()
    } catch (error: any) {
      setNotification({
        type: "error",
        message: `There was a problem adding the logo: ${error.message}`,
        visible: true,
      })

      // Auto-hide notification after 3 seconds
      setTimeout(() => setNotification(null), 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Delete Project
  const handleDeleteProject = async (id: string) => {
    try {
      const { error } = await supabase.from("projects").delete().eq("id", id)

      if (error) throw error

      setNotification({
        type: "success",
        message: "The project has been successfully removed.",
        visible: true,
      })

      // Auto-hide notification after 3 seconds
      setTimeout(() => setNotification(null), 3000)
      fetchProjects()
    } catch (error: any) {
      setNotification({
        type: "error",
        message: `There was a problem deleting the project: ${error.message}`,
        visible: true,
      })

      // Auto-hide notification after 3 seconds
      setTimeout(() => setNotification(null), 3000)
    }
  }

  // Handle Edit Project
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
          client: projectToEdit.client,
          area: projectToEdit.area,
          year: projectToEdit.year,
          images: projectToEdit.images,
        })
        .eq("id", projectToEdit.id)

      if (error) throw error

      setNotification({
        type: "success",
        message: `${projectToEdit.name} has been successfully updated.`,
        visible: true,
      })

      // Auto-hide notification after 3 seconds
      setTimeout(() => setNotification(null), 3000)
      fetchProjects()
      setProjectToEdit(null)
    } catch (error: any) {
      setNotification({
        type: "error",
        message: `There was a problem updating the project: ${error.message}`,
        visible: true,
      })

      // Auto-hide notification after 3 seconds
      setTimeout(() => setNotification(null), 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add handleEditLogo function after the handleEditProject function
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

      setNotification({
        type: "success",
        message: `${logoToEdit.name} logo has been successfully updated.`,
        visible: true,
      })

      // Auto-hide notification after 3 seconds
      setTimeout(() => setNotification(null), 3000)
      fetchLogos()
      setLogoToEdit(null)
    } catch (error: any) {
      setNotification({
        type: "error",
        message: `There was a problem updating the logo: ${error.message}`,
        visible: true,
      })

      // Auto-hide notification after 3 seconds
      setTimeout(() => setNotification(null), 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add handleDeleteLogo function after the handleDeleteProject function
  const handleDeleteLogo = async (id: string) => {
    try {
      const { error } = await supabase.from("client_logos").delete().eq("id", id)

      if (error) throw error

      setNotification({
        type: "success",
        message: "The client logo has been successfully removed.",
        visible: true,
      })

      // Auto-hide notification after 3 seconds
      setTimeout(() => setNotification(null), 3000)
      fetchLogos()
    } catch (error: any) {
      setNotification({
        type: "error",
        message: `There was a problem deleting the logo: ${error.message}`,
        visible: true,
      })

      // Auto-hide notification after 3 seconds
      setTimeout(() => setNotification(null), 3000)
    }
  }

  // Add these sensor definitions inside the AdminPanel component
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

  // Loader while loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading admin panel...</span>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <Navbar />
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium shadow-lg transition-all ${
            notification.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {notification.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2 rounded-full p-1 hover:bg-black/5">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <CardTitle className="text-2xl">Project Management</CardTitle>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <span className="text-sm text-muted-foreground">Logged in as: {user?.email}</span>
            <Button variant="outline" onClick={handleLogout} size="sm">
              Log Out
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search and Add Controls */}
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={fetchProjects} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                <span className="sr-only">Refresh</span>
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Project
                  </Button>
                </DialogTrigger>
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
                          value={newProject.category}
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

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="area">Area</Label>
                        <Input
                          id="area"
                          value={newProject.area}
                          onChange={(e) => setNewProject({ ...newProject, area: e.target.value })}
                          placeholder="e.g. 80,000 Sqft"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="year">Year</Label>
                        <Input
                          id="year"
                          value={newProject.year}
                          onChange={(e) => setNewProject({ ...newProject, year: e.target.value })}
                          placeholder="e.g. 2023"
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
                          accept="image/*"
                          onChange={handleImageUpload}
                          multiple // Allow multiple file selection
                        />

                        <div
                          onClick={triggerFileInput}
                          className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                            isUploading ? "bg-muted/50 border-muted" : "hover:bg-muted/50 hover:border-primary/50"
                          }`}
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
                                  className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 hover:bg-black/90"
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
              </Dialog>
            </div>
          </div>

          {/* Projects Table */}
          <div className="border rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="border-b p-2 text-left">Project</th>
                    <th className="border-b p-2 text-left">Category</th>
                    <th className="border-b p-2 text-left">Location</th>
                    <th className="border-b p-2 text-left">Area</th>
                    <th className="border-b p-2 text-left">Year</th>
                    <th className="border-b p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="border-b p-4 text-center text-muted-foreground">
                        {searchQuery ? "No projects match your search." : "No projects added yet."}
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((project) => (
                      <tr key={project.id} className="hover:bg-muted/50">
                        <td className="border-b p-2">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 overflow-hidden rounded-md bg-muted flex items-center justify-center">
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
                        <td className="border-b p-2">
                          <span className="inline-flex items-center rounded-full bg-[#3D8361]/10 px-2 py-1 text-xs font-medium text-[#3D8361]">
                            {project.category}
                          </span>
                        </td>
                        <td className="border-b p-2">{project.location || "-"}</td>
                        <td className="border-b p-2">{project.area || "-"}</td>
                        <td className="border-b p-2">{project.year || "-"}</td>
                        <td className="border-b p-2 text-right">
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
                                    <div>
                                      <h3 className="text-sm font-medium text-muted-foreground">Area</h3>
                                      <p>{project.area || "Not specified"}</p>
                                    </div>
                                    <div>
                                      <h3 className="text-sm font-medium text-muted-foreground">Year</h3>
                                      <p>{project.year || "Not specified"}</p>
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

                            {/* Add Edit button */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setProjectToEdit({ ...project })}>
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
                                          onChange={(e) => setProjectToEdit({ ...projectToEdit, name: e.target.value })}
                                          placeholder="Enter project name"
                                        />
                                      </div>
                                      <div className="grid gap-2">
                                        <Label htmlFor="edit-category">Category*</Label>
                                        <Select
                                          value={projectToEdit.category}
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

                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="grid gap-2">
                                        <Label htmlFor="edit-area">Area</Label>
                                        <Input
                                          id="edit-area"
                                          value={projectToEdit.area || ""}
                                          onChange={(e) => setProjectToEdit({ ...projectToEdit, area: e.target.value })}
                                          placeholder="e.g. 80,000 Sqft"
                                        />
                                      </div>
                                      <div className="grid gap-2">
                                        <Label htmlFor="edit-year">Year</Label>
                                        <Input
                                          id="edit-year"
                                          value={projectToEdit.year || ""}
                                          onChange={(e) => setProjectToEdit({ ...projectToEdit, year: e.target.value })}
                                          placeholder="e.g. 2023"
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
                                          accept="image/*"
                                          onChange={handleImageUpload}
                                          multiple
                                        />

                                        <div
                                          onClick={triggerFileInput}
                                          className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                                            isUploading
                                              ? "bg-muted/50 border-muted"
                                              : "hover:bg-muted/50 hover:border-primary/50"
                                          }`}
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
                                                  className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 hover:bg-black/90"
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
                                  onClick={() => setProjectToDelete(project)}
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
                                    onClick={() => handleDeleteProject(project.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Client Logos Section */}
          <div className="mt-10 border-t pt-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between mb-4">
              <h2 className="text-xl font-semibold">Client Logos</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Client Logo
                  </Button>
                </DialogTrigger>
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
                          accept="image/*"
                          onChange={handleLogoUpload}
                        />

                        <div
                          onClick={triggerLogoFileInput}
                          className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                            isUploadingLogo ? "bg-muted/50 border-muted" : "hover:bg-muted/50 hover:border-primary/50"
                          }`}
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
                        <div className="border rounded-md p-2 flex justify-center">
                          <img
                            src={newLogo.image || "/placeholder.svg"}
                            alt="Logo preview"
                            className="h-16 object-contain"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=64&width=120"
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
              </Dialog>
            </div>

            {/* Logos Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {clientLogos.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">No client logos added yet.</div>
              ) : (
                clientLogos.map((logo) => (
                  <div key={logo.id} className="border rounded-md p-4 flex flex-col gap-2">
                    <div className="h-20 flex items-center justify-center">
                      <img
                        src={logo.image || "/placeholder.svg?height=80&width=120"}
                        alt={logo.name}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=80&width=120"
                        }}
                      />
                    </div>
                    <div className="text-center font-medium truncate" title={logo.name}>
                      {logo.name}
                    </div>
                    <div className="flex justify-center gap-2 mt-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setLogoToEdit({ ...logo })}>
                            Edit
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
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                  />

                                  <div
                                    onClick={triggerLogoFileInput}
                                    className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                                      isUploadingLogo
                                        ? "bg-muted/50 border-muted"
                                        : "hover:bg-muted/50 hover:border-primary/50"
                                    }`}
                                  >
                                    {isUploadingLogo ? (
                                      <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                                    ) : (
                                      <Upload className="h-10 w-10 text-muted-foreground" />
                                    )}
                                    <p className="text-sm font-medium">
                                      {isUploadingLogo ? "Uploading..." : "Click to upload new logo"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">SVG, PNG, JPG or GIF (max. 2MB)</p>
                                  </div>

                                  <div className="flex items-center mt-4">
                                    <div className="h-px flex-1 bg-muted"></div>
                                    <span className="px-2 text-xs text-muted-foreground">or edit image URL</span>
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
                                  <div className="border rounded-md p-2 flex justify-center">
                                    <img
                                      src={logoToEdit.image || "/placeholder.svg"}
                                      alt="Logo preview"
                                      className="h-16 object-contain"
                                      onError={(e) => {
                                        ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=64&width=120"
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
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setLogoToDelete(logo)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the {logo.name} logo. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDeleteLogo(logo.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredProjects.length} of {projects.length} projects
          </div>
        </CardContent>
        <CardTitle className="text-2xl font-bold text-center pb-4">
          <Label htmlFor="text">Powered by Yesp Web Studio</Label>
        </CardTitle>
      </Card>
    </div>
  )
}

