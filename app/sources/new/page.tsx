"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import SourceForm from "@/components/source-form";
import { ScrapingSource, sourceService } from "@/lib/sourceService";
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
        description: "Source created successfully.",
      });
      router.push("/admin/sources"); // Redirect to the sources list
    } catch (error: any) {
      console.error("Error creating source:", error);
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
