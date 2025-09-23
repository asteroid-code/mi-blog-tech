"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import SourceForm from "@/components/source-form";
import { ScrapingSource, sourceService } from "@/lib/sourceService";
import { useSupabase } from "@/app/components/supabase-provider";

interface EditSourcePageProps {
  params: {
    id: string;
  };
}

export default function EditSourcePage({ params }: EditSourcePageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { id } = params;
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
        const source = await sourceService.getSourceById(id);
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
        console.error("Error fetching source:", error);
        toast({
          title: "Error",
          description: `Failed to load source data: ${error.message}`,
          variant: "destructive",
        });
        router.push("/admin/sources");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSessionAndSource();
    }
  }, [id, router, toast, supabase]);

  const handleSubmit = async (data: ScrapingSource, sourceId?: string) => {
    if (!sourceId) {
      toast({
        title: "Error",
        description: "Source ID is missing for update.",
        variant: "destructive",
      });
      return;
    }
    try {
      await sourceService.updateSource(sourceId, data);
      toast({
        title: "Success",
        description: "Source updated successfully.",
      });
      router.push("/admin/sources"); // Redirect to the sources list
    } catch (error: any) {
      console.error("Error updating source:", error);
      toast({
        title: "Error",
        description: `Failed to update source: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h1 className="text-3xl font-bold mb-6">Loading Source...</h1>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h1 className="text-3xl font-bold mb-6">Source Not Found</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Edit Scraping Source</h1>
      <SourceForm onSubmit={handleSubmit} initialData={initialData} sourceId={id} />
    </div>
  );
}
