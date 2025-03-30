import { supabase } from "./supabaseClient"

// Type definitions
type Project = {
  id?: string
  name: string
  category: string
  description?: string
  location?: string
  client?: string
  image?: string
  images?: string[]
  created_at?: string
}

type PageName = "about" | "contact" | "gallery" | "project"

type PageHero = {
  id?: string
  page: PageName
  title?: string
  subtitle?: string
  image?: string
  video?: string
  created_at?: string
  updated_at?: string
}

type HeroSlide = {
  id?: string
  title: string
  description?: string
  image: string
  created_at?: string
}

type ClientLogo = {
  id?: string
  name: string
  url?: string
  image: string
  position?: number
  created_at?: string
}

// Get all projects
export async function getProjects(): Promise<Project[]> {
  try {
    console.log("Fetching all projects...")
    const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching projects:", error)
      throw error
    }

    console.log(`Successfully fetched ${data?.length || 0} projects`)

    // Process data to ensure images array exists
    const processedData = (data || []).map((project) => {
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

    return processedData
  } catch (error: any) {
    console.error("❌ Error fetching projects:", error.message)
    throw error
  }
}

// Get a single project by ID
export async function getProjectById(id: string): Promise<Project | null> {
  try {
    console.log(`Fetching project with ID: ${id}`)
    const { data, error } = await supabase.from("projects").select("*").eq("id", id).single()

    if (error) {
      console.error(`Error fetching project with ID ${id}:`, error)
      throw error
    }

    console.log("Project fetched successfully:", data)

    // Process data to ensure images array exists
    if (data) {
      if (data.image && !data.images) {
        return {
          ...data,
          images: [data.image],
        }
      } else if (!data.images) {
        return {
          ...data,
          images: [],
        }
      }
    }

    return data
  } catch (error: any) {
    console.error(`❌ Error fetching project with ID ${id}:`, error.message)
    throw error
  }
}

// Upload an image to Supabase Storage
export async function uploadImage(file: File, folder = "images"): Promise<string> {
  try {
    console.log(`Uploading image to folder: ${folder}`)
    const fileExt = file.name.split(".").pop()
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`

    const { error } = await supabase.storage.from("projects").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("Error uploading image:", error)
      throw error
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("projects").getPublicUrl(fileName)
    console.log(`Image uploaded successfully. Public URL: ${publicUrl}`)
    return publicUrl
  } catch (error: any) {
    console.error("❌ Error uploading image:", error.message)
    throw error
  }
}

// Add a new project (with optional image upload)
export async function addProject(project: Project, imageFile?: File): Promise<Project> {
  try {
    console.log("Adding new project:", project.name)
    let imageUrl = project.image || ""

    // If an image file is provided, upload it
    if (imageFile) {
      imageUrl = await uploadImage(imageFile)
    }

    const projectData = {
      ...project,
      image: imageUrl,
      images: project.images || (imageUrl ? [imageUrl] : []),
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("projects").insert([projectData]).select().single()

    if (error) {
      console.error("Error adding project:", error)
      throw error
    }

    console.log("Project added successfully:", data)
    return data
  } catch (error: any) {
    console.error("❌ Error adding project:", error.message)
    throw error
  }
}

// Update an existing project (with optional image update)
export async function updateProject(id: string, project: Partial<Project>, imageFile?: File): Promise<Project> {
  try {
    console.log(`Updating project with ID: ${id}`)
    const updatedData = { ...project }

    // If updating image, upload and replace
    if (imageFile) {
      const newImageUrl = await uploadImage(imageFile)
      updatedData.image = newImageUrl

      // Update images array if it exists
      if (updatedData.images) {
        updatedData.images = [...updatedData.images, newImageUrl]
      } else {
        updatedData.images = [newImageUrl]
      }
    }

    const { data, error } = await supabase.from("projects").update(updatedData).eq("id", id).select().single()

    if (error) {
      console.error(`Error updating project ${id}:`, error)
      throw error
    }

    console.log("Project updated successfully:", data)
    return data
  } catch (error: any) {
    console.error(`❌ Error updating project ${id}:`, error.message)
    throw error
  }
}

// Delete a project (with image deletion)
export async function deleteProject(id: string, imageUrl?: string): Promise<boolean> {
  try {
    console.log(`Deleting project with ID: ${id}`)
    // If the project has an image, delete it from storage first
    if (imageUrl) {
      const fileName = imageUrl.split("/projects/")[1] // Extract file path
      if (fileName) {
        console.log(`Attempting to delete image: ${fileName}`)
        const { error: deleteError } = await supabase.storage.from("projects").remove([fileName])

        if (deleteError) {
          console.warn(`⚠️ Warning: Failed to delete image ${fileName}.`, deleteError.message)
        } else {
          console.log(`Image ${fileName} deleted successfully`)
        }
      }
    }

    // Delete the project from the database
    const { error } = await supabase.from("projects").delete().eq("id", id)

    if (error) {
      console.error(`Error deleting project ${id}:`, error)
      throw error
    }

    console.log(`Project ${id} deleted successfully`)
    return true
  } catch (error: any) {
    console.error(`❌ Error deleting project ${id}:`, error.message)
    throw error
  }
}

// Hero Slides functions
export async function getHeroSlides(): Promise<HeroSlide[]> {
  try {
    console.log("Fetching hero slides...")
    const { data, error } = await supabase.from("hero_slides").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching hero slides:", error)
      throw error
    }

    console.log(`Successfully fetched ${data?.length || 0} hero slides`)
    return data || []
  } catch (error: any) {
    console.error("❌ Error fetching hero slides:", error.message)
    throw error
  }
}

export async function addHeroSlide(slide: Omit<HeroSlide, "id">, imageFile: File): Promise<HeroSlide> {
  try {
    console.log("Adding new hero slide:", slide.title)
    // Upload image first
    const imageUrl = await uploadImage(imageFile, "hero-slides")

    const { data, error } = await supabase
      .from("hero_slides")
      .insert([{ ...slide, image: imageUrl }])
      .select()
      .single()

    if (error) {
      console.error("Error adding hero slide:", error)
      throw error
    }

    console.log("Hero slide added successfully:", data)
    return data
  } catch (error: any) {
    console.error("❌ Error adding hero slide:", error.message)
    throw error
  }
}

export async function updateHeroSlide(id: string, updates: Partial<HeroSlide>, imageFile?: File): Promise<HeroSlide> {
  try {
    console.log(`Updating hero slide with ID: ${id}`)
    const updatedData = { ...updates }

    if (imageFile) {
      updatedData.image = await uploadImage(imageFile, "hero-slides")
    }

    const { data, error } = await supabase.from("hero_slides").update(updatedData).eq("id", id).select().single()

    if (error) {
      console.error(`Error updating hero slide ${id}:`, error)
      throw error
    }

    console.log("Hero slide updated successfully:", data)
    return data
  } catch (error: any) {
    console.error(`❌ Error updating hero slide ${id}:`, error.message)
    throw error
  }
}

export async function deleteHeroSlide(id: string, imageUrl?: string): Promise<boolean> {
  try {
    console.log(`Deleting hero slide with ID: ${id}`)
    if (imageUrl) {
      const fileName = imageUrl.split("/projects/")[1]
      if (fileName) {
        console.log(`Attempting to delete image: ${fileName}`)
        const { error: deleteError } = await supabase.storage.from("projects").remove([fileName])

        if (deleteError) {
          console.warn(`⚠️ Warning: Failed to delete image ${fileName}.`, deleteError.message)
        } else {
          console.log(`Image ${fileName} deleted successfully`)
        }
      }
    }

    const { error } = await supabase.from("hero_slides").delete().eq("id", id)

    if (error) {
      console.error(`Error deleting hero slide ${id}:`, error)
      throw error
    }

    console.log(`Hero slide ${id} deleted successfully`)
    return true
  } catch (error: any) {
    console.error(`❌ Error deleting hero slide ${id}:`, error.message)
    throw error
  }
}

// Page Hero functions
export async function getPageHeroes(): Promise<PageHero[]> {
  try {
    console.log("Fetching all page heroes...")
    const { data, error } = await supabase.from("page_heroes").select("*")

    if (error) {
      console.error("Error fetching page heroes:", error)
      throw error
    }

    console.log(`Successfully fetched ${data?.length || 0} page heroes`)
    return data || []
  } catch (error: any) {
    console.error("❌ Error fetching page heroes:", error.message)
    throw error
  }
}

export async function getPageHero(pageName: PageName): Promise<PageHero | null> {
  try {
    console.log(`Fetching page hero for: ${pageName}`)
    // Fixed: Don't use eq filter in the URL, use it in the query
    const { data, error } = await supabase.from("page_heroes").select("*").eq("page", pageName).maybeSingle() // Use maybeSingle instead of single to avoid errors when no rows found

    if (error) {
      console.error(`Error fetching ${pageName} hero:`, error)
      throw error
    }

    console.log(`Page hero for ${pageName} fetched:`, data)
    return data
  } catch (error: any) {
    console.error(`❌ Error fetching ${pageName} hero:`, error.message)
    throw error
  }
}

export async function upsertPageHero(
  pageName: PageName,
  heroData: Partial<PageHero>,
  imageFile?: File,
): Promise<PageHero> {
  try {
    console.log(`Upserting page hero for: ${pageName}`)
    // First check if the hero exists
    const existingHero = await getPageHero(pageName)

    const updateData: any = {
      ...heroData,
      page: pageName,
      updated_at: new Date().toISOString(),
    }

    if (!existingHero) {
      updateData.created_at = new Date().toISOString()
    }

    if (imageFile) {
      updateData.image = await uploadImage(imageFile, "page-heroes")
    }

    let result

    if (existingHero) {
      // Update existing record
      result = await supabase.from("page_heroes").update(updateData).eq("id", existingHero.id).select().single()
    } else {
      // Insert new record
      result = await supabase.from("page_heroes").insert([updateData]).select().single()
    }

    if (result.error) {
      console.error(`Error upserting ${pageName} hero:`, result.error)
      throw result.error
    }

    console.log(`Page hero for ${pageName} upserted successfully:`, result.data)
    return result.data
  } catch (error: any) {
    console.error(`❌ Error upserting ${pageName} hero:`, error.message)
    throw error
  }
}

// Client Logo functions
export async function getClientLogos(): Promise<ClientLogo[]> {
  try {
    console.log("Fetching client logos...")
    const { data, error } = await supabase.from("client_logos").select("*").order("position", { ascending: true })

    if (error) {
      console.error("Error fetching client logos:", error)
      throw error
    }

    console.log(`Successfully fetched ${data?.length || 0} client logos`)
    return data || []
  } catch (error: any) {
    console.error("❌ Error fetching client logos:", error.message)
    throw error
  }
}

export async function addClientLogo(logo: Omit<ClientLogo, "id">, imageFile?: File): Promise<ClientLogo> {
  try {
    console.log("Adding new client logo:", logo.name)
    let imageUrl = logo.image

    if (imageFile) {
      imageUrl = await uploadImage(imageFile, "client-logos")
    }

    // Get the current count of logos to set position
    const { count } = await supabase.from("client_logos").select("*", { count: "exact", head: true })

    const position = count !== null ? count : 0

    const { data, error } = await supabase
      .from("client_logos")
      .insert([{ ...logo, image: imageUrl, position }])
      .select()
      .single()

    if (error) {
      console.error("Error adding client logo:", error)
      throw error
    }

    console.log("Client logo added successfully:", data)
    return data
  } catch (error: any) {
    console.error("❌ Error adding client logo:", error.message)
    throw error
  }
}

export async function updateClientLogo(
  id: string,
  updates: Partial<ClientLogo>,
  imageFile?: File,
): Promise<ClientLogo> {
  try {
    console.log(`Updating client logo with ID: ${id}`)
    const updatedData = { ...updates }

    if (imageFile) {
      updatedData.image = await uploadImage(imageFile, "client-logos")
    }

    const { data, error } = await supabase.from("client_logos").update(updatedData).eq("id", id).select().single()

    if (error) {
      console.error(`Error updating client logo ${id}:`, error)
      throw error
    }

    console.log("Client logo updated successfully:", data)
    return data
  } catch (error: any) {
    console.error(`❌ Error updating client logo ${id}:`, error.message)
    throw error
  }
}

export async function updateLogoPositions(logoPositions: { id: string; position: number }[]): Promise<boolean> {
  try {
    console.log("Updating logo positions:", logoPositions)
    const { error } = await supabase.from("client_logos").upsert(logoPositions, { onConflict: "id" })

    if (error) {
      console.error("Error updating logo positions:", error)
      throw error
    }

    console.log("Logo positions updated successfully")
    return true
  } catch (error: any) {
    console.error("❌ Error updating logo positions:", error.message)
    throw error
  }
}

export async function deleteClientLogo(id: string, imageUrl?: string): Promise<boolean> {
  try {
    console.log(`Deleting client logo with ID: ${id}`)
    if (imageUrl) {
      const fileName = imageUrl.split("/projects/")[1]
      if (fileName) {
        console.log(`Attempting to delete image: ${fileName}`)
        const { error: deleteError } = await supabase.storage.from("projects").remove([fileName])

        if (deleteError) {
          console.warn(`⚠️ Warning: Failed to delete image ${fileName}.`, deleteError.message)
        } else {
          console.log(`Image ${fileName} deleted successfully`)
        }
      }
    }

    const { error } = await supabase.from("client_logos").delete().eq("id", id)

    if (error) {
      console.error(`Error deleting client logo ${id}:`, error)
      throw error
    }

    console.log(`Client logo ${id} deleted successfully`)
    return true
  } catch (error: any) {
    console.error(`❌ Error deleting client logo ${id}:`, error.message)
    throw error
  }
}

// Export types for use in other files
export type { Project, PageName, PageHero, HeroSlide, ClientLogo }

