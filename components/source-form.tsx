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
import { ScrapingSource } from "@/types/scraping"; // Import from types/scraping

interface SourceFormProps {
  sourceId?: string;
  onSubmit: (data: ScrapingSource, id?: string) => Promise<void>;
  initialData?: ScrapingSource;
}


export default function SourceForm({ sourceId, onSubmit, initialData }: SourceFormProps) {
  const { toast } = useToast();
  const [source, setSource] = useState<ScrapingSource>(
    initialData || {
      name: "",
      url: "",
      selector: "",
      is_active: true,
      quality_score: 5,
      content_type: "news",
      trust_level: "experimental",
      last_success_rate: 100,
    }
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setSource(initialData);
    }
  }, [initialData]);

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

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (sourceId) {
        // If sourceId exists, it's an update operation
        await onSubmit(source, sourceId);
      } else {
        // If no sourceId, it's a creation operation
        await onSubmit(source);
      }
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: `Failed to save source: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmitForm} className="space-y-6">
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
