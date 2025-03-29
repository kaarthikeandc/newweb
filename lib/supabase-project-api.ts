import { supabase } from "./supabaseClient";

// Project type definition
type Project = {
  id?: string;
  name: string;
  category: string;
  description?: string;
  location?: string;
  client?: string;
  area?: string;
  year?: string;
  image?: string;
  created_at?: string;
};

// Get all projects
export async function getProjects(): Promise<Project[]> {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error("❌ Error fetching projects:", error.message);
    throw error;
  }
}

// Get a single project by ID
export async function getProjectById(id: string): Promise<Project | null> {
  try {
    const { data, error } = await supabase.from("projects").select("*").eq("id", id).single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error(`❌ Error fetching project with ID ${id}:`, error.message);
    throw error;
  }
}

// Upload an image to Supabase Storage (Bucket: "projects")
export async function uploadImage(file: File): Promise<string> {
  try {
    const filePath = `images/${Date.now()}-${file.name}`; // Store in "images/" subfolder

    // Upload the file to the "projects" bucket
    const { data, error } = await supabase.storage.from("projects").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false, // Prevent overwriting
    });

    if (error) throw error;

    // Get the public URL of the uploaded image
    const { data: publicUrlData } = supabase.storage.from("projects").getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (error: any) {
    console.error("❌ Error uploading image:", error.message);
    throw error;
  }
}

// Add a new project (with optional image upload)
export async function addProject(project: Project, imageFile?: File): Promise<Project> {
  try {
    let imageUrl = project.image || "";

    // If an image file is provided, upload it
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
    }

    const { data, error } = await supabase
      .from("projects")
      .insert([{ ...project, image: imageUrl, created_at: new Date().toISOString() }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error("❌ Error adding project:", error.message);
    throw error;
  }
}

// Update an existing project (with optional image update)
export async function updateProject(id: string, project: Partial<Project>, imageFile?: File): Promise<Project> {
  try {
    let updatedData = { ...project };

    // If updating image, upload and replace
    if (imageFile) {
      updatedData.image = await uploadImage(imageFile);
    }

    const { data, error } = await supabase.from("projects").update(updatedData).eq("id", id).select().single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error(`❌ Error updating project ${id}:`, error.message);
    throw error;
  }
}

// Delete a project (with image deletion)
export async function deleteProject(id: string, imageUrl?: string): Promise<boolean> {
  try {
    // If the project has an image, delete it from storage first
    if (imageUrl) {
      const fileName = imageUrl.split("/projects/images/")[1]; // Extract file name
      if (fileName) {
        const { error: deleteError } = await supabase.storage.from("projects").remove([`images/${fileName}`]);

        if (deleteError) {
          console.warn(`⚠️ Warning: Failed to delete image ${fileName}.`, deleteError.message);
        }
      }
    }

    // Delete the project from the database
    const { error } = await supabase.from("projects").delete().eq("id", id);

    if (error) throw error;
    return true;
  } catch (error: any) {
    console.error(`❌ Error deleting project ${id}:`, error.message);
    throw error;
  }
}
