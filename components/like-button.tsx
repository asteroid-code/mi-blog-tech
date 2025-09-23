"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client"; // Client-side Supabase client
import { Button } from "@/components/ui/button";
import { ThumbsUp } from "lucide-react"; // Assuming lucide-react is used for icons

interface LikeButtonProps {
  articleId: string | undefined;
  initialLikes: number;
}

export function LikeButton({ articleId, initialLikes }: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [userHasLiked, setUserHasLiked] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchUserAndLikeStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user && articleId) { // Ensure articleId is not undefined
        const { data, error } = await supabase
          .from("likes")
          .select("id")
          .eq("article_id", articleId)
          .eq("user_id", user.id)
          .single();

        if (!error && data) {
          setUserHasLiked(true);
        }
      }
      setLoading(false);
    };

    fetchUserAndLikeStatus();
  }, [articleId, supabase]);

  useEffect(() => {
    if (!articleId) return; // Do not subscribe if articleId is undefined

    // Realtime subscription for likes count
    const channel = supabase
      .channel(`article_likes:${articleId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "likes", filter: `article_id=eq.${articleId}` },
        (payload) => {
          // Re-fetch total likes or increment/decrement based on event type
          supabase
            .from("likes")
            .select("count", { count: "exact", head: true })
            .eq("article_id", articleId)
            .then(({ count, error }) => {
              if (!error && count !== null) {
                setLikes(count);
              } else if (error) {
                console.error("Error fetching real-time like count:", error);
              }
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [articleId, supabase]);

  const handleLikeToggle = async () => {
    if (!user) {
      alert("Por favor, inicia sesión para dar 'me gusta'.");
      return;
    }

    if (!articleId) {
      alert("No se puede dar 'me gusta' a un artículo sin ID.");
      return;
    }

    setLoading(true); // Disable button during action

    if (userHasLiked) {
      // Unlike
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("article_id", articleId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error unliking article:", error);
      } else {
        setUserHasLiked(false);
        // Likes count will be updated by realtime subscription
      }
    } else {
      // Like
      const { error } = await supabase
        .from("likes")
        .insert({ article_id: articleId, user_id: user.id });

      if (error) {
        console.error("Error liking article:", error);
      } else {
        setUserHasLiked(true);
        // Likes count will be updated by realtime subscription
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center space-x-2 mt-4">
      <Button
        variant={userHasLiked ? "default" : "outline"}
        size="sm"
        onClick={handleLikeToggle}
        disabled={loading || !user}
        className="flex items-center gap-1"
      >
        <ThumbsUp className="h-4 w-4" />
        {userHasLiked ? "Me Gusta" : "Me Gusta"}
      </Button>
      <span className="text-sm text-muted-foreground">{likes} Likes</span>
    </div>
  );
}
