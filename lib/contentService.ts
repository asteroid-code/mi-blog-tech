import { supabase } from './supabaseClient';

// Interface for a single post, ensuring type safety.
export interface Post {
  id: string; // Changed to required string
  slug: string; // Added slug for dynamic routing
  created_at?: string;
  title: string;
  summary: string;
  content: string; // Assuming a 'content' field for the full article body
  image_url: string; // Changed to required string
  post_type: 'article' | 'video' | 'tweet';
  category_id: string; // Foreign key to the 'categories' table
  categories?: { name: string; slug?: string } | { name: string; slug?: string }[] | null;
  duration?: string; // Added for video posts
  author?: string; // Added for video posts
  views?: number; // Added for video posts and trending topics
  description?: string; // Added for video posts
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export async function getPosts({
  query,
  categorySlug,
  page,
  limit,
}: {
  query?: string;
  categorySlug?: string;
  page?: number;
  limit?: number;
}) {
  try {
    let queryBuilder = supabase
      .from('generated_content')
      .select('*, categories(name, slug)', { count: 'exact' }) // Include categories for filtering
      .order('created_at', { ascending: false });

    if (query) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%,content.ilike.%${query}%`);
    }

    if (categorySlug) {
      queryBuilder = queryBuilder.eq('categories.slug', categorySlug);
    }

    if (page && limit) {
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      queryBuilder = queryBuilder.range(start, end);
    }

    const { data: posts, error, count } = await queryBuilder;

    if (error) throw error;

    return { posts: posts || [], count: count || 0 };
  } catch (error: any) {
    console.error('Error in getPosts:', error);
    return { posts: [], count: 0, error: error.message };
  }
}

/**
 * Fetches a single post by its ID.
 * @param id The ID of the post to fetch.
 * @returns A promise that resolves to a single post object.
 */
export async function getPostById(id: string) {
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

/**
 * Fetches posts by category slug
 * @param slug The category slug
 * @returns A promise that resolves to posts in that category
 */
export async function getPostsByCategory(slug: string) {
  const { data, error } = await supabase
    .from('generated_content')
    .select('id, slug, created_at, title, summary, image_url, post_type, categories(name, slug)')
    .eq('categories.slug', slug)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`Error fetching posts for category ${slug}:`, error);
    throw new Error('Could not fetch posts for this category.');
  }

  return data;
}

/**
 * Searches posts by title or content
 * @param query The search query
 * @returns A promise that resolves to matching posts
 */
export async function searchPosts(query: string) {
  const { data, error } = await supabase
    .from('generated_content')
    .select('id, slug, created_at, title, summary, image_url, post_type, categories(name, slug)')
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`Error searching posts for "${query}":`, error);
    throw new Error('Could not search posts.');
  }

  return data;
}

/**
 * Gets featured/popular posts
 * @returns A promise that resolves to featured posts
 */
export async function getFeaturedPosts() {
  const { data, error } = await supabase
    .from('generated_content')
    .select('id, slug, created_at, title, summary, image_url, post_type, categories(name, slug)')
    .order('created_at', { ascending: false })
    .limit(6);

  if (error) {
    console.error('Error fetching featured posts:', error);
    throw new Error('Could not fetch featured posts.');
  }

  return data;
}

/**
 * Fetches all categories.
 * @returns A promise that resolves to an array of category objects.
 */
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    throw new Error('Could not fetch categories.');
  }

  return data || [];
}
