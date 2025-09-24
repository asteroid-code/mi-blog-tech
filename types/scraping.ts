export interface ScrapedContent {
  url: string;
  title: string;
  content: string;
  author?: string;
  publishedDate?: string;
  image?: string;
  tags?: string[];
  sourceId?: string;
}

export interface ScrapingSource {
  id?: string; // Make id optional
  name: string;
  url: string;
  selector: string;
  is_active: boolean;
  quality_score: number;
  content_type: "news" | "tutorial" | "opinion" | "image";
  trust_level: "verified" | "experimental" | "banned";
  last_success_rate: number;
}

export interface ScrapedContent2025 {
  id?: string;
  source_id: string;
  title: string;
  content: string;
  summary?: string;
  url: string;
  author?: string;
  published_at: Date;
  language: string;
  content_type: 'article' | 'video' | 'tutorial' | 'paper' | 'image';
  ai_trends?: string[];
  metadata: {
    view_count?: number;
    likes?: number;
    tags?: string[];
    duration?: number; // para videos
    image_url?: string; // para imágenes
    code_examples?: string[]; // para tutoriales
  };
}

export interface AITrend2025 {
  topic: string;
  relevance: number; // 1-100
  momentum: 'rising' | 'stable' | 'declining';
  related_technologies: string[];
}
