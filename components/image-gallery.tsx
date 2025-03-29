"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageGalleryProps {
  images: string[]
  alt: string
}

export default function ImageGallery({ images, alt }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (!images || images.length === 0) {
    return (
      <div className="relative aspect-video w-full rounded-lg overflow-hidden">
        <Image src="/placeholder.svg?height=600&width=1200" alt={alt} fill className="object-cover" priority />
      </div>
    )
  }

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1))
  }

  const openModal = (index: number) => {
    setCurrentIndex(index)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Project Gallery</h3>

      {/* Main Image */}
      <div
        className="relative aspect-video w-full rounded-lg overflow-hidden cursor-pointer"
        onClick={() => openModal(currentIndex)}
      >
        <Image
          src={images[currentIndex] || "/placeholder.svg"}
          alt={`${alt} - Image ${currentIndex + 1}`}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mt-4">
          {images.map((image, index) => (
            <div
              key={index}
              className={`relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 transition-colors ${
                index === currentIndex ? "border-[#3D8361]" : "border-transparent hover:border-[#3D8361]/50"
              }`}
              onClick={() => setCurrentIndex(index)}
            >
              <Image
                src={image || "/placeholder.svg"}
                alt={`${alt} - Thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col justify-center items-center">
          <div className="absolute top-4 right-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={() => setIsModalOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div className="relative w-full h-full max-w-6xl max-h-[80vh] mx-auto p-4 flex items-center justify-center">
            <Image
              src={images[currentIndex] || "/placeholder.svg"}
              alt={`${alt} - Image ${currentIndex + 1}`}
              fill
              className="object-contain"
              priority
            />

            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 text-white hover:bg-white/10 rounded-full"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 text-white hover:bg-white/10 rounded-full"
              onClick={handleNext}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </div>

          {/* Thumbnails in modal */}
          <div className="flex overflow-x-auto gap-2 p-4 max-w-full">
            {images.map((image, index) => (
              <div
                key={index}
                className={`relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden cursor-pointer border-2 transition-colors ${
                  index === currentIndex ? "border-white" : "border-transparent hover:border-white/50"
                }`}
                onClick={() => setCurrentIndex(index)}
              >
                <Image
                  src={image || "/placeholder.svg"}
                  alt={`${alt} - Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

