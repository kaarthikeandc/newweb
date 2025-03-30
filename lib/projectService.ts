import { supabase } from "./supabaseClient"
import { uploadImage } from "./imageService"

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

// Fetch a single PageHero by PageName
export async function getPageHero(pageName: PageName): Promise<PageHero | null> {
  try {
    console.log(`Fetching page hero for: ${pageName}`)

    const { data, error } = await supabase
      .from("page_heroes")
      .select("*")
      .eq("page", pageName) // Fixed the filter to use `eq` instead of `contains`
      .maybeSingle()

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

// Upsert PageHero (Insert or Update)
export async function upsertPageHero(
  pageName: PageName,
  heroData: Partial<PageHero>,
  imageFile?: File
): Promise<PageHero> {
  try {
    console.log(`Upserting page hero for: ${pageName}`)
    const existingHero = await getPageHero(pageName)

    const updateData: Partial<PageHero> = {
      ...heroData,
      page: pageName, // Store as a string instead of an array
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
      result = await supabase.from("page_heroes").update(updateData).eq("id", existingHero.id).select().single()
    } else {
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
