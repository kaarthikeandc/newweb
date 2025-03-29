/**
 * Utility functions for handling HEIC image format
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
   * Displays a HEIC image in an img element
   * @param file The HEIC file
   * @param imgElement The image element to display the converted image
   */
  export const displayHeicImage = async (file: File, imgElement: HTMLImageElement): Promise<void> => {
    try {
      // Import heic2any dynamically to avoid loading it unnecessarily
      const heic2any = (await import("heic2any")).default
  
      const convertedBlob = (await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.8,
      })) as Blob
  
      const url = URL.createObjectURL(convertedBlob)
      imgElement.src = url
  
      // Clean up the object URL when the image loads
      imgElement.onload = () => {
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Error displaying HEIC image:", error)
      imgElement.src = "/placeholder.svg"
    }
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
  
    try {
      // Import heic2any dynamically
      const heic2any = (await import("heic2any")).default
  
      const convertedBlob = (await heic2any({
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
  
  