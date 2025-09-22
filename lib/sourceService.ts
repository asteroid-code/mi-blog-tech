import { supabase } from "@/lib/supabaseClient";

import type { ScrapingSource } from "@/types/scraping";

export type { ScrapingSource };


export const sourceService = {
  async createSource(data: ScrapingSource): Promise<ScrapingSource | null> {
    const { data: newSource, error } = await supabase
      .from("scraping_sources")
      .insert([data as any]) // Cast to any for now, will fix the type in the next step
      .select()
      .single();

    if (error) {
      console.error("Error creating source:", error);
      throw error;
    }
    return newSource;
  },

  async getSourceById(id: string): Promise<ScrapingSource | null> {
    const { data, error } = await supabase
      .from("scraping_sources")
      .select("*")
      .eq("id", id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching source by ID:", error);
      throw error;
    }
    return data;
  },

  async updateSource(
    id: string,
    data: ScrapingSource
  ): Promise<ScrapingSource | null> {
    const { data: updatedSource, error } = await supabase
      .from("scraping_sources")
      .update(data as any) // Cast to any for now, will fix the type in the next step
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating source:", error);
      throw error;
    }
    return updatedSource;
  },

  async deleteSource(id: string): Promise<void> {
    const { error } = await supabase
      .from("scraping_sources")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting source:", error);
      throw error;
    }
  },

  async getAllSources(): Promise<ScrapingSource[]> {
    const { data, error } = await supabase
      .from("scraping_sources")
      .select("*");

    if (error) {
      console.error("Error fetching all sources:", error);
      throw error;
    }
    return data;
  },
};
