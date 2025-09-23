import { createClient } from '@/lib/supabase/server';

// Interface for a single post, ensuring type safety.
export interface Post {
  id?: string;
  created_at?: string;
  title: string;
  summary: string;
  content: string; // Assuming a 'content' field for the full article body
  image_url?: string;
  post_type: 'article' | 'video' | 'tweet';
  category_id: string; // Foreign key to the 'categories' table
}

/**
 * Fetches a list of posts from the 'generated_content' table.
 * @returns A promise that resolves to an array of posts.
 */
export async function getPosts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('generated_content')
    .select('id, created_at, title, summary, image_url, post_type, categories(name, slug)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching posts:', error);
    throw new Error('Could not fetch posts.');
  }

  return data;
}

/**
 * Fetches a single post by its ID.
 * @param id The ID of the post to fetch.
 * @returns A promise that resolves to a single post object.
 */
export async function getPostById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('generated_content')
    .select('*, categories(name, slug)')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching post with id ${id}:`, error);
    throw new Error('Could not fetch the specified post.');
  }

  return data;
}

/**
 * Creates a new post in the 'generated_content' table.
 * @param post The post object to create.
 * @returns A promise that resolves to the newly created post data.
 */
export async function createPost(post: Omit<Post, 'id' | 'created_at'>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('generated_content')
    .insert([post])
    .select()
    .single();

  if (error) {
    console.error('Error creating post:', error);
    throw new Error('Could not create a new post.');
  }

  return data;
}
