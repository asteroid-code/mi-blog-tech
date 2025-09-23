"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SourceForm from "@/components/source-form";
import { sourceService } from "@/lib/sourceService";
import { ScrapingSource } from "@/types/scraping";
import { useToast } from "@/components/ui/use-toast";
import { useSupabase } from "@/app/components/supabase-provider";

interface EditSourcePageProps {
  params: {
    id: string;
  };
}

export default function EditSourcePage({ params }: EditSourcePageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [initialData, setInitialData] = useState<ScrapingSource | null>(null);
  const [loading, setLoading] = useState(true);
  const { supabase } = useSupabase();

  useEffect(() => {
    const fetchSessionAndSource = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login'); // Redirect to login if not authenticated
        return;
      }

      try {
        const source = await sourceService.getSourceById(params.id);
        if (source) {
          setInitialData(source);
        } else {
          toast({
            title: "Error",
            description: "Source not found.",
            variant: "destructive",
          });
          router.push("/admin/sources");
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: `Failed to fetch source: ${error.message}`,
          variant: "destructive",
        });
        router.push("/admin/sources");
      } finally {
        setLoading(false);
      }
    };
    fetchSessionAndSource();
  }, [params.id, router, toast, supabase]);

  const handleSubmit = async (data: ScrapingSource, id?: string) => {
    if (!id) {
      toast({
        title: "Error",
        description: "Source ID is missing for update.",
        variant: "destructive",
      });
      return;
    }
    try {
      await sourceService.updateSource(id, data);
      toast({
        title: "Success",
        description: "Scraping source updated successfully.",
      });
      router.push("/admin/sources");
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update source: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 text-center">Loading...</div>
    );
  }

  if (!initialData) {
    return null; // Or a loading spinner, or an error message
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Edit Scraping Source</h1>
      <SourceForm sourceId={params.id} initialData={initialData} onSubmit={handleSubmit} />
    </div>
  );
}
