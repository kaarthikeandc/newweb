// types.ts

/**
 * Project type representing construction/design projects
 */
export type Project = {
    id: string;
    name: string;
    category: ProjectCategory;
    description?: string;
    location?: string;
    client?: string;
    images?: string[];
    created_at?: string;
    updated_at?: string;
  };
  
  export type ProjectCategory = 
    | 'Commercial' 
    | 'Infrastructure' 
    | 'Residential' 
    | 'Industrial' 
    | 'Institutional';
  
  /**
   * Client logo with positioning for display order
   */
  export type ClientLogo = {
    id: string;
    name: string;
    url: string;
    image: string;
    created_at?: string;
    position?: number; // For drag-and-drop ordering
    updated_at?: string;
  };
  
  /**
   * Hero slide for homepage carousel
   */
  export type HeroSlide = {
    id: string;
    title: string;
    description?: string;
    image: string;
    created_at?: string;
    updated_at?: string;
    is_active?: boolean; // Optional flag for active/inactive slides
  };
  
  /**
   * Page name type for type-safe page references
   */
  export type PageName = 'about' | 'contact' | 'gallery' | 'projects';
  
  /**
   * Hero section for specific pages
   */
  export type PageHero = {
    id: string;
    page: PageName; // Now restricted to specific page names
    title?: string;
    subtitle?: string;
    image?: string;
    video?: string;
    created_at?: string;
    updated_at?: string;
  };
  
  /**
   * Notification system type
   */
  export type Notification = {
    type: 'success' | 'error' | 'info';
    message: string;
    visible: boolean;
    id?: string; // For tracking multiple notifications
    timeout?: number; // Custom display duration
  };
  
  /**
   * Props for sortable logo items in the DnD list
   */
  export type SortableLogoItemProps = {
    logo: ClientLogo;
    isSelected: boolean;
    onSelect: () => void;
    onEdit: () => void;
    onDelete: () => void;
    disabled?: boolean; // For disabled state
  };
  
  /**
   * Image upload response type
   */
  export type ImageUploadResponse = {
    url: string;
    path: string;
    error?: Error;
  };
  
  /**
   * API error response type
   */
  export type ApiError = {
    message: string;
    code?: number;
    details?: any;
  };