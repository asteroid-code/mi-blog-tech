"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { ScrapingSource } from "@/types/scraping";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Define Zod schema for validation
const scrapingSourceSchema = z.object({
  name: z.string().min(1, "Source Name is required"),
  url: z.string().url("Invalid URL format").min(1, "URL is required"),
  selector: z.string().optional(),
  is_active: z.boolean(),
  quality_score: z.number().min(1).max(10),
  content_type: z.enum(["news", "tutorial", "opinion", "image"]),
  trust_level: z.enum(["verified", "experimental", "banned"]),
  last_success_rate: z.number().min(0).max(100),
});

interface SourceFormProps {
  sourceId?: string;
  onSubmit: (data: ScrapingSource, id?: string) => Promise<void>;
  initialData?: ScrapingSource;
}

export default function SourceForm({ sourceId, onSubmit, initialData }: SourceFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<ScrapingSource>({
    resolver: zodResolver(scrapingSourceSchema),
    defaultValues: initialData || {
      name: "",
      url: "",
      selector: "",
      is_active: true,
      quality_score: 5,
      content_type: "news",
      trust_level: "experimental",
      last_success_rate: 100,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  const handleSubmitForm = async (data: ScrapingSource) => {
    setLoading(true);
    try {
      await onSubmit(data, sourceId);
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
    <form onSubmit={form.handleSubmit(handleSubmitForm)} className="space-y-6">
      <div>
        <Label htmlFor="name">Source Name</Label>
        <Controller
          name="name"
          control={form.control}
          render={({ field }) => (
            <Input
              id="name"
              {...field}
              required
            />
          )}
        />
        {form.formState.errors.name && (
          <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="url">URL</Label>
        <Controller
          name="url"
          control={form.control}
          render={({ field }) => (
            <Input
              id="url"
              type="url"
              {...field}
              required
            />
          )}
        />
        {form.formState.errors.url && (
          <p className="text-red-500 text-sm mt-1">{form.formState.errors.url.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="selector">Content Selector (CSS/XPath)</Label>
        <Controller
          name="selector"
          control={form.control}
          render={({ field }) => (
            <Textarea
              id="selector"
              {...field}
              value={field.value || ""}
              placeholder="e.g., .article-body, //div[@class='content']"
            />
          )}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Controller
          name="is_active"
          control={form.control}
          render={({ field }) => (
            <Switch
              id="is_active"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Label htmlFor="is_active">Is Active</Label>
      </div>
      <div>
        <Label htmlFor="quality_score">Quality Score: {form.watch("quality_score")}</Label>
        <Controller
          name="quality_score"
          control={form.control}
          render={({ field }) => (
            <Slider
              id="quality_score"
              min={1}
              max={10}
              step={1}
              value={[field.value]}
              onValueChange={(value) => field.onChange(value[0])}
              className="w-[60%]"
            />
          )}
        />
        {form.formState.errors.quality_score && (
          <p className="text-red-500 text-sm mt-1">{form.formState.errors.quality_score.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="content_type">Content Type</Label>
        <Controller
          name="content_type"
          control={form.control}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
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
          )}
        />
        {form.formState.errors.content_type && (
          <p className="text-red-500 text-sm mt-1">{form.formState.errors.content_type.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="trust_level">Trust Level</Label>
        <Controller
          name="trust_level"
          control={form.control}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
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
          )}
        />
        {form.formState.errors.trust_level && (
          <p className="text-red-500 text-sm mt-1">{form.formState.errors.trust_level.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="last_success_rate">
          Last Success Rate: {form.watch("last_success_rate")}%
        </Label>
        <Controller
          name="last_success_rate"
          control={form.control}
          render={({ field }) => (
            <Input
              id="last_success_rate"
              type="number"
              min="0"
              max="100"
              {...field}
              onChange={(e) => field.onChange(Number(e.target.value))}
              required
            />
          )}
        />
        {form.formState.errors.last_success_rate && (
          <p className="text-red-500 text-sm mt-1">{form.formState.errors.last_success_rate.message}</p>
        )}
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save Source"}
      </Button>
    </form>
  );
}
