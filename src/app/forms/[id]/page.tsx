import { FormsWorkspace } from "@/components/workspaces/forms-workspace";

type PageProps = { params: Promise<{ id: string }> };

export default async function FormsDocPage({ params }: PageProps) {
  const { id } = await params;
  return <FormsWorkspace documentId={id} />;
}
