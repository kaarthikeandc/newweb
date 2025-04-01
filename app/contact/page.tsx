"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Phone, MapPin, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"


export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    projectType: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [heroImage, setHeroImage] = useState<string>("/image2.jpg")

  useEffect(() => {
    const fetchHeroImage = async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "contact_hero_image")
          .single()

        if (data && !error) {
          setHeroImage(data.value)
        } else {
          // If no image found, set to empty string
          setHeroImage("")
        }
      } catch (error) {
        console.error("Error fetching hero image:", error)
        // If error occurs, set to empty string
        setHeroImage("")
      }
    }

    fetchHeroImage()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormState((prev) => ({ ...prev, [name]: value }))

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSelectChange = (value: string) => {
    setFormState((prev) => ({ ...prev, projectType: value }))

    // Clear error when user selects
    if (errors.projectType) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.projectType
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formState.name.trim()) newErrors.name = "Name is required"
    if (!formState.email.trim()) newErrors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(formState.email)) newErrors.email = "Email is invalid"
    if (!formState.subject.trim()) newErrors.subject = "Subject is required"
    if (!formState.message.trim()) newErrors.message = "Message is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)
      setFormState({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
        projectType: "",
      })

      // Reset submission status after 5 seconds
      setTimeout(() => {
        setIsSubmitted(false)
      }, 5000)
    }, 1500)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 lg:pt-32 relative">
        <div className="absolute inset-0 bg-black/50 z-10"></div>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: heroImage ? `url('${heroImage}')` : "none" }}
        ></div>
        <div className="container mx-auto px-4 py-20 relative z-20 text-white">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Contact Us</h1>
            <p className="text-lg md:text-xl mb-8 text-gray-100 max-w-2xl">
              Get in touch with our team to discuss your construction needs and how we can help bring your vision to
              life.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-gray-900">Get In Touch</h2>
              <p className="text-lg text-gray-600 mb-8">
                Fill out the form below and our team will get back to you as soon as possible. We look forward to
                hearing from you.
              </p>

              {isSubmitted ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-green-800 mb-2">Message Sent Successfully!</h3>
                  <p className="text-green-700 mb-4">
                    Thank you for contacting us. We'll get back to you as soon as possible.
                  </p>
                  <Button
                    variant="outline"
                    className="border-green-600 text-green-700 hover:bg-green-50"
                    onClick={() => setIsSubmitted(false)}
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium text-gray-700">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="John Doe"
                        value={formState.name}
                        onChange={handleChange}
                        className={errors.name ? "border-red-500" : ""}
                      />
                      {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formState.email}
                        onChange={handleChange}
                        className={errors.email ? "border-red-500" : ""}
                      />
                      {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <Input
                        id="phone"
                        name="phone"
                        placeholder="+91 98765 43210"
                        value={formState.phone}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="projectType" className="text-sm font-medium text-gray-700">
                        Project Type
                      </label>
                      <Select value={formState.projectType} onValueChange={handleSelectChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="infrastructure">Infrastructure</SelectItem>
                          <SelectItem value="industrial">Industrial</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                          <SelectItem value="residential">Residential</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium text-gray-700">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      placeholder="Project Inquiry"
                      value={formState.subject}
                      onChange={handleChange}
                      className={errors.subject ? "border-red-500" : ""}
                    />
                    {errors.subject && <p className="text-red-500 text-sm">{errors.subject}</p>}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium text-gray-700">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Tell us about your project..."
                      rows={6}
                      value={formState.message}
                      onChange={handleChange}
                      className={errors.message ? "border-red-500" : ""}
                    />
                    {errors.message && <p className="text-red-500 text-sm">{errors.message}</p>}
                  </div>

                  <Button type="submit" className="w-full bg-[#2A5D3C] hover:bg-[#3D8361]" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              )}
            </div>

            <div>
              <h2 className="text-3xl font-bold mb-6 text-gray-900">Contact Information</h2>
              <p className="text-lg text-gray-600 mb-8">
                Feel free to reach out to us through any of the following channels. We're here to answer your questions.
              </p>

              <div className="space-y-6 mb-10">
                <div className="flex items-start space-x-4">
                  <div className="bg-[#3D8361]/10 rounded-full p-3 mt-1">
                    <Phone className="h-6 w-6 text-[#3D8361]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Phone</h3>
                    <p className="text-gray-600 mb-1">Kaarthik Natarajan</p>
                    <a href="tel:+919952362061" className="text-[#3D8361] hover:underline">
                      +91 99523 62061
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-[#3D8361]/10 rounded-full p-3 mt-1">
                    <Mail className="h-6 w-6 text-[#3D8361]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Email</h3>
                    <p className="text-gray-600 mb-1">For inquiries and quotes</p>
                    <a href="mailto:contact@kengineeringandconstruction.com" className="text-[#3D8361] hover:underline">
                      contact@kengineeringandconstruction.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-[#3D8361]/10 rounded-full p-3 mt-1">
                    <MapPin className="h-6 w-6 text-[#3D8361]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Office Location</h3>
                    <p className="text-gray-600">Coimbatore And Erode</p>
                  </div>
                </div>

               
              </div>

              
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
    

      <Footer />
    </div>
  )
}

