import { ProtectWorkspace } from "@/components/workspaces/protect-workspace";

type PageProps = { params: Promise<{ id: string }> };

export default async function ProtectDocPage({ params }: PageProps) {
  const { id } = await params;
  return <ProtectWorkspace documentId={id} />;
}
