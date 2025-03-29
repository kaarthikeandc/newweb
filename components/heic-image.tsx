"use client"

import { useState, useEffect } from "react"
import { isHeicImage, createHeicObjectURL } from "@/lib/client-heic-utils"

interface HeicImageProps {
  src: string | File
  alt: string
  width?: number
  height?: number
  className?: string
  onError?: () => void
}

/**
 * A component that handles both regular images and HEIC images
 * Only use this component on the client side
 */
export default function HeicImage({ src, alt, width, height, className, onError }: HeicImageProps) {
  const [imageSrc, setImageSrc] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<boolean>(false)

  useEffect(() => {
    let objectUrl = ""

    const loadImage = async () => {
      try {
        setLoading(true)

        if (typeof src === "string") {
          // If src is a URL string, use it directly
          setImageSrc(src)
        } else if (src instanceof File) {
          // If src is a File object, check if it's HEIC
          if (isHeicImage(src)) {
            objectUrl = await createHeicObjectURL(src)
          } else {
            objectUrl = URL.createObjectURL(src)
          }
          setImageSrc(objectUrl)
        }
      } catch (err) {
        console.error("Error loading image:", err)
        setError(true)
        if (onError) onError()
      } finally {
        setLoading(false)
      }
    }

    loadImage()

    // Clean up object URL when component unmounts
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [src, onError])

  if (loading) {
    return <div className={`animate-pulse bg-muted ${className}`} style={{ width, height }} />
  }

  if (error || !imageSrc) {
    return (
      <div className={`flex items-center justify-center bg-muted/30 ${className}`} style={{ width, height }}>
        <span className="text-muted-foreground text-sm">Image not available</span>
      </div>
    )
  }

  return (
    <img
      src={imageSrc || "/placeholder.svg"}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => {
        setError(true)
        if (onError) onError()
      }}
    />
  )
}

