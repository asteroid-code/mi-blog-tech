"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

interface ScrapingSource {
  id: string;
  name: string;
  url: string;
  selector?: string;
  is_active: boolean;
  quality_score: number;
  content_type: "news" | "tutorial" | "opinion" | "image";
  trust_level: "verified" | "experimental" | "banned";
  last_success_rate: number;
}

async function getSources(): Promise<ScrapingSource[]> {
  const { data, error } = await supabase.from("scraping_sources").select("*");
  if (error) {
    console.error("Error fetching sources:", error);
    return [];
  }
  return data;
}

export default function SourcesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [sources, setSources] = useState<ScrapingSource[]>([]);

  useEffect(() => {
    const fetchSources = async () => {
      const fetchedSources = await getSources();
      setSources(fetchedSources);
    };
    fetchSources();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this source?")) {
      return;
    }

    const { error } = await supabase
      .from("scraping_sources")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting source:", error);
      toast({
        title: "Error",
        description: `Failed to delete source: ${error.message}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Source deleted successfully.",
      });
      router.refresh(); // Refresh the page to show updated list
      setSources(sources.filter((source) => source.id !== id));
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Scraping Sources</h1>
        <Button asChild>
          <Link href="/sources/new">Add New Source</Link>
        </Button>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Quality Score</TableHead>
              <TableHead>Content Type</TableHead>
              <TableHead>Trust Level</TableHead>
              <TableHead>Success Rate</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.map((source) => (
              <TableRow key={source.id}>
                <TableCell>{source.name}</TableCell>
                <TableCell>
                  <a href={source.url} target="_blank" rel="noopener noreferrer">
                    {source.url}
                  </a>
                </TableCell>
                <TableCell>{source.quality_score}</TableCell>
                <TableCell>{source.content_type}</TableCell>
                <TableCell>{source.trust_level}</TableCell>
                <TableCell>{source.last_success_rate}%</TableCell>
                <TableCell className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/sources/${source.id}/edit`}>Edit</Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(source.id!)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
