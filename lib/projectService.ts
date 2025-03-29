import { supabase } from "./supabaseClient"

// Project type definition
export type Project = {
  id?: string
  name: string
  category: string
  description?: string
  location?: string
  client?: string

  image?: string
  created_at?: string
}

// Client Logo type definition
export type ClientLogo = {
  id: string
  name: string
  url: string
  image: string
  created_at?: string
  position?: number
}

// Get all projects
export async function getProjects() {
  const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false })

  if (error) throw error

  return data.map((project) => ({
    ...project,
    image: project.image && project.image !== "" ? project.image : "/placeholder.svg",
  }))
}

// Get a single project by ID
export async function getProjectById(id: string): Promise<Project | null> {
  try {
    const { data, error } = await supabase.from("projects").select("*").eq("id", id).single()

    if (error) throw error
    return data
  } catch (error: any) {
    console.error(`❌ Error fetching project with ID ${id}:`, error.message)
    throw error
  }
}

// Upload an image to Supabase Storage (Bucket: "projects")
export async function uploadImage(file: File): Promise<string> {
  try {
    const filePath = `images/${Date.now()}-${file.name}` // Store in "images/" subfolder

    // Upload the file to the "projects" bucket
    const { data, error } = await supabase.storage.from("projects").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false, // Prevent overwriting
    })

    if (error) throw error

    // Get the public URL of the uploaded image
    const { data: publicUrlData } = supabase.storage.from("projects").getPublicUrl(filePath)

    return publicUrlData.publicUrl
  } catch (error: any) {
    console.error("❌ Error uploading image:", error.message)
    throw error
  }
}

// Add a new project (with optional image upload)
export async function addProject(project: Project, imageFile?: File): Promise<Project> {
  try {
    let imageUrl = project.image || ""

    // If an image file is provided, upload it
    if (imageFile) {
      imageUrl = await uploadImage(imageFile)
    }

    const { data, error } = await supabase
      .from("projects")
      .insert([{ ...project, image: imageUrl, created_at: new Date().toISOString() }])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error: any) {
    console.error("❌ Error adding project:", error.message)
    throw error
  }
}

// Update an existing project (with optional image update)
export async function updateProject(id: string, project: Partial<Project>, imageFile?: File): Promise<Project> {
  try {
    const updatedData = { ...project }

    // If updating image, upload and replace
    if (imageFile) {
      updatedData.image = await uploadImage(imageFile)
    }

    const { data, error } = await supabase.from("projects").update(updatedData).eq("id", id).select().single()

    if (error) throw error
    return data
  } catch (error: any) {
    console.error(`❌ Error updating project ${id}:`, error.message)
    throw error
  }
}

// Delete a project (with image deletion)
export async function deleteProject(id: string, imageUrl?: string): Promise<boolean> {
  try {
    // If the project has an image, delete it from storage first
    if (imageUrl) {
      const fileName = imageUrl.split("/projects/images/")[1] // Extract file name
      if (fileName) {
        const { error: deleteError } = await supabase.storage.from("projects").remove([`images/${fileName}`])

        if (deleteError) {
          console.warn(`⚠️ Warning: Failed to delete image ${fileName}.`, deleteError.message)
        }
      }
    }

    // Delete the project from the database
    const { error } = await supabase.from("projects").delete().eq("id", id)

    if (error) throw error
    return true
  } catch (error: any) {
    console.error(`❌ Error deleting project ${id}:`, error.message)
    throw error
  }
}

/** ===================== 🔥 CLIENT LOGOS MANAGEMENT 🔥 ===================== **/

// Get all client logos
export async function getClientLogos(): Promise<ClientLogo[]> {
  try {
    const { data, error } = await supabase
      .from("client_logos")
      .select("*")
      .order("position", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error("❌ Error fetching client logos:", error.message);
    throw error;
  }
}

// Upload client logo to Supabase Storage
export async function uploadClientLogo(file: File): Promise<string> {
  try {
    const filePath = `logos/${Date.now()}-${file.name}`;

    // Upload file to Supabase Storage (Bucket: projects)
    const { data, error } = await supabase.storage.from("projects").upload(filePath, file);

    if (error) throw error;

    // Get public URL
    const { data: publicUrlData } = supabase.storage.from("projects").getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (error: any) {
    console.error("❌ Error uploading client logo:", error.message);
    throw error;
  }
}

// Add a new client logo
export async function addClientLogo(name: string, logoFile: File, position: number): Promise<ClientLogo> {
  try {
    const logoUrl = await uploadClientLogo(logoFile);

    const { data, error } = await supabase
      .from("client_logos")
      .insert([{ name, image: logoUrl, position }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error("❌ Error adding client logo:", error.message);
    throw error;
  }
}

// Delete a client logo
export async function deleteClientLogo(id: string, imageUrl?: string): Promise<boolean> {
  try {
    // Delete logo from storage if it exists
    if (imageUrl) {
      const fileName = imageUrl.split("/projects/logos/")[1];
      if (fileName) {
        const { error: deleteError } = await supabase.storage.from("projects").remove([`logos/${fileName}`]);

        if (deleteError) {
          console.warn(`⚠️ Warning: Failed to delete logo ${fileName}.`, deleteError.message);
        }
      }
    }

    // Delete logo from database
    const { error } = await supabase.from("client_logos").delete().eq("id", id);

    if (error) throw error;
    return true;
  } catch (error: any) {
    console.error(`❌ Error deleting client logo ${id}:`, error.message);
    throw error;
  }
}
