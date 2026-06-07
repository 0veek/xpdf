import { ConvertWorkspace } from "@/components/workspaces/convert-workspace";

type PageProps = { params: Promise<{ id: string }> };

export default async function ConvertDocPage({ params }: PageProps) {
  const { id } = await params;
  return <ConvertWorkspace documentId={id} />;
}
