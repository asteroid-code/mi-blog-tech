"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client"; // Client-side Supabase client
import { useToast } from "@/components/ui/use-toast"; // Assuming a toast component for feedback

import { Category } from "@/lib/contentService"; // Import Category interface

// Define interfaces for sidebar data
interface Stat {
  label: string;
  value: string;
  change: string;
}

interface TrendingTopic {
  topic: string;
  count: string;
  trend: string;
  slug: string;
}

// Define the props for the Sidebar component
interface SidebarProps {
  categories: Category[] | null;
  stats: Stat[];
  trendingTopics: TrendingTopic[];
}

export function Sidebar({ categories, stats, trendingTopics }: SidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category');
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast(); // Initialize toast

  const supabase = createClient();

  const handleCategoryClick = (slug: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (currentCategory === slug) {
      current.delete('category'); // Deselect category if already selected
    } else {
      current.set('category', slug);
    }
    current.delete('page'); // Reset page to 1 when category changes
    router.push(`/?${current.toString()}`);
  };

  const handleSubmitNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!email || !email.includes('@')) {
      toast({
        title: "Error de suscripción",
        description: "Por favor, introduce un email válido.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.from("newsletter_subscriptions").insert({ email });

      if (error) {
        console.error("Error subscribing to newsletter:", error);
        toast({
          title: "Error de suscripción",
          description: "Hubo un problema al suscribirte. Inténtalo de nuevo.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "¡Suscripción exitosa!",
          description: "Gracias por suscribirte a nuestro newsletter.",
        });
        setEmail(""); // Clear email input
      }
    } catch (err) {
      console.error("Unexpected error subscribing:", err);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error inesperado. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Trending Topics */}
      <div className="bg-card rounded-xl p-6 border border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-primary text-lg">📈</span>
          <h3 className="text-lg font-bold text-foreground">Tendencias</h3>
        </div>
        <div className="space-y-3">
          {trendingTopics.map((item, index) => (
            <Link href={`/articles/${item.slug}`} key={index} className="flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-primary w-6">#{index + 1}</span>
                <div>
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {item.topic}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.count}</p>
                </div>
              </div>
              <span className="text-xs text-green-400 font-medium">{item.trend}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-card rounded-xl p-6 border border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-primary text-lg">👥</span>
          <h3 className="text-lg font-bold text-foreground">Estadísticas</h3>
        </div>
        <div className="space-y-4">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
              </div>
              <span className="text-sm text-green-400 font-medium">{stat.change}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter */}
      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl p-6 border border-primary/20">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-primary text-lg">📧</span>
          <h3 className="text-lg font-bold text-foreground">Newsletter</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Recibe las últimas noticias de IA y tecnología directamente en tu inbox.
        </p>
        <form onSubmit={handleSubmitNewsletter} className="space-y-3">
          <Input
            type="email"
            placeholder="tu@email.com"
            className="bg-background/50 border-border focus:border-primary"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
          />
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all duration-300"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Suscribiendo..." : "Suscribirse"}
            <span className="ml-2">→</span>
          </Button>
        </form>
      </div>

      {/* Categories */}
      <div className="bg-card rounded-xl p-6 border border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-primary text-lg">#</span>
          <h3 className="text-lg font-bold text-foreground">Categorías</h3>
        </div>
        <div className="space-y-2">
          {categories?.map((category) => (
            <button
              onClick={() => handleCategoryClick(category.slug)}
              key={category.id}
              className={`flex items-center justify-between group cursor-pointer py-1 w-full text-left ${
                currentCategory === category.slug ? 'text-primary font-bold' : 'text-foreground hover:text-primary'
              } transition-colors`}
            >
              <span className="text-sm font-medium">
                {category.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Analytics Dashboard Link */}
      <div className="bg-card rounded-xl p-6 border border-border/50">
        <Link href="/app/analytics/dashboard" className="flex items-center gap-2 group cursor-pointer py-1">
          <span className="text-primary text-lg">📊</span>
          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
            Analytics Dashboard
          </h3>
        </Link>
      </div>
    </div>
  )
}
