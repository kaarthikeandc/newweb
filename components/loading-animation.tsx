"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import logo from "@/public/logo.png"; 
import Image from "next/image";

export default function LoadingAnimation() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-white"
        >
          <div className="relative flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-4"
            >
             <Image src={logo} alt="K Engineering Logo" width={80} height={80} />

            </motion.div>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 200 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="h-1 bg-[#3D8361] rounded-full"
            />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 text-[#2A5D3C] font-medium"
            >
              K Engineering & Construction
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

