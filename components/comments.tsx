"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client"; // Client-side Supabase client
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

interface Comment {
  id: string;
  article_id: string;
  user_id: string; // Assuming user_id is a string (UUID)
  user_name: string; // Assuming we can fetch user name
  content: string;
  created_at: string;
}

interface CommentsProps {
  articleId: string | undefined;
}

export function Comments({ articleId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null); // Supabase user object

  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!articleId) {
      setLoading(false);
      return;
    }

    const fetchComments = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("comments")
        .select("*, profiles(user_name)") // Assuming 'profiles' table has 'user_name'
        .eq("article_id", articleId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching comments:", error);
      } else {
        // Map data to Comment interface, handling nested profile data
        const formattedComments: Comment[] = data.map((comment: any) => ({
          id: comment.id,
          article_id: comment.article_id,
          user_id: comment.user_id,
          user_name: comment.profiles?.user_name || "Anónimo", // Access user_name from profiles
          content: comment.content,
          created_at: comment.created_at,
        }));
        setComments(formattedComments);
      }
      setLoading(false);
    };

    fetchComments();

    if (!articleId) return; // Do not subscribe if articleId is undefined

    // Realtime subscription for new comments
    const channel = supabase
      .channel(`article_comments:${articleId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments", filter: `article_id=eq.${articleId}` },
        (payload) => {
          // Fetch the new comment with profile data
          const newCommentData = payload.new as any;
          supabase
            .from("profiles")
            .select("user_name")
            .eq("id", newCommentData.user_id)
            .single()
            .then(({ data: profileData, error: profileError }) => {
              if (!profileError && profileData) {
                const formattedNewComment: Comment = {
                  id: newCommentData.id,
                  article_id: newCommentData.article_id,
                  user_id: newCommentData.user_id,
                  user_name: profileData.user_name || "Anónimo",
                  content: newCommentData.content,
                  created_at: newCommentData.created_at,
                };
                setComments((prevComments) => [formattedNewComment, ...prevComments]);
              } else {
                console.error("Error fetching profile for new comment:", profileError);
                // Fallback if profile fetch fails
                setComments((prevComments) => [{
                  id: newCommentData.id,
                  article_id: newCommentData.article_id,
                  user_id: newCommentData.user_id,
                  user_name: "Anónimo",
                  content: newCommentData.content,
                  created_at: newCommentData.created_at,
                }, ...prevComments]);
              }
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [articleId, supabase]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) {
      alert("Por favor, escribe un comentario y asegúrate de estar logueado.");
      return;
    }

    if (!articleId) {
      alert("No se puede enviar un comentario sin ID de artículo.");
      return;
    }

    const { error } = await supabase.from("comments").insert({
      article_id: articleId,
      user_id: user.id,
      content: newComment.trim(),
    });

    if (error) {
      console.error("Error submitting comment:", error);
      alert("Error al enviar el comentario.");
    } else {
      setNewComment("");
      // Realtime subscription will handle updating the comments list
    }
  };

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Comentarios</h2>

      {user ? (
        <div className="mb-8 p-6 bg-card rounded-xl border border-border/50">
          <h3 className="text-lg font-semibold mb-4">Deja un comentario</h3>
          <Textarea
            placeholder="Escribe tu comentario aquí..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="mb-4 bg-input border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
            rows={4}
          />
          <Button onClick={handleSubmitComment} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
            Enviar Comentario
          </Button>
        </div>
      ) : (
        <div className="mb-8 p-6 bg-card rounded-xl border border-border/50 text-center">
          <p className="text-muted-foreground">Por favor, <Link href="/login" className="text-primary hover:underline">inicia sesión</Link> para dejar un comentario.</p>
        </div>
      )}


      {loading ? (
        <p>Cargando comentarios...</p>
      ) : (
        <div className="space-y-6">
          {comments.length === 0 ? (
            <p className="text-muted-foreground">No hay comentarios aún. ¡Sé el primero en comentar!</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="p-4 bg-card rounded-lg border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-foreground">{comment.user_name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleDateString()}</p>
                </div>
                <p className="text-muted-foreground">{comment.content}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
