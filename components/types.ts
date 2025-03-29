// types.ts
export type Project = {
    id: string
    name: string
    category: string
    description?: string
    location?: string
    client?: string
    images?: string[]
    created_at?: string
  }
  
  export type ClientLogo = {
    id: string
    name: string
    url: string
    image: string
    created_at?: string
    position?: number
  }
  
  export type HeroSlide = {
    id: string
    title: string
    description?: string
    image: string
    created_at?: string
  }
  
  export type PageHero = {
    id: string
    page: string
    title?: string
    subtitle?: string
    image?: string
    video?: string
    created_at?: string
  }
  
  export type Notification = {
    type: "success" | "error" | "info"
    message: string
    visible: boolean
  }
  
  export type SortableLogoItemProps = {
    logo: ClientLogo
    isSelected: boolean
    onSelect: () => void
    onEdit: () => void
    onDelete: () => void
  }