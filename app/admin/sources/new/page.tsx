import SourceForm from "@/components/source-form";

export default function NewSourcePage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Add New Scraping Source</h1>
      <SourceForm />
    </div>
  );
}
