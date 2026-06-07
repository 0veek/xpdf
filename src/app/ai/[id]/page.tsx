import { AiWorkspace } from "@/components/workspaces/ai-workspace";

type PageProps = { params: Promise<{ id: string }> };

export default async function AiDocPage({ params }: PageProps) {
  const { id } = await params;
  return <AiWorkspace documentId={id} />;
}
