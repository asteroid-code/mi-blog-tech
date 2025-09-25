import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan Actual</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.current_plan || 'Free'}</div>
            <p className="text-xs text-muted-foreground">Estado: {profile?.subscription_status || 'Inactive'}</p>
            <Button variant="link" className="p-0 mt-2">
              <Link href="/settings/billing">Gestionar Plan</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contenido Generado</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" x2="8" y1="13" y2="13" />
              <line x1="16" x2="8" y1="17" y2="17" />
              <line x1="10" x2="8" y1="9" y2="9" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContent}</div>
            <p className="text-xs text-muted-foreground">{publishedContent} publicado(s)</p>
          </CardContent>
        </Card>

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
