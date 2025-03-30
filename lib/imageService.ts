import { supabase } from "./supabaseClient"

/**
 * Upload an image to Supabase Storage
 * @param file The image file to upload
 * @param bucket The Supabase Storage bucket name
 * @returns The public URL of the uploaded image
 */
export async function uploadImage(file: File, bucket: string): Promise<string> {
  const filePath = `images/${Date.now()}_${file.name}` // Unique file name
  const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: "3600",
    upsert: true,
  })

  if (error) {
    console.error("❌ Error uploading image:", error.message)
    throw error
  }

  // Get the public URL of the uploaded file
  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath)
  return publicUrlData.publicUrl
}
