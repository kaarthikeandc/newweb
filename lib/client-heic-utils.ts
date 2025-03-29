/**
 * Utility functions for handling HEIC image format
 * This file should only be imported on the client side
 */

/**
 * Checks if a file is in HEIC format
 * @param file The file to check
 * @returns boolean indicating if the file is HEIC format
 */
export const isHeicImage = (file: File): boolean => {
    return file.name.toLowerCase().endsWith(".heic") || file.type === "image/heic" || file.type === "image/heif"
  }
  
  /**
   * Converts a HEIC file to JPEG format
   * @param file The HEIC file to convert
   * @returns A Promise resolving to the converted File object
   */
  export const convertHeicToJpeg = async (file: File): Promise<File> => {
    if (!isHeicImage(file)) {
      return file // Return original file if not HEIC
    }
  
    // Make sure we're on the client side
    if (typeof window === "undefined") {
      throw new Error("HEIC conversion can only be performed in browser environment")
    }
  
    try {
      // Import heic2any dynamically
      const heic2anyModule = await import("heic2any")
  
      const convertedBlob = (await heic2anyModule.default({
        blob: file,
        toType: "image/jpeg",
        quality: 0.8,
      })) as Blob
  
      // Create a new file from the converted blob
      return new File([convertedBlob], file.name.replace(/\.heic$/i, ".jpg"), {
        type: "image/jpeg",
        lastModified: new Date().getTime(),
      })
    } catch (error) {
      console.error("Error converting HEIC to JPEG:", error)
      throw new Error(`Failed to convert HEIC image: ${error}`)
    }
  }
  
  /**
   * Creates an object URL for a HEIC image by converting it to JPEG
   * @param file The HEIC file
   * @returns Promise resolving to an object URL
   */
  export const createHeicObjectURL = async (file: File): Promise<string> => {
    if (!isHeicImage(file)) {
      return URL.createObjectURL(file) // Use regular object URL for non-HEIC files
    }
  
    try {
      const convertedFile = await convertHeicToJpeg(file)
      return URL.createObjectURL(convertedFile)
    } catch (error) {
      console.error("Error creating object URL for HEIC image:", error)
      throw error
    }
  }
  
  /**
   * Helper function to safely load the heic2any library
   * Only works on client-side
   */
  export const loadHeic2Any = async () => {
    if (typeof window === "undefined") {
      throw new Error("heic2any can only be loaded in browser environment")
    }
  
    try {
      const module = await import("heic2any")
      return module.default
    } catch (error) {
      console.error("Failed to load heic2any library:", error)
      throw error
    }
  }
  
  