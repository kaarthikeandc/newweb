"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ImageGalleryProps {
  images: string[]
  alt: string
  aspectRatio?: "square" | "video" | "auto"
  priority?: boolean
}

export default function ImageGallery({ images, alt, aspectRatio = "video", priority = false }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [imagesLoaded, setImagesLoaded] = useState<Record<number, boolean>>({})

  // Preload adjacent images for smoother navigation
  const preloadAdjacentImages = useCallback(() => {
    if (images.length <= 1) return

    const nextIndex = (currentIndex + 1) % images.length
    const prevIndex = (currentIndex - 1 + images.length) % images.length

    ;[nextIndex, prevIndex].forEach((index) => {
      const img = new Image()
      img.src = images[index]
      img.crossOrigin = "anonymous"
    })
  }, [currentIndex, images])

  useEffect(() => {
    preloadAdjacentImages()
  }, [currentIndex, preloadAdjacentImages])

  useEffect(() => {
    setIsLoading(!imagesLoaded[currentIndex])
  }, [currentIndex, imagesLoaded])

  const handleImageLoad = (index: number) => {
    setImagesLoaded((prev) => ({ ...prev, [index]: true }))
    if (index === currentIndex) {
      setIsLoading(false)
    }
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  // Handle touch swipe
  useEffect(() => {
    let touchStartX = 0
    let touchEndX = 0

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX
    }

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX
      handleSwipe()
    }

    const handleSwipe = () => {
      if (touchEndX < touchStartX - 50) {
        // Swipe left
        nextImage()
      }
      if (touchEndX > touchStartX + 50) {
        // Swipe right
        prevImage()
      }
    }

    const galleryElement = document.getElementById("image-gallery")
    if (galleryElement) {
      galleryElement.addEventListener("touchstart", handleTouchStart, false)
      galleryElement.addEventListener("touchend", handleTouchEnd, false)
    }

    return () => {
      if (galleryElement) {
        galleryElement.removeEventListener("touchstart", handleTouchStart)
        galleryElement.removeEventListener("touchend", handleTouchEnd)
      }
    }
  }, [])

  if (!images || images.length === 0) {
    return (
      <div className="w-full bg-gray-100 flex items-center justify-center rounded-lg">
        <span className="text-gray-400 text-sm p-8">No image</span>
      </div>
    )
  }

  const aspectRatioClass = {
    square: "aspect-square",
    video: "aspect-video",
    auto: "aspect-auto",
  }[aspectRatio]

  return (
    <div
      id="image-gallery"
      className={`relative ${aspectRatioClass} overflow-hidden rounded-lg bg-gray-50`}
    >
      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-100/50">
          <div className="w-8 h-8 border-4 border-t-transparent border-[#3D8361] rounded-full animate-spin"></div>
        </div>
      )}

      {/* Current image */}
      <div className="relative w-full h-full">
        {images.map((src, index) => (
          <Image
            key={`${src}-${index}`}
            src={src || "/placeholder.svg"}
            alt={`${alt} - image ${index + 1}`}
            fill
            className={`object-cover transition-opacity duration-300 ${
              currentIndex === index ? "opacity-100" : "opacity-0 absolute"
            } ${isLoading && currentIndex === index ? "opacity-0" : ""}`}
            priority={priority && index === 0}
            loading={priority && index === 0 ? "eager" : "lazy"}
            onLoadingComplete={() => handleImageLoad(index)}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PC9zdmc+"
            unoptimized={src?.startsWith("http")}
          />
        ))}
      </div>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation()
              prevImage()
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-20"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              nextImage()
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-20"
            aria-label="Next image"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-20">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation()
                setCurrentIndex(index)
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? "bg-white scale-125" : "bg-white/50 hover:bg-white/80"
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
