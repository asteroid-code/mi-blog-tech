import SourceForm from "@/components/source-form";

interface EditSourcePageProps {
  params: {
    id: string;
  };
}

export default function EditSourcePage({ params }: EditSourcePageProps) {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Edit Scraping Source</h1>
      <SourceForm sourceId={params.id} />
    </div>
  );
}
