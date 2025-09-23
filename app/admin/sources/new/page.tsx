"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import SourceForm from "@/components/source-form";
import { sourceService } from "@/lib/sourceService";
import { ScrapingSource } from "@/types/scraping";
import { useToast } from "@/components/ui/use-toast";
import { useSupabase } from "@/app/components/supabase-provider";

export default function NewSourcePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { supabase } = useSupabase();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login'); // Redirect to login if not authenticated
      }
    };
    checkSession();
  }, [router, supabase]);

  const handleSubmit = async (data: ScrapingSource) => {
    try {
      await sourceService.createSource(data);
      toast({
        title: "Success",
        description: "Scraping source created successfully.",
      });
      router.push("/admin/sources");
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to create source: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Add New Scraping Source</h1>
      <SourceForm onSubmit={handleSubmit} />
    </div>
  );
}
