"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";

interface SourceFormProps {
  sourceId?: string;
}

interface ScrapingSource {
  id?: string;
  name: string;
  url: string;
  selector?: string;
  is_active: boolean;
  quality_score: number;
  content_type: "news" | "tutorial" | "opinion" | "image";
  trust_level: "verified" | "experimental" | "banned";
  last_success_rate: number;
}

export default function SourceForm({ sourceId }: SourceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [source, setSource] = useState<ScrapingSource>({
    name: "",
    url: "",
    selector: "",
    is_active: true,
    quality_score: 5,
    content_type: "news",
    trust_level: "experimental",
    last_success_rate: 100,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sourceId) {
      const fetchSource = async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from("scraping_sources")
          .select("*")
          .eq("id", sourceId)
          .single();

        if (error) {
          console.error("Error fetching source:", error);
          toast({
            title: "Error",
            description: "Failed to load source data.",
            variant: "destructive",
          });
        } else if (data) {
          setSource(data);
        }
        setLoading(false);
      };
      fetchSource();
    }
  }, [sourceId, toast]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setSource((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSelectChange = (name: keyof ScrapingSource, value: string) => {
    setSource((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSliderChange = (value: number[]) => {
    setSource((prev) => ({
      ...prev,
      quality_score: value[0],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { id, ...sourceData } = source; // Exclude id for insert, include for update

    let dbCall;
    if (sourceId) {
      dbCall = supabase
        .from("scraping_sources")
        .update(sourceData)
        .eq("id", sourceId);
    } else {
      dbCall = supabase.from("scraping_sources").insert([sourceData]);
    }

    const { error } = await dbCall;

    if (error) {
      console.error("Error saving source:", error);
      toast({
        title: "Error",
        description: `Failed to save source: ${error.message}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Source saved successfully.",
      });
      router.push("/admin/sources");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name">Source Name</Label>
        <Input
          id="name"
          name="name"
          value={source.name}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="url">URL</Label>
        <Input
          id="url"
          name="url"
          type="url"
          value={source.url}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="selector">Content Selector (CSS/XPath)</Label>
        <Textarea
          id="selector"
          name="selector"
          value={source.selector || ""}
          onChange={handleChange}
          placeholder="e.g., .article-body, //div[@class='content']"
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          name="is_active"
          checked={source.is_active}
          onCheckedChange={(checked) =>
            setSource((prev) => ({ ...prev, is_active: checked }))
          }
        />
        <Label htmlFor="is_active">Is Active</Label>
      </div>
      <div>
        <Label htmlFor="quality_score">Quality Score: {source.quality_score}</Label>
        <Slider
          id="quality_score"
          name="quality_score"
          min={1}
          max={10}
          step={1}
          value={[source.quality_score]}
          onValueChange={handleSliderChange}
          className="w-[60%]"
        />
      </div>
      <div>
        <Label htmlFor="content_type">Content Type</Label>
        <Select
          name="content_type"
          value={source.content_type}
          onValueChange={(value: "news" | "tutorial" | "opinion" | "image") =>
            handleSelectChange("content_type", value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select content type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="news">News</SelectItem>
            <SelectItem value="tutorial">Tutorial</SelectItem>
            <SelectItem value="opinion">Opinion</SelectItem>
            <SelectItem value="image">Image</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="trust_level">Trust Level</Label>
        <Select
          name="trust_level"
          value={source.trust_level}
          onValueChange={(value: "verified" | "experimental" | "banned") =>
            handleSelectChange("trust_level", value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select trust level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="experimental">Experimental</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="last_success_rate">
          Last Success Rate: {source.last_success_rate}%
        </Label>
        <Input
          id="last_success_rate"
          name="last_success_rate"
          type="number"
          min="0"
          max="100"
          value={source.last_success_rate}
          onChange={handleChange}
          required
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save Source"}
      </Button>
    </form>
  );
}
