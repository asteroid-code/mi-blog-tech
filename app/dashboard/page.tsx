import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import dynamic from 'next/dynamic';

// Dynamically import client components that contain SVGs or client-side logic
const DynamicPlanCard = dynamic(() => import('@/components/dashboard/DashboardPlanCard'), { ssr: false });
const DynamicContentStatsCard = dynamic(() => import('@/components/dashboard/DashboardContentStatsCard'), { ssr: false });

export default async function UserDashboardPage() {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-semibold mb-4">Acceso Denegado</h1>
        <p className="text-muted-foreground mb-6">Por favor, inicia sesión para ver tu dashboard.</p>
        <Button asChild>
          <Link href="/login">Iniciar Sesión</Link>
        </Button>
      </div>
    );
  }

  // Fetch user profile and subscription data
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('current_plan, subscription_status')
    .eq('id', user.id)
    .single();

  // Fetch user's generated content
  const { data: generatedContent, error: contentError } = await supabase
    .from('generated_content')
    .select('id, title, summary, created_at, status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Calculate some basic statistics
  const totalContent = generatedContent?.length || 0;
  const publishedContent = generatedContent?.filter(c => c.status === 'published').length || 0;

  return (
    <div className="flex-1 p-4 md:p-6">
      <h1 className="text-2xl font-semibold mb-4">Dashboard de Usuario</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <DynamicPlanCard profile={profile} />
        <DynamicContentStatsCard totalContent={totalContent} publishedContent={publishedContent} />
        {/* Add more statistic cards here if needed */}
      </div>

      <h2 className="text-xl font-semibold mb-3">Tu Contenido Generado</h2>
      {generatedContent && generatedContent.length > 0 ? (
        <div className="grid gap-4">
          {generatedContent.map((contentItem) => (
            <Card key={contentItem.id}>
              <CardHeader>
                <CardTitle>{contentItem.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Generado el {new Date(contentItem.created_at).toLocaleDateString()} - Estado: {contentItem.status}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{contentItem.summary}</p>
                <Button variant="link" className="p-0 mt-2">
                  <Link href={`/articles/${contentItem.id}`}>Ver Contenido</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">Aún no has generado ningún contenido.</p>
      )}
    </div>
  );
}
