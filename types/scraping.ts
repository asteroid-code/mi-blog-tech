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
